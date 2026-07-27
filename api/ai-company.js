// Vercel 서버리스 함수: 업체 1건 데이터로 AI 상담 (CompanyModal > AI 상담 탭)
// 위치: 프로젝트 루트의 api/ai-company.js
// 환경변수 ANTHROPIC_API_KEY 필요 (Vercel에 등록됨)
//
// 보안: API 키는 이 서버 함수에만 존재하며 프런트엔드로 절대 노출되지 않습니다.
//       프런트는 비밀번호/인증서 등 민감 필드를 제외한 업체 스냅샷만 전달합니다.

import { denyUnauthorized } from "./_auth.mjs";

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
