-- 푸시구독(push_subscriptions) — 기기당 1행 + 본인 행만 만지는 RLS
-- 2026-08-16 · 설계: docs/superpowers/specs/2026-08-16-웹푸시알림-design.md
--
-- 왜 바꾸나 (둘 다 실측으로 확인함):
--  ① 지금은 사람당 1행(user_name unique)이라 **사무실 PC 와 노트북 중 나중에 켠 쪽이 앞을 덮어쓴다.**
--     푸시 endpoint 는 브라우저·기기마다 다르므로 사람 기준으로 묶으면 한 대에만 알림이 간다.
--  ② 정책이 `p_push_subscriptions_all` 하나(ALL / authenticated / is_approved())뿐이라
--     **승인된 사람이면 남의 구독을 읽고 지울 수도 있다.** work_notes·chat_messages 와 같은 계열의 구멍이다.
--
-- 현재 0행이라 옮길 데이터가 없다(2026-08-16 확인). 발송 서버는 service_role 이라 RLS 를 우회한다.

-- ── 1. 컬럼 추가 ────────────────────────────────────────────────────────────
alter table public.push_subscriptions add column if not exists endpoint text;
alter table public.push_subscriptions add column if not exists device text;
alter table public.push_subscriptions add column if not exists last_ok_at timestamptz;
alter table public.push_subscriptions add column if not exists fail_count int not null default 0;

-- ── 2. 사람당 1행 제약 제거 → 기기당 1행 ────────────────────────────────────
-- unique 제약 이름이 환경마다 달라 카탈로그로 찾아 지운다(이름을 박으면 조용히 안 지워진다).
do $$
declare c record;
begin
  for c in
    select conname from pg_constraint
     where conrelid = 'public.push_subscriptions'::regclass and contype = 'u'
  loop
    execute format('alter table public.push_subscriptions drop constraint %I', c.conname);
  end loop;
end $$;

drop index if exists public.push_subscriptions_user_name_key;
drop index if exists public.push_subscriptions_user_name_idx;

-- upsert(onConflict:"endpoint") 가 걸릴 슬롯
create unique index if not exists push_subscriptions_endpoint_uniq
  on public.push_subscriptions (endpoint);
-- "이 사람의 구독 전부" 조회용(발송 때마다 탄다)
create index if not exists push_subscriptions_user_name_idx
  on public.push_subscriptions (user_name);

-- ── 3. 정책 교체 ────────────────────────────────────────────────────────────
-- ⚠️ 추가가 아니라 교체다. PERMISSIVE 정책은 OR 로 합쳐지므로 옛 정책을 남기면
--    새 정책이 무력화된다(CLAUDE.md 2-2, 2026-07-29 profiles 권한상승 사고와 같은 계열).
drop policy if exists p_push_subscriptions_all on public.push_subscriptions;
drop policy if exists p_push_subs_select on public.push_subscriptions;
drop policy if exists p_push_subs_insert on public.push_subscriptions;
drop policy if exists p_push_subs_update on public.push_subscriptions;
drop policy if exists p_push_subs_delete on public.push_subscriptions;

-- 본인 판정: profiles.name 은 앱이 쓰는 이름 키다(sender/posted_by 와 같은 계열).
create policy p_push_subs_select on public.push_subscriptions for select to authenticated
  using (public.is_approved() and user_name = (select p.name from public.profiles p where p.id = auth.uid()));
create policy p_push_subs_insert on public.push_subscriptions for insert to authenticated
  with check (public.is_approved() and user_name = (select p.name from public.profiles p where p.id = auth.uid()));
create policy p_push_subs_update on public.push_subscriptions for update to authenticated
  using (public.is_approved() and user_name = (select p.name from public.profiles p where p.id = auth.uid()))
  with check (public.is_approved() and user_name = (select p.name from public.profiles p where p.id = auth.uid()));
create policy p_push_subs_delete on public.push_subscriptions for delete to authenticated
  using (public.is_approved() and user_name = (select p.name from public.profiles p where p.id = auth.uid()));

-- ── 4. 권한 정리 (CLAUDE.md 2-2 체크리스트) ─────────────────────────────────
alter table public.push_subscriptions enable row level security;
revoke all on public.push_subscriptions from anon;
revoke truncate, references, trigger on public.push_subscriptions from authenticated, anon;
