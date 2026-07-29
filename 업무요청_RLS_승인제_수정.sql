-- ════════════════════════════════════════════════════════════════════════
-- work_requests RLS 승인제 전환 (작성: 2026-07-29 / 실행 전)
--
-- 왜 필요한가:
--   현재 work_requests 정책은 `authenticated all` / using(true) / with check(true).
--   → 로그인만 하면 승인 대기·거절 계정까지 전 직원 업무 요청을 전건 조회·수정·삭제 가능.
--   같은 성격의 team_notes 는 p_team_notes_all / is_approved() 를 타는데 이 테이블만 빠졌다.
--   원인: 보안_RLS_승인제_SETUP.sql 이 테이블을 "이름으로 나열"하는 방식이라,
--         그 뒤에 만든 work_requests 가 목록에 없었고
--         팀업무_업무요청_컬럼추가.sql 의 주석 예시 정책이 대신 적용됐다.
--
-- 실행 순서 주의:
--   업무요청_답장_알림확장_컬럼추가.sql([3] Realtime publication 추가)보다 **먼저** 실행할 것.
--   정책이 using(true) 인 상태로 Realtime 을 켜면, 미승인 계정에도 전 직원 업무 요청의
--   INSERT/UPDATE 이벤트가 실시간으로 밀려나간다(노출 경로가 pull → push 로 넓어짐).
--
-- 안전장치:
--   - lock_timeout 3s : 팀원 쿼리 뒤에 줄서서 앱을 멈추지 않는다. 못 잡으면 그냥 실패(무변경).
--   - 단일 트랜잭션   : 정책 교체가 통째로 되거나 통째로 안 되거나 둘 중 하나.
--                       "옛 정책은 지웠는데 새 정책은 없는" 무방비/전면차단 구간이 없다.
--   - 데이터는 건드리지 않는다(행 삭제·수정 없음).
--
-- 롤백: 업무요청_RLS_승인제_수정_rollback.sql
-- ════════════════════════════════════════════════════════════════════════
begin;
  set local lock_timeout = '3s';

  -- 1) 옛 정책 제거
  --    PERMISSIVE 정책은 OR 로 합쳐지므로, using(true) 정책이 하나라도 남으면
  --    새 is_approved() 정책이 무력화된다. 반드시 지우고 새로 만든다.
  drop policy if exists "authenticated all"  on public.work_requests;
  drop policy if exists p_work_requests_all  on public.work_requests;

  -- 2) 승인제 정책 신규 생성 (team_notes 등 다른 테이블과 동일 패턴)
  create policy p_work_requests_all on public.work_requests
    for all to authenticated
    using (public.is_approved())
    with check (public.is_approved());

  -- 3) RLS 활성화 (이미 켜져 있음 — 멱등성 확보용)
  alter table public.work_requests enable row level security;

  -- 4) anon 권한 회수 (2중 잠금)
  --    현재 anon 은 정책이 없어 RLS 로 이미 차단되지만, 방어선이 "정책 부재" 하나뿐이다.
  --    나중에 누가 to public / to anon 정책을 하나 추가하면 OR 합성으로 뚫린다.
  --    team_notes 도 같은 이유로 함께 회수(정책은 이미 is_approved() 라 변경 없음).
  revoke all on public.work_requests from anon;
  revoke all on public.team_notes    from anon;
commit;

-- ── 실행 후 검증 ─────────────────────────────────────────────────────────
-- [검증 1] 정책 — work_requests 에 p_work_requests_all 1행만,
--          roles={authenticated}, using/with_check 모두 is_approved() 여야 정상.
--          using 이 true 인 행이 남아 있으면 실패.
select tablename, policyname, permissive, roles, cmd,
       qual       as "using",
       with_check as "with_check"
  from pg_policies
 where schemaname = 'public'
   and tablename in ('work_requests','team_notes')
 order by tablename, policyname;

-- [검증 2] GRANT — anon 행이 **0행**이어야 정상. authenticated 행만 남는다.
select table_name, grantee, privilege_type
  from information_schema.role_table_grants
 where table_schema = 'public'
   and table_name in ('work_requests','team_notes')
   and grantee in ('anon','public')
 order by table_name, grantee, privilege_type;

-- [검증 3] RLS 켜짐 + 정책 1개 + 데이터 보존 확인
select c.relname                                as table_name,
       c.relrowsecurity                         as rls_enabled,
       (select count(*) from pg_policies p
         where p.schemaname='public' and p.tablename=c.relname) as policies,
       (select n_live_tup from pg_stat_user_tables s
         where s.schemaname='public' and s.relname=c.relname)   as approx_rows
  from pg_class c
 where c.relnamespace='public'::regnamespace
   and c.relname in ('work_requests','team_notes')
 order by c.relname;

-- ── 실행 후 화면 확인 (정책이 틀리면 승인된 팀원도 요청이 안 보인다) ──────
--   · 업무 요청 보내기 / 가져가기 / 완료 체크가 각각 동작하는지
--   · 받은 요청 배지·알림함에 건수가 그대로 뜨는지
--   · 팀 업무 공간 카드 목록·공지 확인이 그대로인지
