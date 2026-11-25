// 「정부 기관 사이트」 하단 공고 조회 테스트.
// Edge Function 의 ⛳ fund-notices-helpers 구간과 화면(FundNotices.jsx)의 ⛳ 공고화면-계산 구간을 소스째 떼어내 실행한다(DB·외부 무접촉).
// 인자로 기업마당 응답 JSON 파일을 주면 실제 공고로도 돌려 본다:  node scripts/test-fund-notices.mjs <공고목록.json>
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const here = path.dirname(fileURLToPath(import.meta.url));
const read = (f) => fs.readFileSync(path.join(here, "..", f), "utf8");
const cut = (file, a, b, ret) => {
  const src = read(file);
  const i = src.indexOf(a), j = src.indexOf(b);
  if (i < 0 || j < 0) { console.error("마커를 찾지 못했습니다: " + file); process.exit(1); }
  return new Function(src.slice(i, j) + "\nreturn { " + ret + " };")();
};
const F = cut("supabase/functions/fund-notices/index.ts", "// ⛳ fund-notices-helpers 시작", "// ⛳ fund-notices-helpers 끝",
  "FUND_KEYWORDS, isRecentTitle, matchedKeywords, fundKinds, fundRegions, fundVerdict, fundCats, parsePeriod, fundStatus, fundDupKey, normalizeBizinfo, isFundNotice, markDuplicates, pickDigest, summaryNumbersOk, summarySource, acceptSummary, FUND_COLUMNS, toDbRow, kstYmd, stripHtml");
const V = cut("src/pages/FundNotices.jsx", "// ⛳ 공고화면-계산 시작", "// ⛳ 공고화면-계산 끝",
  "NOTICE_PAGE_SIZE, noticeStatus, filterNotices, pageCount, pageSlice, pageButtons, dday, isChangeNotice, noticeMent, newsMent, noticeBadge, kstToday");

let pass = 0, fail = 0;
const eq = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (ok) pass++; else { fail++; console.log("❌ " + name + "\n   got : " + JSON.stringify(got) + "\n   want: " + JSON.stringify(want)); }
};
const ok = (name, cond) => eq(name, !!cond, true);

// 지어낸 공고 한 건(기업마당 응답 모양)
const raw = (o) => Object.assign({
  pblancId: "PBLN_000000000000001", pblancNm: "[경기] 2026년 소상공인 경영안정자금 융자 지원 공고",
  bsnsSumryCn: "<p>머리말 ☞ 경기도 소재 소상공인 ☞ 업체당 5천만 원 이내, 금리 2.5% 융자 ※ 예산 소진 시 마감</p>",
  reqstBeginEndDe: "2026-11-20 ~ 2026-12-05", trgetNm: "소상공인", excInsttNm: "경기신용보증재단", jrsdInsttNm: "경기도",
  reqstMthPapersCn: "온라인 신청", refrncNm: "경기신용보증재단 031-000-0000", creatPnttm: "2026-11-20 09:00:00", updtPnttm: "2026-11-21 10:00:00",
  pblancUrl: "/web/lay1/bbs/S1T122C128/AS/74/view.do?pblancId=PBLN_000000000000001", pldirSportRealmLclasCodeNm: "금융",
}, o || {});
const TODAY = "2026-11-25";

// ① 한 건 정규화
const n = F.normalizeBizinfo(raw());
eq("key", n.key, "bizinfo:PBLN_000000000000001");
eq("지역은 제목 [ ] 에서", n.regions, ["경기"]);
ok("종류에 융자", n.kinds.includes("loan"));
eq("접수 시작", n.start_date, "2026-11-20");
eq("접수 끝", n.end_date, "2026-12-05");
eq("게시일", n.reg_date, "2026-11-20");
eq("기관 표기", n.org, "경기신용보증재단 (소관: 경기도)");
eq("링크는 절대 주소", n.link.startsWith("https://www.bizinfo.go.kr/"), true);
eq("대상 판정", n.verdict, "sme");
eq("최근 공고(제목 6낱말)", n.is_recent, true);
ok("카테고리에 정책자금", n.cats.includes("정책자금"));
ok("카테고리에 지자체·지역사업", n.cats.includes("지자체·지역사업"));
eq("지원 대상 줄", n.target_detail, "경기도 소재 소상공인");
ok("지원 내용 줄에 금액", /5천만 원 이내/.test(n.support));
ok("수집 대상", F.isFundNotice(n));

