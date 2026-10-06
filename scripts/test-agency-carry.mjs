// 기관별현황 행별 「↪ 이월」 (2026-10-06)
// 실행: node scripts/test-agency-carry.mjs
//
// 판정·payload 규칙을 여기에 옮겨 적으면 사본 검증이 된다 → src/App.js 의 ⛳ 기관현황-이월 마커 구간을
// 소스째 떼어내 실행한다. 다중 복사(COPY_FIELDS·복사 분기)가 안 바뀌었는지는 git HEAD 원본과 대조한다.
//
// ⚠️ App.js 의 마커 문구(⛳ 기관현황-이월 시작/끝)를 바꾸면 이 테스트가 통째로 죽는다.

import fs from "node:fs";
import { execFileSync } from "node:child_process";

let pass = 0, fail = 0;
const ok = (name, cond, detail = "") => {
  if (cond) { pass++; console.log(`  ✅ ${name}`); }
  else { fail++; console.log(`  ❌ ${name}${detail ? " — " + detail : ""}`); }
};

// 작업본은 CRLF(autocrlf), HEAD 는 LF → 둘 다 LF 로 맞춰 대조한다
const toLF = (s) => s.split(String.fromCharCode(13, 10)).join(String.fromCharCode(10));
const src = toLF(fs.readFileSync("src/App.js", "utf8"));

// ── ① 마커 구간 실행
const mk = src.match(/\/\/ ⛳ 기관현황-이월 시작[\s\S]*?⛳ 기관현황-이월 끝/);
if (!mk) { console.error("❌ '⛳ 기관현황-이월 시작/끝' 마커를 App.js 에서 못 찾았다."); process.exit(1); }
// eslint-disable-next-line no-new-func
const { CARRY_FIELDS, carryOriginOf, buildCarryInsert, nextCarryMonth, caseOriginBadge } = new Function(
  mk[0] + "\n return { CARRY_FIELDS, carryOriginOf, buildCarryInsert, nextCarryMonth, caseOriginBadge };"
)();

// 다중 복사 COPY_FIELDS 를 소스에서 떼어낸다(이월 허용목록과 비교용)
const pickCopyFields = (text) => {
  const m = text.match(/var COPY_FIELDS = (\[[\s\S]*?\]);/);
  // eslint-disable-next-line no-new-func
  return m ? new Function("return (" + m[1] + ");")() : null;
};
const COPY_FIELDS = pickCopyFields(src);

// 이월에 절대 들어가면 안 되는 것(사용자 결정 2026-10-06)
const FORBIDDEN = [
  "notes", "extra_notes", "priority_checks",
  "login_id", "login_pw", "personal_cert", "business_cert",
  "ipin_account", "ipin_password", "agency_login_id", "agency_login_password",
  "personal_cert_password", "business_cert_password", "resident_number",
  // 결과·정산·계약
  "result", "result_reason", "contract_fee", "contract_date", "commission_fee", "fee_received",
  "received_amount", "settlement_notes", "reject_checklist", "delivered_docs",
  "script_delivered", "phone_education_done", "sort_order", "notion_page_id", "apply_date",
];

// 모든 필드를 채운 가짜 원본 행
const full = { id: "src-6", agency_group: "소상공인시장진흥공단", year: 2026, month: 6, company_id: "co-1",
  status: "부결", deleted_at: null };
[...(COPY_FIELDS || []), ...FORBIDDEN].forEach((f) => { if (!(f in full)) full[f] = "값-" + f; });
full.request_amount = 50000000; full.employee_count = 3; full.credit_score = 812;

console.log("■ 허용 목록");
ok("CARRY_FIELDS 에 금지 필드 0", CARRY_FIELDS.every((f) => !FORBIDDEN.includes(f)),
  CARRY_FIELDS.filter((f) => FORBIDDEN.includes(f)).join(","));
ok("CARRY_FIELDS 는 전부 COPY_FIELDS 안의 실재 컬럼", !!COPY_FIELDS && CARRY_FIELDS.every((f) => COPY_FIELDS.includes(f)),
  CARRY_FIELDS.filter((f) => !(COPY_FIELDS || []).includes(f)).join(","));
ok("CARRY_FIELDS 중복 없음", new Set(CARRY_FIELDS).size === CARRY_FIELDS.length);
["business_name", "representative", "business_number", "assignee", "region", "industry", "request_amount", "fund_product"]
  .forEach((f) => ok(`기본정보 '${f}' 포함`, CARRY_FIELDS.includes(f)));

console.log("\n■ payload (6월 원본 → 12월)");
const ins = buildCarryInsert(full, { year: 2026, month: 12 }, "시작 전");
ok("금지 필드가 payload 에 하나도 없다", FORBIDDEN.every((f) => !(f in ins)),
  FORBIDDEN.filter((f) => f in ins).join(","));
