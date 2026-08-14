-- ============================================================================
-- ⏪ 중복 계정 1차 비활성화 되돌리기 — 6행을 다시 approved 로
--
--   결재_중복계정_1차_비활성화.sql 을 취소한다.
--   비활성화는 status 한 컬럼만 바꿨으므로 되돌리기도 그 한 컬럼뿐이다
--   (행을 지운 게 아니라서 team·role·created_at 은 처음부터 그대로다).
--
-- 실행: node scripts/run-sql.js 결재_중복계정_1차_비활성화_rollback.sql
-- ============================================================================

begin;

update public.profiles
   set status = 'approved'
 where id in (
   '398c074f-009f-4b32-8705-11473005c76f',  -- 미현 @naver.com
   '9d87b323-525d-4314-bbdf-91bbcda80a5f',  -- 미현 @gmail.net
   '8d5196a3-5fc0-4d03-992e-22a1d9039cee',  -- 지혜 @gmail.com
   '0b4fb660-3b55-46e2-9d47-f2b2b617b305',  -- 지혜 wlgp800413@gmail.com
   'e30cc2ef-9e74-4625-8511-f2c393a08342',  -- 유진 clfflzhs@gmail.com
   '64932e32-88a4-4600-9096-993bf81548ce'   -- 동일 magic-1415@naver.com
 );

commit;

-- 확인 — 6행 모두 approved 로 돌아왔는지
select name, status, left(id::text, 8) as uuid8
  from public.profiles
 where id in (
   '398c074f-009f-4b32-8705-11473005c76f','9d87b323-525d-4314-bbdf-91bbcda80a5f',
   '8d5196a3-5fc0-4d03-992e-22a1d9039cee','0b4fb660-3b55-46e2-9d47-f2b2b617b305',
   'e30cc2ef-9e74-4625-8511-f2c393a08342','64932e32-88a4-4600-9096-993bf81548ce')
 order by name;
