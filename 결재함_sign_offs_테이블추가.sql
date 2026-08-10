-- ============================================================================
-- 🗂️ 결재함 (sign_offs / sign_off_events) — 테이블·RLS·트리거 생성
--   2026-08-10. 설계안대로 진행. 화면 이름은 "결재함", 테이블 이름만 sign_offs.
--
-- [왜 approvals 가 아닌가]
--   public.approval_cases 가 이미 있고 그건 "심사 결과 사례집"이다
--   (applied_amount / approved_amount / result_reason … 화면은 ApprovalCasesView).
--   뜻이 전혀 다른 두 테이블을 approvals / approval_cases 로 나란히 두면 반드시 헷갈린다.
--
-- [무엇을 담나]
--   비정형·1회성 승인 건(스키마 변경·데이터 삭제·중복 프로필 확정·권한 변경)만.
--   연차 등 정형화된 업무는 들어오지 않는다.
--
-- [핵심 설계]
--   ① 본문(sign_offs) / 이력(sign_off_events) 분리. 이력은 append-only.
--   ② 승인 ≠ 실행. executed_at 으로 "승인됨 · 미실행"(진짜 방치)을 추적한다.
--   ③ 결재자는 uuid(approver_id), 작성자·담당자는 정규화된 이름 기준.
--      → profiles 에 같은 사람의 계정이 여러 개 있다(19행 = 실제 약 13명, 전부 살아있는 계정).
--        양호·정원은 각각 1행뿐이라 결재자만 uuid 고정이 안전하다.
--   ④ 값 강제는 정책이 아니라 트리거로. (2026-07-29 profiles 권한상승 사고 교훈:
--      PERMISSIVE 정책은 OR 로 합쳐져 언제든 느슨해질 수 있다.)
--
-- ⚠️ 이 파일을 실행해도 데이터는 생기지 않는다. BEFORE INSERT 트리거가 auth.uid() 를
--    요구하므로 run-sql.js(Management API = postgres, JWT 없음)로는 행을 넣을 수 없다.
--    결재 건은 반드시 화면(로그인 세션)으로 올릴 것.
--
-- 실행:   node scripts/run-sql.js 결재함_sign_offs_테이블추가.sql
-- 검증:   node scripts/run-sql.js 결재함_sign_offs_검증.sql   ← 반드시 따로 실행
--         (run-sql.js 는 마지막 SELECT 하나만 출력한다. 조치 파일에 딸린 SELECT 를 믿지 말 것)
-- 되돌리기: 결재함_sign_offs_테이블추가_rollback.sql
-- 프로젝트: ujdrjvnihxjvbkezjvwc
-- ============================================================================

begin;

-- ---------------------------------------------------------------------------
-- 0) 이름 정규화 — App.js normalizeStaffName() 을 SQL 로 옮긴 것
--    ⚠️ App.js:1300 normalizeStaffName 과 한 쌍이다. 한쪽만 고치면
--       "화면에선 내 건인데 DB는 안 준다"(또는 그 반대)가 된다. 고치면 둘 다 고칠 것.
-- ---------------------------------------------------------------------------
create or replace function public.so_normalize_name(p_name text)
returns text
language sql immutable
as $$
  select case
    when p_name is null then ''
    when btrim(p_name) in ('총무', '총무(유진)')            then '유진'
    when btrim(p_name) in ('김동일이사', '김이사', '동일이사') then '동일'
    when btrim(p_name) = '김현애'                            then '현애'
    when btrim(p_name) = '최지혜'                            then '지혜'
    else btrim(p_name)
  end;
$$;

-- 로그인한 사람의 프로필 이름(원문) — 표시 스냅샷용
create or replace function public.so_my_name()
returns text
language sql stable security definer set search_path = public
as $$
  select p.name from public.profiles p
   where p.id = auth.uid() and p.status = 'approved'
   limit 1;
$$;

-- 로그인한 사람의 정규화 이름 — "내가 올린 것"·담당자 판정용(사람 단위 키)
create or replace function public.so_my_norm()
returns text
language sql stable security definer set search_path = public
as $$
  select public.so_normalize_name(public.so_my_name());
