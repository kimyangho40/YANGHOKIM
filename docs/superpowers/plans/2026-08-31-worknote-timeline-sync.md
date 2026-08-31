# 업무노트 @기업 태그 → 기업 타임라인 반영 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 업무노트(팀 체크리스트 항목 · 개인 노트 줄)에 `@기업명` 을 쓰면 그 기업 상세의 🕒 타임라인 탭에 항목 내용이 작성 시각 그대로 뜨고, 기존에 쌓인 276쌍도 전부 소급 반영된다.

**Architecture:** 새 테이블 `note_company_links` 가 (항목 × 기업) 링크와 텍스트 스냅샷을 들고, 기업 타임라인이 이걸 세 번째 출처로 읽는다. 살아있는 노트 1장의 링크를 통째로 다시 맞추는 **재조정(reconcile)** 함수 하나만 두고, 노트를 저장하는 모든 경로가 그걸 부른다. 소급 마이그레이션은 App.js 소스에서 같은 함수를 떼어내 실행하므로 로직이 한 벌뿐이다.

**Tech Stack:** React 17 스타일 함수형 컴포넌트(단일 파일 `src/App.js`, 인라인 스타일, CSS 미디어쿼리 없음) · Supabase(PostgREST + RLS) · `scripts/run-sql.js` 로 SQL 실행 · `node scripts/*.mjs` 로 App.js 소스를 떼어내 검증(테스트 프레임워크 없음)

**Spec:** [`docs/superpowers/specs/2026-08-31-worknote-timeline-sync-design.md`](../specs/2026-08-31-worknote-timeline-sync-design.md)
**조사:** [`docs/superpowers/specs/2026-08-31-worknote-timeline-sync-조사.md`](../specs/2026-08-31-worknote-timeline-sync-조사.md)

---

## Global Constraints

**CLAUDE.md 가 이 저장소의 최상위 규칙이다. 아래는 이번 작업에 직접 걸리는 것만 뽑은 것이다.**

- **공용 함수를 건드리지 않는다** — `findTaggedCompanies` · `renderMentionText` · `getMentionRegex` · `MentionField` · `detectCompaniesInText` · `logToActivity` · `bizScaleCap` · `parseLoanAmount` · `parseUnfinishedItems` · `buildItemLine` · `encodeItemText`. 작업 후 `git diff` 로 **이 함수들의 본문 변경이 0줄**임을 확인한다.
- **`work_notes.content` 포맷을 바꾸지 않는다.** 이월 꼬리표 · 대기사유 `{응답대기:날짜}` · 리터럴 `\n` 인코딩이 전부 걸려 있다.
- **`activity_logs` 에 행을 추가하지 않는다.** 읽는 곳 11곳 중 9곳이 오염된다.
- **새 테이블은 RLS 를 같은 커밋에서 켠다** (CLAUDE.md 2-2 전체 체크리스트).
- **전체 조회는 `fetchAllRows`** — `.limit(1000 초과)` 는 조용히 무시된다(CLAUDE.md 2-5). 단 이번 타임라인 쿼리는 기업당 최대 19행이라 `fetchAllRows` 불필요.
- **`scripts/run-sql.js` 는 결과를 하나만 출력한다** — 한 파일에 SELECT 하나씩. **검증은 실행 파일에 딸린 SELECT 를 믿지 말고 별도 조회로 재확인한다**(CLAUDE.md 2-2).
- **SQL 파일 관례**: `<주제>.sql` + `_rollback.sql` + `_검증.sql` 세 벌, 저장소 루트.
- **커밋 메시지**: `<타입>(<범위>): <이모지> <한글 요약>` (예: `feat(업무노트타임라인): 🔗 …`).
- 빌드: `CI=true npx react-scripts build` · 컬럼 오타 점검: `node scripts/audit-select-columns.mjs`
- 개발 서버: `ESLINT_NO_DEV_ERRORS=true npm start` (기존 ESLint 에러로 그냥은 안 뜬다)

### 확정 수치 (2026-08-31 실측 — **실행 당일 다시 셀 것**)

| | 쌍 | 항목/줄 | 기업 | 기업 2곳+ 태그 |
|---|---:|---:|---:|---:|
| 팀 `team_item` | **95** | 85 | 63 | 5 |
| 개인 `work_line` | **181** | 165 | 65 | 8 |
| **합계** | **276** | **250** | **68**(중복 제외) | 13 |

시각 근거: 팀 `work_date` 63 / `created_at` 폴백 32 · 개인은 전부 `note_date`(575/575 채워짐).
가장 오래된 링크 2026-07-20, 최신 2026-08-31.

> 🔧 조사·설계 문서의 "~85개 기업"은 팀 63 + 개인 65 를 단순히 더한 값이라 틀렸다. **중복 제외 68개**가 맞다. Task 9 에서 문서를 정정한다.

### ⚠️ 계획 수립 중 새로 발견한 것 2가지 — 반드시 지킬 것

**① 매처는 반드시 `decodeItemText` 로 푼 뒤의 텍스트에 돌린다.**
`work_notes.content` 에는 **리터럴 `\n`(역슬래시+n 두 글자)** 이 섞여 있다.
`- [x] @(주)애슐런컴퍼니  \n@농업회사법인 해광알앤에프 …` 에서 두 번째 `@` 는 **앞 글자가 `n`** 이라,
디코드하지 않고 경계 검사를 하면 **진짜 태그 5건이 조용히 누락된다**(실측으로 확인).
디코드 후에는 276쌍 전부가 경계 검사를 통과한다.
반대로 이메일(`basegilt@gmail.com`)은 디코드해도 `@` 앞이 `t` 라 계속 배제된다 — 의도한 대로다.
**팀 항목(`item.text`)은 이미 디코드된 상태라 디코드하면 안 된다.**

**② 개인 노트 링크 181건 중 79건(44%)은 기존 `note_auto` 활동로그와 텍스트가 겹친다.**
개인 노트 항목을 **체크할 때** `detectCompaniesInText`(맨이름 감지) + `logToActivity` 가
`log_type='note_auto'` 로 이미 기록하고 있다(살아있는 것 **1,075건**, 122개 기업).
→ 타임라인에 "작성"과 "완료"가 나란히 뜬다. **의미가 다른 두 사건이므로 둘 다 남기되 뱃지를 다르게 한다**(Task 5).
팀 항목 95건은 이 경로가 없어 겹치지 않는다.
**기존 `note_auto` 경로는 건드리지 않는다** — 손대면 완료 기록 전체가 회귀 사정권이다.

---

## File Structure

| 파일 | 책임 | 상태 |
|---|---|---|
| `업무노트태그_타임라인_테이블.sql` | `note_company_links` 생성 + RLS + 권한 회수 | 신규 |
| `업무노트태그_타임라인_테이블_rollback.sql` | 되돌리기 | 신규 |
| `업무노트태그_타임라인_테이블_검증.sql` | RLS·권한·인덱스 확인 | 신규 |
| `src/App.js` (≈4363 뒤) | 순수 함수 4개 + 재조정 함수 1개 | 수정 |
| `src/App.js` `CompanyModal` | 타임라인 3번째 출처 | 수정 |
| `src/App.js` `TeamNotesSection` | 팀 쓰기 경로에서 재조정 호출 | 수정 |
| `src/App.js` `WorkNotesView` | 개인 쓰기 경로에서 재조정 호출 | 수정 |
| `scripts/test-note-links.mjs` | 매처·행생성 검증 (App.js 소스 추출) | 신규 |
| `scripts/migrate-note-links.mjs` | 소급 마이그레이션 (dry-run 기본) | 신규 |
| `CLAUDE.md` | 쓰기 경로 표 + 함정 기록 | 수정 |

---

# Task 1: DB — `note_company_links` 테이블 + RLS

**Files:**
- Create: `업무노트태그_타임라인_테이블.sql`
- Create: `업무노트태그_타임라인_테이블_rollback.sql`
- Create: `업무노트태그_타임라인_테이블_검증.sql`

**Interfaces:**
- Produces: 테이블 `public.note_company_links` — 컬럼 `id, source, note_id, item_key, company_id, item_text, at, author, created_at, updated_at, deleted_at`. 유니크 `(source, note_id, item_key, company_id) where deleted_at is null`.

- [ ] **Step 1: 생성 SQL 을 쓴다**

`업무노트태그_타임라인_테이블.sql`:

```sql
-- 업무노트 @기업 태그 → 기업 타임라인 링크 (2026-08-31)
--   (항목 × 기업) 하나당 1행. 텍스트 스냅샷을 들고 있다.
--   ⚠️ note_id 에 FK 를 걸지 않는다 — 원본이 team_notes / work_notes 두 곳이라 한 컬럼으로 못 건다.
create table if not exists public.note_company_links (
  id          uuid primary key default gen_random_uuid(),
  source      text        not null check (source in ('team_item','work_line')),
  note_id     uuid        not null,
  item_key    text        not null,
  company_id  uuid        not null references public.companies(id) on delete cascade,
  item_text   text        not null,
  at          timestamptz not null,
  author      text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz,
  deleted_at  timestamptz
);

create unique index if not exists note_company_links_uniq
  on public.note_company_links (source, note_id, item_key, company_id)
  where deleted_at is null;
create index if not exists note_company_links_company_at
  on public.note_company_links (company_id, at desc) where deleted_at is null;
create index if not exists note_company_links_note
  on public.note_company_links (source, note_id) where deleted_at is null;

-- 🔒 RLS (CLAUDE.md 2-2) — 테이블을 만든 그 커밋에서 켠다
alter table public.note_company_links enable row level security;

drop policy if exists p_note_company_links_select on public.note_company_links;
drop policy if exists p_note_company_links_insert on public.note_company_links;
drop policy if exists p_note_company_links_update on public.note_company_links;
drop policy if exists p_note_company_links_delete on public.note_company_links;

create policy p_note_company_links_select on public.note_company_links
  for select to authenticated using (public.is_approved());
create policy p_note_company_links_insert on public.note_company_links
  for insert to authenticated with check (public.is_approved());
create policy p_note_company_links_update on public.note_company_links
  for update to authenticated using (public.is_approved()) with check (public.is_approved());
create policy p_note_company_links_delete on public.note_company_links
  for delete to authenticated using (public.is_approved());

revoke all on public.note_company_links from anon;
revoke truncate, references, trigger on public.note_company_links from authenticated, anon;
grant select, insert, update, delete on public.note_company_links to authenticated;
```

