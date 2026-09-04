# 파이프라인 카드 「현재 상태」 코멘트 — 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 파이프라인 보드의 기업 카드에 "현재 상태" 한 줄을 띄운다 — 사람이 직접 쓰면 그 문구가, 안 쓰면 그 기업의 최신 소통내역·업무노트 태그가 자동으로 뜬다.

**Architecture:** `companies` 에 컬럼 3개(`status_comment` / `_at` / `_by`)를 더한다. 자동표시는 파이프라인 진입 시 `fetchAllRows` 2회로 `activity_logs`(사람이 쓴 3종만) + `note_company_links` 를 받아 **순수 함수 `buildStatusAutoMap`** 이 기업별 최신 1건씩으로 접는다. 저장은 기존 `MemoEditModal` + 기존 `onPatchCompany` 패턴 + 기존 `writeGuarded` 를 그대로 쓴다 — **새 저장 경로 0개.**

**Tech Stack:** React 17 (클래스 없음, 인라인 스타일만) · Supabase(PostgREST) · `react-scripts` 빌드 · 테스트는 `node` 단독 스크립트(`scripts/*.mjs`) · SQL 은 `node scripts/run-sql.js <파일>`

**Spec:** `docs/superpowers/specs/2026-09-04-pipeline-comment-design.md`

## Global Constraints

- **브랜치는 `feat/pipeline-comment` 하나만 쓴다.** `feat/worknote-timeline-sync` · `feat/agency-directory` · `feat/announcement-matching` · `feat/growth-roadmap` 는 **건드리지 않는다.**
- **기존 코드는 이 기능에 필요한 것 외에 한 줄도 수정하지 않는다.** 특히 `pipelineCardData` · `moveCards` · `syncPipelineFromCase` · `resyncAutoCards` · `toggleSyncMode` · `advanceCardsToContractPaid` · 카드 이동/삭제/종결/기타사유 로직은 **읽기만 하고 수정 금지.**
- **전체를 받아야 하는 조회는 `fetchAllRows(table, cols, opts)` 만 쓴다.** `.select()` 직접 호출은 PostgREST 1000행 상한에 **에러 없이 조용히 잘린다**(CLAUDE.md 2-5). `opts.orderBy`/`tieBreak` 기본값(`created_at` → `id` 오름차순)을 바꾸지 않는다.
- **자동표시에 쓸 `activity_logs.log_type` 은 `manual_memo` · `quick_memo` · `chat_memo` 셋뿐이다.** `note_auto` · `pipeline_move` · `stage_change` · `assignee_change` · `issue_update` · `action_update` 는 **넣지 않는다**(D2).
- **두 테이블을 잇는 키는 `company_id` 뿐이다.** 사업자명으로 잇는 코드를 새로 만들지 않는다(CLAUDE.md 2절 — `business_name` 18%에 작업 메모가 붙어 있다).
- **카드 안 버튼에는 `stopPropagation` 이 필수다.** 카드 `onClick` 이 기업상세를 연다(`src/App.js:12551`).
- **CSS 미디어쿼리를 쓰지 않는다.** 이 저장소는 인라인 스타일뿐이다.
- 새 SQL 파일은 항상 3종 세트: `<이름>.sql` · `<이름>_rollback.sql` · `<이름>_검증.sql` (저장소 루트).
- **SQL 검증은 실행 파일에 딸린 SELECT 를 믿지 않는다 — 실행 후 별도 파일로 다시 조회한다**(CLAUDE.md 2-2). `run-sql.js` 는 결과를 하나만 찍으므로 **한 파일에 SELECT 하나씩.**
- 커밋 메시지 끝에 반드시:
  ```
  Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_01K1tKrSVi9PCNsVfBGDfX9V
  ```

---

## File Structure

| 파일 | 책임 | 상태 |
|---|---|---|
| `파이프라인_현재상태_코멘트_컬럼추가.sql` | `companies` 컬럼 3개 추가 | 신규 |
| `파이프라인_현재상태_코멘트_컬럼추가_rollback.sql` | 컬럼 3개 제거 | 신규 |
| `파이프라인_현재상태_코멘트_컬럼추가_검증.sql` | 컬럼 존재 + RLS + anon 권한 확인 (SELECT 1개) | 신규 |
| `scripts/test-status-comment.mjs` | App.js 소스에서 계산 블록을 **떼어내** 실제 DB 덤프로 실행 | 신규 |
| `src/App.js` — `memoPreview` 바로 아래(현재 `:14438`) | 순수 계산 블록: `STATUS_COMM_TYPES` · `stripLeadingTag` · `statusCommentDate` · `buildStatusAutoMap` | 추가 |
| `src/App.js` — `PipelineView` 시그니처(`:11613`) · 진입 useEffect(`:11621` 뒤) | 자동표시 데이터 로드 + `onPatchCompany` prop 수령 | 추가 |
| `src/App.js` — `PipelineView` 렌더(`:9079`) | `onPatchCompany` prop 전달 | 1줄 수정 |
| `src/App.js` — 카드 서류% 바 뒤(`:12601` 뒤) | 「현재 상태」 블록 렌더 | 추가 |
| `src/App.js` — 모달 묶음(`:12349` 뒤) | `MemoEditModal` 연결 | 추가 |
| `CLAUDE.md` | 재발방지 규칙 절 추가 | 추가 |

> ⚠️ 줄 번호는 **작업 시작 시점(커밋 `f0bd863`) 기준**이다. 앞 Task 가 줄을 늘리면 뒤 Task 의 번호가 밀린다 — **번호가 아니라 앵커 문자열로 찾을 것.**

---

## Task 1: DB 컬럼 3개 추가

**Files:**
- Create: `파이프라인_현재상태_코멘트_컬럼추가.sql`
- Create: `파이프라인_현재상태_코멘트_컬럼추가_rollback.sql`
- Create: `파이프라인_현재상태_코멘트_컬럼추가_검증.sql`

**Interfaces:**
- Consumes: 없음 (첫 작업)
- Produces: `public.companies` 에 컬럼 `status_comment text` · `status_comment_at timestamptz` · `status_comment_by text`. Task 3·4 가 이 이름을 그대로 읽고 쓴다.

- [ ] **Step 1: 적용 전 상태를 먼저 떠 둔다 (조회 전용)**

`C:\Users\kimya\AppData\Local\Temp\claude\...\scratchpad\before.sql` 에 저장하고 실행:

