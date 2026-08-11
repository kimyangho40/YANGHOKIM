-- ============================================================================
-- 🧪 team_notes 사칭·변조 차단 동작 검증 — 트리거를 실제로 찔러본다
--
--   방법: request.jwt.claims 를 실제 profiles.id 로 설정하고 set role authenticated →
--         auth.uid() 가 그 사람으로 인식된다(로그인한 것과 같은 조건).
--   대상: 관호(member) · 양호(admin) · anon
--
-- ⚠️ 실제 DB 에 행을 넣었다 지운다. 테스트 행은 제목이 '⟪TEST⟫' 로 시작하고
--    끝에서 하드 삭제한다(관리 컨텍스트라 삭제 차단 트리거를 통과한다).
--    화면에 잠깐 보일 수 있어 team='all' 대신 실사용에 없는 team='__test__' 를 쓴다
--    → App.js 탭(corporate/individual/all) 어디에도 안 걸려 화면에 안 뜬다.
--
-- 실행: node scripts/run-sql.js 팀노트_사칭변조_방지_동작검증.sql
-- 판정: fail = 0, 남은 테스트행 = 0 이어야 정상.
-- 트리거를 고치면 반드시 이 파일을 다시 돌릴 것.
-- ============================================================================

create temp table _tr (n bigint generated always as identity, step text, verdict text, detail text);
create temp table _id (k text primary key, v uuid);
grant all on _tr to authenticated, anon;
grant all on _id to authenticated, anon;
grant usage, select on all sequences in schema pg_temp to authenticated, anon;

-- 지난 실행 찌꺼기 정리 (관리 컨텍스트라 하드 삭제 가능)
delete from public.team_notes where team = '__test__' or title like '⟪TEST⟫%';

-- ══════════════════════════════════════════════════════════════════════
-- A. 사칭 — 관호가 '양호' 이름으로 등록
-- ══════════════════════════════════════════════════════════════════════
set request.jwt.claims = '{"sub":"b2d220db-ba6a-4896-8a0f-d2469df0de21","role":"authenticated"}';
set role authenticated;

do $$
declare v_id uuid; v_who text;
begin
  insert into public.team_notes(team, title, content, posted_by, status)
  values ('__test__', '⟪TEST⟫ 사칭 등록', 'x', '양호', 'open')
  returning id into v_id;
  select posted_by into v_who from public.team_notes where id = v_id;
  insert into _id(k, v) values ('a', v_id);
  insert into _tr(step, verdict, detail) values ('A01 관호가 posted_by=''양호'' 로 등록',
    case when v_who = '관호' then 'PASS' else 'FAIL' end,
    format('저장된 등록자=%s (기대: 관호 로 강제)', v_who));
exception when others then
  insert into _tr(step, verdict, detail) values ('A01 관호가 posted_by=''양호'' 로 등록', 'FAIL', sqlerrm);
end $$;

-- ══════════════════════════════════════════════════════════════════════
-- B. 변조 — 남이 올린 노트의 등록자·팀 바꿔치기
-- ══════════════════════════════════════════════════════════════════════
reset role; reset request.jwt.claims;

-- 양호가 올린 노트를 관리 컨텍스트로 하나 만든다(트리거 통과 경로)
do $$
declare v_id uuid;
begin
  insert into public.team_notes(team, title, content, posted_by, status)
  values ('__test__', '⟪TEST⟫ 양호 노트', 'y', '양호', 'open')
  returning id into v_id;
  insert into _id(k, v) values ('b', v_id);
end $$;

set request.jwt.claims = '{"sub":"b2d220db-ba6a-4896-8a0f-d2469df0de21","role":"authenticated"}';
set role authenticated;

do $$
declare v_id uuid; v_who text; v_team text;
begin
  select v into v_id from _id where k = 'b';
  update public.team_notes set posted_by = '관호', team = 'corporate' where id = v_id;
  select posted_by, team into v_who, v_team from public.team_notes where id = v_id;
  insert into _tr(step, verdict, detail) values ('B01 관호가 남의 노트 등록자·팀 바꿔치기',
    case when v_who = '양호' and v_team = '__test__' then 'PASS' else 'FAIL' end,
    format('등록자=%s 팀=%s (기대: 양호 / __test__ 로 조용히 원복)', v_who, v_team));
exception when others then
  insert into _tr(step, verdict, detail) values ('B01 관호가 남의 노트 등록자·팀 바꿔치기', 'FAIL', sqlerrm);
end $$;

-- ══════════════════════════════════════════════════════════════════════
-- C. 정상 동작 보존 — 확인/완료/체크리스트/내용수정/soft delete 는 통과해야
-- ══════════════════════════════════════════════════════════════════════
do $$
declare v_id uuid; v_rb jsonb; v_st text;
begin
  select v into v_id from _id where k = 'b';
  update public.team_notes set read_by = '["관호"]'::jsonb where id = v_id;   -- 확인
  update public.team_notes set status = 'done' where id = v_id;                -- 완료
  select read_by, status into v_rb, v_st from public.team_notes where id = v_id;
  insert into _tr(step, verdict, detail) values ('C01 남의 노트에 확인(read_by)·완료(status)',
    case when v_rb ? '관호' and v_st = 'done' then 'PASS' else 'FAIL' end,
    format('read_by=%s status=%s (둘 다 반영돼야 정상)', v_rb, v_st));
