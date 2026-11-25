-- 검증: 채팅_첨부파일.sql — 적용 뒤 "별도로" 실행한다(읽기 전용 SELECT 하나. run-sql.js 는 마지막 SELECT 하나만 찍는다).
-- 전부 pass 여야 정상.
with t as (
  select '01 attachments 칸: jsonb · NOT NULL · 기본값 []' as chk,
         exists (select 1 from information_schema.columns
                  where table_schema='public' and table_name='chat_messages' and column_name='attachments'
                    and data_type='jsonb' and is_nullable='NO' and column_default like '%[]%') as ok
  union all select '02 기존 메시지 첨부는 전부 빈 배열(적용 직후 기준)',
         not exists (select 1 from public.chat_messages where jsonb_typeof(attachments) <> 'array')
  union all select '03 개수 제한 check 제약',
         exists (select 1 from pg_constraint where conname='chat_messages_attachments_chk')
  union all select '04 경로→채널: 정상 경로',
         public.chat_file_channel('646d3aec9691ed98b87cec9ca0eca784/1_a.pdf') = 'dm:양호|유진'
  union all select '05 경로→채널: 틀린 모양은 NULL',
         public.chat_file_channel('not-hex/1_a.pdf') is null and public.chat_file_channel('') is null
  union all select '06 로그인 없는 호출은 못 연다(관리 콘솔 = uid 없음)',
         public.chat_file_can_access('67656e6572616c/1_a.pdf') is not true
  union all select '07 함수 실행 권한: anon 없음',
         not has_function_privilege('anon', 'public.chat_file_can_access(text)', 'execute')
         and not has_function_privilege('anon', 'public.chat_file_channel(text)', 'execute')
  union all select '08 첨부 보호 트리거(INSERT·UPDATE)',
         exists (select 1 from pg_trigger where tgname='trg_chat_attachments_guard' and not tgisinternal)
  union all select '09 기존 보호 트리거 그대로',
         exists (select 1 from pg_trigger where tgname='trg_chat_protect_update' and not tgisinternal)
  union all select '10 버킷: 비공개 · 20MB',
         exists (select 1 from storage.buckets where id='chat-files' and public = false and file_size_limit = 20971520)
  union all select '11 저장소 정책 3개(select·insert·delete) 전부 authenticated 전용',
         (select count(*) from pg_policies where schemaname='storage' and tablename='objects'
           and policyname in ('p_chat_files_select','p_chat_files_insert','p_chat_files_delete')
           and roles = '{authenticated}') = 3
  union all select '12 chat-files 를 여는 anon·public 정책 없음',
         not exists (select 1 from pg_policies where schemaname='storage' and tablename='objects'
           and (qual like '%chat-files%' or with_check like '%chat-files%')
           and (roles && array['anon','public']::name[]))
  union all select '13 chat_messages 정책 수 그대로(3개)',
         (select count(*) from pg_policies where schemaname='public' and tablename='chat_messages') = 3
  union all select '14 chat_messages RLS 켜짐 · anon 권한 0',
         (select relrowsecurity from pg_class where oid='public.chat_messages'::regclass)
         and not exists (select 1 from information_schema.role_table_grants
                          where table_schema='public' and table_name='chat_messages' and grantee='anon')
)
select chk, case when ok then 'pass' else 'FAIL' end as result from t order by chk;
