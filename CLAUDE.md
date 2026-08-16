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

### ⚠️ team_notes 에는 "누가 수정했는지"가 없다 — 알림에서 본인 제외를 DB 로 못 한다 (2026-08-16)
`posted_by` 는 **카드를 처음 만든 사람**이고, 항목 추가·수정은 **누구나** 할 수 있다.
채팅(`sender`)·업무요청(`request_from`)처럼 행 값만 보고 "내가 한 일"을 걸러낼 수가 없다.
→ 그래서 **저장하는 브라우저가 저장 직전에 노트 id 를 모듈 전역 `_teamNoteSelfEdit` 에 찍고**
(`markTeamNoteSelfEdit`), 되돌아온 Realtime UPDATE 를 10초간 건너뛴다(`isTeamNoteSelfEdit`).
저장하는 곳(`TeamNotesSection`)과 알림을 내는 곳(App)이 **다른 컴포넌트라** 모듈 전역에 뒀다.
- **항목이 늘어난 저장에만 찍는다.** 제목만 고친 저장까지 찍으면 그 10초 동안 남이 추가한 항목을 놓친다.
- 팀 업무 **항목 추가 알림은 "체크리스트 항목 수가 늘어난 UPDATE"만** 낸다(`handleTeamItemAdded`).
  확인(`read_by`)·가져가기·완료·내용수정은 항목 수가 그대로라 자동으로 걸러진다 — 이게 과다알림을 막는 유일한 장치다.
  판정 근거인 직전 개수는 `teamItemCountRef`(노트 id → 개수)에 있고, **구독 시작 스냅샷과 INSERT 이벤트에서 채운다.**
  둘 중 하나라도 빠지면 그 카드의 **첫 항목 추가를 통째로 놓친다**(비교 기준이 없어 조용히 return).
- `read_by` 는 **일부러 검사하지 않는다** — 이미 확인한 카드라도 새 항목이 붙으면 알려야 한다.
  (INSERT 알림과 다른 점. 거기선 "이미 확인함"이 곧 "이미 본 카드"였다.)
- ⚠️ **이 알림은 실사용 테스트가 팀 전원에게 울린다.** `read_by` 를 안 보므로 CLAUDE.md 의
  "나만 테스트하는 법"(read_by 에 남들 이름 미리 넣기)이 **여기엔 통하지 않는다.**

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

## ⚠️ 파이프라인 단계 · 계약금 정산 반영 — 2026-08-11 신설
(SQL: `파이프라인_단계개편_계약금입금완료.sql` 7/7 · `계약금_수수료율_컬럼추가.sql` 8/8, 각 `_rollback`/`_검증`)

**"계약금입금완료"는 이제 두 컬럼에 같은 글자로 존재한다. 일부러 그렇게 뒀다.**
- `companies.contract_status` (`CONTRACT_STATUSES`) — 서명 절차가 어디까지 갔나
- `companies.stage` / `pipeline_cards.stage` (`STAGES` STEP2, 상수 `CONTRACT_PAID_STAGE`) — 파이프라인 단계

같은 이름이면 같이 움직여야 혼동이 없다 → **양방향 연동**을 코드로 유지한다:
- 계약 상태를 켜면 → `advanceCardsToContractPaid()` 가 그 업체의 열린 카드를 STEP2 로 **앞으로만** 옮긴다.
  이미 STEP2 를 지난 카드는 안 건드린다(뒤로 끌면 진행이 후퇴한다). 부결/반려·기타는 STAGES 뒤쪽이라 자동 제외.
  드래그 이동과 같은 의미가 되도록 `sync_mode='manual'` 로 고정한다 —
  **안 그러면 다음 기관상태 자동 동기화(`status_stage_map`)가 단계를 되돌려 놓는다.**
- 카드를 STEP2 로 드래그하면 → `contract_status` 를 켜고 같은 정산 반영 경로를 탄다.

