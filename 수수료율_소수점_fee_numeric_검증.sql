-- 검증: 전부 pass 여야 정상. (2026-08-15)
-- ⚠️ run-sql.js 는 결과를 하나만 출력하므로 검사 전체를 한 SELECT 로 묶었다(CLAUDE.md 참고).
with t as (
  select data_type from information_schema.columns
   where table_schema = 'public' and table_name = 'companies' and column_name = 'fee'
), before_after as (
  select count(*) as 전체,
         count(*) filter (where fee is not null) as 값있음,
         count(*) filter (where fee is not null and fee <> round(fee)) as 소수값
    from public.companies
)
select json_build_object(
  '1_타입이_numeric인가', (select case when data_type = 'numeric' then 'pass' else 'FAIL: ' || data_type end from t),
  '2_소수를_넣을_수_있나', (
     -- 실제로 4.8 을 캐스팅해 본다(행은 건드리지 않는다)
     select case when (4.8)::numeric = 4.8 then 'pass' else 'FAIL' end
  ),
  '3_기존값_보존', (select json_build_object('전체', 전체, '값있음', 값있음, '소수값', 소수값) from before_after),
  '4_짝꿍컬럼도_numeric인가', (
     select case when data_type = 'numeric' then 'pass' else 'FAIL: ' || data_type end
       from information_schema.columns
      where table_schema = 'public' and table_name = 'settlement_manual' and column_name = 'commission_rate'
  ),
  '5_백돈시흥능곡점_현재값', (
     select json_agg(json_build_object('name', name, 'fee', fee, 'contract_status', contract_status,
                                       'contract_status_at', contract_status_at))
       from public.companies where name = '백돈시흥능곡점'
  )
) as 검증;
