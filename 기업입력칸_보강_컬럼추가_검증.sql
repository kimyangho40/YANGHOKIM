-- 검증: 기업입력칸_보강_컬럼추가.sql — 전부 pass 여야 정상.
-- ⚠️ run-sql.js 는 결과를 하나만 출력하므로 검사 전체를 한 SELECT 로 묶었다(CLAUDE.md 2-2).
with cols as (
  select column_name, data_type, is_nullable, column_default
    from information_schema.columns
   where table_schema = 'public' and table_name = 'companies'
     and column_name in ('representative_birth','representative_gender','biz_reg_count','has_closed_business','certifications')
), cons as (
  select conname from pg_constraint
   where conrelid = 'public.companies'::regclass
     and conname in ('companies_representative_gender_chk','companies_biz_reg_count_chk',
                     'companies_certifications_chk','companies_representative_birth_chk')
)
select json_build_object(
  '1_컬럼5개_존재', (select case when count(*) = 5 then 'pass' else 'FAIL: ' || count(*) end from cols),
  '2_타입', (select json_object_agg(column_name, data_type) from cols),
  '3_인증_기본값_빈배열_notnull', (select case when is_nullable = 'NO' and column_default like '''[]''%' then 'pass' else 'FAIL: ' || is_nullable || ' / ' || coalesce(column_default,'null') end
                                    from cols where column_name = 'certifications'),
  '4_나머지_NULL허용_기본값없음', (select case when count(*) = 4 then 'pass' else 'FAIL: ' || count(*) end
                                    from cols where column_name <> 'certifications' and is_nullable = 'YES' and column_default is null),
  '5_제약4개', (select case when count(*) = 4 then 'pass' else 'FAIL: ' || count(*) end from cons),
  '6_기존행_변화없음(새칸 값 있는 행 0)', (select case when count(*) = 0 then 'pass' else 'FAIL: ' || count(*) end
     from public.companies
    where representative_birth is not null or representative_gender is not null
       or biz_reg_count is not null or has_closed_business is not null or certifications <> '[]'::jsonb),
  '7_RLS_켜짐', (select case when relrowsecurity then 'pass' else 'FAIL' end from pg_class where oid = 'public.companies'::regclass),
  '8_anon_컬럼권한_0', (select case when count(*) = 0 then 'pass' else 'FAIL: ' || count(*) end
     from information_schema.column_privileges
    where table_schema = 'public' and table_name = 'companies' and grantee = 'anon'
      and column_name in ('representative_birth','representative_gender','biz_reg_count','has_closed_business','certifications')),
  '9_행수', (select json_build_object('전체', count(*), '살아있음', count(*) filter (where deleted_at is null)) from public.companies)
) as 검증;