- [ ] **Step 2: rollback 과 검증 SQL 을 쓴다**

`업무노트태그_타임라인_테이블_rollback.sql`:
```sql
drop table if exists public.note_company_links;
```

`업무노트태그_타임라인_테이블_검증.sql` — **SELECT 하나만** (run-sql.js 는 결과를 하나만 찍는다):
```sql
select
  (select count(*) from pg_class where relname='note_company_links'
     and relnamespace='public'::regnamespace and relrowsecurity) as rls_on,
  (select count(*) from pg_policy p join pg_class c on c.oid=p.polrelid
     where c.relname='note_company_links') as policies,
  (select count(*) from information_schema.role_table_grants
     where table_schema='public' and table_name='note_company_links' and grantee='anon') as anon_grants,
  (select count(*) from information_schema.role_table_grants
     where table_schema='public' and table_name='note_company_links'
       and grantee='authenticated' and privilege_type in ('TRUNCATE','REFERENCES','TRIGGER')) as bad_grants,
  (select count(*) from pg_indexes where schemaname='public' and tablename='note_company_links') as indexes,
  (select count(*) from public.note_company_links) as rows;
```

- [ ] **Step 3: 적용 전, 전체 테이블 RLS 상태를 떠 둔다**

임시 파일에 아래를 넣고 `node scripts/run-sql.js <파일>`:
```sql
select count(*) as rls_off_tables from pg_class
 where relnamespace='public'::regnamespace and relkind='r' and relrowsecurity = false;
```
Expected: 숫자를 적어 둔다(적용 후 **늘지 않아야** 한다).

- [ ] **Step 4: 적용한다**

Run: `node scripts/run-sql.js 업무노트태그_타임라인_테이블.sql`
Expected: `✅ 실행 성공`

- [ ] **Step 5: 검증 — 실행 파일이 아닌 별도 조회로**

Run: `node scripts/run-sql.js 업무노트태그_타임라인_테이블_검증.sql`
Expected: `rls_on=1` · `policies=4` · **`anon_grants=0`** · **`bad_grants=0`** · `indexes=4`(pk 포함) · `rows=0`

Step 3 쿼리를 다시 돌려 `rls_off_tables` 가 **Step 3 과 같은 값**인지 확인한다.

> ⚠️ CLAUDE.md 2-2: `revoke` 는 grantor 가 다르면 **에러 없이 아무것도 안 한다.** "성공했으니 회수됐다"고 믿지 말고 위 `anon_grants=0` 을 꼭 눈으로 볼 것.

- [ ] **Step 6: 커밋**

```bash
git add 업무노트태그_타임라인_테이블.sql 업무노트태그_타임라인_테이블_rollback.sql 업무노트태그_타임라인_테이블_검증.sql
git commit -m "feat(업무노트타임라인): 🗄 note_company_links 테이블 + RLS (검증 6/6)"
```

---

# Task 2: 매처와 행 생성 — 순수 함수 4개

**Files:**
- Modify: `src/App.js` — `findTaggedCompanies` 끝(현재 4363행) **바로 뒤**에 삽입
- Create: `scripts/test-note-links.mjs`

**Interfaces:**
- Produces:
  - `taggedCompanyRefs(text, companiesList) -> [{id, name, index}]`
  - `workLineDisplayText(line) -> string`
  - `noteLinkAt(dateStr, fallbackIso) -> string` (ISO)
  - `noteLinkRows(source, note, companiesList) -> [{source, note_id, item_key, company_id, item_text, at, author}]`
  - 소스 표식 주석 `// ── note-link BEGIN ──` / `// ── note-link END ──` (테스트 스크립트가 이 사이를 떼어낸다)

- [ ] **Step 1: 실패하는 테스트를 쓴다**

`scripts/test-note-links.mjs`:

```js
// 업무노트 @기업 태그 → 타임라인 링크 검증 (2026-08-31)
// ⚠️ App.js 소스를 **떼어내 그대로 실행**한다 — 손으로 옮겨 적으면 코드 검증이 아니다.
//    (test-nocard.mjs · test-debtor-change.mjs 와 같은 방식)
// 사용법: node scripts/test-note-links.mjs
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = fs.readFileSync(path.join(ROOT, "src/App.js"), "utf8");

function cut(startNeedle, endNeedle, label) {
  const s = src.indexOf(startNeedle);
  if (s < 0) { console.error(`❌ ${label} 시작을 App.js 에서 못 찾았습니다: ${startNeedle}`); process.exit(1); }
  const e = src.indexOf(endNeedle, s);
  if (e < 0) { console.error(`❌ ${label} 끝을 못 찾았습니다: ${endNeedle}`); process.exit(1); }
  return src.slice(s, e + endNeedle.length);
}

// note-link 블록 + 의존 헬퍼 3개를 떼어낸다
const deps =
  cut("var ITEM_WAIT_RE =", "\n", "ITEM_WAIT_RE") +
  cut("function splitItemWait(", "\n}", "splitItemWait") +
  cut("function decodeItemText(", "\n}", "decodeItemText");
const block = cut("// ── note-link BEGIN ──", "// ── note-link END ──", "note-link 블록");
console.log(`── App.js 에서 떼어낸 소스 ${(deps + block).trim().split("\n").length}줄 ──`);

const api = new Function(deps + "\n" + block +
  "\nreturn { taggedCompanyRefs, workLineDisplayText, noteLinkAt, noteLinkRows };")();
const { taggedCompanyRefs, workLineDisplayText, noteLinkAt, noteLinkRows } = api;

const CO = [
  { id: "c1", name: "주식회사 임팩트레이드 (IMPACTRADE)" },
  { id: "c2", name: "(주)로컬" },
  { id: "c3", name: "(주)로컬푸드" },
  { id: "c4", name: "농업회사법인 해광알앤에프" },
  { id: "c5", name: "(주)애슐런컴퍼니" },
];
let pass = 0, fail = 0;
const check = (name, ok, detail) => {
  if (ok) { pass++; console.log("  ✅ " + name); }
  else { fail++; console.log("  ❌ " + name + " — " + detail); }
};
const ids = (t) => taggedCompanyRefs(t, CO).map(r => r.id).join(",");

// ① 기본 매칭
check("단순 태그", ids("@(주)로컬 자료 전달") === "c2", ids("@(주)로컬 자료 전달"));
check("줄 끝 태그", ids("오늘 @(주)로컬") === "c2", ids("오늘 @(주)로컬"));
check("태그 없음", ids("로컬 자료 전달") === "", ids("로컬 자료 전달"));

// ② 이메일은 태그가 아니다 (@ 앞 경계)
check("이메일 배제", ids("basegilt@gmail.com 으로 보냄") === "", ids("basegilt@gmail.com 으로 보냄"));
check("메일+태그 혼재", ids("a@naver.com 과 @(주)로컬") === "c2", ids("a@naver.com 과 @(주)로컬"));

// ③ 접두 과매칭 금지 (긴 이름 우선 + 구간 소비)
check("긴 이름만 잡는다", ids("@(주)로컬푸드 확인") === "c3", ids("@(주)로컬푸드 확인"));

// ④ 여러 기업 + 중복 제거
check("여러 기업", ids("@(주)로컬 그리고 @(주)애슐런컴퍼니") === "c2,c5", ids("@(주)로컬 그리고 @(주)애슐런컴퍼니"));
check("같은 기업 두 번 → 1건", ids("@(주)로컬 …  @(주)로컬") === "c2", ids("@(주)로컬 …  @(주)로컬"));

// ⑤ 줄바꿈 뒤 태그 (경계 = 공백류)
check("줄바꿈 뒤 태그", ids("@(주)애슐런컴퍼니\n@농업회사법인 해광알앤에프") === "c5,c4",
  ids("@(주)애슐런컴퍼니\n@농업회사법인 해광알앤에프"));

// ⑥ workLineDisplayText — 마커·대기사유 제거 + 리터럴 \n 디코드
check("마커 제거", workLineDisplayText("- [x] @(주)로컬 전달") === "@(주)로컬 전달",
  JSON.stringify(workLineDisplayText("- [x] @(주)로컬 전달")));
check("대기사유 제거", workLineDisplayText("- [ ] @(주)로컬 전달 {응답대기:2026-08-01}") === "@(주)로컬 전달",
  JSON.stringify(workLineDisplayText("- [ ] @(주)로컬 전달 {응답대기:2026-08-01}")));
check("리터럴 \\n 디코드", workLineDisplayText("- [x] @(주)애슐런컴퍼니  \\n@농업회사법인 해광알앤에프 ")
  .indexOf("\n@농업회사법인") >= 0, JSON.stringify(workLineDisplayText("- [x] @(주)애슐런컴퍼니  \\n@농업회사법인 해광알앤에프 ")));
check("일반 글줄은 그대로", workLineDisplayText("메모 한 줄") === "메모 한 줄", workLineDisplayText("메모 한 줄"));

// ⑦ 🔴 회귀 방지 — 디코드 안 하면 놓치던 그 케이스
const raw = "- [x] @(주)애슐런컴퍼니  \\n@농업회사법인 해광알앤에프 \\n\\n- basegilt@gmail.com";
check("리터럴 \\n 뒤 태그도 잡는다", ids(workLineDisplayText(raw)) === "c5,c4", ids(workLineDisplayText(raw)));

// ⑧ noteLinkAt — 업무 날짜 09:00 KST == 그날 자정 UTC
check("날짜 → 자정 UTC", noteLinkAt("2026-08-31", "2026-08-30T10:03:05Z") === "2026-08-31T00:00:00.000Z",
  noteLinkAt("2026-08-31", "2026-08-30T10:03:05Z"));
const kstHour = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Seoul", hour: "numeric", hour12: false })
  .format(new Date(noteLinkAt("2026-08-31", null)));
check("09:00 KST 확인", Number(kstHour) === 9, "KST " + kstHour + "시");
check("날짜 없으면 폴백", noteLinkAt(null, "2026-08-30T10:03:05Z") === "2026-08-30T10:03:05Z",
  noteLinkAt(null, "2026-08-30T10:03:05Z"));

// ⑨ noteLinkRows — 팀
const teamNote = {
  id: "n1", work_date: "2026-08-31", created_at: "2026-08-30T10:03:05Z", posted_by: "관호",
  checklist: [
    { id: "i1", text: "@주식회사 임팩트레이드 (IMPACTRADE) \n-> 재무제표 보내주세요" },
    { id: "i2", text: "태그 없는 항목" },
    { id: "i3", text: "@(주)로컬 과 @(주)애슐런컴퍼니", created_at: "2026-08-31T05:00:00.000Z" },
  ],
};
const tRows = noteLinkRows("team_item", teamNote, CO);
check("팀 행 수", tRows.length === 3, String(tRows.length));
check("팀 at = work_date 자정 UTC", tRows[0].at === "2026-08-31T00:00:00.000Z", tRows[0].at);
check("팀 item.created_at 우선", tRows.filter(r => r.item_key === "i3").every(r => r.at === "2026-08-31T05:00:00.000Z"),
  JSON.stringify(tRows.filter(r => r.item_key === "i3").map(r => r.at)));
check("팀 여러 기업 → 각각 1행", tRows.filter(r => r.item_key === "i3").length === 2,
  String(tRows.filter(r => r.item_key === "i3").length));
check("팀 author = posted_by", tRows.every(r => r.author === "관호"), JSON.stringify(tRows.map(r => r.author)));
check("팀 item_text 는 원문 그대로", tRows[0].item_text.indexOf("@주식회사 임팩트레이드") === 0, tRows[0].item_text);

// ⑩ noteLinkRows — 개인
const workNote = {
  id: "n2", note_date: "2026-08-04", created_at: "2026-08-03T14:00:00Z", assignee: "관호",
  content: "- [x] @(주)로컬 자료 전달\n- [ ] 태그 없음\n- [x] @(주)애슐런컴퍼니  \\n@농업회사법인 해광알앤에프",
};
const wRows = noteLinkRows("work_line", workNote, CO);
check("개인 행 수", wRows.length === 3, String(wRows.length));
check("개인 item_key = 0-based 줄번호", wRows.map(r => r.item_key).join(",") === "0,2,2",
  wRows.map(r => r.item_key).join(","));
check("개인 at = note_date 자정 UTC", wRows.every(r => r.at === "2026-08-04T00:00:00.000Z"),
  JSON.stringify(wRows.map(r => r.at)));
check("개인 item_text 에 마커가 없다", wRows.every(r => r.item_text.indexOf("- [") !== 0),
  JSON.stringify(wRows.map(r => r.item_text)));
check("삭제된 노트는 0행",
  noteLinkRows("work_line", Object.assign({}, workNote, { deleted_at: "2026-08-05T00:00:00Z" }), CO).length === 0, "");

console.log(`\n결과: ${pass}/${pass + fail} 통과`);
process.exit(fail ? 1 : 0);
```

