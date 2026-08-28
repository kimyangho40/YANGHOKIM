// 채권자변동정보 조회서(한국신용정보원) 파싱 회귀 테스트.
// 실행: node scripts/test-debtor-change.mjs
//
// 왜 필요한가:
//   금액 단위 환산은 옛 "1억 → 1원" 사고(커밋 d3df072)를 낸 자리다. 이 문서는 (단위: 천원)이라
//   ×1,000 을 틀리면 부채가 1,000배로 어긋난다. 손으로 옮겨 적은 코드를 돌리면 검증이 아니라
//   연기(演技)가 되므로, src/App.js 에서 **실제 함수 소스를 그대로 떼어내** 실행한다.
//   (scripts/test-amount-unit.mjs 와 같은 방식)
import fs from "node:fs";

const src = fs.readFileSync(new URL("../src/App.js", import.meta.url), "utf8");

function cut(startMarker, endMarker) {
  const a = src.indexOf(startMarker);
  if (a < 0) throw new Error("소스에서 못 찾음: " + startMarker);
  const b = src.indexOf(endMarker, a);
  if (b < 0) throw new Error("끝을 못 찾음: " + endMarker);
  return src.slice(a, b);
}
const parts = [
  cut("function korNumGroup(", "\r\n// 기대출 금액 원문"),
  cut("function parseLoanAmount(", "\r\nfunction loanAmountOf("),
  cut("function isLoanRejected(ln)", "\r\n// 기대출 총액"),
  cut("const CREDIT_UNITS = [", "\r\n// 소계/합계 행 판별"),
  cut("function wonToKorExact(", "\r\n// 담당기관 문자열"),
  // 이번에 새로 만든 덩어리 전체 — 변환기·연체 요약·중복 판정이 한 블록에 있다
  cut("var DEBTOR_SUBTOTAL_RE = ", "\r\n// ── 여신정보 기준일자"),
];
const mod = await import(
  "data:text/javascript;charset=utf-8," +
  encodeURIComponent(parts.join("\n") +
    "\nexport { parseLoanAmount, wonToKorExact, parseCreditUnit, isDebtorSubtotalRow, debtorKindFromRaw," +
    " debtorChangeToLoans, debtorChangeOverdue, debtorOverdueSummary, mergeOverdue," +
    " loanDupKey, loanDupKeySet, countLoansBySrc, OVERDUE_INFO_LABEL };")
);
const {
  parseLoanAmount, wonToKorExact, isDebtorSubtotalRow, debtorKindFromRaw,
  debtorChangeToLoans, debtorChangeOverdue, debtorOverdueSummary, mergeOverdue,
  loanDupKey, loanDupKeySet, countLoansBySrc, OVERDUE_INFO_LABEL,
} = mod;

let pass = 0, fail = 0;
const check = (label, cond, detail) => {
  if (cond) { pass++; console.log("  ✅ " + label); }
  else { fail++; console.log("  ❌ " + label + (detail !== undefined ? "  → 실제: " + JSON.stringify(detail) : "")); }
};
const eq = (label, actual, expect) => check(label + " = " + JSON.stringify(expect), actual === expect, actual);

// 실제 조회서 모양의 최소 입력 — 단위는 표 우상단 "(단위: 천원)"
const doc = (over = {}) => Object.assign({
  doc_type: "debtor_change",
  unit_raw: "(단위: 천원)",
  as_of: "2026-08-28",
  debt_rows: [],
  overdue_rows: [],
  subtotal_raw: "",
}, over);
const row = (over = {}) => Object.assign({
  seq: "1", kind_raw: "개인사업자대출", loan_type: "일반자금대출",
  institution: "농협은행", start_date: "2024-03-11", amount_raw: "419,138", is_subtotal: false,
}, over);

console.log("\n[1] 천원 단위 환산 — 사용자 지정 회귀 케이스");
{
  const r = debtorChangeToLoans(doc({ debt_rows: [row(), row({ seq: "2", amount_raw: "25,000", institution: "국민은행" })] }));
  eq("419,138천원 → 저장값", r.loans[0].amount, "419138000");
  eq("419,138천원 → 원", parseLoanAmount(r.loans[0].amount).won, 419138000);
  eq("419,138천원 → 표시", wonToKorExact(419138000), "4억 1,913만 8천");
  eq("25,000천원 → 저장값", r.loans[1].amount, "25000000");
  eq("25,000천원 → 원", parseLoanAmount(r.loans[1].amount).won, 25000000);
  eq("25,000천원 → 표시", wonToKorExact(25000000), "2,500만");
  eq("단위 라벨", r.unitLabel, "천원");
  check("확인 필요 0건", r.loans.every(l => !l.needs_review), r.loans.map(l => l.review_reason));
  eq("확정 합계(원)", r.countedWon, 444138000);
}

console.log("\n[2] 입력칸 만원 단위 왕복 (기대출 저장 규칙)");
{
  // 화면 입력칸은 loanAmountToManInput 이 원 → 만원으로 보여준다. 그 값이 정확한지 확인한다.
  eq("419,138천원 → 입력칸(만원)", parseLoanAmount("419138000").won / 10000, 41913.8);
  eq("25,000천원 → 입력칸(만원)", parseLoanAmount("25000000").won / 10000, 2500);
}

