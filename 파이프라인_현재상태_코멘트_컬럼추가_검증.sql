-- 검증 — 컬럼 3개가 생겼나 · RLS 는 켜져 있나 · anon 권한은 0인가 (2026-09-04)
--
-- ⚠️ run-sql.js 는 여러 SELECT 가 든 파일을 실행해도 결과를 **하나만** 찍는다(CLAUDE.md 2-2).
--    그래서 SELECT 를 하나로 합쳤다.
-- ⚠️ 이 파일은 조치 파일(_컬럼추가.sql)과 **별도로** 돌린다. 조치 파일에 딸린 SELECT 를 믿지 않는다.
select
  -- 3 이어야 정상
  (select count(*) from information_schema.columns
    where table_schema='public' and table_name='companies'
      and column_name in ('status_comment','status_comment_at','status_comment_by'))  as new_cols,
  (select string_agg(column_name || ':' || data_type, ', ' order by column_name)
     from information_schema.columns
    where table_schema='public' and table_name='companies'
      and column_name in ('status_comment','status_comment_at','status_comment_by'))  as new_col_types,
  -- true 여야 정상 (기존 테이블이라 원래 켜져 있다 — 컬럼 추가가 이걸 끄지 않았는지 확인)
  (select relrowsecurity from pg_class where oid = 'public.companies'::regclass)      as rls_on,
  -- 0 이어야 정상
  (select count(*) from information_schema.role_table_grants
    where table_schema='public' and table_name='companies' and grantee='anon')        as anon_grants,
  -- 1 이상이어야 정상
  (select count(*) from pg_policy where polrelid='public.companies'::regclass)        as policies,
  -- authenticated 에 SELECT/INSERT/UPDATE/DELETE 외 권한이 붙지 않았는지 (0 이어야 정상)
  (select count(*) from information_schema.role_table_grants
    where table_schema='public' and table_name='companies' and grantee='authenticated'
      and privilege_type not in ('SELECT','INSERT','UPDATE','DELETE'))                as extra_grants;
