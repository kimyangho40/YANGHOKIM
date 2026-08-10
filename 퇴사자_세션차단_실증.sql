-- ============================================================================
-- 🧪 "계정을 비활성화하면 이미 로그인된 세션이 끊기는가" 실증
--
--   질문: 퇴사자 profiles.status 를 'rejected' 로 바꿔도, 그 사람이 이미
--         로그인해 둔 브라우저(발급된 토큰)로 계속 데이터를 볼 수 있는가?
--
--   방법: request.jwt.claims 를 그 사람 uid 로 설정 = "유효한 토큰을 이미 들고 있는" 상태.
--         (토큰은 서명이 유효한 한 계속 통과한다. 관건은 DB 가 권한을 주느냐다.)
--
-- ⚠️ 1차 시도에서 배운 함정 — 비활성화는 **관리자 컨텍스트에서만** 먹는다.
--    BEFORE UPDATE 트리거 trg_protect_profile → protect_profile_privileges() 가
--      if not public.is_admin() then new.status := old.status; end if;
--    이라, is_admin() 이 false 면 **에러 없이 조용히 원래 값으로 되돌린다.**
--    run-sql.js 는 auth.uid() 가 없어 is_admin()=false → 그냥 UPDATE 하면 아무 일도 안 난다.
--    ⇒ 반드시 set request.jwt.claims 로 admin(양호) 을 흉내낸 뒤 UPDATE 할 것.
--
-- ⚠️ 대상은 **아무도 안 쓰는 중복 계정** 미현 9d87b323(@gmail.net 오타 가입, 세션 0건,
--    마지막 로그인 05-18)뿐이라 실사용자 영향이 없다. 미현 본인은 562de348 로 로그인한다.
--
-- 실행: node scripts/run-sql.js 퇴사자_세션차단_실증.sql
-- ============================================================================

create temp table _tr (n bigint generated always as identity, step text, verdict text, detail text);
grant all on _tr to authenticated;
grant usage, select on all sequences in schema pg_temp to authenticated;

-- ── 1) 비활성화 전: 이 계정으로 데이터가 보이는가 (대조군) ──────────────
set request.jwt.claims = '{"sub":"9d87b323-525d-4314-bbdf-91bbcda80a5f","role":"authenticated"}';
set role authenticated;

do $$
declare v_co bigint; v_ac bigint; v_ok boolean;
begin
  select count(*) into v_co from public.companies where deleted_at is null;
  select count(*) into v_ac from public.agency_cases where deleted_at is null;
  select public.is_approved() into v_ok;
  insert into _tr(step, verdict, detail) values ('B01 [비활성화 전] 승인 상태에서 조회',
    case when v_ok and v_co > 0 then 'PASS' else 'FAIL' end,
    format('is_approved=%s 업체=%s 기관진행=%s', v_ok, v_co, v_ac));
exception when others then
  insert into _tr(step, verdict, detail) values ('B01 [비활성화 전] 승인 상태에서 조회', 'FAIL', sqlerrm);
end $$;

reset role;

-- ── 2) 비활성화 — 반드시 관리자(양호) 컨텍스트에서 ──────────────────────
set request.jwt.claims = '{"sub":"4a03e49d-d566-42dd-9738-efb9baf7135c","role":"authenticated"}';
set role authenticated;

update public.profiles set status = 'rejected'
 where id = '9d87b323-525d-4314-bbdf-91bbcda80a5f';

reset role;

do $$
declare v_st text;
begin
  select status into v_st from public.profiles where id = '9d87b323-525d-4314-bbdf-91bbcda80a5f';
  insert into _tr(step, verdict, detail) values ('C01 비활성화가 실제로 적용됐나(트리거 함정 확인)',
    case when v_st = 'rejected' then 'PASS' else 'FAIL' end,
    format('status=%s (approved 면 트리거가 되돌린 것)', v_st));
end $$;

-- ── 3) 비활성화 후: **같은 토큰**으로 다시 찔러본다 ─────────────────────
set request.jwt.claims = '{"sub":"9d87b323-525d-4314-bbdf-91bbcda80a5f","role":"authenticated"}';
set role authenticated;

do $$
declare v_ok boolean;
begin
  select public.is_approved() into v_ok;
  insert into _tr(step, verdict, detail) values ('A01 is_approved() 가 false 인가',
    case when not v_ok then 'PASS' else 'FAIL' end, format('is_approved=%s', v_ok));
exception when others then
  insert into _tr(step, verdict, detail) values ('A01 is_approved() 가 false 인가', 'FAIL', sqlerrm);
