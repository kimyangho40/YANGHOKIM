// 업무노트 @기업 태그 → 타임라인 링크 검증 (2026-08-31)
//
// ⚠️ App.js 소스를 **떼어내 그대로 실행**한다 — 손으로 옮겨 적으면 코드 검증이 아니다.
//    (test-nocard.mjs · test-debtor-change.mjs · test-amount-unit.mjs 와 같은 방식)
// ⚠️ DB 를 읽지 않는다. 순수 함수만 검증하므로 토큰이 필요 없다.
//
// 사용법: node scripts/test-note-links.mjs
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = fs.readFileSync(path.join(ROOT, "src/App.js"), "utf8");

function cut(startNeedle, endNeedle, label) {
  const s = src.indexOf(startNeedle);
  if (s < 0) { console.error(`❌ ${label} 시작을 App.js 에서 못 찾았습니다: ${startNeedle}`); process.exit(1); }
  const e = src.indexOf(endNeedle, s + startNeedle.length);
  if (e < 0) { console.error(`❌ ${label} 끝을 못 찾았습니다: ${JSON.stringify(endNeedle)}`); process.exit(1); }
  return src.slice(s, e + endNeedle.length);
}

// note-link 블록 + 그 블록이 쓰는 헬퍼 3개를 떼어낸다
const deps =
  cut("var ITEM_WAIT_RE =", "\n", "ITEM_WAIT_RE") +
  cut("function splitItemWait(", "\n}", "splitItemWait") + "\n" +
  cut("function decodeItemText(", "\n}", "decodeItemText") + "\n";
const block = cut("// ── note-link BEGIN ──", "// ── note-link END ──", "note-link 블록");
console.log(`── App.js 에서 떼어낸 소스 ${(deps + block).trim().split("\n").length}줄 ──`);

// ⚠️ reconcileNoteLinks 는 supabase 를 쓴다 → 가짜를 주입해 **판단만** 검증한다(DB 접속 없음).
const api = new Function("supabase", deps + "\n" + block +
  "\nreturn { taggedCompanyRefs, workLineDisplayText, noteLinkAt, noteLinkRows, reconcileNoteLinks };");
const { taggedCompanyRefs, workLineDisplayText, noteLinkAt, noteLinkRows } = api(null);

// 실제 DB 에 있는 이름들로 짰다(과매칭·경계 케이스를 실물로 재현하기 위해)
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

console.log("\n① 기본 매칭");
check("단순 태그", ids("@(주)로컬 자료 전달") === "c2", ids("@(주)로컬 자료 전달"));
check("줄 끝 태그", ids("오늘 @(주)로컬") === "c2", ids("오늘 @(주)로컬"));
check("태그 없음(@ 가 아예 없다)", ids("로컬 자료 전달") === "", ids("로컬 자료 전달"));

console.log("\n② 이메일은 태그가 아니다 (@ 앞 경계)");
check("이메일 배제", ids("basegilt@gmail.com 으로 보냄") === "", ids("basegilt@gmail.com 으로 보냄"));
check("메일+태그 혼재", ids("a@naver.com 과 @(주)로컬") === "c2", ids("a@naver.com 과 @(주)로컬"));

console.log("\n③ 접두 과매칭 금지 (긴 이름 우선 + 구간 소비)");
check("긴 이름만 잡는다", ids("@(주)로컬푸드 확인") === "c3", ids("@(주)로컬푸드 확인"));

console.log("\n④ 여러 기업 + 중복 제거");
check("여러 기업", ids("@(주)로컬 그리고 @(주)애슐런컴퍼니") === "c2,c5", ids("@(주)로컬 그리고 @(주)애슐런컴퍼니"));
check("같은 기업 두 번 → 1건", ids("@(주)로컬 …  @(주)로컬") === "c2", ids("@(주)로컬 …  @(주)로컬"));

console.log("\n⑤ 줄바꿈 뒤 태그");
check("줄바꿈 뒤 태그", ids("@(주)애슐런컴퍼니\n@농업회사법인 해광알앤에프") === "c5,c4",
  ids("@(주)애슐런컴퍼니\n@농업회사법인 해광알앤에프"));

console.log("\n⑥ workLineDisplayText — 마커·대기사유 제거 + 리터럴 \\n 디코드");
check("마커 제거", workLineDisplayText("- [x] @(주)로컬 전달") === "@(주)로컬 전달",
  JSON.stringify(workLineDisplayText("- [x] @(주)로컬 전달")));
