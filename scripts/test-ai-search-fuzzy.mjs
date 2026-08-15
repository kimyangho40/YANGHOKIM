// AI 상담 — 업체명 흔들림 흡수(similarNames) 회귀 테스트
// 실행: node scripts/test-ai-search-fuzzy.mjs
//
// 왜 필요한가 (2026-08-15 장애):
//   질문 "주식회사 엘케이에네스트코리아 현황" → 실제 이름은 "(주)엘케이네스트코리아".
//   ilike 부분일치가 0건이라 모델이 필터를 바꿔가며 12번 재조회 → 라운드 소진 → 빈 응답.
//   0건일 때 이 함수가 실제 이름 후보를 돌려줘야 모델이 한 번에 제 이름을 찾는다.
import { similarNames } from "../api/ai-search.js";

// 실제 DB 에 있는 이름들(2026-08-15 조회)
const NAMES = [
  "(주)엘케이네스트코리아",
  "(주)엘케이네스트코리아(유선안내)",
  "백돈시흥능곡점",
  "치즈버거",
  "골목식당(일반과세자)",
  "㈜청당한얼",
  "(주)리첸시아스크린",
  "농업회사법인(주)조선제일한우",
  "전라도밥상",
  "보타이",
];

let pass = 0, fail = 0;
function check(label, cond, detail) {
  if (cond) { pass++; console.log("  ✅ " + label); }
  else { fail++; console.log("  ❌ " + label + (detail ? "  → " + detail : "")); }
}

console.log("■ 사용자가 실제로 친 오타/표기 흔들림을 잡는가");
[
  ["주식회사 엘케이에네스트코리아", "(주)엘케이네스트코리아"],   // '에' 한 글자 더 (실제 질문 1)
  ["주식회사 엘케이에네스코 코리아", "(주)엘케이네스트코리아"],  // 오타 + 띄어쓰기 (실제 질문 2)
  ["엘케이네스트코리아", "(주)엘케이네스트코리아"],              // 법인격 표기 없음
  ["(주) 엘케이네스트코리아", "(주)엘케이네스트코리아"],         // 공백만 다름
  ["엘케이 네스트 코리아", "(주)엘케이네스트코리아"],            // 띄어쓰기만 다름
].forEach(function (row) {
  const got = similarNames(row[0], NAMES, 8);
  check('"' + row[0] + '" → ' + row[1], got.indexOf(row[1]) >= 0, "받은 후보: " + JSON.stringify(got));
});

console.log("■ 법인격 표기가 붙은 다른 이름도 찾는가");
check('"청당한얼" → ㈜청당한얼', similarNames("청당한얼", NAMES, 8).indexOf("㈜청당한얼") >= 0);
check('"조선제일한우" → 농업회사법인(주)조선제일한우',
  similarNames("조선제일한우", NAMES, 8).indexOf("농업회사법인(주)조선제일한우") >= 0);

console.log("■ 엉뚱한 업체를 끌어오지 않는가 (오탐 방지)");
check("치즈버거 질문에 엘케이네스트코리아가 섞이지 않는다",
  similarNames("치즈버거", NAMES, 8).indexOf("(주)엘케이네스트코리아") < 0,
  JSON.stringify(similarNames("치즈버거", NAMES, 8)));
check("전혀 없는 업체는 후보가 비어 있다",
  similarNames("존재하지않는회사이름입니다", NAMES, 8).length === 0,
  JSON.stringify(similarNames("존재하지않는회사이름입니다", NAMES, 8)));
check("한 글자짜리 질의는 아무거나 매칭하지 않는다",
  similarNames("가", NAMES, 8).length === 0);

console.log("■ 정확히 같은 이름은 1순위");
check("(주)엘케이네스트코리아 → 첫 후보가 자기 자신",
  similarNames("(주)엘케이네스트코리아", NAMES, 8)[0] === "(주)엘케이네스트코리아");

console.log("\n결과: " + pass + " pass / " + fail + " fail");
process.exit(fail ? 1 : 0);
