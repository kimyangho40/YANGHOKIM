// 파이프라인 카드 「현재 상태」 자동표시 검증 (2026-09-04)
//   설계서: docs/superpowers/specs/2026-09-04-pipeline-comment-design.md
//
// ⚠️ App.js 소스에서 계산 블록을 **떼어내 그대로 실행**한다 — 손으로 옮겨 적으면 코드 검증이 아니다.
//    (test-nocard.mjs · test-note-links.mjs 와 같은 방식)
// ⚠️ 읽기 전용이다. SELECT 하나만 돌리고 아무것도 쓰지 않는다.
//
// 사용법: node scripts/test-status-comment.mjs
//   .env.local 의 SUPABASE_ACCESS_TOKEN 이 필요하다(run-sql.js 와 동일).
import fs from "fs";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";
import { execFileSync } from "child_process";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// ── ① App.js 에서 계산 블록만 떼어낸다 ─────────────────────────────────────
const HEAD = "// ⛳ 현재상태-자동표시 계산 시작";
const TAIL = "// ⛳ 현재상태-자동표시 계산 끝";
const src = fs.readFileSync(path.join(ROOT, "src/App.js"), "utf8");
const s = src.indexOf(HEAD), e = src.indexOf(TAIL);
if (s < 0 || e < 0 || e < s) {
  console.error("❌ App.js 에서 '⛳ 현재상태-자동표시 계산' 블록을 못 찾았습니다 (마커가 바뀌었나요?)");
  process.exit(1);
}
const block = src.slice(s + HEAD.length, e);
console.log("── App.js 에서 떼어낸 소스 " + block.trim().split("\n").length + "줄 ──");
const api = new Function(block + "\nreturn { STATUS_COMM_TYPES, stripLeadingTag, statusCommentDate, buildStatusAutoMap };")();
const { STATUS_COMM_TYPES, stripLeadingTag, statusCommentDate, buildStatusAutoMap } = api;

let pass = 0, fail = 0;
const check = (name, ok, detail) => {
  if (ok) { pass++; console.log("  ✅ " + name); }
  else { fail++; console.log("  ❌ " + name + " — " + (detail == null ? "" : detail)); }
};

// ── ② 순수 단위 검사 (DB 없이) ──────────────────────────────────────────────
console.log("\n[A] stripLeadingTag — chat_memo 의 선두 @업체명만 떼어낸다");
check("선두 태그를 떼어낸다",
  stripLeadingTag("@달성종합중기(지원중기) 2026.8 거주지 가압류", "달성종합중기(지원중기)") === "2026.8 거주지 가압류",
  JSON.stringify(stripLeadingTag("@달성종합중기(지원중기) 2026.8 거주지 가압류", "달성종합중기(지원중기)")));
check("태그가 없으면 그대로", stripLeadingTag("압류 들어옴", "달성종합중기") === "압류 들어옴");
check("다른 업체 태그는 안 건드린다",
  stripLeadingTag("@다른업체 메모", "달성종합중기") === "@다른업체 메모");
check("접두 과매칭을 막는다(이름 뒤가 글자면 그대로)",
  stripLeadingTag("@달성종합중기상사 메모", "달성종합중기") === "@달성종합중기상사 메모",
  JSON.stringify(stripLeadingTag("@달성종합중기상사 메모", "달성종합중기")));
check("태그만 있고 본문이 없으면 원문을 남긴다",
  stripLeadingTag("@달성종합중기", "달성종합중기") === "@달성종합중기");
check("업체명이 비어도 안 터진다", stripLeadingTag("@무언가 메모", "") === "@무언가 메모");
check("null 입력에도 안 터진다", stripLeadingTag(null, null) === "");
check("앞뒤 공백을 정리한다", stripLeadingTag("  @달성종합중기  압류  ", "달성종합중기") === "압류",
  JSON.stringify(stripLeadingTag("  @달성종합중기  압류  ", "달성종합중기")));

console.log("\n[B] STATUS_COMM_TYPES — 사람이 직접 쓴 것만");
check("사람이 쓴 3종뿐이다",
  JSON.stringify(STATUS_COMM_TYPES.slice().sort()) === JSON.stringify(["chat_memo", "manual_memo", "quick_memo"]),
  JSON.stringify(STATUS_COMM_TYPES));
["note_auto", "pipeline_move", "stage_change", "assignee_change", "issue_update", "action_update"].forEach(t => {
  check("제외: " + t, STATUS_COMM_TYPES.indexOf(t) < 0);
});

