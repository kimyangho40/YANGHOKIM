-- =====================================================================
-- 「정부 기관 사이트」 하단 공고 조회 — 저장 표 2개 (2026-11-25)
-- 실행:     node scripts/run-sql.js 공고조회_fund_notices.sql
-- 되돌리기: 공고조회_fund_notices_rollback.sql
-- 검증:     공고조회_fund_notices_검증.sql  (별도 실행 — 조치 파일에 딸린 SELECT 를 믿지 않는다)
--
-- fund_notices     공고 한 건 = 한 줄. 채우는 쪽은 Edge Function `fund-notices`(service_role) 하나뿐이다.
-- fund_news_daily  날짜별 「오늘의 주요공고」 12건의 key 목록.
-- 앱 사용자는 읽기만 한다(승인된 로그인 사용자). 쓰기 권한·쓰기 정책 없음.
-- =====================================================================
create table if not exists public.fund_notices (
  key           text primary key,          -- 출처:원본번호 (예: bizinfo:PBLN_000000000123456)
  source        text not null,
  source_name   text,
  source_id     text,
  title         text not null,
  org           text,
  target        text,
  target_detail text,
  support       text,
  content       text,
  apply_method  text,
  contact       text,
  period        text,
  start_date    date,
  end_date      date,
  reg_date      date,
  upd_date      date,
  link          text,
  realm         text,
  kinds         text[] not null default '{}',
  regions       text[] not null default '{}',
  matched       text[] not null default '{}',
  cats          text[] not null default '{}',
  verdict       text,
  is_recent     boolean not null default false,
  duplicate_of  text,
  summary       text,                       -- AI 안내 문장(숫자를 원문과 대조해 통과한 것만). 수집이 덮어쓰지 않는다.
  last_seen     date,                       -- 출처에서 마지막으로 본 날(KST)
  updated_at    timestamptz not null default now()
);
create index if not exists fund_notices_reg_date_idx on public.fund_notices (reg_date desc);

create table if not exists public.fund_news_daily (
  news_date   date primary key,
  notice_keys text[] not null default '{}',
  updated_at  timestamptz not null default now()
);

alter table public.fund_notices    enable row level security;
alter table public.fund_news_daily enable row level security;

drop policy if exists p_fund_notices_select on public.fund_notices;
create policy p_fund_notices_select on public.fund_notices
  for select to authenticated using (public.is_approved());
drop policy if exists p_fund_news_daily_select on public.fund_news_daily;
create policy p_fund_news_daily_select on public.fund_news_daily
  for select to authenticated using (public.is_approved());

revoke all on public.fund_notices, public.fund_news_daily from anon;
revoke insert, update, delete, truncate, references, trigger on public.fund_notices, public.fund_news_daily from authenticated;
grant select on public.fund_notices, public.fund_news_daily to authenticated;

comment on table public.fund_notices is '정책자금·지원금 공고(기관 사이트 화면 하단). Edge Function fund-notices 만 쓴다 · 앱은 읽기 전용';
comment on table public.fund_news_daily is '날짜별 오늘의 주요공고 12건(key 목록). Edge Function fund-notices 만 쓴다';

select c.relname, c.relrowsecurity from pg_class c
 where c.relnamespace = 'public'::regnamespace and c.relname in ('fund_notices', 'fund_news_daily') order by 1;
