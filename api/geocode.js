// Vercel 서버리스 함수: 사업장 주소 → 좌표 (사업장 지도 마커용)
// 위치: 프로젝트 루트의 api/geocode.js
// 환경변수 KAKAO_REST_API_KEY (카카오 디벨로퍼스 → 내 애플리케이션 → 앱 키 → REST API 키)
//   · 있으면 카카오 로컬 API(주소 검색 → 키워드 검색)로 찾는다 — 한국 도로명·지번 주소 정확도가 가장 높다.
//   · 없으면 OpenStreetMap Nominatim 으로 대신 찾는다 — 시·군·구 단위는 잘 맞지만 상세 주소는 자주 못 찾는다.
//     (Nominatim 이용 규칙: 초당 1건 · 식별 가능한 User-Agent. 그래서 키가 없으면 한 번에 2건만 받는다)
//
// 요청: POST { items: [{ id, address, region }] }  (최대 20건)
// 응답: { provider, results: [{ id, ok, lat, lng, level: "address"|"region", query, error? }] }
//   · 상세 주소가 있으면 상세 주소로 먼저 찾고, 못 찾으면 지역(region) 중심으로 대략 찍는다(level="region").
//   · 좌표 저장은 화면(App)이 사용자 본인 세션으로 한다 — 이 함수는 DB 를 건드리지 않는다.

// ── 인증 검사 (2026-07-28 보안조치 8) ────────────────────────────────────────
// ⚠️ ai-search·ai-company·summarize-kakao·voice-command·parse-credit 와 똑같은 블록. 고칠 때는 함께 고칠 것.
//    공유 모듈(api/_auth.mjs)로 빼면 Vercel 이 번들에 안 넣어 함수가 안 뜬다(FUNCTION_INVOCATION_FAILED).
const SUPABASE_URL = "https://ujdrjvnihxjvbkezjvwc.supabase.co";

async function denyUnauthorized(req, res) {
  const deny = (status, error) => { res.status(status).json({ error: error }); return true; };

  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) return deny(401, "로그인이 필요합니다.");
  const anonKey = req.headers["x-supabase-anon"] || "";
  if (!anonKey) return deny(401, "인증 정보가 없습니다.");

  let userRes;
  try {
    userRes = await fetch(SUPABASE_URL + "/auth/v1/user", {
      headers: { apikey: anonKey, Authorization: "Bearer " + token },
    });
  } catch (e) {
    return deny(503, "인증 서버에 연결할 수 없습니다.");
  }
  if (!userRes.ok) return deny(401, "로그인이 만료되었습니다. 새로고침 후 다시 시도해주세요.");
  const user = await userRes.json();
  if (!user || !user.id) return deny(401, "로그인이 필요합니다.");

  const profRes = await fetch(
    SUPABASE_URL + "/rest/v1/profiles?select=status&id=eq." + encodeURIComponent(user.id),
    { headers: { apikey: anonKey, Authorization: "Bearer " + token } }
  );
  if (!profRes.ok) return deny(403, "권한을 확인할 수 없습니다.");
  const rows = await profRes.json();
  if (!Array.isArray(rows) || !rows[0] || rows[0].status !== "approved") {
    return deny(403, "관리자 승인 후 이용할 수 있습니다.");
  }
  return false;
}

// ── 문자열 정리 ──────────────────────────────────────────────────────────────
// 상세 주소: 앞의 우편번호 "(50315)" · 뒤의 동·호수/괄호 설명은 검색을 방해하므로 뗀다.
function cleanAddress(s) {
  var t = String(s || "").trim();
  t = t.replace(/^\s*[([]?\s*\d{5}\s*[)\]]?\s*/, "");      // 우편번호
  t = t.replace(/^(본점|본사|사업장|주소)\s*[:：]\s*/, "");
  t = t.replace(/\s*\([^)]*\)\s*$/, "");                   // 끝 괄호 "(OO동, OO빌딩)"
  t = t.replace(/,.*$/, "");                               // 쉼표 뒤 동·호수
  return t.replace(/\s+/g, " ").trim();
}

// 지역: CRM 은 "경기_수원" · "서울시 강남구" · "경기 수원(본사)" 처럼 형식이 제각각이다.
const DO_FULL = {
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
  // "경기도" / "서울시" / "서울특별시" → 짧은 이름으로 맞춘 뒤 정식 이름으로
  var head = w[0].replace(/(특별자치도|특별자치시|특별시|광역시|도|시)$/, "");
  if (DO_FULL[head]) w[0] = DO_FULL[head];
  return w.slice(0, 3).join(" ");
}