**정산 자동 반영(`syncSettlementFromCompany`)에서 지킬 것**
- 조건은 **OR** 다: `contract_status='계약금입금완료'` **또는** `fee_status='수수료수령완료'`.
- 반영하는 건 **계약금(`contract_fee`)·수수료율(`commission_rate`) 둘뿐**이다.
  ⚠️ **`settlement_manual.commission_fee`(수수료 "금액")는 절대 건드리지 말 것.** 사람이 직접 넣는 칸이다.
  함수는 그 키를 아예 쓰지 않는다 — 새 기능을 붙일 때도 넣지 말 것.
- 대상은 **같은 업체명의 수동 정산행 중 최신 1건**. 없으면 새로 만든다.
  자동행(`agency_cases`)은 대상이 아니다 — 수수료율 컬럼 자체가 없다.
- **매 저장마다 밀어넣지 않는다.** 조건이 새로 참이 됐거나 계약금·수수료율 값이 실제로 바뀐 경우만 보낸다.
  (안 그러면 정산관리에서 사람이 고쳐 둔 계약금을 저장할 때마다 덮어쓴다.)
- 계약 상태 버튼은 즉시 저장이라, 켤 때 **계약금·수수료율도 같은 UPDATE 에 실어 보낸다.**
  안 실으면 "정산엔 반영됐는데 기업정보엔 저장 안 된" 상태가 만들어진다.

**폐지된 "스크립트 전달 완료"** — 카드 0건·기업 0건·기관상태 0건이라 데이터 이동 없이 지웠다.
같이 지운 것: `status_stage_map` 규칙 1건(남기면 그 상태가 되는 순간 보드에 없는 단계로 카드가 날아가 **화면에서 사라진다**),
`stage_stagnation_config` 행 1건. 새 단계 정체 기준은 `enabled=false` 로 넣었다(알림을 임의로 늘리지 않기 위해).

## ⚠️ 배정DB — 구글시트 조회 전용 화면 — 2026-08-12 신설 (1단계)
DB 변경 0건. 사이드바 `더보기 → 배정DB`(`view === "assigndb"`, `AssignDbView`).

**시트가 원본이고 CRM 은 거울이다.** 수정 기능은 **일부러 안 만들었다**(사용자 결정 — 이사님은 시트에서만 작성).
쓰기 기능을 붙이자는 요청이 오면 "시트 ↔ CRM 어느 쪽이 최신인가" 충돌 규칙부터 정해야 한다.

- 시트: `배정DB_김동일 이사님` / `ASSIGN_DB_SHEET_ID = 1LQ_BF9vU-4J-PpX-r-HWj213ftZA4GjZkbFcrnU8A-g`
- 읽는 법: **Drive API 로 xlsx export → 기존 `readUploadedWorkbook()`**.
  Drive API·`drive.readonly` 스코프를 이미 쓰고 있어 **추가 구글 동의창도, 콘솔 설정도 없다.**
  · Sheets API 를 쓰려면 Cloud 콘솔에서 API 사용설정을 켜야 한다(안 켜면 403) — 그래서 안 썼다.
  · CSV export 는 쓰지 말 것 — 메모·진행방향 칸에 줄바꿈과 쉼표가 섞여 있어 파싱이 깨진다.
  · ⚠️ export 는 **첫 번째 탭만** 준다. 탭이 늘면 첫 탭만 보인다(화면 하단에 안내 있음).
- **컬럼을 코드에 박지 말 것.** 이 화면의 존재 이유가 "시트를 고쳐도 CRM 은 안 고친다"이다.
  헤더 행을 `findAssignDbHeaderRow()` 로 매번 찾아 그 순서 그대로 그린다.
  ⚠️ 헤더 판정에서 **찬 칸 수만 세면 안 된다** — 헤더 행은 A열(순번)이 비어 있어 데이터 행보다
  한 칸 적고, 그러면 첫 데이터 행이 헤더로 잡혀 **표가 통째로 한 줄 밀린다**(실제로 그렇게 틀렸다).
  그래서 `assignDbHeaderScore()` 가 "짧은 글자 칸 +2 / 숫자·날짜·금액 칸 −3 / 힌트 이름 ×20"으로 채점한다.
  힌트(`ASSIGN_DB_HEADER_HINTS`)가 하나도 안 맞아도(=컬럼명을 전부 바꿔도) 동작한다.
