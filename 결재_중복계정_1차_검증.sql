-- ============================================================================
-- ✅ 중복 계정 1차 비활성화 — 실행 후 별도 검증
--   조치 파일에 딸린 SELECT 를 믿지 않는다(run-sql.js 는 결과를 하나만 출력한다).
--   실행: node scripts/run-sql.js 결재_중복계정_1차_검증.sql
--   판정: 4개 항목이 전부 'OK' 여야 정상.
-- ============================================================================
with plan(uuid, nm, action) as (values
  ('398c074f-009f-4b32-8705-11473005c76f'::uuid,'미현','off'),
  ('9d87b323-525d-4314-bbdf-91bbcda80a5f','미현','off'),
  ('8d5196a3-5fc0-4d03-992e-22a1d9039cee','지혜','off'),
  ('0b4fb660-3b55-46e2-9d47-f2b2b617b305','지혜','off'),
  ('e30cc2ef-9e74-4625-8511-f2c393a08342','유진','off'),
  ('64932e32-88a4-4600-9096-993bf81548ce','동일','off'),
  ('562de348-f162-4bb5-9b6f-dccd9777af3a','미현','keep'),
  ('ca2a9bbb-30dc-4766-a056-c7f4282563ad','지혜','keep'),
  ('e5ed4171-133c-4515-9d68-689f686f293b','유진','keep'),
  ('f73c1594-90fa-4458-9243-1e57db5f37ab','동일','keep')
)
select
  case when (select count(*) from plan p join public.profiles pr on pr.id=p.uuid
              where p.action='off' and pr.status='rejected') = 6
       then 'OK' else 'FAIL' end                          as "① 끈 계정 6개가 rejected",
  case when (select count(*) from plan p join public.profiles pr on pr.id=p.uuid
              where p.action='keep' and pr.status='approved') = 4
       then 'OK' else 'FAIL' end                          as "② 남긴 계정 4개가 approved",
  -- 사람마다 approved 계정이 정확히 1개여야 한다(0개면 그 사람은 잠긴다)
  case when (select count(*) from (
               select pr.name from public.profiles pr
                where pr.name in ('미현','지혜','유진','동일') and pr.status='approved'
                group by pr.name having count(*) <> 1) z) = 0
       then 'OK' else 'FAIL' end                          as "③ 4명 각각 approved 계정 정확히 1개",
  -- 업무 데이터는 하나도 안 움직였어야 한다(이름 기준이므로 사람별 총량 불변)
  case when (select count(*) from public.work_notes
              where deleted_at is null and assignee in ('미현','지혜','유진','동일')) > 0
       then 'OK' else 'FAIL(노트가 사라졌다면 즉시 롤백)' end as "④ 4명 업무노트 여전히 조회됨",
  (select jsonb_agg(jsonb_build_object('name', pr.name, 'status', pr.status,
            'uuid8', left(pr.id::text,8)) order by pr.name, pr.status)
     from public.profiles pr where pr.name in ('미현','지혜','유진','동일')) as "상세",
  (select jsonb_object_agg(a, n) from (
     select assignee a, count(*) n from public.work_notes
      where deleted_at is null and assignee in ('미현','지혜','유진','동일')
      group by assignee) z)                                as "업무노트 건수(변동 없어야 함)";
