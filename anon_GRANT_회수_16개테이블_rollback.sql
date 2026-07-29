-- ════════════════════════════════════════════════════════════════════════
-- [롤백] anon_GRANT_회수_16개테이블.sql 되돌리기
--
-- 언제 쓰나: 회수 후 로그인·가입·목록 로딩 중 무언가가 "권한 없음"으로 깨질 때.
-- 데이터는 애초에 건드리지 않았으므로 손실 없음. 정책도 건드리지 않았다.
--
-- ⚠️ 이 롤백은 **GRANT만** 원복한다. RLS와 정책은 그대로 두므로,
--    롤백 후에도 anon은 여전히 RLS로 막힌다(anon 대상 정책이 하나도 없기 때문).
--    즉 "회수 전 상태"로 돌아가는 것이지 "anon에게 열어주는 것"이 아니다.
--
-- ⚠️ 아래 7개 권한은 Supabase가 public 스키마 테이블에 기본으로 주는 조합이며,
--    회수 직전 16개 테이블이 실제로 갖고 있던 조합과 같다.
--    확신이 서지 않으면 회수 파일 상단의 [사전 스냅샷] 출력과 대조할 것.
-- ════════════════════════════════════════════════════════════════════════
begin;
  set local lock_timeout = '3s';

  grant select, insert, update, delete, references, trigger, truncate on public.activity_logs      to anon;
  grant select, insert, update, delete, references, trigger, truncate on public.approval_cases     to anon;
  grant select, insert, update, delete, references, trigger, truncate on public.branch_contacts    to anon;
  grant select, insert, update, delete, references, trigger, truncate on public.calendar_events    to anon;
  grant select, insert, update, delete, references, trigger, truncate on public.call_logs          to anon;
  grant select, insert, update, delete, references, trigger, truncate on public.chat_messages      to anon;
  grant select, insert, update, delete, references, trigger, truncate on public.companies          to anon;
  grant select, insert, update, delete, references, trigger, truncate on public.kpi_goals          to anon;
  grant select, insert, update, delete, references, trigger, truncate on public.leave_requests     to anon;
  grant select, insert, update, delete, references, trigger, truncate on public.notif_status       to anon;
  grant select, insert, update, delete, references, trigger, truncate on public.partners           to anon;
  grant select, insert, update, delete, references, trigger, truncate on public.profiles           to anon;
  grant select, insert, update, delete, references, trigger, truncate on public.push_subscriptions to anon;
  grant select, insert, update, delete, references, trigger, truncate on public.quick_links        to anon;
  grant select, insert, update, delete, references, trigger, truncate on public.settlement_manual  to anon;
  grant select, insert, update, delete, references, trigger, truncate on public.work_notes         to anon;
commit;

-- ── 롤백 확인 ────────────────────────────────────────────────────────────
-- 16개 테이블 × 7권한 = 112행이면 회수 전 상태로 복구된 것.
select table_name, count(*) as grants
  from information_schema.role_table_grants
 where table_schema = 'public' and grantee = 'anon'
 group by table_name
 order by table_name;

-- 참고: 정책은 건드리지 않았으므로 아래는 롤백 후에도 0행이어야 정상이다.
--       (0행이 아니면 anon에게 실제로 문이 열린 것이므로 즉시 조사할 것)
select tablename, policyname, roles, cmd
  from pg_policies
 where schemaname = 'public'
   and (roles::text like '%anon%' or roles::text like '%public%');

-- ── 롤백 후 반드시 할 일 ─────────────────────────────────────────────────
--   깨진 원인을 찾아 고친 뒤 다시 회수할 것. GRANT가 남아 있는 상태는
--   "정책 부재" 단일 방어선으로 되돌아간 것이며, 이번 조치의 목적이 사라진 상태다.
