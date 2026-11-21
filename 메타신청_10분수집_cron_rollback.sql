-- 되돌리기: 메타신청_10분수집_cron.sql — 예약만 해제한다. 이미 들어온 신청·확장(pg_cron·pg_net)은 그대로 둔다.
select cron.unschedule('meta-leads-poll');
select count(*) as "남은 meta-leads 예약(0이어야 정상)" from cron.job where jobname = 'meta-leads-poll';
