// Vercel 서버리스 함수: 전체 데이터 스냅샷으로 AI 검색 상담
// 위치: 프로젝트 루트의 api/ai-search.js
// 환경변수 ANTHROPIC_API_KEY 필요 (Vercel에 등록됨)
//
// 예시 질문: "이번달 부결 정리해줘", "만기임박 업체는?", "이번주 신규 등록 업체"
// 보안: API 키는 이 서버 함수에만 존재. 프런트가 조립한 경량 스냅샷(민감정보 제외)만 전달.

// ── 인증 검사 (2026-07-28 보안조치 8) ────────────────────────────────────────
// ⚠️ 5개 엔드포인트(ai-search·ai-company·summarize-kakao·voice-command·parse-credit)에
//    똑같은 블록이 들어 있다. 고칠 때는 5개를 함께 고칠 것.
//    공유 모듈(api/_auth.mjs)로 뺐다가 되돌렸다 — Vercel이 api/ 안의 `_` 시작 파일을
//    배포 번들에 넣지 않아 함수가 아예 뜨지 못했다(FUNCTION_INVOCATION_FAILED 500).
//    서버리스 함수는 "파일 하나로 완결"이어야 안전하다.
//
// 검사: Supabase JWT 유효성 + profiles.status === 'approved' (DB RLS의 is_approved()와 같은 기준)
// 프런트(App.js callApi)가 Authorization / x-supabase-anon 두 헤더를 붙여 보낸다.
// anon key는 원래 브라우저에 공개되는 값이라 헤더로 받아도 문제없다.
const SUPABASE_URL = "https://ujdrjvnihxjvbkezjvwc.supabase.co";

// 통과하면 false, 막혔으면 응답까지 보내고 true를 돌려준다.
async function denyUnauthorized(req, res) {
  const deny = (status, error) => { res.status(status).json({ error: error }); return true; };

  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) return deny(401, "로그인이 필요합니다.");
  const anonKey = req.headers["x-supabase-anon"] || "";
  if (!anonKey) return deny(401, "인증 정보가 없습니다.");

  // 1) 토큰이 유효한 사용자 것인지
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

  // 2) 승인된 계정인지 (RLS가 걸려 있으므로 본인 토큰으로 조회)
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

const MODEL = "claude-sonnet-5";

// ── 집계는 DB 에 맡긴다 (2026-08-11) ─────────────────────────────────────────
// 스냅샷을 프롬프트에 통째로 실어도 모델은 29만 토큰 JSON 위에서 전수 필터·집계를 못 한다.
// 실측: "소진공 8월 부결 건수" → 0건 (정답 1건·칼라스토리). 데이터는 들어 있는데도 틀렸다.
// 조회형(특정 업체 상태)은 잘 맞으니 스냅샷은 그대로 두고, **세는 일만 DB 로 넘긴다.**
// 모델이 `query_crm_data` 도구로 필터 조건을 뱉으면 여기서 PostgREST 로 실제 count 를 받아 돌려준다.
//
// ⚠️ 보안 — 모델이 부르는 도구다. 임의 쿼리를 만들게 두면 안 된다:
//   · 테이블·칼럼은 아래 화이트리스트에 있는 것만. 비밀번호·인증서·주민번호·계좌(jsonb)는 뺐다.
//   · 조회는 **사용자 본인 JWT** 로 나간다 → RLS 가 그대로 적용된다(service_role 키 안 씀).
//   · `deleted_at is null` 은 모델이 못 건드리게 서버가 항상 강제한다.
const TABLES = {
  "기관진행": {
    table: "agency_cases",
    cols: ["business_name", "representative", "agency_group", "agency_sub", "status", "result", "result_reason",
      "assignee", "region", "branch", "request_amount", "request_fund", "fund_product", "approval_amount",
      "approval_date", "apply_date", "contract_date", "contract_fee", "commission_fee", "received_amount",
      "invoice_issued", "invoice_date", "fee_received", "fee_received_date", "settlement_notes", "notes",
      "extra_notes", "credit_score", "employee_count", "industry", "year", "month", "created_at", "updated_at",
      "script_delivered", "phone_education_done"],
    alias: {},
  },
  "업체목록": {
    table: "companies",
    cols: ["name", "type", "representative", "stage", "assignee", "agency", "agency_list", "region", "industry",
      "business_type", "last_contact", "next_contact", "call_count", "fee", "fee_status", "contract_status",
      "contract_status_at", "contract_date", "fund_plan", "received_docs", "requested_docs", "issue",
      "next_action", "company_info_memo", "stagnant_days", "stage_updated_at", "employee_count",
      "credit_score", "credit_score_kcb", "credit_score_nice", "founded_year", "founded_month",
      "application_month", "revenue_2023", "revenue_2024", "revenue_2025", "revenue_2026_h1",
      "approved_amount", "import_ratio", "debt_ratio", "interest_coverage_ratio", "innovation_field",
      "social_enterprise", "referrer", "lead_source", "team", "created_at", "updated_at"],
    // 스냅샷이 쓰는 한글 키를 그대로 받아준다(모델이 <데이터>에서 본 이름으로 물어보므로).
    alias: { "이슈현황": "issue", "차기업무": "next_action", "비고메모": "company_info_memo" },
  },
  "정산": {
    table: "settlement_manual",
    cols: ["business_name", "agency_group", "assignee", "year", "month", "request_amount", "contract_fee",
      "commission_fee", "received_amount", "approval_amount", "approval_date", "contract_date",
      "invoice_issued", "invoice_date", "fee_received", "fee_received_date", "settlement_notes",
      "created_at", "updated_at"],
    alias: {},
  },
};

const OPS = {
  eq: "eq", neq: "neq", gt: "gt", gte: "gte", lt: "lt", lte: "lte",
  contains: "ilike", starts: "ilike", in: "in", is_null: "is", not_null: "not.is",
};

