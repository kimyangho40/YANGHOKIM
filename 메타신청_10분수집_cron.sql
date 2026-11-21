-- =====================================================================
-- 메타 신청 수집 — 10분마다 Edge Function `meta-leads` 를 부른다 (pg_cron + pg_net)
-- 실행:     node scripts/run-sql.js 메타신청_10분수집_cron.sql
-- 되돌리기: 메타신청_10분수집_cron_rollback.sql  (예약만 해제. 이미 들어온 신청은 그대로)
--
-- 먼저 되어 있어야 하는 것(순서대로):
--   ① 메타신청_db_leads_컬럼추가.sql  ② 메타신청_토큰_금고함수.sql + Vault 값 2개
--   ③ Edge Function 배포: npx supabase functions deploy meta-leads --project-ref ujdrjvnihxjvbkezjvwc --use-api --no-verify-jwt
--
-- 🔐 호출 비밀키는 이 파일에 없다. cron 이 실행될 때마다 Vault 에서 꺼내 헤더에 싣는다.
--    함수는 이 헤더가 맞을 때만 일한다(verify_jwt 를 끄는 대신). 키가 새도 할 수 있는 일은 "수집 한 번 더"뿐이다.
-- 멈추기: select cron.unschedule('meta-leads-poll');
-- =====================================================================
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- 이름이 같으면 갱신된다(pg_cron 1.4+ named job upsert).
select cron.schedule(
  'meta-leads-poll',
  '*/10 * * * *',
  $$select net.http_post(
      url := 'https://ujdrjvnihxjvbkezjvwc.supabase.co/functions/v1/meta-leads',
      headers := jsonb_build_object('content-type', 'application/json', 'x-meta-leads-secret', public.meta_leads_secret()),
      body := '{}'::jsonb,
      timeout_milliseconds := 25000
    )$$
);

select jobname, schedule, active from cron.job where jobname = 'meta-leads-poll';