console.log("\n[C] statusCommentDate");
check("M/D 로 줄인다", statusCommentDate("2026-08-13T02:33:53Z").split("/").length === 2,
  statusCommentDate("2026-08-13T02:33:53Z"));
check("빈 값은 빈 문자열", statusCommentDate(null) === "" && statusCommentDate("") === "");
check("이상한 값도 빈 문자열", statusCommentDate("뭔가아님") === "");

console.log("\n[D] buildStatusAutoMap — 기업당 최신 1건씩");
{
  const m = buildStatusAutoMap([
    { company_id: "A", log_type: "chat_memo", memo: "옛날", logged_by: "갑", created_at: "2026-01-01T00:00:00Z" },
    { company_id: "A", log_type: "manual_memo", memo: "최신", logged_by: "을", created_at: "2026-08-01T00:00:00Z" },
    { company_id: "A", log_type: "pipeline_move", memo: "카드 이동", logged_by: "병", created_at: "2026-09-01T00:00:00Z" },
    { company_id: "A", log_type: "note_auto", memo: "노트 완료", logged_by: "정", created_at: "2026-09-02T00:00:00Z" },
  ], [
    { company_id: "A", item_text: "링크 옛날", author: "무", at: "2026-02-01T00:00:00Z" },
    { company_id: "A", item_text: "링크 최신", author: "기", at: "2026-07-01T00:00:00Z" },
  ]);
  const a = m.get("A");
  check("소통내역은 최신 1건", a && a.comm && a.comm.text === "최신", a && a.comm && a.comm.text);
  check("소통내역 작성자를 싣는다", a && a.comm && a.comm.by === "을");
  check("pipeline_move 가 안 섞인다", a && a.comm && a.comm.text !== "카드 이동");
  check("note_auto 가 안 섞인다", a && a.comm && a.comm.text !== "노트 완료");
  check("업무노트 줄은 최신 1건", a && a.note && a.note.text === "링크 최신", a && a.note && a.note.text);
  check("업무노트 작성자를 싣는다", a && a.note && a.note.by === "기");
  check("iso 를 같이 싣는다", a && a.comm && a.comm.iso === "2026-08-01T00:00:00Z");
}
{
  // ⚠️ 입력 순서가 최신순이어도 결과가 같아야 한다(fetchAllRows 는 오름차순으로 준다)
  const asc = buildStatusAutoMap([
    { company_id: "S", log_type: "chat_memo", memo: "옛날", logged_by: "갑", created_at: "2026-01-01T00:00:00Z" },
    { company_id: "S", log_type: "chat_memo", memo: "최신", logged_by: "을", created_at: "2026-08-01T00:00:00Z" },
  ], []);
  const desc = buildStatusAutoMap([
    { company_id: "S", log_type: "chat_memo", memo: "최신", logged_by: "을", created_at: "2026-08-01T00:00:00Z" },
    { company_id: "S", log_type: "chat_memo", memo: "옛날", logged_by: "갑", created_at: "2026-01-01T00:00:00Z" },
  ], []);
  check("입력 정렬이 달라도 결과가 같다",
    asc.get("S").comm.text === "최신" && desc.get("S").comm.text === "최신",
    asc.get("S").comm.text + " / " + desc.get("S").comm.text);
}
{
  const m = buildStatusAutoMap([
    { company_id: "B", log_type: "chat_memo", memo: "지워짐", logged_by: "갑", created_at: "2026-08-01T00:00:00Z", deleted_at: "2026-08-02T00:00:00Z" },
  ], [
    { company_id: "B", item_text: "지워진 링크", author: "을", at: "2026-08-01T00:00:00Z", deleted_at: "2026-08-02T00:00:00Z" },
  ]);
  check("휴지통 행은 안 들어간다", !m.get("B"), JSON.stringify(m.get("B")));
}
{
  const m = buildStatusAutoMap([
    { company_id: "C", log_type: "chat_memo", memo: "   ", logged_by: "갑", created_at: "2026-08-01T00:00:00Z" },
    { company_id: null, log_type: "chat_memo", memo: "주인 없음", logged_by: "갑", created_at: "2026-08-01T00:00:00Z" },
  ], []);
  check("빈 본문은 안 들어간다", !m.get("C"));
  check("company_id 없는 행은 안 들어간다", m.size === 0, "size=" + m.size);
}
{
  const m = buildStatusAutoMap([
    { company_id: "D", log_type: "chat_memo", memo: "담당자만 있음", assignee: "을", created_at: "2026-08-01T00:00:00Z" },
  ], []);
  check("logged_by 가 없으면 assignee 로 대체", m.get("D") && m.get("D").comm.by === "을",
    m.get("D") && m.get("D").comm.by);
}
check("빈 입력에도 안 터진다", buildStatusAutoMap(null, null).size === 0);

