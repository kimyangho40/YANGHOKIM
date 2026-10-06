-- ============================================================================
-- 되돌리기: 기관현황_이월_원래신청월_컬럼추가.sql
--
-- ⚠️⚠️ 이 파일을 실행하면 그때까지 쌓인 "이월 · N월에서" 기록(최초 신청월)이 **영구히 사라진다.**
--      실행 전에 아래 주석의 백업 조회로 값을 떠 둘 것.
--      (select id, carried_from_year, carried_from_month from public.agency_cases where carried_from_year is not null;)
--
-- ⚠️ App.js 의 이월 기능은 이 컬럼에 쓴다 → 컬럼만 지우면 이월 insert 가 실패로 뜬다(데이터 손상은 없음).
--    코드도 같이 되돌릴 것. 이미 만들어진 이월 사본 행 자체는 지워지지 않고 「재신청」 배지로 보이게 된다
--    (reapply_from_id 가 남아 있으므로).
-- ============================================================================

alter table public.agency_cases drop constraint if exists agency_cases_carried_from_chk;

alter table public.agency_cases
  drop column if exists carried_from_month,
  drop column if exists carried_from_year;
