// Supabase Edge Function: 메타(페이스북·인스타) 광고 양식 신청 → db_leads (DB리스트) — 2026-11-21
// 배포: SUPABASE_ACCESS_TOKEN=... npx supabase functions deploy meta-leads --project-ref ujdrjvnihxjvbkezjvwc --use-api --no-verify-jwt
//
// 흐름: pg_cron(10분) → 이 함수 → 메타 Graph API(양식별 새 신청) → db_leads insert(source='meta')
//
// 🔐 인증 — 사람이 아니라 기계(pg_cron)가 부른다. 그래서 verify_jwt 를 끄고 공유 비밀키로 검사한다(api/assign-db-sync.js 와 같은 방식).
//   · 비밀키·메타 토큰은 **Supabase Vault** 에만 있다(저장소 public). service_role 로 public.meta_leads_secret()/meta_leads_token() 을 불러 꺼낸다.
//   · 이 키로 할 수 있는 일은 "수집 한 번 더"뿐이다. 같은 신청은 meta_lead_id unique 가 막아 두 번 들어가지 않는다.
//   · 응답에는 건수만 담는다. 이름·전화·토큰은 절대 돌려주지 않는다.
// 🧾 넣는 값 — 화면에서 「+ 추가」로 넣는 행과 같은 모양(year·month·business_name·contact·status='미연락'…) + 메타 전용 7칸.
//   판정(우선 연락 등)은 저장하지 않는다. 화면(App.js ⛳ 메타신청)이 meta_answers 로 매번 계산한다.
//
// 요청: POST {}  (선택: { "since_hours": 24 } — 처음 켤 때 과거 신청을 얼마나 거슬러 가져올지. 기본 24시간, 최대 2160=90일)
// 응답: { ok, forms, fetched, inserted, skipped }

const PAGE_ID = "322871297567083";
const GRAPH = "https://graph.facebook.com/v26.0";

// ⛳ meta-leads-helpers 시작 — 순수 함수(Deno·Node 둘 다에서 돈다). scripts/test-meta-leads.mjs 가 이 구간을 떼어내 실행한다.
function cleanAnswer(v) {
  return String(v == null ? "" : v).replace(/_/g, " ").replace(/\s+/g, " ").trim();
}
// +821012345678 · 01012345678 · 10-1234-5678 → 010-1234-5678. 모르는 모양은 원문 그대로(지어내지 않는다).
function normalizeKrPhone(v) {
  var d = String(v == null ? "" : v).replace(/[^0-9]/g, "");
  if (d.indexOf("82") === 0 && d.length >= 11) d = "0" + d.slice(2);
  if (d.length === 10 && d.indexOf("10") === 0) d = "0" + d;
  if (d.length === 11 && d.indexOf("01") === 0) return d.slice(0, 3) + "-" + d.slice(3, 7) + "-" + d.slice(7);
  if (d.length === 10 && d.indexOf("0") === 0) return d.slice(0, 3) + "-" + d.slice(3, 6) + "-" + d.slice(6);
  return String(v == null ? "" : v).trim();
}
function fieldMap(fieldData) {
  var out = {};
  (Array.isArray(fieldData) ? fieldData : []).forEach(function(f) {
    if (!f || !f.name) return;
    out[String(f.name)] = cleanAnswer(Array.isArray(f.values) && f.values.length ? f.values[0] : "");
  });
  return out;
}
// 질문 문구에 들어 있는 낱말로 찾는다(양식마다 문구가 조금씩 다르다). 앞에 둔 낱말이 우선.
function pickAnswer(map, keywords) {
  var keys = Object.keys(map);
  for (var i = 0; i < keywords.length; i++) {
    for (var k = 0; k < keys.length; k++) {
      if (keys[k].indexOf(keywords[i]) >= 0 && map[keys[k]]) return map[keys[k]];
    }
  }
  return "";
}
function kstYearMonth(iso) {
  var t = Date.parse(iso || "");
  if (isNaN(t)) t = Date.now();
  var d = new Date(t + 9 * 3600 * 1000);
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1 };
}
// 메타 신청 1건 → db_leads 행. 전화가 없으면 null(연락할 방법이 없는 신청은 넣지 않는다).
function buildLeadRow(lead, formName) {
  var m = fieldMap(lead && lead.field_data);
  var name = pickAnswer(m, ["full_name", "이름", "성함"]);
  var phoneRaw = pickAnswer(m, ["phone_number", "전화", "연락처"]);
  var company = pickAnswer(m, ["company_name", "회사", "상호", "사업자명"]);
  var contact = normalizeKrPhone(phoneRaw);
  if (!contact) return null;
  var applied = (lead && lead.created_time) ? new Date(Date.parse(lead.created_time)).toISOString() : new Date().toISOString();
  var ym = kstYearMonth(applied);
  return {
    year: ym.year, month: ym.month,
    business_name: company || name || "(이름 없음)",
    contact: contact,
    assignee: "", assigned_by: "", status: "미연락",
    call_1: "", call_2: "", call_3: "", call_4: "", call_5: "", etc: "",
    source: "meta",
    meta_lead_id: String(lead.id),
    meta_form_name: formName || null,
    meta_ad_name: (lead && lead.ad_name) || null,
    applied_at: applied,
    meta_answers: {
      name: name,
      city: pickAnswer(m, ["city", "지역", "소재지"]),
      tax: pickAnswer(m, ["체납", "연체"]),
      sales: pickAnswer(m, ["매출"]),
      employees: pickAnswer(m, ["근로자", "직원", "종업원"]),
      years: pickAnswer(m, ["업력", "설립", "개업"]),
      plan: pickAnswer(m, ["업종", "전환", "계획"]),
      call_time: pickAnswer(m, ["통화", "시간대", "연락 가능"]),
      raw: m,
    },
  };
}
// ⛳ meta-leads-helpers 끝

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

