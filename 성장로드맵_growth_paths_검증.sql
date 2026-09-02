-- 성장 로드맵 검증 — 성장로드맵_growth_paths.sql 실행 뒤 돌린다
--
-- ⚠️ `scripts/run-sql.js` 는 여러 SELECT 가 든 파일을 실행해도 **결과를 하나만** 출력하고,
--    그게 파일 마지막 쿼리가 아닐 수 있다(CLAUDE.md 2-2).
--    → **한 번에 하나씩만 주석을 풀어서** 돌릴 것.
--
-- 기대값
--  ① RLS 꺼진 테이블      → 0행
--  ② anon GRANT           → 0행
--  ③ 위험권한(TRUNCATE 등) → 0행
--  ④ 정책                 → 2행, 둘 다 qual 에 is_approved()
--  ⑤ 시드 건수            → 16 / copy 1
--  ⑥ source 분포          → video 12 · authored 4
--  ⑦ authored 목록        → id 5·7·9·10

-- ① RLS 안 켜진 public 테이블 (0행이어야 정상 — 이 두 개만 보는 게 아니라 전체를 본다)
select c.relname from pg_class c
 where c.relnamespace = 'public'::regnamespace and c.relkind = 'r' and c.relrowsecurity = false;

-- ② anon 에 남은 권한 (0행)
-- select table_name, privilege_type, grantor from information_schema.role_table_grants
--  where table_schema = 'public' and grantee = 'anon'
--    and table_name in ('growth_paths','growth_roadmap_copy');

-- ③ authenticated 에 남은 위험 권한 (0행) — SELECT 만 남아야 한다
-- select table_name, privilege_type from information_schema.role_table_grants
--  where table_schema = 'public' and grantee = 'authenticated'
--    and table_name in ('growth_paths','growth_roadmap_copy')
--    and privilege_type not in ('SELECT');

-- ④ 정책 (2행, qual 에 is_approved)
-- select tablename, policyname, roles::text, cmd, qual
--   from pg_policies where schemaname = 'public'
--    and tablename in ('growth_paths','growth_roadmap_copy') order by tablename;

-- ⑤ 건수
-- select (select count(*) from public.growth_paths)        as paths,
--        (select count(*) from public.growth_paths where is_active) as active,
--        (select count(*) from public.growth_roadmap_copy) as copy_rows;

-- ⑥ source 분포
-- select source, count(*) from public.growth_paths group by source order by source;

-- ⑦ authored(원문 대조 필요) 목록 — 화면 ⚠미검증 배지와 대조할 기준
-- select id, industry, from_stage, to_stage, prep
--   from public.growth_paths where source <> 'video' order by id;
