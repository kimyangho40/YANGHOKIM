-- 되돌리기: 파이프라인_단계개편_계약금입금완료.sql
-- ⚠ 코드(src/App.js STAGES)도 같이 되돌려야 한다. SQL 만 되돌리면 화면과 DB 가 어긋난다.

begin;

-- ③ 취소 — 새 단계 정체 기준 제거
delete from public.stage_stagnation_config
 where stage = '계약금입금완료';

-- ② 취소 — 폐지 단계 정체 기준 복원(원래 값: threshold_days=7, enabled=false 로 복원)
insert into public.stage_stagnation_config (stage, threshold_days, enabled, updated_at)
values ('스크립트 전달 완료', 7, false, now())
on conflict (stage) do nothing;

-- ① 취소 — 매핑 규칙 복원 (원래 값: agency_group='*', status_value='스크립트 전달 완료', updated_by='system')
insert into public.status_stage_map (agency_group, status_value, stage, updated_by)
values ('*', '스크립트 전달 완료', '스크립트 전달 완료', 'system');

commit;
