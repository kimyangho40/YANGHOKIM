// 파이프라인 자동화 판정 테스트. App.js 의 ⛳ 파이프라인-자동화 구간을 소스째 떼어내 실행한다(DB 무접촉).
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const here = path.dirname(fileURLToPath(import.meta.url));
const src = fs.readFileSync(path.join(here, "..", "src", "App.js"), "utf8");
const a = src.indexOf("// ⛳ 파이프라인-자동화 시작"), b = src.indexOf("// ⛳ 파이프라인-자동화 끝");
if (a < 0 || b < 0) { console.error("마커를 찾지 못했습니다"); process.exit(1); }
const m = new Function(src.slice(a, b) + "\nreturn { pickCardsToAdvance, allDocsReceived, settlementAdvanceTarget };")();
// STAGES 는 소스에서 그대로 읽는다 — 손으로 옮겨 적지 않는다
const STAGES = JSON.parse(/const STAGES = (\[[^\]]+\]);/.exec(src)[1]);

let pass = 0, fail = 0;
const eq = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (ok) pass++; else { fail++; console.log("❌ " + name + "\n   got : " + JSON.stringify(got) + "\n   want: " + JSON.stringify(want)); }
};
const ids = (rows) => rows.map(r => r.id);
const cards = STAGES.map((s, i) => ({ id: "c" + i, stage: s }));

eq("STAGES 11단계", STAGES.length, 11);
// ① 앞으로만
eq("기관신청대기까지: STEP1·2 만 움직인다", ids(m.pickCardsToAdvance(cards, "기관신청대기/방문예정", STAGES)), ["c0", "c1"]);
eq("입금완료까지: 그 앞 8단계 전부, 부결·기타 제외", ids(m.pickCardsToAdvance(cards, "입금완료/사후관리", STAGES)), ["c0", "c1", "c2", "c3", "c4", "c5", "c6", "c7"]);
eq("수수료대기까지: 입금완료 카드는 뒤로 안 간다", ids(m.pickCardsToAdvance(cards, "수수료대기 및 입금요청", STAGES)).indexOf("c8"), -1);
eq("부결/반려 카드는 안 움직인다", ids(m.pickCardsToAdvance([{ id: "x", stage: "부결/반려" }], "입금완료/사후관리", STAGES)), []);
eq("기타 카드는 안 움직인다", ids(m.pickCardsToAdvance([{ id: "x", stage: "기타" }], "입금완료/사후관리", STAGES)), []);
eq("종결·휴지통 카드 제외", ids(m.pickCardsToAdvance([{ id: "a", stage: STAGES[0], closed_at: "t" }, { id: "b", stage: STAGES[0], deleted_at: "t" }, { id: "c", stage: STAGES[0] }], STAGES[2], STAGES)), ["c"]);
eq("모르는 단계의 카드는 안 건드린다", ids(m.pickCardsToAdvance([{ id: "x", stage: "추가 진행 예정" }], STAGES[2], STAGES)), []);
eq("모르는 목표 단계", m.pickCardsToAdvance(cards, "없는 단계", STAGES), []);
eq("빈 목록", m.pickCardsToAdvance(null, STAGES[2], STAGES), []);
// ② 서류
const DOCS = ["A", "B", "C"];
eq("전부 수령", m.allDocsReceived("A, B, C", DOCS), true);
eq("순서·공백 무관", m.allDocsReceived("C,A ,  B", DOCS), true);
eq("하나 빠짐", m.allDocsReceived("A, B", DOCS), false);
eq("빈 값", m.allDocsReceived("", DOCS), false);
eq("null", m.allDocsReceived(null, DOCS), false);
eq("서류 목록이 비면 false(오발동 방지)", m.allDocsReceived("A", []), false);
// ③ 정산
const T = (p, n) => m.settlementAdvanceTarget(p, n, "INV", "REC");
eq("세금계산서 새로 발행", T({}, { invoice_issued: true }), "INV");
eq("수수료 새로 수령", T({ invoice_issued: true }, { invoice_issued: true, fee_received: true }), "REC");
eq("둘 다 한 번에 → 수령이 우선", T({}, { invoice_issued: true, fee_received: true }), "REC");
eq("이미 켜져 있던 것은 다시 안 민다", T({ invoice_issued: true, fee_received: true }, { invoice_issued: true, fee_received: true }), null);
eq("끄는 저장은 아무 일 없음", T({ fee_received: true }, { fee_received: false }), null);
eq("변화 없음", T({}, {}), null);
eq("prev 없음", T(null, { fee_received: true }), "REC");
// ④ 연결 지점
eq("서류 전진 1곳", (src.match(/advanceCompanyCardsTo\(rest\.id, DOCS_DONE_ADVANCE_STAGE\)/g) || []).length, 1);
eq("정산 전진 1곳", (src.match(/advanceCaseCardTo\(origAuto, moneyTarget\)/g) || []).length, 1);
eq("새 업체 카드 1곳", (src.match(/if \(AUTO_CARD_ON_NEW_COMPANY\)/g) || []).length, 1);

console.log((fail ? "❌ " : "✅ ") + pass + "/" + (pass + fail));
process.exit(fail ? 1 : 0);
