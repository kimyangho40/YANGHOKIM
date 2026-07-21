-- =====================================================================
-- 🔔 알림 권한 상태 중앙 기록 테이블 (notif_status)
-- 목적: 각 사용자의 브라우저 알림 권한(granted/default/denied/unsupported)을
--       DB에 기록해, 관리자가 한 곳에서 "누가 팝업이 되고 안 되는지" 확인.
-- 실행: node scripts/run-sql.js 알림권한상태_notif_status_테이블추가.sql
-- 특징: 멱등(여러 번 실행해도 안전).
-- 프로젝트: ujdrjvnihxjvbkezjvwc
-- =====================================================================

create table if not exists public.notif_status (
  user_name  text primary key,
  permission text not null,          -- granted | default | denied | unsupported
  user_agent text,
  updated_at timestamptz not null default now()
);

-- RLS: 다른 데이터 테이블과 동일 정책 — 승인된 로그인 사용자만 접근, anon 차단
alter table public.notif_status enable row level security;

drop policy if exists p_notif_status_all on public.notif_status;
create policy p_notif_status_all on public.notif_status
  for all to authenticated
  using (public.is_approved()) with check (public.is_approved());

-- 확인용
select user_name, permission, updated_at from public.notif_status order by updated_at desc;
