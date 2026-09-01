# 업무노트 @기업 태그 → 기업 타임라인 반영 — 설계

- 브랜치: `feat/worknote-timeline-sync` · 승인: 2026-08-31
- 사전조사: [`2026-08-31-worknote-timeline-sync-조사.md`](./2026-08-31-worknote-timeline-sync-조사.md) — 숫자 근거는 전부 거기 있다
- 상태: **설계 승인됨 / 구현 전**

## 0. 한 줄 요약

업무노트(팀 체크리스트 항목 · 개인 노트 줄)에 `@기업명` 을 쓰면, 그 기업 상세의 **🕒 타임라인 탭**에
항목 내용이 **작성 시각 그대로** 뜬다. 기존에 쌓인 것도 전부 소급 반영한다.

**연결 수단은 새 테이블 `note_company_links` 하나.** 기존 테이블의 의미는 하나도 바꾸지 않는다.

---

## 1. 확정된 결정 (사용자)

| # | 결정 | 근거 |
|---|---|---|
| 1 | **팀 + 개인 둘 다** 반영 | 팀 95쌍 / 개인 181쌍 |
| 2 | **소급 시각 = 업무 날짜** (팀 `work_date`, 개인 `note_date`), 09:00 KST | 항목별 시각이 DB에 없다 |
| 3 | 수정·삭제 시 **타임라인도 항상 따라감** | ⇒ 스냅샷이 아니라 **재조정(reconcile)** 구조 |
| 4 | 저장 위치 = **전용 테이블 B안** | `activity_logs` 는 읽는 곳 11곳 중 9곳이 오염된다 |
| 5 | **신규 항목은 실제 작성 시각** | 단 개인 노트는 구조상 불가 — 2절 ⚠️ 참고 |

---

## 2. 시각 규칙 (`at`)

| | 소급 | 신규 |
|---|---|---|
| **팀 항목** | `work_date` 09:00 KST → 없으면 `team_notes.created_at`<br>(실측 **63 / 32**건) | **`item.created_at` 신설** — checklist 객체에 ISO 문자열 필드 추가 |
| **개인 줄** | `note_date` 09:00 KST (575/575 채워짐, 폴백 불필요) | **`note_date` 09:00 KST 그대로** |

> 💡 **`note_date` 자정 UTC == 그날 09:00 KST** 다. 별도 변환 없이 `note_date` 를 timestamptz 로 쓰면 된다.

### ⚠️ 개인 노트 줄만 "실제 작성 시각"을 못 쓴다 — 의도된 타협
`work_notes.content` 는 **텍스트 한 덩이**라 줄별 시각을 넣으려면 포맷을 바꿔야 한다.
거기엔 이월 꼬리표(`CARRIED_TAIL_RE`) · `parseUnfinishedItems` · `buildItemLine` · `decodeItemText`(리터럴 `\n` 인코딩) ·
`wn_team_unfinished()` SQL 이 전부 걸려 있다 → **CLAUDE.md 가 금지하는 영역.**

대신 `at` 이 **노트에서 순수 계산**되므로 재조정을 몇 번 돌려도 값이 같다.
실측상 이월 꼬리표 `(→ M/D 이월)` 가 붙는 태그 줄이 **20건** 있는데, 이 규칙이면 그런 문구 수정에도 시각이 안 흔들린다.

---

## 3. 새 테이블 `note_company_links`

```sql
create table public.note_company_links (
  id          uuid primary key default gen_random_uuid(),
  source      text        not null check (source in ('team_item','work_line')),
  note_id     uuid        not null,        -- team_notes.id / work_notes.id
  item_key    text        not null,        -- 4절
  company_id  uuid        not null references public.companies(id) on delete cascade,
  item_text   text        not null,        -- 화면에 보이는 형태의 항목 원문 스냅샷(@태그 포함)
  at          timestamptz not null,        -- 타임라인 정렬 기준 (2절)
  author      text,                        -- 팀: posted_by / 개인: assignee
  created_at  timestamptz not null default now(),
  updated_at  timestamptz,
  deleted_at  timestamptz
);
create unique index note_company_links_uniq
  on public.note_company_links (source, note_id, item_key, company_id)
  where deleted_at is null;
create index note_company_links_company_at
  on public.note_company_links (company_id, at desc)
  where deleted_at is null;
create index note_company_links_note
  on public.note_company_links (source, note_id) where deleted_at is null;
```

