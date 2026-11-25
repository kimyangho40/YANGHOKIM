-- 공고 수집 예약 해제. 이미 모은 공고·뉴스 목록은 그대로 남는다.
select cron.unschedule('fund-notices-daily');
select count(*) as remaining from cron.job where jobname = 'fund-notices-daily';