```sql
select count(*) as companies_live,
       count(*) filter (where coalesce(btrim(issue),'') <> '') as issue_filled
  from public.companies where deleted_at is null;
```

Run: `node scripts/run-sql.js <위 파일 절대경로>`
Expected: 숫자 2개가 찍힌다. **이 값을 적어 둔다** — Step 6 에서 안 변했는지 대조한다.

- [ ] **Step 2: 적용 SQL 을 쓴다**

`파이프라인_현재상태_코멘트_컬럼추가.sql`:

```sql
-- 파이프라인 카드 「현재 상태」 코멘트 (2026-09-04)
--   설계서: docs/superpowers/specs/2026-09-04-pipeline-comment-design.md
--
-- 기존 테이블 companies 에 컬럼만 더한다. 새 테이블이 아니므로
-- RLS 정책·트리거·GRANT 는 이미 붙어 있는 것이 그대로 적용된다(CLAUDE.md 2-2).
--   · status_comment    — 사람이 직접 쓴 "현재 상태" 문구. null/공백이면 자동표시로 돌아간다.
--   · status_comment_at — 언제 썼나 (자동표시 줄이 날짜를 달고 나오므로 수동 문구에도 필요)
--   · status_comment_by — 누가 썼나
--
-- ⚠️ companies.issue(현재 이슈)와 다른 칸이다. issue 는 2026-09-04 실측으로
--    카드 있는 기업 401개 중 237개에 이미 평균 68자(최대 786자)가 들어 있다.
alter table public.companies
  add column if not exists status_comment    text,
  add column if not exists status_comment_at timestamptz,
  add column if not exists status_comment_by text;

comment on column public.companies.status_comment    is '파이프라인 카드 「현재 상태」 수동 문구. 비어 있으면 최신 소통내역·업무노트 태그를 자동표시한다.';
comment on column public.companies.status_comment_at is '「현재 상태」 문구를 마지막으로 저장한 시각';
comment on column public.companies.status_comment_by is '「현재 상태」 문구를 마지막으로 저장한 사람 이름';
```

- [ ] **Step 3: 되돌리기 SQL 을 쓴다**

`파이프라인_현재상태_코멘트_컬럼추가_rollback.sql`:

```sql
-- 되돌리기 — 파이프라인 「현재 상태」 코멘트 컬럼 3개 제거 (2026-09-04)
-- ⚠️ 사람이 적어 둔 문구가 같이 사라진다. 지우기 전에 아래로 백업할 것:
--   select id, name, status_comment, status_comment_at, status_comment_by
--     from public.companies where coalesce(btrim(status_comment),'') <> '';
alter table public.companies
  drop column if exists status_comment,
  drop column if exists status_comment_at,
  drop column if exists status_comment_by;
```

- [ ] **Step 4: 검증 SQL 을 쓴다 (SELECT 하나만)**

`파이프라인_현재상태_코멘트_컬럼추가_검증.sql`:

```sql
-- 검증 — 컬럼 3개가 생겼나 · RLS 는 켜져 있나 · anon 권한은 0인가
-- ⚠️ run-sql.js 는 결과를 하나만 찍는다 → SELECT 를 하나로 합쳤다.
select
  (select count(*) from information_schema.columns
    where table_schema='public' and table_name='companies'
      and column_name in ('status_comment','status_comment_at','status_comment_by'))  as new_cols,      -- 3 이어야 정상
  (select string_agg(column_name || ':' || data_type, ', ' order by column_name)
     from information_schema.columns
    where table_schema='public' and table_name='companies'
      and column_name in ('status_comment','status_comment_at','status_comment_by'))  as new_col_types,
  (select relrowsecurity from pg_class
    where oid = 'public.companies'::regclass)                                          as rls_on,        -- true 여야 정상
  (select count(*) from information_schema.role_table_grants
    where table_schema='public' and table_name='companies' and grantee='anon')         as anon_grants,   -- 0 이어야 정상
  (select count(*) from pg_policy where polrelid='public.companies'::regclass)         as policies;      -- 1 이상
```

- [ ] **Step 5: 적용한다**

Run: `node scripts/run-sql.js 파이프라인_현재상태_코멘트_컬럼추가.sql`
Expected: `✅ 실행 성공.`

- [ ] **Step 6: 검증한다 — 실행 파일이 아니라 별도 파일로 (CLAUDE.md 2-2)**

Run: `node scripts/run-sql.js 파이프라인_현재상태_코멘트_컬럼추가_검증.sql`
Expected:
```
new_cols      = 3
new_col_types = status_comment:text, status_comment_at:timestamp with time zone, status_comment_by:text
rls_on        = true
anon_grants   = 0
policies      >= 1
```

그리고 Step 1 의 `before.sql` 을 **다시 실행**해 `companies_live` · `issue_filled` 가 **Step 1 과 같은 값**인지 확인한다.
❌ 하나라도 다르면 rollback 을 돌리고 멈춘다.

- [ ] **Step 7: 커밋**

```bash
git add 파이프라인_현재상태_코멘트_컬럼추가.sql 파이프라인_현재상태_코멘트_컬럼추가_rollback.sql 파이프라인_현재상태_코멘트_컬럼추가_검증.sql
git commit -F - <<'EOF'
feat(파이프라인코멘트): 🗄 companies 에 현재 상태 코멘트 컬럼 3개 추가

status_comment / _at / _by. 기존 테이블이라 RLS·GRANT 신규 작업 0건.
검증(별도 파일): 컬럼 3/3 · RLS on · anon GRANT 0 · 정책 1 이상.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01K1tKrSVi9PCNsVfBGDfX9V
EOF
```

---

## Task 2: 순수 계산 함수 + 테스트 (TDD)

**Files:**
- Modify: `src/App.js` — `memoPreview` 함수가 끝나는 `}` 바로 아래 (앵커: `function memoPreview(v, max) {`)
- Create: `scripts/test-status-comment.mjs`

**Interfaces:**
- Consumes: Task 1 의 컬럼 (여기선 안 읽는다 — 순수 계산만)
- Produces:
  - `STATUS_COMM_TYPES` : `string[]` = `["manual_memo","quick_memo","chat_memo"]`
  - `stripLeadingTag(text: string, coName: string) => string`
  - `statusCommentDate(iso: string|null) => string` — `"8/13"` 꼴, 못 읽으면 `""`
  - `buildStatusAutoMap(logs: object[], links: object[]) => Map<string, {comm: Slot|null, note: Slot|null}>`
    - `Slot = { text: string, by: string, at: number, iso: string|null }` (`at` 은 `Date.parse` 밀리초)

  Task 3 이 `buildStatusAutoMap` 을, Task 4 가 나머지 셋을 쓴다.

