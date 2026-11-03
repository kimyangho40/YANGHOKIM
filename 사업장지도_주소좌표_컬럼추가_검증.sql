-- 검증: 사업장지도_주소좌표_컬럼추가.sql — 전부 pass 여야 정상.
-- ⚠️ run-sql.js 는 결과를 하나만 출력하므로 검사 전체를 한 SELECT 로 묶었다(CLAUDE.md 2-2).
with cols as (
  select column_name, data_type, is_nullable, column_default
    from information_schema.columns
   where table_schema = 'public' and table_name = 'companies'
     and column_name in ('address','geo_lat','geo_lng','geo_level','geo_query','geo_at')
), cons as (
  select conname from pg_constraint
   where conrelid = 'public.companies'::regclass
     and conname in ('companies_geo_level_chk','companies_geo_range_chk')
)
select json_build_object(
  '1_컬럼6개_존재', (select case when count(*) = 6 then 'pass' else 'FAIL: ' || count(*) end from cols),
  '2_타입', (select json_object_agg(column_name, data_type) from cols),
  '3_전부_NULL허용_기본값없음', (select case when count(*) = 6 then 'pass' else 'FAIL: ' || count(*) end
                                  from cols where is_nullable = 'YES' and column_default is null),
  '4_제약2개', (select case when count(*) = 2 then 'pass' else 'FAIL: ' || count(*) end from cons),
  '5_RLS_켜짐', (select case when relrowsecurity then 'pass' else 'FAIL' end from pg_class where oid = 'public.companies'::regclass),
  '6_anon_컬럼권한_0', (select case when count(*) = 0 then 'pass' else 'FAIL: ' || count(*) end
     from information_schema.column_privileges
    where table_schema = 'public' and table_name = 'companies' and grantee = 'anon'
      and column_name in ('address','geo_lat','geo_lng','geo_level','geo_query','geo_at')),
  '7_현황', (select json_build_object(
      '살아있음', count(*) filter (where deleted_at is null),
      '주소있음', count(*) filter (where deleted_at is null and coalesce(address,'') <> ''),
      '좌표_상세', count(*) filter (where deleted_at is null and geo_level = 'address'),
      '좌표_지역', count(*) filter (where deleted_at is null and geo_level = 'region')) from public.companies)
) as 검증;
