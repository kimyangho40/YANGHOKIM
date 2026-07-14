-- ═══════════════════════════════════════════════════════════════════
-- 규모/기관 배지 수동 보정값 (biz_match_override)
--
-- 배경: 업종 키워드 매칭·매출 기준으로는 자동판정이 틀리거나 판정 불가한 경우가 있어,
--       담당자가 배지를 직접 고칠 수 있게 함. 수동값은 자동판정보다 항상 우선.
--
-- 구조(JSONB): 키가 없으면 그 항목은 자동판정, NULL이면 전체 자동판정
--   {
--     "grade": "소상공인" | "중소기업",
--     "jg":    "가능" | "불가",              -- 중진공
--     "sj":    "불가" | "일반형" | "혁신형"   -- 소진공
--   }
--
-- ⚠️ 이 컬럼이 없어도 기존 저장은 깨지지 않는다(saveCompany가 사용자가 보정을
--    실제로 손댔을 때만 전송). 다만 컬럼 없이 보정을 저장하면 그 기업만 저장 실패.
-- ═══════════════════════════════════════════════════════════════════

ALTER TABLE companies ADD COLUMN IF NOT EXISTS biz_match_override JSONB;

COMMENT ON COLUMN companies.biz_match_override IS '규모/기관 배지 수동 보정값';

-- 확인용
-- SELECT column_name, data_type FROM information_schema.columns
--  WHERE table_name = 'companies' AND column_name = 'biz_match_override';
