// Vercel 서버리스 함수: 운전 중 음성 전용 모드(자비스 모드) 명령 해석
// 위치: 프로젝트 루트의 api/voice-command.js
// 환경변수 ANTHROPIC_API_KEY 필요 (Vercel에 등록됨)
//
// 프런트가 보낸 음성 인식 문장을 "무엇을 실행할지"로 구조화해 돌려준다.
// 실제 DB 쓰기는 하지 않는다 — 실행은 사용자가 음성으로 "네"라고 확인한 뒤 프런트가 한다.
// (운전 중 오인식으로 엉뚱한 사람에게 요청이 나가는 사고를 막기 위한 설계)
//
// 형제 엔드포인트(ai-search/ai-company/summarize-kakao)와 동일하게 raw fetch를 쓴다.
// 모델: 지시 이해 정확도가 안전과 직결되므로 Opus. 응답 지연이 문제되면 claude-sonnet-5로 교체 가능.
const MODEL = "claude-opus-5";

// 음성 명령 해석 결과 스키마.
// 말하지 않은 항목은 빈 문자열("")/빈 배열로 채우게 해서 파싱 실패 여지를 없앤다.
const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["intent", "speech", "needs_confirm", "request", "todo", "company", "verify"],
  properties: {
    intent: {
      type: "string",
      enum: ["work_request", "my_todo", "new_company", "question", "clarify", "end", "unknown"],
      description:
        "work_request=다른 사람에게 업무 지시/전달, my_todo=내 할일 추가, new_company=신규 업체 등록, " +
        "question=단순 질문·잡담, clarify=말이 불완전해 되물어야 함, end=음성모드 종료, unknown=무엇인지 모르겠음",
    },
    speech: {
      type: "string",
      description:
        "사용자에게 소리로 읽어줄 한국어 문장 1~2줄. needs_confirm이 true면 반드시 " +
        "'~할까요?'로 끝나는 확인 질문이어야 한다. 운전 중이므로 짧고 명확하게.",
    },
    needs_confirm: {
      type: "boolean",
      description: "실행 전 사용자 확인(네/아니오)이 필요하면 true. work_request/my_todo/new_company는 항상 true.",
    },
    request: {
      type: "object",
      additionalProperties: false,
      required: ["to", "content", "company", "urgent"],
      properties: {
        to: { type: "array", items: { type: "string" }, description: "받는 사람 이름 목록. 팀 전체면 그 팀 구성원 이름을 모두 나열." },
        content: { type: "string", description: "요청 내용. 업체명은 빼고 할 일만 (예: '서류 독촉')." },
        company: { type: "string", description: "관련 업체명. 없으면 빈 문자열." },
        urgent: { type: "boolean", description: "'급하게/긴급' 같은 표현이 있으면 true." },
      },
    },
    todo: {
      type: "object",
      additionalProperties: false,
      required: ["text", "company", "due"],
      properties: {
        text: { type: "string", description: "할 일 한 줄 (예: 'OO기업 전화하기')." },
        company: { type: "string", description: "관련 업체명. 없으면 빈 문자열." },
        due: { type: "string", description: "마감일 YYYY-MM-DD. 말하지 않았으면 빈 문자열." },
      },
    },
    company: {
      type: "object",
      additionalProperties: false,
      required: ["name", "representative", "phone", "business_number", "region", "industry", "type", "memo"],
      properties: {
        name: { type: "string", description: "상호(회사명)." },
        representative: { type: "string", description: "대표자명." },
        phone: { type: "string", description: "연락처. 숫자만 들리는 대로 010-1234-5678 형식으로." },
        business_number: { type: "string", description: "사업자등록번호 000-00-00000 형식." },
        region: { type: "string", description: "지역." },
        industry: { type: "string", description: "업종." },
        type: { type: "string", enum: ["법인", "개인", ""], description: "법인/개인. 말하지 않았으면 빈 문자열." },
        memo: { type: "string", description: "그 밖에 말한 내용." },
      },
    },
    verify: {
      type: "array",
      items: { type: "string" },
      description:
        "발음이 불명확해 되물어야 하는 숫자 항목의 키 목록. " +
        "전화번호를 들었으면 'phone', 사업자번호를 들었으면 'business_number'를 넣는다. 없으면 빈 배열.",
    },
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "POST 요청만 허용됩니다." });
    return;
  }

  try {
    const { transcript, me, members, teams, companies, today } = req.body || {};
    if (!transcript || !String(transcript).trim()) {
      res.status(400).json({ error: "인식된 말이 없습니다." });
      return;
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      res.status(500).json({ error: "서버에 API 키가 설정되지 않았습니다." });
      return;
    }

    const system = [
      "당신은 정책자금 컨설팅 회사 CRM의 '음성 전용 비서'입니다. 사용자는 운전 중이며 화면을 볼 수 없습니다.",
      "사용자가 말한 한 문장을 듣고, 무엇을 실행해야 하는지 구조화해서 돌려주세요. 당신이 직접 실행하지는 않습니다.",
      "",
      "말하는 사람: " + (me || "미상"),
      "오늘 날짜: " + (today || "미상"),
      "팀원 이름: " + (Array.isArray(members) && members.length ? members.join(", ") : "(없음)"),
      "팀 구성: " + (teams ? JSON.stringify(teams) : "(없음)"),
      "등록된 업체명(일부): " + (Array.isArray(companies) && companies.length ? companies.slice(0, 400).join(", ") : "(없음)"),
      "",
      "규칙:",
      "1) 받는 사람 이름은 반드시 위 '팀원 이름' 중에서 고르세요. 비슷하게 들린 이름은 가장 가까운 팀원으로 보정하세요.",
      "   '법인팀 전체', '개인팀 다' 같은 표현은 '팀 구성'을 보고 그 팀 구성원 이름을 모두 to에 넣으세요.",
      "   확신이 서는 팀원이 없으면 intent를 clarify로 하고 speech에서 이름을 다시 물어보세요.",
      "2) 업체명도 위 '등록된 업체명'에 있으면 그 표기를 그대로 쓰세요. 신규 업체 등록은 예외(목록에 없어도 됨).",
      "3) work_request / my_todo / new_company 는 needs_confirm을 항상 true로 하고,",
      "   speech에는 실행 직전 확인 질문을 넣으세요. 예: \"관호님께 '에이스상사 서류 독촉' 요청 보낼까요?\"",
      "4) 신규 업체 등록에서 전화번호·사업자번호처럼 숫자를 받아쓴 경우, verify 배열에 해당 키를 넣고",
      "   speech에서 그 숫자를 또박또박 되읽어 확인하세요. 예: \"연락처를 010-1234-5678로 들었는데 맞나요?\"",
      "5) '그만', '종료', '끝내줘' 같은 말은 intent=end.",
      "6) 말이 잘려서 뜻이 불완전하면 intent=clarify로 하고 무엇을 다시 말해야 하는지 speech에 담으세요.",
      "7) speech는 소리로 듣는 문장입니다. 목록·기호·마크다운을 쓰지 말고 자연스러운 말로 쓰세요.",
      "8) 말하지 않은 필드는 빈 문자열 또는 빈 배열로 채우세요. 추측해서 만들어내지 마세요.",
    ].join("\n");

    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        // Opus는 thinking이 기본 on이고 max_tokens가 thinking+본문 합산 상한이라 넉넉히 잡는다.
        max_tokens: 4096,
        // 운전 중 응답 지연을 줄이기 위해 낮은 effort. 사고 방지용 확인 단계는 프런트가 강제하므로 안전.
        output_config: { effort: "low", format: { type: "json_schema", schema: SCHEMA } },
        system: system,
        messages: [{ role: "user", content: String(transcript) }],
      }),
    });

    const data = await r.json();
    if (!r.ok) {
      const msg = (data && data.error && data.error.message) || "음성 명령 해석 실패";
      res.status(r.status).json({ error: msg });
      return;
    }

    const raw = (data.content || [])
      .filter(function (b) { return b.type === "text"; })
      .map(function (b) { return b.text; })
      .join("")
      .trim();

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      res.status(502).json({ error: "해석 결과를 읽지 못했습니다." });
      return;
    }

    res.status(200).json({ action: parsed });
  } catch (err) {
    res.status(500).json({ error: "서버 오류: " + (err && err.message ? err.message : String(err)) });
  }
}
