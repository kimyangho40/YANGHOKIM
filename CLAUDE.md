# 작업 규칙 (재발방지 체크리스트)

이 저장소는 단일 대형 파일 `src/App.js`(약 18,900줄, React + Supabase)에 대부분의 로직이 모여 있습니다.
공용 함수/표시 필터 하나를 건드리면 여러 기능이 동시에 영향받기 쉽습니다.
기능 추가·수정 요청을 받으면 **아래 절차를 반드시 지킬 것.**

## 1. 수정 전 — 공용 로직 영향 범위 먼저 확인
- 바꾸려는 함수/변수/상태(state)를 **어디서 쓰는지 grep으로 전부 찾고**, 이 변경이
  요청한 기능 외 다른 기능에도 영향을 주는지 먼저 판단한다.
- 특히 아래는 "공용"이라 조심:
  - 체크박스/완료 상태 변경 로직 (`toggleDone`, `markDone`, `is_done`, `status`)
  - 표시 필터 (`displayNotes`, `doneCount`, `showDone` 등 목록 필터/집계 useMemo)
  - 이름 정규화(`normalizeName`), 날짜(`kstDate`), 태그(`MentionField`)
- **상태 값이 다른 의미인지 구분**: 이번 버그의 원인은 `team_notes.status`의
  `taken`(가져감=진행중)과 `done`(완료)을 같은 것으로 취급한 것.
  - `work_requests.status`: `pending` → `read` → `done` (업무 요청 흐름)
  - `team_notes.status`: `open`(대기) → `taken`(진행중) → `done`(완료)
  - 두 흐름은 **다른 테이블·다른 의미**다. 절대 섞지 말 것.

## 2. push 전 — 회귀(regression) 자가 체크리스트
"이번에 요청한 기능"뿐 아니라 "이번 수정으로 영향받을 수 있는 기존 기능"도
스스로 목록을 만들어 코드로 확인한 뒤 push한다. 최소 확인 대상:

- [ ] 업무노트: 개인화 / 자동제목 / 이월 / 대기사유 / @업체 태그
- [ ] 업무 요청: 보내기 · 가져가기 · 완료 체크가 **각각 독립적으로** 동작
- [ ] 빠른 메모 · 빠른 업무
- [ ] 실시간 팀 채팅
- [ ] 팀 업무 공간: 완료 자동 숨김 / 공지 확인 / 우선순위 / 공지 고정
- [ ] 졸업후보기업 판별
- [ ] 기업목록 인라인 편집
- [ ] 대시보드 위젯
- [ ] 모바일 `/m` 탭
- [ ] `CI=true npx react-scripts build` 통과(빌드 에러 0)

### 2-1. 파일 업로드/파싱 기능은 "실제 파일"로 검증
- 엑셀/시트지 파싱을 건드리면 **여러 형식의 실제 파일**로 확인한다:
  - 순정 MS Excel 파일 (기존 정상 동작 회귀 확인 — 폴백 경로를 타면 안 됨)
  - 한셀/한컴오피스로 만든 xlsx (네임스페이스 접두사 + `hs:` 확장 → 정규화 폴백)
- 확인 방법: `node`로 `node_modules/xlsx`를 직접 로드해 실제 파일을 파싱, 추출 행/필드 수를 눈으로 확인.

## ✅ `work_notes` 개인노트 비공개 — 2026-08-05 조치 완료
(2026-08-01 발견 → 2026-08-05 적용. SQL: `업무노트_개인노트_비공개_RLS.sql` / 되돌리기 `_rollback.sql`)

예전 문제: 정책이 `p_work_notes_all`(ALL/`authenticated`/`is_approved()`) 하나뿐이라 사용자 스코프가 없어,
승인된 로그인 사용자면 누구나 남의 노트를 전건 조회할 수 있었다(화면 `wnViewable` 필터로만 가려짐).

