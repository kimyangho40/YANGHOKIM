-- ============================================================================
-- 업무노트(work_notes) 개인노트 비공개 — RLS에 사용자 스코프 적용
--   2026-08-05. CLAUDE.md "🔴 다음 세션 우선 처리" 항목 해소.
--
-- [문제] 정책이 p_work_notes_all(ALL / authenticated / using(is_approved())) 하나뿐이라
--        승인된 로그인 사용자면 누구나 남의 개인노트를 전건 조회할 수 있었다.
--        화면(wnViewable)에서만 걸러졌을 뿐 DB는 열려 있었다.
--
-- [열람 규칙] App.js 의 wnViewable() 과 동일하게 맞춘다.
--   · 양호(WN_ADMINS)  = 전원 열람
--   · 미현 ↔ 인선(WN_SHARE_GROUPS) = 서로 열람
--   · 그 외 = 본인 담당(assignee) 노트만
--   · 예외: company_id 가 붙은 노트는 팀 공유(기업 상세 타임라인용) — 사용자 결정.
--     실측 2026-08-05 기준 살아있는 401건 중 5건뿐.
--
-- [주의] 기존 정책을 반드시 drop 하고 새로 만든다. PERMISSIVE 정책은 OR 로 합쳐지므로
--        "추가"하면 조이는 게 아니라 푸는 결과가 된다(CLAUDE.md 2-2).
--
-- 되돌리기: 업무노트_개인노트_비공개_RLS_rollback.sql
-- ============================================================================

begin;

-- ---------------------------------------------------------------------------
-- 1) 헬퍼 함수 — auth.uid() → profiles.name
--    assignee 가 uuid 가 아니라 이름 텍스트라 uid 와 직접 비교할 수 없다.
--    profiles 에는 같은 이름의 행이 여럿 있으나(미현 3건 등) id 는 PK 라 uid→이름은 1:1.
-- ---------------------------------------------------------------------------
create or replace function public.wn_my_name()
returns text
language sql stable security definer set search_path = public
as $$
  select p.name from public.profiles p
   where p.id = auth.uid() and p.status = 'approved'
   limit 1;
$$;

-- 전체 열람 관리자 — App.js WN_ADMINS = ["양호"] 와 일치시킨다.
--   (profiles.role='admin' 기준이 아니다. 정원도 admin 이지만 노트 전체 열람은 주지 않는다.)
create or replace function public.wn_is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select coalesce(public.wn_my_name() = '양호', false);
$$;

-- 볼 수 있는 담당자 이름 목록 — App.js wnViewable() 의 비관리자 분기와 동일.
create or replace function public.wn_visible_names()
returns text[]
language sql stable security definer set search_path = public
as $$
  select case
    when public.wn_my_name() is null then array[]::text[]
    when public.wn_my_name() in ('미현', '인선') then array['미현', '인선']
    else array[public.wn_my_name()]
  end;
$$;

-- ---------------------------------------------------------------------------
-- 2) 정책 교체
--    SELECT/UPDATE/DELETE 는 열람 범위로 조이고, INSERT 만 넓게 둔다.
--    INSERT 를 넓게 두는 이유: "업무 요청 / 빠른 업무"가 상대방 이름으로 노트를 만드는
--    기존 기능이다(남의 노트에 쓰는 것은 원래 기능, 이번에 막는 것은 '읽기').
--    단 남의 노트를 찾아 합치는 경로는 아래 wn_append_todo() 로 옮긴다.
-- ---------------------------------------------------------------------------
drop policy if exists p_work_notes_all on public.work_notes;

create policy p_work_notes_select on public.work_notes
  for select to authenticated
  using (
    (select public.is_approved())
    and (
      (select public.wn_is_admin())
      or assignee = any (coalesce((select public.wn_visible_names()), array[]::text[]))
      or company_id is not null
    )
  );

create policy p_work_notes_insert on public.work_notes
  for insert to authenticated
  with check ((select public.is_approved()));

create policy p_work_notes_update on public.work_notes
  for update to authenticated
  using (
    (select public.is_approved())
    and (
      (select public.wn_is_admin())
      or assignee = any (coalesce((select public.wn_visible_names()), array[]::text[]))
      or company_id is not null
    )
  )
  with check ((select public.is_approved()));

create policy p_work_notes_delete on public.work_notes
  for delete to authenticated
  using (
    (select public.is_approved())
    and (
      (select public.wn_is_admin())
      or assignee = any (coalesce((select public.wn_visible_names()), array[]::text[]))
      or company_id is not null
    )
  );

-- ---------------------------------------------------------------------------
-- 3) 팀 집계 함수 — 노트 '내용'은 절대 내보내지 않고 숫자만 돌려준다.
--    대시보드 "담당자별 미완료 현황"·"팀 활동" 위젯이 전건 조회 대신 이걸 쓴다.
-- ---------------------------------------------------------------------------

