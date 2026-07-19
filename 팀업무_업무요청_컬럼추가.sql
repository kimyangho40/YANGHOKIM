-- ════════════════════════════════════════════════════════════════════════
-- 팀 업무 공간 + 업무 요청 기능용 스키마
--   [1] team_notes.priority  : 우선순위 (urgent|normal|low, 기존 high 호환)  — 기능3
--   [2] team_notes.read_by   : 공지 확인한 사람 이름 배열                      — 기능2
--   [3] work_requests 테이블 : 팀원 간 업무 요청 + 읽음/완료 추적            — 기능4/5
-- 실행: Supabase SQL Editor에 붙여넣고 Run. (여러 번 실행해도 안전 — IF NOT EXISTS)
-- ════════════════════════════════════════════════════════════════════════

-- ── [1] 우선순위 (이미 있으면 통과) ─────────────────────────────────────
alter table public.team_notes add column if not exists priority text default 'normal';
comment on column public.team_notes.priority is '우선순위: urgent(🔴긴급)|normal(🟡보통)|low(🟢여유), 기존 high 호환';

-- ── [2] 공지 확인 체크 (기능2) ──────────────────────────────────────────
alter table public.team_notes add column if not exists read_by jsonb default '[]'::jsonb;
comment on column public.team_notes.read_by is '이 팀 업무를 확인한 사람 이름 배열 (예: ["양호","동일"])';

-- ── [3] 업무 요청 (기능4/5) ─────────────────────────────────────────────
create table if not exists public.work_requests (
  id           uuid primary key default gen_random_uuid(),
  request_from text not null,           -- 보낸 사람
  request_to   text not null,           -- 받는 사람
  content      text not null,           -- 요청 내용
  urgent       boolean default false,   -- 긴급 여부
  company_id   uuid,                    -- @업체 연결(선택)
  note_id      uuid,                    -- 항목이 추가된 받는 사람 work_notes id
  status       text default 'pending',  -- pending(안읽음) | read(읽음) | done(완료)
  read_at      timestamptz,             -- 읽은 시각 (6시간 미확인 배지 기준)
  done_at      timestamptz,             -- 완료 시각
  created_at   timestamptz default now()
);
comment on table public.work_requests is '팀원 간 업무 요청 (받는 사람 오늘 노트 체크리스트에 📩 항목으로 추가됨)';

create index if not exists idx_work_requests_to     on public.work_requests(request_to, status);
create index if not exists idx_work_requests_from   on public.work_requests(request_from, status);

-- ── (선택) RLS: 다른 테이블과 동일 정책을 쓰는 환경이면 아래 참고 ─────────
-- alter table public.work_requests enable row level security;
-- create policy "authenticated all" on public.work_requests
--   for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- ── 확인 ────────────────────────────────────────────────────────────────
select column_name, data_type from information_schema.columns
 where table_name = 'team_notes' and column_name in ('priority','read_by');
select 'work_requests' as tbl, count(*) as rows from public.work_requests;
