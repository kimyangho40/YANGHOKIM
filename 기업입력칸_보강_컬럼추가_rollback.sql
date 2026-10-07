-- =====================================================================
-- 되돌리기: 기업입력칸_보강_컬럼추가.sql
-- 실행: node scripts/run-sql.js 기업입력칸_보강_컬럼추가_rollback.sql
--
-- ⚠️ 이 5개 칸에 입력된 값은 사라진다. 실행 전에 백업(CRM백업/companies_*.json)을 확인할 것.
-- ⚠️ 코드(App.js)를 먼저 되돌린 뒤 실행할 것 — 코드가 남은 채 컬럼만 지우면
--    새 칸을 채운 기업의 저장이 400 으로 실패한다.
--    (코드 되돌리기: git checkout backup/before-input-fields-20261008-0116 -- src/App.js)
-- =====================================================================
alter table public.companies drop constraint if exists companies_representative_gender_chk;
alter table public.companies drop constraint if exists companies_biz_reg_count_chk;
alter table public.companies drop constraint if exists companies_certifications_chk;
alter table public.companies drop constraint if exists companies_representative_birth_chk;

alter table public.companies drop column if exists representative_birth;
alter table public.companies drop column if exists representative_gender;
alter table public.companies drop column if exists biz_reg_count;
alter table public.companies drop column if exists has_closed_business;
alter table public.companies drop column if exists certifications;
