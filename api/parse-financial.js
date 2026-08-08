// Vercel 서버리스 함수: 재무제표(PDF·이미지) → 재무 항목 추출
// 위치: 프로젝트 루트의 api/parse-financial.js
// 환경변수 ANTHROPIC_API_KEY 필요 (Vercel에 등록됨)
//
// ⚠️ 이 함수는 "추출"만 한다. 단위 환산·대차검산·영업손익 재검산·가결산 배제는
//    프런트(App.js financialToUpdates)에서 코드로 다시 한다. 모델 판단을 그대로 믿지 않는 이중 방어.
//    (여신정보 파서 api/parse-credit.js 와 같은 설계)

// ── 인증 검사 (2026-07-28 보안조치 8) ────────────────────────────────────────
// ⚠️ 6개 엔드포인트(ai-search·ai-company·summarize-kakao·voice-command·parse-credit·parse-financial)에
//    똑같은 블록이 들어 있다. 고칠 때는 6개를 함께 고칠 것.
//    공유 모듈(api/_auth.mjs)로 뺐다가 되돌렸다 — Vercel이 api/ 안의 `_` 시작 파일을
//    배포 번들에 넣지 않아 함수가 아예 뜨지 못했다(FUNCTION_INVOCATION_FAILED 500).
//    서버리스 함수는 "파일 하나로 완결"이어야 안전하다.
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

