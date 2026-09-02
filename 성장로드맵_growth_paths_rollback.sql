-- 성장 로드맵 되돌리기 — 성장로드맵_growth_paths.sql 의 역방향
--
-- ⚠️ 이 파일은 **테이블 2개를 통째로 지운다.** 둘 다 이번에 새로 만든 읽기 전용 참조
--    테이블이라 다른 테이블이 참조하지 않고(FK 0건), 앱에서 이 둘에 쓰는 코드도 없다.
--    그래도 실행 전에 아래 확인 쿼리로 "정말 이번에 만든 것뿐인지" 한 번 보고 돌릴 것.
--
-- ⚠️ 화면(src/pages/GrowthRoadmap.jsx)과 한 쌍이다. SQL 만 되돌리면 메뉴는 남고
--    화면이 "불러오는 중…" 뒤 빈 목록이 된다. 되돌릴 거면 App.js 의 3줄도 같이 뺄 것.

-- ── 확인용 (지우기 전에 눈으로) ─────────────────────────────────────────────
-- select count(*) from public.growth_paths;          -- 16 이면 시드 그대로
-- select count(*) from public.growth_roadmap_copy;   -- 1

drop table if exists public.growth_paths;
drop table if exists public.growth_roadmap_copy;

-- 정책·인덱스·GRANT 는 테이블과 함께 사라진다(별도 drop 불필요).
