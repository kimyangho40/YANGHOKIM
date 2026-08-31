-- 업무노트태그_타임라인_테이블.sql 실행 후 검증
--
-- ⚠️ SELECT 를 하나만 둔다 — scripts/run-sql.js 는 결과를 하나만 출력하고,
--    그게 파일 마지막 쿼리가 아닐 수 있다(CLAUDE.md 2-2).
-- ⚠️ 특히 anon_grants 를 눈으로 볼 것. revoke 는 grantor 가 다르면
--    에러 없이 아무것도 안 한다 — "성공했으니 회수됐다"고 믿으면 안 된다.
--
-- 기대값: rls_on=1 · policies=4 · anon_grants=0 · bad_grants=0
--         indexes=4(pk 포함) · rows=0 · rls_off_tables 는 실행 전과 같아야 한다

select
  (select count(*) from pg_class
     where relname = 'note_company_links'
       and relnamespace = 'public'::regnamespace
       and relrowsecurity)                                            as rls_on,
  (select count(*) from pg_policy p join pg_class c on c.oid = p.polrelid
     where c.relname = 'note_company_links')                          as policies,
  (select count(*) from information_schema.role_table_grants
     where table_schema = 'public' and table_name = 'note_company_links'
       and grantee = 'anon')                                          as anon_grants,
  (select count(*) from information_schema.role_table_grants
     where table_schema = 'public' and table_name = 'note_company_links'
       and grantee = 'authenticated'
       and privilege_type in ('TRUNCATE','REFERENCES','TRIGGER'))     as bad_grants,
  (select count(*) from information_schema.role_table_grants
     where table_schema = 'public' and table_name = 'note_company_links'
       and grantee = 'authenticated'
       and privilege_type in ('SELECT','INSERT','UPDATE','DELETE'))   as app_grants,
  (select count(*) from pg_indexes
     where schemaname = 'public' and tablename = 'note_company_links') as indexes,
  (select count(*) from public.note_company_links)                    as rows,
  (select count(*) from pg_class
     where relnamespace = 'public'::regnamespace and relkind = 'r'
       and relrowsecurity = false)                                    as rls_off_tables;
