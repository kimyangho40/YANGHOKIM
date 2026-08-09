-- 서류 요청 방치 알림 — companies.doc_alert_state 컬럼 추가 + 묵은 건 일괄 봉인 (2026-08-10)
--
-- 배경: 서류 "요청함" 상태의 방치 감지(D+3)는 이미 있었다(대시보드 2곳 + 서류현황 탭).
--   그런데 요청함 74건이 전부 D+3 초과(가장 최근 요청일이 2026-08-07), 53건(72%)이 15일 이상이라
--   화면이 통째로 빨간불이었고, 그래서 아무도 보지 않았다.
--
--   ⚠️ 실행 결과 68건이 아니라 74건이 봉인됐다. 조사 때 쓴 DB current_date 는 UTC(2026-08-09)라
--      "D+3 이상 = 68건"으로 나왔지만, 화면(docWaitDays)은 브라우저 KST(2026-08-10) 기준이라
--      2026-08-07 요청분 6건도 이미 3일째다. 화면 기준으로는 74건 전부가 방치라 전부 봉인이 맞다.
--      → 앞으로 이 컬럼을 다루는 SQL 은 current_date 를 쓰지 말고 날짜를 고정할 것(KST/UTC 하루 차이).
--   2026-08-09 정체일수(stagnant_days) 교체를 396건 중 388건 빨간불이라 중단했던 것과 같은 상황.
--
-- 조치 두 가지
--   ① 묵은 건을 한 번 봉인한다(이 파일). 지금 쌓인 것은 "묵은 서류 정리" 화면에서 한 번에 정리하고,
--      오늘 이후 새로 방치되는 것부터 알림이 울린다. → 2026-08-09 정체알림_초기물결_억제.sql 과 같은 방식.
--   ② 요청함을 끝내는 길을 만든다(App.js). 예전에는 미요청 → 요청함 → 수령완료 한 방향으로만 돌아서
--      "업체가 안 줌 · 취소"를 표현할 수 없었다. 그래서 못 받은 서류가 영원히 요청함에 남았다.
--      → 방치 칩에 [재요청함(오늘 날짜로 리셋)] · [요청 취소] 를 추가했다.
--
-- 담은 값 (서류명 → 알림 상태)
--   {
--     "최근 3년치 재무제표": { "step": 14, "at": "2026-08-10", "old": true }
--   }
--     step : 마지막으로 알린 단계(3 · 7 · 14). 같은 단계로 두 번 알리지 않기 위한 멱등 키.
--     old  : 묵은 건(봉인). 알림 대상에서 빠지고 "묵은 서류 정리" 화면에만 나온다.
--            화면 목록·칩에는 그대로 보인다 — 숨기는 게 아니라 알림만 안 울린다.
--
-- 왜 새 테이블이 아니라 companies 의 jsonb 한 칸인가
--   · companies 는 이미 RLS 정책이 있어 이 컬럼에 그대로 적용된다 → 추가 보안 조치가 없다(CLAUDE.md 2-2).
--   · 짝이 되는 doc_request_dates 가 이미 companies 에 있어 조인 없이 같이 읽힌다.
--   · 서류당 "최신 상태 1건"만 쓰고 이력을 보지 않는다.
--
-- ⚠️ doc_scan 과 달리 이 컬럼은 App.js 저장 화이트리스트(allFields)에 넣었다.
--    doc_request_dates 와 반드시 함께 움직여야 하기 때문이다 — 두 컬럼을 다른 저장 경로로 나누면
--    "요청일은 오늘로 리셋됐는데 봉인은 안 풀린" 상태가 생겨 그 서류가 영영 알림을 안 탄다.
--
-- 되돌리기: 서류방치알림_doc_alert_state_컬럼추가_rollback.sql

begin;

alter table public.companies
  add column if not exists doc_alert_state jsonb;

comment on column public.companies.doc_alert_state is
  '서류 요청 방치 알림 상태(서류명 → {step, at, old}). step=마지막 알림 단계(3/7/14) 멱등 키, old=묵은 건 봉인. doc_request_dates 와 항상 같이 저장한다.';

-- ── 묵은 건 일괄 봉인 ────────────────────────────────────────────────────────
-- 기준일을 2026-08-10 으로 고정한 이유: 이 파일을 나중에 다시 실행해도
-- 그 뒤에 새로 방치된 건까지 봉인해 버리지 않게 하기 위함(재실행 안전).
with req as (
  select c.id,
         trim(both from x) as doc,
         (c.doc_request_dates ->> trim(both from x))::date as req_date
    from public.companies c
    cross join lateral unnest(string_to_array(coalesce(c.requested_docs, ''), ',')) as x
   where c.deleted_at is null
     and trim(both from x) <> ''
     and (c.doc_request_dates ->> trim(both from x)) is not null
     -- 이미 수령완료된 서류는 방치가 아니다(요청함·수령완료 양쪽에 이름이 남은 행 방어)
     and (', ' || coalesce(c.received_docs, '') || ', ') not like ('%, ' || trim(both from x) || ', %')
),
stale as (
  select id, doc
    from req
   where req_date <= date '2026-08-10' - 3    -- D+3 이상 = 지금 이미 방치인 것만
),
agg as (
  select id,
         jsonb_object_agg(doc, jsonb_build_object('step', 14, 'at', '2026-08-10', 'old', true)) as st
    from stale
   group by id
)
update public.companies c
   set doc_alert_state = coalesce(c.doc_alert_state, '{}'::jsonb) || a.st
  from agg a
 where c.id = a.id;

commit;

-- ── 검증 ─────────────────────────────────────────────────────────────────────
-- ⚠️ run-sql.js 는 결과를 하나만 출력하고 그게 마지막 검증 쿼리가 아닐 수 있다.
--    실행 후 반드시 아래를 따로 다시 조회할 것(CLAUDE.md).
--
--   with req as (
--     select c.id, trim(both from x) as doc,
--            (c.doc_request_dates ->> trim(both from x))::date as req_date,
--            (c.doc_alert_state -> trim(both from x) ->> 'old')::boolean as sealed
--       from public.companies c
--       cross join lateral unnest(string_to_array(coalesce(c.requested_docs,''), ',')) as x
--      where c.deleted_at is null and trim(both from x) <> ''
--        and (c.doc_request_dates ->> trim(both from x)) is not null
--        and (', ' || coalesce(c.received_docs,'') || ', ') not like ('%, ' || trim(both from x) || ', %')
--   )
--   select count(*) filter (where sealed)                             as 봉인됨,        -- 68 이어야 정상
--          count(*) filter (where sealed is not true
--                             and current_date - req_date >= 3)       as 안봉인된_방치, -- 0 이어야 정상
--          count(*) filter (where sealed is not true)                 as 살아있는_요청   -- 6 (0~2일 건)
--     from req;

select count(*) as 봉인된_서류수
  from public.companies c
  cross join lateral jsonb_each(coalesce(c.doc_alert_state, '{}'::jsonb)) as e(k, v)
 where c.deleted_at is null
   and (v ->> 'old')::boolean is true;