- [ ] **Step 2: 실패를 확인한다**

Run: `node scripts/test-note-links.mjs`
Expected: FAIL — `❌ note-link 블록 시작을 App.js 에서 못 찾았습니다: // ── note-link BEGIN ──`

- [ ] **Step 3: App.js 에 함수를 넣는다**

`src/App.js` 의 `findTaggedCompanies` 닫는 `}`(현재 4363행) 바로 **다음 줄**에 삽입:

```js
// ── note-link BEGIN ──────────────────────────────────────────────────────────
// 업무노트 @기업 태그 → 기업 타임라인 링크 (2026-08-31)
//
// ⚠️ 위 findTaggedCompanies 를 고치지 않고 **따로 만든 이유**:
//    저건 채팅 말풍선 전용(App.js 의 채팅 렌더)이라 고치면 채팅이 회귀 사정권에 들어온다.
//    그리고 저건 정렬만 하고 매칭 구간을 소비하지 않아 접두 과매칭이 있다
//    (실측 139쌍 중 17쌍: "@(주)A상사" 가 "(주)A" 에도 걸린다).
//
// 여기서 지키는 규칙 2가지 — 둘 다 MentionField 의 표시 규칙과 같아야 한다.
//   ① @ 앞은 줄머리이거나 공백 → 이메일 주소(basegilt@gmail.com)가 배제된다
//   ② 이름 뒤는 공백이거나 문자열 끝 + 매칭 구간을 소비 → 접두 과매칭이 사라진다
function taggedCompanyRefs(text, companiesList) {
  var t = String(text == null ? "" : text);
  if (!t || !companiesList || companiesList.length === 0) return [];
  var byLen = companiesList.filter(function(c) { return c && c.name; })
    .slice().sort(function(a, b) { return b.name.length - a.name.length; });
  var out = [], seen = {}, i = 0;
  while (i < t.length) {
    if (t.charAt(i) === "@" && (i === 0 || /\s/.test(t.charAt(i - 1)))) {
      var hit = null;
      for (var k = 0; k < byLen.length; k++) {
        var nm = byLen[k].name;
        if (t.substr(i + 1, nm.length) === nm) {
          var after = t.charAt(i + 1 + nm.length);
          if (after === "" || /\s/.test(after)) { hit = byLen[k]; break; }
        }
      }
      if (hit) {
        if (!seen[hit.id]) { seen[hit.id] = 1; out.push({ id: hit.id, name: hit.name, index: i }); }
        i += 1 + hit.name.length;   // 매칭 구간 소비
        continue;
      }
    }
    i++;
  }
  return out;
}

// 개인 노트의 content 한 줄 → 화면에 보이는 텍스트.
// NoteCard.parseChecklist 와 같은 처리다: 마커 제거 → 대기사유 분리 → 리터럴 \n 디코드.
// ⚠️ 디코드가 핵심이다. work_notes.content 에는 리터럴 \n(역슬래시+n)이 섞여 있어
//    디코드 없이 태그를 찾으면 "…컴퍼니  \n@해광알앤에프" 의 두 번째 태그를
//    (@ 앞 글자가 'n' 이라) 통째로 놓친다. 실측 5건이 그렇게 누락됐다.
function workLineDisplayText(line) {
  var s = String(line == null ? "" : line);
  var m = s.trim().match(/^- \[([ x])\] (.+)/);
  if (!m) return decodeItemText(s);                    // 체크박스가 아닌 일반 글줄
  return decodeItemText(splitItemWait(m[2]).rest);
}

// 타임라인 정렬 기준 시각.
// 업무 날짜 09:00 KST == 그 날짜의 자정 UTC (KST = UTC+9) — 별도 변환이 필요 없다.
function noteLinkAt(dateStr, fallbackIso) {
  if (dateStr && /^\d{4}-\d{2}-\d{2}$/.test(String(dateStr))) return String(dateStr) + "T00:00:00.000Z";
  if (fallbackIso) return new Date(fallbackIso).toISOString();
  return new Date().toISOString();
}

// 노트 1장 → 링크 행 목록(원하는 상태). DB 를 읽지도 쓰지도 않는 순수 함수다.
//   source: "team_item" | "work_line"
// ⚠️ 팀 항목의 text 는 이미 디코드된 상태라 workLineDisplayText 를 태우면 안 된다.
function noteLinkRows(source, note, companiesList) {
  if (!note || !note.id || note.deleted_at) return [];
  var rows = [];
  var push = function(itemKey, text, at, author) {
    var refs = taggedCompanyRefs(text, companiesList);
    for (var i = 0; i < refs.length; i++) {
      rows.push({
        source: source, note_id: note.id, item_key: String(itemKey),
        company_id: refs[i].id, item_text: text, at: at, author: author || null,
      });
    }
  };
  if (source === "team_item") {
    var base = noteLinkAt(note.work_date, note.created_at);
    var list = Array.isArray(note.checklist) ? note.checklist : [];
    list.forEach(function(it, idx) {
      if (!it) return;
      // 옛 항목엔 id 가 없을 수 있다(실측 257/257 은 있지만 방어).
      push(it.id || ("idx:" + idx), String(it.text || ""), it.created_at || base, note.posted_by);
    });
  } else if (source === "work_line") {
    var at = noteLinkAt(note.note_date, note.created_at);
    // ⚠️ 진짜 줄바꿈으로만 나눈다. 리터럴 \n 은 줄 안에 남긴다(앱 parseChecklist 와 동일).
    String(note.content || "").split("\n").forEach(function(line, idx) {
      push(idx, workLineDisplayText(line), at, note.assignee);
    });
  }
  return rows;
}
// ── note-link END ────────────────────────────────────────────────────────────
```