- [ ] **Step 1: 실패하는 테스트를 쓴다**

`scripts/test-status-comment.mjs` 전문:

```js
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
const { STATUS_COMM_TYPES, stripLeadingTag, buildStatusAutoMap } = api;

let pass = 0, fail = 0;
const check = (name, ok, detail) => {
  if (ok) { pass++; console.log("  ✅ " + name); }
  else { fail++; console.log("  ❌ " + name + " — " + (detail || "")); }
};

// ── ② 순수 단위 검사 (DB 없이) ──────────────────────────────────────────────
console.log("\n[A] stripLeadingTag");
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

console.log("\n[B] STATUS_COMM_TYPES");
check("사람이 쓴 3종뿐이다",
  JSON.stringify(STATUS_COMM_TYPES.slice().sort()) === JSON.stringify(["chat_memo","manual_memo","quick_memo"]),
  JSON.stringify(STATUS_COMM_TYPES));
["note_auto","pipeline_move","stage_change","assignee_change","issue_update","action_update"].forEach(t => {
  check("제외: " + t, STATUS_COMM_TYPES.indexOf(t) < 0);
});

console.log("\n[C] buildStatusAutoMap — 최신 1건 고르기");
{
  const m = buildStatusAutoMap([
    { company_id: "A", log_type: "chat_memo",  memo: "옛날",  logged_by: "갑", created_at: "2026-01-01T00:00:00Z" },
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
  check("company_id 없는 행은 안 들어간다", !m.get(null) && m.size === 0, "size=" + m.size);
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
} finally { try { fs.unlinkSync(tmp); } catch (_) {} }
if (raw.indexOf("[") < 0) { console.error("❌ 조회 결과를 못 읽었습니다:\n" + raw.slice(-400)); process.exit(1); }
const { logs, links, cardCompanies, expectedCovered, dalseong } = JSON.parse(raw.slice(raw.indexOf("[")))[0].payload;

console.log(`\n[D] 실제 DB — 소통내역 ${logs.length}행 · 태그링크 ${links.length}행 · 카드 기업 ${cardCompanies.length}개`);
const map = buildStatusAutoMap(logs, links);
const covered = cardCompanies.filter(id => map.get(id)).length;
check("자동표시가 뜨는 기업 수가 SQL 기대값과 일치",
  covered === Number(expectedCovered), `JS ${covered} vs SQL ${expectedCovered}`);
check("달성종합중기가 조회된다", !!(dalseong && dalseong.id), JSON.stringify(dalseong));
if (dalseong && dalseong.id) {
  const d = map.get(dalseong.id);
  check("달성종합중기에 소통내역이 잡힌다", !!(d && d.comm), JSON.stringify(d));
  if (d && d.comm) {
    const shown = stripLeadingTag(d.comm.text, dalseong.name);
    console.log("     → 카드에 뜰 문구: " + JSON.stringify(shown) + "  (" + d.comm.by + ")");
    check("선두 @태그가 제거된 채로 나온다", shown.charAt(0) !== "@", shown);
    check("가압류 내용이 들어 있다", shown.indexOf("가압류") >= 0, shown);
  }
}
check("자동표시 대상 log_type 이 3종을 벗어나지 않는다",
  logs.every(l => STATUS_COMM_TYPES.indexOf(l.log_type) >= 0),
  JSON.stringify([...new Set(logs.map(l => l.log_type))]));

console.log(`\n결과: ${pass}/${pass + fail} 통과`);
process.exit(fail ? 1 : 0);
```

- [ ] **Step 2: 테스트를 돌려 실패하는지 확인한다**

Run: `node scripts/test-status-comment.mjs`
Expected: FAIL —
```
❌ App.js 에서 '⛳ 현재상태-자동표시 계산' 블록을 못 찾았습니다 (마커가 바뀌었나요?)
```
(종료 코드 1)

- [ ] **Step 3: 최소 구현을 넣는다**

`src/App.js` 에서 앵커를 찾는다:

```js
// 📝 표 한 줄에 보여줄 미리보기 — 줄바꿈은 공백으로 접고 앞부분만.
function memoPreview(v, max) {
  var t = String(v == null ? "" : v).replace(/\s+/g, " ").trim();
  if (!t) return "";
  var n = max || 40;
  return t.length > n ? t.slice(0, n) + "…" : t;
}
```

이 함수의 닫는 `}` **바로 아래**에 다음을 통째로 삽입한다(위 코드는 수정하지 않는다):

