-- ============================================================================
-- ✅ 검증 — 정산 열람·작성 권한 (settlement_permissions)
--   2026-09-26. 본체: 정산권한_settlement_permissions.sql
--
-- ⚠️ CLAUDE.md 2-2: run-sql.js 는 **마지막 SELECT 하나만** 출력한다.
--    그래서 이 파일은 검사를 UNION ALL 로 묶어 **단 하나의 SELECT** 로 만들었다
--    (한 줄씩 주석 해제할 필요 없음). `judgement` 가 전부 PASS 여야 정상.
--
-- ⚠️ 이 파일은 조치 파일(본체)에 딸린 SELECT 가 아니라 **별도 조회**다 — 그게 규칙이다.
--
-- 실행: node scripts/run-sql.js 정산권한_settlement_permissions_검증.sql
-- ============================================================================

with
-- ── 1) 테이블·RLS ──────────────────────────────────────────────────────────
c1 as (
  select 'RLS 켜져 있는가' as check_name, '1' as expected,
         count(*)::text as actual
    from pg_class c
   where c.relnamespace = 'public'::regnamespace
     and c.relname = 'settlement_permissions' and c.relrowsecurity
),
-- ── 2) 정책 3개(select/insert/update) · delete 정책 없음 ───────────────────
c2 as (
  select '정책 개수(select+insert+update)', '3',
         count(*)::text
    from pg_policies
   where schemaname = 'public' and tablename = 'settlement_permissions'
     and cmd in ('SELECT', 'INSERT', 'UPDATE')
),
c3 as (
  select 'DELETE 정책 없음(삭제 불가)', '0',
         count(*)::text
    from pg_policies
   where schemaname = 'public' and tablename = 'settlement_permissions' and cmd = 'DELETE'
),
c4 as (
  select '쓰기 정책이 전부 is_admin() 기반', '2',
         count(*)::text
    from pg_policies
   where schemaname = 'public' and tablename = 'settlement_permissions'
     and cmd in ('INSERT', 'UPDATE')
     and coalesce(qual, '') || coalesce(with_check, '') like '%is_admin%'
),
c5 as (
  select '읽기 정책이 is_approved() 기반', '1',
         count(*)::text
    from pg_policies
   where schemaname = 'public' and tablename = 'settlement_permissions'
     and cmd = 'SELECT' and coalesce(qual, '') like '%is_approved%'
),
-- ── 3) GRANT — anon 0건, authenticated 는 select/insert/update 3개만 ───────
c6 as (
  select 'anon GRANT 0건', '0',
         count(*)::text
    from information_schema.role_table_grants
   where table_schema = 'public' and table_name = 'settlement_permissions' and grantee = 'anon'
),
c7 as (
  select 'authenticated GRANT = SELECT/INSERT/UPDATE 뿐', 'SELECT,INSERT,UPDATE',
         coalesce(string_agg(privilege_type, ',' order by
           case privilege_type when 'SELECT' then 1 when 'INSERT' then 2
                               when 'UPDATE' then 3 else 9 end), '(없음)')
    from information_schema.role_table_grants
   where table_schema = 'public' and table_name = 'settlement_permissions'
     and grantee = 'authenticated'
),
-- ── 4) 트리거 함수 EXECUTE 가 아무에게도 없어야 한다 ───────────────────────
c8 as (
  select '트리거 함수 EXECUTE 부여 0건', '0',
         count(*)::text
    from information_schema.role_routine_grants
   where routine_schema = 'public' and routine_name = 'settlement_perm_guard'
     and grantee in ('anon', 'authenticated', 'PUBLIC')
),
c9 as (
  select '보호 트리거 활성', 'O',
         coalesce(max(t.tgenabled::text), '(없음)')
    from pg_trigger t
   where t.tgrelid = 'public.settlement_permissions'::regclass
     and t.tgname = 'trg_settlement_perm_guard' and not t.tgisinternal
),
-- ── 5) 시드 — 'all' 이 정확히 그 6명이어야 한다 ────────────────────────────
c10 as (
  select 'scope=all 인원', '7', count(*)::text
    from public.settlement_permissions where scope = 'all'
),
c11 as (
  select 'scope=all 명단(가나다순)', '관호,동일,양호,유진,이만나미,정원,지혜',
         coalesce(string_agg(name, ',' order by name), '(없음)')
    from public.settlement_permissions where scope = 'all'
),
c12 as (
  select '전체 행 수(all 7명만 — own 은 행 없음)', '7', count(*)::text
    from public.settlement_permissions
),
-- 옛 SETTLEMENT_ADMINS 4명이 전원 그대로 'all' 인가 = 전체 열람이 줄어든 사람이 없다
c12b as (
  select '옛 SETTLEMENT_ADMINS 4명이 전원 all', '4',
         count(*)::text
    from public.settlement_permissions
   where scope = 'all' and name in ('관호','동일','양호','유진')
),
-- ── 6) 이름 무결성 — profiles 에 실재 + 정규화 표기 ────────────────────────
c13 as (
  select 'profiles(approved) 에 없는 이름', '0', count(*)::text
    from public.settlement_permissions sp
   where not exists (
     select 1 from public.profiles p
      where public.so_normalize_name(p.name) = sp.name and p.status = 'approved')
),
c14 as (
  select '비정규 표기 이름', '0', count(*)::text
    from public.settlement_permissions sp
   where sp.name <> public.so_normalize_name(sp.name)
),
-- ── 7) 🔁 회귀 대조 — 사람별 "보이는 건수"가 의도대로인가 ──────────────────
--     정산 화면에 뜨는 건 = agency_cases(승인·약정·완료·자금집행완료) + settlement_manual
--     · scope='all'  → 전체 352건(총계와 같아야 한다)
--     · scope 없음   → 본인이 assignee 에 들어간 건만 (변경 전과 같아야 한다)
rows_all as (
  select assignee from public.agency_cases
   where deleted_at is null and status in ('승인','약정','완료','자금집행완료')
  union all
  select assignee from public.settlement_manual where deleted_at is null
),
norm as (
  select (select array_agg(public.so_normalize_name(t))
            from unnest(string_to_array(coalesce(assignee, ''), ',')) t
           where btrim(t) <> '') as names
    from rows_all
),
tot as (select count(*) as n from norm),
seen as (
  select p.nm,
         coalesce(sp.scope, 'own') as scope,
         case when coalesce(sp.scope, 'own') = 'all'
              then (select n from tot)
              else (select count(*) from norm n where n.names @> array[p.nm]) end as visible
    from (select distinct public.so_normalize_name(name) as nm
            from public.profiles where status = 'approved') p
    left join public.settlement_permissions sp on sp.name = p.nm
),
c15 as (
  -- distinct 가 2개 이상이면 그 값들이 그대로 찍혀 FAIL 로 보인다(스칼라 서브쿼리 에러 방지)
  select 'all 인 사람은 전건을 본다',
         (select n::text from tot),
         coalesce((select string_agg(v, '/' order by v)
                     from (select distinct visible::text as v from seen where scope = 'all') d),
                  '(없음)')
),
c16 as (
  -- 변경 전 실측(2026-09-26): 인선 7 · 미현 6 · 지혜 5 · 정원 4 · 양호 77 · 동일 76 · 관호 118 · 유진 119
  -- 이 중 own 으로 남는 사람(인선·미현)은 변경 전에도 본인 담당만 봤다 → 값이 그대로여야 한다.
  select 'own 으로 남는 사람의 건수(인선/미현)', '7/6',
         coalesce((select string_agg(visible::text, '/' order by
                     case nm when '인선' then 1 else 2 end)
                     from seen where nm in ('인선','미현')), '(없음)')
),
c17 as (
  select '권한 없는 사람 중 0건인 사람 수(권구현·기랑)', '2',
         (select count(*)::text from seen where scope = 'own' and visible = 0 and nm in ('권구현','기랑'))
),
all_checks as (
  select * from c1  union all select * from c2  union all select * from c3
  union all select * from c4  union all select * from c5  union all select * from c6
  union all select * from c7  union all select * from c8  union all select * from c9
  union all select * from c10 union all select * from c11 union all select * from c12
  union all select * from c12b
  union all select * from c13 union all select * from c14 union all select * from c15
  union all select * from c16 union all select * from c17
)
select check_name, expected, actual,
       case when expected = actual then 'PASS' else '❌ FAIL' end as judgement
  from all_checks
 order by case when expected = actual then 1 else 0 end, check_name;
