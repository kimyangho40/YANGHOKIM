-- 정체 알림 첫 물결 억제 — 2026-08-09
--
-- 배경: stage_stagnation_config 한글 깨짐을 복구(정체기준_config_문자깨짐_복구.sql)하면서
--       그동안 죽어 있던 정체 판정이 되살아났다. 그대로 두면 다음 로그인 때
--       "내 담당 정체 카드" 알림이 미알림 카드 37건에 대해 업무노트를 한꺼번에 자동 생성한다.
-- 조치: 지금 이미 기준을 넘긴 카드에 alerted_at 을 찍어 첫 물결만 건너뛴다.
--       (App.js stagnRows 알림은 alerted_at 이 null 인 카드만 대상으로 한다 — 멱등 처리)
--       정체 목록·대시보드 위젯·파이프라인 뱃지는 alerted_at 과 무관하므로 전부 그대로 보인다.
--       카드 단계가 바뀌면 App.js 가 alerted_at 을 null 로 리셋하므로, 앞으로 새로 정체되는 건은 정상 알림.

update public.pipeline_cards p
   set alerted_at = now()
  from public.stage_stagnation_config c
 where c.stage = p.stage
   and c.enabled
   and p.alerted_at is null
   and p.agency_group is not null
   and p.closed_at is null
   and p.hold_reason is null
   and floor(extract(epoch from (now() - p.stage_changed_at))/86400)::int >= c.threshold_days;

select count(*) as 남은_미알림_정체카드
  from public.pipeline_cards p
  join public.stage_stagnation_config c on c.stage = p.stage and c.enabled
 where p.alerted_at is null and p.agency_group is not null and p.closed_at is null and p.hold_reason is null
   and floor(extract(epoch from (now() - p.stage_changed_at))/86400)::int >= c.threshold_days;
