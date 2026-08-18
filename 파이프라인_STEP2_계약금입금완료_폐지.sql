-- 파이프라인 STEP2 "계약금입금완료" 폐지 (2026-08-18)
--
-- 사전 실측 (단계제거_조회_계약금입금완료.sql, 조치 전):
--   pipeline_cards.stage = '계약금입금완료'  … 0건 (휴지통 포함)
--   companies.stage      = '계약금입금완료'  … 0건 (삭제분 포함)
--   agency_cases.status  = '계약금입금완료'  … 0건
--   status_stage_map 이 단계로 보내는 규칙   … 0건
--   → 옮길 데이터가 없다. 카드·기업·기관현황은 손대지 않는다.
--
-- ⚠️ companies.contract_status = '계약금입금완료' (9건) 은 **전혀 다른 값**이다. 건드리지 말 것.
--    정산 자동반영(syncSettlementFromCompany)의 발동 조건이 바로 이 컬럼이다.
--    stage(파이프라인 단계)와 이름만 같았을 뿐 서로 다른 컬럼이다 — 이번에 그 이름 중복을 없앤다.
--
-- 손대는 것은 고아가 된 설정 1건뿐:
--   stage_stagnation_config 의 '계약금입금완료' 행(7일·enabled=false).
--   STAGES 에서 빠지면 화면(정체 알림 설정)에 아예 안 그려져 사람이 지울 수도 없다.
--
-- 되돌리기: 파이프라인_STEP2_계약금입금완료_폐지_rollback.sql
--   (⚠ SQL 만 되돌리면 안 된다. src/App.js 의 STAGES 도 같이 되돌려야 화면과 DB 가 맞는다.)

begin;

delete from public.stage_stagnation_config
 where stage = '계약금입금완료';

commit;
