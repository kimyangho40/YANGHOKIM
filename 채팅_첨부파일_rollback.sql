-- 되돌리기: 채팅_첨부파일.sql
-- ⚠️ 화면 코드를 먼저 되돌린 뒤 돌릴 것(코드가 살아 있으면 파일을 보낼 때 실패한다. 글만 보내는 채팅은 어느 순서든 안 깨진다).
-- ⚠️ attachments 칸을 지우면 이미 보낸 메시지의 첨부 목록이 사라진다. 버킷과 그 안의 파일은 여기서 지우지 않는다
--    (저장소 파일은 SQL 로 지우면 실제 파일이 남는다 — 필요하면 대시보드 Storage 에서 chat-files 를 비운 뒤 버킷을 지울 것).
begin;

drop policy if exists p_chat_files_select on storage.objects;
drop policy if exists p_chat_files_insert on storage.objects;
drop policy if exists p_chat_files_delete on storage.objects;

drop trigger if exists trg_chat_attachments_guard on public.chat_messages;
drop function if exists public.chat_attachments_guard();
drop function if exists public.chat_file_can_access(text);
drop function if exists public.chat_file_channel(text);

alter table public.chat_messages drop constraint if exists chat_messages_attachments_chk;
alter table public.chat_messages drop column if exists attachments;

commit;
