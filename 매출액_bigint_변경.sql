-- 매출액 컬럼을 bigint 로 넓힌다. (조회 ①에서 integer 로 확인된 경우에만 실행할 것)
--
-- ■ 왜
-- integer(int4) 는 최대 2,147,483,647 ≈ 21.47억이다. 매출 30억짜리 업체를 입력하면
--     value "3002936000" is out of range for type integer   (SQLSTATE 22003)
-- 로 거절된다. CLAUDE.md 2-7 에 따라 이 실패는 '영구 실패'로 분류돼 재시도 큐에서 빠지므로
-- 사람 눈에는 "저장했는데 옛 값 그대로"로 보인다.
-- 2026-08-15 companies.fee(integer→numeric) 와 같은 계열의 수정이다.
--
-- ■ 안전한가
-- integer → bigint 는 값 손실이 없는 확대 변환이다. 기존 값은 그대로 남는다.
-- 읽는 쪽(App.js)은 전부 Number()/parseInt/formatRevenue 라 영향이 없다.
-- 화면 입력 상한은 12자리(9,999억)로 코드에서 이미 막는다(normalizeRevenueInput).
alter table public.companies
  alter column revenue_2023    type bigint using revenue_2023::bigint,
  alter column revenue_2024    type bigint using revenue_2024::bigint,
  alter column revenue_2025    type bigint using revenue_2025::bigint,
  alter column revenue_2026_h1 type bigint using revenue_2026_h1::bigint;

comment on column public.companies.revenue_2025 is
  '매출액(원). 2026-08-26 integer→bigint (21.47억 상한 때문에 30억 매출이 저장 거절되던 문제).';
