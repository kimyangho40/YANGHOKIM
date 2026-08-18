-- [읽기 전용] STEP2 "계약금입금완료" 제거 전 영향 조사 (2026-08-18)
-- 아무것도 수정하지 않는다. UNION ALL 한 방으로 뽑는 이유: run-sql.js 는 결과를 하나만 출력한다.
select 1 as 순, '① pipeline_cards.stage = 계약금입금완료 (보드에 살아있는 카드)' as 항목,
       (select count(*)::text from public.pipeline_cards where stage = '계약금입금완료' and deleted_at is null) as 값
union all select 2, '② pipeline_cards.stage = 계약금입금완료 (휴지통 포함 전체)',
       (select count(*)::text from public.pipeline_cards where stage = '계약금입금완료')
union all select 3, '③ companies.stage = 계약금입금완료 (살아있는 기업)',
       (select count(*)::text from public.companies where stage = '계약금입금완료' and deleted_at is null)
union all select 4, '④ companies.stage = 계약금입금완료 (삭제분 포함 전체)',
       (select count(*)::text from public.companies where stage = '계약금입금완료')
union all select 5, '⑤ agency_cases.status = 계약금입금완료 (기관현황 원본)',
       (select count(*)::text from public.agency_cases where status = '계약금입금완료')
union all select 6, '⑥ status_stage_map 에서 이 단계로 보내는 규칙',
       (select coalesce(string_agg(coalesce(agency_group,'*') || ' / ' || status_value, ' , '), '(없음)')
          from public.status_stage_map where stage = '계약금입금완료')
union all select 7, '⑦ stage_stagnation_config 이 단계 행',
       (select coalesce((select threshold_days::text || '일 · enabled=' || enabled::text
          from public.stage_stagnation_config where stage = '계약금입금완료'), '(없음)'))
union all select 8, '⑧ [정산 트리거] companies.contract_status = 계약금입금완료 인 업체',
       (select count(*)::text from public.companies where contract_status = '계약금입금완료' and deleted_at is null)
union all select 9, '⑨ pipeline_cards 의 CHECK 제약 (stage 값을 제한하는지)',
       (select coalesce(string_agg(conname, ', '), '(없음)') from pg_constraint
         where conrelid = 'public.pipeline_cards'::regclass and contype = 'c')
union all select 10, '⑩ companies 의 CHECK 제약',
       (select coalesce(string_agg(conname, ', '), '(없음)') from pg_constraint
         where conrelid = 'public.companies'::regclass and contype = 'c')
union all select 11, '⑪ 참고 — 살아있는 pipeline_cards 총수',
       (select count(*)::text from public.pipeline_cards where deleted_at is null)
order by 1;
