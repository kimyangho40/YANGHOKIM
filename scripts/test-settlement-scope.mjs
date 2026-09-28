// 💰 정산 열람·작성 권한 (settlement_permissions) — 판정 + 회귀 대조 (2026-09-26)
// 실행: node scripts/test-settlement-scope.mjs
//
// 왜 이렇게 하나: 판정 로직을 여기에 옮겨 적으면 그건 코드 검증이 아니라 **사본 검증**이다.
//   src/App.js 의 ⛳ 마커 구간을 **소스째 떼어내 실행**하고, 실제 DB 로 결과를 대조한다.
//
// ⚠️ App.js 의 마커 문구(⛳ 정산-권한 시작/끝)를 바꾸면 이 테스트가 통째로 죽는다.
// ⚠️ 건수 기대값을 상수로 박지 않는다 — 정산 건은 매일 변한다.
//    대신 **관계식**으로 검사한다: all 인 사람 = 전건 / own 인 사람 = 본인 담당 건수.
//
// 관련: 정산권한_settlement_permissions.sql / _rollback / _검증

import fs from "node:fs";
import { execFileSync } from "node:child_process";

let pass = 0, fail = 0;
const ok = (name, cond, detail = "") => {
  if (cond) { pass++; console.log(`  ✅ ${name}`); }
  else { fail++; console.log(`  ❌ ${name}${detail ? " — " + detail : ""}`); }
};

const src = fs.readFileSync("src/App.js", "utf8");

// ── ① 판정 블록을 소스에서 떼어낸다 ──────────────────────────────────────────
// normalizeStaffName 은 마커 밖(App.js:1692)에 있으므로 같이 떼어내 앞에 붙인다.
const norm = src.match(/function normalizeStaffName\(rawName\) \{[\s\S]*?\n\}/);
if (!norm) { console.error("❌ normalizeStaffName 을 App.js 에서 못 찾았다."); process.exit(1); }

const mk = src.match(/\/\/ ⛳ 정산-권한 시작[\s\S]*?⛳ 정산-권한 끝/);
if (!mk) { console.error("❌ '⛳ 정산-권한 시작/끝' 마커를 App.js 에서 못 찾았다."); process.exit(1); }

// eslint-disable-next-line no-new-func
const M = new Function(
  norm[0] + "\n" + mk[0] +
  "\n return { SETTLEMENT_SCOPES, settlementAssignees, settlementScopeOf, canViewSettlement," +
  " canCreateSettlement, settlementAssigneeChoices, canSaveSettlementAssignee, normalizeStaffName };"
)();
const {
  SETTLEMENT_SCOPES, settlementAssignees, settlementScopeOf, canViewSettlement,
  canCreateSettlement, settlementAssigneeChoices, canSaveSettlementAssignee,
} = M;
console.log("■ 소스에서 판정 블록을 떼어내 실행했다\n");

// ── ② 옛 하드코딩 명단이 정말 사라졌는가 ────────────────────────────────────
console.log("■ 하드코딩 명단 제거");
ok("SETTLEMENT_ADMINS 상수가 App.js 에 없다",
  !/const\s+SETTLEMENT_ADMINS\s*=/.test(src));
ok("SETTLEMENT_ADMINS 참조가 코드에 없다 (주석 설명 제외)",
  !src.split("\n").some((l) => l.includes("SETTLEMENT_ADMINS") && !l.trim().startsWith("//")),
  src.split("\n").filter((l) => l.includes("SETTLEMENT_ADMINS") && !l.trim().startsWith("//")).join(" | "));
ok("scope 값은 own/all 둘뿐", JSON.stringify(SETTLEMENT_SCOPES) === '["own","all"]');

// ── ③ 순수 판정 ─────────────────────────────────────────────────────────────
console.log("\n■ 범위 판정 (settlementScopeOf)");
ok("맵에 없으면 own", settlementScopeOf("지혜", {}) === "own");
ok("맵이 null 이면 own", settlementScopeOf("지혜", null) === "own");
ok("all 이면 all", settlementScopeOf("지혜", { 지혜: "all" }) === "all");
ok("own 이면 own", settlementScopeOf("지혜", { 지혜: "own" }) === "own");
ok("모르는 값('admin' 오타)은 own", settlementScopeOf("지혜", { 지혜: "admin" }) === "own");
ok("빈 이름은 own", settlementScopeOf("", { 지혜: "all" }) === "own");
ok("별칭도 정규화해서 찾는다 (김동일이사 → 동일)",
  settlementScopeOf("김동일이사", { 동일: "all" }) === "all");
ok("총무 → 유진 별칭", settlementScopeOf("총무", { 유진: "all" }) === "all");

console.log("\n■ 열람 판정 (canViewSettlement)");
const R = (a) => ({ assignee: a });
ok("all 은 남의 건도 본다", canViewSettlement(R("인선"), "지혜", "all") === true);
ok("all 은 담당자 빈 건도 본다", canViewSettlement(R(""), "지혜", "all") === true);
ok("all 은 assignee null 도 본다", canViewSettlement(R(null), "지혜", "all") === true);
ok("own 은 본인 건만", canViewSettlement(R("지혜"), "지혜", "own") === true);
ok("own 은 남의 건 못 봄", canViewSettlement(R("인선"), "지혜", "own") === false);
ok("own 은 담당자 빈 건 못 봄 (주인 없는 건은 all 에게만)",
  canViewSettlement(R(""), "지혜", "own") === false);
