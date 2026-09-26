-- ============================================================================
-- 💰 정산 열람·작성 권한 (settlement_permissions) — 테이블·RLS·트리거·시드
--   2026-09-26. 설계안대로 진행(D1=ⓐ · D2=ⓐ · D3=별도 테이블).
--
-- [무엇을 바꾸나]
--   지금까지 정산 전체 열람은 App.js 하드코딩 상수 하나였다:
--     const SETTLEMENT_ADMINS = ["관호", "동일", "양호", "유진"];   // App.js:1836
--   이 명단을 DB 로 옮겨 관리자가 「팀원 관리」 화면에서 직접 켜고 끌 수 있게 한다.
--   App.js 의 그 상수는 같은 커밋에서 **제거**한다(명단을 두 벌 두지 않는다).
--
-- [왜 profiles 컬럼이 아니라 별도 테이블인가]  ← 실측 근거 2가지
--   ① 중복 계정이 살아 있다. profiles 20행 / 이름 12개.
--      지혜는 계정 3개 중 **2개가 최근 로그인 중**(2026-09-16 · 09-09), 권구현 2개(둘 다 admin),
--      동일·유진·미현도 2~3개다. uuid 에 권한을 붙이면 "A계정에 켰는데 B계정으로 들어와 안 먹는"
--      상태가 실제로 발생한다. → **사람 단위 = 이름 키**여야 한다.
--      (이 앱의 다른 권한 게이트가 전부 이름 배열인 것과도 같은 축이다:
--       CHAT_TEAMS · WN_ADMINS · WEEKLY_REVIEW_MEMBERS)
--   ② profiles 에 컬럼을 붙이면 자가 승격 구멍이 생긴다.
--      p_profiles_update 가 `using (id = auth.uid() or is_admin())` 라 본인 행 수정을 허용하고,
--      trg_protect_profile 은 **role·status 두 개만** 되돌린다. 새 컬럼은 보호 대상이 아니라
--      누구나 자기 행에 'all' 을 써넣을 수 있다 — 2026-07-29 권한상승 사고와 같은 모양이다.
--      막으려면 profiles 트리거를 수술해야 하는데, 그 테이블은 로그인·승인제의 뿌리다.
--
-- [핵심 설계]
--   ① 키는 **정규화된 이름**(so_normalize_name). check 제약으로 비정규 표기를 아예 못 넣게 한다
--      → "오타를 넣었는데 에러도 안 나고 조용히 안 먹는" 사고를 DB 가 막는다.
--   ② **행이 없으면 'own'**(기본값). 새 가입자는 자동으로 본인 담당만 — 안전한 쪽이 기본.
--      그래서 시드는 'all' 인 사람만 넣는다.
--   ③ 값 강제는 정책이 아니라 트리거로도 한 번 더.(2026-07-29 교훈:
--      PERMISSIVE 정책은 OR 로 합쳐져 언제든 느슨해질 수 있다)
--   ④ DELETE 정책을 만들지 않는다 = 삭제 불가. 권한을 거두려면 scope 를 'own' 으로 바꾼다
--      (누가 언제 거뒀는지 updated_by/updated_at 에 남는다).
--
-- ⚠️ 이 파일은 **화면 표시 권한만** 바꾼다. settlement_manual · agency_cases 의 RLS 는
--    지금도 is_approved() 하나라, 승인된 사용자는 API 로 전건을 받을 수 있다.
--    (work_notes 2026-08-05 · chat_messages 2026-08-10 과 같은 계열의 미조치 상태)
--    → D2 결정에 따라 **별건으로 분리**했다. 이 파일로 해결됐다고 착각하지 말 것.
--
-- 실행:     node scripts/run-sql.js 정산권한_settlement_permissions.sql
-- 검증:     node scripts/run-sql.js 정산권한_settlement_permissions_검증.sql   ← 반드시 따로
--           (run-sql.js 는 마지막 SELECT 하나만 출력한다. 조치 파일에 딸린 SELECT 를 믿지 말 것)
-- 되돌리기: 정산권한_settlement_permissions_rollback.sql
-- 프로젝트: ujdrjvnihxjvbkezjvwc
-- ============================================================================

begin;
set local lock_timeout = '3s';

-- ---------------------------------------------------------------------------
-- 0) 이름 정규화 함수는 이미 있다 — public.so_normalize_name(text)
--    (결재함 2026-08-10 에 만든 것. App.js normalizeStaffName 과 한 쌍)
--    없으면 이 파일이 실패한다. 그게 맞다 — 조용히 다른 규칙으로 돌면 안 된다.
-- ---------------------------------------------------------------------------
do $$
begin
  if to_regprocedure('public.so_normalize_name(text)') is null then
    raise exception 'public.so_normalize_name(text) 가 없습니다. 결재함_sign_offs_테이블추가.sql 을 먼저 실행하세요.';
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 1) 테이블
-- ---------------------------------------------------------------------------
create table if not exists public.settlement_permissions (
  name       text primary key,
  scope      text not null default 'own'
             check (scope in ('own', 'all')),
  updated_by text,
  updated_at timestamptz not null default now(),

  -- 키는 반드시 정규화된 이름이어야 한다. ' 동일 '·'김동일이사' 같은 표기가 들어오면
  -- 화면 판정(normalizeStaffName 후 비교)과 어긋나 조용히 안 먹는다 → 아예 거부한다.
  constraint chk_settlement_permissions_name_norm
    check (btrim(name) <> '' and name = public.so_normalize_name(name))
);

