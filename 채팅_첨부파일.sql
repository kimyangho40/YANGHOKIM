-- ============================================================================
-- 채팅 첨부 파일 (2026-11-25)
--   · chat_messages 에 attachments(jsonb 배열) 1칸 추가 — 기존 행은 전부 빈 배열 [] 이 된다(글·읽음·삭제 값 무변경)
--   · 비공개 버킷 chat-files (파일 하나 20MB)
--   · 저장소 열람 규칙: 그 채널을 볼 수 있는 사람만 그 채널의 파일을 연다
--     (경로 첫 폴더 = 채널 이름을 16진수로 적은 것. App.js ⛳ 채팅-첨부 chatFilePath 와 한 쌍 — 한쪽만 고치지 말 것)
-- 되돌리기: 채팅_첨부파일_rollback.sql · 검증: 채팅_첨부파일_검증.sql (별도 실행)
-- ⚠️ 순서: 이 SQL 을 먼저 돌리고 → 화면 코드를 배포한다.
--    (반대여도 글만 보내는 채팅은 안 깨진다 — 화면은 파일이 있을 때만 attachments 를 보낸다.)
-- ⚠️ 기존 chat_can_access · chat_protect_update · 채팅 정책 3개는 건드리지 않는다.
-- ============================================================================
begin;

-- 1) 첨부 칸 --------------------------------------------------------------------
alter table public.chat_messages
  add column if not exists attachments jsonb not null default '[]'::jsonb;

alter table public.chat_messages
  drop constraint if exists chat_messages_attachments_chk;
alter table public.chat_messages
  add constraint chat_messages_attachments_chk
  check (jsonb_typeof(attachments) = 'array' and jsonb_array_length(attachments) <= 5);

-- 2) 경로 → 채널 ----------------------------------------------------------------
--    "64 6d 3a …/1732…_ab12.pdf" 의 첫 폴더를 글자로 되돌린다. 모양이 틀리면 NULL(=아무도 못 연다).
create or replace function public.chat_file_channel(p_name text)
returns text
language plpgsql immutable
as $$
begin
  return nullif(convert_from(decode(split_part(p_name, '/', 1), 'hex'), 'UTF8'), '');   -- 빈 폴더도 NULL
exception when others then
  return null;
end;
$$;

-- 그 파일을 지금 로그인한 사람이 볼 수 있는가 = 승인된 사용자 + 그 채널에 들어갈 수 있음.
--   채널 판정은 기존 chat_can_access 를 그대로 부른다(명단을 여기 또 적지 않는다).
create or replace function public.chat_file_can_access(p_name text)
returns boolean
language sql stable security definer set search_path = public
as $$
  select coalesce(public.is_approved(), false)
     and coalesce(public.chat_can_access(public.chat_file_channel(p_name), public.wn_my_name()), false);
$$;

revoke execute on function public.chat_file_channel(text)    from public, anon;
revoke execute on function public.chat_file_can_access(text) from public, anon;
grant  execute on function public.chat_file_channel(text)    to authenticated;
grant  execute on function public.chat_file_can_access(text) to authenticated;

-- 3) 첨부 칸 보호 ---------------------------------------------------------------
--    · 보낼 때: 첨부 경로는 반드시 "그 메시지의 채널" 폴더여야 한다(남의 방 파일 주소를 내 메시지에 끼워 넣지 못하게).
--    · 보낸 뒤: 첨부는 누구도 못 바꾼다(조용히 원래 값으로 — 읽음표시·삭제 UPDATE 는 그대로 통과).
--    기존 chat_protect_update 함수는 건드리지 않고 트리거를 따로 단다.
create or replace function public.chat_attachments_guard()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare a jsonb;
begin
  if tg_op = 'UPDATE' then
    if auth.uid() is not null then new.attachments := old.attachments; end if;   -- 관리 작업(service_role·SQL)은 통과
    return new;
  end if;
  for a in select * from jsonb_array_elements(coalesce(new.attachments, '[]'::jsonb)) loop
    if coalesce(a->>'path', '') = '' or public.chat_file_channel(a->>'path') is distinct from new.channel then
      raise exception '첨부 파일 경로가 이 채널의 것이 아닙니다.';
    end if;
  end loop;
  return new;
end;
$$;

drop trigger if exists trg_chat_attachments_guard on public.chat_messages;
create trigger trg_chat_attachments_guard
  before insert or update on public.chat_messages
  for each row execute function public.chat_attachments_guard();

-- 4) 비공개 버킷 ----------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit)
values ('chat-files', 'chat-files', false, 20971520)
on conflict (id) do update set public = false, file_size_limit = 20971520;

-- 5) 저장소 정책 — to authenticated 만. anon·public 정책은 만들지 않는다.
drop policy if exists p_chat_files_select on storage.objects;
drop policy if exists p_chat_files_insert on storage.objects;
drop policy if exists p_chat_files_delete on storage.objects;

create policy p_chat_files_select on storage.objects
  for select to authenticated
  using (bucket_id = 'chat-files' and public.chat_file_can_access(name));

create policy p_chat_files_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'chat-files' and public.chat_file_can_access(name));

-- 지우기: 올린 본인 또는 채팅 관리자(메시지 삭제 권한과 같은 기준). UPDATE 정책은 없다 = 덮어쓰기 불가.
create policy p_chat_files_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'chat-files' and public.chat_file_can_access(name)
         and (owner = auth.uid() or public.chat_is_admin()));

commit;
