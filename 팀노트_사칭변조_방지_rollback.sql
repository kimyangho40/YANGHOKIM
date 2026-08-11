-- ============================================================================
-- ⏪ 되돌리기 — 팀노트_사칭변조_방지.sql
--
-- 되돌리면 승인된 로그인 사용자는 다시
--   · 남의 이름으로 팀 노트를 등록할 수 있고
--   · 남이 올린 노트의 등록자·팀을 바꿔치기할 수 있고
--   · 하드 DELETE 로 복구 불가능하게 지울 수 있다.
-- 열람 범위는 이 파일과 무관하다(원래부터 전원 열람이고, 화면도 그렇게 동작한다).
--
-- 실행: node scripts/run-sql.js 팀노트_사칭변조_방지_rollback.sql
-- ============================================================================

drop trigger if exists trg_team_notes_protect on public.team_notes;
drop trigger if exists trg_team_notes_no_hard_delete on public.team_notes;
drop function if exists public.protect_team_note();
drop function if exists public.block_team_note_hard_delete();
