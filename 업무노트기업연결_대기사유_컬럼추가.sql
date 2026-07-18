-- =====================================================================
-- 업무노트 ↔ 기업목록 연동
--   [1] work_notes.company_id  — @태그로 연결된 기업(companies.id)
--   [3] wait_reason / wait_since — 방치 자동 알림용 대기 상태
-- 대상 테이블: public.work_notes   (멱등 — 여러 번 실행해도 안전)
-- 실행: node scripts/run-sql.js 업무노트기업연결_대기사유_컬럼추가.sql
-- =====================================================================

-- ── [1] 기업 연결 ────────────────────────────────────────────────────
-- companies.id 는 uuid 로 확인됨. 원본 기업 삭제 시 참조만 끊고 노트는 남긴다.
alter table public.work_notes
  add column if not exists company_id uuid references public.companies(id) on delete set null;

comment on column public.work_notes.company_id is
  '업무노트에 @태그로 연결된 기업 companies.id. null이면 미연결';

create index if not exists idx_work_notes_company_id
  on public.work_notes (company_id) where company_id is not null;

-- ── [3] 방치 자동 알림용 대기 상태 ───────────────────────────────────
-- wait_reason: '응답대기' | '서류대기' | null(일반)
-- wait_since : 대기 상태로 바뀐 시각. 3일(72h) 경과 & 미완료면 대시보드 배너.
alter table public.work_notes add column if not exists wait_reason text;
alter table public.work_notes add column if not exists wait_since  timestamptz;

comment on column public.work_notes.wait_reason is '대기 사유: 응답대기|서류대기, null이면 일반';
comment on column public.work_notes.wait_since  is '대기상태 시작 시각. 3일 경과 리마인드 기준';

-- ── 확인 ─────────────────────────────────────────────────────────────
select column_name, data_type, is_nullable
  from information_schema.columns
 where table_schema = 'public' and table_name = 'work_notes'
   and column_name in ('company_id', 'wait_reason', 'wait_since')
 order by column_name;