- [ ] **Step 4: 테스트가 통과하는지 본다**

Run: `node scripts/test-note-links.mjs`
Expected: `결과: 28/28 통과`

- [ ] **Step 5: 빌드와 컬럼 점검**

Run: `CI=true npx react-scripts build`
Expected: 빌드 성공(경고는 무방, 에러 0)

Run: `node scripts/audit-select-columns.mjs`
Expected: 0건

- [ ] **Step 6: 공용 함수 무변경 확인**

Run:
```bash
git diff -U0 src/App.js | grep -E '^[-+]' | grep -vE '^(\+\+\+|---)' | grep -E 'findTaggedCompanies|renderMentionText|getMentionRegex|detectCompaniesInText|logToActivity|parseUnfinishedItems|buildItemLine|encodeItemText'
```
Expected: **출력 0줄** (이 함수들의 줄이 추가·삭제되지 않았다)

- [ ] **Step 7: 커밋**

```bash
git add src/App.js scripts/test-note-links.mjs
git commit -m "feat(업무노트타임라인): 🏷 @기업 태그 매처·행생성 순수함수 (테스트 26/26)"
```

---

# Task 3: 소급 마이그레이션 — 276쌍

**Files:**
- Create: `scripts/migrate-note-links.mjs`

**Interfaces:**
- Consumes: Task 1 의 테이블, Task 2 의 `noteLinkRows`(App.js 소스에서 추출)
- Produces: `note_company_links` 에 276행. `--dry-run`(기본) / `--apply` 두 모드

- [ ] **Step 1: 마이그레이션 스크립트를 쓴다**

`scripts/migrate-note-links.mjs`:

```js
// 업무노트 @기업 태그 → 타임라인 링크 소급 마이그레이션 (2026-08-31)
//
// ⚠️ App.js 소스에서 noteLinkRows 를 **떼어내 그대로 실행**한다.
//    손으로 옮겨 적거나 SQL 로 다시 구현하면 화면과 결과가 갈라진다(CLAUDE.md 의 JS↔SQL 이중구현 경고).
// ⚠️ 기본은 --dry-run 이다. 실제로 넣으려면 --apply 를 줘야 한다.
// ⚠️ 유니크 (source, note_id, item_key, company_id) 덕에 **몇 번을 돌려도 안 불어난다.**
//
// 사용법:
//   node scripts/migrate-note-links.mjs            # 미리보기만
//   node scripts/migrate-note-links.mjs --apply    # 실제 반영
import fs from "fs";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";
import { execFileSync } from "child_process";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const APPLY = process.argv.includes("--apply");
const src = fs.readFileSync(path.join(ROOT, "src/App.js"), "utf8");

function cut(startNeedle, endNeedle, label) {
  const s = src.indexOf(startNeedle);
  if (s < 0) { console.error(`❌ ${label} 시작을 못 찾았습니다: ${startNeedle}`); process.exit(1); }
  const e = src.indexOf(endNeedle, s);
  if (e < 0) { console.error(`❌ ${label} 끝을 못 찾았습니다: ${endNeedle}`); process.exit(1); }
  return src.slice(s, e + endNeedle.length);
}
const deps =
  cut("var ITEM_WAIT_RE =", "\n", "ITEM_WAIT_RE") +
  cut("function splitItemWait(", "\n}", "splitItemWait") +
  cut("function decodeItemText(", "\n}", "decodeItemText");
const block = cut("// ── note-link BEGIN ──", "// ── note-link END ──", "note-link 블록");
const { noteLinkRows } = new Function(deps + "\n" + block + "\nreturn { noteLinkRows };")();

function runSql(sql) {
  const tmp = path.join(os.tmpdir(), "note-links-" + process.pid + "-" + Math.random().toString(36).slice(2) + ".sql");
  fs.writeFileSync(tmp, sql);
  try {
    const raw = execFileSync("node", [path.join(ROOT, "scripts/run-sql.js"), tmp],
      { encoding: "utf8", maxBuffer: 256 * 1024 * 1024 });
    if (raw.indexOf("[") < 0) throw new Error("결과를 못 읽었습니다:\n" + raw.slice(-500));
    return JSON.parse(raw.slice(raw.indexOf("[")));
  } catch (e) {
    console.error("❌ SQL 실패 — .env.local 의 SUPABASE_ACCESS_TOKEN 을 확인하세요.");
    console.error(String((e && e.stdout) || (e && e.message) || e).slice(-600));
    process.exit(1);
  } finally { try { fs.unlinkSync(tmp); } catch (_) {} }
}

// ── ① 원본을 읽는다 (읽기 전용 SELECT 1개) ─────────────────────────────────
const [{ payload }] = runSql(`
select json_build_object(
  'companies', (select coalesce(json_agg(json_build_object('id',id,'name',name)),'[]'::json)
                  from public.companies where deleted_at is null and name is not null and name <> ''),
  'team',      (select coalesce(json_agg(json_build_object(
                        'id',id,'checklist',checklist,'work_date',work_date,
                        'created_at',created_at,'posted_by',posted_by)),'[]'::json)
                  from public.team_notes where deleted_at is null),
  'work',      (select coalesce(json_agg(json_build_object(
                        'id',id,'content',content,'note_date',note_date,
                        'created_at',created_at,'assignee',assignee)),'[]'::json)
                  from public.work_notes where deleted_at is null),
  'existing',  (select coalesce(json_agg(json_build_object(
                        'source',source,'note_id',note_id,'item_key',item_key,'company_id',company_id)),'[]'::json)
                  from public.note_company_links where deleted_at is null)
) as payload;
`);
const { companies, team, work, existing } = payload;
console.log(`기업 ${companies.length} · 팀노트 ${team.length} · 개인노트 ${work.length} · 기존 링크 ${existing.length}`);

// ── ② 원하는 링크를 계산한다 ────────────────────────────────────────────────
let rows = [];
team.forEach(n => { rows = rows.concat(noteLinkRows("team_item", n, companies)); });
work.forEach(n => { rows = rows.concat(noteLinkRows("work_line", n, companies)); });

const keyOf = r => [r.source, r.note_id, r.item_key, r.company_id].join("|");
const have = new Set(existing.map(keyOf));
const fresh = rows.filter(r => !have.has(keyOf(r)));

const byCo = new Map(companies.map(c => [c.id, c.name]));
const teamN = rows.filter(r => r.source === "team_item").length;
const workN = rows.filter(r => r.source === "work_line").length;
console.log(`\n계산된 링크 ${rows.length}쌍 (팀 ${teamN} · 개인 ${workN})`);
console.log(`  · 항목/줄 ${new Set(rows.map(r => r.source + r.note_id + r.item_key)).size}개`);
console.log(`  · 기업 ${new Set(rows.map(r => r.company_id)).size}개`);
console.log(`  · 새로 넣을 것 ${fresh.length}쌍 (이미 있는 것 ${rows.length - fresh.length})`);

console.log("\n── 샘플 20건 ──");
fresh.slice(0, 20).forEach(r => {
  console.log(`  [${r.source}] ${String(r.at).slice(0, 10)}  ${byCo.get(r.company_id)}`);
  console.log(`      ${String(r.item_text).replace(/\s+/g, " ").slice(0, 80)}`);
});

if (!APPLY) {
  console.log("\n⏸  미리보기만 했습니다. 실제로 넣으려면 --apply 를 주세요.");
  process.exit(0);
}

// ── ③ 반영 (유니크 덕에 재실행 안전) ────────────────────────────────────────
const esc = v => (v == null ? "null" : "'" + String(v).replace(/'/g, "''") + "'");
const CHUNK = 200;
let done = 0;
for (let i = 0; i < fresh.length; i += CHUNK) {
  const part = fresh.slice(i, i + CHUNK);
  const values = part.map(r =>
    `(${esc(r.source)},${esc(r.note_id)}::uuid,${esc(r.item_key)},${esc(r.company_id)}::uuid,` +
    `${esc(r.item_text)},${esc(r.at)}::timestamptz,${esc(r.author)})`).join(",\n  ");
  runSql(`
insert into public.note_company_links (source, note_id, item_key, company_id, item_text, at, author)
values
  ${values}
on conflict do nothing;
select count(*) as inserted_so_far from public.note_company_links where deleted_at is null;
`);
  done += part.length;
  console.log(`  … ${done}/${fresh.length}`);
}
console.log(`\n✅ ${fresh.length}쌍 반영 완료. 이제 별도 조회로 검증하세요(CLAUDE.md 2-2).`);
```

- [ ] **Step 2: 미리보기를 돌린다**

Run: `node scripts/migrate-note-links.mjs`
Expected:
- `계산된 링크 276쌍 (팀 95 · 개인 181)`
- `항목/줄 250개` · `기업 68개` · `새로 넣을 것 276쌍`
- 샘플에 이메일 주소(`gmail.com` 등)가 **한 건도 없어야** 한다

> ⚠️ 숫자가 다르면 **멈추고 원인부터 찾는다.** 데이터가 그날 늘었을 수도 있고 매처가 틀렸을 수도 있다.
> 조사 문서의 재측정 쿼리로 대조할 것.

