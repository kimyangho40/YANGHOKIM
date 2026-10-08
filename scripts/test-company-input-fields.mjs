// 기업 입력칸 보강 (2026-10-08)
// 실행: node scripts/test-company-input-fields.mjs
//
// 판정 규칙을 여기에 옮겨 적으면 사본 검증이다 → src/App.js 의 ⛳ 기업입력칸 구간을 소스째 떼어내 실행하고,
// 저장 경로·SQL 은 소스 정적 검사로 대조한다.
// ⚠️ App.js 의 마커 문구(⛳ 기업입력칸 시작/끝)를 바꾸면 이 테스트가 통째로 죽는다.

import fs from "node:fs";

let pass = 0, fail = 0;
const ok = (name, cond, detail = "") => {
  if (cond) { pass++; console.log(`  ✅ ${name}`); }
  else { fail++; console.log(`  ❌ ${name}${detail ? " — " + detail : ""}`); }
};

const src = fs.readFileSync("src/App.js", "utf8");
const mk = src.match(/\/\/ ⛳ 기업입력칸 시작[\s\S]*?⛳ 기업입력칸 끝/);
if (!mk) { console.error("❌ '⛳ 기업입력칸 시작/끝' 마커를 App.js 에서 못 찾았다."); process.exit(1); }
// eslint-disable-next-line no-new-func
const F = new Function(mk[0] + "\n return { CERT_OPTIONS, YOUTH_MAX_AGE, kstTodayParts, ageFromBirth, bizAgeMonths, formatBizAge, revenueGrowthPct, normalizeCerts };")();

// KST 2026-10-08 10:00 고정
const NOW = new Date("2026-10-08T01:00:00Z");

console.log("■ 만 나이");
ok("생일 지남 1989-03-17 → 37", F.ageFromBirth("1989-03-17", NOW) === 37);
ok("생일 전 1989-12-01 → 36", F.ageFromBirth("1989-12-01", NOW) === 36);
ok("생일 당일 1987-10-08 → 39(청년 경계)", F.ageFromBirth("1987-10-08", NOW) === 39 && 39 <= F.YOUTH_MAX_AGE);
ok("생일 하루 전 1986-10-09 → 39", F.ageFromBirth("1986-10-09", NOW) === 39);
ok("빈값·잘못된 값 → null", [null, undefined, "", "1989", "abc"].every((v) => F.ageFromBirth(v, NOW) === null));
ok("미래 날짜 → null", F.ageFromBirth("2030-01-01", NOW) === null);
// KST 경계: UTC 로는 10/7 이지만 KST 로는 10/8 인 순간
ok("KST 날짜 경계(UTC 10/7 16:00 = KST 10/8 01:00)", F.ageFromBirth("1987-10-08", new Date("2026-10-07T16:00:00Z")) === 39);

console.log("\n■ 업력");
const a = F.bizAgeMonths("2018", 8, NOW);
ok("2018-08 → 98개월 · 8년 2개월", a && a.months === 98 && F.formatBizAge(a) === "8년 2개월", JSON.stringify(a) + " " + F.formatBizAge(a));
const b = F.bizAgeMonths(2026, 3, NOW);
ok("2026-03 → 7개월", b && F.formatBizAge(b) === "7개월", F.formatBizAge(b));
const c = F.bizAgeMonths("2020", "", NOW);
ok("월 없음 → '약' 표시", c && c.approx === true && F.formatBizAge(c).startsWith("약 "), F.formatBizAge(c));
ok("연도 없음 → null", F.bizAgeMonths("", 5, NOW) === null && F.bizAgeMonths(null, null, NOW) === null);
ok("미래 설립 → null", F.bizAgeMonths(2027, 1, NOW) === null);

console.log("\n■ 매출 증가율");
ok("1억 → 1.5억 = 50", F.revenueGrowthPct(100000000, 150000000) === 50);
ok("감소 3억 → 2.4억 = -20", F.revenueGrowthPct(300000000, 240000000) === -20);
ok("소수 1자리 (1→1.3333 = 33.3)", F.revenueGrowthPct(3, 4) === 33.3);
ok("전년 0·빈값·음수 → null", F.revenueGrowthPct(0, 5) === null && F.revenueGrowthPct(null, 5) === null && F.revenueGrowthPct(-1, 5) === null);
ok("당해 빈값 → null(0%로 오인 금지)", F.revenueGrowthPct(100, null) === null && F.revenueGrowthPct(100, "") === null);

console.log("\n■ 인증 정리");
ok("CERT_OPTIONS 10개 · key 중복 없음", F.CERT_OPTIONS.length === 10 && new Set(F.CERT_OPTIONS.map((o) => o.key)).size === 10);
ok("모르는 값·중복 제거 + 정의 순서 정렬",
  JSON.stringify(F.normalizeCerts(["이노비즈", "없는인증", "중소기업확인서", "이노비즈"])) === JSON.stringify(["중소기업확인서", "이노비즈"]));
ok("배열 아님 → []", JSON.stringify(F.normalizeCerts(null)) === "[]" && JSON.stringify(F.normalizeCerts("이노비즈")) === "[]");

console.log("\n■ 저장 경로(정적 검사)");
const save = src.match(/const saveCompany = async \(data, prevData\) => \{[\s\S]*?\n  \};/);
ok("saveCompany 를 찾음", !!save);
const body = save ? save[0] : "";
ok("social_enterprise 를 boolean 일 때 저장(체크해도 안 저장되던 버그)", /typeof rest\.social_enterprise === "boolean"[\s\S]{0,80}updateObj\.social_enterprise/.test(body));
["representative_birth", "representative_gender", "biz_reg_count", "has_closed_business"].forEach((k) =>
  ok(`${k} 저장 루프에 있음`, body.includes(`"${k}"`)));
ok("certifications 는 normalizeCerts 를 거쳐 저장", /updateObj\.certifications = normalizeCerts\(rest\.certifications\)/.test(body));
const allFields = (body.match(/const allFields = \{[\s\S]*?\n    \};/) || [""])[0];
ok("새 칸은 allFields 에 없음(넣으면 지운 값이 저장 안 된다)",
  !/representative_birth|representative_gender|biz_reg_count|has_closed_business|certifications/.test(allFields));

console.log("\n■ SQL ↔ 코드 컬럼명 대조");
const sql = fs.readFileSync("기업입력칸_보강_컬럼추가.sql", "utf8");
const rb = fs.readFileSync("기업입력칸_보강_컬럼추가_rollback.sql", "utf8");
["representative_birth", "representative_gender", "biz_reg_count", "has_closed_business", "certifications"].forEach((k) => {
  ok(`${k}: 추가 SQL에 있음`, sql.includes(`add column if not exists ${k}`));
  ok(`${k}: 되돌리기 SQL에 있음`, rb.includes(`drop column if exists ${k}`));
});
ok("성별 제약 어휘(남/여)가 화면 버튼과 같음", /in \('남', '여'\)/.test(sql) && src.includes('{["남", "여"].map('));

console.log(`\n결과: ${pass}/${pass + fail} 통과`);
process.exit(fail ? 1 : 0);
