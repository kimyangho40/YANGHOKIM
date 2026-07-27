// Vercel 서버리스 함수: 카톡 대화 캡처 이미지를 Claude로 요약
// 위치: 프로젝트 루트의 api/summarize-kakao.js
// 환경변수 ANTHROPIC_API_KEY 필요 (Vercel에 등록됨)

import { denyUnauthorized } from "./_auth.mjs";

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
