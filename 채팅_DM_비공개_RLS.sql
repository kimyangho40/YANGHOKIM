-- ============================================================================
-- 💬 채팅(chat_messages) 채널 스코프 — DM 이 DB 에서 안 막혀 있던 것 봉쇄
--   2026-08-10. 2026-08-02 에 발견해 보류해 둔 항목.
--
-- [문제] 정책 3개(select/insert/update)의 조건이 **`is_approved()` 하나뿐**이라
--        채널 스코프가 없었다. 채널 판정은 App.js `canAccessChannel()` 클라이언트 필터가 전부.
--        · `fetchChatUnread`/`refreshUnreadMap` 이 채널 조건 없이 `message` 본문까지 최근 1000건을
--          통째로 받아온 뒤 화면에서만 거른다 → 승인된 사람 누구나 브라우저에 **남의 DM 본문**이 내려왔다.
--          (실측 2026-08-10: DM 6채널 38건 — dm:유진|인선 13 · dm:양호|현애 14 · dm:관호|양호 4 …)
--        · UPDATE 도 같아서 **남의 메시지 수정·삭제도 DB 에서는 열려 있었다**
--          (`sender===me || isAdmin` 체크는 클라이언트뿐).
--
-- [열람 규칙] App.js `canAccessChannel()`(App.js:3578) 과 **한 글자도 다르지 않게** 맞춘다.
--   · general    = 전원
--   · corporate  = CHAT_TEAMS.corporate  (양호·동일·유진·인선·미현)
--   · individual = CHAT_TEAMS.individual (양호·동일·관호·현애·지혜·정원)
--   · dm:A|B     = 이름이 A 또는 B 인 사람만
--   · 그 외 채널 = 아무도 못 봄
--   ⚠ 팀 목록은 `profiles.team` 이 아니라 **App.js 의 하드코딩 배열**이 원본이다.
--     (인선의 profiles.team 은 '개인전담'이지만 채팅에서는 corporate 다 — team 을 쓰면 규칙이 어긋난다.)
--   ⚠ 관리자(양호)도 **남의 DM 은 못 본다.** work_notes 와 달리 전체 열람 예외를 두지 않는다
--     (App.js 에도 그런 예외가 없다). isAdmin 은 '자기가 볼 수 있는 채널에서 남의 메시지 삭제'에만 쓴다.
--
-- [수정·삭제] 정책은 채널 단위까지만 막을 수 있어(같은 채널이면 남의 메시지도 UPDATE 대상),
--   그 안쪽은 **트리거**로 막는다. 읽음표시(`read_by`)는 남의 메시지에 쓰는 게 정상 동작이라
--   UPDATE 자체를 본인 것으로 좁힐 수 없기 때문이다. (CLAUDE.md: 값 강제는 정책이 아니라 트리거)
--
-- [주의] 기존 정책은 반드시 drop 후 재생성. PERMISSIVE 는 OR 로 합쳐져 "추가"하면 푸는 결과가 된다.
--
-- 실행:     node scripts/run-sql.js 채팅_DM_비공개_RLS.sql
-- 동작검증: node scripts/run-sql.js 채팅_DM_비공개_동작검증.sql
-- 되돌리기: 채팅_DM_비공개_RLS_rollback.sql
-- ============================================================================

begin;

-- ---------------------------------------------------------------------------
-- 1) 헬퍼 — 채널 접근 판정
--    uid→이름은 이미 있는 public.wn_my_name() 을 그대로 쓴다(업무노트 RLS 에서 신설).
--    같은 일을 하는 함수를 하나 더 만들면 "둘 중 하나만 고치는" 사고가 생긴다.
--    ⚠ 이름을 **인자로 받는다** — 정책에서 `(select public.wn_my_name())` 로 감싸 호출하면
--      InitPlan 으로 한 번만 평가돼, 행마다 profiles 를 다시 뒤지지 않는다.
-- ---------------------------------------------------------------------------
create or replace function public.chat_can_access(p_channel text, p_me text)
returns boolean
language sql immutable
as $$
  select case
    when coalesce(p_me, '') = '' or coalesce(p_channel, '') = '' then false
    when p_channel = 'general'    then true
    when p_channel = 'corporate'  then p_me = any (array['양호','동일','유진','인선','미현'])
    when p_channel = 'individual' then p_me = any (array['양호','동일','관호','현애','지혜','정원'])
    when p_channel like 'dm:%'    then p_me = any (string_to_array(substr(p_channel, 4), '|'))
    else false
  end;
$$;

