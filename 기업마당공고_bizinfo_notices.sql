-- 기업마당 지원사업 공고 · bizinfo_notices (읽기 전용 참조 테이블, 2026-10-08)
-- 짝: App.js ⛳ 공고매칭 (matchNotices) · 기업상세 「📢 지원사업」 탭
-- 되돌리기: 기업마당공고_bizinfo_notices_rollback.sql / 검증: 기업마당공고_bizinfo_notices_검증.sql
-- 재실행 안전(if not exists · drop policy 후 재생성). 기존 테이블 변경 0건.
--
-- 채우는 쪽: 저장소 밖 매칭 도구(공고 수집 → 공고문 판독 → 요건 추출)가 Management API 로 upsert 한다.
--   ⚠️ 앱 사용자는 쓰기 권한이 없다(읽기 전용) — 공고 원본은 기업마당이고 이 테이블은 거울이다.
-- 요건(req)은 공고문을 AI 로 읽어 뽑은 값이라 **틀릴 수 있다.** 화면에 원문 링크를 항상 같이 띄운다.
--
-- ⚠️ 이 테이블엔 created_at·id 가 없다(PK = pblanc_id). fetchAllRows 로 읽을 때 반드시
--    orderBy:"pblanc_id", tieBreak:null 을 줄 것(2026-09-28 정산권한 사고와 같은 함정).

create table if not exists public.bizinfo_notices (
  pblanc_id     text primary key,               -- 기업마당 공고 ID (PBLN_...)
  title         text not null,
  url           text not null default '',
  agency        text not null default '',       -- 소관기관
  category      text not null default '',       -- 기업마당 분야(금융·경영·기술…)
  deadline      date,                           -- 신청 마감일(모르면 NULL — 예산 소진 시 등)
  deadline_text text not null default '',
  req           jsonb not null default '{}'::jsonb,  -- 정규화된 자격요건(App.js matchNotices 가 읽는 형식)
  updated_at    timestamptz not null default now()
);
create index if not exists bizinfo_notices_deadline_idx on public.bizinfo_notices (deadline);

-- ── 보안 (CLAUDE.md 2-2) ─────────────────────────────────────────────
alter table public.bizinfo_notices enable row level security;

drop policy if exists "bizinfo_notices read approved" on public.bizinfo_notices;
create policy "bizinfo_notices read approved"
  on public.bizinfo_notices for select to authenticated
  using (public.is_approved());

grant select on public.bizinfo_notices to authenticated;
revoke all on public.bizinfo_notices from anon;
revoke truncate, references, trigger on public.bizinfo_notices from authenticated, anon;
-- 읽기 전용 — 쓰기 권한도 회수(기본권한 authenticated=arwdm 으로 자동으로 붙는다)
revoke insert, update, delete on public.bizinfo_notices from authenticated;

comment on table public.bizinfo_notices is '기업마당 지원사업 공고 + AI 추출 자격요건(읽기 전용 거울). 매칭은 App.js matchNotices';