$$;

-- ---------------------------------------------------------------------------
-- 1) 본문 테이블
-- ---------------------------------------------------------------------------
create table if not exists public.sign_offs (
  id             uuid primary key default gen_random_uuid(),
  seq            bigint generated always as identity,  -- 사람이 부르는 번호(#12). uuid 는 대화에서 못 쓴다
  title          text not null,
  body           text,
  category       text not null
    check (category in ('schema', 'data_delete', 'profile_merge', 'permission', 'etc')),
  risk           text not null default 'normal'
    check (risk in ('normal', 'irreversible')),
  rollback_ref   text,                                 -- 되돌리기 SQL 파일명 (이 저장소 관례)

  -- 작성자 — uuid 는 "누가 눌렀나"의 사실, 이름은 "내가 올린 것" 필터용(계정이 갈려도 사람 단위로 묶임)
  created_by     uuid not null references public.profiles(id),
  created_name   text not null,                        -- so_normalize_name 적용값
  owner_name     text,                                 -- 담당자(실행할 사람). 계정이 아니라 사람이라 이름으로 잡는다

  -- 결재자 — admin 2명(양호·정원)은 profiles 행이 각각 1개뿐이라 uuid 고정이 안전하다
  approver_id    uuid not null references public.profiles(id),
  approver_name  text not null,

  status         text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'withdrawn')),
  requested_at   timestamptz not null default now(),
  decided_at     timestamptz,
  decided_by     uuid references public.profiles(id),
  decision_note  text,                                 -- 반려 사유(반려면 필수) / 승인 메모

  -- 승인 ≠ 실행. 승인만 받고 안 하면 그것도 방치다.
  executed_at    timestamptz,
  executed_by    uuid references public.profiles(id),
  executed_name  text,
  execution_note text,                                 -- 실제로 뭘 했는지(실행한 SQL 파일명 등)

  company_id     uuid references public.companies(id), -- 선택 연결
  updated_at     timestamptz not null default now(),

  constraint uq_sign_offs_seq unique (seq),
  -- 상태와 시각이 어긋난 행이 아예 못 들어오게 한다
  constraint chk_sign_offs_decided  check ((status in ('approved', 'rejected')) = (decided_at is not null)),
  constraint chk_sign_offs_reject   check (status <> 'rejected' or coalesce(btrim(decision_note), '') <> ''),
  constraint chk_sign_offs_executed check (executed_at is null or status = 'approved'),
  constraint chk_sign_offs_title    check (coalesce(btrim(title), '') <> '')
);

create index if not exists idx_sign_offs_approver on public.sign_offs (approver_id, status);        -- 사이드바 배지
create index if not exists idx_sign_offs_pending  on public.sign_offs (status, executed_at);        -- '승인됨·미실행' 탭
create index if not exists idx_sign_offs_author   on public.sign_offs (created_name, requested_at); -- '내가 올린 것'

-- ---------------------------------------------------------------------------
-- 2) 이력 테이블 — 사람은 쓸 수 없다. security definer 트리거/RPC 만 쓴다.
-- ---------------------------------------------------------------------------
create table if not exists public.sign_off_events (
  id          bigint generated always as identity primary key,
  sign_off_id uuid not null references public.sign_offs(id) on delete restrict,
  at          timestamptz not null default now(),
  actor_id    uuid,
  actor_name  text not null,   -- 스냅샷: 프로필이 바뀌어도 "그때 누가"가 남는다(원문 이름)
  action      text not null
    check (action in ('created', 'edited', 'approved', 'rejected', 'withdrawn', 'executed', 'commented')),
  from_status text,
  to_status   text,
  note        text,
  snapshot    jsonb            -- 그 시점 본문 사본
);

create index if not exists idx_sign_off_events_parent on public.sign_off_events (sign_off_id, at);

