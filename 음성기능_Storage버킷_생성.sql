-- ============================================================
-- 🎙️ 음성 메모 / 📁 통화 녹음 기능용 Supabase Storage 버킷 생성
-- Supabase 대시보드 → SQL Editor 에 붙여넣고 실행하세요.
-- (버킷 2개 + 업로드/재생 권한 정책)
-- ============================================================

-- 1) 버킷 2개 생성 (public = true → 저장된 음성/녹음을 URL로 바로 재생 가능)
insert into storage.buckets (id, name, public)
values
  ('voice-memos', 'voice-memos', true),
  ('call-recordings', 'call-recordings', true)
on conflict (id) do update set public = excluded.public;

-- 2) 업로드 권한 — 로그인한 사용자가 두 버킷에 파일을 올릴 수 있게 허용
drop policy if exists "voice_call_upload" on storage.objects;
create policy "voice_call_upload"
  on storage.objects for insert to authenticated
  with check (bucket_id in ('voice-memos', 'call-recordings'));

-- 3) 재생/조회 권한 — 누구나(공개) 파일을 읽어 재생할 수 있게 허용
drop policy if exists "voice_call_read" on storage.objects;
create policy "voice_call_read"
  on storage.objects for select to public
  using (bucket_id in ('voice-memos', 'call-recordings'));

-- 4) (선택) 삭제 권한 — 로그인한 사용자가 잘못 올린 파일을 지울 수 있게 허용
drop policy if exists "voice_call_delete" on storage.objects;
create policy "voice_call_delete"
  on storage.objects for delete to authenticated
  using (bucket_id in ('voice-memos', 'call-recordings'));

-- 파일 경로 규칙: {company_id}/{timestamp}_{filename}
-- 파일 크기 제한(녹음 파일 50MB)은 앱에서 업로드 전에 체크합니다.
