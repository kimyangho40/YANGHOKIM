// 기업현황표 금액 셀 단위 확정 회귀 테스트.
// 실행: node scripts/test-amount-unit.mjs
//
// 왜 필요한가:
//   금액 파싱은 옛 "1억 → 1원" 사고(커밋 d3df072)를 낸 자리다. 손으로 옮겨 적은 코드를 돌리면
//   검증이 아니라 연기(演技)가 되므로, src/App.js 에서 **실제 함수 소스를 그대로 떼어내** 실행한다.
import fs from "node:fs";

const src = fs.readFileSync(new URL("../src/App.js", import.meta.url), "utf8");

// 함수/상수 소스를 이름으로 잘라 온다 — 본문을 복사하지 않기 위해서다.
function cut(startMarker, endMarker) {
  const a = src.indexOf(startMarker);
  if (a < 0) throw new Error("소스에서 못 찾음: " + startMarker);
  const b = src.indexOf(endMarker, a);
  if (b < 0) throw new Error("끝을 못 찾음: " + endMarker);
  return src.slice(a, b);
}
const parts = [
  cut("var AMOUNT_UNITS = [", "\r\n// 맨 앞 숫자만"),
  cut("function extractLeadingAmount(", "\r\n// ──"),
  cut("const CREDIT_UNITS = [", "\r\n// 소계/합계 행 판별"),
  cut("function wonToKorExact(", "\r\n// 담당기관 문자열"),
  cut("function headerUnitMult(", "\r\n// 셀에 숫자 말고"),
  cut("function parseLoanAmount(", "\r\nfunction loanAmountOf("),
  cut("function korNumGroup(", "\r\n// 기대출 금액 원문"),
];
const mod = await import(
  "data:text/javascript;charset=utf-8," +
  encodeURIComponent(parts.join("\n") + "\nexport { resolveAmountCell, extractLeadingAmount, headerUnitMult, parseLoanAmount };")
);
const { resolveAmountCell, extractLeadingAmount, headerUnitMult, parseLoanAmount } = mod;

let pass = 0, fail = 0;
const check = (label, cond, detail) => {
  if (cond) { pass++; console.log("  ✅ " + label); }
  else { fail++; console.log("  ❌ " + label + (detail !== undefined ? "  → 실제: " + detail : "")); }
};
const val = (raw, hdr) => { const r = resolveAmountCell(raw, hdr); return r.ok ? r.value : null; };

const 원 = "매출액 (원)";

console.log("■ 이번 요청 — 머리글에 (원)이 적힌 표");
check('"3284875000" + (원) → 3,284,875,000', val("3284875000", 원) === 3284875000, val("3284875000", 원));
check('"3,284,875,000" + (원) → 3,284,875,000', val("3,284,875,000", 원) === 3284875000, val("3,284,875,000", 원));
check('"790000000" + (원) → 790,000,000', val("790000000", 원) === 790000000, val("790000000", 원));
check("머리글 (백만원)이면 백만 단위", val("28,886", "매출액 (백만원)") === 28886000000, val("28,886", "매출액 (백만원)"));
check("머리글 (천원)이면 천 단위", val("52", "매출액 (천원)") === 52000, val("52", "매출액 (천원)"));
check("(원)은 적힌 숫자를 그대로 쓴 것이라 안내문을 남기지 않는다", !resolveAmountCell("3284875000", 원).note, resolveAmountCell("3284875000", 원).note);
check("값이 실제로 환산된 머리글은 안내문을 남긴다", /백만원/.test(resolveAmountCell("28,886", "매출액 (백만원)").note || ""), resolveAmountCell("28,886", "매출액 (백만원)").note);

console.log("■ 자릿수 안전장치 — 머리글 단위가 없어도 9자리↑면 원");
check('"3284875000" 단독 → 32억8,487만', val("3284875000", "") === 3284875000, val("3284875000", ""));
check('"790000000" 단독 → 7.9억', val("790000000", "") === 790000000, val("790000000", ""));
check('"100000000"(딱 1억, 9자리) → 확정', val("100000000", "") === 100000000, val("100000000", ""));
check('"99999999"(8자리) → 확인 필요', val("99999999", "") === null, val("99999999", ""));
check("확정한 건 안내문이 붙는다", /9자리 이상이라 원 단위로 해석/.test(resolveAmountCell("790000000", "").note || ""));
check("안내문 금액 표기", resolveAmountCell("3284875000", "").note.indexOf("32억 8,487만원") >= 0, resolveAmountCell("3284875000", "").note);

