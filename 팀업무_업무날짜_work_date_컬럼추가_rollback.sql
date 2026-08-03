-- 롤백 — 팀업무_업무날짜_work_date_컬럼추가.sql 되돌리기
--
-- ⚠️ 컬럼을 지우면 그동안 입력된 업무 날짜 값이 함께 사라진다(복구 불가).
--    프런트를 먼저 되돌린 뒤(App.js 에서 work_date 를 payload 에 넣지 않게) 실행할 것.
--    프런트가 아직 work_date 를 보내는 상태에서 실행하면 등록이 전부 실패한다.

alter table public.team_notes
  drop column if exists work_date;

-- 검증 — 컬럼이 사라졌는지 (0행이어야 정상)
select column_name
  from information_schema.columns
 where table_schema = 'public'
   and table_name = 'team_notes'
   and column_name = 'work_date';
