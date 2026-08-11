-- ============================================================================
-- 🧹 authenticated/anon 의 REFERENCES·TRIGGER 권한 회수 (2026-08-11)
--    TRUNCATE 회수(authenticated_TRUNCATE_회수.sql)의 후속. 같은 계열의 불필요 권한이다.
--
-- 문제: Supabase 기본 GRANT 로 `authenticated` 가 26개 테이블에
--       `REFERENCES`(FK 걸기)·`TRIGGER`(트리거 달기) 를 갖고 있다.
--       지금 당장은 `authenticated` 에게 public 스키마 CREATE 권한이 없어서
--       악용 경로가 좁지만(실측 has_schema_privilege = false),
--       TRUNCATE 가 그랬듯 **다른 권한과 조합되면 문제가 될 수 있다.**
--       특히 TRIGGER 는 "이미 있는 SECURITY DEFINER 함수를 호출하는 트리거"를
--       남의 테이블에 달 수 있어, 조건이 갖춰지면 권한 상승 경로가 된다.
--       앱이 전혀 쓰지 않는 권한이므로 최소권한 원칙대로 닫는다.
--
-- 안전성(실측으로 확인함):
--   · PostgREST 에는 CREATE TRIGGER / ALTER TABLE ADD CONSTRAINT 에 대응하는
--     HTTP 동작이 아예 없다. 앱·/api/* 어디서도 쓰지 않는다.
--   · **기존 FK 제약 18건은 영향 없다** — REFERENCES 는 제약을 "만들 때"만 필요하고
--     이미 만들어진 제약의 동작에는 관여하지 않는다.
--   · `authenticated` 가 소유한 트리거는 0건. 우리가 만든 트리거는 전부 postgres 소유라
--     계속 정상 동작한다(trg_team_notes_protect, trg_chat_protect_update 등).
--   · service_role·postgres 는 건드리지 않는다(관리 작업 유지).
--
-- ⚠️ `revoke` 는 **grantor 가 다르면 에러 없이 아무것도 안 한다.**
--    실측 결과 REFERENCES 26건·TRIGGER 26건 전부 grantor = postgres 이고
--    이 스크립트도 postgres 로 돈다(current_user = postgres).
--    그래도 "성공했으니 회수됐다"고 믿지 말고 실행 후 검증 파일로 재조회할 것. (CLAUDE.md 2-2)
--
-- 실행:   node scripts/run-sql.js authenticated_REFERENCES_TRIGGER_회수.sql
-- 되돌리기: node scripts/run-sql.js authenticated_REFERENCES_TRIGGER_회수_rollback.sql
-- 검증:   node scripts/run-sql.js authenticated_REFERENCES_TRIGGER_회수_검증.sql  (0 이어야 정상)
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1) 지금 있는 테이블에서 회수
-- ---------------------------------------------------------------------------
revoke references, trigger on all tables in schema public from authenticated;
revoke references, trigger on all tables in schema public from anon;

-- ---------------------------------------------------------------------------
-- 2) 앞으로 만들 테이블에도 안 붙게 — 기본권한에서 제거
--    public 스키마 테이블 기본권한 `arwdxtm` 에서 **x = REFERENCES, t = TRIGGER** 다.
--    (D = TRUNCATE 는 앞선 조치에서 이미 뺐다 → 남으면 `arwdm`)
--    ⚠️ supabase_admin 소유 기본권한은 postgres 가 그 롤의 멤버가 아니라 못 고친다
--       (pg_has_role = false, 2026-08-11 확인). TRUNCATE 때와 같은 한계다.
--       → supabase_admin 이 만든 테이블에는 다시 붙을 수 있으니
--         새 테이블마다 회수 + 카탈로그 확인이 필요하다(CLAUDE.md 2-2).
-- ---------------------------------------------------------------------------
do $$
begin
  alter default privileges for role postgres in schema public
    revoke references, trigger on tables from authenticated, anon;
  raise notice 'default privileges (postgres) 에서 REFERENCES·TRIGGER 제거 완료';
exception when others then
  raise notice 'default privileges (postgres) 변경 실패: %', sqlerrm;
end $$;

do $$
begin
  alter default privileges for role supabase_admin in schema public
    revoke references, trigger on tables from authenticated, anon;
  raise notice 'default privileges (supabase_admin) 에서 REFERENCES·TRIGGER 제거 완료';
exception when others then
  raise notice 'default privileges (supabase_admin) 변경 실패(권한 부족 예상): %', sqlerrm;
end $$;