-- ---------------------------------------------------------------------------
-- 3) 트리거 — 정책만 믿지 않고 값 자체를 서버가 정한다
-- ---------------------------------------------------------------------------

-- 3-1) INSERT: 작성자·상태·결재자 검증. 앱이 보낸 작성자/상태/결정/실행 값은 전부 무시한다.
create or replace function public.so_before_insert()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  v_me_id       uuid;
  v_me_name     text;
  v_appr_name   text;
begin
  select p.id, p.name into v_me_id, v_me_name
    from public.profiles p
   where p.id = auth.uid() and p.status = 'approved'
   limit 1;
  if v_me_id is null then
    raise exception '승인된 로그인 사용자만 결재를 올릴 수 있습니다.';
  end if;

  -- 작성자 위조 차단 — 앱이 뭘 보내든 서버가 덮어쓴다
  new.created_by   := v_me_id;
  new.created_name := public.so_normalize_name(v_me_name);

  -- 결재자는 "승인된 admin" 프로필이어야 한다. 나중에 admin 이 늘면 목록도 자연히 늘어난다.
  select p.name into v_appr_name
    from public.profiles p
   where p.id = new.approver_id and p.role = 'admin' and p.status = 'approved';
  if v_appr_name is null then
    raise exception '결재자는 승인된 관리자(admin)여야 합니다.';
  end if;
  new.approver_name := v_appr_name;

  new.owner_name := nullif(public.so_normalize_name(new.owner_name), '');

  -- 새 건은 항상 '대기'에서 시작한다
  new.status         := 'pending';
  new.requested_at   := now();
  new.decided_at     := null;
  new.decided_by     := null;
  new.decision_note  := null;
  new.executed_at    := null;
  new.executed_by    := null;
  new.executed_name  := null;
  new.execution_note := null;
  new.updated_at     := now();

  return new;
end;
$$;

drop trigger if exists trg_sign_offs_bi on public.sign_offs;
create trigger trg_sign_offs_bi before insert on public.sign_offs
  for each row execute function public.so_before_insert();

-- 3-2) UPDATE: 누가 무엇을 바꿀 수 있는지 전부 여기서 강제한다.
--      · 내용 수정   = 작성자, 대기 상태일 때만
--      · 승인/반려   = 지정된 결재자(uuid)만. decided_* 는 서버가 채운다
--      · 회수        = 작성자만, 대기 상태일 때만
--      · 실행 완료   = 승인된 건에만, 작성자·담당자·결재자 중 하나. 한 번 찍히면 못 바꾼다
--      · 역행 전이(approved → pending 등)는 전부 거부 — 잘못 승인했으면 새 결재를 올린다
create or replace function public.so_before_update()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  v_me_id      uuid;
  v_me_name    text;
  v_me_norm    text;
  v_appr_name  text;
  v_is_author  boolean;
  v_is_apprv   boolean;
  v_is_owner   boolean;
  v_content_ch boolean;
