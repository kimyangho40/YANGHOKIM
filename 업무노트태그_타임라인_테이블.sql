-- 업무노트 @기업 태그 → 기업 타임라인 링크 (2026-08-31)
--
-- 업무노트(팀 체크리스트 항목 · 개인 노트 줄)에 @기업명 이 있으면
-- 그 기업 상세의 🕒 타임라인 탭에 항목 내용을 띄우기 위한 연결 테이블.
--   · (항목 × 기업) 하나당 1행. 한 항목에 기업 2곳을 태그하면 2행이다.
--   · item_text 는 화면에 보이는 형태의 **스냅샷**이다(원본 노트를 못 읽는 사람도 봐야 하므로).
--
-- ⚠️ activity_logs 를 쓰지 않은 이유: 그 테이블을 읽는 곳이 11군데인데
--    log_type 필터가 걸린 곳이 2군데뿐이라, 행을 부으면 소통내역 탭 배지 숫자·
--    AI 상담 프롬프트·소통내역 화면의 200건 창·팀 활동 건수가 조용히 틀어진다.
--
-- ⚠️ note_id 에 FK 를 걸지 않는다 — 원본이 team_notes / work_notes 두 곳이라
--    한 컬럼으로 FK 를 걸 수 없다. 원본이 지워지면 App.js 의 재조정이 링크를 soft delete 한다.
--
-- 되돌리기: 업무노트태그_타임라인_테이블_rollback.sql
-- 검증    : 업무노트태그_타임라인_테이블_검증.sql

create table if not exists public.note_company_links (
  id          uuid primary key default gen_random_uuid(),
  source      text        not null check (source in ('team_item','work_line')),
  note_id     uuid        not null,          -- team_notes.id / work_notes.id
  item_key    text        not null,          -- 팀: checklist 항목 id / 개인: 0-based 줄번호
  company_id  uuid        not null references public.companies(id) on delete cascade,
  item_text   text        not null,          -- 화면에 보이는 항목 원문(@태그 포함)
  at          timestamptz not null,          -- 타임라인 정렬 기준
  author      text,                          -- 팀: posted_by / 개인: assignee
  created_at  timestamptz not null default now(),
  updated_at  timestamptz,
  deleted_at  timestamptz
);

-- 소급 마이그레이션·재조정을 몇 번 돌려도 안 불어나게 하는 핵심 제약
create unique index if not exists note_company_links_uniq
  on public.note_company_links (source, note_id, item_key, company_id)
  where deleted_at is null;

-- 기업 타임라인 조회용
create index if not exists note_company_links_company_at
  on public.note_company_links (company_id, at desc)
  where deleted_at is null;

-- 재조정(노트 1장의 링크를 통째로 다시 맞추기)용
create index if not exists note_company_links_note
  on public.note_company_links (source, note_id)
  where deleted_at is null;

-- ── 🔒 RLS — 테이블을 만든 그 커밋에서 켠다 (CLAUDE.md 2-2) ────────────────────
alter table public.note_company_links enable row level security;

drop policy if exists p_note_company_links_select on public.note_company_links;
drop policy if exists p_note_company_links_insert on public.note_company_links;
drop policy if exists p_note_company_links_update on public.note_company_links;
drop policy if exists p_note_company_links_delete on public.note_company_links;

create policy p_note_company_links_select on public.note_company_links
  for select to authenticated using (public.is_approved());
create policy p_note_company_links_insert on public.note_company_links
  for insert to authenticated with check (public.is_approved());
create policy p_note_company_links_update on public.note_company_links
  for update to authenticated using (public.is_approved()) with check (public.is_approved());
create policy p_note_company_links_delete on public.note_company_links
  for delete to authenticated using (public.is_approved());

-- 앱(PostgREST)에 필요한 권한만 남긴다
revoke all on public.note_company_links from anon;
revoke truncate, references, trigger on public.note_company_links from authenticated, anon;
grant select, insert, update, delete on public.note_company_links to authenticated;