async function graph(path: string, params: Record<string, string>, token: string) {
  const qs = new URLSearchParams({ ...params, access_token: token });
  const r = await fetch(GRAPH + "/" + path + "?" + qs.toString());
  const j = await r.json().catch(() => ({}));
  // 메타 오류 메시지에는 토큰이 섞이지 않지만, 혹시 몰라 종류와 코드만 남긴다.
  if (!r.ok) throw new Error("메타 응답 " + r.status + " (code " + (j?.error?.code ?? "?") + ", " + (j?.error?.type ?? "?") + ")");
  return j;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json(405, { error: "POST only" });
  const url = Deno.env.get("SUPABASE_URL") || "";
  const svc = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  if (!url || !svc) return json(500, { error: "서버 설정 누락: SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY" });

  const secret = await vaultValue(url, svc, "meta_leads_secret");
  if (!secret) return json(500, { error: "Vault 에 meta_leads_secret 이 없습니다(메타신청_토큰_금고함수.sql 머리 참고)." });
  if (!safeEqual(req.headers.get("x-meta-leads-secret") || "", secret)) return json(401, { error: "인증 실패" });

  const userToken = await vaultValue(url, svc, "meta_leads_token");
  if (!userToken) return json(500, { error: "Vault 에 meta_leads_token 이 없습니다." });

  let body: any = {};
  try { body = await req.json(); } catch (_e) { body = {}; }
  const sinceHours = Math.min(2160, Math.max(1, Number(body?.since_hours) || 24));

  const rest = { apikey: svc, Authorization: "Bearer " + svc, "content-type": "application/json" };
  try {
    // 어디서부터 가져올지 — 마지막으로 들어온 메타 신청 시각에서 1시간 겹치게(메타 쪽 지연 대비). 처음이면 since_hours.
    const lastRes = await fetch(url + "/rest/v1/db_leads?select=applied_at&source=eq.meta&order=applied_at.desc&limit=1", { headers: rest });
    if (!lastRes.ok) return json(500, { error: "db_leads 조회 실패 " + lastRes.status + " — 메타신청_db_leads_컬럼추가.sql 을 먼저 실행했는지 확인하세요." });
    const lastRows = await lastRes.json();
    const lastMs = Array.isArray(lastRows) && lastRows[0]?.applied_at ? Date.parse(lastRows[0].applied_at) : NaN;
    const sinceMs = isNaN(lastMs) ? Date.now() - sinceHours * 3600 * 1000 : lastMs - 3600 * 1000;
    const sinceUnix = String(Math.floor(sinceMs / 1000));

    // 신청을 읽으려면 페이지 토큰이 필요하다.
    const page = await graph(PAGE_ID, { fields: "access_token" }, userToken);
    const pageToken = page?.access_token;
    if (!pageToken) return json(500, { error: "페이지 토큰을 받지 못했습니다(토큰에 페이지 권한이 있는지 확인)." });

    const formsRes = await graph(PAGE_ID + "/leadgen_forms", { fields: "id,name,status", limit: "100" }, pageToken);
    const forms = (formsRes?.data || []).filter((f: any) => f.status === "ACTIVE");

    let fetched = 0, inserted = 0, skipped = 0;
    for (const f of forms) {
      let next: string | null = null;
      let first = await graph(f.id + "/leads", {
        fields: "id,created_time,ad_name,field_data",
        filtering: JSON.stringify([{ field: "time_created", operator: "GREATER_THAN", value: Number(sinceUnix) }]),
        limit: "100",
      }, pageToken);
      for (let pageNo = 0; pageNo < 10; pageNo++) {   // 양식당 최대 1,000건 — 폭주 방어
        const rows = (first?.data || []).map((l: any) => buildLeadRow(l, f.name)).filter(Boolean);
        fetched += (first?.data || []).length;
        skipped += (first?.data || []).length - rows.length;
        if (rows.length) {
          // 같은 신청 번호는 DB 가 조용히 건너뛴다(unique + ignore-duplicates) → 몇 번을 돌려도 안 불어난다.
          const ins = await fetch(url + "/rest/v1/db_leads?on_conflict=meta_lead_id", {
            method: "POST",
            headers: { ...rest, Prefer: "resolution=ignore-duplicates,return=representation" },
            body: JSON.stringify(rows),
          });
          if (!ins.ok) return json(500, { error: "db_leads 저장 실패 " + ins.status, fetched, inserted });
          const got = await ins.json().catch(() => []);
          const n = Array.isArray(got) ? got.length : 0;
          inserted += n;
          skipped += rows.length - n;
        }
        next = first?.paging?.next || null;
        if (!next) break;
        const r = await fetch(next);
        if (!r.ok) break;
        first = await r.json();
      }
    }
    return json(200, { ok: true, forms: forms.length, fetched, inserted, skipped });
  } catch (e) {
    return json(502, { error: String((e as Error)?.message || e) });
  }
});