const allowedKeys = new Set([...CARRY_FIELDS, "agency_group", "year", "month", "company_id", "reapply_from_id",
  "carried_from_year", "carried_from_month", "status"]);
ok("payload 키는 허용 목록 + 고정 키뿐", Object.keys(ins).every((k) => allowedKeys.has(k)),
  Object.keys(ins).filter((k) => !allowedKeys.has(k)).join(","));
ok("id 를 싣지 않는다(새 id 는 DB 가 만든다)", !("id" in ins));
ok("deleted_at 을 싣지 않는다", !("deleted_at" in ins));
ok("기관 = 원본 기관", ins.agency_group === full.agency_group);
ok("연·월 = 목적지", ins.year === 2026 && ins.month === 12);
ok("상태 = 호출부가 준 초기값(원본 '부결' 아님)", ins.status === "시작 전");
ok("company_id 유지", ins.company_id === "co-1");
ok("reapply_from_id = 직전 건 id", ins.reapply_from_id === "src-6");
ok("carried_from = 2026년 6월", ins.carried_from_year === 2026 && ins.carried_from_month === 6);
ok("기본정보 값이 그대로 복사", CARRY_FIELDS.every((f) => ins[f] === full[f]));
const noCo = buildCarryInsert(Object.assign({}, full, { company_id: null, region: "" }), { year: 2026, month: 7 }, "시작 전");
ok("미연결이면 company_id null", noCo.company_id === null);
ok("빈 문자열 필드는 싣지 않는다", !("region" in noCo));
const gujo = buildCarryInsert(Object.assign({}, full, { agency_group: "구조혁신&사업전환" }), { year: 2026, month: 7 }, "시작전");
ok("구조혁신은 '시작전'(호출부 initialStatusFor 값)", gujo.status === "시작전");

console.log("\n■ 재이월 — 최초 신청월 유지 (6월 → 9월 → 12월)");
const nine = Object.assign({ id: "c-9" }, buildCarryInsert(full, { year: 2026, month: 9 }, "시작 전"));
const twelve = buildCarryInsert(nine, { year: 2026, month: 12 }, "시작 전");
ok("9월 사본의 최초 = 6월", nine.carried_from_month === 6);
ok("12월 사본의 최초도 6월(9월로 갱신 안 됨)", twelve.carried_from_year === 2026 && twelve.carried_from_month === 6);
ok("12월 사본의 직전 링크 = 9월 건", twelve.reapply_from_id === "c-9");
const nextYear = buildCarryInsert(nine, { year: 2027, month: 2 }, "시작 전");
ok("해를 넘겨도 최초 = 2026년 6월", nextYear.carried_from_year === 2026 && nextYear.carried_from_month === 6);
ok("carryOriginOf(일반 행) = 자기 연·월", JSON.stringify(carryOriginOf({ year: 2026, month: 3 })) === '{"year":2026,"month":3}');

console.log("\n■ 기본 월");
ok("6월 → 7월", JSON.stringify(nextCarryMonth({ year: 2026, month: 6 })) === '{"year":2026,"month":7}');
ok("12월 → 다음 해 1월", JSON.stringify(nextCarryMonth({ year: 2026, month: 12 })) === '{"year":2027,"month":1}');
ok("문자열 연·월도 처리", JSON.stringify(nextCarryMonth({ year: "2026", month: "11" })) === '{"year":2026,"month":12}');

console.log("\n■ 배지");
ok("이월(같은 해) = '이월 · 6월에서'", (caseOriginBadge({ year: 2026, carried_from_year: 2026, carried_from_month: 6, reapply_from_id: "x" }) || {}).label === "이월 · 6월에서");
ok("이월(다른 해) = '이월 · 2025년 11월에서'", (caseOriginBadge({ year: 2026, carried_from_year: 2025, carried_from_month: 11, reapply_from_id: "x" }) || {}).label === "이월 · 2025년 11월에서");
ok("링크가 지워져도(NULL) 이월 배지 유지", (caseOriginBadge({ year: 2026, carried_from_year: 2026, carried_from_month: 6, reapply_from_id: null }) || {}).kind === "carry");
ok("reapply_from_id 만 있으면 '재신청'", (caseOriginBadge({ year: 2026, reapply_from_id: "x" }) || {}).label === "재신청");
ok("컬럼이 아직 없는(undefined) 행도 '재신청'", (caseOriginBadge({ year: 2026, reapply_from_id: "x", carried_from_year: undefined }) || {}).kind === "reapply");
ok("아무것도 없으면 배지 없음", caseOriginBadge({ year: 2026 }) === null);
ok("반쪽(연만)이면 이월로 치지 않는다", (caseOriginBadge({ year: 2026, carried_from_year: 2026, reapply_from_id: "x" }) || {}).kind === "reapply");

