-- ============================================================
-- 📋 배정DB 2단계 — 구글시트 스냅샷 테이블  (2026-08-12)
--
-- 구글시트 → Apps Script → /api/assign-db-sync → **이 테이블** → CRM 화면.
-- 팀원은 구글 연결 없이 이 테이블만 읽는다.
--
-- ⚠️ 컬럼을 고정 스키마로 펼치지 않는다. 시트의 2차원 배열을 **가공 없이 jsonb 한 칸**에 넣는다.
--    헤더 판정·컬럼 정리는 App.js 의 buildAssignDbTable() 이 한다(1단계에서 18/18 검증한 코드).
--    컬럼을 테이블로 펼치는 순간 "시트를 고쳐도 CRM 은 안 고친다"는 이 기능의 존재 이유가 깨진다.
--
-- ⚠️ 쓰기 정책을 만들지 않는다. 쓰기는 service_role(정책 우회)로 서버리스 함수만 한다.
--    그래서 authenticated 에게서 INSERT/UPDATE/DELETE 권한 자체를 회수한다 — 사람은 아무도 못 쓴다.
--
-- 롤백: 배정DB_스냅샷_테이블_rollback.sql   검증: 배정DB_스냅샷_테이블_검증.sql
-- ============================================================
begin;
  set local lock_timeout = '3s';

  create table if not exists public.assign_db_snapshot (
    id         text primary key default 'default',           -- 항상 1행("default")만 쓴다
    grid       jsonb       not null default '[]'::jsonb,     -- 시트 2차원 배열 그대로
    row_count  int         not null default 0,               -- grid 길이(빠른 확인·안전장치용)
    sheet_name text,                                         -- 읽어온 탭 이름
    synced_at  timestamptz not null default now(),
    source     text                                          -- 'change' | 'timer' | 'manual'
  );

  comment on table public.assign_db_snapshot is
    '구글시트 "배정DB_김동일 이사님" 의 최신 스냅샷 1행. 쓰기는 /api/assign-db-sync(service_role) 만.';
  comment on column public.assign_db_snapshot.grid is
    '시트 getDisplayValues() 2차원 배열 그대로. 헤더 판정은 App.js buildAssignDbTable() 담당 — 여기서 펼치지 말 것.';

  -- 옛 정책이 남아 OR 로 합쳐지는 사고를 막기 위해 먼저 지운다(CLAUDE.md 2-2)
  drop policy if exists p_assign_db_snapshot_all    on public.assign_db_snapshot;
  drop policy if exists p_assign_db_snapshot_select on public.assign_db_snapshot;

  -- 읽기만. 승인된 로그인 사용자 전원(배정DB 는 팀 공용 정보 — 사용자 결정)
  create policy p_assign_db_snapshot_select on public.assign_db_snapshot
    for select to authenticated
    using (public.is_approved());

  alter table public.assign_db_snapshot enable row level security;

  -- anon 은 아무것도 못 한다
  revoke all on public.assign_db_snapshot from anon;
  -- 사람(authenticated)은 읽기만. 쓰기 권한 자체를 주지 않는다(정책 + 권한 이중 차단)
  revoke insert, update, delete, truncate, references, trigger
    on public.assign_db_snapshot from authenticated;
  grant select on public.assign_db_snapshot to authenticated;
commit;

-- 화면이 Realtime 으로 갱신을 받으려면 발행 목록에 있어야 한다(채팅과 같은 방식).
-- 이미 들어 있으면 42710 이 나므로 조건부로 넣는다.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
     where pubname = 'supabase_realtime'
       and schemaname = 'public' and tablename = 'assign_db_snapshot'
  ) then
    alter publication supabase_realtime add table public.assign_db_snapshot;
  end if;
end $$;

select
  (select count(*) from pg_class
    where relnamespace='public'::regnamespace and relname='assign_db_snapshot' and relrowsecurity) as rls_on,
  (select count(*) from pg_policies
    where schemaname='public' and tablename='assign_db_snapshot')                                  as policies,
  (select count(*) from information_schema.role_table_grants
    where table_schema='public' and table_name='assign_db_snapshot' and grantee='anon')            as anon_grants,
  (select string_agg(distinct privilege_type, ',' order by privilege_type)
     from information_schema.role_table_grants
    where table_schema='public' and table_name='assign_db_snapshot' and grantee='authenticated')   as auth_grants,
  (select count(*) from pg_publication_tables
    where pubname='supabase_realtime' and schemaname='public' and tablename='assign_db_snapshot')  as realtime;
