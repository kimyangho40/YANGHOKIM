-- ============================================================================
-- ✅ 채팅 채널 스코프 — 카탈로그 검증(정책·권한이 제자리에 있나)
--   동작 검증은 채팅_DM_비공개_동작검증.sql 이 따로 한다. 둘 다 통과해야 한다.
--   실행: node scripts/run-sql.js 채팅_DM_비공개_검증.sql
--   판정: 7개 항목이 전부 'OK' 여야 정상.
-- ============================================================================
select
  case when (select count(*) from pg_policies
              where schemaname='public' and tablename='chat_messages') = 3
       then 'OK' else 'FAIL' end                       as "① 정책 정확히 3개(select/insert/update)",
  -- 정책을 '추가'하면 OR 로 합쳐져 푸는 결과가 된다 → 느슨한 정책이 남아 있으면 안 된다
  case when (select count(*) from pg_policies
              where schemaname='public' and tablename='chat_messages'
                and (qual = 'true' or with_check = 'true'
                     or qual = 'is_approved()' or with_check = 'is_approved()')) = 0
       then 'OK' else 'FAIL(느슨한 정책이 남아 있다)' end as "② using(true)/is_approved() 단독 정책 없음",
  case when (select count(*) from pg_policies
              where schemaname='public' and tablename='chat_messages'
                and roles::text <> '{authenticated}') = 0
       then 'OK' else 'FAIL' end                       as "③ 모든 정책이 authenticated 전용",
  case when (select count(*) from pg_trigger
              where tgrelid='public.chat_messages'::regclass
                and tgname='trg_chat_protect_update' and not tgisinternal) = 1
       then 'OK' else 'FAIL' end                       as "④ 보호 트리거 존재",
  case when (select relrowsecurity from pg_class where oid='public.chat_messages'::regclass)
       then 'OK' else 'FAIL' end                       as "⑤ RLS 켜짐",
  case when (select count(*) from information_schema.role_table_grants
              where table_schema='public' and table_name='chat_messages' and grantee='anon') = 0
       then 'OK' else 'FAIL' end                       as "⑥ anon 테이블 권한 0",
  -- 정책이 쓰는 함수는 authenticated 에 EXECUTE 가 있어야 하고(정책식은 호출자 권한으로 평가된다),
  -- 트리거 함수는 아무도 직접 못 불러야 한다.
  case when (select bool_and(ok) from (
        select has_function_privilege('authenticated', 'public.chat_can_access(text,text)', 'execute') as ok
        union all select has_function_privilege('authenticated', 'public.chat_is_admin()', 'execute')
        union all select not has_function_privilege('authenticated', 'public.chat_protect_update()', 'execute')
        union all select not has_function_privilege('anon', 'public.chat_can_access(text,text)', 'execute')
        union all select not has_function_privilege('anon', 'public.chat_is_admin()', 'execute')
        union all select not has_function_privilege('anon', 'public.chat_protect_update()', 'execute')) z)
       then 'OK' else 'FAIL' end                       as "⑦ 함수 EXECUTE 권한",
  (select jsonb_agg(jsonb_build_object('pol', policyname, 'cmd', cmd) order by policyname)
     from pg_policies where schemaname='public' and tablename='chat_messages') as "정책 목록";