지금 상태 — 정책 4개(select/insert/update/delete)로 교체. 열람 범위는 **App.js `wnViewable()`과 동일**:
양호=전원 / 미현↔인선=서로 / 나머지=본인 담당(assignee)만. **예외 하나: `company_id`가 붙은 노트는 팀 공유**
(기업 상세 타임라인용, 2026-08-05 기준 401건 중 5건).

**앞으로 work_notes를 건드릴 때 반드시 지킬 것**
- 열람 규칙을 바꾸면 **App.js `wnViewable`/`WN_ADMINS`/`WN_SHARE_GROUPS`와 SQL `wn_visible_names()`/`wn_is_admin()`을
  같이** 고친다. 한쪽만 고치면 "화면엔 있는데 DB가 안 준다"(또는 그 반대)가 된다.
- **남의 노트를 읽어야 하는 새 기능은 만들지 말 것.** 필요하면 숫자만 주는 `security definer` 함수로:
  - `wn_team_unfinished()` — 담당자별 미완료/3일↑방치/최고참 날짜 (대시보드 '담당자별 미완료 현황')
  - `wn_activity_counts(since)` — 담당자별 노트 수정 건수·마지막 활동 (팀 활동 위젯)
  - ⚠ `wn_team_unfinished()`의 미완료 판정 정규식은 `parseUnfinishedItems`를 SQL로 옮긴 것이다.
    **둘 중 하나만 고치면 숫자가 어긋난다.** 고쳤으면 JS↔SQL 집계를 다시 대조할 것(2026-08-05엔 10명 전원 일치).
- **남의 노트에 쓰는 기존 기능**(업무 요청·빠른 업무)은 `wn_append_todo(담당자, 날짜, 줄, 기업id, 제목)` 경유.
  직접 `select` 후 `update` 하면 상대 노트를 못 찾아 **같은 날 노트가 두 장** 생긴다.
- ⚠️ `insert(...).select()`는 **넣은 행이 SELECT 정책에 걸리면 42501 에러**가 난다(0건이 아니라 에러).
  남의 담당으로 노트를 새로 만드는 경로는 지금 **양호 전용(`isWnAdmin`)뿐이라** 문제가 없다.
  일반 사용자도 남에게 노트를 만들게 하려면 `.select()`를 빼거나 전용 함수를 만들 것.
- 함수는 `EXECUTE` 기본값이 PUBLIC이다 → 새로 만들면 **`revoke ... from public, anon` + `grant ... to authenticated`**.

## ✅ `chat_messages` DM 비공개 — 2026-08-10 조치 완료
(2026-08-02 발견 → 2026-08-10 적용. SQL: `채팅_DM_비공개_RLS.sql` / 되돌리기 `_rollback.sql` / 동작검증 `채팅_DM_비공개_동작검증.sql` 26/26 통과)

예전 문제: 정책 3개의 조건이 `is_approved()`뿐이라 **채널 스코프가 없었다**. 채널 판정은 화면 `canAccessChannel()`뿐이라
`fetchChatUnread`가 채널 조건 없이 본문까지 1000건을 받아오면서 **승인된 사람 누구나 남의 DM 본문**을 브라우저로 받았고,
**남의 메시지 수정·삭제도 DB에서는 열려** 있었다(work_notes 개인노트와 같은 계열 — `sender`가 이름 텍스트라 `auth.uid()`와 직접 비교가 안 됨).

**앞으로 chat_messages를 건드릴 때 반드시 지킬 것**
- 채널 규칙은 **App.js `canAccessChannel`/`CHAT_TEAMS`(App.js:3578)와 SQL `chat_can_access(channel, me)`가 한 쌍**이다.
  팀 목록은 `profiles.team`이 아니라 **App.js 하드코딩 배열이 원본**(인선은 team='개인전담'이지만 채팅은 corporate).
  한쪽만 고치면 "화면엔 채널이 있는데 메시지가 안 온다"가 된다. 고쳤으면 동작검증을 다시 돌릴 것.
- **관리자(양호)도 남의 DM은 못 본다.** work_notes와 달리 전체 열람 예외가 없다(App.js에도 없다).
  `chat_is_admin()`은 "내가 볼 수 있는 채널에서 남의 메시지 삭제"에만 쓴다.