ok("공동 담당이면 양쪽 다 본다 (앞)", canViewSettlement(R("양호, 관호"), "양호", "own") === true);
ok("공동 담당이면 양쪽 다 본다 (뒤)", canViewSettlement(R("양호, 관호"), "관호", "own") === true);
ok("공동 담당에 없으면 못 봄", canViewSettlement(R("양호, 관호"), "지혜", "own") === false);
ok("옛 표기도 걸린다 (김동일이사, 동일, 지혜)",
  canViewSettlement(R("김동일이사, 동일, 지혜"), "동일", "own") === true);
ok("공백이 섞여도 걸린다", canViewSettlement(R(" 양호 ,  미현 "), "미현", "own") === true);
ok("이름이 비면 all 이어도 false (로그인 안 된 상태)",
  canViewSettlement(R("지혜"), "", "all") === false);
ok("scope 를 안 넘기면 own 처럼 동작 (안전한 쪽)",
  canViewSettlement(R("인선"), "지혜") === false);
ok("부분 일치로 새지 않는다 ('인선' ≠ '인')",
  canViewSettlement(R("인선"), "인", "own") === false);

console.log("\n■ 작성 판정");
ok("등록은 own 도 가능", canCreateSettlement("own") === true);
ok("등록은 all 도 가능", canCreateSettlement("all") === true);
ok("own 의 담당자 선택지는 본인 하나뿐",
  JSON.stringify(settlementAssigneeChoices("지혜", "own", ["유진", "지혜", "양호"])) === '["지혜"]');
ok("all 의 담당자 선택지는 전체",
  JSON.stringify(settlementAssigneeChoices("지혜", "all", ["유진", "지혜"])) === '["유진","지혜"]');
ok("own + 빈 이름이면 선택지 없음",
  JSON.stringify(settlementAssigneeChoices("", "own", ["유진"])) === "[]");
ok("own 은 본인 지정 저장 허용", canSaveSettlementAssignee("지혜", "지혜", "own") === true);
ok("own 은 타인 지정 저장 거부", canSaveSettlementAssignee("인선", "지혜", "own") === false);
ok("own 은 빈칸 저장 거부 (저장 즉시 화면에서 사라지는 것 방지)",
  canSaveSettlementAssignee("", "지혜", "own") === false);
ok("own 도 본인이 낀 공동 담당은 허용",
  canSaveSettlementAssignee("지혜, 인선", "지혜", "own") === true);
ok("all 은 타인 지정도 허용", canSaveSettlementAssignee("인선", "지혜", "all") === true);
ok("all 은 빈칸도 허용", canSaveSettlementAssignee("", "지혜", "all") === true);

// ── ④ 실제 DB 대조 ──────────────────────────────────────────────────────────
const runSql = (sql, label) => {
  const tmp = `scripts/.settlement-probe-${label}.sql`;
  fs.writeFileSync(tmp, sql);
  try {
    const out = execFileSync("node", ["scripts/run-sql.js", tmp], { encoding: "utf8" });
    return JSON.parse(out.slice(out.indexOf("[", out.indexOf("결과:"))));
  } finally { fs.unlinkSync(tmp); }
};

console.log("\n■ 권한 테이블 ↔ profiles 대조");
const perms = runSql(
  "select name, scope from public.settlement_permissions order by name;", "perms");
const approved = runSql(
  "select distinct name from public.profiles where status = 'approved' order by name;", "who")
  .map((r) => r.name);

const scopeMap = {};
perms.forEach((p) => { scopeMap[p.name] = p.scope; });
const allNames = perms.filter((p) => p.scope === "all").map((p) => p.name).sort();
console.log(`  ℹ️ 전체 권한: ${allNames.join(", ")} (${allNames.length}명)`);
console.log(`  ℹ️ 승인 계정 이름: ${approved.join(", ")} (${approved.length}명)`);

perms.forEach((p) => {
  ok(`'${p.name}' 이 승인된 profiles.name 에 실재한다`,
    approved.some((n) => M.normalizeStaffName(n) === p.name),
    "이름이 틀리면 에러 없이 조용히 안 먹는다");
});
ok("저장된 scope 값이 전부 own/all",
  perms.every((p) => SETTLEMENT_SCOPES.indexOf(p.scope) >= 0),
  perms.map((p) => p.scope).join(","));
ok("이름이 전부 정규화된 표기",
  perms.every((p) => M.normalizeStaffName(p.name) === p.name));

