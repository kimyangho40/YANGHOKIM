// 기관현황 비고 메모 → 팀 일정 → 대시보드 판정 테스트. App.js 의 ⛳ 기관메모-일정 구간을 소스째 떼어내 실행한다(DB 무접촉).
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const here = path.dirname(fileURLToPath(import.meta.url));
const src = fs.readFileSync(path.join(here, "..", "src", "App.js"), "utf8");
const a = src.indexOf("// ⛳ 기관메모-일정 시작"), b = src.indexOf("// ⛳ 기관메모-일정 끝");
if (a < 0 || b < 0) { console.error("마커를 찾지 못했습니다"); process.exit(1); }
const m = new Function(src.slice(a, b) +
  "\nreturn { memoSchedKind, ymdAddDays, memoSchedDate, memoSchedText, buildMemoSchedItem, findMemoSchedItem, dashMemoSchedRows, memoTodoText, memoTodoKey, findMemoSchedByTodo };")();

let pass = 0, fail = 0;
const eq = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (ok) pass++; else { fail++; console.log("❌ " + name + "\n   got : " + JSON.stringify(got) + "\n   want: " + JSON.stringify(want)); }
};

// ① 키워드
eq("실태조사", m.memoSchedKind("11/25 실태조사 예정"), "실태조사");
eq("실사", m.memoSchedKind("다음 주 실사"), "실태조사");
eq("방문", m.memoSchedKind("지점 방문 상담"), "기관방문");
eq("약정", m.memoSchedKind("약정 일정 잡기"), "약정");
eq("약정이 다른 단어와 같이 있으면 약정(3일 뒤 규칙 우선)", m.memoSchedKind("방문해서 약정"), "약정");
eq("키워드 없음", m.memoSchedKind("서류 보완 요청"), null);
eq("빈 값", m.memoSchedKind(null), null);
// ② 날짜
eq("약정은 3일 뒤", m.memoSchedDate("약정", "2026-11-19"), "2026-11-22");
eq("그 외는 당일", m.memoSchedDate("실태조사", "2026-11-19"), "2026-11-19");
eq("월 넘김", m.ymdAddDays("2026-11-29", 3), "2026-12-02");
eq("해 넘김", m.ymdAddDays("2026-12-30", 3), "2027-01-02");
// ③ 항목
const it = m.buildMemoSchedItem({ id: "case1", business_name: " (주)가나 ", company_id: "c1", assignee: "유진, 관호", agency_group: "소상공인시장진흥공단" }, "11/25 실태조사\n준비물 안내", "실태조사", "2026-11-19T00:00:00.000Z", "ck_x");
eq("text 는 반드시 채운다", it.text, "실태조사 · (주)가나 — 11/25 실태조사 준비물 안내");
eq("일정 항목 필드", [it.is_sched, it.sched_kind, it.done, it.src, it.case_id, it.company_id, it.company_name, it.assignee], [true, "실태조사", false, "agency_memo", "case1", "c1", "(주)가나", "유진"]);
eq("가져가기 필드는 비운다", [it.taken_by, it.taken_at], [null, null]);
eq("긴 메모는 text 에서 줄인다", m.memoSchedText("약정", "A", "가".repeat(200)).length < 140, true);
// ④ 기존 항목 찾기
const notes = [
  { id: "n1", work_date: "2026-11-18", checklist: [{ id: "a", src: "agency_memo", case_id: "case1", done: true }, { id: "b", text: "일반" }] },
  { id: "n2", work_date: "2026-11-19", checklist: [{ id: "c", src: "agency_memo", case_id: "case1", done: false }] },
  { id: "n3", work_date: "2026-11-19", deleted_at: "x", checklist: [{ id: "d", src: "agency_memo", case_id: "case2", done: false }] },
];
eq("완료된 항목은 건너뛰고 미완료를 찾는다", (function() { var h = m.findMemoSchedItem(notes, "case1"); return h && [h.note.id, h.idx]; })(), ["n2", 0]);
eq("삭제된 카드는 안 본다", m.findMemoSchedItem(notes, "case2"), null);
eq("없는 건", m.findMemoSchedItem(notes, "zzz"), null);
// ⑤ 대시보드 — 최근 7일 · 미래 날짜(약정 3일 뒤)는 아직 안 보임 · 일반 항목 제외
const dn = [
  { id: "t0", work_date: "2026-11-19", checklist: [{ id: "1", src: "agency_memo", done: false }, { id: "2", text: "일반 항목" }, { id: "3", is_sched: true, done: false }] },
  { id: "t1", work_date: "2026-11-13", checklist: [{ id: "4", src: "agency_memo", done: true }] },
  { id: "t2", work_date: "2026-11-12", checklist: [{ id: "5", src: "agency_memo", done: false }] },
  { id: "t3", work_date: "2026-11-22", checklist: [{ id: "6", src: "agency_memo", done: false }] },
  { id: "t4", work_date: "2026-11-18", deleted_at: "x", checklist: [{ id: "7", src: "agency_memo", done: false }] },
  { id: "t5", work_date: "2026-11-15", checklist: [{ id: "8", src: "agency_memo", done: false }] },
];
const d = m.dashMemoSchedRows(dn, "2026-11-19");
eq("진행: 7일 안 · 최신 먼저", d.open.map(r => r.item.id), ["1", "8"]);
eq("완료: 7일 경계(오늘-6) 포함", d.done.map(r => r.item.id), ["4"]);
eq("3일 뒤가 되면 약정 항목이 보인다(11/19 항목도 아직 7일 안)", m.dashMemoSchedRows(dn, "2026-11-22").open.map(r => r.item.id), ["6", "1"]);
eq("빈 입력", m.dashMemoSchedRows(null, "2026-11-19"), { open: [], done: [] });
// ⑥ 연결 지점 — 비고 저장 경로 2곳
eq("연결 지점 2곳(saveCaseMemo·saveEdit)", (src.match(/syncMemoScheduleFromCase\(/g) || []).length - 1, 2);

// ⑦ 담당자 업무노트 줄 ↔ 일정 항목
const tt = m.memoTodoText("실태조사", "(주)가나", "11/21 실태조사\n준비물 안내");
eq("업무노트 줄 글", tt, "📌 @(주)가나 [실태조사] 11/21 실태조사 준비물 안내");
eq("업체명 없으면 태그 생략", m.memoTodoText("약정", "", "약정 잡기"), "📌 [약정] 약정 잡기");
eq("열쇠: 대기사유·날짜 꼬리표·공백 무시", m.memoTodoKey("📌  @A [방문]  메모 [2026-11-20] {응답대기:2026-11-19}"), m.memoTodoKey("📌 @A [방문] 메모"));
const tn = [
  { id: "x1", checklist: [{ id: "a", src: "agency_memo", done: true, wn_text: tt }, { id: "b", src: "agency_memo", done: false, wn_text: tt }] },
  { id: "x2", checklist: [{ id: "c", src: "agency_memo", done: false, wn_text: "📌 @다른 [방문] 메모" }, { id: "d", src: "agency_memo", done: false }] },
];
eq("체크한 줄과 같은 미완료 일정을 찾는다", (function() { var h = m.findMemoSchedByTodo(tn, tt); return h && [h.note.id, h.idx]; })(), ["x1", 1]);
eq("📌 로 시작하지 않는 줄은 안 본다", m.findMemoSchedByTodo(tn, "@(주)가나 [실태조사] 11/21 실태조사 준비물 안내"), null);
eq("해당 없는 줄", m.findMemoSchedByTodo(tn, "📌 @없는 [방문] x"), null);
eq("체크 훅 연결 2곳(공용 경로·업무노트 카드)", (src.match(/completeMemoSchedByTodo\(/g) || []).length - 1, 2);

console.log((fail ? "❌ " : "✅ ") + pass + "/" + (pass + fail));
process.exit(fail ? 1 : 0);
