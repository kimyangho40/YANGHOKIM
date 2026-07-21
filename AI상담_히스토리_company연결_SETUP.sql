-- ============================================================
-- (1) AI 상담 대화 히스토리 테이블 생성
-- (2) agency_cases.company_id 미연결 건 업체명 기준 자동 백필
-- 실행: node scripts/run-sql.js AI상담_히스토리_company연결_SETUP.sql
-- ============================================================
BEGIN;

-- 1) AI 상담 히스토리 --------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ai_chat_history (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_name  text,
  title      text,
  messages   jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_chat_history_user_updated
  ON public.ai_chat_history (user_name, updated_at DESC);

-- anon 키로 앱이 동작하므로 RLS 미적용(다른 테이블과 동일 정책). 필요 시 별도 SETUP 참고.
COMMENT ON TABLE public.ai_chat_history IS 'AI 상담(전체검색) 대화 히스토리 — 대화별 메시지 배열 저장';

-- 2) company_id 백필: 업체명 정확 일치 활성 회사 연결 --------------------
UPDATE agency_cases ac
   SET company_id = c.id
  FROM companies c
 WHERE c.name = ac.business_name
   AND c.deleted_at IS NULL
   AND ac.company_id IS NULL
   AND ac.deleted_at IS NULL;

COMMIT;

-- 검증
SELECT
  (SELECT count(*) FROM ai_chat_history) AS chat_rows,
  (SELECT count(*) FROM agency_cases WHERE deleted_at IS NULL AND company_id IS NULL) AS unlinked_cases;
