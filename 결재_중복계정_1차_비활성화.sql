-- ============================================================================
-- 🗂️ 결재 안건 1호 — 중복 계정 1차 비활성화 (미현·지혜·유진·동일 / 6행)
--
--   ⚠️ 승인 전에는 실행하지 말 것. 결재함에서 승인된 뒤 실행하고,
--      실행 후 결재 건을 '실행 완료'로 표시할 것.
--
-- [무엇을]
--   같은 사람이 여러 번 가입해 생긴 중복 profiles 행 6개를
--   삭제가 아니라 status='rejected' 로 **비활성화**한다.
--
-- [왜 삭제가 아니라 비활성화인가]
--   profiles 행을 지우면 auth.users 는 남아 로그인은 되는데 App.js 가 !profile 로 판단해
--   SetupProfile 로 보내 프로필을 다시 만든다. 그때 trg_protect_profile_insert 가
--   role='member' / status='pending' 을 강제하므로 **승인 대기 화면에 갇히고 team·role 이 초기화**된다.
--   비활성화는 되돌리기가 한 줄이고, 잘못 골랐어도 '거절됨' 화면이 떠서 즉시 알 수 있다.
--
-- [업무 데이터 영향 = 0]
--   public 스키마 uuid 컬럼 전수 조사 결과, profiles 를 uuid 로 참조하는 테이블은
--   sign_offs 하나뿐이고 현재 0행이다. work_notes·companies·team_notes·chat_messages 등
--   나머지는 전부 사람을 '이름 텍스트'로 묶는다 → 이 작업으로 움직이는 업무 데이터는 없다.
--
-- [남길 계정 / 끄는 계정]  (판정 근거: auth.users.last_sign_in_at + auth.sessions 활동)
--   미현  남김 562de348 hyuncandoit@gmail.com   (08-10 로그인, 세션 당일 활동)
--         끔   398c074f hyuncandoit@naver.com   (06-04, 세션 0)
--         끔   9d87b323 hyuncandoit@gmail.net   (05-18, 세션 0 · .net 오타 가입 추정)
--   지혜  남김 ca2a9bbb wlgp007@naver.com       (07-01 로그인이지만 세션이 08-10 갱신 = 실사용)
--         끔   8d5196a3 wlgp007@gmail.com       (06-01)
--         끔   0b4fb660 wlgp800413@gmail.com    (05-15, 세션 0)
--   유진  남김 e5ed4171 gkrndbwls@naver.com     (08-08 로그인, 세션 당일 활동)
--         끔   e30cc2ef clfflzhs@gmail.com      (05-19, 세션 0)
--   동일  남김 f73c1594 dgim81238@gmail.com     (07-02 로그인이지만 세션이 08-10 갱신 = 실사용)
--         끔   64932e32 magic-1415@naver.com    (05-11)
--
-- [이번 범위에서 뺀 것]
--   · 현애(2계정) — 둘 다 두 달째 휴면이라 어느 쪽이 살아있는지 본인 확인 필요
--   · 권구현(2계정) — 소속 팀이 관리자/법인전담으로 달라 동명이인 가능성. 본인 확인 필요
--
-- 실행:   node scripts/run-sql.js 결재_중복계정_1차_비활성화.sql
-- 되돌리기: 결재_중복계정_1차_비활성화_rollback.sql   (status 를 approved 로 원복)
-- ============================================================================

begin;

-- 대상 6개 + 남길 4개를 한 곳에 적어두고, 사전 검증에 같이 쓴다.
create temp table _plan(uuid uuid, name text, action text) on commit drop;
insert into _plan values
  ('398c074f-009f-4b32-8705-11473005c76f','미현','off'),
  ('9d87b323-525d-4314-bbdf-91bbcda80a5f','미현','off'),
  ('8d5196a3-5fc0-4d03-992e-22a1d9039cee','지혜','off'),
  ('0b4fb660-3b55-46e2-9d47-f2b2b617b305','지혜','off'),
  ('e30cc2ef-9e74-4625-8511-f2c393a08342','유진','off'),
  ('64932e32-88a4-4600-9096-993bf81548ce','동일','off'),
  ('562de348-f162-4bb5-9b6f-dccd9777af3a','미현','keep'),
  ('ca2a9bbb-30dc-4766-a056-c7f4282563ad','지혜','keep'),
  ('e5ed4171-133c-4515-9d68-689f686f293b','유진','keep'),
  ('f73c1594-90fa-4458-9243-1e57db5f37ab','동일','keep');

-- 사전 검증 — 하나라도 어긋나면 통째로 롤백된다.
do $$
declare v_n int;
begin
  -- ① 계획한 10개 행이 실제로 존재하고 이름이 일치하는가
  select count(*) into v_n
    from _plan p join public.profiles pr on pr.id = p.uuid and pr.name = p.name;
  if v_n <> 10 then
    raise exception '대상 프로필이 계획과 다릅니다(일치 %/10). 조사 시점 이후 데이터가 바뀌었습니다.', v_n;
  end if;

  -- ② 지금 전부 approved 인가 (이미 누가 손댔으면 중단)
  select count(*) into v_n
    from _plan p join public.profiles pr on pr.id = p.uuid
   where pr.status <> 'approved';
  if v_n > 0 then
    raise exception '이미 approved 가 아닌 행이 %건 있습니다. 확인 후 다시 진행하세요.', v_n;
  end if;

  -- ③ 끄려는 대상 중 admin 이 섞여 있지 않은가 (양호·정원은 이 목록에 없어야 정상)
  select count(*) into v_n
    from _plan p join public.profiles pr on pr.id = p.uuid
   where p.action = 'off' and pr.role = 'admin';
  if v_n > 0 then
    raise exception '끄려는 대상에 관리자 계정이 %건 있습니다. 중단합니다.', v_n;
  end if;

  -- ④ 사람마다 남는 approved 계정이 정확히 1개인가 (전원 잠기는 사고 방지)
  select count(*) into v_n from (
    select p.name from _plan p where p.action='keep' group by p.name having count(*) <> 1) z;
  if v_n > 0 then raise exception '남길 계정이 1개가 아닌 사람이 있습니다.'; end if;
end $$;

-- 실제 조치 — 삭제가 아니라 비활성화
update public.profiles pr
   set status = 'rejected'
  from _plan p
 where pr.id = p.uuid and p.action = 'off';

commit;

-- 실행 직후 눈으로 확인 (끈 6행 = rejected / 남긴 4행 = approved 여야 정상)
-- ⚠ 이 SELECT 를 믿지 말고 결재_중복계정_1차_검증.sql 로 따로 다시 확인할 것.
select pr.name, pr.status, pr.team, left(pr.id::text, 8) as uuid8
  from public.profiles pr
 where pr.name in ('미현','지혜','유진','동일')
 order by pr.name, pr.status;
