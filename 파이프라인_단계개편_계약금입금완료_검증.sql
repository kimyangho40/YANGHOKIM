-- 검증 — 조치 후 별도로 실행할 것.
-- ⚠ scripts/run-sql.js 는 결과를 하나만 출력하고 그게 마지막 쿼리가 아닐 수 있다.
--    그래서 한 방에 판정되도록 단일 SELECT 로 만들었다. 모든 항목이 'OK' 여야 정상.

select
  case when (select count(*) from public.status_stage_map where stage = '스크립트 전달 완료') = 0
       then 'OK' else 'FAIL' end                                    as "① 폐지단계_매핑규칙_0건",
  case when (select count(*) from public.stage_stagnation_config where stage = '스크립트 전달 완료') = 0
       then 'OK' else 'FAIL' end                                    as "② 폐지단계_정체기준_0건",
  case when (select count(*) from public.stage_stagnation_config where stage = '계약금입금완료') = 1
       then 'OK' else 'FAIL' end                                    as "③ 신규단계_정체기준_1건",
  case when (select count(*) from public.companies
              where stage = '스크립트 전달 완료' and deleted_at is null) = 0
       then 'OK' else 'FAIL' end                                    as "④ 기업_폐지단계_0건",
  case when (select count(*) from public.pipeline_cards where stage = '스크립트 전달 완료') = 0
       then 'OK' else 'FAIL' end                                    as "⑤ 카드_폐지단계_0건",
  -- 나머지 단계의 카드 수가 그대로인지 (개편 전 열린 카드 합계 = 792)
  (select count(*) from public.pipeline_cards where closed_at is null)::text
                                                                    as "⑥ 열린카드_총수(개편전 792)",
  -- 남은 매핑 규칙이 전부 살아있는 단계를 가리키는지
  case when (select count(*) from public.status_stage_map
              where stage not in ('상담/진단완료','계약금입금완료','필수서류 및 인증서요청',
                                  '기관신청대기/방문예정','기관신청완료/방문완료','심사중/실태조사대기',
                                  '실태조사완료/약정완료','자금집행완료','수수료대기 및 입금요청',
                                  '입금완료/사후관리','부결/반려','기타')) = 0
       then 'OK' else 'FAIL' end                                    as "⑦ 매핑규칙_전부_유효단계";