- [ ] **Step 3: 반영 전 지문을 떠 둔다**

임시 파일에 넣고 `node scripts/run-sql.js`:
```sql
select
  (select count(*) from public.team_notes where deleted_at is null) as tn,
  (select count(*) from public.work_notes where deleted_at is null) as wn,
  (select count(*) from public.activity_logs where deleted_at is null) as logs,
  (select count(*) from public.pipeline_cards) as cards,
  (select md5(string_agg(id::text || coalesce(stage,'') || coalesce(stage_changed_at::text,'') || coalesce(sync_mode,''), '|' order by id))
     from public.pipeline_cards) as card_fingerprint;
```
Expected: 값을 적어 둔다.

- [ ] **Step 4: 반영한다**

Run: `node scripts/migrate-note-links.mjs --apply`
Expected: `✅ 276쌍 반영 완료`

- [ ] **Step 5: 검증 — 실행 스크립트가 아닌 별도 조회로**

임시 파일 5개를 **하나씩** 돌린다(run-sql.js 는 결과를 하나만 찍는다).

(5-1) 건수:
```sql
select count(*) as total,
       count(*) filter (where source='team_item') as team,
       count(*) filter (where source='work_line') as work,
       count(distinct company_id) as companies,
       min(at)::date::text as oldest, max(at)::date::text as newest
from public.note_company_links where deleted_at is null;
```
Expected: `total=276` · `team=95` · `work=181` · `companies=68` · `oldest=2026-07-20` · `newest=2026-08-31`

(5-2) **엉뚱한 기업에 붙은 것 0건** — 링크의 기업명이 `item_text` 안에 `@이름` 으로 실제 있는지 전수 대조:
```sql
select count(*) as 잘못붙은링크
from public.note_company_links l join public.companies c on c.id = l.company_id
where l.deleted_at is null and position('@' || c.name in l.item_text) = 0;
```
Expected: `0`

(5-3) 이메일이 안 들어갔는지:
```sql
select count(*) as 이메일링크 from public.note_company_links
where deleted_at is null and (item_text ilike '%@gmail.com%' or item_text ilike '%@naver.com%' or item_text ilike '%@kosmes.or.kr%')
  and company_id in (select id from public.companies where name ilike '%gmail%' or name ilike '%naver%');
```
Expected: `0`

(5-4) 예시 임팩트레이드의 시각 — **2026-08-31 09:00 KST**(카드 생성 8/30 아님):
```sql
select (l.at at time zone 'Asia/Seoul')::text as kst, l.source, left(l.item_text, 60) as txt
from public.note_company_links l join public.companies c on c.id = l.company_id
where l.deleted_at is null and c.name like '주식회사 임팩트레이드%';
```
Expected: `kst` 가 `2026-08-31 09:00:00`

(5-5) 원본 테이블 무변화 — Step 3 의 쿼리를 그대로 다시 돌린다.
Expected: `tn`·`wn`·`logs`·`cards`·`card_fingerprint` **전부 Step 3 과 동일**

- [ ] **Step 6: 재실행 안전 실증**

Run: `node scripts/migrate-note-links.mjs --apply`
Expected: `새로 넣을 것 0쌍` · `✅ 0쌍 반영 완료`

(5-1) 을 다시 돌려 `total=276` **불변**인지 확인.

- [ ] **Step 7: 커밋**

```bash
git add scripts/migrate-note-links.mjs
git commit -m "feat(업무노트타임라인): 📦 소급 마이그레이션 276쌍 (재실행 안전 실증)"
```

---

# Task 4: 타임라인에 표시

**Files:**
- Modify: `src/App.js` `CompanyModal` — 상태 선언(현재 14611~14614행 근처) · `loadTimeline`(15126~15137) · 타임라인 렌더(16667~16715)

**Interfaces:**
- Consumes: Task 1 의 테이블, Task 3 이 넣은 데이터
- Produces: 타임라인 항목 `kind === "업무노트항목"`

- [ ] **Step 1: 상태를 추가한다**

`const [timelineNotes, setTimelineNotes] = useState([]);` 아래에 한 줄 추가:
```js
  const [timelineLinks, setTimelineLinks] = useState([]);   // @기업 태그로 연결된 업무노트 항목
```

- [ ] **Step 2: `loadTimeline` 에 쿼리를 추가한다**

`loadTimeline` 의 `Promise.all([...])` 배열 **끝에** 한 줄 추가:
```js
      supabase.from("note_company_links").select("id,source,item_text,at,author")
        .eq("company_id", company.id).is("deleted_at", null).order("at", { ascending: false }),
```
그리고 결과 처리 두 줄 아래에 추가:
```js
    if (results[2] && !results[2].error) setTimelineLinks(results[2].data || []);
```

> ⚠️ 기업당 최대 19행이라 **`fetchAllRows` 가 필요 없다**(1000행 상한과 무관).

- [ ] **Step 3: 렌더 병합에 출처를 추가한다**

`SRC` 객체에 항목 하나 추가:
```js
                  "업무노트항목": { bg: "#EFF6FF", color: "#1D4ED8", border: "#BFDBFE" },
```
`(timelineNotes || []).forEach(...)` **다음에** 추가:
```js
                (timelineLinks || []).forEach(function(l) {
                  items.push({ at: l.at, kind: "업무노트항목", text: l.item_text || "", by: l.author || "", mention: true });
                });
```
본문 렌더에서 `mention` 이면 `@태그`를 파랗게:
```js
                            <div style={{ fontSize: 13, color: "#333", lineHeight: 1.6, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                              {it.mention ? renderMentionText(it.text || "-", companies) : (it.text || "-")}
                            </div>
```

> `companies` 는 `CompanyModal` 의 프롭이다(시그니처 14594행에 있다). **`renderMentionText` 는 읽기만 하므로 수정이 아니다.**

- [ ] **Step 4: 안내 문구를 고친다**

```js
              <div style={{ fontSize: 12, color: "#888", marginBottom: 12 }}>소통내역 · 연결된 업무노트 · @태그된 업무노트 항목 · 진행단계 변경을 시간순으로 모았어요.</div>
```

- [ ] **Step 5: 빌드**

Run: `CI=true npx react-scripts build`
Expected: 에러 0

Run: `node scripts/audit-select-columns.mjs`
Expected: 0건

- [ ] **Step 6: 화면 확인**

Run: `ESLINT_NO_DEV_ERRORS=true npm start`
1. 기업목록에서 **주식회사 임팩트레이드 (IMPACTRADE)** 를 연다
2. 🕒 타임라인 탭
3. 확인:
   - 파란 `업무노트항목` 뱃지로 `@주식회사 임팩트레이드 (IMPACTRADE) -> MP사 차장님에게…` 가 보인다
   - 날짜가 **8/31**(8/30 아님)
   - `@태그`가 파랗게 나온다
4. 링크가 19건인 기업(마이그레이션 로그 참고)도 열어 시간순 정렬을 확인한다

> ⚠️ **알려진 중복**: 개인 노트에서 온 링크 181건 중 **79건**은 기존 `업무노트`(note_auto, 완료 기록) 항목과 내용이 겹친다.
> 뱃지가 다르므로(`업무노트항목`=작성 / `업무노트`=완료) 구분은 되지만, 같은 일이 두 줄로 보인다.
> **이번 범위에서는 그대로 둔다** — 두 사건은 의미가 다르고, 기존 note_auto 경로를 건드리면 완료 기록 전체가 회귀 사정권이다.

- [ ] **Step 7: 커밋**

```bash
git add src/App.js
git commit -m "feat(업무노트타임라인): 🕒 기업 타임라인에 @태그 업무노트 항목 표시"
```

---

# Task 5: 재조정 함수 + 팀 쓰기 경로 연결

**Files:**
- Modify: `src/App.js` — `note-link END` 주석 **앞**에 재조정 함수 추가
- Modify: `src/App.js` `TeamNotesSection` — `saveTeamChecklist`(31279) · 팀 `saveEdit`(31836 근처) · 새 노트 insert(31485) · 일정 추가(31255/31260) · 이월(31395/31401/31412)

**Interfaces:**
- Consumes: `noteLinkRows`
- Produces: `reconcileNoteLinks(source, note, companiesList) -> Promise<{ok, inserted, updated, removed}>`

- [ ] **Step 1: 재조정 함수를 추가한다**

`// ── note-link END ──` **바로 앞**에 삽입:

