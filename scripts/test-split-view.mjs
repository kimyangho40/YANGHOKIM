// 분할 보기 테스트. App.js 의 ⛳ 분할-계산 구간을 소스째 떼어내 실행한다(DB·화면 무접촉).
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const here = path.dirname(fileURLToPath(import.meta.url));
const src = fs.readFileSync(path.join(here, "..", "src/App.js"), "utf8");
const i = src.indexOf("// ⛳ 분할-계산 시작"), j = src.indexOf("// ⛳ 분할-계산 끝");
if (i < 0 || j < 0) { console.error("마커를 찾지 못했습니다"); process.exit(1); }
const A = new Function(src.slice(i, j) + "\nreturn { SPLIT_MSG, SPLIT_RATIO_MIN, SPLIT_RATIO_MAX, SPLIT_EXTRA_LABELS, splitClampRatio, splitPaneSrc, splitViewLabel, splitMsgOk };")();

let pass = 0, fail = 0;
const eq = (name, got, want) => {
  if (JSON.stringify(got) === JSON.stringify(want)) pass++;
  else { fail++; console.log("❌ " + name + "\n   got : " + JSON.stringify(got) + "\n   want: " + JSON.stringify(want)); }
};
const ok = (name, cond) => eq(name, !!cond, true);

// ① 칸 폭 비율 — 한쪽이 사라질 만큼 좁아지지 않는다
eq("가운데", A.splitClampRatio(50), 50);
eq("너무 좁게", A.splitClampRatio(3), A.SPLIT_RATIO_MIN);
eq("너무 넓게", A.splitClampRatio(99), A.SPLIT_RATIO_MAX);
eq("소수 한 자리", A.splitClampRatio(41.26), 41.3);
eq("저장값이 깨졌을 때", A.splitClampRatio("abc"), 50);
eq("저장값이 글자 숫자", A.splitClampRatio("60"), 60);

// ② 칸 주소 — embed=1 은 항상 붙는다
eq("고르는 화면", A.splitPaneSrc("https://x/app", "blank"), "https://x/app?embed=1");
eq("값 없음", A.splitPaneSrc("https://x/app", undefined), "https://x/app?embed=1");
eq("보던 화면으로 시작", A.splitPaneSrc("https://x/app", "agency"), "https://x/app?embed=1&view=agency");
eq("이름에 기호", A.splitPaneSrc("https://x/app", "company-map"), "https://x/app?embed=1&view=company-map");

// ③ 화면 이름
const menus = [{ id: "list", label: "기업 목록" }];
eq("칸 메뉴에 있는 화면", A.splitViewLabel("list", menus), "기업 목록");
eq("왼쪽 메뉴에만 있는 화면", A.splitViewLabel("dbleads", menus), "DB리스트");
eq("모르는 화면", A.splitViewLabel("nope", menus), "");

// ④ 메시지 검사 — 같은 출처 + 꼬리표
const o = "https://crm.example";
ok("정상", A.splitMsgOk({ origin: o, data: { t: A.SPLIT_MSG, view: "list" } }, o));
ok("다른 출처는 버린다", !A.splitMsgOk({ origin: "https://evil.example", data: { t: A.SPLIT_MSG, view: "list" } }, o));
ok("꼬리표 없는 것은 버린다", !A.splitMsgOk({ origin: o, data: { view: "list" } }, o));
ok("빈 메시지", !A.splitMsgOk({ origin: o, data: null }, o));
ok("문자열 메시지", !A.splitMsgOk({ origin: o, data: "hi" }, o));

// ⑤ 왼쪽 메뉴의 모든 화면이 칸 제목을 갖는다(사이드바 메뉴 정의와 짝)
const embedIds = [...src.slice(src.indexOf("var EMBED_MENUS = ["), i).matchAll(/id: "([a-z-]+)"/g)].map((m) => m[1]);
const navStart = src.indexOf("var main = [", src.indexOf('className="crm-sidebar"'));
const navIds = [...src.slice(navStart, src.indexOf("var all = main.concat", navStart)).matchAll(/id: "([a-z-]+)"/g)].map((m) => m[1]);
ok("사이드바 메뉴를 읽었다", navIds.length >= 15);
navIds.forEach((id) => ok("칸 제목 있음: " + id, embedIds.includes(id) || A.SPLIT_EXTRA_LABELS[id]));

// ⑥ 연결이 실제로 걸려 있다
ok("메뉴 이동을 칸으로 보낸다", src.includes("if (!IS_EMBED && splitSendRef.current && typeof v === \"string\") { splitSendRef.current(v); return; }"));
ok("사이드바 강조는 선택된 칸 기준", src.includes("active={navView === m.id}"));
ok("칸에서는 다른 창의 메시지를 받지 않는다", src.includes("e.source !== window.parent"));
ok("본 화면은 두 칸에서 온 것만 받는다", src.includes("if (i < 0) return;"));

console.log(`\n분할 보기: ${pass} 통과 · ${fail} 실패`);
process.exit(fail ? 1 : 0);
