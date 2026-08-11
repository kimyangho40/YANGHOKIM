-- ============================================================================
-- 🔎 REFERENCES·TRIGGER 회수 검증 — 조치 파일과 **별도로** 카탈로그를 다시 조회한다
--
--   CLAUDE.md 2-2: `revoke` 는 grantor 가 다르면 에러 없이 통과만 하고 권한은 그대로 남는다.
--   "실행 성공" 만 보고 판단하면 안 된다. 여기서 실제 카탈로그 숫자를 센다.
--   run-sql.js 는 여러 SELECT 중 하나만 출력하므로 이 파일은 **SELECT 를 하나만** 둔다.
--
-- 실행: node scripts/run-sql.js authenticated_REFERENCES_TRIGGER_회수_검증.sql
-- 판정: REFERENCES·TRIGGER 남은테이블수 = 0 (authenticated·anon 모두)
--       앱 동작 권한(SELECT/INSERT/UPDATE/DELETE)은 그대로
--       기존 FK 18건·우리 트리거들은 그대로 살아 있어야 한다
-- ============================================================================

select jsonb_pretty(jsonb_build_object(
  '실행_current_user', current_user,

  -- ① 핵심 판정 — 0 이어야 정상
  'authenticated_REFERENCES_남은테이블수', (select count(distinct table_name)
     from information_schema.role_table_grants
     where table_schema='public' and grantee='authenticated' and privilege_type='REFERENCES'),
  'authenticated_TRIGGER_남은테이블수', (select count(distinct table_name)
     from information_schema.role_table_grants
     where table_schema='public' and grantee='authenticated' and privilege_type='TRIGGER'),
  'anon_REFERENCES_TRIGGER_남은테이블수', (select count(distinct table_name)
     from information_schema.role_table_grants
     where table_schema='public' and grantee='anon'
       and privilege_type in ('REFERENCES','TRIGGER')),
  '남아있다면_어디', (select coalesce(jsonb_agg(distinct (table_name||':'||privilege_type)),'[]'::jsonb)
     from information_schema.role_table_grants
     where table_schema='public' and grantee in ('authenticated','anon')
       and privilege_type in ('REFERENCES','TRIGGER')),

  -- ② 재발 방지 — 기본권한에 x(REFERENCES)/t(TRIGGER) 가 남았는지
  '기본권한_현재값', (select jsonb_agg(jsonb_build_object(
        'owner', pg_get_userbyid(d.defaclrole), 'acl', d.defaclacl::text))
     from pg_default_acl d join pg_namespace n on n.oid = d.defaclnamespace
     where n.nspname='public' and d.defaclobjtype='r'),

  -- ③ 앱·기존 구조가 안 깨졌는지
  'authenticated_남은권한_테이블수', (select jsonb_object_agg(privilege_type, n)
     from (select privilege_type, count(distinct table_name) n
             from information_schema.role_table_grants
            where table_schema='public' and grantee='authenticated'
            group by 1) z),
  '기존_FK제약_수', (select count(*) from pg_constraint
     where connamespace='public'::regnamespace and contype='f'),
  '우리가만든_보호트리거', (select coalesce(jsonb_agg(t.tgname order by t.tgname),'[]'::jsonb)
     from pg_trigger t join pg_class c on c.oid = t.tgrelid
     where c.relnamespace='public'::regnamespace and not t.tgisinternal
       and t.tgname in ('trg_team_notes_protect','trg_team_notes_no_hard_delete',
                        'trg_chat_protect_update','trg_protect_profile')),

  -- ④ 참고 — 아직 남아 있는 권한(별건)
  'authenticated_MAINTAIN_보유테이블수', (select count(*) from pg_class c
     where c.relnamespace='public'::regnamespace and c.relkind='r'
       and has_table_privilege('authenticated', c.oid, 'MAINTAIN')),
  'service_role_REFERENCES', (select count(distinct table_name)
     from information_schema.role_table_grants
     where table_schema='public' and grantee='service_role' and privilege_type='REFERENCES')
)) as v;