// ── ② 다중 복사가 안 바뀌었는가 — git HEAD 원본과 대조
console.log("\n■ 다중 복사 불변 (git HEAD 대조)");
const headRaw = execFileSync("git", ["show", "HEAD:src/App.js"], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
const head = toLF(headRaw);
ok("COPY_FIELDS 가 HEAD 와 같다", JSON.stringify(pickCopyFields(head)) === JSON.stringify(COPY_FIELDS),
  JSON.stringify(COPY_FIELDS));
const copyBranch = (text) => {
  const m = text.match(/          var ins = \{\n            agency_group: bulkDest\.group[\s\S]*?ok\.push\(\{ row: r, month: it\.month, status: cr2\.data\.status \}\);/);
  return m ? m[0] : null;
};
ok("복사 분기(insert·재시도) 본문이 HEAD 와 바이트 동일", !!copyBranch(src) && copyBranch(src) === copyBranch(head));
const moveBranch = (text) => {
  const m = text.match(/        if \(isMove\) \{[\s\S]*?ok\.push\(\{ row: r, month: it\.month, status: upd\.status \|\| r\.status \}\);/);
  return m ? m[0] : null;
};
ok("이동 분기 본문이 HEAD 와 바이트 동일", !!moveBranch(src) && moveBranch(src) === moveBranch(head));
ok("이월 분기는 buildCarryInsert 를 쓴다", /buildCarryInsert\(r, \{ year: bulkDest\.year, month: it\.month \}, initialStatusFor\(r\.agency_group\)\)/.test(src));
ok("기존 다중 팝업은 이월 때 안 뜬다", src.includes("bulkMode && bulkDest && !bulkDest.carryRow && bulkPlan && ("));
ok("배지는 caseOriginBadge 로만 판정", src.includes("var ob = caseOriginBadge(row);") && !src.includes("{row.reapply_from_id && ("));
ok("행 버튼이 stopPropagation 후 openCarry", src.includes("e.stopPropagation(); openCarry(row);"));
ok("이월 토스트에 복사·건너뜀 건수 둘 다", /"복사 " \+ ok\.length \+ "건 · 건너뜀 " \+ bulkPlan\.skip\.length \+ "건"/.test(src));

// ── ③ 실제 DB — 기존 행 배지가 예전과 같은가 (읽기 전용)
console.log("\n■ 실제 DB 대조 (읽기 전용)");
const tmp = "scripts/.carry-probe.sql";
// to_jsonb(c)->'carried_from_year' 는 컬럼이 아직 없으면 NULL 을 준다 → SQL 실행 전후 어디서든 돈다.
// 민감 컬럼이 출력되지 않게 필요한 4개만 뽑는다.
fs.writeFileSync(tmp, `select id, year, month, reapply_from_id,
  (to_jsonb(c)->>'carried_from_year')::int as carried_from_year,
  (to_jsonb(c)->>'carried_from_month')::int as carried_from_month
  from public.agency_cases c;`);
let rows = null;
try {
  const out = execFileSync("node", ["scripts/run-sql.js", tmp], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  rows = JSON.parse(out.slice(out.indexOf("[", out.indexOf("결과:"))));
} catch (e) {
  console.log("  ⚠️ DB 조회 실패 — 이 구간은 건너뜀: " + String(e.message).split("\n")[0]);
} finally { try { fs.unlinkSync(tmp); } catch (e) {} }
if (rows) {
  const reapply = rows.filter((r) => r.reapply_from_id);
  const carried = rows.filter((r) => r.carried_from_year != null);
  console.log(`  (전체 ${rows.length}행 · reapply_from_id ${reapply.length}행 · 이월 기록 ${carried.length}행)`);
  const legacy = reapply.filter((r) => r.carried_from_year == null);
  ok(`이월 기록 없는 reapply 행 ${legacy.length}건은 전부 '재신청'`, legacy.every((r) => (caseOriginBadge(r) || {}).label === "재신청"));
  ok("reapply·이월 둘 다 없는 행은 배지 없음", rows.filter((r) => !r.reapply_from_id && r.carried_from_year == null).every((r) => caseOriginBadge(r) === null));
  ok("이월 기록 행은 전부 'carry' 배지", carried.every((r) => (caseOriginBadge(r) || {}).kind === "carry"));
}

console.log(`\n결과: ${pass} 통과 / ${fail} 실패`);
process.exit(fail ? 1 : 0);
