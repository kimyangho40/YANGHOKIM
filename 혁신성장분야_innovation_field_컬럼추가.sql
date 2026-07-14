-- ═══════════════════════════════════════════════════════════════════
-- 혁신성장·초격차·신산업 분야 여부 (중진공 예외 판정용 수동 플래그)
--
-- 배경: 소상공인은 중진공 원칙 제한(⑨)이나, "혁신성장·초격차·신산업 분야"면 예외로 신청 가능.
--       업종 텍스트로는 추정이 불가능해 담당자가 직접 체크하는 방식으로 관리.
--
-- ⚠️ 이 컬럼을 만들기 전에도 기존 저장은 깨지지 않는다(saveCompany가 boolean일 때만 전송).
--    다만 컬럼이 없으면 "혁신성장 분야" 체크박스를 켠 기업의 저장은 실패하므로,
--    체크박스를 실제로 쓰기 전에 실행할 것.
-- ═══════════════════════════════════════════════════════════════════

ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS innovation_field BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN companies.innovation_field IS
  '혁신성장·초격차·신산업 분야 해당 여부 (중진공 소상공인 예외 판정용, 담당자 수동 체크)';

-- 확인용
-- SELECT column_name, data_type, column_default, is_nullable
--   FROM information_schema.columns
--  WHERE table_name = 'companies' AND column_name = 'innovation_field';
