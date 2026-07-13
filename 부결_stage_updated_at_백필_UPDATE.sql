-- =====================================================================
-- [백필] 기존 '부결/반려' 업체의 stage_updated_at 채우기
-- 대상 테이블: public.companies
-- 실행 위치: Supabase 대시보드 → SQL Editor
-- 목적: 청년창업 6개월 재신청 판정·정체일수의 '부결일(상태변경일)' 기준 보정
-- 안전장치: stage_updated_at 이 비어있는 행만 채움(기존 값 보존) · 백업테이블 생성 · 멱등
--
-- 부결일 추정 우선순위(가장 정확한 값부터):
--   1) 사례집(approval_cases) 부결 카드의 result_at
--      → stage 가 '부결/반려'로 바뀔 때 자동 생성되므로 실제 부결일에 가장 근접
--   2) companies.updated_at (마지막 수정일) 의 날짜
--   3) companies.contract_date (계약일)
-- =====================================================================

BEGIN;

-- ── (0) 실행 전 미리보기 — 먼저 이 SELECT만 돌려 대상/적용될 날짜를 확인하세요 ──
--     will_set 이 채워질 값입니다. 이상 없으면 아래 UPDATE 까지 함께 실행하세요.
SELECT
  c.id,
  c.name,
  c.stage,
  c.stage_updated_at                         AS 현재값,
  ( SELECT left(max(ac.result_at)::text, 10)
      FROM public.approval_cases ac
     WHERE ac.business_name = c.name
       AND ac.result = '부결'
       AND ac.deleted_at IS NULL )           AS 사례집_부결일,
  left(c.updated_at::text, 10)               AS 수정일,
  c.contract_date::text                      AS 계약일,
  COALESCE(
    ( SELECT left(max(ac.result_at)::text, 10)
        FROM public.approval_cases ac
       WHERE ac.business_name = c.name
         AND ac.result = '부결'
         AND ac.deleted_at IS NULL ),
    left(c.updated_at::text, 10),
    c.contract_date::text
  )                                          AS will_set
FROM public.companies c
WHERE c.stage = '부결/반려'
  AND (c.stage_updated_at IS NULL OR c.stage_updated_at::text = '')
  AND c.deleted_at IS NULL
ORDER BY c.name;

-- ── (1) 백업: 바꾸기 전 대상 행의 (id, 기존 stage_updated_at) 을 보관 → 되돌리기용 ──
CREATE TABLE IF NOT EXISTS public._bak_stage_updated_at_backfill (
  id                bigint,
  old_value         text,
  backed_up_at      timestamptz DEFAULT now()
);
INSERT INTO public._bak_stage_updated_at_backfill (id, old_value)
SELECT c.id, c.stage_updated_at::text
FROM public.companies c
WHERE c.stage = '부결/반려'
  AND (c.stage_updated_at IS NULL OR c.stage_updated_at::text = '')
  AND c.deleted_at IS NULL
  AND NOT EXISTS (SELECT 1 FROM public._bak_stage_updated_at_backfill b WHERE b.id = c.id);

-- ── (2) 백필 실행: 비어있는 행만, 추정 우선순위대로 채움 ──
UPDATE public.companies c
SET stage_updated_at = COALESCE(
    ( SELECT left(max(ac.result_at)::text, 10)
        FROM public.approval_cases ac
       WHERE ac.business_name = c.name
         AND ac.result = '부결'
         AND ac.deleted_at IS NULL ),
    left(c.updated_at::text, 10),
    c.contract_date::text
  )
WHERE c.stage = '부결/반려'
  AND (c.stage_updated_at IS NULL OR c.stage_updated_at::text = '')
  AND c.deleted_at IS NULL
  AND COALESCE(
    ( SELECT left(max(ac.result_at)::text, 10)
        FROM public.approval_cases ac
       WHERE ac.business_name = c.name
         AND ac.result = '부결'
         AND ac.deleted_at IS NULL ),
    left(c.updated_at::text, 10),
    c.contract_date::text
  ) IS NOT NULL;

-- ── (3) 검증: 아직도 비어있는 '부결/반려' 업체 수 (모든 근거가 없어 못 채운 건만 남음) ──
SELECT count(*) AS 남은_미채움_건수
FROM public.companies
WHERE stage = '부결/반려'
  AND (stage_updated_at IS NULL OR stage_updated_at::text = '')
  AND deleted_at IS NULL;

COMMIT;

-- =====================================================================
-- 되돌리기(복구): 이번 백필로 채운 값만 원래대로(대부분 NULL) 되돌림
-- =====================================================================
-- BEGIN;
-- UPDATE public.companies c
-- SET stage_updated_at = b.old_value
-- FROM public._bak_stage_updated_at_backfill b
-- WHERE c.id = b.id;
-- COMMIT;
-- -- 정리: DROP TABLE public._bak_stage_updated_at_backfill;
