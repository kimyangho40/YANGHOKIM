-- ============================================================================
-- 🧹 세션 수명 제한 — 묵은 세션 1회 청소 + pg_cron 매일 자동 청소
--   2026-08-11. 사용자 승인 후 실행.
--
-- [왜 이 방식인가]
--   Supabase 의 정식 기능(sessions_timebox / sessions_inactivity_timeout)은
--   **Pro 플랜 전용**이다. 무료 플랜에서 Management API 로 PATCH 하면 402:
--     "User sessions can only be configured on Pro Plans and up."
--   그래서 같은 효과를 auth.sessions 를 직접 청소해서 낸다.
--
-- [왜 세션 행을 지우면 로그아웃되나]
--   auth.refresh_tokens.session_id → auth.sessions 가 ON DELETE CASCADE 다(실측 확인).
--   세션을 지우면 리프레시 토큰이 같이 사라진다 → 액세스 토큰(jwt_exp=3600, 최대 1시간)이
--   만료된 뒤 갱신이 막혀 재로그인해야 한다.
--   ⚠️ 즉 "즉시" 로그아웃이 아니라 **최대 1시간 뒤**부터다. 즉시 차단이 필요하면
--      그건 profiles.status='rejected' 가 담당한다(별개 수단, 이미 검증됨).
--
-- [기준]
--   · 생성 30일 초과      = timebox 30일        (Pro 의 sessions_timebox 대응)
--   · 14일간 갱신 없음    = 미사용 14일          (Pro 의 sessions_inactivity_timeout 대응)
--   updated_at 은 토큰 갱신 때마다 움직이므로, 앱을 계속 켜 두면 미사용 조건엔 안 걸리고
--   timebox 조건에만 걸린다. 의도한 동작이다.
--
-- 실행:     node scripts/run-sql.js 세션수명제한_pg_cron_자동청소.sql
-- 되돌리기: 세션수명제한_pg_cron_자동청소_rollback.sql (cron 해제. 지워진 세션은 복구 불가 —
--           재로그인하면 그만이라 복구 대상이 아니다)
-- ============================================================================

-- 삭제 전 스냅샷 — 누구 세션이 몇 개 지워지는지 보고용
create temp table _victims as
select s.id, s.user_id, s.created_at, s.updated_at,
       coalesce(p.name, '(프로필없음)') as name,
       case when s.created_at < now() - interval '30 days' then '30일초과' else '14일미사용' end as reason
  from auth.sessions s
  left join public.profiles p on p.id = s.user_id
 where s.created_at < now() - interval '30 days'
    or s.updated_at < now() - interval '14 days';

-- ── 1) 1회 청소 ─────────────────────────────────────────────────────────
delete from auth.sessions
 where created_at < now() - interval '30 days'
    or updated_at < now() - interval '14 days';

-- ── 2) 매일 자동 청소 ───────────────────────────────────────────────────
create extension if not exists pg_cron;

-- 이름이 같으면 갱신된다(pg_cron 1.4+ 의 named job upsert).
-- UTC 18:00 = KST 03:00 — 업무시간을 피한다.
select cron.schedule(
  'sweep-stale-sessions',
  '0 18 * * *',
  $$delete from auth.sessions
     where created_at < now() - interval '30 days'
        or updated_at < now() - interval '14 days'$$
);

-- ── 판정 ────────────────────────────────────────────────────────────────
select
  (select count(*) from _victims)                                as "이번에 지운 세션",
  (select jsonb_object_agg(name, n) from (
     select name, count(*) n from _victims group by name) z)     as "사람별",
  (select jsonb_object_agg(reason, n) from (
     select reason, count(*) n from _victims group by reason) z) as "사유별",
  (select count(*) from auth.sessions)                           as "남은 세션",
  -- 남은 세션은 전부 기준 안에 들어와야 정상
  (select count(*) from auth.sessions
    where created_at < now() - interval '30 days'
       or updated_at < now() - interval '14 days')               as "기준초과 잔여(0이어야)",
  (select jsonb_build_object(
     'jobid', jobid, 'schedule', schedule, 'active', active, 'jobname', jobname)
     from cron.job where jobname = 'sweep-stale-sessions')       as "등록된 cron";