check("대기사유 제거", workLineDisplayText("- [ ] @(주)로컬 전달 {응답대기:2026-08-01}") === "@(주)로컬 전달",
  JSON.stringify(workLineDisplayText("- [ ] @(주)로컬 전달 {응답대기:2026-08-01}")));
check("리터럴 \\n 디코드",
  workLineDisplayText("- [x] @(주)애슐런컴퍼니  \\n@농업회사법인 해광알앤에프 ").indexOf("\n@농업회사법인") >= 0,
  JSON.stringify(workLineDisplayText("- [x] @(주)애슐런컴퍼니  \\n@농업회사법인 해광알앤에프 ")));
check("일반 글줄은 그대로", workLineDisplayText("메모 한 줄") === "메모 한 줄", workLineDisplayText("메모 한 줄"));

console.log("\n⑦ 🔴 회귀 방지 — 디코드 안 하면 놓치던 그 케이스 (실측 5건)");
const raw = "- [x] @(주)애슐런컴퍼니  \\n@농업회사법인 해광알앤에프 \\n\\n- basegilt@gmail.com";
check("리터럴 \\n 뒤 태그도 잡는다", ids(workLineDisplayText(raw)) === "c5,c4", ids(workLineDisplayText(raw)));
check("디코드 안 하면 놓친다(대조군)", ids(raw) === "c5", ids(raw));

console.log("\n⑧ noteLinkAt — 업무 날짜 09:00 KST == 그날 자정 UTC");
check("날짜 → 자정 UTC", noteLinkAt("2026-08-31", "2026-08-30T10:03:05Z") === "2026-08-31T00:00:00.000Z",
  noteLinkAt("2026-08-31", "2026-08-30T10:03:05Z"));
const kstHour = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Seoul", hour: "numeric", hour12: false })
  .format(new Date(noteLinkAt("2026-08-31", null)));
check("09:00 KST 확인", Number(kstHour) === 9, "KST " + kstHour + "시");
check("날짜 없으면 폴백", noteLinkAt(null, "2026-08-30T10:03:05Z") === "2026-08-30T10:03:05.000Z",
  noteLinkAt(null, "2026-08-30T10:03:05Z"));

console.log("\n⑨ noteLinkRows — 팀 체크리스트");
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
check("팀 item.created_at 이 우선", tRows.filter(r => r.item_key === "i3").every(r => r.at === "2026-08-31T05:00:00.000Z"),
  JSON.stringify(tRows.filter(r => r.item_key === "i3").map(r => r.at)));
check("팀 여러 기업 → 각각 1행", tRows.filter(r => r.item_key === "i3").length === 2,
  String(tRows.filter(r => r.item_key === "i3").length));
check("팀 author = posted_by", tRows.every(r => r.author === "관호"), JSON.stringify(tRows.map(r => r.author)));
check("팀 item_text 는 원문 그대로(디코드 안 함)", tRows[0].item_text.indexOf("@주식회사 임팩트레이드") === 0, tRows[0].item_text);

console.log("\n⑩ noteLinkRows — 개인 노트");
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
check("id 없는 노트는 0행", noteLinkRows("work_line", { content: "@(주)로컬" }, CO).length === 0, "");

// ⑪ reconcileNoteLinks — 가짜 supabase 를 주입해 **어떤 쓰기를 결정하는지**만 본다.
//    DB 에 접속하지 않는다. 체인(from→select/insert/update→eq/is/in)을 그대로 흉내 낸다.
console.log("\n⑪ reconcileNoteLinks — insert/update/soft delete 판단");

function stubSupabase(existingRows, opts) {
  var o = opts || {};
  var log = [];
  return {
    log: log,
    from: function() {
      var st = { op: null, payload: null, filters: {} };
      var chain = {
        select: function() { st.op = "select"; return chain; },
        insert: function(rows) { st.op = "insert"; st.payload = rows; log.push(st); return chain; },
        update: function(obj) { st.op = "update"; st.payload = obj; log.push(st); return chain; },
        eq: function(k, v) { st.filters[k] = v; return chain; },
        is: function(k, v) { st.filters[k] = v; return chain; },
        in: function(k, v) { st.filters[k] = v; return chain; },
        then: function(res, rej) {
          var out = st.op === "select"
            ? (o.selectError ? { data: null, error: { message: "boom" } } : { data: existingRows, error: null })
            : { data: null, error: null };
          return Promise.resolve(out).then(res, rej);
        },
      };
      return chain;
    },
  };
}
// 링크가 붙어야 하는 팀 카드 하나 — 항목 i1 에 @(주)로컬
const RNote = { id: "n9", work_date: "2026-08-31", posted_by: "관호",
  checklist: [{ id: "i1", text: "@(주)로컬 자료 전달" }] };
