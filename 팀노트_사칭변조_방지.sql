-- ============================================================================
-- 🛡️ team_notes — 등록자 사칭·변조 차단 + 하드 삭제 차단 (2026-08-11)
--
-- ⚠️ 먼저 밝혀둘 것: team_notes 는 work_notes(개인노트)·chat_messages(DM) 와
--    **같은 계열이 아니다.** 팀 구분은 "접근 권한"이 아니라 "분류"다 —
--    App.js TeamNotesSection 은 activeTab 으로 법인/개인/전체 탭을 전환해
--    **누구나 모든 팀 노트를 본다**(27541). 그러니 RLS 를 팀 스코프로 조이면
--    화면이 통째로 깨진다. 조이면 안 된다.
--
-- 실제 점검 결과(2026-08-11) — 열람 쪽은 이미 정상이다:
--   · RLS 켜짐 = true
--   · 정책 = p_team_notes_all 하나, to authenticated, using/with_check 둘 다 is_approved()
--   · anon 권한 = 0건 (이미 회수돼 있음)
--   → 비로그인 노출 없음. 화면과 DB 의 열람 범위도 일치한다.
--
-- 그래서 이 파일이 막는 것은 열람이 아니라 **쓰기 쪽 사칭·변조**다
-- (chat_messages 에 trg_chat_protect_update 를 붙인 것과 같은 계열):
--   1) 남의 이름으로 팀 노트 등록  (posted_by 사칭)
--   2) 남이 올린 노트의 등록자·팀을 바꿔치기
--   3) 하드 DELETE 로 복구 불가능하게 지우기 (앱은 전부 soft delete = deleted_at)
--
-- 앱 정상 동작은 안 건드린다 — 확인(read_by)·가져가기(taken)·완료(status)·
-- 체크리스트·내용 수정·soft delete 는 전부 그대로 통과한다.
-- (실측: UPDATE 경로 6곳 중 posted_by 나 team 을 바꾸는 곳은 0곳,
--        하드 DELETE 경로 0곳, team_notes 를 참조하는 FK 0건 → 캐스케이드 위험 없음)
--
-- 실행:   node scripts/run-sql.js 팀노트_사칭변조_방지.sql
-- 되돌리기: node scripts/run-sql.js 팀노트_사칭변조_방지_rollback.sql
-- 검증:   node scripts/run-sql.js 팀노트_사칭변조_방지_동작검증.sql   (fail = 0 이어야 정상)
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1) 등록자 사칭·변조 차단
--    uid→이름은 이미 있는 public.wn_my_name() 을 그대로 쓴다(업무노트 RLS 에서 신설).
--    ⚠️ auth.uid() 가 null 이면 통과시킨다 — service_role·scripts/run-sql.js 같은
--       관리 작업을 막지 않기 위해서다(chat 트리거와 같은 규칙).
--    ⚠️ 에러를 내지 않고 **조용히 되돌린다**. 화면에 실패 팝업을 띄우지 않으면서
--       값은 못 바꾸게 하는 쪽이 안전하다(profiles 의 protect_profile_privileges 와 같은 방식).
-- ---------------------------------------------------------------------------
create or replace function public.protect_team_note()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare me text;
begin
  if auth.uid() is null then return new; end if;   -- 관리 컨텍스트는 통과
  me := public.wn_my_name();

  if tg_op = 'INSERT' then
    -- 등록자는 반드시 나. (이름을 못 찾으면 앱이 보낸 값을 그대로 둔다)
    if me is not null then new.posted_by := me; end if;
    return new;
  end if;

  -- UPDATE: 등록자·팀은 못 바꾼다. 앱에도 이 둘을 바꾸는 경로가 없다.
  new.posted_by := old.posted_by;
  new.team      := old.team;
  return new;
end;
$$;

drop trigger if exists trg_team_notes_protect on public.team_notes;
create trigger trg_team_notes_protect
  before insert or update on public.team_notes
  for each row execute function public.protect_team_note();

-- ---------------------------------------------------------------------------
-- 2) 하드 삭제 차단 — 앱은 deleted_at 을 채우는 soft delete 만 쓴다.
--    하드 DELETE 는 복구가 불가능하고, 정책이 ALL/is_approved() 라 승인된 사람이면
--    누구나 남의 노트를 지울 수 있다. 관리 컨텍스트는 여전히 지울 수 있다.
-- ---------------------------------------------------------------------------
create or replace function public.block_team_note_hard_delete()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if auth.uid() is null then return old; end if;   -- 관리 컨텍스트는 통과
  raise exception '팀 노트는 삭제 대신 deleted_at 을 채워주세요(복구 가능해야 합니다).'
    using errcode = '42501';
end;
$$;

drop trigger if exists trg_team_notes_no_hard_delete on public.team_notes;
create trigger trg_team_notes_no_hard_delete
  before delete on public.team_notes
  for each row execute function public.block_team_note_hard_delete();

-- ---------------------------------------------------------------------------
-- 3) 함수 EXECUTE 는 기본값이 PUBLIC 이다 → 회수. (CLAUDE.md 2-2)
--    트리거는 소유자 권한으로 돌기 때문에 회수해도 트리거 동작에는 영향이 없다.
-- ---------------------------------------------------------------------------
revoke all on function public.protect_team_note() from public, anon;
revoke all on function public.block_team_note_hard_delete() from public, anon;
