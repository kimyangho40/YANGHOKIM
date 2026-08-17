-- 🔍 [읽기 전용] 현애·인선·미현 이름이 들어간 컬럼을 public 스키마 전체에서 스캔
-- 아무것도 수정하지 않는다. SELECT 하나만 있으므로 run-sql.js 로 돌려도 결과가 정확히 나온다.
select table_name, column_name, cnt
from (
  select c.table_name, c.column_name,
         (xpath('/row/cnt/text()',
            query_to_xml(
              format('select count(*) as cnt from public.%I where %I ~ %L',
                     c.table_name, c.column_name, '(현애|인선|미현)'),
              false, true, '')
         ))[1]::text::int as cnt
  from information_schema.columns c
  join information_schema.tables t
    on t.table_schema = c.table_schema
   and t.table_name   = c.table_name
   and t.table_type   = 'BASE TABLE'
  where c.table_schema = 'public'
    and c.data_type in ('text', 'character varying')
    and c.column_name in (
      'assignee','target_assignee','assigned_by','owner_name','posted_by',
      'sender','created_by','requester_name','name','staff','writer',
      'to_name','from_name','manager','담당자'
    )
) s
where cnt > 0
order by cnt desc, table_name, column_name;
