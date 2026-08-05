-- ============================================================================
-- companies.team 컬럼 추가 — 기업 상세/신규 등록의 "법인팀·개인팀" 수동 지정을 실제로 저장한다.
--   2026-08-05. 지금까지 이 버튼은 저장된 적이 없다(컬럼이 없어 UPDATE 가 400 → try/catch 로 삼켜짐).
--
-- · 값은 '법인팀' | '개인팀' 두 가지. 비어 있으면(null) 화면은 업체명 기준 자동 분류(teamOf/teamByName)를 쓴다.
--   → 기존 394건은 null 로 남고, 지금과 똑같이 자동 분류로 보인다(백필하지 않는다).
-- · RLS: companies 테이블 정책을 그대로 따른다(컬럼 단위 정책은 없음). 새 테이블이 아니라
--   RLS 활성화·정책 부여는 필요 없다. 다만 컬럼 단위 GRANT 가 걸려 있으면 새 컬럼이 빠지므로 아래에서 확인한다.
--
-- 되돌리기: 기업_팀컬럼_추가_rollback.sql
-- ============================================================================

begin;

alter table public.companies add column if not exists team text;

-- 오타·엉뚱한 값이 들어가지 않도록 제한(빈 값은 허용 = 자동 분류)
alter table public.companies drop constraint if exists companies_team_chk;
alter table public.companies add constraint companies_team_chk
  check (team is null or team in ('법인팀', '개인팀'));

commit;