// ── ③ 실제 DB 로 대조 (읽기 전용 SELECT 1개) ────────────────────────────────
const sql = `
select json_build_object(
  'logs',  (select coalesce(json_agg(json_build_object(
              'company_id',company_id,'log_type',log_type,'memo',memo,
              'logged_by',logged_by,'assignee',assignee,'created_at',created_at)),'[]'::json)
            from public.activity_logs
           where deleted_at is null and log_type in ('manual_memo','quick_memo','chat_memo')),
  'links', (select coalesce(json_agg(json_build_object(
              'company_id',company_id,'item_text',item_text,'author',author,'at',at)),'[]'::json)
            from public.note_company_links where deleted_at is null),
  'cardCompanies', (select coalesce(json_agg(distinct pc.company_id),'[]'::json)
                      from public.pipeline_cards pc
                      join public.companies co on co.id = pc.company_id and co.deleted_at is null
                     where pc.deleted_at is null and pc.company_id is not null),
  'expectedCovered', (select count(*) from (
        select distinct pc.company_id as id
          from public.pipeline_cards pc
          join public.companies co on co.id = pc.company_id and co.deleted_at is null
         where pc.deleted_at is null and pc.company_id is not null) l
      where exists (select 1 from public.activity_logs a
                     where a.company_id=l.id and a.deleted_at is null
                       and a.log_type in ('manual_memo','quick_memo','chat_memo'))
         or exists (select 1 from public.note_company_links n
                     where n.company_id=l.id and n.deleted_at is null)),
  'dalseong', (select json_build_object('id',id,'name',name)
                 from public.companies
                where name like '%달성종합중기%' and deleted_at is null limit 1)
) as payload;
`;
const tmp = path.join(os.tmpdir(), "status-comment-check-" + process.pid + ".sql");
fs.writeFileSync(tmp, sql);
let raw;
try {
  raw = execFileSync("node", [path.join(ROOT, "scripts/run-sql.js"), tmp], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
} catch (err) {
  console.error("❌ DB 조회 실패 — .env.local 의 SUPABASE_ACCESS_TOKEN 을 확인하세요.");
  console.error(String((err && err.stdout) || (err && err.message) || err).slice(-400));
  process.exit(1);
} finally { try { fs.unlinkSync(tmp); } catch (_) { } }
if (raw.indexOf("[") < 0) { console.error("❌ 조회 결과를 못 읽었습니다:\n" + raw.slice(-400)); process.exit(1); }
const { logs, links, cardCompanies, expectedCovered, dalseong } = JSON.parse(raw.slice(raw.indexOf("[")))[0].payload;

console.log(`\n[E] 실제 DB — 소통내역 ${logs.length}행 · 태그링크 ${links.length}행 · 카드 기업 ${cardCompanies.length}개`);
const map = buildStatusAutoMap(logs, links);
const covered = cardCompanies.filter(id => map.get(id)).length;
check("자동표시가 뜨는 기업 수가 SQL 기대값과 일치",
  covered === Number(expectedCovered), `JS ${covered} vs SQL ${expectedCovered}`);
check("자동표시 대상 log_type 이 3종을 벗어나지 않는다",
  logs.every(l => STATUS_COMM_TYPES.indexOf(l.log_type) >= 0),
  JSON.stringify([...new Set(logs.map(l => l.log_type))]));
check("달성종합중기가 조회된다", !!(dalseong && dalseong.id), JSON.stringify(dalseong));
if (dalseong && dalseong.id) {
  const d = map.get(dalseong.id);
  check("달성종합중기에 소통내역이 잡힌다", !!(d && d.comm), JSON.stringify(d));
  if (d && d.comm) {
    const shown = stripLeadingTag(d.comm.text, dalseong.name);
    console.log("     → 카드에 뜰 문구: " + JSON.stringify(shown) + "  (" + d.comm.by + " · " + statusCommentDate(d.comm.iso) + ")");
    check("선두 @태그가 제거된 채로 나온다", shown.charAt(0) !== "@", shown);
    check("가압류 내용이 들어 있다", shown.indexOf("가압류") >= 0, shown);
  }
}

console.log(`\n결과: ${pass}/${pass + fail} 통과`);
process.exit(fail ? 1 : 0);
