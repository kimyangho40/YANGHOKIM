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
// 그날의 뉴스 12건에 붙일 안내 문장(멘트의 「👉 해당 업종」 줄) — AI 에 넘길 공고 원문. 이 글이 숫자 대조의 기준이기도 하다.
function summarySource(n) {
  return ["공고명: " + n.title, "기관: " + n.org, "지원대상: " + n.target, "사업개요: " + n.content, "신청방법: " + n.apply_method, "문의처: " + n.contact].join("\n");
}
// AI 가 돌려준 글을 그대로 쓸지 정한다. 끝까지 쓴 글(end_turn)이고, 숫자가 전부 원문에 있고, 너무 길지 않을 때만.
function acceptSummary(text, stopReason, sourceText) {
  var out = String(text == null ? "" : text).replace(/\s+/g, " ").trim();
  if (!out || stopReason !== "end_turn" || out.length > 400) return null;
  return summaryNumbersOk(out, sourceText) ? out : null;
}
// 저장할 한 줄 — DB 칸 이름만 남긴다. summary 는 넣지 않는다 → 다시 수집해도 써 둔 문장이 지워지지 않는다.
var FUND_COLUMNS = ["key", "source", "source_name", "source_id", "title", "org", "target", "target_detail", "support", "content", "apply_method", "contact",
  "period", "start_date", "end_date", "reg_date", "upd_date", "link", "realm", "kinds", "regions", "matched", "cats", "verdict", "is_recent", "duplicate_of"];
function toDbRow(n, today) {
  var o = {};
  FUND_COLUMNS.forEach(function(k) { o[k] = n[k] === undefined ? null : n[k]; });
  o.last_seen = today;
  return o;
}
function kstYmd(ms) { return new Date(ms + 9 * 3600 * 1000).toISOString().slice(0, 10); }
// ⛳ fund-notices-helpers 끝

// ── 실행부 ─────────────────────────────────────────────────────────────────────────────────────────
// 호출: pg_cron(매일 00:00 UTC = 09:00 KST) → POST + x-fund-notices-secret. verify_jwt 는 끄고 이 헤더로 검사한다(meta-leads 와 같은 방식).
// 비밀값 3개는 Vault 에만 있다: fund_notices_secret(호출 키) · fund_notices_bizinfo_key(기업마당 인증키) · fund_notices_ai_key(안내 문장용, 없어도 수집은 된다).
// @ts-ignore Deno npm 가져오기
import Anthropic from "npm:@anthropic-ai/sdk";

const BIZINFO_API = "https://www.bizinfo.go.kr/uss/rss/bizinfoApi.do";
const AI_MODEL = "claude-haiku-5-5";
const AI_SYSTEM = [
  "당신은 정부 지원사업 공고를 사장님에게 보낼 안내 문장으로 줄이는 사람입니다.",
  "[공고]에 적힌 낱말만 씁니다. 공고에 없는 업종·자격·금리·금액·전화번호·사이트 이름은 쓰지 않고, 공고 문구를 풀어서 설명하거나 효과를 덧붙이지 않습니다. 모르는 항목은 그 문장을 통째로 뺍니다.",
  "출력: 한 문단, 평서문 3~4문장, 전체 200자 안쪽, 줄바꿈·머리말·따옴표·기호 없음.",
  "① 누가 신청할 수 있는지(한 문장) ② 무엇을 지원하는지(금액·금리가 공고에 있으면 숫자 그대로, 가장 중요한 것만) ③ 어디서 어떻게 신청하는지(기관 이름과 방법만. 도로명 주소·접수 날짜는 쓰지 않음) ④ 공고에 전화번호가 있으면 마지막에 '문의 전화번호' 형식으로 하나만.",
].join("\n");

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function vaultValue(url: string, svc: string, fn: string): Promise<string> {
  const r = await fetch(url + "/rest/v1/rpc/" + fn, {
    method: "POST",
    headers: { apikey: svc, Authorization: "Bearer " + svc, "content-type": "application/json" },
    body: "{}",
  });
  const v = r.ok ? await r.json() : "";
  return typeof v === "string" ? v : "";
}

