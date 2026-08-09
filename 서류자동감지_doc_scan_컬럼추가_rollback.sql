-- 되돌리기: companies.doc_scan 컬럼 제거 (2026-08-09)
--
-- 안전한 이유: doc_scan 은 "감지 제안"만 담는 컬럼이다.
--   실제 서류 수령 상태는 companies.received_docs 에 있고, 거기에는 사람이 직접 누른 것만 들어간다.
--   따라서 이 컬럼을 지워도 잃는 업무 데이터가 없다(다시 스캔하면 그대로 만들어진다).
--
-- ⚠️ 컬럼을 지우기 전에 App.js 쪽 자동감지 UI 를 먼저 되돌릴 것.
--    코드가 남은 채 컬럼만 지우면 저장 시 42703(컬럼 없음) 이 난다.

alter table public.companies
  drop column if exists doc_scan;

select count(*) as 남은_doc_scan_컬럼
  from information_schema.columns
 where table_schema = 'public' and table_name = 'companies' and column_name = 'doc_scan';
