-- =====================================================================
-- 되돌리기: 메타신청_db_leads_컬럼추가.sql
-- ⚠️ 컬럼을 지우면 그 안의 값(양식 답·신청 시각·첫 연락 시각)도 사라진다.
--    메타 신청으로 들어온 행 자체(사업자명·연락처·콜 기록)는 남는다 — 지우려면 아래 주석을 풀 것.
--    실행 전에 source='meta' 행을 JSON 으로 떠 둘 것.
-- =====================================================================
-- delete from public.db_leads where source = 'meta';   -- 메타로 들어온 행까지 지울 때만

drop index if exists public.db_leads_source_applied_idx;
drop index if exists public.db_leads_meta_lead_id_key;
alter table public.db_leads drop constraint if exists db_leads_meta_answers_chk;
alter table public.db_leads drop constraint if exists db_leads_source_chk;
alter table public.db_leads
  drop column if exists first_contact_at,
  drop column if exists applied_at,
  drop column if exists meta_answers,
  drop column if exists meta_ad_name,
  drop column if exists meta_form_name,
  drop column if exists meta_lead_id,
  drop column if exists source;
