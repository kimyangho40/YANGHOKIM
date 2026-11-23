// 메타 신청 → DB리스트 테스트. App.js 의 ⛳ 메타신청 구간과 Edge Function 의 ⛳ meta-leads-helpers 구간을
// 소스째 떼어내 실행한다(DB·메타 무접촉). 이름·전화는 전부 지어낸 값이다.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const here = path.dirname(fileURLToPath(import.meta.url));
const cut = (file, a, b, ret) => {
  const src = fs.readFileSync(path.join(here, "..", file), "utf8");
  const i = src.indexOf(a), j = src.indexOf(b);
  if (i < 0 || j < 0) { console.error("마커를 찾지 못했습니다: " + file); process.exit(1); }
  return new Function(src.slice(i, j) + "\nreturn { " + ret + " };")();
};
const A = cut("src/App.js", "// ⛳ 메타신청 시작", "// ⛳ 메타신청 끝",
  "isMetaLead, metaAnswers, metaEmployeeOver, metaLeadGrade, META_GRADE_COLORS, metaDurLabel, metaAppliedLabel, metaContactState, leadFirstContactPatch, META_CALL_GOAL_MIN, dbLeadYearRange");
const F = cut("supabase/functions/meta-leads/index.ts", "// ⛳ meta-leads-helpers 시작", "// ⛳ meta-leads-helpers 끝",
  "cleanAnswer, normalizeKrPhone, fieldMap, pickAnswer, kstYearMonth, buildLeadRow");

let pass = 0, fail = 0;
const eq = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (ok) pass++; else { fail++; console.log("❌ " + name + "\n   got : " + JSON.stringify(got) + "\n   want: " + JSON.stringify(want)); }
};
const lead = (ans, extra) => Object.assign({ source: "meta", status: "미연락", meta_answers: ans }, extra || {});

// ① 메타 신청 판별 — 기존 행(source 없음)은 전부 아니다
eq("source=meta", A.isMetaLead({ source: "meta" }), true);
eq("source 없음(기존 행)", A.isMetaLead({ business_name: "x" }), false);
eq("source null", A.isMetaLead({ source: null }), false);
eq("null", A.isMetaLead(null), false);
eq("답이 배열이면 빈 객체", A.metaAnswers({ meta_answers: [1] }), {});
eq("답 없음", A.metaAnswers({}), {});

// ② 직원 수 읽기
eq("2년 모두 이상", A.metaEmployeeOver("5인 이상 / 5인 이상"), { parts: 2, over: 2 });
eq("한 해만 이상", A.metaEmployeeOver("5인 미만 / 5인 이상"), { parts: 2, over: 1 });
eq("둘 다 미만", A.metaEmployeeOver("5인 미만 / 5인 미만"), { parts: 2, over: 0 });
eq("숫자 12명", A.metaEmployeeOver("12명"), { parts: 1, over: 1 });
eq("숫자 3명", A.metaEmployeeOver("3명"), { parts: 1, over: 0 });
eq("빈 값", A.metaEmployeeOver(""), { parts: 0, over: 0 });
eq("없음", A.metaEmployeeOver("없음"), { parts: 1, over: 0 });

// ③ 판정 — 2026-11-20 엑셀과 같은 기준
eq("우선 연락", A.metaLeadGrade(lead({ tax: "아니오", sales: "5억 이상", employees: "5인 이상 / 5인 이상" })), "우선 연락");
eq("검토(매출만)", A.metaLeadGrade(lead({ tax: "아니오", sales: "5억 이상", employees: "5인 미만 / 5인 미만" })), "검토");
eq("검토(직원 한 해만)", A.metaLeadGrade(lead({ tax: "아니오", sales: "1억 미만", employees: "5인 미만 / 5인 이상" })), "검토");
eq("소규모", A.metaLeadGrade(lead({ tax: "아니오", sales: "1억 미만", employees: "5인 미만 / 5인 미만" })), "소규모");
eq("체납이면 신청 불가(다른 답이 좋아도)", A.metaLeadGrade(lead({ tax: "네, 있습니다", sales: "5억 이상", employees: "5인 이상 / 5인 이상" })), "신청 불가");
eq("'아니오'는 체납 아님", A.metaLeadGrade(lead({ tax: "아니오 없습니다", sales: "", employees: "12명" })), "검토");
eq("답이 하나도 없으면 미확인", A.metaLeadGrade(lead({})), "미확인");
eq("판정 5종 전부 색이 있다", ["우선 연락", "검토", "소규모", "신청 불가", "미확인"].every((g) => !!A.META_GRADE_COLORS[g]), true);