// 뽑을 계정과목. 재검산에 쓰는 것까지 포함한다 —
//   대차검산: 자산총계 = 부채총계 + 자본총계
//   영업손익 재검산: 매출총이익 − 판매비와관리비 = 영업이익
// (2026-07 수동 검증에서 '영업손실을 양수로 표기'한 서식이 3건 나왔다. 재검산이 유일한 방어다.)
const ITEM_LABELS = [
  "자산총계", "부채총계", "자본총계",
  "매출액", "매출총이익", "판매비와관리비", "영업이익", "이자비용",
];

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "doc_kind", "doc_kind_reason", "is_provisional", "provisional_evidence",
    "company_name", "business_number", "period_label", "fiscal_year",
    "period_start", "period_end", "is_comparative", "current_column_label",
    "unit_raw", "items", "notes",
  ],
  properties: {
    doc_kind: {
      type: "string",
      enum: ["standard_certificate", "settlement_report", "tax_confirmation", "other_financial", "not_financial", "unknown"],
      description:
        "문서 종류. 제목으로 판단한다. " +
        "standard_certificate = 국세청 '표준재무제표증명'. " +
        "settlement_report = 세무사·회계사가 만든 '결산보고서'류. " +
        "tax_confirmation = '세무사 확인서'류. " +
        "other_financial = 위 셋은 아니지만 재무상태표·손익계산서가 들어 있는 문서. " +
        "not_financial = 재무제표가 아닌 문서(여신정보·금융거래확인서·사업자등록증 등). " +
        "확신할 수 없으면 unknown. 추측해서 고르지 말 것.",
    },
    doc_kind_reason: {
      type: "string",
      description: "그렇게 판단한 근거를 한 문장으로. 문서에서 본 제목·표 머리글을 그대로 인용할 것.",
    },
    is_provisional: {
      type: "boolean",
      description:
        "가결산·가마감·잠정치 문서면 true. 제목·표지·머리글·워터마크 어디든 '가결산'·'가마감'·'잠정'·'(안)' 표기가 있으면 true. " +
        "확정본이면 false. 애매하면 true로 두고 provisional_evidence에 근거를 적을 것 — " +
        "가결산을 확정본으로 잘못 넣는 것보다 사람이 한 번 더 보는 편이 안전하다.",
    },
    provisional_evidence: {
      type: "string",
      description: "is_provisional=true 로 판단한 근거 원문(예: '표지에 가결산 표기'). false면 빈 문자열.",
    },
    company_name: { type: "string", description: "문서에 적힌 상호. 없으면 빈 문자열." },
    business_number: {
      type: "string",
      description:
        "사업자등록번호를 문서에 적힌 형태 그대로 (예: 123-45-67890). " +
        "표준재무제표증명에는 대개 있지만 결산보고서류에는 없는 경우가 많다. 없으면 빈 문자열. 추측 금지.",
    },
    period_label: {
      type: "string",
      description: "당기를 가리키는 기수 표기 원문 (예: '제23(당)기', '제 25 기'). 없으면 빈 문자열.",
    },
    fiscal_year: {
      type: "string",
      description:
        "당기의 회계연도 4자리 (예: '2025'). 기수가 걸쳐 있으면 결산일(period_end)이 속한 해를 쓴다. " +
        "⚠️ 파일명이 아니라 문서 안에 적힌 기간으로만 판단할 것. 없으면 빈 문자열.",
    },
    period_start: { type: "string", description: "당기 회계기간 시작일 YYYY-MM-DD. 없으면 빈 문자열. 추측 금지." },
    period_end: { type: "string", description: "당기 회계기간 종료일(결산일) YYYY-MM-DD. 없으면 빈 문자열. 추측 금지." },
    is_comparative: {
      type: "boolean",
      description: "당기·전기가 나란히 있는 비교식 재무제표면 true. 당기 한 열만 있으면 false.",
    },
    current_column_label: {
      type: "string",
      description:
        "비교식일 때 '당기'에 해당하는 열의 머리글 원문 (예: '제25(당)기'). " +
        "이 열의 숫자만 items에 담아야 한다. 비교식이 아니면 빈 문자열.",
    },
    unit_raw: {
      type: "string",
      description:
        "금액 단위 표기 원문 (예: '(단위: 원)', '(단위: 천원)'). 문서에 실제로 적혀 있을 때만 담는다. " +
        "어디에도 없으면 반드시 빈 문자열. 절대 추측하지 말 것.",
    },
    items: {
      type: "array",
      description:
        "찾은 계정과목만 담는다. 문서에 없는 항목은 아예 넣지 않는다(0으로 채우지 말 것). " +
        "비교식이면 current_column_label 열의 값만 담는다. 같은 label을 두 번 담지 말 것.",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["label", "raw", "page", "source_text"],
        properties: {
          label: { type: "string", enum: ITEM_LABELS, description: "계정과목." },
          raw: {
            type: "string",
            description:
              "숫자를 원문 그대로 (쉼표는 제거, 숫자·소수점·부호만). 단위 환산하지 말 것. " +
              "★ 음수 표기(△, ▲, 괄호, 마이너스)는 절대 지우지 말고 그대로 남길 것 — " +
              "'영업손실'을 양수처럼 적는 서식이 있어 부호가 유일한 단서다. " +
              "괄호 표기는 △로 바꾸지 말고 (12345) 형태 그대로 담는다. 읽을 수 없으면 빈 문자열.",
          },
          page: { type: "integer", description: "이 값이 있는 페이지 번호(1부터). 모르면 0." },
          source_text: {
            type: "string",
            description: "그 줄의 계정과목명 원문 (예: '판매비와관리비', 'Ⅴ.영업이익'). 사람이 대조할 때 쓴다.",
          },
        },
      },
    },
    notes: { type: "string", description: "판독이 어려웠던 부분·주의사항. 없으면 빈 문자열." },
  },
};

