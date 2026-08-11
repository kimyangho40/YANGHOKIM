-- ============================================================================
-- 🧹 authenticated/anon 의 TRUNCATE 권한 회수 (2026-08-11)
--
-- 문제: Supabase 기본 GRANT 때문에 `authenticated` 가 public 스키마 34개 중
--       **26개 테이블에 TRUNCATE** 를 갖고 있었다.
--       TRUNCATE 는 **RLS 도, 행 트리거도 우회한다** → 승인된 토큰 하나로
--       기업목록·기관진행·업무노트·채팅을 통째로 비울 수 있다.
--       (방금 만든 trg_team_notes_no_hard_delete 도 TRUNCATE 앞에서는 무력하다.)
--
-- 안전성: PostgREST 에는 TRUNCATE 에 대응하는 HTTP 동작이 아예 없다.
--         앱·`/api/*` 어디서도 쓰지 않는다. Supabase 대시보드의 "Truncate table" 은
--         postgres/dashboard_user 로 돌아가므로 이 회수와 무관하다.
--         service_role 과 postgres 는 건드리지 않는다(관리 작업 유지).
--
-- ⚠️ `revoke` 는 **grantor 가 다르면 에러 없이 아무것도 안 한다.**
--    실측 결과 26건 전부 grantor = postgres 이고 이 스크립트도 postgres 로 도는 것을
--    확인했다(current_user = postgres). 그래도 "성공했으니 회수됐다"고 믿지 말고
--    실행 후 반드시 아래 검증 파일로 카탈로그를 다시 조회할 것. (CLAUDE.md 2-2)
--
-- 실행:   node scripts/run-sql.js authenticated_TRUNCATE_회수.sql
-- 되돌리기: node scripts/run-sql.js authenticated_TRUNCATE_회수_rollback.sql
-- 검증:   node scripts/run-sql.js authenticated_TRUNCATE_회수_검증.sql   (0 이어야 정상)
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1) 지금 있는 테이블에서 회수
-- ---------------------------------------------------------------------------
revoke truncate on all tables in schema public from authenticated;
revoke truncate on all tables in schema public from anon;

-- ---------------------------------------------------------------------------
-- 2) 앞으로 만들 테이블에도 안 붙게 — 기본권한(default privileges) 에서 제거
--    pg_default_acl 을 보면 public 스키마 테이블 기본권한이 `arwdDxtm` 인데
--    여기서 **D 가 TRUNCATE** 다. 이걸 안 고치면 새 테이블마다 다시 붙는다.
--    소유자별로 항목이 따로 있어(postgres / supabase_admin) 둘 다 시도한다.
--    supabase_admin 것은 권한이 없어 실패할 수 있으므로 예외를 삼키고 계속한다.
-- ---------------------------------------------------------------------------
do $$
begin
  alter default privileges for role postgres in schema public
    revoke truncate on tables from authenticated, anon;
  raise notice 'default privileges (postgres) 에서 TRUNCATE 제거 완료';
exception when others then
  raise notice 'default privileges (postgres) 변경 실패: %', sqlerrm;
end $$;

do $$
begin
  alter default privileges for role supabase_admin in schema public
    revoke truncate on tables from authenticated, anon;
  raise notice 'default privileges (supabase_admin) 에서 TRUNCATE 제거 완료';
exception when others then
  raise notice 'default privileges (supabase_admin) 변경 실패(권한 부족일 수 있음): %', sqlerrm;
end $$;