// PostgREST 값 표기.
//
// ⚠️⚠️ 큰따옴표를 쓰는 자리와 쓰면 안 되는 자리가 **다르다.** (2026-08-15 실측으로 확정)
//   · 최상위 조건 `col=op.값`  → **따옴표를 붙이면 안 된다.** 붙이면 따옴표째 값으로 취급돼
//                                항상 0건이 된다. 에러가 아니라 200 + 0건이라 알아채기 어렵다.
//   · `in.(...)` / `or=(...)` 안 → 콤마·괄호가 구분자라 **따옴표로 감싸야** 안전하다(감싸도 정상 동작).
//
//   실측 (같은 토큰·같은 조건으로 PostgREST 에 직접 질의):
//     companies  name=eq."(주)엘케이네스트코리아"          → 0건   ❌
//     companies  name=eq.(주)엘케이네스트코리아            → 1건   ✅
//     agency_cases agency_group=eq."소상공인시장진흥공단"  → 0건   ❌
//     agency_cases agency_group=eq.소상공인시장진흥공단    → 767건 ✅
//     agency_cases status=eq."부결" → 0건 ❌ / status=eq.부결 → 301건 ✅
//     in.("부결","진행 중") → 416건 ✅ (따옴표 있어도 정상)
//     or=(status.eq."부결",result.eq."부결") → 303건 ✅ (따옴표 있어도 정상)
//
//   이 버그 때문에 AI 상담의 **모든 문자열 필터가 언제나 0건**이었다. 그래서 특정 업체를
//   물으면 모델이 필터를 바꿔가며 헛돌다 글 없이 끝나 화면에 "(빈 응답)"이 떴다.
//   집계도 실제로는 0건을 받고 있었다("집계를 DB 에 위임"이 사실상 동작하지 않았다).
//
// ⚠️ 인코딩은 따옴표와 무관하게 **항상** 한다. ilike 패턴의 `%` 를 날것으로 두면 URL 이스케이프로
//    읽혀 값이 깨진다(예: "%AB%" → 0xAB 바이트). 구분자(점·콤마·괄호)는 밖에 두고 값만 인코딩한다.
function pgVal(v, quoted) {
  var s = String(v).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  var enc = encodeURIComponent(s);
  return quoted ? '"' + enc + '"' : enc;
}
// op + 값 → PostgREST 조건 문자열.
// quoted=true 는 `or=(...)` 안에 넣을 때만 준다(구분자 충돌 방지). 최상위 조건은 false.
function pgCond(op, value, quoted) {
  if (op === "is_null") return "is.null";
  if (op === "not_null") return "not.is.null";
  if (op === "in") {
    // in.(...) 목록은 콤마가 구분자라 **항상** 따옴표로 감싼다(감싸도 정상 동작함을 실측).
    var arr = Array.isArray(value) ? value : [value];
    return "in.(" + arr.map(function(v) { return pgVal(v, true); }).join(",") + ")";
  }
  if (op === "contains") return "ilike." + pgVal("%" + value + "%", quoted);
  if (op === "starts") return "ilike." + pgVal(value + "%", quoted);
  if (typeof value === "boolean" || value === "true" || value === "false") return OPS[op] + "." + String(value);
  if (typeof value === "number") return OPS[op] + "." + value;
  return OPS[op] + "." + pgVal(value, quoted);
}

