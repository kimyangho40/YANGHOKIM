-- =====================================================================
-- 기업 입력칸 보강 — 대표자 생년월일·성별 · 사업자등록증 개수 · 과거 폐업 이력 · 보유 인증
-- 대상 테이블: public.companies (기존 테이블에 컬럼 5개 추가 · 새 테이블 0개)
-- 실행: node scripts/run-sql.js 기업입력칸_보강_컬럼추가.sql
-- 되돌리기: 기업입력칸_보강_컬럼추가_rollback.sql · 검증: 기업입력칸_보강_컬럼추가_검증.sql
--
-- 왜: 추천·한도·질문 자동화(기관 추천 4칸, 입력 모순 감지, 기업마당 공고 매칭)가
--     나이(청년 여부)·여성 대표·사업자 개수·폐업 이력·인증 보유를 판정 재료로 쓴다.
--     지금은 company_info 자유 텍스트에만 있어 기계가 읽을 수 없다.
--
-- ⚠️ 기존 행은 하나도 안 바뀐다 — 전부 NULL 허용(인증만 빈 배열 기본값).
--    "모름"과 "아니오"를 구분해야 해서 boolean 도 기본값을 두지 않았다.
-- ⚠️ 멱등 — 여러 번 실행해도 안전하다(add column if not exists / 제약은 drop 후 add).
-- =====================================================================

alter table public.companies add column if not exists representative_birth date;
alter table public.companies add column if not exists representative_gender text;
alter table public.companies add column if not exists biz_reg_count smallint;
alter table public.companies add column if not exists has_closed_business boolean;
alter table public.companies add column if not exists certifications jsonb not null default '[]'::jsonb;

alter table public.companies drop constraint if exists companies_representative_gender_chk;
alter table public.companies add constraint companies_representative_gender_chk
  check (representative_gender is null or representative_gender in ('남', '여'));

alter table public.companies drop constraint if exists companies_biz_reg_count_chk;
alter table public.companies add constraint companies_biz_reg_count_chk
  check (biz_reg_count is null or (biz_reg_count >= 0 and biz_reg_count <= 20));

alter table public.companies drop constraint if exists companies_certifications_chk;
alter table public.companies add constraint companies_certifications_chk
  check (jsonb_typeof(certifications) = 'array');

alter table public.companies drop constraint if exists companies_representative_birth_chk;
alter table public.companies add constraint companies_representative_birth_chk
  check (representative_birth is null or (representative_birth >= date '1920-01-01' and representative_birth <= date '2015-12-31'));

comment on column public.companies.representative_birth  is '대표자 생년월일 — 만 나이 자동 계산(청년 판정)';
comment on column public.companies.representative_gender is '대표자 성별(남/여) — 여성기업 판정 보조';
comment on column public.companies.biz_reg_count         is '현재 보유 사업자등록증 개수(개인+법인)';
comment on column public.companies.has_closed_business   is '과거 폐업 이력 여부(NULL=모름) — 재도전특별자금·창업기업 판정';
comment on column public.companies.certifications        is '보유 인증 목록(문자열 배열) — App.js CERT_OPTIONS 어휘만 저장';
