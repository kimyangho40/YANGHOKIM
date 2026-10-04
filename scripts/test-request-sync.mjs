// 📩 업무요청 완료상태 동기화 · 이슈·액션 자동 표시 (2026-10-04)
// 실행: node scripts/test-request-sync.mjs           (합성 시나리오 + 소스 정적 검사)
//       node scripts/test-request-sync.mjs --db      (+ 실제 DB 로 대조. 읽기 전용 SELECT 만)
//
// 왜 이렇게 하나: 판정 규칙을 여기에 옮겨 적으면 그건 코드 검증이 아니라 사본 검증이다.
// src/App.js 의 ⛳ 업무요청-동기화 시작/끝 구간을 소스째 떼어내 실행한다.
// 줄 형태도 손으로 쓰지 않고 App.js 의 buildItemLine·markLinesCarried 로 만든다(실제 저장 형태 그대로).
//
// ⚠️ App.js 의 마커 문구를 바꾸면 이 테스트가 통째로 죽는다.

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

let pass = 0, fail = 0;
const ok = (name, cond, detail = "") => {
  if (cond) { pass++; console.log(`  ✅ ${name}`); }
  else { fail++; console.log(`  ❌ ${name}${detail ? " — " + detail : ""}`); }
};

const src = fs.readFileSync("src/App.js", "utf8");
const cut = (startNeedle, endNeedle, label) => {
  const s = src.indexOf(startNeedle);
  if (s < 0) { console.error(`❌ ${label} 를 App.js 에서 못 찾았다.`); process.exit(1); }
  const e = src.indexOf(endNeedle, s + startNeedle.length);
  if (e < 0) { console.error(`❌ ${label} 끝을 못 찾았다.`); process.exit(1); }
  return src.slice(s, e + endNeedle.length);
};

// ── 떼어내기 ──────────────────────────────────────────────────────────────
const block = cut("// ⛳ 업무요청-동기화 시작", "// ⛳ 업무요청-동기화 끝", "업무요청-동기화 블록");
const R = new Function(block + "\nreturn { parseRequestLines, planRequestSync, planRequestBackfill, pickCompanyRequests, mergeCommEntries, reqNormText };")();
// 실제 저장 형태를 만드는 앱 함수들
const lineDeps =
  cut("function encodeItemText(", "\n}", "encodeItemText") + "\n" +
  cut("var ITEM_WAIT_RE =", "\n", "ITEM_WAIT_RE") +
  cut("function buildItemLine(", "\n}", "buildItemLine") + "\n" +
  cut("var CARRIED_TAIL_RE =", "\n", "CARRIED_TAIL_RE") +
  cut("function markLinesCarried(", "\n}", "markLinesCarried") + "\n" +
  cut("function toggleLineChecked(", "\n}", "toggleLineChecked") + "\n" +
  cut("function markLinesDone(", "\n}", "markLinesDone") + "\n";
const L = new Function(lineDeps + "\nreturn { buildItemLine, markLinesCarried, toggleLineChecked, markLinesDone };")();
console.log(`■ 떼어낸 소스: 동기화 블록 ${block.split("\n").length}줄 · 줄 형태 함수 ${lineDeps.split("\n").length}줄\n`);

// 보내기 경로와 같은 줄: buildItemLine({ checked:false, text: "📩 " + from + " 요청: " + text })
const reqLine = (from, text, extra = {}) => L.buildItemLine(Object.assign({ checked: false, text: "📩 " + from + " 요청: " + text }, extra));
const NOW = "2026-10-04T05:00:00.000Z";
const rq = (id, from, content, status, extra = {}) => Object.assign({ id, request_from: from, content, status, note_id: "N1", done_at: null, created_at: "2026-10-01T00:00:00Z" }, extra);

