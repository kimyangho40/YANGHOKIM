// 업무노트 @기업 태그 → 타임라인 링크 소급 마이그레이션 (2026-08-31)
//
// ⚠️ App.js 소스에서 noteLinkRows 를 **떼어내 그대로 실행**한다.
//    손으로 옮겨 적거나 SQL 로 다시 구현하면 화면과 결과가 갈라진다
//    (CLAUDE.md 의 JS↔SQL 이중구현 경고 — wn_team_unfinished 계열 사고).
// ⚠️ 기본은 미리보기다. 실제로 넣으려면 --apply 를 줘야 한다.
// ⚠️ 유니크 (source, note_id, item_key, company_id) where deleted_at is null 덕에
//    **몇 번을 돌려도 안 불어난다.**
//
// 사용법:
//   node scripts/migrate-note-links.mjs            # 미리보기만 (아무것도 안 씀)
//   node scripts/migrate-note-links.mjs --apply    # 실제 반영
import fs from "fs";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";
import { execFileSync } from "child_process";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const APPLY = process.argv.includes("--apply");
const src = fs.readFileSync(path.join(ROOT, "src/App.js"), "utf8");

function cut(startNeedle, endNeedle, label) {
  const s = src.indexOf(startNeedle);
  if (s < 0) { console.error(`❌ ${label} 시작을 App.js 에서 못 찾았습니다: ${startNeedle}`); process.exit(1); }
  const e = src.indexOf(endNeedle, s + startNeedle.length);
  if (e < 0) { console.error(`❌ ${label} 끝을 못 찾았습니다: ${JSON.stringify(endNeedle)}`); process.exit(1); }
  return src.slice(s, e + endNeedle.length);
}
const deps =
  cut("var ITEM_WAIT_RE =", "\n", "ITEM_WAIT_RE") +
  cut("function splitItemWait(", "\n}", "splitItemWait") + "\n" +
  cut("function decodeItemText(", "\n}", "decodeItemText") + "\n";
const block = cut("// ── note-link BEGIN ──", "// ── note-link END ──", "note-link 블록");
const { noteLinkRows } = new Function(deps + "\n" + block + "\nreturn { noteLinkRows };")();
console.log(`── App.js 에서 떼어낸 소스 ${(deps + block).trim().split("\n").length}줄 ──`);

function runSql(sql) {
  const tmp = path.join(os.tmpdir(), "note-links-" + process.pid + "-" + Math.random().toString(36).slice(2) + ".sql");
  fs.writeFileSync(tmp, sql, "utf8");
  try {
    const raw = execFileSync("node", [path.join(ROOT, "scripts/run-sql.js"), tmp],
      { encoding: "utf8", maxBuffer: 256 * 1024 * 1024 });
    if (raw.indexOf("[") < 0) throw new Error("결과를 못 읽었습니다:\n" + raw.slice(-500));
    return JSON.parse(raw.slice(raw.indexOf("[")));
  } catch (e) {
    console.error("❌ SQL 실패 — .env.local 의 SUPABASE_ACCESS_TOKEN 을 확인하세요.");
    console.error(String((e && e.stdout) || (e && e.message) || e).slice(-700));
    process.exit(1);
  } finally { try { fs.unlinkSync(tmp); } catch (_) {} }
}

// ── ① 원본을 읽는다 (읽기 전용 SELECT 1개) ────────────────────────────────────
const [{ payload }] = runSql(`
select json_build_object(
  'companies', (select coalesce(json_agg(json_build_object('id',id,'name',name)),'[]'::json)
                  from public.companies where deleted_at is null and name is not null and name <> ''),
  'team',      (select coalesce(json_agg(json_build_object(
                        'id',id,'checklist',checklist,'work_date',work_date,
                        'created_at',created_at,'posted_by',posted_by)),'[]'::json)
                  from public.team_notes where deleted_at is null),
  'work',      (select coalesce(json_agg(json_build_object(
                        'id',id,'content',content,'note_date',note_date,
                        'created_at',created_at,'assignee',assignee)),'[]'::json)
                  from public.work_notes where deleted_at is null),
  'existing',  (select coalesce(json_agg(json_build_object(
                        'source',source,'note_id',note_id,'item_key',item_key,'company_id',company_id)),'[]'::json)
                  from public.note_company_links where deleted_at is null)
) as payload;
`);
const { companies, team, work, existing } = payload;
console.log(`기업 ${companies.length} · 팀노트 ${team.length} · 개인노트 ${work.length} · 기존 링크 ${existing.length}`);

