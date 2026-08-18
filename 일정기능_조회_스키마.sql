-- [읽기 전용] 일정 기능 설계용 스키마 조사 (2026-08-18)
select table_name as 테이블, ordinal_position as 순, column_name as 컬럼,
       data_type as 타입, is_nullable as 널허용, column_default as 기본값
  from information_schema.columns
 where table_schema = 'public'
   and table_name in ('calendar_events', 'team_notes')
 order by table_name, ordinal_position;
