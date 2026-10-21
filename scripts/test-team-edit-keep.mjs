// 팀 업무 카드 수정 저장(saveEditNote)이 항목의 일정·완료 필드를 지우지 않는지 (2026-10-20)
// 실행: node scripts/test-team-edit-keep.mjs
// App.js 의 saveEditNote 안 cleanChecklist 계산을 소스째 떼어내 실행한다(옮겨 적지 않는다).

import fs from "node:fs";

let pass = 0, fail = 0;
const ok = (name, cond, detail = "") => {
  if (cond) { pass++; console.log(`  ✅ ${name}`); }
  else { fail++; console.log(`  ❌ ${name}${detail ? " — " + detail : ""}`); }
};

const src = fs.readFileSync("src/App.js", "utf8");
const m = src.match(/var cleanChecklist = \(editingDraft\.checklist[\s\S]*?return o;\r?\n    \}\);/);
if (!m) { console.error("❌ saveEditNote 의 cleanChecklist 계산을 못 찾았다."); process.exit(1); }
// eslint-disable-next-line no-new-func
const run = new Function("editingDraft", m[0] + "\n return cleanChecklist;");

const sched = {
  id: "ck_a", text: "실태조사 · (주)입체로", taken_by: null, taken_at: null, taken_work_note_id: null, done: true,
  is_sched: true, sched_kind: "실태조사", company_id: "c1", company_name: "(주)입체로", assignee: "유진",
  result: "서류 보완 요청", done_at: "2026-10-18T05:00:00Z", done_by: "유진", created_at: "2026-10-10T00:00:00Z",
};
const plain = { id: "ck_b", text: "옛 항목", done: false };
const doneItem = { id: "ck_c", text: "완료한 항목", done: true, done_at: "2026-10-19T01:00:00Z", done_by: "관호" };
const fresh = { id: "tmp_x", text: "  새 항목  " };
const empty = { id: "tmp_y", text: "   " };

const out = run({ checklist: [sched, plain, doneItem, fresh, empty] });
const byId = Object.fromEntries(out.map(o => [o.id, o]));

console.log("■ 일정 항목");
for (const k of ["is_sched", "sched_kind", "company_id", "company_name", "assignee", "result", "done_at", "done_by", "created_at"]) {
  ok(`${k} 유지`, byId.ck_a && byId.ck_a[k] === sched[k], JSON.stringify(byId.ck_a && byId.ck_a[k]));
}
ok("done 유지", byId.ck_a.done === true);

console.log("\n■ 기존 동작 그대로");
ok("밀린 미완료에서 완료한 항목 done_by·done_at 유지", byId.ck_c.done_by === "관호" && byId.ck_c.done_at === doneItem.done_at);
ok("옛 항목에 created_at 새로 안 찍음", !("created_at" in byId.ck_b));
ok("taken_* 기본값 null", byId.ck_b.taken_by === null && byId.ck_b.taken_at === null && byId.ck_b.taken_work_note_id === null);
ok("새 항목 글자 앞뒤 공백 정리", byId.tmp_x && byId.tmp_x.text === "새 항목");
ok("새 항목에만 created_at 찍음", byId.tmp_x && typeof byId.tmp_x.created_at === "string");
ok("빈 항목 제거", !byId.tmp_y && out.length === 4);
ok("원본 객체 안 건드림", sched.text === "실태조사 · (주)입체로" && fresh.text === "  새 항목  ");

console.log(`\n${fail ? "❌" : "✅"} ${pass}/${pass + fail}`);
process.exit(fail ? 1 : 0);
