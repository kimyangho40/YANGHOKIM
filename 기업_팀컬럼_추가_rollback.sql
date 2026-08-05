-- ============================================================================
-- 되돌리기 — 기업_팀컬럼_추가.sql
--   ⚠️ 컬럼을 지우면 그동안 손으로 지정한 팀 값이 함께 사라진다(복구 불가).
--      먼저 백업해 두고 싶으면 아래 select 를 돌려 결과를 보관할 것:
--      select id, name, team from public.companies where team is not null;
--   ⚠️ App.js 도 함께 되돌려야 한다(저장 필드에 team 이 들어 있으면 400 이 다시 난다).
-- ============================================================================

begin;

alter table public.companies drop constraint if exists companies_team_chk;
alter table public.companies drop column if exists team;

commit;
