// 🗣 상담 체크 (2026-10-08)
// 실행: node scripts/test-consult-check.mjs [백업JSON경로]
//
// src/App.js 의 ⛳ 기업입력칸 + ⛳ 상담체크 구간을 소스째 떼어내 실행한다(옮겨 적지 않는다).
// 백업 JSON(companies 덤프)을 주면 살아있는 기업 전체에 돌려 분포도 찍는다 — DB 는 건드리지 않는다.
// ⚠️ 마커 문구를 바꾸면 이 테스트가 통째로 죽는다.

import fs from "node:fs";

let pass = 0, fail = 0;
const ok = (name, cond, detail = "") => {
  if (cond) { pass++; console.log(`  ✅ ${name}`); }
  else { fail++; console.log(`  ❌ ${name}${detail ? " — " + detail : ""}`); }
};

const src = fs.readFileSync("src/App.js", "utf8");
const a = src.match(/\/\/ ⛳ 기업입력칸 시작[\s\S]*?⛳ 기업입력칸 끝/);
const b = src.match(/\/\/ ⛳ 상담체크 시작[\s\S]*?⛳ 상담체크 끝/);
if (!a || !b) { console.error("❌ 마커를 못 찾았다."); process.exit(1); }
// eslint-disable-next-line no-new-func
const F = new Function(a[0] + "\n" + b[0] + "\n return { buildConsultChecks, CONSULT_CATS, limitGuide, firstCallSteps, growthIndustryCode };")();
const NOW = new Date("2026-10-08T01:00:00Z");
const ids = (c) => F.buildConsultChecks(c, NOW).map((x) => x.cat + ":" + x.id);
const has = (c, id) => ids(c).some((s) => s.endsWith(":" + id));

const FULL = { // 다 채워진 정상 기업 — 모순·막힘 0 이어야 한다
  name: "테스트상사", business_type: "개인사업자", industry: "도소매", employee_count: 3,
  founded_year: "2019", founded_month: 4, revenue_2024: 300000000, revenue_2025: 320000000,
  credit_score_kcb: 820, credit_score_nice: 840, representative_birth: "1975-05-05",
  representative_gender: "남", biz_reg_count: 1, has_closed_business: false, certifications: ["중소기업확인서"],
};

console.log("■ 정상 기업");
ok("다 채운 정상 기업은 0건", ids(FULL).length === 0, ids(FULL).join(", "));
ok("4칸 정의", F.CONSULT_CATS.map((x) => x.id).join() === "ask,blocked,verify,caution");

console.log("\n■ ask(입력 모순)");
ok("벤처 있고 특허·연구소 없음 → 질문", has({ ...FULL, certifications: ["벤처기업확인"] }, "tech-cert-no-basis"));
ok("벤처 + 특허 → 질문 없음", !has({ ...FULL, certifications: ["벤처기업확인", "특허 보유"] }, "tech-cert-no-basis"));
ok("상시근로자 0명 → 질문(빈칸과 구분)", has({ ...FULL, employee_count: 0 }, "emp-zero") && !has({ ...FULL, employee_count: "" }, "emp-zero"));
ok("여성기업확인서 + 남 → 질문", has({ ...FULL, certifications: ["여성기업확인서"] }, "women-cert-male"));
ok("여성기업확인서 + 여 → 없음", !has({ ...FULL, representative_gender: "여", certifications: ["여성기업확인서"] }, "women-cert-male"));
ok("창업기업확인서 + 업력 8년 → 질문", has({ ...FULL, founded_year: "2018", founded_month: 1, certifications: ["창업기업확인서"] }, "startup-cert-old"));
ok("창업기업확인서 + 업력 3년 → 없음", !has({ ...FULL, founded_year: "2023", founded_month: 1, certifications: ["창업기업확인서"] }, "startup-cert-old"));
ok("소상공인확인서 + 도소매 5명 → 질문", has({ ...FULL, employee_count: 5, certifications: ["소기업·소상공인확인서"] }, "small-cert-over"));
ok("소상공인확인서 + 제조 7명 → 없음(10인 미만)", !has({ ...FULL, industry: "제조업", employee_count: 7, certifications: ["소기업·소상공인확인서"] }, "small-cert-over"));
ok("소상공인확인서 + 제조 10명 → 질문", has({ ...FULL, industry: "제조업", employee_count: 10, certifications: ["소기업·소상공인확인서"] }, "small-cert-over"));
ok("(주) 이름 + 개인사업자 → 질문", has({ ...FULL, name: "(주)테스트" }, "type-mismatch"));