console.log("\n[3] 단위 표기가 없으면 환산하지 않는다 (추측 금지)");
{
  const r = debtorChangeToLoans(doc({ unit_raw: "", debt_rows: [row()] }));
  eq("환산 안 함 — 원문 유지", r.loans[0].amount, "419138");
  check("확인 필요 표시", r.loans[0].needs_review === true, r.loans[0]);
  eq("사유", r.loans[0].review_reason, "단위 확인 필요 (문서에 단위 표기 없음)");
  eq("합계에 안 넣음", r.countedWon, 0);
}

console.log("\n[4] 왕복 검증 실패(10만원 미만)는 비운다");
{
  const r = debtorChangeToLoans(doc({ debt_rows: [row({ amount_raw: "50" })] }));   // 50천원 = 5만원
  eq("금액 비움", r.loans[0].amount, "");
  eq("사유", r.loans[0].review_reason, "금액 확인 필요 (50 천원)");
  eq("합계 제외", r.countedWon, 0);
}
{
  const r = debtorChangeToLoans(doc({ debt_rows: [row({ amount_raw: "" })] }));
  eq("금액 못 읽음 — 비움", r.loans[0].amount, "");
  eq("사유", r.loans[0].review_reason, "금액을 읽지 못함");
}

console.log("\n[5] 소계·합계 행 제외 (모델의 is_subtotal 을 그대로 믿지 않는다)");
{
  check("is_subtotal=true", isDebtorSubtotalRow(row({ is_subtotal: true })));
  check("기관명이 '합계'", isDebtorSubtotalRow(row({ institution: "합계", is_subtotal: false })));
  check("기관명이 '계'", isDebtorSubtotalRow(row({ institution: "계", is_subtotal: false })));
  check("순번·기관 없고 금액만", isDebtorSubtotalRow(row({ seq: "", institution: "", is_subtotal: false })));
  check("평범한 행은 통과", !isDebtorSubtotalRow(row()));
  const r = debtorChangeToLoans(doc({ debt_rows: [row(), row({ seq: "", institution: "합계", amount_raw: "444138" })] }));
  eq("남은 행", r.loans.length, 1);
  eq("걸러낸 행", r.dropped, 1);
}

console.log("\n[6] 구분 — 문서에 적힌 값만 옮긴다");
{
  eq("개인사업자대출", debtorKindFromRaw("개인사업자대출"), "biz");
  eq("개인 사업자 대출(공백)", debtorKindFromRaw("개인 사업자 대출"), "biz");
  eq("개인대출정보", debtorKindFromRaw("개인대출정보"), "personal");
  eq("빈 값", debtorKindFromRaw(""), "");
  eq("모르는 어휘는 미분류", debtorKindFromRaw("기타채무"), "");
  const r = debtorChangeToLoans(doc({ debt_rows: [
    row(), row({ seq: "2", kind_raw: "개인대출정보" }), row({ seq: "3", kind_raw: "" }),
  ] }));
  eq("1행 구분", r.loans[0].kind, "biz");
  eq("2행 구분", r.loans[1].kind, "personal");
  eq("3행 구분(미분류)", r.loans[2].kind, "");
  eq("자동 지정 건수", r.autoKind, 2);
  eq("근거 표시", r.loans[0].kind_src, "문서표기");
  eq("원문 보존", r.loans[1].kind_raw, "개인대출정보");
}

console.log("\n[7] 날짜·출처 필드");
{
  const r = debtorChangeToLoans(doc({ debt_rows: [row()] }));
  eq("실행일 = 발생일자", r.loans[0].start, "2024-03-11");
  eq("만기일은 비움(문서에 없음)", r.loans[0].end, "");
  eq("기관명", r.loans[0].bank, "농협은행");
  eq("표시명", r.loans[0].inst, "농협은행 일반자금대출");
  eq("출처", r.loans[0].src, "debtor_change");
  eq("기준일", r.loans[0].as_of, "2026-08-28");
}

console.log("\n[8] 검산 — 합계 행과 대조");
{
  const ok = debtorChangeToLoans(doc({ subtotal_raw: "444,138", debt_rows: [row(), row({ seq: "2", amount_raw: "25,000" })] }));
  check("합계 일치", ok.checksum && ok.checksum.ok === true, ok.checksum);
  const ng = debtorChangeToLoans(doc({ subtotal_raw: "999,999", debt_rows: [row()] }));
  check("합계 불일치 감지", ng.checksum && ng.checksum.ok === false, ng.checksum);
}

