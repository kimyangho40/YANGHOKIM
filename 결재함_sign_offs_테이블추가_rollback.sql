-- ============================================================================
-- ⏪ 결재함(sign_offs) 되돌리기 — 결재함_sign_offs_테이블추가.sql 취소
--
-- ⚠️ 테이블을 통째로 지운다. 이미 올라온 결재 건과 이력이 있으면 함께 사라진다.
--    실행 전 아래로 남은 데이터부터 확인할 것:
--      select count(*) from public.sign_offs;
--      select count(*) from public.sign_off_events;
--    데이터가 있으면 백업(csv export) 후 실행하거나, 아예 실행하지 말 것.
--
-- 실행: node scripts/run-sql.js 결재함_sign_offs_테이블추가_rollback.sql
-- ============================================================================

begin;

-- 트리거 → 테이블 순서로 정리 (테이블을 drop 하면 트리거는 같이 사라지지만 명시한다)
drop trigger if exists trg_sign_offs_bi  on public.sign_offs;
drop trigger if exists trg_sign_offs_bu  on public.sign_offs;
drop trigger if exists trg_sign_offs_aiu on public.sign_offs;

-- 이력이 sign_offs 를 on delete restrict 로 참조하므로 이력부터 지운다
drop table if exists public.sign_off_events;
drop table if exists public.sign_offs;

drop function if exists public.sign_off_comment(uuid, text);
drop function if exists public.so_after_write();
drop function if exists public.so_before_update();
drop function if exists public.so_before_insert();
drop function if exists public.so_my_norm();
drop function if exists public.so_my_name();
drop function if exists public.so_normalize_name(text);

commit;

-- 확인 — 0행이어야 정상
select c.relname
  from pg_class c
 where c.relnamespace = 'public'::regnamespace
   and c.relname in ('sign_offs', 'sign_off_events');
