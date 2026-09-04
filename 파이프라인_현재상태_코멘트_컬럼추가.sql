-- 파이프라인 카드 「현재 상태」 코멘트 (2026-09-04)
--   설계서: docs/superpowers/specs/2026-09-04-pipeline-comment-design.md
--   계획서: docs/superpowers/plans/2026-09-04-pipeline-comment.md
--
-- 기존 테이블 companies 에 컬럼만 더한다. 새 테이블이 아니므로
-- RLS 정책·트리거·GRANT 는 이미 붙어 있는 것이 그대로 적용된다(CLAUDE.md 2-2).
--   · status_comment    — 사람이 직접 쓴 "현재 상태" 문구. null/공백이면 자동표시로 돌아간다.
--   · status_comment_at — 언제 썼나 (자동표시 줄이 날짜를 달고 나오므로 수동 문구에도 필요)
--   · status_comment_by — 누가 썼나
--
-- ⚠️ companies.issue(현재 이슈)와 다른 칸이다. issue 는 2026-09-04 실측으로
--    카드 있는 기업 401개 중 237개에 이미 평균 68자(최대 786자)가 들어 있어,
--    재사용하면 켜는 즉시 카드 237장이 기존 장문으로 덮인다.
alter table public.companies
  add column if not exists status_comment    text,
  add column if not exists status_comment_at timestamptz,
  add column if not exists status_comment_by text;

comment on column public.companies.status_comment    is '파이프라인 카드 「현재 상태」 수동 문구. 비어 있으면 최신 소통내역·업무노트 태그를 자동표시한다.';
comment on column public.companies.status_comment_at is '「현재 상태」 문구를 마지막으로 저장한 시각';
comment on column public.companies.status_comment_by is '「현재 상태」 문구를 마지막으로 저장한 사람 이름';