const SYSTEM = [
  "당신은 한국 기업의 재무제표에서 계정과목 금액을 정확히 옮겨 적는 추출기입니다.",
  "해석하거나 계산하지 말고, 문서에 적힌 것을 그대로 옮기는 것이 임무입니다.",
  "",
  "★★ 가장 중요한 세 가지 ★★",
  "1. 파일명이 아니라 문서 안의 내용으로만 판단하세요.",
  "   파일명에 연도가 없어도 문서 안에 기간이 적혀 있고, 파일명이 '24년'이어도 당기가 2025년일 수 있습니다.",
  "2. 비교식(당기·전기가 나란히 있는 표)이면 반드시 '당기' 열만 읽으세요.",
  "   어느 열이 당기인지 current_column_label에 열 머리글을 그대로 적어 밝히세요.",
  "   당기가 어느 쪽인지 확신할 수 없으면 items를 비우고 notes에 그 사실을 적으세요.",
  "3. 부호를 지우지 마세요. △, ▲, 괄호, 마이너스는 원문 그대로 raw에 남기세요.",
  "   '영업손실'을 양수처럼 적는 서식이 실제로 있습니다. 부호가 유일한 단서입니다.",
  "",
  "공통 규칙:",
  "· 금액은 단위를 환산하지 말고 문서에 적힌 숫자 그대로 담으세요(쉼표만 제거).",
  "· 단위 표기('단위: 천원' 등)는 문서에 실제로 적혀 있을 때만 unit_raw에 담고, 없으면 빈 문자열입니다.",
  "  라벨에 '(원)'이 적혀 있어도 그건 단위 표기가 아닙니다. 절대 추측하지 마세요.",
  "· 문서에 없는 계정과목은 items에 넣지 마세요. 0으로 채우면 '부채가 없다'로 잘못 읽힙니다.",
  "· 읽을 수 없는 값은 raw를 빈 문자열로 두세요. 추측해서 채우지 마세요.",
  "· 연결재무제표와 별도재무제표가 둘 다 있으면 '별도(개별)' 쪽을 읽고 notes에 밝히세요.",
  "",
  "찾을 계정과목 (재무상태표):",
  "  자산총계 · 부채총계 · 자본총계",
  "찾을 계정과목 (손익계산서):",
  "  매출액(매출액·영업수익) · 매출총이익 · 판매비와관리비 · 영업이익(영업손실) · 이자비용(금융원가 중 이자비용)",
  "",
  "· 매출총이익과 판매비와관리비는 영업이익을 검산하는 데 씁니다. 있으면 반드시 함께 담으세요.",
  "· 이자비용이 손익계산서에 없고 주석에만 있으면 주석에서 찾아 담고 notes에 밝히세요.",
  "· 이자비용이 문서 어디에도 없으면 items에 넣지 마세요(0으로 채우지 말 것).",
  "",
  "가결산 판별:",
  "· 제목·표지·머리글·워터마크에 '가결산'·'가마감'·'잠정'·'(안)' 표기가 있으면 is_provisional=true.",
  "· 애매하면 true로 두세요. 가결산을 확정본으로 넣는 것이 그 반대보다 훨씬 위험합니다.",
  "",
  "재무제표가 아닌 문서(여신정보·금융거래확인서·사업자등록증 등)를 받으면",
  "doc_kind=not_financial 로 두고 items를 빈 배열로 두세요.",
].join("\n");

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "POST 요청만 허용됩니다." });
    return;
  }
  if (await denyUnauthorized(req, res)) return;

  try {
    const { fileBase64, mediaType } = req.body || {};
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
              {
                type: "text",
                text:
                  "이 재무제표에서 계정과목 금액을 스키마에 맞춰 그대로 옮겨 적어주세요. " +
                  "당기가 어느 열인지 먼저 확인하고, 부호 표기를 지우지 마세요. " +
                  "가결산이면 is_provisional=true 로 밝혀주세요.",
              },
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
      res.status(422).json({ error: "문서가 너무 길어 전부 읽지 못했습니다. 재무제표 부분만 잘라서 첨부해주세요." });
      return;
    }

    const textBlock = (data.content || []).find(function (b) { return b.type === "text"; });
    if (!textBlock || !textBlock.text) {
      res.status(502).json({ error: "문서에서 재무제표를 찾지 못했습니다." });
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