```js
// 노트 1장의 링크를 통째로 다시 맞춘다(재조정).
//   없으면 insert · 문구/시각이 달라졌으면 update · 사라진 태그는 soft delete.
//
// ⚠️ 이벤트가 아니라 **재조정**인 이유: team_notes 쓰기 경로가 24곳, work_notes 가 42곳이다.
//    이벤트라면 하나만 빠뜨려도 조용히 어긋나지만, 재조정은 한 번 늦게 불려도
//    **다음 저장에서 스스로 복구**된다.
// ⚠️ 쓴 사람의 브라우저에서만 부른다. Realtime 수신자 전원이 부르면 같은 일을 N번 한다.
// ⚠️ 실패해도 노트 저장 자체를 되돌리지 않는다 — 타임라인 표시는 부가 기능이고,
//    다음 저장 때 재조정이 다시 맞춘다.
async function reconcileNoteLinks(source, note, companiesList) {
  if (!note || !note.id) return { ok: false, inserted: 0, updated: 0, removed: 0 };
  var desired = noteLinkRows(source, note, companiesList);   // 삭제된 노트면 [] 가 온다
  var cur = await supabase.from("note_company_links")
    .select("id,item_key,company_id,item_text,at")
    .eq("source", source).eq("note_id", note.id).is("deleted_at", null);
  if (cur.error) { console.warn("[note-link] 조회 실패", cur.error.message); return { ok: false, inserted: 0, updated: 0, removed: 0 }; }
  var keyOf = function(r) { return r.item_key + "|" + r.company_id; };
  var curMap = {};
  (cur.data || []).forEach(function(r) { curMap[keyOf(r)] = r; });

  var seen = {}, toInsert = [], toUpdate = [];
  desired.forEach(function(d) {
    var k = keyOf(d);
    if (seen[k]) return;          // 방어: 같은 키가 두 번 나오면 유니크 위반이다
    seen[k] = 1;
    var ex = curMap[k];
    if (!ex) { toInsert.push(d); return; }
    var sameAt = new Date(ex.at).getTime() === new Date(d.at).getTime();
    if (ex.item_text !== d.item_text || !sameAt) toUpdate.push({ id: ex.id, item_text: d.item_text, at: d.at });
  });
  var toRemove = (cur.data || []).filter(function(r) { return !seen[keyOf(r)]; }).map(function(r) { return r.id; });

  var nowIso = new Date().toISOString();
  if (toInsert.length) {
    var ir = await supabase.from("note_company_links").insert(toInsert);
    if (ir.error) console.warn("[note-link] insert 실패", ir.error.message);
  }
  for (var i = 0; i < toUpdate.length; i++) {
    var u = toUpdate[i];
    var ur = await supabase.from("note_company_links")
      .update({ item_text: u.item_text, at: u.at, updated_at: nowIso }).eq("id", u.id);
    if (ur.error) console.warn("[note-link] update 실패", ur.error.message);
  }
  if (toRemove.length) {
    var dr = await supabase.from("note_company_links")
      .update({ deleted_at: nowIso, updated_at: nowIso }).in("id", toRemove);
    if (dr.error) console.warn("[note-link] delete 실패", dr.error.message);
  }
  return { ok: true, inserted: toInsert.length, updated: toUpdate.length, removed: toRemove.length };
}
```

- [ ] **Step 2: `saveTeamChecklist` 에 연결한다**

`saveTeamChecklist`(31279) 의 `if (r.error) { … }` 블록 **뒤**, 함수가 끝나기 전에:
```js
    if (!r.error) reconcileNoteLinks("team_item", Object.assign({}, note, { checklist: nextList }), companiesList);
```

> `companiesList` 는 `TeamNotesSection` 의 프롭이다(31031행 시그니처).

- [ ] **Step 3: 팀 `saveEdit` 에 연결한다**

`var r = await supabase.from("team_notes").update(payload).eq("id", noteId);` 뒤,
`if (r.error) { alert(...); return; }` **다음 줄**에:
```js
    reconcileNoteLinks("team_item", Object.assign({}, prevNote || {}, payload, { id: noteId }), companiesList);
```

- [ ] **Step 4: 새 팀 노트에 연결한다**

`if (r.error) { alert("등록 실패: " + r.error.message); return; }` **다음 줄**에:
```js
    reconcileNoteLinks("team_item", r.data, companiesList);
```

- [ ] **Step 5: 일정 추가·이월의 3개 지점에 연결한다**

`addSchedule` 과 `confirmTeamCarry` 는 **기존 카드에 항목을 붙이거나(update) 새 카드를 만든다(insert)**.
각각의 성공 분기 뒤에 붙인다:

- `addSchedule` — `var u = await supabase.from("team_notes").update({ checklist: nextList, … })` 뒤:
```js
        if (!u.error) reconcileNoteLinks("team_item", Object.assign({}, dest, { checklist: nextList }), companiesList);
```
- `addSchedule` 의 새 카드 `var ins = await supabase.from("team_notes").insert({...}).select().single();` 뒤:
```js
        if (!ins.error && ins.data) reconcileNoteLinks("team_item", ins.data, companiesList);
```
- `confirmTeamCarry` 의 update / insert 두 곳에도 **같은 방식**으로 붙인다(변수명은 그 자리 것을 쓴다).
- `confirmTeamCarry` 가 원본 카드의 항목을 고치는 `var u2 = await supabase.from("team_notes").update(...)`(31412) 뒤에도 붙인다 — 원본 쪽 항목이 바뀌므로 재조정 대상이다.

- [ ] **Step 6: 쓰기 경로를 전수 확인한다**

Run: `grep -n 'from("team_notes")\.\(update\|insert\)' src/App.js`

나온 줄을 하나씩 보고 **`checklist` 를 바꾸는 것**에 재조정이 붙었는지 확인한다.
`checklist` 를 안 건드리는 것(`read_by` · `status` · `deleted_at` 만 바꾸는 것)은 **붙이지 않는다** — 링크가 달라질 수 없다.
단 **soft delete**(`deleted_at` 설정, 31850)에는 붙인다:
```js
    if (!r.error) reconcileNoteLinks("team_item", Object.assign({}, note || {}, { id: id, deleted_at: new Date().toISOString() }), companiesList);
```
→ `noteLinkRows` 가 `deleted_at` 을 보고 `[]` 를 돌려주므로 그 노트의 링크가 전부 정리된다.

결과를 표로 적어 Task 9 에서 CLAUDE.md 에 넣는다.

- [ ] **Step 7: 빌드 + 화면 확인**

Run: `CI=true npx react-scripts build` → 에러 0

`ESLINT_NO_DEV_ERRORS=true npm start` 로:
1. 팀 업무 공간에서 새 카드를 만들고 항목에 `@(주)로컬` 을 넣어 저장
2. 그 기업 상세 🕒 타임라인에 **바로** 뜨는지 확인 (시각 = 오늘)
3. 항목 문구를 고쳐 저장 → 타임라인 문구도 바뀌는지
4. 항목을 삭제 → 타임라인에서 사라지는지
5. 태그를 `@(주)애슐런컴퍼니` 로 바꿔 저장 → 연결이 옮겨가는지(로컬에서 사라지고 애슐런에 생김)

- [ ] **Step 8: 알림이 늘지 않았는지 확인**

팀 업무 항목추가 알림은 `handleTeamItemAdded` 가 **체크리스트 항목 수 증가**에만 반응한다.
재조정은 `team_notes.checklist` 를 **건드리지 않으므로** 알림에 영향이 없어야 한다.

Run: `git diff src/App.js | grep -n 'handleTeamItemAdded\|markTeamNoteSelfEdit\|teamItemCountRef'`
Expected: **출력 0줄**

- [ ] **Step 9: 커밋**

```bash
git add src/App.js
git commit -m "feat(업무노트타임라인): 🔄 재조정 함수 + 팀 업무 쓰기 경로 연결"
```

---

# Task 6: 개인 업무노트 쓰기 경로 + `wn_append_todo` 예외

**Files:**
- Modify: `src/App.js` `WorkNotesView` — `onChecklistChange`(20898) · `saveEdit`(20958) · 새 노트 insert(20844) · `autoSaveEditNow`(18899) · `wn_append_todo` 호출부(4717 · 8441 · 9416 · 14489 · 20741)

**Interfaces:**
- Consumes: `reconcileNoteLinks`, `noteLinkRows`

- [ ] **Step 1: `onChecklistChange` 에 연결한다**

`if (r.ok) {` 블록 안, `var savedContent = r.data.content;` **다음 줄**에:
```js
      var noteForLinks = notes.find(function(n) { return n.id === noteId; });
      reconcileNoteLinks("work_line", Object.assign({}, noteForLinks || {}, { id: noteId, content: savedContent }), companiesList);
```

> ⚠️ **`newContent` 가 아니라 `savedContent`(실제 저장된 합본)를 쓴다.** `saveContentWithRetry` 가
> 다른 곳에서 늘어난 줄을 합칠 수 있어, 화면 값으로 재조정하면 줄 번호가 DB 와 어긋난다.

- [ ] **Step 2: 개인 `saveEdit` 성공 분기에 연결한다**

`saveEdit` 의 `if (res.ok) { … }` 블록(현재 21012~21017행) 안, `setNotes(...)` **바로 다음 줄**에:
```js
      var savedNote = (notes.find(function(n) { return n.id === editNote.id; }) || {});
      reconcileNoteLinks("work_line",
        Object.assign({}, savedNote, { id: editNote.id, content: finalContent }), companiesList);
```

> ⚠️ `setEditingId(null); setEditNote({});` **앞**에 넣어야 한다 — 뒤에 넣으면 `editNote.id` 가 이미 비어 있다.
> ⚠️ `at`·`author` 는 `note_date`·`assignee` 에서 나온다. `savedNote` 에 그 둘이 들어 있다(목록의 원본 행).

- [ ] **Step 3: 개인 새 노트 insert 에 연결한다**

`if (!r.error && r.data) {` 블록(현재 20851행) 안, `setNotes(function(prev) { return [r.data].concat(prev); });` **다음 줄**에:
```js
      reconcileNoteLinks("work_line", r.data, companiesList);
```

> `r.data` 는 `.select().single()` 결과라 `content`·`note_date`·`assignee` 가 전부 들어 있다.

- [ ] **Step 4: `autoSaveEditNow` 는 `saveEditorContent` 한 곳에서 잡는다**

`autoSaveEditNow`(18899) 는 `setEditNote` 업데이터 **안에서** 돌아 부수효과를 붙이기 나쁘다.
대신 그것이 부르는 **`saveEditorContent`** 가 유일한 관문이므로 거기 붙인다.

