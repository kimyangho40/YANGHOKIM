-- ════════════════════════════════════════════════════════════════════════
-- 🔐 테스트 계정 2건 삭제 (2026-08-09)
--    실행: node scripts/run-sql.js 테스트계정_삭제.sql
--    되돌리기: 테스트계정_삭제_rollback.sql
--
-- 배경: 2026-07-08 04:17~04:20 자동 가입 테스트로 만들어진 계정이 남아 있었다.
--       ⚠️ 처음엔 2개로 봤는데(profiles 기준), 로그인 계정(auth.users)까지 세니 **3개**였다.
--         · cctest_1783484231079@example.com  (2c08ad09…)  프로필 없음 · 04:17
--         · cctest_1783484366371@example.com  (d739c8ef…)  프로필 approved · 04:19
--         · cctest_1783484446083@example.com  (e96038e5…)  프로필 approved · 04:20
--
--       앞의 2개(approved)가 급했다 — 승인 계정은 DB RLS 의 is_approved() 를 통과해
--       로그인만 하면 기업 396건 등 전 데이터를 열람할 수 있었다.
--       세 번째(프로필 없음)는 데이터를 못 봤지만 로그인 자체는 되는 상태라 같이 지운다.
--       프로필이 없으면 화면상 '가입 신청 접수'에서 멈추므로 위험도는 낮았다.
--
-- 딸린 데이터 확인 결과(삭제 전 실측) — 4개 축 모두 0건이라 잃을 기록이 없다:
--   work_notes 0 / companies(담당) 0 / team_notes 0 / chat_messages 0
--
-- 외래키 확인:
--   · public 스키마에서 profiles.id 를 참조하는 FK 는 없다(연쇄 삭제 없음).
--   · profiles_id_fkey → auth.users 는 ON DELETE NO ACTION 이다.
--     따라서 **profiles 를 먼저 지우고 auth.users 를 나중에** 지워야 한다(순서 중요).
--   · auth.identities / sessions 등 auth 내부 FK 는 전부 CASCADE 라 같이 정리된다.
--
-- ⚠️ 다른 계정은 건드리지 않는다. 이름이 '테스트'라도 @example.com 이 아니면 제외.
--    (실제 직원이 '테스트'라는 이름을 쓴 적이 없음을 확인했으나, 조건을 이메일로 좁혀 둔다.)
-- ════════════════════════════════════════════════════════════════════════

begin;

-- [1] 삭제 대상 고정 — 이메일이 cctest_%@example.com 인 것만
create temporary table _doomed on commit drop as
select u.id, u.email
  from auth.users u
 where u.email like 'cctest\_%@example.com';

-- [2] 안전장치 — 대상이 정확히 3건이 아니면 통째로 중단한다.
--     (다른 계정을 쓸어버리는 사고를 막는다. 실제로 이 장치가 걸려서
--      "2건인 줄 알았는데 3건"이라는 걸 삭제 전에 알았다 — 그냥 지웠으면 몰랐다.)
do $$
declare n int;
begin
  select count(*) into n from _doomed;
  if n <> 3 then
    raise exception '중단: 삭제 대상이 3건이어야 하는데 %건입니다. 조건을 다시 확인하세요.', n;
  end if;
end $$;

-- [3] profiles 먼저 (FK 가 NO ACTION 이라 순서가 바뀌면 실패한다)
delete from public.profiles p using _doomed d where p.id = d.id;

-- [4] auth.users — auth.identities/sessions 등은 CASCADE 로 함께 정리됨
delete from auth.users u using _doomed d where u.id = d.id;

commit;

-- ── 검증 (⚠️ run-sql.js 는 결과를 하나만 출력한다. 아래는 따로 실행해서 확인할 것) ──
-- 전부 0 이어야 정상:
--   select
--     (select count(*) from auth.users where email like '%@example.com')      as 남은_테스트_로그인계정,
--     (select count(*) from public.profiles where name = '테스트')             as 남은_테스트_프로필,
--     (select count(*) from public.profiles p
--        left join auth.users u on u.id = p.id where u.id is null)            as 고아프로필;
