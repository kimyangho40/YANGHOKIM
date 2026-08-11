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
// 모델이 `데이터조회` 도구로 필터 조건을 뱉으면 여기서 PostgREST 로 실제 count 를 받아 돌려준다.
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

// PostgREST 값 인용. or=(...) / in.(...) 안에서는 콤마·괄호·점이 구분자라 반드시 감싸야 한다.
// ⚠️ 인용 후 **반드시 URL 인코딩**한다. ilike 패턴의 `%` 를 날것으로 두면 URL 이스케이프로 읽혀
//    값이 깨진다(예: "%AB%" → 0xAB 바이트). 구분자(따옴표·점·콤마·괄호)는 밖에 두고 값만 인코딩한다.
function pgQuote(v) {
  var s = String(v).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  return '"' + encodeURIComponent(s) + '"';
}
// op + 값 → PostgREST 조건 문자열 (예: eq."부결", ilike."%양호%", in.("A","B"))
function pgCond(op, value) {
  if (op === "is_null") return "is.null";
  if (op === "not_null") return "not.is.null";
  if (op === "in") {
    var arr = Array.isArray(value) ? value : [value];
    return "in.(" + arr.map(pgQuote).join(",") + ")";
  }
  if (op === "contains") return "ilike." + pgQuote("%" + value + "%");
  if (op === "starts") return "ilike." + pgQuote(value + "%");
  if (typeof value === "boolean" || value === "true" || value === "false") return OPS[op] + "." + String(value);
  if (typeof value === "number") return OPS[op] + "." + value;
  return OPS[op] + "." + pgQuote(value);
}

// 도구 실행: 필터를 검증해 PostgREST 로 진짜 세어 온다.
// 반환값이 {error:...} 면 모델에게 그대로 돌려줘 스스로 고쳐 다시 부르게 한다.
// (named export 는 테스트용. Vercel 은 default export 만 본다.)
export async function runQuery(input, creds) {
  var spec = TABLES[input && input.table];
  if (!spec) return { error: "table 은 " + Object.keys(TABLES).join(" / ") + " 중 하나여야 합니다." };

  var resolve = function(f) {
    var name = spec.alias[f] || f;
    return spec.cols.indexOf(name) >= 0 ? name : null;
  };
  var params = ["deleted_at=is.null"]; // 모델이 못 바꾸는 고정 조건

  var filters = Array.isArray(input.filters) ? input.filters : [];
  for (var i = 0; i < filters.length; i++) {
    var f = filters[i] || {};
    var col = resolve(f.field);
    if (!col) return { error: "'" + f.field + "' 는 " + input.table + " 에 없는(또는 조회할 수 없는) 필드입니다. 쓸 수 있는 필드: " + spec.cols.join(", ") };
    if (!OPS[f.op]) return { error: "op 는 " + Object.keys(OPS).join(" / ") + " 중 하나여야 합니다." };
    params.push(encodeURIComponent(col) + "=" + pgCond(f.op, f.value));
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
      parts.push(ac + "." + pgCond(a.op, a.value));
    }
    params.push("or=(" + parts.join(",") + ")");
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

  return {
    table: input.table,
    건수: total,
    그룹별: groups,
    표본: slim,
    안내: (limit === 0 ? "행은 요청하지 않았습니다. " : total > slim.length ? "총 " + total + "건 중 " + slim.length + "건만 실었습니다. 더 필요하면 limit 을 올리거나 필터를 좁히세요. " : "")
      + "이 '건수'는 DB 에서 직접 센 값이라 정확합니다." + groupNote,
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
      "■ 건수·목록을 물으면 반드시 `데이터조회` 도구를 쓰세요 (가장 중요).",
      "<데이터>는 양이 많아 눈으로 훑어 세면 틀립니다. 실제로 '0건'이라고 답했다가 정답이 1건이었던 사고가 있었습니다.",
      "  · '몇 건', '전부/모두', '정리해줘', '목록', '담당자별/기관별/월별' → 도구로 세고, 도구가 준 '건수'를 그대로 답하세요.",
      "  · 도구를 쓰지 않고 스냅샷만 보고 건수를 말하지 마세요. 세어 보기 전에는 '없다'고 단정하지 마세요.",
      "  · 특정 업체 한 곳의 상태·메모처럼 조회형 질문은 <데이터>만으로 답해도 됩니다.",
      "  · 도구가 error 를 주면 안내에 맞춰 필드·연산자를 고쳐 다시 부르세요.",
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
      name: "데이터조회",
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

    // ── 도구 루프 ────────────────────────────────────────────────────────────
    // 모델이 `데이터조회` 를 부르면 실제로 세어 결과를 돌려주고 다시 묻는다.
    // tools/system 은 messages 보다 앞이라 캐시 접두사 안이다 → 루프를 돌아도 캐시는 살아 있다.
    const MAX_ROUNDS = 6;
    const usageTotal = { input_tokens: 0, output_tokens: 0, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 };
    let data = null, toolCalls = 0;

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
          //    이 기능은 "모델이 데이터조회를 부르는 것"이 전부라, 끄면 예전처럼 눈대중으로 답해 버린다.
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

    for (let round = 0; round <= MAX_ROUNDS; round++) {
      // 바퀴를 다 썼는데도 도구를 더 부르려 하면, 있는 것만으로 답하게 강제한다.
      const resp = await ask(round === MAX_ROUNDS ? { type: "none" } : null);
      if (!resp.ok) { res.status(resp.status).json({ error: resp.msg }); return; }
      data = resp.data;

      const uses = (data.content || []).filter(function (b) { return b.type === "tool_use"; });
      if (data.stop_reason !== "tool_use" || uses.length === 0) break;

      messages.push({ role: "assistant", content: data.content });
      const results = [];
      for (const use of uses) {
        toolCalls++;
        let out;
        try {
          out = await runQuery(use.input || {}, creds);
        } catch (e) {
          out = { error: "조회 중 오류: " + (e && e.message ? e.message : String(e)) };
        }
        console.log("[ai-search] tool", JSON.stringify({ input: use.input, 건수: out && out.건수, error: out && out.error }));
        results.push({
          type: "tool_result",
          tool_use_id: use.id,
          content: JSON.stringify(out),
          is_error: !!(out && out.error),
        });
      }
      messages.push({ role: "user", content: results });
    }

    const answer = ((data && data.content) || [])
      .filter(function (b) { return b.type === "text"; })
      .map(function (b) { return b.text; })
      .join("\n")
      .trim();

    // 캐시가 실제로 먹었는지 확인용. read 가 0 인 채로 계속 write 만 나오면
    // 접두사가 매번 달라지고 있다는 뜻이다(스냅샷 키 순서·지시문 변경 등).
    console.log("[ai-search] usage", JSON.stringify(Object.assign({ tool_calls: toolCalls }, usageTotal)));

    res.status(200).json({
      answer: answer,
      usage: Object.assign({ tool_calls: toolCalls }, usageTotal),
    });
  } catch (err) {
    res.status(500).json({ error: "서버 오류: " + (err && err.message ? err.message : String(err)) });
  }
}
