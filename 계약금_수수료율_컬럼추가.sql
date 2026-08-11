-- 계약금 · 수수료율 컬럼 추가 (2026-08-11)
--
-- 배경: 기업 상세 "수수료 계산기"를 [승인(예상)금액 × 수수료율 → 예상 수수료] 에서
--       [계약금 + 수수료율] 직접 입력으로 바꾼다. 그런데 값을 담을 칸이 없다:
--         · companies       — 수수료율(fee)은 있는데 **계약금 칸이 없다**
--         · settlement_manual — 계약금(contract_fee)은 있는데 **수수료율 칸이 없다**
--
-- 실측(조치 전): companies.approved_amount 에 값이 있는 기업 0 / 397건.
--   → 승인금액 기반 예상수수료(expectedFee)는 지금도 전 건 0 이다. 입력칸을 빼도 화면 숫자가 안 변한다.
--   → approved_amount 컬럼 자체는 남긴다(기관진행·심사사례 화면이 따로 쓰고 있다).
--
-- ⚠ settlement_manual.commission_fee(수수료 금액)는 **건드리지 않는다.**
--    사람이 직접 입력하는 칸이라 자동 반영 대상이 아니다(앱 코드에서도 절대 안 쓴다).
--
-- 되돌리기: 계약금_수수료율_컬럼추가_rollback.sql
-- 검증    : 계약금_수수료율_컬럼추가_검증.sql  (⚠ 조치 파일의 SELECT 를 믿지 말 것)

begin;

-- ① 기업 — 계약금(원 단위). 수수료율은 기존 companies.fee 를 그대로 쓴다.
alter table public.companies
  add column if not exists contract_amount numeric;

comment on column public.companies.contract_amount is
  '계약금(원). 기업정보 탭에서 직접 입력. contract_status/fee_status 변경 시 settlement_manual.contract_fee 로 자동 반영';

-- ② 정산(수동) — 수수료율(%). 계약금은 기존 settlement_manual.contract_fee 를 그대로 쓴다.
alter table public.settlement_manual
  add column if not exists commission_rate numeric;

comment on column public.settlement_manual.commission_rate is
  '수수료율(%). companies.fee 에서 자동 반영. 수수료 금액(commission_fee)은 수동 입력이라 자동으로 덮어쓰지 않는다';

commit;

-- ③ 새 컬럼에도 CLAUDE.md 2-2 원칙 적용 — 앱이 안 쓰는 권한은 애초에 안 남긴다.
--    (컬럼 추가는 테이블 GRANT 를 바꾸지 않지만, supabase_admin 기본권한이 아직 arwdDxtm 이라
--     확인 삼아 한 번 더 회수한다. 이미 0건이면 아무 일도 일어나지 않는다.)
revoke truncate, references, trigger on public.companies         from authenticated, anon;
revoke truncate, references, trigger on public.settlement_manual from authenticated, anon;