// ② 낱말·분류
eq("띄어 쓴 '이자 지원'도 최근 공고", F.isRecentTitle("중소기업 이자 지원 사업"), true);
eq("'두바이 자동차'는 이자로 안 잡음", F.matchedKeywords("두바이 자동차 부품 전시회"), []);
eq("이자지원은 잡음", F.matchedKeywords("대출 이자지원 사업").includes("이자"), true);
eq("지역 없으면 전국", F.fundRegions("2026년 수출바우처 모집"), ["전국"]);
eq("종류 없으면 etc", F.fundKinds("참가기업 모집", "설명회 개최"), ["etc"]);
eq("제목에서 먼저 정한다", F.fundKinds("보증 지원 공고", "융자 대출 이자지원"), ["guarantee"]);
eq("농어업 판정", F.fundVerdict("귀농 창업자금 융자", "", ""), "agri");
eq("대상 문구 없으면 확인 필요", F.fundVerdict("참가자 모집", "", ""), "check");
eq("기간 글자만 있는 경우", F.parsePeriod("예산 소진시까지"), { text: "예산 소진시까지", start: null, end: null });
eq("점 표기 날짜", F.parsePeriod("2026.1.5 ~ 2026.2.10").end, "2026-02-10");
eq("상태 모집중", F.fundStatus(n, TODAY), "open");
eq("상태 마감", F.fundStatus({ end_date: "2026-11-01" }, TODAY), "closed");
eq("상태 예정", F.fundStatus({ start_date: "2026-12-01", end_date: "2026-12-31" }, TODAY), "upcoming");
eq("상태 소진시", F.fundStatus({ period: "예산 소진시까지" }, TODAY), "open");
eq("상태 모름", F.fundStatus({ period: "" }, TODAY), "unknown");
eq("금융 분야가 아니고 낱말도 없으면 제외", F.isFundNotice(F.normalizeBizinfo(raw({ pblancNm: "해외 전시회 참가기업 모집", pldirSportRealmLclasCodeNm: "수출" }))), false);

// ③ 중복 표시 — 지역 머리말·기호만 다른 같은 공고
const a = F.normalizeBizinfo(raw());
const b = F.normalizeBizinfo(raw({ pblancId: "PBLN_000000000000002", pblancNm: "2026년 소상공인 경영안정자금 융자 지원 공고" }));
const c = F.normalizeBizinfo(raw({ pblancId: "PBLN_000000000000003", reqstBeginEndDe: "2027-01-02 ~ 2027-01-20" }));
const dup = F.markDuplicates([a, b, c]);
eq("첫 건이 원본", dup[0].duplicate_of, null);
eq("둘째는 첫 건의 중복", dup[1].duplicate_of, a.key);
eq("접수 기간이 다르면 다른 공고", dup[2].duplicate_of, null);

// ④ 오늘의 뉴스 12건
const many = [];
for (let i = 0; i < 20; i++) many.push(F.normalizeBizinfo(raw({ pblancId: "P" + String(i).padStart(3, "0"), pblancNm: "소상공인 지원금 " + i + "차 공고", creatPnttm: "2026-11-" + String(5 + i).padStart(2, "0") + " 09:00:00" })));
many.push(F.normalizeBizinfo(raw({ pblancId: "CLOSED", pblancNm: "소상공인 지원금 마감 공고", reqstBeginEndDe: "2026-10-01 ~ 2026-10-31", creatPnttm: "2026-11-24 09:00:00" })));
many.push(F.normalizeBizinfo(raw({ pblancId: "AGRI", pblancNm: "귀농 농업인 창업자금 융자", creatPnttm: "2026-11-24 09:00:00" })));
const dg = F.pickDigest(F.markDuplicates(many), TODAY, 12);
eq("12건", dg.length, 12);
eq("게시일 최신순", dg[0], "bizinfo:P019");
ok("마감·농어업은 빠진다", !dg.includes("bizinfo:CLOSED") && !dg.includes("bizinfo:AGRI"));
ok("미래 게시일은 빠진다", !dg.includes("bizinfo:P" + "020"));

