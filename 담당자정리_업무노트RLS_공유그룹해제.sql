-- 📓 업무노트 열람 공유 그룹 해제 — App.js 의 WN_SHARE_GROUPS 와 한 쌍인 SQL 함수를 맞춘다.
--   원본: 업무노트_개인노트_비공개_RLS.sql 의 public.wn_visible_names()
--   2026-08-17: 미현·인선이 담당자 명단에서 빠져 공유 그룹(미현↔인선)이 없어졌다.
--               → App.js 는 WN_SHARE_GROUPS = [] 로 비웠고, 여기도 같은 상태로 맞춘다.
--   양호(전원 열람)는 wn_is_admin() 쪽이라 여기서 건드리지 않는다.
--   함수 본문만 교체 — 정책(policy)은 손대지 않는다.
-- 실행: node scripts/run-sql.js 담당자정리_업무노트RLS_공유그룹해제.sql
begin;

create or replace function public.wn_visible_names()
returns text[]
language sql stable security definer set search_path = public
as $$
  select case
    when public.wn_my_name() is null then array[]::text[]
    else array[public.wn_my_name()]
  end;
$$;

commit;

-- ✅ 검증 — 함수 정의에 '미현'/'인선' 이 남아있지 않아야 한다(0행이 정상).
select p.proname, pg_get_functiondef(p.oid) as def
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname = 'wn_visible_names'
  and pg_get_functiondef(p.oid) ~ '(미현|인선)';