- 읽음표시(`read_by`)는 **남의 메시지에 쓰는 게 정상**이라 UPDATE를 본인 것으로 좁힐 수 없다.
  → 채널까지만 정책으로 막고, 그 안쪽(남의 본문 수정·삭제, sender/channel 바꿔치기)은 **트리거 `trg_chat_protect_update`**가 막는다.
- 트리거는 `auth.uid() is null`이면 통과시킨다 — service_role·`run-sql.js` 같은 관리 작업을 막지 않기 위해서다.

## ⚠️ `team_notes` 는 work_notes·DM 과 **같은 계열이 아니다** — 2026-08-11 확인
(SQL: `팀노트_사칭변조_방지.sql` / 되돌리기 `_rollback.sql` / 동작검증 `_동작검증.sql` 8/8 통과)

**팀 구분은 "접근 권한"이 아니라 "분류"다.** App.js `TeamNotesSection` 은 `activeTab` 으로
법인/개인/전체 탭을 전환해 **누구나 모든 팀 노트를 본다**(App.js:27541). 화면과 DB 가 이미 일치한다.
→ **RLS 를 팀 스코프로 조이면 화면이 통째로 깨진다. 조이지 말 것.**
(`teamRoster`/`TEAM_MEMBERS` 는 "공지 확인 대상 명단"이지 열람 권한이 아니다. `teamKeyOfProfile` 은
팀 업무 저장 팝업의 기본값 전용이다. 셋 다 열람 필터가 아니다 — 헷갈리기 쉬우니 주의.)

열람 쪽 실측: RLS on / 정책은 `p_team_notes_all` 하나(`to authenticated`, using·with_check 둘 다
`is_approved()`) / anon 권한 0건. 비로그인 노출 없음.

그래서 막은 것은 열람이 아니라 **쓰기 쪽 사칭·변조**다(chat 의 `trg_chat_protect_update` 와 같은 계열):
- `trg_team_notes_protect` — INSERT 시 `posted_by` 를 본인으로 강제, UPDATE 시 `posted_by`·`team` 을 조용히 원복.
  ⚠ 확인(`read_by`)·가져가기·완료(`status`)·체크리스트·내용수정·soft delete 는 **전부 통과**한다.
  남의 노트에 쓰는 게 정상인 기능이라 UPDATE 를 본인 것으로 좁힐 수 없다(chat 과 같은 이유).
- `trg_team_notes_no_hard_delete` — 하드 DELETE 차단(앱은 전부 `deleted_at` soft delete). 관리자도 못 지운다.
- 두 트리거 모두 `auth.uid() is null` 이면 통과 — service_role·`run-sql.js` 관리 작업을 막지 않기 위해서다.

**앞으로 team_notes 를 건드릴 때**: `posted_by`·`team` 을 바꾸는 UPDATE 경로나 하드 DELETE 경로를
새로 만들면 트리거에 막힌다. 정말 필요하면 트리거를 같이 고치고 동작검증을 다시 돌릴 것.

## 2-3. 세션 수명 제한은 pg_cron 이 대신한다 (2026-08-11)
Supabase 정식 기능(`sessions_timebox`/`sessions_inactivity_timeout`)은 **Pro 플랜 전용**이라
무료 플랜에선 Management API 가 **402** 를 준다. 그래서 `auth.sessions` 를 직접 청소한다.
- cron 작업 `sweep-stale-sessions` — 매일 UTC 18:00(KST 03:00), 생성 30일 초과 또는 14일 미갱신 세션 삭제.
  SQL: `세션수명제한_pg_cron_자동청소.sql` / 해제 `_rollback.sql`
- `auth.refresh_tokens.session_id` 가 **ON DELETE CASCADE** 라 세션을 지우면 리프레시 토큰도 사라진다
  (실측: 세션 30→17 일 때 토큰 822→306). 다만 액세스 토큰은 살아 있어 **최대 1시간 뒤** 로그아웃된다.
