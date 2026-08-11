-- ============================================================================
-- ⏪ 되돌리기 — authenticated_TRUNCATE_회수.sql
--
-- 되돌리면 승인된 로그인 사용자가 다시 public 스키마 테이블을 TRUNCATE 할 수 있다
-- (RLS·트리거를 우회해 테이블을 통째로 비울 수 있다). 웬만하면 되돌리지 말 것.
--
-- ⚠️ 원상복구가 "완전히" 되지는 않는다. 회수 전에는 26개 테이블만 TRUNCATE 가
--    있었는데(신규 8개는 원래 없었다), 아래 GRANT 는 **전체 테이블**에 준다.
--    정확히 26개로 되돌리려면 아래 목록만 개별 GRANT 할 것.
--
-- 실행: node scripts/run-sql.js authenticated_TRUNCATE_회수_rollback.sql
-- ============================================================================

grant truncate on all tables in schema public to authenticated;

alter default privileges for role postgres in schema public
  grant truncate on tables to authenticated;

-- 회수 전 TRUNCATE 를 갖고 있던 26개 (참고용 — 정확히 되돌리려면 이것만 grant)
--   activity_logs, agency_cases, ai_chat_history, approval_cases, branch_contacts,
--   calendar_events, call_logs, chat_messages, companies, db_leads, documents,
--   google_oauth_tokens, kpi_goals, leave_requests, notif_status, partners,
--   pipeline_cards, profiles, push_subscriptions, quick_links, settlement_manual,
--   stage_stagnation_config, status_stage_map, team_notes, work_notes, work_requests
-- 원래 없던 8개: _backup_* 6개, sign_offs, sign_off_events