- **`note_id` 에 FK 를 걸지 않는다.** 원본이 두 테이블(`team_notes`/`work_notes`)이라 한 컬럼으로 FK 를 걸 수 없다.
  원본이 지워지면 재조정이 링크를 soft delete 한다(6절).
- `company_id` 의 `on delete cascade` 는 **영구삭제**에만 걸린다. 기업 soft delete 는 링크를 안 건드린다
  (`pipeline_cards.company_id` 와 같은 규칙).
- **유니크가 소급 마이그레이션의 재실행 안전을 보장한다** — 몇 번을 돌려도 안 불어난다.

### 🔒 RLS — CLAUDE.md 2-2 체크리스트를 **같은 커밋에서** 전부 이행
- [ ] `alter table public.note_company_links enable row level security;`
- [ ] 정책 4개(select/insert/update/delete) 전부 `to authenticated` + `is_approved()`. **`to public`/`to anon` 금지**
- [ ] `revoke all on public.note_company_links from anon;`
- [ ] `revoke truncate, references, trigger on public.note_company_links from authenticated, anon;`
- [ ] 배포 전 점검 — 결과 0행이어야 정상:
      `select relname from pg_class where relnamespace='public'::regnamespace and relkind='r' and relrowsecurity=false;`
- [ ] 실행 후 **별도 조회**로 `anon` GRANT 0행 재확인 (2-2: `revoke` 는 grantor 가 다르면 조용히 통과한다)

### 📄 SQL 파일 (저장소 관례: `_rollback` / `_검증` 동반)
- `업무노트태그_타임라인_테이블.sql` · `_rollback.sql` · `_검증.sql`

> ⚠️ 열람 범위는 **팀 전체**다(`is_approved()`). 개인 업무노트는 지금 본인만 보지만,
> **태그된 그 줄만** 이 테이블로 복사되어 팀에 보이게 된다. 노트 전체가 아니다.
> `company_id` 붙은 노트가 팀 공유되는 기존 예외와 같은 방향이며, 되돌리려면 이 테이블만 비우면 된다.

---

## 4. `item_key` — 항목 식별자

| source | item_key | 근거 |
|---|---|---|
| `team_item` | **`item.id`** | 살아있는 항목 **257/257 전부 보유**. 방어적으로 없으면 `"idx:"+배열위치` |
| `work_line` | **줄 번호(0-based, 문자열)** | 앱의 `parseChecklist.idx` / `parseUnfinishedItems.lineIdx` 와 같은 값 |

### ⚠️ 줄 분리 규칙 — **`content.split("\n")`, 진짜 줄바꿈만**
리터럴 `\n`(역슬래시+n 두 글자)은 **줄 안에 그대로 남긴다**(`decodeItemText` 가 표시할 때 푼다 — 의도된 인코딩).
조사 초기에 이걸 틀려서 줄 수를 잘못 셌다: 리터럴까지 쪼개면 180줄, **앱과 같게 세면 165줄**(쌍은 181로 동일).
→ **마이그레이션 스크립트도 반드시 같은 규칙으로 쪼갤 것.**

줄 번호가 밀려도(위에 줄이 추가되면) **`at` 이 노트에서 순수 계산되므로 시각은 안 흔들린다.**
재조정이 그 노트의 링크를 통째로 다시 맞추므로 결과 집합은 항상 옳다.

### `item_text` — 화면에 보이는 형태로 저장
- **팀**: `item.text` 원문 그대로
- **개인**: 앱의 `parseChecklist` 와 같은 처리 — `- [ ]`/`- [x]` 마커 제거 → `splitItemWait` 로 `{응답대기:…}` 분리 →
  `decodeItemText` 로 리터럴 `\n` → 진짜 줄바꿈. 체크박스가 아닌 일반 글줄은 원문에 `decodeItemText` 만.
- **이월 꼬리표 `(→ M/D 이월)` 는 남긴다** (`parseChecklist` 와 동일. `parseUnfinishedItems` 는 떼지만 그건 미완료 판정용이다).
- `@태그` 를 지우지 않는다 — 타임라인에서 `renderMentionText` 로 파랗게 보여준다.

---

## 5. 매처 `taggedCompanyRefs(text, companiesList)`

`findTaggedCompanies`(App.js:4352) **바로 아래**에 신설. 반환 `[{ id, name, index }]`.

