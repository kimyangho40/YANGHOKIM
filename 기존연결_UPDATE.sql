-- ============================================================
-- [2_기존연결] 날짜 접두어만 제거하면 기존 companies 와 매칭되는 2건
--   '4/20 뚱이농산' → '뚱이농산',  '4/21 응암식당' → '응암식당'
-- (이전에 제외 결정한 글라스히어로즈(인천점)·비티버거앤타코 2건은 포함하지 않음)
-- ============================================================
BEGIN;

-- 실행 전 확인용:
-- SELECT id, business_name FROM agency_cases
--   WHERE business_name IN ('4/20 뚱이농산','4/21 응암식당') AND deleted_at IS NULL;
-- SELECT name FROM companies WHERE name IN ('뚱이농산','응암식당') AND deleted_at IS NULL;

UPDATE agency_cases SET business_name = '뚱이농산' WHERE business_name = '4/20 뚱이농산' AND deleted_at IS NULL;  -- 1건
UPDATE agency_cases SET business_name = '응암식당' WHERE business_name = '4/21 응암식당' AND deleted_at IS NULL;  -- 1건

-- 검증: 아래가 0이면 두 건 모두 정리됨
-- SELECT count(*) FROM agency_cases
--   WHERE business_name IN ('4/20 뚱이농산','4/21 응암식당') AND deleted_at IS NULL;

COMMIT;
