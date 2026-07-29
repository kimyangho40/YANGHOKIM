-- ════════════════════════════════════════════════════════════════════════
-- [롤백] 계약상태_contract_status_컬럼추가.sql 되돌리기
--
-- 언제 쓰나: 컬럼 추가 후 업체 상세 저장이나 기업목록이 깨질 때.
--
-- 🔴 다른 롤백과 다르다 — **데이터가 사라진다.**
--    컬럼을 지우므로 그동안 입력한 계약 상태(보류·안내·서명중·서명완료·입금완료)와
--    상태 변경 시각이 전부 없어진다. 되돌릴 수 없다.
--    → 실행 전에 아래 [보존] 블록을 먼저 돌려 백업 테이블을 만들 것.
--
--    저장이 안 되는 정도의 문제라면 컬럼을 지우지 말고 앱 코드만 되돌리는 편이 낫다.
--    컬럼이 남아 있어도 앱이 그 칸을 안 쓰면 아무 영향이 없다.
-- ════════════════════════════════════════════════════════════════════════

-- ── [보존] 컬럼을 지우기 전에 값을 백업 (입력된 게 있으면 반드시 먼저 실행) ──
--    ⚠️ 백업 테이블도 RLS 대상이다(CLAUDE.md 2-2). 만들었으면 아래 잠금까지 같이 할 것.
create table if not exists public._backup_contract_status_20260729 as
  select id, name, contract_status, contract_status_at
    from public.companies
   where contract_status is not null;

alter table public._backup_contract_status_20260729 enable row level security;
revoke all on public._backup_contract_status_20260729 from anon;
-- 정책을 만들지 않으므로 anon·authenticated 모두 접근 불가(관리자가 SQL Editor로만 열람).

select count(*) as backed_up from public._backup_contract_status_20260729;

-- ── [롤백] 컬럼 제거 ────────────────────────────────────────────────────
begin;
  set local lock_timeout = '3s';

  drop index if exists public.idx_companies_contract;
  alter table public.companies drop column if exists contract_status;
  alter table public.companies drop column if exists contract_status_at;
commit;

-- ── 롤백 확인 ───────────────────────────────────────────────────────────
-- [확인 1] 두 컬럼이 사라졌는지 — 0행이어야 정상
select column_name from information_schema.columns
 where table_schema = 'public' and table_name = 'companies'
   and column_name in ('contract_status', 'contract_status_at');

-- [확인 2] 나머지 데이터 보존 — 롤백 전과 같은 건수여야 한다
select count(*) as companies_rows from public.companies where deleted_at is null;

-- [확인 3] 보안 상태 유지 — anon GRANT 0행 / RLS true
select (select count(*) from information_schema.role_table_grants
         where table_schema='public' and table_name='companies' and grantee='anon') as anon_grants,
       (select relrowsecurity from pg_class
         where relnamespace='public'::regnamespace and relname='companies')          as rls_enabled;

-- ── 롤백 후 할 일 ───────────────────────────────────────────────────────
--   앱 코드에 contract_status 참조가 남아 있으면 저장 시 400이 난다.
--   컬럼을 지웠다면 코드(뱃지·상세패널 버튼·saveCompany allFields)도 함께 되돌릴 것.