end $$;

do $$
declare v_n bigint;
begin
  select count(*) into v_n from public.companies where deleted_at is null;
  insert into _tr(step, verdict, detail) values ('A02 기업목록 조회',
    case when v_n = 0 then 'PASS' else 'FAIL' end, format('보이는 건수=%s (0이어야 차단)', v_n));
exception when others then
  insert into _tr(step, verdict, detail) values ('A02 기업목록 조회', 'PASS', '권한 거부: ' || sqlerrm);
end $$;

do $$
declare v_n bigint;
begin
  select count(*) into v_n from public.agency_cases where deleted_at is null;
  insert into _tr(step, verdict, detail) values ('A03 기관별 현황 조회',
    case when v_n = 0 then 'PASS' else 'FAIL' end, format('보이는 건수=%s', v_n));
exception when others then
  insert into _tr(step, verdict, detail) values ('A03 기관별 현황 조회', 'PASS', '권한 거부: ' || sqlerrm);
end $$;

do $$
declare v_n bigint;
begin
  select count(*) into v_n from public.work_notes where deleted_at is null;
  insert into _tr(step, verdict, detail) values ('A04 업무노트 조회',
    case when v_n = 0 then 'PASS' else 'FAIL' end, format('보이는 건수=%s', v_n));
exception when others then
  insert into _tr(step, verdict, detail) values ('A04 업무노트 조회', 'PASS', '권한 거부: ' || sqlerrm);
end $$;

do $$
declare v_n bigint;
begin
  select count(*) into v_n from public.chat_messages;
  insert into _tr(step, verdict, detail) values ('A05 채팅 조회',
    case when v_n = 0 then 'PASS' else 'FAIL' end, format('보이는 건수=%s', v_n));
exception when others then
  insert into _tr(step, verdict, detail) values ('A05 채팅 조회', 'PASS', '권한 거부: ' || sqlerrm);
end $$;

do $$
begin
  insert into public.chat_messages (sender, message, channel)
  values ('미현', '⟪TEST⟫ 비활성 계정 전송', 'general');
  insert into _tr(step, verdict, detail) values ('A06 비활성 계정이 채팅 전송', 'FAIL', '들어갔다');
exception when others then
  insert into _tr(step, verdict, detail) values ('A06 비활성 계정이 채팅 전송', 'PASS', sqlerrm);
end $$;

-- /api/* 인증(denyUnauthorized)이 보는 경로 — 본인 토큰으로 profiles.status 를 읽는다.
do $$
declare v_st text; v_n bigint;
begin
  select status into v_st from public.profiles where id = auth.uid();
  select count(*) into v_n from public.profiles;
  insert into _tr(step, verdict, detail) values ('A07 /api 인증이 읽는 내 status',
    case when v_st = 'rejected' then 'PASS' else 'FAIL' end,
    format('내 status=%s → api 는 403 을 준다. 다만 profiles 자체는 %s행 여전히 조회됨(p_profiles_select 가 using(true))', v_st, v_n));
exception when others then
  insert into _tr(step, verdict, detail) values ('A07 /api 인증이 읽는 내 status', 'FAIL', sqlerrm);
end $$;

reset role;

-- ── 4) 원복 (반드시 관리자 컨텍스트에서) ────────────────────────────────
set request.jwt.claims = '{"sub":"4a03e49d-d566-42dd-9738-efb9baf7135c","role":"authenticated"}';
set role authenticated;

update public.profiles set status = 'approved'
 where id = '9d87b323-525d-4314-bbdf-91bbcda80a5f';

reset role;
reset request.jwt.claims;

delete from public.chat_messages where message like '⟪TEST⟫%';

-- ── 판정 ────────────────────────────────────────────────────────────────
select
  (select count(*) from _tr where verdict = 'PASS')  as "통과",
  (select count(*) from _tr where verdict = 'FAIL')  as "실패",
  (select status from public.profiles where id = '9d87b323-525d-4314-bbdf-91bbcda80a5f')
                                                     as "원복확인(approved 여야 함)",
  -- 세션 행은 그대로 남는가 (= 로그인 자체는 안 끊긴다는 증거)
  (select count(*) from auth.sessions where user_id = '9d87b323-525d-4314-bbdf-91bbcda80a5f')
                                                     as "남은 세션수",
  (select count(*) from public.chat_messages where message like '⟪TEST⟫%') as "테스트 잔여",
  (select jsonb_agg(jsonb_build_object('step', step, 'verdict', verdict, 'detail', detail) order by n)
     from _tr)                                       as "상세";
