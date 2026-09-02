// 성장 로드맵 검수 배지 — 판정 함수를 소스에서 떼어내 실제 DB 값으로 돌린다.
// 실행: node scripts/test-growth-roadmap.mjs
//
// 왜 이렇게 하나: 판정 규칙을 여기에 옮겨 적으면 그건 코드 검증이 아니라 사본 검증이다.
// src/pages/GrowthRoadmap.jsx 의 isUnverified 를 정규식으로 뽑아 eval 해서, DB 에서 방금
// 읽은 16행에 그대로 먹인다. 화면이 배지를 다는 기준과 여기서 세는 기준이 같은 함수다.
//
// ⚠️ 기대값(4건 · id 5·7·9·10)은 2026-09-02 실측이다. 원문 대조가 끝나 DB 의 source 를
//    'video' 로 바꾸면 이 테스트는 **실패하는 게 정상**이다 — 그때 기대값을 같이 줄일 것.

import fs from "node:fs";
import { execFileSync } from "node:child_process";

const EXPECT_TOTAL = 16;
const EXPECT_UNVERIFIED_IDS = [5, 7, 9, 10];

let pass = 0, fail = 0;
const ok = (name, cond, detail = "") => {
  if (cond) { pass++; console.log(`  ✅ ${name}`); }
  else { fail++; console.log(`  ❌ ${name}${detail ? " — " + detail : ""}`); }
};

// ── ① 소스에서 판정 함수를 떼어낸다
const src = fs.readFileSync("src/pages/GrowthRoadmap.jsx", "utf8");
const m = src.match(/^const isUnverified = (\(p\) => [^;]+);$/m);
if (!m) {
  console.error("❌ isUnverified 를 소스에서 못 찾았다. 함수 모양이 바뀌었으면 이 정규식도 같이 고칠 것.");
  process.exit(1);
}
// eslint-disable-next-line no-eval
const isUnverified = eval(m[1]);
console.log(`■ 소스에서 떼어낸 판정: ${m[1]}\n`);

// ── ② DB 에서 16행을 그대로 읽는다
const tmp = "scripts/.growth-probe.sql";
fs.writeFileSync(tmp, "select id, industry, source, is_active from public.growth_paths order by id;");
let rows;
try {
  const out = execFileSync("node", ["scripts/run-sql.js", tmp], { encoding: "utf8" });
  rows = JSON.parse(out.slice(out.indexOf("[", out.indexOf("결과:"))));
} finally { fs.unlinkSync(tmp); }

// ── ③ 대조
console.log("■ 검증");
ok(`행 수 ${EXPECT_TOTAL}`, rows.length === EXPECT_TOTAL, `실제 ${rows.length}`);
ok("전부 is_active", rows.every(r => r.is_active));

const got = rows.filter(isUnverified).map(r => r.id);
ok(`미검증 ${EXPECT_UNVERIFIED_IDS.length}건`, got.length === EXPECT_UNVERIFIED_IDS.length, `실제 ${got.length}`);
ok(`미검증 id = ${EXPECT_UNVERIFIED_IDS.join("·")}`, got.join(",") === EXPECT_UNVERIFIED_IDS.join(","), `실제 ${got.join(",")}`);

// video 는 한 건도 배지가 붙으면 안 된다 (반대 방향 확인)
ok("video 행에 배지 0건", rows.filter(r => r.source === "video").every(r => !isUnverified(r)));
// source 가 비어 있는 행은 미검증으로 치지 않는다 (함수 주석의 약속)
ok("source 없는 행은 미검증 아님", [{ source: null }, {}, { source: "" }].every(r => !isUnverified(r)));
// DB 에 video/authored 말고 다른 값이 섞이면 조용히 배지가 붙는다 → 알아채게 한다
const kinds = [...new Set(rows.map(r => r.source))].sort();
ok("source 어휘가 video·authored 뿐", kinds.join(",") === "authored,video", `실제 ${kinds.join(",")}`);

console.log(`\n결과: ${pass}/${pass + fail} 통과`);
process.exit(fail ? 1 : 0);
