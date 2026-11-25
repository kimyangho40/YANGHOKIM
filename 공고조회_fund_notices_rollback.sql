-- 공고조회_fund_notices.sql 되돌리기 — 표 2개를 지운다(모아 둔 공고·뉴스 목록도 같이 사라진다. 다시 수집하면 채워진다).
-- 먼저 예약을 멈출 것: 공고조회_매일9시_cron_rollback.sql
drop table if exists public.fund_news_daily;
drop table if exists public.fund_notices;
select count(*) as remaining from pg_class where relnamespace = 'public'::regnamespace and relname in ('fund_notices', 'fund_news_daily');
