-- ════════════════════════════════════════════════════════════════════════
-- [롤백] 느슨한정책_봉쇄_2_companies_call_logs_chat_messages.sql 되돌리기
--
-- 언제 쓰나: 봉쇄 후 승인된 계정인데도 기업목록이 비거나, 팀 채팅이 안 되거나,
--            저장이 실패할 때. (= is_approved() 판정 쪽 문제 의심)
-- 데이터는 건드리지 않았으므로 손실 없음.
--
-- ⚠️ 이 롤백은 **로그인만 하면 미승인 계정도 전건 접근 가능한 상태**로 되돌린다.
--    임시 복구용이다. 원인을 찾아 고친 뒤 반드시 다시 봉쇄할 것.
--
-- 급하면: 문제가 난 테이블 블록만 골라 실행해도 된다(세 테이블은 서로 독립적이다).
--         특히 채팅만 깨졌다면 [3] 블록만 실행하면 된다.
-- ════════════════════════════════════════════════════════════════════════
begin;
  set local lock_timeout = '3s';

  -- ── [1] companies : 제거했던 느슨한 정책 3개 복구 (봉쇄 전 정의 그대로)
  --        p_companies_all(is_approved)은 봉쇄에서 건드리지 않았으므로 그대로 둔다.
  drop policy if exists "authenticated can read companies"   on public.companies;
  create policy "authenticated can read companies" on public.companies
    for select to authenticated using (true);

  drop policy if exists "authenticated can update companies" on public.companies;
  create policy "authenticated can update companies" on public.companies
    for update to authenticated using (true);

  drop policy if exists "authenticated can insert companies" on public.companies;
  create policy "authenticated can insert companies" on public.companies
    for insert to authenticated with check (true);

  -- ── [2] call_logs : 제거했던 느슨한 정책 1개 복구
  drop policy if exists "authenticated can all call_logs" on public.call_logs;
  create policy "authenticated can all call_logs" on public.call_logs
    for all to authenticated using (true) with check (true);

  -- ── [3] chat_messages : 봉쇄 전 정책 3개 복구 + 새로 만든 것 제거
  --        봉쇄 전에는 DELETE 정책이 없었다(소프트 삭제만 사용) → 복구도 3개만 만든다.
  drop policy if exists chat_messages_select on public.chat_messages;
  create policy chat_messages_select on public.chat_messages
    for select to authenticated using (true);

  drop policy if exists chat_messages_insert on public.chat_messages;
  create policy chat_messages_insert on public.chat_messages
    for insert to authenticated with check (true);

  drop policy if exists chat_messages_update on public.chat_messages;
  create policy chat_messages_update on public.chat_messages
    for update to authenticated using (true) with check (true);

  drop policy if exists p_chat_messages_select on public.chat_messages;
  drop policy if exists p_chat_messages_insert on public.chat_messages;
  drop policy if exists p_chat_messages_update on public.chat_messages;
commit;

-- ── 롤백 확인 ───────────────────────────────────────────────────────────
-- companies 4개(p_companies_all + 느슨한 3) / call_logs 2개 / chat_messages 3개면 봉쇄 전 상태.
select tablename, policyname, cmd, roles, qual as "using", with_check
  from pg_policies
 where schemaname = 'public' and tablename in ('companies','call_logs','chat_messages')
 order by tablename, cmd, policyname;

-- anon GRANT는 봉쇄에서 회수(no-op)만 했으므로 롤백에서 되돌리지 않는다.
-- 아래는 0이어야 정상 — 0이 아니면 anon에게 실제로 문이 열린 것이니 즉시 조사할 것.
select c.relname,
       (select count(*) from information_schema.role_table_grants g
         where g.table_schema='public' and g.table_name=c.relname and g.grantee='anon') as anon_grants
  from pg_class c
 where c.relnamespace = 'public'::regnamespace
   and c.relname in ('companies','call_logs','chat_messages')
 order by c.relname;

select (select count(*) from public.companies)     as companies_rows,
       (select count(*) from public.call_logs)     as call_logs_rows,
       (select count(*) from public.chat_messages) as chat_messages_rows;
