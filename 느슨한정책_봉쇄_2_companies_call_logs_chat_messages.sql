-- ════════════════════════════════════════════════════════════════════════
-- [2/2] 느슨한 정책 봉쇄 — companies · call_logs · chat_messages
--   (작성: 2026-07-29 / 실행 전 — [1/2] google_oauth_tokens 를 먼저 실행할 것)
--
-- 무엇이 문제인가:
--   PERMISSIVE 정책은 OR로 합쳐지고 **느슨한 쪽이 이긴다.** 세 테이블 모두
--   using(true) 정책이 남아 있어 is_approved() 승인제가 사실상 작동하지 않는다.
--   → 로그인만 하면 승인 대기·거절 계정도 전건 조회·수정·추가가 가능하다.
--      · companies     기업 1,026행 (삭제분 포함)
--      · call_logs     통화 기록
--      · chat_messages 팀 채팅 182행
--
-- ⚠️ 세 테이블의 상황이 다르다. 같은 방식으로 처리하면 안 된다:
--      · companies  · call_logs  → 엄격 정책(p_*_all / is_approved())이 **이미 있다** → 느슨한 것만 drop
--      · chat_messages           → 엄격 정책이 **없다**. 느슨한 3개가 전부다.
--                                  그냥 drop하면 팀 채팅이 통째로 멈춘다 → 먼저 새 정책을 만든다.
--
-- chat_messages 정책 설계 (일부러 for all 을 쓰지 않는다):
--   현재 정책은 SELECT·INSERT·UPDATE 3개뿐이고 DELETE 정책이 없다 = 지금은 행 삭제가 불가능하다.
--   앱도 삭제 대신 deleted_at 을 찍는 소프트 삭제를 쓴다(App.js:3959 update).
--   여기서 for all 로 만들면 없던 DELETE 권한이 새로 생긴다 → 현재 권한 범위를 그대로 유지한다.
--
-- 안전장치: lock_timeout 3s + 단일 트랜잭션. 데이터는 건드리지 않는다.
-- 롤백: 느슨한정책_봉쇄_2_companies_call_logs_chat_messages_rollback.sql
-- ════════════════════════════════════════════════════════════════════════

-- ── [사전 스냅샷] 실행 로그에 남길 것 (롤백 시 대조 근거) ────────────────
select tablename, policyname, permissive, roles, cmd, qual as "using", with_check
  from pg_policies
 where schemaname = 'public' and tablename in ('companies','call_logs','chat_messages')
 order by tablename, cmd, policyname;

begin;
  set local lock_timeout = '3s';

  -- ── companies : 엄격 정책 p_companies_all(is_approved) 이 이미 있다 → 느슨한 3개만 제거
  drop policy if exists "authenticated can read companies"   on public.companies;
  drop policy if exists "authenticated can update companies" on public.companies;
  drop policy if exists "authenticated can insert companies" on public.companies;

  -- ── call_logs : 엄격 정책 p_call_logs_all(is_approved) 이 이미 있다 → 느슨한 1개만 제거
  drop policy if exists "authenticated can all call_logs" on public.call_logs;

  -- ── chat_messages : 엄격 정책이 없다 → 먼저 만들고 나서 느슨한 것을 지운다
  --    (순서가 뒤바뀌면 그 사이에 채팅이 막힌다. 같은 트랜잭션이라 실제로는 동시에 반영된다)
  drop policy if exists p_chat_messages_select on public.chat_messages;
  drop policy if exists p_chat_messages_insert on public.chat_messages;
  drop policy if exists p_chat_messages_update on public.chat_messages;

  create policy p_chat_messages_select on public.chat_messages
    for select to authenticated using (public.is_approved());
  create policy p_chat_messages_insert on public.chat_messages
    for insert to authenticated with check (public.is_approved());
  create policy p_chat_messages_update on public.chat_messages
    for update to authenticated using (public.is_approved()) with check (public.is_approved());

  drop policy if exists chat_messages_select on public.chat_messages;
  drop policy if exists chat_messages_insert on public.chat_messages;
  drop policy if exists chat_messages_update on public.chat_messages;

  -- anon GRANT 확인 사살 (2026-07-29 회수분 유지 — 없으면 no-op)
  revoke all on public.companies     from anon;
  revoke all on public.call_logs     from anon;
  revoke all on public.chat_messages from anon;
commit;

-- ── 실행 후 검증 ────────────────────────────────────────────────────────
-- [검증 1] using/check 가 true 인 정책이 **0행**이어야 정상
select tablename, policyname, cmd, qual as "using", with_check
  from pg_policies
 where schemaname = 'public'
   and tablename in ('companies','call_logs','chat_messages')
   and (qual = 'true' or with_check = 'true')
 order by tablename, policyname;

-- [검증 2] 남은 정책이 전부 is_approved() 기반인지 눈으로 확인
--   companies=1(p_companies_all) / call_logs=1(p_call_logs_all) / chat_messages=3(p_chat_messages_*)
select tablename, policyname, cmd, roles, qual as "using", with_check
  from pg_policies
 where schemaname = 'public' and tablename in ('companies','call_logs','chat_messages')
 order by tablename, cmd, policyname;

-- [검증 3] RLS 켜짐 + anon GRANT 0
select c.relname,
       c.relrowsecurity as rls_enabled,
       (select count(*) from information_schema.role_table_grants g
         where g.table_schema='public' and g.table_name=c.relname and g.grantee='anon') as anon_grants
  from pg_class c
 where c.relnamespace = 'public'::regnamespace
   and c.relname in ('companies','call_logs','chat_messages')
 order by c.relname;

-- [검증 4] 데이터 보존
select (select count(*) from public.companies)     as companies_rows,
       (select count(*) from public.call_logs)     as call_logs_rows,
       (select count(*) from public.chat_messages) as chat_messages_rows;

-- ── 실행 후 화면 확인 (필수 — 승인제가 실제로 통과하는지) ────────────────
--   ⚠️ RLS는 "거부"가 아니라 "필터링"이라 200 OK + 0건으로 조용히 빈 화면이 된다.
--      아래를 눌러보지 않으면 깨진 걸 알 수 없다.
--   · 기업목록이 뜨는지 / 업체 저장·인라인 편집이 되는지 (companies)
--   · 팀 채팅 송신·수신·읽음 처리가 되는지 (chat_messages ★ 새 정책이라 가장 위험)
--   · 통화 기록 화면 (call_logs)
--   · 모바일 /m 탭
--   전부 "승인된 계정"으로 확인할 것. 승인 대기 계정에서는 안 보이는 게 정상이다.
