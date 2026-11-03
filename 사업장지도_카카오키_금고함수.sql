-- =====================================================================
-- 사업장 지도 — 카카오 REST 키를 Vault 에서 꺼내는 함수 (Edge Function `geocode` 전용)
-- 실행: node scripts/run-sql.js 사업장지도_카카오키_금고함수.sql
-- 되돌리기: 사업장지도_카카오키_금고함수_rollback.sql
--
-- 🔐 키 값은 이 파일에 없다(저장소가 public). 키는 별도로 한 번만 넣는다:
--      select vault.create_secret('<키>', 'kakao_rest_api_key', '사업장 지도 카카오 로컬 API');
--    → 저장소 밖 임시 SQL 로 실행하고 바로 지울 것. 바꿀 때는 vault.update_secret(id, '<새 키>').
-- 🔐 함수는 service_role 만 실행할 수 있다. anon·authenticated(직원 로그인)·public 은 실행 권한 0.
--    Edge Function 은 Supabase 가 자동으로 넣어 주는 SUPABASE_SERVICE_ROLE_KEY 로 이 함수를 부른다.
--    (함수 비밀값을 못 쓴 이유: 지금 Management 토큰에 edge_functions_secrets_write 권한이 없다)
-- =====================================================================
create or replace function public.geocode_kakao_key()
returns text
language sql
security definer
set search_path = ''
as $$
  select decrypted_secret from vault.decrypted_secrets where name = 'kakao_rest_api_key' limit 1;
$$;

revoke all on function public.geocode_kakao_key() from public, anon, authenticated;
grant execute on function public.geocode_kakao_key() to service_role;

comment on function public.geocode_kakao_key() is '사업장 지도 Edge Function(geocode) 전용 — 카카오 REST 키. service_role 만 실행';
