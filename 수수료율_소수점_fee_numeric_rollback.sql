-- 되돌리기: companies.fee 를 다시 integer 로. (2026-08-15)
-- ⚠️ 되돌리면 소수점이 있는 값은 반올림되어 **영구히 사라진다**(4.8 → 5).
--    되돌리기 전에 아래로 손실될 행을 먼저 확인할 것.
--    select id, name, fee from public.companies
--     where fee is not null and fee <> round(fee);
alter table public.companies
  alter column fee type integer using round(fee)::integer;

comment on column public.companies.fee is null;
