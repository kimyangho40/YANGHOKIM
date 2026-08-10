-- ============================================================================
-- ⏪ 채팅 채널 스코프 되돌리기 — 2026-07-29 상태(is_approved() 단독)로 원복
--
--   ⚠️ 되돌리면 승인된 사용자 누구나 남의 DM 본문을 다시 받아갈 수 있게 된다.
--      채팅이 실제로 깨졌을 때만 쓰고, 원인을 고친 뒤 다시 적용할 것.
--
-- 실행: node scripts/run-sql.js 채팅_DM_비공개_RLS_rollback.sql
-- ============================================================================

begin;

drop trigger  if exists trg_chat_protect_update on public.chat_messages;
drop function if exists public.chat_protect_update();

drop policy if exists p_chat_messages_select on public.chat_messages;
drop policy if exists p_chat_messages_insert on public.chat_messages;
drop policy if exists p_chat_messages_update on public.chat_messages;

create policy p_chat_messages_select on public.chat_messages
  for select to authenticated using (public.is_approved());

create policy p_chat_messages_insert on public.chat_messages
  for insert to authenticated with check (public.is_approved());

create policy p_chat_messages_update on public.chat_messages
  for update to authenticated using (public.is_approved()) with check (public.is_approved());

drop function if exists public.chat_can_access(text, text);
drop function if exists public.chat_is_admin();

commit;

select policyname, cmd, qual, with_check
  from pg_policies where schemaname = 'public' and tablename = 'chat_messages'
 order by policyname;