1. **`@` 앞이 공백 또는 줄머리일 때만** 태그로 인정 (`MentionField` 의 `isBoundary` 와 같은 규칙)
   → 이메일 주소 3건(`basegilt@gmail.com` 등)이 자동 배제된다
2. **가장 긴 이름부터 매칭하고 매칭한 구간을 소비**한다
   → `findTaggedCompanies` 의 접두 과매칭(실측 139→122쌍, 17쌍) 재발 방지
3. 이름 뒤는 **공백 또는 문자열 끝**이어야 한다 (`MentionField` 백드롭 규칙과 동일)
4. 같은 기업이 한 항목에 두 번 나와도 **1건으로 dedupe**
5. `companiesList` 는 **살아있는 기업만** (앱 상태가 이미 그렇다). 실측상 살아있는 기업 기준 **모호한 이름 0건**

### ⚠️ 기존 공용 함수는 건드리지 않는다
- `findTaggedCompanies` — 채팅 말풍선(App.js:5885) 전용. 고치면 채팅이 회귀 사정권에 들어온다
- `renderMentionText` · `getMentionRegex` · `MentionField` — 표시 전용. 그대로 둔다
- `bizScaleCap` 등 그 밖의 공용 함수 — 사용자 지시대로 손대지 않는다

---

## 6. 실시간 반영 — 재조정(reconcile)

### `reconcileNoteLinks(source, note, companiesList)`
노트 **1장의 링크를 통째로 다시 맞춘다.**

1. `desired` 계산 — 그 노트의 모든 항목/줄 × `taggedCompanyRefs` → `{item_key, company_id, item_text, at, author}`
2. `note_company_links` 에서 그 `(source, note_id)` 의 살아있는 링크 조회
3. **없는 것 insert · `item_text`/`at` 이 달라진 것 update · `desired` 에 없는 것 soft delete**
4. 결과가 없어도(태그 0개) 정상 — 기존 링크만 전부 soft delete 된다

**이벤트 기반으로 하지 않는 이유**: `team_notes` 쓰기 경로 **24곳**, `work_notes` **42곳**이다.
이벤트라면 하나만 빠뜨려도 조용히 어긋나지만, 재조정은 **한 번 늦게 불려도 다음 저장에서 스스로 복구**된다.

- **쓴 사람의 브라우저에서만** 돈다. Realtime 수신자 전원이 쓰면 같은 일을 N번 한다.
- 노트가 soft delete 되면 그 노트의 링크도 전부 soft delete.

### 🃏 쓰기 경로 전수 점검 표 (구현 시 채워서 CLAUDE.md 에 남길 것)
CLAUDE.md 「🃏 `agency_cases` INSERT 경로 6곳 전수 점검」과 **같은 형식**으로 만든다.
아는 것만 미리 적는다 — 구현 때 `grep -n 'from("team_notes")'` / `from("work_notes")` 로 전수 확인할 것.

| 경로 | 위치 | 재조정 |
|---|---|---|
| 팀 체크리스트 저장(완료·삭제·일정) | `saveTeamChecklist` 31282 | ✅ |
| 팀 노트 편집 저장 | `saveEdit` 31836 | ✅ |
| 팀 노트 신규 | 31485 | ✅ |
| 팀 일정 추가 | 31255 / 31260 | ✅ |
| 팀 이월 | 31395 / 31401 / 31412 | ✅ |
| 개인 체크리스트 변경 | `onChecklistChange` 20898 | ✅ |
| 개인 노트 편집 자동저장 | `autoSaveEditNow` 18899 | ✅ |
| 개인 노트 신규 | (구현 시 확인) | ✅ |
| **업무요청·빠른업무 → 남의 노트** | `wn_append_todo` RPC | ⚠️ **아래 예외** |

### ⚠️ 예외 하나 — `wn_append_todo` 는 재조정을 못 한다
업무요청·빠른업무는 **남의 노트**에 RPC 로 줄을 덧붙인다. 개인노트 RLS 때문에
**내 브라우저가 그 노트를 읽을 수 없어** 재조정(1단계 `desired` 계산)이 불가능하다.

