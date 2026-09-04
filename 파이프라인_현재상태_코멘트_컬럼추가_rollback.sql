-- 되돌리기 — 파이프라인 「현재 상태」 코멘트 컬럼 3개 제거 (2026-09-04)
--
-- ⚠️ 사람이 적어 둔 문구가 같이 사라진다. 지우기 전에 아래를 먼저 떠서 보관할 것:
--   select id, name, status_comment, status_comment_at, status_comment_by
--     from public.companies
--    where coalesce(btrim(status_comment),'') <> '';
--
-- ⚠️ 컬럼을 지우면 화면에서 「현재 상태」 수동 문구가 사라지고 전부 자동표시로 돌아간다.
--    App.js 쪽 코드는 co.status_comment 가 undefined 여도 안 터진다(빈 문자열로 취급).
alter table public.companies
  drop column if exists status_comment,
  drop column if exists status_comment_at,
  drop column if exists status_comment_by;
