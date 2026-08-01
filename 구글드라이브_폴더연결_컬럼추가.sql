-- ════════════════════════════════════════════════════════════════════════
-- 📂 업체별 구글 드라이브 폴더 연결 — companies.drive_folder_id 추가
--    실행: node scripts/run-sql.js 구글드라이브_폴더연결_컬럼추가.sql
--    멱등(여러 번 실행해도 안전).
--
-- 왜 새 테이블이 아니라 기존 컬럼인가:
--   새 테이블을 만들면 RLS·정책·anon GRANT 회수를 새로 챙겨야 하고(CLAUDE.md 2-2절),
--   그만큼 구멍이 생길 자리가 하나 늘어난다. companies 는 이미
--   p_companies_all = using(is_approved()) / with check(is_approved()) 단일 정책이라
--   컬럼을 붙이면 **승인된 로그인 사용자만 접근**이라는 기존 보호를 그대로 물려받는다.
--   → 이번 작업은 RLS 표면을 전혀 늘리지 않는다.
--
-- 저장하는 값: 드라이브 폴더 ID 문자열(예: 15noP_C-r-ZTo56xGbjUWFv2gAKDzXMJa).
--   토큰·비밀값이 아니다. 폴더 ID 만으로는 접근 권한이 생기지 않는다
--   (실제 열람은 각 직원의 구글 계정 OAuth 권한으로만 가능).
--
-- ⚠️ google_oauth_tokens 는 이번 작업에서 **건드리지 않는다**.
--    브라우저 OAuth 방식이라 서버에 refresh token 을 저장할 이유가 없다.
--    2026-07-27 사고로 잠근 상태(RLS on + 정책 0개)를 그대로 유지한다.
-- ════════════════════════════════════════════════════════════════════════

alter table public.companies
  add column if not exists drive_folder_id text;

comment on column public.companies.drive_folder_id is
  '이 업체의 구글 드라이브 폴더 ID. 열람은 각 사용자의 OAuth 권한으로만 가능(서버에 토큰 저장 안 함).';

-- ── 확인 ────────────────────────────────────────────────────────────────
-- [1] 컬럼 생성 확인 (1행이어야 정상)
select column_name, data_type, is_nullable
  from information_schema.columns
 where table_schema = 'public' and table_name = 'companies' and column_name = 'drive_folder_id';

-- [2] companies 정책이 여전히 is_approved() 하나인지 (느슨한 정책이 끼어들지 않았는지)
select policyname, roles, cmd, qual as "using", with_check
  from pg_policies where schemaname = 'public' and tablename = 'companies';

-- [3] google_oauth_tokens 가 잠긴 채로인지 재확인 — policy_count 0 / rls true 여야 정상
select (select count(*) from pg_policies
         where schemaname='public' and tablename='google_oauth_tokens') as policy_count,
       (select relrowsecurity from pg_class
         where relnamespace='public'::regnamespace and relname='google_oauth_tokens') as rls_enabled,
       (select count(*) from public.google_oauth_tokens) as token_rows;