→ 그 경로만 **재조정 대신 링크 1건을 직접 insert** 한다. 붙인 줄의 텍스트·대상 기업·노트 id 는 호출부가 이미 알고 있다.
→ 줄 번호를 모르므로 `item_key` 는 `"append:" + <RPC 호출 시각 ISO>` 로 둔다.
   ⚠️ 그 노트의 주인이 나중에 그 노트를 저장하면 재조정이 돌아 **정상 줄 번호 키로 교체**된다(그때 중복 정리).
→ 실측 해당 **11쌍**. 규모가 작아 이 예외로 충분하다.

### ↩️ 재동기화 버튼
`resyncAutoCards` 와 같은 성격의 수동 재조정을 하나 둔다(기업 타임라인 탭 또는 관리 화면).
드리프트가 생겨도 사람이 복구할 수 있게 하는 안전판이다.

---

## 7. 소급 마이그레이션 — 276쌍

`scripts/migrate-note-links.mjs`

- **`App.js` 소스에서 매처와 `at` 계산을 떼어내 실행**한다
  (`scripts/test-nocard.mjs` · `test-debtor-change.mjs` 와 같은 방식).
  손으로 옮겨 적으면 검증이 아니고, SQL 로 다시 구현하면 CLAUDE.md 가 경고하는 **JS↔SQL 이중 구현**이 된다.
- **`--dry-run` 이 기본값.** 건수·기업별 분포·샘플 20건을 출력하고 아무것도 쓰지 않는다.
  `--apply` 를 줘야 실제로 넣는다.
- 유니크 인덱스 덕에 **재실행 안전**(`on conflict do nothing` 또는 사전 조회 후 차집합).
- 살아있는 노트(`deleted_at is null`)만 대상.

### 기대값 (2026-08-31 실측 — **실행 당일 다시 셀 것**)
| | 쌍 | 항목/줄 | 기업 | 여러 기업 태그 |
|---|---:|---:|---:|---:|
| 팀 (`team_item`) | **95** | 85 | 63 | 5 |
| 개인 (`work_line`) | **181** | 165 | 65 | 8 |
| **합계** | **276** | 250 | **68** | 13 |

시각 분포: 팀 `work_date` 63 / `created_at` 폴백 32 · 개인 전부 `note_date`.
가장 오래된 것 2026-07-20, 최신 2026-08-31.

> 🔧 **정정 (2026-09-01, 구현 중)** — 기업 수를 처음엔 `~85` 로 적었는데 **68 이 맞다.**
> 팀 63 + 개인 65 를 그냥 더한 값이었다 — **양쪽에 다 태그된 기업이 60개**라 중복을 빼야 한다.
> 실제로 넣은 뒤 `count(distinct company_id)` 로 재확인: **68**.
>
> 📌 **오늘(2026-09-01) 다시 센 값** — 원본이 매일 늘어나니 인용 전에 그날 다시 셀 것:
> **295쌍**(팀 103 · 개인 192) · 항목/줄 265 · **기업 71** · 2026-07-18~09-02.
> 소급분은 277쌍(8/31) + **18쌍(9/1)** 두 번에 나눠 넣었다 — 뒤 18쌍은 재조정 코드 배포 전에
> 달린 태그라 자동으로 안 붙어 있던 것이다. 지금은 계산값과 저장값이 **일치**한다.

### 검증 (CLAUDE.md 2-2: **실행 파일에 딸린 SELECT 를 믿지 말고 별도 조회로**)
- [ ] 링크 행수 = 기대 쌍수, `source` 별 내역 일치
- [ ] **엉뚱한 기업에 붙은 것 0건** — 링크의 `company_id` 이름이 `item_text` 안에 `@이름` 으로 실제 존재하는지 전수 대조
- [ ] 이메일 3건이 링크로 안 들어갔는지 확인
- [ ] 임팩트레이드 링크의 `at` = **2026-08-31 09:00 KST**(카드 생성 8/30 아님)
- [ ] **한 번 더 돌려도 행수 불변**(재실행 안전 실증)
- [ ] 기존 테이블 무변화 — `team_notes`/`work_notes`/`activity_logs`/`pipeline_cards` 행수·지문 **전후 동일**

---

## 8. 화면

### 🕒 타임라인 탭 (`CompanyModal`)
- `loadTimeline`(App.js:15125)에 **쿼리 1개 추가** (현재 2개 → 3개):
  `note_company_links` where `company_id` = 이 회사, `deleted_at is null`, `at desc`