- 토큰은 기존 `getDriveToken()`/`connectGoogleDrive()` 그대로 — 브라우저 localStorage, 약 1시간 만료.
  서버에 refresh token 을 저장하지 않는다(2026-07-27 사고 이후 `google_oauth_tokens` 잠긴 채 유지).

### 2단계 — Apps Script → Supabase 캐시 (2026-08-12, 지금 이게 기본 경로)
(SQL: `배정DB_스냅샷_테이블.sql` / `_rollback` / `_검증` 8/8 · 엔드포인트 `api/assign-db-sync.js` 검사 19/19)

1단계는 **브라우저가 본인 구글 계정으로 직접 읽어서**, 시트 소유자 계정이 아니면 막혔다.
2단계는 그 제약을 없앤다 — 팀원은 **CRM 로그인만 하면 되고 구글 연결이 아예 필요 없다.**

```
구글시트 → Apps Script(설치형 onChange + 10분 안전망) → /api/assign-db-sync → assign_db_snapshot → 화면(Realtime)
```

- **테이블은 `assign_db_snapshot` 1행뿐이고 `grid jsonb` 에 시트 2차원 배열을 가공 없이 넣는다.**
  ⚠️ 컬럼을 고정 스키마로 펼치지 말 것 — 펼치는 순간 "시트를 고쳐도 CRM 은 안 고친다"가 깨진다.
  헤더 판정은 **Apps Script 도 서버도 아니고 App.js `buildAssignDbTable()` 한 곳**에서만 한다.
  1단계 직접 읽기와 2단계 스냅샷이 **같은 함수를 통과**하므로 결과가 갈라지지 않는다.
- **쓰기 정책을 만들지 않았다.** `authenticated` 는 SELECT 권한만 있다(INSERT/UPDATE/DELETE 회수).
  쓰기는 service_role 로 서버리스 함수만 한다 → 사람은 아무도 못 쓴다.
- ⚠️ **`api/assign-db-sync.js` 는 다른 5개 엔드포인트와 인증 방식이 다르다.**
  기계(Apps Script)가 부르므로 사람 JWT 가 없어 `denyUnauthorized()` 를 쓸 수 없다.
  대신 공유키(`ASSIGN_DB_SYNC_SECRET`) 상수시간 비교. **이 키로 할 수 있는 일은 스냅샷 1행 갱신뿐**이다.
  service_role 키를 구글에 두지 않는 이유: 시트 편집 권한자가 스크립트를 열면 RLS 를 통째로
  우회하는 DB 마스터키를 보게 된다. service_role 은 Vercel 환경변수에만 둔다.
- 안전장치: **행 0건은 반영하지 않는다**(시트 사고로 데이터가 날아가도 스냅샷은 보존 — 시트가 원본이라
  다음 정상 동기화 때 복구된다). 40만 칸 초과는 413.
- Apps Script 는 내용이 그대로면 전송을 생략한다(md5 지문) → 10분 안전망이 돌아도 헛일을 안 한다.
- 필요한 환경변수(Vercel): `ASSIGN_DB_SYNC_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`.
  **둘 중 하나라도 없으면 500 + 어느 값이 없는지 알려준다** — 설치 중 원인을 못 찾는 게 더 위험해서 일부러 그렇게 했다.
- 시트 쪽 코드 원본: `apps-script/배정DB_동기화.gs` (저장소엔 참고용, 실제로는 시트 안에서 돈다).
  트리거를 고치면 `setupAssignDbSync()` 를 다시 실행해야 반영된다.
- 구글 직접 읽기는 **비상용 버튼으로만** 남겼다(동기화가 멈췄을 때 권한 있는 사람이 확인). 이때는
  "🆘 구글에서 직접 읽음 (이 화면에만)" 배지가 뜬다 — 남에게는 안 보이는 내용이라는 표시다.

