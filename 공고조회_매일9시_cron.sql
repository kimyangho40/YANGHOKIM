-- =====================================================================
-- 공고 수집 — 매일 09:00(KST) Edge Function `fund-notices` 를 부른다 (pg_cron + pg_net)
-- 실행:     node scripts/run-sql.js 공고조회_매일9시_cron.sql
-- 되돌리기: 공고조회_매일9시_cron_rollback.sql  (예약만 해제. 이미 모은 공고는 그대로)
--
-- 먼저 되어 있어야 하는 것(순서대로):
--   ① 공고조회_fund_notices.sql  ② 공고조회_금고함수.sql + Vault 값(공고조회_금고함수.sql 머리 참고)
--   ③ Edge Function 배포: npx supabase functions deploy fund-notices --project-ref ujdrjvnihxjvbkezjvwc --use-api --no-verify-jwt
--
-- 🔐 호출 비밀키는 이 파일에 없다. cron 이 실행될 때마다 Vault 에서 꺼내 헤더에 싣는다.
-- pg_cron 은 UTC 로 돈다 → '0 0 * * *' = 한국 시간 09:00.
-- 멈추기: select cron.unschedule('fund-notices-daily');
-- =====================================================================
create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.schedule(
  'fund-notices-daily',
  '0 0 * * *',
  $$select net.http_post(
      url := 'https://ujdrjvnihxjvbkezjvwc.supabase.co/functions/v1/fund-notices',
      headers := jsonb_build_object('content-type', 'application/json', 'x-fund-notices-secret', public.fund_notices_secret()),
      body := '{}'::jsonb,
      timeout_milliseconds := 120000
    )$$
);

select jobname, schedule, active from cron.job where jobname = 'fund-notices-daily';