// ── ② 원하는 링크를 계산한다 ──────────────────────────────────────────────────
let rows = [];
team.forEach(n => { rows = rows.concat(noteLinkRows("team_item", n, companies)); });
work.forEach(n => { rows = rows.concat(noteLinkRows("work_line", n, companies)); });

const keyOf = r => [r.source, r.note_id, r.item_key, r.company_id].join("|");
const have = new Set(existing.map(keyOf));
const fresh = rows.filter(r => !have.has(keyOf(r)));

const byCo = new Map(companies.map(c => [c.id, c.name]));
const teamN = rows.filter(r => r.source === "team_item").length;
const workN = rows.filter(r => r.source === "work_line").length;
console.log(`\n계산된 링크 ${rows.length}쌍 (팀 ${teamN} · 개인 ${workN})`);
console.log(`  · 항목/줄 ${new Set(rows.map(r => r.source + r.note_id + r.item_key)).size}개`);
console.log(`  · 기업 ${new Set(rows.map(r => r.company_id)).size}개`);
console.log(`  · 한 항목에 기업 2곳 이상 ${
  [...rows.reduce((m, r) => m.set(r.source + r.note_id + r.item_key, (m.get(r.source + r.note_id + r.item_key) || 0) + 1), new Map()).values()]
    .filter(v => v > 1).length}건`);
console.log(`  · 새로 넣을 것 ${fresh.length}쌍 (이미 있는 것 ${rows.length - fresh.length})`);

const dates = rows.map(r => String(r.at).slice(0, 10)).sort();
if (dates.length) console.log(`  · 기간 ${dates[0]} ~ ${dates[dates.length - 1]}`);

console.log("\n── 기업별 상위 10 ──");
const perCo = new Map();
rows.forEach(r => perCo.set(r.company_id, (perCo.get(r.company_id) || 0) + 1));
[...perCo.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10)
  .forEach(([cid, n]) => console.log(`  ${String(n).padStart(3)}건  ${byCo.get(cid)}`));

console.log("\n── 샘플 20건 ──");
fresh.slice(0, 20).forEach(r => {
  console.log(`  [${r.source === "team_item" ? "팀" : "개인"}] ${String(r.at).slice(0, 10)}  ${byCo.get(r.company_id)}`);
  console.log(`       ${String(r.item_text).replace(/\s+/g, " ").slice(0, 80)}`);
});

if (!APPLY) {
  console.log("\n⏸  미리보기만 했습니다 (DB 에 아무것도 쓰지 않았습니다).");
  console.log("   실제로 넣으려면: node scripts/migrate-note-links.mjs --apply");
  process.exit(0);
}

// ── ③ 반영 (유니크 덕에 재실행 안전) ──────────────────────────────────────────
if (fresh.length === 0) {
  console.log("\n✅ 새로 넣을 것이 없습니다 (이미 전부 반영돼 있습니다).");
  process.exit(0);
}
const esc = v => (v == null ? "null" : "'" + String(v).replace(/'/g, "''") + "'");
const CHUNK = 100;
let done = 0;
for (let i = 0; i < fresh.length; i += CHUNK) {
  const part = fresh.slice(i, i + CHUNK);
  const values = part.map(r =>
    `(${esc(r.source)},${esc(r.note_id)}::uuid,${esc(r.item_key)},${esc(r.company_id)}::uuid,` +
    `${esc(r.item_text)},${esc(r.at)}::timestamptz,${esc(r.author)})`).join(",\n  ");
  runSql(`
insert into public.note_company_links (source, note_id, item_key, company_id, item_text, at, author)
values
  ${values}
on conflict do nothing;
select count(*) as total from public.note_company_links where deleted_at is null;
`);
  done += part.length;
  console.log(`  … ${done}/${fresh.length}`);
}
console.log(`\n✅ ${fresh.length}쌍 반영 완료.`);
console.log("   이제 **별도 조회**로 검증하세요(CLAUDE.md 2-2 — 실행 파일에 딸린 SELECT 를 믿지 말 것).");
