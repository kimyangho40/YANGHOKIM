-- ════════════════════════════════════════════════════════════════════════
-- anon GRANT 회수 — 16개 테이블 (작성: 2026-07-29 / 실행 전)
--
-- 왜 필요한가:
--   32개 테이블 전부 RLS가 켜져 있고 anon 대상 정책은 0개다. 그래서 지금 anon은 막혀 있다.
--   하지만 GRANT는 아래 16개 테이블에 그대로 남아 있어, 방어선이
--   **"anon 정책이 하나도 없다"는 사실 하나뿐**이다.
--   PERMISSIVE 정책은 OR로 합쳐지므로, 누군가 `to public` / `to anon` 정책을 하나만 추가하면
--   그 순간 전건이 열린다. 2026-07-27 사고(10,801건 노출)가 정확히 이 구조에서 나왔다.
--   → RLS(필터)와 GRANT(권한) 두 겹으로 막아두는 것이 목적이다.
--
-- 회수해도 앱이 안 깨지는 근거 (실행 전 확인 완료):
--   · 로그인·가입: App.js:4297 프로필 최초 등록은 signUp으로 세션이 생긴 뒤 실행된다
--     → authenticated 롤로 동작. profiles 정책 7개도 전부 `to authenticated`.
--   · is_approved(): SECURITY DEFINER 라 definer 권한으로 profiles를 읽는다
--     → 호출자의 anon GRANT와 무관.
--   · 앱의 모든 데이터 접근은 로그인 세션(authenticated)으로 일어난다.
--
-- 안전장치:
--   - lock_timeout 3s : 팀원 쿼리 뒤에 줄서서 앱을 멈추지 않는다. 못 잡으면 그냥 실패(무변경).
--   - 단일 트랜잭션   : 16개가 통째로 되거나 통째로 안 되거나 둘 중 하나.
--   - 데이터는 건드리지 않는다(행 삭제·수정 없음). 정책도 건드리지 않는다.
--
-- ⚠️ DO 블록 루프를 쓰지 않고 16줄을 명시적으로 적는다.
--    CLAUDE.md 2-2가 경고한 "테이블을 이름으로 나열하는 방식"의 재발을 막기 위해서다.
--    루프는 grep에 안 걸리고, 나중에 테이블이 늘어도 diff에 드러나지 않는다.
--    새 테이블을 만들 때는 그 커밋에서 revoke를 같이 넣을 것.
--
-- 롤백: anon_GRANT_회수_16개테이블_rollback.sql
-- ════════════════════════════════════════════════════════════════════════

-- ── [사전 스냅샷] 회수 전 현재 상태 — 이 결과를 실행 로그에 남겨둘 것 ──────
--    롤백이 필요해졌을 때 "원래 뭐가 있었는지" 대조하는 유일한 근거가 된다.
select table_name, grantee, privilege_type
  from information_schema.role_table_grants
 where table_schema = 'public' and grantee = 'anon'
 order by table_name, privilege_type;

-- ── 회수 ────────────────────────────────────────────────────────────────
begin;
  set local lock_timeout = '3s';

  revoke all on public.activity_logs      from anon;
  revoke all on public.approval_cases     from anon;
  revoke all on public.branch_contacts    from anon;
  revoke all on public.calendar_events    from anon;
  revoke all on public.call_logs          from anon;
  revoke all on public.chat_messages      from anon;
  revoke all on public.companies          from anon;
  revoke all on public.kpi_goals          from anon;
  revoke all on public.leave_requests     from anon;
  revoke all on public.notif_status       from anon;
  revoke all on public.partners           from anon;
  revoke all on public.profiles           from anon;
  revoke all on public.push_subscriptions from anon;
  revoke all on public.quick_links        from anon;
  revoke all on public.settlement_manual  from anon;
  revoke all on public.work_notes         from anon;
commit;

-- ── 실행 후 검증 (세 쿼리 모두 0행이어야 정상) ───────────────────────────
-- [검증 1] anon GRANT 잔존 — 0행
select table_name, grantee, privilege_type
  from information_schema.role_table_grants
 where table_schema = 'public' and grantee = 'anon'
 order by table_name, privilege_type;

-- [검증 2] anon / public 대상 정책 — 0행
--   (RLS를 켜도 이런 정책이 하나 있으면 OR로 합쳐져 전부 무력화된다)
select tablename, policyname, roles, cmd, qual as "using"
  from pg_policies
 where schemaname = 'public'
   and (roles::text like '%anon%' or roles::text like '%public%')
 order by tablename, policyname;

-- [검증 3] RLS가 꺼진 테이블 — 0행
select c.relname
  from pg_class c
 where c.relnamespace = 'public'::regnamespace
   and c.relkind = 'r'
   and c.relrowsecurity = false
 order by c.relname;

-- ── 실행 후 화면 확인 (권한을 뺐으므로 반드시 눈으로 볼 것) ──────────────
--   · 로그인 → 기업목록 로딩
--   · 업무노트 저장 / 팀 채팅 송수신 / 대시보드 위젯
--   · 모바일 /m 탭
--   · ★ 새 계정 가입 → 프로필 등록 (anon 경로가 남아 있었다면 여기서 깨진다)