`saveEditorContent` 의 `.then(function(r) { … })` 안, `if (r.ok)` 분기에 추가:
```js
        if (r.ok) {
          setEditNote(function(q) { return q && q.id === noteId ? Object.assign({}, q, { updated_at: stamp }) : q; });
          // 🔗 타임라인 링크 재조정 — 내용이 실제로 바뀐 경우에만 부른다.
          //    이 함수는 onBlur 마다 도는데, 매번 쿼리 2개를 쏘면 편집이 굼떠진다.
          var prevN = notes.find(function(n) { return n.id === noteId; });
          if (!prevN || (prevN.content || "") !== newContent) {
            reconcileNoteLinks("work_line",
              Object.assign({}, prevN || {}, { id: noteId, content: newContent }), companiesList);
          }
        }
```

> ⚠️ 기존 `else if (r.conflict)` 분기는 **그대로 둔다.** `if (r.ok) …` 한 줄을 블록으로 바꾸는 것뿐이다.
> ⚠️ `saveEditorContent` 를 부르는 곳이 `autoSaveEditNow` 말고 더 있는지
> `grep -n 'saveEditorContent(' src/App.js` 로 확인하고, 있으면 그 경로도 이 재조정을 타는 게 맞는지 판단한다.

- [ ] **Step 5: `wn_append_todo` 예외를 붙인다**

**남의 노트라 RLS 때문에 재조정이 불가능하다.** 대신 링크 1건을 직접 넣는다.
호출부 5곳(4717 · 8441 · 9416 · 14489 · 20741) 공통으로 쓸 헬퍼를 `reconcileNoteLinks` 아래에 추가:

```js
// 📩 업무요청·빠른업무는 wn_append_todo RPC 로 **남의 노트**에 줄을 덧붙인다.
// 개인노트 RLS 때문에 내 브라우저가 그 노트를 읽을 수 없어 재조정(원하는 상태 계산)이 불가능하다.
// → 그 경로만 링크 1건을 직접 넣는다.
// ⚠️ 줄 번호를 모르므로 item_key 를 "append:<ISO>" 로 둔다.
//    그 노트의 주인이 나중에 저장하면 재조정이 돌아 정상 줄 번호 키로 바뀌고 이 행은 정리된다.
async function appendNoteLinksForLine(noteId, lineText, assignee, noteDate, companiesList) {
  if (!noteId || !lineText) return;
  var refs = taggedCompanyRefs(workLineDisplayText(lineText), companiesList);
  if (refs.length === 0) return;
  var key = "append:" + new Date().toISOString();
  var rows = refs.map(function(r) {
    return {
      source: "work_line", note_id: noteId, item_key: key, company_id: r.id,
      item_text: workLineDisplayText(lineText),
      at: noteLinkAt(noteDate, new Date().toISOString()), author: assignee || null,
    };
  });
  var ins = await supabase.from("note_company_links").insert(rows);
  if (ins.error) console.warn("[note-link] append 실패", ins.error.message);
}
```

각 `wn_append_todo` 호출 성공 뒤에 붙인다. RPC 가 노트 id 를 돌려주면 그걸 쓰고,
안 돌려주면 그 자리에서 이미 알고 있는 대상 노트 id 를 쓴다(호출부마다 확인할 것).

- [ ] **Step 6: 빌드 + 화면 확인**

Run: `CI=true npx react-scripts build` → 에러 0

`ESLINT_NO_DEV_ERRORS=true npm start` 로:
1. 개인 업무노트에 `- [ ] @(주)로컬 자료 전달` 항목 추가 → 그 기업 타임라인에 뜨는지
2. 항목 체크(완료) → **타임라인에 항목이 그대로 있고**, 기존 `업무노트`(완료) 기록이 따로 하나 더 생기는지
3. 항목 삭제 → 링크가 사라지는지
4. **업무요청 보내기**로 `@(주)로컬` 이 든 줄을 남에게 보냄 → 그 기업 타임라인에 뜨는지

- [ ] **Step 7: 회귀 — 업무요청 3동작이 각각 독립인지**

CLAUDE.md 2절 필수 항목이다. 화면에서 확인:
- 보내기 · 가져가기 · 완료 체크가 **서로 영향 없이** 동작
- 같은 날 노트가 **두 장 생기지 않는지**(`wn_append_todo` 경유가 깨지면 이 증상이 난다)

- [ ] **Step 8: 커밋**

```bash
git add src/App.js
git commit -m "feat(업무노트타임라인): 📝 개인 업무노트 쓰기 경로 + wn_append_todo 예외"
```

---

# Task 7: 신규 팀 항목에 `created_at` 남기기

**Files:**
- Modify: `src/App.js` `TeamNotesSection` — 새 항목을 만드는 자리(새 노트 `cleanChecklist` 생성 · `saveEdit` 의 `cleanChecklist` · `addSchedule` 의 `newItem` · `confirmTeamCarry` 의 `newItem`)

**Interfaces:**
- Produces: checklist 항목 객체에 `created_at`(ISO) 필드

- [ ] **Step 1: 항목 생성부에 필드를 추가한다**

항목 객체를 만드는 자리마다 **없을 때만** 채운다:
```js
        created_at: it.created_at || new Date().toISOString(),
```

> ⚠️ **옛 항목엔 없어도 된다**(실측 257개 전부 없음). `noteLinkRows` 가 없으면 `work_date` 로 폴백한다 —
> CLAUDE.md 의 `is_sched` 와 같은 방식이라 옛 데이터가 그대로 그려진다.
> ⚠️ **`taken_at`·`done_at` 과 헷갈리지 말 것.** `created_at` 은 "항목이 처음 만들어진 때"다.

- [ ] **Step 2: 이월된 항목의 시각을 정한다**

`confirmTeamCarry` 의 `newItem` 은 종류·업체·담당자를 옮긴다. **`created_at` 은 옮기지 않고 새로 찍는다** —
연기된 일정은 "그 날짜에 새로 잡힌 일"이고, 원본 항목의 링크는 원본 카드에 그대로 남는다.

- [ ] **Step 3: 검증**

Run: `node scripts/test-note-links.mjs`
Expected: `26/26 통과` (Task 2 의 "팀 item.created_at 우선" 케이스가 이미 이걸 덮는다)

Run: `CI=true npx react-scripts build` → 에러 0

- [ ] **Step 4: 화면 확인**

팀 업무에 새 항목을 만들고, 그 기업 타임라인의 시각이 **지금 시각**(카드의 업무 날짜 09:00 아님)인지 본다.

- [ ] **Step 5: 커밋**

```bash
git add src/App.js
git commit -m "feat(업무노트타임라인): 🕘 신규 팀 항목에 created_at 기록 (옛 항목은 work_date 폴백)"
```

---

# Task 8: 미연결 태그 목록 + 재동기화

**Files:**
- Modify: `scripts/migrate-note-links.mjs` — 미연결 태그 리포트 추가
- Modify: `src/App.js` `CompanyModal` 타임라인 탭 — 재동기화 버튼

**Interfaces:**
- Consumes: `reconcileNoteLinks`

- [ ] **Step 1: 마이그레이션 스크립트에 미연결 리포트를 추가한다**

`console.log("\n── 샘플 20건 ──")` **앞**에:

```js
// ── 미연결 @태그 리포트 ────────────────────────────────────────────────────
// @ 는 있는데 살아있는 기업과 안 맞는 것. 자동 보정하지 않는다 —
// 유사도로 붙이면 오연결이 난다(CLAUDE.md 2절 "이름을 조인키로 쓰지 말 것").
const unlinked = [];
const scan = (label, key, text, date) => {
  const t = String(text || "");
  for (let i = 0; i < t.length; i++) {
    if (t.charAt(i) !== "@") continue;
    if (i > 0 && !/\s/.test(t.charAt(i - 1))) continue;      // 이메일 배제
    const tail = t.slice(i + 1, i + 41);
    if (companies.some(c => tail.indexOf(c.name) === 0)) { i += 1; continue; }  // 정상 태그
    if (/^[\w.+-]*@/.test(t.slice(Math.max(0, i - 20), i + 1))) continue;
    unlinked.push({ label, key, date, probe: tail.split(/\s{2,}|\n/)[0].slice(0, 30), text: t.replace(/\s+/g, " ").slice(0, 70) });
  }
};
team.forEach(n => (Array.isArray(n.checklist) ? n.checklist : []).forEach((it, idx) => {
  if (it) scan("팀", it.id || ("idx:" + idx), it.text, n.work_date || String(n.created_at).slice(0, 10));
}));
work.forEach(n => String(n.content || "").split("\n").forEach((line, idx) => {
  scan("개인", String(idx), line.replace(/\\n/g, "\n"), n.note_date);
}));
console.log(`\n── ⚠️ 연결 안 된 @태그 ${unlinked.length}건 (자동 보정하지 않음) ──`);
unlinked.forEach(u => console.log(`  [${u.label}] ${u.date}  @${u.probe}\n      ${u.text}`));
```

- [ ] **Step 2: 미리보기로 확인한다**

Run: `node scripts/migrate-note-links.mjs`
Expected: 연결 안 된 태그 목록에 **아래 2건이 나오고 이메일은 안 나온다**:
- `@(주)에이원커뮤니케이션코리` (개인, 2026-07-22) — 실제는 `(주)에이원커뮤니케이션코리아`
- `@조선제일한우` (개인, 2026-08-04) — 실제는 `농업회사법인(주)조선제일한우`