// ── ① 줄 파싱 ─────────────────────────────────────────────────────────────
console.log("■ 줄 파싱");
{
  const c = [
    "- [ ] 그냥 할일",
    reqLine("양호", "@바른푸드 신보 신청해 주세요"),
    reqLine("관호", "여러 줄\n둘째 줄", { dueDate: "2026-10-10", waitReason: "응답대기", waitSince: "2026-10-02" }),
    "- [x] 📩 동일 요청: 체크된 것",
    "자유 메모 📩 양호 요청: 체크박스 아님",
  ].join("\n");
  const p = R.parseRequestLines(c);
  ok("📩 줄 3개만 잡는다(일반 할일·자유 메모 제외)", p.length === 3, JSON.stringify(p));
  ok("보낸 사람을 읽는다", p.map((x) => x.from).join(",") === "양호,관호,동일");
  ok("리터럴 \\n 을 풀고 공백을 접는다", p[1].text === "여러 줄 둘째 줄", p[1].text);
  ok("마감일·대기사유 꼬리표를 뗀다", p[1].text.indexOf("2026-10-10") < 0 && p[1].text.indexOf("응답대기") < 0);
  ok("체크 상태를 읽는다", p[0].checked === false && p[2].checked === true);
  const carried = L.markLinesCarried(c, new Set([1]), "10/7");
  const pc = R.parseRequestLines(carried);
  ok("이월 꼬리표 붙은 원본 줄은 carried", pc[0].carried === true && pc[0].text === "@바른푸드 신보 신청해 주세요", JSON.stringify(pc[0]));
  const carried2 = L.markLinesCarried(L.markLinesCarried(c, new Set([2]), "10/7"), new Set([2]), "10/9");
  const pc2 = R.parseRequestLines(carried2);
  ok("대기사유 있는 줄을 두 번 이월해도 내용이 같다", pc2[1].carried === true && pc2[1].text === "여러 줄 둘째 줄", JSON.stringify(pc2[1]));
}

// ── ② 체크 → 해제 → 체크 (양방향) ─────────────────────────────────────────
console.log("\n■ 체크·해제 양방향");
{
  let content = ["- [ ] 내 할일", reqLine("양호", "서류 받아주세요")].join("\n");
  let reqs = [rq("r1", "양호", "서류 받아주세요", "read")];
  ok("미체크 + read → 할 일 없음", R.planRequestSync(content, "N1", reqs, NOW).length === 0);
  content = L.toggleLineChecked(content, 1);
  let plan = R.planRequestSync(content, "N1", reqs, NOW);
  ok("체크 → done + done_at 지금", plan.length === 1 && plan[0].patch.status === "done" && plan[0].patch.done_at === NOW && plan[0].prevStatus === "read", JSON.stringify(plan));
  reqs = [Object.assign({}, reqs[0], plan[0].patch)];
  ok("이미 done 이면 다시 체크해도 헛 UPDATE 없음", R.planRequestSync(content, "N1", reqs, NOW).length === 0);
  content = L.toggleLineChecked(content, 1);
  plan = R.planRequestSync(content, "N1", reqs, NOW);
  ok("체크 해제 → read + done_at null", plan.length === 1 && plan[0].patch.status === "read" && plan[0].patch.done_at === null && plan[0].prevStatus === "done", JSON.stringify(plan));
  reqs = [Object.assign({}, reqs[0], plan[0].patch)];
  content = L.toggleLineChecked(content, 1);
  plan = R.planRequestSync(content, "N1", reqs, NOW);
  ok("다시 체크 → done", plan.length === 1 && plan[0].patch.status === "done");
  const pend = [rq("r1", "양호", "서류 받아주세요", "pending")];
  ok("pending 인 채 체크돼도 done (prevStatus=pending)", R.planRequestSync(L.toggleLineChecked(["x", reqLine("양호", "서류 받아주세요")].join("\n"), 1), "N1", pend, NOW)[0].prevStatus === "pending");
  ok("미체크 + pending 은 건드리지 않는다(read 로 올리지 않음)", R.planRequestSync(reqLine("양호", "서류 받아주세요"), "N1", pend, NOW).length === 0);
}