begin
  select p.id, p.name into v_me_id, v_me_name
    from public.profiles p
   where p.id = auth.uid() and p.status = 'approved'
   limit 1;
  if v_me_id is null then
    raise exception '승인된 로그인 사용자만 결재를 수정할 수 있습니다.';
  end if;
  v_me_norm := public.so_normalize_name(v_me_name);

  -- 작성자는 이름 기준으로도 인정한다(같은 사람이 계정을 여러 개 쓴다).
  -- 결재자는 권한 판정이라 uuid 기준만 인정한다.
  v_is_author := (old.created_by = v_me_id) or (old.created_name = v_me_norm);
  v_is_apprv  := (old.approver_id = v_me_id);
  v_is_owner  := (coalesce(old.owner_name, '') <> '' and old.owner_name = v_me_norm);

  -- 절대 바뀌지 않는 것
  new.id           := old.id;
  new.seq          := old.seq;
  new.created_by   := old.created_by;
  new.created_name := old.created_name;
  new.requested_at := old.requested_at;

  new.owner_name := nullif(public.so_normalize_name(new.owner_name), '');

  v_content_ch := (new.title, coalesce(new.body, ''), new.category, new.risk,
                   coalesce(new.rollback_ref, ''), coalesce(new.owner_name, ''),
                   new.approver_id, coalesce(new.company_id::text, ''))
              is distinct from
                  (old.title, coalesce(old.body, ''), old.category, old.risk,
                   coalesce(old.rollback_ref, ''), coalesce(old.owner_name, ''),
                   old.approver_id, coalesce(old.company_id::text, ''));

  -- (a) 본문 수정
  if v_content_ch then
    if old.status <> 'pending' then
      raise exception '대기 중인 결재만 내용을 수정할 수 있습니다.';
    end if;
    if not v_is_author then
      raise exception '작성자만 결재 내용을 수정할 수 있습니다.';
    end if;
    if new.approver_id <> old.approver_id then
      select p.name into v_appr_name
        from public.profiles p
       where p.id = new.approver_id and p.role = 'admin' and p.status = 'approved';
      if v_appr_name is null then
        raise exception '결재자는 승인된 관리자(admin)여야 합니다.';
      end if;
      new.approver_name := v_appr_name;
    else
      new.approver_name := old.approver_name;
    end if;
  else
    new.approver_name := old.approver_name;
  end if;

  -- (b) 상태 전이
  if new.status is distinct from old.status then
    if old.status <> 'pending' then
      raise exception '이미 처리된 결재(%)는 상태를 되돌릴 수 없습니다. 새 결재를 올려 주세요.', old.status;
    end if;

    if new.status in ('approved', 'rejected') then
      if not v_is_apprv then
        raise exception '지정된 결재자(%)만 승인·반려할 수 있습니다.', old.approver_name;
      end if;
      if new.status = 'rejected' and coalesce(btrim(new.decision_note), '') = '' then
        raise exception '반려 사유를 입력해 주세요.';
      end if;
      new.decided_at := now();
      new.decided_by := v_me_id;

    elsif new.status = 'withdrawn' then
      if not v_is_author then
        raise exception '작성자만 결재를 회수할 수 있습니다.';
      end if;
      new.decided_at := null;
      new.decided_by := null;

    else
      raise exception '알 수 없는 상태입니다: %', new.status;
    end if;
  else
    -- 상태가 그대로면 결정 관련 값은 손댈 수 없다(반려 사유 사후 수정 차단)
    new.decided_at    := old.decided_at;
    new.decided_by    := old.decided_by;
    new.decision_note := old.decision_note;
  end if;

  -- (c) 실행 완료 표시
  if new.executed_at is distinct from old.executed_at then
    if old.executed_at is not null then
      raise exception '이미 실행 완료로 표시된 건입니다.';
    end if;
    if new.executed_at is null then
      raise exception '실행 완료 표시는 취소할 수 없습니다.';
    end if;
    if old.status <> 'approved' then
      raise exception '승인된 건만 실행 완료로 표시할 수 있습니다.';
    end if;
    if not (v_is_author or v_is_owner or v_is_apprv) then
      raise exception '작성자·담당자·결재자만 실행 완료로 표시할 수 있습니다.';
    end if;
    new.executed_at   := now();
    new.executed_by   := v_me_id;
    new.executed_name := v_me_norm;
  else
    new.executed_by   := old.executed_by;
    new.executed_name := old.executed_name;
    -- 실행 전에는 실행 메모를 남길 수 없고, 실행 후 메모 수정은 실행 관계자만
    if old.executed_at is null then
      new.execution_note := old.execution_note;
    elsif new.execution_note is distinct from old.execution_note
      and not (v_is_author or v_is_owner or v_is_apprv) then
      raise exception '작성자·담당자·결재자만 실행 메모를 수정할 수 있습니다.';
    end if;
  end if;

  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_sign_offs_bu on public.sign_offs;
create trigger trg_sign_offs_bu before update on public.sign_offs
  for each row execute function public.so_before_update();

