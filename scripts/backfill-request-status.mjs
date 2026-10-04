// 📩 업무요청 완료상태 과거분 1회 보정 — SQL 파일 생성기 (2026-10-04)
// 실행: node scripts/backfill-request-status.mjs            (읽기 전용 · 계획만 출력)
//       node scripts/backfill-request-status.mjs --write    (계획을 SQL 파일 2개로 저장: 반영 + 되돌리기)
//
// ⚠️ 이 스크립트는 DB 에 쓰지 않는다. 만든 SQL 을 사람이 확인한 뒤 run-sql.js 로 돌린다.
// 판정은 App.js 의 ⛳ 업무요청-동기화 블록(planRequestBackfill)을 소스째 떼어내 쓴다 — 화면과 같은 규칙.
//   · 받는 사람 노트를 날짜순으로 훑어 "마지막에 본 📩 줄"의 체크 상태가 이긴다(이월 사슬의 끝).
//   · 새로 완료가 되는 건의 done_at 은 비운다 — 실제 체크 시각을 알 수 없다(지어내지 않는다).
//   · 노트에서 줄을 못 찾은 요청은 건드리지 않는다.
// 생성된 UPDATE 는 `where id=… and status=<옛값>` 가드 — 그 사이 바뀐 행은 조용히 건너뛴다.

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

const src = fs.readFileSync("src/App.js", "utf8");
const s = src.indexOf("// ⛳ 업무요청-동기화 시작"), e = src.indexOf("// ⛳ 업무요청-동기화 끝");
if (s < 0 || e < 0) { console.error("❌ ⛳ 업무요청-동기화 마커를 못 찾았다."); process.exit(1); }
const { planRequestBackfill } = new Function(src.slice(s, e) + "\nreturn { planRequestBackfill };")();

const tmp = path.join(os.tmpdir(), "req-backfill-" + process.pid + ".sql");
fs.writeFileSync(tmp, `select json_build_object(
  'reqs', (select coalesce(json_agg(r),'[]'::json) from (select w.id,w.request_from,w.request_to,w.content,w.status,w.done_at,w.note_id,w.created_at,
             (select name from public.companies c where c.id=w.company_id) co from public.work_requests w) r),
  'notes', (select coalesce(json_agg(n),'[]'::json) from (select id,assignee,note_date,created_at,content from public.work_notes
              where deleted_at is null and assignee in (select distinct request_to from public.work_requests)) n)
) p;`, "utf8");
let raw;
try { raw = execFileSync("node", ["scripts/run-sql.js", tmp], { encoding: "utf8", maxBuffer: 256 * 1024 * 1024 }); }
finally { try { fs.unlinkSync(tmp); } catch (_) {} }
const [{ p }] = JSON.parse(raw.slice(raw.indexOf("[")));

const plan = planRequestBackfill(p.notes, p.reqs);
const byId = Object.fromEntries(p.reqs.map((r) => [r.id, r]));
console.log(`요청 ${p.reqs.length}건 · 받는 사람 노트 ${p.notes.length}장 → 보정 ${plan.length}건\n`);
plan.forEach((x, i) => {
  const r = byId[x.id];
  console.log(`${String(i + 1).padStart(2)}. ${x.prevStatus} → ${x.patch.status}  ${r.request_from}→${r.request_to}  ${String(r.created_at).slice(0, 10)}  ${r.co ? "[" + r.co + "] " : ""}${String(r.content).replace(/\s+/g, " ").slice(0, 50)}`);
});

if (process.argv.includes("--write")) {
  const q = (v) => (v == null ? "null" : "'" + String(v).replace(/'/g, "''") + "'");
  const head = (title) => `-- ${title}\n-- 생성: scripts/backfill-request-status.mjs (${new Date().toISOString()}) · ${plan.length}건\n` +
    `-- 판정: App.js ⛳ 업무요청-동기화 planRequestBackfill (받는 사람 노트의 📩 줄 체크 상태 → work_requests)\n` +
    `-- 가드: 각 UPDATE 는 옛 상태일 때만 바뀐다. 그 사이 사람이 바꾼 행은 건너뛴다.\n`;
  const up = head("업무요청 완료상태 과거분 1회 보정") + "begin;\n" + plan.map((x) =>
    `update public.work_requests set status = ${q(x.patch.status)}, done_at = ${q(x.patch.done_at)} where id = ${q(x.id)} and status = ${q(x.prevStatus)};`).join("\n") +
    "\ncommit;\n\n-- 검증은 이 파일의 SELECT 가 아니라 별도 조회로 한다(CLAUDE.md 2-2).\n";
  const down = head("[되돌리기] 업무요청 완료상태 과거분 1회 보정") + "begin;\n" + plan.map((x) =>
    `update public.work_requests set status = ${q(x.prevStatus)}, done_at = ${q(byId[x.id].done_at)} where id = ${q(x.id)} and status = ${q(x.patch.status)};`).join("\n") +
    "\ncommit;\n";
  fs.writeFileSync("업무요청_완료상태_소급.sql", up, "utf8");
  fs.writeFileSync("업무요청_완료상태_소급_rollback.sql", down, "utf8");
  console.log("\n→ 업무요청_완료상태_소급.sql / 업무요청_완료상태_소급_rollback.sql 저장");
}
