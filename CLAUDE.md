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
- 모바일 `MobileApp`(약 1759줄~)은 `TeamNotesSection`을 렌더하지 않는다(work_notes/채팅만).
  팀 업무 관련 수정은 데스크톱 경로에만 영향.
- 한셀/한컴오피스로 만든 xlsx는 표준 엑셀과 달리 ①모든 요소 태그에 `x:` 네임스페이스 접두사(`<x:row>`,`<x:c>`,`<x:si>`),
  ②리치텍스트/스타일에 haansoft 전용 확장(`<hs:size>` 등)을 `mc:AlternateContent`로 섞는다.
  SheetJS는 이 둘 때문에 **에러 없이 0행**을 반환하거나 `"Unrecognized rich format"` 예외로 실패한다.
  → 업로드 xlsx 읽기는 반드시 `readUploadedWorkbook()`(App.js) 경유. 표준 읽기로 셀이 0개면 fflate로 XML을 정규화 후 재시도한다.
  정상 엑셀은 첫 시도에서 끝나 fflate를 로드하지 않는다(동작·성능 무변경). (2026-07-24 수정: (주)에이치앤와이상사 파일 0개 → 7필드)
