-- ============================================================================
-- 되돌리기 — 업무노트_개인노트_비공개_RLS.sql
--   실행하면 work_notes 는 다시 "승인된 로그인 사용자 전건 열람" 상태로 돌아간다.
--   ⚠ 개인노트가 다시 전부 열린다는 뜻이다. 화면이 깨졌을 때 임시 복구용으로만 쓸 것.
--   ⚠ 클라이언트(App.js)는 rpc(wn_team_unfinished / wn_activity_counts / wn_append_todo)
--     를 호출하므로, 함수까지 지우려면 App.js 도 함께 되돌려야 한다.
--     → 기본은 "정책만 원복"이고, 함수 삭제는 맨 아래 주석을 풀어야 실행된다.
-- ============================================================================

begin;

drop policy if exists p_work_notes_select on public.work_notes;
drop policy if exists p_work_notes_insert on public.work_notes;
drop policy if exists p_work_notes_update on public.work_notes;
drop policy if exists p_work_notes_delete on public.work_notes;

create policy p_work_notes_all on public.work_notes
  for all to authenticated
  using (is_approved())
  with check (is_approved());

commit;

-- 함수까지 되돌리려면(=App.js 도 이전 커밋으로 되돌린 경우에만) 아래 주석을 풀 것.
-- begin;
-- drop function if exists public.wn_append_todo(text, date, text, uuid, text);
-- drop function if exists public.wn_activity_counts(timestamptz);
-- drop function if exists public.wn_team_unfinished();
-- drop function if exists public.wn_visible_names();
-- drop function if exists public.wn_is_admin();
-- drop function if exists public.wn_my_name();
-- commit;
