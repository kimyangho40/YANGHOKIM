// 📢 기업마당 공고 매칭 (2026-10-08)
// 실행: node scripts/test-notice-match.mjs [companies 백업 JSON] [bizinfo_notices 덤프 JSON]
// ⛳ 기업입력칸 + ⛳ 공고매칭 구간을 소스째 떼어내 실행한다. 덤프 2개를 주면 실데이터 분포도 찍는다(DB 무접촉).
import fs from "node:fs";

let pass = 0, fail = 0;
const ok = (name, cond, detail = "") => {
  if (cond) { pass++; console.log(`  ✅ ${name}`); }
  else { fail++; console.log(`  ❌ ${name}${detail ? " — " + detail : ""}`); }
};
const src = fs.readFileSync("src/App.js", "utf8");
const a = src.match(/\/\/ ⛳ 기업입력칸 시작[\s\S]*?⛳ 기업입력칸 끝/);
const b = src.match(/\/\/ ⛳ 공고매칭 시작[\s\S]*?⛳ 공고매칭 끝/);
if (!a || !b) { console.error("❌ 마커를 못 찾았다."); process.exit(1); }
// eslint-disable-next-line no-new-func
const F = new Function(a[0] + "\n" + b[0] + "\n return { noticeCompanyRegion, noticeIndustryCats, judgeNotice, matchNotices };")();
const NOW = new Date("2026-10-08T01:00:00Z");

const CO = { name: "테스트", region: "인천_연수구", industry: "음식점업", founded_year: "2024", founded_month: 1,
  revenue_2025: 700000000, employee_count: 3, representative_birth: "1990-01-01", certifications: [] };
const N = (req, extra = {}) => ({ pblanc_id: "P", title: "공고", deadline: null, req: { regions: ["전국"], sigungu: [], niche_need: [], types: ["융자"], targets: ["소상공인"], ind_in: [], ind_out: [], extra: [], ...req }, ...extra });

console.log("■ 지역 파싱");
ok("서울_강남 → 서울/강남", JSON.stringify(F.noticeCompanyRegion("서울_강남")) === JSON.stringify({ sido: "서울", sigungu: "강남" }));
ok("경상남도 김해시 → 경남/김해시", F.noticeCompanyRegion("경상남도 김해시").sido === "경남" && F.noticeCompanyRegion("경상남도 김해시").sigungu === "김해시");
ok("빈값 → 빈칸", F.noticeCompanyRegion("").sido === "");

console.log("\n■ 판정");
ok("전국 공고 → 통과", !!F.judgeNotice(CO, N({}), NOW));
ok("다른 광역 공고 → 탈락", F.judgeNotice(CO, N({ regions: ["서울"] }), NOW) === null);
ok("같은 광역 공고 → 통과 + 이유", (F.judgeNotice(CO, N({ regions: ["인천"] }), NOW) || { why: [] }).why.some((w) => w.includes("인천")));
ok("다른 시군구 → 탈락 / 같은 시군구 → 통과", F.judgeNotice(CO, N({ regions: ["인천"], sigungu: ["중구"] }), NOW) === null
  && !!F.judgeNotice(CO, N({ regions: ["인천"], sigungu: ["연수구"] }), NOW));
ok("지역 비어 있으면 탈락 아니라 확인할 것", (F.judgeNotice({ ...CO, region: "" }, N({ regions: ["서울"] }), NOW) || { checks: [] }).checks.length === 1);
ok("니치(관광·여행사) → 음식점 탈락", F.judgeNotice(CO, N({ niche_need: ["여행|관광|숙박|호텔|펜션"] }), NOW) === null);
ok("업종 제외(음식점) → 탈락", F.judgeNotice(CO, N({ ind_out: ["음식점"] }), NOW) === null);
ok("업종 한정(제조) → 음식점 탈락", F.judgeNotice(CO, N({ ind_in: ["제조"] }), NOW) === null);
ok("업력 최대 1년 → 업력 2년대 탈락", F.judgeNotice(CO, N({ age_max: 1 }), NOW) === null);
ok("매출 최대 5억 → 7억 탈락 / 10억 → 통과", F.judgeNotice(CO, N({ rev_max: 5 }), NOW) === null && !!F.judgeNotice(CO, N({ rev_max: 10 }), NOW));
ok("마감 지남 → 탈락", F.judgeNotice(CO, N({}, { deadline: "2026-10-01" }), NOW) === null && !!F.judgeNotice(CO, N({}, { deadline: "2026-10-30" }), NOW));
ok("청년 전용 + 만36세 → 통과 / 만45세 → 탈락", !!F.judgeNotice(CO, N({ targets: ["청년"] }), NOW)
  && F.judgeNotice({ ...CO, representative_birth: "1981-01-01" }, N({ targets: ["청년"] }), NOW) === null);
ok("여성기업 전용 + 여성기업확인서 → 이유", (F.judgeNotice({ ...CO, certifications: ["여성기업확인서"] }, N({ targets: ["여성기업"] }), NOW) || { why: [] }).why.includes("여성기업 대상"));
ok("폐업·재기 공고 → 감점 + 확인", (() => { const j = F.judgeNotice(CO, N({}, { title: "희망리턴패키지 재기지원" }), NOW); return j && j.checks.some((x) => x.includes("폐업")); })());
const m = F.matchNotices(CO, [N({ types: ["교육·컨설팅"] }, { pblanc_id: "A" }), N({ types: ["융자"], regions: ["인천"] }, { pblanc_id: "B" }), N({ regions: ["서울"] }, { pblanc_id: "C" })], NOW, 10);
ok("정렬: 지역 융자가 1위 · 다른 지역 제외", m.total === 2 && m.top[0].notice.pblanc_id === "B");
ok("탭·조회 연결", src.includes('id: "notices", label: "📢 지원사업"') && src.includes('orderBy: "pblanc_id", tieBreak: null'));
ok("공고매칭 블록에 supabase 참조 없음", !/supabase|useState/.test(b[0]));

const [cf, nf] = process.argv.slice(2);
if (cf && nf && fs.existsSync(cf) && fs.existsSync(nf)) {
  const cos = JSON.parse(fs.readFileSync(cf, "utf8")).rows.filter((r) => !r.deleted_at);
  const ns = JSON.parse(fs.readFileSync(nf, "utf8"));
  let crash = 0; const totals = [];
  cos.forEach((c) => { try { totals.push(F.matchNotices(c, ns, NOW, 10).total); } catch (e) { crash++; } });
  totals.sort((x, y) => x - y);
  console.log(`\n■ 실데이터: 기업 ${cos.length} × 공고 ${ns.length}`);
  ok("예외 0건", crash === 0, String(crash));
  console.log(`  기업당 통과 공고 수: 최소 ${totals[0]} · 중앙 ${totals[Math.floor(totals.length / 2)]} · 최대 ${totals[totals.length - 1]}`);
  const sample = cos.find((c) => /인천/.test(c.region || "") && /음식/.test(c.industry || ""));
  if (sample) {
    const r = F.matchNotices(sample, ns, NOW, 5);
    console.log(`  예시 ${sample.name} (${sample.region} · ${sample.industry}) → ${r.total}건`);
    r.top.forEach((x, i) => console.log(`    ${i + 1}. [${(x.notice.req.types || []).join("·")}] ${x.notice.title.slice(0, 50)}`));
  }
}
console.log(`\n결과: ${pass}/${pass + fail} 통과`);
process.exit(fail ? 1 : 0);