- ⚠️ **즉시 차단이 필요하면 이걸 쓰지 말 것** — 그건 `profiles.status='rejected'` 담당이다.
  비활성화하면 세션은 살아 있어도 데이터·API 가 전부 즉시 막힌다(실증 9/9, `퇴사자_세션차단_실증.sql`).
  단 그 UPDATE 는 `trg_protect_profile` 때문에 **관리자 컨텍스트에서만** 먹는다(아래 2-4).

## 2-4. `profiles.role`/`status` 변경은 관리자 컨텍스트에서만 먹는다
`trg_protect_profile` → `protect_profile_privileges()` 가
`if not public.is_admin() then new.role := old.role; new.status := old.status; end if;` 다.
`scripts/run-sql.js` 는 `auth.uid()` 가 없어 `is_admin()`=false → **에러 없이 조용히 되돌린다.**
커밋은 성공하는데 값은 그대로라 "됐다"고 오판하기 딱 좋다. 반드시 이렇게 감쌀 것:
```sql
set request.jwt.claims = '{"sub":"<admin uuid>","role":"authenticated"}';
set role authenticated;
update public.profiles set status = '...' where ...;
reset role;
```
(`is_admin()` = uid 가 `role='admin' and status='approved'`. 현재 양호·정원만 해당.)

## 2-2. DB 테이블을 새로 만들면 — RLS를 같은 커밋에서 켠다
Supabase는 테이블 기본값이 **"열림"**이라, RLS를 켜지 않으면 비로그인 anon key로 전건이 조회된다.
과거 `보안_RLS_승인제_SETUP.sql`이 테이블을 **이름으로 나열**하는 방식이라, 그 뒤에 만든 테이블마다
구멍이 생겼다(2026-07-27 사고: 10,801건 노출). 목록 방식에 기대지 말고 **테이블을 만든 그 커밋에서** 처리한다.

- [ ] `alter table public.<t> enable row level security;`
- [ ] `is_approved()` 기반 정책 부여(승인된 로그인 사용자만). **`to public` / `to anon` 정책은 만들지 않는다.**
- [ ] anon 권한 회수: `revoke all on public.<t> from anon;`
- [ ] 옛 정책이 남아 있지 않은지 확인 — PERMISSIVE 정책은 **OR로 합쳐져서**,
      `{anon} USING(true)` 하나만 남아도 새 정책이 무력화된다.
      **같은 역할(`authenticated`)끼리도 마찬가지다.** 정책을 "추가"하면 조이는 게 아니라 **푸는** 결과가 된다.
      새 정책을 만들 때는 **반드시 옛 정책을 `drop`하고** 만들 것.
      (2026-07-29 사고: `profiles`에 INSERT 정책이 2개 — 엄격한 `p_profiles_insert`
      (`role='member' AND status='pending'`)와 느슨한 `profiles insert own`(`auth.uid()=id`)이 OR로 합쳐져
      실효 조건이 `auth.uid()=id` 하나뿐이었다. 신규 가입자가 자기 프로필을
      `role='admin', status='approved'`로 INSERT하면 **승인 절차를 건너뛰고 관리자**가 됐다.
      트리거 `trg_protect_profile`은 `BEFORE UPDATE` 전용이라 INSERT 경로를 막지 못했다.
      → 구 정책 3개 제거 + `BEFORE INSERT` 트리거(`protect_profile_insert`) 추가로 봉쇄.
      **정책은 언제든 다시 느슨해질 수 있으니, 값 강제는 트리거로 이중 방어할 것.**)
- [ ] 배포 전 점검(결과가 **0행**이어야 정상):
      ```sql
      select c.relname from pg_class c
       where c.relnamespace='public'::regnamespace and c.relkind='r' and c.relrowsecurity = false;
      ```
- Storage 버킷도 같다: `public=false` + 정책은 `to authenticated`.
  공개 버킷이 아니므로 **`getPublicUrl()`을 쓰면 안 된다** → `createSignedUrl()`(App.js `StorageAudio`).
