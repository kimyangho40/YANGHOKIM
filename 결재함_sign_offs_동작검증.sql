-- ============================================================================
-- 🧪 결재함(sign_offs) 동작 검증 — 트리거·RLS 를 실제로 찔러본다
--
--   결재함_sign_offs_검증.sql 은 "정책·권한이 제자리에 있나"(카탈로그)를 보고,
--   이 파일은 "그래서 실제로 막히나"(동작)를 본다. 둘 다 통과해야 한다.
--   RLS 는 거부가 아니라 필터링이라 카탈로그만 봐서는 판정이 안 된다(CLAUDE.md 2-2).
--
--   방법: request.jwt.claims 를 실제 profiles.id 로 설정하고 set role authenticated →
--         auth.uid() 가 그 사람으로 인식된다. 로그인한 것과 같은 조건.
--   대상: 미현A/미현B(같은 사람 다른 계정) · 관호(무관자) · 양호(결재자) · 정원(다른 admin) · anon
--
-- ⚠️ 실제 DB 에 행을 넣었다 지운다. 테스트 행은 제목 '⟪TEST⟫' 접두사로만 만들고
--    시작·끝에서 그 접두사만 지우므로 진짜 결재 건은 건드리지 않는다.
--    단 seq(#번호)는 테스트마다 소모된다 — 실서비스 시작 후엔 번호가 건너뛴다.
--
-- 실행: node scripts/run-sql.js 결재함_sign_offs_동작검증.sql
-- 판정: "통과" 가 23/23, 남은 결재행·이력행이 0 이어야 정상.
--
-- 트리거(so_before_insert / so_before_update / so_after_write)나 RLS 정책을 고치면
-- 반드시 이 파일을 다시 돌릴 것.  2026-08-10 최초 작성 시 23/23 통과.
-- ============================================================================

create temp table _tr (n bigint generated always as identity, step text, verdict text, detail text);
create temp table _ctx (k text primary key, v text);
grant all on _tr to authenticated, anon;
grant all on _ctx to authenticated, anon;
grant usage, select on all sequences in schema pg_temp to authenticated;

-- 혹시 남은 테스트 찌꺼기 정리
delete from public.sign_off_events where sign_off_id in (select id from public.sign_offs where title like '⟪TEST⟫%');
delete from public.sign_offs where title like '⟪TEST⟫%';

-- ── 미현A 로 로그인 ─────────────────────────────────────────────
set request.jwt.claims = '{"sub":"398c074f-009f-4b32-8705-11473005c76f","role":"authenticated"}';
set role authenticated;

do $$
declare v_id uuid; v_st text; v_cn text; v_an text;
begin
  insert into public.sign_offs (title, body, category, risk, owner_name, approver_id, approver_name, rollback_ref)
  values ('⟪TEST⟫ 정상 등록', '본문', 'profile_merge', 'irreversible', ' 미현 ',
          '4a03e49d-d566-42dd-9738-efb9baf7135c', '엉터리이름', 'x_rollback.sql')
  returning id, status, created_name, approver_name into v_id, v_st, v_cn, v_an;
  insert into _ctx values ('main', v_id::text);
  insert into _tr(step, verdict, detail) values ('T01 미현A 결재 등록',
    case when v_st='pending' and v_cn='미현' and v_an='양호' then 'PASS' else 'FAIL' end,
    format('status=%s created_name=%s approver_name=%s(앱이 보낸 엉터리이름 무시)', v_st, v_cn, v_an));
exception when others then
  insert into _tr(step, verdict, detail) values ('T01 미현A 결재 등록', 'FAIL', sqlerrm);
end $$;

do $$
begin
  insert into public.sign_offs (title, category, created_by, created_name, approver_id, approver_name)
  values ('⟪TEST⟫ 비admin 결재자', 'etc', auth.uid(), '미현',
          'b2d220db-ba6a-4896-8a0f-d2469df0de21', '관호');
  insert into _tr(step, verdict, detail) values ('T02 결재자를 비admin(관호)으로', 'FAIL', '막히지 않고 통과했다');
exception when others then
  insert into _tr(step, verdict, detail) values ('T02 결재자를 비admin(관호)으로',
    case when sqlerrm like '%관리자%' then 'PASS' else 'FAIL' end, sqlerrm);
end $$;

do $$
declare v_by uuid; v_cn text;
begin
  insert into public.sign_offs (title, category, created_by, created_name, approver_id, approver_name)
  values ('⟪TEST⟫ 작성자 위조', 'etc', 'b2d220db-ba6a-4896-8a0f-d2469df0de21', '관호',
          '4a03e49d-d566-42dd-9738-efb9baf7135c', '양호')
  returning created_by, created_name into v_by, v_cn;
  insert into _tr(step, verdict, detail) values ('T03 작성자를 관호로 위조 insert',
    case when v_by = '398c074f-009f-4b32-8705-11473005c76f' and v_cn = '미현' then 'PASS' else 'FAIL' end,
    format('트리거가 실제 로그인 계정으로 교정 → created_by=%s created_name=%s', v_by, v_cn));
exception when others then
  insert into _tr(step, verdict, detail) values ('T03 작성자를 관호로 위조 insert', 'FAIL', sqlerrm);
end $$;

do $$
declare v_st text; v_da timestamptz; v_ex timestamptz;
begin
  insert into public.sign_offs (title, category, created_by, created_name, approver_id, approver_name,
                                status, decided_at, decided_by, executed_at)
  values ('⟪TEST⟫ 승인상태로 등록', 'etc', auth.uid(), '미현',
          '4a03e49d-d566-42dd-9738-efb9baf7135c', '양호',
          'approved', now(), auth.uid(), now())
  returning status, decided_at, executed_at into v_st, v_da, v_ex;
  insert into _tr(step, verdict, detail) values ('T04 처음부터 승인상태로 등록 시도',
    case when v_st='pending' and v_da is null and v_ex is null then 'PASS' else 'FAIL' end,
    format('트리거가 대기로 강제 → status=%s decided_at=%s executed_at=%s', v_st, v_da, v_ex));
exception when others then
  insert into _tr(step, verdict, detail) values ('T04 처음부터 승인상태로 등록 시도', 'FAIL', sqlerrm);
end $$;

do $$
declare v_n int;
begin
  update public.sign_offs set status='approved'
   where id = (select v::uuid from _ctx where k='main');
  get diagnostics v_n = row_count;
  insert into _tr(step, verdict, detail) values ('T05 작성자가 자기 건 승인 시도', 'FAIL', format('%s행 통과', v_n));
exception when others then
  insert into _tr(step, verdict, detail) values ('T05 작성자가 자기 건 승인 시도',
    case when sqlerrm like '%결재자%' then 'PASS' else 'FAIL' end, sqlerrm);
end $$;

-- ── 관호(무관한 사람) 로 로그인 ────────────────────────────────
reset role;
set request.jwt.claims = '{"sub":"b2d220db-ba6a-4896-8a0f-d2469df0de21","role":"authenticated"}';
set role authenticated;

do $$
declare v_n int;
begin
  update public.sign_offs set status='approved', decision_note='몰래승인'
   where id = (select v::uuid from _ctx where k='main');
  get diagnostics v_n = row_count;
  insert into _tr(step, verdict, detail) values ('T06 무관한 사람이 승인 시도',
    case when v_n = 0 then 'PASS' else 'FAIL' end, format('RLS 로 %s행 (0이어야 정상)', v_n));
exception when others then
  insert into _tr(step, verdict, detail) values ('T06 무관한 사람이 승인 시도', 'PASS', '차단: ' || sqlerrm);
end $$;

do $$
declare v_n int;
begin
  update public.sign_offs set status='withdrawn'
   where id = (select v::uuid from _ctx where k='main');
  get diagnostics v_n = row_count;
  insert into _tr(step, verdict, detail) values ('T07 무관한 사람이 회수 시도',
    case when v_n = 0 then 'PASS' else 'FAIL' end, format('RLS 로 %s행 (0이어야 정상)', v_n));
exception when others then
  insert into _tr(step, verdict, detail) values ('T07 무관한 사람이 회수 시도', 'PASS', '차단: ' || sqlerrm);
end $$;

-- ── 미현B (같은 사람, 다른 계정) 로 로그인 ─────────────────────
reset role;
set request.jwt.claims = '{"sub":"9d87b323-525d-4314-bbdf-91bbcda80a5f","role":"authenticated"}';
set role authenticated;

do $$
declare v_n int; v_t text;
begin
  update public.sign_offs set body = '본문 수정 — 되돌리기 SQL 첨부'
   where id = (select v::uuid from _ctx where k='main');
  get diagnostics v_n = row_count;
  select title into v_t from public.sign_offs where id = (select v::uuid from _ctx where k='main');
  insert into _tr(step, verdict, detail) values ('T08 다른 계정(미현B)으로 본인 건 수정',
    case when v_n = 1 then 'PASS' else 'FAIL' end,
    format('%s행 — 이름 기준 작성자 인정(계정 갈려도 내 건)', v_n));
exception when others then
  insert into _tr(step, verdict, detail) values ('T08 다른 계정(미현B)으로 본인 건 수정', 'FAIL', sqlerrm);
end $$;

-- ── 정원(다른 admin) 으로 로그인 — 결재자는 양호다 ─────────────
reset role;
set request.jwt.claims = '{"sub":"b73eb1b9-14ac-4dd4-a1e0-2a2ae2f96009","role":"authenticated"}';
set role authenticated;

do $$
declare v_n int;
begin
  update public.sign_offs set status='approved'
   where id = (select v::uuid from _ctx where k='main');
  get diagnostics v_n = row_count;
  insert into _tr(step, verdict, detail) values ('T09 지정 안 된 admin(정원)이 승인 시도',
    case when v_n = 0 then 'PASS' else 'FAIL' end, format('RLS 로 %s행 (0이어야 정상)', v_n));
exception when others then
  insert into _tr(step, verdict, detail) values ('T09 지정 안 된 admin(정원)이 승인 시도',
    case when sqlerrm like '%결재자%' then 'PASS' else 'FAIL' end, sqlerrm);
end $$;

-- ── 양호(지정 결재자) 로 로그인 ────────────────────────────────
reset role;
set request.jwt.claims = '{"sub":"4a03e49d-d566-42dd-9738-efb9baf7135c","role":"authenticated"}';
set role authenticated;

do $$
begin
  update public.sign_offs set status='rejected'
   where id = (select v::uuid from _ctx where k='main');
  insert into _tr(step, verdict, detail) values ('T10 사유 없이 반려', 'FAIL', '막히지 않고 통과했다');
exception when others then
  insert into _tr(step, verdict, detail) values ('T10 사유 없이 반려',
    case when sqlerrm like '%반려 사유%' then 'PASS' else 'FAIL' end, sqlerrm);
end $$;

do $$
declare v_st text; v_db uuid; v_da timestamptz;
begin
  update public.sign_offs set status='approved', decided_by=null, decided_at=null
   where id = (select v::uuid from _ctx where k='main');
  select status, decided_by, decided_at into v_st, v_db, v_da
    from public.sign_offs where id = (select v::uuid from _ctx where k='main');
  insert into _tr(step, verdict, detail) values ('T11 결재자(양호) 승인',
    case when v_st='approved' and v_db='4a03e49d-d566-42dd-9738-efb9baf7135c' and v_da is not null
         then 'PASS' else 'FAIL' end,
    format('status=%s decided_by=양호?%s decided_at=%s (앱이 null 보내도 트리거가 채움)',
           v_st, v_db='4a03e49d-d566-42dd-9738-efb9baf7135c', v_da is not null));
exception when others then
  insert into _tr(step, verdict, detail) values ('T11 결재자(양호) 승인', 'FAIL', sqlerrm);
end $$;

do $$
begin
  update public.sign_offs set status='pending'
   where id = (select v::uuid from _ctx where k='main');
  insert into _tr(step, verdict, detail) values ('T12 승인된 건을 대기로 되돌리기', 'FAIL', '막히지 않고 통과했다');
exception when others then
  insert into _tr(step, verdict, detail) values ('T12 승인된 건을 대기로 되돌리기',
    case when sqlerrm like '%되돌릴 수 없습니다%' then 'PASS' else 'FAIL' end, sqlerrm);
end $$;

do $$
begin
  update public.sign_offs set decision_note='승인사유 사후 조작'
   where id = (select v::uuid from _ctx where k='main');
  if (select decision_note from public.sign_offs where id=(select v::uuid from _ctx where k='main')) = '승인사유 사후 조작' then
    insert into _tr(step, verdict, detail) values ('T13 결정 사유 사후 조작', 'FAIL', '조작이 반영됐다');
  else
    insert into _tr(step, verdict, detail) values ('T13 결정 사유 사후 조작', 'PASS', '트리거가 옛 값으로 되돌림');
  end if;
exception when others then
  insert into _tr(step, verdict, detail) values ('T13 결정 사유 사후 조작', 'PASS', '차단: ' || sqlerrm);
end $$;

do $$
begin
  delete from public.sign_off_events
   where sign_off_id = (select v::uuid from _ctx where k='main');
  insert into _tr(step, verdict, detail) values ('T14 이력 삭제 시도',
    case when found then 'FAIL' else 'PASS' end,
    case when found then '삭제됐다' else '정책 없음 → 0행' end);
exception when others then
  insert into _tr(step, verdict, detail) values ('T14 이력 삭제 시도', 'PASS', '차단: ' || sqlerrm);
end $$;

do $$
begin
  insert into public.sign_off_events (sign_off_id, actor_name, action, to_status, note)
  values ((select v::uuid from _ctx where k='main'), '가짜', 'approved', 'approved', '가짜 이력');
  insert into _tr(step, verdict, detail) values ('T15 가짜 이력 직접 INSERT', 'FAIL', '들어갔다');
exception when others then
  insert into _tr(step, verdict, detail) values ('T15 가짜 이력 직접 INSERT', 'PASS', '차단: ' || sqlerrm);
end $$;

-- ── 미현A(작성자) 로 다시 — 승인 후 수정·실행 ──────────────────
reset role;
set request.jwt.claims = '{"sub":"398c074f-009f-4b32-8705-11473005c76f","role":"authenticated"}';
set role authenticated;

do $$
begin
  update public.sign_offs set body='승인 후 몰래 본문 바꾸기'
   where id = (select v::uuid from _ctx where k='main');
  insert into _tr(step, verdict, detail) values ('T16 승인된 건 본문 수정', 'FAIL', '막히지 않고 통과했다');
exception when others then
  insert into _tr(step, verdict, detail) values ('T16 승인된 건 본문 수정',
    case when sqlerrm like '%대기 중인 결재만%' then 'PASS' else 'FAIL' end, sqlerrm);
end $$;

do $$
declare v_ea timestamptz; v_en text; v_eb uuid;
begin
  update public.sign_offs set executed_at = now(), execution_note = '계정정리.sql 실행함'
   where id = (select v::uuid from _ctx where k='main');
  select executed_at, executed_name, executed_by into v_ea, v_en, v_eb
    from public.sign_offs where id = (select v::uuid from _ctx where k='main');
  insert into _tr(step, verdict, detail) values ('T17 작성자가 실행 완료 표시',
    case when v_ea is not null and v_en='미현' and v_eb='398c074f-009f-4b32-8705-11473005c76f'
         then 'PASS' else 'FAIL' end,
    format('executed_name=%s executed_by=미현A?%s', v_en, v_eb='398c074f-009f-4b32-8705-11473005c76f'));
exception when others then
  insert into _tr(step, verdict, detail) values ('T17 작성자가 실행 완료 표시', 'FAIL', sqlerrm);
end $$;

do $$
begin
  update public.sign_offs set executed_at = now() - interval '5 days'
   where id = (select v::uuid from _ctx where k='main');
  insert into _tr(step, verdict, detail) values ('T18 실행 시각 다시 찍기', 'FAIL', '막히지 않고 통과했다');
exception when others then
  insert into _tr(step, verdict, detail) values ('T18 실행 시각 다시 찍기',
    case when sqlerrm like '%이미 실행 완료%' then 'PASS' else 'FAIL' end, sqlerrm);
end $$;

do $$
begin
  delete from public.sign_offs where id = (select v::uuid from _ctx where k='main');
  insert into _tr(step, verdict, detail) values ('T19 결재 건 삭제 시도',
    case when found then 'FAIL' else 'PASS' end,
    case when found then '삭제됐다' else '정책 없음 → 0행' end);
exception when others then
  insert into _tr(step, verdict, detail) values ('T19 결재 건 삭제 시도', 'PASS', '차단: ' || sqlerrm);
end $$;

-- ── 관호(무관자) 댓글 — 결재는 팀 전체가 보고 의견을 남길 수 있다 ──
reset role;
set request.jwt.claims = '{"sub":"b2d220db-ba6a-4896-8a0f-d2469df0de21","role":"authenticated"}';
set role authenticated;

do $$
declare v_evt bigint;
begin
  select public.sign_off_comment((select v::uuid from _ctx where k='main'), '  이거 되돌리기 확인했습니다  ')
    into v_evt;
  insert into _tr(step, verdict, detail) values ('T20 댓글 RPC',
    case when v_evt is not null then 'PASS' else 'FAIL' end, format('event id=%s', v_evt));
exception when others then
  insert into _tr(step, verdict, detail) values ('T20 댓글 RPC', 'FAIL', sqlerrm);
end $$;

-- ── 회수 경로 (별도 건) ────────────────────────────────────────
reset role;
set request.jwt.claims = '{"sub":"398c074f-009f-4b32-8705-11473005c76f","role":"authenticated"}';
set role authenticated;

do $$
declare v_id uuid; v_st text; v_da timestamptz;
begin
  insert into public.sign_offs (title, category, created_by, created_name, approver_id, approver_name)
  values ('⟪TEST⟫ 회수용', 'etc', auth.uid(), '미현',
          'b73eb1b9-14ac-4dd4-a1e0-2a2ae2f96009', '정원')
  returning id into v_id;
  update public.sign_offs set status='withdrawn' where id = v_id;
  select status, decided_at into v_st, v_da from public.sign_offs where id = v_id;
  insert into _tr(step, verdict, detail) values ('T21 작성자 회수',
    case when v_st='withdrawn' and v_da is null then 'PASS' else 'FAIL' end,
    format('status=%s decided_at=%s (회수는 결재가 아니므로 decided_at 은 비어야 함)', v_st, v_da));
exception when others then
  insert into _tr(step, verdict, detail) values ('T21 작성자 회수', 'FAIL', sqlerrm);
end $$;

-- ── 이력 누적 확인 ─────────────────────────────────────────────
do $$
declare v_seq text; v_n int;
begin
  select string_agg(e.action || '/' || coalesce(e.actor_name,'?'), ' → ' order by e.id), count(*)
    into v_seq, v_n
    from public.sign_off_events e where e.sign_off_id = (select v::uuid from _ctx where k='main');
  insert into _tr(step, verdict, detail) values ('T22 이력 자동 누적',
    case when v_seq = 'created/미현 → edited/미현 → approved/양호 → executed/미현 → commented/관호'
         then 'PASS' else 'FAIL' end, format('%s건: %s', v_n, v_seq));
end $$;

-- ── anon(비로그인) 차단 ────────────────────────────────────────
reset role;
set request.jwt.claims = '{"role":"anon"}';
set role anon;

do $$
declare v_n int;
begin
  select count(*) into v_n from public.sign_offs;
  insert into _tr(step, verdict, detail) values ('T23 anon 조회', 'FAIL', format('%s건 보였다', v_n));
exception when others then
  insert into _tr(step, verdict, detail) values ('T23 anon 조회', 'PASS', '차단: ' || sqlerrm);
end $$;

-- ── 정리 ───────────────────────────────────────────────────────
reset role;
reset request.jwt.claims;
delete from public.sign_off_events where sign_off_id in (select id from public.sign_offs where title like '⟪TEST⟫%');
delete from public.sign_offs where title like '⟪TEST⟫%';

select
  (select count(*) from _tr where verdict='PASS') || '/' || (select count(*) from _tr) as "통과",
  (select count(*) from public.sign_offs) as "남은 결재행(0이어야 함)",
  (select count(*) from public.sign_off_events) as "남은 이력행(0이어야 함)",
  (select jsonb_agg(jsonb_build_object('step', step, 'v', verdict, 'detail', detail) order by n) from _tr) as "상세";