-- 3-3) 이력 자동 기록 — 앱이 빼먹어도 남고, 사람이 가짜 이력을 넣을 수도 없다.
create or replace function public.so_after_write()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  v_me_id   uuid;
  v_me_name text;
  v_action  text;
  v_note    text;
begin
  select p.id, p.name into v_me_id, v_me_name
    from public.profiles p where p.id = auth.uid() limit 1;

  if tg_op = 'INSERT' then
    v_action := 'created';
    v_note   := null;
  else
    if new.status is distinct from old.status then
      v_action := new.status;                 -- approved | rejected | withdrawn
      v_note   := new.decision_note;
    elsif new.executed_at is distinct from old.executed_at then
      v_action := 'executed';
      v_note   := new.execution_note;
    elsif (new.title, coalesce(new.body, ''), new.category, new.risk,
           coalesce(new.rollback_ref, ''), coalesce(new.owner_name, ''),
           new.approver_id, coalesce(new.company_id::text, ''))
       is distinct from
          (old.title, coalesce(old.body, ''), old.category, old.risk,
           coalesce(old.rollback_ref, ''), coalesce(old.owner_name, ''),
           old.approver_id, coalesce(old.company_id::text, '')) then
      v_action := 'edited';
      v_note   := null;
    else
      return null;                            -- 기록할 만한 변화 없음(메모 수정 등)
    end if;
  end if;

  insert into public.sign_off_events
    (sign_off_id, actor_id, actor_name, action, from_status, to_status, note, snapshot)
  values
    (new.id, v_me_id, coalesce(v_me_name, '알 수 없음'), v_action,
     case when tg_op = 'UPDATE' then old.status else null end,
     new.status, v_note,
     jsonb_build_object(
       'title', new.title, 'body', new.body, 'category', new.category, 'risk', new.risk,
       'owner_name', new.owner_name, 'approver_name', new.approver_name,
       'rollback_ref', new.rollback_ref));

  return null;
end;
$$;

drop trigger if exists trg_sign_offs_aiu on public.sign_offs;
create trigger trg_sign_offs_aiu after insert or update on public.sign_offs
  for each row execute function public.so_after_write();

-- 3-4) 댓글 — 이력 테이블에 사용자용 INSERT 정책이 없으므로 이 함수로만 남긴다.
create or replace function public.sign_off_comment(p_sign_off_id uuid, p_note text)
returns bigint
language plpgsql security definer set search_path = public
as $$
declare
  v_me_id   uuid;
  v_me_name text;
  v_status  text;
  v_evt_id  bigint;
begin
  select p.id, p.name into v_me_id, v_me_name
    from public.profiles p
   where p.id = auth.uid() and p.status = 'approved'
   limit 1;
  if v_me_id is null then
    raise exception '승인된 로그인 사용자만 댓글을 남길 수 있습니다.';
  end if;
  if coalesce(btrim(p_note), '') = '' then
    raise exception '댓글 내용이 비어 있습니다.';
  end if;

  select s.status into v_status from public.sign_offs s where s.id = p_sign_off_id;
  if v_status is null then
    raise exception '존재하지 않는 결재 건입니다.';
  end if;

  insert into public.sign_off_events (sign_off_id, actor_id, actor_name, action, to_status, note)
  values (p_sign_off_id, v_me_id, v_me_name, 'commented', v_status, btrim(p_note))
  returning id into v_evt_id;

  return v_evt_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- 4) RLS — 새 테이블은 Supabase 기본값이 "열림"이다. 같은 커밋에서 켠다(CLAUDE.md 2-2).
--    새로 만드는 테이블이라 옛 정책은 없지만, 관례대로 drop 후 create 한다.
-- ---------------------------------------------------------------------------
alter table public.sign_offs       enable row level security;
alter table public.sign_off_events enable row level security;

-- 4-1) sign_offs
--   SELECT: 승인된 사용자 전원 — 결재는 팀에 보여야 감사(監査)가 된다.
drop policy if exists p_sign_offs_select on public.sign_offs;
create policy p_sign_offs_select on public.sign_offs
  for select to authenticated
  using ((select public.is_approved()));