- `/api/*` 서버리스 함수를 새로 만들면 **첫 줄에 `denyUnauthorized(req, res)`**(`api/_auth.js`).
  검사가 없으면 누구나 호출해 `ANTHROPIC_API_KEY` 요금을 태울 수 있다.
  프런트는 반드시 `callApi()`(App.js)로 호출한다 — 토큰·anon key 헤더를 붙여준다.
- ⚠️ 판정 함정: RLS는 "거부"가 아니라 "필터링"이라 **`200 OK` + 0건이 정상 차단 상태**다.
  또 PostgREST는 RLS가 막았을 때와 0행 매칭일 때 **둘 다 204**를 준다 →
  "없는 id로 UPDATE 찔러보기"로는 쓰기 권한을 판정할 수 없다. 카탈로그(`pg_policies`·GRANT)로 확인할 것.
- ⚠️ `revoke`는 **grantor가 다르면 에러 없이 아무것도 안 한다.** 권한을 부여한 롤과 회수하는 롤이
  다르면(예: `supabase_admin`이 준 것을 `postgres`로 회수) 조용히 통과하고 권한은 그대로 남는다.
  **"성공했으니 회수됐다"고 믿지 말 것** — 실행 후 반드시 카탈로그로 재확인한다:
  ```sql
  select table_name, privilege_type, grantor from information_schema.role_table_grants
   where table_schema='public' and grantee='anon';   -- 0행이어야 정상
  ```
- ⚠️ `scripts/run-sql.js`는 여러 SELECT가 든 파일을 실행해도 **결과를 하나만** 출력하고,
  그게 **파일 마지막 검증 쿼리가 아닐 수 있다.**
  (2026-07-29: `anon_GRANT_회수_16개테이블.sql` 실행 후 파일 **상단의 사전 스냅샷**(회수 전 112행)이 찍혀
  회수가 실패한 것처럼 보였다. 실제로는 정상 회수된 상태였다.)
  → **검증은 조치 파일에 딸린 SELECT를 믿지 말고, 실행 후 별도 조회로 다시 확인할 것.**

## 3. 완료 보고 시 — "회귀 확인 완료" 여부 명시
매 기능 추가/수정 완료 보고에 **반드시 "회귀 확인 완료" 여부와 점검한 항목**을 같이 적는다.
깨진 게 있으면 목록으로 보고하고 "고칠 것 vs 이번엔 보고만 할 것"을 구분한다.

## 참고: 알려진 함정
- 팀 업무 표시 필터는 반드시 `status === "done"`만 완료로 취급.
  `status !== "open"`으로 집계하면 `taken`(진행중)이 완료로 오인된다. (2026-07-21 수정)
- ⚠️ 모바일 `MobileApp`은 **`TeamNotesSection`을 렌더한다**(`tab === "team"`, 데스크톱 컴포넌트 재사용).
  예전에는 안 그랬으나 지금은 아니다 — **팀 업무 관련 수정은 모바일에도 그대로 영향**을 준다. (2026-08-01 확인)
  단 `WorkNotesView`는 데스크톱 전용이라, 업무노트(work_notes) 화면 수정은 모바일에 영향이 없다.
  모바일은 업무노트를 자체 UI로 그린다(`newItems` 등).
- 한셀/한컴오피스로 만든 xlsx는 표준 엑셀과 달리 ①모든 요소 태그에 `x:` 네임스페이스 접두사(`<x:row>`,`<x:c>`,`<x:si>`),
  ②리치텍스트/스타일에 haansoft 전용 확장(`<hs:size>` 등)을 `mc:AlternateContent`로 섞는다.
  SheetJS는 이 둘 때문에 **에러 없이 0행**을 반환하거나 `"Unrecognized rich format"` 예외로 실패한다.
  → 업로드 xlsx 읽기는 반드시 `readUploadedWorkbook()`(App.js) 경유. 표준 읽기로 셀이 0개면 fflate로 XML을 정규화 후 재시도한다.
  정상 엑셀은 첫 시도에서 끝나 fflate를 로드하지 않는다(동작·성능 무변경). (2026-07-24 수정: (주)에이치앤와이상사 파일 0개 → 7필드)
