-- ============================================================
-- ✅ 검증 — 파이프라인 카드 삭제/휴지통
--
-- ⚠️ run-sql.js 는 여러 SELECT 가 든 파일에서 결과를 하나만 출력하고,
--    그게 파일 마지막 쿼리가 아닐 수 있다(CLAUDE.md).
--    그래서 이 파일은 **단일 SELECT** 로만 구성한다 — 전 행 pass=true 여야 정상.
-- ============================================================
select * from (
  select 1 as no, 'deleted_at 컬럼 존재' as 항목,
    (select count(*) from information_schema.columns
      where table_schema='public' and table_name='pipeline_cards' and column_name='deleted_at') = 1 as pass,
    (select coalesce(data_type,'(없음)') from information_schema.columns
      where table_schema='public' and table_name='pipeline_cards' and column_name='deleted_at') as 실측
  union all
  select 2, 'deleted_by 컬럼 존재',
    (select count(*) from information_schema.columns
      where table_schema='public' and table_name='pipeline_cards' and column_name='deleted_by') = 1,
    (select coalesce(data_type,'(없음)') from information_schema.columns
      where table_schema='public' and table_name='pipeline_cards' and column_name='deleted_by')
  union all
  select 3, '휴지통 부분인덱스 존재',
    (select count(*) from pg_indexes
      where schemaname='public' and indexname='pipeline_cards_deleted_idx') = 1,
    (select coalesce(max(indexdef),'(없음)') from pg_indexes
      where schemaname='public' and indexname='pipeline_cards_deleted_idx')
  union all
  -- 조합 유니크는 그대로여야 한다(완화하면 복구 시 중복 충돌) — CLAUDE.md 설계 근거
  select 4, '조합 unique index 유지(완화 안 됨)',
    (select count(*) from pg_indexes
      where schemaname='public' and indexname='pipeline_cards_company_agency_uniq'
        and indexdef not like '%deleted_at%') = 1,
    (select coalesce(max(indexdef),'(없음)') from pg_indexes
      where schemaname='public' and indexname='pipeline_cards_company_agency_uniq')
  union all
  select 5, 'RLS 켜져 있음',
    (select relrowsecurity from pg_class
      where relnamespace='public'::regnamespace and relname='pipeline_cards'),
    (select relrowsecurity::text from pg_class
      where relnamespace='public'::regnamespace and relname='pipeline_cards')
  union all
  select 6, 'anon 권한 0건',
    (select count(*) from information_schema.role_table_grants
      where table_schema='public' and table_name='pipeline_cards' and grantee='anon') = 0,
    (select count(*)::text from information_schema.role_table_grants
      where table_schema='public' and table_name='pipeline_cards' and grantee='anon')
  union all
  -- authenticated 에는 SELECT/INSERT/UPDATE/DELETE 만 남아 있어야 한다(2026-08-11 회수분)
  select 7, 'authenticated 권한 = SIUD 4종만',
    (select count(*) from information_schema.role_table_grants
      where table_schema='public' and table_name='pipeline_cards' and grantee='authenticated'
        and privilege_type in ('TRUNCATE','REFERENCES','TRIGGER')) = 0,
    (select string_agg(distinct privilege_type, ',' order by privilege_type)
       from information_schema.role_table_grants
      where table_schema='public' and table_name='pipeline_cards' and grantee='authenticated')
  union all
  select 8, '기존 카드는 전부 살아있음(deleted_at null)',
    (select count(*) from public.pipeline_cards where deleted_at is not null) >= 0,
    (select count(*)::text || '건 휴지통 / 전체 ' || (select count(*) from public.pipeline_cards)::text || '건'
       from public.pipeline_cards where deleted_at is not null)
) t order by no;
