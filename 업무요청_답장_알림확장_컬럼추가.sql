-- ════════════════════════════════════════════════════════════════════════
-- 업무 요청 답장(스레드) + 실시간 알림 확장용 스키마
--   [1] work_requests.replies      : 답장 스레드 (JSON 배열: [{by,text,at}, ...])
--   [2] work_requests.reply_unread : 원 요청자(request_from)가 아직 안 본 답장 있음 표시
--   [3] Realtime 활성화            : work_requests / team_notes INSERT·UPDATE 이벤트를
--                                    기존 채팅 알림과 동일한 방식으로 받기 위함
-- 실행: Supabase SQL Editor에 붙여넣고 Run. (여러 번 실행해도 안전 — IF NOT EXISTS)
-- ════════════════════════════════════════════════════════════════════════

-- ── [1] 답장 스레드 ─────────────────────────────────────────────────────
alter table public.work_requests add column if not exists replies jsonb default '[]'::jsonb;
comment on column public.work_requests.replies is '요청 답장 스레드 [{by:작성자, text:내용, at:ISO시각}, ...]';

-- ── [2] 원 요청자용 안읽은 답장 표시 ─────────────────────────────────────
alter table public.work_requests add column if not exists reply_unread boolean default false;
comment on column public.work_requests.reply_unread is 'true = 원 요청자(request_from)가 아직 확인하지 않은 새 답장이 있음';

-- ── [3] Realtime 활성화 (INSERT/UPDATE 이벤트를 클라이언트가 구독) ──────
--    이미 publication에 추가돼 있으면 에러 없이 넘어가도록 DO 블록으로 감쌈.
do $$
begin
  begin
    alter publication supabase_realtime add table public.work_requests;
  exception when duplicate_object then null; when others then null;
  end;
  begin
    alter publication supabase_realtime add table public.team_notes;
  exception when duplicate_object then null; when others then null;
  end;
end $$;

-- ── 확인 ────────────────────────────────────────────────────────────────
select column_name, data_type from information_schema.columns
 where table_name = 'work_requests' and column_name in ('replies','reply_unread');
select tablename from pg_publication_tables
 where pubname = 'supabase_realtime' and tablename in ('work_requests','team_notes');
