-- ✅ 검증 — 배정DB 스냅샷 테이블. 단일 SELECT (run-sql.js 는 결과를 하나만 출력한다)
-- 전 행 pass=true 여야 정상.
select * from (
  select 1 as no, '테이블 존재' as 항목,
    (select count(*) from pg_class where relnamespace='public'::regnamespace and relname='assign_db_snapshot') = 1 as pass,
    (select count(*)::text from pg_class where relnamespace='public'::regnamespace and relname='assign_db_snapshot') as 실측
  union all
  select 2, 'RLS 켜져 있음',
    (select relrowsecurity from pg_class where relnamespace='public'::regnamespace and relname='assign_db_snapshot'),
    (select relrowsecurity::text from pg_class where relnamespace='public'::regnamespace and relname='assign_db_snapshot')
  union all
  select 3, '정책은 select 하나뿐 (쓰기 정책 없음)',
    (select count(*) from pg_policies where schemaname='public' and tablename='assign_db_snapshot') = 1
    and (select count(*) from pg_policies where schemaname='public' and tablename='assign_db_snapshot' and cmd='SELECT') = 1,
    (select coalesce(string_agg(policyname || '/' || cmd, ', '), '(없음)')
       from pg_policies where schemaname='public' and tablename='assign_db_snapshot')
  union all
  select 4, 'anon 권한 0건',
    (select count(*) from information_schema.role_table_grants
      where table_schema='public' and table_name='assign_db_snapshot' and grantee='anon') = 0,
    (select count(*)::text from information_schema.role_table_grants
      where table_schema='public' and table_name='assign_db_snapshot' and grantee='anon')
  union all
  -- 사람은 읽기만. 쓰기는 service_role 전용이므로 INSERT/UPDATE/DELETE 가 남아 있으면 안 된다.
  select 5, 'authenticated 는 SELECT 만',
    (select coalesce(string_agg(distinct privilege_type, ',' order by privilege_type), '')
       from information_schema.role_table_grants
      where table_schema='public' and table_name='assign_db_snapshot' and grantee='authenticated') = 'SELECT',
    (select coalesce(string_agg(distinct privilege_type, ',' order by privilege_type), '(없음)')
       from information_schema.role_table_grants
      where table_schema='public' and table_name='assign_db_snapshot' and grantee='authenticated')
  union all
  select 6, 'Realtime 발행 목록에 있음',
    (select count(*) from pg_publication_tables
      where pubname='supabase_realtime' and schemaname='public' and tablename='assign_db_snapshot') = 1,
    (select count(*)::text from pg_publication_tables
      where pubname='supabase_realtime' and schemaname='public' and tablename='assign_db_snapshot')
  union all
  select 7, 'RLS 꺼진 public 테이블 0개(전체 점검)',
    (select count(*) from pg_class c
      where c.relnamespace='public'::regnamespace and c.relkind='r' and c.relrowsecurity = false) = 0,
    (select coalesce(string_agg(c.relname, ', '), '없음') from pg_class c
      where c.relnamespace='public'::regnamespace and c.relkind='r' and c.relrowsecurity = false)
  union all
  select 8, '스냅샷 행 수 (아직 0이면 Apps Script 미설정)',
    true,
    (select coalesce(max(row_count)::text || '행 · ' || max(synced_at)::text, '(아직 동기화 없음)')
       from public.assign_db_snapshot)
) t order by no;
