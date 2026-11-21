-- 검증: 메타신청_db_leads_컬럼추가.sql — 전부 pass 여야 정상.
-- ⚠️ run-sql.js 는 결과를 하나만 출력하므로 검사 전체를 한 SELECT 로 묶었다(CLAUDE.md 2-2).
with cols as (
  select column_name, data_type, is_nullable, column_default
    from information_schema.columns
   where table_schema = 'public' and table_name = 'db_leads'
     and column_name in ('source','meta_lead_id','meta_form_name','meta_ad_name','meta_answers','applied_at','first_contact_at')
)
select json_build_object(
  '1_컬럼7개_존재', (select case when count(*) = 7 then 'pass' else 'FAIL: ' || count(*) end from cols),
  '2_타입', (select json_object_agg(column_name, data_type) from cols),
  '3_전부_NULL허용_기본값없음', (select case when count(*) = 7 then 'pass' else 'FAIL: ' || count(*) end
                                   from cols where is_nullable = 'YES' and column_default is null),
  '4_제약2개', (select case when count(*) = 2 then 'pass' else 'FAIL: ' || count(*) end from pg_constraint
                 where conrelid = 'public.db_leads'::regclass and conname in ('db_leads_source_chk','db_leads_meta_answers_chk')),
  '5_인덱스2개(신청번호 unique 포함)', (select case when count(*) = 2 and bool_or(indexdef like 'CREATE UNIQUE%') then 'pass' else 'FAIL: ' || count(*) end
                 from pg_indexes where schemaname = 'public' and tablename = 'db_leads'
                  and indexname in ('db_leads_meta_lead_id_key','db_leads_source_applied_idx')),
  '6_기존행_변화없음(새칸 값 있는 직접입력 행 0)', (select case when count(*) = 0 then 'pass' else 'FAIL: ' || count(*) end
     from public.db_leads
    where source is null and (meta_lead_id is not null or meta_form_name is not null or meta_ad_name is not null
       or meta_answers is not null or applied_at is not null or first_contact_at is not null)),
  '7_RLS_켜짐', (select case when relrowsecurity then 'pass' else 'FAIL' end from pg_class where oid = 'public.db_leads'::regclass),
  '8_anon_테이블권한_0', (select case when count(*) = 0 then 'pass' else 'FAIL: ' || count(*) end
     from information_schema.role_table_grants where table_schema = 'public' and table_name = 'db_leads' and grantee = 'anon'),
  '9_행수', (select json_build_object('전체', count(*), '살아있음', count(*) filter (where deleted_at is null),
                                     '메타신청', count(*) filter (where source = 'meta')) from public.db_leads)
) as 검증;
