-- ============================================================================
-- ✅ 결재함(sign_offs) 배포 후 검증 — 조치 파일과 분리한 이유
--   run-sql.js 는 여러 SELECT 가 들어 있어도 결과를 하나만 출력하고,
--   그게 파일 마지막 검증 쿼리가 아닐 수 있다(CLAUDE.md 2-2 마지막 항목,
--   2026-07-29 anon GRANT 회수 때 실제로 헷갈렸던 함정).
--   → 검증은 조치 파일에 딸린 SELECT 를 믿지 말고 이 파일로 따로 실행한다.
--
-- 실행: node scripts/run-sql.js 결재함_sign_offs_검증.sql
-- 판정: 아래 8개 항목이 전부 'OK' 여야 정상. 하나라도 'FAIL' 이면 배포 중단.
-- ============================================================================

with
-- ① RLS 가 꺼진 public 테이블 (전체 스키마 기준. 0행이어야 정상)
rls_off as (
  select count(*) n from pg_class c
   where c.relnamespace = 'public'::regnamespace and c.relkind = 'r' and c.relrowsecurity = false
),
-- ② 새 테이블 2개에 RLS 가 켜져 있는지
rls_on as (
  select count(*) n from pg_class c
   where c.relnamespace = 'public'::regnamespace
     and c.relname in ('sign_offs', 'sign_off_events') and c.relrowsecurity = true
),
-- ③ anon 에 남은 테이블 권한 (grantor 가 달라 revoke 가 조용히 실패했을 수 있다)
anon_grants as (
  select count(*) n from information_schema.role_table_grants
   where table_schema = 'public' and grantee = 'anon'
     and table_name in ('sign_offs', 'sign_off_events')
),
-- ④ 정책이 to public / to anon 으로 새지 않았는지 (roles 에 authenticated 만 있어야 함)
bad_roles as (
  select count(*) n from pg_policies
   where schemaname = 'public' and tablename in ('sign_offs', 'sign_off_events')
     and not (roles = '{authenticated}')
),
-- ⑤ 정책 구성 — sign_offs: select/insert/update 3개 (delete 없음)
--                sign_off_events: select 1개 (insert/update/delete 없음)
pol as (
  select
    count(*) filter (where tablename = 'sign_offs'       and cmd = 'SELECT') so_sel,
    count(*) filter (where tablename = 'sign_offs'       and cmd = 'INSERT') so_ins,
    count(*) filter (where tablename = 'sign_offs'       and cmd = 'UPDATE') so_upd,
    count(*) filter (where tablename = 'sign_offs'       and cmd = 'DELETE') so_del,
    count(*) filter (where tablename = 'sign_off_events' and cmd = 'SELECT') ev_sel,
    count(*) filter (where tablename = 'sign_off_events' and cmd <> 'SELECT') ev_write,
    count(*) filter (where tablename in ('sign_offs','sign_off_events') and cmd = 'ALL') any_all
  from pg_policies where schemaname = 'public'
),
-- ⑥ 트리거 3개가 붙어 있는지 (내부 FK 트리거 제외)
trg as (
  select count(*) n from pg_trigger t
   where t.tgrelid = 'public.sign_offs'::regclass and not t.tgisinternal
     and t.tgname in ('trg_sign_offs_bi', 'trg_sign_offs_bu', 'trg_sign_offs_aiu')
),
-- ⑦ 함수 EXECUTE — anon/public 에 남아 있으면 안 된다
fn_leak as (
  select count(*) n
    from pg_proc p
   where p.pronamespace = 'public'::regnamespace
     and p.proname in ('so_normalize_name','so_my_name','so_my_norm',
                       'so_before_insert','so_before_update','so_after_write','sign_off_comment')
     and (has_function_privilege('anon', p.oid, 'EXECUTE')
       or has_function_privilege('public', p.oid, 'EXECUTE'))
),
-- ⑧ 트리거 함수는 authenticated 도 직접 호출할 수 없어야 한다
fn_trg_leak as (
  select count(*) n
    from pg_proc p
   where p.pronamespace = 'public'::regnamespace
     and p.proname in ('so_before_insert','so_before_update','so_after_write')
     and has_function_privilege('authenticated', p.oid, 'EXECUTE')
),
-- 참고: 실제 GRANT 목록 / 정책 목록도 같이 뽑아 눈으로 본다
detail as (
  select
    (select coalesce(jsonb_agg(jsonb_build_object('t', table_name, 'grantee', grantee, 'priv', privilege_type, 'grantor', grantor)
              order by table_name, grantee, privilege_type), '[]'::jsonb)
       from information_schema.role_table_grants
      where table_schema = 'public' and table_name in ('sign_offs','sign_off_events')) as grants,
    (select coalesce(jsonb_agg(jsonb_build_object('t', tablename, 'policy', policyname, 'cmd', cmd, 'roles', roles)
              order by tablename, cmd), '[]'::jsonb)
       from pg_policies where schemaname = 'public' and tablename in ('sign_offs','sign_off_events')) as policies
)
select
  case when rls_off.n = 0 then 'OK' else 'FAIL (' || rls_off.n || '개)' end   as "① RLS 꺼진 public 테이블 0개",
  case when rls_on.n = 2 then 'OK' else 'FAIL (' || rls_on.n || '/2)' end     as "② 새 테이블 2개 RLS 켜짐",
  case when anon_grants.n = 0 then 'OK' else 'FAIL (' || anon_grants.n || '건)' end as "③ anon GRANT 0건",
  case when bad_roles.n = 0 then 'OK' else 'FAIL (' || bad_roles.n || '개)' end as "④ to public/anon 정책 0개",
  case when pol.so_sel = 1 and pol.so_ins = 1 and pol.so_upd = 1 and pol.so_del = 0
         and pol.ev_sel = 1 and pol.ev_write = 0 and pol.any_all = 0
       then 'OK' else 'FAIL' end                                              as "⑤ 정책 구성(so 3 / ev 1, DELETE·ALL 없음)",
  case when trg.n = 3 then 'OK' else 'FAIL (' || trg.n || '/3)' end            as "⑥ 트리거 3개",
  case when fn_leak.n = 0 then 'OK' else 'FAIL (' || fn_leak.n || '개)' end    as "⑦ 함수 EXECUTE anon/public 0개",
  case when fn_trg_leak.n = 0 then 'OK' else 'FAIL (' || fn_trg_leak.n || '개)' end as "⑧ 트리거 함수 직접호출 차단",
  detail.grants   as "GRANT 상세",
  detail.policies as "정책 상세"
from rls_off, rls_on, anon_grants, bad_roles, pol, trg, fn_leak, fn_trg_leak, detail;
