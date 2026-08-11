-- ============================================================================
-- 🔎 TRUNCATE 회수 검증 — 조치 파일과 **별도로** 카탈로그를 다시 조회한다
--
--   CLAUDE.md 2-2: `revoke` 는 grantor 가 다르면 에러 없이 통과만 하고 권한은 그대로 남는다.
--   그래서 "실행 성공"만 보고 판단하면 안 된다. 여기서 실제 카탈로그 숫자를 센다.
--   또 run-sql.js 는 여러 SELECT 중 하나만 출력하므로, 이 파일은 **SELECT 를 하나만** 둔다.
--
-- 실행: node scripts/run-sql.js authenticated_TRUNCATE_회수_검증.sql
-- 판정: authenticated_TRUNCATE_남은테이블수 = 0, anon = 0, 기본권한_TRUNCATE_남음 = false
--       그리고 SELECT/INSERT/UPDATE/DELETE 는 그대로여야 한다(앱이 안 깨졌는지 확인).
-- ============================================================================

select jsonb_pretty(jsonb_build_object(
  '실행_current_user', current_user,

  -- ① 핵심 판정 — 0 이어야 정상
  'authenticated_TRUNCATE_남은테이블수', (select count(distinct table_name)
     from information_schema.role_table_grants
     where table_schema='public' and grantee='authenticated' and privilege_type='TRUNCATE'),
  'anon_TRUNCATE_남은테이블수', (select count(distinct table_name)
     from information_schema.role_table_grants
     where table_schema='public' and grantee='anon' and privilege_type='TRUNCATE'),
  '남아있다면_어느테이블', (select coalesce(jsonb_agg(distinct table_name),'[]'::jsonb)
     from information_schema.role_table_grants
     where table_schema='public' and grantee in ('authenticated','anon') and privilege_type='TRUNCATE'),

  -- ② 재발 방지 — 기본권한에 D(TRUNCATE) 가 남아 있는지. false 여야 정상
  '기본권한_TRUNCATE_남음', (select coalesce(bool_or(
        d.defaclacl::text ~ ('(authenticated|anon)=[a-zA-Z]*D')), false)
     from pg_default_acl d join pg_namespace n on n.oid = d.defaclnamespace
     where n.nspname = 'public' and d.defaclobjtype = 'r'),
  '기본권한_현재값', (select jsonb_agg(jsonb_build_object(
        'owner', pg_get_userbyid(d.defaclrole), 'acl', d.defaclacl::text))
     from pg_default_acl d join pg_namespace n on n.oid = d.defaclnamespace
     where n.nspname = 'public' and d.defaclobjtype = 'r'),

  -- ③ 앱이 안 깨졌는지 — 읽기/쓰기 권한은 그대로여야 한다
  'authenticated_남은권한_테이블수', (select jsonb_object_agg(privilege_type, n)
     from (select privilege_type, count(distinct table_name) n
             from information_schema.role_table_grants
            where table_schema='public' and grantee='authenticated'
            group by 1) z),

  -- ④ 참고 — service_role/postgres 는 관리용이라 그대로 두는 게 정상
  'service_role_TRUNCATE', (select count(distinct table_name)
     from information_schema.role_table_grants
     where table_schema='public' and grantee='service_role' and privilege_type='TRUNCATE'),
  'public스키마_전체테이블수', (select count(*) from pg_class
     where relnamespace='public'::regnamespace and relkind='r')
)) as v;
