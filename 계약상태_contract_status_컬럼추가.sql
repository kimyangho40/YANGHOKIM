-- ════════════════════════════════════════════════════════════════════════
-- 계약 단계 방치 방지 — companies.contract_status / contract_status_at 추가
--   (작성: 2026-07-29 / 실행 전 — 승인 후 실행할 것)
--
-- 왜 필요한가:
--   계약서 서명 후 방치되는 업체(서명 안 함·고민 중·서명완료 후 입금 지연)를
--   기업목록에서 한눈에 보고, 오래 멈춘 건 전화로 챙기기 위함.
--   정체일수를 계산하려면 "이 상태가 된 시각"이 반드시 필요하다 →  두 컬럼을 한 쌍으로 추가한다.
--
-- 기존 fee_status(미수령·계약금수령·수수료수령완료)와는 축이 다르다:
--   · fee_status       = 돈이 들어왔는가 (정산)
--   · contract_status  = 서명 절차가 어디까지 갔는가 (진행)
--   둘을 합치면 "서명은 했는데 입금 전" 상태를 표현할 수 없어 분리해 둔다.
--   ⚠️ 앱에서 두 값을 자동 연동하지 않는다(정산 집계를 조용히 바꾸면 안 되므로).
--
-- 설계 판단:
--   · CHECK 제약을 걸지 않는다 — 단계 명칭이 바뀌면 마이그레이션이 또 필요해지고,
--     값이 안 맞으면 저장 전체가 400으로 실패한다(현황표 파서에서 이미 겪은 실패 모드).
--     값 검증은 앱에서 한다.
--   · 기본값을 주지 않는다 — 기본값을 주면 기존 250여 건이 전부 그 상태로 보여
--     방치 목록이 오염된다. "없음"은 null 로 표현하므로 백필도 불필요하다.
--
-- 보안 (CLAUDE.md 2-2):
--   새 테이블이 아니라 기존 companies 에 컬럼만 추가하므로 RLS 정책·GRANT 는 그대로 상속된다.
--   새 anon 경로는 열리지 않는다. 그래도 아래 검증 3·4로 상태가 그대로인지 확인한다.
--
-- 롤백: 계약상태_contract_status_컬럼추가_rollback.sql
--   ⚠️ 컬럼 추가와 달리 롤백은 **입력된 계약 상태 데이터가 사라진다**(컬럼 삭제).
-- ════════════════════════════════════════════════════════════════════════

begin;
  set local lock_timeout = '3s';

  alter table public.companies add column if not exists contract_status    text;
  alter table public.companies add column if not exists contract_status_at timestamptz;

  comment on column public.companies.contract_status is
    '계약 진행 상태: 보류|안내|서명중|서명완료|입금완료 (null = 없음). fee_status(정산)와는 별개 축';
  comment on column public.companies.contract_status_at is
    '위 상태가 된 시각 — 정체일수 계산 기준. 상태가 바뀔 때마다 앱이 갱신한다';

  -- 목록에서 두 칸을 같이 읽는다(방치 건 정렬·집계용)
  create index if not exists idx_companies_contract
    on public.companies (contract_status, contract_status_at);
commit;

-- ── 실행 후 검증 ────────────────────────────────────────────────────────
-- [검증 1] 컬럼 2행이 나와야 정상 (text / timestamptz, 둘 다 nullable)
select column_name, data_type, is_nullable, column_default
  from information_schema.columns
 where table_schema = 'public' and table_name = 'companies'
   and column_name in ('contract_status', 'contract_status_at')
 order by column_name;

-- [검증 2] 기존 데이터 보존 + 전 건 null 로 시작하는지
select count(*)                                            as total,
       count(contract_status)                              as has_status,
       count(*) filter (where contract_status is not null) as should_be_zero
  from public.companies
 where deleted_at is null;

-- [검증 3] anon GRANT — 0행이어야 정상 (2026-07-29 회수분이 유지되는지)
select privilege_type
  from information_schema.role_table_grants
 where table_schema = 'public' and table_name = 'companies' and grantee = 'anon';

-- [검증 4] RLS 켜짐 + 정책이 is_approved() 기반인지 (anon/public 대상 정책이 없어야 함)
select c.relrowsecurity as rls_enabled,
       (select json_agg(json_build_object('p', p.policyname, 'roles', p.roles, 'using', p.qual))
          from pg_policies p
         where p.schemaname = 'public' and p.tablename = 'companies') as policies
  from pg_class c
 where c.relnamespace = 'public'::regnamespace and c.relname = 'companies';

-- ── 실행 후 화면 확인 ───────────────────────────────────────────────────
--   · 업체 상세 → 계약 상태 6버튼 클릭 → 즉시 저장되고 날짜가 찍히는지
--   · 기업목록 진행단계 칸에 계약 뱃지가 뜨는지(3일↑ 노랑 / 7일↑ 빨강)
--   · 기업목록 인라인 편집 · 업체 상세 저장이 기존대로 동작하는지
--   · 정산 화면 수수료 집계가 그대로인지(fee_status 무영향 확인)
