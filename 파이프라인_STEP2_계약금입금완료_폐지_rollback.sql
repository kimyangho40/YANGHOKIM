-- 되돌리기: 파이프라인_STEP2_계약금입금완료_폐지.sql
-- ⚠ 코드(src/App.js STAGES · CONTRACT_PAID_ADVANCE_STAGE)도 같이 되돌려야 한다.
--   SQL 만 되돌리면 화면에 없는 단계의 설정 행만 살아난다.

begin;

insert into public.stage_stagnation_config (stage, threshold_days, enabled, updated_at)
values ('계약금입금완료', 7, false, now())
on conflict (stage) do nothing;

commit;