## ⚠️ 파이프라인 카드 일괄 이동 · 삭제(휴지통) — 2026-08-12 신설
(SQL: `파이프라인_카드삭제_휴지통.sql` / `_rollback` / `_검증` 8/8)

**카드 1행 = (회사 × 기관) 조합**이다. 카드를 지워도 `companies`(기업)도 `agency_cases`(기관현황 원본)도
건드리지 않는다 — 그 기업의 그 기관 신청 건 하나만 사라진다. 반대 방향만 연결돼 있다
(`company_id ... on delete cascade` → 기업을 **영구삭제**하면 카드도 같이 사라짐).

**⚠️ 최대 함정: 삭제한 카드가 되살아난다.**
`syncPipelineFromCase()`(App.js:1196)는 기관현황을 저장할 때마다 (회사×기관) 카드를 찾고 **없으면 새로 만든다.**
그래서 카드 조회에 **`deleted_at` 필터를 걸면 안 된다** — "카드 없음"으로 오판해 insert 로 내려가는데,
삭제된 카드가 unique 슬롯을 쥐고 있어 **unique 위반 에러**가 난다.
→ 조회는 삭제분까지 포함해서 하고, `if (card.deleted_at) return;` 으로 **조용히 끊는다**(`sync_mode==='manual'` 과 같은 자리).
실측으로 확인함: 삭제 후 `deleted` 포함 조회 1건 / 제외 조회 0건 / 그 상태 insert → `unique_violation`.

**unique index 는 일부러 완화하지 않았다.** `pipeline_cards_company_agency_uniq` 를 `where deleted_at is null` 로
바꾸면 같은 조합 카드가 보드와 휴지통에 동시에 생겨 **복구 시점에 충돌**한다. 지금은 삭제 카드가 슬롯을
계속 점유해서 복구가 **항상 성공**한다. 대신 같은 조합을 새로 만들려 하면 막히므로,
`findDupCard` 가 삭제분도 찾아 "휴지통에서 복구하세요"로 안내한다(`dupAlert`).

**카드를 상태에 담는 모든 경로는 `.is("deleted_at", null)` 로 거른다** — 보드·정체알림·대시보드가 전부
`pipelineCards` 상태 하나를 본다. 거른 지점: 메인 로드(6100)·파이프라인 진입(10405)·재동기화(10153·10810)·
대시보드 단계 카운트(9291)·기업상세(13689)·`resyncAutoCards`·`advanceCardsToContractPaid`.
`pipelineCardData`·정체 계산에도 이중 방어를 넣었다. **예외는 `syncPipelineFromCase` 하나뿐**(위 이유).

**단계 이동 로직은 `moveCards()` 하나뿐이다.** 개별 드래그(`handleDrop`)와 일괄 이동(`doBulkMove`)이
같은 함수를 부른다. 두 벌로 두면 반드시 어긋나므로 **새 이동 경로를 만들 때도 이 함수를 경유할 것.**
- 카드마다 출발 단계가 달라 정리 필드(기타 사유/부결 종결 해제/재배치 확인)가 제각각이라 **카드별 UPDATE** 다.
  한 방 UPDATE 로 묶으면 안 된다. 실패 건은 건너뛰고 끝에 모아 보고한다.
- **STEP2 연동은 회사 단위로 중복 제거**해 회사당 1회만 실행한다(`applyContractPaid`).
  안 그러면 같은 회사 카드가 여러 장일 때 정산에 같은 값을 여러 번 민다.
- 일괄 대상은 **화면에 보이는 카드(`visibleRows`)로 한정**한다. 선택 후 필터가 바뀌어 사라진 건은
  대상에서 빼고 "화면 밖 N건 제외"로 알린다 — 안 보이는 카드가 움직이면 사고다.

**삭제 권한은 승인된 팀원 전원**(기업목록 휴지통과 동일). 복구·영구삭제도 같다.

