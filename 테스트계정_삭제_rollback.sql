-- 되돌리기 — 테스트계정_삭제.sql (2026-08-09)
--
-- ⚠️ 솔직한 한계: **로그인 계정(auth.users)은 이 파일로 되살릴 수 없다.**
--    auth.users 에는 비밀번호 해시·토큰·identity 행이 함께 들어 있고,
--    그 값을 SQL 파일에 적어 두는 것은 그 자체가 보안 사고다.
--    아래는 profiles 행만 원래 값으로 되돌린다.
--
-- 되살릴 필요가 생긴 경우(예: 자동화 테스트를 다시 돌려야 함):
--   그냥 화면에서 새로 가입하면 된다. 원래 이 계정들이 그렇게 만들어졌다
--   (cctest_<타임스탬프>@example.com 형식의 자동 가입).
--   단, 새 가입은 protect_profile_insert 트리거 때문에
--   role='member' / status='pending' 으로만 들어간다 → 관리자가 승인해야 쓸 수 있다.
--   **원래도 그게 맞는 절차였다.** 삭제한 계정이 approved 였던 게 비정상이었다.
--
-- 아래 INSERT 는 auth.users 행이 먼저 존재해야 성공한다
-- (profiles_id_fkey → auth.users). 계정을 먼저 만든 뒤 id 를 맞춰 쓸 것.

begin;

insert into public.profiles (id, name, role, team, created_at, status) values
  ('d739c8ef-bb6a-4c80-ad00-f7450028e06c'::uuid, '테스트', 'member', '법인전담', '2026-07-08 04:19:00+00', 'approved'),
  ('e96038e5-8b35-4077-aec2-d3cc259e776c'::uuid, '테스트', 'member', '법인전담', '2026-07-08 04:20:00+00', 'approved')
on conflict (id) do nothing;

commit;