// CRM 지역은 "경기_시흥"처럼 시·군·구 글자를 떼고 저장한다(parseRegion). 주소 검색은 "경기도 시흥시"라야 잘 맞으므로
// 접미사를 붙인 후보부터 → 원문 → 시·도만 순서로 시도한다. 중복 후보는 뺀다.
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

// ── 공급자 ───────────────────────────────────────────────────────────────────
function inKorea(lat, lng) {
  return isFinite(lat) && isFinite(lng) && lat >= 32.5 && lat <= 39.5 && lng >= 123.5 && lng <= 132.5;
}

async function kakaoFind(query, key) {
  var h = { Authorization: "KakaoAK " + key };
  var enc = encodeURIComponent(query);
  var r = await fetch("https://dapi.kakao.com/v2/local/search/address.json?size=1&query=" + enc, { headers: h });
  if (r.status === 401 || r.status === 403) throw new Error("카카오 키가 맞지 않거나 카카오맵(로컬) 사용 설정이 꺼져 있습니다. (" + r.status + ")");
  if (r.ok) {
    var j = await r.json();
    var d = j && j.documents && j.documents[0];
    if (d) return { lat: parseFloat(d.y), lng: parseFloat(d.x) };
  }
  // 주소 형식이 아니면(건물명·상호가 섞인 경우) 키워드 검색으로 한 번 더
  var r2 = await fetch("https://dapi.kakao.com/v2/local/search/keyword.json?size=1&query=" + enc, { headers: h });
  if (r2.ok) {
    var j2 = await r2.json();
    var d2 = j2 && j2.documents && j2.documents[0];
    if (d2) return { lat: parseFloat(d2.y), lng: parseFloat(d2.x) };
  }
  return null;
}

var lastNominatim = 0;
async function nominatimFind(query) {
  var wait = 1100 - (Date.now() - lastNominatim);
  if (wait > 0) await new Promise(function(ok) { setTimeout(ok, wait); });
  lastNominatim = Date.now();
  var r = await fetch("https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=kr&accept-language=ko&q=" + encodeURIComponent(query), {
    headers: { "User-Agent": "yanghokim-crm-geocode/1.0 (business map)" },
  });
  if (!r.ok) return null;
  var j = await r.json();
  if (!Array.isArray(j) || !j[0]) return null;
  return { lat: parseFloat(j[0].lat), lng: parseFloat(j[0].lon) };
}

async function findOne(item, key) {
  var tries = [];
  var addr = cleanAddress(item.address);
  if (addr) tries.push({ q: addr, level: "address" });
  var reg = cleanRegion(item.region);
  if (reg) {
    regionCandidates(reg).forEach(function(q) { tries.push({ q: q, level: "region" }); });
  }
  if (tries.length === 0) return { id: item.id, ok: false, error: "주소·지역이 비어 있습니다." };
  for (var i = 0; i < tries.length; i++) {
    var t = tries[i];
    var hit = key ? await kakaoFind(t.q, key) : await nominatimFind(t.q);
    if (hit && inKorea(hit.lat, hit.lng)) {
      return { id: item.id, ok: true, lat: hit.lat, lng: hit.lng, level: t.level, query: t.q };
    }
  }
  return { id: item.id, ok: false, error: "주소를 찾지 못했습니다: " + (addr || reg) };
}

// 키가 없으면 OSM 규칙(초당 1건)에 묶여 한 건에 최대 5~6초 걸린다 → 한 번에 2건 + 함수 제한 30초.
export const config = { maxDuration: 30 };

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  if (await denyUnauthorized(req, res)) return;

  var body = req.body || {};
  if (typeof body === "string") { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  var items = Array.isArray(body.items) ? body.items : [];
  var key = process.env.KAKAO_REST_API_KEY || "";
  var max = key ? 20 : 2;
  if (items.length === 0) return res.status(400).json({ error: "items 가 비어 있습니다." });
  if (items.length > max) return res.status(400).json({ error: "한 번에 최대 " + max + "건까지 받을 수 있습니다." });

  var results = [];
  try {
    for (var i = 0; i < items.length; i++) {
      var it = items[i] || {};
      results.push(await findOne({ id: it.id, address: String(it.address || "").slice(0, 200), region: String(it.region || "").slice(0, 60) }, key));
    }
  } catch (e) {
    return res.status(502).json({ error: e.message || "좌표 조회 실패" });
  }
  return res.status(200).json({ provider: key ? "kakao" : "osm", results: results });
}

export { cleanAddress, cleanRegion, regionCandidates, findOne };
