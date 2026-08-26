-- 매출액 컬럼 타입 확인 + 자릿수 잘림 의심 건 조회 (읽기 전용 · 아무것도 바꾸지 않는다)
-- 실행: node scripts/run-sql.js 매출액_잘림의심_조회.sql
--
-- ⚠️ run-sql.js 는 결과를 하나만 찍는다(CLAUDE.md 2-2) → 아래 SELECT 를 한 번에 하나씩 주석 해제해 돌릴 것.
--
-- ■ 왜 보는가
-- companies 의 숫자 컬럼은 Supabase UI 기본값 integer(int4, 최대 2,147,483,647 ≈ 21.47억) 로
-- 만들어진 전례가 있다(2026-08-15 companies.fee 가 integer 라 수수료율 4.8 이 421번 재시도 실패).
-- 매출 21.47억을 넘는 업체는 흔하므로, revenue_* 가 int4 면 30억 매출은 저장 자체가 거절된다.

-- ① 컬럼 타입 (여기서 integer 로 나오면 그게 원인이다)
select column_name, data_type, numeric_precision, numeric_scale
  from information_schema.columns
 where table_schema = 'public' and table_name = 'companies'
   and column_name in ('revenue_2023','revenue_2024','revenue_2025','revenue_2026_h1')
 order by column_name;

-- ② int4 상한에 걸릴 수 있는 값의 분포 (살아있는 기업만)
-- select
--   count(*) filter (where revenue_2025 >= 2000000000) as "2025_20억이상",
--   count(*) filter (where revenue_2024 >= 2000000000) as "2024_20억이상",
--   count(*) filter (where revenue_2023 >= 2000000000) as "2023_20억이상",
--   max(greatest(coalesce(revenue_2023,0), coalesce(revenue_2024,0), coalesce(revenue_2025,0))) as "최대매출"
-- from public.companies where deleted_at is null;

-- ③ 잘림 의심 목록 — 같은 업체의 연도별 매출이 100배 이상 차이 나는 건
--    (뒷자리 2~3자리가 날아가면 전년 대비 1/100 규모가 된다)
-- select name, revenue_2023, revenue_2024, revenue_2025, revenue_2026_h1
--   from public.companies
--  where deleted_at is null
--    and (
--      (revenue_2024 > 0 and revenue_2025 > 0 and (revenue_2024 >= revenue_2025 * 100 or revenue_2025 >= revenue_2024 * 100))
--   or (revenue_2023 > 0 and revenue_2024 > 0 and (revenue_2023 >= revenue_2024 * 100 or revenue_2024 >= revenue_2023 * 100))
--    )
--  order by name;

-- ④ 기업현황표 원문(비고 메모의 [원문 보존])과 저장값이 어긋나는지 눈으로 볼 목록
--    자동 수정 금지 — 원본 문서를 봐야 판정된다(CLAUDE.md 기대출 단위확정과 같은 성격).
-- select name, revenue_2023, revenue_2024, revenue_2025,
--        left(coalesce(company_info_memo,''), 300) as memo
--   from public.companies
--  where deleted_at is null and company_info_memo like '%매출%'
--  order by name;
