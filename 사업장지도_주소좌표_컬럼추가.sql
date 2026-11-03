-- =====================================================================
-- 사업장 지도 — 상세 주소 + 좌표(지도 마커용)
-- 대상 테이블: public.companies (기존 테이블에 컬럼 6개 추가 · 새 테이블 0개)
-- 실행: node scripts/run-sql.js 사업장지도_주소좌표_컬럼추가.sql
-- 되돌리기: 사업장지도_주소좌표_컬럼추가_rollback.sql · 검증: 사업장지도_주소좌표_컬럼추가_검증.sql
--
-- 왜: 지금은 시트지·붙여넣기에서 주소를 읽어도 region("경기_수원")만 남기고 상세 주소는 버린다.
--     지도에 업체별 마커를 찍으려면 상세 주소와 좌표가 있어야 한다.
--   · address   — 사업장 상세 주소 원문(도로명/지번)
--   · geo_lat / geo_lng — 좌표(WGS84). 화면에서 /api/geocode 로 받아 저장한다
--   · geo_level — 'address'(상세 주소로 찍음) / 'region'(주소가 없어 지역 중심으로 대략 찍음)
--   · geo_query — 좌표를 받을 때 쓴 문자열. 주소·지역이 바뀌면 이 값과 달라져 다시 받는다
--   · geo_at    — 좌표를 받은 시각
--
-- ⚠️ 기존 행은 하나도 안 바뀐다 — 전부 NULL 허용, 기본값 없음.
-- ⚠️ 멱등 — 여러 번 실행해도 안전하다(add column if not exists / 제약은 drop 후 add).
-- =====================================================================

alter table public.companies add column if not exists address   text;
alter table public.companies add column if not exists geo_lat   double precision;
alter table public.companies add column if not exists geo_lng   double precision;
alter table public.companies add column if not exists geo_level text;
alter table public.companies add column if not exists geo_query text;
alter table public.companies add column if not exists geo_at    timestamptz;

alter table public.companies drop constraint if exists companies_geo_level_chk;
alter table public.companies add constraint companies_geo_level_chk
  check (geo_level is null or geo_level in ('address', 'region'));

-- 대한민국 범위 밖 좌표(오타·해외 결과)는 받지 않는다. 위도·경도는 둘 다 있거나 둘 다 없어야 한다.
alter table public.companies drop constraint if exists companies_geo_range_chk;
alter table public.companies add constraint companies_geo_range_chk
  check ((geo_lat is null and geo_lng is null)
      or (geo_lat between 32.5 and 39.5 and geo_lng between 123.5 and 132.5));

comment on column public.companies.address   is '사업장 상세 주소 원문 — 지도 마커 좌표의 원본';
comment on column public.companies.geo_lat   is '사업장 위도(WGS84) — /api/geocode 결과';
comment on column public.companies.geo_lng   is '사업장 경도(WGS84) — /api/geocode 결과';
comment on column public.companies.geo_level is 'address=상세 주소 좌표 / region=지역 중심 대략 좌표';
comment on column public.companies.geo_query is '좌표를 받을 때 쓴 문자열 — 주소·지역이 바뀌면 다시 받는 판단 기준';
comment on column public.companies.geo_at    is '좌표를 받은 시각';
