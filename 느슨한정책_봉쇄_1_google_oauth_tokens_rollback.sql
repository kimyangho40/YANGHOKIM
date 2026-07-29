-- ════════════════════════════════════════════════════════════════════════
-- [롤백] 느슨한정책_봉쇄_1_google_oauth_tokens.sql 되돌리기
--
-- 언제 쓰나: 잠근 뒤에 이 테이블을 쓰는 곳이 있었다는 게 드러났을 때
--            (구글 연동 화면에서 "권한 없음"·빈 목록이 나오는 경우).
-- 데이터는 건드리지 않았으므로 손실 없음.
--
-- ⚠️ 이 롤백은 **누구나(로그인만 하면) 구글 토큰을 읽고 쓸 수 있는 상태**로 되돌린다.
--    임시 복구용이다. 되돌렸다면 곧바로 아래 [권장]의 승인제 정책으로 다시 조일 것.
-- ════════════════════════════════════════════════════════════════════════
begin;
  set local lock_timeout = '3s';

  drop policy if exists "authenticated users can manage oauth tokens" on public.google_oauth_tokens;
  create policy "authenticated users can manage oauth tokens" on public.google_oauth_tokens
    for all to authenticated
    using (true)
    with check (true);
commit;

-- ── [권장] 되돌리는 대신 이걸 쓰는 게 낫다 ──────────────────────────────
--    "쓰는 곳이 있다"가 확인됐다면, 열어두지 말고 승인제 정책으로 바꾸는 게 정답이다.
--    위 블록 대신 아래를 실행할 것:
--
--    begin;
--      drop policy if exists "authenticated users can manage oauth tokens" on public.google_oauth_tokens;
--      drop policy if exists p_google_oauth_tokens_all on public.google_oauth_tokens;
--      create policy p_google_oauth_tokens_all on public.google_oauth_tokens
--        for all to authenticated
--        using (public.is_approved()) with check (public.is_approved());
--    commit;

-- ── 롤백 확인 ───────────────────────────────────────────────────────────
select policyname, roles, cmd, qual as "using", with_check
  from pg_policies
 where schemaname = 'public' and tablename = 'google_oauth_tokens';

select relrowsecurity as rls_enabled,
       (select count(*) from information_schema.role_table_grants
         where table_schema='public' and table_name='google_oauth_tokens' and grantee='anon') as anon_grants
  from pg_class
 where relnamespace = 'public'::regnamespace and relname = 'google_oauth_tokens';
