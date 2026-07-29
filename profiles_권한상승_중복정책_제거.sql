-- ════════════════════════════════════════════════════════════════════════
-- profiles 권한 상승 구멍 봉쇄 — 중복 정책 제거 + INSERT 보호 트리거
--   (작성: 2026-07-29 / 실행 전)
--
-- ⚠️ 이 테이블은 로그인·승인제의 뿌리다. 정책을 잘못 지우면 전원이 로그인 후 멈춘다.
--    실행 후 반드시 화면 확인까지 하고, 이상하면 즉시 롤백할 것.
--
-- ── 무엇이 문제인가 ──────────────────────────────────────────────────────
-- profiles에 INSERT 정책이 2개 있고, PERMISSIVE라 OR로 합쳐진다:
--   · p_profiles_insert   check: id = auth.uid() AND role = 'member' AND status = 'pending'
--   · "profiles insert own" check: auth.uid() = id                      ← 이것만 통과하면 됨
-- 느슨한 쪽이 이겨서 실효 조건은 `auth.uid() = id` 하나뿐이다.
-- trg_protect_profile 트리거는 BEFORE **UPDATE** 에만 걸려 있어 INSERT를 막지 못한다.
--
-- → 신규 가입자가 자기 프로필 행을 role='admin', status='approved' 로 직접 INSERT하면
--   승인 절차를 건너뛰고 관리자가 된다. 앱 UI는 role:'member'로 보내지만 API는 열려 있다.
--   (승인 대기 화면에 갇히지 않고, is_admin()이 true가 되어 타인 프로필 삭제까지 가능)
--
-- ── 왜 지워도 안전한가 (실행 전 확인 완료) ───────────────────────────────
--   · "profiles insert own"  → 지우면 p_profiles_insert 만 남는다.
--     앱의 프로필 등록(App.js:4297)은 { id, name, role:'member', team } 만 보내는데
--     status 컬럼 기본값이 'pending'(NOT NULL) 이라 검사를 통과한다. 가입 경로 무영향.
--   · "profiles update own"  → using: auth.uid()=id.
--     남는 p_profiles_update 가 using (id=auth.uid() OR is_admin()) 로 **더 넓다**. 잃는 권한 없음.
--   · "profiles read all"    → using: true. 남는 p_profiles_select 와 완전히 동일. 무영향.
--   · is_admin() / is_approved() 는 SECURITY DEFINER 라 정책 변경에 영향받지 않는다.
--   · 현재 프로필 20건 전원 status='approved', admin 1명 — 기존 계정에 영향 없음.
--
-- ── [2] INSERT 보호 트리거를 왜 같이 넣는가 ──────────────────────────────
--   정책만 고치면 같은 사고가 반복된다. 이번 구멍의 원인 자체가
--   "나중에 느슨한 정책이 하나 추가돼 OR로 합쳐진 것"이기 때문이다.
--   트리거는 정책과 무관하게 값을 강제하므로, 누가 또 느슨한 정책을 추가해도 뚫리지 않는다.
--   기존 BEFORE UPDATE 트리거와 같은 패턴(비관리자면 role/status를 되돌림)이다.
--   ※ 이 부분이 과하다고 판단되면 [2] 블록만 빼고 실행해도 구멍은 막힌다.
--
-- 롤백: profiles_권한상승_중복정책_제거_rollback.sql
-- ════════════════════════════════════════════════════════════════════════

-- ── [사전 스냅샷] 현재 정책 — 실행 로그에 남겨둘 것 ─────────────────────
select policyname, permissive, roles, cmd, qual as "using", with_check
  from pg_policies
 where schemaname = 'public' and tablename = 'profiles'
 order by cmd, policyname;

begin;
  set local lock_timeout = '3s';

  -- ── [1] 중복(느슨한) 구 정책 제거 ─────────────────────────────────────
  --    p_profiles_* 4개(select/insert/update/delete)만 남긴다.
  drop policy if exists "profiles insert own" on public.profiles;   -- ★ 구멍의 원인
  drop policy if exists "profiles update own" on public.profiles;   -- p_profiles_update가 상위집합
  drop policy if exists "profiles read all"   on public.profiles;   -- p_profiles_select와 동일

  -- ── [2] INSERT 보호 트리거 — 정책이 또 느슨해져도 값 자체를 강제 ──────
  --    비관리자가 만드는 프로필은 무조건 member/pending 으로 눌러 담는다.
  --    (기존 protect_profile_privileges는 old를 참조해 UPDATE 전용이라 재사용할 수 없다)
  create or replace function public.protect_profile_insert()
  returns trigger
  language plpgsql
  security definer
  set search_path to 'public'
  as $fn$
  begin
    if not public.is_admin() then
      new.role   := 'member';
      new.status := 'pending';
    end if;
    return new;
  end $fn$;

  drop trigger if exists trg_protect_profile_insert on public.profiles;
  create trigger trg_protect_profile_insert
    before insert on public.profiles
    for each row execute function public.protect_profile_insert();
commit;

-- ── 실행 후 검증 ────────────────────────────────────────────────────────
-- [검증 1] 정책 4개(p_profiles_delete/insert/select/update)만 남아야 정상.
--          "profiles insert own" 등 소문자 공백 이름이 하나라도 보이면 실패.
select policyname, roles, cmd, qual as "using", with_check
  from pg_policies
 where schemaname = 'public' and tablename = 'profiles'
 order by cmd, policyname;

-- [검증 2] INSERT 정책이 정확히 1개이고 check에 role/status 조건이 있어야 정상.
select count(*) as insert_policies
  from pg_policies
 where schemaname = 'public' and tablename = 'profiles' and cmd = 'INSERT';

-- [검증 3] 트리거 2개(INSERT용·UPDATE용)가 모두 활성(O)이어야 정상.
select tgname, tgenabled, pg_get_triggerdef(t.oid) as def
  from pg_trigger t
 where t.tgrelid = 'public.profiles'::regclass and not t.tgisinternal
 order by tgname;

-- [검증 4] 기존 계정 보존 — 20건 / approved 20 / admin 1 그대로여야 한다.
select count(*) as total,
       count(*) filter (where status = 'approved') as approved,
       count(*) filter (where role = 'admin')      as admins
  from public.profiles;

-- ── 실행 후 화면 확인 (필수) ────────────────────────────────────────────
--   · 기존 계정 로그인 → 정상 진입 (승인 대기 화면으로 튕기지 않아야 함)
--   · 관리자 계정 → 사용자 승인/역할 변경 화면 동작
--   · ★ 새 계정 가입 → 프로필 등록 → "승인 대기" 화면에 정상 진입
--     (등록이 실패하면 [1]의 정책 제거가 과했던 것 → 즉시 롤백)
