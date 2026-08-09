-- 되돌리기 — 서류방치알림_doc_alert_state_컬럼추가.sql (2026-08-10)
--
-- 컬럼을 통째로 지운다. 이 컬럼에는 알림 상태(마지막 알림 단계 · 봉인 여부)만 들어 있고
-- 서류 자체의 상태(requested_docs · received_docs · doc_request_dates)는 건드리지 않았으므로
-- 지워도 서류현황 데이터는 그대로다.
--
-- ⚠️ 지우면 "묵은 건 봉인"도 같이 사라진다 → 되돌린 뒤 화면은 다시 방치 68건이 전부 빨간불이 된다.
--    App.js 를 함께 되돌리지 않으면 D+7 알림이 묵은 건에도 한 번 울린다.
--    코드와 같이 되돌릴 것.

begin;

alter table public.companies
  drop column if exists doc_alert_state;

commit;

-- 검증(실행 후 별도로 다시 조회할 것) — 0행이어야 정상
select column_name
  from information_schema.columns
 where table_schema = 'public' and table_name = 'companies' and column_name = 'doc_alert_state';
