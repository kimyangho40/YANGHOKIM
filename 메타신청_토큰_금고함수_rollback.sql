-- 되돌리기: 메타신청_토큰_금고함수.sql
-- Vault 에 넣은 값까지 지우려면 아래 주석을 풀 것.
drop function if exists public.meta_leads_token();
drop function if exists public.meta_leads_secret();
-- delete from vault.secrets where name in ('meta_leads_token', 'meta_leads_secret');