--   INSERT: 본인 명의로만. (트리거가 어차피 덮어쓰지만 정책에서도 막는다)
drop policy if exists p_sign_offs_insert on public.sign_offs;
create policy p_sign_offs_insert on public.sign_offs
  for insert to authenticated
  with check ((select public.is_approved()) and created_by = auth.uid());

--   UPDATE: 작성자(이름 기준 포함) · 담당자 · 결재자만 행에 손댈 수 있다.
--           "무엇을" 바꿀 수 있는지는 트리거가 정한다.
drop policy if exists p_sign_offs_update on public.sign_offs;
create policy p_sign_offs_update on public.sign_offs
  for update to authenticated
  using (
    (select public.is_approved())
    and (
      created_by = auth.uid()
      or approver_id = auth.uid()
      or created_name = (select public.so_my_norm())
      or (coalesce(owner_name, '') <> '' and owner_name = (select public.so_my_norm()))
    )
  )
  with check (
    (select public.is_approved())
    and (
      created_by = auth.uid()
      or approver_id = auth.uid()
      or created_name = (select public.so_my_norm())
      or (coalesce(owner_name, '') <> '' and owner_name = (select public.so_my_norm()))
    )
  );

--   DELETE: 정책 없음 = 삭제 불가. 잘못 올렸으면 삭제가 아니라 회수(withdrawn)다.

-- 4-2) sign_off_events — SELECT 만. INSERT/UPDATE/DELETE 정책을 만들지 않으므로
--      RLS 하에서 통째로 막힌다 → 이력은 불변. 쓰기는 security definer 트리거/RPC 뿐.
drop policy if exists p_sign_off_events_select on public.sign_off_events;
create policy p_sign_off_events_select on public.sign_off_events
  for select to authenticated
  using ((select public.is_approved()));

-- ---------------------------------------------------------------------------
-- 5) 권한 — Supabase 는 public 스키마 신규 테이블에 anon/authenticated GRANT 를
--    기본 부여한다. anon 은 반드시 회수하고, authenticated 도 필요한 것만 남긴다.
--    (RLS 가 있어도 GRANT 를 줄여두면 정책이 느슨해졌을 때의 피해가 줄어든다)
-- ---------------------------------------------------------------------------
revoke all on public.sign_offs       from anon;
revoke all on public.sign_off_events from anon;

revoke all on public.sign_offs       from authenticated;
revoke all on public.sign_off_events from authenticated;

grant select, insert, update on public.sign_offs to authenticated;  -- delete 없음
grant select                 on public.sign_off_events to authenticated;  -- 읽기 전용

-- 함수 EXECUTE 는 기본이 PUBLIC 이다 → 반드시 회수한다.
revoke all on function public.so_normalize_name(text)          from public, anon;
revoke all on function public.so_my_name()                     from public, anon;
revoke all on function public.so_my_norm()                     from public, anon;
revoke all on function public.so_before_insert()               from public, anon;
revoke all on function public.so_before_update()               from public, anon;
revoke all on function public.so_after_write()                 from public, anon;
revoke all on function public.sign_off_comment(uuid, text)     from public, anon;

-- 트리거 함수는 트리거로만 호출된다 → authenticated 도 직접 호출할 수 없게 회수한다.
-- ⚠️ Supabase 는 public 스키마 신규 함수에 anon/authenticated/service_role EXECUTE 를
--    기본 부여한다(alter default privileges). "from public, anon" 만 회수하면
--    authenticated 직접 호출 경로가 그대로 남는다 — 2026-08-10 검증에서 실제로 걸렸다.
revoke all on function public.so_before_insert()               from authenticated;
revoke all on function public.so_before_update()               from authenticated;
revoke all on function public.so_after_write()                 from authenticated;

grant execute on function public.so_normalize_name(text)       to authenticated;
grant execute on function public.so_my_name()                  to authenticated;
grant execute on function public.so_my_norm()                  to authenticated;
grant execute on function public.sign_off_comment(uuid, text)  to authenticated;

commit;
