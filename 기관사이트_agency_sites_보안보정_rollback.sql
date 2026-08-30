-- 되돌리기: 기관사이트_agency_sites_보안보정.sql
-- 첨부 원본(crm/crm/supabase_agency_sites.sql)의 정책·권한 상태로 되돌린다.
--
-- ⚠️ anon GRANT 는 "원상복구"가 곧 "구멍을 다시 여는 것"이라 일부러 넣지 않았다.
--    정말 필요하면 아래 주석을 직접 풀어서 쓸 것. (기본권한이 arwdm 이었으므로 그 조합이다)
--    grant insert, select, update, delete on public.agency_sites          to anon;
--    grant insert, select, update, delete on public.agency_site_favorites to anon;
--
-- 데이터(시드 256건)는 이 파일도 건드리지 않는다.

drop policy if exists "agency_sites read for authenticated" on public.agency_sites;
create policy "agency_sites read for authenticated"
  on public.agency_sites
  for select to authenticated
  using (true);

drop policy if exists "favorites own rows" on public.agency_site_favorites;
create policy "favorites own rows"
  on public.agency_site_favorites
  for all to authenticated
  using      (auth.uid() = user_id)
  with check (auth.uid() = user_id);
