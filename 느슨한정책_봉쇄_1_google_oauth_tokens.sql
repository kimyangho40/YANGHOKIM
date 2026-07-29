-- ════════════════════════════════════════════════════════════════════════
-- [1/2] 느슨한 정책 봉쇄 — google_oauth_tokens (작성: 2026-07-29 / 실행 전)
--
-- 왜 급한가:
--   이 테이블은 2026-07-27 사고(10,801건 노출) 때 anon을 막은 대상이다.
--   그런데 authenticated 경로가 그대로 열려 있었다:
--     "authenticated users can manage oauth tokens" / ALL / using(true) / check(true)
--   승인 대기·거절 계정도 로그인만 하면 구글 OAuth 토큰을 읽고 쓸 수 있는 상태다.
--   토큰이 유출되면 그 계정의 구글 드라이브·메일 접근으로 이어진다.
--
-- 왜 대체 정책을 만들지 않고 완전히 잠그는가:
--   · 현재 행 수 0건 (07-27 사고 대응으로 구글 권한을 삭제하면서 비워짐)
--   · src/ 와 api/ 전수 grep 결과 이 테이블을 참조하는 코드가 **0건**
--   → 쓰는 데가 없는 유휴 테이블이다. is_approved() 정책을 새로 만들어 두면
--     "왜 열려 있지?"를 다시 판단해야 하는 구멍이 하나 남는다.
--     정책을 0개로 두면 RLS가 authenticated·anon 모두 거부한다(관리자만 SQL Editor로 접근).
--   ※ 나중에 구글 연동을 되살릴 때는 그 커밋에서 is_approved() 정책을 만들 것.
--
-- 안전장치: lock_timeout 3s + 단일 트랜잭션. 데이터는 건드리지 않는다(0행이지만 delete도 안 한다).
-- 롤백: 느슨한정책_봉쇄_1_google_oauth_tokens_rollback.sql
-- ════════════════════════════════════════════════════════════════════════

-- ── [사전 스냅샷] 실행 로그에 남길 것 ────────────────────────────────────
select policyname, permissive, roles, cmd, qual as "using", with_check
  from pg_policies
 where schemaname = 'public' and tablename = 'google_oauth_tokens'
 order by policyname;

select count(*) as rows_before from public.google_oauth_tokens;

begin;
  set local lock_timeout = '3s';

  drop policy if exists "authenticated users can manage oauth tokens" on public.google_oauth_tokens;

  -- 이미 켜져 있지만 멱등성 확보용
  alter table public.google_oauth_tokens enable row level security;

  -- anon GRANT는 07-27에 회수됐다. 다시 확인 사살(권한이 없으면 no-op)
  revoke all on public.google_oauth_tokens from anon;
commit;

-- ── 실행 후 검증 ────────────────────────────────────────────────────────
-- [검증 1] 정책 0행 = 완전 잠금 (RLS on + 정책 없음 → 모든 역할 거부)
select policyname, roles, cmd
  from pg_policies
 where schemaname = 'public' and tablename = 'google_oauth_tokens';

-- [검증 2] RLS true 여야 정상. false면 정책이 없어도 전건 노출된다(가장 위험한 조합)
select relrowsecurity as rls_enabled
  from pg_class
 where relnamespace = 'public'::regnamespace and relname = 'google_oauth_tokens';

-- [검증 3] anon GRANT 0행
select privilege_type
  from information_schema.role_table_grants
 where table_schema = 'public' and table_name = 'google_oauth_tokens' and grantee = 'anon';

-- [검증 4] 데이터 보존 (실행 전과 같아야 함)
select count(*) as rows_after from public.google_oauth_tokens;

-- ── 실행 후 화면 확인 ───────────────────────────────────────────────────
--   참조 코드가 없으므로 화면에 영향이 없어야 한다.
--   혹시 구글 드라이브·캘린더 연동 화면이 있다면 그것만 확인할 것.
