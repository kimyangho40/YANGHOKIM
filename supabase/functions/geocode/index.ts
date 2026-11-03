// Supabase Edge Function: 사업장 주소 → 좌표 (사업장 지도 마커용) — 2026-11-03
// 배포: SUPABASE_ACCESS_TOKEN=... npx supabase functions deploy geocode --project-ref ujdrjvnihxjvbkezjvwc --use-api
//
// 🔐 왜 Vercel(api/)이 아니라 여기인가
//   · 카카오 REST 키는 **Supabase Vault(암호화 금고, name=kakao_rest_api_key)** 에만 있다. 저장소(public)·브라우저 어디에도 없다.
//     이 함수가 service_role 로 public.geocode_kakao_key() 를 불러 꺼낸다(직원·anon 은 실행 권한 0). 함수 비밀값이 있으면 그걸 우선한다.
//     (Vercel 프로젝트는 형님 계정 소유라 환경변수를 넣을 수 없었다)
//   · 키 바꾸기: 저장소 밖 임시 SQL 로 vault.update_secret(id, '<새 키>') — 사업장지도_카카오키_금고함수.sql 머리 참고
//   · 호출 조건: 유효한 로그인 JWT(verify_jwt) + profiles.status='approved' (DB RLS is_approved() 와 같은 기준)
//   · 응답에는 좌표만 담는다. 키·카카오 원본 응답은 절대 돌려주지 않는다.
//
// 요청: POST { items: [{ id, address, region }] } (최대 20건)
// 응답: { provider: "kakao"|"osm", results: [{ id, ok, lat, lng, level: "address"|"region", query, error? }] }

// ⛳ geocode-helpers 시작 — 순수 함수(Deno·Node 둘 다에서 돈다). scripts/test-company-map.mjs 가 이 구간을 떼어내 실행한다.
function cleanAddress(s) {
  var t = String(s || "").trim();
  t = t.replace(/^\s*[([]?\s*\d{5}\s*[)\]]?\s*/, "");
  t = t.replace(/^(본점|본사|사업장|주소)\s*[:：]\s*/, "");
  t = t.replace(/\s*\([^)]*\)\s*$/, "");
  t = t.replace(/,.*$/, "");
  return t.replace(/\s+/g, " ").trim();
}
var DO_FULL = {
  "서울": "서울특별시", "부산": "부산광역시", "대구": "대구광역시", "인천": "인천광역시", "광주": "광주광역시",
  "대전": "대전광역시", "울산": "울산광역시", "세종": "세종특별자치시", "경기": "경기도", "강원": "강원특별자치도",
  "충북": "충청북도", "충남": "충청남도", "전북": "전북특별자치도", "전남": "전라남도", "경북": "경상북도",
  "경남": "경상남도", "제주": "제주특별자치도",
};
function cleanRegion(s) {
  var t = String(s || "").trim();
  t = t.replace(/\([^)]*\)/g, " ").replace(/^(본점|본사)\s*[:：]?\s*/, "");
  t = t.replace(/[_/·,]/g, " ").replace(/\s+/g, " ").trim();
  if (!t) return "";
  var w = t.split(" ");
  var head = w[0].replace(/(특별자치도|특별자치시|특별시|광역시|도|시)$/, "");
  if (DO_FULL[head]) w[0] = DO_FULL[head];
  return w.slice(0, 3).join(" ");
}
// CRM 지역은 "경기_시흥"처럼 시·군·구 글자를 뗀다 → 접미사를 붙인 후보부터 → 원문 → 시·도만.
function regionCandidates(reg) {
  var w = reg.split(" ");
  var out = [];
  var push = function(q) { if (q && out.indexOf(q) < 0) out.push(q); };
  if (w.length >= 2 && !/(시|군|구|읍|면|동)$/.test(w[1])) {
    var metro = /(특별시|광역시)$/.test(w[0]);
    var sfx = metro ? ["구", "군"] : (w[0] === "세종특별자치시" ? [] : ["시", "군", "구"]);
    sfx.forEach(function(s) { push([w[0], w[1] + s].concat(w.slice(2)).join(" ")); });
  }
  push(reg);
  push(w.slice(0, 2).join(" "));
  push(w[0]);
  return out;
}
function inKorea(lat, lng) {
  return isFinite(lat) && isFinite(lng) && lat >= 32.5 && lat <= 39.5 && lng >= 123.5 && lng <= 132.5;
}
function buildTries(item) {
  var tries = [];
  var addr = cleanAddress(item.address);
  if (addr) tries.push({ q: addr, level: "address" });
  var reg = cleanRegion(item.region);
  if (reg) regionCandidates(reg).forEach(function(q) { tries.push({ q: q, level: "region" }); });
  return { addr: addr, reg: reg, tries: tries };
}
// ⛳ geocode-helpers 끝

