-- =====================================================================
-- 메타 신청 수집 — 비밀값 2개를 Vault 에서 꺼내는 함수 (Edge Function `meta-leads` 전용)
-- 실행:     node scripts/run-sql.js 메타신청_토큰_금고함수.sql
-- 되돌리기: 메타신청_토큰_금고함수_rollback.sql
--
-- 🔐 값은 이 파일에 없다(저장소가 public). 저장소 밖 임시 SQL 로 한 번만 넣고 그 파일은 바로 지운다:
--      select vault.create_secret('<메타 토큰>',  'meta_leads_token',  '메타 신청 수집 — leads_retrieval 권한 토큰');
--      select vault.create_secret('<임의 43자>',  'meta_leads_secret', '메타 신청 수집 — cron ↔ 함수 공유 비밀키');
--    바꿀 때: select vault.update_secret(id, '<새 값>') from vault.secrets where name = '...';
-- 🔐 함수는 service_role 만 실행할 수 있다. anon·authenticated(직원 로그인)·public 은 실행 권한 0.
--    (사업장지도_카카오키_금고함수.sql 과 같은 방식)
-- =====================================================================
create or replace function public.meta_leads_token()
returns text
language sql
security definer
set search_path = ''
as $$
  select decrypted_secret from vault.decrypted_secrets where name = 'meta_leads_token' limit 1;
$$;

create or replace function public.meta_leads_secret()
returns text
language sql
security definer
set search_path = ''
as $$
  select decrypted_secret from vault.decrypted_secrets where name = 'meta_leads_secret' limit 1;
$$;

revoke all on function public.meta_leads_token() from public, anon, authenticated;
revoke all on function public.meta_leads_secret() from public, anon, authenticated;
grant execute on function public.meta_leads_token() to service_role;
grant execute on function public.meta_leads_secret() to service_role;

comment on function public.meta_leads_token() is '메타 신청 수집 Edge Function(meta-leads) 전용 — 메타 토큰. service_role 만 실행';
comment on function public.meta_leads_secret() is '메타 신청 수집 Edge Function(meta-leads) 전용 — 호출 비밀키. service_role 만 실행';
