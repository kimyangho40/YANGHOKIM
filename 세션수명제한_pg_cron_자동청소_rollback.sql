-- ============================================================================
-- ⏪ 세션 자동 청소 되돌리기 — cron 작업만 해제한다
--
--   ⚠️ 이미 지워진 세션은 복구하지 않는다(복구할 수도 없다).
--      세션이 지워져도 계정은 멀쩡하고 재로그인하면 끝이라 복구 대상이 아니다.
--
--   되돌리면 세션 수명 제한이 다시 사라진다 —
--   한 번 로그인하면 무기한 유지되던 원래 상태로 돌아간다.
--
-- 실행: node scripts/run-sql.js 세션수명제한_pg_cron_자동청소_rollback.sql
-- ============================================================================

select cron.unschedule('sweep-stale-sessions');

-- pg_cron 확장 자체는 남긴다. 다른 작업이 쓰고 있을 수 있어 함부로 drop 하지 않는다.
-- 정말 확장까지 지우려면 cron.job 이 비어 있는지 먼저 확인할 것:
--   select jobid, jobname from cron.job;
--   drop extension pg_cron;   -- 위가 0행일 때만

select
  (select count(*) from cron.job where jobname = 'sweep-stale-sessions') as "남은 작업(0이어야)",
  (select jsonb_agg(jsonb_build_object('jobid', jobid, 'jobname', jobname)) from cron.job) as "다른 cron 작업";
