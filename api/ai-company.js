// Vercel 서버리스 함수: 업체 1건 데이터로 AI 상담 (CompanyModal > AI 상담 탭)
// 위치: 프로젝트 루트의 api/ai-company.js
// 환경변수 ANTHROPIC_API_KEY 필요 (Vercel에 등록됨)
//
// 보안: API 키는 이 서버 함수에만 존재하며 프런트엔드로 절대 노출되지 않습니다.
//       프런트는 비밀번호/인증서 등 민감 필드를 제외한 업체 스냅샷만 전달합니다.

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

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "POST 요청만 허용됩니다." });
    return;
  }
  if (await denyUnauthorized(req, res)) return;

  try {
    const { question, companyContext, history } = req.body || {};
    if (!question || !String(question).trim()) {
      res.status(400).json({ error: "질문이 비어 있습니다." });
      return;
    }
    if (!companyContext) {
      res.status(400).json({ error: "업체 데이터가 없습니다." });
      return;
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      res.status(500).json({ error: "서버에 API 키가 설정되지 않았습니다." });
      return;
    }

    const system = [
      "당신은 정책자금 컨설팅 회사의 내부 CRM에서 동작하는 AI 상담원입니다.",
      "아래 <업체데이터>는 지금 상담원이 보고 있는 '한 업체'의 정보(JSON)입니다.",
      "이 업체에 대한 질문에만 답하세요. 데이터에 없는 내용은 추측하지 말고 '데이터에 없음'이라고 답하세요.",
      "답변은 한국어로, 실무자가 바로 쓰기 좋게 간결하고 구체적으로. 필요하면 목록/단계로 정리하세요.",
      "금액·날짜·상태·기관명은 데이터에 적힌 값을 그대로 인용하세요.",
      "",
      "<업체데이터>",
      JSON.stringify(companyContext),
      "</업체데이터>",
    ].join("\n");

    const messages = [];
    if (Array.isArray(history)) {
      for (const m of history) {
        if (m && (m.role === "user" || m.role === "assistant") && m.content) {
          messages.push({ role: m.role, content: String(m.content) });
        }
      }
    }
    messages.push({ role: "user", content: String(question) });

    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 2048,
        thinking: { type: "disabled" },
        system: system,
        messages: messages,
      }),
    });

    const data = await r.json();
    if (!r.ok) {
      const msg = (data && data.error && data.error.message) || "AI 상담 요청 실패";
      res.status(r.status).json({ error: msg });
      return;
    }

    const answer = (data.content || [])
      .filter(function (b) { return b.type === "text"; })
      .map(function (b) { return b.text; })
      .join("\n")
      .trim();

    res.status(200).json({ answer: answer });
  } catch (err) {
    res.status(500).json({ error: "서버 오류: " + (err && err.message ? err.message : String(err)) });
  }
}