async function kakaoFind(query: string, key: string) {
  const h = { Authorization: "KakaoAK " + key };
  const enc = encodeURIComponent(query);
  const r = await fetch("https://dapi.kakao.com/v2/local/search/address.json?size=1&query=" + enc, { headers: h });
  if (r.status === 401 || r.status === 403) throw new Error("카카오 키가 맞지 않거나 카카오맵(로컬) 사용 설정이 꺼져 있습니다. (" + r.status + ")");
  if (r.ok) {
    const j = await r.json();
    const d = j && j.documents && j.documents[0];
    if (d) return { lat: parseFloat(d.y), lng: parseFloat(d.x) };
  }
  const r2 = await fetch("https://dapi.kakao.com/v2/local/search/keyword.json?size=1&query=" + enc, { headers: h });
  if (r2.ok) {
    const j2 = await r2.json();
    const d2 = j2 && j2.documents && j2.documents[0];
    if (d2) return { lat: parseFloat(d2.y), lng: parseFloat(d2.x) };
  }
  return null;
}

let lastOsm = 0;
async function osmFind(query: string) {
  const wait = 1100 - (Date.now() - lastOsm);
  if (wait > 0) await new Promise((ok) => setTimeout(ok, wait));
  lastOsm = Date.now();
  const r = await fetch("https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=kr&accept-language=ko&q=" + encodeURIComponent(query), {
    headers: { "User-Agent": "yanghokim-crm-geocode/1.0 (business map)" },
  });
  if (!r.ok) return null;
  const j = await r.json();
  if (!Array.isArray(j) || !j[0]) return null;
  return { lat: parseFloat(j[0].lat), lng: parseFloat(j[0].lon) };
}

// 키 출처: ① 함수 비밀값 KAKAO_REST_API_KEY(있으면 우선) ② Vault — public.geocode_kakao_key() 를 service_role 로 호출.
//   그 함수는 service_role 만 실행할 수 있다(사업장지도_카카오키_금고함수.sql). 인스턴스 안에서만 잠깐 캐시한다.
let cachedKey: string | null = null;
async function kakaoKey(url: string): Promise<string> {
  const envKey = Deno.env.get("KAKAO_REST_API_KEY");
  if (envKey) return envKey;
  if (cachedKey !== null) return cachedKey;
  const svc = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  if (!svc) return "";
  try {
    const r = await fetch(url + "/rest/v1/rpc/geocode_kakao_key", {
      method: "POST",
      headers: { apikey: svc, Authorization: "Bearer " + svc, "content-type": "application/json" },
      body: "{}",
    });
    const v = r.ok ? await r.json() : "";
    cachedKey = typeof v === "string" ? v : "";
  } catch (_e) {
    cachedKey = "";
  }
  return cachedKey;
}

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "content-type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json(405, { error: "POST only" });

  // 승인된 계정인지 — 본인 JWT 로 profiles 를 읽는다(RLS 그대로, service_role 안 씀)
  const auth = req.headers.get("authorization") || "";
  const url = Deno.env.get("SUPABASE_URL") || "";
  const anon = Deno.env.get("SUPABASE_ANON_KEY") || "";
  if (!auth.startsWith("Bearer ")) return json(401, { error: "로그인이 필요합니다." });
  const userRes = await fetch(url + "/auth/v1/user", { headers: { apikey: anon, Authorization: auth } });
  if (!userRes.ok) return json(401, { error: "로그인이 만료되었습니다. 새로고침 후 다시 시도해주세요." });
  const user = await userRes.json();
  if (!user || !user.id) return json(401, { error: "로그인이 필요합니다." });
  const profRes = await fetch(url + "/rest/v1/profiles?select=status&id=eq." + encodeURIComponent(user.id), {
    headers: { apikey: anon, Authorization: auth },
  });
  const rows = profRes.ok ? await profRes.json() : [];
  if (!Array.isArray(rows) || !rows[0] || rows[0].status !== "approved") return json(403, { error: "관리자 승인 후 이용할 수 있습니다." });

  let body: any = {};
  try { body = await req.json(); } catch (_e) { body = {}; }
  const items = Array.isArray(body.items) ? body.items : [];
  const key = await kakaoKey(url);
  const max = key ? 20 : 2;
  if (items.length === 0) return json(400, { error: "items 가 비어 있습니다." });
  if (items.length > max) return json(400, { error: "한 번에 최대 " + max + "건까지 받을 수 있습니다." });

  const results = [];
  try {
    for (const it of items) {
      const plan = buildTries({ address: String(it?.address || "").slice(0, 200), region: String(it?.region || "").slice(0, 60) });
      if (plan.tries.length === 0) { results.push({ id: it?.id, ok: false, error: "주소·지역이 비어 있습니다." }); continue; }
      let hit = null;
      for (const t of plan.tries) {
        const r = key ? await kakaoFind(t.q, key) : await osmFind(t.q);
        if (r && inKorea(r.lat, r.lng)) { hit = { id: it?.id, ok: true, lat: r.lat, lng: r.lng, level: t.level, query: t.q }; break; }
      }
      results.push(hit || { id: it?.id, ok: false, error: "주소를 찾지 못했습니다: " + (plan.addr || plan.reg) });
    }
  } catch (e) {
    return json(502, { error: (e as Error).message || "좌표 조회 실패" });
  }
  return json(200, { provider: key ? "kakao" : "osm", results });
});