## ⚠️ 업무요청·요청현황 버튼은 "신호"로 연다 — 2026-08-11
사이드바(데스크톱)·상단바(모바일)의 📩📋 버튼은 **상태를 전역으로 끌어올린 게 아니다.**
`pendingWnAction`(App) → `WorkNotesView` 의 `openAction` prop → useEffect 가 `setShowRequest`/`setShowReqStatus`
를 호출하고 **소비 후 신호를 지운다**(안 지우면 업무노트로 돌아올 때마다 모달이 다시 뜬다).
요청 보내기·답장·완료 처리는 업무노트의 노트 상태와 얽혀 있어 전역으로 옮기면 업무노트 전체가 회귀 사정권이다(1절).
- 배지는 App 이 이미 들고 있는 `reqAlertList`(받은 미확인)·`sentReplyAlertList`(새 답장)를 그대로 쓴다 — 새 쿼리·새 폴링 없음.
- **모바일은 `WorkNotesView` 를 렌더하지 않는다**(자체 UI). 그래서 모바일 전용 모달을 따로 만들었다.
  단 **보내기 경로는 데스크톱과 같아야 한다**: `wn_append_todo` RPC → `work_requests` → 푸시.
  직접 select 후 update 하면 남의 노트를 못 찾아 같은 날 노트가 두 장 생긴다.

## 2-2. DB 테이블을 새로 만들면 — RLS를 같은 커밋에서 켠다
Supabase는 테이블 기본값이 **"열림"**이라, RLS를 켜지 않으면 비로그인 anon key로 전건이 조회된다.
과거 `보안_RLS_승인제_SETUP.sql`이 테이블을 **이름으로 나열**하는 방식이라, 그 뒤에 만든 테이블마다
구멍이 생겼다(2026-07-27 사고: 10,801건 노출). 목록 방식에 기대지 말고 **테이블을 만든 그 커밋에서** 처리한다.

- [ ] `alter table public.<t> enable row level security;`
- [ ] `is_approved()` 기반 정책 부여(승인된 로그인 사용자만). **`to public` / `to anon` 정책은 만들지 않는다.**
- [ ] anon 권한 회수: `revoke all on public.<t> from anon;`
- [ ] **불필요 권한 회수**: `revoke truncate, references, trigger on public.<t> from authenticated, anon;`
      앱(PostgREST)은 이 셋 중 어느 것도 쓰지 않는다. 반면 위험은 실재한다:
      **TRUNCATE 는 RLS 도 행 트리거도 우회**해 승인된 토큰 하나로 테이블을 통째로 비울 수 있고,
      **TRIGGER 는 이미 있는 `security definer` 함수를 호출하는 트리거를 남의 테이블에 달 수 있어**
      조건이 갖춰지면 권한 상승 경로가 된다.
      2026-08-11에 26개 테이블에서 셋 다 일괄 회수했다(각각 26→0 확인).
      SQL: `authenticated_TRUNCATE_회수.sql` · `authenticated_REFERENCES_TRIGGER_회수.sql`(+ `_검증`/`_rollback`)
      회수 후 `authenticated` 에 남은 건 **SELECT/INSERT/UPDATE/DELETE 뿐**이다(앱에 필요한 것만).
      기존 FK 18건·보호 트리거 4개는 영향 없다(REFERENCES 는 제약 생성 시점에만 필요).
      `postgres` 소유 기본권한도 `arwdDxtm` → **`arwdm`** 으로 줄여, `run-sql.js` 로 만든
      테이블엔 다시 안 붙는다.
      ⚠ 다만 **`supabase_admin` 소유 기본권한은 아직 `arwdDxtm` 그대로**다 —
      `postgres` 가 그 롤의 멤버가 아니라(`pg_has_role`=false) 여기서 못 고친다.
      supabase_admin 이 만든 테이블에는 다시 붙을 수 있으니
      **새 테이블마다 위 한 줄을 실행하고 카탈로그로 확인할 것.**
      (아직 남은 것: `MAINTAIN` 26개 — VACUUM/REINDEX 계열이라 데이터 노출은 아니고 부하 위험만 있다.)
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

