// Vercel 서버리스 함수: 기업 여신정보 문서(PDF/이미지) → 세부신용공여 표 구조화 추출
// 위치: 프로젝트 루트의 api/parse-credit.js
// 환경변수 ANTHROPIC_API_KEY 필요 (Vercel에 등록됨)
//
// 형제 엔드포인트(ai-search/ai-company/summarize-kakao/voice-command)와 동일하게 raw fetch를 쓴다.
//
// 인증 검사는 api/_auth.mjs로 옮겼다(2026-07-28 보안조치 8) — 5개 엔드포인트가 같은 검사를 쓴다.
//   검사 내용은 그대로: Supabase JWT 유효성 + profiles.status='approved'
//
// 설계 원칙 (2026-07-27 1단계 설계안 승인분):
//   · 이 함수는 "추출"만 한다. 단위 환산·소계 제거·금액 확정은 프런트(App.js)가 코드로 재검증한다.
//     모델 판단을 그대로 신뢰하지 않기 위한 이중 방어.
//   · 실행일은 문서에 없으므로 스키마에 아예 두지 않는다(추측 여지 제거).
//   · 만기구조는 구간 표현이라 만기일이 아니다. 원문 문자열로만 돌려준다.
import { denyUnauthorized } from "./_auth.mjs";

const MODEL = "claude-opus-5";

// 추출 스키마 — 말하지 않은 값은 빈 문자열로 채우게 해 파싱 실패 여지를 없앤다.
const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["as_of", "queried_at", "unit_raw", "rows", "subtotal_raw", "notes"],
  properties: {
    as_of: { type: "string", description: "기준일자. YYYY-MM-DD 로 정규화. 문서에 없으면 빈 문자열." },
    queried_at: { type: "string", description: "조회일시 원문. 없으면 빈 문자열." },
    unit_raw: {
      type: "string",
      description:
        "금액 단위 표기 원문 (예: '단위 : 백만원'). 헤더·표 제목·각주 어디든 적혀 있으면 그대로. " +
        "문서 어디에도 단위 표기가 없으면 반드시 빈 문자열. 추측 금지.",
    },
    rows: {
      type: "array",
      description:
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
    subtotal_raw: {
      type: "string",
      description: "'신용공여합계' 행의 금잔 숫자 (쉼표 제거). 검산용. 없으면 빈 문자열.",
    },
    notes: {
      type: "string",
      description: "판독이 어려웠던 부분이나 주의사항. 없으면 빈 문자열.",
    },
  },
};

const SYSTEM = [
  "당신은 '기업 여신정보' 문서에서 '세부신용공여' 표를 정확히 옮겨 적는 추출기입니다.",
  "해석하거나 계산하지 말고, 문서에 적힌 것을 그대로 옮기는 것이 임무입니다.",
  "",
  "규칙:",
  "1. 표의 각 행을 문서 순서 그대로 1:1로 담습니다. 합치거나 정렬하지 마세요.",
  "2. 같은 금융기관에 여러 건이 있으면 각각 별도 행입니다. 절대 합산하지 마세요.",
  "3. '신용공여합계' 같은 소계 행도 rows에 담되 is_subtotal=true로 표시하세요. 빠뜨리지 마세요.",
  "4. 금잔은 단위를 환산하지 말고 문서에 적힌 숫자 그대로 담으세요(쉼표만 제거).",
  "5. 단위 표기(예: '단위 : 백만원')는 문서에 실제로 적혀 있을 때만 담으세요. 없으면 빈 문자열입니다. 절대 추측하지 마세요.",
  "6. 여러 페이지에 걸쳐 있으면 모든 페이지의 행을 빠짐없이 담으세요.",
  "7. 읽을 수 없는 값은 빈 문자열로 두세요. 추측해서 채우지 마세요.",
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
              { type: "text", text: "이 문서의 '세부신용공여' 표를 스키마에 맞춰 그대로 옮겨 적어주세요." },
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