```js

// ── 🎯 파이프라인 카드 「현재 상태」 코멘트 — 자동표시 계산 ────────────────────
// 설계서: docs/superpowers/specs/2026-09-04-pipeline-comment-design.md
//
// ⚠️ 아래 두 마커 사이는 `scripts/test-status-comment.mjs` 가 **소스째 떼어내 실행**한다.
//    supabase·React 를 절대 참조하지 말 것 — 순수 계산만 둔다. 참조하는 순간 테스트가 못 돈다.
// ⛳ 현재상태-자동표시 계산 시작
// 자동표시에 쓸 activity_logs 종류 — **사람이 직접 쓴 것만.**
// ⚠️ note_auto 를 넣지 말 것. 그건 업무노트 항목을 **완료 체크할 때** 자동으로 남는 기록이라
//    "지금 상태"가 아니다(2026-09-04 결정 D2).
// ⚠️ pipeline_move·stage_change·assignee_change 도 넣지 말 것. 2026-09-04 실측으로
//    필터 없이 최신 1건을 고르면 카드 기업 145/331(44%)에
//    "소진공 카드를 '상담/진단완료' → '기관신청대기/방문예정'(으)로 이동" 이 뜬다.
// ⚠️ issue_update·status_change·action_update 는 애초에 company_id 가 전 행 비어 있어 못 잇는다.
var STATUS_COMM_TYPES = ["manual_memo", "quick_memo", "chat_memo"];

// 선두 "@업체명" 만 떼어낸다. chat_memo 는 "@달성종합중기(지원중기) 2026.8 거주지 가압류" 처럼 저장된다.
// ⚠️ taggedCompanyRefs / findTaggedCompanies 를 쓰지 않는다 — 저건 본문 전체에서 태그를 찾는
//    매처라 목적이 다르고, 후자는 접두 과매칭이 있는 채팅 전용이다(CLAUDE.md 🕒 절).
//    여기 필요한 건 "이 줄이 이 회사 이름으로 시작하면 그만큼 잘라낸다" 뿐이다.
function stripLeadingTag(text, coName) {
  var t = String(text == null ? "" : text).trim();
  var n = String(coName == null ? "" : coName).trim();
  if (!n || t.charAt(0) !== "@") return t;
  if (t.slice(1, 1 + n.length) !== n) return t;
  var after = t.slice(1 + n.length);
  // 이름 바로 뒤가 글자면 **다른 업체 이름**이다(@달성종합중기상사) → 손대지 않는다.
  if (after && !/^[\s.,·:;)\]]/.test(after)) return t;
  var body = after.replace(/^[\s.,·:;]+/, "").trim();
  return body || t;   // 태그밖에 없으면 원문을 남긴다(빈 줄보다 낫다)
}

// "8/13" 꼴 짧은 날짜. 못 읽으면 빈 문자열.
function statusCommentDate(iso) {
  if (!iso) return "";
  var d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return (d.getMonth() + 1) + "/" + d.getDate();
}

// activity_logs + note_company_links → Map<company_id, { comm, note }> (기업당 최신 1건씩)
//   comm = 사람이 쓴 소통내역 · note = @기업 태그가 붙은 업무노트 항목
//   각 값: { text, by, at(ms), iso }
// ⚠️ 최신 판정을 JS 에서 한다 — fetchAllRows 의 정렬 기본값(created_at→id 오름차순)을
//    바꾸지 않기 위해서다(CLAUDE.md 2-5).
function buildStatusAutoMap(logs, links) {
  var m = new Map();
  var put = function(id, slot, row) {
    if (!id || !row.text) return;
    var cur = m.get(id);
    if (!cur) { cur = { comm: null, note: null }; m.set(id, cur); }
    if (!cur[slot] || row.at > cur[slot].at) cur[slot] = row;
  };
  (logs || []).forEach(function(l) {
    if (!l || l.deleted_at) return;
    if (STATUS_COMM_TYPES.indexOf(l.log_type) < 0) return;
    var t = Date.parse(l.created_at);
    put(l.company_id, "comm", {
      text: String(l.memo == null ? "" : l.memo).trim(),
      by: l.logged_by || l.assignee || "",
      at: isNaN(t) ? 0 : t,
      iso: l.created_at || null,
    });
  });
  (links || []).forEach(function(k) {
    if (!k || k.deleted_at) return;
    var t2 = Date.parse(k.at);
    put(k.company_id, "note", {
      text: String(k.item_text == null ? "" : k.item_text).trim(),
      by: k.author || "",
      at: isNaN(t2) ? 0 : t2,
      iso: k.at || null,
    });
  });
  return m;
}
// ⛳ 현재상태-자동표시 계산 끝
```

- [ ] **Step 4: 테스트를 돌려 통과하는지 확인한다**

Run: `node scripts/test-status-comment.mjs`
Expected: PASS — 마지막 줄이 `결과: N/N 통과`, 종료 코드 0.
`[D]` 구역에 `→ 카드에 뜰 문구: "2026.8 거주지 가압류"  (관호)` 가 찍혀야 한다.

- [ ] **Step 5: 빌드가 깨지지 않는지 확인한다**

Run: `CI=true npx react-scripts build`
Expected: `Compiled successfully` (경고는 무방, **에러 0**)

- [ ] **Step 6: 커밋**

```bash
git add src/App.js scripts/test-status-comment.mjs
git commit -F - <<'EOF'
feat(파이프라인코멘트): 🎯 현재 상태 자동표시 계산 함수 + 테스트

buildStatusAutoMap / stripLeadingTag / statusCommentDate / STATUS_COMM_TYPES.
순수 계산만 두고 supabase·React 를 안 쓴다 → 테스트가 소스째 떼어내 실행한다.

note_auto·pipeline_move·stage_change 를 넣지 않는다(D2) — 필터 없이 최신 1건을
고르면 카드 기업 145/331(44%)에 시스템 로그가 뜬다(2026-09-04 실측).

검증: node scripts/test-status-comment.mjs 전항목 통과 · 빌드 통과.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01K1tKrSVi9PCNsVfBGDfX9V
EOF
```

---

## Task 3: 파이프라인 진입 시 자동표시 데이터 로드 + prop 배선

**Files:**
- Modify: `src/App.js` — `PipelineView` 시그니처 (앵커: `function PipelineView({ cardRows, hiddenByList,`)
- Modify: `src/App.js` — 그 바로 아래 카드 최신화 `useEffect` 뒤
- Modify: `src/App.js` — `PipelineView` 렌더 1줄 (앵커: `{view === "pipeline" && <PipelineView cardRows={pipelineCardRows}`)

**Interfaces:**
- Consumes: Task 2 의 `buildStatusAutoMap(logs, links)`
- Produces:
  - `PipelineView` 지역 상태 `statusAuto` : `Map | null` (null = 아직 로딩 중)
  - `PipelineView` prop `onPatchCompany(id, patch)` — Task 4 의 저장이 쓴다

- [ ] **Step 1: PipelineView 가 prop 을 받게 한다**

앵커(한 줄):
```js
function PipelineView({ cardRows, hiddenByList, onClearListFilters, filterAssignee, setFilterAssignee, assignees, onSelect, setPipelineCards, setStagnConfig, canEditMapping, myName, stagnRows, noCardCompanies }) {
```
→ 끝의 `noCardCompanies` 뒤에 `, onPatchCompany` 만 더한다:
```js
function PipelineView({ cardRows, hiddenByList, onClearListFilters, filterAssignee, setFilterAssignee, assignees, onSelect, setPipelineCards, setStagnConfig, canEditMapping, myName, stagnRows, noCardCompanies, onPatchCompany }) {
```

- [ ] **Step 2: 호출부에서 prop 을 넘긴다**

