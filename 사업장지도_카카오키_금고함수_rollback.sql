-- 되돌리기: 사업장지도_카카오키_금고함수.sql
-- 함수만 지운다. Vault 의 키까지 지우려면: delete from vault.secrets where name = 'kakao_rest_api_key';
drop function if exists public.geocode_kakao_key();
