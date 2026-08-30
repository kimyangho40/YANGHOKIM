-- 기관 사이트(agency_sites · agency_site_favorites) 보안 보정
-- 짝: crm/crm/supabase_agency_sites.sql (첨부 원본 — 이 파일은 그 뒤에 실행한다)
-- 되돌리기: 기관사이트_agency_sites_보안보정_rollback.sql
--
-- 원본 SQL 이 CLAUDE.md 2-2 체크리스트 중 2가지를 안 지켜서 덧붙이는 파일이다.
--
-- ① anon GRANT 회수
--    run-sql.js 는 postgres 로 실행되고, public 스키마의 postgres 기본권한이
--    `anon=arwdm` 이라 **새 테이블에 anon 의 INSERT/SELECT/UPDATE/DELETE 가 자동으로 붙는다.**
--    RLS 가 켜져 있고 anon 정책이 없어 지금 당장 새지는 않지만, 2026-07-27 사고가
--    정확히 "정책 하나 느슨해지면 남아 있던 GRANT 로 뚫린다"는 패턴이었다.
--
-- ② 정책을 is_approved() 기반으로
--    원본은 `to authenticated using (true)` 라, 미승인(pending)·퇴사(rejected) 계정도
--    세션만 살아 있으면 읽힌다. 이 저장소는 `profiles.status='rejected'` 를
--    즉시 전면 차단 수단으로 쓰므로(CLAUDE.md 2-3·2-4) 이 테이블만 예외가 되면 안 된다.
--    ⚠️ 정책은 PERMISSIVE 라 "추가"하면 OR 로 합쳐져 **조이는 게 아니라 푸는** 결과가 된다.
--       그래서 반드시 같은 이름으로 drop 후 재생성한다(CLAUDE.md 2-2).
--
-- 데이터(시드 256건)·테이블 구조·컬럼은 하나도 건드리지 않는다.

-- ① anon 권한 회수
revoke all on public.agency_sites          from anon;
revoke all on public.agency_site_favorites from anon;

-- ② 정책 교체 — 조회 조건만 바꾼다(대상 롤·동작 범위는 원본 그대로)
drop policy if exists "agency_sites read for authenticated" on public.agency_sites;
create policy "agency_sites read for authenticated"
  on public.agency_sites
  for select to authenticated
  using (public.is_approved());

drop policy if exists "favorites own rows" on public.agency_site_favorites;
create policy "favorites own rows"
  on public.agency_site_favorites
  for all to authenticated
  using      (public.is_approved() and auth.uid() = user_id)
  with check (public.is_approved() and auth.uid() = user_id);