앵커(한 줄, `view === "pipeline"` 렌더): 끝의 `noCardCompanies={companiesWithoutCard}` 뒤에 다음을 더한다.
```jsx
 onPatchCompany={function(id, patch) { setCompanies(function(prev) { return prev.map(function(c) { return c.id === id ? Object.assign({}, c, patch) : c; }); }); }}
```
⚠️ 기업상세(`CompanyModal`)의 기존 `onPatchCompany`(같은 내용)는 **건드리지 않는다.** 새로 한 줄 더할 뿐이다.

- [ ] **Step 3: 자동표시 데이터를 불러오는 useEffect 를 더한다**

앵커 — `PipelineView` 첫 `useEffect` 의 끝:
```js
    return function() { alive = false; };
  }, []);
  const [draggingId, setDraggingId] = useState(null); // 드래그 중인 카드 id(pipeline_cards.id)
```
`}, []);` 와 `const [draggingId` 사이에 삽입:

```js

  // 💬📝 카드 「현재 상태」 자동표시 — 사람이 직접 쓴 소통내역 + @기업 태그 업무노트 항목.
  // ⚠️ fetchAllRows 로 받는다. `.select()` 직접 호출은 PostgREST 1000행 상한에 **조용히** 걸린다
  //    (CLAUDE.md 2-5). 2026-09-04 실측 448 + 309 = 757행이라 지금은 안 넘지만,
  //    판단 기준은 "지금 넘느냐"가 아니라 "전체를 받아야 하는 조회냐"다.
  // ⚠️ 정렬은 기본값 그대로 두고 **최신 1건은 buildStatusAutoMap 이 JS 에서 고른다.**
  // ⚠️ 실패하면 fetchAllRows 가 📛 배너를 띄우고 data:null 을 준다 → 빈 Map 이라 자동표시만 안 뜬다.
  //    카드·단계에는 아무 영향이 없다.
  const [statusAuto, setStatusAuto] = useState(null);   // Map<company_id,{comm,note}> · null = 로딩 중
  useEffect(function() {
    var alive = true;
    Promise.all([
      fetchAllRows("activity_logs", "id, company_id, log_type, memo, logged_by, assignee, created_at", {
        label: "카드 현재상태(소통내역)",
        build: function(q) { return q.is("deleted_at", null).in("log_type", STATUS_COMM_TYPES); },
      }),
      fetchAllRows("note_company_links", "id, company_id, source, item_text, at, author", {
        label: "카드 현재상태(업무노트 태그)",
        build: function(q) { return q.is("deleted_at", null); },
      }),
    ]).then(function(res) {
      if (!alive) return;
      setStatusAuto(buildStatusAutoMap((res[0] && res[0].data) || [], (res[1] && res[1].data) || []));
    });
    return function() { alive = false; };
  }, []);
```

- [ ] **Step 4: 컬럼명 오타 점검**

Run: `node scripts/audit-select-columns.mjs`
Expected: `0건` (없는 컬럼을 select 하면 400 인데 **호출부는 조용히 지나간다** — CLAUDE.md 2-6)

- [ ] **Step 5: 빌드 확인**

Run: `CI=true npx react-scripts build`
Expected: `Compiled successfully`, 에러 0

- [ ] **Step 6: 커밋**

```bash
git add src/App.js
git commit -F - <<'EOF'
feat(파이프라인코멘트): 🔌 보드 진입 시 자동표시 데이터 로드 + onPatchCompany 배선

fetchAllRows 2회(활동로그 3종 448행 · 태그링크 309행) → buildStatusAutoMap.
정렬 기본값을 안 바꾸고 최신 1건은 JS 에서 고른다(CLAUDE.md 2-5).
기업상세의 기존 onPatchCompany 는 안 건드리고 파이프라인용으로 한 줄만 더했다.

검증: audit-select-columns 0건 · 빌드 통과.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01K1tKrSVi9PCNsVfBGDfX9V
EOF
```

---

## Task 4: 카드 UI — 「현재 상태」 블록 + 편집 모달

**Files:**
- Modify: `src/App.js` — 카드 서류% 바 블록 뒤 (앵커: `<span style={{ fontSize: 9, color: "#AAA", flexShrink: 0 }}>서류 {docPct}%</span>`)
- Modify: `src/App.js` — 모달 묶음 (앵커: `{reasonEdit && <OtherReasonModal row={reasonEdit}`)
- Modify: `src/App.js` — `PipelineView` 상태 선언부 (Task 3 이 넣은 `statusAuto` 바로 아래)

**Interfaces:**
- Consumes: Task 2 의 `stripLeadingTag` · `statusCommentDate` · `memoPreview`(기존) / Task 3 의 `statusAuto` · `onPatchCompany` / 기존 `MemoEditModal` · `writeGuarded`
- Produces: 사용자에게 보이는 최종 기능. 뒤 Task 가 의존하는 심볼 없음.

- [ ] **Step 1: 편집 상태 + 저장 함수를 더한다**

Task 3 이 넣은 `statusAuto` useEffect 의 `}, []);` 바로 아래에 삽입:

```js

  // ✎ 「현재 상태」 수동 문구 — 저장은 companies 한 곳. **새 저장 경로를 만들지 않는다.**
  // ⚠️ 기업 단위다(2026-09-04 결정 D1). 저장하면 companyById → pipelineCardData 가 다시 계산돼
  //    그 기업 카드 2~6장이 한꺼번에 바뀐다. 카드 단위 덮어쓰기는 이번 범위 밖이다.
  // ⚠️ 빈칸으로 저장하면 세 컬럼 모두 null → 자동표시로 돌아간다(요구사항 4).
  const [commentEdit, setCommentEdit] = useState(null);   // 편집 중인 기업 co | null
  var saveStatusComment = async function(co, text) {
    var t = String(text == null ? "" : text).trim();
    var patch = t
      ? { status_comment: t, status_comment_at: new Date().toISOString(), status_comment_by: myName || null }
      : { status_comment: null, status_comment_at: null, status_comment_by: null };
    setCommentEdit(null);
    // writeGuarded 재시도 큐를 그대로 쓴다 — 저장 뒤에 딸린 연동이 없다(CLAUDE.md 2-7 해당 없음).
    var r = await writeGuarded({
      table: "companies", op: "update", id: co.id, payload: patch,
      label: (co.name || "업체") + " 현재 상태",
    });
    if (r && r.ok && onPatchCompany) onPatchCompany(co.id, patch);
  };
```

- [ ] **Step 2: 카드에 블록을 그린다**

