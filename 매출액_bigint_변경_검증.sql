-- 검증 — 실행 파일에 딸린 SELECT 를 믿지 말고 이걸로 다시 확인한다(CLAUDE.md 2-2).
-- 4행 전부 data_type = 'bigint' 여야 정상.
select column_name, data_type
  from information_schema.columns
 where table_schema = 'public' and table_name = 'companies'
   and column_name in ('revenue_2023','revenue_2024','revenue_2025','revenue_2026_h1')
 order by column_name;
