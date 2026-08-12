-- ============================================================
-- ↩ 되돌리기 — 배정DB 스냅샷 테이블 제거
--
-- ⚠️ 지우면 CRM 배정DB 화면이 "아직 동기화되지 않았습니다"로 바뀐다.
--    구글시트 원본과 Apps Script 는 영향이 없다(시트가 원본이므로 데이터 손실은 아니다).
--    다시 만들려면 배정DB_스냅샷_테이블.sql 을 실행하고 Apps Script 에서 syncAssignDb() 를 한 번 돌리면 된다.
-- ============================================================
begin;
  set local lock_timeout = '3s';
  do $$
  begin
    if exists (
      select 1 from pg_publication_tables
       where pubname='supabase_realtime' and schemaname='public' and tablename='assign_db_snapshot'
    ) then
      alter publication supabase_realtime drop table public.assign_db_snapshot;
    end if;
  end $$;
  drop policy if exists p_assign_db_snapshot_select on public.assign_db_snapshot;
  drop table if exists public.assign_db_snapshot;
commit;

-- 확인 — 0 이어야 정상
select count(*) as remaining
  from pg_class
 where relnamespace='public'::regnamespace and relname='assign_db_snapshot';
