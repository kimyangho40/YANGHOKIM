-- ============================================================================
-- 🧪 채팅 채널 스코프 동작 검증 — 정책·트리거를 실제로 찔러본다
--
--   RLS 는 "거부"가 아니라 "필터링"이라 카탈로그(pg_policies)만 봐서는 판정이 안 된다.
--   방법: request.jwt.claims 를 실제 profiles.id 로 설정하고 set role authenticated →
--         auth.uid() 가 그 사람으로 인식된다(로그인한 것과 같은 조건).
--   대상: 관호(개인팀) · 인선(법인팀) · 양호(admin) · 기랑/권구현(채팅 팀목록에 없는 사람) · anon
--
-- ⚠️ 실제 DB 에 행을 넣었다 지운다. 테스트 메시지는 본문이 '⟪TEST⟫' 로 시작하고
--    채널도 실사용에 없는 합성 DM('dm:권구현|기랑' · 'dm:기랑|양호')만 쓴다.
--    두 채널 모두 App.js DM 목록(CHAT_ALL_MEMBERS)에 안 뜨므로 화면에는 보이지 않는다.
--    (다만 양호가 접속 중이면 'dm:기랑|양호' 때문에 안읽음 배지가 잠깐 1 늘었다 사라질 수 있다.)
--
-- 실행: node scripts/run-sql.js 채팅_DM_비공개_동작검증.sql
-- 판정: fail = 0, 남은 테스트행 = 0 이어야 정상.
-- 정책·트리거를 고치면 반드시 이 파일을 다시 돌릴 것.
-- ============================================================================

create temp table _tr (n bigint generated always as identity, step text, verdict text, detail text);
create temp table _exp (k text primary key, v bigint);
create temp table _ctx (k text primary key, v text);
grant all on _tr to authenticated, anon;
grant all on _exp to authenticated, anon;
grant all on _ctx to authenticated, anon;
grant usage, select on all sequences in schema pg_temp to authenticated, anon;

-- 지난 실행 찌꺼기 정리
delete from public.chat_messages where message like '⟪TEST⟫%';

-- 기대값 스냅샷 — 건수를 코드에 박지 않고 지금 DB 에서 뽑는다
insert into _exp(k, v)
select 'dm_유진인선', count(*) from public.chat_messages where channel = 'dm:유진|인선'
union all select 'dm_양호현애', count(*) from public.chat_messages where channel = 'dm:양호|현애'
union all select 'general',    count(*) from public.chat_messages where channel = 'general'
union all select 'corporate',  count(*) from public.chat_messages where channel = 'corporate'
union all select 'individual', count(*) from public.chat_messages where channel = 'individual'
union all select 'total',      count(*) from public.chat_messages;

-- ══════════════════════════════════════════════════════════════════════
-- A. 읽기 범위 (실데이터, 아무것도 안 바꾼다)
-- ══════════════════════════════════════════════════════════════════════

-- ── 관호(개인팀) ──────────────────────────────────────────────
set request.jwt.claims = '{"sub":"b2d220db-ba6a-4896-8a0f-d2469df0de21","role":"authenticated"}';
set role authenticated;

do $$
declare v_n bigint; v_e bigint;
begin
  select count(*) into v_n from public.chat_messages where channel = 'dm:유진|인선';
  select v into v_e from _exp where k = 'dm_유진인선';
  insert into _tr(step, verdict, detail) values ('R01 관호가 남의 DM(유진↔인선)',
    case when v_n = 0 then 'PASS' else 'FAIL' end,
    format('보이는 건수=%s (봉쇄 전이면 %s건이 보였다)', v_n, v_e));
exception when others then
  insert into _tr(step, verdict, detail) values ('R01 관호가 남의 DM(유진↔인선)', 'FAIL', sqlerrm);
end $$;

do $$
declare v_n bigint; v_e bigint;
begin
  select count(*) into v_n from public.chat_messages where channel = 'corporate';
  select v into v_e from _exp where k = 'corporate';
  insert into _tr(step, verdict, detail) values ('R02 관호가 법인팀 채널(소속 아님)',
    case when v_n = 0 then 'PASS' else 'FAIL' end, format('보이는 건수=%s / 실제 %s', v_n, v_e));
exception when others then
  insert into _tr(step, verdict, detail) values ('R02 관호가 법인팀 채널(소속 아님)', 'FAIL', sqlerrm);