comment on table public.settlement_permissions is
  '정산관리 열람·작성 범위. 행이 없으면 own(본인 담당 건만). App.js canViewSettlement 와 한 쌍.';

-- ---------------------------------------------------------------------------
-- 2) 트리거 — 정책이 느슨해져도 값 자체를 서버가 정한다
--    auth.uid() 가 null 이면 통과시킨다: service_role · run-sql.js 같은 관리 작업을
--    막지 않기 위해서다(trg_chat_protect_update · trg_team_notes_protect 와 같은 규칙).
-- ---------------------------------------------------------------------------
create or replace function public.settlement_perm_guard()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  v_me_name text;
begin
  if auth.uid() is not null then
    if not public.is_admin() then
      raise exception '정산 권한은 관리자만 변경할 수 있습니다.';
    end if;
    select p.name into v_me_name
      from public.profiles p where p.id = auth.uid() limit 1;
    new.updated_by := coalesce(v_me_name, '알 수 없음');
  end if;

  new.name       := public.so_normalize_name(new.name);
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_settlement_perm_guard on public.settlement_permissions;
create trigger trg_settlement_perm_guard
  before insert or update on public.settlement_permissions
  for each row execute function public.settlement_perm_guard();

-- ---------------------------------------------------------------------------
-- 3) RLS — 새 테이블은 Supabase 기본값이 "열림"이다. 같은 커밋에서 켠다(CLAUDE.md 2-2).
-- ---------------------------------------------------------------------------
alter table public.settlement_permissions enable row level security;

--   SELECT: 승인된 사용자 전원. 화면이 "내 범위"를 판정하려면 읽을 수 있어야 한다.
--           (담고 있는 건 이름과 own/all 뿐 — 정산 금액이 아니다)
drop policy if exists p_settlement_permissions_select on public.settlement_permissions;
create policy p_settlement_permissions_select on public.settlement_permissions
  for select to authenticated
  using ((select public.is_approved()));

--   INSERT / UPDATE: 관리자만. (트리거가 한 번 더 막지만 정책에서도 막는다)
drop policy if exists p_settlement_permissions_insert on public.settlement_permissions;
create policy p_settlement_permissions_insert on public.settlement_permissions
  for insert to authenticated
  with check ((select public.is_admin()));

drop policy if exists p_settlement_permissions_update on public.settlement_permissions;
create policy p_settlement_permissions_update on public.settlement_permissions
  for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

--   DELETE: 정책 없음 = 삭제 불가. 권한 회수는 scope='own' 으로 바꾸는 것이다(이력이 남는다).

-- ---------------------------------------------------------------------------
-- 4) 권한 — anon 회수 + 필요한 것만 남기기 (CLAUDE.md 2-2)
-- ---------------------------------------------------------------------------
revoke all on public.settlement_permissions from anon;
revoke all on public.settlement_permissions from authenticated;
grant select, insert, update on public.settlement_permissions to authenticated;  -- delete 없음

-- 함수 EXECUTE 는 기본이 PUBLIC 이다 → 회수한다.
-- 트리거 함수는 트리거로만 호출된다 → authenticated 도 직접 호출 못 하게 한다.
-- ⚠️ "from public, anon" 만 회수하면 authenticated 직접 호출 경로가 남는다
--    (2026-08-10 결재함 검증에서 실제로 걸렸던 함정).
revoke all on function public.settlement_perm_guard() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 5) 시드 — 전체 열람·작성 7명 (사용자 결정 2026-09-26)
--    ⚠️ 이름은 profiles.name 과 글자 단위로 대조 완료(7/7 실재 · 전원 approved · 공백 이상 0).
--    ⚠️ 여기 없는 사람은 행 자체를 만들지 않는다 = 'own'(기본값). 지금 동작과 같다.
--       → 이 시드 뒤 'own' 으로 남는 사람은 인선·미현·권구현·기랑뿐이고,
--         네 사람 다 지금도 본인 담당만 보고 있다 = **기존 동작이 하나도 안 바뀐다.**
--    ⚠️ 「양호」는 관리자라 필수다(2026-09-26 확인). 옛 SETTLEMENT_ADMINS 4명
--       (관호·동일·양호·유진)이 전원 그대로 'all' 이므로 **전체 열람이 줄어드는 사람이 없다.**
--
--    on conflict 로 여러 번 돌려도 안 불어난다. 이미 있으면 scope 만 맞춘다.
-- ---------------------------------------------------------------------------
insert into public.settlement_permissions (name, scope, updated_by)
values
  ('양호',     'all', '초기설정 2026-09-26'),
  ('이만나미', 'all', '초기설정 2026-09-26'),
  ('동일',     'all', '초기설정 2026-09-26'),
  ('관호',     'all', '초기설정 2026-09-26'),
  ('유진',     'all', '초기설정 2026-09-26'),
  ('지혜',     'all', '초기설정 2026-09-26'),
  ('정원',     'all', '초기설정 2026-09-26')
on conflict (name) do update set scope = excluded.scope;

-- 시드 이름이 profiles 에 실제로 있는지 — 없으면 오타다. 커밋 전에 막는다.
do $$
declare v_bad text;
begin
  select string_agg(sp.name, ', ') into v_bad
    from public.settlement_permissions sp
   where not exists (
     select 1 from public.profiles p
      where public.so_normalize_name(p.name) = sp.name and p.status = 'approved');
  if v_bad is not null then
    raise exception '승인된 profiles.name 에 없는 이름이 있습니다: %', v_bad;
  end if;
end $$;

commit;
