// Vercel 서버리스 함수: 카톡 대화 캡처 이미지를 Claude로 요약
// 위치: 프로젝트 루트의 api/summarize-kakao.js
// 환경변수 ANTHROPIC_API_KEY 필요 (Vercel에 등록됨)

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

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "POST 요청만 허용됩니다." });
    return;
  }
  if (await denyUnauthorized(req, res)) return;

  try {
    const { imageBase64, mediaType } = req.body || {};
    if (!imageBase64) {
      res.status(400).json({ error: "이미지 데이터가 없습니다." });
      return;
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      res.status(500).json({ error: "서버에 API 키가 설정되지 않았습니다." });
      return;
    }

    const prompt = [
      "다음은 고객(또는 잠재고객)과 주고받은 카카오톡 대화 캡처입니다.",
      "이 대화를 정책자금 컨설팅 회사의 '소통 내역'으로 깔끔하게 정리해 주세요.",
      "",
      "정리 규칙:",
      "- 날짜/시간이 보이면 함께 적되, 핵심 위주로 간결하게.",
      "- 통화/문자/방문 약속, 요청사항, 답변, 다음 할 일을 중심으로 요약.",
      "- 사람이 수기로 적은 것처럼 자연스럽고 담백하게. 불필요한 인사말·이모티콘은 제외.",
      "- 줄바꿈으로 항목을 나눠 보기 쉽게. 각 줄은 '- '로 시작.",
      "- 추측하지 말고, 대화에 실제로 나온 내용만.",
      "- 결과는 소통 내역 본문만 출력하고, 다른 설명(예: '요약하면')은 붙이지 마세요.",
    ].join("\n");

    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1024,
        messages: [
          {
            role: "user",
            content: [
              { type: "image", source: { type: "base64", media_type: mediaType || "image/png", data: imageBase64 } },
              { type: "text", text: prompt },
            ],
          },
        ],
      }),
    });

    const data = await r.json();

    if (!r.ok) {
      const msg = (data && data.error && data.error.message) || "AI 요약 요청 실패";
      res.status(r.status).json({ error: msg });
      return;
    }

    // 텍스트 블록만 추출
    const summary = (data.content || [])
      .filter(function (b) { return b.type === "text"; })
      .map(function (b) { return b.text; })
      .join("\n")
      .trim();

    res.status(200).json({ summary: summary });
  } catch (err) {
    res.status(500).json({ error: "서버 오류: " + (err && err.message ? err.message : String(err)) });
  }
}
