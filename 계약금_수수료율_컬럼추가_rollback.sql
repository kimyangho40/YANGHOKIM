-- 되돌리기: 계약금_수수료율_컬럼추가.sql
-- ⚠ 컬럼을 지우면 입력해 둔 계약금·수수료율 값이 같이 사라진다.
--    코드(src/App.js)를 먼저 되돌리고, 값이 필요 없다고 확인한 뒤에 실행할 것.

begin;

alter table public.companies         drop column if exists contract_amount;
alter table public.settlement_manual drop column if exists commission_rate;

commit;
