-- =====================================================================
-- 중진공/신보 계산기 · 약점감지 · 수수료 등 신규 기능용 컬럼 추가
-- 대상 테이블: public.companies  (멱등 — 여러 번 실행해도 안전)
-- 실행 위치: Supabase 대시보드 → SQL Editor
-- =====================================================================

alter table public.companies add column if not exists lead_source              text;    -- 리드 출처(콘텐츠/블로그/지인 등)
alter table public.companies add column if not exists import_ratio             numeric; -- 수입비중(%) — 고환율 긴급트랙 판정
alter table public.companies add column if not exists debt_ratio               numeric; -- 부채비율(%) — 업종 상한 초과 감지
alter table public.companies add column if not exists interest_coverage_ratio  numeric; -- 이자보상배율 — 1.0 미만 위험
alter table public.companies add column if not exists approved_amount          numeric; -- 승인(예상)금액 — 수수료 계산기

-- 확인
select column_name, data_type
  from information_schema.columns
 where table_schema = 'public' and table_name = 'companies'
   and column_name in ('lead_source','import_ratio','debt_ratio','interest_coverage_ratio','approved_amount')
 order by column_name;
