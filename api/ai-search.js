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

    const system = [
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
      "",
      "<데이터>",
      JSON.stringify(snapshot),
      "</데이터>",
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
        max_tokens: 3072,
        thinking: { type: "disabled" },
        system: system,
        messages: messages,
      }),
    });

    const data = await r.json();
    if (!r.ok) {
      const msg = (data && data.error && data.error.message) || "AI 검색 요청 실패";
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