-- 남의 메시지도 삭제할 수 있는 사람 — App.js ChatView 의 isAdmin 과 동일
--   (profile.role='admin' 이거나 이름이 '양호'. 정원도 admin 이라 포함된다.)
create or replace function public.chat_is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select coalesce((
    select p.role = 'admin' or p.name = '양호'
      from public.profiles p
     where p.id = auth.uid() and p.status = 'approved'
     limit 1), false);
$$;

-- ---------------------------------------------------------------------------
-- 2) 정책 교체 — 조건에 채널 스코프를 더한다
-- ---------------------------------------------------------------------------
drop policy if exists p_chat_messages_select on public.chat_messages;
drop policy if exists p_chat_messages_insert on public.chat_messages;
drop policy if exists p_chat_messages_update on public.chat_messages;

create policy p_chat_messages_select on public.chat_messages
  for select to authenticated
  using (
    (select public.is_approved())
    and public.chat_can_access(channel, (select public.wn_my_name()))
  );

-- 보낼 수 있는 곳은 내가 들어갈 수 있는 채널뿐이고, 발신자는 나여야 한다(사칭 차단).
create policy p_chat_messages_insert on public.chat_messages
  for insert to authenticated
  with check (
    (select public.is_approved())
    and public.chat_can_access(channel, (select public.wn_my_name()))
    and sender = (select public.wn_my_name())
  );

-- UPDATE 는 채널까지만 정책으로 막고, 그 안쪽(남의 메시지 본문·삭제)은 아래 트리거가 막는다.
create policy p_chat_messages_update on public.chat_messages
  for update to authenticated
  using (
    (select public.is_approved())
    and public.chat_can_access(channel, (select public.wn_my_name()))
  )
  with check (
    (select public.is_approved())
    and public.chat_can_access(channel, (select public.wn_my_name()))
  );

-- DELETE 정책은 만들지 않는다 — 삭제는 deleted_at soft delete 로만 한다(기존과 동일).

-- ---------------------------------------------------------------------------
-- 3) 트리거 — 같은 채널 안에서의 사칭·남의 글 손대기 차단
--    허용: 읽음표시(read_by) · 소통내역 저장표시(saved_to_activity) 는 남의 메시지에도 쓴다.
--    차단: 남의 메시지의 message / deleted_at 변경 (관리자 제외)
--    덮어씀: id · sender · channel · created_at 은 앱이 뭘 보내든 원래 값으로 되돌린다.
-- ---------------------------------------------------------------------------
create or replace function public.chat_protect_update()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare v_me text;
begin
  -- service_role / SQL 콘솔(관리 작업)은 auth.uid() 가 없다 → 통과시킨다.
  if auth.uid() is null then return new; end if;

  v_me := public.wn_my_name();
  if v_me is null then
    raise exception '승인된 사용자만 메시지를 수정할 수 있습니다.';
  end if;

  -- 귀속 정보는 누구도 못 바꾼다(조용히 원복 — sign_offs 트리거와 같은 방식)
  new.id         := old.id;
  new.sender     := old.sender;
  new.channel    := old.channel;
  new.created_at := old.created_at;

  if old.sender is distinct from v_me and not public.chat_is_admin() then
    if new.message is distinct from old.message then
      raise exception '남의 메시지 본문은 수정할 수 없습니다.';
    end if;
    if new.deleted_at is distinct from old.deleted_at then
      raise exception '남의 메시지는 삭제할 수 없습니다.';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_chat_protect_update on public.chat_messages;
create trigger trg_chat_protect_update
  before update on public.chat_messages
  for each row execute function public.chat_protect_update();

-- ---------------------------------------------------------------------------
-- 4) 권한
--    · 정책에서 쓰는 함수는 authenticated 에 EXECUTE 가 있어야 한다(정책식은 호출자 권한으로 평가된다).
--    · 트리거 함수는 아무도 직접 부를 일이 없다 → authenticated 에서도 회수한다.
--      (Supabase 는 신규 함수 EXECUTE 를 anon/authenticated/service_role 에 기본 부여한다.
--       `from public, anon` 만 회수하면 authenticated 직접 호출이 남는다 — 결재함 검증 ⑧에서 걸렸던 함정.)
-- ---------------------------------------------------------------------------
revoke all on function public.chat_can_access(text, text) from public, anon;
revoke all on function public.chat_is_admin()             from public, anon;
revoke all on function public.chat_protect_update()       from public, anon, authenticated;

grant execute on function public.chat_can_access(text, text) to authenticated;
grant execute on function public.chat_is_admin()             to authenticated;

revoke all on public.chat_messages from anon;

commit;

-- 실행 직후 눈으로 보는 요약 (⚠ 판정은 채팅_DM_비공개_동작검증.sql 로 따로 할 것)
select policyname, cmd, qual, with_check
  from pg_policies where schemaname = 'public' and tablename = 'chat_messages'
 order by policyname;
