-- 서류현황 데이터 소스 일원화 — documents 테이블 → companies.received_docs (2026-08-08)
--
-- 배경: 서류 상태를 저장하는 곳이 두 군데였고 서로 달랐다.
--   · 기업 상세 '서류현황' 탭  → companies.received_docs (쉼표 문자열)  : 156개 기업
--   · 기업 목록의 '서류 N%' 배지 → documents 테이블                      : 41행(살아있는 기업 기준)
--   서류현황 탭의 cycleDoc 은 문자열만 고치고 documents 는 건드리지 않아,
--   documents 는 신규 등록 시 자동 생성된 뒤로 갱신되지 않았다.
--   그 결과 목록 배지가 낡은 값을 보여주고 있었다.
--
-- 결정(2026-08-08): received_docs 문자열을 단일 소스로 삼는다.
--
-- ⚠️ 이 스크립트가 필요한 이유: documents 에만 있는 수령완료가 37건(12개 기업) 있다.
--    코드만 바꾸면 이 12개 기업의 수령 기록이 화면에서 사라진다. 먼저 문자열로 옮긴다.
--
-- documents 테이블은 남겨둔다(삭제하지 않음) — 백업 화면 BACKUP_TABLES 에 들어 있고,
-- 이력이므로 지울 이유가 없다. 앞으로 읽지도 쓰지도 않을 뿐이다.
--
-- 되돌리기: 서류현황_received_docs_일원화_rollback.sql

begin;

-- 이관 전 스냅샷(실행 로그로 남기기 위한 확인용)
select count(*) as 이관대상_행수
  from public.documents d
  join public.companies c on c.id = d.company_id
 where d.received = true
   and c.deleted_at is null
   and (', ' || coalesce(c.received_docs, '') || ', ') not like ('%, ' || d.doc_name || ', %');

with need as (
  select d.company_id, d.doc_name
    from public.documents d
    join public.companies c on c.id = d.company_id
   where d.received = true
     and c.deleted_at is null
     -- 이미 문자열에 있는 것은 제외(중복 추가 방지)
     and (', ' || coalesce(c.received_docs, '') || ', ') not like ('%, ' || d.doc_name || ', %')
),
agg as (
  select company_id, string_agg(doc_name, ', ' order by doc_name) as add_docs
    from need
   group by company_id
)
update public.companies c
   set received_docs = case
         when coalesce(trim(c.received_docs), '') = '' then a.add_docs
         else c.received_docs || ', ' || a.add_docs
       end
  from agg a
 where c.id = a.company_id;

commit;

-- ── 검증 (⚠️ run-sql.js 는 결과를 하나만 출력하므로 아래는 따로 실행해서 확인할 것) ──
-- 0행이어야 정상: documents 에만 있는 수령완료가 남아 있는지
--   select c.name, d.doc_name
--     from public.documents d
--     join public.companies c on c.id = d.company_id
--    where d.received = true and c.deleted_at is null
--      and (', ' || coalesce(c.received_docs,'') || ', ') not like ('%, ' || d.doc_name || ', %');