## 2-5. 전체 조회는 `fetchAllRows` 로 — `.limit(1000 초과)` 는 금지어다 (2026-08-12)

PostgREST 는 서버 설정(max-rows)으로 **한 번에 1000행까지만** 준다.
`.limit(10000)` 을 걸어도 **에러도 경고도 없이 조용히 무시**된다.
→ 화면은 멀쩡한데 숫자만 틀리는, **가장 알아채기 어려운 방식**으로 고장난다.

2026-08-11 에 AI검색에서 한 번 잡았지만(`09b4482`), 고친 함수가 **지역 함수라 재사용이 안 돼서**
같은 버그가 앱 곳곳에 그대로 남아 있었다. 2026-08-12 에 공용 함수로 올리고 전부 교체했다.

- 공용 함수는 **`src/App.js` 최상단 `fetchAllRows(table, cols, opts)`** 하나뿐이다.
  반환값이 supabase 와 **같은 모양(`{ data, error }`)** 이라 기존 호출부를 그대로 두고 바꿔 낄 수 있다.
  - `opts.build` — 필터 콜백 `(q) => q.is("deleted_at", null)`
  - `opts.orderBy`/`ascending`/`tieBreak` — 페이지 경계 고정용. **기본값(created_at→id 오름차순)을 바꾸지 말 것.**
    AI검색 스냅샷은 매번 같은 순서여야 JSON 바이트가 같아 **프롬프트 캐시가 산다.**
  - 실패하면 `data: null` 을 준다 — **반쪽 데이터를 성공처럼 쓰면 1000행 절단과 똑같은 사고**가 되므로 일부러 그렇게 했다.
- **판단 기준은 "지금 1000행이 넘느냐"가 아니라 "전체를 받아야 하는 조회냐"**다.
  지금 안 넘어도 넘는 순간 조용히 틀리기 시작한다. 넘을 수 있으면 지금 `fetchAllRows` 로 써 둔다.
- `.limit(N)` 은 **"최근 N건만 보여준다"는 의도일 때만** 쓴다. 그때도 N ≤ 1000 이어야 의도대로 동작한다.
  (남아 있는 `.limit(1000)` 4곳은 전부 이 의도다 — 채팅 최근 목록·배지 카운트.)

**실측 행 수 (2026-08-12, `scripts/run-sql.js` 로 확인)**
`activity_logs` 2,323 · `agency_cases` 2,222(살아있는 것 1,734) · `companies` 1,039(살아있는 것 397) ·
`pipeline_cards` 796 · `db_leads` 720 · `work_notes` 582 · `chat_messages` 366 · 나머지 100 미만.
→ **1000을 넘는 건 `activity_logs`·`agency_cases` 둘뿐**이다. `pipeline_cards` 가 다음 차례다.
숫자가 틀린 것 같으면 추측하지 말고 위 스크립트로 다시 세어 볼 것.

⚠️ `companies` 는 총 1,039행이지만 `.is("deleted_at", null)` 이 **서버에서 먼저 걸리므로** 397행만 온다.
필터는 1000행 상한보다 **먼저** 적용된다 — 그래서 "총행이 1000을 넘는다"만으로 판단하면 안 되고,
**실제로 전송되는 행 수**로 판단해야 한다.

## 2-6. PostgREST 조회를 손으로 조립할 때 — 따옴표·컬럼명 두 함정 (2026-08-15)

`api/ai-search.js` 처럼 supabase-js 를 안 쓰고 **URL 을 직접 만드는** 코드에서만 해당한다.
둘 다 **에러가 아니라 200 + 0건**으로 나타나서, 화면상 "원래 없는 것"과 구분이 안 된다.