console.log("\n[9] 연체채권 변동 현황 — 기대출에 넣지 않고 요약만");
{
  const d = doc({ overdue_rows: [
    { institution: "농협은행", debt_category: "대출채권", event_date: "2024-03-11", principal_raw: "12,000", interest_raw: "300", release_reason: "변제완료", release_date: "2024-05-02" },
    { institution: "국민은행", debt_category: "대출채권", event_date: "2025-01-20", principal_raw: "5,000", interest_raw: "", release_reason: "", release_date: "" },
  ] });
  const ov = debtorChangeOverdue(d);
  eq("건수", ov.count, 2);
  eq("미해제", ov.open, 1);
  eq("해제", ov.released, 1);
  check("해제 판정(해제일자 있음)", ov.rows[0].released === true);
  check("미해제 판정", ov.rows[1].released === false);
  // ⚠️ 연체 행이 기대출로 새어 들어가면 부채가 두 배가 된다 — 이게 이 테스트의 핵심이다
  eq("기대출 행에 안 섞임", debtorChangeToLoans(d).loans.length, 0);
  eq("company_info 라벨", OVERDUE_INFO_LABEL, "연체 이력");
  eq("요약 한 줄", debtorOverdueSummary(ov, "2026-08-28"),
    "2건(미해제 1) · 농협은행 2024-03-11(해제 2024-05-02) · 국민은행 2025-01-20(미해제) · 기준 2026-08-28");
  eq("0건 요약", debtorOverdueSummary(debtorChangeOverdue(doc()), "2026-08-28"), "없음 · 기준 2026-08-28");
  eq("빈 행은 버림", debtorChangeOverdue(doc({ overdue_rows: [{ institution: "", event_date: "", release_date: "", release_reason: "" }] })).count, 0);
}

console.log("\n[10] 여러 장 첨부 — 연체 요약 합치기");
{
  const a = debtorChangeOverdue(doc({ overdue_rows: [{ institution: "농협은행", event_date: "2024-03-11", release_date: "2024-05-02", release_reason: "변제완료" }] }));
  const b = debtorChangeOverdue(doc({ overdue_rows: [{ institution: "국민은행", event_date: "2025-01-20", release_date: "", release_reason: "" }] }));
  const m = mergeOverdue(a, b);
  eq("합친 건수", m.count, 2);
  eq("합친 미해제", m.open, 1);
  check("한쪽만 있으면 그대로", mergeOverdue(null, b) === b && mergeOverdue(a, null) === a);
}

console.log("\n[11] 중복 판정 — 같은 조회서를 다시 첨부해도 쌓이지 않게");
{
  const existing = [
    { inst: "농협은행 일반자금대출", bank: "농협은행", start: "2024-03-11", amount: "419138000", src: "debtor_change" },
    { inst: "손으로 적은 대출", bank: "", start: "", amount: "5000만", src: undefined },
    { inst: "부결건", bank: "기업은행", start: "2024-01-01", amount: "", status: "rejected", src: "debtor_change" },
  ];
  const set = loanDupKeySet(existing);
  const fresh = debtorChangeToLoans(doc({ debt_rows: [row(), row({ seq: "2", amount_raw: "25,000", institution: "국민은행", start_date: "2025-01-20" })] }));
  check("1행은 이미 있음", set[loanDupKey(fresh.loans[0])] === true);
  check("2행은 새 건", !set[loanDupKey(fresh.loans[1])]);
  // 금액이 달라지면 다른 건으로 본다(상환 등으로 잔액이 바뀐 경우)
  const changed = debtorChangeToLoans(doc({ debt_rows: [row({ amount_raw: "300,000" })] }));
  check("금액이 다르면 새 건", !set[loanDupKey(changed.loans[0])]);
  check("부결건은 열쇠에서 제외", !set["기업은행|2024-01-01|?"]);
  eq("같은 출처 행 수", countLoansBySrc(existing, "debtor_change"), 2);
  eq("없는 출처", countLoansBySrc(existing, "bank_certificate"), 0);
  eq("배열 아님", countLoansBySrc(null, "debtor_change"), 0);
}

console.log("\n[12] wonToKorExact — 천 단위 표시 추가 회귀");
{
  eq("419,138,000", wonToKorExact(419138000), "4억 1,913만 8천");
  eq("25,000,000", wonToKorExact(25000000), "2,500만");
  eq("1억 딱", wonToKorExact(100000000), "1억");
  eq("1억 5천만", wonToKorExact(150000000), "1억 5,000만");
  eq("만 미만만", wonToKorExact(8000), "8,000원");        // 옛 동작 유지
  eq("0", wonToKorExact(0), "0원");
  eq("1억 8천(만 자리 0)", wonToKorExact(100008000), "1억 8천");
  eq("천 미만은 버림", wonToKorExact(100000500), "1억");   // 천 단위까지만 표시
}

console.log("\n[13] 방어 — 빈 입력");
{
  const r = debtorChangeToLoans(null);
  eq("null 입력", r.loans.length, 0);
  eq("debt_rows 없음", debtorChangeToLoans({}).loans.length, 0);
  eq("overdue_rows 없음", debtorChangeOverdue({}).count, 0);
}

console.log("\n──────────────────────────────");
console.log(`  ${pass}/${pass + fail} 통과` + (fail ? `  ❌ ${fail}건 실패` : "  ✅ 전부 통과"));
process.exit(fail ? 1 : 0);
