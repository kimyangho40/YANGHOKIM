-- ⭐ 사이드바 메뉴 즐겨찾기 — 계정(auth uid)마다 1행. PC를 옮겨도 따라오게 하려고 만든다(2026-11-23).
--   화면: src/App.js `favMenus` (브라우저 저장이 먼저, 이 표는 동기화용). 되돌리기: _rollback.sql
create table if not exists public.menu_favorites (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  menus      jsonb not null default '[]'::jsonb check (jsonb_typeof(menus) = 'array'),
  updated_at timestamptz not null default now()
);
alter table public.menu_favorites enable row level security;

drop policy if exists p_menu_favorites_select on public.menu_favorites;
drop policy if exists p_menu_favorites_insert on public.menu_favorites;
drop policy if exists p_menu_favorites_update on public.menu_favorites;
create policy p_menu_favorites_select on public.menu_favorites for select to authenticated
  using (user_id = auth.uid() and public.is_approved());
create policy p_menu_favorites_insert on public.menu_favorites for insert to authenticated
  with check (user_id = auth.uid() and public.is_approved());
create policy p_menu_favorites_update on public.menu_favorites for update to authenticated
  using (user_id = auth.uid() and public.is_approved())
  with check (user_id = auth.uid() and public.is_approved());

revoke all on public.menu_favorites from anon;
revoke all on public.menu_favorites from authenticated;
grant select, insert, update on public.menu_favorites to authenticated;
