-- 되돌리기: 푸시구독_기기별_행_RLS.sql
-- 정책과 인덱스만 되돌린다. **컬럼은 지우지 않는다** — 구독 데이터가 들어온 뒤에 실행하면
-- endpoint 가 사라져 어느 기기 것인지 알 수 없게 되고, 그건 되돌리기가 아니라 파괴다.

drop policy if exists p_push_subs_select on public.push_subscriptions;
drop policy if exists p_push_subs_insert on public.push_subscriptions;
drop policy if exists p_push_subs_update on public.push_subscriptions;
drop policy if exists p_push_subs_delete on public.push_subscriptions;

create policy p_push_subscriptions_all on public.push_subscriptions for all to authenticated
  using (public.is_approved()) with check (public.is_approved());

drop index if exists public.push_subscriptions_endpoint_uniq;

-- 컬럼까지 정말 지워야 한다면 아래를 직접 실행할 것(데이터 손실):
-- alter table public.push_subscriptions
--   drop column if exists endpoint,
--   drop column if exists device,
--   drop column if exists last_ok_at,
--   drop column if exists fail_count;
