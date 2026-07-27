-- 파이프라인 "일괄 정리" 모드용 컬럼 추가 — 2026-07-27
--
-- 목적: 직원이 클릭만으로 미진행 업체를 정리하고, 그 사유를 통계로 집계할 수 있게 한다.
--   · checked_at/checked_by : "진행 중 — 확인함" 표시(단계는 그대로 둠)
--   · hold_reason/hold_at   : 보류 (시기상조 / 자금 불필요(현재) / 대표 검토중)
--                             보류 카드는 정체 알림 대상에서 제외한다
--   · closed_reason         : 종결 사유 (폐업 / 연락두절 / 관계단절 / 자금 불필요(영구) / 요건 미달)
--                             종결 여부 자체는 기존 closed_at/closed_by 를 그대로 쓴다
--
-- ⚠ RLS: pipeline_cards 는 2026-07-27 조치 5로 이미 RLS 활성 + p_pipeline_cards_all 정책이 있다.
--    컬럼 추가는 테이블 정책을 그대로 상속하므로 별도 정책 작업이 필요 없다(아래에서 확인 출력).
-- 실행: node scripts/run-sql.js 파이프라인_일괄정리_컬럼추가.sql

alter table public.pipeline_cards
  add column if not exists checked_at    timestamptz,
  add column if not exists checked_by    text,
  add column if not exists hold_reason   text,
  add column if not exists hold_at       timestamptz,
  add column if not exists closed_reason text;

-- 보류 카드 조회(별도 필터 · 정체 알림 제외)용
create index if not exists idx_pipeline_cards_hold
  on public.pipeline_cards (hold_reason) where hold_reason is not null;
-- 종결 사유 통계 집계용
create index if not exists idx_pipeline_cards_closed_reason
  on public.pipeline_cards (closed_reason) where closed_reason is not null;

-- 확인: 컬럼 5개 생성 + RLS/정책이 그대로인지
select (select count(*) from information_schema.columns
         where table_schema='public' and table_name='pipeline_cards'
           and column_name in ('checked_at','checked_by','hold_reason','hold_at','closed_reason')) as 새컬럼수,
       (select relrowsecurity from pg_class
         where relnamespace='public'::regnamespace and relname='pipeline_cards') as rls_enabled,
       (select count(*) from pg_policies
         where schemaname='public' and tablename='pipeline_cards') as policies;
