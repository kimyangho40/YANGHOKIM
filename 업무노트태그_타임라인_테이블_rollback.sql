-- 되돌리기: 업무노트태그_타임라인_테이블.sql
--
-- ⚠️ 테이블을 통째로 지운다 = 소급 마이그레이션으로 넣은 링크(276행)도 같이 사라진다.
--    원본(team_notes.checklist · work_notes.content)은 하나도 안 건드리므로,
--    다시 만들고 scripts/migrate-note-links.mjs --apply 를 돌리면 그대로 복구된다.
--    (그래서 이 기능은 "되돌리기가 싼" 축에 든다.)
--
-- ⚠️ App.js 쪽 코드가 아직 배포돼 있으면 화면에서 링크 조회가 실패한다.
--    코드를 먼저 되돌리거나, 함께 되돌릴 것.

drop table if exists public.note_company_links;
