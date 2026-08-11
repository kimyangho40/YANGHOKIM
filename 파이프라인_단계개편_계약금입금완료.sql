-- 파이프라인 단계 개편 (2026-08-11)
--   · STEP2 "계약금입금완료" 신설
--   · "스크립트 전달 완료" 폐지
--
-- 사전 실측(조치 전):
--   companies.stage        = '스크립트 전달 완료'  … 0건
--   pipeline_cards.stage   = '스크립트 전달 완료'  … 0건
--   agency_cases.status    = '스크립트 전달 완료'  … 0건
--   → 카드/기업 데이터는 손대지 않는다. 옮길 대상이 없다.
--
-- 손대는 것은 "그 단계를 가리키는 설정 2건"뿐이다:
--   ① status_stage_map  — 기관 상태 → 단계 매핑 규칙 1건.
--      남겨두면 기관 상태가 '스크립트 전달 완료'가 되는 순간 보드에 없는 단계로 카드가 날아가
--      화면에서 사라진다(STAGES 를 순회해 컬럼을 그리므로 목록에 없는 단계는 안 그려진다).
--   ② stage_stagnation_config — 단계별 정체 알림 기준. 폐지 단계 행을 지우고 새 단계 행을 넣는다.
--      새 단계는 enabled=false 로 넣는다 — 알림을 임의로 늘리지 않기 위해서다.
--      필요하면 화면(정체 알림 설정)에서 켜면 된다.
--
-- 되돌리기: 파이프라인_단계개편_계약금입금완료_rollback.sql
-- 검증    : 파이프라인_단계개편_계약금입금완료_검증.sql  (⚠ 조치 파일의 SELECT 를 믿지 말 것)

begin;

-- ① 폐지 단계를 가리키는 매핑 규칙 제거 (실측 1건: agency_group='*', status_value='스크립트 전달 완료')
delete from public.status_stage_map
 where stage = '스크립트 전달 완료';

-- ② 정체 알림 기준 — 폐지 단계 제거
delete from public.stage_stagnation_config
 where stage = '스크립트 전달 완료';

-- ③ 정체 알림 기준 — 새 단계 추가 (기본은 꺼둠)
insert into public.stage_stagnation_config (stage, threshold_days, enabled, updated_at)
values ('계약금입금완료', 7, false, now())
on conflict (stage) do nothing;

commit;
