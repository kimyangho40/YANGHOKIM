// 💳 신용점수 조회일 (2026-10-20)
// 실행: node scripts/test-credit-date.mjs
//
// src/App.js 의 ⛳ 신용조회일 마커 구간을 소스째 떼어내 실행한다(옮겨 적으면 사본 검증이 된다).
// ⚠️ 마커 문구(⛳ 신용조회일 시작/끝)를 바꾸면 이 테스트가 통째로 죽는다.

import fs from "node:fs";

let pass = 0, fail = 0;
const ok = (name, cond, detail = "") => {
  if (cond) { pass++; console.log(`  ✅ ${name}`); }
  else { fail++; console.log(`  ❌ ${name}${detail ? " — " + detail : ""}`); }
};

const src = fs.readFileSync("src/App.js", "utf8");
const mk = src.match(/\/\/ ⛳ 신용조회일 시작[\s\S]*?⛳ 신용조회일 끝/);
if (!mk) { console.error("❌ '⛳ 신용조회일 시작/끝' 마커를 App.js 에서 못 찾았다."); process.exit(1); }
// eslint-disable-next-line no-new-func
const F = new Function(mk[0] + "\n return { CREDIT_DATE_LABEL, parseCreditDate, creditDateOf, withCreditDate, creditScoreKey, stampCreditDate, creditDateBadge };")();

console.log("■ 날짜 읽기");
ok("2026.10.14", F.parseCreditDate("2026.10.14") === "2026-10-14");
ok("2026-10-14", F.parseCreditDate("2026-10-14") === "2026-10-14");
ok("2026년 10월 4일", F.parseCreditDate("2026년 10월 4일") === "2026-10-04");
ok("26.10.14", F.parseCreditDate("26.10.14") === "2026-10-14");
ok("앞뒤 글자 섞임", F.parseCreditDate("KCB 2026.9.1 조회") === "2026-09-01");
ok("빈값·쓰레기 → null", F.parseCreditDate("") === null && F.parseCreditDate("모름") === null && F.parseCreditDate("2026.13.01") === null);
ok("금액 숫자를 날짜로 오독 안 함", F.parseCreditDate("1,847,423원") === null);

console.log("\n■ company_info 읽기·쓰기");
const info = [{ label: "부채총계", value: "1" }, { label: "신용 조회일", value: "2026.10.14" }];
ok("라벨에서 읽기", F.creditDateOf(info) === "2026-10-14");
const w = F.withCreditDate(info, "2026-10-20");
ok("있으면 덮어쓰기(줄 수 그대로)", w.length === 2 && F.creditDateOf(w) === "2026-10-20");
ok("원본 배열 안 건드림", info[1].value === "2026.10.14");
ok("없으면 추가", F.creditDateOf(F.withCreditDate([], "2026-10-20")) === "2026-10-20");
ok("null 도 안전", F.withCreditDate(null, "2026-10-20").length === 1);

console.log("\n■ 언제 오늘 날짜를 찍나");
const prev = { credit_score_kcb: 664, credit_score_nice: 634, company_info: info };
ok("점수 그대로 → 안 찍음", F.stampCreditDate(prev, { credit_score_kcb: "664", credit_score_nice: "634", company_info: info }, "2026-10-20") === null);
const s1 = F.stampCreditDate(prev, { credit_score_kcb: "700", credit_score_nice: "634", company_info: info }, "2026-10-20");
ok("KCB 만 바뀜 → 오늘", s1 && F.creditDateOf(s1) === "2026-10-20");
const s2 = F.stampCreditDate(prev, { credit_score_kcb: "664", credit_score_nice: "650", company_info: info }, "2026-10-20");
ok("NICE 만 바뀜 → 오늘", s2 && F.creditDateOf(s2) === "2026-10-20");
ok("점수 지움 → 안 찍음", F.stampCreditDate(prev, { credit_score_kcb: "", credit_score_nice: "", company_info: info }, "2026-10-20") === null);
const doc = F.withCreditDate(info, "2026.10.18");
ok("현황표가 조회일을 같이 넣음 → 그 날짜 존중", F.stampCreditDate(prev, { credit_score_kcb: "700", credit_score_nice: "650", company_info: doc }, "2026-10-20") === null);
const s3 = F.stampCreditDate({ credit_score_kcb: null, credit_score_nice: null }, { credit_score_kcb: "700", credit_score_nice: "" }, "2026-10-20");
ok("처음 입력(조회일 없던 기업) → 오늘", s3 && F.creditDateOf(s3) === "2026-10-20");
ok("숫자/문자 표기 차이는 변경 아님", F.creditScoreKey({ credit_score_kcb: 664, credit_score_nice: "0634" }) === F.creditScoreKey({ credit_score_kcb: "664", credit_score_nice: 634 }));

console.log("\n■ 표시");
const b1 = F.creditDateBadge(info, "2026-10-20");
ok("6일 전", b1 && b1.text === "10/14 · 6일 전" && !b1.stale, JSON.stringify(b1));
const b2 = F.creditDateBadge(F.withCreditDate([], "2026-10-20"), "2026-10-20");
ok("오늘", b2 && b2.text === "10/20 · 오늘");
const b3 = F.creditDateBadge(F.withCreditDate([], "2026-07-22"), "2026-10-20");
ok("90일 → 주황(stale)", b3 && b3.stale && b3.days === 90);
const b4 = F.creditDateBadge(F.withCreditDate([], "2025-12-30"), "2026-10-20");
ok("다른 해는 연도 붙임", b4 && b4.text.indexOf("25.12/30") === 0, b4 && b4.text);
ok("조회일 없으면 null", F.creditDateBadge([], "2026-10-20") === null);

console.log(`\n${fail ? "❌" : "✅"} ${pass}/${pass + fail}`);
process.exit(fail ? 1 : 0);