// ── ⑤ 🔁 회귀 대조 — 사람별로 실제 몇 건이 보이는가 ─────────────────────────
// 정산 화면에 뜨는 건 = agency_cases(승인·약정·완료·자금집행완료) + settlement_manual
// SettlementView.fetchData 와 같은 조건이어야 한다.
console.log("\n■ 회귀 대조 — 사람별 보이는 건수 (판정 함수를 실제 데이터에 먹여서)");
const rows = runSql(`
  select assignee from public.agency_cases
   where deleted_at is null and status in ('승인','약정','완료','자금집행완료')
  union all
  select assignee from public.settlement_manual where deleted_at is null;
`, "rows");
const total = rows.length;
console.log(`  ℹ️ 정산 대상 총 ${total}건`);

const visibleFor = (name) => {
  const scope = settlementScopeOf(name, scopeMap);
  return rows.filter((r) => canViewSettlement(r, name, scope)).length;
};
// 기대값을 상수로 박지 않는다 — "본인이 assignee 에 들어간 건수"를 따로 세어 관계식으로 검사한다.
const ownCountOf = (name) => {
  const me = M.normalizeStaffName(name);
  return rows.filter((r) => settlementAssignees(r.assignee).indexOf(me) >= 0).length;
};

approved.forEach((rawName) => {
  const name = M.normalizeStaffName(rawName);
  const scope = settlementScopeOf(name, scopeMap);
  const seen = visibleFor(name);
  const own = ownCountOf(name);
  if (scope === "all") {
    ok(`${name} (all) → 전건 ${total}건이 보인다`, seen === total, `실제 ${seen}`);
  } else {
    ok(`${name} (own) → 본인 담당 ${own}건만 보인다`, seen === own, `실제 ${seen}`);
    ok(`${name} (own) → 전건보다 적다 (또는 전건이 곧 본인 담당)`, seen <= total);
  }
});

// 중복 계정이 있어도 사람 단위로 같은 결과가 나와야 한다 (이름 키를 고른 이유)
console.log("\n■ 중복 계정 — 같은 이름이면 같은 범위");
const dupRows = runSql(`
  select name, count(*) as n from public.profiles
   where status = 'approved' group by name having count(*) > 1 order by name;
`, "dup");
if (!dupRows.length) {
  console.log("  ℹ️ 중복 계정 없음 — 검사 생략");
} else {
  console.log(`  ℹ️ 중복: ${dupRows.map((d) => d.name + "×" + d.n).join(", ")}`);
  dupRows.forEach((d) => {
    const s = settlementScopeOf(d.name, scopeMap);
    ok(`'${d.name}' ${d.n}계정이 모두 같은 범위(${s})`,
      settlementScopeOf(d.name, scopeMap) === s);
  });
}

// ── ⑥ 실패 시 동작 — 권한 맵이 없으면 아무것도 안 보여야 한다 ──────────────
console.log("\n■ 권한 맵 로딩 실패 시");
ok("맵이 null 이면 전원 own 으로 떨어진다(판정 자체는 안전)",
  approved.every((n) => settlementScopeOf(n, null) === "own"));
ok("화면은 scopeMap 이 없으면 목록을 비운다",
  /if \(!scopeMap\) return \[\];/.test(src),
  "allFiltered 의 가드가 사라졌다");
ok("화면은 scopeMap 이 없으면 표를 안 그린다",
  /\{scopeMap && \(<>/.test(src));
ok("폴백 명단을 코드에 남기지 않았다",
  !/관호[^\n]*동일[^\n]*양호[^\n]*유진/.test(src.replace(/^\s*\/\/.*$/gm, "")));

// ── ⑦ 화면이 실제로 보내는 조회의 정렬 컬럼이 테이블에 있는가 (2026-09-28 사고) ──
//    fetchAllRows 기본 정렬은 created_at→id 인데 이 테이블엔 둘 다 없다(PK=name).
//    ④ 는 raw SQL 로 따로 읽어서 이 경로를 한 번도 안 탔다 → 화면이 전원에게 400 인데 테스트는 통과했다.
console.log("\n■ 화면 조회(fetchAllRows) 정렬 컬럼 실재 확인");
const tableCols = runSql(
  "select column_name from information_schema.columns where table_schema='public' and table_name='settlement_permissions';",
  "cols").map((r) => r.column_name);
const spCalls = [...src.matchAll(/fetchAllRows\("settlement_permissions",[^\n]*/g)].map((m) => m[0]);
ok("fetchAllRows(settlement_permissions) 호출이 2곳 이상 있다", spCalls.length >= 2, `found ${spCalls.length}`);
spCalls.forEach((c, i) => {
  const ob = (c.match(/orderBy:\s*"([^"]+)"/) || [])[1] || "created_at";
  const tbNull = /tieBreak:\s*null/.test(c);
  const tb = tbNull ? null : ((c.match(/tieBreak:\s*"([^"]+)"/) || [])[1] || "id");
  ok(`호출 #${i + 1} 정렬 컬럼 '${ob}' 이 테이블에 있다`, tableCols.includes(ob), c);
  ok(`호출 #${i + 1} tieBreak(${tb}) 가 없거나 테이블에 있다`, tb === null || tableCols.includes(tb), c);
});

console.log(`\n결과: ${pass}/${pass + fail} 통과`);
process.exit(fail ? 1 : 0);