// ── ③ 매칭: 같은 내용 두 건 · 보낸 사람 · 다른 사람 요청 ─────────────────────
console.log("\n■ 매칭");
{
  const content = [L.buildItemLine({ checked: true, text: "📩 양호 요청: 확인" }), reqLine("양호", "확인")].join("\n");
  const reqs = [
    rq("old", "양호", "확인", "read", { note_id: "N0", created_at: "2026-09-01T00:00:00Z" }),
    rq("a", "양호", "확인", "read", { note_id: "N1", created_at: "2026-10-01T00:00:00Z" }),
    rq("b", "양호", "확인", "read", { note_id: "N1", created_at: "2026-10-02T00:00:00Z" }),
  ];
  const plan = R.planRequestSync(content, "N1", reqs, NOW);
  ok("같은 내용 두 줄 → 이 노트(note_id) 요청부터, 먼저 만든 순으로 1:1", plan.length === 1 && plan[0].id === "a", JSON.stringify(plan));
  ok("두 번째(미체크) 줄은 b 에 붙어 b 는 그대로", !plan.some((p) => p.id === "b" || p.id === "old"));
  const other = R.planRequestSync(L.buildItemLine({ checked: true, text: "📩 관호 요청: 확인" }), "N1", reqs, NOW);
  ok("보낸 사람이 다르면 안 붙는다", other.length === 0);
  const fuzzy = R.planRequestSync(L.buildItemLine({ checked: true, text: "📩 양호 요청: " + "가".repeat(70) + " 수정함" }), "N1",
    [rq("f", "양호", "가".repeat(70), "read")], NOW);
  ok("완전일치 없으면 앞 60자 폴백(후보 1건일 때만)", fuzzy.length === 1 && fuzzy[0].id === "f");
  const fuzzyAmb = R.planRequestSync(L.buildItemLine({ checked: true, text: "📩 양호 요청: " + "가".repeat(70) + " 수정함" }), "N1",
    [rq("f1", "양호", "가".repeat(70) + "1", "read"), rq("f2", "양호", "가".repeat(70) + "2", "read")], NOW);
  ok("폴백 후보가 둘 이상이면 아무것도 안 바꾼다", fuzzyAmb.length === 0, JSON.stringify(fuzzyAmb));
  const multi = R.planRequestSync(L.buildItemLine({ checked: true, text: "📩 양호 요청: 첫 줄\n둘째 줄" }), "N1",
    [rq("m", "양호", "첫 줄\r\n둘째 줄", "read")], NOW);
  ok("빠른업무 여러 줄 내용(원문 개행 ↔ 리터럴 \\n) 일치", multi.length === 1 && multi[0].id === "m");
  // 실측(유진 노트 7줄): 받은 사람이 줄 끝에 결과를 덧붙인다
  const appended = R.planRequestSync(L.buildItemLine({ checked: true, text: "📩 양호 요청: @바른푸드 신용보증재단 온라인으로 70,000,000원 신청해 주세요 -> 최대 신청 5천만원만 있어서 신청 완료" }), "N1",
    [rq("ap", "양호", "@바른푸드 신용보증재단 온라인으로 70,000,000원 신청해 주세요", "read")], NOW);
  ok("결과를 덧붙인 줄(요청 내용 + ' -> …')도 그 요청으로 본다", appended.length === 1 && appended[0].id === "ap");
  const boundary = R.planRequestSync(L.buildItemLine({ checked: true, text: "📩 양호 요청: 확인서 받기" }), "N1", [rq("bd", "양호", "확인", "read")], NOW);
  ok("단어 경계 — '확인' 요청이 '확인서 받기' 줄에 붙지 않는다", boundary.length === 0, JSON.stringify(boundary));
  const longest = R.planRequestSync(L.buildItemLine({ checked: true, text: "📩 양호 요청: 서류 확인 부탁 -> 완료" }), "N1",
    [rq("s1", "양호", "서류", "read"), rq("s2", "양호", "서류 확인 부탁", "read")], NOW);
  ok("덧붙인 줄에 후보가 여럿이면 가장 긴 요청 내용", longest.length === 1 && longest[0].id === "s2", JSON.stringify(longest));
}

// ── ④ 이월: 원본은 건너뛰고 사본이 상태를 든다 · 주간정리 일괄완료 ─────────────
console.log("\n■ 이월 · 일괄완료");
{
  const orig = L.markLinesCarried(reqLine("양호", "방문 일정 잡기"), new Set([0]), "10/7");
  const reqs = [rq("c", "양호", "방문 일정 잡기", "done", { done_at: "2026-10-03T00:00:00Z" })];
  ok("이월 원본(미체크)을 저장해도 done 을 되돌리지 않는다", R.planRequestSync(orig, "N1", reqs, NOW).length === 0);
  const copy = L.buildItemLine({ checked: true, text: "📩 양호 요청: 방문 일정 잡기" });
  const plan = R.planRequestSync(copy, "N2", [rq("c", "양호", "방문 일정 잡기", "read")], NOW);
  ok("다른 날짜 노트(사본)에서 체크 → note_id 가 달라도 done", plan.length === 1 && plan[0].id === "c");
  const bulk = L.markLinesDone([reqLine("양호", "가"), reqLine("양호", "나")].join("\n"), new Set([0, 1]));
  const pb = R.planRequestSync(bulk, "N1", [rq("x", "양호", "가", "read"), rq("y", "양호", "나", "pending")], NOW);
  ok("주간정리 일괄완료(markLinesDone) → 둘 다 done", pb.length === 2 && pb.every((p) => p.patch.status === "done"));
  const removed = R.planRequestSync("- [ ] 다른 일", "N1", [rq("z", "양호", "지운 줄", "done", { done_at: NOW })], NOW);
  ok("줄을 지우면 상태를 건드리지 않는다", removed.length === 0);
}

