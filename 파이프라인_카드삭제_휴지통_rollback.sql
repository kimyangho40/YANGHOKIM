-- ============================================================
-- ↩ 되돌리기 — 파이프라인 카드 삭제/휴지통 컬럼 제거
--
-- ⚠️ 컬럼을 지우면 휴지통에 있던 카드가 "삭제되지 않은 상태"로 보드에 되살아난다.
--    (행 자체는 지운 적이 없고 deleted_at 으로만 가려 뒀기 때문)
--    먼저 아래 조회로 몇 건이 되살아나는지 확인할 것.
-- ============================================================

-- 0) 되살아날 카드 미리보기 (실행 전 확인용)
select id, business_name, agency_group, stage, deleted_at, deleted_by
  from public.pipeline_cards
 where deleted_at is not null
 order by deleted_at desc;

-- 1) 되돌리기
begin;
  set local lock_timeout = '3s';
  drop index if exists public.pipeline_cards_deleted_idx;
  alter table public.pipeline_cards
    drop column if exists deleted_at,
    drop column if exists deleted_by;
commit;

-- 확인 — 0 이어야 정상
select count(*) as remaining_columns
  from information_schema.columns
 where table_schema='public' and table_name='pipeline_cards'
   and column_name in ('deleted_at','deleted_by');
