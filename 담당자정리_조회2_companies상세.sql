-- 🔍 [읽기 전용] companies.assignee 에 현애·인선·미현 이 걸린 업체 전체 목록
-- assignee 는 "관호, 양호" 처럼 콤마로 여러 명이 들어 있고 "김현애" 같은 옛 표기도 섞여 있다.
--   → 콤마/세미콜론/슬래시로 쪼갠 뒤 별칭을 정규화해서 판정한다.
-- assignee_after = 3명을 뺐을 때 남는 값(원본 표기 그대로 유지). 빈 값이면 담당자가 사라지는 업체.
-- 아무것도 수정하지 않는다.
with raw as (
  select c.id, c.name as company, c.assignee, c.stage, c.status,
         (c.deleted_at is not null) as 삭제됨,
         trim(u.p) as part, u.ord
  from public.companies c,
       lateral unnest(regexp_split_to_array(c.assignee, '\s*[,;/]\s*')) with ordinality as u(p, ord)
  where coalesce(c.assignee, '') <> ''
),
norm as (
  select r.*,
         case r.part
           when '김현애' then '현애'
           when '류인선' then '인선'
           when '곽미현' then '미현'
           when '최지혜' then '지혜'
           when '하유진' then '유진'
           when '김양호' then '양호'
           when '최관호' then '관호'
           when '총무'   then '유진'
           when '총무(유진)' then '유진'
           when '김동일이사' then '동일'
           when '김이사'   then '동일'
           when '동일이사' then '동일'
           when '김동일'   then '동일'
           else r.part
         end as nm
  from raw r
)
select
  id,
  company,
  assignee                                                     as assignee_현재,
  coalesce(
    string_agg(part, ', ' order by ord) filter (where nm not in ('현애','인선','미현')),
    ''
  )                                                            as assignee_제거후,
  string_agg(nm, ', ' order by ord) filter (where nm in ('현애','인선','미현')) as 빠지는사람,
  case
    when count(*) filter (where nm not in ('현애','인선','미현')) = 0
      then '⚠ 담당자 없어짐'
    else '남는 담당자 있음'
  end                                                          as 판정,
  stage,
  status,
  삭제됨
from norm
group by id, company, assignee, stage, status, 삭제됨
having count(*) filter (where nm in ('현애','인선','미현')) > 0
order by 판정, company;
