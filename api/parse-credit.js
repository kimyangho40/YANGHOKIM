// Vercel 서버리스 함수: 기업 여신정보 문서(PDF/이미지) → 세부신용공여 표 구조화 추출
// 위치: 프로젝트 루트의 api/parse-credit.js
// 환경변수 ANTHROPIC_API_KEY 필요 (Vercel에 등록됨)
//
// 형제 엔드포인트(ai-search/ai-company/summarize-kakao/voice-command)와 동일하게 raw fetch를 쓴다.
//
// 설계 원칙 (2026-07-27 1단계 설계안 승인분):
//   · 이 함수는 "추출"만 한다. 단위 환산·소계 제거·금액 확정은 프런트(App.js)가 코드로 재검증한다.
//     모델 판단을 그대로 신뢰하지 않기 위한 이중 방어.
//   · 실행일은 문서에 없으므로 스키마에 아예 두지 않는다(추측 여지 제거).
//   · 만기구조는 구간 표현이라 만기일이 아니다. 원문 문자열로만 돌려준다.
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

const MODEL = "claude-opus-5";

// 추출 스키마 — 말하지 않은 값은 빈 문자열로 채우게 해 파싱 실패 여지를 없앤다.
const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["doc_type", "doc_type_reason", "issuer", "section_title", "as_of", "queried_at", "unit_raw", "rows", "bank_rows", "subtotal_raw", "notes"],
  properties: {
    doc_type: {
      type: "string",
      enum: ["credit_report", "bank_certificate", "unknown"],
      description:
        "문서 종류. 문서 제목으로 판단한다. " +
        "bank_certificate = 제목에 '금융거래확인서'가 있는 문서. " +
        "credit_report = '기업 여신정보' 또는 '세부신용공여' 표가 있는 신용조회 문서. " +
        "둘 중 어느 쪽인지 확신할 수 없으면 반드시 unknown. 추측해서 고르지 말 것.",
    },
    doc_type_reason: {
      type: "string",
      description: "그렇게 판단한 근거를 한 문장으로. 문서에서 본 제목·표 머리글을 인용할 것.",
    },
    issuer: {
      type: "string",
      description:
        "문서를 발행한 금융기관명 (예: 신한은행, 농협은행, 기업은행, 중소벤처기업진흥공단). " +
        "제목·머리말·직인 어디든 적혀 있으면 담는다. 없으면 빈 문자열.",
    },
    section_title: {
      type: "string",
      description:
        "bank_certificate에서 실제로 읽은 표의 섹션 제목 원문 (예: '1. 대출금 거래상황'). " +
        "허용된 섹션이 문서에 없으면 빈 문자열로 두고 bank_rows도 빈 배열로 둔다.",
    },
    as_of: { type: "string", description: "기준일자(금융거래확인서는 발급일·조회기준일). YYYY-MM-DD 로 정규화. 문서에 없으면 빈 문자열." },
    queried_at: { type: "string", description: "조회일시 원문. 없으면 빈 문자열." },
    unit_raw: {
      type: "string",
      description:
        "금액 단위 표기 원문 (예: '(단위: 천원)', '(단위: 원)', '(단위: 천원, 천미불 등)'). " +
        "문서 상단·표 머리·각주 어디든 적혀 있으면 그대로 담는다. 금융거래확인서는 '천원'이 가장 흔하다. " +
        "문서 어디에도 단위 표기가 없으면 반드시 빈 문자열. 추측 금지.",
    },
    rows: {
      type: "array",
      description:
        "doc_type=credit_report 일 때만 채운다(아니면 빈 배열). " +
        "세부신용공여 표의 각 행. 문서에 적힌 순서 그대로 1:1로 담는다. " +
        "같은 금융기관에 여러 건이면 각각 별도 행으로 담고 절대 합치지 않는다. " +
        "여러 페이지로 나뉘어 있으면 모든 페이지의 행을 이어서 담는다.",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["institution", "major_category", "minor_category", "balance_raw", "maturity_bucket", "is_subtotal"],
        properties: {
          institution: { type: "string", description: "구분 열의 금융기관명 (예: 농협은행, 신용보증기금)." },
          major_category: { type: "string", description: "대과목. 없으면 빈 문자열." },
          minor_category: { type: "string", description: "소과목 (예: 일반자금(운전)). 없으면 빈 문자열." },
          balance_raw: {
            type: "string",
            description:
              "금잔 열의 숫자를 원문 그대로 (쉼표 제거, 숫자와 소수점만). 단위 환산하지 말 것. " +
              "읽을 수 없으면 빈 문자열.",
          },
          maturity_bucket: { type: "string", description: "만기구조 열 원문 (예: '3개월 이하'). 없으면 빈 문자열." },
          is_subtotal: {
            type: "boolean",
            description:
              "이 행이 개별 대출이 아니라 소계/합계 행이면 true. " +
              "'신용공여합계', '합계', '소계', '총계' 등이 해당. 개별 대출이면 false.",
          },
        },
      },
    },
    bank_rows: {
      type: "array",
      description:
        "doc_type=bank_certificate 일 때만 채운다(아니면 빈 배열). " +
        "아래 '허용 섹션' 표의 각 행만 문서 순서 그대로 1:1로 담는다. " +
        "허용 섹션: '1. 대출금 거래상황' / '1. 여신현황' / '1. 대출금 거래현황' / '2. 금융상품 거래현황'. " +
        "담보내용·담보현황·당좌 결제내용·카드결제현황·당좌부도·연체 여부·연체명세 섹션은 절대 담지 않는다. " +
        "같은 은행에 여러 건이면 각각 별도 행으로 담고 절대 합치지 않는다. " +
        "여러 페이지(1/3, 2/3 …)면 모든 페이지의 행을 이어서 담는다.",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["institution", "product", "amount_raw", "balance_raw", "start_date", "end_date", "rate_raw", "is_subtotal"],
        properties: {
          institution: {
            type: "string",
            description: "행에 금융기관명이 따로 적혀 있으면 담는다. 발행기관 한 곳뿐이라 열이 없으면 빈 문자열(issuer를 쓴다).",
          },
          product: {
            type: "string",
            description:
              "상품·종별. 열 이름은 기관마다 '종별'·'대출종류'·'지원사업'·'대출명' 등으로 다르다. " +
              "예: 기업일반운전자금대출, 농식품기업운전자금대출, 중소기업자금대출, 햇살론-근로자. 없으면 빈 문자열.",
          },
          amount_raw: {
            type: "string",
            description:
              "'당초차입금액'·'차입금액'·'한도금액' 열의 숫자를 원문 그대로 (쉼표 제거, 숫자와 소수점만). " +
              "단위 환산하지 말 것. 열이 없거나 읽을 수 없으면 빈 문자열.",
          },
          balance_raw: {
            type: "string",
            description:
              "'잔액'·'대출잔액'·'대출원화잔액'·'환산잔액' 열의 숫자를 원문 그대로 (쉼표 제거). 단위 환산 금지. " +
              "잔액이 0이면 '0' 을 담는다(빈 문자열로 두지 말 것). 열 자체가 없으면 빈 문자열.",
          },
          start_date: { type: "string", description: "'대출일자'·'당초차입일자'·'차입일자'·'실행일자'. YYYY-MM-DD 로 정규화. 없으면 빈 문자열. 추측 금지." },
          end_date: { type: "string", description: "'대출기한'·'상환기일'·'대출한도기한'. YYYY-MM-DD 로 정규화. 없으면 빈 문자열. 추측 금지." },
          rate_raw: { type: "string", description: "'이율'·'금리' 열 원문 (예: '연 4.53%'). 없으면 빈 문자열." },
          is_subtotal: {
            type: "boolean",
            description:
              "개별 대출이 아니라 소계/합계 행이면 true. " +
              "'합계', '계', '계 (원화환산금액)', '소계', '총계', '대출금계' 등이 해당. 개별 대출이면 false.",
          },
        },
      },
    },
    subtotal_raw: {
      type: "string",
      description: "합계 행의 금액 숫자 (쉼표 제거). 여신정보는 '신용공여합계', 금융거래확인서는 대출잔액 합계. 검산용. 없으면 빈 문자열.",
    },
    notes: {
      type: "string",
      description: "판독이 어려웠던 부분이나 주의사항. 없으면 빈 문자열.",
    },
  },
};