end $$;

do $$
declare v_n bigint; v_e bigint;
begin
  select count(*) into v_n from public.chat_messages where channel = 'individual';
  select v into v_e from _exp where k = 'individual';
  insert into _tr(step, verdict, detail) values ('R03 관호가 개인팀 채널(소속)',
    case when v_n = v_e and v_e > 0 then 'PASS' else 'FAIL' end, format('보임=%s / 실제=%s', v_n, v_e));
exception when others then
  insert into _tr(step, verdict, detail) values ('R03 관호가 개인팀 채널(소속)', 'FAIL', sqlerrm);
end $$;

do $$
declare v_n bigint; v_e bigint;
begin
  select count(*) into v_n from public.chat_messages where channel = 'dm:관호|양호';
  insert into _tr(step, verdict, detail) values ('R04 관호가 자기 DM(관호↔양호)',
    case when v_n > 0 then 'PASS' else 'FAIL' end, format('보임=%s건', v_n));
exception when others then
  insert into _tr(step, verdict, detail) values ('R04 관호가 자기 DM(관호↔양호)', 'FAIL', sqlerrm);
end $$;

reset role;

-- ── 인선(법인팀) ──────────────────────────────────────────────
set request.jwt.claims = '{"sub":"6b7c9295-8eeb-4909-9b26-02c3db3a618b","role":"authenticated"}';
set role authenticated;

do $$
declare v_n bigint; v_e bigint;
begin
  select count(*) into v_n from public.chat_messages where channel = 'dm:유진|인선';
  select v into v_e from _exp where k = 'dm_유진인선';
  insert into _tr(step, verdict, detail) values ('R05 인선이 자기 DM(유진↔인선)',
    case when v_n = v_e and v_e > 0 then 'PASS' else 'FAIL' end, format('보임=%s / 실제=%s', v_n, v_e));
exception when others then
  insert into _tr(step, verdict, detail) values ('R05 인선이 자기 DM(유진↔인선)', 'FAIL', sqlerrm);
end $$;

do $$
declare v_n bigint;
begin
  select count(*) into v_n from public.chat_messages where channel = 'individual';
  insert into _tr(step, verdict, detail) values ('R06 인선이 개인팀 채널(소속 아님)',
    case when v_n = 0 then 'PASS' else 'FAIL' end, format('보이는 건수=%s', v_n));
exception when others then
  insert into _tr(step, verdict, detail) values ('R06 인선이 개인팀 채널(소속 아님)', 'FAIL', sqlerrm);
end $$;

reset role;

-- ── 양호(admin) — 관리자라도 남의 DM 은 못 본다 ───────────────
set request.jwt.claims = '{"sub":"4a03e49d-d566-42dd-9738-efb9baf7135c","role":"authenticated"}';
set role authenticated;

do $$
declare v_n bigint;
begin
  select count(*) into v_n from public.chat_messages where channel = 'dm:유진|인선';
  insert into _tr(step, verdict, detail) values ('R07 양호(admin)가 남의 DM',
    case when v_n = 0 then 'PASS' else 'FAIL' end,
    format('보이는 건수=%s (관리자 예외를 두지 않는 게 App.js 와 같다)', v_n));
exception when others then
  insert into _tr(step, verdict, detail) values ('R07 양호(admin)가 남의 DM', 'FAIL', sqlerrm);
end $$;

do $$
declare v_n bigint; v_e bigint;
begin
  select count(*) into v_n from public.chat_messages where channel = 'dm:양호|현애';
  select v into v_e from _exp where k = 'dm_양호현애';
  insert into _tr(step, verdict, detail) values ('R08 양호가 자기 DM(양호↔현애)',
    case when v_n = v_e and v_e > 0 then 'PASS' else 'FAIL' end, format('보임=%s / 실제=%s', v_n, v_e));
exception when others then
  insert into _tr(step, verdict, detail) values ('R08 양호가 자기 DM(양호↔현애)', 'FAIL', sqlerrm);
end $$;

reset role;

-- ── 기랑 — 채팅 팀 목록에 없는 사람: general 만 보여야 ────────
set request.jwt.claims = '{"sub":"39646472-6516-4937-bd22-229b856934e3","role":"authenticated"}';
set role authenticated;

