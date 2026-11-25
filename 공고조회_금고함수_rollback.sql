-- 공고조회_금고함수.sql 되돌리기 — 함수 3개만 지운다. Vault 에 넣은 값은 남는다(지우려면 vault.secrets 에서 이름으로 삭제).
drop function if exists public.fund_notices_secret();
drop function if exists public.fund_notices_bizinfo_key();
drop function if exists public.fund_notices_ai_key();
select count(*) as remaining from pg_proc where pronamespace = 'public'::regnamespace and proname like 'fund\_notices\_%';
