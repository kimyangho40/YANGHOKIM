-- =====================================================================
-- 메타 신청 → DB리스트 자동 등록 — db_leads 에 컬럼 7개 추가 (새 테이블 0개)
-- 실행:     node scripts/run-sql.js 메타신청_db_leads_컬럼추가.sql
-- 되돌리기: 메타신청_db_leads_컬럼추가_rollback.sql
-- 검증:     메타신청_db_leads_컬럼추가_검증.sql (별도 실행 — CLAUDE.md 2-2)
--
-- 기존 행은 한 줄도 바뀌지 않는다: 전부 NULL 허용 · 기본값 없음.
-- 화면(App.js ⛳ 메타신청)은 source='meta' 인 행만 메타 신청으로 다룬다 → 기존 720여 건은 그대로 「직접 입력」.
--
--   source            text         유입 경로. NULL=직접 입력(기존), 'meta'=메타 광고 양식
--   meta_lead_id      text unique  메타가 준 신청 번호. 같은 신청이 두 번 들어오는 것을 DB 가 막는다
--   meta_form_name    text         양식 이름
--   meta_ad_name      text         들어온 광고 이름
--   meta_answers      jsonb        양식 답 { name, city, tax, sales, employees, years, plan, call_time, raw }
--   applied_at        timestamptz  신청 시각(메타 기준)
--   first_contact_at  timestamptz  미연락 → 다른 상태로 처음 바뀐 시각(화면이 찍는다)
--
-- 판정(우선 연락·검토·소규모·신청 불가)과 경과 시간은 저장하지 않는다 — 화면이 매번 계산한다.
-- 권한: 기존 db_leads 의 RLS·GRANT 를 그대로 탄다(새 정책 없음). anon 은 테이블 권한이 없다.
-- =====================================================================
alter table public.db_leads
  add column if not exists source text,
  add column if not exists meta_lead_id text,
  add column if not exists meta_form_name text,
  add column if not exists meta_ad_name text,
  add column if not exists meta_answers jsonb,
  add column if not exists applied_at timestamptz,
  add column if not exists first_contact_at timestamptz;

alter table public.db_leads drop constraint if exists db_leads_source_chk;
alter table public.db_leads add constraint db_leads_source_chk check (source is null or source in ('meta'));

alter table public.db_leads drop constraint if exists db_leads_meta_answers_chk;
alter table public.db_leads add constraint db_leads_meta_answers_chk check (meta_answers is null or jsonb_typeof(meta_answers) = 'object');

-- 같은 신청 번호는 한 번만. NULL(직접 입력)은 서로 겹치지 않는 것으로 친다(기본 동작).
create unique index if not exists db_leads_meta_lead_id_key on public.db_leads (meta_lead_id);
-- 「메타 신청」 최신순 조회용
create index if not exists db_leads_source_applied_idx on public.db_leads (source, applied_at desc) where source is not null;

comment on column public.db_leads.source is '유입 경로 — NULL=직접 입력, meta=메타 광고 양식(Edge Function meta-leads)';
comment on column public.db_leads.meta_lead_id is '메타 신청 번호(중복 차단용 unique)';
comment on column public.db_leads.meta_answers is '메타 양식 답 원문(jsonb 객체). 판정은 화면이 계산';
comment on column public.db_leads.applied_at is '메타 신청 시각';
comment on column public.db_leads.first_contact_at is '첫 연락 시각 — 미연락에서 처음 벗어난 때';
