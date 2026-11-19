// 체크 완료 → 이슈·액션 기록 판정 테스트. App.js 의 ⛳ 체크완료-기록 구간을 소스째 떼어내 실행한다(DB 무접촉).
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const here = path.dirname(fileURLToPath(import.meta.url));
const src = fs.readFileSync(path.join(here, "..", "src", "App.js"), "utf8");
const a = src.indexOf("// ⛳ 체크완료-기록 시작"), b = src.indexOf("// ⛳ 체크완료-기록 끝");
if (a < 0 || b < 0) { console.error("마커를 찾지 못했습니다"); process.exit(1); }
const mod = new Function(src.slice(a, b) +
  "\nreturn { newlyCheckedItemTexts, noteCheckLogEntries, teamNewlyDoneItems, checkItemKey };")();

let pass = 0, fail = 0;
const eq = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (ok) pass++; else { fail++; console.log("❌ " + name + "\n   got : " + JSON.stringify(got) + "\n   want: " + JSON.stringify(want)); }
};
const N = mod.newlyCheckedItemTexts;

// ① 기본: 미완료 → 완료만 잡는다
eq("체크 1건", N("- [ ] @(주)가나 서류 요청\n- [ ] 다른 일", "- [x] @(주)가나 서류 요청\n- [ ] 다른 일"), ["@(주)가나 서류 요청"]);
eq("변화 없음", N("- [x] 끝난 일\n- [ ] 남은 일", "- [x] 끝난 일\n- [ ] 남은 일"), []);
eq("체크 해제는 안 잡는다", N("- [x] 끝난 일", "- [ ] 끝난 일"), []);
eq("원래 완료였던 항목은 안 잡는다", N("- [x] A\n- [ ] B", "- [x] A\n- [x] B"), ["B"]);
eq("대문자 X", N("- [ ] A", "- [X] A"), ["A"]);
// ② 줄 순서가 바뀌거나 줄이 늘어도 글로 견준다
eq("줄 순서 바뀜", N("- [ ] A\n- [ ] B", "- [ ] B\n새 메모\n- [x] A"), ["A"]);
eq("새로 추가된 완료 줄은 '체크'가 아니다", N("- [ ] A", "- [ ] A\n- [x] 새로 적은 완료"), []);
eq("같은 글 2줄 중 1줄만 체크", N("- [ ] A\n- [ ] A", "- [x] A\n- [ ] A"), ["A"]);
eq("같은 글 2줄 모두 체크", N("- [ ] A\n- [ ] A", "- [x] A\n- [x] A"), ["A", "A"]);
// ③ 꼬리표·날짜·줄바꿈
eq("대기사유 꼬리표가 체크하며 사라져도 같은 항목", N("- [ ] A {응답대기:2026-11-01}", "- [x] A"), ["A"]);
eq("날짜 꼬리표는 글에서 뗀다", N("- [ ] A [2026-11-20]", "- [x] A [2026-11-20]"), ["A"]);
eq("리터럴 \\n 은 줄바꿈으로", N("- [ ] A\\nB", "- [x] A\\nB"), ["A\nB"]);
eq("빈 본문", N("", ""), []);
eq("null 본문", N(null, "- [x] A"), []);
eq("체크리스트 아닌 줄은 무시", N("그냥 글", "그냥 글 수정"), []);
// ④ 기록 대상
const cos = [{ id: "c1", name: "(주)가나" }, { id: "c2", name: "다라상사" }, { id: "c3", name: "" }];
const E = mod.noteCheckLogEntries;
eq("이름 감지", E("@(주)가나 서류 요청", null, cos).map(e => [e.company.id, e.memo]), [["c1", "✅ 완료: @(주)가나 서류 요청"]]);
eq("연결 기업 우선 + 중복 제거", E("(주)가나 서류", { id: "c1", name: "(주)가나" }, cos).map(e => [e.company.id, e.memo]), [["c1", "[업무노트] (주)가나 서류 완료"]]);
eq("연결 기업 + 다른 기업 이름", E("다라상사 전화", { id: "c1", name: "(주)가나" }, cos).map(e => e.company.id), ["c1", "c2"]);
eq("해당 없음", E("그냥 할 일", null, cos), []);
eq("기업 목록 없음", E("(주)가나", null, null), []);
// ⑤ 팀 항목
const T = mod.teamNewlyDoneItems;
eq("id 로 찾기", T([{ id: "a", done: false }, { id: "b", done: true }], [{ id: "b", done: true }, { id: "a", done: true }]).map(i => i.id), ["a"]);
eq("id 없으면 위치로", T([{ text: "x" }, { text: "y" }], [{ text: "x", done: true }, { text: "y" }]).map(i => i.text), ["x"]);
eq("되돌리기는 해당 없음", T([{ id: "a", done: true }], [{ id: "a", done: false }]), []);
eq("새로 추가된 완료 항목은 해당 없음", T([], [{ id: "n", done: true }]), []);
eq("결과 메모만 고침", T([{ id: "a", done: true }], [{ id: "a", done: true, result: "ok" }]), []);
eq("목록 아님", T(null, null), []);

// ⑥ 연결 지점 수 — 새 체크 경로를 만들면 여기도 늘려야 한다
const calls = (src.match(/logNoteChecksToActivity\(/g) || []).length - 1;   // 정의 1곳 제외
eq("개인노트 연결 지점 5곳(모바일·내 할일·편집창 자동저장·주간 정리·편집 저장)", calls, 5);
eq("팀 연결 지점 1곳", (src.match(/logTeamDoneToActivity\(/g) || []).length - 1, 1);
eq("업무노트 카드 경로는 기준만 옮긴다", (src.match(/markNoteCheckBase\(noteId, savedContent\)/g) || []).length, 1);

console.log((fail ? "❌ " : "✅ ") + pass + "/" + (pass + fail));
process.exit(fail ? 1 : 0);
