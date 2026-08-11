-- 검증 — 조치 후 별도로 실행할 것. 모든 항목이 'OK' 여야 정상.

select
  case when (select count(*) from information_schema.columns
              where table_schema='public' and table_name='companies'
                and column_name='contract_amount' and data_type='numeric') = 1
       then 'OK' else 'FAIL' end                        as "① companies.contract_amount",
  case when (select count(*) from information_schema.columns
              where table_schema='public' and table_name='settlement_manual'
                and column_name='commission_rate' and data_type='numeric') = 1
       then 'OK' else 'FAIL' end                        as "② settlement_manual.commission_rate",
  -- 기존 칸이 그대로 살아 있는지 (덮어쓰기·이름 충돌 사고 방지)
  case when (select count(*) from information_schema.columns
              where table_schema='public' and table_name='settlement_manual'
                and column_name in ('contract_fee','commission_fee')) = 2
       then 'OK' else 'FAIL' end                        as "③ 기존_계약금·수수료_칸_유지",
  case when (select count(*) from information_schema.columns
              where table_schema='public' and table_name='companies'
                and column_name in ('fee','approved_amount','contract_status','fee_status')) = 4
       then 'OK' else 'FAIL' end                        as "④ 기업_기존칸_유지",
  -- 앱이 안 쓰는 권한이 안 붙어 있는지 (CLAUDE.md 2-2)
  case when (select count(*) from information_schema.role_table_grants
              where table_schema='public' and table_name in ('companies','settlement_manual')
                and grantee in ('authenticated','anon')
                and privilege_type in ('TRUNCATE','REFERENCES','TRIGGER')) = 0
       then 'OK' else 'FAIL' end                        as "⑤ TRUNCATE·REFERENCES·TRIGGER_0건",
  -- anon 은 두 테이블에 아무 권한도 없어야 한다
  case when (select count(*) from information_schema.role_table_grants
              where table_schema='public' and table_name in ('companies','settlement_manual')
                and grantee='anon') = 0
       then 'OK' else 'FAIL' end                        as "⑥ anon_권한_0건",
  -- 기존 데이터가 그대로인지
  (select count(*) from public.companies where deleted_at is null)::text          as "⑦ 기업수(조치전 397)",
  (select count(*) from public.settlement_manual where deleted_at is null)::text  as "⑧ 정산수동행(조치전 38)";
