// Vercel 서버리스 함수 공통 인증 검사 (2026-07-28 보안조치 8)
// 위치: 프로젝트 루트의 api/_auth.mjs
//
// `_` 로 시작하는 파일은 Vercel이 라우트로 만들지 않는다 → 엔드포인트가 아니라 공유 모듈이다.
// 확장자가 `.mjs`인 이유: package.json에 `"type":"module"`이 없어 `.js`는 CommonJS로 읽힐 수 있다.
//   `.mjs`면 런타임이 어떻게 판단하든 항상 ESM이라 import가 깨지지 않는다.
//
// 배경: api/* 함수들은 DB를 읽지 않으므로 데이터 유출 경로는 아니지만,
//       세션 검사가 없으면 누구나 호출해 ANTHROPIC_API_KEY 요금을 태울 수 있다.
//       parse-credit.js가 먼저 쓰던 검사를 그대로 꺼내 5개 엔드포인트가 함께 쓴다.
//
// 검사: Supabase JWT 유효성 + profiles.status === 'approved'
//       (승인 대기 계정은 통과시키지 않는다 — DB RLS의 is_approved()와 같은 기준)
//
// 프런트는 App.js의 callApi()가 Authorization / x-supabase-anon 두 헤더를 항상 붙인다.
// anon key는 원래 브라우저에 공개되는 값이라 헤더로 받아도 문제없다(README 4절).
const SUPABASE_URL = "https://ujdrjvnihxjvbkezjvwc.supabase.co";

// 통과하면 null, 실패하면 {status, error} 반환.
export async function checkAuth(req) {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) return { status: 401, error: "로그인이 필요합니다." };
  const anonKey = req.headers["x-supabase-anon"] || "";
  if (!anonKey) return { status: 401, error: "인증 정보가 없습니다." };

  // 1) 토큰이 유효한 사용자 것인지
  let userRes;
  try {
    userRes = await fetch(SUPABASE_URL + "/auth/v1/user", {
      headers: { apikey: anonKey, Authorization: "Bearer " + token },
    });
  } catch (e) {
    return { status: 503, error: "인증 서버에 연결할 수 없습니다." };
  }
  if (!userRes.ok) return { status: 401, error: "로그인이 만료되었습니다. 새로고침 후 다시 시도해주세요." };
  const user = await userRes.json();
  if (!user || !user.id) return { status: 401, error: "로그인이 필요합니다." };

  // 2) 승인된 계정인지 (RLS가 걸려 있으므로 본인 토큰으로 조회)
  const profRes = await fetch(
    SUPABASE_URL + "/rest/v1/profiles?select=status&id=eq." + encodeURIComponent(user.id),
    { headers: { apikey: anonKey, Authorization: "Bearer " + token } }
  );
  if (!profRes.ok) return { status: 403, error: "권한을 확인할 수 없습니다." };
  const rows = await profRes.json();
  if (!Array.isArray(rows) || !rows[0] || rows[0].status !== "approved") {
    return { status: 403, error: "관리자 승인 후 이용할 수 있습니다." };
  }
  return null;
}

// 핸들러 맨 앞에서 쓰는 축약형. 막혔으면 응답까지 보내고 true를 돌려준다.
export async function denyUnauthorized(req, res) {
  const denied = await checkAuth(req);
  if (!denied) return false;
  res.status(denied.status).json({ error: denied.error });
  return true;
}