do $$
declare v_n bigint; v_g bigint; v_t bigint;
begin
  select count(*) into v_n from public.chat_messages;
  select v into v_g from _exp where k = 'general';
  select v into v_t from _exp where k = 'total';
  insert into _tr(step, verdict, detail) values ('R09 기랑(팀 미소속)은 전체 채널만',
    case when v_n = v_g then 'PASS' else 'FAIL' end,
    format('전건조회=%s / general=%s / DB전체=%s', v_n, v_g, v_t));
exception when others then
  insert into _tr(step, verdict, detail) values ('R09 기랑(팀 미소속)은 전체 채널만', 'FAIL', sqlerrm);
end $$;

reset role;

-- ══════════════════════════════════════════════════════════════════════
-- B. 쓰기·수정 (합성 DM 채널에서만, 끝에 지운다)
-- ══════════════════════════════════════════════════════════════════════

-- ── 권구현 ────────────────────────────────────────────────────
set request.jwt.claims = '{"sub":"5580d722-7a82-4e9d-9a40-605485ac28dd","role":"authenticated"}';
set role authenticated;

do $$
declare v_id uuid;
begin
  insert into public.chat_messages (sender, message, channel, read_by, saved_to_activity)
  values ('권구현', '⟪TEST⟫ 내 DM 에 보내기', 'dm:권구현|기랑', '["권구현"]'::jsonb, '[]'::jsonb)
  returning id into v_id;
  insert into _ctx values ('msg', v_id::text);
  insert into _tr(step, verdict, detail) values ('W01 권구현이 자기 DM 에 전송', 'PASS', format('id=%s', v_id));
exception when others then
  insert into _tr(step, verdict, detail) values ('W01 권구현이 자기 DM 에 전송', 'FAIL', sqlerrm);
end $$;

do $$
begin
  insert into public.chat_messages (sender, message, channel)
  values ('기랑', '⟪TEST⟫ 사칭 전송', 'dm:권구현|기랑');
  insert into _tr(step, verdict, detail) values ('W02 발신자 사칭(sender=기랑)', 'FAIL', '막히지 않고 들어갔다');
exception when others then
  insert into _tr(step, verdict, detail) values ('W02 발신자 사칭(sender=기랑)',
    case when sqlerrm like '%row-level security%' then 'PASS' else 'FAIL' end, sqlerrm);
end $$;

do $$
begin
  insert into public.chat_messages (sender, message, channel)
  values ('권구현', '⟪TEST⟫ 남의 DM 에 끼어들기', 'dm:유진|인선');
  insert into _tr(step, verdict, detail) values ('W03 남의 DM 에 전송', 'FAIL', '막히지 않고 들어갔다');
exception when others then
  insert into _tr(step, verdict, detail) values ('W03 남의 DM 에 전송',
    case when sqlerrm like '%row-level security%' then 'PASS' else 'FAIL' end, sqlerrm);
end $$;

do $$
begin
  insert into public.chat_messages (sender, message, channel)
  values ('권구현', '⟪TEST⟫ 소속 아닌 팀 채널', 'corporate');
  insert into _tr(step, verdict, detail) values ('W04 소속 아닌 팀 채널에 전송', 'FAIL', '막히지 않고 들어갔다');
exception when others then
  insert into _tr(step, verdict, detail) values ('W04 소속 아닌 팀 채널에 전송',
    case when sqlerrm like '%row-level security%' then 'PASS' else 'FAIL' end, sqlerrm);
end $$;

reset role;

-- ── 관호 — 자기와 상관없는 DM 은 보이지도, 손대지지도 않아야 ──
set request.jwt.claims = '{"sub":"b2d220db-ba6a-4896-8a0f-d2469df0de21","role":"authenticated"}';
set role authenticated;

do $$
declare v_n bigint;
begin
  select count(*) into v_n from public.chat_messages where channel = 'dm:권구현|기랑';
  insert into _tr(step, verdict, detail) values ('W05 관호에게 그 DM 이 보이나',
    case when v_n = 0 then 'PASS' else 'FAIL' end, format('보이는 건수=%s', v_n));
exception when others then
  insert into _tr(step, verdict, detail) values ('W05 관호에게 그 DM 이 보이나', 'FAIL', sqlerrm);
end $$;