// @ts-ignore Deno 전역
Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return json(405, { error: "POST only" });
  // @ts-ignore Deno 전역
  const url = Deno.env.get("SUPABASE_URL") || "", svc = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  if (!url || !svc) return json(500, { error: "서버 설정 누락: SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY" });

  const secret = await vaultValue(url, svc, "fund_notices_secret");
  if (!secret) return json(500, { error: "Vault 에 fund_notices_secret 이 없습니다(공고조회_금고함수.sql 머리 참고)." });
  if (!safeEqual(req.headers.get("x-fund-notices-secret") || "", secret)) return json(401, { error: "인증 실패" });
  const bizKey = await vaultValue(url, svc, "fund_notices_bizinfo_key");
  if (!bizKey) return json(500, { error: "Vault 에 fund_notices_bizinfo_key 가 없습니다." });

  const rest = { apikey: svc, Authorization: "Bearer " + svc, "content-type": "application/json" };
  const today = kstYmd(Date.now());
  try {
    // ① 기업마당 — 지금 올라와 있는 공고 전부(한 번에 준다).
    const r = await fetch(BIZINFO_API + "?" + new URLSearchParams({ crtfcKey: bizKey, dataType: "json", searchCnt: "0" }).toString());
    if (!r.ok) return json(502, { error: "기업마당 응답 " + r.status });
    const raw = await r.json().catch(() => null);
    const list: any[] = Array.isArray(raw) ? raw : (raw && Array.isArray(raw.jsonArray) ? raw.jsonArray : []);
    // 0건은 반영하지 않는다 — 기업마당 쪽 장애로 빈 답이 와도 어제까지의 공고는 그대로 둔다.
    if (!list.length) return json(502, { error: "기업마당에서 공고를 받지 못했습니다(0건). 저장된 공고는 그대로 둡니다." });
    const rows = markDuplicates(list.filter((x) => x && x.pblancId && x.pblancNm).map(normalizeBizinfo).filter(isFundNotice));

    // ② 저장 — key 가 같으면 덮어쓴다(변경 공고 반영). summary 칸은 보내지 않아 그대로 남는다.
    let saved = 0;
    for (let i = 0; i < rows.length; i += 200) {
      const ins = await fetch(url + "/rest/v1/fund_notices?on_conflict=key", {
        method: "POST",
        headers: { ...rest, Prefer: "resolution=merge-duplicates,return=minimal" },
        body: JSON.stringify(rows.slice(i, i + 200).map((n: any) => toDbRow(n, today))),
      });
      if (!ins.ok) return json(500, { error: "fund_notices 저장 실패 " + ins.status + " — 공고조회_fund_notices.sql 을 먼저 실행했는지 확인하세요.", saved });
      saved += Math.min(200, rows.length - i);
    }
    // 기업마당에서 내려간 지 60일 넘은 공고는 지운다(목록이 끝없이 늘지 않게).
    const cutoff = kstYmd(Date.now() - 60 * 86400000);
    await fetch(url + "/rest/v1/fund_notices?source=eq.bizinfo&last_seen=lt." + cutoff, { method: "DELETE", headers: { ...rest, Prefer: "return=minimal" } });

    // ③ 오늘의 뉴스 12건.
    const digest: string[] = pickDigest(rows, today, 12);
    const byKey = new Map(rows.map((n: any) => [n.key, n]));

    // ④ 안내 문장 — 뉴스에 실린 공고 중 아직 문장이 없는 것만 새로 쓴다. AI 키가 없거나 실패해도 수집은 성공으로 친다
    //    (문장이 없으면 화면이 공고의 지원대상·신청방법·문의처를 그대로 이어 붙인다).
    let written = 0, rejected = 0, aiError = "";
    if (digest.length) {
      const have = await fetch(url + "/rest/v1/fund_notices?select=key&summary=not.is.null&key=in.(" + digest.map((k) => '"' + k + '"').join(",") + ")", { headers: rest });
      const done = new Set((have.ok ? await have.json() : []).map((x: any) => x.key));
      const todo = digest.filter((k) => !done.has(k));
      const aiKey = todo.length ? await vaultValue(url, svc, "fund_notices_ai_key") : "";
      if (todo.length && !aiKey) aiError = "fund_notices_ai_key 없음 — 안내 문장은 건너뜀";
      if (todo.length && aiKey) {
        const client = new Anthropic({ apiKey: aiKey, maxRetries: 1, timeout: 40000 });
        await Promise.all(todo.map(async (k) => {
          const src = summarySource(byKey.get(k));
          try {
            const m = await client.messages.create({
              model: AI_MODEL, max_tokens: 1200, system: AI_SYSTEM,
              // @ts-ignore 새 매개변수
              output_config: { effort: "low" },
              messages: [{ role: "user", content: "[공고]\n" + src }],
            });
            const text = (m.content || []).map((b: any) => (b.type === "text" ? b.text : "")).join("");
            const ok = acceptSummary(text, m.stop_reason, src);
            if (!ok) { rejected++; return; }
            const up = await fetch(url + "/rest/v1/fund_notices?key=eq." + encodeURIComponent(k), {
              method: "PATCH", headers: { ...rest, Prefer: "return=minimal" }, body: JSON.stringify({ summary: ok }),
            });
            if (up.ok) written++;
          } catch (e) {
            // 키가 섞이지 않게 종류만 남긴다.
            aiError = "안내 문장 호출 실패: " + String((e as any)?.status || (e as Error)?.name || "오류");
          }
        }));
      }
      const day = await fetch(url + "/rest/v1/fund_news_daily?on_conflict=news_date", {
        method: "POST", headers: { ...rest, Prefer: "resolution=merge-duplicates,return=minimal" },
        body: JSON.stringify([{ news_date: today, notice_keys: digest, updated_at: new Date().toISOString() }]),
      });
      if (!day.ok) return json(500, { error: "fund_news_daily 저장 실패 " + day.status, saved });
    }
    return json(200, { ok: true, date: today, fetched: list.length, saved, digest: digest.length, summaries_written: written, summaries_rejected: rejected, ai: aiError || "ok" });
  } catch (e) {
    return json(502, { error: String((e as Error)?.message || e).slice(0, 200) });
  }
});
