// Vercel 서버리스 함수: 전체 데이터 스냅샷으로 AI 검색 상담
// 위치: 프로젝트 루트의 api/ai-search.js
// 환경변수 ANTHROPIC_API_KEY 필요 (Vercel에 등록됨)
//
// 예시 질문: "이번달 부결 정리해줘", "만기임박 업체는?", "이번주 신규 등록 업체"
// 보안: API 키는 이 서버 함수에만 존재. 프런트가 조립한 경량 스냅샷(민감정보 제외)만 전달.

import { denyUnauthorized } from "./_auth.mjs";

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
