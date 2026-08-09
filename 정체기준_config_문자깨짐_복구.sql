-- 정체 기준표(stage_stagnation_config) 한글 깨짐 복구 — 2026-08-09
--
-- 증상: stage 컬럼 14행 전부가 U+FFFD(efbfbd) 범벅이라 pipeline_cards.stage 와 하나도 매칭되지 않았다.
--       App.js stagnRows 는 cfgMap[card.stage] 로 찾으므로 → 항상 [] → 정체 알림·대시보드 위젯·
--       파이프라인 정체 뱃지가 전부 0건으로 죽어 있었다(기능이 있는 줄 알았는데 한 번도 안 떴음).
-- 원인: 파이프라인_기관연동_작업/20_stagnation_schema.sql 의 시드를 넣을 때 인코딩이 깨진 채 들어감.
--       파일 자체는 UTF-8 로 정상이므로 같은 값을 다시 넣으면 된다.
-- 영향: 데이터만 교체(스키마 변경 없음). 깨진 행은 어떤 stage 와도 매칭되지 않으므로 삭제해도 안전.

begin;

-- 1) 깨진 행 제거 — STAGES 12종 어디에도 해당하지 않는 행만
delete from public.stage_stagnation_config
 where stage not in (
   '상담/진단완료','필수서류 및 인증서요청','기관신청대기/방문예정','스크립트 전달 완료',
   '기관신청완료/방문완료','심사중/실태조사대기','실태조사완료/약정완료','자금집행완료',
   '수수료대기 및 입금요청','입금완료/사후관리','추가 진행 예정','추가 진행 중','부결/반려','기타'
 );

-- 2) 원래 시드값 그대로 재삽입 (20_stagnation_schema.sql 과 동일)
insert into public.stage_stagnation_config (stage, threshold_days, enabled) values
  ('상담/진단완료',           7, false),
  ('필수서류 및 인증서요청',  5, true),
  ('기관신청대기/방문예정',   2, true),
  ('스크립트 전달 완료',      3, true),
  ('기관신청완료/방문완료',   7, false),
  ('심사중/실태조사대기',    14, false),
  ('실태조사완료/약정완료',   7, false),
  ('자금집행완료',            7, false),
  ('수수료대기 및 입금요청',  5, false),
  ('입금완료/사후관리',      30, false),
  ('추가 진행 예정',          7, false),
  ('추가 진행 중',            7, false),
  ('부결/반려',              99, false),
  ('기타',                   99, false)
on conflict (stage) do update
  set threshold_days = excluded.threshold_days,
      enabled        = excluded.enabled,
      updated_at     = now();

commit;

-- 검증(이 파일 실행 후 별도로 다시 조회할 것 — run-sql.js 는 마지막 SELECT 하나만 출력한다)
select stage, threshold_days, enabled from public.stage_stagnation_config order by enabled desc, stage;
