-- ════════════════════════════════════════════════════════════════════════════
-- 팀 공지 고정 기능 — team_notes.is_announcement 컬럼 추가
-- Supabase → SQL Editor 에서 1회 실행하세요.
--   · 📌 공지로 등록한 팀 업무 카드를 목록 최상단에 고정하기 위한 플래그.
--   · 컬럼이 없어도 앱은 동작(공지 없이 등록)하지만, 이 컬럼이 있어야 공지 고정이 저장됩니다.
--   · (확인 기능용 read_by 컬럼은 이전 배치에서 이미 추가됨)
-- ════════════════════════════════════════════════════════════════════════════

ALTER TABLE team_notes
  ADD COLUMN IF NOT EXISTS is_announcement boolean NOT NULL DEFAULT false;

-- 확인용: 공지로 등록된 카드 조회
-- SELECT id, team, title, is_announcement, read_by, status
-- FROM team_notes
-- WHERE is_announcement = true AND deleted_at IS NULL
-- ORDER BY created_at DESC;