console.log("\n■ blocked(빈칸)");
const EMPTY = { name: "빈업체" };
const blk = F.buildConsultChecks(EMPTY, NOW).filter((x) => x.cat === "blocked").map((x) => x.id);
ok("빈 기업 → 막힘 8개 전부", blk.length === 8, blk.join(","));
ok("빈 기업 → ask 0(모순은 값이 있어야 생긴다)", F.buildConsultChecks(EMPTY, NOW).filter((x) => x.cat === "ask").length === 0);
ok("폐업 이력 false(없음)는 막힘 아님", !has(FULL, "no-closed") && has({ ...FULL, has_closed_business: null }, "no-closed"));

console.log("\n■ verify / caution");
ok("사업자 2개 → 질문", has({ ...FULL, biz_reg_count: 2 }, "multi-biz"));
ok("폐업 있음 → 질문", has({ ...FULL, has_closed_business: true }, "closed-detail"));
ok("매출 -20% → 질문 / -10% → 없음", has({ ...FULL, revenue_2025: 240000000 }, "revenue-drop") && !has({ ...FULL, revenue_2025: 270000000 }, "revenue-drop"));
ok("만 37세 → 청년 질문 / 51세 → 없음", has({ ...FULL, representative_birth: "1989-03-17" }, "youth") && !has(FULL, "youth"));
ok("KCB-NICE 120점 차 → 주의", has({ ...FULL, credit_score_kcb: 700, credit_score_nice: 820 }, "credit-gap"));
ok("문장에 undefined/NaN 없음", F.buildConsultChecks({ ...EMPTY, employee_count: 0, certifications: ["벤처기업확인", "창업기업확인서"], founded_year: "2010" }, NOW)
  .every((x) => !/undefined|NaN/.test(x.text + x.why)));

console.log("\n■ 한도 가이드(강의 경험치)");
const lg = F.limitGuide(300000000, 50000000);
const by = Object.fromEntries(lg.map((x) => [x.id, x]));
ok("매출 3억·기대출 5천 → 소진공 1.3억", by.sojin && by.sojin.net === 130000000, JSON.stringify(by.sojin));
ok("재단 40% → 7천", by.jaedan && by.jaedan.net === 70000000);
ok("재도전 (1.8억−5천)×50% = 6,500만", by.rechallenge && by.rechallenge.net === 65000000);
ok("기대출이 더 크면 0(음수 금지)", F.limitGuide(100000000, 900000000).every((x) => x.net === 0));
ok("매출 없음 → []", F.limitGuide(0, 0).length === 0 && F.limitGuide(null, 0).length === 0);
ok("화면에 '공식 기준이 아닙니다' 경고 문구", src.includes("공식 기준이 아닙니다 — 정책자금 강의의 강사 경험치입니다"));

console.log("\n■ 1차 콜 체크리스트");
const st = (c) => Object.fromEntries(F.firstCallSteps(c, NOW).map((x) => [x.id, x.status]));
const sEmpty = st({});
ok("빈 기업 → 데이터 단계 전부 todo", ["bizcount", "vat", "age3", "closed", "credit", "loans"].every((k) => sEmpty[k] === "todo"), JSON.stringify(sEmpty));
const sFull = st({ ...FULL, loans: [{ amount: "1000만" }], received_docs: "사업자등록증, 최근 3년치 부가세 증명원 (23년~25년)" });
ok("정상 기업 → 데이터 단계 전부 done", ["bizcount", "vat", "age3", "closed", "rechallenge", "credit", "loans"].every((k) => sFull[k] === "done"), JSON.stringify(sFull));
ok("업력 2년 → age3 warn", st({ ...FULL, founded_year: "2024", founded_month: 9 }).age3 === "warn");
ok("폐업 있음 → closed·rechallenge warn", (() => { const x = st({ ...FULL, has_closed_business: true }); return x.closed === "warn" && x.rechallenge === "warn"; })());
ok("사업자 2개 → bizcount warn", st({ ...FULL, biz_reg_count: 2 }).bizcount === "warn");
ok("말하기 단계 4개는 항상 talk", ["open", "auth", "smart", "close"].every((k) => sEmpty[k] === "talk" && sFull[k] === "talk"));
ok("문장에 undefined/NaN 없음", F.firstCallSteps({ region: "서울_강남" }, NOW).every((x) => !/undefined|NaN/.test((x.script || "") + x.detail)));
ok("탭이 있다", /id: "firstcall", label: "📞 1차 콜"/.test(src) && src.includes('tab === "firstcall" &&'));