do $$
declare v_n int; v_id uuid;
begin
  select v::uuid into v_id from _ctx where k = 'msg';
  update public.chat_messages set deleted_at = now() where id = v_id;
  get diagnostics v_n = row_count;
  insert into _tr(step, verdict, detail) values ('W06 관호가 남의 DM 메시지 삭제',
    case when v_n = 0 then 'PASS' else 'FAIL' end,
    format('영향 행=%s (RLS 는 거부가 아니라 필터라 0행이 정상 차단)', v_n));
exception when others then
  insert into _tr(step, verdict, detail) values ('W06 관호가 남의 DM 메시지 삭제', 'PASS', sqlerrm);
end $$;

reset role;

-- ── 기랑 — 같은 DM 참여자: 읽음표시는 되고 본문·삭제는 안 돼야 ──
set request.jwt.claims = '{"sub":"39646472-6516-4937-bd22-229b856934e3","role":"authenticated"}';
set role authenticated;

do $$
declare v_n bigint;
begin
  select count(*) into v_n from public.chat_messages where channel = 'dm:권구현|기랑';
  insert into _tr(step, verdict, detail) values ('W07 기랑에게 그 DM 이 보이나',
    case when v_n = 1 then 'PASS' else 'FAIL' end, format('보임=%s건', v_n));
exception when others then
  insert into _tr(step, verdict, detail) values ('W07 기랑에게 그 DM 이 보이나', 'FAIL', sqlerrm);
end $$;

do $$
declare v_n int; v_id uuid;
begin
  select v::uuid into v_id from _ctx where k = 'msg';
  update public.chat_messages set read_by = '["권구현","기랑"]'::jsonb where id = v_id;
  get diagnostics v_n = row_count;
  insert into _tr(step, verdict, detail) values ('W08 기랑이 읽음표시(read_by) — 허용돼야',
    case when v_n = 1 then 'PASS' else 'FAIL' end, format('영향 행=%s', v_n));
exception when others then
  insert into _tr(step, verdict, detail) values ('W08 기랑이 읽음표시(read_by) — 허용돼야', 'FAIL', sqlerrm);
end $$;

do $$
declare v_id uuid;
begin
  select v::uuid into v_id from _ctx where k = 'msg';
  update public.chat_messages set message = '⟪TEST⟫ 남이 고쳐 쓴 본문' where id = v_id;
  insert into _tr(step, verdict, detail) values ('W09 기랑이 남의 메시지 본문 수정', 'FAIL', '막히지 않고 바뀌었다');
exception when others then
  insert into _tr(step, verdict, detail) values ('W09 기랑이 남의 메시지 본문 수정',
    case when sqlerrm like '%남의 메시지 본문%' then 'PASS' else 'FAIL' end, sqlerrm);
end $$;

do $$
declare v_id uuid;
begin
  select v::uuid into v_id from _ctx where k = 'msg';
  update public.chat_messages set deleted_at = now() where id = v_id;
  insert into _tr(step, verdict, detail) values ('W10 기랑이 남의 메시지 삭제', 'FAIL', '막히지 않고 삭제됐다');
exception when others then
  insert into _tr(step, verdict, detail) values ('W10 기랑이 남의 메시지 삭제',
    case when sqlerrm like '%남의 메시지는 삭제%' then 'PASS' else 'FAIL' end, sqlerrm);
end $$;

do $$
declare v_id uuid; v_s text; v_c text;
begin
  select v::uuid into v_id from _ctx where k = 'msg';
  update public.chat_messages set sender = '기랑', channel = 'general' where id = v_id;
  select sender, channel into v_s, v_c from public.chat_messages where id = v_id;
  insert into _tr(step, verdict, detail) values ('W11 sender/channel 바꿔치기 — 조용히 원복돼야',
    case when v_s = '권구현' and v_c = 'dm:권구현|기랑' then 'PASS' else 'FAIL' end,
    format('sender=%s channel=%s', v_s, v_c));
exception when others then
  insert into _tr(step, verdict, detail) values ('W11 sender/channel 바꿔치기 — 조용히 원복돼야', 'FAIL', sqlerrm);
end $$;

-- 관리자 삭제 테스트용 — 기랑이 양호와의 DM 에 한 건 남긴다
do $$
declare v_id uuid;
begin
  insert into public.chat_messages (sender, message, channel)
  values ('기랑', '⟪TEST⟫ 관리자 삭제 대상', 'dm:기랑|양호')
  returning id into v_id;
  insert into _ctx values ('msg2', v_id::text);
  insert into _tr(step, verdict, detail) values ('W12 기랑이 양호와의 DM 에 전송', 'PASS', format('id=%s', v_id));
