-- ============================================================================
-- 기관별현황 행별 「↪ 이월」 — 최초 신청월 값 컬럼 2개 추가 (2026-10-06)
-- 되돌리기: 기관현황_이월_원래신청월_컬럼추가_rollback.sql
-- 검증    : 기관현황_이월_원래신청월_컬럼추가_검증.sql  (실행 후 **별도로** 돌릴 것 — CLAUDE.md 2-2)
--
-- 왜 값 컬럼인가
--   reapply_from_id(직전 건 링크)는 FK 가 ON DELETE SET NULL 이라 원본을 영구삭제하면 비워진다.
--   "몇 월 신청 건에서 온 것인가"는 원본이 사라져도 남아야 하므로 연·월을 값으로 찍어 둔다.
--   재이월(6월→9월→12월)해도 최초 신청월(6월)을 그대로 물려준다(App.js carryOriginOf).
--
-- 기존 행 영향 없음
--   · NULL 허용 + 기본값 없음 → 테이블 재작성 없음, 기존 행은 전부 NULL.
--   · check 제약은 전부 NULL 인 기존 행을 그대로 통과한다.
--   · 새 정책·새 GRANT 없음. 테이블 단위 RLS(p_agency_cases_all, is_approved())·GRANT 가 새 컬럼에도 그대로 적용된다.
--   · App.js 의 기존 조회는 select("*") / 명시 컬럼이라 새 컬럼이 생겨도 깨지지 않는다.
--
-- ⚠️ 배포 순서: 이 SQL 먼저 → 그다음 App.js. 코드만 먼저 나가면 이월 insert 가 실패로 뜬다(조용히 빠지지 않음).
-- ============================================================================

alter table public.agency_cases
  add column if not exists carried_from_year  integer,
  add column if not exists carried_from_month integer;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'agency_cases_carried_from_chk') then
    alter table public.agency_cases
      add constraint agency_cases_carried_from_chk check (
        (carried_from_year is null) = (carried_from_month is null)
        and (carried_from_month is null or carried_from_month between 1 and 12)
        and (carried_from_year  is null or carried_from_year  between 2000 and 2100)
      );
  end if;
end $$;

comment on column public.agency_cases.carried_from_year  is '↪ 이월 사본의 최초 신청 연도. 이월이 아닌 행은 NULL. 원본이 지워져도 유지된다.';
comment on column public.agency_cases.carried_from_month is '↪ 이월 사본의 최초 신청 월(1~12). carried_from_year 와 항상 같이 채워진다.';