console.log("\n■ 성장 경로 업종 매핑");
const gc = F.growthIndustryCode;
ok("식품제조업 → mfg(음식점 아님)", gc("식품제조업") === "mfg");
ok("한식 음식점업 → food", gc("한식 음식점업") === "food");
ok("소프트웨어 개발 → it", gc("소프트웨어 개발") === "it");
ok("전자상거래 소매업 → retail", gc("전자상거래 소매업") === "retail");
ok("미용업 → service", gc("미용업") === "service");
ok("빈값·모르는 업종 → null", gc("") === null && gc(null) === null && gc("기타") === null);
ok("코드 어휘가 GrowthRoadmap INDUSTRY_ORDER 와 같다", (() => {
  const gr = fs.readFileSync("src/pages/GrowthRoadmap.jsx", "utf8").match(/INDUSTRY_ORDER = (\[[^\]]*\])/);
  // eslint-disable-next-line no-new-func
  const order = new Function("return " + gr[1])();
  const codes = (b[0].match(/\["(\w+)", \//g) || []).map((s) => s.slice(2, -4));
  return codes.length === 7 && codes.every((c) => order.includes(c));
})());
ok("성장 경로 탭이 있다", /id: "growth", label: "🧭 성장 경로"/.test(src) && src.includes('<GrowthRoadmap supabase={supabase} industry={code} embedded />'));

console.log("\n■ 정적 검사");
ok("탭 배열에 consult 가 있다", /id: "consult", label: "🗣 상담 체크"/.test(src));
ok("본문 분기 tab === \"consult\" 가 있다", src.includes('tab === "consult" &&'));
ok("상담체크 블록에 supabase 참조 없음", !/supabase|useState|setData/.test(b[0]));

const backup = process.argv[2];
if (backup && fs.existsSync(backup)) {
  const rows = JSON.parse(fs.readFileSync(backup, "utf8")).rows.filter((r) => !r.deleted_at);
  const dist = {}; const per = { ask: 0, blocked: 0, verify: 0, caution: 0 };
  let crash = 0;
  rows.forEach((r) => {
    try {
      const cs = F.buildConsultChecks(r, NOW);
      cs.forEach((x) => { dist[x.cat + ":" + x.id] = (dist[x.cat + ":" + x.id] || 0) + 1; });
      Object.keys(per).forEach((k) => { if (cs.some((x) => x.cat === k)) per[k]++; });
    } catch (e) { crash++; }
  });
  console.log(`\n■ 실데이터 (살아있는 기업 ${rows.length}곳, 읽기 전용)`);
  ok("예외 0건", crash === 0, String(crash));
  console.log("  칸별 해당 기업 수:", JSON.stringify(per));
  const gd = {}; const miss = {};
  rows.forEach((r) => { const c = F.growthIndustryCode(r.industry) || "(못 고름)"; gd[c] = (gd[c] || 0) + 1; if (c === "(못 고름)" && r.industry) miss[r.industry] = (miss[r.industry] || 0) + 1; });
  console.log("  성장경로 업종 매핑:", JSON.stringify(gd));
  console.log("  못 고른 업종(상위):", JSON.stringify(Object.entries(miss).sort((x, y) => y[1] - x[1]).slice(0, 10)));
  Object.entries(dist).sort((x, y) => y[1] - x[1]).forEach(([k, v]) => console.log(`    ${k}: ${v}`));
}

console.log(`\n결과: ${pass}/${pass + fail} 통과`);
process.exit(fail ? 1 : 0);