**① 큰따옴표는 쓰는 자리가 정해져 있다.**
- 최상위 조건 `col=op.값` → **따옴표 금지.** 붙이면 따옴표째 값이 되어 **항상 0건**이다.
- `in.(...)` / `or=(...)` 안 → 콤마·괄호가 구분자라 **감싸야** 한다(감싸도 정상 동작).
- 인코딩(`encodeURIComponent`)은 따옴표와 무관하게 **항상** 한다 — 안 하면 ilike 의 `%` 가 깨진다.

실측(2026-08-15, 같은 토큰으로 PostgREST 직접 질의):
```
name=eq."(주)엘케이네스트코리아"          →   0건 ❌      name=eq.(주)엘케이네스트코리아        →   1건 ✅
agency_group=eq."소상공인시장진흥공단"    →   0건 ❌      agency_group=eq.소상공인시장진흥공단  → 767건 ✅
status=eq."부결"                          →   0건 ❌      status=eq.부결                        → 301건 ✅
in.("부결","진행 중") → 416건 ✅          or=(status.eq."부결",result.eq."부결") → 303건 ✅
```
이 버그로 **AI 상담의 모든 문자열 필터가 늘 0건**이었다. 특정 업체를 물으면 모델이 헛돌다
글 없이 끝나 "(빈 응답)"이 떴고, 집계도 0건을 받아 09b4482 "집계를 DB 에 위임"이 사실상
동작하지 않았다(모델이 스냅샷 눈대중으로 답을 만들어 겉보기엔 정상이라 더 위험했다).
→ 검증: `AI_TEST_JWT=<토큰> node scripts/test-ai-search-query.mjs` (실제 DB 에 쏴서 0건이 아닌지 확인)

**② 없는 컬럼을 select 하면 400 이고, 그 실패는 조용하다.**
`agency_cases` 의 상품명은 `fund_product` 다. `product` 는 **사례집(case_studies)** 의 컬럼이라
`agency_cases` 에는 없다. 2026-08-15 에 이 오타로 기업목록 기관 배지가 통째로 비어 있었다.
`fetchAllRows` 는 실패 시 `data:null` 을 주는데 호출부 대부분이 `if (!r.error && r.data)` 라
아무 일도 없던 것처럼 지나간다.
→ 이제 `fetchAllRows` 가 **콘솔에 table·select·사유를 다 찍고 화면에도 📛 배너**를 띄운다.
→ 배포 전 점검: `node scripts/audit-select-columns.mjs` (0건이어야 정상. 커버리지도 같이 출력)

## 2-7. 재시도 큐에 넣으면 안 되는 저장 (2026-08-15)

`writeGuarded` 의 재시도 큐는 **payload 를 그대로 다시 보내는 순수 UPDATE** 다.
그래서 **저장 뒤에 딸린 연동이 있는 경로는 큐에 넣으면 안 된다** — 연동이 통째로 빠진 채
"저장은 됐다"가 되어 더 찾기 어려운 불일치가 생긴다.
- 실제 사고: 계약 상태 저장이 큐에서 뒤늦게 성공 → `contract_status` 만 켜지고
  **정산 반영(`syncSettlementFromCompany`)은 실행되지 않아** 정산이 빈 채로 남았다.
  게다가 3일 전 payload 라 `contract_status_at` 도 과거 시각이라 정체일수가 어긋났다.
- → `setContractStatus` 는 `retry:false`. 실패하면 사람이 **버튼을 다시 누르게** 해야
  정산 반영까지 한 묶음으로 실행된다. 같은 성격의 저장을 새로 만들면 똑같이 할 것.

⚠️ 값의 형식이 틀려서 거절된 실패(22P02·22003·PGRST204·check/not-null 위반)도 재시도 대상이
아니다. 값이 안 바뀌니 영원히 실패한다 — 실제로 **421번** 재시도한 항목이 있었다
(`companies.fee` 가 integer 인데 수수료율 4.8 을 보냄 → 2026-08-15 numeric 으로 변경).
`classifyWriteFail` 이 `permanent` 로 표시해 큐에 안 넣고, 옛 항목도 걷어낸다.

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
