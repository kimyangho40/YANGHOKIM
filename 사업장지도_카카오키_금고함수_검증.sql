-- 검증: 사업장지도_카카오키_금고함수.sql — 전부 pass 여야 정상. 키 값은 출력하지 않는다.
select json_build_object(
  '1_금고에_키_1개', (select case when count(*) = 1 then 'pass' else 'FAIL: ' || count(*) end from vault.secrets where name = 'kakao_rest_api_key'),
  '2_키_길이32', (select case when length(public.geocode_kakao_key()) = 32 then 'pass' else 'FAIL' end),
  '3_anon_실행불가', (select case when not has_function_privilege('anon', 'public.geocode_kakao_key()', 'execute') then 'pass' else 'FAIL' end),
  '4_authenticated_실행불가', (select case when not has_function_privilege('authenticated', 'public.geocode_kakao_key()', 'execute') then 'pass' else 'FAIL' end),
  '5_service_role_실행가능', (select case when has_function_privilege('service_role', 'public.geocode_kakao_key()', 'execute') then 'pass' else 'FAIL' end),
  '6_anon_금고읽기불가', (select case when not has_table_privilege('anon', 'vault.decrypted_secrets', 'select') then 'pass' else 'FAIL' end),
  '7_authenticated_금고읽기불가', (select case when not has_table_privilege('authenticated', 'vault.decrypted_secrets', 'select') then 'pass' else 'FAIL' end)
) as 검증;
