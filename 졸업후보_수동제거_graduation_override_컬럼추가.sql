-- 졸업(마일스톤) 후보 배지 수동 제거/복구용 컬럼
-- graduation_override(jsonb): { "hidden": true } 이면 자동판별돼도 배지 숨김
alter table public.companies
  add column if not exists graduation_override jsonb;
select 'graduation_override 컬럼 준비 완료' as status;