// ④ 시각·경과
eq("KST 표기", A.metaAppliedLabel("2026-11-21T05:02:00+0000"), "11/21 14:02");
eq("자정 넘김(UTC 15시 = KST 다음 날 0시)", A.metaAppliedLabel("2026-11-20T15:05:00Z"), "11/21 00:05");
eq("잘못된 값", A.metaAppliedLabel("x"), "");
eq("59분", A.metaDurLabel(59.9), "59분");
eq("2시간", A.metaDurLabel(125), "2시간");
eq("3일", A.metaDurLabel(3 * 1440 + 5), "3일");

// ⑤ 연락 상태
const t0 = Date.parse("2026-11-21T05:00:00Z");
const L = (extra) => lead({}, Object.assign({ applied_at: "2026-11-21T05:00:00Z" }, extra || {}));
eq("3분 뒤 — 남은 시간 2분", A.metaContactState(L(), t0 + 3 * 60000), { tone: "now", label: "남은 시간 2분" });
eq("목표 시간 = 5분", A.META_CALL_GOAL_MIN, 5);
eq("20분 뒤 — 경고", A.metaContactState(L(), t0 + 20 * 60000), { tone: "warn", label: "20분째 미연락" });
eq("2시간 뒤 — 늦음", A.metaContactState(L(), t0 + 125 * 60000), { tone: "late", label: "2시간 넘게 미연락" });
eq("첫 연락 4분", A.metaContactState(L({ status: "연결", first_contact_at: "2026-11-21T05:04:30Z" }), t0 + 9e6), { tone: "ok", label: "4분 만에 연락" });
eq("상태만 바뀌고 시각 없음", A.metaContactState(L({ status: "부재" }), t0 + 9e6), { tone: "ok", label: "연락함" });
eq("기존 행은 null", A.metaContactState({ status: "미연락", applied_at: "2026-11-21T05:00:00Z" }, t0), null);
eq("신청 시각 없으면 null", A.metaContactState(lead({}), t0), null);

// ⑥ 첫 연락 시각 — 기존 행의 저장 payload 를 절대 바꾸지 않는다
const NOW = "2026-11-21T05:04:00.000Z";
eq("미연락 → 연결", A.leadFirstContactPatch(L(), "연결", NOW), { first_contact_at: NOW });
eq("미연락 → 미연락", A.leadFirstContactPatch(L(), "미연락", NOW), {});
eq("이미 찍혀 있으면 안 덮는다", A.leadFirstContactPatch(L({ first_contact_at: "x" }), "연결", NOW), {});
eq("이미 연락한 건의 상태 변경", A.leadFirstContactPatch(L({ status: "부재" }), "연결", NOW), {});
eq("기존 행(직접 입력)은 빈 객체", A.leadFirstContactPatch({ status: "미연락" }, "연결", NOW), {});
eq("행을 못 찾음", A.leadFirstContactPatch(undefined, "연결", NOW), {});

// ⑦ 서버 함수 — 전화번호
eq("+82", F.normalizeKrPhone("+821012345678"), "010-1234-5678");
eq("숫자만", F.normalizeKrPhone("01012345678"), "010-1234-5678");
eq("앞 0 빠짐", F.normalizeKrPhone("1012345678"), "010-1234-5678");
eq("지역번호 10자리", F.normalizeKrPhone("0311234567"), "031-123-4567");
eq("모르는 모양은 원문", F.normalizeKrPhone("12-34"), "12-34");
eq("빈 값", F.normalizeKrPhone(""), "");
eq("밑줄 → 공백", F.cleanAnswer("5인_이상_/_5인_미만"), "5인 이상 / 5인 미만");

