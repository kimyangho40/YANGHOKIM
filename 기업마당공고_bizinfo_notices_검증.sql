-- 검증: 기업마당공고_bizinfo_notices.sql — 전부 pass 여야 정상. (run-sql.js 는 결과 1개만 찍어 한 SELECT 로 묶었다)
select json_build_object(
  '1_RLS_켜짐', (select case when relrowsecurity then 'pass' else 'FAIL' end from pg_class where oid = 'public.bizinfo_notices'::regclass),
  '2_정책1개_is_approved', (select case when count(*) = 1 and bool_and(qual like '%is_approved()%') and bool_and(cmd = 'SELECT') then 'pass' else 'FAIL: ' || count(*) end
                            from pg_policies where schemaname = 'public' and tablename = 'bizinfo_notices'),
  '3_anon_권한_0', (select case when count(*) = 0 then 'pass' else 'FAIL: ' || string_agg(privilege_type, ',') end
                    from information_schema.role_table_grants where table_schema = 'public' and table_name = 'bizinfo_notices' and grantee = 'anon'),
  '4_authenticated_SELECT만', (select case when count(*) = 1 and bool_and(privilege_type = 'SELECT') then 'pass' else 'FAIL: ' || string_agg(privilege_type, ',') end
                    from information_schema.role_table_grants where table_schema = 'public' and table_name = 'bizinfo_notices' and grantee = 'authenticated'),
  '5_행수', (select count(*) from public.bizinfo_notices),
  '6_마감지난_공고', (select count(*) from public.bizinfo_notices where deadline < (now() at time zone 'Asia/Seoul')::date)
) as 검증;