// ── ⑤ 과거분 보정 계획 ──────────────────────────────────────────────────────
console.log("\n■ 과거분 보정(planRequestBackfill)");
{
  const reqs = [
    Object.assign(rq("p1", "양호", "A", "read"), { request_to: "관호" }),
    Object.assign(rq("p2", "양호", "B", "done", { done_at: "2026-09-01T00:00:00Z" }), { request_to: "관호" }),
    Object.assign(rq("p3", "양호", "C", "read"), { request_to: "관호" }),
    Object.assign(rq("p4", "양호", "D", "read"), { request_to: "유진" }),
  ];
  const notes = [
    { id: "N1", assignee: "관호", note_date: "2026-09-01", content: [L.markLinesCarried(reqLine("양호", "A"), new Set([0]), "9/2"), reqLine("양호", "B")].join("\n") },
    { id: "N2", assignee: "관호", note_date: "2026-09-02", content: L.buildItemLine({ checked: true, text: "📩 양호 요청: A" }) },
    { id: "N3", assignee: "유진", note_date: "2026-09-02", content: L.buildItemLine({ checked: true, text: "📩 양호 요청: A" }) },
  ];
  const plan = R.planRequestBackfill(notes, reqs);
  const by = Object.fromEntries(plan.map((p) => [p.id, p]));
  ok("이월 사슬 끝(사본 체크) → p1 done, done_at 은 비움(지어내지 않음)", by.p1 && by.p1.patch.status === "done" && by.p1.patch.done_at === null, JSON.stringify(by.p1));
  ok("체크 해제 상태로 남은 p2 → read", by.p2 && by.p2.patch.status === "read" && by.p2.prevStatus === "done");
  ok("노트에 줄이 없는 p3 → 그대로", !by.p3);
  ok("다른 사람(유진) 노트의 같은 문구는 p4 와 무관(보낸 내용이 다름)", !by.p4);
  ok("계획은 바뀌는 건만", plan.length === 2, JSON.stringify(plan));
}

// ── ⑥ 이슈·액션 표시 ────────────────────────────────────────────────────────
console.log("\n■ 이슈·액션 표시");
{
  const CO = "co1";
  const tagged = (t) => (t.indexOf("@바른푸드") >= 0 ? [CO] : []);
  const rows = [
    { id: "1", company_id: CO, content: "x", created_at: "2026-10-01" },
    { id: "1", company_id: CO, content: "x", created_at: "2026-10-01" },          // 두 조회에 같이 걸린 행
    { id: "2", company_id: null, content: "@바른푸드 신청", created_at: "2026-10-02" },
    { id: "3", company_id: null, content: "abc@바른푸드.com", created_at: "2026-10-03" }, // 판정 함수가 거른다
    { id: "4", company_id: "other", content: "y", created_at: "2026-10-04", note_id: "N", request_to: "관호" },
    { id: "5", company_id: CO, content: "z", created_at: "2026-10-05", note_id: "N", request_to: "관호" },
    { id: "6", company_id: CO, content: "w", created_at: "2026-10-06", note_id: "N", request_to: "관호" },
  ];
  const picked = R.pickCompanyRequests(rows, CO, (t) => (t.indexOf("abc@") >= 0 ? [] : tagged(t)));
  ok("company_id 또는 @태그로 이 기업만 · 요청 id 로 중복 제거", picked.map((r) => r.id).join(",") === "1,2,5,6", picked.map((r) => r.id).join(","));
  ok("같은 노트·같은 받는 사람이어도 빠른업무 항목은 각각 보인다(5·6)", picked.some((r) => r.id === "5") && picked.some((r) => r.id === "6"));
  const merged = R.mergeCommEntries(
    [{ id: "L1", created_at: "2026-10-03T00:00:00Z" }, { id: "L2", created_at: "2026-09-30T00:00:00Z" }],
    [{ id: "Q1", created_at: "2026-10-01T00:00:00Z" }]);
  ok("사람 기록과 자동 행을 최신순으로 합친다", merged.map((e) => (e.log || e.req).id).join(",") === "L1,Q1,L2");
}

