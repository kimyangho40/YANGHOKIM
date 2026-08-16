-- 검증: 푸시구독_기기별_행_RLS.sql 적용 결과
-- ⚠️ run-sql.js 는 결과를 하나만 출력하므로 **한 방 SELECT** 로 만든다.
--    (조치 파일에 딸린 SELECT 를 믿지 말 것 — CLAUDE.md 2-2)
select
  (select count(*) from pg_policies
     where schemaname='public' and tablename='push_subscriptions')                          as policies,        -- 4
  (select count(*) from pg_indexes
     where schemaname='public' and indexname='push_subscriptions_endpoint_uniq')            as endpoint_uniq,   -- 1
  (select count(*) from pg_constraint
     where conrelid='public.push_subscriptions'::regclass and contype='u')                  as unique_consts,   -- 0 (인덱스로 대체)
  (select count(*) from information_schema.role_table_grants
     where table_schema='public' and table_name='push_subscriptions' and grantee='anon')    as anon_grants,     -- 0
  (select count(*) from information_schema.role_table_grants
     where table_schema='public' and table_name='push_subscriptions' and grantee='authenticated'
       and privilege_type in ('TRUNCATE','REFERENCES','TRIGGER'))                           as risky_grants,    -- 0
  (select relrowsecurity from pg_class where oid='public.push_subscriptions'::regclass)     as rls_on,          -- true
  (select count(*) from information_schema.columns
     where table_schema='public' and table_name='push_subscriptions'
       and column_name in ('endpoint','device','last_ok_at','fail_count'))                  as new_cols;        -- 4