> 이메일이 목록에 섞여 나오면 위 `scan` 의 경계 검사를 고친다. **매처(`taggedCompanyRefs`)는 건드리지 않는다.**

- [ ] **Step 3: 타임라인 탭에 재동기화 버튼을 넣는다**

타임라인 탭 상단 안내 문구 옆에:
```js
                <button onClick={async function() {
                  if (!window.confirm("이 기업에 연결된 업무노트 항목을 다시 맞출까요?\n(노트 내용은 바뀌지 않습니다)")) return;
                  setTimelineLoading(true);
                  var tn = await supabase.from("team_notes").select("*").is("deleted_at", null);
                  var wn = await supabase.from("work_notes").select("*").is("deleted_at", null);
                  for (var i = 0; i < ((tn.data) || []).length; i++) await reconcileNoteLinks("team_item", tn.data[i], companies);
                  for (var j = 0; j < ((wn.data) || []).length; j++) await reconcileNoteLinks("work_line", wn.data[j], companies);
                  await loadTimeline();
                }} style={{ fontSize: 11, padding: "3px 9px", border: "1px solid #E8E5E0", borderRadius: 6, background: "#fff", cursor: "pointer" }}>🔄 재동기화</button>
```

> ⚠️ **개인노트 RLS 때문에 이 버튼은 사람마다 결과가 다르다** — 내가 읽을 수 있는 노트만 재조정된다.
> 관리자(양호)가 누르면 전건이 맞춰진다. 버튼 옆에 그 안내를 한 줄 적는다.
> ⚠️ 노트 수가 649장(팀 74 + 개인 575)이라 몇 초 걸린다. 진행 중에는 `timelineLoading` 으로 막는다.

- [ ] **Step 4: 빌드 + 확인**

Run: `CI=true npx react-scripts build` → 에러 0

화면에서 재동기화를 누르고 링크 수가 **안 늘어나는지**(멱등) 확인한다.

- [ ] **Step 5: 커밋**

```bash
git add src/App.js scripts/migrate-note-links.mjs
git commit -m "feat(업무노트타임라인): 🔎 미연결 태그 리포트 + 재동기화 버튼"
```

---

# Task 9: 회귀 점검 + 문서화

**Files:**
- Modify: `CLAUDE.md`
- Modify: `docs/superpowers/specs/2026-08-31-worknote-timeline-sync-조사.md`(기업 수 정정)
- Modify: `docs/superpowers/specs/2026-08-31-worknote-timeline-sync-design.md`(기업 수 정정 + 발견 2건 반영)

- [ ] **Step 1: 자동 점검을 돌린다**

```bash
node scripts/test-note-links.mjs        # 26/26
node scripts/audit-select-columns.mjs   # 0건
CI=true npx react-scripts build         # 에러 0
```

- [ ] **Step 2: 공용 함수 무변경을 증명한다**

```bash
git diff main...HEAD -- src/App.js | grep -E '^[-+]' | grep -vE '^(\+\+\+|---)' \
  | grep -E 'findTaggedCompanies|renderMentionText|getMentionRegex|detectCompaniesInText|logToActivity|parseUnfinishedItems|buildItemLine|encodeItemText|bizScaleCap|parseLoanAmount'
```
Expected: **출력 0줄**

- [ ] **Step 3: 데이터 지문을 대조한다**

Task 3 Step 3 의 쿼리를 다시 돌린다.
Expected: `tn`·`wn`·`logs`·`cards`·`card_fingerprint` 가 **작업 시작 때와 동일**
(= 코드 변경만으로는 원본 데이터가 한 줄도 안 움직였다)

- [ ] **Step 4: 화면 회귀 점검 (CLAUDE.md 2절)**

- [ ] 업무노트: 개인화 / 자동제목 / **이월** / 대기사유 / @업체 태그
- [ ] 업무 요청: 보내기 · 가져가기 · 완료가 **각각 독립** + 같은 날 노트 두 장 안 생김
- [ ] 빠른 메모 · 빠른 업무
- [ ] 실시간 팀 채팅 — @태그가 예전처럼 파랗게 (`findTaggedCompanies` 무변경 확인)
- [ ] 팀 업무: 완료 자동숨김 / 공지 확인 / 우선순위 / 공지 고정
- [ ] 팀 업무 **항목추가 알림이 과다하지 않은지**
- [ ] 기업상세 **「이슈·액션」 탭 배지 숫자가 예전과 같은지** (`activity_logs` 무변경 증거)
- [ ] 졸업후보기업 판별 / 기업목록 인라인 편집 / 대시보드 위젯
- [ ] 모바일 `/m` — 팀 업무 탭(`TeamNotesSection` 재사용이라 영향 받는다)

- [ ] **Step 5: CLAUDE.md 에 절을 추가한다**

`## 🃏 기관현황 → 파이프라인 카드 자동 생성` 절과 **같은 형식**으로 새 절을 쓴다. 반드시 담을 것:

1. **원칙** — (항목 × 기업) 하나당 링크 1행. 저장 위치는 `note_company_links` 하나
2. **`activity_logs` 를 쓰지 않은 이유** — 읽는 곳 11곳 중 9곳 오염(탭 배지·AI 프롬프트·200건 창·팀 활동 건수)
3. **⚠️ 매처는 `decodeItemText` 후에 돌린다** — 리터럴 `\n` 때문에 태그 5건이 조용히 누락됐던 함정
4. **⚠️ 팀 항목 text 는 디코드하면 안 된다** — 이미 디코드된 상태
5. **⚠️ 줄 분리는 `content.split("\n")`** — 리터럴 `\n` 까지 쪼개면 앱과 줄 번호가 어긋난다
6. **`findTaggedCompanies` 는 접두 과매칭이 있다**(139→122쌍). 채팅 전용이라 안 고쳤다. **새 코드는 `taggedCompanyRefs` 를 쓸 것**
7. **쓰기 경로 전수 표** (Task 5 Step 6 결과) — 새 경로를 만들면 이 표에 추가하고 재조정을 붙일 것
8. **⚠️ `wn_append_todo` 예외** — 남의 노트라 재조정 불가, 링크 직접 insert
9. **⚠️ 기존 `note_auto` 와 79건 중복** — 의미가 다른 두 사건이라 둘 다 남긴다. note_auto 경로는 건드리지 말 것
10. **개인 노트 줄은 실제 시각을 못 쓴다** — `content` 포맷 변경 금지가 이유
11. 실측 수치(276쌍 / 250항목 / 68기업)와 **재측정 방법**

- [ ] **Step 6: 조사·설계 문서의 기업 수를 정정한다**

두 문서의 "~85개 기업"을 **68개(중복 제외)** 로 고치고, 정정 사유를 한 줄 남긴다.

- [ ] **Step 7: 커밋**

```bash
git add CLAUDE.md docs/superpowers/
git commit -m "docs(업무노트타임라인): 📋 쓰기 경로 표·함정 기록 + 회귀 확인 완료"
```

---

---

## 📌 계획 자체 검토 결과 (2026-08-31)

**끝난 것**
- 스펙 전 항목이 태스크에 대응함(스펙 11절의 열린 항목 3개도 Task 7·8 에서 해소)
- Task 2·3·4·6 의 코드 블록을 실제 App.js 를 읽고 정확한 앵커로 확정
- 테스트 개수 28개로 확정(세어 본 값), `09:00 KST` 검증을 `Intl.DateTimeFormat` 으로 견고화
- 타입·함수명 일관성 확인: `reconcileNoteLinks(source, note, companiesList)` /
  `noteLinkRows` / `noteLinkAt` / `workLineDisplayText` / `taggedCompanyRefs` 가 전 태스크에서 동일
  (⚠️ 컴포넌트마다 프롭 이름이 다르다 — `TeamNotesSection`·`WorkNotesView` 는 `companiesList`,
   `CompanyModal` 은 `companies`. 태스크별로 맞게 적어 뒀다.)

**아직 앵커가 무른 곳 — 실행 전에 그 자리를 읽고 확정할 것**
1. **Task 5 Step 5** (팀 일정 추가·이월 3개 지점) — `addSchedule`·`confirmTeamCarry` 의 update/insert
   결과 변수명을 그 자리에서 확인해야 한다. 지금은 "그 자리 변수를 쓴다"로 남아 있다.
2. **Task 7 Step 1** (팀 항목 `created_at` 신설) — 항목 객체를 만드는 자리가 4곳이라 했는데
   **정확한 줄을 아직 안 짚었다.** `grep -n 'taken_work_note_id' src/App.js` 로 항목 객체 생성부를
   전수로 찾아 표로 만든 뒤 시작할 것.
3. **Task 6 Step 5** (`wn_append_todo` 5곳) — 호출부마다 대상 노트 id 를 어떻게 얻는지
   (RPC 반환값인지, 그 자리에서 이미 아는 값인지) 5곳 각각 확인이 필요하다.

→ 셋 다 **구현 시작 시점에 해당 태스크 안에서 해결**하면 되고, 앞 태스크를 막지 않는다.

---

## 완료 보고에 반드시 적을 것 (CLAUDE.md 3절)

- **회귀 확인 완료 여부**와 점검한 항목 목록
- 깨진 것이 있으면 목록 + "고칠 것 vs 이번엔 보고만 할 것" 구분
- 실측 수치는 **작업 당일 다시 센 값**으로 적을 것
- **알려진 남은 것**: 개인 노트 링크 79건이 기존 `note_auto` 기록과 내용상 겹쳐 타임라인에 두 줄로 보인다는 점