exception when others then
  insert into _tr(step, verdict, detail) values ('W12 기랑이 양호와의 DM 에 전송', 'FAIL', sqlerrm);
end $$;

reset role;

-- ── 권구현 — 본인 메시지는 지울 수 있어야 ─────────────────────
set request.jwt.claims = '{"sub":"5580d722-7a82-4e9d-9a40-605485ac28dd","role":"authenticated"}';
set role authenticated;

do $$
declare v_n int; v_id uuid;
begin
  select v::uuid into v_id from _ctx where k = 'msg';
  update public.chat_messages set deleted_at = now() where id = v_id;
  get diagnostics v_n = row_count;
  insert into _tr(step, verdict, detail) values ('W13 본인 메시지 삭제 — 허용돼야',
    case when v_n = 1 then 'PASS' else 'FAIL' end, format('영향 행=%s', v_n));
exception when others then
  insert into _tr(step, verdict, detail) values ('W13 본인 메시지 삭제 — 허용돼야', 'FAIL', sqlerrm);
end $$;

reset role;

-- ── 양호(admin) — 자기가 볼 수 있는 채널에서 남의 메시지 삭제 ──
set request.jwt.claims = '{"sub":"4a03e49d-d566-42dd-9738-efb9baf7135c","role":"authenticated"}';
set role authenticated;

do $$
declare v_n int; v_id uuid;
begin
  select v::uuid into v_id from _ctx where k = 'msg2';
  update public.chat_messages set deleted_at = now() where id = v_id;
  get diagnostics v_n = row_count;
  insert into _tr(step, verdict, detail) values ('W14 관리자가 남의 메시지 삭제 — 허용돼야',
    case when v_n = 1 then 'PASS' else 'FAIL' end, format('영향 행=%s', v_n));
exception when others then
  insert into _tr(step, verdict, detail) values ('W14 관리자가 남의 메시지 삭제 — 허용돼야', 'FAIL', sqlerrm);
end $$;

do $$
declare v_n int; v_id uuid;
begin
  select v::uuid into v_id from _ctx where k = 'msg';
  update public.chat_messages set deleted_at = null where id = v_id;
  get diagnostics v_n = row_count;
  insert into _tr(step, verdict, detail) values ('W15 관리자도 접근 못 하는 DM 은 손 못 댐',
    case when v_n = 0 then 'PASS' else 'FAIL' end, format('영향 행=%s (dm:권구현|기랑)', v_n));
exception when others then
  insert into _tr(step, verdict, detail) values ('W15 관리자도 접근 못 하는 DM 은 손 못 댐', 'PASS', sqlerrm);
end $$;

reset role;

-- ── anon(비로그인) ────────────────────────────────────────────
set request.jwt.claims = '{"role":"anon"}';
set role anon;

do $$
declare v_n bigint;
begin
  select count(*) into v_n from public.chat_messages;
  insert into _tr(step, verdict, detail) values ('A01 비로그인 조회',
    case when v_n = 0 then 'PASS' else 'FAIL' end, format('보이는 건수=%s', v_n));
exception when others then
  insert into _tr(step, verdict, detail) values ('A01 비로그인 조회', 'PASS', '권한 자체가 없음: ' || sqlerrm);
end $$;

do $$
begin
  insert into public.chat_messages (sender, message, channel)
  values ('양호', '⟪TEST⟫ 비로그인 전송', 'general');
  insert into _tr(step, verdict, detail) values ('A02 비로그인 전송', 'FAIL', '들어갔다');
exception when others then
  insert into _tr(step, verdict, detail) values ('A02 비로그인 전송', 'PASS', sqlerrm);
end $$;

reset role;
reset request.jwt.claims;

-- ══════════════════════════════════════════════════════════════════════
-- 정리 + 판정
-- ══════════════════════════════════════════════════════════════════════
delete from public.chat_messages where message like '⟪TEST⟫%';

select
  (select count(*) from _tr where verdict = 'PASS')                       as "통과",
  (select count(*) from _tr where verdict = 'FAIL')                       as "실패",
  (select count(*) from public.chat_messages where message like '⟪TEST⟫%') as "남은 테스트행(0이어야)",
  (select jsonb_agg(jsonb_build_object('step', step, 'verdict', verdict, 'detail', detail) order by n)
     from _tr)                                                            as "상세";
