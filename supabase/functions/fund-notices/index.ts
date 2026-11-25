// Supabase Edge Function: 정책자금·지원금 공고 수집 → fund_notices (기관 사이트 화면 하단) — 2026-11-25
//
// 흐름: pg_cron(매일 09:00 KST) → 이 함수 → 공고 API·사이트 → fund_notices upsert → 그날의 뉴스(fund_news_daily) 1행
//
// 🧾 분류(종류·지역·카테고리·대상 판정·「최근 공고」 여부)는 **여기서 굳혀 저장한다.**
//    화면(src/pages/FundNotices.jsx)은 저장된 값으로 거르기만 한다 — 판정 기준이 두 벌로 갈라지지 않게(bizinfo_notices 와 같은 원칙).
// ⚠️ 아래 ⛳ 구간은 순수 함수다(Deno·Node 둘 다에서 돈다). scripts/test-fund-notices.mjs 가 소스째 떼어내 실행한다.
//    supabase·fetch·Deno 를 이 구간에 들이지 말 것. 마커 문구를 바꾸면 테스트가 죽는다.

// ⛳ fund-notices-helpers 시작
// 수집 대상 — 기업마당 지원분야가 「금융」이거나, 공고 "제목"에 이 낱말이 하나라도 있으면 담는다(참고 사이트와 같은 15개).
//   2026-11-25 대조: 참고 사이트가 실은 기업마당 276건 전부가 이 규칙에 들어온다(이쪽이 6건 더 담는다).
var FUND_KEYWORDS = ["정책자금", "융자", "보증", "자금", "대출", "이차보전", "이자", "금융", "지원금", "보조금", "바우처", "장려금", "세제", "세액", "감면"];
// 「최근 공고」 — 공고 "제목"에 이 여섯 중 하나. 띄어쓰기를 지우고 본다("이자 지원" = "이자지원").
var RECENT_TITLE_RE = /융자|대출|보증|이자지원|지원금|보조금/;
var FUND_REGIONS = ["서울", "경기", "인천", "강원", "대전", "세종", "충북", "충남", "광주", "전북", "전남", "대구", "경북", "부산", "울산", "경남", "제주"];
// 종류 — 참고 사이트의 7종과 같은 키.
var FUND_KIND_RULES = [
  ["loan", /융자|대출|정책자금|자금|육성기금|금융지원/],
  ["guarantee", /보증/],
  ["interest", /이차보전|이자지원|이자차액|이자보전|이자보조|금융비용/],
  ["grant", /지원금|보조금|바우처|장려금|보험료|보증료|보증수수료/],
  ["tax", /세액|세제|감면/],
  ["invest", /투자|펀드|팁스|TIPS/],
];
// 기관 사이트 화면의 카테고리 12개(이름·순서는 AgencySites.jsx CATEGORIES 와 같다)에 공고를 대응시키는 규칙.
//   kinds = 위 종류 / realm = 기업마당 지원분야(금융·기술·인력·수출·내수·창업·경영) / text = 제목+개요
var FUND_CAT_RULES = [
  ["정책자금", function(n) { return has(n.kinds, "loan") || has(n.kinds, "guarantee") || has(n.kinds, "interest"); }],
  ["정부지원금", function(n) { return has(n.kinds, "grant"); }],
  ["R&D", function(n) { return /R&D|연구개발|기술개발/.test(n.text) || (n.realm === "기술" && /개발|연구/.test(n.text)); }],
  ["투자", function(n) { return has(n.kinds, "invest"); }],
  ["바우처", function(n) { return /바우처/.test(n.text); }],
  ["창업", function(n) { return n.realm === "창업" || /창업/.test(n.title); }],
  ["고용", function(n) { return n.realm === "인력" || /고용|채용|일자리|인건비|장려금/.test(n.title); }],
  ["수출·판로", function(n) { return n.realm === "수출" || n.realm === "내수" || /수출|판로|해외|박람회|전시회/.test(n.title); }],
  ["기업인증·IP", function(n) { return /인증|특허|지식재산|상표|디자인권/.test(n.title); }],
  ["조달", function(n) { return /조달|공공구매|우수제품|입찰/.test(n.title); }],
  ["교육", function(n) { return /교육|아카데미|강좌|연수/.test(n.title); }],
  ["지자체·지역사업", function(n) { return !(n.regions.length === 1 && n.regions[0] === "전국"); }],
];
function has(arr, v) { return (arr || []).indexOf(v) >= 0; }
function squash(s) { return String(s == null ? "" : s).replace(/\s+/g, ""); }
function stripHtml(h) {
  return String(h == null ? "" : h)
    .replace(/<br\s*\/?>/gi, "\n").replace(/<\/p>/gi, "\n").replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/[ \t]+/g, " ").replace(/ *\n */g, "\n").replace(/\n{2,}/g, "\n").trim();
}
function isRecentTitle(title) { return RECENT_TITLE_RE.test(squash(title)); }
// 제목에서 걸린 낱말. ⚠️ "이자"는 띄어쓰기를 지우면 「두바이 자동차」에도 걸린다 → 뒤에 지원·보전 등이 붙을 때만 친다.
function matchedKeywords(title) {
  var t = squash(title);
  return FUND_KEYWORDS.filter(function(k) {
    if (k === "이자") return /이자(지원|보전|차액|보조|부담|감면|율)/.test(t);
    return t.indexOf(k) >= 0;
  });
}
// 종류는 제목으로 먼저 정하고, 제목에서 하나도 안 걸릴 때만 개요를 본다.
//   (개요까지 한꺼번에 보면 본문에 스치는 낱말로 엉뚱한 종류가 붙는다 — 참고 사이트와 일치율 58% → 93%.)
function fundKinds(title, content) {
  var pick = function(t) { return FUND_KIND_RULES.filter(function(r) { return r[1].test(t); }).map(function(r) { return r[0]; }); };
  var out = pick(squash(title));
  if (!out.length) out = pick(squash(content));
  return out.length ? out : ["etc"];
}
// 지역 — 공고명 맨 앞 [지역] 만 믿는다. 없으면 전국. (해시태그는 전국 공고에 17개 시도가 다 붙어 있어 쓰지 않는다.)
function fundRegions(title) {
  var m = /^\s*\[([^\]]+)\]/.exec(String(title || ""));
  if (!m) return ["전국"];
  var hit = FUND_REGIONS.filter(function(r) { return m[1].indexOf(r) >= 0; });
  return hit.length ? hit : ["전국"];
}
// 대상 판정 — 지원 대상 문구로 자동 분류한다. 신청 가능 여부를 보증하는 값이 아니다.
function fundVerdict(title, target, content) {
  var head = String(title || "") + " " + String(content || "").slice(0, 260);
  if (/농업인|어업인|농어업|농업발전|농어촌|축산|임업|수산|양식|귀농|농촌융복합|영농/.test(head)) return "agri";
  if (/중소기업|소상공인|자영업|소기업|중견기업|창업기업|스타트업|벤처/.test(String(target || "") + " " + head)) return "sme";
  return "check";
}
function fundCats(n) {
  return FUND_CAT_RULES.filter(function(r) { return r[1](n); }).map(function(r) { return r[0]; });
}
// "2026-11-24 ~ 2026-12-01" → 시작·끝. "예산 소진시까지" 같은 글은 날짜 없이 원문만 남긴다(지어내지 않는다).
function parsePeriod(raw) {
  var s = String(raw == null ? "" : raw).trim();
  var d = s.match(/\d{4}[-.]\d{1,2}[-.]\d{1,2}/g) || [];
  var norm = function(x) { var p = x.split(/[-.]/); return p[0] + "-" + ("0" + p[1]).slice(-2) + "-" + ("0" + p[2]).slice(-2); };
  return { text: s, start: d[0] ? norm(d[0]) : null, end: d[1] ? norm(d[1]) : null };
}
// 오늘(KST, YYYY-MM-DD) 기준 모집 상태.
function fundStatus(n, today) {
  if (n.end_date && n.end_date < today) return "closed";
  if (n.start_date && n.start_date > today) return "upcoming";
  if (n.start_date || n.end_date) return "open";
  return /소진|상시|수시|마감시|별도/.test(String(n.period || "")) ? "open" : "unknown";
}
// 같은 공고가 여러 곳에서 들어올 때 한 건으로 보는 열쇠: [지역]·공백·기호를 뗀 제목 + 접수 시작·끝.
function fundDupKey(n) {
  var t = String(n.title || "").replace(/^\s*\[[^\]]+\]\s*/, "").replace(/[\s\[\]\(\)「」『』·ㆍ,.\-~_:'"“”‘’]/g, "");
  return t + "|" + (n.start_date || "") + "|" + (n.end_date || "");
}
// 기업마당 지원사업정보 API 한 건 → fund_notices 한 줄.
function normalizeBizinfo(x) {
  var title = String(x.pblancNm || "").trim();
  var content = stripHtml(x.bsnsSumryCn);
  var per = parsePeriod(x.reqstBeginEndDe);
  var kinds = fundKinds(title, content);
  var regions = fundRegions(title);
  var exc = String(x.excInsttNm || "").trim(), jr = String(x.jrsdInsttNm || "").trim();
  // 수행기관 칸이 「직접수행」「기초자치단체」처럼 이름이 아닌 값이면 소관기관을 쓴다.
  if (/^(직접수행|기초자치단체|광역자치단체|자체수행|해당없음|-)?$/.test(exc)) exc = "";
  // 기업마당 개요는 「머리말 ☞ 지원 대상 ☞ 지원 내용 ※ 덧붙임」 모양이다. 그 둘을 따로 떼어 둔다(없으면 빈칸).
  var parts = content.split("☞").map(function(v) { return v.split("※")[0].replace(/\s+/g, " ").trim(); });
  var targetDetail = parts.length >= 3 ? parts[1] : "", support = parts.length >= 3 ? parts[2] : (parts.length === 2 ? parts[1] : "");
  var n = {
    key: "bizinfo:" + x.pblancId, source: "bizinfo", source_name: "기업마당", source_id: String(x.pblancId || ""),
    title: title, org: exc && jr && exc !== jr ? exc + " (소관: " + jr + ")" : (exc || jr),
    target: String(x.trgetNm || "").trim(), target_detail: targetDetail, support: support, content: content,
    apply_method: stripHtml(x.reqstMthPapersCn), contact: stripHtml(x.refrncNm),
    period: per.text, start_date: per.start, end_date: per.end,
    reg_date: String(x.creatPnttm || "").slice(0, 10) || null, upd_date: String(x.updtPnttm || "").slice(0, 10) || null,
    link: /^https?:\/\//.test(String(x.pblancUrl || "")) ? String(x.pblancUrl) : "https://www.bizinfo.go.kr" + String(x.pblancUrl || ""),
    realm: String(x.pldirSportRealmLclasCodeNm || "").trim(),
    kinds: kinds, regions: regions, matched: matchedKeywords(title),
    verdict: fundVerdict(title, x.trgetNm, content), is_recent: isRecentTitle(title),
  };
  n.cats = fundCats({ kinds: kinds, regions: regions, realm: n.realm, title: title, text: title + " " + content });
  return n;
}
// 수집 대상인가.
function isFundNotice(n) { return n.realm === "금융" || (n.matched || []).length > 0; }
// 여러 출처를 합치며 중복을 표시한다. 먼저 온 것(기업마당 우선)이 원본, 나머지는 duplicate_of 에 원본 key.
function markDuplicates(rows) {
  var seen = {};
  rows.forEach(function(n) {
    var k = fundDupKey(n);
    if (seen[k]) n.duplicate_of = seen[k]; else { seen[k] = n.key; n.duplicate_of = null; }
  });
  return rows;
}
// 그날의 뉴스에 실을 공고 — 지금 신청할 수 있는 중소·소상공인 대상 공고를 게시일 최신순으로 12건.
function pickDigest(rows, today, max) {
  return rows
    .filter(function(n) { return n.verdict === "sme" && !n.duplicate_of && fundStatus(n, today) === "open" && (!n.reg_date || n.reg_date <= today); })
    .sort(function(a, b) { return String(b.reg_date || "").localeCompare(String(a.reg_date || "")) || String(a.key).localeCompare(String(b.key)); })
    .slice(0, max || 12)
    .map(function(n) { return n.key; });
}
// AI 가 쓴 안내 문장의 숫자가 공고 원문에 실제로 있는지 대조한다. 하나라도 없으면 그 문장은 쓰지 않는다.
function summaryNumbersOk(summary, sourceText) {
  var flat = String(sourceText || "").replace(/[\s,]/g, "");
  var nums = String(summary || "").match(/\d[\d,.\-]*\d|\d/g) || [];
  return nums.every(function(x) { return flat.indexOf(x.replace(/[\s,]/g, "")) >= 0; });
}
// ⛳ fund-notices-helpers 끝

// ── 아래 실행부(공고 API 호출 · fund_notices 저장 · AI 안내 문장 · 예약 호출 검사)는 화면 확인 뒤 운영 DB 승인을 받고 채운다.
//    지금은 저장 구조가 운영에 없어, 호출되면 아무것도 하지 않고 그 사실만 답한다.
// @ts-ignore Deno 전역
Deno.serve(function() {
  return new Response(JSON.stringify({ ok: false, reason: "not_enabled" }), { status: 503, headers: { "content-type": "application/json" } });
});
