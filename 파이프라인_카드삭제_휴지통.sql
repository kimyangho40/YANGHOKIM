-- ============================================================
-- 🗑 파이프라인 카드 삭제 → 휴지통 (soft delete)  — 2026-08-12
--
-- 카드 1행 = (회사 × 기관) 조합이다. 삭제해도 companies(기업) 도
-- agency_cases(기관현황 원본) 도 건드리지 않는다 — 그 기업의 그 기관 신청 건만 사라진다.
--
-- 기존 테이블이므로 RLS 는 이미 켜져 있고(p_pipeline_cards_all, 2026-07-27 조치)
-- 컬럼만 늘리는 것이라 정책 추가는 필요 없다.
-- TRUNCATE/REFERENCES/TRIGGER 회수도 2026-08-11 에 26개 테이블 일괄 처리분에 포함돼 있다.
--
-- ⚠️ unique index 는 일부러 그대로 둔다:
--    pipeline_cards_company_agency_uniq (company_id, agency_group) where agency_group is not null
--    → 삭제된 카드가 조합 슬롯을 계속 점유한다. 그래서
--      · 같은 조합을 새로 만들려 하면 막히고 "휴지통에서 복구" 로 안내한다(App.js findDupCard)
--      · 복구는 언제나 성공한다(충돌 상대가 없으므로)
--    'where deleted_at is null' 로 완화하면 같은 조합 카드가 보드와 휴지통에 동시에 생겨
--    복구 시점에 중복 충돌이 난다. 그래서 완화하지 않는다.
--
-- 롤백: 파이프라인_카드삭제_휴지통_rollback.sql
-- 검증: 파이프라인_카드삭제_휴지통_검증.sql
-- ============================================================
begin;
  set local lock_timeout = '3s';

  alter table public.pipeline_cards
    add column if not exists deleted_at timestamptz,   -- 휴지통 이동 시각. null = 살아있는 카드
    add column if not exists deleted_by text;          -- 휴지통으로 옮긴 사람 이름(profiles.name 텍스트)

  -- 휴지통 목록 조회 전용(부분 인덱스라 살아있는 카드에는 부담 없음)
  create index if not exists pipeline_cards_deleted_idx
    on public.pipeline_cards (deleted_at desc) where deleted_at is not null;

  comment on column public.pipeline_cards.deleted_at is
    '휴지통 이동 시각(soft delete). null=정상. 보드·자동동기화·정체알림·대시보드 집계에서 모두 제외된다.';
  comment on column public.pipeline_cards.deleted_by is
    '휴지통으로 옮긴 사람 이름. 복구/영구삭제는 승인된 팀원 누구나 가능(기업목록 휴지통과 동일).';
commit;

-- 확인 — 컬럼 2개 · 인덱스 1개 · 기존 행은 전부 deleted_at is null 이어야 한다
select
  (select count(*) from information_schema.columns
    where table_schema='public' and table_name='pipeline_cards'
      and column_name in ('deleted_at','deleted_by'))                       as new_columns,
  (select count(*) from pg_indexes
    where schemaname='public' and indexname='pipeline_cards_deleted_idx')   as new_index,
  (select count(*) from public.pipeline_cards)                              as total_cards,
  (select count(*) from public.pipeline_cards where deleted_at is not null) as trashed_cards;