- 병합부(16679~16689)에 항목 추가 — 뱃지 **`📌 업무노트`**(초록 계열, 기존 `업무노트`(note_auto)와 구분)
  - `at` / `item_text` / `author` 를 그대로 쓴다. 정렬은 기존 `items.sort` 가 처리
  - 본문은 `renderMentionText` 로 `@태그` 를 파랗게
- 안내 문구를 "소통내역 · 연결된 업무노트 · **@태그된 업무노트 항목** · 진행단계 변경" 으로 수정
- ⚠️ 기업당 최대 19행이라 부하는 무시 가능. **`fetchAllRows` 불필요**(1000행 근처도 아니다)

### 🔎 미연결 태그 목록
`@` 는 있는데 살아있는 기업과 안 맞는 것을 **목록으로만** 보여준다. **자동 보정하지 않는다.**
현재 해당 2건:

| 적힌 것 | 실제 기업 | 원인 |
|---|---|---|
| `@(주)에이원커뮤니케이션코리` (개인, 2026-07-22) | `(주)에이원커뮤니케이션코리아` | 끝 글자 누락 |
| `@조선제일한우` (개인, 2026-08-04) | `농업회사법인(주)조선제일한우` | 약칭 |

유사도로 자동 연결하면 오연결이 난다 — CLAUDE.md 2절 "이름을 조인키로 쓰는 새 기능을 만들지 말 것"과 같은 계열.
배치 위치는 구현 시 결정(마이그레이션 스크립트 출력으로만 내도 요건은 충족된다).

---

## 9. 일부러 안 하는 것

- `findTaggedCompanies` · `renderMentionText` · `getMentionRegex` · `MentionField` 수정
- `activity_logs` 에 행 추가 (읽는 곳 11곳 중 9곳 오염 — 조사 문서 참고)
- `work_notes.content` 포맷 변경 · `work_notes.company_id` / `team_notes.related_company_id` 의미 변경
- `work_notes.tagged_company` 사용 — **죽은 컬럼**(575행 중 0건)
- 이름 유사도 자동 보정
- 모바일 전용 UI — `CompanyModal` 은 데스크톱 전용(`CRMApp`)이라 영향 없다
- 알림 — 태그해도 푸시·팀 알림을 새로 내지 않는다(과다알림 방지)

---

## 10. 회귀 점검 (CLAUDE.md 2절)

- [ ] 업무노트: 개인화 / 자동제목 / **이월** / 대기사유 / **@업체 태그**
- [ ] 업무 요청: 보내기 · 가져가기 · 완료가 **각각 독립 동작** (`wn_append_todo` 경로를 건드린다)
- [ ] 빠른 메모 · 빠른 업무
- [ ] 실시간 팀 채팅 (`findTaggedCompanies` 를 안 건드렸는지 **바이트 대조**)
- [ ] 팀 업무: 완료 자동숨김 / 공지 확인 / 우선순위 / 공지 고정
- [ ] **팀 업무 항목추가 알림이 과다하게 늘지 않는지** (`handleTeamItemAdded` 는 항목 수 증가에만 반응 — 재조정은 `checklist` 를 안 건드리므로 영향 없어야 한다)
- [ ] 기업상세 **소통내역·「이슈·액션」 탭 배지 숫자 불변** (activity_logs 를 안 건드렸다는 증거)
- [ ] 졸업후보기업 판별 / 기업목록 인라인 편집 / 대시보드 위젯 / 모바일 `/m`
- [ ] `node scripts/audit-select-columns.mjs` 0건
- [ ] `CI=true npx react-scripts build` 통과

### 지문 대조 (코드 변경만으로 데이터가 안 움직였다는 증거)
- `pipeline_cards` 지문(id+stage+stage_changed_at+sync_mode) **배포 전후 동일**
- `team_notes` / `work_notes` / `activity_logs` **행수·`updated_at` 최대값 전후 동일**

---

## 11. 남은 열린 항목 (구현 중 결정)

1. 재동기화 버튼의 **위치** — 기업 타임라인 탭 안 vs 관리 화면
2. 미연결 태그 목록의 **노출 위치** — 스크립트 출력만으로 끝낼지, 화면에 둘지
3. 팀 항목 `created_at` 신설 시, **이월(`confirmTeamCarry`)로 옮겨진 항목의 시각**을
   원본 유지로 볼지 이월 시점으로 볼지 → 일정 항목이 종류·업체·담당자를 옮기는 것과 같은 기준으로 맞출 것
