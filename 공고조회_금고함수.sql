-- =====================================================================
-- 공고 수집 Edge Function(fund-notices) 전용 — Vault 값을 꺼내는 함수 3개 (2026-11-25)
-- 실행:     node scripts/run-sql.js 공고조회_금고함수.sql
-- 되돌리기: 공고조회_금고함수_rollback.sql
--
-- 🔐 값 자체는 이 파일에 없다. 아래 이름으로 Vault 에 따로 넣는다(값을 파일·대화·로그에 남기지 말 것):
--   fund_notices_secret       호출 비밀키(임의의 긴 문자열)
--   fund_notices_bizinfo_key  기업마당 지원사업정보 API 인증키
--   fund_notices_ai_key       안내 문장을 쓰는 AI 키(없으면 문장만 건너뛰고 수집은 된다)
--   넣는 법: select vault.create_secret('<값>', '<이름>');   바꾸는 법: vault.update_secret(id, '<새 값>')
-- 메타 신청(meta_leads_*)과 같은 방식이다 — service_role 만 실행할 수 있다.
-- =====================================================================
create or replace function public.fund_notices_secret()
returns text language sql security definer set search_path = '' as $$
  select decrypted_secret from vault.decrypted_secrets where name = 'fund_notices_secret' limit 1;
$$;
create or replace function public.fund_notices_bizinfo_key()
returns text language sql security definer set search_path = '' as $$
  select decrypted_secret from vault.decrypted_secrets where name = 'fund_notices_bizinfo_key' limit 1;
$$;
create or replace function public.fund_notices_ai_key()
returns text language sql security definer set search_path = '' as $$
  select decrypted_secret from vault.decrypted_secrets where name = 'fund_notices_ai_key' limit 1;
$$;

revoke all on function public.fund_notices_secret(), public.fund_notices_bizinfo_key(), public.fund_notices_ai_key() from public, anon, authenticated;
grant execute on function public.fund_notices_secret(), public.fund_notices_bizinfo_key(), public.fund_notices_ai_key() to service_role;

comment on function public.fund_notices_secret() is '공고 수집 Edge Function(fund-notices) 전용 — 호출 비밀키. service_role 만 실행';
comment on function public.fund_notices_bizinfo_key() is '공고 수집 Edge Function(fund-notices) 전용 — 기업마당 인증키. service_role 만 실행';
comment on function public.fund_notices_ai_key() is '공고 수집 Edge Function(fund-notices) 전용 — 안내 문장 AI 키. service_role 만 실행';

select p.proname,
       has_function_privilege('anon', p.oid, 'execute') as anon_exec,
       has_function_privilege('authenticated', p.oid, 'execute') as auth_exec,
       has_function_privilege('service_role', p.oid, 'execute') as svc_exec
  from pg_proc p where p.pronamespace = 'public'::regnamespace and p.proname like 'fund\_notices\_%' order by 1;