// ⑤ 안내 문장 — 숫자 대조
const src = F.summarySource(n);
eq("원문에 있는 숫자는 통과", F.summaryNumbersOk("업체당 5천만 원 이내, 금리 2.5%로 융자합니다. 문의 031-000-0000", src), true);
eq("원문에 없는 금액은 탈락", F.summaryNumbersOk("업체당 7천만 원 이내로 융자합니다.", src), false);
eq("원문에 없는 전화번호는 탈락", F.summaryNumbersOk("문의 02-123-4567", src), false);
eq("끝까지 쓴 글만", F.acceptSummary("경기도 소재 소상공인이 신청할 수 있습니다.", "max_tokens", src), null);
eq("빈 글", F.acceptSummary("  ", "end_turn", src), null);
eq("통과하면 한 줄로", F.acceptSummary("경기도 소재 소상공인이\n신청할 수 있습니다.", "end_turn", src), "경기도 소재 소상공인이 신청할 수 있습니다.");
eq("너무 긴 글", F.acceptSummary("가".repeat(401), "end_turn", src), null);

// ⑥ 저장할 줄 — DB 칸만, summary 는 보내지 않는다(써 둔 문장이 수집 때 지워지지 않게)
const row = F.toDbRow(n, TODAY);
eq("칸 수 = 저장 칸 + last_seen", Object.keys(row).length, F.FUND_COLUMNS.length + 1);
ok("summary 를 보내지 않는다", !("summary" in row));
eq("last_seen", row.last_seen, TODAY);
ok("계산용 값이 섞이지 않는다", !("text" in row));
const sql = read("공고조회_fund_notices.sql");
F.FUND_COLUMNS.concat(["summary", "last_seen", "updated_at"]).forEach((k) => ok("SQL 에 칸 " + k, new RegExp("\\n\\s+" + k + "\\s").test(sql)));
eq("한국 날짜(UTC 16시 = 다음 날 1시)", F.kstYmd(Date.UTC(2026, 10, 24, 16, 0, 0)), "2026-11-25");

// ⑦ 화면 — 거르기·쪽 나누기·멘트
const items = F.markDuplicates(many).map((x) => Object.assign(F.toDbRow(x, TODAY), {}));
const base = { scope: "recent", cat: "전체", region: "전체", q: "", showClosed: false, showAgri: false };
const shown = V.filterNotices(items, base, TODAY);
eq("마감·농어업 빼고 20건", shown.length, 20);
eq("최신순", shown[0].key, "bizinfo:P019");
eq("마감 포함", V.filterNotices(items, { ...base, showClosed: true }, TODAY).length, 21);
eq("농어업 포함", V.filterNotices(items, { ...base, showAgri: true }, TODAY).length, 21);
eq("검색", V.filterNotices(items, { ...base, q: "13차" }, TODAY).length, 1);
eq("지역 거르기(경기 아님 → 0)", V.filterNotices(items, { ...base, region: "부산" }, TODAY).length, 0);
eq("쪽 수", V.pageCount(shown.length), 2);
eq("1쪽 10건", V.pageSlice(shown, 1).length, V.NOTICE_PAGE_SIZE);
eq("쪽 버튼 줄임표", V.pageButtons(6, 23), [1, "…", 4, 5, 6, 7, 8, "…", 23]);
eq("화면과 수집의 상태 판정이 같다", items.every((x) => V.noticeStatus(x, TODAY) === F.fundStatus(x, TODAY)), true);
const ment = V.noticeMent(Object.assign({}, row, { summary: "경기도 소재 소상공인이 신청할 수 있습니다. 문의 전화번호 031-000-0000" }));
ok("멘트 첫 줄에 제목과 마감", ment.split("\n")[0].includes("소상공인 경영안정자금") && ment.split("\n")[0].endsWith("(~12.5)"));
ok("멘트에 접수기간", ment.includes("접수기간 : 2026.11.20 ~ 2026.12.05"));
ok("멘트에 원문 링크", ment.includes("원문 링크 : https://www.bizinfo.go.kr/"));
ok("문의 전화번호 → 문의", ment.includes("문의 031-000-0000") && !ment.includes("문의 전화번호"));
const noSum = V.noticeMent(row);
ok("문장이 없으면 공고 값으로 잇는다", noSum.includes("지원 대상은 소상공인입니다."));
ok("없는 날짜는 공고문 참조", V.noticeMent(Object.assign({}, row, { start_date: null, end_date: null, period: "" })).includes("접수시작일 : 공고문 참조"));
ok("뉴스 머리줄", V.newsMent(TODAY, [row]).startsWith("📢 2026.11.25 정책자금•지원금 News 💡"));
eq("강조 칸은 지원 내용 줄의 숫자", V.noticeBadge(row, TODAY)[0], "금리 2.5%");
eq("마감 임박 표시", V.noticeBadge(Object.assign({}, row, { end_date: "2026-11-28" }), TODAY)[1], "마감 D-3");
eq("변경 공고", V.isChangeNotice({ title: "융자 지원 변경 공고" }), true);

