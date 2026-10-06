-- ============================================================================
-- 검증: 기관현황_이월_원래신청월_컬럼추가.sql  (실행 후 별도로 돌린다 — scripts/run-sql.js 는 SELECT 하나만 출력)
-- 모든 행의 ok 가 true 여야 정상. expect 는 사람이 읽는 기대값.
-- 총 행수(rows_total)는 실행 직전 값과 같은지 사람이 대조한다(매일 변하므로 상수로 박지 않았다).
-- ============================================================================
select * from (
  select 1 n, 'carried_from_year integer nullable' chk,
         (select count(*) from information_schema.columns where table_schema='public' and table_name='agency_cases'
            and column_name='carried_from_year' and data_type='integer' and is_nullable='YES') = 1 ok, '' info
  union all
  select 2, 'carried_from_month integer nullable',
         (select count(*) from information_schema.columns where table_schema='public' and table_name='agency_cases'
            and column_name='carried_from_month' and data_type='integer' and is_nullable='YES') = 1, ''
  union all
  select 3, '두 컬럼 기본값 없음',
         (select count(*) from information_schema.columns where table_schema='public' and table_name='agency_cases'
            and column_name like 'carried_from_%' and column_default is not null) = 0, ''
  union all
  select 4, 'check 제약 존재',
         exists (select 1 from pg_constraint where conname='agency_cases_carried_from_chk'
                   and conrelid='public.agency_cases'::regclass and contype='c'), ''
  union all
  select 5, '이월 기록이 있는 행 수(설치 직후 0)',
         true, (select count(*)::text from public.agency_cases where carried_from_year is not null or carried_from_month is not null)
  union all
  select 6, '반쪽만 채워진 행 0',
         (select count(*) from public.agency_cases where (carried_from_year is null) <> (carried_from_month is null)) = 0, ''
  union all
  select 7, 'rows_total (실행 전 값과 대조)', true, (select count(*)::text from public.agency_cases)
  union all
  select 8, 'RLS on',
         (select relrowsecurity from pg_class where oid='public.agency_cases'::regclass), ''
  union all
  select 9, 'anon 테이블 권한 0',
         (select count(*) from information_schema.role_table_grants
            where table_schema='public' and table_name='agency_cases' and grantee='anon') = 0, ''
  union all
  select 10, 'anon 컬럼 권한 0',
         (select count(*) from information_schema.column_privileges
            where table_schema='public' and table_name='agency_cases' and grantee='anon') = 0, ''
  union all
  select 11, '정책은 p_agency_cases_all 1개 · is_approved()',
         (select count(*) from pg_policies where schemaname='public' and tablename='agency_cases') = 1
         and exists (select 1 from pg_policies where schemaname='public' and tablename='agency_cases'
                       and policyname='p_agency_cases_all' and qual='is_approved()' and with_check='is_approved()'
                       and roles = '{authenticated}'), ''
  union all
  select 12, 'authenticated 권한 = DELETE,INSERT,SELECT,UPDATE',
         (select string_agg(privilege_type, ',' order by privilege_type) from information_schema.role_table_grants
            where table_schema='public' and table_name='agency_cases' and grantee='authenticated') = 'DELETE,INSERT,SELECT,UPDATE', ''
  union all
  select 13, '사용자 트리거 0',
         (select count(*) from pg_trigger where tgrelid='public.agency_cases'::regclass and not tgisinternal) = 0, ''
) t order by n;