앵커 — 서류% 바가 끝나는 곳:
```jsx
                        <span style={{ fontSize: 9, color: "#AAA", flexShrink: 0 }}>서류 {docPct}%</span>
                      </div>

                      {/* 폐지 단계(STEP11/12)에서 옮겨온 카드 — 담당자 확인 후 재배치 */}
```
`</div>` 와 `{/* 폐지 단계 …` 사이에 삽입:

```jsx

                      {/* 🎯 현재 상태 — 수동 문구가 있으면 그것, 없으면 최신 소통내역·업무노트 태그.
                          ⚠️ 기업 단위라 같은 기업 카드 2~6장에 같은 내용이 뜬다(결정 D1).
                          ⚠️ 둘 다 없으면 아무것도 안 그린다 — 빈 자리를 만들면 보드 밀도가 무너진다
                             (2026-09-04 실측 카드 51%가 여기 해당). */}
                      {(function() {
                        var manual = String(co.status_comment == null ? "" : co.status_comment).trim();
                        var auto = statusAuto ? statusAuto.get(co.id) : null;
                        var comm = (!manual && auto && auto.comm) ? auto.comm : null;
                        var note = (!manual && auto && auto.note) ? auto.note : null;
                        if (!manual && !comm && !note) return null;
                        // ⚠️ stopPropagation 필수 — 카드 onClick 이 기업상세를 연다.
                        var openEdit = function(e) { e.stopPropagation(); setCommentEdit(co); };
                        var lineStyle = {
                          display: "flex", gap: 4, alignItems: "baseline", fontSize: 9, color: "#6B7280",
                          lineHeight: 1.4, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis",
                        };
                        if (manual) {
                          return (
                            <div onClick={openEdit} title={manual + (co.status_comment_by ? "\n\n— " + co.status_comment_by : "") + " (클릭하면 수정)"}
                              style={{ marginTop: 6, background: "#EFF6FF", borderLeft: "3px solid #3B82F6",
                                borderRadius: 5, padding: "5px 7px", cursor: "pointer" }}>
                              <div style={{ fontSize: 10, fontWeight: 700, color: "#1D4ED8", lineHeight: 1.4,
                                display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                                ✎ {manual}
                              </div>
                              {(co.status_comment_by || co.status_comment_at) && (
                                <div style={{ fontSize: 9, color: "#60A5FA", marginTop: 2 }}>
                                  {co.status_comment_by || "-"}{co.status_comment_at ? " · " + statusCommentDate(co.status_comment_at) : ""}
                                </div>
                              )}
                            </div>
                          );
                        }
                        return (
                          <div style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 2 }}>
                            {comm && (
                              <div style={lineStyle} title={"소통내역 · " + (comm.by || "-") + "\n" + stripLeadingTag(comm.text, co.name)}>
                                <span style={{ flexShrink: 0 }}>💬</span>
                                <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis" }}>{memoPreview(stripLeadingTag(comm.text, co.name), 34)}</span>
                                <span style={{ flexShrink: 0, color: "#B8B5AE" }}>{(comm.by || "") + (comm.iso ? "·" + statusCommentDate(comm.iso) : "")}</span>
                              </div>
                            )}
                            {note && (
                              <div style={lineStyle} title={"업무노트 태그 · " + (note.by || "-") + "\n" + note.text}>
                                <span style={{ flexShrink: 0 }}>📝</span>
                                <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis" }}>{memoPreview(note.text, 34)}</span>
                                <span style={{ flexShrink: 0, color: "#B8B5AE" }}>{(note.by || "") + (note.iso ? "·" + statusCommentDate(note.iso) : "")}</span>
                              </div>
                            )}
                            <div onClick={openEdit} title="이 기업의 「현재 상태」를 직접 적습니다 (적으면 위 자동표시 대신 그 문구가 뜹니다)"
                              style={{ fontSize: 9, color: "#B8B5AE", cursor: "pointer", alignSelf: "flex-start" }}>✎ 직접 쓰기</div>
                          </div>
                        );
                      })()}
```

⚠️ JSX 삼항 안 첫 줄에 `{/* … */}` 를 넣으면 빌드가 깨진다 — 위 코드는 삼항 안이 아니라 IIFE 라 안전하다. IIFE 안 주석은 `//` 로 쓸 것(CLAUDE.md 📦 절).

- [ ] **Step 3: 편집 모달을 연결한다**

앵커 — 모달 묶음의 마지막:
```jsx
      {reasonEdit && <OtherReasonModal row={reasonEdit} onClose={function() { setReasonEdit(null); }}
        onSave={function(rid, note) { return saveOtherReason(reasonEdit, rid, note); }} />}
```
그 바로 아래에 삽입:

```jsx
      {/* ✎ 「현재 상태」 직접 쓰기 — 기존 공용 MemoEditModal 을 그대로 쓴다(CLAUDE.md 📝 절).
          ⚠️ 이 컴포넌트에 supabase 를 들이지 않는다. 값만 돌려받고 저장은 saveStatusComment 가 한다. */}
      {commentEdit && (
        <MemoEditModal
          title="🎯 현재 상태"
          subject={commentEdit.name}
          hint="비우고 저장하면 최신 소통내역·업무노트로 자동표시가 돌아갑니다"
          placeholder="예) 2026.8 거주지 가압류 — 삭제도 상담예정도 못 넣는 상태"
          initial={commentEdit.status_comment || ""}
          onSave={function(text) { saveStatusComment(commentEdit, text); }}
          onCancel={function() { setCommentEdit(null); }} />
      )}
```

- [ ] **Step 4: 빌드 확인**

Run: `CI=true npx react-scripts build`
Expected: `Compiled successfully`, 에러 0. `main.js` 증가분을 기록해 둔다.

- [ ] **Step 5: 계산 테스트가 여전히 통과하는지 확인한다**

Run: `node scripts/test-status-comment.mjs`
Expected: 전항목 통과 (Task 2 와 같은 결과 — UI 추가가 계산을 건드리지 않았음을 확인)

- [ ] **Step 6: 커밋**