-- 담당자별 체크리스트 미완료 집계.
--   App.js parseUnfinishedItems() 규칙을 그대로 옮긴 것:
--   "- [ ]" 로 시작하는 줄에서 ①줄 끝 {응답대기|서류대기(:날짜)} ②[YYYY-MM-DD] 마감일
--   ③줄 끝 "(→ M/D 이월)" 꼬리표를 뗀 뒤 남는 글자가 있어야 1건으로 센다.
--   날짜는 note_date, 없으면 created_at 의 UTC 날짜(화면 계산식과 동일).
--   ⚠ 2026-08-05 실측으로 JS 결과와 10명 전원(미완료/3일↑방치/최고참 날짜) 일치 확인함.
--      이 규칙을 고치면 App.js parseUnfinishedItems 와 함께 고치고 다시 대조할 것.
create or replace function public.wn_team_unfinished()
returns table (assignee text, cnt integer, stale integer, oldest date)
language sql stable security definer set search_path = public
as $$
  with lines as (
    select n.assignee,
           coalesce(n.note_date, (n.created_at at time zone 'UTC')::date) as nd,
           l.line
      from public.work_notes n
      cross join lateral regexp_split_to_table(coalesce(n.content, ''), E'\n') as l(line)
     where n.deleted_at is null
  ),
  un as (
    select btrim(l.assignee) as assignee, l.nd
      from lines l
     where l.line ~ '^[[:space:]]*- \[ \]'
       and btrim(regexp_replace(
             regexp_replace(
               regexp_replace(
                 regexp_replace(l.line, '^[[:space:]]*- \[ \][[:space:]]*', ''),
                 '[[:space:]]*\{(응답대기|서류대기)(:[0-9]{4}-[0-9]{2}-[0-9]{2})?\}[[:space:]]*$', ''),
               '\[[0-9]{4}-[0-9]{2}-[0-9]{2}\]', ''),
             '[[:space:]]*\(?→[[:space:]]*[0-9]{1,2}/[0-9]{1,2}[[:space:]]*이월\)?[[:space:]]*$', '')) <> ''
  )
  select u.assignee,
         count(*)::int,
         count(*) filter (
           where u.nd is not null
             and (now() at time zone 'Asia/Seoul')::date - u.nd >= 3
         )::int,
         min(u.nd)
    from un u
   where public.is_approved()
     and coalesce(u.assignee, '') <> ''
   group by u.assignee
   order by count(*) desc;
$$;

-- 팀 활동 위젯용 — 담당자별 노트 수정 건수 / 마지막 활동 시각. 내용은 내보내지 않는다.
create or replace function public.wn_activity_counts(p_since timestamptz)
returns table (assignee text, n integer, last_active timestamptz)
language sql stable security definer set search_path = public
as $$
  select w.assignee, count(*)::int, max(w.updated_at)
    from public.work_notes w
   where public.is_approved()
     and w.deleted_at is null
     and w.updated_at >= p_since
     and coalesce(btrim(w.assignee), '') <> ''
   group by w.assignee;
$$;

-- ---------------------------------------------------------------------------
-- 4) 남의 노트에 체크리스트 한 줄 덧붙이기 (업무 요청 / 빠른 업무)
--    읽기가 막히면 클라이언트가 상대 노트를 못 찾아 같은 날 노트를 또 만든다(중복 카드).
--    그래서 "찾아서 합치거나 없으면 만들기"를 서버에서 처리하고, 돌려주는 건 노트 id 뿐이다.
--    → 남의 노트 내용은 여전히 클라이언트로 나가지 않는다.
-- ---------------------------------------------------------------------------
create or replace function public.wn_append_todo(
  p_assignee   text,
  p_note_date  date,
  p_line       text,
  p_company_id uuid default null,
  p_title      text default null
)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  v_me text;
  v_id uuid;
begin
  v_me := public.wn_my_name();
  if v_me is null then
    raise exception '승인된 사용자만 사용할 수 있습니다.';
  end if;
  if coalesce(btrim(p_assignee), '') = '' then
    raise exception '담당자가 없습니다.';
  end if;
  if coalesce(btrim(p_line), '') = '' then
    raise exception '내용이 비어 있습니다.';
  end if;

  select w.id into v_id
    from public.work_notes w
   where w.assignee = p_assignee
     and w.note_date = p_note_date
     and w.deleted_at is null
   order by w.created_at desc
   limit 1;

  if v_id is not null then
    update public.work_notes
       set content = case when coalesce(content, '') = '' then p_line
                          else content || E'\n' || p_line end,
           is_todo = true,
           updated_at = now()
     where id = v_id;
    return v_id;
  end if;

  insert into public.work_notes (assignee, title, content, is_todo, created_by, note_date, company_id)
  values (p_assignee,
          coalesce(nullif(btrim(p_title), ''),
                   to_char(p_note_date, 'FMMM') || '월' || to_char(p_note_date, 'FMDD') || '일 업무노트'),
          p_line, true, v_me, p_note_date, p_company_id)
  returning id into v_id;

  return v_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- 5) 권한 — 함수 EXECUTE 는 기본이 PUBLIC 이라 반드시 회수한다(anon 호출 차단).
-- ---------------------------------------------------------------------------
revoke all on function public.wn_my_name()                          from public, anon;
revoke all on function public.wn_is_admin()                         from public, anon;
revoke all on function public.wn_visible_names()                    from public, anon;
revoke all on function public.wn_team_unfinished()                  from public, anon;
revoke all on function public.wn_activity_counts(timestamptz)       from public, anon;
revoke all on function public.wn_append_todo(text, date, text, uuid, text) from public, anon;

grant execute on function public.wn_my_name()                          to authenticated;
grant execute on function public.wn_is_admin()                         to authenticated;
grant execute on function public.wn_visible_names()                    to authenticated;
grant execute on function public.wn_team_unfinished()                  to authenticated;
grant execute on function public.wn_activity_counts(timestamptz)       to authenticated;
grant execute on function public.wn_append_todo(text, date, text, uuid, text) to authenticated;

revoke all on public.work_notes from anon;

commit;