// ── ⑦ 소스 정적 검사 — 연결 지점 · 쓰기 금지 ──────────────────────────────────
console.log("\n■ 소스 정적 검사");
{
  const calls = (src.match(/syncRequestsFromNote\(Object\.assign/g) || []).length;
  ok("syncRequestsFromNote 호출 6곳(모바일·내 할일·편집창 자동저장·편집창 저장·카드 체크·주간정리)", calls === 6, "실제 " + calls);
  ok("옛 syncRequestDone 함수 정의가 사라졌다", !/var syncRequestDone\s*=/.test(src));
  const blockCode = block.split("\n").filter((l) => !/^\s*\/\//.test(l)).join("\n"); // 주석 줄은 빼고 본다
  ok("동기화 블록은 supabase·React 를 참조하지 않는다", !/supabase|useState|useEffect/.test(blockCode));
  const wrapper = cut("async function syncRequestsFromNote(", "\n}", "syncRequestsFromNote");
  ok("동기화가 쓰는 테이블은 work_requests 뿐", !/from\("(?!work_requests)/.test(wrapper) && /from\("work_requests"\)\.update/.test(wrapper));
  ok("activity_logs 에 쓰지 않는다(래퍼)", wrapper.indexOf("activity_logs") < 0);
  const modalLoad = cut("// 📩 이 기업에 걸린 업무요청 — company_id 로 1번", "}, [company.id, company.name]);", "CompanyModal 요청 조회");
  ok("기업상세 요청 조회는 select 만(쓰기 0)", !/\.(insert|update|delete|upsert)\(/.test(modalLoad));
  ok("기업상세 요청 조회는 이 기업 조건(company_id·@태그)만 — 전체 조회 아님", (modalLoad.match(/\.eq\("company_id", company\.id\)/g) || []).length === 1 && /\.ilike\("content", "%@" \+ company\.name/.test(modalLoad));
  ok("탭 배지는 여전히 사람 기록 수(commLogs.length)", /label: "이슈·액션", badge: commLogs\.length/.test(src));
}

// ── ⑧ 실제 DB 대조 (--db) ─────────────────────────────────────────────────
if (process.argv.includes("--db")) {
  console.log("\n■ 실제 DB 대조 (읽기 전용)");
  const runSql = (sql) => {
    const tmp = path.join(os.tmpdir(), "req-sync-" + process.pid + ".sql");
    fs.writeFileSync(tmp, sql, "utf8");
    try {
      const raw = execFileSync("node", ["scripts/run-sql.js", tmp], { encoding: "utf8", maxBuffer: 256 * 1024 * 1024 });
      return JSON.parse(raw.slice(raw.indexOf("[")));
    } finally { try { fs.unlinkSync(tmp); } catch (_) {} }
  };
  const [{ p }] = runSql(`select json_build_object(
    'reqs', (select coalesce(json_agg(r),'[]'::json) from (select id,request_from,request_to,content,status,done_at,note_id,created_at from public.work_requests) r),
    'notes', (select coalesce(json_agg(n),'[]'::json) from (select id,assignee,note_date,created_at,content from public.work_notes
                where deleted_at is null and assignee in (select distinct request_to from public.work_requests)) n)
  ) p;`);
  const reqs = p.reqs, notes = p.notes;
  let lines = 0, matched = 0, unmatched = [];
  const claimedAll = {};
  notes.forEach((n) => {
    R.parseRequestLines(n.content).forEach((ln) => {
      if (ln.carried) return;
      lines++;
      const mine = reqs.filter((r) => { const c = R.reqNormText(r.content);
        return r.request_to === n.assignee && r.request_from === ln.from && (c === ln.text || ln.text.indexOf(c + " ") === 0); });
      if (mine.length) { matched++; mine.forEach((r) => { claimedAll[r.id] = 1; }); }
      else unmatched.push(n.assignee + " · " + ln.from + " · " + ln.text.slice(0, 40));
    });
  });
  console.log(`    요청 ${reqs.length}건 · 받는 사람 노트 ${notes.length}장 · 살아있는 📩 줄 ${lines}개 (일치 ${matched})`);
  ok("살아있는 📩 줄은 전부 요청과 맞춰진다", unmatched.length === 0, unmatched.length + "줄 남음");
  if (unmatched.length) console.log("    완전일치 안 되는 줄(폴백 대상 또는 손으로 고친 줄):\n      " + unmatched.slice(0, 15).join("\n      "));
  const plan = R.planRequestBackfill(notes, reqs);
  ok("보정 계획 계산이 예외 없이 끝난다", Array.isArray(plan));
  ok("보정 계획은 상태만 바꾼다(status/done_at)", plan.every((x) => Object.keys(x.patch).sort().join(",") === "done_at,status"));
  console.log(`    보정 대상 ${plan.length}건: ` + plan.map((x) => x.prevStatus + "→" + x.patch.status).join(", "));
  const unseen = reqs.filter((r) => !claimedAll[r.id]).length;
  console.log(`    노트에서 줄을 못 찾은 요청 ${unseen}건 → 보정하지 않음(그대로 둔다)`);
}

console.log(`\n결과: ${pass} 통과 / ${fail} 실패`);
process.exit(fail ? 1 : 0);
