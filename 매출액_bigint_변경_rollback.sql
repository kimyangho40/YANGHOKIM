-- 되돌리기: 매출액 컬럼을 다시 integer 로. (2026-08-26)
-- ⚠️ 21.47억을 넘는 값이 하나라도 저장돼 있으면 이 문장은 22003 으로 실패한다.
--    되돌리기 전에 아래로 먼저 확인할 것:
--    select count(*) from public.companies
--     where greatest(coalesce(revenue_2023,0),coalesce(revenue_2024,0),
--                    coalesce(revenue_2025,0),coalesce(revenue_2026_h1,0)) > 2147483647;
alter table public.companies
  alter column revenue_2023    type integer using revenue_2023::integer,
  alter column revenue_2024    type integer using revenue_2024::integer,
  alter column revenue_2025    type integer using revenue_2025::integer,
  alter column revenue_2026_h1 type integer using revenue_2026_h1::integer;
