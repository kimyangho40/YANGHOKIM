-- =====================================================================
-- 🔐 보안 강화: RLS(행 수준 보안) + 회원가입 승인제
-- 실행 위치: Supabase 대시보드 → SQL Editor (anon 키로는 실행 불가)
-- 프로젝트: ujdrjvnihxjvbkezjvwc
-- 특징: 멱등(여러 번 실행해도 안전). 위에서 아래로 전체를 한 번에 실행하세요.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0) profiles: 승인 상태(status) 컬럼 추가
--    pending  = 가입 후 승인 대기 (로그인은 되지만 데이터 접근 차단)
--    approved = 관리자 승인 완료 (정상 이용 가능)
--    rejected = 거절
-- ---------------------------------------------------------------------
alter table public.profiles
  add column if not exists status text not null default 'pending';

do $$ begin
  alter table public.profiles
    add constraint profiles_status_chk check (status in ('pending','approved','rejected'));
exception when duplicate_object then null; end $$;

-- ⚠️ 중요: 기존 사용자는 전부 '승인'으로 (안 하면 기존 팀원이 잠깁니다)
update public.profiles set status = 'approved'
 where status is null or status = 'pending';

-- 최초 관리자 보장 (본인 계정을 관리자 + 승인으로 고정)
update public.profiles p
   set role = 'admin', status = 'approved'
  from auth.users u
 where p.id = u.id and u.email = 'kimyangho000@gmail.com';

-- ---------------------------------------------------------------------
-- 1) 권한 확인 헬퍼 함수 (SECURITY DEFINER → profiles RLS 재귀 방지)
-- ---------------------------------------------------------------------
create or replace function public.is_approved()
returns boolean language sql security definer stable
set search_path = public as $$
  select exists (
    select 1 from public.profiles
     where id = auth.uid() and status = 'approved'
  );
$$;

create or replace function public.is_admin()
returns boolean language sql security definer stable
set search_path = public as $$
  select exists (
    select 1 from public.profiles
     where id = auth.uid() and role = 'admin' and status = 'approved'
  );
$$;

-- ---------------------------------------------------------------------
-- 2) profiles 테이블 RLS
-- ---------------------------------------------------------------------
alter table public.profiles enable row level security;

-- 조회: 로그인 사용자는 팀원 목록 조회 가능
drop policy if exists p_profiles_select on public.profiles;
create policy p_profiles_select on public.profiles
  for select to authenticated using (true);

-- 생성: 본인 프로필 최초 1회만. 권한/상태 위조 방지(member/pending 고정)
drop policy if exists p_profiles_insert on public.profiles;
create policy p_profiles_insert on public.profiles
  for insert to authenticated
  with check (id = auth.uid() and role = 'member' and status = 'pending');

-- 수정: 본인 or 관리자만
drop policy if exists p_profiles_update on public.profiles;
create policy p_profiles_update on public.profiles
  for update to authenticated
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

-- 삭제: 관리자만
drop policy if exists p_profiles_delete on public.profiles;
create policy p_profiles_delete on public.profiles
  for delete to authenticated using (public.is_admin());

-- 일반 사용자가 스스로 role/status 를 승격하지 못하도록 트리거로 보호
-- (본인 프로필 수정은 허용하되, 관리자만 role/status 변경 가능)
create or replace function public.protect_profile_privileges()
returns trigger language plpgsql security definer
set search_path = public as $$
begin
  if not public.is_admin() then
    new.role   := old.role;
    new.status := old.status;
  end if;
  return new;
end $$;

drop trigger if exists trg_protect_profile on public.profiles;
create trigger trg_protect_profile
  before update on public.profiles
  for each row execute function public.protect_profile_privileges();

-- ---------------------------------------------------------------------
-- 3) 데이터 테이블 RLS
--    '승인된 로그인 사용자'만 전체 접근 / anon(비로그인·유출된 anon키)은 완전 차단
--    → 정책 없는 anon 역할은 RLS on 상태에서 자동으로 모두 거부됩니다.
-- ---------------------------------------------------------------------
do $$
declare
  t text;
  tbls text[] := array[
    'companies','agency_cases','work_notes','db_leads','activity_logs',
    'team_notes','approval_cases','leave_requests','settlement_manual',
    'partners','quick_links','calendar_events','push_subscriptions',
    'kpi_goals','documents','branch_contacts'
  ];
begin
  foreach t in array tbls loop
    if to_regclass('public.'||t) is null then
      raise notice '건너뜀(테이블 없음): %', t;
      continue;
    end if;
    execute format('alter table public.%I enable row level security;', t);
    execute format('drop policy if exists p_%s_all on public.%I;', t, t);
    execute format(
      'create policy p_%s_all on public.%I for all to authenticated '
      || 'using (public.is_approved()) with check (public.is_approved());',
      t, t);
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- 4) 확인 쿼리 (실행 후 결과 확인용)
--    rls_enabled 가 모두 true 여야 하고, 각 테이블에 정책이 1개 이상 있어야 합니다.
-- ---------------------------------------------------------------------
select relname as table_name, relrowsecurity as rls_enabled
  from pg_class
 where relnamespace = 'public'::regnamespace
   and relkind = 'r'
 order by relname;