console.log("■ 애매한 값은 지금처럼 '확인 필요'로 남는다");
check('"6,652" + 머리글 없음 → 확인 필요', val("6,652", "") === null, val("6,652", ""));
check('"12,353" → 확인 필요', val("12,353", "") === null, val("12,353", ""));
check("사유 문구 유지", resolveAmountCell("6,652", "").reason === "단위 확인 필요", resolveAmountCell("6,652", "").reason);
check("빈 칸은 그대로", resolveAmountCell("", 원).ok === false);
check("숫자 없는 칸은 그대로", resolveAmountCell("미제출", 원).ok === false);

console.log("■ 셀에 적힌 단위가 언제나 이긴다 (머리글이 (원)이어도)");
check('"5억3천만원" → 530,000,000', val("5억3천만원", "") === 530000000, val("5억3천만원", ""));
check('"5억3천만원" + (원) 머리글에도 530,000,000', val("5억3천만원", 원) === 530000000, val("5억3천만원", 원));
check('"28,886백만원" + (원) 머리글 → 28,886,000,000', val("28,886백만원", 원) === 28886000000, val("28,886백만원", 원));
check('"6,652백만원 (2025결산) *…8,136백만원" → 앞 금액만', val("6,652백만원 (2025결산) *2026-07-25 총액은 8,136백만원", 원) === 6652000000, val("6,652백만원 (2025결산) *2026-07-25 총액은 8,136백만원", 원));
check('"7천만원" → 70,000,000', val("7천만원", 원) === 70000000, val("7천만원", 원));
check('"400,000,000원" → 400,000,000', val("400,000,000원", "") === 400000000, val("400,000,000원", ""));
check("셀 단위로 읽은 값엔 안내문이 없다", !resolveAmountCell("5억3천만원", 원).note);

console.log("■ 음수(당기순이익 적자)");
check('"△790000000" + (원) → -790,000,000', val("△790000000", 원) === -790000000, val("△790000000", 원));
check('"(790,000,000)" 회계표기 → -790,000,000', val("(790,000,000)", 원) === -790000000, val("(790,000,000)", 원));
check("음수 안내문에 △", /△7억 9,000만원/.test(resolveAmountCell("-790000000", "").note || ""), resolveAmountCell("-790000000", "").note);

console.log("■ 머리글 단위 판정 — 괄호 안만 본다");
check('"매출액 (원)" → 1', headerUnitMult("매출액 (원)") === 1, headerUnitMult("매출액 (원)"));
check('"당기순이익 (원)" → 1', headerUnitMult("당기순이익 (원)") === 1);
check('"매출액" (괄호 없음) → null', headerUnitMult("매출액") === null, headerUnitMult("매출액"));
check('"매출 (2025년)" → null (연도는 단위가 아니다)', headerUnitMult("매출 (2025년)") === null, headerUnitMult("매출 (2025년)"));
check("빈 머리글 → null", headerUnitMult("") === null);
check('"매출액 (억원)" → 1e8', headerUnitMult("매출액 (억원)") === 1e8);

console.log("■ 회귀 — 기대출 파서(parseLoanAmount)는 손대지 않았다");
check('"1억" → 100,000,000 (옛 1원 버그 없음)', parseLoanAmount("1억").won === 100000000, parseLoanAmount("1억").won);
check('"20백만원" → 20,000,000', parseLoanAmount("20백만원").won === 20000000, parseLoanAmount("20백만원").won);
check('"5억3천만원" → 530,000,000', parseLoanAmount("5억3천만원").won === 530000000, parseLoanAmount("5억3천만원").won);
check('"53000만" → 530,000,000 (만원 고정 입력칸 저장형식)', parseLoanAmount("53000만").won === 530000000, parseLoanAmount("53000만").won);
check('"12,353" → 확인 필요 유지', parseLoanAmount("12,353").won === null, parseLoanAmount("12,353").won);
check('"3284875000" → 3,284,875,000 (10만 이상 맨숫자는 원)', parseLoanAmount("3284875000").won === 3284875000, parseLoanAmount("3284875000").won);

console.log("■ 회귀 — extractLeadingAmount 자체는 그대로다(다른 호출부 영향 없음)");
check('맨숫자 "3284875000"은 여전히 확인 필요', extractLeadingAmount("3284875000", "").ok === false);
check('unitHint "원"은 그대로 원', extractLeadingAmount("3284875000", "원").value === 3284875000);

console.log("\n" + (fail === 0 ? "🟢" : "🔴") + " 통과 " + pass + " / 실패 " + fail);
process.exit(fail === 0 ? 0 : 1);