```bash
git add src/App.js
git commit -F - <<'EOF'
feat(파이프라인코멘트): 🎯 카드에 「현재 상태」 표시 + 직접 쓰기

수동 문구 = 파란 박스 2줄까지 / 자동 = 💬 소통내역·📝 업무노트 각 1줄 말줄임.
둘 다 없으면 아무것도 안 그린다(카드 51%).

편집은 기존 공용 MemoEditModal, 저장은 기존 writeGuarded + onPatchCompany.
새 저장 경로 0개. ✎ 에 stopPropagation — 안 걸면 기업상세가 같이 열린다.

검증: 빌드 통과 · test-status-comment.mjs 전항목 통과.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01K1tKrSVi9PCNsVfBGDfX9V
EOF
```

---

## Task 5: 회귀 검증 + 재발방지 문서

**Files:**
- Create: 카드 지문 대조용 임시 SQL (scratchpad, 커밋하지 않음)
- Modify: `CLAUDE.md` — 「🧭 성장 로드맵」 절 **뒤**에 새 절 추가

**Interfaces:**
- Consumes: Task 1~4 전부
- Produces: 없음 (마지막 작업)

- [ ] **Step 1: 카드가 한 장도 안 움직였는지 확인한다**

scratchpad 에 `fingerprint.sql` 로 저장하고 실행:

```sql
select count(*) as cards,
       count(*) filter (where deleted_at is null) as live,
       md5(string_agg(id::text || '|' || stage || '|' ||
            coalesce(stage_changed_at::text,'') || '|' || sync_mode, ',' order by id)) as fingerprint
  from public.pipeline_cards;
```

Run: `node scripts/run-sql.js <절대경로>/fingerprint.sql`
Expected: `cards` · `live` · `fingerprint` 가 **Task 1 시작 전 값과 동일.**
(⚠️ Task 1 Step 1 에서 이 쿼리를 안 떠 뒀다면 지금 값을 기록하고, 아래 Step 2 이후 다시 대조한다.)
❌ 지문이 달라졌으면 **멈추고 원인을 찾는다** — 이 기능은 카드를 한 장도 움직이면 안 된다.

- [ ] **Step 2: 자동 검증 3종을 돌린다**

```bash
node scripts/test-status-comment.mjs
node scripts/audit-select-columns.mjs
CI=true npx react-scripts build
```
Expected: 순서대로 `전항목 통과` · `0건` · `Compiled successfully`(에러 0)

- [ ] **Step 3: 기존 테스트가 안 깨졌는지 확인한다**

```bash
node scripts/test-nocard.mjs
node scripts/test-note-links.mjs
node scripts/test-amount-unit.mjs
node scripts/test-revenue-input.mjs
node scripts/test-growth-roadmap.mjs
```
Expected: 전부 통과. ❌ 깨진 게 있으면 **이번 변경 때문인지 원래 그랬는지**를 `git stash` 로 갈라 확인하고 보고한다.

- [ ] **Step 4: 화면 회귀를 눈으로 확인한다**

`ESLINT_NO_DEV_ERRORS=true npm start` 로 띄우고 파이프라인 화면에서:

- [ ] 카드 드래그 이동 — 단계가 바뀌고 `📌 수동` 으로 바뀐다
- [ ] ☑ 다중 선택 → 일괄 이동 / 일괄 삭제
- [ ] 🗑 카드 하나 휴지통 → 복구
- [ ] 부결/반려 카드 [종결 처리] → [복원]
- [ ] `기타` 카드 사유 지정 / 변경
- [ ] 기관 미지정 카드에 🏛 기관 지정 · ＋ 새 기관 추가 신청
- [ ] 🔄/📌 동기화 토글
- [ ] 「＋ 카드 없는 기업」 목록이 뜨고 카드가 만들어진다
- [ ] **카드를 클릭하면 기업상세가 열린다** (✎ 를 눌렀을 때는 **안 열린다**)
- [ ] ✎ 로 문구 저장 → **같은 기업 카드 전부**가 파란 박스로 바뀐다
- [ ] ✎ 로 **비우고** 저장 → 자동표시(💬/📝)로 돌아온다
- [ ] `Esc` 로 모달을 닫아도 **뒤 화면이 같이 안 닫힌다**
- [ ] 모바일 `/m` — 파이프라인이 없으므로 **아무 변화가 없어야 한다**
- [ ] 기업목록 인라인 편집 · 대시보드 위젯 · 업무노트 · 팀 업무 — 평소대로

- [ ] **Step 5: CLAUDE.md 에 재발방지 규칙을 적는다**

「🧭 성장 로드맵」 절이 끝나는 곳(다음 절 `## 📝 메모 확대 편집 팝업` 앞)에 삽입:

