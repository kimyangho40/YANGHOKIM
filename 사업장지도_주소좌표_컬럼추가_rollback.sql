-- =====================================================================
-- 되돌리기: 사업장지도_주소좌표_컬럼추가.sql
-- 실행: node scripts/run-sql.js 사업장지도_주소좌표_컬럼추가_rollback.sql
--
-- ⚠️ 입력된 상세 주소·좌표는 사라진다. 실행 전에 백업(CRM백업/companies_*.json)을 확인할 것.
-- ⚠️ 코드(App.js·pages/CompanyMap.jsx)를 먼저 되돌린 뒤 실행할 것 — 코드가 남은 채 컬럼만 지우면
--    주소를 넣은 기업의 저장이 400 으로 실패한다.
-- =====================================================================
alter table public.companies drop constraint if exists companies_geo_level_chk;
alter table public.companies drop constraint if exists companies_geo_range_chk;

alter table public.companies drop column if exists address;
alter table public.companies drop column if exists geo_lat;
alter table public.companies drop column if exists geo_lng;
alter table public.companies drop column if exists geo_level;
alter table public.companies drop column if exists geo_query;
alter table public.companies drop column if exists geo_at;
