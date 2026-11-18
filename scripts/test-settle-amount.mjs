// 정산관리 금액 입력 — 쉼표 자동·한글 금액 (2026-11-18)
// 실행: node scripts/test-settle-amount.mjs
//
// src/App.js 의 ⛳ 정산-금액 마커 구간을 소스째 떼어내 실행한다(옮겨 적지 않는다).
// ⚠️ 마커 문구를 바꾸면 이 테스트가 통째로 죽는다.

import fs from "node:fs";

let pass = 0, fail = 0;
const ok = (name, cond, detail = "") => {
  if (cond) { pass++; console.log(`  ✅ ${name}`); }
  else { fail++; console.log(`  ❌ ${name}${detail ? " — " + detail : ""}`); }
};
const src = fs.readFileSync("src/App.js", "utf8");
const mk = src.match(/\/\/ ⛳ 정산-금액 시작[\s\S]*?⛳ 정산-금액 끝/);
if (!mk) { console.error("❌ '⛳ 정산-금액 시작/끝' 마커를 App.js 에서 못 찾았다."); process.exit(1); }
// eslint-disable-next-line no-new-func
const { SETTLE_AMOUNT_FIELDS, parseSettleAmount, formatSettleAmount, displaySettleAmount, normalizeSettleAmounts } = new Function(
  mk[0] + "\n return { SETTLE_AMOUNT_FIELDS, parseSettleAmount, formatSettleAmount, displaySettleAmount, normalizeSettleAmounts };"
)();

console.log("■ ① 숫자만 입력 → 쉼표");
[["3800000", "3,800,000"], ["4180000", "4,180,000"], ["3,800,000", "3,800,000"], ["3,800,000원", "3,800,000"],
 [" 2500000 ", "2,500,000"], ["11,550,000원", "11,550,000"], ["0", "0"], ["500", "500"]].forEach(([i, e]) =>
  ok(`"${i}" → "${e}"`, formatSettleAmount(i) === e, String(formatSettleAmount(i))));

console.log("■ ② 한글 금액 → 숫자");
[["380만원", 3800000], ["380만", 3800000], ["300만", 3000000], ["5천만", 50000000], ["5천만원", 50000000], ["5000만", 50000000],
 ["6천만원", 60000000], ["1억", 100000000], ["2억원", 200000000], ["1.5억", 150000000], ["3억5천만", 350000000],
 ["3억 5천만원", 350000000], ["144백만원", 144000000], ["3백만", 3000000], ["1천2백만원", 12000000],
 ["38.5만", 385000], ["380만5천", 3805000], ["1억2천3백45만", 123450000]].forEach(([i, e]) =>
  ok(`"${i}" → ${e.toLocaleString("en-US")}`, parseSettleAmount(i) === e, String(parseSettleAmount(i))));
ok('요청 예시: "380만원" → "3,800,000"', formatSettleAmount("380만원") === "3,800,000");

console.log("■ ③ 뜻이 갈리는 표기·메모는 그대로 둔다");
["5천", "2천5백", "1억5천", "1억(5천 승인)", "5천(2700승인)", "2%", "미정", "50+30+19", "만", "억", "1억2억", "1.23456만원", "3,8oo,ooo"].forEach((i) => {
  ok(`"${i}" → 못 읽음(null)`, parseSettleAmount(i) === null, String(parseSettleAmount(i)));
  ok(`"${i}" → 저장값 그대로`, formatSettleAmount(i) === i);
});
ok("빈칸·null 은 그대로", formatSettleAmount("") === "" && formatSettleAmount(null) === null && parseSettleAmount(undefined) === null);

console.log("■ ④ 표 표시 — 옛 맨숫자에만 쉼표");
ok('"3800000" → "3,800,000"', displaySettleAmount("3800000") === "3,800,000");
ok('"2,500,000" 그대로', displaySettleAmount("2,500,000") === "2,500,000");
ok('"1억" 그대로(적힌 대로 보여 준다)', displaySettleAmount("1억") === "1억");
ok('"5천" 그대로', displaySettleAmount("5천") === "5천");

console.log("■ ⑤ 저장 보정 — 고친 칸만");
const orig = { request_amount: "1억", contract_fee: "3000000", commission_fee: "5천", received_amount: null, settlement_notes: "380만 입금" };
const out = normalizeSettleAmounts({ request_amount: "1억", contract_fee: "3000000", commission_fee: "380만원", received_amount: "4180000", settlement_notes: "380만 입금" }, orig);
ok("손대지 않은 신청금액 「1억」 그대로", out.request_amount === "1억");
ok("손대지 않은 계약금 「3000000」 그대로(DB 값 안 바꿈)", out.contract_fee === "3000000");
ok("고친 수수료 「380만원」 → 「3,800,000」", out.commission_fee === "3,800,000");
ok("새로 넣은 입금금액 「4180000」 → 「4,180,000」", out.received_amount === "4,180,000");
ok("비고(금액 칸 아님)는 안 건드린다", out.settlement_notes === "380만 입금");
const neu = normalizeSettleAmounts({ request_amount: "1억", contract_fee: "", commission_fee: null, business_name: "380만상사" }, null);
ok("신규 등록은 전부 맞춘다", neu.request_amount === "100,000,000" && neu.contract_fee === "" && neu.commission_fee === null && neu.business_name === "380만상사");
ok("금액 칸 목록 5개", SETTLE_AMOUNT_FIELDS.length === 5);

console.log("■ ⑥ 소스 정적 검사");
const view = src.slice(src.indexOf("// ── 정산관리 ──"));
ok("편집 줄 금액 5칸에 onBlur 보정", ["request_amount", "contract_fee", "approval_amount", "commission_fee", "received_amount"].every((f) =>
  view.includes(`onBlur={function(e) { var v = formatSettleAmount(e.target.value); setEditData(function(p) { return Object.assign({}, p, { ${f}: v }); }); }}`)));
ok("저장 3곳이 normalizeSettleAmounts 를 탄다", (view.match(/normalizeSettleAmounts\(/g) || []).length === 5);
ok("합계 parseAmt 가 한글 금액을 읽는다", /var n = parseSettleAmount\(v\);/.test(view));
ok("자동 반영(syncSettlementFromCompany)은 안 건드렸다", !/function syncSettlementFromCompany[\s\S]{0,6000}formatSettleAmount/.test(src));

console.log(`\n결과: ${pass}/${pass + fail} 통과`);
process.exit(fail ? 1 : 0);