```markdown
## 🎯 파이프라인 카드 「현재 상태」 코멘트 (2026-09-04, **새 테이블 0개 · 새 저장 경로 0개**)

카드에 "지금 왜 여기 멈춰 있나"를 한 줄로 띄운다. 사람이 직접 쓰면 그 문구,
안 쓰면 그 기업의 **최신 소통내역 + 최신 @기업 태그 업무노트 항목**이 자동으로 뜬다.
설계서 `docs/superpowers/specs/2026-09-04-pipeline-comment-design.md` · 계획 `docs/superpowers/plans/2026-09-04-pipeline-comment.md`

### 저장 — `companies` 컬럼 3개. **기업 단위다**
`status_comment` · `status_comment_at` · `status_comment_by`.
**`status_comment` 가 비어 있으면 자동표시**, 값이 있으면 그 문구 — 이 한 줄이 전환 규칙 전부다.
- ⚠️ **`companies.issue`(현재 이슈)와 다른 칸이다.** issue 는 카드 있는 기업 401개 중 **237개에
  이미 평균 68자(최대 786자)** 가 들어 있어, 재사용하면 켜는 즉시 카드 237장이 장문으로 덮인다.
- ⚠️ **기업 단위라 카드 2~6장에 같은 문구가 뜬다**(카드 2장 이상인 기업 242개). 의도한 결과다.
  기관별로 다르게 쓰고 싶다면 `pipeline_cards` 쪽 덮어쓰기를 **새로 설계**해야 한다.
- SQL: `파이프라인_현재상태_코멘트_컬럼추가.sql` / `_rollback` / `_검증`

### ⚠️ 자동표시에 넣으면 안 되는 log_type — 이게 이 기능의 핵심 함정
`activity_logs` 는 **사람이 쓴 메모와 시스템 이벤트가 한 테이블에 섞여 있다.**
2026-09-04 실측: 필터 없이 "최신 1건"을 고르면 **카드 기업 145/331(44%)** 에
`"소진공 카드를 '상담/진단완료' → '기관신청대기/방문예정'(으)로 이동"` 이 뜬다.

| 쓰는 것 | 안 쓰는 것 | 왜 |
|---|---|---|
| `manual_memo`·`quick_memo`·`chat_memo` | `pipeline_move`·`stage_change`·`assignee_change` | 시스템 이벤트다 |
| `note_company_links` 전건 | `note_auto` | 항목을 **완료 체크할 때** 남는 기록이라 "지금 상태"가 아니다 |
| | `issue_update`·`status_change`·`action_update` | **`company_id` 가 전 행 비어 있어** 애초에 못 잇는다 |

→ 목록은 **`STATUS_COMM_TYPES` 한 곳**에만 있다. 늘리기 전에 위 표를 다시 볼 것.

### 계산은 순수 함수 — **supabase·React 를 들이지 말 것**
`App.js` 의 `⛳ 현재상태-자동표시 계산 시작/끝` 마커 사이가 전부다
(`STATUS_COMM_TYPES` · `stripLeadingTag` · `statusCommentDate` · `buildStatusAutoMap`).
`scripts/test-status-comment.mjs` 가 **이 구간을 소스째 떼어내 실행**한다 — 무엇이든 참조하는 순간 테스트가 못 돈다.
- ⚠️ **마커 문구를 바꾸면 테스트가 통째로 죽는다.**
- ⚠️ **최신 1건은 JS 에서 고른다.** `fetchAllRows` 의 정렬 기본값(`created_at`→`id` 오름차순)을
  바꾸지 않기 위해서다(CLAUDE.md 2-5).
- ⚠️ **`taggedCompanyRefs`/`findTaggedCompanies` 를 쓰지 않는다.** `chat_memo` 의 선두 `@업체명` 만
  떼면 되는 자리라 `stripLeadingTag` 하나로 충분하고, 후자는 접두 과매칭이 있는 채팅 전용이다.

### 읽기 — `fetchAllRows` 2회 (보드 진입 시 1번)
`activity_logs`(3종만, 448행) · `note_company_links`(309행). **합계 757행으로 지금은 1000행 미만이지만
`fetchAllRows` 를 쓴다** — 판단 기준은 "지금 넘느냐"가 아니라 "전체를 받아야 하는 조회냐"다(2-5).
실패하면 📛 배너가 뜨고 빈 Map 이 되어 **자동표시만 안 뜬다. 카드·단계에는 영향이 없다.**

### 쓰기 — **새 저장 경로 0개**
편집은 기존 공용 `MemoEditModal`, 저장은 기존 `writeGuarded` + 기존 `onPatchCompany(id, patch)` 패턴.
`companyById` → `pipelineCardData` 가 다시 계산돼 **같은 기업 카드가 한꺼번에 바뀐다.**
- ⚠️ **`✎` 에 `stopPropagation` 필수** — 카드 `onClick` 이 기업상세를 연다. 기관현황 우선도 셀·기업목록 「기타」와 같은 함정.
- ⚠️ **빈칸 저장 = 세 컬럼 모두 `null`** → 자동표시 복귀. 빈 문자열로 두면 "썼는데 안 보이는" 상태가 된다.
- `writeGuarded` 재시도 큐를 그대로 쓴다 — 저장 뒤에 딸린 연동이 없다(2-7 해당 없음).

### 실측 (2026-09-04) — **인용 전에 그날 다시 셀 것**
살아있는 카드 **832장** / 기업 **401개** · 카드 2장 이상인 기업 **242개**(최대 6장) ·
자동표시가 뜨는 기업 **161개(40%)** · 카드 **407장(49%)** → **나머지 절반엔 아무것도 안 뜬다. 버그가 아니다.**

### 안 만든 것
기업상세에 이 칸 노출 · 기관(카드)별로 다른 문구 · 코멘트 이력 · Realtime 구독 · `note_auto` 포함.
**모바일 영향 0** — `PipelineView` 렌더 지점은 `CRMApp` 한 곳뿐이다(`TeamNotesSection` 과 다른 점).
```

- [ ] **Step 6: 커밋**

```bash
git add CLAUDE.md
git commit -F - <<'EOF'
docs(파이프라인코멘트): 📋 자동표시 log_type 함정 · 마커 규칙 · 회귀 확인 완료

시스템 로그를 안 거르면 카드 기업 44%에 "카드 이동"이 뜬다는 실측을 남긴다.
계산 블록 마커를 바꾸면 test-status-comment.mjs 가 죽는다는 것도 함께.

회귀 확인 완료: 카드 지문 동일 · 기존 테스트 5종 통과 · 화면 점검 목록 전부.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01K1tKrSVi9PCNsVfBGDfX9V
EOF
```

---

## Self-Review 결과

**스펙 커버리지**

| 스펙 요구 | 담당 |
|---|---|
| §4-1 컬럼 3개 | Task 1 |
| §4-2 자동표시 계산 · 텍스트 손질 | Task 2 |
| §4-2 `fetchAllRows` 2회 | Task 3 |
| §4-3 수동 입력 · 빈칸→자동 복귀 | Task 4 Step 1·3 |
| §4-4 화면(2줄 말줄임 · `stopPropagation`) | Task 4 Step 2 |
| §6 검증 전부 | Task 2 Step 4·5 / Task 3 Step 4·5 / Task 5 |
| §5 범위 밖 | 어느 Task 도 건드리지 않음 |

**타입 일관성** — `buildStatusAutoMap` 이 내는 `{comm,note}` / `{text,by,at,iso}` 를 Task 4 가 그대로 읽는다(`comm.text`·`comm.by`·`comm.iso`). `stripLeadingTag(text, coName)` 인자 순서가 Task 2 정의와 Task 4 호출에서 동일. `onPatchCompany(id, patch)` 가 Task 3 전달과 Task 4 호출에서 동일.

**미해결 위험** — `run-sql.js` 는 `.env.local` 의 `SUPABASE_ACCESS_TOKEN` 이 필요하다. 2026-08-26~09-02 사이 401 로 못 쓰던 기간이 있었다(2026-09-04 현재 정상). 만료되면 Task 1 과 Task 2 Step 4 의 `[D]` 구역이 막힌다 — 그때는 사용자에게 토큰 갱신을 요청하고, `[A]`~`[C]` 순수 검사만으로 진행 여부를 판단한다.