const AT = "2026-08-31T00:00:00.000Z";
const existingRow = { id: "L1", item_key: "i1", company_id: "c2", item_text: "@(주)로컬 자료 전달", at: AT };

async function reconcileWith(note, existingRows, opts) {
  const db = stubSupabase(existingRows, opts);
  const res = await api(db).reconcileNoteLinks("team_item", note, CO);
  return { res: res, writes: db.log };
}

const R = {};
R.a = await reconcileWith(RNote, []);                                   // 새 태그
R.b = await reconcileWith(RNote, [existingRow]);                        // 이미 같은 것이 있음
R.c = await reconcileWith(RNote, [Object.assign({}, existingRow, { item_text: "옛 문구" })]);
R.d = await reconcileWith(RNote, [Object.assign({}, existingRow, { at: "2026-08-01T00:00:00.000Z" })]);
R.e = await reconcileWith(Object.assign({}, RNote, { checklist: [{ id: "i1", text: "태그를 지웠다" }] }), [existingRow]);
R.f = await reconcileWith(Object.assign({}, RNote, { checklist: [{ id: "i1", text: "@(주)애슐런컴퍼니 로 바꿈" }] }), [existingRow]);
R.g = await reconcileWith(Object.assign({}, RNote, { deleted_at: "2026-09-01T00:00:00Z" }), [existingRow]);
R.h = await reconcileWith(RNote, [], { selectError: true });
R.i = await reconcileWith({ id: "n9", work_date: "2026-08-31", posted_by: "관호",
  checklist: [{ id: "i1", text: "@(주)로컬 자료 전달" }, { id: "i1", text: "@(주)로컬 중복 키" }] }, []);

const cnt = (x) => x.res.inserted + "/" + x.res.updated + "/" + x.res.removed;
const writeOps = (x) => x.writes.map(w => w.op).join(",");

check("새 태그 → insert 1건만", cnt(R.a) === "1/0/0" && writeOps(R.a) === "insert", cnt(R.a) + " " + writeOps(R.a));
check("insert 페이로드가 원하는 행 그대로",
  R.a.writes[0].payload.length === 1 && R.a.writes[0].payload[0].company_id === "c2"
  && R.a.writes[0].payload[0].item_key === "i1" && R.a.writes[0].payload[0].at === AT,
  JSON.stringify(R.a.writes[0].payload));
check("변화 없으면 쓰기 0건", cnt(R.b) === "0/0/0" && R.b.writes.length === 0, cnt(R.b) + " writes=" + R.b.writes.length);
check("문구가 바뀌면 update", cnt(R.c) === "0/1/0" && writeOps(R.c) === "update", cnt(R.c) + " " + writeOps(R.c));
check("update 는 id 로 1행만", R.c.writes[0].filters.id === "L1"
  && R.c.writes[0].payload.item_text === "@(주)로컬 자료 전달", JSON.stringify(R.c.writes[0]));
check("시각이 바뀌면 update", cnt(R.d) === "0/1/0", cnt(R.d));
check("태그가 사라지면 soft delete", cnt(R.e) === "0/0/1" && writeOps(R.e) === "update", cnt(R.e) + " " + writeOps(R.e));
check("soft delete 는 deleted_at 을 채운다(하드 삭제 아님)",
  !!R.e.writes[0].payload.deleted_at && Array.isArray(R.e.writes[0].filters.id)
  && R.e.writes[0].filters.id[0] === "L1", JSON.stringify(R.e.writes[0]));
check("태그를 바꾸면 새로 넣고 옛것은 지운다", cnt(R.f) === "1/0/1" && writeOps(R.f) === "insert,update",
  cnt(R.f) + " " + writeOps(R.f));
check("삭제된 노트는 링크를 전부 정리", cnt(R.g) === "0/0/1", cnt(R.g));
check("조회 실패하면 아무것도 쓰지 않는다", R.h.res.ok === false && R.h.writes.length === 0,
  JSON.stringify(R.h.res) + " writes=" + R.h.writes.length);
check("같은 키가 두 번 나와도 1행만 넣는다(유니크 방어)", cnt(R.i) === "1/0/0", cnt(R.i));

console.log(`\n결과: ${pass}/${pass + fail} 통과`);
process.exit(fail ? 1 : 0);
