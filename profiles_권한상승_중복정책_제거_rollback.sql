-- ════════════════════════════════════════════════════════════════════════
-- [롤백] profiles_권한상승_중복정책_제거.sql 되돌리기
--
-- 언제 쓰나: 조치 후 로그인이 안 되거나, 새 계정 가입에서 프로필 등록이 실패할 때.
-- 데이터는 건드리지 않았으므로 손실 없음(정책·트리거만 되돌린다).
--
-- ⚠️ 이 롤백은 **권한 상승 구멍이 있던 상태로 되돌린다.**
--    되돌린 직후에는 신규 가입자가 스스로 admin/approved 로 등록할 수 있는 상태가 된다.
--    임시 복구용일 뿐이므로, 원인을 찾아 고친 뒤 반드시 다시 봉쇄할 것.
--
-- 급하면: [1] 블록만 실행해도 조치 전 동작으로 즉시 돌아간다.
-- ════════════════════════════════════════════════════════════════════════
begin;
  set local lock_timeout = '3s';

  -- ── [1] 제거했던 구 정책 3개 복구 (조치 전 정의 그대로) ────────────────
  drop policy if exists "profiles insert own" on public.profiles;
  create policy "profiles insert own" on public.profiles
    for insert to authenticated
    with check (auth.uid() = id);

  drop policy if exists "profiles update own" on public.profiles;
  create policy "profiles update own" on public.profiles
    for update to authenticated
    using (auth.uid() = id);

  drop policy if exists "profiles read all" on public.profiles;
  create policy "profiles read all" on public.profiles
    for select to authenticated
    using (true);

  -- ── [2] INSERT 보호 트리거 제거 ───────────────────────────────────────
  --    UPDATE용 trg_protect_profile 은 조치 전에도 있던 것이므로 건드리지 않는다.
  drop trigger  if exists trg_protect_profile_insert on public.profiles;
  drop function if exists public.protect_profile_insert();
commit;

-- ── 롤백 확인 ────────────────────────────────────────────────────────────
-- 정책 7개(p_profiles_* 4개 + 구 정책 3개), 트리거는 trg_protect_profile 1개면 조치 전 상태.
select policyname, roles, cmd, qual as "using", with_check
  from pg_policies
 where schemaname = 'public' and tablename = 'profiles'
 order by cmd, policyname;

select tgname, tgenabled
  from pg_trigger t
 where t.tgrelid = 'public.profiles'::regclass and not t.tgisinternal
 order by tgname;

select count(*) as total,
       count(*) filter (where status = 'approved') as approved,
       count(*) filter (where role = 'admin')      as admins
  from public.profiles;