exception when others then
  insert into _tr(step, verdict, detail) values ('C01 남의 노트에 확인(read_by)·완료(status)', 'FAIL', sqlerrm);
end $$;

do $$
declare v_id uuid; v_t text; v_c text;
begin
  select v into v_id from _id where k = 'b';
  update public.team_notes set title = '⟪TEST⟫ 수정됨', content = 'z',
         checklist = '[{"text":"a","done":false}]'::jsonb where id = v_id;
  select title, content into v_t, v_c from public.team_notes where id = v_id;
  insert into _tr(step, verdict, detail) values ('C02 제목·내용·체크리스트 수정',
    case when v_t = '⟪TEST⟫ 수정됨' and v_c = 'z' then 'PASS' else 'FAIL' end,
    format('제목=%s 내용=%s (반영돼야 정상)', v_t, v_c));
exception when others then
  insert into _tr(step, verdict, detail) values ('C02 제목·내용·체크리스트 수정', 'FAIL', sqlerrm);
end $$;

do $$
declare v_id uuid; v_d timestamptz;
begin
  select v into v_id from _id where k = 'a';
  update public.team_notes set deleted_at = now() where id = v_id;             -- soft delete
  select deleted_at into v_d from public.team_notes where id = v_id;
  insert into _tr(step, verdict, detail) values ('C03 soft delete(deleted_at)',
    case when v_d is not null then 'PASS' else 'FAIL' end,
    format('deleted_at=%s (채워져야 정상)', v_d));
exception when others then
  insert into _tr(step, verdict, detail) values ('C03 soft delete(deleted_at)', 'FAIL', sqlerrm);
end $$;

-- ══════════════════════════════════════════════════════════════════════
-- D. 하드 삭제 차단 — 본인 것도, 남의 것도 못 지워야
-- ══════════════════════════════════════════════════════════════════════
do $$
declare v_id uuid; v_left bigint;
begin
  select v into v_id from _id where k = 'b';
  delete from public.team_notes where id = v_id;
  select count(*) into v_left from public.team_notes where id = v_id;
  insert into _tr(step, verdict, detail) values ('D01 관호가 하드 DELETE',
    case when v_left = 1 then 'PASS' else 'FAIL' end,
    format('남은 행=%s (1이어야 정상 — 예외로 막힘)', v_left));
exception when others then
  insert into _tr(step, verdict, detail) values ('D01 관호가 하드 DELETE', 'PASS',
    '예외로 차단됨: ' || sqlerrm);
end $$;

-- 관리자(양호)도 하드 삭제는 못 한다 — soft delete 를 쓰라는 규칙이라 역할 무관
reset role; reset request.jwt.claims;
set request.jwt.claims = '{"sub":"4a03e49d-d566-42dd-9738-efb9baf7135c","role":"authenticated"}';
set role authenticated;

do $$
declare v_id uuid; v_left bigint;
begin
  select v into v_id from _id where k = 'b';
  delete from public.team_notes where id = v_id;
  select count(*) into v_left from public.team_notes where id = v_id;
  insert into _tr(step, verdict, detail) values ('D02 관리자(양호)가 하드 DELETE',
    case when v_left = 1 then 'PASS' else 'FAIL' end,
    format('남은 행=%s (1이어야 정상)', v_left));
exception when others then
  insert into _tr(step, verdict, detail) values ('D02 관리자(양호)가 하드 DELETE', 'PASS',
    '예외로 차단됨: ' || sqlerrm);
end $$;

-- ══════════════════════════════════════════════════════════════════════
-- E. 비로그인(anon) — 권한 자체가 없어야
-- ══════════════════════════════════════════════════════════════════════
reset role; reset request.jwt.claims;
set role anon;

do $$
declare v_n bigint;
begin
  select count(*) into v_n from public.team_notes;
  insert into _tr(step, verdict, detail) values ('E01 비로그인 조회',
    case when v_n = 0 then 'PASS' else 'FAIL' end, format('보이는 건수=%s', v_n));
exception when others then
  insert into _tr(step, verdict, detail) values ('E01 비로그인 조회', 'PASS',
    '권한 자체가 없음: ' || sqlerrm);
end $$;

-- ══════════════════════════════════════════════════════════════════════
-- 정리 & 결과
-- ══════════════════════════════════════════════════════════════════════
reset role; reset request.jwt.claims;
delete from public.team_notes where team = '__test__' or title like '⟪TEST⟫%';

select jsonb_pretty(jsonb_build_object(
  'pass', (select count(*) from _tr where verdict = 'PASS'),
  'fail', (select count(*) from _tr where verdict = 'FAIL'),
  '남은_테스트행', (select count(*) from public.team_notes
                    where team = '__test__' or title like '⟪TEST⟫%'),
  '상세', (select jsonb_agg(jsonb_build_object('step',step,'verdict',verdict,'detail',detail) order by n) from _tr)
)) as v;
