-- ============================================================================
-- ⏪ 되돌리기 — 정산 열람·작성 권한 (settlement_permissions)
--   2026-09-26. 본체: 정산권한_settlement_permissions.sql
--
-- ⚠️ 이 파일은 테이블을 통째로 지운다. 관리자가 화면에서 켜 둔 권한 설정이 전부 사라진다.
--    (본체 시드 6명은 파일에 적혀 있으니 다시 만들 수 있지만, 그 뒤에 화면에서
--     바꾼 내용은 복구되지 않는다 — 실행 전에 아래 백업 SELECT 를 먼저 떠 둘 것.)
--
-- ⚠️ App.js 를 같이 되돌려야 한다. 코드만 새 것으로 남으면 권한 맵 조회가 실패해
--    정산 화면이 📛 배너와 함께 표를 안 그린다(일부러 그렇게 만들었다 — 조용히
--    적게 보이는 것보다 낫기 때문). git revert 로 코드도 함께 되돌릴 것.
--
-- 실행: node scripts/run-sql.js 정산권한_settlement_permissions_rollback.sql
-- ============================================================================

-- ── [백업] 지우기 전에 현재 값을 로그에 남긴다. 실행 로그를 보관할 것 ──────────
select name, scope, updated_by, updated_at
  from public.settlement_permissions
 order by scope desc, name;

begin;
set local lock_timeout = '3s';

drop trigger  if exists trg_settlement_perm_guard on public.settlement_permissions;
drop table    if exists public.settlement_permissions;
drop function if exists public.settlement_perm_guard();

commit;

-- ⚠️ public.so_normalize_name(text) 은 **지우지 않는다** — 결재함(sign_offs)이 쓴다.

-- ── 실행 후 확인 (0행이어야 정상) ───────────────────────────────────────────
select c.relname
  from pg_class c
 where c.relnamespace = 'public'::regnamespace
   and c.relname = 'settlement_permissions';
