-- ════════════════════════════════════════════════════════════════════════
-- [롤백] 업무요청_RLS_승인제_수정.sql 되돌리기 — work_requests
--
-- 언제 쓰나: 조치 후 승인된 팀원인데도 업무 요청이 안 보이거나,
--            보내기·가져가기·완료 체크가 실패할 때(= is_approved() 판정 문제 의심).
-- 데이터는 애초에 건드리지 않았으므로 손실 없음.
--
-- ⚠️ 이 파일은 조치 **직전 상태**(정책 = using(true), anon GRANT 있음)로 되돌린다.
--    그 상태는 "로그인만 하면 미승인 계정도 전건 접근 가능"한 상태다.
--    임시 복구용일 뿐이므로, 원인 파악 후 반드시 다시 승인제로 올릴 것.
--
-- 급하면: 아래 1번 블록의 정책 교체만 실행해도 즉시 화면이 돌아온다.
-- ════════════════════════════════════════════════════════════════════════
begin;
  set local lock_timeout = '3s';

  -- 1) 정책을 조치 전 상태로 복구
  --    조치 전 실제 정의: "authenticated all" / for all to authenticated / using(true) / with check(true)
  drop policy if exists p_work_requests_all on public.work_requests;
  drop policy if exists "authenticated all" on public.work_requests;
  create policy "authenticated all" on public.work_requests
    for all to authenticated
    using (true)
    with check (true);

  -- 2) anon GRANT 복구 (조치 전과 동일한 7개 권한)
  --    RLS 는 조치 전에도 켜져 있었으므로 disable 하지 않는다.
  --    (anon 은 정책이 없어 RLS 로 계속 차단된 상태 — GRANT 만 되돌린다)
  grant select, insert, update, delete, references, trigger, truncate
    on public.work_requests to anon;
  grant select, insert, update, delete, references, trigger, truncate
    on public.team_notes    to anon;

  -- 참고: team_notes 정책(p_team_notes_all / is_approved())은 조치에서 건드리지 않았으므로
  --       롤백에서도 그대로 둔다.
commit;

-- ── 롤백 확인 ────────────────────────────────────────────────────────────
-- work_requests 정책이 "authenticated all" / using=true 로 돌아왔는지,
-- anon GRANT 7행이 두 테이블에 각각 복구됐는지 확인.
select tablename, policyname, roles, cmd, qual as "using", with_check
  from pg_policies
 where schemaname = 'public'
   and tablename in ('work_requests','team_notes')
 order by tablename, policyname;

select table_name, grantee, count(*) as grants
  from information_schema.role_table_grants
 where table_schema = 'public'
   and table_name in ('work_requests','team_notes')
   and grantee = 'anon'
 group by table_name, grantee
 order by table_name;