// ── 업체명 흔들림 흡수 (2026-08-15) ─────────────────────────────────────────
// 사람은 업체명을 매번 조금씩 다르게 친다: "주식회사 엘케이에네스트코리아" vs
// 실제 이름 "(주)엘케이네스트코리아". `ilike '%...%'` 는 이걸 못 잡아 **0건**이 되고,
// 모델은 "없다"고 답하는 대신 필터를 바꿔가며 계속 재조회해 라운드를 통째로 태운다
// (2026-08-15 실측: 도구 12회 호출 → 라운드 소진 → 빈 응답).
// → 0건일 때 **비슷한 이름 후보를 같이 돌려줘** 모델이 한 번에 제 이름을 찾게 한다.
//
// ⚠️ 후보는 조회 대상 자체를 바꾸지 않는다 — 어디까지나 "이 이름 아니었나요?" 힌트다.
//    조회 결과를 임의로 넓히면 모델이 엉뚱한 업체를 그 업체라고 단정할 수 있다.
const CORP_WORDS = /\(주\)|\(유\)|㈜|㈐|주식회사|유한회사|유한책임회사|합자회사|합명회사|농업회사법인|영농조합법인|사회적협동조합|협동조합|사단법인|재단법인/g;
function normName(s) {
  return String(s == null ? "" : s).replace(CORP_WORDS, "")
    .replace(/[\s\-_.,·'"()[\]{}/\\]/g, "").toLowerCase();
}
// 문자 단위 편집거리. 업체명은 짧아(대개 20자 이내) 이 정도면 충분히 빠르다.
function editDistance(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  var prev = new Array(b.length + 1);
  for (var j = 0; j <= b.length; j++) prev[j] = j;
  for (var i = 1; i <= a.length; i++) {
    var cur = [i];
    for (var k = 1; k <= b.length; k++) {
      cur[k] = Math.min(prev[k] + 1, cur[k - 1] + 1, prev[k - 1] + (a[i - 1] === b[k - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[b.length];
}
// 정규화 후 편집거리로 후보를 고른다. 한쪽이 다른 쪽을 통째로 포함하면 강한 후보로 본다.
// (named export 는 테스트용. Vercel 은 default export 만 본다.)
export function similarNames(q, names, cap) {
  var nq = normName(q);
  if (nq.length < 2) return [];
  var out = [];
  for (var i = 0; i < (names || []).length; i++) {
    var nn = normName(names[i]);
    if (!nn) continue;
    var score;
    if (nn === nq) score = 1;
    else if (nn.indexOf(nq) >= 0 || nq.indexOf(nn) >= 0) score = 0.92;
    else score = 1 - editDistance(nq, nn) / Math.max(nq.length, nn.length);
    if (score >= 0.62) out.push({ name: names[i], score: score });
  }
  out.sort(function(a, b) { return b.score - a.score; });
  var seen = {}, picked = [];
  for (var m = 0; m < out.length && picked.length < (cap || 8); m++) {
    if (seen[out[m].name]) continue;
    seen[out[m].name] = 1;
    picked.push(out[m].name);
  }
  return picked;
}

// 도구 실행: 필터를 검증해 PostgREST 로 진짜 세어 온다.
// 반환값이 {error:...} 면 모델에게 그대로 돌려줘 스스로 고쳐 다시 부르게 한다.
// hints.names[table] = 그 표에 실제로 있는 이름 목록(스냅샷에서 뽑음) — 0건일 때만 쓴다.
// (named export 는 테스트용. Vercel 은 default export 만 본다.)
export async function runQuery(input, creds, hints) {
  var spec = TABLES[input && input.table];
  if (!spec) return { error: "table 은 " + Object.keys(TABLES).join(" / ") + " 중 하나여야 합니다." };

  var resolve = function(f) {
    var name = spec.alias[f] || f;
    return spec.cols.indexOf(name) >= 0 ? name : null;
  };
  var params = ["deleted_at=is.null"]; // 모델이 못 바꾸는 고정 조건

  // 0건일 때 "왜 0건인지" 힌트를 만들려고 두 가지를 따로 기억해 둔다.
  //   · nameTried  — 이름으로 거른 값들(비슷한 이름 후보를 뽑을 재료)
  //   · paramsNoDate — 기간(year/month/각종 date) 조건만 뺀 조건들(기간 때문인지 확인용)
  var nameTried = [];
  var paramsNoDate = ["deleted_at=is.null"];
  var isNameCol = function(c) { return c === "name" || c === "business_name" || c === "representative"; };
  var isDateCol = function(c) { return c === "year" || c === "month" || /_date$|^apply_|^approval_/.test(c); };

  var filters = Array.isArray(input.filters) ? input.filters : [];
  for (var i = 0; i < filters.length; i++) {
    var f = filters[i] || {};
    var col = resolve(f.field);
    if (!col) return { error: "'" + f.field + "' 는 " + input.table + " 에 없는(또는 조회할 수 없는) 필드입니다. 쓸 수 있는 필드: " + spec.cols.join(", ") };
    if (!OPS[f.op]) return { error: "op 는 " + Object.keys(OPS).join(" / ") + " 중 하나여야 합니다." };
    var piece = encodeURIComponent(col) + "=" + pgCond(f.op, f.value, false); // 최상위 → 따옴표 금지
    params.push(piece);
    if (!isDateCol(col)) paramsNoDate.push(piece);
    if (isNameCol(col) && typeof f.value === "string" && f.value.trim()) nameTried.push(f.value.trim());
  }

  // any_of: OR 묶음 하나. (예: status='부결' 또는 result='부결')
  var anyOf = Array.isArray(input.any_of) ? input.any_of : [];
  if (anyOf.length) {
    var parts = [];
    for (var j = 0; j < anyOf.length; j++) {
      var a = anyOf[j] || {};
      var ac = resolve(a.field);
      if (!ac) return { error: "'" + a.field + "' 는 " + input.table + " 에 없는(또는 조회할 수 없는) 필드입니다. 쓸 수 있는 필드: " + spec.cols.join(", ") };
      if (!OPS[a.op]) return { error: "op 는 " + Object.keys(OPS).join(" / ") + " 중 하나여야 합니다." };
      parts.push(ac + "." + pgCond(a.op, a.value, true));  // or=(...) 안 → 따옴표 필요
      if (isNameCol(ac) && typeof a.value === "string" && a.value.trim()) nameTried.push(a.value.trim());
    }
    params.push("or=(" + parts.join(",") + ")");
    paramsNoDate.push("or=(" + parts.join(",") + ")"); // any_of 는 기간 조건으로 잘 안 쓰므로 그대로 둔다
  }

  var headers = { apikey: creds.anonKey, Authorization: "Bearer " + creds.token };
  var base = SUPABASE_URL + "/rest/v1/" + spec.table + "?";

  // ── 그룹별 집계: 그 칼럼만 전건 받아 JS 로 센다 (PostgREST 는 GROUP BY 가 없다) ──
  var groups = null, groupNote = "";
  var gcol = input.group_by ? resolve(input.group_by) : null;
  if (input.group_by && !gcol) {
    return { error: "'" + input.group_by + "' 는 " + input.table + " 에 없는(또는 조회할 수 없는) 필드입니다. 쓸 수 있는 필드: " + spec.cols.join(", ") };
  }
  if (gcol) {
    var tally = {}, offset = 0, guard = 0;
    // assignee 는 "양호, 미현, 인선" 처럼 콤마로 여러 명이 들어 있다 → 1인씩 쪼개 센다.
    var split = gcol === "assignee";
    for (;;) {
      // ⚠️ order 를 안 걸면 Range 페이징이 흔들려 같은 행을 두 번 세거나 빠뜨린다
      //    (agency_cases 는 1732건이라 실제로 페이징된다). id 로 순서를 고정한다.
      var gr = await fetch(base + params.join("&") + "&select=" + encodeURIComponent(gcol) + "&order=id.asc",
        { headers: Object.assign({}, headers, { Range: offset + "-" + (offset + 999) }) });
      if (!gr.ok) return { error: "조회 실패: " + (await gr.text()).slice(0, 200) };
      var grows = await gr.json();
      if (!Array.isArray(grows)) return { error: "조회 실패: 예기치 않은 응답" };
      for (var k = 0; k < grows.length; k++) {
        var raw = grows[k][gcol];
        var keys = raw == null || raw === "" ? ["(값 없음)"]
          : split ? String(raw).split(/[,、·\/]/).map(function(s) { return s.trim(); }).filter(Boolean)
          : [String(raw)];
        for (var m = 0; m < keys.length; m++) tally[keys[m]] = (tally[keys[m]] || 0) + 1;
      }
      if (grows.length < 1000) break;
      offset += 1000;
      if (++guard > 20) break;
    }
    groups = Object.keys(tally).sort(function(a, b) { return tally[b] - tally[a]; })
      .slice(0, 60).map(function(key) { return { 값: key, 건수: tally[key] }; });
    if (split) groupNote = " (담당자는 공동담당이 콤마로 묶여 있어 1인씩 나눠 셌습니다 — 합계는 건수 총합보다 클 수 있습니다.)";
  }

  // ── 건수 + 표본 행 ────────────────────────────────────────────────────────
  // ⚠️ `parseInt(...) || 40` 로 쓰면 limit:0(건수만) 이 40 으로 되살아난다 — 명시적으로 판정한다.
  var rawLimit = input.limit == null ? 40 : parseInt(input.limit, 10);
  if (!isFinite(rawLimit)) rawLimit = 40;
  var limit = Math.min(Math.max(rawLimit, 0), 200);
  var selCols = Array.isArray(input.select) && input.select.length
    ? input.select.map(resolve).filter(Boolean)
    : null;
  var sel = selCols && selCols.length ? selCols : spec.cols;
  var ordCol = input.order_by ? resolve(input.order_by) : null;
  var order = (ordCol || "created_at") + "." + (input.order_desc === false ? "asc" : "desc") + ".nullslast";

  var r = await fetch(base + params.join("&") + "&select=" + encodeURIComponent(sel.join(",")) + "&order=" + order, {
    headers: Object.assign({}, headers, { Range: "0-" + Math.max(limit - 1, 0), Prefer: "count=exact" }),
  });
  if (!r.ok) return { error: "조회 실패: " + (await r.text()).slice(0, 200) };
  var rows = await r.json();
  if (!Array.isArray(rows)) return { error: "조회 실패: 예기치 않은 응답" };

  // Content-Range: "0-39/1732" 또는 "*/0"
  var cr = r.headers.get("content-range") || "";
  var total = parseInt((cr.split("/")[1] || ""), 10);
  if (!isFinite(total)) total = rows.length;

  // 빈 값은 빼서 토큰을 아낀다(스냅샷 compact 와 같은 규칙). 한글 키는 되돌려 준다.
  var rev = {};
  Object.keys(spec.alias).forEach(function(kr) { rev[spec.alias[kr]] = kr; });
  var slim = limit === 0 ? [] : rows.map(function(row) {
    var out = {};
    Object.keys(row).forEach(function(kk) {
      var v = row[kk];
      if (v == null || v === "") return;
      if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}T/.test(v)) v = v.slice(0, 10);
      out[rev[kk] || kk] = v;
    });
    return out;
  });

  // ── 0건이면 "왜 0건인지"를 같이 준다 ──────────────────────────────────────
  // 그냥 0건만 돌려주면 모델이 필터를 바꿔가며 계속 재조회해 라운드를 태우고,
  // 끝내 글 답변 없이 끝나 화면에 "(빈 응답)"이 뜬다(2026-08-15 장애의 실제 경로).
  // 여기서 **다음에 뭘 해야 하는지**를 알려주면 대개 한 번 더 부르는 것으로 끝난다.
  var zero = null;
  if (total === 0) {
    zero = {};
    // (1) 이름이 조금 달라서 0건인가 — 비슷한 이름 후보
    var pool = (hints && hints.names && hints.names[input.table]) || [];
    var cand = [];
    for (var t = 0; t < nameTried.length; t++) {
      cand = cand.concat(similarNames(nameTried[t], pool, 8));
    }
    cand = cand.filter(function(v, idx) { return cand.indexOf(v) === idx; }).slice(0, 8);
    if (cand.length) zero.비슷한_이름 = cand;
    // (2) 기간 때문에 0건인가 — 기간 조건만 빼고 다시 세어 본다
    if (paramsNoDate.length < params.length) {
      try {
        var r2 = await fetch(base + paramsNoDate.join("&") + "&select=" + encodeURIComponent(sel.join(",")) +
          "&order=" + order, { headers: Object.assign({}, headers, { Range: "0-9", Prefer: "count=exact" }) });
        if (r2.ok) {
          var cr2 = r2.headers.get("content-range") || "";
          var t2 = parseInt((cr2.split("/")[1] || ""), 10);
          if (isFinite(t2) && t2 > 0) {
            zero.기간조건_빼면 = t2;
            var rows2 = await r2.json();
            if (Array.isArray(rows2)) {
              zero.기간조건_뺀_표본 = rows2.slice(0, 10).map(function(row) {
                var o = {};
                Object.keys(row).forEach(function(kk) {
                  var v = row[kk];
                  if (v == null || v === "") return;
                  if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}T/.test(v)) v = v.slice(0, 10);
                  o[rev[kk] || kk] = v;
                });
                return o;
              });
            }
          }
        }
      } catch (e) { /* 힌트는 실패해도 본 조회 결과에 영향을 주지 않는다 */ }
    }
    if (!Object.keys(zero).length) zero = null;
  }

  var zeroNote = "";
  if (zero && zero.비슷한_이름) {
    zeroNote += " 0건입니다. 이름이 조금 다를 수 있습니다 — '비슷한_이름' 에 실제로 있는 이름을 넣었으니, 그 중 맞는 이름으로 **다시 한 번** 조회하세요.";
  }
  if (zero && zero.기간조건_빼면) {
    zeroNote += " 기간 조건을 빼면 " + zero.기간조건_빼면 + "건 있습니다 — 물어본 달이 아닌 다른 달에 있는 건일 수 있으니 '기간조건_뺀_표본' 의 날짜를 확인해 그대로 알려주세요.";
  }

  return {
    table: input.table,
    건수: total,
    그룹별: groups,
    표본: slim,
    조건이_0건일때: zero,
    안내: (limit === 0 ? "행은 요청하지 않았습니다. " : total > slim.length ? "총 " + total + "건 중 " + slim.length + "건만 실었습니다. 더 필요하면 limit 을 올리거나 필터를 좁히세요. " : "")
      + "이 '건수'는 DB 에서 직접 센 값이라 정확합니다." + groupNote + zeroNote,
  };
}

// 스냅샷에서 실제 쓰이는 값 목록을 뽑아 프롬프트에 넣는다.
// 하드코딩하면 값이 늘 때 조용히 어긋난다 — 데이터에서 뽑으면 항상 최신이다.
function vocab(rows, field, cap, split) {
  var set = {};
  (rows || []).forEach(function(r) {
    var v = r && r[field];
    if (typeof v !== "string" || !v.trim()) return;
    var list = split ? v.split(/[,、·\/]/) : [v];
    list.forEach(function(s) { s = s.trim(); if (s) set[s] = 1; });
  });
  return Object.keys(set).sort().slice(0, cap);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "POST 요청만 허용됩니다." });
    return;
  }
  if (await denyUnauthorized(req, res)) return;

  try {
    const { question, snapshot, today, history } = req.body || {};
    if (!question || !String(question).trim()) {
      res.status(400).json({ error: "질문이 비어 있습니다." });
      return;
    }
    if (!snapshot) {
      res.status(400).json({ error: "데이터 스냅샷이 없습니다." });
      return;
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      res.status(500).json({ error: "서버에 API 키가 설정되지 않았습니다." });
      return;
    }

    // ── 프롬프트 캐싱 ────────────────────────────────────────────────────────
    // 스냅샷(수십만 토큰)이 질문마다 통째로 다시 올라간다. 캐시를 걸면 두 번째 질문부터
    // 그 부분의 입력비가 약 1/10 이 된다(쓰기 1.25배 → 읽기 0.1배, 5분 TTL 은 읽을 때마다 갱신).
    // ⚠️ 캐시는 '바이트 접두사 일치'다. 이 블록보다 앞이 한 글자라도 달라지면 통째로 깨진다:
    //    · 지시문을 고치면 그날 캐시는 한 번 다시 쓰인다(정상, 한 번이면 끝).
    //    · today 는 지시문 안에 있어 하루 한 번 바뀐다 — 하루 첫 질문만 캐시 쓰기다.
    //    · 스냅샷 JSON 의 키 순서가 흔들리면 매번 깨진다 → 프런트 compact() 가 순서를 유지한다.
    // 질문·대화이력은 messages 로 뒤에 붙으므로 캐시에 영향을 주지 않는다.
    const instructions = [
      "당신은 정책자금 컨설팅 회사의 내부 CRM에서 동작하는 AI 검색 상담원입니다.",
      "아래 <데이터>는 회사 전체 업체/기관진행/정산 현황의 경량 스냅샷(JSON)입니다.",
      "사용자의 질문에 이 데이터만 근거로 답하세요. 데이터에 없으면 추측하지 말고 없다고 답하세요.",
      "오늘 날짜는 " + (today || "미상") + " 입니다. '이번달/이번주/만기임박' 같은 표현은 이 날짜를 기준으로 판단하세요.",
      "답변은 한국어로, 실무자가 바로 쓰기 좋게. 여러 건을 물으면 업체명 목록/표 형태로 정리하고 건수도 함께 밝히세요.",
      "금액·날짜·상태·기관명은 데이터 값을 그대로 인용하세요.",
      "",
      "업체목록의 메모/코멘트성 필드 — 담당자가 자유 서술로 적은 값이라 표현이 제각각입니다.",
      "  · 이슈현황: 지금 이 업체에서 걸려 있는 문제·특이사항 (화면의 '현재 이슈')",
      "  · 차기업무: 다음에 할 일/기한 (화면의 '차기 업무·다음 액션')",
      "  · 비고메모: 기업정보 탭의 자유 메모",
      "이 세 필드는 정해진 코드값이 아니라 사람이 쓴 문장이므로, 키워드가 정확히 일치하지 않아도 뜻이 통하면 해당됩니다.",
      "이슈/특이사항/문제/진행상황을 묻는 질문은 이 필드들을 근거로 답하고, 인용할 때는 적힌 문장을 그대로 옮기세요.",
      "값 끝에 '…(이하 생략)'이 붙어 있으면 원문이 잘린 것이니, 필요하면 업체 상세에서 전체를 확인하라고 안내하세요.",
      "필드가 비어 있는 업체는 '이슈 없음'이 아니라 '적힌 내용 없음'입니다. 둘을 구분해서 말하세요.",
      "값이 비어 있는 필드는 아예 빠진 채로 옵니다 — 키가 없으면 '그 항목에 적힌 내용이 없다'는 뜻입니다.",
      "",
      "■ 건수·목록을 물으면 반드시 `query_crm_data` 도구를 쓰세요 (가장 중요).",
      "<데이터>는 양이 많아 눈으로 훑어 세면 틀립니다. 실제로 '0건'이라고 답했다가 정답이 1건이었던 사고가 있었습니다.",
      "  · '몇 건', '전부/모두', '정리해줘', '목록', '담당자별/기관별/월별' → 도구로 세고, 도구가 준 '건수'를 그대로 답하세요.",
      "  · 도구를 쓰지 않고 스냅샷만 보고 건수를 말하지 마세요. 세어 보기 전에는 '없다'고 단정하지 마세요.",
      "  · 특정 업체 한 곳의 상태·메모처럼 조회형 질문은 <데이터>만으로 답해도 됩니다.",
      "  · 도구가 error 를 주면 안내에 맞춰 필드·연산자를 고쳐 다시 부르세요.",
      "",
      "■ 0건이 나왔을 때 (중요)",
      "사용자는 업체명을 조금씩 다르게 적습니다(예: '주식회사 엘케이에네스트코리아' ↔ 실제 '(주)엘케이네스트코리아').",
      "  · 도구 결과의 `조건이_0건일때.비슷한_이름` 에는 **DB 에 실제로 있는 이름**이 들어 있습니다.",
      "    맞는 이름이 보이면 그 이름으로 한 번 더 조회한 뒤, 답변 첫 줄에 '입력하신 이름과 조금 달라",
      "    (주)○○○ 로 찾았습니다' 처럼 어떤 이름으로 찾았는지 반드시 밝히세요.",
      "  · `조건이_0건일때.기간조건_빼면` 이 있으면 그 달에는 없고 **다른 달에 있는** 건입니다.",
      "    `기간조건_뺀_표본` 의 실제 날짜를 확인해 '8월에는 없고 7월에 신청된 건이 있습니다'처럼 알려주세요.",
      "  · 같은 조건을 조금씩 바꿔 계속 재조회하지 마세요. 두세 번 해서 안 나오면, 무엇을 찾아 몇 건이었는지와",
      "    비슷한 후보를 **글로 정리해 답하세요.** 답을 못 찾아도 반드시 글로 답해야 합니다(빈 응답 금지).",
      "",
      "필터 값을 고를 때 주의할 점:",
      "  · 사용자는 줄임말로 말합니다. 기관명은 아래 '실제 값' 목록에서 골라 쓰세요.",
      "    예: '소진공' → agency_group 은 '소상공인시장진흥공단' 입니다. 확실치 않으면 contains 로 부분 일치시키세요.",
      "  · assignee(담당자)는 '양호, 미현, 인선' 처럼 공동담당이 한 칸에 콤마로 들어 있습니다.",
      "    담당자로 거를 때는 eq 가 아니라 반드시 contains 를 쓰세요 (eq 로 세면 크게 누락됩니다).",
      "  · '부결'처럼 결과를 뜻하는 말은 status 에도 result 에도 들어갑니다 → any_of 로 두 필드를 함께 보세요.",
      "  · 금액 필드(request_amount 등)는 문자열이라 크기 비교(gt/lt)가 부정확합니다. 합계·대소 비교는 피하고 값을 그대로 인용하세요.",
      "  · 기관진행/정산의 기간은 year·month(정수) 입니다. '이번달'은 오늘 날짜 기준 year·month 로 거세요.",
      "",
      "실제 값 목록(데이터에서 뽑은 것):",
      "  기관진행.agency_group: " + vocab(snapshot.기관진행, "agency_group", 40).join(" | "),
      "  기관진행.status: " + vocab(snapshot.기관진행, "status", 60).join(" | "),
      "  기관진행.result: " + vocab(snapshot.기관진행, "result", 40).join(" | "),
      "  정산.agency_group: " + vocab(snapshot.정산, "agency_group", 40).join(" | "),
      "  업체목록.stage: " + vocab(snapshot.업체목록, "stage", 40).join(" | "),
      "  업체목록.fee_status: " + vocab(snapshot.업체목록, "fee_status", 20).join(" | "),
      "  담당자(1인 단위): " + vocab((snapshot.기관진행 || []).concat(snapshot.업체목록 || []), "assignee", 40, true).join(" | "),
    ].join("\n");

    const tools = [{
      // ⚠️ 도구 이름은 **ASCII 만** 쓸 수 있다 — Anthropic 스키마가 `^[a-zA-Z0-9_-]{1,128}$` 로 강제한다.
      //    한글로 두면 요청 자체가 400 으로 거절된다(2026-08-14 장애):
      //      tools.0.custom.name: String should match pattern '^[a-zA-Z0-9_-]{1,128}$'
      //    → 화면엔 그 문구만 뜨고 AI 상담이 통째로 죽는다(집계 위임 기능 전체가 못 뜬다).
      //    사람이 읽는 설명은 description 에 한글로 넣으면 되므로 이름을 한글로 할 이유가 없다.
      //    ⚠️ 이름을 바꾸면 아래 시스템 프롬프트의 `query_crm_data` 언급도 **같이** 고칠 것.
      //       한쪽만 고치면 모델이 없는 도구를 부르려 한다.
      name: "query_crm_data",
      description: [
        "CRM 데이터베이스에서 조건에 맞는 건수를 실제로 세고 표본 행을 가져옵니다.",
        "건수·목록·그룹별 집계 질문에는 반드시 이 도구를 쓰세요. 여기서 나온 '건수'가 정답입니다.",
        "삭제된 건은 자동으로 제외됩니다. 필요하면 조건을 바꿔 여러 번 불러도 됩니다.",
        "filters 는 AND 로, any_of 는 그들끼리 OR 로 묶인 뒤 filters 와 AND 됩니다.",
        "쓸 수 있는 필드는 table 마다 다릅니다 — 틀리면 error 로 목록을 돌려줍니다.",
      ].join(" "),
      input_schema: {
        type: "object",
        properties: {
          table: { type: "string", enum: Object.keys(TABLES), description: "조회할 대상" },
          filters: {
            type: "array",
            description: "AND 로 묶이는 조건들",
            items: {
              type: "object",
              properties: {
                field: { type: "string", description: "필드명" },
                op: { type: "string", enum: Object.keys(OPS), description: "contains=부분일치(대소문자 무시), starts=접두일치, in=여러 값 중 하나, is_null/not_null=값 유무" },
                value: { description: "비교할 값. in 이면 배열, is_null/not_null 이면 생략" },
              },
              required: ["field", "op"],
            },
          },
          any_of: {
            type: "array",
            description: "이들끼리는 OR. 예: status 나 result 중 하나라도 '부결'",
            items: {
              type: "object",
              properties: {
                field: { type: "string" },
                op: { type: "string", enum: Object.keys(OPS) },
                value: {},
              },
              required: ["field", "op"],
            },
          },
          group_by: { type: "string", description: "이 필드 값별로 건수를 나눠 셉니다(담당자별·기관별·월별 등). assignee 는 공동담당을 1인씩 나눠 셉니다." },
          select: { type: "array", items: { type: "string" }, description: "표본 행에 담을 필드. 생략하면 전부. 답변에 쓸 것만 고르면 응답이 가벼워집니다." },
          limit: { type: "integer", description: "표본 행 수 (기본 40, 최대 200). 건수만 필요하면 0." },
          order_by: { type: "string", description: "표본 정렬 기준 필드 (기본 created_at)" },
          order_desc: { type: "boolean", description: "내림차순 여부 (기본 true)" },
        },
        required: ["table"],
      },
    }];

    const system = [
      { type: "text", text: instructions },
      {
        type: "text",
        text: "<데이터>\n" + JSON.stringify(snapshot) + "\n</데이터>",
        cache_control: { type: "ephemeral" },
      },
    ];

    const messages = [];
    if (Array.isArray(history)) {
      for (const m of history) {
        if (m && (m.role === "user" || m.role === "assistant") && m.content) {
          messages.push({ role: m.role, content: String(m.content) });
        }
      }
    }
    messages.push({ role: "user", content: String(question) });

    // 도구 조회는 **사용자 본인 토큰**으로 나간다 → RLS 가 그대로 걸린다.
    // (denyUnauthorized 는 5개 엔드포인트에 같은 내용으로 복사돼 있어 시그니처를 건드리지 않았다.)
    const creds = {
      token: (req.headers.authorization || "").slice(7),
      anonKey: req.headers["x-supabase-anon"] || "",
    };

    // 0건일 때 "비슷한 이름"을 뽑을 재료 — 스냅샷에 실제로 있는 이름들.
    // DB 를 다시 읽지 않는다(스냅샷이 이미 전건이다).
    const uniqNames = function(rows, key) {
      var seen = {}, out = [];
      (rows || []).forEach(function(r) {
        var v = r && r[key];
        if (typeof v === "string" && v.trim() && !seen[v]) { seen[v] = 1; out.push(v); }
      });
      return out;
    };
    const hints = { names: {
      "업체목록": uniqNames(snapshot.업체목록, "name"),
      "기관진행": uniqNames(snapshot.기관진행, "business_name"),
      "정산": uniqNames(snapshot.정산, "business_name"),
    } };

    // ── 도구 루프 ────────────────────────────────────────────────────────────
    // 모델이 `query_crm_data` 를 부르면 실제로 세어 결과를 돌려주고 다시 묻는다.
    // tools/system 은 messages 보다 앞이라 캐시 접두사 안이다 → 루프를 돌아도 캐시는 살아 있다.
    //
    // ⚠️ 도구 라운드와 "마무리"를 절대 한 루프에 섞지 말 것 (2026-08-15 장애의 원인).
    //    예전 코드는 마지막 회차(round === MAX_ROUNDS)에만 tool_choice:none 을 걸었는데,
    //    그 회차의 응답에 text 블록이 없으면 그대로 answer="" 가 되어 화면에 "(빈 응답)"이 떴다.
    //    실측(2026-08-15, "주식회사 엘케이에네스트코리아 현황"): 도구 12회 · API 7회
    //    (cache_read 1,764,684 = 294,114 × 6) · output 2,318 토큰 → **길이 초과가 아니라
    //    "글 없이 끝난 응답"이 문제**였다. 그래서 아래처럼 나눈다:
    //      1) 도구 라운드는 tool_use 블록 유무로만 판단해서 돈다
    //      2) 글 답변이 없으면 도구를 막고 **따로** 한 번 더 물어 반드시 글로 받는다
    //      3) 그래도 없으면 조회한 내용을 사람이 읽을 수 있게 정리해 내보낸다(절대 빈 문자열 금지)
    const MAX_TOOL_ROUNDS = 6;
    const usageTotal = { input_tokens: 0, output_tokens: 0, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 };
    let data = null, toolCalls = 0;
    const trace = [];        // 무엇을 조회해 몇 건 나왔는지 (빈 응답일 때 사람에게 보여줄 재료)
    const stops = [];        // 회차별 stop_reason (원인 파악용 로그)

    // toolChoice=none 이면 도구를 못 부르고 반드시 글로 답한다 (마지막 마무리용).
    const ask = async function(toolChoice) {
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify(Object.assign({
          model: MODEL,
          // ⚠️ thinking 을 끄면(sonnet-5) **도구를 잘 안 부른다** — 공식 문서에 명시된 성질이다.
          //    이 기능은 "모델이 query_crm_data 를 부르는 것"이 전부라, 끄면 예전처럼 눈대중으로 답해 버린다.
          //    그래서 adaptive 로 켜고 effort 로 깊이만 낮춰 비용을 잡는다(질문당 출력 약간 증가).
          //    도구를 자꾸 안 부르면 effort 를 high 로 올릴 것. 반대로 비용이 부담이면 low.
          thinking: { type: "adaptive" },
          output_config: { effort: "medium" },
          // max_tokens 는 사고+답변 **합계** 상한이다. 3072 이면 사고가 먹고 답이 잘린다.
          max_tokens: 8192,
          system: system,
          tools: tools,
          messages: messages,
        }, toolChoice ? { tool_choice: toolChoice } : {})),
      });
      const d = await r.json();
      if (!r.ok) return { ok: false, status: r.status, msg: (d && d.error && d.error.message) || "AI 검색 요청 실패" };
      const u0 = d.usage || {};
      usageTotal.input_tokens += u0.input_tokens || 0;
      usageTotal.output_tokens += u0.output_tokens || 0;
      usageTotal.cache_creation_input_tokens += u0.cache_creation_input_tokens || 0;
      usageTotal.cache_read_input_tokens += u0.cache_read_input_tokens || 0;
      return { ok: true, data: d };
    };

    const textOf = function (d) {
      return ((d && d.content) || [])
        .filter(function (b) { return b.type === "text"; })
        .map(function (b) { return b.text; })
        .join("\n")
        .trim();
    };

    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      const resp = await ask(null);
      if (!resp.ok) { res.status(resp.status).json({ error: resp.msg }); return; }
      data = resp.data;
      stops.push(data.stop_reason);

      // ⚠️ stop_reason 이 아니라 **tool_use 블록 유무**로 판단한다.
      //    stop_reason 이 "tool_use" 가 아닌데 도구 블록이 들어 있는 응답(길이 초과 등)을
      //    예전 코드는 그냥 break 해서 글 없는 응답을 답으로 내보냈다.
      const uses = (data.content || []).filter(function (b) { return b.type === "tool_use"; });
      if (uses.length === 0) break;

      messages.push({ role: "assistant", content: data.content });
      const results = [];
      for (const use of uses) {
        toolCalls++;
        let out;
        try {
          out = await runQuery(use.input || {}, creds, hints);
        } catch (e) {
          out = { error: "조회 중 오류: " + (e && e.message ? e.message : String(e)) };
        }
        console.log("[ai-search] tool", JSON.stringify({ input: use.input, 건수: out && out.건수, error: out && out.error }));
        trace.push({
          table: (use.input && use.input.table) || "?",
          filters: (use.input && use.input.filters) || [],
          any_of: (use.input && use.input.any_of) || undefined,
          건수: out && out.건수,
          비슷한_이름: out && out.조건이_0건일때 && out.조건이_0건일때.비슷한_이름,
          기간조건_빼면: out && out.조건이_0건일때 && out.조건이_0건일때.기간조건_빼면,
          error: out && out.error,
        });
        results.push({
          type: "tool_result",
          tool_use_id: use.id,
          content: JSON.stringify(out),
          is_error: !!(out && out.error),
        });
      }
      messages.push({ role: "user", content: results });
    }

    // ── 마무리: 글 답변이 없으면 도구를 막고 한 번 더 물어 반드시 글로 받는다 ──
    let answer = textOf(data);
    if (!answer) {
      const fin = await ask({ type: "none" });
      if (fin.ok) { data = fin.data; stops.push(data.stop_reason); answer = textOf(data); }
      else stops.push("finish_failed:" + fin.status);
    }

    // ── 최후의 방어: 그래도 글이 없으면 **빈 문자열을 내보내지 않는다** ────────
    // 화면의 "(빈 응답)"은 사용자에게 아무것도 알려주지 않는다. 조회는 실제로 했으므로,
    // 무엇을 찾아 몇 건이었는지라도 정리해서 돌려준다(다음 행동을 알 수 있게).
    if (!answer) {
      const lines = ["죄송합니다. 이번 질문은 정리된 답변을 만들지 못했습니다.",
        "다만 조회는 실제로 했고, 결과는 아래와 같습니다."];
      if (!trace.length) lines.push("· (조회를 한 번도 하지 않았습니다)");
      trace.slice(0, 10).forEach(function (t) {
        var cond = (t.filters || []).map(function (f) { return f.field + " " + f.op + " " + JSON.stringify(f.value); }).join(", ");
        lines.push("· " + t.table + (cond ? " [" + cond + "]" : "") + " → " +
          (t.error ? "오류: " + t.error : t.건수 + "건"));
        if (t.비슷한_이름 && t.비슷한_이름.length) lines.push("   비슷한 이름: " + t.비슷한_이름.join(" / "));
        if (t.기간조건_빼면) lines.push("   기간 조건을 빼면 " + t.기간조건_빼면 + "건 있습니다");
      });
      var hinted = trace.filter(function (t) { return t.비슷한_이름 && t.비슷한_이름.length; });
      if (hinted.length) {
        lines.push("", "👉 위 '비슷한 이름' 중 맞는 이름으로 다시 물어봐 주세요.");
      } else {
        lines.push("", "👉 업체명을 정확히 적거나 기간을 넓혀 다시 물어봐 주세요.");
      }
      answer = lines.join("\n");
      console.warn("[ai-search] 글 없는 응답", JSON.stringify({ stops: stops, tool_calls: toolCalls, trace: trace }));
    }

    // 캐시가 실제로 먹었는지 확인용. read 가 0 인 채로 계속 write 만 나오면
    // 접두사가 매번 달라지고 있다는 뜻이다(스냅샷 키 순서·지시문 변경 등).
    // stops(회차별 stop_reason)를 같이 남긴다 — "빈 응답" 류가 다시 나면 여기서 바로 보인다.
    console.log("[ai-search] usage", JSON.stringify(Object.assign({ tool_calls: toolCalls, stops: stops }, usageTotal)));

    res.status(200).json({
      answer: answer,
      usage: Object.assign({ tool_calls: toolCalls, stops: stops }, usageTotal),
    });
  } catch (err) {
    res.status(500).json({ error: "서버 오류: " + (err && err.message ? err.message : String(err)) });
  }
}