const SYSTEM = [
  "당신은 금융 문서에서 대출 명세 표를 정확히 옮겨 적는 추출기입니다.",
  "해석하거나 계산하지 말고, 문서에 적힌 것을 그대로 옮기는 것이 임무입니다.",
  "",
  "먼저 문서 제목으로 종류를 판별하세요.",
  "· bank_certificate — 제목에 '금융거래확인서'가 있는 문서.",
  "· credit_report — '기업 여신정보' 조회 문서. '세부신용공여' 표, '금잔', '만기구조' 같은 머리글이 있습니다.",
  "· 둘 중 무엇인지 확신할 수 없으면 doc_type=unknown 으로 두고 rows·bank_rows를 모두 빈 배열로 두세요.",
  "  이때는 사용자가 직접 문서 종류를 고르게 됩니다. 애매한데 하나를 골라버리면 잘못된 값이 저장됩니다.",
  "",
  "공통 규칙:",
  "1. 표의 각 행을 문서 순서 그대로 1:1로 담습니다. 합치거나 정렬하지 마세요.",
  "2. 같은 금융기관에 여러 건이 있으면 각각 별도 행입니다. 절대 합산하지 마세요.",
  "3. 소계·합계 행도 빠뜨리지 말고 담되 is_subtotal=true로 표시하세요.",
  "4. 금액은 단위를 환산하지 말고 문서에 적힌 숫자 그대로 담으세요(쉼표만 제거).",
  "5. 단위 표기(예: '단위 : 백만원', '단위 : 원')는 문서에 실제로 적혀 있을 때만 담으세요.",
  "   없으면 빈 문자열입니다. 절대 추측하지 마세요.",
  "6. 여러 페이지에 걸쳐 있으면 모든 페이지의 행을 빠짐없이 담으세요.",
  "7. 읽을 수 없는 값은 빈 문자열로 두세요. 추측해서 채우지 마세요.",
  "",
  "문서 종류별:",
  "· credit_report → rows 에만 담습니다. bank_rows 는 빈 배열.",
  "  실행일·만기일은 이 문서에 없으므로 스키마에도 없습니다.",
  "· bank_certificate → bank_rows 에만 담습니다. rows 는 빈 배열.",
  "  대출일자·만기일자는 문서에 적혀 있을 때만 YYYY-MM-DD 로 담고, 없으면 빈 문자열입니다.",
  "  차입금액(한도)과 잔액은 서로 다른 열입니다. 한 쪽만 있으면 있는 쪽만 담고 다른 쪽은 빈 문자열로 두세요.",
  "",
  "★★ 금융거래확인서에서 읽을 섹션 (이것만 읽습니다) ★★",
  "  '1. 대출금 거래상황' / '1. 여신현황' / '1. 대출금 거래현황' / '2. 금융상품 거래현황'",
  "  이 중 문서에 있는 섹션의 표만 bank_rows에 담고, 그 섹션 제목 원문을 section_title에 적으세요.",
  "  넷 중 어느 것도 없으면 section_title을 빈 문자열, bank_rows를 빈 배열로 두세요.",
  "",
  "★★ 절대 담으면 안 되는 섹션 ★★",
  "  · '2. 담보내용' / '2. 담보현황' — 여기의 설정금액을 대출로 담으면 부채가 두 배가 됩니다. 가장 위험합니다.",
  "  · '3. 최근 당좌 결제내용' / '카드결제현황'",
  "  · '4~6. 당좌부도 / 연체 여부 / 연체명세'",
  "  이 섹션들의 행은 단 한 줄도 bank_rows에 넣지 마세요.",
].join("\n");

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "POST 요청만 허용됩니다." });
    return;
  }
  if (await denyUnauthorized(req, res)) return;

  try {
    const { fileBase64, mediaType, docTypeHint } = req.body || {};
    if (!fileBase64) {
      res.status(400).json({ error: "파일 데이터가 없습니다." });
      return;
    }
    const mt = String(mediaType || "");
    const isPdf = mt === "application/pdf";
    const isImage = /^image\/(png|jpeg|jpg|gif|webp)$/.test(mt);
    if (!isPdf && !isImage) {
      res.status(400).json({ error: "PDF 또는 이미지(PNG/JPG) 파일만 첨부할 수 있어요." });
      return;
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      res.status(500).json({ error: "서버에 API 키가 설정되지 않았습니다." });
      return;
    }

    // 사용자가 문서 종류를 직접 골라 다시 보낸 경우에만 종류를 고정한다(1차에는 모델이 판별).
    const hint = String(docTypeHint || "");
    const askText =
      hint === "credit_report"
        ? "이 문서는 '기업 여신정보'입니다. doc_type=credit_report 로 두고 '세부신용공여' 표를 rows에 그대로 옮겨 적어주세요."
        : hint === "bank_certificate"
          ? "이 문서는 '금융거래확인서'입니다. doc_type=bank_certificate 로 두고 대출 명세를 bank_rows에 그대로 옮겨 적어주세요."
          : "먼저 이 문서가 '기업 여신정보'인지 '금융거래확인서'인지 판별하고, 해당 표를 스키마에 맞춰 그대로 옮겨 적어주세요. 확신할 수 없으면 doc_type=unknown 으로 두세요. 금융거래확인서라면 허용된 1번 섹션만 읽고 담보내용 섹션은 절대 읽지 마세요.";

    // PDF는 document 블록, 이미지는 image 블록. 둘 다 텍스트 블록보다 앞에 둔다.
    const docBlock = isPdf
      ? { type: "document", source: { type: "base64", media_type: "application/pdf", data: fileBase64 } }
      : { type: "image", source: { type: "base64", media_type: mt === "image/jpg" ? "image/jpeg" : mt, data: fileBase64 } };

    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 16000,
        system: SYSTEM,
        output_config: { format: { type: "json_schema", schema: SCHEMA } },
        messages: [
          {
            role: "user",
            content: [
              docBlock,
              { type: "text", text: askText },
            ],
          },
        ],
      }),
    });

    const data = await r.json();
    if (!r.ok) {
      const msg = (data && data.error && data.error.message) || "문서 분석에 실패했습니다.";
      res.status(r.status).json({ error: msg });
      return;
    }
    // 안전장치: 거절되거나 잘렸으면 반쪽 결과를 정상처럼 넘기지 않는다
    if (data.stop_reason === "refusal") {
      res.status(422).json({ error: "이 문서는 분석할 수 없습니다. 다른 파일로 시도해주세요." });
      return;
    }
    if (data.stop_reason === "max_tokens") {
      res.status(422).json({ error: "문서가 너무 길어 전부 읽지 못했습니다. 페이지를 나눠 첨부해주세요." });
      return;
    }

    const textBlock = (data.content || []).find(function (b) { return b.type === "text"; });
    if (!textBlock || !textBlock.text) {
      res.status(502).json({ error: "문서에서 표를 찾지 못했습니다." });
      return;
    }
    let parsed;
    try {
      parsed = JSON.parse(textBlock.text);
    } catch (e) {
      res.status(502).json({ error: "분석 결과를 해석하지 못했습니다." });
      return;
    }

    res.status(200).json({ result: parsed });
  } catch (err) {
    res.status(500).json({ error: "서버 오류: " + (err && err.message ? err.message : String(err)) });
  }
}
