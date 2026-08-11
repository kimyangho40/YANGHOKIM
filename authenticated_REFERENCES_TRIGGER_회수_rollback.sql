-- ============================================================================
-- ⏪ 되돌리기 — authenticated_REFERENCES_TRIGGER_회수.sql
--
-- 되돌리면 승인된 로그인 사용자가 다시 public 스키마 테이블에
-- FK 제약을 걸거나(REFERENCES) 트리거를 달 수 있다(TRIGGER).
-- 앱은 이 권한을 쓰지 않으므로 웬만하면 되돌리지 말 것.
--
-- ⚠️ 원상복구가 "완전히" 되지는 않는다. 회수 전에는 26개 테이블에만 있었는데
--    아래 GRANT 는 **전체 테이블**(34개)에 준다. 정확히 26개로 되돌리려면
--    authenticated_TRUNCATE_회수_rollback.sql 하단의 26개 목록만 개별 GRANT 할 것
--    (두 권한의 대상 테이블 집합이 TRUNCATE 때와 동일하다).
--
-- 실행: node scripts/run-sql.js authenticated_REFERENCES_TRIGGER_회수_rollback.sql
-- ============================================================================

grant references, trigger on all tables in schema public to authenticated;

alter default privileges for role postgres in schema public
  grant references, trigger on tables to authenticated;