// ⑧ 서버 함수 — 신청 1건 → 행 (실제 양식 질문 문구)
const sample = {
  id: "999000111", created_time: "2026-11-21T05:02:00+0000", ad_name: "사업전환 고객 광고",
  field_data: [
    { name: "국세_체납,_금융기관_연체_여부_(_체납_및_연체는_신청_불가합니다_)", values: ["아니오"] },
    { name: "연매출이_어떻게_되시나요?", values: ["5억_이상"] },
    { name: "작년/올_해_평균_상시근로자_수(4대보험_기준)", values: ["5인_이상_/_5인_이상"] },
    { name: "full_name", values: ["홍길동"] },
    { name: "phone_number", values: ["+821000001234"] },
    { name: "company_name", values: ["(주)가나정밀"] },
    { name: "city", values: ["대구"] },
  ],
};
const row = F.buildLeadRow(sample, "사업전환 양식");
eq("사업자명·연락처", [row.business_name, row.contact], ["(주)가나정밀", "010-0000-1234"]);
eq("연·월은 KST", [row.year, row.month], [2026, 11]);
eq("직접 입력과 같은 기본값", [row.status, row.assignee, row.assigned_by, row.call_1, row.etc], ["미연락", "", "", "", ""]);
eq("메타 전용 칸", [row.source, row.meta_lead_id, row.meta_form_name, row.meta_ad_name, row.applied_at], ["meta", "999000111", "사업전환 양식", "사업전환 고객 광고", "2026-11-21T05:02:00.000Z"]);
eq("양식 답", [row.meta_answers.name, row.meta_answers.city, row.meta_answers.tax, row.meta_answers.sales, row.meta_answers.employees], ["홍길동", "대구", "아니오", "5억 이상", "5인 이상 / 5인 이상"]);
eq("원문 7개 보존", Object.keys(row.meta_answers.raw).length, 7);
eq("판정·경과 시간은 저장하지 않는다", ["lead_grade", "grade", "first_contact_at"].filter((k) => k in row), []);
eq("서버가 만든 행을 화면 판정이 그대로 읽는다", A.metaLeadGrade(row), "우선 연락");
eq("전화가 없으면 넣지 않는다", F.buildLeadRow({ id: "1", field_data: [{ name: "full_name", values: ["가"] }] }, "f"), null);
eq("회사명이 없으면 이름", F.buildLeadRow({ id: "2", created_time: "2026-12-31T16:00:00Z", field_data: [{ name: "full_name", values: ["김영희"] }, { name: "phone_number", values: ["01000005678"] }] }, "f").business_name, "김영희");
eq("연말 UTC 16시 = KST 새해 1월", (() => { const r = F.buildLeadRow({ id: "3", created_time: "2026-12-31T16:00:00Z", field_data: [{ name: "phone_number", values: ["01000005678"] }] }, "f"); return [r.year, r.month, r.business_name]; })(), [2027, 1, "(이름 없음)"]);

// ⑨ 연결 지점 — 첫 연락 시각을 찍는 곳 3곳, 저장소에 토큰·실명 없음
const app = fs.readFileSync(path.join(here, "..", "src", "App.js"), "utf8");
eq("leadFirstContactPatch 호출 3곳(정의 제외)", app.split("leadFirstContactPatch(").length - 2, 3);
const fn = fs.readFileSync(path.join(here, "..", "supabase", "functions", "meta-leads", "index.ts"), "utf8");
eq("함수 소스에 토큰 모양 없음", /EAA[A-Za-z0-9]{20,}|sbp_[A-Za-z0-9]{10,}/.test(fn), false);

// ⑩ DB리스트 연도 범위 — 2026 고정을 없앤 뒤 화살표가 갈 수 있는 해
eq("올해만 있으면 올해", A.dbLeadYearRange([{ year: 2026 }], 2026), { min: 2026, max: 2026 });
eq("내년 1월 신청이 들어오면 내년까지", A.dbLeadYearRange([{ year: 2026 }, { year: 2027 }], 2026), { min: 2026, max: 2027 });
eq("해가 바뀌어도 지난해로 돌아갈 수 있다", A.dbLeadYearRange([{ year: 2026 }], 2027), { min: 2026, max: 2027 });
eq("휴지통 행은 범위에 안 넣는다", A.dbLeadYearRange([{ year: 2024, deleted_at: "x" }, { year: 2026 }], 2026), { min: 2026, max: 2026 });
eq("이상한 해·빈 값 무시", A.dbLeadYearRange([{ year: 0 }, { year: null }, { year: 99999 }, null], 2026), { min: 2026, max: 2026 });
eq("배열이 아니어도 올해", A.dbLeadYearRange(undefined, 2026), { min: 2026, max: 2026 });
eq("DB리스트에 2026 고정이 남아 있지 않다", /l.year !== 2026|year: 2026, month:/.test(app), false);

// ⑪ 실제 양식(2026-11-23 사고) — 전화 칸 이름이 phone 이고, phone_number_verified(true/false)가 같이 온다
const real = [{ name: "full_name", values: ["가"] }, { name: "phone_number_verified", values: ["true"] }, { name: "phone", values: ["+821000001234"] }, { name: "company_name", values: ["가나"] }];
eq("phone 칸의 번호를 연락처로", F.buildLeadRow({ id: "9", field_data: real }, "f").contact, "010-0000-1234");
eq("순서가 바뀌어도 verified 를 고르지 않는다", F.buildLeadRow({ id: "9", field_data: real.slice().reverse() }, "f").contact, "010-0000-1234");
eq("verified 만 있고 번호가 없으면 넣지 않는다", F.buildLeadRow({ id: "9", field_data: [{ name: "phone_number_verified", values: ["true"] }, { name: "full_name", values: ["가"] }] }, "f"), null);
eq("숫자가 아닌 답은 전화가 아니다", F.buildLeadRow({ id: "9", field_data: [{ name: "연락처_수집_동의", values: ["예"] }] }, "f"), null);

console.log((fail ? "❌ " : "✅ ") + pass + "/" + (pass + fail));
process.exit(fail ? 1 : 0);