// ⑧ 함수 소스 — 비밀값을 글자로 박지 않았는지, 인증·0건 방어가 있는지
const fn = read("supabase/functions/fund-notices/index.ts");
ok("호출 비밀키 검사", fn.includes('x-fund-notices-secret') && fn.includes("safeEqual("));
ok("0건은 반영하지 않는다", fn.includes("if (!list.length) return json(502"));
ok("키를 소스에 적지 않았다", !/sk-ant-|crtfcKey\s*[:=]\s*["'][A-Za-z0-9]{8,}/.test(fn));
ok("AI 키가 없어도 수집은 된다", fn.includes("fund_notices_ai_key 없음"));
const cron = read("공고조회_매일9시_cron.sql");
ok("예약은 UTC 0시(=KST 9시)", cron.includes("'0 0 * * *'"));
ok("예약 SQL 에 비밀값 없음", cron.includes("public.fund_notices_secret()") && !/x-fund-notices-secret',\s*'[^']+'/.test(cron));
const vault = read("공고조회_금고함수.sql");
ok("금고 함수는 service_role 만", /revoke all on function[^;]+from public, anon, authenticated/.test(vault) && vault.includes("to service_role"));

// ⑨ (선택) 실제 기업마당 응답으로
const file = process.argv[2];
if (file && fs.existsSync(file)) {
  const j = JSON.parse(fs.readFileSync(file, "utf8"));
  const list = Array.isArray(j) ? j : (j.jsonArray || []);
  const rows = F.markDuplicates(list.filter((x) => x && x.pblancId && x.pblancNm).map(F.normalizeBizinfo).filter(F.isFundNotice));
  const today = V.kstToday();
  const d = F.pickDigest(rows, today, 12);
  ok("실데이터: 수집 대상이 있다", rows.length > 0);
  ok("실데이터: key 가 겹치지 않는다", new Set(rows.map((x) => x.key)).size === rows.length);
  ok("실데이터: 날짜 칸은 날짜 모양이거나 비어 있다", rows.every((x) => ["start_date", "end_date", "reg_date", "upd_date"].every((k) => x[k] === null || /^\d{4}-\d{2}-\d{2}$/.test(x[k]))));
  console.log("실데이터: 전체 " + list.length + "건 → 수집 대상 " + rows.length + "건 · 최근 공고 " + rows.filter((x) => x.is_recent).length + "건 · 중복 " + rows.filter((x) => x.duplicate_of).length + "건 · 오늘 뉴스 " + d.length + "건");
}

console.log((fail ? "❌ " : "✅ ") + pass + " 통과 / " + fail + " 실패");
process.exit(fail ? 1 : 0);
