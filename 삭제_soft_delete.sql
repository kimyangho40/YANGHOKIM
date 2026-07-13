-- ============================================================
-- [1_삭제] 테스트/오입력 agency_cases 5건 soft-delete
-- deleted_at 에 현재시각 기록 (물리삭제 아님, 복구 가능)
-- 이미 삭제된 행은 건드리지 않음 (deleted_at IS NULL 조건)
-- ============================================================
BEGIN;

-- 실행 전 확인용: 대상 5행이 맞는지 (원하면 먼저 SELECT만 실행)
-- SELECT id, business_name FROM agency_cases
--   WHERE business_name IN ('(주)nan','123','234','345','cjh687768+') AND deleted_at IS NULL;

UPDATE agency_cases SET deleted_at = now() WHERE business_name = '(주)nan'      AND deleted_at IS NULL;  -- 테스트/오입력
UPDATE agency_cases SET deleted_at = now() WHERE business_name = '123'          AND deleted_at IS NULL;  -- 테스트/오입력
UPDATE agency_cases SET deleted_at = now() WHERE business_name = '234'          AND deleted_at IS NULL;  -- 테스트/오입력
UPDATE agency_cases SET deleted_at = now() WHERE business_name = '345'          AND deleted_at IS NULL;  -- 테스트/오입력
UPDATE agency_cases SET deleted_at = now() WHERE business_name = 'cjh687768+'   AND deleted_at IS NULL;  -- 테스트/오입력

-- 검증: 아래가 0이면 5건 모두 삭제 처리됨
-- SELECT count(*) FROM agency_cases
--   WHERE business_name IN ('(주)nan','123','234','345','cjh687768+') AND deleted_at IS NULL;

COMMIT;

-- 되돌리기(복구)가 필요하면:
-- UPDATE agency_cases SET deleted_at = NULL
--   WHERE business_name IN ('(주)nan','123','234','345','cjh687768+');
