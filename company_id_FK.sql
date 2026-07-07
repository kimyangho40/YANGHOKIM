-- ============================================================
-- agency_cases 에 company_id(FK) 추가 + 기존 문자열 매칭 백필
-- ※ 스키마 변경(DDL) → Supabase 대시보드 SQL Editor에서 실행 (anon 키로는 불가)
-- ※ 문자열 정합화(기존연결2 포함) 모두 끝난 뒤 마지막에 실행 권장
-- ============================================================
BEGIN;

-- 1) 컬럼 추가
ALTER TABLE agency_cases ADD COLUMN IF NOT EXISTS company_id uuid;

-- 2) FK 제약 추가 (없을 때만)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'agency_cases_company_id_fkey') THEN
    ALTER TABLE agency_cases
      ADD CONSTRAINT agency_cases_company_id_fkey
      FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 3) 인덱스
CREATE INDEX IF NOT EXISTS idx_agency_cases_company_id ON agency_cases(company_id);

-- 4) 백필: business_name 이 일치하는 회사의 id 연결 (활성 회사만)
UPDATE agency_cases ac
   SET company_id = c.id
  FROM companies c
 WHERE c.name = ac.business_name
   AND c.deleted_at IS NULL
   AND ac.company_id IS NULL;

-- 검증: 활성 케이스 중 아직 회사 연결 안 된 수 (신규등록 미처리분과 일치해야 함)
-- SELECT count(*) FROM agency_cases WHERE deleted_at IS NULL AND company_id IS NULL;

COMMIT;
