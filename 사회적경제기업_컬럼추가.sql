-- =====================================================================
-- 사회적경제기업 여부 — 규모/기관 배지(중진공 예외) 판정에 반영
-- 대상 테이블: public.companies   (멱등 — 여러 번 실행해도 안전)
-- 실행: node scripts/run-sql.js 사회적경제기업_컬럼추가.sql
-- =====================================================================
alter table public.companies
  add column if not exists social_enterprise boolean not null default false;

comment on column public.companies.social_enterprise is
  '사회적경제기업(협동조합·사회적기업·마을기업 등) 여부. 중진공 예외 판정에 반영';

-- ── 확인 ─────────────────────────────────────────────────────────────
select column_name, data_type, column_default, is_nullable
  from information_schema.columns
 where table_schema = 'public' and table_name = 'companies'
   and column_name = 'social_enterprise';
