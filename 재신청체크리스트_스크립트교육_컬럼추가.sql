-- =====================================================================
-- [1] 부결/반려 재신청 체크리스트  +  [2] 스크립트 전달 / 유선교육 체크박스
-- 대상 테이블: public.agency_cases   (멱등 — 여러 번 실행해도 안전)
-- 실행 위치: Supabase 대시보드 → SQL Editor  (anon 키로는 DDL 불가)
-- =====================================================================

-- ── [1] 재신청 체크리스트 ────────────────────────────────────────────
-- 부결/반려로 상태를 바꿀 때 띄우는 확인창의 결과를 그대로 보관한다.
-- 형태: {"rep_contacted": true,        -- 대표자 소통 완료
--        "assignee_confirmed": true,   -- 담당자 확인 완료
--        "reapply_intent": "예",       -- 예 | 아니오 | 보류
--        "decided_at": "2026-07-16T...",
--        "decided_by": "관호",
--        "reapplied_case_id": "..."}   -- 자동 생성된 다음달 건 (예 선택 시에만)
alter table public.agency_cases add column if not exists reject_checklist jsonb;

comment on column public.agency_cases.reject_checklist is
  '부결/반려 처리 시 재신청 체크리스트 (대표자 소통·담당자 확인·재신청 의사). 미처리 건은 null';

-- 원본 건 참조 — 자동 생성된 다음달 건이 어느 건에서 나왔는지 (재신청 배지 근거).
-- agency_cases.id 타입(uuid/bigint)을 실제 스키마에서 읽어 맞춘다.
do $$
declare t text;
begin
  select data_type into t
    from information_schema.columns
   where table_schema = 'public' and table_name = 'agency_cases' and column_name = 'id';

  if t = 'uuid' then
    execute 'alter table public.agency_cases add column if not exists reapply_from_id uuid';
  elsif t in ('bigint', 'integer') then
    execute 'alter table public.agency_cases add column if not exists reapply_from_id bigint';
  else
    raise exception 'agency_cases.id 타입을 알 수 없습니다: %', coalesce(t, '(컬럼 없음)');
  end if;

  -- FK는 없을 때만 추가 (원본이 영구삭제되면 참조만 끊고 재신청 건은 남긴다)
  if not exists (select 1 from pg_constraint where conname = 'agency_cases_reapply_from_id_fkey') then
    execute 'alter table public.agency_cases
               add constraint agency_cases_reapply_from_id_fkey
               foreign key (reapply_from_id) references public.agency_cases(id) on delete set null';
  end if;
end $$;

comment on column public.agency_cases.reapply_from_id is
  '재신청 자동생성 건의 원본 agency_cases.id. null이면 재신청 건이 아님';

create index if not exists idx_agency_cases_reapply_from_id
  on public.agency_cases (reapply_from_id)
  where reapply_from_id is not null;

-- ── [2] 스크립트 전달 / 유선교육 체크박스 ────────────────────────────
-- 기존 행은 전부 false로 시작 (미완료 취급).
alter table public.agency_cases add column if not exists script_delivered      boolean not null default false;
alter table public.agency_cases add column if not exists phone_education_done  boolean not null default false;

comment on column public.agency_cases.script_delivered     is '스크립트 전달 완료 여부 (기관별현황에서 담당자가 토글)';
comment on column public.agency_cases.phone_education_done is '유선교육 완료 여부 (기관별현황에서 담당자가 토글)';

-- ── 확인 ─────────────────────────────────────────────────────────────
select column_name, data_type, column_default, is_nullable
  from information_schema.columns
 where table_schema = 'public'
   and table_name   = 'agency_cases'
   and column_name in ('reject_checklist', 'reapply_from_id', 'script_delivered', 'phone_education_done')
 order by column_name;
