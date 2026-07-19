-- ════════════════════════════════════════════════════════════════════════════
-- 삭제된 업무노트 복구 확인 — 2026-07-19 (KST 기준)
-- Supabase → SQL Editor 에서 실행하세요.
-- deleted_at 은 UTC(timestamptz)로 저장되므로 한국시간(Asia/Seoul)으로 변환해 날짜 비교합니다.
-- ════════════════════════════════════════════════════════════════════════════

-- ── ① [먼저 실행] 오늘(7/19) 삭제된 노트 조회 ─────────────────────────────────
--    내용을 눈으로 확인하고, 복구할 노트의 id 를 골라두세요.
SELECT
  id,
  title                        AS 제목,
  assignee                     AS 담당자,
  note_date                    AS 노트날짜,
  (deleted_at AT TIME ZONE 'Asia/Seoul') AS 삭제시각_KST,
  LEFT(content, 120)           AS 내용미리보기
FROM work_notes
WHERE deleted_at IS NOT NULL
  AND (deleted_at AT TIME ZONE 'Asia/Seoul')::date = DATE '2026-07-19'
ORDER BY deleted_at DESC;


-- ── ②-A [선택 복구] 위에서 고른 노트만 되살리기 ──────────────────────────────
--    아래 id 목록을 실제 값으로 바꾼 뒤 실행하세요. (RETURNING 으로 복구 결과 확인)
-- UPDATE work_notes
--   SET deleted_at = NULL,
--       updated_at = now()
-- WHERE id IN ('여기에-id-1', '여기에-id-2')
-- RETURNING id, title, assignee;


-- ── ②-B [전체 복구] 오늘 삭제된 노트를 모두 되살리기 ─────────────────────────
--    ①에서 조회된 것이 전부 복구 대상일 때만 아래 주석을 풀고 실행하세요.
-- UPDATE work_notes
--   SET deleted_at = NULL,
--       updated_at = now()
-- WHERE deleted_at IS NOT NULL
--   AND (deleted_at AT TIME ZONE 'Asia/Seoul')::date = DATE '2026-07-19'
-- RETURNING id, title, assignee;
