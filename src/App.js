/* eslint-disable no-unused-vars, react-hooks/exhaustive-deps, no-redeclare */
import { useState, useMemo, useEffect, useCallback, useRef, Fragment } from "react";
import { createClient } from "@supabase/supabase-js";

// ── Supabase 설정 ─────────────────────────────────────────────────────────────
// 내보내기(목록 복사) 권한을 가진 계정 이메일 — 이 계정만 내보내기 버튼이 보임
const EXPORT_OWNER_EMAIL = "kimyangho000@gmail.com";
const SUPABASE_URL = "https://ujdrjvnihxjvbkezjvwc.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqZHJqdm5paHhqdmJrZXpqdndjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzOTgzODIsImV4cCI6MjA5Mzk3NDM4Mn0.K0zbRGT8SrDBeZoDyc_VM61xAHZye8V0p0m2PemNUWM";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== "undefined" ? window.localStorage : undefined,
    storageKey: "sb-yanghokim-auth",
  },
});

// ── 상수 ─────────────────────────────────────────────────────────────────────
const STAGES = ["상담/진단완료", "필수서류 및 인증서요청", "기관신청대기/방문예정", "스크립트 전달 완료", "기관신청완료/방문완료", "심사중/실태조사대기", "실태조사완료/약정완료", "자금집행완료", "수수료대기 및 입금요청", "입금완료/사후관리", "추가 진행 예정", "추가 진행 중", "부결/반려", "기타"];
const STAGE_COLORS = {
  "상담/진단완료":           { bg: "#EEF2FF", text: "#4338CA", border: "#C7D2FE" },
  "필수서류 및 인증서요청":  { bg: "#FFF7ED", text: "#C2410C", border: "#FED7AA" },
  "기관신청대기/방문예정":   { bg: "#FFF1F2", text: "#BE123C", border: "#FECDD3" },
  "스크립트 전달 완료":       { bg: "#F0FDF4", text: "#15803D", border: "#BBF7D0" },
  "기관신청완료/방문완료":   { bg: "#ECFDF5", text: "#047857", border: "#A7F3D0" },
  "심사중/실태조사대기":     { bg: "#FFFBEB", text: "#B45309", border: "#FDE68A" },
  "실태조사완료/약정완료":   { bg: "#FEF3C7", text: "#92400E", border: "#FCD34D" },
  "자금집행완료":            { bg: "#F5F3FF", text: "#7C3AED", border: "#DDD6FE" },
  "수수료대기 및 입금요청":  { bg: "#FDF4FF", text: "#A21CAF", border: "#F0ABFC" },
  "입금완료/사후관리":       { bg: "#F0FDF4", text: "#166534", border: "#86EFAC" },
  "추가 진행 예정":          { bg: "#F5F3FF", text: "#6D28D9", border: "#C4B5FD" },
  "추가 진행 중":            { bg: "#EFF6FF", text: "#1D4ED8", border: "#93C5FD" },
  "부결/반려":              { bg: "#FEE2E2", text: "#DC2626", border: "#FCA5A5" },
  "기타":                    { bg: "#F7F6F3", text: "#666",    border: "#D1D5DB" },
};
// 기관 케이스(agency_cases) 상태 분류 단일 기준 — 승인계열/부결계열을 여기 한 곳에서만 정의
const DONE_STATUSES = ["승인", "약정", "완료"];
const REJECT_STATUSES = ["부결", "반려", "신청취소", "진행불가", "신청못함", "중단"];
const AGENCIES =["소상공인시장진흥공단","중소벤처기업진흥공단","신용보증기금","농협신용보증기금","신용보증재단","기술보증기금","서민금융진흥원","구조혁신&사업전환","기타"];
const JUNGINGONG_PRODUCTS = ["창업기반지원","청년창업자금","혁신성장지원","개발기술사업화","재창업","내수기업수출기업화(10만불 미만)","수출기업글로벌화(10만불 이상)","사업전환","구조개선","긴급경영 안정자금","기타"];
const SOJINGONG_PRODUCTS = ["신용취약자금","재도전특별자금","혁신성장 촉진자금(스마트 기술)","혁신성장 촉진자금(2년 연속 매출 10% 신장)","혁신성장 촉진자금(수출 자금)","혁신성장 촉진자금(그 외 기타)","상생성장지원자금","그 외 기타","대리대출"];

// 신청상품별 색상 (배경/글자)
const PRODUCT_COLORS = {
  // 중진공 (보라 계열)
  "창업기반지원":              { bg: "#EDE9FE", text: "#5B21B6" },
  "청년창업자금":              { bg: "#DDD6FE", text: "#4C1D95" },
  "혁신성장지원":              { bg: "#E0E7FF", text: "#3730A3" },
  "개발기술사업화":            { bg: "#C7D2FE", text: "#312E81" },
  "재창업":                    { bg: "#FAE8FF", text: "#86198F" },
  "내수기업수출기업화(10만불 미만)": { bg: "#FCE7F3", text: "#9D174D" },
  "수출기업글로벌화(10만불 이상)":   { bg: "#FBCFE8", text: "#831843" },
  "사업전환":                  { bg: "#E9D5FF", text: "#6B21A8" },
  "구조개선":                  { bg: "#F3E8FF", text: "#7E22CE" },
  // 소진공 (파랑/녹색 계열)
  "신용취약자금":              { bg: "#FEE2E2", text: "#991B1B" },
  "재도전특별자금":            { bg: "#FED7AA", text: "#9A3412" },
  "혁신성장 촉진자금(스마트 기술)":      { bg: "#DBEAFE", text: "#1E40AF" },
  "혁신성장 촉진자금(2년 연속 매출 10% 신장)": { bg: "#BFDBFE", text: "#1E3A8A" },
  "혁신성장 촉진자금(수출 자금)":         { bg: "#A5F3FC", text: "#155E75" },
  "혁신성장 촉진자금(그 외 기타)":        { bg: "#CFFAFE", text: "#0E7490" },
  "상생성장지원자금":          { bg: "#D1FAE5", text: "#065F46" },
  "그 외 기타":                { bg: "#F0FDF4", text: "#166534" },
  "대리대출":                  { bg: "#FEF3C7", text: "#92400E" },
  "긴급경영 안정자금":          { bg: "#FFE4E6", text: "#9F1239" },
  "기타":                      { bg: "#F3F4F6", text: "#374151" },
};
// KST(한국시간) 기준 날짜 문자열 YYYY-MM-DD. UTC 사용 시 오전에 하루 밀리는 버그 방지
function kstDate(offsetDays) {
  var d = new Date();
  if (offsetDays) d = new Date(d.getTime() + offsetDays * 86400000);
  return new Date(d.getTime() + 9 * 3600000).toISOString().slice(0, 10);
}

// 차기 업무(자유 텍스트)에서 날짜(6/30, 6월30일, 6.30)를 뽑아 가장 가까운 마감일 추정
function parseActionDates(text) {
  if (!text) return [];
  var now = new Date(); var yr = now.getFullYear();
  var out = []; var re = /(\d{1,2})\s*[\/월.]\s*(\d{1,2})/g; var m;
  while ((m = re.exec(text)) !== null) {
    var mo = parseInt(m[1]), d = parseInt(m[2]);
    if (mo < 1 || mo > 12 || d < 1 || d > 31) continue;
    out.push(new Date(yr, mo - 1, d));
  }
  return out;
}
function nearestActionDate(text) {
  var dates = parseActionDates(text);
  if (!dates.length) return null;
  var today = new Date(); today.setHours(0, 0, 0, 0);
  var future = dates.filter(function(d) { return d >= today; }).sort(function(a, b) { return a - b; });
  if (future.length) return future[0];
  return dates.sort(function(a, b) { return b - a; })[0];
}
function daysUntil(date) {
  if (!date) return null;
  var today = new Date(); today.setHours(0, 0, 0, 0);
  var d = new Date(date); d.setHours(0, 0, 0, 0);
  return Math.round((d - today) / 86400000);
}
// next_action 텍스트에서 특정 월(1~12) 표기를 찾는다.
// 인식 형식: "7월","07월","7/","07/","7.","07." (숫자 앞뒤 글자 무관)
// "17월"→17, "107월"→앞자리 숫자면 스킵 해서 잘못된 월 오매칭 방지.
function actionHasMonth(text, month) {
  if (!text) return false;
  var re = /(\d{1,2})\s*(?:월|[./])/g;
  var m;
  while ((m = re.exec(text)) !== null) {
    var prev = m.index > 0 ? text.charAt(m.index - 1) : "";
    if (prev >= "0" && prev <= "9") continue; // 앞자리가 숫자면(예: 17월, 107월) 스킵
    var mm = parseInt(m[1], 10);
    if (mm >= 1 && mm <= 12 && mm === month) return true;
  }
  return false;
}

function getProductColor(name) {
  if (!name) return null;
  return PRODUCT_COLORS[name] || { bg: "#F3F4F6", text: "#374151" };
}

// 지역별 색상 구분
// 경기/인천 = 노란색, 서울 = 파란색, 그 외 지방 = 녹색
function getRegionColor(region) {
  if (!region) return null;
  var r = String(region).trim();
  if (r.indexOf("경기") === 0 || r.indexOf("인천") === 0) return { bg: "#FEF3C7", text: "#92400E", border: "#FDE68A" };
  if (r.indexOf("서울") === 0) return { bg: "#DBEAFE", text: "#1E40AF", border: "#BFDBFE" };
  return { bg: "#D1FAE5", text: "#065F46", border: "#A7F3D0" }; // 지방
}

const AGENCY_GROUPS = [
  { id: "소상공인시장진흥공단", label: "소상공인시장진흥공단", color: "#4338CA" },
  { id: "신용보증기금", label: "신용보증기금", color: "#0F6E56" },
  { id: "농협신용보증기금", label: "농협신용보증기금", color: "#0D9488" },
  { id: "기술보증기금", label: "기술보증기금", color: "#0369A1" },
  { id: "신용보증재단", label: "신용보증재단", color: "#B45309" },
  { id: "중소벤처기업진흥공단", label: "중소벤처기업진흥공단", color: "#7C3AED" },
  { id: "구조혁신&사업전환", label: "구조혁신&사업전환", color: "#BE123C" },
  { id: "경정청구", label: "경정청구", color: "#0369A1" },
  { id: "기타", label: "기타", color: "#555" },
];
// 기업목록 기관별 필터: 짧은 라벨 → company.agency에 들어올 수 있는 전체 명칭 집합
const AGENCY_FILTER_OPTS = ["전체", "소진공", "중진공", "신보", "농협신보", "기보", "재단"];
const AGENCY_FILTER_MAP = {
  "소진공": ["소상공인시장진흥공단"],
  "중진공": ["중소벤처기업진흥공단", "구조혁신&사업전환"],
  "신보": ["신용보증기금"],
  "농협신보": ["농협신용보증기금"],
  "기보": ["기술보증기금"],
  "재단": ["신용보증재단", "서민금융진흥원"], // 서민금융진흥원→재단 (AGENCY_MAP과 동일)
};
// 업체명(name) 기준 팀 자동 분류 — DB 변경 없이 화면에서만 사용
// "(주)"·"㈜"·"주식회사" 중 하나라도 포함되면 법인팀(위치·띄어쓰기 무관), 그 외 개인팀
function teamByName(name) {
  var n = (name || "").replace(/\s+/g, "");
  return (n.indexOf("(주)") !== -1 || n.indexOf("㈜") !== -1 || n.indexOf("주식회사") !== -1) ? "법인팀" : "개인팀";
}
// 업체의 팀 반환: DB에 저장된 team이 있으면 우선 사용(수동 변경 반영), 없으면 업체명 기준 자동 분류
function teamOf(co) {
  if (co && co.team) return co.team;
  return teamByName(co && co.name);
}
const TEAM_FILTER_OPTS = ["전체", "법인팀", "개인팀"];
const DOC_LIST = ["사업자등록증","최근 3년치 재무제표 (23년~25년)","최근 3년치 부가세 증명원 (23년~25년)","법인 기업 금융거래 확인서","대표자 신용점수","4대보험 명부","월별 고용보험 가입자 명부","그 외 사업전환 필수 서류","최근 1년 수출실적 증명서","사업자 대출 금융거래 확인서","대표자 신분증","임대차 계약서","회사 소개서 또는 사업계획서","2026년 상반기 부가세 증명원","대표자 개인 대출 금융거래 확인서","직전연도 상시근로자 수 파악","기업 인증 자료 (벤처·이노비즈·연구전담 부서 등)","특허 및 상표권 관련 자료"];
const TEAMS = ["법인전담","개인전담","관리자"];
const ASSIGNEES = ["미현","유진","관호","지혜","현애","인선","동일","양호"];
const INDUSTRY_OPTIONS = ["제조업","농업·어업","숙박업","음식점업","전자상거래업","정보통신업","도소매업","서비스업","창고업","자동차임대업"];

// ── 정책자금 신규 기능: 상수 & 계산 로직 ─────────────────────────────────────────
const LEAD_SOURCES = ["콘텐츠(릴스/유튜브)", "네이버 블로그", "지인 소개", "DB 구매", "직접 문의", "기존 고객 재의뢰", "기타"];

// 기대출 총액(원) = loans 배열 amount 합
function totalLoanAmount(company) {
  var loans = Array.isArray(company && company.loans) ? company.loans : [];
  return loans.reduce(function(s, ln) {
    var n = parseInt(String((ln && ln.amount) || "").replace(/[^0-9]/g, ""), 10);
    return s + (isNaN(n) ? 0 : n);
  }, 0);
}
// 원 → "N억/N천만/N만" 표기
function wonToKor(won) {
  var n = Number(won) || 0;
  if (n >= 100000000) return (Math.round(n / 10000000) / 10).toString().replace(/\.0$/, "") + "억";
  if (n >= 10000000) return Math.round(n / 10000000) + "천만";
  if (n >= 10000) return Math.round(n / 10000) + "만";
  return n.toLocaleString();
}
// 담당기관 문자열에 특정 기관 포함 여부
function agencyIncludes(company, name) {
  return (company && company.agency ? company.agency : "").split(",").map(function(s) { return s.trim(); }).indexOf(name) >= 0;
}
// 업종별 부채비율 상한(%) — 일반 기준
function industryDebtCap(industry) {
  var s = String(industry || "");
  if (/제조|건설/.test(s)) return 400;
  if (/도매|소매|유통|무역/.test(s)) return 500;
  if (/음식|숙박|서비스|교육|의료/.test(s)) return 300;
  return 400;
}
// 9대 약점 자동 감지 → [{level, label, logic}]
function detectWeaknesses(company) {
  var out = [];
  var kcb = parseInt(company.credit_score_kcb, 10);
  if (!isNaN(kcb) && kcb > 0 && kcb < 700) {
    out.push({ level: "danger", label: "KCB " + kcb + " (700 미만)", logic: "신용점수가 낮아 보증·대출 심사에서 감점 요인입니다.\n\n[대응 논리]\n• 최근 6개월 무연체·성실상환 이력 강조\n• 매출 증가·수주계약서 등 상환능력 근거 첨부\n• 개인신용보다 사업성 중심으로 프레이밍\n• KCB 개선(카드 사용·한도관리) 후 재신청 타이밍 안내" });
  }
  var loan = totalLoanAmount(company);
  if (loan >= 250000000) {
    out.push({ level: "danger", label: "기대출 " + wonToKor(loan) + " (2.5억↑)", logic: "기존 대출 과다로 추가 한도 여력이 낮습니다.\n\n[대응 논리]\n• 고금리 대출 대환 목적으로 프레이밍(이자부담 경감)\n• 매출 대비 부채 적정성 강조\n• 일부 상환 후 신청 또는 정책자금 갈아타기 제안" });
  } else if (loan >= 150000000) {
    out.push({ level: "warn", label: "기대출 " + wonToKor(loan) + " (1.5~2.5억)", logic: "기대출이 다소 높습니다. 한도 산정 시 주의.\n\n[대응 논리]\n• 정책자금 대환·저리 전환 목적 강조\n• 상환 계획·매출 근거 제시" });
  }
  var r24 = Number(company.revenue_2024) || 0, r25 = Number(company.revenue_2025) || 0;
  if (r24 > 0 && r25 > 0 && r25 < r24 * 0.85) {
    out.push({ level: "warn", label: "매출 급감(25년<24년 85%)", logic: "전년 대비 매출 15%↑ 감소.\n\n[대응 논리]\n• 일시적 요인(업황·투자·일회성) 설명 자료\n• 26년 상반기 회복 추세·수주잔고 제시\n• 구조개선·사업전환 자금으로 포지셔닝" });
  }
  var icr = parseFloat(company.interest_coverage_ratio);
  if (!isNaN(icr) && icr > 0 && icr < 1.0) {
    out.push({ level: "danger", label: "이자보상배율 " + icr + " (1.0 미만)", logic: "영업이익으로 이자비용을 감당하지 못하는 상태.\n\n[대응 논리]\n• 영업외 손실 등 일시적 요인 분리 설명\n• 대환 시 이자부담 경감 시뮬레이션 제시\n• 향후 매출·이익 개선 계획 첨부" });
  }
  if (agencyIncludes(company, "중소벤처기업진흥공단")) {
    var dr = parseFloat(company.debt_ratio);
    var cap = industryDebtCap(company.industry);
    if (!isNaN(dr) && dr > 0 && dr > cap) {
      out.push({ level: "danger", label: "부채비율 " + dr + "% (상한 " + cap + "%↑)", logic: "업종 평균 대비 부채비율 과다(중진공 심사 감점).\n\n[대응 논리]\n• 자본확충(증자·이익잉여금) 계획 제시\n• 업종 특성상 정상범위임을 근거로 설명\n• 부채 구조조정 후 신청 타이밍 조정" });
    }
  }
  var text = [company.issue, company.next_action, company.company_info_memo].join(" ");
  if (/연체|체납|압류|국세.*미납|세금.*미납/.test(text)) {
    out.push({ level: "danger", label: "연체/체납 이력 감지", logic: "연체·체납 이력은 대부분 기관에서 결격 사유.\n\n[대응 논리]\n• 완납 증명·분납 약정서 확보 후 신청\n• 체납 해소 시점·사유 소명자료 준비\n• 미해소 시 신청 보류 권고" });
  }
  return out;
}
// 기관 자동 추천 → [{agency, reason}]
function recommendAgencies(company) {
  var out = [];
  var kcb = parseInt(company.credit_score_kcb, 10);
  var emp = parseInt(company.employee_count, 10);
  var bt = String(company.business_type || "");
  var region = String(company.region || "");
  var industry = String(company.industry || "");
  var text = [industry, company.issue, company.next_action, company.company_info_memo].join(" ");
  if (/특허|연구소|연구전담|이노비즈|벤처인증/.test(text)) out.push({ agency: "기술보증기금", reason: "특허·연구소 등 기술요소 보유" });
  if (/법인/.test(bt) && !isNaN(kcb) && kcb >= 750) out.push({ agency: "신용보증기금", reason: "법인 + KCB 750↑" });
  if (/제조/.test(industry) && !isNaN(emp) && emp >= 5) out.push({ agency: "중소벤처기업진흥공단", reason: "제조업 + 직원 5명↑" });
  if (/개인/.test(bt)) out.push({ agency: "소상공인시장진흥공단", reason: "개인사업자" });
  if (region && !/^(서울|경기|인천)/.test(region.replace(/\s/g, ""))) out.push({ agency: "신용보증재단", reason: "비수도권 소재" });
  return out;
}
// 자금집행 후 사후관리(3/6/12개월) 판정
function followupInfo(company) {
  var executed = ["자금집행완료", "수수료대기 및 입금요청", "입금완료/사후관리"];
  if (executed.indexOf(company.stage) < 0) return null;
  var base = company.stage_updated_at || company.contract_date;
  if (!base) return null;
  var bd = new Date(base);
  if (isNaN(bd.getTime())) return null;
  var now = new Date();
  var marks = [{ m: 3, label: "3개월" }, { m: 6, label: "6개월" }, { m: 12, label: "1년" }];
  var due = null, next = null;
  for (var i = 0; i < marks.length; i++) {
    var d = new Date(bd); d.setMonth(d.getMonth() + marks[i].m);
    var diffDays = Math.floor((now - d) / (1000 * 60 * 60 * 24));
    if (diffDays >= 0 && diffDays <= 31 && !due) due = { mark: marks[i], date: d };
    if (diffDays < 0 && !next) next = { mark: marks[i], date: d };
  }
  if (!due && !next) return null;
  return { due: due, next: next };
}
// 예상 수수료(원)
function expectedFee(company) {
  var amt = parseInt(String(company.approved_amount || "").replace(/[^0-9]/g, ""), 10);
  if (isNaN(amt) || amt <= 0) return 0;
  var rate = parseFloat(company.fee);
  if (isNaN(rate) || rate <= 0) rate = 5;
  return Math.round(amt * rate / 100);
}
// 신보 예상 한도 매트릭스
const SINBO_LOAN_BUCKETS = [
  { label: "없음", won: 0 }, { label: "3천만", won: 30000000 }, { label: "5천만", won: 50000000 },
  { label: "1억", won: 100000000 }, { label: "1.5억", won: 150000000 }, { label: "2억", won: 200000000 },
  { label: "2.5억", won: 250000000 }, { label: "3억", won: 300000000 },
];
const SINBO_LIMIT_MATRIX = {
  high: [300000000, 300000000, 250000000, 200000000, 150000000, 100000000, 50000000, 0],
  mid:  [200000000, 200000000, 150000000, 100000000, 80000000, 50000000, 30000000, 0],
  low:  [100000000, 80000000, 50000000, 30000000, 20000000, 10000000, 0, 0],
};
function sinboTier(kcb) {
  var n = parseInt(kcb, 10);
  if (isNaN(n)) return null;
  if (n >= 850) return "high";
  if (n >= 750) return "mid";
  return "low";
}

// ── 중진공 정책우선도 배점표(선택형) ─────────────────────────────────────────────
// agency_cases.priority_checks 에 { [key]: 점수 } 형태로 배점 선택값을 함께 저장 (기존 60개 체크값은 그대로 유지)
// ①혁신성장분야·첫거래는 기존 체크리스트에 항목이 없어 배점 섹션에서 직접 선택, ⑤정책우대는 기존 '정책우대' 카테고리 체크로 자동 반영
const JUNGINGONG_SCORE_FORM = [
  { cat: "① 중점지원 (10점)", items: [
    { key: "innov", label: "혁신성장분야", opts: [{ t: "해당", p: 5 }, { t: "미해당", p: 0 }] },
    { key: "firstDeal", label: "첫거래 여부", opts: [{ t: "첫거래기업", p: 5 }, { t: "기지원", p: 0 }] },
  ] },
  { cat: "② 고용기여 (20점)", items: [
    { key: "hireNew", label: "고용창출 실적", opts: [{ t: "10명 초과", p: 15 }, { t: "6~10명", p: 13 }, { t: "2~5명", p: 10 }, { t: "1명", p: 7 }, { t: "고용유지", p: 3 }, { t: "고용감소", p: 0 }] },
    { key: "hireKeep", label: "고용유지 실적", opts: [{ t: "인재육성·가족친화", p: 5 }, { t: "내일채움공제", p: 3 }, { t: "미해당", p: 0 }] },
  ] },
  { cat: "③ 기술경영혁신 (25점)", items: [
    { key: "ip", label: "3년내 지식재산권", opts: [{ t: "4건 이상", p: 10 }, { t: "1~3건", p: 7 }, { t: "0건", p: 3 }] },
    { key: "techInno", label: "기술경영혁신분야", opts: [{ t: "3건 이상", p: 15 }, { t: "2건", p: 13 }, { t: "1건", p: 10 }, { t: "0건", p: 5 }] },
  ] },
  { cat: "④ 글로벌화 (10점)", items: [
    { key: "exportUsd", label: "직수출 실적", opts: [{ t: "100만불 초과", p: 10 }, { t: "100만불 이하", p: 7 }, { t: "10만불 이하", p: 5 }, { t: "내수기업", p: 0 }] },
  ] },
  { cat: "⑥ 성장잠재력 AI평가 (30점)", items: [
    { key: "kgrade", label: "AI K등급", opts: [{ t: "K1~K3", p: 30 }, { t: "K4~K6", p: 25 }, { t: "K7~K9", p: 20 }, { t: "K10~K11", p: 15 }, { t: "K12~K13", p: 10 }] },
  ] },
];
const JUNGINGONG_SCORE_KEYS = (function() {
  var ks = []; JUNGINGONG_SCORE_FORM.forEach(function(c) { c.items.forEach(function(it) { ks.push(it.key); }); }); return ks;
})();
// ⑤ 정책우대(5점): 기존 체크리스트 '정책우대' 카테고리 항목 (하나라도 체크 시 5점)
const JUNGINGONG_POLICY_PREF_ITEMS = ["소부장 강소기업 100·스타트업100·경쟁력위원회 추천기업", "아기유니콘 200", "지역혁신 선도기업 선정", "글로벌 강소기업", "여성기업", "무명의 수출용사", "튼튼한 내수기업", "글로벌 강소기업 1000+(강소이상)", "수출국 다변화", "수출다변화 계획보유"];
function junginggongPolicyPref(checks) { return JUNGINGONG_POLICY_PREF_ITEMS.some(function(i) { return checks && checks[i]; }) ? 5 : 0; }
// priority_checks(문자열/객체) → 총점(배점 미입력이면 null)
function calcJunginggongScore(priorityChecks) {
  var checks = priorityChecks;
  if (typeof checks === "string") { try { checks = JSON.parse(checks || "{}"); } catch (e) { checks = {}; } }
  if (!checks || typeof checks !== "object") return null;
  var formHas = JUNGINGONG_SCORE_KEYS.some(function(k) { return checks[k] !== undefined && checks[k] !== null; });
  var prefChecked = junginggongPolicyPref(checks) > 0;
  if (!formHas && !prefChecked) return null;
  var total = 0;
  JUNGINGONG_SCORE_KEYS.forEach(function(k) { var v = Number(checks[k]); if (!isNaN(v)) total += v; });
  total += junginggongPolicyPref(checks); // ⑤ 정책우대(기존 체크리스트 연동)
  return total;
}
function priorityScoreColor(total) {
  return total >= 70 ? "#15803D" : total >= 50 ? "#B45309" : "#DC2626";
}

// 자동 감지 배지(약점·추천·사후관리) + 대응논리 팝업
function PolicyBadges({ company }) {
  const [popup, setPopup] = useState(null);
  var weaknesses = detectWeaknesses(company);
  var recos = recommendAgencies(company);
  var fu = followupInfo(company);
  if (weaknesses.length === 0 && recos.length === 0 && !fu) return null;
  return (
    <div style={{ marginBottom: 10 }}>
      {weaknesses.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 6 }}>
          {weaknesses.map(function(w, i) {
            var danger = w.level === "danger";
            return (
              <button key={i} onClick={function() { setPopup({ title: (danger ? "🔴 " : "🟡 ") + w.label, body: w.logic }); }}
                style={{ fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 99, cursor: "pointer", background: danger ? "#FEE2E2" : "#FEF3C7", color: danger ? "#DC2626" : "#92400E", border: "1px solid " + (danger ? "#FCA5A5" : "#FDE68A") }}>
                {danger ? "🔴" : "🟡"} {w.label}
              </button>
            );
          })}
        </div>
      )}
      {recos.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 6 }}>
          {recos.map(function(r, i) {
            return <span key={i} title={r.reason} style={{ fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 99, background: "#ECFDF5", color: "#047857", border: "1px solid #A7F3D0" }}>👍 추천: {r.agency}</span>;
          })}
        </div>
      )}
      {fu && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 99, background: fu.due ? "#EFF6FF" : "#F7F6F3", color: fu.due ? "#1D4ED8" : "#888", border: "1px solid " + (fu.due ? "#93C5FD" : "#E8E5E0") }}>
            {fu.due ? "🔔 사후관리 " + fu.due.mark.label + " 도래 · 추가 상담 타이밍" : "🗓 다음 사후관리: " + fu.next.mark.label + " (" + fu.next.date.toISOString().slice(0, 10) + ")"}
          </span>
        </div>
      )}
      {popup && (
        <div onMouseDown={function(e) { if (e.target === e.currentTarget) setPopup(null); }}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "#fff", borderRadius: 12, width: 420, maxWidth: "100%", padding: "22px 24px", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800 }}>{popup.title}</h3>
              <button onClick={function() { setPopup(null); }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "#888" }}>✕</button>
            </div>
            <div style={{ fontSize: 13, color: "#333", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{popup.body}</div>
          </div>
        </div>
      )}
    </div>
  );
}
// 중진공 정책우선도 자동 계산기 (기능1)
function JunginggongCalc() {
  const [v, setV] = useState({ innov: false, first: false, hires: "", patents: "", exportUsd: "", pref: false, kgrade: "" });
  var set = function(k, val) { setV(function(p) { return Object.assign({}, p, { [k]: val }); }); };
  var s1 = v.innov ? 5 : 0, s2 = v.first ? 5 : 0;
  var s3 = Math.min(20, (parseInt(v.hires, 10) || 0) * 5);
  var s4 = Math.min(25, (parseInt(v.patents, 10) || 0) * 5);
  var exp = parseFloat(String(v.exportUsd).replace(/[^0-9.]/g, "")) || 0;
  var s5 = exp >= 1000000 ? 10 : exp >= 100000 ? 7 : exp > 0 ? 4 : 0;
  var s6 = v.pref ? 5 : 0;
  var k = parseInt(v.kgrade, 10);
  var s7 = (!isNaN(k) && k >= 1 && k <= 13) ? Math.round(30 * (14 - k) / 13) : 0;
  var total = s1 + s2 + s3 + s4 + s5 + s6 + s7;
  var color = total >= 70 ? "#15803D" : total >= 50 ? "#B45309" : "#DC2626";
  var barBg = total >= 70 ? "#DCFCE7" : total >= 50 ? "#FEF3C7" : "#FEE2E2";
  var chk = function(key, label, pts) {
    return (
      <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, cursor: "pointer", background: "#fff", border: "1px solid #E8E5E0", borderRadius: 6, padding: "6px 9px" }}>
        <input type="checkbox" checked={v[key]} onChange={function(e) { set(key, e.target.checked); }} style={{ accentColor: "#7C3AED" }} />
        <span style={{ flex: 1 }}>{label}</span><span style={{ color: "#7C3AED", fontWeight: 700 }}>{pts}점</span>
      </label>
    );
  };
  var numRow = function(key, label, unit, sc, max) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#fff", border: "1px solid #E8E5E0", borderRadius: 6, padding: "6px 9px" }}>
        <span style={{ fontSize: 12, flex: 1 }}>{label}</span>
        <input type="number" value={v[key]} onChange={function(e) { set(key, e.target.value); }} placeholder="0"
          style={{ width: 64, fontSize: 12, textAlign: "right", border: "1px solid #E8E5E0", borderRadius: 5, padding: "3px 6px", outline: "none" }} />
        <span style={{ fontSize: 11, color: "#999", width: 24 }}>{unit}</span>
        <span style={{ color: "#7C3AED", fontWeight: 700, fontSize: 12, width: 46, textAlign: "right" }}>{sc}/{max}</span>
      </div>
    );
  };
  return (
    <div style={{ background: "#F5F3FF", borderRadius: 10, padding: "14px 15px", marginBottom: 10, border: "1px solid #DDD6FE" }}>
      <div style={{ fontSize: 13, fontWeight: 800, color: "#6D28D9", marginBottom: 10 }}>🎯 중진공 정책우선도 자동 계산기</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
        {chk("innov", "① 혁신성장분야", 5)}
        {chk("first", "② 첫거래기업", 5)}
        {numRow("hires", "③ 고용기여 (신규채용)", "명", s3, 20)}
        {numRow("patents", "④ 기술경영혁신 (특허·인증)", "건", s4, 25)}
        {numRow("exportUsd", "⑤ 글로벌화 (직수출)", "$", s5, 10)}
        {chk("pref", "⑥ 정책우대기업", 5)}
        {numRow("kgrade", "⑦ AI K등급 (1~13, 낮을수록↑)", "K", s7, 30)}
      </div>
      <div style={{ background: barBg, borderRadius: 8, padding: "10px 12px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#555" }}>총점</span>
          <span style={{ fontSize: 20, fontWeight: 800, color: color }}>{total}<span style={{ fontSize: 12, color: "#999" }}>/100</span></span>
        </div>
        <div style={{ height: 10, background: "#fff", borderRadius: 99, overflow: "hidden" }}>
          <div style={{ width: Math.min(100, total) + "%", height: "100%", background: color, borderRadius: 99, transition: "width 0.2s" }} />
        </div>
        <div style={{ fontSize: 11, color: color, fontWeight: 700, marginTop: 6 }}>
          {total >= 70 ? "✅ 우수 (70점↑) — 우선지원 가능성 높음" : total >= 50 ? "⚠ 보통 (50점↑) — 보완 필요" : "🔴 미흡 (50점 미만) — 배점 항목 보강 권장"}
        </div>
      </div>
    </div>
  );
}
// 신보 예상 한도 계산기 (기능2)
function SinboCalc({ company }) {
  const [kcb, setKcb] = useState(company.credit_score_kcb || "");
  const [bucketIdx, setBucketIdx] = useState(function() {
    var loan = totalLoanAmount(company), idx = 0;
    for (var i = 0; i < SINBO_LOAN_BUCKETS.length; i++) { if (loan >= SINBO_LOAN_BUCKETS[i].won) idx = i; }
    return idx;
  });
  var tier = sinboTier(kcb);
  var limit = tier ? SINBO_LIMIT_MATRIX[tier][bucketIdx] : null;
  var tierLabel = tier === "high" ? "KCB 850↑" : tier === "mid" ? "KCB 750~849" : tier === "low" ? "KCB 749↓" : "KCB 입력";
  return (
    <div style={{ background: "#EFF6FF", borderRadius: 10, padding: "14px 15px", marginBottom: 10, border: "1px solid #BFDBFE" }}>
      <div style={{ fontSize: 13, fontWeight: 800, color: "#1D4ED8", marginBottom: 10 }}>💳 신보 예상 한도 계산기</div>
      <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 120 }}>
          <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>KCB 점수</div>
          <input type="number" value={kcb} onChange={function(e) { setKcb(e.target.value); }} placeholder="예: 820"
            style={{ width: "100%", fontSize: 13, padding: "7px 9px", border: "1px solid #E8E5E0", borderRadius: 6, outline: "none", boxSizing: "border-box" }} />
          <div style={{ fontSize: 10, color: "#1D4ED8", marginTop: 3, fontWeight: 700 }}>{tierLabel}</div>
        </div>
        <div style={{ flex: 1, minWidth: 120 }}>
          <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>기대출 잔액</div>
          <select value={bucketIdx} onChange={function(e) { setBucketIdx(parseInt(e.target.value, 10)); }}
            style={{ width: "100%", fontSize: 13, padding: "7px 9px", border: "1px solid #E8E5E0", borderRadius: 6, background: "#fff", outline: "none", boxSizing: "border-box" }}>
            {SINBO_LOAN_BUCKETS.map(function(b, i) { return <option key={i} value={i}>{b.label}</option>; })}
          </select>
        </div>
      </div>
      <div style={{ background: "#fff", borderRadius: 8, padding: "12px 14px", textAlign: "center" }}>
        <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>예상 보증 한도</div>
        {tier ? (
          <div style={{ fontSize: 22, fontWeight: 800, color: limit > 0 ? "#1D4ED8" : "#DC2626" }}>
            {limit > 0 ? wonToKor(limit) + " 원" : "한도 없음"}
          </div>
        ) : <div style={{ fontSize: 13, color: "#AAA" }}>KCB 점수를 입력하세요</div>}
        <div style={{ fontSize: 10, color: "#888", marginTop: 4 }}>* 일반 기준 추정치 · 실제 심사 결과와 다를 수 있음</div>
      </div>
    </div>
  );
}

// 기본 업종 + companies에서 추출한 커스텀 업종 통합 옵션
// 사용자가 수동 입력한 업종도 다음 선택부터 옵션에 나타나도록 함
function getMergedIndustryOptions(companies) {
  var fromCompanies = new Set();
  (companies || []).forEach(function(co) {
    if (!co || !co.industry) return;
    co.industry.split(",").forEach(function(part) {
      var t = (part || "").trim();
      if (t) fromCompanies.add(t);
    });
  });
  // 기본 옵션 먼저, 그 뒤에 커스텀 (가나다순)
  var custom = Array.from(fromCompanies).filter(function(x) {
    return INDUSTRY_OPTIONS.indexOf(x) < 0;
  }).sort(function(a, b) { return a.localeCompare(b, "ko"); });
  return INDUSTRY_OPTIONS.concat(custom);
}
const DB_ASSIGNEES = ["미현","유진","관호","지혜","현애","인선","동일"];
const DB_MANAGERS = ["양호","동일","관호"];

// 전화번호 자동 하이픈 포맷 (01012345678 → 010-1234-5678)
function formatPhone(v) {
  if (!v) return "";
  var d = String(v).replace(/[^0-9]/g, "");
  if (d.length === 0) return "";
  if (d.startsWith("02")) {
    if (d.length <= 2) return d;
    if (d.length <= 5) return d.slice(0,2) + "-" + d.slice(2);
    if (d.length <= 9) return d.slice(0,2) + "-" + d.slice(2,5) + "-" + d.slice(5);
    return d.slice(0,2) + "-" + d.slice(2,6) + "-" + d.slice(6,10);
  }
  if (d.length <= 3) return d;
  if (d.length <= 7) return d.slice(0,3) + "-" + d.slice(3);
  if (d.length <= 10) return d.slice(0,3) + "-" + d.slice(3,6) + "-" + d.slice(6);
  return d.slice(0,3) + "-" + d.slice(3,7) + "-" + d.slice(7,11);
}

// 사업자등록번호 자동 하이픈 (1234567890 → 123-45-67890)
function formatBizNumber(v) {
  if (!v) return "";
  var d = String(v).replace(/[^0-9]/g, "");
  if (d.length === 0) return "";
  if (d.length <= 3) return d;
  if (d.length <= 5) return d.slice(0,3) + "-" + d.slice(3);
  return d.slice(0,3) + "-" + d.slice(3,5) + "-" + d.slice(5,10);
}

// 중소벤처기업진흥공단 / 구조혁신&사업전환 지역본부·지부 관할 매핑
// 값은 배열 — 복수 관할지역의 경우 2개 들어감
const JUNGINGONG_REGION_MAP = {
  // 서울지역본부
  "중구": ["서울지역본부"], "강북구": ["서울지역본부"], "노원구": ["서울지역본부"], "도봉구": ["서울지역본부"],
  "동대문구": ["서울지역본부"], "마포구": ["서울지역본부"], "서대문구": ["서울지역본부"], "성동구": ["서울지역본부"],
  "성북구": ["서울지역본부"], "용산구": ["서울지역본부"], "은평구": ["서울지역본부"], "종로구": ["서울지역본부"], "중랑구": ["서울지역본부"],
  // 서울동부지부
  "강동구": ["서울동부지부"], "광진구": ["서울동부지부"], "송파구": ["서울동부지부"],
  // 서울서부지부
  "양천구": ["서울서부지부"], "금천구": ["서울서부지부"], "강서구": ["서울서부지부"], "관악구": ["서울서부지부"],
  "구로구": ["서울서부지부"], "동작구": ["서울서부지부"], "영등포구": ["서울서부지부"],
  // 서울남부지부
  "서초구": ["서울남부지부"], "강남구": ["서울남부지부"],
  // 인천지역본부
  "연수구": ["인천지역본부"], "계양구": ["인천지역본부"], "남동구": ["인천지역본부"], "부평구": ["인천지역본부"], "부천시": ["인천지역본부"],
  // 인천서부지부
  "서구": ["인천서부지부"], "동구": ["인천서부지부"], "미추홀구": ["인천서부지부"], "강화군": ["인천서부지부"], "옹진군": ["인천서부지부"], "김포시": ["인천서부지부"],
  // 경기지역본부
  "수원시": ["경기지역본부"], "안성시": ["경기지역본부"], "용인시": ["경기지역본부"], "과천시": ["경기지역본부"],
  "안양시": ["경기지역본부"], "의왕시": ["경기지역본부"], "군포시": ["경기지역본부"],
  // 경기동부지부 (가평군, 양평군은 복수 관할)
  "광주시": ["경기동부지부"], "구리시": ["경기동부지부"], "남양주시": ["경기동부지부"],
  "성남시": ["경기동부지부"], "이천시": ["경기동부지부"], "하남시": ["경기동부지부"], "여주시": ["경기동부지부"],
  "가평군": ["경기동부지부","경기북부지부"], "양평군": ["경기동부지부","경기북부지부"],
  // 경기서부지부 (화성시는 송산면/서신면/마도면/남양읍/비봉면이 복수)
  "시흥시": ["경기서부지부"], "광명시": ["경기서부지부"], "안산시": ["경기서부지부"],
  "화성시": ["경기서부지부","경기남부지부"],
  // 경기남부지부
  "평택시": ["경기남부지부"], "오산시": ["경기남부지부"],
  // 경기북부지부
  "고양시": ["경기북부지부"], "동두천시": ["경기북부지부"], "의정부시": ["경기북부지부"],
  "파주시": ["경기북부지부"], "포천시": ["경기북부지부"], "연천군": ["경기북부지부"],
  // 강원지역본부 (가평군 복수는 위에서 처리됨)
  "춘천시": ["강원지역본부"], "원주시": ["강원지역본부"], "영월군": ["강원지역본부"],
  "인제군": ["강원지역본부"], "철원군": ["강원지역본부"], "홍천군": ["강원지역본부"],
  "화천군": ["강원지역본부"], "횡성군": ["강원지역본부"],
  // 강원영동지부 (정선군, 평창군 복수)
  "강릉시": ["강원영동지부"], "동해시": ["강원영동지부"], "삼척시": ["강원영동지부"],
  "속초시": ["강원영동지부"], "태백시": ["강원영동지부"], "고성군": ["강원영동지부"], "양양군": ["강원영동지부"],
  "정선군": ["강원지역본부","강원영동지부"], "평창군": ["강원지역본부","강원영동지부"],
  // 대전지역본부
  "대전": ["대전지역본부"], "계룡시": ["대전지역본부"], "논산시": ["대전지역본부"],
  "금산군": ["대전지역본부"], "옥천군": ["대전지역본부","충북지역본부"],
  // 세종지역본부 (서천군 복수)
  "세종": ["세종지역본부"], "공주시": ["세종지역본부"], "청양군": ["세종지역본부"],
  "보령시": ["세종지역본부"], "부여군": ["세종지역본부"],
  "서천군": ["세종지역본부","충남지역본부"],
  // 충남지역본부
  "천안시": ["충남지역본부"], "서산시": ["충남지역본부"], "아산시": ["충남지역본부"],
  "당진시": ["충남지역본부"], "예산군": ["충남지역본부"], "태안군": ["충남지역본부"], "홍성군": ["충남지역본부"],
  // 충북지역본부
  "청주시": ["충북지역본부"], "보은군": ["충북지역본부"], "영동군": ["충북지역본부"],
  "옥천군_충북": ["충북지역본부"], "진천군": ["충북지역본부"], "증평군": ["충북지역본부"], "음성군": ["충북지역본부"],
  // 충북북부지부
  "충주시": ["충북북부지부"], "제천시": ["충북북부지부"], "괴산군": ["충북북부지부"], "단양군": ["충북북부지부"],
  // 전북지역본부
  "전주시": ["전북지역본부"], "남원시": ["전북지역본부"], "무주군": ["전북지역본부"],
  "순창군": ["전북지역본부"], "완주군": ["전북지역본부"], "임실군": ["전북지역본부"],
  "장수군": ["전북지역본부"], "진안군": ["전북지역본부"], "정읍시": ["전북지역본부"],
  "익산시": ["전북지역본부"], "김제시": ["전북지역본부"],
  // 전북서부지부
  "군산시": ["전북서부지부"], "고창군": ["전북서부지부"], "부안군": ["전북서부지부"], "서천군_전북": ["전북서부지부"], "익산시_전북서부": ["전북서부지부"],
  // 광주지역본부 (영광군, 함평군, 나주시는 복수)
  "광주": ["광주지역본부"], "담양군": ["광주지역본부"], "장성군": ["광주지역본부"], "화순군": ["광주지역본부"],
  // 전남지역본부 (영광군, 함평군, 나주시, 장흥군 복수)
  "무안군": ["전남지역본부"], "목포시": ["전남지역본부"], "강진군": ["전남지역본부"],
  "신안군": ["전남지역본부"], "영암군": ["전남지역본부"], "완도군": ["전남지역본부"],
  "진도군": ["전남지역본부"], "해남군": ["전남지역본부"],
  "영광군": ["광주지역본부","전남지역본부"], "함평군": ["광주지역본부","전남지역본부"],
  "나주시": ["광주지역본부","전남지역본부"], "장흥군": ["전남지역본부","전남동부지부"],
  // 전남동부지부
  "순천시": ["전남동부지부"], "광양시": ["전남동부지부"], "여수시": ["전남동부지부"],
  "고흥군": ["전남동부지부"], "곡성군": ["전남동부지부"], "구례군": ["전남동부지부"], "보성군": ["전남동부지부"],
  // 대구지역본부
  "대구": ["대구지역본부"],
  // 경북지역본부 (봉화군 복수)
  "구미시": ["경북지역본부"], "김천시": ["경북지역본부"], "문경시": ["경북지역본부"],
  "상주시": ["경북지역본부"], "안동시": ["경북지역본부"], "영주시": ["경북지역본부"],
  "고령군": ["경북지역본부"], "성주군": ["경북지역본부"], "예천군": ["경북지역본부"],
  "의성군": ["경북지역본부"], "칠곡군": ["경북지역본부"],
  "봉화군": ["경북지역본부","경북동부지부"],
  // 경북동부지부
  "포항시": ["경북동부지부"], "경주시": ["경북동부지부","울산지역본부"],
  "영덕군": ["경북동부지부"], "영양군": ["경북동부지부"], "울릉군": ["경북동부지부"], "울진군": ["경북동부지부"], "청송군": ["경북동부지부"],
  // 경북남부지부
  "경산시": ["경북남부지부"], "영천시": ["경북남부지부"], "청도군": ["경북남부지부"],
  // 부산동부지역본부
  "사상구": ["부산동부지역본부"], "강서구_부산": ["부산동부지역본부"], "동구_부산": ["부산동부지역본부"],
  "부산진구": ["부산동부지역본부"], "북구_부산": ["부산동부지역본부"], "사하구": ["부산동부지역본부"],
  "서구_부산": ["부산동부지역본부"], "영도구": ["부산동부지역본부"], "중구_부산": ["부산동부지역본부"],
  // 부산동부지부
  "해운대구": ["부산동부지부"], "금정구": ["부산동부지부"], "남구_부산": ["부산동부지부"],
  "동래구": ["부산동부지부"], "수영구": ["부산동부지부"], "연제구": ["부산동부지부"], "기장군": ["부산동부지부"],
  // 울산지역본부 (경주시, 양산시 복수)
  "울산": ["울산지역본부"], "외동읍": ["울산지역본부"], "내남면": ["울산지역본부"], "산내면": ["울산지역본부"],
  "양산시": ["울산지역본부","경남지역본부"],
  // 경남지역본부
  "창원시": ["경남지역본부"], "의령군": ["경남지역본부"], "함안군": ["경남지역본부"], "창녕군": ["경남지역본부"],
  // 경남동부지부
  "김해시": ["경남동부지부"], "밀양시": ["경남동부지부"],
  // 경남서부지부
  "진주시": ["경남서부지부"], "거제시": ["경남서부지부"], "사천시": ["경남서부지부"],
  "통영시": ["경남서부지부"], "거창군": ["경남서부지부"], "남해군": ["경남서부지부"],
  "산청군": ["경남서부지부"], "하동군": ["경남서부지부"], "함양군": ["경남서부지부"], "합천군": ["경남서부지부"],
  // 제주지역본부
  "제주시": ["제주지역본부"], "서귀포시": ["제주지역본부"],
};

// 지역 문자열에서 시/군/구를 찾아서 지역본부/지부 반환
function findJungingongBranch(regionStr) {
  if (!regionStr) return "";
  var matches = [];
  // 입력 정규화: 공백, _, -, 쉼표 등 구분자를 제거
  var normalized = (regionStr || "").replace(/[\s_\-,\.\/]/g, "");
  // 모든 키를 길이 내림차순 정렬 (긴 이름 우선 매칭 — 예: "광주광역시" → "광주시" 보다 먼저)
  var sortedKeys = Object.keys(JUNGINGONG_REGION_MAP).sort(function(a, b) {
    return b.length - a.length;
  });
  sortedKeys.forEach(function(key) {
    // _부산, _전북 등 중복 키 제거
    var pureKey = key.split("_")[0];
    if (!pureKey || pureKey.length < 2) return;
    // 1) 전체 키로 매칭 (예: "안산시", "광주시")
    var matched = normalized.indexOf(pureKey) >= 0;
    // 2) 시/군/구 접미사 제거하고 매칭 (예: "안산", "성남")
    if (!matched) {
      var keyWithoutSuffix = pureKey.replace(/(특별시|광역시|특별자치시|특별자치도|광역도|시|군|구)$/, "");
      if (keyWithoutSuffix.length >= 2) {
        // 단어 경계를 고려해 매칭 — 예: "안산" 검색 시 "고양"의 "양"과 매칭되지 않도록
        // 한글 입력은 단어 경계가 명확하지 않으므로, 그냥 indexOf로 처리
        matched = normalized.indexOf(keyWithoutSuffix) >= 0;
      }
    }
    if (matched) {
      JUNGINGONG_REGION_MAP[key].forEach(function(b) {
        if (matches.indexOf(b) < 0) matches.push(b);
      });
    }
  });
  return matches.join(", ");
}

// 매출액 포맷 함수
const formatRevenue = (val) => {
  if (!val && val !== 0) return '-';
  const n = typeof val === 'string' ? parseInt(val.replace(/[^0-9]/g, '')) : val;
  if (isNaN(n) || n === 0) return '-';
  // 한글 단위 분해: 조 / 억 / 만
  var parts = [];
  var jo = Math.floor(n / 1000000000000);
  var eok = Math.floor((n % 1000000000000) / 100000000);
  var man = Math.floor((n % 100000000) / 10000);
  var won = n % 10000;
  if (jo > 0) parts.push(jo + '조');
  // 억 단위 - 1000 이상이면 천억 표시
  if (eok > 0) {
    if (eok >= 1000) {
      var cheonEok = Math.floor(eok / 1000);
      var nam = eok % 1000;
      var eokStr = cheonEok + '천';
      if (nam > 0) eokStr += nam;
      parts.push(eokStr + '억');
    } else {
      parts.push(eok + '억');
    }
  }
  // 만 단위 - 1000 이상이면 천만 표시
  if (man > 0) {
    if (man >= 1000) {
      var cheonMan = Math.floor(man / 1000);
      var namMan = man % 1000;
      var manStr = cheonMan + '천';
      if (namMan > 0) {
        var baekMan = Math.floor(namMan / 100);
        var restMan = namMan % 100;
        if (baekMan > 0) manStr += baekMan + '백';
        if (restMan > 0) manStr += restMan;
      }
      parts.push(manStr + '만');
    } else {
      parts.push(man + '만');
    }
  }
  return parts.length > 0 ? parts.join(' ') : n.toLocaleString();
};

// ── 아이콘 ────────────────────────────────────────────────────────────────────
// 기업현황표(xlsx) 파싱 공용 함수 - 신규등록/상세패널 양쪽에서 사용
async function parseHyeonhwangpyo(file) {
  if (typeof window.XLSX === "undefined") {
    await new Promise(function(resolve, reject) {
      var script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
      script.onload = resolve;
      script.onerror = function() { reject(new Error("SheetJS 라이브러리 로드 실패. 인터넷 연결을 확인해주세요.")); };
      document.head.appendChild(script);
    });
  }
  var XLSX = window.XLSX;
  var data = await file.arrayBuffer();
  var wb = XLSX.read(data, { type: "array", cellDates: true });
  var sheetName = wb.SheetNames.find(function(n) { return n.indexOf("기업개요") >= 0; }) || wb.SheetNames[0];
  var ws = wb.Sheets[sheetName];
  var rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });
  var getCell = function(r, c) {
    if (!rows[r]) return "";
    var v = rows[r][c];
    if (v === null || v === undefined) return "";
    if (v instanceof Date) { return v.getFullYear() + "-" + String(v.getMonth() + 1).padStart(2, "0") + "-" + String(v.getDate()).padStart(2, "0"); }
    return String(v).trim();
  };
  var parseRevenue = function(s) {
    if (!s) return "";
    var str = String(s).replace(/\s/g, "");
    var match = str.match(/([0-9.,]+)(억|천만|백만|만)?/);
    if (!match) return "";
    var num = parseFloat(match[1].replace(/,/g, ""));
    if (isNaN(num)) return "";
    var unit = match[2] || "";
    if (unit === "억") return Math.round(num * 100000000);
    if (unit === "천만") return Math.round(num * 10000000);
    if (unit === "백만") return Math.round(num * 1000000);
    if (unit === "만") return Math.round(num * 10000);
    return Math.round(num);
  };
  var parseCredit = function(s) {
    if (!s) return { kcb: "", nice: "" };
    var kcbMatch = String(s).match(/KCB\s*([0-9]+)/i);
    var niceMatch = String(s).match(/NICE\s*([0-9]+)/i);
    return { kcb: kcbMatch ? kcbMatch[1] : "", nice: niceMatch ? niceMatch[1] : "" };
  };
  var parseRepAndPhone = function(s) {
    if (!s) return { rep: "", phone: "" };
    var parts = String(s).split("/").map(function(x) { return x.trim(); });
    var rep = parts[0] || "";
    var phone = parts[1] || "";
    rep = rep.replace(/대표(이사)?$/, "").trim();
    phone = phone.replace(/[^0-9-]/g, "");
    return { rep: rep, phone: phone };
  };
  var parseFoundedDate = function(s) {
    if (!s) return { year: "", month: "" };
    var str = String(s);
    var match = str.match(/(\d{4})[-/.년\s]*(\d{1,2})/);
    if (match) return { year: match[1], month: parseInt(match[2]) };
    return { year: "", month: "" };
  };
  var parseRegion = function(addr) {
    if (!addr) return "";
    var s = String(addr);
    var doMap = { "서울특별시": "서울", "서울": "서울", "부산광역시": "부산", "부산": "부산", "대구광역시": "대구", "대구": "대구", "인천광역시": "인천", "인천": "인천", "광주광역시": "광주", "광주": "광주", "대전광역시": "대전", "대전": "대전", "울산광역시": "울산", "울산": "울산", "세종특별자치시": "세종", "세종": "세종", "경기도": "경기", "강원도": "강원", "강원특별자치도": "강원", "충청북도": "충북", "충북": "충북", "충청남도": "충남", "충남": "충남", "전라북도": "전북", "전북": "전북", "전북특별자치도": "전북", "전라남도": "전남", "전남": "전남", "경상북도": "경북", "경북": "경북", "경상남도": "경남", "경남": "경남", "제주특별자치도": "제주", "제주도": "제주", "제주": "제주" };
    var firstWord = s.split(/\s+/)[0];
    var doName = doMap[firstWord] || firstWord;
    var secondWord = s.split(/\s+/)[1] || "";
    var siGuGun = secondWord.replace(/시$|군$|구$/, "");
    return doName + (siGuGun ? "_" + siGuGun : "");
  };
  var updates = {};
  var auto = {};
  var name = getCell(2, 2);
  if (name) { updates.name = name; auto.name = true; }
  var bizNum = getCell(2, 8);
  if (bizNum) { updates.business_number = bizNum; auto.business_number = true; }
  var repPhone = parseRepAndPhone(getCell(3, 2));
  if (repPhone.rep) { updates.representative = repPhone.rep; auto.representative = true; }
  if (repPhone.phone) { updates.phone = repPhone.phone; auto.phone = true; }
  var addr = getCell(4, 2);
  var region = parseRegion(addr);
  if (region) { updates.region = region; auto.region = true; }
  var industry = getCell(5, 2);
  if (industry) { updates.industry = industry; auto.industry = true; }
  var emp = getCell(5, 8);
  if (emp && emp !== "없음" && emp !== "추후") {
    var empNum = String(emp).replace(/[^0-9]/g, "");
    if (empNum) { updates.employee_count = empNum; auto.employee_count = true; }
  } else if (emp === "없음") { updates.employee_count = "0"; auto.employee_count = true; }
  var credit = parseCredit(getCell(6, 2));
  if (credit.kcb) { updates.credit_score_kcb = credit.kcb; auto.credit_score_kcb = true; }
  if (credit.nice) { updates.credit_score_nice = credit.nice; auto.credit_score_nice = true; }
  var founded = parseFoundedDate(getCell(6, 8));
  if (founded.year) { updates.founded_year = founded.year; auto.founded_year = true; }
  if (founded.month) { updates.founded_month = founded.month; auto.founded_month = true; }
  var rev2025 = parseRevenue(getCell(12, 2));
  var rev2024 = parseRevenue(getCell(12, 6));
  var rev2023 = parseRevenue(getCell(12, 10));
  if (rev2025) { updates.revenue_2025 = rev2025; auto.revenue_2025 = true; }
  if (rev2024) { updates.revenue_2024 = rev2024; auto.revenue_2024 = true; }
  if (rev2023) { updates.revenue_2023 = rev2023; auto.revenue_2023 = true; }
  if (name && (/^\(주\)|^㈜|주식회사/.test(name))) { updates.business_type = "법인사업자"; updates.type = "법인"; }
  else if (name) { updates.business_type = "개인사업자"; updates.type = "개인"; }
  var loans = [];
  for (var lr = 17; lr <= 23; lr++) {
    var inst = getCell(lr, 2), amt = getCell(lr, 5), bank = getCell(lr, 7), sdate = getCell(lr, 8), edate = getCell(lr, 10);
    if (inst || amt || bank || sdate || edate) { loans.push({ inst: inst, amount: amt, bank: bank, start: sdate, end: edate }); }
  }
  if (loans.length > 0) { updates.loans = loans; auto.loans = true; }
  var infoItems = [];
  var addInfo = function(label, val) { if (val && String(val).trim()) infoItems.push({ label: label, value: String(val).trim() }); };
  addInfo("대표자 생년월일", getCell(3, 8));
  addInfo("26년 현재/예상 매출", getCell(11, 2));
  addInfo("법인 자본금", getCell(11, 8));
  addInfo("회생 및 파산 이력", getCell(8, 8));
  addInfo("재창업 조건 (폐업이력)", getCell(15, 2));
  addInfo("기업인증", [getCell(13, 10), getCell(14, 8), getCell(15, 8)].filter(function(x) { return x && x !== "노란우산공제, 제로페이" && x !== "내일채움"; }).join(", "));
  addInfo("특허 및 상표권", getCell(14, 6));
  addInfo("연구소", getCell(14, 2));
  addInfo("수출실적", getCell(13, 2));
  addInfo("노란우산공제", getCell(14, 10));
  addInfo("세금/금융 연체", getCell(13, 6));
  addInfo("추가 사업자 여부", getCell(8, 2));
  addInfo("주요취급품목", getCell(7, 2));
  addInfo("대표 결혼 유/무", getCell(7, 8));
  addInfo("대표자 거주지 부동산", getCell(9, 2));
  addInfo("사업장 부동산 유무", getCell(9, 8));
  addInfo("대표이사 자산현황", getCell(10, 2));
  addInfo("사업장 부동산 현황", getCell(10, 8));
  addInfo("세무사 연락처", getCell(4, 8));
  addInfo("필요자금 사용용도", getCell(26, 2));
  if (infoItems.length > 0) { updates.company_info = infoItems; auto.company_info = true; }
  var bigoMemo = getCell(28, 2) || getCell(29, 2) || getCell(30, 2);
  if (bigoMemo) { updates.company_info_memo = bigoMemo; auto.company_info_memo = true; }
  return { updates: updates, auto: auto };
}

// SheetJS(XLSX) 라이브러리 로더 - 여러 파서에서 공용
async function ensureXLSX() {
  if (typeof window.XLSX === "undefined") {
    await new Promise(function(resolve, reject) {
      var script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
      script.onload = resolve;
      script.onerror = function() { reject(new Error("SheetJS 라이브러리 로드 실패. 인터넷 연결을 확인해주세요.")); };
      document.head.appendChild(script);
    });
  }
  return window.XLSX;
}

// 라벨 기반 범용 시트지 파서 - 표준 기업현황표가 아닌 임의 양식(상담 시트지 등)에서
//  · 인식되는 항목 → 기업정보 필드 자동 채움 (updates/auto)
//  · 나머지 모든 내용 → 소통내역에 넣을 텍스트로 정리 (commText)
function parseSheetGeneric(rows) {
  var cellStr = function(v) {
    if (v === null || v === undefined) return "";
    if (v instanceof Date) { return v.getFullYear() + "-" + String(v.getMonth() + 1).padStart(2, "0") + "-" + String(v.getDate()).padStart(2, "0"); }
    return String(v).trim();
  };
  var norm = function(s) { return String(s || "").replace(/\s/g, "").replace(/[:：\-()（）]/g, ""); };
  var digitsOnly = function(s) { return String(s).replace(/[^0-9]/g, ""); };
  var parseRegionG = function(addr) {
    if (!addr) return "";
    var s = String(addr);
    var doMap = { "서울특별시": "서울", "서울": "서울", "부산광역시": "부산", "부산": "부산", "대구광역시": "대구", "대구": "대구", "인천광역시": "인천", "인천": "인천", "광주광역시": "광주", "광주": "광주", "대전광역시": "대전", "대전": "대전", "울산광역시": "울산", "울산": "울산", "세종특별자치시": "세종", "세종": "세종", "경기도": "경기", "경기": "경기", "강원도": "강원", "강원특별자치도": "강원", "강원": "강원", "충청북도": "충북", "충북": "충북", "충청남도": "충남", "충남": "충남", "전라북도": "전북", "전북": "전북", "전북특별자치도": "전북", "전라남도": "전남", "전남": "전남", "경상북도": "경북", "경북": "경북", "경상남도": "경남", "경남": "경남", "제주특별자치도": "제주", "제주도": "제주", "제주": "제주" };
    var firstWord = s.split(/\s+/)[0];
    var doName = doMap[firstWord] || firstWord;
    var secondWord = s.split(/\s+/)[1] || "";
    var siGuGun = secondWord.replace(/시$|군$|구$/, "");
    return doName + (siGuGun ? "_" + siGuGun : "");
  };
  var parseFoundedG = function(s) {
    var m = String(s || "").match(/(\d{4})[-/.년\s]*(\d{1,2})?/);
    if (m) return { year: m[1], month: m[2] ? parseInt(m[2], 10) : "" };
    return { year: "", month: "" };
  };
  // 라벨(정규화된 키) → 회사 필드 매핑 규칙
  var MATCHERS = [
    { field: "name", keys: ["업체명", "회사명", "기업명", "상호", "상호명", "법인명", "사업체명"] },
    { field: "representative", keys: ["대표자", "대표", "대표이사", "대표자명", "대표이사명", "성명", "대표성명"], clean: function(v) { return String(v).replace(/대표(이사)?$/, "").trim(); } },
    { field: "phone", keys: ["연락처", "전화", "전화번호", "휴대폰", "핸드폰", "연락", "대표번호", "휴대전화", "핸드폰번호"], clean: function(v) { return String(v).replace(/[^0-9-]/g, ""); } },
    { field: "business_number", keys: ["사업자등록번호", "사업자번호", "사업자", "등록번호"] },
    { field: "region", keys: ["주소", "소재지", "사업장주소", "사업장소재지", "본점소재지", "사업장", "사업장위치"], transform: parseRegionG },
    { field: "industry", keys: ["업종", "업태", "종목", "주업종", "업종업태", "사업내용", "주요업종"] },
    { field: "employee_count", keys: ["직원수", "종업원수", "상시근로자", "근로자수", "고용인원", "인원", "종업원", "직원"], clean: digitsOnly },
    { field: "credit_score_kcb", keys: ["kcb", "kcb점수", "올크레딧"], clean: digitsOnly },
    { field: "credit_score_nice", keys: ["nice", "nice점수", "나이스"], clean: digitsOnly },
    { field: "founded", keys: ["설립일", "설립연도", "설립년도", "개업일", "창업일", "설립", "설립일자", "개업연월일"], transform: parseFoundedG },
  ];
  var lookup = {};
  MATCHERS.forEach(function(m) { m.keys.forEach(function(k) { lookup[norm(k).toLowerCase()] = m; }); });

  // 각 행을 (라벨, 값) 쌍으로 정리 — 2열 폼(라벨|값) 및 다열 모두 대응
  var pairs = [];
  rows.forEach(function(row) {
    if (!row) return;
    var nonEmpty = [];
    row.forEach(function(c) { var v = cellStr(c); if (v) nonEmpty.push(v); });
    if (nonEmpty.length === 0) return;
    if (nonEmpty.length === 1) { pairs.push({ label: "", value: nonEmpty[0] }); }
    else { pairs.push({ label: nonEmpty[0], value: nonEmpty.slice(1).join(" ") }); }
  });

  var updates = {}, auto = {};
  var leftover = [];
  pairs.forEach(function(p) {
    var key = norm(p.label).toLowerCase();
    var m = p.label ? lookup[key] : null;
    if (m && p.value) {
      if (m.field === "founded") {
        var f = m.transform(p.value);
        if (f.year && !updates.founded_year) { updates.founded_year = f.year; auto.founded_year = true; }
        if (f.month && !updates.founded_month) { updates.founded_month = f.month; auto.founded_month = true; }
        return;
      }
      var val = m.clean ? m.clean(p.value) : (m.transform ? m.transform(p.value) : p.value);
      if (val && !updates[m.field]) { updates[m.field] = val; auto[m.field] = true; return; }
    }
    // 인식 안 된 내용 → 소통내역 텍스트로 보존
    if (p.label && p.value) leftover.push(p.label + ": " + p.value);
    else if (p.value) leftover.push(p.value);
  });

  // 법인/개인 유형 추정
  if (updates.name && (/^\(주\)|^㈜|주식회사/.test(updates.name))) { updates.business_type = "법인사업자"; updates.type = "법인"; }
  else if (updates.name) { updates.business_type = "개인사업자"; updates.type = "개인"; }

  return { updates: updates, auto: auto, commText: leftover.join("\n") };
}

// 업로드 파일 디스패처 - 표준 기업현황표면 기존 파서, 아니면 범용 시트지 파서
//  공통 반환: { updates, auto, commText, kind }
async function parseUploadedSheet(file) {
  var XLSX = await ensureXLSX();
  var data = await file.arrayBuffer();
  var wb = XLSX.read(data, { type: "array", cellDates: true });
  var hasGaeyo = wb.SheetNames.some(function(n) { return n.indexOf("기업개요") >= 0; });
  if (hasGaeyo) {
    // 표준 기업현황표: 기존 파서 그대로 사용(기업정보 항목은 기업정보 탭으로), 비고 메모는 소통내역 텍스트로도 제공
    var res = await parseHyeonhwangpyo(file);
    var commParts = [];
    if (res.updates.company_info_memo) commParts.push(res.updates.company_info_memo);
    return { updates: res.updates, auto: res.auto, commText: commParts.join("\n"), kind: "기업현황표" };
  }
  // 그 외: 첫 시트를 범용 파싱
  var ws = wb.Sheets[wb.SheetNames[0]];
  var rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });
  var g = parseSheetGeneric(rows);
  return { updates: g.updates, auto: g.auto, commText: g.commText, kind: "시트지" };
}

const Icon = ({ name, size = 16, color = "currentColor" }) => {
  const p = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round" };
  const icons = {
    dashboard: <svg {...p}><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg>,
    pipeline:  <svg {...p}><rect x="3" y="3" width="5" height="19" rx="1"/><rect x="10" y="3" width="5" height="13" rx="1"/><rect x="17" y="3" width="5" height="9" rx="1"/></svg>,
    list:      <svg {...p}><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="3" cy="6" r="1" fill={color}/><circle cx="3" cy="12" r="1" fill={color}/><circle cx="3" cy="18" r="1" fill={color}/></svg>,
    alert:     <svg {...p}><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><circle cx="12" cy="17" r="1" fill={color}/></svg>,
    users:     <svg {...p}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    plus:      <svg {...p}><path d="M12 5v14M5 12h14"/></svg>,
    search:    <svg {...p}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>,
    check:     <svg {...p} strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>,
    x:         <svg {...p} strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
    phone:     <svg {...p}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.54 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.09 6.09l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
    logout:    <svg {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
    edit:      <svg {...p}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
    refresh:   <svg {...p}><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>,
    copy:      <svg {...p}><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>,
    save:      <svg {...p}><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>,
    building:  <svg {...p}><path d="M3 21h18"/><path d="M5 21V7l8-4v18"/><path d="M19 21V11l-6-4"/><path d="M9 9h1"/><path d="M9 13h1"/><path d="M9 17h1"/></svg>,
    money:     <svg {...p}><circle cx="12" cy="12" r="10"/><path d="M12 6v2m0 8v2M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3m.08 4h.01"/></svg>,
    activity:  <svg {...p}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
    folder:    <svg {...p}><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>,
    calendar:  <svg {...p}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
    chevronR:  <svg {...p}><polyline points="9 18 15 12 9 6"/></svg>,
    chevronL:  <svg {...p}><polyline points="15 18 9 12 15 6"/></svg>,
    link:      <svg {...p}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>,
  };
  return icons[name] || null;
};

// ── 유틸 ─────────────────────────────────────────────────────────────────────
const docRate = (docs) => {
  if (!docs || docs.length === 0) return 0;
  return Math.round(docs.filter(d => d.received).length / docs.length * 100);
};

// ── 메인 앱 ──────────────────────────────────────────────────────────────────
// ── CSV 내보내기(백업) 유틸 ────────────────────────────────────────────────────
function csvDateStamp() {
  var d = new Date();
  var p = function(n) { return String(n).padStart(2, "0"); };
  return d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate());
}
function exportToCsv(filename, rows) {
  if (!rows || rows.length === 0) { alert("내보낼 데이터가 없어요."); return; }
  // 모든 행의 키를 합쳐 컬럼 구성 (행마다 필드가 달라도 누락 없이)
  var cols = [], seen = {};
  rows.forEach(function(r) {
    Object.keys(r || {}).forEach(function(k) { if (!seen[k]) { seen[k] = true; cols.push(k); } });
  });
  var esc = function(v) {
    if (v === null || v === undefined) return "";
    if (typeof v === "object") v = JSON.stringify(v);
    v = String(v);
    if (/[",\n\r]/.test(v)) v = '"' + v.replace(/"/g, '""') + '"';
    return v;
  };
  var lines = [cols.join(",")];
  rows.forEach(function(r) { lines.push(cols.map(function(c) { return esc(r ? r[c] : ""); }).join(",")); });
  // 한글 엑셀 호환을 위해 UTF-8 BOM 추가
  var blob = new Blob(["﻿" + lines.join("\r\n")], { type: "text/csv;charset=utf-8;" });
  var url = URL.createObjectURL(blob);
  var a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(function() { URL.revokeObjectURL(url); }, 1000);
}
// 내보내기 버튼 (백업) — 지정 계정(canExport)만 노출
function ExportButton({ rows, filenamePrefix, label, canExport }) {
  if (!canExport) return null;
  var count = Array.isArray(rows) ? rows.length : 0;
  return (
    <button onClick={function() { exportToCsv((filenamePrefix || "export") + "_" + csvDateStamp() + ".csv", rows); }}
      title="전체 데이터를 CSV 파일로 내려받아 백업합니다 (엑셀에서 열기 가능)"
      style={{ display: "flex", alignItems: "center", gap: 6, background: "#fff", color: "#15803D", border: "1px solid #86EFAC", borderRadius: 8, padding: "8px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
      ⬇️ {label || "내보내기"}{count ? " (" + count + ")" : ""}
    </button>
  );
}
// 테이블 전체를 서버에서 직접 조회해 CSV로 내려받는 백업 버튼 (부분 로드와 무관하게 전체 백업)
function ExportTableButton({ table, filenamePrefix, label }) {
  const [busy, setBusy] = useState(false);
  return (
    <button disabled={busy} onClick={async function() {
      setBusy(true);
      try {
        var r = await supabase.from(table).select("*");
        if (r.error) { alert("백업 실패(" + table + "): " + r.error.message); return; }
        if (!r.data || r.data.length === 0) { alert("데이터가 없어요: " + table); return; }
        exportToCsv((filenamePrefix || table) + "_" + csvDateStamp() + ".csv", r.data);
      } catch (e) { alert("백업 실패: " + (e && e.message ? e.message : e)); }
      finally { setBusy(false); }
    }}
      style={{ display: "flex", alignItems: "center", gap: 6, background: busy ? "#F0EDE8" : "#fff", color: "#15803D", border: "1px solid #86EFAC", borderRadius: 8, padding: "7px 13px", fontSize: 12, fontWeight: 700, cursor: busy ? "default" : "pointer", whiteSpace: "nowrap" }}>
      {busy ? "내보내는 중..." : "⬇️ " + (label || "CSV")}
    </button>
  );
}

// ── 데이터 백업 화면 (지정 계정 전용) ─────────────────────────────────────────────
const BACKUP_TABLES = [
  { t: "companies", n: "기업목록" }, { t: "db_leads", n: "DB리스트" },
  { t: "agency_cases", n: "기관진행" }, { t: "settlement_manual", n: "정산" },
  { t: "work_notes", n: "업무노트" }, { t: "team_notes", n: "팀노트" },
  { t: "approval_cases", n: "승인·부결사례" }, { t: "activity_logs", n: "활동로그" },
  { t: "leave_requests", n: "연차·휴가" }, { t: "partners", n: "협업담당자" },
  { t: "quick_links", n: "바로가기" }, { t: "calendar_events", n: "캘린더" },
  { t: "kpi_goals", n: "KPI목표" }, { t: "documents", n: "서류현황" },
  { t: "branch_contacts", n: "지점연락처" }, { t: "call_logs", n: "콜로그" },
  { t: "profiles", n: "팀원" },
];
function BackupView({ canExport }) {
  const [allBusy, setAllBusy] = useState(false);
  const [counts, setCounts] = useState({});
  useEffect(function() {
    BACKUP_TABLES.forEach(function(tb) {
      supabase.from(tb.t).select("id", { count: "exact", head: true }).then(function(r) {
        if (!r.error) setCounts(function(p) { var n = Object.assign({}, p); n[tb.t] = r.count; return n; });
      });
    });
  }, []);
  if (!canExport) {
    return <div style={{ padding: 40, textAlign: "center", color: "#888", fontSize: 14 }}>이 화면에 접근할 권한이 없습니다.</div>;
  }
  async function exportAll() {
    setAllBusy(true);
    for (var i = 0; i < BACKUP_TABLES.length; i++) {
      var tb = BACKUP_TABLES[i];
      try {
        var r = await supabase.from(tb.t).select("*");
        if (!r.error && r.data && r.data.length) {
          exportToCsv(tb.n + "_" + csvDateStamp() + ".csv", r.data);
          await new Promise(function(res) { setTimeout(res, 500); }); // 다중 다운로드 간격
        }
      } catch (e) { /* 개별 실패는 건너뜀 */ }
    }
    setAllBusy(false);
  }
  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8, gap: 10, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.03em", margin: 0 }}>데이터 백업</h1>
          <p style={{ color: "#888", fontSize: 13, margin: "4px 0 0" }}>각 테이블 전체를 CSV로 내려받아요 (엑셀에서 열기 가능 · UTF-8)</p>
        </div>
        <button onClick={exportAll} disabled={allBusy}
          style={{ display: "flex", alignItems: "center", gap: 6, background: allBusy ? "#F0EDE8" : "#15803D", color: allBusy ? "#888" : "#fff", border: "none", borderRadius: 8, padding: "10px 16px", fontSize: 13, fontWeight: 700, cursor: allBusy ? "default" : "pointer" }}>
          {allBusy ? "전체 백업 중..." : "⬇️ 전체 백업 (" + BACKUP_TABLES.length + "개)"}
        </button>
      </div>
      <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 10, padding: "12px 16px", fontSize: 12.5, color: "#92400E", marginBottom: 16 }}>
        💡 “전체 백업”을 누르면 표의 모든 테이블이 각각 CSV 파일로 순서대로 다운로드됩니다. 브라우저가 “여러 파일 다운로드 허용”을 물으면 허용해주세요.
      </div>
      <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #E8E5E0", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#F7F6F3", borderBottom: "1px solid #E8E5E0" }}>
              {["테이블", "행 수", "내보내기"].map(function(h) {
                return <th key={h} style={{ padding: "11px 16px", fontSize: 11, fontWeight: 600, color: "#888", textAlign: h === "내보내기" ? "right" : "left" }}>{h}</th>;
              })}
            </tr>
          </thead>
          <tbody>
            {BACKUP_TABLES.map(function(tb) {
              return (
                <tr key={tb.t} style={{ borderBottom: "1px solid #F0EDE8" }}>
                  <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 600 }}>{tb.n} <span style={{ color: "#888", fontWeight: 400, fontSize: 11 }}>{tb.t}</span></td>
                  <td style={{ padding: "12px 16px", fontSize: 13, color: "#555" }}>{counts[tb.t] == null ? "…" : counts[tb.t].toLocaleString() + "행"}</td>
                  <td style={{ padding: "10px 16px" }}>
                    <div style={{ display: "flex", justifyContent: "flex-end" }}>
                      <ExportTableButton table={tb.t} filenamePrefix={tb.n} label="CSV" />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else { setProfile(null); setLoading(false); }
    });
    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (uid) => {
    const { data } = await supabase.from("profiles").select("*").eq("id", uid).single();
    setProfile(data);
    setLoading(false);
  };

  if (loading) return <Splash />;
  if (!session) return <AuthScreen />;
  if (!profile) return <SetupProfile userId={session.user.id} email={session.user.email} onDone={(p) => setProfile(p)} />;
  // 🔐 회원가입 승인제: 승인 대기/거절 상태면 데이터 접근 차단
  // (status 컬럼이 아직 없는 기존 환경에서는 undefined → 통과하여 잠기지 않음)
  if (profile.status === "pending" || profile.status === "rejected") {
    return <PendingApproval email={session.user.email} name={profile.name} rejected={profile.status === "rejected"} />;
  }
  return <CRMApp profile={profile} session={session} />;
}

// ── 승인 대기 화면 ─────────────────────────────────────────────────────────────
function PendingApproval({ email, name, rejected }) {
  return (
    <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#1A1917", padding: 24 }}>
      <div style={{ background: "#fff", borderRadius: 16, padding: "44px 40px", width: 420, maxWidth: "100%", boxShadow: "0 24px 80px rgba(0,0,0,0.4)", textAlign: "center" }}>
        <div style={{ fontSize: 44, marginBottom: 18 }}>{rejected ? "🚫" : "⏳"}</div>
        <h2 style={{ fontSize: 20, fontWeight: 800, margin: "0 0 10px", letterSpacing: "-0.03em" }}>
          {rejected ? "가입이 거절되었어요" : "승인 대기 중이에요"}
        </h2>
        <p style={{ fontSize: 13.5, color: "#666", lineHeight: 1.7, margin: "0 0 6px" }}>
          {rejected
            ? "계정 접근이 거절되었습니다. 관리자에게 문의해주세요."
            : <>가입 신청이 접수됐어요.<br />관리자가 승인하면 바로 이용할 수 있어요.</>}
        </p>
        <div style={{ fontSize: 12, color: "#AAA", margin: "14px 0 26px" }}>{name ? name + " · " : ""}{email}</div>
        <button onClick={() => supabase.auth.signOut()}
          style={{ width: "100%", padding: "12px", background: "#F7F6F3", color: "#555", border: "1px solid #E8E5E0", borderRadius: 8, fontSize: 13.5, fontWeight: 700, cursor: "pointer" }}>
          로그아웃
        </button>
      </div>
    </div>
  );
}

// ── 스플래시 ──────────────────────────────────────────────────────────────────
function Splash() {
  return (
    <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#1A1917", flexDirection: "column", gap: 16 }}>
      <div style={{ width: 40, height: 40, border: "3px solid #F7F6F3", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      <div style={{ color: "#666", fontSize: 13 }}>로딩 중...</div>
    </div>
  );
}

// ── 로그인/회원가입 화면 ──────────────────────────────────────────────────────
function AuthScreen() {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handle = async () => {
    setError(""); setLoading(true);
    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password: pw });
      if (error) setError("이메일 또는 비밀번호가 틀렸어요.");
    } else {
      const { error } = await supabase.auth.signUp({ email, password: pw });
      if (error) setError(error.message);
      else setDone(true);
    }
    setLoading(false);
  };

  return (
    <div style={{ height: "100vh", display: "flex", background: "#1A1917" }}>
      {/* 왼쪽 브랜딩 */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "60px 80px", position: "relative", overflow: "hidden" }}>
        {/* 배경 액센트 (그라데이션) */}
        <div style={{ position: "absolute", top: -120, right: -120, width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(245,158,11,0.08) 0%, transparent 70%)", pointerEvents: "none" }}></div>
        <div style={{ position: "absolute", bottom: -100, left: -100, width: 320, height: 320, borderRadius: "50%", background: "radial-gradient(circle, rgba(245,158,11,0.05) 0%, transparent 70%)", pointerEvents: "none" }}></div>

        <div style={{ position: "relative", zIndex: 1 }}>
          {/* 상단 라벨 */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
            <div style={{ width: 28, height: 1, background: "#F59E0B" }}></div>
            <div style={{ fontSize: 11, letterSpacing: "0.18em", color: "#F59E0B", textTransform: "uppercase", fontWeight: 600 }}>Korea Business Consulting</div>
          </div>

          {/* 메인 헤드라인 */}
          <div style={{ fontSize: 14, color: "#888", marginBottom: 6, letterSpacing: "0.05em", fontWeight: 500 }}>대한민국 NO.1</div>
          <h1 style={{ fontSize: 48, fontWeight: 800, color: "#F7F6F3", letterSpacing: "-0.04em", lineHeight: 1.1, margin: "0 0 28px" }}>
            경영컨설팅 회사
          </h1>

          {/* 슬로건 */}
          <p style={{ color: "#888", fontSize: 17, lineHeight: 1.7, maxWidth: 420, fontWeight: 400, margin: "0 0 12px" }}>
            기업에 필요한 모든 것을 자문하고 공급하는<br />
            <span style={{ color: "#F7F6F3", fontWeight: 600 }}>전문가로 구성된 기업</span>
          </p>
          <p style={{ color: "#666", fontSize: 13, lineHeight: 1.6, maxWidth: 420 }}>
            정책자금부터 사업전환·구조혁신까지,<br />
            귀사의 지속가능한 성장을 함께합니다.
          </p>

          {/* 서비스 카테고리 */}
          <div style={{ marginTop: 56, display: "flex", flexWrap: "wrap", gap: 8 }}>
            {[
              { label: "정책자금", icon: "💼" },
              { label: "사업전환", icon: "🔄" },
              { label: "구조혁신", icon: "⚡" },
              { label: "경영진단", icon: "📊" },
              { label: "재무자문", icon: "📈" },
            ].map(function(s) {
              return (
                <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 99, fontSize: 12 }}>
                  <span style={{ fontSize: 13 }}>{s.icon}</span>
                  <span style={{ color: "#DDD", fontWeight: 500, letterSpacing: "0.02em" }}>{s.label}</span>
                </div>
              );
            })}
          </div>

          {/* 하단 회사 강점 */}
          <div style={{ marginTop: 56, paddingTop: 24, borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              { title: "현장 중심", desc: "직접 방문 컨설팅" },
              { title: "맞춤형 전략", desc: "1:1 케이스 분석" },
              { title: "전문가팀", desc: "시니어 컨설턴트 보유" },
            ].map(function(it) {
              return (
                <div key={it.title} style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#F59E0B" }}></div>
                  <span style={{ color: "#F59E0B", fontWeight: 600, fontSize: 13, letterSpacing: "0.02em", minWidth: 80 }}>{it.title}</span>
                  <span style={{ color: "#888", fontSize: 12, letterSpacing: "0.03em" }}>|</span>
                  <span style={{ color: "#888", fontSize: 13 }}>{it.desc}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 오른쪽 로그인 폼 */}
      <div style={{ width: 420, display: "flex", alignItems: "center", justifyContent: "center", padding: 40 }}>
        <div style={{ width: "100%", background: "#fff", borderRadius: 16, padding: "40px 36px", boxShadow: "0 24px 80px rgba(0,0,0,0.4)" }}>
          {done ? (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>📧</div>
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 10 }}>이메일을 확인해주세요</h2>
              <p style={{ fontSize: 13, color: "#888", lineHeight: 1.6 }}>{email}로 인증 링크를 보냈어요.<br />링크 클릭 후 로그인하세요.</p>
            </div>
          ) : (
            <>
              <h2 style={{ fontSize: 20, fontWeight: 800, margin: "0 0 8px", letterSpacing: "-0.03em" }}>{mode === "login" ? "로그인" : "계정 만들기"}</h2>
              <p style={{ fontSize: 13, color: "#888", margin: "0 0 28px" }}>{mode === "login" ? "팀 CRM에 접속하세요" : "처음 사용하시나요? 계정을 만드세요"}</p>
              {error && <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#DC2626", marginBottom: 16 }}>{error}</div>}
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#555", display: "block", marginBottom: 6 }}>이메일</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@company.com"
                  style={{ width: "100%", padding: "11px 14px", border: "1px solid #E8E5E0", borderRadius: 8, fontSize: 14, boxSizing: "border-box", outline: "none" }}
                  onKeyDown={e => e.key === "Enter" && handle()} />
              </div>
              <div style={{ marginBottom: 24 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#555", display: "block", marginBottom: 6 }}>비밀번호</label>
                <input type="password" value={pw} onChange={e => setPw(e.target.value)} placeholder="6자 이상"
                  style={{ width: "100%", padding: "11px 14px", border: "1px solid #E8E5E0", borderRadius: 8, fontSize: 14, boxSizing: "border-box", outline: "none" }}
                  onKeyDown={e => e.key === "Enter" && handle()} />
              </div>
              <button onClick={handle} disabled={loading}
                style={{ width: "100%", padding: "13px", background: "#1A1917", color: "#F7F6F3", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}>
                {loading ? "처리 중..." : mode === "login" ? "로그인" : "가입하기"}
              </button>
              <div style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: "#888" }}>
                {mode === "login" ? "계정이 없으신가요? " : "이미 계정이 있으신가요? "}
                <span onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); }}
                  style={{ color: "#4338CA", cursor: "pointer", fontWeight: 600 }}>
                  {mode === "login" ? "가입하기" : "로그인"}
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── 프로필 최초 설정 ──────────────────────────────────────────────────────────
function SetupProfile({ userId, email, onDone }) {
  const [name, setName] = useState("");
  const [team, setTeam] = useState("법인전담");
  const [loading, setLoading] = useState(false);

  const save = async () => {
    if (!name.trim()) return;
    setLoading(true);
    const { data, error } = await supabase.from("profiles").insert({ id: userId, name: name.trim(), role: "member", team }).select().single();
    if (!error) onDone(data);
    setLoading(false);
  };

  return (
    <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F7F6F3" }}>
      <div style={{ background: "#fff", borderRadius: 14, padding: "40px 36px", width: 380, boxShadow: "0 8px 40px rgba(0,0,0,0.1)" }}>
        <h2 style={{ fontSize: 18, fontWeight: 800, margin: "0 0 6px" }}>프로필 설정</h2>
        <p style={{ fontSize: 13, color: "#888", margin: "0 0 28px" }}>{email}</p>
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: "#555", display: "block", marginBottom: 6 }}>이름 (업무에 표시될 이름)</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="예: 정원"
            style={{ width: "100%", padding: "11px 14px", border: "1px solid #E8E5E0", borderRadius: 8, fontSize: 14, boxSizing: "border-box", outline: "none" }} />
        </div>
        <div style={{ marginBottom: 28 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: "#555", display: "block", marginBottom: 6 }}>소속 팀</label>
          <select value={team} onChange={e => setTeam(e.target.value)}
            style={{ width: "100%", padding: "11px 14px", border: "1px solid #E8E5E0", borderRadius: 8, fontSize: 14, background: "#fff", cursor: "pointer" }}>
            {TEAMS.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <button onClick={save} disabled={!name.trim() || loading}
          style={{ width: "100%", padding: "13px", background: "#1A1917", color: "#F7F6F3", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: "pointer", opacity: !name.trim() ? 0.5 : 1 }}>
          {loading ? "저장 중..." : "시작하기"}
        </button>
      </div>
    </div>
  );
}

// ── CRM 메인 앱 ───────────────────────────────────────────────────────────────
function CRMApp({ profile, session }) {
  const [dashboardFilter, setDashboardFilter] = useState(null);
  const [view, setView] = useState(() => {
    var params = new URLSearchParams(window.location.search);
    return params.get("view") || "dashboard";
  });
  const [agencyJumpMonth, setAgencyJumpMonth] = useState(() => {
    var params = new URLSearchParams(window.location.search);
    var m = params.get("month");
    return m ? parseInt(m, 10) : null;
  });
  const [agencyJumpGroup, setAgencyJumpGroup] = useState(() => {
    var params = new URLSearchParams(window.location.search);
    return params.get("group") || null;
  });
  const [companies, setCompanies] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStage, setFilterStage] = useState("전체");
  const [filterAssignee, setFilterAssignee] = useState("전체");
  const [filterType, setFilterType] = useState("전체");
  const [filterAgency, setFilterAgency] = useState("전체");
  const [filterTeam, setFilterTeam] = useState("전체");
  const [creditFilter, setCreditFilter] = useState("");
  const [creditMode, setCreditMode] = useState("below");
  const [toast, setToast] = useState(null);
  const [showTodayAlert, setShowTodayAlert] = useState(false);
  const [workNotesBadge, setWorkNotesBadge] = useState(0);
  const [quickMemo, setQuickMemo] = useState(false);
  const [quickMemoText, setQuickMemoText] = useState("");
  const [menuExpanded, setMenuExpanded] = useState(false);
  const [agencyRefreshKey, setAgencyRefreshKey] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const notifRef = useRef(null);
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);
  const [globalSearchQ, setGlobalSearchQ] = useState("");
  const [showAiSearch, setShowAiSearch] = useState(false);

  // 전역 단축키 Ctrl+K (또는 Cmd+K)
  useEffect(function() {
    var onKey = function(e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setShowGlobalSearch(true);
      }
      if (e.key === "Escape") {
        setShowGlobalSearch(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return function() { window.removeEventListener("keydown", onKey); };
  }, []);

  // 📅 월별 업무 자동생성 — 매월 첫 접속 시 담당자 월 업무노트 1건 자동 생성 (중복 방지)
  useEffect(function() {
    if (!profile || !profile.name) return;
    var today = kstDate();          // "YYYY-MM-DD" (KST)
    var ym = today.slice(0, 7);     // "YYYY-MM"
    var lsKey = "monthly_autogen_" + profile.name + "_" + ym;
    if (localStorage.getItem(lsKey)) return; // 이번 달은 이미 처리함 (재접속 시 스킵)
    var monthNum = parseInt(ym.slice(5, 7), 10);
    var firstDay = ym + "-01";
    var title = monthNum + "월 " + profile.name + " 업무";
    var run = async function() {
      // 중복 방지: 같은 담당자·같은 note_date·같은 제목 노트가 이미 있으면 생성 안 함
      var dup = await supabase.from("work_notes")
        .select("id").eq("assignee", profile.name).eq("note_date", firstDay)
        .eq("title", title).is("deleted_at", null).limit(1);
      if (dup.error) return; // 조회 실패 시 조용히 중단 (다음 접속에 재시도)
      if (dup.data && dup.data.length > 0) { localStorage.setItem(lsKey, "1"); return; }
      var ins = await supabase.from("work_notes").insert({
        assignee: profile.name,
        title: title,
        content: "- [ ] \n",
        is_todo: true,
        pinned: false,
        created_by: profile.name,
        note_date: firstDay,
      });
      if (!ins.error) localStorage.setItem(lsKey, "1");
    };
    run();
  }, [profile]);

  // 알림 폴링 - 내 담당 새 노트 확인 (30초마다)
  useEffect(function() {
    if (!profile) return;
    var lastChecked = localStorage.getItem("notif_last_checked_" + profile.name) || new Date(0).toISOString();
    var checkNotifs = async function() {
      var r = await supabase.from("work_notes")
        .select("*").eq("assignee", profile.name)
        .gt("created_at", lastChecked).is("deleted_at", null)
        .order("created_at", { ascending: false });
      if (!r.error && r.data && r.data.length > 0) {
        setNotifications(function(prev) {
          var ids = new Set(prev.map(function(n) { return n.id; }));
          var newOnes = r.data.filter(function(n) { return !ids.has(n.id); });
          return newOnes.concat(prev).slice(0, 20);
        });
      }
    };
    checkNotifs();
    var interval = setInterval(checkNotifs, 30000);
    return function() { clearInterval(interval); };
  }, [profile]);

  var markAllRead = function() {
    if (profile) localStorage.setItem("notif_last_checked_" + profile.name, new Date().toISOString());
    setNotifications([]);
    setShowNotifPanel(false);
  };

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  };

  // 데이터 로드
  const fetchWorkNotesBadge = async (profileName) => {
    if (!profileName) return;
    try {
      // 본인 담당 + 할 일 + 미완료(is_done=false) + 삭제되지 않은 것만
      var r = await supabase.from("work_notes")
        .select("id, content, is_done")
        .eq("assignee", profileName)
        .eq("is_todo", true)
        .is("deleted_at", null);
      if (!r.error && r.data) {
        // is_done이 false인 노트만 카운트
        // 그리고 체크리스트가 있는 경우, 모든 항목이 체크되지 않은 노트만 카운트
        var incomplete = r.data.filter(function(n) {
          if (n.is_done) return false; // 이미 완료된 노트는 제외
          // 체크리스트가 있는 경우 모든 항목 체크 여부 확인
          if (n.content && n.content.indexOf("- [") !== -1) {
            var lines = n.content.split("\n");
            var checkLines = lines.filter(function(l) { return /^- \[[ x]\]/.test(l.trim()); });
            if (checkLines.length > 0) {
              var uncheckedExists = checkLines.some(function(l) { return l.trim().indexOf("- [ ]") === 0; });
              return uncheckedExists; // 미체크 항목이 있으면 미완료
            }
          }
          return true; // 일반 할 일은 is_done=false이면 미완료
        }).length;
        setWorkNotesBadge(incomplete);
      }
    } catch(e) {}
  };

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [{ data: cos }, { data: profs }, { data: agencyCases }] = await Promise.all([
      supabase.from("companies").select("*, documents(*)").is("deleted_at", null).order("created_at", { ascending: false }),
      supabase.from("profiles").select("*"),
      supabase.from("agency_cases").select("business_name, region").not("region", "is", null).limit(10000),
    ]);
    // 기관별 현황 지역 → 기업 목록 자동 동기화
    var companiesList = cos || [];
    if (agencyCases && agencyCases.length > 0) {
      var regionMap = {};
      agencyCases.forEach(function(ac) {
        if (ac.business_name && ac.region && ac.region.trim()) {
          regionMap[ac.business_name] = ac.region.trim();
        }
      });
      var updates = [];
      companiesList.forEach(function(co) {
        if (!co.region && regionMap[co.name]) {
          updates.push({ id: co.id, region: regionMap[co.name] });
          co.region = regionMap[co.name];
        }
      });
      // 빈 지역 자동 채우기 (백그라운드)
      updates.forEach(function(u) {
        supabase.from("companies").update({ region: u.region }).eq("id", u.id);
      });
    }
    setCompanies(companiesList);
    setProfiles(profs || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
    if (profile?.name) fetchWorkNotesBadge(profile.name);
  }, [fetchAll]);

  // 로그인 시 오늘 할 일 알림 - 최초 1회만
  const alertShownRef = useRef(false);
  useEffect(() => {
    if (companies.length > 0 && !alertShownRef.current) {
      alertShownRef.current = true;
      const todayStr = kstDate();
      const todayContacts = companies.filter(c => c.next_contact === todayStr);
      const stagnantList = companies.filter(c => c.stagnant_days >= 7);
      if (todayContacts.length > 0 || stagnantList.length > 0) {
        setTimeout(() => setShowTodayAlert(true), 800);
      }
    }
  }, [companies]);

  // 실시간 구독
  useEffect(() => {
    const channel = supabase.channel("crm-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "companies" }, fetchAll)
      .on("postgres_changes", { event: "*", schema: "public", table: "documents" }, fetchAll)
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [fetchAll]);

  const filtered = useMemo(() => (companies || []).filter(c => {
    const s = search.toLowerCase();
    const sDigits = s.replace(/[^0-9]/g, "");
    const matchSearch = !s || c.name?.toLowerCase().includes(s) || c.representative?.toLowerCase().includes(s)
      || c.region?.toLowerCase().includes(s) || c.industry?.toLowerCase().includes(s)
      || (!!sDigits && (c.phone || "").replace(/[^0-9]/g, "").includes(sDigits));
    const matchStage = filterStage === "전체" || c.stage === filterStage;
    const matchAssignee = filterAssignee === "전체" || (c.assignee || "").split(",").map(function(x) { return x.trim(); }).includes(filterAssignee);
    const matchType = filterType === "전체" || c.type === filterType;
    const matchAgency = filterAgency === "전체" || (function() {
      const want = AGENCY_FILTER_MAP[filterAgency] || [];
      const has = (c.agency || "").split(",").map(function(x) { return x.trim(); }).filter(Boolean);
      return has.some(function(a) { return want.includes(a); });
    })();
    const matchTeam = filterTeam === "전체" || teamOf(c) === filterTeam;
    let matchCredit = true;
    if (creditFilter !== "" && !isNaN(parseInt(creditFilter))) {
      const n = parseInt(creditFilter);
      const kcb = (c.credit_score_kcb == null || c.credit_score_kcb === "") ? null : parseInt(c.credit_score_kcb);
      if (kcb == null) matchCredit = false;
      else matchCredit = creditMode === "below" ? kcb < n : kcb >= n;
    }
    return matchSearch && matchStage && matchAssignee && matchType && matchAgency && matchTeam && matchCredit;
  }), [companies, search, filterStage, filterAssignee, filterType, filterAgency, filterTeam, creditFilter, creditMode]);

  const stagnant = companies.filter(c => c.stagnant_days >= 7);
  const assignees = ["전체", ...new Set(profiles.map(p => p.name))];

  const logout = () => supabase.auth.signOut();

  // 슬립/탭 전환 후 깨어나면 즉시 세션 복구
  useEffect(() => {
    var onVisible = async function() {
      if (document.visibilityState === "visible") {
        try {
          // 현재 세션 확인. 만료됐으면 자동 갱신
          var { data: { session: cur } } = await supabase.auth.getSession();
          if (!cur) {
            // 세션 자체가 없으면 (이미 로그아웃됨) - 그냥 둠
            return;
          }
          // 만료 시간 체크: expires_at은 초 단위 Unix timestamp
          var now = Math.floor(Date.now() / 1000);
          var expiresAt = cur.expires_at || 0;
          if (expiresAt - now < 60) {
            // 1분 이내 만료 예정이면 강제 갱신
            await supabase.auth.refreshSession();
          }
        } catch (e) {
          console.warn("세션 복구 실패:", e);
        }
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, []);

  // 회사 저장
  const saveCompany = async (data, prevData) => {
    const { documents, ...rest } = data;
    // 모든 필드를 모으되, 빈값(빈문자열/null/undefined)은 저장에서 제외 → 기존 DB값 유지(실수로 비워지는 손실 방지)
    const allFields = {
      name: rest.name, type: rest.type, representative: rest.representative,
      phone: rest.phone, stage: rest.stage, assignee: rest.assignee,
      agency: rest.agency, received_docs: rest.received_docs, requested_docs: rest.requested_docs, last_contact: rest.last_contact,
      next_contact: rest.next_contact, call_count: rest.call_count,
      fee: rest.fee, fee_status: rest.fee_status,
      revenue_2023: rest.revenue_2023, revenue_2024: rest.revenue_2024, revenue_2025: rest.revenue_2025, revenue_2026_h1: rest.revenue_2026_h1,
      issue: rest.issue, next_action: rest.next_action,
      employee_count: rest.employee_count,
      credit_score: rest.credit_score,
      credit_score_kcb: rest.credit_score_kcb ? (parseInt(rest.credit_score_kcb) || null) : null,
      credit_score_nice: rest.credit_score_nice ? (parseInt(rest.credit_score_nice) || null) : null,
      founded_year: rest.founded_year,
      founded_month: rest.founded_month ? (parseInt(rest.founded_month) || null) : null,
      application_month: rest.application_month,
      business_number: rest.business_number,
      business_type: rest.business_type,
      industry: rest.industry,
      region: rest.region,
      contract_date: rest.contract_date,
      referrer: rest.referrer,
      // 신규 기능용 컬럼
      approved_amount: rest.approved_amount ? (parseInt(String(rest.approved_amount).replace(/[^0-9]/g, "")) || null) : null,
      import_ratio: (rest.import_ratio === "" || rest.import_ratio === null || rest.import_ratio === undefined) ? null : (parseFloat(rest.import_ratio) || 0),
      debt_ratio: (rest.debt_ratio === "" || rest.debt_ratio === null || rest.debt_ratio === undefined) ? null : (parseFloat(rest.debt_ratio) || 0),
      interest_coverage_ratio: (rest.interest_coverage_ratio === "" || rest.interest_coverage_ratio === null || rest.interest_coverage_ratio === undefined) ? null : (parseFloat(rest.interest_coverage_ratio) || 0),
      lead_source: rest.lead_source,
    };
    // stage/assignee/received_docs 등은 빈값도 의미가 있을 수 있으나, 일반 정보 필드는 빈값이면 건드리지 않음
    const keepEvenIfEmpty = { stage: 1, assignee: 1, received_docs: 1, requested_docs: 1, fee_status: 1, referrer: 1 };
    const updateObj = {};
    Object.keys(allFields).forEach(function(k) {
      const v = allFields[k];
      if (keepEvenIfEmpty[k]) { updateObj[k] = v; return; }
      if (v === "" || v === null || v === undefined) return; // 빈값은 제외 → DB 기존값 유지
      updateObj[k] = v;
    });
    // 계정정보(accounts)는 항목이 1개 이상 입력됐을 때만 저장 (컬럼 미생성 시 일반 저장이 깨지지 않도록 안전 처리)
    if (Array.isArray(rest.accounts) && rest.accounts.length > 0) {
      updateObj.accounts = rest.accounts;
    }
    // 기업정보 탭: 기대출 내역(loans), 기업정보 항목(company_info), 기타 메모(company_info_memo)
    if (Array.isArray(rest.loans)) updateObj.loans = rest.loans;
    if (Array.isArray(rest.company_info)) updateObj.company_info = rest.company_info;
    if (rest.company_info_memo !== undefined && rest.company_info_memo !== null) updateObj.company_info_memo = rest.company_info_memo;
    if (rest.doc_request_dates && typeof rest.doc_request_dates === "object") updateObj.doc_request_dates = rest.doc_request_dates;
    const { error } = await supabase.from("companies").update(updateObj).eq("id", rest.id);
    if (!error) {
      // 팀 자동/수동 분류값 저장 (team 컬럼 미생성 시 무시 → 일반 저장은 정상 동작)
      try {
        var wantTeamU = rest.team || teamByName(rest.name);
        await supabase.from("companies").update({ team: wantTeamU }).eq("id", rest.id);
      } catch (teamErr) { /* team 컬럼 없음 등 → 무시, 화면은 업체명 기준 자동 표시 */ }
      // 🆕 stage가 "부결/반려"로 새로 바뀌면 → 사례집 자동 초안 생성
      if (rest.stage === "부결/반려" && prevData && prevData.stage !== "부결/반려") {
        try {
          // 중복 방지: 같은 회사명 + 부결 결과 사례가 24시간 안에 있으면 스킵
          var dupCheck = await supabase.from("approval_cases")
            .select("id")
            .eq("business_name", rest.name || "")
            .eq("result", "부결")
            .is("deleted_at", null)
            .gte("created_at", new Date(Date.now() - 24*60*60*1000).toISOString())
            .limit(1);
          if (!dupCheck.data || dupCheck.data.length === 0) {
            // 회사 정보만 자동 채움. 노하우 항목(initial_issue, resolution, key_point, result_reason, blog_memo, tags)은 비워둠
            var draftPayload = {
              business_name: rest.name || "",
              agency_group: rest.agency || null,
              result: "부결",
              industry: rest.industry || null,
              region: rest.region || null,
              business_type: rest.type || "법인",
              result_at: kstDate(),
              tags: [],
              created_by: rest.assignee || (typeof profile !== "undefined" && profile?.name) || "시스템",
            };
            var caseIns = await supabase.from("approval_cases").insert(draftPayload);
            if (!caseIns.error) {
              if (typeof showToast === "function") {
                showToast("📚 사례집에 '" + (rest.name || "업체") + "' 부결 카드가 자동 생성됐어요. 사례집 메뉴에서 거절 사유·노하우를 채워주세요.", "success");
              }
            } else {
              console.warn("사례집 자동 생성 실패:", caseIns.error.message);
            }
          }
        } catch (autoErr) {
          console.warn("사례집 자동 생성 중 오류:", autoErr);
        }
      }

      // 신청예정월 + 담당기관이 있으면 기관별 현황에 자동 반영
      if (rest.application_month && rest.agency) {
        var monthNum = parseInt(rest.application_month.split("-")[1], 10);
        var yearNum = parseInt(rest.application_month.split("-")[0], 10);
        var AGENCY_MAP = {
          "소상공인시장진흥공단": "소상공인시장진흥공단",
          "중소벤처기업진흥공단": "중소벤처기업진흥공단",
          "신용보증기금": "신용보증기금",
          "농협신용보증기금": "농협신용보증기금",
          "기술보증기금": "기술보증기금",
          "신용보증재단": "신용보증재단",
          "서민금융진흥원": "신용보증재단",
          "구조혁신&사업전환": "구조혁신&사업전환",
          "기타": "기타",
        };
        var rawAgencies = rest.agency.split(",").map(function(a) { return a.trim(); }).filter(Boolean);
        var mappedGroups = [];
        rawAgencies.forEach(function(a) {
          var g = AGENCY_MAP[a];
          if (g && mappedGroups.indexOf(g) === -1) mappedGroups.push(g);
        });
        var addedCount = 0;
        for (var gi = 0; gi < mappedGroups.length; gi++) {
          var agencyGroup = mappedGroups[gi];
          var existing = await supabase.from("agency_cases")
            .select("id").eq("business_name", rest.name).eq("agency_group", agencyGroup)
            .eq("month", monthNum).eq("year", yearNum).is("deleted_at", null).maybeSingle();
          if (!existing.data) {
            var ins = await supabase.from("agency_cases").insert({
              business_name: rest.name, agency_group: agencyGroup,
              month: monthNum, year: yearNum,
              assignee: Array.isArray(rest.assignee) ? rest.assignee.join(", ") : (rest.assignee || ""),
              representative: rest.representative || null,
              business_number: rest.business_number || null,
              region: rest.region || null,
              notes: null,
              contract_date: rest.contract_date || null,
              status: "시작 전",
            });
            if (!ins.error) addedCount++;
            else showToast("기관별현황 등록 실패: " + ins.error.message, "error");
          }
        }
        if (addedCount > 0) showToast("기관별 현황에 " + addedCount + "건 자동 등록됐어요 (" + monthNum + "월)!");
      }
      // 이슈/액션 변경 시 활동 로그 자동 기록
      const logEntries = [];
      if (prevData && rest.issue && rest.issue !== prevData.issue) {
        logEntries.push({ case_id: rest.id, case_type: "company", business_name: rest.name, assignee: rest.assignee, log_type: "issue_update", memo: "현재 이슈: " + rest.issue.slice(0, 100), logged_by: rest.assignee });
      }
      if (prevData && rest.next_action && rest.next_action !== prevData.next_action) {
        logEntries.push({ case_id: rest.id, case_type: "company", business_name: rest.name, assignee: rest.assignee, log_type: "action_update", memo: "다음 액션: " + rest.next_action.slice(0, 100), logged_by: rest.assignee });
      }
      if (logEntries.length > 0) {
        await supabase.from("activity_logs").insert(logEntries);
      }
      // 상태·담당자 변경 자동 기록 (누가 언제 무엇을 → 무엇으로) — 상세패널 활동에 표시되도록 company_id 사용
      const changeLog = [];
      if (prevData && rest.stage !== prevData.stage) {
        changeLog.push({ company_id: rest.id, business_name: rest.name, assignee: rest.assignee, log_type: "stage_change", memo: "진행단계: " + (prevData.stage || "없음") + " → " + (rest.stage || "없음") + (profile?.name ? " (변경: " + profile.name + ")" : ""), logged_by: profile?.name || rest.assignee });
      }
      var curAssignee2 = Array.isArray(rest.assignee) ? rest.assignee.join(", ") : (rest.assignee || "");
      var prevAssignee2 = prevData ? (Array.isArray(prevData.assignee) ? prevData.assignee.join(", ") : (prevData.assignee || "")) : "";
      if (prevData && curAssignee2 !== prevAssignee2) {
        changeLog.push({ company_id: rest.id, business_name: rest.name, assignee: rest.assignee, log_type: "assignee_change", memo: "담당자: " + (prevAssignee2 || "없음") + " → " + (curAssignee2 || "없음") + (profile?.name ? " (변경: " + profile.name + ")" : ""), logged_by: profile?.name || rest.assignee });
      }
      if (changeLog.length > 0) {
        await supabase.from("activity_logs").insert(changeLog);
      }
      // 기관별 현황 자동 동기화: 회사명이 같은 모든 agency_cases의 정보를 최신화
      if (rest.name && prevData) {
        var syncUpdates = {};
        if (rest.representative !== prevData.representative) syncUpdates.representative = rest.representative || null;
        if (rest.business_number !== prevData.business_number) syncUpdates.business_number = rest.business_number || null;
        if (rest.region !== prevData.region) syncUpdates.region = rest.region || null;
        if (rest.contract_date !== prevData.contract_date) syncUpdates.contract_date = rest.contract_date || null;
        var prevAssignee = Array.isArray(prevData.assignee) ? prevData.assignee.join(", ") : (prevData.assignee || "");
        var newAssignee = Array.isArray(rest.assignee) ? rest.assignee.join(", ") : (rest.assignee || "");
        if (newAssignee !== prevAssignee) syncUpdates.assignee = newAssignee;
        // 회사명 변경 시
        var nameChanged = prevData.name && rest.name !== prevData.name;
        if (nameChanged) syncUpdates.business_name = rest.name;
        if (Object.keys(syncUpdates).length > 0) {
          var oldName = nameChanged ? prevData.name : rest.name;
          var syncResult = await supabase.from("agency_cases").update(syncUpdates).eq("business_name", oldName).is("deleted_at", null);
          if (!syncResult.error && syncResult.count !== 0) {
            // 동기화 성공 (조용히 처리)
          }
        }
      }
      showToast("저장됐어요!");
      // 전체 리로드(fetchAll) 시 목록이 재정렬되며 스크롤이 맨 위로 튀므로, 해당 회사만 로컬 갱신
      // 실제 DB에 저장한 값(updateObj)으로 갱신해야 화면과 DB가 일치함
      setCompanies(function(prev) { return prev.map(function(c) { return c.id === rest.id ? Object.assign({}, c, updateObj) : c; }); });
    }
    else showToast("저장 실패: " + error.message, "error");
  };

  // 서류 토글
  const toggleDoc = async (docId, current) => {
    await supabase.from("documents").update({ received: !current, received_at: !current ? kstDate() : null }).eq("id", docId);
    fetchAll();
  };

  // 신규 회사 추가
  const addCompany = async (form) => {
    if (!form.name || !form.name.trim()) { showToast("업체명을 입력해주세요.", "error"); return; }
    if (!form.representative || !form.representative.trim()) { showToast("대표자명을 입력해주세요.", "error"); return; }

    // 🆕 사업자등록번호 중복 체크 (사업자번호가 있는 경우만)
    if (form.business_number && form.business_number.trim()) {
      // 사업자번호 정규화: 숫자만 추출
      var normalizedBN = form.business_number.replace(/[^0-9]/g, "");
      if (normalizedBN.length >= 10) {
        var dupRes = await supabase.from("companies")
          .select("id, name, representative, assignee, stage, business_number")
          .is("deleted_at", null);
        if (!dupRes.error && dupRes.data) {
          var duplicate = dupRes.data.find(function(c) {
            if (!c.business_number) return false;
            return c.business_number.replace(/[^0-9]/g, "") === normalizedBN;
          });
          if (duplicate) {
            var msg = "⚠️ 같은 사업자등록번호의 업체가 이미 있어요.\n\n"
              + "기존 업체: " + duplicate.name + "\n"
              + "대표자: " + (duplicate.representative || "-") + "\n"
              + "담당: " + (duplicate.assignee || "-") + "\n"
              + "진행단계: " + (duplicate.stage || "-") + "\n\n"
              + "그래도 등록할까요?";
            if (!confirm(msg)) {
              showToast("등록이 취소됐어요. 기존 업체를 확인해주세요.", "info");
              return;
            }
          }
        }
      }
    }

    var insertData = {
      name: form.name.trim(),
      type: form.type || "법인",
      representative: form.representative.trim(),
      phone: form.phone || "",
      stage: form.stage || "상담/진단완료",
      assignee: form.assignee || "",
      agency: form.agency || "",
      last_contact: kstDate(),
      issue: form.issue || "",
      next_action: form.next_action || "",
      fee: form.fee || 5,
      fee_status: "미수령",
      stagnant_days: 0,
      stage_updated_at: kstDate(),
    };
    if (form.next_contact) insertData.next_contact = form.next_contact;
    if (form.contract_date) insertData.contract_date = form.contract_date;
    if (form.employee_count) insertData.employee_count = parseInt(form.employee_count) || null;
    if (form.credit_score_kcb) insertData.credit_score_kcb = parseInt(form.credit_score_kcb) || null;
    if (form.credit_score_nice) insertData.credit_score_nice = parseInt(form.credit_score_nice) || null;
    if (form.founded_year) insertData.founded_year = parseInt(form.founded_year) || null;
    if (form.founded_month) insertData.founded_month = parseInt(form.founded_month) || null;
    if (form.business_number) insertData.business_number = form.business_number;
    if (form.business_type) insertData.business_type = form.business_type;
    if (form.industry) insertData.industry = form.industry;
    if (form.region) insertData.region = form.region;
    if (form.revenue_2023) insertData.revenue_2023 = parseInt(form.revenue_2023) || null;
    if (form.revenue_2024) insertData.revenue_2024 = parseInt(form.revenue_2024) || null;
    if (form.revenue_2025) insertData.revenue_2025 = parseInt(form.revenue_2025) || null;
    if (form.revenue_2026_h1) insertData.revenue_2026_h1 = parseInt(form.revenue_2026_h1) || null;
    // 빠른 등록에서 agency_list(배열)와 agency 처리
    if (Array.isArray(form.agency_list) && form.agency_list.length > 0) {
      insertData.agency = form.agency_list.join(", ");
      insertData.agency_list = form.agency_list.join(", ");
    } else if (form.agency_list_str) {
      insertData.agency_list = form.agency_list_str;
    }
    // 기업정보 탭 (기업현황표 자동추출분)
    if (Array.isArray(form.loans) && form.loans.length > 0) insertData.loans = form.loans;
    if (Array.isArray(form.company_info) && form.company_info.length > 0) insertData.company_info = form.company_info;
    if (form.company_info_memo) insertData.company_info_memo = form.company_info_memo;
    if (form.referrer) insertData.referrer = form.referrer;
    if (form.lead_source) insertData.lead_source = form.lead_source;

    const { data: co, error } = await supabase.from("companies").insert(insertData).select().single();
    if (!error && co) {
      // 서류 체크리스트 자동 생성
      var docsInsert = await supabase.from("documents").insert(DOC_LIST.map(d => ({ company_id: co.id, doc_name: d, received: false }))).select();
      // 팀 자동/수동 분류값 저장 (team 컬럼 미생성 시 무시)
      var wantTeamA = form.team || teamByName(form.name);
      try { await supabase.from("companies").update({ team: wantTeamA }).eq("id", co.id); } catch (teamErr) { /* 무시 */ }
      var newCompany = Object.assign({}, co, { documents: docsInsert.data || [], team: wantTeamA });
      showToast("신규 업체가 등록됐어요! 상세 정보를 입력하세요.");
      setShowAdd(false);
      // 등록 후 곧바로 기업 상세 화면 자동 오픈 (두 번 일 안 하도록)
      setSelectedCompany(newCompany);
      fetchAll();
    } else {
      console.error("등록 실패:", error);
      showToast("등록 실패: " + (error?.message || "알 수 없는 오류"), "error");
    }
  };

  return (
    <div style={{ fontFamily: "'Noto Sans KR', sans-serif", background: "#F7F6F3", minHeight: "100vh", color: "#1A1917" }}>
      <style>{`
        @media (max-width: 768px) {
          .crm-sidebar { display: none !important; }
          .crm-mobile-nav { display: flex !important; }
          .crm-main { margin-left: 0 !important; padding: 16px !important; padding-bottom: 70px !important; }
        }
        @media (min-width: 769px) {
          .crm-mobile-nav { display: none !important; }
        }
        .crm-mobile-nav {
          position: fixed; bottom: 0; left: 0; right: 0; height: 58px;
          background: #1A1917; display: flex; align-items: center;
          justify-content: space-around; z-index: 200; border-top: 1px solid #2E2C29;
        }
      `}</style>
      {/* 토스트 */}
      {toast && (
        <div style={{ position: "fixed", top: 20, right: 20, zIndex: 9999, background: toast.type === "success" ? "#15803D" : "#DC2626", color: "#fff", padding: "11px 18px", borderRadius: 8, fontSize: 13, fontWeight: 500, boxShadow: "0 4px 20px rgba(0,0,0,0.2)", animation: "fadein 0.2s ease" }}>
          <style>{`@keyframes fadein{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}`}</style>
          {toast.msg}
        </div>
      )}

      {/* 오늘 할 일 알림 팝업 */}
      {showTodayAlert && (function() {
        const todayStr = kstDate();
        const todayContacts = companies.filter(c => c.next_contact === todayStr);
        const stagnantList = companies.filter(c => c.stagnant_days >= 7);
        return (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9998, display: "flex", alignItems: "center", justifyContent: "center" }}
            onClick={() => setShowTodayAlert(false)}>
            <div style={{ background: "#fff", borderRadius: 16, padding: "24px", width: 400, maxHeight: "80vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}
              onClick={e => e.stopPropagation()}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800 }}>📋 오늘의 할 일</div>
                  <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>{new Date().toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "short" })}</div>
                </div>
                <button onClick={() => setShowTodayAlert(false)} style={{ background: "none", border: "none", cursor: "pointer" }}>
                  <Icon name="x" size={18} color="#888" />
                </button>
              </div>
              {todayContacts.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#4338CA", marginBottom: 8, display: "flex", alignItems: "center", gap: 5 }}>
                    📞 오늘 연락 예정 ({todayContacts.length}건)
                  </div>
                  {todayContacts.map(function(c) {
                    return (
                      <div key={c.id} onClick={function() { setSelectedCompany(c); setShowTodayAlert(false); }}
                        style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: "#EEF2FF", borderRadius: 8, marginBottom: 6, cursor: "pointer" }}
                        onMouseEnter={e => e.currentTarget.style.background = "#E0E7FF"}
                        onMouseLeave={e => e.currentTarget.style.background = "#EEF2FF"}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700 }}>{c.name}</div>
                          <div style={{ fontSize: 11, color: "#888", marginTop: 1 }}>{c.assignee} · {c.stage}</div>
                        </div>
                        <Icon name="chevronR" size={14} color="#4338CA" />
                      </div>
                    );
                  })}
                </div>
              )}
              {stagnantList.length > 0 && (
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#DC2626", marginBottom: 8 }}>
                    ⚠️ 정체 업체 ({stagnantList.length}건)
                  </div>
                  {stagnantList.slice(0, 5).map(function(c) {
                    return (
                      <div key={c.id} onClick={function() { setSelectedCompany(c); setShowTodayAlert(false); }}
                        style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: "#FEF2F2", borderRadius: 8, marginBottom: 6, cursor: "pointer" }}
                        onMouseEnter={e => e.currentTarget.style.background = "#FEE2E2"}
                        onMouseLeave={e => e.currentTarget.style.background = "#FEF2F2"}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700 }}>{c.name}</div>
                          <div style={{ fontSize: 11, color: "#888", marginTop: 1 }}>{c.stagnant_days}일 정체 · {c.assignee}</div>
                        </div>
                        <Icon name="chevronR" size={14} color="#DC2626" />
                      </div>
                    );
                  })}
                </div>
              )}
              {todayContacts.length === 0 && stagnantList.length === 0 && (
                <div style={{ textAlign: "center", padding: "30px 0", color: "#AAA", fontSize: 13 }}>
                  <div style={{ fontSize: 32, marginBottom: 10 }}>🎉</div>
                  오늘 할 일이 없어요!
                </div>
              )}
              <button onClick={() => setShowTodayAlert(false)}
                style={{ width: "100%", marginTop: 16, padding: "11px", background: "#1A1917", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                확인
              </button>
            </div>
          </div>
        );
      })()}

      {/* 빠른 메모 팝업 */}
      {quickMemo && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9998, display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={() => setQuickMemo(false)}>
          <div style={{ background: "#fff", borderRadius: 14, padding: "22px", width: 380, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ fontSize: 15, fontWeight: 800 }}>✏️ 빠른 메모</div>
              <button onClick={() => setQuickMemo(false)} style={{ background: "none", border: "none", cursor: "pointer" }}>
                <Icon name="x" size={18} color="#888" />
              </button>
            </div>
            <textarea value={quickMemoText} onChange={function(e) { var v = e.target.value; setQuickMemoText(v); }}
              placeholder="메모 내용을 입력하세요..."
              rows={5} autoFocus
              style={{ width: "100%", padding: "12px", border: "1px solid #E8E5E0", borderRadius: 8, fontSize: 13, resize: "none", boxSizing: "border-box", outline: "none", lineHeight: 1.6 }} />
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button onClick={async function() {
                if (!quickMemoText.trim()) return;
                await supabase.from("work_notes").insert({
                  title: "빠른 메모",
                  content: quickMemoText.trim(),
                  assignee: profile?.name || "",
                  is_todo: false,
                  pinned: false,
                });
                setQuickMemoText("");
                setQuickMemo(false);
                showToast("메모가 저장됐어요!");
              }}
                style={{ flex: 1, padding: "11px", background: "#1A1917", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                업무노트에 저장
              </button>
              <button onClick={() => setQuickMemo(false)}
                style={{ padding: "11px 16px", background: "#fff", color: "#888", border: "1px solid #E8E5E0", borderRadius: 8, fontSize: 13, cursor: "pointer" }}>
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 사이드바 */}
      <div className="crm-sidebar" style={{ position: "fixed", left: 0, top: 0, width: 220, height: "100vh", background: "#1A1917", display: "flex", flexDirection: "column", zIndex: 100 }}>
        <div style={{ padding: "24px 20px 14px" }}>
          <div style={{ fontSize: 10, letterSpacing: "0.14em", color: "#555", textTransform: "uppercase", marginBottom: 5 }}>Policy Fund CRM</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#F7F6F3", letterSpacing: "-0.02em" }}>컨설팅 관리</div>
        </div>

        {stagnant.length > 0 && (
          <div onClick={() => setView("stagnant")} style={{ margin: "0 12px 8px", background: "#7C2020", borderRadius: 8, padding: "8px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
            <Icon name="alert" size={13} color="#FCA5A5" />
            <span style={{ color: "#FCA5A5", fontSize: 12, fontWeight: 600 }}>정체 {stagnant.length}건 경보</span>
          </div>
        )}

        <nav style={{ padding: "6px 12px", flex: 1, overflowY: "auto", minHeight: 0 }}>
          {/* 통합 검색 버튼 */}
          <div onClick={function() { setShowGlobalSearch(true); }}
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 12px", borderRadius: 8, cursor: "pointer", marginBottom: 8, background: "#2E2C29", color: "#999", fontSize: 12, border: "1px solid #3A3835" }}>
            <span>🔍</span>
            <span style={{ flex: 1 }}>통합 검색</span>
            <span style={{ fontSize: 10, background: "#1A1917", padding: "2px 6px", borderRadius: 4, color: "#888" }}>Ctrl+K</span>
          </div>
          <div onClick={function() { setShowAiSearch(true); }}
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 12px", borderRadius: 8, cursor: "pointer", marginBottom: 8, background: "#312E81", color: "#C7D2FE", fontSize: 12, border: "1px solid #4338CA" }}>
            <span>🤖</span>
            <span style={{ flex: 1 }}>AI 상담</span>
            <span style={{ fontSize: 10, background: "#1A1917", padding: "2px 6px", borderRadius: 4, color: "#A5B4FC" }}>질문</span>
          </div>
          {/* 자주 쓰는 메뉴 */}
          <div style={{ fontSize: 10, color: "#444", letterSpacing: "0.08em", padding: "4px 12px 6px", fontWeight: 600 }}>주요 메뉴</div>
          {[
            { id: "dashboard",  label: "대시보드",   icon: "dashboard" },
            { id: "mytodo",     label: "내 할일",     icon: "check" },
            { id: "agency",     label: "기관별 현황", icon: "building" },
            { id: "worknotes",  label: "업무 노트",   icon: "edit" },
            { id: "list",       label: "기업 목록",   icon: "list" },
            { id: "pipeline",   label: "파이프라인",  icon: "pipeline" },
            { id: "cases",      label: "사례집",      icon: "folder" },
            { id: "quicklinks", label: "바로가기",    icon: "link" },
          ].map(({ id, label, icon }) => (
            <div key={id} onClick={() => setView(id)}
              style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 8, cursor: "pointer", marginBottom: 2, background: view === id ? "#2E2C29" : "transparent", color: view === id ? "#F7F6F3" : "#666", fontSize: 13, fontWeight: view === id ? 600 : 400 }}>
              <Icon name={icon} size={15} color={view === id ? "#F7F6F3" : "#666"} />
              {label}
              {id === "worknotes" && workNotesBadge > 0 && (
                <span style={{ marginLeft: "auto", background: "#DC2626", color: "#fff", borderRadius: 99, fontSize: 10, fontWeight: 700, padding: "1px 7px" }}>{workNotesBadge}</span>
              )}
              {id === "list" && stagnant.filter(function(c) { return c.stagnant_days >= 14; }).length > 0 && (
                <span style={{ marginLeft: "auto", background: "#B45309", color: "#fff", borderRadius: 99, fontSize: 10, fontWeight: 700, padding: "1px 7px" }}>⚠</span>
              )}
            </div>
          ))}

          {/* 더보기 접기 */}
          <div onClick={() => setMenuExpanded(m => !m)}
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 12px", cursor: "pointer", color: "#555", fontSize: 12, marginTop: 4, marginBottom: 2 }}>
            <Icon name={menuExpanded ? "chevronL" : "chevronR"} size={12} color="#555" />
            {menuExpanded ? "접기" : "더보기"}
            {stagnant.length > 0 && !menuExpanded && (
              <span style={{ background: "#DC2626", color: "#fff", borderRadius: 99, fontSize: 10, fontWeight: 700, padding: "1px 6px" }}>{stagnant.length}</span>
            )}
          </div>

          {menuExpanded && (
            <>
              <div style={{ fontSize: 10, color: "#444", letterSpacing: "0.08em", padding: "4px 12px 6px", fontWeight: 600 }}>추가 메뉴</div>
              {/* DB리스트 + 캘린더 위아래 */}
              {[
                { id: "leave", label: "연차/휴가", icon: "calendar" },
                { id: "partners", label: "협업 담당자", icon: "users" },
                { id: "dbleads", label: "DB리스트", icon: "phone" },
                { id: "calendar", label: "캘린더", icon: "calendar" },
              ].map(function({ id, label, icon }) {
                return (
                  <div key={id} onClick={function() { setView(id); }}
                    style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 8, cursor: "pointer", marginBottom: 2, background: view === id ? "#2E2C29" : "transparent", color: view === id ? "#F7F6F3" : "#666", fontSize: 13, fontWeight: view === id ? 600 : 400 }}>
                    <Icon name={icon} size={15} color={view === id ? "#F7F6F3" : "#666"} />
                    {label}
                  </div>
                );
              })}
              {[
                { id: "stagnant",    label: "정체 알림",   icon: "alert", badge: stagnant.length },
                { id: "activitylog", label: "활동 로그",   icon: "activity" },
                { id: "manual",      label: "자료실",      icon: "folder" },
                { id: "settlement",  label: "정산관리",    icon: "money" },
                ...(profile.role === "admin" ? [{ id: "members", label: "팀원 관리", icon: "users" }] : []),
                ...(session?.user?.email === EXPORT_OWNER_EMAIL ? [{ id: "backup", label: "데이터 백업", icon: "save" }] : []),
              ].map(({ id, label, icon, badge }) => (
                <div key={id} onClick={() => setView(id)}
                  style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 8, cursor: "pointer", marginBottom: 2, background: view === id ? "#2E2C29" : "transparent", color: view === id ? "#F7F6F3" : "#666", fontSize: 13, fontWeight: view === id ? 600 : 400 }}>
                  <Icon name={icon} size={15} color={view === id ? "#F7F6F3" : "#666"} />
                  {label}
                  {badge > 0 && (
                    <span style={{ marginLeft: "auto", background: "#DC2626", color: "#fff", borderRadius: 99, fontSize: 10, fontWeight: 700, padding: "1px 7px" }}>{badge}</span>
                  )}
                </div>
              ))}
            </>
          )}
        </nav>

        {/* 하단 프로필 */}
        <div style={{ padding: "12px 16px 20px", borderTop: "1px solid #2E2C29" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#2E2C29", display: "flex", alignItems: "center", justifyContent: "center", color: "#F7F6F3", fontSize: 13, fontWeight: 700 }}>{profile.name?.[0]}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: "#F7F6F3", fontSize: 13, fontWeight: 600 }}>{profile.name}</div>
              <div style={{ color: "#555", fontSize: 11 }}>{profile.team} · {profile.role === "admin" ? "관리자" : "팀원"}</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
            <button onClick={() => setQuickMemo(true)}
              style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "7px 6px", background: "#4338CA", border: "none", borderRadius: 6, color: "#fff", fontSize: 11, cursor: "pointer", fontWeight: 600 }}>
              ✏️ 빠른 메모
            </button>
            <button onClick={() => setShowTodayAlert(true)}
              style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "7px 10px", background: "#2E2C29", border: "none", borderRadius: 6, color: "#888", fontSize: 11, cursor: "pointer" }}>
              📋
              {companies.filter(c => c.next_contact === kstDate()).length > 0 && (
                <span style={{ position: "absolute", top: -3, right: -3, width: 8, height: 8, background: "#DC2626", borderRadius: "50%" }} />
              )}
            </button>
            <button onClick={function() { setShowNotifPanel(function(p) { return !p; }); }}
              style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", padding: "7px 10px", background: "#2E2C29", border: "none", borderRadius: 6, color: "#888", fontSize: 14, cursor: "pointer" }}>
              🔔
              {notifications.length > 0 && (
                <span style={{ position: "absolute", top: -3, right: -3, minWidth: 16, height: 16, background: "#DC2626", borderRadius: 99, fontSize: 9, fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 3px" }}>{notifications.length}</span>
              )}
            </button>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={fetchAll} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "6px", background: "#2E2C29", border: "none", borderRadius: 6, color: "#888", fontSize: 11, cursor: "pointer" }}>
              <Icon name="refresh" size={12} color="#888" /> 새로고침
            </button>
            <button onClick={logout} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "6px", background: "#2E2C29", border: "none", borderRadius: 6, color: "#888", fontSize: 11, cursor: "pointer" }}>
              <Icon name="logout" size={12} color="#888" /> 로그아웃
            </button>
          </div>
        </div>
      </div>

      {/* 알림 패널 */}
      {showNotifPanel && (
        <div style={{ position: "fixed", top: 0, left: 220, right: 0, bottom: 0, zIndex: 900 }} onClick={function() { setShowNotifPanel(false); }}>
          <div style={{ position: "absolute", top: 0, left: 0, width: 360, maxHeight: "100vh", background: "#fff", boxShadow: "4px 0 24px rgba(0,0,0,0.15)", overflowY: "auto" }}
            onClick={function(e) { e.stopPropagation(); }}>
            <div style={{ padding: "20px 20px 14px", borderBottom: "1px solid #E8E5E0", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, background: "#fff", zIndex: 1 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700 }}>🔔 알림</div>
                <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>{profile?.name}님에게 온 업무 알림</div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {notifications.length > 0 && (
                  <button onClick={markAllRead} style={{ fontSize: 11, color: "#4338CA", background: "none", border: "1px solid #C7D2FE", borderRadius: 6, padding: "4px 10px", cursor: "pointer" }}>모두 읽음</button>
                )}
                <button onClick={function() { setShowNotifPanel(false); }} style={{ background: "none", border: "none", fontSize: 18, color: "#888", cursor: "pointer" }}>✕</button>
              </div>
            </div>
            <div style={{ padding: "12px 16px" }}>
              {notifications.length === 0 ? (
                <div style={{ padding: "40px 0", textAlign: "center", color: "#888", fontSize: 13 }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>🔔</div>
                  새로운 알림이 없어요
                </div>
              ) : (
                notifications.map(function(note) {
                  return (
                    <div key={note.id} style={{ background: "#F8F9FF", border: "1px solid #E0E7FF", borderRadius: 10, padding: "12px 14px", marginBottom: 10 }}
                      onClick={function() { setView("worknotes"); setShowNotifPanel(false); }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#1A1917", marginBottom: 4 }}>{note.title || "제목 없음"}</div>
                      {note.content && <div style={{ fontSize: 12, color: "#555", lineHeight: 1.6, whiteSpace: "pre-wrap", maxHeight: 60, overflow: "hidden" }}>{note.content}</div>}
                      <div style={{ fontSize: 11, color: "#AAA", marginTop: 6 }}>
                        작성자: {note.created_by || note.assignee} · {new Date(note.created_at).toLocaleDateString("ko-KR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* 메인 */}
      <div className="crm-main" style={{ marginLeft: 220, padding: "28px 32px", minHeight: "100vh" }}>
        {loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", flexDirection: "column", gap: 16 }}>
            <div style={{ width: 36, height: 36, border: "3px solid #E8E5E0", borderTopColor: "#1A1917", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            <span style={{ color: "#888", fontSize: 13 }}>데이터 불러오는 중...</span>
          </div>
        ) : (
          <>
            {view === "dashboard" && <Dashboard companies={companies} profiles={profiles} stagnant={stagnant} onSelectCompany={setSelectedCompany} setView={setView} setFilterStage={setFilterStage} setFilterAssignee={setFilterAssignee} setDashboardFilter={setDashboardFilter} onAdd={() => setShowAdd(true)} canExport={session?.user?.email === EXPORT_OWNER_EMAIL} />}
            {view === "agency" && <AgencyView jumpToMonth={agencyJumpMonth} jumpToGroup={agencyJumpGroup} />}
            {view === "dbleads" && <DBLeadsView canExport={session?.user?.email === EXPORT_OWNER_EMAIL} />}
            {view === "settlement" && <SettlementView />}
            {view === "activitylog" && <ActivityLogView />}
            {view === "worknotes" && <WorkNotesView profile={profile} onBadgeUpdate={function() { fetchWorkNotesBadge(profile?.name); }} />}
            {view === "leave" && <LeaveView profile={profile} profiles={profiles} />}
            {view === "partners" && <PartnersView />}
            {view === "calendar" && <CalendarView companies={companies} onSelectCompany={setSelectedCompany} profile={profile} />}
            {view === "manual" && <ManualView />}
            {view === "quicklinks" && <QuickLinksView />}
            {view === "pipeline" && <PipelineView filtered={filtered} filterAssignee={filterAssignee} setFilterAssignee={setFilterAssignee} assignees={assignees} onSelect={setSelectedCompany} setCompanies={setCompanies} />}
            {view === "cases" && <ApprovalCasesView profile={profile} />}
            {view === "mytodo" && <MyTodoView currentUser={profile?.name} isAdmin={profile?.role === "admin" || profile?.name === "양호"} onSelectCompany={setSelectedCompany} setView={setView} companies={companies} />}
            {view === "list" && <ListView filtered={filtered} companies={companies} search={search} setSearch={setSearch} filterStage={filterStage} setFilterStage={setFilterStage} filterAssignee={filterAssignee} setFilterAssignee={setFilterAssignee} filterType={filterType} setFilterType={setFilterType} filterAgency={filterAgency} setFilterAgency={setFilterAgency} filterTeam={filterTeam} setFilterTeam={setFilterTeam} creditFilter={creditFilter} setCreditFilter={setCreditFilter} creditMode={creditMode} setCreditMode={setCreditMode} assignees={assignees} onSelect={setSelectedCompany} onAdd={() => setShowAdd(true)} setCompanies={setCompanies} showToast={showToast} dashboardFilter={dashboardFilter} setDashboardFilter={setDashboardFilter} canExport={session?.user?.email === EXPORT_OWNER_EMAIL} />}
            {view === "stagnant" && <StagnantView stagnant={stagnant} onSelect={setSelectedCompany} />}
            {view === "members" && profile.role === "admin" && <MembersView profiles={profiles} onRefresh={fetchAll} showToast={showToast} />}
            {view === "backup" && <BackupView canExport={session?.user?.email === EXPORT_OWNER_EMAIL} />}
          </>
        )}
      </div>

      {/* 통합 검색 모달 (Ctrl+K) */}
      {showGlobalSearch && (
        <GlobalSearchModal
          companies={companies}
          query={globalSearchQ}
          setQuery={setGlobalSearchQ}
          onClose={function() { setShowGlobalSearch(false); setGlobalSearchQ(""); }}
          onSelectCompany={function(c) { setSelectedCompany(c); setShowGlobalSearch(false); setGlobalSearchQ(""); }}
          onNavigate={function(v) { setView(v); setShowGlobalSearch(false); setGlobalSearchQ(""); }}
        />
      )}

      {showAiSearch && (
        <AiSearchModal
          companies={companies}
          onClose={function() { setShowAiSearch(false); }}
          onSelectCompany={function(c) { setSelectedCompany(c); setShowAiSearch(false); }}
        />
      )}

      {selectedCompany && (
        <CompanyModal
          company={selectedCompany}
          onClose={() => setSelectedCompany(null)}
          onSave={saveCompany}
          onToggleDoc={toggleDoc}
          currentUser={profile}
          onAgencyRegistered={function() {}}
          companies={companies}
        />
      )}
      {showAdd && <AddModal onClose={() => setShowAdd(false)} onAdd={addCompany} assignees={assignees.filter(a => a !== "전체")} companies={companies} />}

      {/* 모바일 하단 네비게이션 */}
      <div className="crm-mobile-nav">
        {[
          { id: "dashboard",  label: "홈",      icon: "dashboard" },
          { id: "agency",     label: "기관",     icon: "building" },
          { id: "dbleads",    label: "DB",       icon: "phone" },
          { id: "worknotes",  label: "노트",     icon: "edit" },
          { id: "settlement", label: "정산",     icon: "money" },
          { id: "calendar",   label: "캘린더",   icon: "calendar" },
        ].map(({ id, label, icon }) => (
          <div key={id} onClick={() => setView(id)}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, cursor: "pointer", flex: 1, padding: "6px 0" }}>
            <Icon name={icon} size={20} color={view === id ? "#F7F6F3" : "#555"} />
            <span style={{ fontSize: 10, color: view === id ? "#F7F6F3" : "#555", fontWeight: view === id ? 700 : 400 }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── 전체 검색형 AI 상담 모달 ────────────────────────────────────────────────────
function AiSearchModal({ companies, onClose, onSelectCompany }) {
  const [msgs, setMsgs] = useState([]); // { role, content }
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [snapshot, setSnapshot] = useState(null);
  const [loadingSnap, setLoadingSnap] = useState(true);
  const today = new Date().toISOString().slice(0, 10);

  useEffect(function() {
    var pick = function(obj, keys) {
      var out = {};
      keys.forEach(function(k) { if (obj[k] != null && obj[k] !== "") out[k] = obj[k]; });
      return out;
    };
    var companyRows = (companies || []).map(function(c) {
      return pick(c, ["name", "stage", "agency", "assignee", "region", "industry", "type", "business_type", "credit_score_kcb", "credit_score_nice", "fee_status", "next_contact", "representative", "created_at"]);
    });
    Promise.all([
      supabase.from("agency_cases")
        .select("business_name, representative, agency_group, agency_sub, status, assignee, region, request_amount, request_fund, result, result_reason, apply_date, month, year, created_at")
        .is("deleted_at", null).limit(10000),
      supabase.from("settlement_manual")
        .select("business_name, agency_group, month, request_amount, contract_fee, commission_fee, received_amount, contract_date, fee_received_date, invoice_issued, fee_received, settlement_notes")
        .is("deleted_at", null).limit(10000),
    ]).then(function([r1, r2]) {
      setSnapshot({
        업체목록: companyRows,
        기관진행: (r1.error ? [] : (r1.data || [])),
        정산: (r2.error ? [] : (r2.data || [])),
      });
      setLoadingSnap(false);
    });
  }, [companies]);

  var send = async function() {
    var q = input.trim();
    if (!q || loading || !snapshot) return;
    var history = msgs.slice(-8);
    setMsgs(function(p) { return p.concat([{ role: "user", content: q }]); });
    setInput("");
    setLoading(true);
    try {
      var resp = await fetch("/api/ai-search", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question: q, snapshot: snapshot, today: today, history: history }),
      });
      var d = await resp.json();
      if (!resp.ok) throw new Error(d.error || "요청 실패");
      setMsgs(function(p) { return p.concat([{ role: "assistant", content: d.answer || "(빈 응답)" }]); });
    } catch (e) {
      setMsgs(function(p) { return p.concat([{ role: "assistant", content: "❌ 오류: " + (e && e.message ? e.message : e) }]); });
    } finally {
      setLoading(false);
    }
  };

  var examples = ["이번달 부결 정리해줘", "만기임박(입금 예정) 업체는?", "이번주 신규 등록 업체", "담당자별 진행중 건수", "미입금 정산 목록"];

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
      onClick={onClose}>
      <div style={{ background: "#fff", borderRadius: 14, width: 640, maxWidth: "100%", height: "80vh", maxHeight: 720, display: "flex", flexDirection: "column", boxShadow: "0 20px 60px rgba(0,0,0,0.25)", overflow: "hidden" }}
        onClick={function(e) { e.stopPropagation(); }}>
        {/* 헤더 */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid #E8E5E0", background: "#F7F6F3" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button onClick={onClose} title="뒤로가기"
              style={{ display: "flex", alignItems: "center", gap: 4, background: "#fff", border: "1px solid #E8E5E0", borderRadius: 8, padding: "6px 10px", fontSize: 12, fontWeight: 700, color: "#555", cursor: "pointer", whiteSpace: "nowrap" }}>
              ← 뒤로
            </button>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#1A1917" }}>🤖 AI 상담 (전체 검색)</div>
              <div style={{ fontSize: 11, color: "#999", marginTop: 2 }}>
                {loadingSnap ? "데이터 불러오는 중…" : "업체 " + (snapshot.업체목록.length) + " · 기관진행 " + (snapshot.기관진행.length) + " · 정산 " + (snapshot.정산.length) + "건 기준"}
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer" }}>
            <Icon name="x" size={18} color="#888" />
          </button>
        </div>

        {msgs.length === 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, padding: "12px 20px 0" }}>
            {examples.map(function(ex) {
              return (
                <button key={ex} onClick={function() { setInput(ex); }}
                  style={{ fontSize: 11, padding: "5px 10px", borderRadius: 99, border: "1px solid #C7D2FE", background: "#EEF2FF", color: "#4338CA", cursor: "pointer" }}>
                  {ex}
                </button>
              );
            })}
          </div>
        )}

        {/* 대화 */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
          {msgs.length === 0 ? (
            <div style={{ textAlign: "center", padding: "50px 0", color: "#888", fontSize: 13 }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>💬</div>
              전체 업체·기관진행·정산 데이터로 답합니다.<br />예: "이번달 부결 정리해줘"
            </div>
          ) : msgs.map(function(m, i) {
            var isUser = m.role === "user";
            return (
              <div key={i} style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start" }}>
                <div style={{ maxWidth: "84%", background: isUser ? "#1A1917" : "#F7F6F3", color: isUser ? "#F7F6F3" : "#1A1917", border: isUser ? "none" : "1px solid #E8E5E0", borderRadius: 12, padding: "10px 14px", fontSize: 13, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
                  {m.content}
                </div>
              </div>
            );
          })}
          {loading && (
            <div style={{ display: "flex", justifyContent: "flex-start" }}>
              <div style={{ background: "#F7F6F3", border: "1px solid #E8E5E0", borderRadius: 12, padding: "10px 14px", fontSize: 13, color: "#AAA" }}>생각 중…</div>
            </div>
          )}
        </div>

        {/* 입력 */}
        <div style={{ display: "flex", gap: 8, padding: "12px 20px", borderTop: "1px solid #E8E5E0" }}>
          <textarea value={input} onChange={function(e) { setInput(e.target.value); }}
            onKeyDown={function(e) { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder={loadingSnap ? "데이터 불러오는 중…" : "질문 입력 후 Enter (줄바꿈 Shift+Enter)"}
            disabled={loadingSnap}
            rows={2} style={{ flex: 1, padding: "10px 12px", border: "1px solid #E8E5E0", borderRadius: 8, fontSize: 13, resize: "none", boxSizing: "border-box", outline: "none", fontFamily: "inherit", lineHeight: 1.5, background: loadingSnap ? "#F7F6F3" : "#fff" }} />
          <button onClick={send} disabled={!input.trim() || loading || loadingSnap}
            style={{ padding: "0 18px", background: (input.trim() && !loading && !loadingSnap) ? "#4338CA" : "#E8E5E0", color: (input.trim() && !loading && !loadingSnap) ? "#fff" : "#AAA", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: (input.trim() && !loading && !loadingSnap) ? "pointer" : "not-allowed", whiteSpace: "nowrap" }}>
            전송
          </button>
        </div>
      </div>
    </div>
  );
}

// ── 대시보드 ──────────────────────────────────────────────────────────────────
function Dashboard({ companies, profiles, stagnant, onSelectCompany, setView, setFilterStage, setFilterAssignee, setDashboardFilter, onAdd, canExport }) {
  const contractDone = companies.filter(c => c.fee_status === "수수료수령완료").length;
  const contracted = companies.filter(c => c.fee_status !== "미수령").length;
  // const thisWeek = companies.filter(c => c.next_contact && c.next_contact <= "2026-05-15").length;
  const stageCount = STAGES.reduce((a, s) => ({ ...a, [s]: companies.filter(c => c.stage === s).length }), {});

  const [agencyCases, setAgencyCases] = useState([]);
  const [kpiGoals, setKpiGoals] = useState([]);
  const [editingKpi, setEditingKpi] = useState(false);
  const [kpiEdits, setKpiEdits] = useState({});
  const [copiedTpl, setCopiedTpl] = useState(null); // 카톡 템플릿/할일 복사 피드백
  const copyToClipboard = function(text, key) {
    navigator.clipboard?.writeText(text).then(function() {
      setCopiedTpl(key);
      setTimeout(function() { setCopiedTpl(function(cur) { return cur === key ? null : cur; }); }, 1500);
    });
  };
  const KAKAO_TEMPLATES = [
    { key: "tpl_docs", label: "서류 요청", text: "안녕하세요 대표님, 진행에 필요한 서류(사업자등록증·매출자료 등) 준비되시면 회신 부탁드립니다 🙏" },
    { key: "tpl_received", label: "접수 완료", text: "대표님, 신청 접수 완료되었습니다. 결과 나오는 대로 바로 안내드리겠습니다." },
    { key: "tpl_schedule", label: "일정 안내", text: "안녕하세요 대표님, 다음 진행 일정 안내드립니다. 확인 후 연락 부탁드립니다." },
    { key: "tpl_supplement", label: "부결/보완", text: "대표님, 보완 요청이 있어 안내드립니다. 통화 가능하신 시간 알려주세요." },
  ];
  const thisMonth = new Date().getMonth() + 1;
  const thisYear = 2026;

  useEffect(function() {
    supabase.from("agency_cases").select("*").is("deleted_at", null).limit(10000).then(function(r) {
      if (!r.error) setAgencyCases(r.data || []);
    });
    supabase.from("kpi_goals").select("*").eq("year", thisYear).eq("month", thisMonth).then(function(r) {
      if (!r.error) setKpiGoals(r.data || []);
    });
  }, [thisMonth, thisYear]);
  const monthCases = agencyCases.filter(c => c.month === thisMonth && c.year === thisYear);
  // 이번 달 요약 카드용 집계 (기존 데이터로만 계산)
  const monthNewCount = agencyCases.filter(function(c) {
    if (!c.created_at) return false;
    var d = new Date(c.created_at);
    return d.getFullYear() === thisYear && d.getMonth() + 1 === thisMonth;
  }).length;
  const monthApprovedCount = monthCases.filter(c => DONE_STATUSES.includes(c.status)).length;
  const monthRejectedCount = monthCases.filter(c => REJECT_STATUSES.includes(c.status)).length;
  const DASHBOARD_AGENCY_GROUPS = [
    { id: "소상공인시장진흥공단", label: "소진공", color: "#4338CA", ids: ["소상공인시장진흥공단"] },
    { id: "중소벤처기업진흥공단", label: "중진공", color: "#7C3AED", ids: ["중소벤처기업진흥공단","구조혁신&사업전환"] },
    { id: "기금", label: "보증기금", color: "#0F6E56", ids: ["신용보증기금"] },
    { id: "농협신보", label: "농협신보", color: "#0D9488", ids: ["농협신용보증기금"] },
    { id: "재단", label: "보증재단", color: "#B45309", ids: ["신용보증재단"] },
    { id: "기타", label: "경정청구/기타", color: "#555", ids: ["경정청구","기타"] },
  ];
  const agencyStats = DASHBOARD_AGENCY_GROUPS.map(function(g) {
    const cases = monthCases.filter(c => g.ids.includes(c.agency_group));
    const approved = cases.filter(c => DONE_STATUSES.includes(c.status)).length;
    const total = cases.length;
    const rate = total > 0 ? Math.round(approved / total * 100) : 0;
    return { id: g.id, label: g.label, color: g.color, ids: g.ids, total, approved, rate };
  });

  // 담당자별 KPI
  const assigneeKpi = ASSIGNEES.map(function(name) {
    const myCases = monthCases.filter(c => c.assignee === name);
    const approved = myCases.filter(c => DONE_STATUSES.includes(c.status)).length;
    const goal = kpiGoals.find(g => g.assignee === name);
    const goalAmt = goal ? goal.goal_approvals : 0;
    const pct = goalAmt > 0 ? Math.min(Math.round(approved / goalAmt * 100), 100) : 0;
    return { name, total: myCases.length, approved, goalAmt, pct };
  }).filter(a => a.total > 0 || a.goalAmt > 0);

  const saveKpiGoals = async function() {
    for (const [assignee, val] of Object.entries(kpiEdits)) {
      await supabase.from("kpi_goals").upsert({
        year: thisYear, month: thisMonth, assignee,
        goal_approvals: parseInt(val) || 0,
        updated_at: new Date().toISOString()
      }, { onConflict: "year,month,assignee" });
    }
    const r = await supabase.from("kpi_goals").select("*").eq("year", thisYear).eq("month", thisMonth);
    if (!r.error) setKpiGoals(r.data || []);
    setEditingKpi(false); setKpiEdits({});
  };

  // 담당자별 성과 집계 (기능6)
  const assigneeStats = useMemo(function() {
    var IN_PROGRESS = ["기관신청완료/방문완료", "심사중/실태조사대기", "실태조사완료/약정완료"];
    var EXECUTED = ["자금집행완료", "수수료대기 및 입금요청", "입금완료/사후관리"];
    var map = {};
    companies.forEach(function(c) {
      var names = (c.assignee || "").split(",").map(function(s) { return s.trim(); }).filter(Boolean);
      if (names.length === 0) names = ["미지정"];
      names.forEach(function(n) {
        if (!map[n]) map[n] = { name: n, total: 0, inProgress: 0, executed: 0, rejected: 0, fee: 0 };
        map[n].total++;
        if (IN_PROGRESS.indexOf(c.stage) >= 0) map[n].inProgress++;
        if (EXECUTED.indexOf(c.stage) >= 0) map[n].executed++;
        if (c.stage === "부결/반려") map[n].rejected++;
        map[n].fee += expectedFee(c);
      });
    });
    return Object.keys(map).map(function(k) { return map[k]; }).sort(function(a, b) { return b.total - a.total; });
  }, [companies]);
  // 월별 예상 수수료 집계 (기능5)
  const feeStats = useMemo(function() {
    var byMonth = {}, total = 0;
    companies.forEach(function(c) {
      var f = expectedFee(c);
      if (f <= 0) return;
      total += f;
      var m = c.contract_date ? String(c.contract_date).slice(0, 7) : "미정";
      byMonth[m] = (byMonth[m] || 0) + f;
    });
    var thisM = new Date().toISOString().slice(0, 7);
    return { total: total, thisMonth: byMonth[thisM] || 0, byMonth: byMonth };
  }, [companies]);

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.03em", margin: 0 }}>대시보드</h1>
          <p style={{ color: "#888", fontSize: 13, margin: "4px 0 0" }}>전체 현황을 한눈에</p>
        </div>
        <button onClick={onAdd} style={{ display: "flex", alignItems: "center", gap: 6, background: "#1A1917", color: "#F7F6F3", border: "none", borderRadius: 8, padding: "10px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          <Icon name="plus" size={15} color="#F7F6F3" /> 신규 업체 등록
        </button>
      </div>

      {/* 🆕 오늘의 할 일 위젯 */}
      {(function() {
        var today = kstDate();
        var tomorrow = kstDate(1);
        var weekLater = kstDate(7);
        var todayItems = companies.filter(function(c) { return c.next_contact === today || c.contract_date === today; });
        var tomorrowItems = companies.filter(function(c) { return c.next_contact === tomorrow || c.contract_date === tomorrow; });
        var overdue = companies.filter(function(c) { return c.next_contact && c.next_contact < today; });
        var stagnant14 = companies.filter(function(c) { return c.stagnant_days >= 14; });
        var stagnant7 = companies.filter(function(c) { return c.stagnant_days >= 7 && c.stagnant_days < 14; });
        var weekContracts = companies.filter(function(c) { return c.contract_date && c.contract_date > today && c.contract_date <= weekLater; });
        // 서류 요청 지연: 요청한 지 3일 넘고 아직 수령 안 된 서류
        var overdueDocs = [];
        (companies || []).forEach(function(c) {
          var dates = c.doc_request_dates;
          if (!dates || typeof dates !== "object") return;
          var recv = (c.received_docs || "").split(",").map(function(s) { return s.trim(); });
          Object.keys(dates).forEach(function(doc) {
            if (recv.indexOf(doc) >= 0) return;
            var dd = Math.floor((new Date().setHours(0,0,0,0) - new Date(dates[doc]).setHours(0,0,0,0)) / 86400000);
            if (dd >= 3) overdueDocs.push({ company: c, doc: doc, days: dd });
          });
        });
        overdueDocs.sort(function(a, b) { return b.days - a.days; });
        var totalCount = todayItems.length + tomorrowItems.length + overdue.length + stagnant14.length + stagnant7.length + weekContracts.length + overdueDocs.length;
        // 내 할일 위젯은 별도로 항상 표시 (work_notes 기반)
        var showCompaniesWidget = totalCount > 0;
        return (
          <div style={{ background: "linear-gradient(135deg, #FFF7ED 0%, #FEF3C7 100%)", borderRadius: 12, padding: "20px 24px", border: "1px solid #FCD34D", marginBottom: 18 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <span style={{ fontSize: 16 }}>📋</span>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#92400E" }}>오늘의 할 일</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
              {/* 📋 내 할일 위젯 - work_notes 체크박스 기반 (항상 표시) */}
              <MyTodoWidget setView={setView} />

              {/* 📅 차기 업무 마감 요약 (next_action 날짜 자동 집계) */}
              {(function() {
                var acts = (companies || []).filter(function(c) { return c.next_action && nearestActionDate(c.next_action) !== null; }).map(function(c) { return daysUntil(nearestActionDate(c.next_action)); });
                var todayCnt = acts.filter(function(d) { return d === 0; }).length;
                var soonCnt = acts.filter(function(d) { return d >= 1 && d <= 3; }).length;
                var overdueCnt = acts.filter(function(d) { return d < 0; }).length;
                return (
                  <>
                    {todayCnt > 0 && (
                      <div onClick={function() { setView("mytodo"); }} style={{ background: "#fff", borderRadius: 10, padding: "12px 14px", cursor: "pointer", borderLeft: "3px solid #4338CA" }}>
                        <div style={{ fontSize: 10, color: "#4338CA", fontWeight: 700, marginBottom: 4 }}>📅 오늘 마감</div>
                        <div style={{ fontSize: 20, fontWeight: 700, color: "#4338CA" }}>{todayCnt}건</div>
                        <div style={{ fontSize: 10, color: "#888", marginTop: 2 }}>차기 업무 오늘까지</div>
                      </div>
                    )}
                    {soonCnt > 0 && (
                      <div onClick={function() { setView("mytodo"); }} style={{ background: "#fff", borderRadius: 10, padding: "12px 14px", cursor: "pointer", borderLeft: "3px solid #B45309" }}>
                        <div style={{ fontSize: 10, color: "#B45309", fontWeight: 700, marginBottom: 4 }}>⏳ 마감 임박</div>
                        <div style={{ fontSize: 20, fontWeight: 700, color: "#B45309" }}>{soonCnt}건</div>
                        <div style={{ fontSize: 10, color: "#888", marginTop: 2 }}>3일 이내 마감</div>
                      </div>
                    )}
                    {overdueCnt > 0 && (
                      <div onClick={function() { setView("mytodo"); }} style={{ background: "#fff", borderRadius: 10, padding: "12px 14px", cursor: "pointer", borderLeft: "3px solid #DC2626" }}>
                        <div style={{ fontSize: 10, color: "#DC2626", fontWeight: 700, marginBottom: 4 }}>⏰ 기한 지남</div>
                        <div style={{ fontSize: 20, fontWeight: 700, color: "#DC2626" }}>{overdueCnt}건</div>
                        <div style={{ fontSize: 10, color: "#888", marginTop: 2 }}>차기 업무 마감 지남</div>
                      </div>
                    )}
                  </>
                );
              })()}
              {stagnant14.length > 0 && (
                <div onClick={function() { setView("stagnant"); }} style={{ background: "#fff", borderRadius: 10, padding: "12px 14px", cursor: "pointer", borderLeft: "3px solid #DC2626" }}>
                  <div style={{ fontSize: 10, color: "#DC2626", fontWeight: 700, marginBottom: 4 }}>🔴 심각 정체</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: "#DC2626" }}>{stagnant14.length}건</div>
                  <div style={{ fontSize: 10, color: "#888", marginTop: 2 }}>14일 이상 정체</div>
                </div>
              )}
              {stagnant7.length > 0 && (
                <div onClick={function() { setView("stagnant"); }} style={{ background: "#fff", borderRadius: 10, padding: "12px 14px", cursor: "pointer", borderLeft: "3px solid #B45309" }}>
                  <div style={{ fontSize: 10, color: "#B45309", fontWeight: 700, marginBottom: 4 }}>🟡 정체 주의</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: "#B45309" }}>{stagnant7.length}건</div>
                  <div style={{ fontSize: 10, color: "#888", marginTop: 2 }}>7-13일 정체</div>
                </div>
              )}
              {weekContracts.length > 0 && (
                <div onClick={function() { setView("list"); }} style={{ background: "#fff", borderRadius: 10, padding: "12px 14px", cursor: "pointer", borderLeft: "3px solid #15803D" }}>
                  <div style={{ fontSize: 10, color: "#15803D", fontWeight: 700, marginBottom: 4 }}>📋 이번 주 계약</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: "#15803D" }}>{weekContracts.length}건</div>
                  <div style={{ fontSize: 10, color: "#888", marginTop: 2 }}>7일 내 계약 예정</div>
                </div>
              )}
              {overdueDocs.length > 0 && (
                <div style={{ background: "#fff", borderRadius: 10, padding: "12px 14px", borderLeft: "3px solid #DC2626" }}>
                  <div style={{ fontSize: 10, color: "#DC2626", fontWeight: 700, marginBottom: 4 }}>📮 서류 요청 지연</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: "#DC2626" }}>{overdueDocs.length}건</div>
                  <div style={{ fontSize: 10, color: "#888", marginTop: 2 }}>요청 3일+ 미수령</div>
                </div>
              )}
            </div>
            {/* 서류 요청 지연 상세 목록 */}
            {overdueDocs.length > 0 && (
              <div style={{ marginTop: 14, background: "#fff", borderRadius: 10, padding: "12px 16px", border: "1px solid #FECACA" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#DC2626", marginBottom: 8 }}>📮 요청했는데 아직 못 받은 서류 ({overdueDocs.length}건)</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  {overdueDocs.slice(0, 12).map(function(od, i) {
                    return (
                      <div key={i} onClick={function() { onSelectCompany(od.company); }} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", background: od.days >= 7 ? "#FEF2F2" : "#FFFBEB", borderRadius: 7, cursor: "pointer", fontSize: 12.5 }}>
                        <span style={{ fontWeight: 700, color: "#DC2626", minWidth: 44 }}>{od.days}일째</span>
                        <span style={{ fontWeight: 600, flex: "0 0 auto" }}>{od.company.name}</span>
                        <span style={{ color: "#888" }}>— {od.doc}</span>
                      </div>
                    );
                  })}
                  {overdueDocs.length > 12 && <div style={{ fontSize: 11, color: "#999", textAlign: "center", paddingTop: 4 }}>외 {overdueDocs.length - 12}건 더</div>}
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* 📅 이번 달 예정 업무 (next_action 월 표기 기준 실시간 필터) */}
      {(function() {
        var monthTasks = (companies || []).filter(function(c) { return actionHasMonth(c.next_action, thisMonth); });
        return (
          <div style={{ background: "#fff", borderRadius: 12, padding: "20px 24px", border: "1px solid #E8E5E0", marginBottom: 18 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <span style={{ fontSize: 16 }}>📅</span>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#1A1917" }}>이번 달({thisMonth}월) 예정 업무 <span style={{ color: "#999", fontWeight: 600 }}>{monthTasks.length}건</span></div>
            </div>
            {monthTasks.length === 0 ? (
              <div style={{ textAlign: "center", color: "#888", fontSize: 13, padding: "20px 0" }}>이번 달 예정 업무 없음</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {monthTasks.map(function(c) {
                  var action = (c.next_action || "").split("\n").map(function(s) { return s.trim(); }).filter(Boolean).join(" · ");
                  return (
                    <div key={c.id} onClick={function() { onSelectCompany(c); }}
                      style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "9px 12px", background: "#F7F6F3", borderRadius: 8, cursor: "pointer" }}>
                      <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#4338CA", marginTop: 5, flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#1A1917" }}>{c.name}</span>
                        <span style={{ fontSize: 12.5, color: "#666" }}> — {action}</span>
                      </div>
                      {c.assignee && <span style={{ fontSize: 11, color: "#999", flexShrink: 0 }}>{c.assignee}</span>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })()}

      {/* 📊 담당자별 성과 (기능6) + 💰 예상 수수료 (기능5) */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 14, marginBottom: 22 }}>
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #E8E5E0", padding: "16px 18px", overflowX: "auto" }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>📊 담당자별 성과</div>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 480 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #E8E5E0" }}>
                {["담당자", "총건수", "진행중", "자금집행", "부결", "예상수수료"].map(function(h, i) {
                  return <th key={h} style={{ padding: "7px 8px", fontSize: 11, fontWeight: 600, color: "#888", textAlign: i === 0 ? "left" : "right", whiteSpace: "nowrap" }}>{h}</th>;
                })}
              </tr>
            </thead>
            <tbody>
              {assigneeStats.map(function(s) {
                var doneRate = s.total > 0 ? Math.round(s.executed / s.total * 100) : 0;
                return (
                  <tr key={s.name} style={{ borderBottom: "1px solid #F5F3F0", cursor: "pointer" }} onClick={function() { setFilterAssignee(s.name); setView("list"); }}>
                    <td style={{ padding: "8px", fontSize: 12.5, fontWeight: 700 }}>{s.name}</td>
                    <td style={{ padding: "8px", fontSize: 12.5, textAlign: "right" }}>{s.total}</td>
                    <td style={{ padding: "8px", fontSize: 12.5, textAlign: "right", color: "#7C3AED", fontWeight: 600 }}>{s.inProgress}</td>
                    <td style={{ padding: "8px", fontSize: 12.5, textAlign: "right" }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3 }}>
                        <span style={{ color: "#15803D", fontWeight: 700 }}>{s.executed}</span>
                        <div style={{ width: 60, height: 5, background: "#F0EDE8", borderRadius: 99, overflow: "hidden" }}>
                          <div style={{ width: doneRate + "%", height: "100%", background: "#15803D", borderRadius: 99 }} />
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "8px", fontSize: 12.5, textAlign: "right", color: s.rejected > 0 ? "#DC2626" : "#CCC", fontWeight: 600 }}>{s.rejected}</td>
                    <td style={{ padding: "8px", fontSize: 12, textAlign: "right", fontWeight: 700, color: "#15803D", whiteSpace: "nowrap" }}>{s.fee > 0 ? wonToKor(s.fee) : "-"}</td>
                  </tr>
                );
              })}
              {assigneeStats.length === 0 && <tr><td colSpan={6} style={{ padding: 16, textAlign: "center", color: "#888", fontSize: 12 }}>데이터 없음</td></tr>}
            </tbody>
          </table>
        </div>
        <div style={{ background: "#F0FDF4", borderRadius: 12, border: "1px solid #BBF7D0", padding: "16px 18px", display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#15803D" }}>💰 예상 수수료</div>
          <div>
            <div style={{ fontSize: 11, color: "#888", marginBottom: 3 }}>이번 달 (계약일 기준)</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: "#15803D" }}>{feeStats.thisMonth > 0 ? wonToKor(feeStats.thisMonth) + " 원" : "-"}</div>
          </div>
          <div style={{ borderTop: "1px solid #BBF7D0", paddingTop: 10 }}>
            <div style={{ fontSize: 11, color: "#888", marginBottom: 3 }}>전체 파이프라인 합계</div>
            <div style={{ fontSize: 17, fontWeight: 800, color: "#166534" }}>{feeStats.total > 0 ? wonToKor(feeStats.total) + " 원" : "-"}</div>
          </div>
          <div style={{ fontSize: 10, color: "#9CA3AF", marginTop: "auto" }}>* 승인금액 × 수수료율(기본 5%) 기준 추정</div>
        </div>
      </div>

      {/* 🚨 장기 방치 알림 (30일 이상 변화 없음) */}
      {(function() {
        var longStale = companies.filter(function(c) { return (c.stagnant_days || 0) >= 30; })
          .sort(function(a, b) { return (b.stagnant_days || 0) - (a.stagnant_days || 0); });
        if (longStale.length === 0) return null;
        return (
          <div style={{ background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: 12, padding: "16px 20px", marginBottom: 22 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <span style={{ fontSize: 16 }}>🚨</span>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#B91C1C" }}>장기 방치 업체 {longStale.length}건</div>
              <div style={{ fontSize: 11, color: "#DC2626" }}>30일 이상 변화 없음 · 즉시 확인 필요</div>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {longStale.map(function(c) {
                return (
                  <div key={c.id} onClick={function() { onSelectCompany(c); }}
                    style={{ display: "flex", alignItems: "center", gap: 6, background: "#fff", border: "1px solid #FCA5A5", borderRadius: 8, padding: "7px 11px", cursor: "pointer" }}
                    title={c.stage + " · " + (c.assignee || "담당없음")}>
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#DC2626", flexShrink: 0 }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#1A1917" }}>{c.name}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#DC2626" }}>{c.stagnant_days}일</span>
                    {c.assignee && <span style={{ fontSize: 11, color: "#999" }}>· {c.assignee}</span>}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 22 }}>
        {[
          { label: "전체 관리 업체", value: companies.length, sub: "법인 " + companies.filter(c=>c.type==="법인").length + " · 개인 " + companies.filter(c=>c.type==="개인").length, color: "#4338CA", viewId: "list" },
          { label: "계약 완료", value: contracted + "건", sub: "수수료 완납 " + contractDone + "건", color: "#15803D", viewId: "settlement" },
          { label: "대기 건", value: companies.filter(c=>["상담/진단완료","필수서류 및 인증서요청","기관신청대기/방문예정","스크립트 전달 완료"].includes(c.stage)).length + "건", sub: "신청 전 단계", color: "#B45309", viewId: "pipeline" },
          { label: "진행중", value: companies.filter(c=>["기관신청완료/방문완료","심사중/실태조사대기","실태조사완료/약정완료","자금집행완료"].includes(c.stage)).length + "건", sub: "기관 신청 이후", color: "#7C3AED", viewId: "agency" },
        ].map((k, i) => (
          <div key={i} onClick={() => setView(k.viewId)}
            style={{ background: "#fff", borderRadius: 12, padding: "18px 20px", border: "1px solid #E8E5E0", cursor: "pointer", transition: "box-shadow 0.15s" }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.08)"}
            onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}>
            <div style={{ fontSize: 11, color: "#888", marginBottom: 8 }}>{k.label}</div>
            <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.04em", color: k.color }}>{k.value}</div>
            <div style={{ fontSize: 11, color: "#AAA", marginTop: 4, marginBottom: 8 }}>{k.sub}</div>
            <div style={{ fontSize: 11, color: k.color, fontWeight: 600, display: "flex", alignItems: "center", gap: 3 }}>
              바로가기 <Icon name="chevronR" size={12} color={k.color} />
            </div>
          </div>
        ))}
      </div>

      {/* 🕒 오늘 활동 내역 피드 (소통내역·이슈·다음액션 변경 업체) */}
      <TodayActivityFeed companies={companies} onSelectCompany={onSelectCompany} />

      {/* 📅 이번 달 진행 요약 (신규·승인·부결) */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 22 }}>
        {[
          { label: "이번달 신규 진행", value: monthNewCount, sub: thisMonth + "월 생성 건", color: "#4338CA" },
          { label: "이번달 승인 완료", value: monthApprovedCount, sub: "승인·약정·완료", color: "#15803D" },
          { label: "이번달 부결", value: monthRejectedCount, sub: "부결·반려", color: "#DC2626" },
        ].map(function(k, i) {
          return (
            <div key={i} style={{ background: "#fff", borderRadius: 12, padding: "18px 20px", border: "1px solid #E8E5E0" }}>
              <div style={{ fontSize: 11, color: "#888", marginBottom: 8 }}>{k.label}</div>
              <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.04em", color: k.color }}>{k.value}건</div>
              <div style={{ fontSize: 11, color: "#AAA", marginTop: 4 }}>{k.sub}</div>
            </div>
          );
        })}
      </div>

      <div style={{ background: "#fff", borderRadius: 12, padding: "20px 24px", border: "1px solid #E8E5E0", marginBottom: 18 }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>파이프라인 단계별 현황</div>
        <div style={{ display: "flex", gap: 10 }}>
          {STAGES.map((stage, i) => {
            const c = STAGE_COLORS[stage];
            const count = stageCount[stage] || 0;
            const pct = companies.length ? Math.round(count / companies.length * 100) : 0;
            return (
              <div key={stage} onClick={() => { setView("list"); setFilterStage(stage); }}
                style={{ flex: 1, background: c.bg, border: `1px solid ${c.border}`, borderRadius: 10, padding: "14px 16px", cursor: "pointer" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: c.text }}>0{i+1}</span>
                  <span style={{ fontSize: 18, fontWeight: 700, color: c.text }}>{count}</span>
                </div>
                <div style={{ fontSize: 11, fontWeight: 600, color: c.text, marginBottom: 8 }}>{stage}</div>
                <div style={{ height: 4, background: `${c.border}`, borderRadius: 99 }}>
                  <div style={{ height: 4, background: c.text, borderRadius: 99, width: pct + "%" }} />
                </div>
                <div style={{ fontSize: 10, color: c.text, marginTop: 4, opacity: 0.7 }}>{pct}%</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 👥 팀 활동 위젯 */}
      <TeamActivityWidget profiles={profiles} />

      {/* 📊 담당자별 업체 수 막대그래프 */}
      <AssigneeWorkloadChart companies={companies} setView={setView} setFilterAssignee={setFilterAssignee} />

      {/* 기관별 이번 달 현황 */}
      {true && (
        <div style={{ background: "#fff", borderRadius: 12, padding: "20px 24px", border: "1px solid #E8E5E0", marginBottom: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>기관별 이번 달 현황 <span style={{ fontSize: 12, color: "#888", fontWeight: 400 }}>{thisMonth}월</span></div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10 }}>
            {agencyStats.map(function(g) {
              var allCases = agencyCases.filter(function(c) { return g.ids.includes(c.agency_group); });
              var doneCases = allCases.filter(function(c) { return DONE_STATUSES.includes(c.status) && c.contract_date; });
              var avgDays = 0;
              if (doneCases.length > 0) {
                var totalDays = doneCases.reduce(function(s, c) {
                  var contractDate = new Date(c.contract_date);
                  var createdDate = new Date(c.created_at || c.contract_date);
                  var diff = Math.max(0, Math.floor((contractDate - createdDate) / 86400000));
                  return s + diff;
                }, 0);
                avgDays = Math.round(totalDays / doneCases.length);
              }
              return (
                <div key={g.id} style={{ background: "#F7F6F3", borderRadius: 10, padding: "14px 16px", borderLeft: "3px solid " + g.color }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: g.color, marginBottom: 8 }}>{g.label}</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: "#1A1917", marginBottom: 2 }}>{g.total}건</div>
                  <div style={{ fontSize: 11, color: "#888", marginBottom: 8 }}>승인 {g.approved}건</div>
                  <div style={{ height: 4, background: "#E8E5E0", borderRadius: 99 }}>
                    <div style={{ height: 4, background: g.color, borderRadius: 99, width: g.rate + "%" }} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5 }}>
                    <span style={{ fontSize: 10, color: g.color, fontWeight: 600 }}>승인율 {g.rate}%</span>
                    {avgDays > 0 && <span style={{ fontSize: 10, color: "#888", fontWeight: 600 }}>평균 {avgDays}일</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 🆕 미수금 / 입금 예정 위젯 */}
      {(function() {
        var unpaidList = companies.filter(function(c) { return c.fee_status === "계약금수령" || c.fee_status === "미수령"; });
        var unpaidTotal = unpaidList.reduce(function(sum, c) { var amt = parseInt((c.received_amount || c.request_amount || "0").toString().replace(/[^0-9]/g, "")) || 0; return sum + amt; }, 0);
        var paidList = companies.filter(function(c) { return c.fee_status === "수수료수령완료"; });
        var paidTotal = paidList.reduce(function(sum, c) { var amt = parseInt((c.received_amount || "0").toString().replace(/[^0-9]/g, "")) || 0; return sum + amt; }, 0);
        var formatAmt = function(n) { if (n >= 100000000) return (n / 100000000).toFixed(1) + "억"; if (n >= 10000) return Math.round(n / 10000) + "만"; return n + "원"; };
        return (
          <div style={{ background: "#fff", borderRadius: 12, padding: "20px 24px", border: "1px solid #E8E5E0", marginBottom: 18 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>💰 수수료 현황</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
              <div onClick={function() { setView("settlement"); }} style={{ background: "#FEF2F2", borderRadius: 10, padding: "14px 16px", cursor: "pointer", borderLeft: "3px solid #DC2626" }}>
                <div style={{ fontSize: 11, color: "#DC2626", fontWeight: 700, marginBottom: 5 }}>미수금</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: "#DC2626" }}>{formatAmt(unpaidTotal)}</div>
                <div style={{ fontSize: 11, color: "#888", marginTop: 3 }}>{unpaidList.length}건 미입금</div>
              </div>
              <div onClick={function() { setView("settlement"); }} style={{ background: "#F0FDF4", borderRadius: 10, padding: "14px 16px", cursor: "pointer", borderLeft: "3px solid #15803D" }}>
                <div style={{ fontSize: 11, color: "#15803D", fontWeight: 700, marginBottom: 5 }}>입금 완료</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: "#15803D" }}>{formatAmt(paidTotal)}</div>
                <div style={{ fontSize: 11, color: "#888", marginTop: 3 }}>{paidList.length}건 완료</div>
              </div>
              <div style={{ background: "#F7F6F3", borderRadius: 10, padding: "14px 16px", borderLeft: "3px solid #4338CA" }}>
                <div style={{ fontSize: 11, color: "#4338CA", fontWeight: 700, marginBottom: 5 }}>총 수수료</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: "#4338CA" }}>{formatAmt(unpaidTotal + paidTotal)}</div>
                <div style={{ fontSize: 11, color: "#888", marginTop: 3 }}>전체 합계</div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 🆕 미완료 업무 노트 위젯 */}
      {(function() {
        var today = kstDate();
        var myTodos = companies ? [] : []; // 실제 work_notes에서 가져와야 하므로 별도 처리
        return null; // 업무노트는 WorkNotesView에서 관리
      })()}

      {/* 💬 카톡 자주 쓰는 문구 (클릭하면 복사) */}
      <div style={{ background: "#fff", borderRadius: 12, padding: "16px 20px", border: "1px solid #E8E5E0", marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <span style={{ fontSize: 15 }}>💬</span>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#1A1917" }}>카톡 자주 쓰는 문구</div>
          <div style={{ fontSize: 11, color: "#999" }}>버튼 클릭 → 복사 → 카톡에 붙여넣기</div>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {KAKAO_TEMPLATES.map(function(t) {
            var done = copiedTpl === t.key;
            return (
              <button key={t.key} onClick={function() { copyToClipboard(t.text, t.key); }} title={t.text}
                style={{ display: "flex", alignItems: "center", gap: 5, background: done ? "#DCFCE7" : "#F7F6F3", color: done ? "#15803D" : "#4338CA", border: "1px solid " + (done ? "#86EFAC" : "#E8E5E0"), borderRadius: 8, padding: "8px 13px", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>
                {done ? "✅ 복사됨" : "📋 " + t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ✅ 오늘 챙길 업체 리스트 (후속연락·만기임박·서류대기) */}
      {(function() {
        var today = kstDate();
        var followup = companies.filter(function(c) { return c.next_contact && c.next_contact <= today; })
          .sort(function(a, b) { return (a.next_contact || "").localeCompare(b.next_contact || ""); });
        var dueSoon = companies.filter(function(c) {
          if (!c.next_action) return false;
          var nd = nearestActionDate(c.next_action);
          if (nd === null) return false;
          var d = daysUntil(nd);
          return d !== null && d <= 3;
        }).sort(function(a, b) { return daysUntil(nearestActionDate(a.next_action)) - daysUntil(nearestActionDate(b.next_action)); });
        var docWait = [];
        (companies || []).forEach(function(c) {
          var dates = c.doc_request_dates;
          if (!dates || typeof dates !== "object") return;
          var recv = (c.received_docs || "").split(",").map(function(s) { return s.trim(); });
          Object.keys(dates).forEach(function(doc) {
            if (recv.indexOf(doc) >= 0) return;
            var dd = Math.floor((new Date().setHours(0,0,0,0) - new Date(dates[doc]).setHours(0,0,0,0)) / 86400000);
            if (dd >= 3) docWait.push({ company: c, doc: doc, days: dd });
          });
        });
        docWait.sort(function(a, b) { return b.days - a.days; });
        if (followup.length === 0 && dueSoon.length === 0 && docWait.length === 0) return null;

        var Chip = function(props) {
          return (
            <div onClick={props.onClick} title={props.title || ""}
              style={{ display: "flex", alignItems: "center", gap: 6, background: "#fff", border: "1px solid " + props.border, borderRadius: 8, padding: "7px 11px", cursor: "pointer" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: props.dot, flexShrink: 0 }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: "#1A1917" }}>{props.name}</span>
              {props.extra && <span style={{ fontSize: 11, fontWeight: 700, color: props.dot }}>{props.extra}</span>}
            </div>
          );
        };
        var Group = function(props) {
          if (props.items.length === 0) return null;
          return (
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: props.color }}>{props.icon} {props.title} <span style={{ color: "#999" }}>{props.items.length}건</span></div>
                {canExport && (
                  <button onClick={function() { copyToClipboard(props.copyText, props.copyKey); }}
                    style={{ fontSize: 11, fontWeight: 600, color: copiedTpl === props.copyKey ? "#15803D" : "#666", background: copiedTpl === props.copyKey ? "#DCFCE7" : "#F7F6F3", border: "1px solid #E8E5E0", borderRadius: 6, padding: "3px 9px", cursor: "pointer" }}>
                    {copiedTpl === props.copyKey ? "✅ 복사됨" : "📋 목록 복사"}
                  </button>
                )}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>{props.children}</div>
            </div>
          );
        };

        var followupCopy = "[오늘 후속연락]\n" + followup.map(function(c) { return "• " + c.name + (c.phone ? " (" + c.phone + ")" : "") + " - " + (c.assignee || "담당없음"); }).join("\n");
        var dueSoonCopy = "[만기 임박 업무]\n" + dueSoon.map(function(c) { var d = daysUntil(nearestActionDate(c.next_action)); return "• " + c.name + " - " + (d < 0 ? Math.abs(d) + "일 지남" : d === 0 ? "오늘까지" : d + "일 남음"); }).join("\n");
        var docWaitCopy = "[서류 대기]\n" + docWait.map(function(od) { return "• " + od.company.name + " - " + od.doc + " (" + od.days + "일째)"; }).join("\n");

        return (
          <div style={{ background: "#fff", borderRadius: 12, padding: "18px 22px", border: "1px solid #E8E5E0", marginBottom: 18 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <span style={{ fontSize: 16 }}>✅</span>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#1A1917" }}>오늘 챙길 업체</div>
              <div style={{ fontSize: 11, color: "#999" }}>클릭하면 업체 상세 열림</div>
            </div>
            <Group icon="📞" title="후속연락 필요" color="#B45309" items={followup} copyText={followupCopy} copyKey="grp_followup">
              {followup.map(function(c) {
                var over = c.next_contact < today;
                return <Chip key={c.id} name={c.name} dot={over ? "#DC2626" : "#F59E0B"} border={over ? "#FCA5A5" : "#FCD34D"}
                  extra={over ? "기한지남" : "오늘"} title={c.stage + " · " + (c.assignee || "담당없음")}
                  onClick={function() { onSelectCompany(c); }} />;
              })}
            </Group>
            <Group icon="⏰" title="만기 임박" color="#4338CA" items={dueSoon} copyText={dueSoonCopy} copyKey="grp_duesoon">
              {dueSoon.map(function(c) {
                var d = daysUntil(nearestActionDate(c.next_action));
                return <Chip key={c.id} name={c.name} dot={d < 0 ? "#DC2626" : "#4338CA"} border={d < 0 ? "#FCA5A5" : "#C7D2FE"}
                  extra={d < 0 ? Math.abs(d) + "일 지남" : d === 0 ? "오늘" : d + "일 남음"} title={c.next_action}
                  onClick={function() { onSelectCompany(c); }} />;
              })}
            </Group>
            <Group icon="📮" title="서류 대기" color="#DC2626" items={docWait} copyText={docWaitCopy} copyKey="grp_docwait">
              {docWait.map(function(od, i) {
                return <Chip key={od.company.id + "_" + i} name={od.company.name} dot="#DC2626" border="#FCA5A5"
                  extra={od.doc + " " + od.days + "일"} title={"요청 " + od.days + "일째 미수령: " + od.doc}
                  onClick={function() { onSelectCompany(od.company); }} />;
              })}
            </Group>
          </div>
        );
      })()}

      {/* KPI 목표 달성률 */}
      <div style={{ background: "#fff", borderRadius: 12, padding: "20px 24px", border: "1px solid #E8E5E0", marginBottom: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 600 }}>담당자별 KPI 달성률 <span style={{ fontSize: 12, color: "#888", fontWeight: 400 }}>{thisMonth}월 목표</span></div>
          <div style={{ display: "flex", gap: 6 }}>
            {editingKpi ? (
              <>
                <button onClick={saveKpiGoals} style={{ fontSize: 12, padding: "5px 12px", background: "#1A1917", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 600 }}>저장</button>
                <button onClick={function() { setEditingKpi(false); setKpiEdits({}); }} style={{ fontSize: 12, padding: "5px 10px", background: "#fff", color: "#888", border: "1px solid #E8E5E0", borderRadius: 6, cursor: "pointer" }}>취소</button>
              </>
            ) : (
              <button onClick={function() { setEditingKpi(true); }} style={{ fontSize: 12, padding: "5px 12px", background: "#F7F6F3", color: "#555", border: "1px solid #E8E5E0", borderRadius: 6, cursor: "pointer" }}>목표 설정</button>
            )}
          </div>
        </div>
        {editingKpi ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 10 }}>
            {ASSIGNEES.map(function(name) {
              var goal = kpiGoals.find(function(g) { return g.assignee === name; });
              return (
                <div key={name} style={{ background: "#F7F6F3", borderRadius: 8, padding: "12px 14px" }}>
                  <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>{name}</div>
                  <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>승인 목표 (건)</div>
                  <input type="number" min="0"
                    defaultValue={kpiEdits[name] !== undefined ? kpiEdits[name] : (goal ? goal.goal_approvals : 0)}
                    onChange={function(e) { var n = name; setKpiEdits(function(p) { return Object.assign({}, p, { [n]: e.target.value }); }); }}
                    style={{ width: "100%", padding: "6px 8px", border: "1px solid #E8E5E0", borderRadius: 6, fontSize: 13, boxSizing: "border-box" }} />
                </div>
              );
            })}
          </div>
        ) : assigneeKpi.length === 0 ? (
          <div style={{ textAlign: "center", color: "#888", fontSize: 13, padding: "20px 0" }}>
            이번 달 데이터가 없어요. 목표 설정 버튼을 눌러 KPI를 설정해주세요.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {assigneeKpi.map(function(a) {
              var color = a.pct >= 100 ? "#047857" : a.pct >= 70 ? "#4338CA" : a.pct >= 40 ? "#B45309" : "#DC2626";
              return (
                <div key={a.name} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: "#F7F6F3", borderRadius: 8 }}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#1A1917", color: "#F7F6F3", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>{a.name[0]}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{a.name}</span>
                      <span style={{ fontSize: 12, color: "#888" }}>승인 {a.approved}건 {a.goalAmt > 0 ? "/ 목표 " + a.goalAmt + "건" : ""}</span>
                    </div>
                    <div style={{ height: 6, background: "#E8E5E0", borderRadius: 99 }}>
                      <div style={{ height: 6, background: color, borderRadius: 99, width: a.pct + "%", transition: "width 0.5s ease" }} />
                    </div>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: color, minWidth: 36, textAlign: "right" }}>
                    {a.goalAmt > 0 ? a.pct + "%" : a.approved + "건"}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={{ background: "#fff", borderRadius: 12, padding: "20px 24px", border: "1px solid #E8E5E0" }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>담당자별 업무 현황</div>
          {profiles.filter(p => p.role !== "admin").map(p => {
            const mine = companies.filter(c => c.assignee === p.name);
            const stag = mine.filter(c => c.stagnant_days >= 7);
            const pct = companies.length ? Math.round(mine.length / companies.length * 100) : 0;
            return (
              <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 9, padding: "8px 10px", background: "#F7F6F3", borderRadius: 8 }}>
                <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#1A1917", color: "#F7F6F3", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{p.name[0]}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{p.name} <span style={{ fontWeight: 400, color: "#888", fontSize: 11 }}>{p.team}</span></div>
                  <div style={{ fontSize: 11, color: "#888" }}>{mine.length}개 업체 담당</div>
                </div>
                {stag.length > 0 && <span style={{ fontSize: 10, color: "#DC2626", background: "#FEF2F2", padding: "2px 7px", borderRadius: 99, fontWeight: 600, flexShrink: 0 }}>정체 {stag.length}</span>}
                <div style={{ width: 70, height: 5, background: "#E8E5E0", borderRadius: 99, flexShrink: 0 }}>
                  <div style={{ height: 5, background: "#1A1917", borderRadius: 99, width: pct + "%" }} />
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ background: "#fff", borderRadius: 12, padding: "20px 24px", border: "1px solid #E8E5E0" }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>오늘 이슈 · 재통화 필요</div>
          {companies.filter(c => c.stagnant_days >= 7 || (c.next_contact && c.next_contact <= kstDate())).slice(0, 6).map(c => (
            <div key={c.id} onClick={() => onSelectCompany(c)}
              style={{ padding: "9px 12px", borderRadius: 8, border: "1px solid #E8E5E0", marginBottom: 7, cursor: "pointer", display: "flex", gap: 10, alignItems: "flex-start" }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: c.stagnant_days >= 7 ? "#DC2626" : "#F59E0B", marginTop: 5, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{c.name} <span style={{ fontWeight: 400, color: "#888" }}>· {c.assignee}</span></div>
                <div style={{ fontSize: 11, color: "#888", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.issue}</div>
              </div>
              <span style={{ fontSize: 10, color: STAGE_COLORS[c.stage]?.text, background: STAGE_COLORS[c.stage]?.bg, padding: "2px 7px", borderRadius: 99, border: `1px solid ${STAGE_COLORS[c.stage]?.border}`, flexShrink: 0, fontWeight: 600 }}>{c.stage}</span>
            </div>
          ))}
          {companies.filter(c => c.stagnant_days >= 7 || (c.next_contact && c.next_contact <= kstDate())).length === 0 && (
            <div style={{ textAlign: "center", color: "#888", fontSize: 13, padding: "30px 0" }}>오늘 이슈가 없어요 👍</div>
          )}
        </div>
      </div>
    </>
  );
}

// ── 파이프라인 ────────────────────────────────────────────────────────────────
function PipelineView({ filtered, filterAssignee, setFilterAssignee, assignees, onSelect, setCompanies }) {
  const [draggingId, setDraggingId] = useState(null); // 현재 드래그 중인 회사 id
  const [draggingFrom, setDraggingFrom] = useState(null); // 출발 stage
  const [dragOverStage, setDragOverStage] = useState(null); // 드롭 대상 stage (하이라이트)
  const [selectedId, setSelectedId] = useState(null); // 클릭으로 선택한 카드 (색상 표시)

  // 카드 드래그 시작
  var handleDragStart = function(e, co) {
    setDraggingId(co.id);
    setDraggingFrom(co.stage);
    setSelectedId(co.id);
    // 드래그 효과
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = "move";
      try { e.dataTransfer.setData("text/plain", co.id); } catch (err) {}
    }
  };

  var handleDragEnd = function() {
    setDraggingId(null);
    setDraggingFrom(null);
    setDragOverStage(null);
  };

  // 컬럼 위로 드래그 (drop 허용)
  var handleDragOver = function(e, stage) {
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
    if (dragOverStage !== stage) setDragOverStage(stage);
  };

  var handleDragLeave = function(stage) {
    if (dragOverStage === stage) setDragOverStage(null);
  };

  // 컬럼에 drop
  var handleDrop = async function(e, newStage) {
    e.preventDefault();
    var droppedId = draggingId;
    var oldStage = draggingFrom;
    setDraggingId(null);
    setDraggingFrom(null);
    setDragOverStage(null);
    if (!droppedId || oldStage === newStage) return;
    // 확인
    var co = filtered.find(function(x) { return x.id === droppedId; });
    if (!co) return;
    if (!confirm("'" + co.name + "' 단계를 '" + oldStage + "' → '" + newStage + "'(으)로 변경할까요?")) return;
    // Supabase 업데이트
    var r = await supabase.from("companies").update({ stage: newStage, stagnant_days: 0, updated_at: new Date().toISOString() }).eq("id", droppedId);
    if (r.error) { alert("단계 변경 실패: " + r.error.message); return; }
    // 로컬 상태 업데이트
    if (setCompanies) {
      setCompanies(function(prev) {
        return prev.map(function(x) {
          if (x.id === droppedId) return Object.assign({}, x, { stage: newStage, stagnant_days: 0 });
          return x;
        });
      });
    }
  };

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.03em", margin: 0 }}>파이프라인</h1>
          <p style={{ color: "#888", fontSize: 13, margin: "4px 0 0" }}>단계별 업체 현황 · <span style={{ color: "#4338CA", fontWeight: 600 }}>카드를 드래그해서 단계 변경</span></p>
        </div>
        <select value={filterAssignee} onChange={e => setFilterAssignee(e.target.value)}
          style={{ padding: "7px 12px", border: "1px solid #E8E5E0", borderRadius: 7, fontSize: 13, background: "#fff", cursor: "pointer" }}>
          {assignees.map(a => <option key={a}>{a}</option>)}
        </select>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 8, alignItems: "start" }}>
        {STAGES.map((stage, si) => {
          const c = STAGE_COLORS[stage];
          const items = filtered.filter(co => co.stage === stage);
          // 평균 체류 일수 계산
          var avgStay = 0;
          if (items.length > 0) {
            var totalStay = items.reduce(function(s, co) { return s + (co.stagnant_days || 0); }, 0);
            avgStay = Math.round(totalStay / items.length);
          }
          // 다음 단계로의 전환율 (단순화: 현재 단계 + 이후 단계 / 전체)
          var nextStages = STAGES.slice(si + 1);
          var afterCount = filtered.filter(function(co) { return nextStages.includes(co.stage); }).length;
          var conversionPct = items.length + afterCount > 0 ? Math.round(afterCount / (items.length + afterCount) * 100) : 0;
          var isDropTarget = dragOverStage === stage && draggingFrom !== stage;
          return (
            <div key={stage}
              onDragOver={function(e) { handleDragOver(e, stage); }}
              onDragLeave={function() { handleDragLeave(stage); }}
              onDrop={function(e) { handleDrop(e, stage); }}
              style={{ background: "#fff", borderRadius: 14, border: isDropTarget ? "2px dashed #4338CA" : "1px solid #E8E5E0", overflow: "hidden", boxShadow: isDropTarget ? "0 0 0 3px rgba(67,56,202,0.1)" : "0 1px 4px rgba(0,0,0,0.04)", transition: "border 0.15s, box-shadow 0.15s" }}>
              <div style={{ background: c.bg, borderBottom: `2px solid ${c.border}`, padding: "12px 14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: c.text, letterSpacing: "0.06em" }}>STEP {si+1}</span>
                  <span style={{ fontSize: 12, fontWeight: 800, background: c.text, color: "#fff", borderRadius: 99, padding: "1px 8px" }}>{items.length}</span>
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, color: c.text, lineHeight: 1.3, marginBottom: 6 }}>{stage}</div>
                <div style={{ display: "flex", gap: 6, fontSize: 9, fontWeight: 600 }}>
                  {avgStay > 0 && <span style={{ color: c.text, opacity: 0.8 }}>평균 {avgStay}일</span>}
                  {si < STAGES.length - 1 && conversionPct > 0 && <span style={{ color: c.text, opacity: 0.8 }}>↗ {conversionPct}%</span>}
                </div>
              </div>
              <div style={{ padding: "8px", display: "flex", flexDirection: "column", gap: 6, height: "calc(100vh - 280px)", overflowY: "auto", minHeight: 400 }}>
                {items.map(co => {
                  const docPct = docRate(co.documents);
                  var isSelected = selectedId === co.id;
                  var isDragging = draggingId === co.id;
                  return (
                    <div key={co.id}
                      draggable={true}
                      onDragStart={function(e) { handleDragStart(e, co); }}
                      onDragEnd={handleDragEnd}
                      onClick={function(e) {
                        // 드래그 직후 onClick 무시
                        if (draggingId === co.id) return;
                        setSelectedId(co.id);
                        onSelect(co);
                      }}
                      style={{
                        background: isSelected ? "#EEF2FF" : (co.stagnant_days >= 7 ? "#FEF2F2" : "#F7F6F3"),
                        borderRadius: 10, padding: "10px 12px", cursor: isDragging ? "grabbing" : "grab",
                        border: isSelected ? "2px solid #4338CA" : (co.stagnant_days >= 7 ? "1px solid #FECACA" : "1px solid transparent"),
                        opacity: isDragging ? 0.4 : 1,
                        transform: isDragging ? "scale(0.96)" : "scale(1)",
                        transition: "opacity 0.15s, transform 0.15s, border 0.15s, background 0.15s",
                        userSelect: "none",
                      }}
                      onMouseEnter={e => { if (!isSelected && !isDragging) e.currentTarget.style.background = co.stagnant_days >= 7 ? "#FEE2E2" : "#EDEDE9"; }}
                      onMouseLeave={e => { if (!isSelected && !isDragging) e.currentTarget.style.background = co.stagnant_days >= 7 ? "#FEF2F2" : "#F7F6F3"; }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "#1A1917", lineHeight: 1.3 }}>{co.name}</span>
                        {co.stagnant_days >= 7 && <span style={{ fontSize: 9, color: "#DC2626", fontWeight: 800, background: "#FEE2E2", padding: "2px 5px", borderRadius: 4, flexShrink: 0, marginLeft: 4 }}>⚠{co.stagnant_days}일</span>}
                      </div>
                      <div style={{ display: "flex", gap: 5, marginBottom: 6 }}>
                        <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 99, background: co.type === "법인" ? "#EEF2FF" : "#F0FDF4", color: co.type === "법인" ? "#4338CA" : "#15803D", fontWeight: 600 }}>{co.type}</span>
                        <span style={{ fontSize: 10, color: "#888" }}>{co.assignee}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div style={{ flex: 1, height: 3, background: "#E8E5E0", borderRadius: 99 }}>
                          <div style={{ height: 3, background: docPct === 100 ? "#15803D" : c.text, borderRadius: 99, width: docPct + "%", transition: "width 0.3s" }} />
                        </div>
                        <span style={{ fontSize: 9, color: "#AAA", flexShrink: 0 }}>서류 {docPct}%</span>
                      </div>
                    </div>
                  );
                })}
                {items.length === 0 && <div style={{ fontSize: 12, color: "#DDD", textAlign: "center", padding: "24px 0" }}>{isDropTarget ? "여기에 놓으세요" : "없음"}</div>}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

// ── 기업 목록 ─────────────────────────────────────────────────────────────────

// ============================================================
// 📋 내 할일 화면 - work_notes content에서 체크박스 파싱
// ============================================================
function MyTodoView({ currentUser, isAdmin, onSelectCompany, setView, companies }) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState(isAdmin ? "all" : "mine"); // "mine" | "all"
  const [filterAssignee, setFilterAssignee] = useState("");

  useEffect(function() {
    fetchNotes();
  }, [viewMode, filterAssignee, currentUser]);

  async function fetchNotes() {
    setLoading(true);
    var query = supabase.from("work_notes").select("*").is("deleted_at", null);
    
    if (viewMode === "mine" && currentUser) {
      query = query.eq("assignee", currentUser);
    } else if (viewMode === "all" && filterAssignee) {
      query = query.eq("assignee", filterAssignee);
    }
    
    var res = await query.order("due_date", { ascending: true, nullsFirst: false });
    if (!res.error) setNotes(res.data || []);
    setLoading(false);
  }

  // 노트 content에서 체크박스 항목들 파싱 (각 항목별 마감일도 추출)
  function parseCheckboxes(noteContent) {
    if (!noteContent) return [];
    var lines = noteContent.split("\n");
    var items = [];
    lines.forEach(function(line, idx) {
      // - [ ] 또는 - [x] 패턴 매칭
      var match = line.match(/^(\s*)- \[([ x])\]\s*(.*)$/i);
      if (match) {
        var textFull = match[3].trim();
        var itemDueDate = null;
        var displayText = textFull;
        
        // 마감일 추출: [MM/DD] 또는 [YYYY-MM-DD] 또는 → MM/DD
        // 우선순위: 대괄호 > 화살표
        var bracketMatch = textFull.match(/\[(\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2})\]/);
        var arrowMatch = !bracketMatch && textFull.match(/→\s*(\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2})\s*$/);
        var dateStr = bracketMatch ? bracketMatch[1] : (arrowMatch ? arrowMatch[1] : null);
        
        if (dateStr) {
          // YYYY-MM-DD 또는 MM/DD를 YYYY-MM-DD로 변환
          if (dateStr.indexOf("-") >= 0) {
            itemDueDate = dateStr;
          } else {
            var parts = dateStr.split("/");
            var year = new Date().getFullYear();
            var mm = parts[0].padStart(2, "0");
            var dd = parts[1].padStart(2, "0");
            itemDueDate = year + "-" + mm + "-" + dd;
            // 과거 날짜면 내년으로 (예: 12월에 1/5 = 다음해 1/5)
            if (itemDueDate < kstDate(-180)) {
              itemDueDate = (year + 1) + "-" + mm + "-" + dd;
            }
          }
          // 표시 텍스트에서 날짜 부분 제거
          displayText = textFull.replace(/\[\d{4}-\d{2}-\d{2}\]|\[\d{1,2}\/\d{1,2}\]/, "").replace(/→\s*\d{4}-\d{2}-\d{2}\s*$|→\s*\d{1,2}\/\d{1,2}\s*$/, "").trim();
        }
        
        items.push({
          lineIdx: idx,
          checked: match[2].toLowerCase() === "x",
          text: displayText,
          itemDueDate: itemDueDate,
          rawLine: line
        });
      }
    });
    return items;
  }

  // 체크박스 토글 - content 텍스트 직접 수정
  async function toggleCheckbox(noteId, lineIdx, currentChecked) {
    var note = notes.find(function(n) { return n.id === noteId; });
    if (!note || !note.content) return;
    
    var lines = note.content.split("\n");
    var oldLine = lines[lineIdx];
    var newLine;
    
    if (currentChecked) {
      // [x] -> [ ]
      newLine = oldLine.replace(/- \[x\]/i, "- [ ]");
    } else {
      // [ ] -> [x]
      newLine = oldLine.replace(/- \[ \]/i, "- [x]");
    }
    
    lines[lineIdx] = newLine;
    var newContent = lines.join("\n");
    
    // 낙관적 업데이트
    setNotes(function(prev) {
      return prev.map(function(n) {
        return n.id === noteId ? Object.assign({}, n, { content: newContent }) : n;
      });
    });
    
    // DB 저장
    var r = await supabase.from("work_notes")
      .update({ content: newContent, updated_at: new Date().toISOString() })
      .eq("id", noteId);
    
    if (r.error) {
      // 실패 시 원복
      setNotes(function(prev) {
        return prev.map(function(n) {
          return n.id === noteId ? Object.assign({}, n, { content: note.content }) : n;
        });
      });
      alert("저장 실패: " + r.error.message);
    }
  }

  // 모든 노트에서 체크박스 항목들 추출 + 메타데이터 결합
  // 항목별 마감일이 있으면 그걸 우선, 없으면 노트의 due_date 사용
  var allItems = [];
  notes.forEach(function(note) {
    var items = parseCheckboxes(note.content);
    items.forEach(function(item) {
      if (item.text) { // 빈 항목 제외
        allItems.push({
          noteId: note.id,
          noteTitle: note.title || "(제목 없음)",
          assignee: note.assignee,
          taggedCompany: note.tagged_company,
          dueDate: item.itemDueDate || note.due_date,  // 항목별 우선
          itemDueDate: item.itemDueDate,                // 항목별 마감일 표시용
          checked: item.checked,
          text: item.text,
          lineIdx: item.lineIdx
        });
      }
    });
  });

  // 카테고리별 분류
  var today = kstDate();
  var tomorrow = kstDate(1);
  var weekEnd = kstDate(7);

  var unchecked = allItems.filter(function(i) { return !i.checked; });
  var checked = allItems.filter(function(i) { return i.checked; });
  
  var overdue = unchecked.filter(function(i) { return i.dueDate && i.dueDate < today; });
  var todayItems = unchecked.filter(function(i) { return i.dueDate === today; });
  var tomorrowItems = unchecked.filter(function(i) { return i.dueDate === tomorrow; });
  var thisWeek = unchecked.filter(function(i) { return i.dueDate && i.dueDate > tomorrow && i.dueDate <= weekEnd; });
  var noDue = unchecked.filter(function(i) { return !i.dueDate; });
  var later = unchecked.filter(function(i) { return i.dueDate && i.dueDate > weekEnd; });

  // 📅 기업목록 차기 업무(next_action)에서 날짜가 적힌 건들을 모아 마감일순 정렬
  var actionTodos = (companies || []).filter(function(c) {
    if (!c.next_action || nearestActionDate(c.next_action) === null) return false;
    var names = (c.assignee || "").split(",").map(function(s) { return s.trim(); });
    if (viewMode === "mine" && currentUser) return names.includes(currentUser);
    if (filterAssignee) return names.includes(filterAssignee);
    return true;
  }).map(function(c) {
    var dt = nearestActionDate(c.next_action);
    return { c: c, date: dt, days: daysUntil(dt) };
  }).sort(function(a, b) { return a.date - b.date; });

  // 카테고리 렌더 헬퍼
  function renderSection(title, items, color, bgColor, icon) {
    if (items.length === 0) return null;
    return (
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, padding: "6px 12px", background: bgColor, borderRadius: 8, borderLeft: "3px solid " + color }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: color }}>{icon} {title}</span>
          <span style={{ fontSize: 11, color: color, opacity: 0.8 }}>({items.length}건)</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {items.map(function(item, idx) {
            var daysOverdue = item.dueDate ? Math.floor((new Date(today) - new Date(item.dueDate)) / 86400000) : 0;
            return (
              <div key={item.noteId + "_" + item.lineIdx + "_" + idx}
                style={{ display: "flex", alignItems: "center", gap: 10, background: "#fff", padding: "8px 12px", borderRadius: 6, border: "1px solid #F0EDE8" }}>
                <input type="checkbox" checked={item.checked}
                  onChange={function() { toggleCheckbox(item.noteId, item.lineIdx, item.checked); }}
                  style={{ margin: 0, width: 16, height: 16, cursor: "pointer", flexShrink: 0 }} />
                {item.taggedCompany && (
                  <span style={{ background: "#EEF2FF", color: "#4338CA", padding: "2px 7px", borderRadius: 4, fontSize: 10, fontWeight: 600, flexShrink: 0, cursor: "pointer" }}
                    onClick={function() { onSelectCompany && onSelectCompany({ name: item.taggedCompany }); }}>
                    {item.taggedCompany}
                  </span>
                )}
                <span style={{ fontSize: 12, color: "#333", flex: 1, lineHeight: 1.5 }}>{item.text}</span>
                {isAdmin && viewMode === "all" && item.assignee && (
                  <span style={{ background: "#F5F3FF", color: "#6D28D9", padding: "1px 6px", borderRadius: 4, fontSize: 10, flexShrink: 0 }}>
                    {item.assignee}
                  </span>
                )}
                {daysOverdue > 0 && (
                  <span style={{ color: "#DC2626", fontSize: 10, fontWeight: 600, flexShrink: 0 }}>
                    {daysOverdue}일 지남
                  </span>
                )}
                {item.dueDate && daysOverdue <= 0 && (
                  <span style={{ color: item.itemDueDate ? "#4338CA" : "#888", fontSize: 10, flexShrink: 0, fontWeight: item.itemDueDate ? 600 : 400 }} title={item.itemDueDate ? "이 항목의 개별 마감일" : "노트 마감일"}>
                    {item.itemDueDate ? "📅 " : ""}{item.dueDate.slice(5)}
                  </span>
                )}
                <button onClick={function() { setView && setView("worknotes"); }}
                  style={{ background: "none", border: "none", color: "#888", fontSize: 11, cursor: "pointer", padding: "2px 4px", flexShrink: 0 }}
                  title="원본 노트로 이동">
                  📝
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (loading) {
    return <div style={{ padding: 40, textAlign: "center", color: "#888" }}>불러오는 중...</div>;
  }

  return (
    <div style={{ padding: "24px 32px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.03em", margin: 0 }}>
            내 할일 {currentUser && <span style={{ fontSize: 14, color: "#888", fontWeight: 400 }}>· {currentUser}</span>}
          </h1>
          <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>
            완료 {checked.length}건 / 미완료 {unchecked.length}건
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {isAdmin && (
            <>
              <button onClick={function() { setViewMode("mine"); setFilterAssignee(""); }}
                style={{ padding: "6px 12px", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer",
                  background: viewMode === "mine" ? "#1A1917" : "#fff",
                  color: viewMode === "mine" ? "#fff" : "#666",
                  border: viewMode === "mine" ? "none" : "1px solid #E8E5E0" }}>
                내 것만
              </button>
              <button onClick={function() { setViewMode("all"); }}
                style={{ padding: "6px 12px", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer",
                  background: viewMode === "all" ? "#1A1917" : "#fff",
                  color: viewMode === "all" ? "#fff" : "#666",
                  border: viewMode === "all" ? "none" : "1px solid #E8E5E0" }}>
                전체 보기
              </button>
              {viewMode === "all" && (
                <select value={filterAssignee} onChange={function(e) { setFilterAssignee(e.target.value); }}
                  style={{ padding: "6px 10px", borderRadius: 6, fontSize: 12, border: "1px solid #E8E5E0", outline: "none" }}>
                  <option value="">모든 담당자</option>
                  {["미현","유진","관호","지혜","현애","인선","동일","양호","정원"].map(function(a) {
                    return <option key={a} value={a}>{a}</option>;
                  })}
                </select>
              )}
            </>
          )}
        </div>
      </div>

      {/* 📅 기업목록 차기 업무 마감 (next_action에 날짜 적힌 건 자동 수집) */}
      {actionTodos.length > 0 && (
        <div style={{ marginBottom: 20, background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 12, padding: "14px 16px" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#92400E", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
            📅 기업목록 차기 업무 마감 <span style={{ fontSize: 11, fontWeight: 400, color: "#B45309" }}>({actionTodos.length}건 · 클릭하면 해당 업체로 이동)</span>
          </div>
          {actionTodos.map(function(t, i) {
            var dday = t.days;
            var ddayLabel = dday < 0 ? "D+" + Math.abs(dday) + " 지남" : dday === 0 ? "오늘" : "D-" + dday;
            var ddayColor = dday < 0 ? "#DC2626" : dday === 0 ? "#4338CA" : dday <= 3 ? "#B45309" : "#888";
            var ddayBg = dday < 0 ? "#FEE2E2" : dday === 0 ? "#EEF2FF" : dday <= 3 ? "#FEF3C7" : "#F3F4F6";
            var firstLine = (t.c.next_action || "").split("\n").map(function(s) { return s.trim(); }).filter(Boolean)[0] || "";
            return (
              <div key={t.c.id + "_" + i} onClick={function() { onSelectCompany && onSelectCompany(t.c); }}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 8, cursor: "pointer", background: "#fff", marginBottom: 6, border: "1px solid #FEF3C7" }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: ddayColor, background: ddayBg, padding: "3px 8px", borderRadius: 99, whiteSpace: "nowrap", flexShrink: 0 }}>{ddayLabel}</span>
                <span style={{ fontSize: 12, color: "#888", whiteSpace: "nowrap", flexShrink: 0 }}>{(t.date.getMonth() + 1) + "/" + t.date.getDate()}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#1A1917", whiteSpace: "nowrap", flexShrink: 0 }}>{t.c.name}</span>
                <span style={{ fontSize: 12, color: "#666", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{firstLine}</span>
                {t.c.assignee && <span style={{ fontSize: 10, color: "#999", whiteSpace: "nowrap", flexShrink: 0, marginLeft: "auto" }}>{t.c.assignee}</span>}
              </div>
            );
          })}
        </div>
      )}

      {allItems.length === 0 && actionTodos.length === 0 && (
        <div style={{ background: "#F7F6F3", borderRadius: 12, padding: 40, textAlign: "center", color: "#888" }}>
          <div style={{ fontSize: 30, marginBottom: 12 }}>📝</div>
          <div style={{ fontSize: 14, marginBottom: 6 }}>할일이 없어요!</div>
          <div style={{ fontSize: 11 }}>업무 노트에 체크박스 형태로 할일을 적어주세요.</div>
          <button onClick={function() { setView && setView("worknotes"); }}
            style={{ marginTop: 16, padding: "8px 16px", background: "#1A1917", color: "#fff", border: "none", borderRadius: 6, fontSize: 12, cursor: "pointer" }}>
            업무 노트로 이동
          </button>
        </div>
      )}

      {renderSection("기한 지남", overdue, "#DC2626", "#FEF2F2", "⏰")}
      {renderSection("오늘", todayItems, "#4338CA", "#EEF2FF", "📅")}
      {renderSection("내일", tomorrowItems, "#7C3AED", "#F5F3FF", "📆")}
      {renderSection("이번 주", thisWeek, "#0F6E56", "#E1F5EE", "🗓️")}
      {renderSection("기한 없음", noDue, "#888", "#F7F6F3", "📥")}
      {renderSection("나중에", later, "#999", "#F7F6F3", "🔮")}
      
      {checked.length > 0 && (
        <details style={{ marginTop: 24 }}>
          <summary style={{ cursor: "pointer", fontSize: 12, color: "#888", padding: "8px 12px", background: "#F7F6F3", borderRadius: 8 }}>
            ✓ 완료한 일 {checked.length}건 보기
          </summary>
          <div style={{ marginTop: 8 }}>
            {renderSection("", checked.slice(0, 50), "#9CA3AF", "#F7F6F3", "✓")}
          </div>
        </details>
      )}
    </div>
  );
}


// 📋 대시보드용 내 할일 미니 위젯
function MyTodoWidget({ setView }) {
  const [count, setCount] = useState({ total: 0, overdue: 0, today: 0 });
  
  useEffect(function() {
    async function load() {
      var res = await supabase.from("work_notes")
        .select("content, due_date")
        .is("deleted_at", null);
      if (res.error || !res.data) return;
      
      var today = kstDate();
      var total = 0, overdue = 0, todayCount = 0;
      
      res.data.forEach(function(note) {
        if (!note.content) return;
        var lines = note.content.split("\n");
        lines.forEach(function(line) {
          var match = line.match(/^\s*- \[ \]\s*(.+)/);
          if (match && match[1].trim()) {
            total++;
            if (note.due_date) {
              if (note.due_date < today) overdue++;
              else if (note.due_date === today) todayCount++;
            }
          }
        });
      });
      
      setCount({ total: total, overdue: overdue, today: todayCount });
    }
    load();
  }, []);
  
  // 항상 표시 (할일 없어도 안내 표시)
  
  return (
    <div onClick={function() { setView("mytodo"); }}
      style={{ background: "linear-gradient(135deg, #4338CA 0%, #6366F1 100%)", borderRadius: 10, padding: "14px 16px", cursor: "pointer", color: "#fff", boxShadow: "0 2px 8px rgba(67, 56, 202, 0.2)" }}>
      <div style={{ fontSize: 10, fontWeight: 700, marginBottom: 4, opacity: 0.9 }}>📋 내 할일</div>
      <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>{count.total > 0 ? count.total + "건" : "할일 없음"}</div>
      <div style={{ fontSize: 10, opacity: 0.9 }}>
        {count.overdue > 0 && <span style={{ marginRight: 6 }}>⏰ 지남 {count.overdue}</span>}
        {count.today > 0 && <span>📅 오늘 {count.today}</span>}
        {count.total > 0 && count.overdue === 0 && count.today === 0 && <span>모두 진행 중</span>}
        {count.total === 0 && <span>업무 노트에서 추가하세요</span>}
      </div>
    </div>
  );
}

// ── 업종 셀 컴포넌트 (인라인 편집 + 자동완성 드롭다운) ──────────────────────
function IndustryCell({ co, setCompanies, companies }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState("");
  const ref = useRef(null);

  // 기본 옵션 + 다른 기업이 사용 중인 업종을 통합
  var mergedOptions = useMemo(function() { return getMergedIndustryOptions(companies); }, [companies]);

  // industry는 "제조업, 도소매업" 같은 쉼표 구분 문자열
  var selectedList = (co.industry || "").split(",").map(function(s) { return s.trim(); }).filter(Boolean);

  useEffect(function() {
    if (!editing) return;
    function handleClick(e) { if (ref.current && !ref.current.contains(e.target)) { setEditing(false); setVal(""); } }
    document.addEventListener("mousedown", handleClick);
    return function() { document.removeEventListener("mousedown", handleClick); };
  }, [editing]);

  var saveList = async function(newList) {
    var industry = newList.length > 0 ? newList.join(", ") : null;
    var r = await supabase.from("companies").update({ industry: industry, updated_at: new Date().toISOString() }).eq("id", co.id);
    if (!r.error) {
      setCompanies && setCompanies(function(prev) { return prev.map(function(c) { return c.id === co.id ? Object.assign({}, c, { industry: industry }) : c; }); });
    }
  };

  var toggleItem = function(item) {
    var cur = selectedList.slice();
    var idx = cur.indexOf(item);
    if (idx >= 0) cur.splice(idx, 1);
    else cur.push(item);
    saveList(cur);
  };

  var addCustom = function() {
    var v = (val || "").trim();
    if (!v) return;
    if (selectedList.indexOf(v) >= 0) { setVal(""); return; }
    var cur = selectedList.slice();
    cur.push(v);
    saveList(cur);
    setVal("");
  };

  if (!editing) return (
    <span onClick={function() { setEditing(true); }}
      style={{ cursor: "pointer", padding: "2px 6px", borderRadius: 4, fontSize: 11, display: "inline-flex", alignItems: "center", gap: 3, color: selectedList.length > 0 ? "#4338CA" : "#CCC",
        background: selectedList.length > 0 ? "#EEF2FF" : "transparent", maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
      onMouseEnter={function(e) { e.currentTarget.style.background = "#EEF2FF"; }}
      onMouseLeave={function(e) { e.currentTarget.style.background = selectedList.length > 0 ? "#EEF2FF" : "transparent"; }}
      title={selectedList.join(", ")}>
      {selectedList.length > 0 ? selectedList.join(", ") : "+ 업종"}
    </span>
  );

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <div style={{ position: "absolute", top: 0, left: 0, zIndex: 999, background: "#fff", border: "1px solid #4338CA", borderRadius: 8, boxShadow: "0 4px 16px rgba(0,0,0,0.12)", minWidth: 260, padding: 10 }}>
        <div style={{ fontSize: 10, color: "#888", marginBottom: 6, fontWeight: 700 }}>업종 선택 (복수 가능)</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 8 }}>
          {mergedOptions.map(function(opt) {
            var sel = selectedList.indexOf(opt) >= 0;
            var isCustom = INDUSTRY_OPTIONS.indexOf(opt) < 0;
            return (
              <button key={opt} onClick={function() { toggleItem(opt); }}
                title={isCustom ? "다른 기업에서 사용 중인 업종" : ""}
                style={{ padding: "3px 9px", borderRadius: 99, fontSize: 10, fontWeight: sel ? 700 : 400,
                  background: sel ? "#4338CA" : (isCustom ? "#FEF3C7" : "#fff"), color: sel ? "#fff" : (isCustom ? "#92400E" : "#666"),
                  border: sel ? "none" : "1px solid " + (isCustom ? "#FDE68A" : "#E8E5E0"), cursor: "pointer" }}>
                {sel ? "✓ " : ""}{opt}
              </button>
            );
          })}
        </div>
        {/* 이 기업이 사용 중이지만 통합 옵션에 없는 항목 (예외적 케이스) */}
        {selectedList.filter(function(s) { return mergedOptions.indexOf(s) < 0; }).length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 8 }}>
            {selectedList.filter(function(s) { return mergedOptions.indexOf(s) < 0; }).map(function(s) {
              return (
                <span key={s} style={{ background: "#0F6E56", color: "#fff", padding: "3px 9px", borderRadius: 99, fontSize: 10, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 4 }}>
                  ✓ {s}
                  <span onClick={function() { toggleItem(s); }} style={{ cursor: "pointer", fontSize: 11, opacity: 0.8 }}>✕</span>
                </span>
              );
            })}
          </div>
        )}
        <input value={val} placeholder="직접 입력 후 Enter (예: 부동산임대업)"
          onChange={function(e) { setVal(e.target.value); }}
          onKeyDown={function(e) { if (e.key === "Enter") { e.preventDefault(); addCustom(); } if (e.key === "Escape") { setEditing(false); setVal(""); } }}
          style={{ width: "100%", padding: "5px 8px", border: "1px solid #E8E5E0", borderRadius: 5, fontSize: 10, outline: "none", boxSizing: "border-box" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8, paddingTop: 6, borderTop: "1px solid #F0EDE8" }}>
          <span style={{ fontSize: 10, color: "#888" }}>{selectedList.length}개 선택됨</span>
          <button onClick={function() { setEditing(false); setVal(""); }} style={{ background: "#1A1917", color: "#fff", border: "none", borderRadius: 5, padding: "4px 12px", fontSize: 10, fontWeight: 700, cursor: "pointer" }}>완료</button>
        </div>
      </div>
    </div>
  );
}

function ListView({ filtered, companies, search, setSearch, filterStage, setFilterStage, filterAssignee, setFilterAssignee, filterType, setFilterType, filterAgency, setFilterAgency, filterTeam, setFilterTeam, creditFilter, setCreditFilter, creditMode, setCreditMode, assignees, onSelect, onAdd, setCompanies, showToast, dashboardFilter, setDashboardFilter, canExport }) {
  const [showCompanyTrash, setShowCompanyTrash] = useState(false);
  const [trashedCompanies, setTrashedCompanies] = useState([]);

  // 중복 사업장: 업체명 + 대표자명이 같으면 중복 (전체 기업 기준)
  const listDupKeys = useMemo(function() {
    var counts = {};
    (companies || []).forEach(function(c) {
      var bn = (c.name || "").trim();
      var rep = (c.representative || "").trim();
      if (!bn || !rep) return;
      counts[bn + "|" + rep] = (counts[bn + "|" + rep] || 0) + 1;
    });
    var dups = {};
    Object.keys(counts).forEach(function(k) { if (counts[k] >= 2) dups[k] = counts[k]; });
    return dups;
  }, [companies]);
  function isListDup(co) {
    var bn = (co.name || "").trim();
    var rep = (co.representative || "").trim();
    if (!bn || !rep) return 0;
    return listDupKeys[bn + "|" + rep] || 0;
  }

  // 컬럼 너비 수동 조절 (헤더 경계 드래그) - 브라우저(localStorage)에 자동 저장
  const DEFAULT_LIST_COL_WIDTHS = {
    "업체명": 130, "유형": 80, "지역": 90, "업종": 120, "대표자": 80, "담당": 60,
    "진행단계": 175, "중복": 56, "정체일수": 70, "신청기관": 150, "계약일": 90, "진행기관": 140,
    "23년~25년 매출": 160, "26년 상반기 매출": 120, "신용점수": 90, "기타": 140, "작업": 110
  };
  const [listColWidths, setListColWidths] = useState(function() {
    try {
      var saved = localStorage.getItem("listColWidths");
      return saved ? Object.assign({}, DEFAULT_LIST_COL_WIDTHS, JSON.parse(saved)) : DEFAULT_LIST_COL_WIDTHS;
    } catch (e) { return DEFAULT_LIST_COL_WIDTHS; }
  });
  var startListColResize = function(colKey, e) {
    e.stopPropagation();
    e.preventDefault();
    var startX = e.clientX;
    var startW = listColWidths[colKey] || 100;
    var onMove = function(ev) {
      var newW = Math.max(40, startW + (ev.clientX - startX));
      setListColWidths(function(prev) { var next = Object.assign({}, prev); next[colKey] = newW; return next; });
    };
    var onUp = function() {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      setListColWidths(function(prev) { try { localStorage.setItem("listColWidths", JSON.stringify(prev)); } catch (e) {} return prev; });
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  };

  // 기관별 현황(agency_cases) 자체 로드 → 업체명별 매핑 (기업목록 한 곳에서 신청기관 현황 표시)
  const [agencyByName, setAgencyByName] = useState({});
  useEffect(function() {
    supabase.from("agency_cases").select("business_name, agency_group, status, month, year").is("deleted_at", null).limit(10000).then(function(r) {
      if (!r.error && r.data) {
        var map = {};
        r.data.forEach(function(c) {
          if (!c.business_name) return;
          if (!map[c.business_name]) map[c.business_name] = [];
          map[c.business_name].push(c);
        });
        setAgencyByName(map);
      }
    });
  }, []);
  var AGENCY_SHORT = {
    "소상공인시장진흥공단": "소진공", "중소벤처기업진흥공단": "중진공", "신용보증기금": "신보", "농협신용보증기금": "농협신보",
    "기술보증기금": "기보", "신용보증재단": "재단", "구조혁신&사업전환": "구조혁신",
    "경정청구": "경정청구", "기타": "기타",
  };
  // 마스터 상태: 한 업체가 여러 기관에서 각각 다른 단계일 때 종합해 하나로 표시
  // (분류 기준은 모듈 상수 DONE_STATUSES / REJECT_STATUSES 사용)
  var masterStatus = function(businessName) {
    var cases = agencyByName[businessName] || [];
    if (cases.length === 0) return null; // 기관 케이스 없으면 기존 stage 사용
    var total = cases.length;
    var done = cases.filter(function(c) { return DONE_STATUSES.indexOf(c.status) >= 0; }).length;
    var reject = cases.filter(function(c) { return REJECT_STATUSES.indexOf(c.status) >= 0; }).length;
    var active = total - done - reject; // 진행중(접수·심사 등)
    if (done > 0 && done === total) return { label: "완료", bg: "#DCFCE7", text: "#15803D" };
    if (done > 0) return { label: "일부승인", bg: "#D1FAE5", text: "#047857" };
    if (active > 0) return { label: "진행중", bg: "#EDE9FE", text: "#6D28D9" };
    if (reject > 0 && reject === total) return { label: "부결", bg: "#FEE2E2", text: "#DC2626" };
    return { label: "진행중", bg: "#EDE9FE", text: "#6D28D9" };
  };
  var agencyStatusColor = function(status) {
    if (REJECT_STATUSES.indexOf(status) >= 0) return { bg: "#FEE2E2", text: "#DC2626" };
    if (DONE_STATUSES.indexOf(status) >= 0) return { bg: "#DCFCE7", text: "#15803D" };
    if (["시작 전"].indexOf(status) >= 0 || !status) return { bg: "#F3F4F6", text: "#9CA3AF" };
    return { bg: "#EEF2FF", text: "#4338CA" };
  };

  // "기타" 칸 인라인 편집
  const [editingEtcId, setEditingEtcId] = useState(null);
  const [editingEtcVal, setEditingEtcVal] = useState("");
  var saveEtc = async function(co) {
    var v = editingEtcVal;
    await supabase.from("companies").update({ next_action: v || null }).eq("id", co.id);
    setCompanies(function(prev) { return prev.map(function(c) { return c.id === co.id ? Object.assign({}, c, { next_action: v }) : c; }); });
    setEditingEtcId(null);
  };

  var fetchTrashedCompanies = async function() {
    var r = await supabase.from("companies").select("*").not("deleted_at", "is", null).order("deleted_at", { ascending: false });
    if (!r.error) setTrashedCompanies(r.data || []);
  };
  var restoreCompany = async function(id) {
    var r = await supabase.from("companies").update({ deleted_at: null }).eq("id", id);
    if (!r.error) {
      setTrashedCompanies(function(prev) { return prev.filter(function(c) { return c.id !== id; }); });
      if (setCompanies) setCompanies(function(prev) { return prev.map(function(c) { return c.id === id ? Object.assign({}, c, { deleted_at: null }) : c; }); });
    }
  };
  var permanentDeleteCompany = async function(id) {
    if (!window.confirm("영구 삭제합니다. 복구할 수 없습니다.")) return;
    var r = await supabase.from("companies").delete().eq("id", id);
    if (!r.error) setTrashedCompanies(function(prev) { return prev.filter(function(c) { return c.id !== id; }); });
  };
  var openTrash = function() { fetchTrashedCompanies(); setShowCompanyTrash(true); };
  const [editNameId, setEditNameId] = useState(null);
  const [editNameVal, setEditNameVal] = useState("");
  const [editRegionId, setEditRegionId] = useState(null);
  const [editRegionVal, setEditRegionVal] = useState("");

  const saveNameEdit = async function(id) {
    if (!editNameVal.trim()) { setEditNameId(null); return; }
    var newName = editNameVal.trim();
    var r = await supabase.from("companies").update({ name: newName }).eq("id", id);
    if (!r.error) {
      setCompanies(function(prev) { return prev.map(function(c) { return c.id === id ? Object.assign({}, c, { name: newName }) : c; }); });
      setEditNameId(null);
      if (showToast) showToast("업체명이 변경됐어요!");
    } else {
      alert("저장 실패: " + r.error.message);
    }
  };

  const saveRegionEdit = async function(id) {
    var newRegion = editRegionVal.trim() || null;
    var r = await supabase.from("companies").update({ region: newRegion }).eq("id", id);
    if (!r.error) {
      setCompanies(function(prev) { return prev.map(function(c) { return c.id === id ? Object.assign({}, c, { region: newRegion }) : c; }); });
      setEditRegionId(null);
      if (showToast) showToast("지역이 저장됐어요!");
    } else {
      alert("저장 실패: " + r.error.message);
    }
  };
  return (
    <>
      {dashboardFilter && (
        <div style={{ background: dashboardFilter.type === "overdue" ? "#FEF2F2" : dashboardFilter.type === "today" ? "#EEF2FF" : "#F5F3FF", border: "1px solid " + (dashboardFilter.type === "overdue" ? "#FECACA" : dashboardFilter.type === "today" ? "#C7D2FE" : "#DDD6FE"), borderRadius: 10, padding: "12px 16px", marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 16 }}>{dashboardFilter.type === "overdue" ? "⏰" : dashboardFilter.type === "today" ? "📅" : "📆"}</span>
            <div>
              <span style={{ fontSize: 13, fontWeight: 700, color: dashboardFilter.type === "overdue" ? "#DC2626" : dashboardFilter.type === "today" ? "#4338CA" : "#7C3AED" }}>
                {dashboardFilter.type === "overdue" ? "기한 지난 기업" : dashboardFilter.type === "today" ? "오늘 연락/계약 기업" : "내일 연락/계약 기업"} {dashboardFilter.items.length}건
              </span>
              <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>
                {dashboardFilter.items.map(function(c) { return c.name; }).join(", ")}
              </div>
            </div>
          </div>
          <button onClick={function() { setDashboardFilter && setDashboardFilter(null); }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "#888" }}>✕</button>
        </div>
      )}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.03em", margin: 0 }}>기업 목록 <span style={{ fontSize: 15, color: "#888", fontWeight: 400 }}>{filtered.length}개</span></h1>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onAdd} style={{ display: "flex", alignItems: "center", gap: 6, background: "#1A1917", color: "#F7F6F3", border: "none", borderRadius: 8, padding: "10px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            <Icon name="plus" size={15} color="#F7F6F3" /> 신규 등록
          </button>
          <ExportButton rows={companies} filenamePrefix="기업목록" label="내보내기" canExport={canExport} />
          <button onClick={openTrash} style={{ display: "flex", alignItems: "center", gap: 6, background: "#fff", color: "#888", border: "1px solid #E8E5E0", borderRadius: 8, padding: "8px 14px", fontSize: 12, cursor: "pointer" }}>
            🗑️ 휴지통{trashedCompanies.length > 0 ? " (" + trashedCompanies.length + ")" : ""}
          </button>
        </div>
      </div>
      <div style={{ background: "#fff", borderRadius: 10, padding: "12px 16px", border: "1px solid #E8E5E0", marginBottom: 14, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 160 }}>
          <div style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }}><Icon name="search" size={14} color="#AAA" /></div>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="업체명 · 대표자 · 지역 · 업종 검색"
            style={{ width: "100%", padding: "8px 10px 8px 32px", border: "1px solid #E8E5E0", borderRadius: 7, fontSize: 13, outline: "none", boxSizing: "border-box" }} />
        </div>
        {/* 신용점수 필터 (KCB 기준) */}
        <div style={{ display: "flex", alignItems: "center", gap: 4, border: "1px solid #E8E5E0", borderRadius: 7, padding: "3px 4px 3px 8px", background: creditFilter ? "#FEF3C7" : "#fff" }}>
          <span style={{ fontSize: 11, color: "#888", whiteSpace: "nowrap" }}>신용점수</span>
          <button onClick={function() { setCreditMode(creditMode === "below" ? "above" : "below"); }}
            title="이하/이상 전환"
            style={{ border: "none", background: "#1A1917", color: "#fff", borderRadius: 5, padding: "4px 7px", fontSize: 11, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
            {creditMode === "below" ? "미만" : "이상"}
          </button>
          <input value={creditFilter} onChange={e => setCreditFilter(e.target.value.replace(/[^0-9]/g, ""))} inputMode="numeric" placeholder="840"
            style={{ width: 52, padding: "6px 4px", border: "1px solid #E8E5E0", borderRadius: 5, fontSize: 13, outline: "none", textAlign: "center", boxSizing: "border-box" }} />
          {creditFilter && <button onClick={function() { setCreditFilter(""); }} style={{ border: "none", background: "transparent", color: "#999", cursor: "pointer", fontSize: 14, padding: "0 4px" }}>✕</button>}
        </div>
        {[
          { v: filterStage, set: setFilterStage, opts: ["전체", ...STAGES] },
          { v: filterAssignee, set: setFilterAssignee, opts: assignees },
          { v: filterType, set: setFilterType, opts: ["전체", "법인", "개인"] },
          { v: filterAgency, set: setFilterAgency, opts: AGENCY_FILTER_OPTS },
          { v: filterTeam, set: setFilterTeam, opts: TEAM_FILTER_OPTS },
        ].map(({ v, set, opts }, i) => (
          <select key={i} value={v} onChange={e => set(e.target.value)}
            style={{ padding: "8px 10px", border: "1px solid #E8E5E0", borderRadius: 7, fontSize: 13, background: "#fff", cursor: "pointer" }}>
            {opts.map(o => <option key={o}>{o}</option>)}
          </select>
        ))}
        {(search || filterStage !== "전체" || filterAssignee !== "전체" || filterType !== "전체" || filterAgency !== "전체" || filterTeam !== "전체") && (
          <button onClick={() => { setSearch(""); setFilterStage("전체"); setFilterAssignee([]); setFilterType("전체"); setFilterAgency("전체"); setFilterTeam("전체"); }}
            style={{ fontSize: 12, color: "#888", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>초기화</button>
        )}
      </div>
      <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #E8E5E0", overflow: "hidden" }}>
        <div style={{ overflowX: "auto", maxHeight: "calc(100vh - 220px)", overflowY: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1200, tableLayout: "fixed" }}>
          <thead>
            <tr style={{ background: "#F7F6F3", borderBottom: "1px solid #E8E5E0", position: "sticky", top: 0, zIndex: 2 }}>
              {["업체명","유형","지역","업종","대표자","담당","진행단계","중복","정체일수","신청기관","계약일","진행기관","23년~25년 매출","26년 상반기 매출","신용점수","기타","작업"].map(h => (
                <th key={h} style={Object.assign({ padding: "10px 8px", fontSize: 11, fontWeight: 600, color: "#888", textAlign: "left", letterSpacing: "0.03em", whiteSpace: "nowrap", background: "#F7F6F3", position: "relative", boxSizing: "border-box", width: listColWidths[h], minWidth: listColWidths[h], maxWidth: listColWidths[h] },
                  h === "업체명" ? { position: "sticky", left: 0, zIndex: 3, boxShadow: "2px 0 4px -2px rgba(0,0,0,0.08)" } : {}
                )}>{h}
                  <span onMouseDown={function(e) { startListColResize(h, e); }} onClick={function(e) { e.stopPropagation(); }}
                    title="드래그해서 열 너비 조절"
                    style={{ position: "absolute", right: 0, top: 0, height: "100%", width: 6, cursor: "col-resize", userSelect: "none", zIndex: 5 }} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((co, i) => {
              const sc = STAGE_COLORS[co.stage] || {};
              return (
                <tr key={co.id} onClick={() => editNameId !== co.id && editRegionId !== co.id && onSelect(co)}
                  style={{ borderBottom: "1px solid #F0EDE8", cursor: editNameId === co.id ? "default" : "pointer", background: i % 2 === 0 ? "#fff" : "#FAFAF8" }}
                  onMouseOver={e => { if (editNameId !== co.id) e.currentTarget.style.background = "#F0F0EC"; }}
                  onMouseOut={e => e.currentTarget.style.background = i % 2 === 0 ? "#fff" : "#FAFAF8"}>
                  <td style={{ padding: "11px 8px", fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", boxSizing: "border-box", position: "sticky", left: 0, background: i % 2 === 0 ? "#fff" : "#FAFAF8", zIndex: 1, boxShadow: "2px 0 4px -2px rgba(0,0,0,0.08)" }} onClick={e => e.stopPropagation()}>
                    {editNameId === co.id ? (
                      <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                        <input value={editNameVal} onChange={function(e) { var v = e.target.value; setEditNameVal(v); }} autoFocus
                          onKeyDown={e => { if (e.key === "Enter") saveNameEdit(co.id); if (e.key === "Escape") setEditNameId(null); }}
                          style={{ padding: "3px 7px", border: "1px solid #4338CA", borderRadius: 5, fontSize: 13, fontWeight: 600, outline: "none", width: 140 }} />
                        <button onClick={() => saveNameEdit(co.id)} style={{ background: "#1A1917", color: "#fff", border: "none", borderRadius: 4, padding: "2px 8px", fontSize: 11, cursor: "pointer", fontWeight: 600 }}>저장</button>
                        <button onClick={() => setEditNameId(null)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11, color: "#888" }}>취소</button>
                      </div>
                    ) : (
                      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" }}>{co.name}</span>
                        {(function() { var tm = teamOf(co); return <span title="팀 (저장값 우선 · 없으면 업체명 기준 자동)" style={{ flexShrink: 0, fontSize: 9, padding: "2px 6px", borderRadius: 99, fontWeight: 700, whiteSpace: "nowrap", background: tm === "법인팀" ? "#EEF2FF" : "#F0FDF4", color: tm === "법인팀" ? "#4338CA" : "#15803D" }}>{tm}</span>; })()}
                        {co.stagnant_days >= 7 && <span style={{ fontSize: 10, color: "#DC2626" }}>⚠</span>}
                        <button onClick={e => { e.stopPropagation(); setEditNameId(co.id); setEditNameVal(co.name); }}
                          style={{ background: "none", border: "none", cursor: "pointer", padding: 2, opacity: 0, transition: "opacity 0.15s" }}
                          onMouseEnter={e => e.currentTarget.style.opacity = 1}
                          onMouseLeave={e => e.currentTarget.style.opacity = 0}>
                          <Icon name="edit" size={12} color="#888" />
                        </button>
                      </div>
                    )}
                  </td>
                  <td style={{ padding: "11px 8px", whiteSpace: "nowrap" }}><span style={{ fontSize: 11, padding: "2px 7px", borderRadius: 99, background: co.type === "법인" ? "#EEF2FF" : "#F0FDF4", color: co.type === "법인" ? "#4338CA" : "#15803D", fontWeight: 600 }}>{co.type === "법인" ? "법인사업자" : "개인사업자"}</span></td>
                  <td style={{ padding: "11px 8px", fontSize: 12, color: "#555", whiteSpace: "nowrap", maxWidth: 90, overflow: "hidden", textOverflow: "ellipsis" }} onClick={e => e.stopPropagation()}>
                    {editRegionId === co.id ? (
                      <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                        <input value={editRegionVal} onChange={function(e) { var v = e.target.value; setEditRegionVal(v); }} autoFocus
                          onKeyDown={function(e) { if (e.key === "Enter") saveRegionEdit(co.id); if (e.key === "Escape") setEditRegionId(null); }}
                          placeholder="예: 서울 강남"
                          style={{ padding: "3px 7px", border: "1px solid #4338CA", borderRadius: 5, fontSize: 12, outline: "none", width: 90 }} />
                        <button onClick={function() { saveRegionEdit(co.id); }} style={{ background: "#1A1917", color: "#fff", border: "none", borderRadius: 4, padding: "2px 6px", fontSize: 10, cursor: "pointer", fontWeight: 600 }}>✓</button>
                        <button onClick={function() { setEditRegionId(null); }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 10, color: "#888" }}>✕</button>
                      </div>
                    ) : (
                      <span onClick={function(e) { e.stopPropagation(); setEditRegionId(co.id); setEditRegionVal(co.region || ""); }}
                        style={{ cursor: "pointer", padding: "2px 6px", borderRadius: 4, display: "inline-flex", alignItems: "center", gap: 3 }}
                        onMouseEnter={function(e) { e.currentTarget.style.background = "#EEF2FF"; }}
                        onMouseLeave={function(e) { e.currentTarget.style.background = "transparent"; }}>
                        {co.region ? (function() {
                          var rc = getRegionColor(co.region);
                          return <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 6, fontWeight: 600, background: rc.bg, color: rc.text, whiteSpace: "nowrap" }}>{co.region}</span>;
                        })() : <span style={{ color: "#888" }}>+ 입력</span>}
                        <Icon name="edit" size={10} color="#AAA" />
                      </span>
                    )}
                  </td>
                  <td style={{ padding: "6px 8px", fontSize: 12, color: "#555", whiteSpace: "nowrap", maxWidth: 120 }} onClick={function(e) { e.stopPropagation(); }}>
                    <IndustryCell co={co} setCompanies={setCompanies} companies={companies} />
                  </td>
                  <td style={{ padding: "11px 8px", fontSize: 12, color: "#555", whiteSpace: "nowrap", maxWidth: 70, overflow: "hidden", textOverflow: "ellipsis" }}>{co.representative || "-"}</td>
                  <td style={{ padding: "11px 13px", fontSize: 12, whiteSpace: "nowrap" }}>{co.assignee || "-"}</td>
                  <td style={{ padding: "11px 13px", whiteSpace: "nowrap" }}><span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 99, background: sc.bg, color: sc.text, border: `1px solid ${sc.border}`, fontWeight: 600 }}>{co.stage}</span>{(function(){ var ms = masterStatus(co.name); return ms ? <span style={{ display: "inline-block", marginLeft: 4, fontSize: 9, padding: "3px 7px", borderRadius: 99, background: ms.bg, color: ms.text, fontWeight: 700 }} title="여러 기관 종합 상태">{ms.label}</span> : null; })()}</td>
                  <td style={{ padding: "11px 13px", textAlign: "center" }}>{(function() { var cnt = isListDup(co); return cnt ? <span title={"같은 사업장이 총 " + cnt + "건 등록됨"} style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 99, background: "#FEE2E2", color: "#DC2626", whiteSpace: "nowrap" }}>중복</span> : null; })()}</td>
                  <td style={{ padding: "11px 13px", whiteSpace: "nowrap", textAlign: "center" }}>{(function() { var d = co.stagnant_days || 0; if (d >= 14) return <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 99, background: "#FEE2E2", color: "#DC2626", fontWeight: 700 }}>⚠ {d}일</span>; if (d >= 7) return <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 99, background: "#FEF3C7", color: "#B45309", fontWeight: 700 }}>{d}일</span>; return <span style={{ fontSize: 11, color: "#AAA" }}>{d}일</span>; })()}</td>
                  <td style={{ padding: "8px 8px", fontSize: 11, verticalAlign: "middle" }}>
                    {(function() {
                      var cs = agencyByName[co.name] || [];
                      var byGroup = {};
                      cs.forEach(function(c) {
                        var g = c.agency_group; if (!g) return;
                        var prev = byGroup[g];
                        if (!prev || (c.year * 12 + c.month) > (prev.year * 12 + prev.month)) byGroup[g] = c;
                      });
                      var groups = Object.keys(byGroup);
                      if (groups.length === 0) return <span style={{ color: "#888" }}>-</span>;
                      return <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
                        {groups.map(function(g) {
                          var c = byGroup[g];
                          var col = agencyStatusColor(c.status);
                          return <span key={g} title={g + " · " + (c.status || "시작 전") + " (" + c.month + "월)"}
                            style={{ fontSize: 10, padding: "2px 6px", borderRadius: 99, background: col.bg, color: col.text, fontWeight: 600, whiteSpace: "nowrap" }}>
                            {AGENCY_SHORT[g] || g}</span>;
                        })}
                      </div>;
                    })()}
                  </td>
                  <td style={{ padding: "11px 13px", fontSize: 12, color: "#555", whiteSpace: "nowrap" }}>{co.contract_date || "-"}</td>
                  <td style={{ padding: "11px 13px", fontSize: 11, color: "#555", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{co.agency || "-"}</td>
                  <td style={{ padding: "11px 13px", fontSize: 11, color: "#555", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", boxSizing: "border-box" }}>{[formatRevenue(co.revenue_2023), formatRevenue(co.revenue_2024), formatRevenue(co.revenue_2025)].filter(r=>r&&r!=="-").join(" / ") || "-"}</td>
                  <td style={{ padding: "11px 13px", fontSize: 11, color: "#555", whiteSpace: "nowrap" }}>{formatRevenue(co.revenue_2026_h1) || "-"}</td>
                  <td style={{ padding: "11px 13px", fontSize: 11, color: "#555", whiteSpace: "nowrap" }}>{(co.credit_score_kcb || co.credit_score_nice) ? ((co.credit_score_kcb || "-") + " / " + (co.credit_score_nice || "-")) : "-"}</td>
                  <td style={{ padding: "11px 13px", fontSize: 11, color: "#555", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                    onClick={function(e) { e.stopPropagation(); }}
                    onDoubleClick={function() { setEditingEtcId(co.id); setEditingEtcVal(co.next_action || ""); }}
                    title="더블클릭하면 수정">
                    {editingEtcId === co.id ? (
                      <input value={editingEtcVal} autoFocus
                        onChange={function(e) { setEditingEtcVal(e.target.value); }}
                        onBlur={function() { saveEtc(co); }}
                        onKeyDown={function(e) { if (e.key === "Enter") { e.target.blur(); } if (e.key === "Escape") { setEditingEtcId(null); } }}
                        style={{ width: "100%", padding: "3px 6px", border: "1px solid #4338CA", borderRadius: 4, fontSize: 11, boxSizing: "border-box", outline: "none" }} />
                    ) : (co.next_action || "-")}
                  </td>
                  <td style={{ padding: "11px 8px", whiteSpace: "nowrap" }} onClick={function(e) { e.stopPropagation(); }}>
                    <div style={{ display: "flex", gap: 4, justifyContent: "center" }}>
                      <button onClick={function() { onSelect(co); }} title="소통/상세보기"
                        style={{ background: "#EEF2FF", border: "none", borderRadius: 4, padding: "3px 7px", fontSize: 11, cursor: "pointer", color: "#4338CA", fontWeight: 600 }}>💬</button>
                      <button onClick={function() { onSelect(co); }} title="수정"
                        style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
                        <Icon name="edit" size={14} color="#888" />
                      </button>
                      <button onClick={async function() {
                        if (!window.confirm("'" + co.name + "' 업체를 휴지통으로 이동할까요?")) return;
                        await supabase.from("companies").update({ deleted_at: new Date().toISOString() }).eq("id", co.id);
                        setCompanies(function(prev) { return prev.filter(function(c) { return c.id !== co.id; }); });
                        if (showToast) showToast("휴지통으로 이동됐어요!");
                      }} title="삭제(휴지통)"
                        style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
                        <Icon name="x" size={14} color="#CCC" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
        {filtered.length === 0 && <div style={{ padding: "40px", textAlign: "center", color: "#888", fontSize: 13 }}>검색 결과가 없어요</div>}
      </div>

      {/* 기업목록 휴지통 모달 */}
      {showCompanyTrash && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}
          onMouseDown={function(e) { if (e.target === e.currentTarget) setShowCompanyTrash(false); }}>
          <div style={{ background: "#fff", borderRadius: 14, width: 640, maxHeight: "80vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #E8E5E0", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, background: "#fff" }}>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>🗑️ 기업목록 휴지통 ({trashedCompanies.length}건)</h2>
              <button onClick={function() { setShowCompanyTrash(false); }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "#888" }}>✕</button>
            </div>
            <div style={{ padding: "16px 24px" }}>
              {trashedCompanies.length === 0 ? (
                <div style={{ padding: "40px 0", textAlign: "center", color: "#888", fontSize: 13 }}>휴지통이 비어 있습니다</div>
              ) : (
                trashedCompanies.map(function(co) {
                  var deletedAt = co.deleted_at ? new Date(co.deleted_at).toLocaleDateString("ko-KR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "";
                  return (
                    <div key={co.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid #F0EDE8" }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{co.name}</div>
                        <div style={{ fontSize: 11, color: "#AAA", marginTop: 2 }}>삭제일: {deletedAt} · {co.assignee || "-"}</div>
                      </div>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={function() { restoreCompany(co.id); }} style={{ background: "#EEF2FF", color: "#4338CA", border: "none", borderRadius: 6, padding: "5px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>복구</button>
                        <button onClick={function() { permanentDeleteCompany(co.id); }} style={{ background: "#FEE2E2", color: "#DC2626", border: "none", borderRadius: 6, padding: "5px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>영구삭제</button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── 정체 알림 ─────────────────────────────────────────────────────────────────
function StagnantView({ stagnant, onSelect }) {
  return (
    <>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.03em", margin: 0 }}>정체 업체 알림</h1>
        <p style={{ color: "#888", fontSize: 13, margin: "4px 0 0" }}>7일 이상 같은 단계에 머물러 있는 업체</p>
      </div>
      {stagnant.length === 0 ? (
        <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 12, padding: "40px", textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>✅</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: "#15803D" }}>모든 업체가 정상 진행 중이에요!</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {stagnant.sort((a, b) => b.stagnant_days - a.stagnant_days).map(co => {
            const sc = STAGE_COLORS[co.stage] || {};
            return (
              <div key={co.id} onClick={() => onSelect(co)}
                style={{ background: "#fff", border: "1px solid #FECACA", borderRadius: 12, padding: "18px 22px", cursor: "pointer", display: "flex", gap: 18, alignItems: "flex-start" }}>
                <div style={{ background: "#FEF2F2", borderRadius: 10, padding: "10px 14px", textAlign: "center", flexShrink: 0 }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: "#DC2626" }}>{co.stagnant_days}</div>
                  <div style={{ fontSize: 10, color: "#DC2626", fontWeight: 600 }}>일 정체</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                    <span style={{ fontSize: 16, fontWeight: 700 }}>{co.name}</span>
                    <span style={{ fontSize: 11, padding: "2px 7px", borderRadius: 99, background: sc.bg, color: sc.text, border: `1px solid ${sc.border}`, fontWeight: 600 }}>{co.stage}</span>
                    <span style={{ fontSize: 11, padding: "2px 7px", borderRadius: 99, background: co.type === "법인" ? "#EEF2FF" : "#F0FDF4", color: co.type === "법인" ? "#4338CA" : "#15803D", fontWeight: 600 }}>{co.type}</span>
                  </div>
                  <div style={{ fontSize: 12, color: "#666", marginBottom: 7 }}>담당: {co.assignee} · {co.agency}</div>
                  {co.issue && <div style={{ fontSize: 12, background: "#FFF7ED", border: "1px solid #FED7AA", borderRadius: 7, padding: "7px 11px", color: "#92400E", marginBottom: 5 }}><strong>이슈:</strong> {co.issue}</div>}
                  {co.next_action && <div style={{ fontSize: 12, fontWeight: 600 }}>→ {co.next_action}</div>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

// ── 팀원 관리 (관리자 전용) ───────────────────────────────────────────────────
function MembersView({ profiles, onRefresh, showToast }) {
  const updateRole = async (id, role) => {
    const { error } = await supabase.from("profiles").update({ role }).eq("id", id);
    if (error) { showToast("변경 실패: " + error.message, "error"); return; }
    showToast("권한이 변경됐어요");
    onRefresh();
  };
  const updateStatus = async (id, status) => {
    const { error } = await supabase.from("profiles").update({ status }).eq("id", id);
    if (error) { showToast("변경 실패: " + error.message, "error"); return; }
    showToast(status === "approved" ? "승인 완료" : status === "rejected" ? "거절 처리됨" : "변경됐어요");
    onRefresh();
  };

  const STATUS_META = {
    pending:  { label: "승인 대기", bg: "#FEF3C7", color: "#92400E" },
    approved: { label: "승인됨",   bg: "#DCFCE7", color: "#15803D" },
    rejected: { label: "거절됨",   bg: "#FEE2E2", color: "#DC2626" },
  };
  const pendingCount = profiles.filter(p => p.status === "pending").length;

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "0 0 22px" }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.03em", margin: 0 }}>팀원 관리</h1>
        {pendingCount > 0 && (
          <span style={{ fontSize: 12, fontWeight: 700, background: "#FEF3C7", color: "#92400E", borderRadius: 99, padding: "4px 11px" }}>
            승인 대기 {pendingCount}명
          </span>
        )}
      </div>
      <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #E8E5E0", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#F7F6F3", borderBottom: "1px solid #E8E5E0" }}>
              {["이름","소속팀","상태","권한","가입일","승인"].map(h => (
                <th key={h} style={{ padding: "11px 16px", fontSize: 11, fontWeight: 600, color: "#888", textAlign: "left" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {profiles.map(p => {
              const st = STATUS_META[p.status] || (p.status ? { label: p.status, bg: "#F0EDE8", color: "#888" } : null);
              return (
              <tr key={p.id} style={{ borderBottom: "1px solid #F0EDE8", background: p.status === "pending" ? "#FFFDF5" : "#fff" }}>
                <td style={{ padding: "13px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#1A1917", color: "#F7F6F3", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700 }}>{(p.name || "?")[0]}</div>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{p.name}</span>
                  </div>
                </td>
                <td style={{ padding: "13px 16px", fontSize: 13, color: "#555" }}>{p.team}</td>
                <td style={{ padding: "13px 16px" }}>
                  {st
                    ? <span style={{ fontSize: 11, fontWeight: 700, background: st.bg, color: st.color, borderRadius: 99, padding: "3px 10px" }}>{st.label}</span>
                    : <span style={{ fontSize: 11, color: "#888" }}>-</span>}
                </td>
                <td style={{ padding: "13px 16px" }}>
                  <select value={p.role} onChange={e => updateRole(p.id, e.target.value)}
                    style={{ padding: "5px 9px", border: "1px solid #E8E5E0", borderRadius: 6, fontSize: 12, background: "#fff", cursor: "pointer" }}>
                    <option value="member">팀원</option>
                    <option value="admin">관리자</option>
                  </select>
                </td>
                <td style={{ padding: "13px 16px", fontSize: 12, color: "#888" }}>{p.created_at?.slice(0,10)}</td>
                <td style={{ padding: "13px 16px" }}>
                  <div style={{ display: "flex", gap: 6 }}>
                    {p.status !== "approved" && (
                      <button onClick={() => updateStatus(p.id, "approved")}
                        style={{ background: "#DCFCE7", color: "#15803D", border: "none", borderRadius: 6, padding: "5px 11px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>승인</button>
                    )}
                    {p.status !== "rejected" && (
                      <button onClick={() => updateStatus(p.id, "rejected")}
                        style={{ background: "#FEF2F2", color: "#DC2626", border: "none", borderRadius: 6, padding: "5px 11px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>거절</button>
                    )}
                  </div>
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div style={{ marginTop: 16, background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 10, padding: "14px 18px", fontSize: 13, color: "#92400E" }}>
        💡 새 팀원 추가: 팀원에게 앱 주소를 공유하고 이메일로 회원가입하게 하세요. 가입하면 이 화면에 <b>승인 대기</b>로 나타나고, <b>승인</b> 버튼을 눌러야 로그인·데이터 접근이 가능해요.
      </div>
    </>
  );
}

// ── 기업 상세 모달 ─────────────────────────────────────────────────────────────
function CompanyModal({ company, onClose, onSave, onToggleDoc, currentUser, onAgencyRegistered, companies }) {
  const [tab, setTab] = useState("info");
  const [prevTab, setPrevTab] = useState("info");
  var goTab = function(id) { setPrevTab(tab); setTab(id); };
  const [data, setData] = useState({ ...company });
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(company.name || "");
  const [agencyCases, setAgencyCases] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [commLogs, setCommLogs] = useState([]);
  const [partnersList, setPartnersList] = useState([]);
  useEffect(function() {
    supabase.from("partners").select("id,name").order("created_at", { ascending: true }).then(function(r) {
      if (!r.error) setPartnersList(r.data || []);
    });
  }, []);
  const [commInput, setCommInput] = useState("");
  const [xlsxPreview, setXlsxPreview] = useState(null); // 기업현황표/시트지 첨부 미리보기 {updates, auto, commText, kind}
  const [xlsxCommDraft, setXlsxCommDraft] = useState(""); // 업로드 시 소통내역에 넣을 초안(수정 가능)
  const [kakaoLoading, setKakaoLoading] = useState(false); // 카톡 캡처 AI 요약 중
  const [infoSheetLoading, setInfoSheetLoading] = useState(false); // 정보시트 첨부 파싱 중
  async function handleKakaoImage(file) {
    if (!file || file.type.indexOf("image") !== 0) { alert("이미지 파일만 가능합니다."); return; }
    setKakaoLoading(true);
    try {
      var base64 = await new Promise(function(resolve, reject) {
        var reader = new FileReader();
        reader.onload = function() { resolve(String(reader.result).split(",")[1]); };
        reader.onerror = function() { reject(new Error("이미지 읽기 실패")); };
        reader.readAsDataURL(file);
      });
      var resp = await fetch("/api/summarize-kakao", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ imageBase64: base64, mediaType: file.type }),
      });
      var data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "요약 요청 실패");
      if (!data.summary) throw new Error("요약 내용이 비어 있습니다.");
      setCommInput(function(prev) { return prev && prev.trim() ? (prev.trimEnd() + "\n" + data.summary) : data.summary; });
    } catch (err) {
      alert("❌ 카톡 요약 실패: " + (err && err.message ? err.message : err) + "\n\n(API 키 설정 또는 네트워크를 확인해주세요)");
    } finally {
      setKakaoLoading(false);
    }
  }
  // 📋 스크립트 정보시트(xlsx) 첨부 → 소통 내역 입력창 자동 작성 (저장은 사용자가 직접)
  async function handleInfoSheetAttach(file) {
    if (!file) return;
    if (!/\.(xlsx|xls)$/i.test(file.name || "")) { alert("xlsx 파일만 첨부할 수 있습니다."); return; }
    setInfoSheetLoading(true);
    try {
      if (typeof window.XLSX === "undefined") {
        await new Promise(function(resolve, reject) {
          var script = document.createElement("script");
          script.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
          script.onload = resolve;
          script.onerror = function() { reject(new Error("SheetJS 라이브러리 로드 실패. 인터넷 연결을 확인해주세요.")); };
          document.head.appendChild(script);
        });
      }
      var XLSX = window.XLSX;
      var data = await file.arrayBuffer();
      var wb = XLSX.read(data, { type: "array", cellDates: true });
      var sheetName = wb.SheetNames.find(function(n) { return n.indexOf("스크립트 정보시트") >= 0; })
        || wb.SheetNames.find(function(n) { return n.indexOf("정보시트") >= 0; })
        || wb.SheetNames[0];
      var ws = wb.Sheets[sheetName];
      var rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });
      var norm = function(v) { return String(v == null ? "" : v).replace(/\s/g, ""); };
      var cellToStr = function(v) {
        if (v === null || v === undefined) return "";
        if (v instanceof Date) { return v.getFullYear() + "-" + String(v.getMonth() + 1).padStart(2, "0") + "-" + String(v.getDate()).padStart(2, "0"); }
        return String(v).trim();
      };
      // A열(0)=항목명, B열(1)=입력값. 항목명을 A열 텍스트와 매칭해 같은 행 B열 값을 읽음
      var getVal = function(keys) {
        for (var r = 0; r < rows.length; r++) {
          if (!rows[r]) continue;
          var rawA = rows[r][0] == null ? "" : String(rows[r][0]).trim();
          // 섹션 헤더·범례·사용법 행은 건너뜀 ("1.", "8." 시작 / "초록칸=" / "사용법:") → 짧은 키의 헤더 오매칭 방지
          if (/^\d+\s*\./.test(rawA) || rawA.indexOf("초록칸") === 0 || rawA.indexOf("사용법") === 0) continue;
          var a = norm(rawA);
          if (!a) continue;
          for (var k = 0; k < keys.length; k++) {
            var key = norm(keys[k]);
            // A열 셀이 항목 라벨과 같거나 라벨을 포함할 때만 매칭 (짧은 값의 역방향 오매칭 방지)
            if (key && key.length >= 2 && (a === key || a.indexOf(key) >= 0)) {
              var b = cellToStr(rows[r][1]);
              if (b) return b;
            }
          }
        }
        return "";
      };
      var SECTIONS = [
        { title: "1. 기본 정보", items: [
          ["기업체명", ["기업체명", "기업명", "업체명", "상호"]],
          ["대표자명/생년월일", ["대표자명/생년월일", "대표자명", "대표자"]],
          ["지역", ["지역", "소재지", "주소"]],
          ["업태/종목", ["업태/종목", "업태", "종목"]],
          ["설립일자/업력", ["설립일자/업력", "설립일자", "설립일", "업력"]],
          ["상시근로자", ["상시근로자", "상시근로자수", "근로자수", "직원수"]],
          ["주요 취급품목", ["주요취급품목", "취급품목", "주요품목", "주요제품"]],
        ] },
        { title: "2. 신청 정보", items: [
          ["신청 희망 기관", ["신청희망기관", "희망기관", "신청기관"]],
          ["신청 희망 금액", ["신청희망금액", "희망금액", "신청금액"]],
          ["자금 사용 용도", ["자금사용용도", "사용용도", "자금용도"]],
        ] },
        { title: "3. 재무 핵심", items: [
          ["부채총계", ["부채총계"]],
          ["자본총계", ["자본총계"]],
          ["부채비율", ["부채비율"]],
          ["영업이익", ["영업이익"]],
          ["이자비용", ["이자비용"]],
          ["이자보상배율", ["이자보상배율"]],
        ] },
        { title: "4. 매출 추이", items: [
          // 실제 양식은 3개 연도를 한 셀에 합쳐둠("2023 / 2024 / 2025년 매출"). 분리 양식도 대비해 개별 연도 키 포함
          ["2023/2024/2025년 매출", ["2023/2024/2025년매출", "2023/2024/2025매출", "2025년매출", "2024년매출", "2023년매출", "연도별매출"]],
          ["26년 상반기 매출", ["26년상반기매출", "2026년상반기매출", "상반기매출"]],
          ["올해 예상 매출", ["올해예상매출", "예상매출", "금년예상매출"]],
        ] },
        { title: "5. 강점 요소", items: [
          ["수출 실적", ["수출실적", "수출"]],
          ["기업 인증", ["기업인증", "인증"]],
          ["연구소/전담부서", ["연구소/전담부서", "연구소", "전담부서", "기업부설연구소"]],
          ["특허·상표·디자인", ["특허·상표·디자인", "특허상표디자인", "특허", "지식재산권", "산업재산권"]],
          ["주요 거래처", ["주요거래처", "거래처"]],
        ] },
        { title: "6. 신용 관련", items: [
          ["대표자 신용 KCB/NICE", ["대표자신용KCB/NICE", "대표자신용", "신용점수", "KCB/NICE", "신용등급"]],
          ["세금·4대보험·금융 연체", ["세금·4대보험·금융연체", "세금4대보험금융연체", "연체", "세금체납"]],
          ["폐업 이력", ["폐업이력", "폐업"]],
        ] },
        { title: "7. 기대출 현황", items: [
          ["기존 대출", ["기존대출", "현재대출"]],
          ["2026년 신규 융자", ["2026년신규융자", "신규융자", "26년신규융자"]],
          ["카드론·현금서비스", ["카드론·현금서비스", "카드론현금서비스", "카드론", "현금서비스"]],
        ] },
        { title: "8. 대표자만 아는 것", items: [
          ["가장 불리한 약점", ["가장불리한약점", "약점", "불리한점"]],
          ["최근 호재·특이사항", ["최근호재·특이사항", "최근호재특이사항", "호재", "특이사항"]],
        ] },
      ];
      var d = new Date();
      var dateStr = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
      var lines = [];
      lines.push("📋 정보시트 접수 (" + dateStr + ")");
      lines.push("━━━━━━━━━━━━━━━━━━");
      SECTIONS.forEach(function(sec) {
        lines.push("[" + sec.title + "]");
        sec.items.forEach(function(it) {
          var v = getVal(it[1]);
          lines.push("- " + it[0] + ": " + (v ? v : "미입력"));
        });
        lines.push("");
      });
      var block = lines.join("\n").replace(/\n+$/, "");
      setCommInput(function(prev) { return prev && prev.trim() ? (prev.trimEnd() + "\n\n" + block) : block; });
    } catch (err) {
      alert("❌ 정보시트 첨부 실패: " + (err && err.message ? err.message : err));
    } finally {
      setInfoSheetLoading(false);
    }
  }

  const FIELD_LABELS_X = { name: "업체명", representative: "대표자", phone: "연락처", region: "지역", industry: "업종", employee_count: "직원수", credit_score_kcb: "KCB점수", credit_score_nice: "NICE점수", founded_year: "설립연도", founded_month: "설립월", revenue_2025: "2025년 매출", revenue_2024: "2024년 매출", revenue_2023: "2023년 매출", revenue_2026_h1: "2026년 상반기 매출", business_number: "사업자번호", business_type: "사업자유형", type: "유형" };
  async function handleXlsxAttach(file) {
    if (!file) return;
    try {
      var res = await parseUploadedSheet(file);
      setXlsxCommDraft(res.commText || "");
      setXlsxPreview(res);
    }
    catch (err) { alert("❌ 엑셀 읽기 실패: " + err.message + "\n\n엑셀(.xlsx) 파일이 맞는지 확인해주세요."); }
  }
  async function applyXlsxPreview() {
    if (!xlsxPreview) return;
    var u = xlsxPreview.updates;
    setData(function(p) {
      var merged = Object.assign({}, p);
      Object.keys(u).forEach(function(k) {
        if (k === "company_info") {
          var ex = Array.isArray(p.company_info) ? p.company_info.slice() : [];
          var idx = {}; ex.forEach(function(it, i) { idx[it.label] = i; });
          u.company_info.forEach(function(ni) { if (idx[ni.label] !== undefined) ex[idx[ni.label]] = ni; else ex.push(ni); });
          merged.company_info = ex;
        } else if (k === "loans") { merged.loans = u.loans; }
        else { merged[k] = u[k]; }
      });
      return merged;
    });
    // 소통내역 자동 저장(사용자가 초안을 비우면 건너뜀). 즉시 DB 반영 + 목록 새로고침
    var commSaved = false;
    var draft = (xlsxCommDraft || "").trim();
    if (draft) {
      var prefix = "📄 " + (xlsxPreview.kind === "시트지" ? "시트지" : "기업현황표") + " 업로드 자동 기록\n";
      var r = await insertCommLog(prefix + draft);
      if (r.error) {
        alert("기업정보는 적용됐지만 소통내역 저장은 실패했어요: " + r.error.message);
      } else {
        commSaved = true;
        await refreshCommLogs();
      }
    }
    setXlsxPreview(null);
    setXlsxCommDraft("");
    alert("✅ 기업정보가 적용됐어요. 내용 확인 후 저장 버튼을 눌러주세요."
      + (commSaved ? "\n📨 나머지 내용은 소통내역에 자동 기록됐습니다." : ""));
  }
  // 📷 카톡 캡처 OCR (무료 Tesseract.js, 시간 패턴 제거하고 대화 내용만 추출)
  const [ocrBusy, setOcrBusy] = useState(null);
  var handleOcrFile = async function(file, target) {
    if (!file) return;
    setOcrBusy(target);
    try {
      if (!window.Tesseract) {
        await new Promise(function(res, rej) { var s = document.createElement("script"); s.src = "https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js"; s.onload = res; s.onerror = rej; document.head.appendChild(s); });
      }
      var r = await window.Tesseract.recognize(file, "kor");
      var text = (r.data.text || "").split("\n").map(function(line) {
        // 시간 패턴 제거: 오전/오후 3:24, 3:24, 14:30, 3:24 PM 등
        return line.replace(/(오전|오후)\s*\d{1,2}:\d{2}/g, "").replace(/\d{1,2}:\d{2}\s*(AM|PM|am|pm)?/g, "").trim();
      }).filter(function(l) { return l; }).join("\n");
      if (!text) { alert("이미지에서 글자를 찾지 못했어요. 더 선명한 캡처로 다시 시도해보세요."); }
      else if (target === "issue") setData(function(p) { return Object.assign({}, p, { issue: (p.issue ? p.issue + "\n" : "") + text }); });
      else if (target === "next_action") setData(function(p) { return Object.assign({}, p, { next_action: (p.next_action ? p.next_action + "\n" : "") + text }); });
      else if (target === "comm") setCommInput(function(prev) { return (prev ? prev + "\n" : "") + text; });
    } catch (e) { alert("이미지 인식 실패: " + (e.message || e)); }
    setOcrBusy(null);
  };
  var OcrButton = function(props) {
    return (
      <label style={{ fontSize: 10, color: ocrBusy ? "#AAA" : "#4338CA", cursor: ocrBusy ? "default" : "pointer", border: "1px solid #C7D2FE", borderRadius: 5, padding: "2px 8px", background: "#EEF2FF", whiteSpace: "nowrap" }}>
        {ocrBusy === props.target ? "인식중..." : "📷 캡처 읽기"}
        <input type="file" accept="image/*" style={{ display: "none" }} disabled={!!ocrBusy}
          onChange={function(e) { var f = e.target.files[0]; e.target.value = ""; handleOcrFile(f, props.target); }} />
      </label>
    );
  };
  const [loadingExtra, setLoadingExtra] = useState(false);
  const [editingLogId, setEditingLogId] = useState(null);
  const [editingLogText, setEditingLogText] = useState("");

  // ── 업체별 AI 상담 ──
  const [aiMsgs, setAiMsgs] = useState([]); // { role: "user"|"assistant", content }
  const [aiInput, setAiInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const AI_SENSITIVE = { login_id: 1, login_pw: 1, login_pw2: 1, resident_number: 1, ipin_account: 1, ipin_password: 1, agency_login_id: 1, agency_login_password: 1, personal_cert: 1, business_cert: 1, personal_cert_password: 1, business_cert_password: 1 };
  var aiStrip = function(obj) {
    if (!obj || typeof obj !== "object") return obj;
    var out = {};
    Object.keys(obj).forEach(function(k) {
      if (!AI_SENSITIVE[k] && obj[k] != null && obj[k] !== "") out[k] = obj[k];
    });
    return out;
  };
  var buildCompanyContext = function() {
    return {
      업체: aiStrip(data),
      기관진행: (agencyCases || []).map(aiStrip),
      정산: (settlements || []).map(aiStrip),
      소통내역: (commLogs || []).map(function(l) {
        return { 날짜: l.created_at, 담당: l.assignee || l.logged_by || null, 내용: l.memo || l.note || null };
      }),
    };
  };
  var sendAiCompany = async function() {
    var q = aiInput.trim();
    if (!q || aiLoading) return;
    var history = aiMsgs.slice(-8);
    setAiMsgs(function(p) { return p.concat([{ role: "user", content: q }]); });
    setAiInput("");
    setAiLoading(true);
    try {
      var resp = await fetch("/api/ai-company", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question: q, companyContext: buildCompanyContext(), history: history }),
      });
      var d = await resp.json();
      if (!resp.ok) throw new Error(d.error || "요청 실패");
      setAiMsgs(function(p) { return p.concat([{ role: "assistant", content: d.answer || "(빈 응답)" }]); });
    } catch (e) {
      setAiMsgs(function(p) { return p.concat([{ role: "assistant", content: "❌ 오류: " + (e && e.message ? e.message : e) }]); });
    } finally {
      setAiLoading(false);
    }
  };

  const sc = STAGE_COLORS[data.stage] || {};

  useEffect(function() {
    if (!company.name) return;
    setLoadingExtra(true);
    Promise.all([
      supabase.from("agency_cases").select("*").eq("business_name", company.name).order("created_at", { ascending: false }),
      supabase.from("settlement_manual").select("*").eq("business_name", company.name).is("deleted_at", null).order("created_at", { ascending: false }),
      supabase.from("activity_logs").select("*").eq("company_id", company.id).order("created_at", { ascending: false }),
    ]).then(function([r1, r2, r3]) {
      if (!r1.error) setAgencyCases(r1.data || []);
      if (!r2.error) setSettlements(r2.data || []);
      if (!r3.error) { setCommLogs(r3.data || []); }
      setLoadingExtra(false);
    });
  }, [company.id, company.name]);

  // 소통내역 1건 저장(스키마 컬럼 불일치 대비 단계적 재시도). 성공 시 { error:null } 반환
  var insertCommLog = async function(text) {
    if (!text || !text.trim()) return { error: null };
    var payload = {
      company_id: company.id,
      business_name: company.name,
      assignee: currentUser?.name || null,
      log_type: "manual_memo",
      memo: text.trim(),
      logged_by: currentUser?.name || null,
    };
    var r = await supabase.from("activity_logs").insert(payload);
    if (r.error) {
      console.warn("activity_logs 1차 insert 실패:", r.error.message);
      var minimal = { company_id: company.id, memo: text.trim(), log_type: "manual_memo" };
      r = await supabase.from("activity_logs").insert(minimal);
      if (r.error) {
        delete minimal.log_type;
        r = await supabase.from("activity_logs").insert(minimal);
      }
    }
    return r;
  };
  var refreshCommLogs = async function() {
    var r2 = await supabase.from("activity_logs").select("*").eq("company_id", company.id).order("created_at", { ascending: false });
    if (!r2.error) { setCommLogs(r2.data || []); }
  };
  var saveCommLog = async function() {
    if (!commInput.trim()) return;
    var r = await insertCommLog(commInput);
    if (r.error) {
      alert("저장 실패: " + r.error.message + "\n\n관리자에게 이 메시지를 알려주세요.");
      return;
    }
    setCommInput("");
    await refreshCommLogs();
  };

  // 수정 시작
  var startEditLog = function(log) {
    setEditingLogId(log.id);
    setEditingLogText(log.memo || log.note || "");
  };
  // 수정 저장
  var saveEditLog = async function() {
    if (!editingLogText.trim()) return;
    var r = await supabase.from("activity_logs").update({ memo: editingLogText.trim() }).eq("id", editingLogId);
    if (r.error) { alert("수정 실패: " + r.error.message); return; }
    setEditingLogId(null);
    setEditingLogText("");
    // 목록 새로고침
    var r2 = await supabase.from("activity_logs").select("*").eq("company_id", company.id).order("created_at", { ascending: false });
    if (!r2.error) { setCommLogs(r2.data || []); }
  };
  // 수정 취소
  var cancelEditLog = function() {
    setEditingLogId(null);
    setEditingLogText("");
  };
  // 삭제
  var deleteCommLog = async function(logId) {
    if (!confirm("이 소통 내역을 삭제할까요? 되돌릴 수 없습니다.")) return;
    var r = await supabase.from("activity_logs").delete().eq("id", logId);
    if (r.error) { alert("삭제 실패: " + r.error.message); return; }
    // 즉시 UI 반영
    setCommLogs(function(prev) { return prev.filter(function(l) { return l.id !== logId; }); });
  };
  // 권한 체크 - 본인이 작성한 거 또는 관리자(role==admin 또는 이름이 양호)
  var canEditLog = function(log) {
    if (!currentUser) return false;
    if (currentUser.role === "admin") return true;
    if (currentUser.name === "양호") return true;
    var author = log.assignee || log.logged_by || "";
    return author === currentUser.name;
  };

  const copyComm = () => {
    const txt = `[${data.name}] / ${data.representative} 대표\n현재단계: ${data.stage}\n이슈: ${data.issue}\n다음액션: ${data.next_action}\n기한: ${data.next_contact}\n담당: ${data.assignee}`;
    navigator.clipboard?.writeText(txt).then(() => {});
  };

  // 📋 카톡용 한 줄 복사: 업체명 / 신청기관 / 진행단계 / 다음액션
  const [kakaoCopied, setKakaoCopied] = useState(false);
  const copyKakaoLine = () => {
    var agency = (data.agency || "").split(",").map(function(x) { return x.trim(); }).filter(Boolean)[0] || "-";
    var action = (data.next_action || "").split("\n").map(function(x) { return x.trim(); }).filter(Boolean)[0] || "-";
    var parts = [data.name || "-", agency, data.stage || "-", action];
    navigator.clipboard?.writeText(parts.join(" / ")).then(function() {
      setKakaoCopied(true);
      setTimeout(function() { setKakaoCopied(false); }, 1500);
    });
  };

  // 기관진행 탭: agency_cases를 기관(agency_group)별로 묶어 섹션 표시
  const groupedAgency = useMemo(function() {
    var order = AGENCY_GROUPS.map(function(g) { return g.id; });
    var map = {};
    agencyCases.forEach(function(c) {
      var key = c.agency_group || "기타";
      if (!map[key]) map[key] = [];
      map[key].push(c);
    });
    var keys = Object.keys(map).sort(function(a, b) {
      var ia = order.indexOf(a), ib = order.indexOf(b);
      if (ia < 0) ia = 999;
      if (ib < 0) ib = 999;
      if (ia !== ib) return ia - ib;
      return a.localeCompare(b);
    });
    return keys.map(function(k) {
      // 월 역순 정렬
      var list = map[k].slice().sort(function(a, b) {
        return (Number(b.month) || 0) - (Number(a.month) || 0);
      });
      // 승인금액 합계: 값이 모두 순수 숫자일 때만 (만원/억 등 단위 섞이면 오합계 방지 위해 생략)
      var sum = 0, cnt = 0, unitClean = true;
      list.forEach(function(c) {
        var raw = String(c.approved_amount || "").trim();
        if (!raw) return;
        var digits = raw.replace(/[,\s]/g, "");
        if (/^\d+$/.test(digits)) { sum += parseInt(digits, 10); cnt++; }
        else { unitClean = false; }
      });
      return { key: k, list: list, sum: sum, hasSum: unitClean && cnt > 0, latestStatus: list[0] ? list[0].status : null };
    });
  }, [agencyCases]);

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "flex-end" }}
      onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div style={{ width: 460, height: "100vh", background: "#fff", overflowY: "auto", boxShadow: "-8px 0 40px rgba(0,0,0,0.15)", display: "flex", flexDirection: "column" }}>
        {/* 헤더 */}
        <div style={{ padding: "22px 24px 16px", borderBottom: "1px solid #E8E5E0", background: sc.bg || "#F7F6F3" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ display: "flex", gap: 7, marginBottom: 6, flexWrap: "wrap" }}>
                <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 99, background: "#fff", color: data.type === "법인" ? "#4338CA" : "#15803D", fontWeight: 700 }}>{data.type}</span>
                <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 99, background: sc.text, color: "#fff", fontWeight: 600 }}>{data.stage}</span>
                {data.stagnant_days >= 7 && <span style={{ fontSize: 11, color: "#DC2626", fontWeight: 700, background: "#FEF2F2", padding: "2px 8px", borderRadius: 99 }}>⚠ {data.stagnant_days}일 정체</span>}
              </div>
              {editingName ? (
                <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 2 }}>
                  <input value={nameInput} onChange={e => setNameInput(e.target.value)} autoFocus
                    style={{ fontSize: 18, fontWeight: 700, padding: "4px 8px", border: "1px solid #C7D2FE", borderRadius: 6, outline: "none", background: "#fff", width: 260 }} />
                  <button onClick={() => { setData(p => ({ ...p, name: nameInput })); setEditingName(false); }}
                    style={{ background: "#1A1917", color: "#fff", border: "none", borderRadius: 6, padding: "5px 10px", fontSize: 12, cursor: "pointer", fontWeight: 600 }}>확인</button>
                  <button onClick={() => { setNameInput(data.name); setEditingName(false); }}
                    style={{ background: "#fff", color: "#888", border: "1px solid #E8E5E0", borderRadius: 6, padding: "5px 8px", fontSize: 12, cursor: "pointer" }}>취소</button>
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0, letterSpacing: "-0.03em" }}>{nameInput || data.name}</h2>
                  <button onClick={() => setEditingName(true)}
                    style={{ background: "none", border: "none", cursor: "pointer", padding: 2, opacity: 0.5 }}>
                    <Icon name="edit" size={14} color="#333" />
                  </button>
                </div>
              )}
              <div style={{ fontSize: 13, color: "#666", marginTop: 4, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                <span onClick={function() {
                  var v = prompt("대표자명 수정:", data.representative || "");
                  if (v !== null) setData(function(p) { return Object.assign({}, p, { representative: v }); });
                }} style={{ cursor: "pointer", borderBottom: "1px dashed #CCC" }}
                  title="클릭하여 수정">{data.representative || "대표자 입력"} 대표</span>
                <span>·</span>
                <span onClick={function() {
                  var v = prompt("전화번호 수정:", data.phone || "");
                  if (v !== null) setData(function(p) { return Object.assign({}, p, { phone: v }); });
                }} style={{ cursor: "pointer", borderBottom: "1px dashed #CCC" }}
                  title="클릭하여 수정">{data.phone || "전화번호 입력"}</span>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
              <button onClick={copyKakaoLine} title="업체명 / 신청기관 / 진행단계 / 다음액션 한 줄 복사"
                style={{ display: "flex", alignItems: "center", gap: 4, background: kakaoCopied ? "#DCFCE7" : "#fff", color: kakaoCopied ? "#15803D" : "#4338CA", border: "1px solid " + (kakaoCopied ? "#86EFAC" : "#C7D2FE"), borderRadius: 7, padding: "6px 10px", fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
                {kakaoCopied ? "✅ 복사됨" : "📋 상태 복사"}
              </button>
              <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#888" }}><Icon name="x" size={20} color="#888" /></button>
            </div>
          </div>
          {/* 단계 변경 */}
          <div style={{ display: "flex", gap: 4, marginTop: 14, flexWrap: "wrap" }}>
            {STAGES.map(s => (
              <button key={s} onClick={() => setData(p => ({ ...p, stage: s }))}
                style={{ fontSize: 11, padding: "5px 10px", borderRadius: 99, border: `1px solid ${s === data.stage ? STAGE_COLORS[s].text : "#E8E5E0"}`, background: s === data.stage ? STAGE_COLORS[s].text : "#fff", color: s === data.stage ? "#fff" : "#888", cursor: "pointer", fontWeight: s === data.stage ? 700 : 400 }}>
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* 🔎 한눈 요약 (통합뷰) — 대표/기관/단계/정산 + 최근활동 */}
        <div style={{ padding: "12px 24px", borderBottom: "1px solid #E8E5E0", background: "#F7F6F3", display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {[
              { label: "대표", value: data.representative || "-" },
              { label: "기관", value: groupedAgency.length > 0 ? (groupedAgency.length === 1 ? groupedAgency[0].key : (groupedAgency[0].key + " 외 " + (groupedAgency.length - 1))) : (data.agency || "-") },
              { label: "단계", value: data.stage || "-" },
              { label: "정산", value: settlements.length > 0 ? (settlements.length + "건") : "-" },
            ].map(function(it) {
              return (
                <div key={it.label} title={typeof it.value === "string" ? it.value : ""}
                  style={{ display: "flex", alignItems: "center", gap: 5, background: "#fff", border: "1px solid #E8E5E0", borderRadius: 8, padding: "5px 10px", fontSize: 12, maxWidth: 200 }}>
                  <span style={{ color: "#999", fontWeight: 600, flexShrink: 0 }}>{it.label}</span>
                  <span style={{ color: "#1A1917", fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{it.value}</span>
                </div>
              );
            })}
          </div>
          {(data.next_action || data.issue) && (
            <div style={{ fontSize: 12, color: "#555", display: "flex", gap: 6, alignItems: "flex-start" }}>
              <span style={{ color: "#999", fontWeight: 600, flexShrink: 0 }}>최근활동</span>
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{data.next_action || data.issue}</span>
            </div>
          )}
        </div>

        {/* 탭 */}
        <div style={{ display: "flex", borderBottom: "1px solid #E8E5E0", background: "#FAFAF8", overflowX: "auto" }}>
          {[
            { id: "info", label: "기본정보" },
            { id: "bizinfo", label: "기업정보", badge: (Array.isArray(data.loans) ? data.loans.length : 0) + (Array.isArray(data.company_info) ? data.company_info.length : 0) },
            { id: "docs", label: "서류현황" },
            { id: "history", label: "이슈·액션", badge: commLogs.length },
            { id: "agency", label: "기관진행", badge: agencyCases.length },
            { id: "settlement", label: "정산현황", badge: settlements.length },
            { id: "ai", label: "🤖 AI 상담" },
          ].map(t => (
            <button key={t.id} onClick={() => goTab(t.id)}
              style={{ flex: "0 0 auto", padding: "11px 14px", fontSize: 12, fontWeight: tab === t.id ? 700 : 400, color: tab === t.id ? "#1A1917" : "#888", background: "none", border: "none", borderBottom: `2px solid ${tab === t.id ? "#1A1917" : "transparent"}`, cursor: "pointer", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 4 }}>
              {t.label}
              {t.badge > 0 && <span style={{ fontSize: 10, background: tab === t.id ? "#1A1917" : "#E8E5E0", color: tab === t.id ? "#fff" : "#888", borderRadius: 99, padding: "1px 5px", fontWeight: 700 }}>{t.badge}</span>}
            </button>
          ))}
        </div>

        <div style={{ flex: 1, padding: "20px 24px", overflowY: "auto" }}>
          {tab === "info" && (
            <>
              <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 4, background: "#FEF3C7", color: "#B45309", border: "none", borderRadius: 7, padding: "8px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                  📎 기업현황표·시트지 첨부 (자동 입력)
                  <input type="file" accept=".xlsx,.xls" style={{ display: "none" }} onChange={function(e) { var f = e.target.files && e.target.files[0]; e.target.value = ""; handleXlsxAttach(f); }} />
                </label>
              </div>
              <div style={{ background: "#F7F6F3", borderRadius: 8, padding: "12px 14px", marginBottom: 10 }}>
                <div style={{ fontSize: 11, color: "#888", marginBottom: 8 }}>담당 기관 (복수 선택 가능)</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {AGENCIES.map(ag => {
                    const selected = (data.agency || "").split(",").map(s => s.trim()).filter(Boolean).includes(ag);
                    return (
                      <button key={ag} onClick={() => {
                        const current = (data.agency || "").split(",").map(s => s.trim()).filter(Boolean);
                        const next = selected ? current.filter(a => a !== ag) : [...current, ag];
                        setData(p => ({ ...p, agency: next.join(", ") }));
                      }} style={{ fontSize: 11, padding: "5px 10px", borderRadius: 99, border: `1px solid ${selected ? "#4338CA" : "#E8E5E0"}`, background: selected ? "#4338CA" : "#fff", color: selected ? "#fff" : "#888", cursor: "pointer", fontWeight: selected ? 700 : 400 }}>
                        {ag}
                      </button>
                    );
                  })}
                </div>
                {data.agency && <div style={{ fontSize: 11, color: "#4338CA", marginTop: 8, fontWeight: 600 }}>선택: {data.agency}</div>}
              </div>
              {/* 🚨 보증기관 중복 경고 (기능9) */}
              {agencyIncludes(data, "신용보증기금") && agencyIncludes(data, "신용보증재단") && (
                <div style={{ background: "#FEE2E2", border: "1px solid #FCA5A5", borderRadius: 8, padding: "10px 13px", marginBottom: 10, color: "#DC2626", fontSize: 12.5, fontWeight: 700 }}>
                  🚨 보증기관 중복 불가: 신용보증기금과 신용보증재단은 동시 진행할 수 없습니다. 하나만 선택하세요.
                </div>
              )}
              {/* 자동 감지 배지: 약점(기능3)·기관추천(기능4)·사후관리(기능10) */}
              <PolicyBadges company={data} />
              {/* 재무 지표 (약점 감지 입력용) */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
                <div style={{ background: "#F7F6F3", borderRadius: 8, padding: "10px 13px" }}>
                  <div style={{ fontSize: 11, color: "#888", marginBottom: 5 }}>부채비율 (%)</div>
                  <input type="number" value={data.debt_ratio == null ? "" : data.debt_ratio} placeholder="예: 350" onChange={function(e) { var v = e.target.value; setData(function(p) { return Object.assign({}, p, { debt_ratio: v }); }); }} style={{ width: "100%", fontSize: 13, fontWeight: 600, background: "transparent", border: "none", outline: "none" }} />
                </div>
                <div style={{ background: "#F7F6F3", borderRadius: 8, padding: "10px 13px" }}>
                  <div style={{ fontSize: 11, color: "#888", marginBottom: 5 }}>이자보상배율</div>
                  <input type="number" step="0.1" value={data.interest_coverage_ratio == null ? "" : data.interest_coverage_ratio} placeholder="예: 1.5" onChange={function(e) { var v = e.target.value; setData(function(p) { return Object.assign({}, p, { interest_coverage_ratio: v }); }); }} style={{ width: "100%", fontSize: 13, fontWeight: 600, background: "transparent", border: "none", outline: "none" }} />
                </div>
              </div>
              {/* 🌪 고환율 긴급 트랙 (기능7) — 중진공 선택 시 */}
              {agencyIncludes(data, "중소벤처기업진흥공단") && (
                <div style={{ background: "#F7F6F3", borderRadius: 8, padding: "10px 13px", marginBottom: 10 }}>
                  <div style={{ fontSize: 11, color: "#888", marginBottom: 5 }}>수입 비중 (%) <span style={{ color: "#888" }}>· 고환율 긴급 트랙 판정</span></div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <input type="number" value={data.import_ratio == null ? "" : data.import_ratio} placeholder="예: 25" onChange={function(e) { var v = e.target.value; setData(function(p) { return Object.assign({}, p, { import_ratio: v }); }); }} style={{ flex: 1, fontSize: 13, fontWeight: 600, background: "transparent", border: "none", outline: "none" }} />
                    {parseFloat(data.import_ratio) >= 20 && <span style={{ fontSize: 11, fontWeight: 700, background: "#FEE2E2", color: "#DC2626", border: "1px solid #FCA5A5", borderRadius: 99, padding: "4px 10px", whiteSpace: "nowrap" }}>🌪 고환율 긴급 트랙 해당</span>}
                  </div>
                </div>
              )}
              {/* 🎯 중진공 정책우선도 계산기 (기능1) */}
              {(agencyIncludes(data, "중소벤처기업진흥공단") || agencyIncludes(data, "구조혁신&사업전환")) && <JunginggongCalc />}
              {/* 💳 신보 예상 한도 계산기 (기능2) */}
              {agencyIncludes(data, "신용보증기금") && <SinboCalc company={data} />}
              <div style={{ background: "#FBF7F0", borderRadius: 8, padding: "10px 13px", marginBottom: 10, border: "1px solid #F0E6D6" }}>
                <div style={{ fontSize: 11, color: "#B45309", marginBottom: 6, fontWeight: 600 }}>🤝 소개자 (협업 담당자)</div>
                <select value={data.referrer || ""} onChange={function(e) { var v = e.target.value; setData(function(p) { return Object.assign({}, p, { referrer: v }); }); }}
                  style={{ width: "100%", fontSize: 13, padding: "7px 10px", border: "1px solid #E8E5E0", borderRadius: 6, background: "#fff", outline: "none" }}>
                  <option value="">— 소개자 없음 —</option>
                  {partnersList.map(function(pt) { return <option key={pt.id} value={pt.name}>{pt.name}</option>; })}
                  {data.referrer && partnersList.findIndex(function(pt) { return pt.name === data.referrer; }) < 0 && <option value={data.referrer}>{data.referrer} (목록에 없음)</option>}
                </select>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 18 }}>
                <div style={{ background: "#F7F6F3", borderRadius: 8, padding: "10px 13px" }}>
                  <div style={{ fontSize: 11, color: "#888", marginBottom: 5 }}>연락처</div>
                  <input type="text" value={data.phone || ""} placeholder="01012345678" onChange={function(e) { var v = formatPhone(e.target.value); setData(function(p) { return Object.assign({}, p, { phone: v }); }); }} style={{ width: "100%", fontSize: 13, fontWeight: 600, background: "transparent", border: "none", outline: "none" }} />
                </div>
                <div style={{ background: "#F7F6F3", borderRadius: 8, padding: "10px 13px" }}>
                  <div style={{ fontSize: 11, color: "#888", marginBottom: 5 }}>종업원 수</div>
                  <input type="number" value={data.employee_count || ""} placeholder="명" onChange={function(e) { var v = e.target.value; setData(function(p) { return Object.assign({}, p, { employee_count: v }); }); }} style={{ width: "100%", fontSize: 13, fontWeight: 600, background: "transparent", border: "none", outline: "none" }} />
                </div>
                <div style={{ background: "#F7F6F3", borderRadius: 8, padding: "10px 13px" }}>
                  <div style={{ fontSize: 11, color: "#888", marginBottom: 5 }}>KCB / NICE</div>
                  <input type="text" inputMode="numeric" value={(data.credit_score_kcb || "") + (data.credit_score_nice ? " / " + data.credit_score_nice : "")} placeholder="KCB / NICE" onChange={function(e) { var raw = e.target.value.replace(/[^0-9]/g, ""); var kcb = raw.slice(0, 3); var nice = raw.slice(3, 6); setData(function(p) { return Object.assign({}, p, { credit_score_kcb: kcb, credit_score_nice: nice }); }); }} style={{ width: "100%", fontSize: 13, fontWeight: 600, background: "transparent", border: "none", outline: "none", minWidth: 0, boxSizing: "border-box" }} />
                </div>
                <div style={{ background: "#F7F6F3", borderRadius: 8, padding: "10px 13px" }}>
                  <div style={{ fontSize: 11, color: "#888", marginBottom: 5 }}>설립연월</div>
                  <input type="text" inputMode="numeric" value={(function() { if (!data.founded_year && !data.founded_month) return ""; var y = data.founded_year || ""; var m = data.founded_month; if (!m && m !== 0) return y; return y + "-" + String(m); })()} placeholder="YYYY-MM (예: 2018-08)" onChange={function(e) { var raw = e.target.value.replace(/[^0-9]/g, ""); var year = raw.slice(0, 4); var monthRaw = raw.slice(4, 6); var monthNum; if (monthRaw.length === 0) { monthNum = ""; } else { monthNum = parseInt(monthRaw); if (monthNum > 12) monthNum = 12; } setData(function(p) { return Object.assign({}, p, { founded_year: year, founded_month: monthNum }); }); }} style={{ width: "100%", fontSize: 13, fontWeight: 600, background: "transparent", border: "none", outline: "none", minWidth: 0, boxSizing: "border-box" }} />
                </div>
                <div style={{ background: "#F7F6F3", borderRadius: 8, padding: "10px 13px" }}>
                  <div style={{ fontSize: 11, color: "#888", marginBottom: 5 }}>계약일</div>
                  <input type="date" value={data.contract_date || ""} onChange={function(e) { var v = e.target.value; setData(function(p) { return Object.assign({}, p, { contract_date: v }); }); }} style={{ width: "auto", fontSize: 13, fontWeight: 600, background: "transparent", border: "none", outline: "none" }} />
                </div>
                <div style={{ background: "#F7F6F3", borderRadius: 8, padding: "10px 13px" }}>
                  <div style={{ fontSize: 11, color: "#888", marginBottom: 5 }}>사업자등록번호</div>
                  <input type="text" value={data.business_number || ""} placeholder="1234567890" onChange={function(e) { var v = formatBizNumber(e.target.value); setData(function(p) { return Object.assign({}, p, { business_number: v }); }); }} style={{ width: "100%", fontSize: 13, fontWeight: 600, background: "transparent", border: "none", outline: "none" }} />
                </div>
              </div>
              {/* 사업자 유형 + 지역 */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
                <div style={{ background: "#F7F6F3", borderRadius: 8, padding: "10px 13px" }}>
                  <div style={{ fontSize: 11, color: "#888", marginBottom: 6 }}>사업자 유형</div>
                  <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                    {["개인사업자","법인사업자"].map(function(t) {
                      var sel = data.business_type === t;
                      return (
                        <button key={t} onClick={function() { setData(function(p) { return Object.assign({}, p, { business_type: t }); }); }}
                          style={{ flex: 1, padding: "6px 8px", borderRadius: 6, fontSize: 12, fontWeight: 600,
                            background: sel ? (t === "법인사업자" ? "#4338CA" : "#0F6E56") : "#fff",
                            color: sel ? "#fff" : "#666",
                            border: sel ? "none" : "1px solid #E8E5E0", cursor: "pointer" }}>
                          {t}
                        </button>
                      );
                    })}
                  </div>
                  <div style={{ fontSize: 11, color: "#888", marginBottom: 6 }}>팀 <span style={{ color: "#AAA", fontSize: 9 }}>(업체명 기준 자동 · 수동 변경 가능)</span></div>
                  <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                    {["법인팀","개인팀"].map(function(t) {
                      var cur = data.team || teamByName(data.name);
                      var sel = cur === t;
                      return (
                        <button key={t} onClick={function() { setData(function(p) { return Object.assign({}, p, { team: t }); }); }}
                          style={{ flex: 1, padding: "6px 8px", borderRadius: 6, fontSize: 12, fontWeight: 600,
                            background: sel ? (t === "법인팀" ? "#4338CA" : "#0F6E56") : "#fff",
                            color: sel ? "#fff" : "#666",
                            border: sel ? "none" : "1px solid #E8E5E0", cursor: "pointer" }}>
                          {t}
                        </button>
                      );
                    })}
                  </div>
                  <div style={{ fontSize: 11, color: "#888", marginBottom: 6 }}>업종 (복수 선택 가능)</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 6 }}>
                    {getMergedIndustryOptions(companies).map(function(ind) {
                      var cur = (data.industry || "").split(",").map(function(s) { return s.trim(); }).filter(Boolean);
                      var sel = cur.indexOf(ind) >= 0;
                      var isCustom = INDUSTRY_OPTIONS.indexOf(ind) < 0;
                      return (
                        <button key={ind} onClick={function() {
                          var arr = (data.industry || "").split(",").map(function(s) { return s.trim(); }).filter(Boolean);
                          var idx = arr.indexOf(ind);
                          if (idx >= 0) arr.splice(idx, 1);
                          else arr.push(ind);
                          var newVal = arr.length > 0 ? arr.join(", ") : "";
                          setData(function(p) { return Object.assign({}, p, { industry: newVal }); });
                        }}
                          title={isCustom ? "다른 기업에서 사용 중인 업종" : ""}
                          style={{ padding: "4px 9px", borderRadius: 99, fontSize: 11, fontWeight: sel ? 700 : 400,
                            background: sel ? "#4338CA" : (isCustom ? "#FEF3C7" : "#fff"), color: sel ? "#fff" : (isCustom ? "#92400E" : "#666"),
                            border: sel ? "none" : "1px solid " + (isCustom ? "#FDE68A" : "#E8E5E0"), cursor: "pointer" }}>
                          {sel ? "✓ " : ""}{ind}
                        </button>
                      );
                    })}
                  </div>
                  {/* 통합 옵션에도 없는 항목 (예외) */}
                  {(function() {
                    var cur = (data.industry || "").split(",").map(function(s) { return s.trim(); }).filter(Boolean);
                    var allOpts = getMergedIndustryOptions(companies);
                    var custom = cur.filter(function(s) { return allOpts.indexOf(s) < 0; });
                    if (custom.length === 0) return null;
                    return (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 6 }}>
                        {custom.map(function(s) {
                          return (
                            <span key={s} style={{ background: "#0F6E56", color: "#fff", padding: "3px 9px", borderRadius: 99, fontSize: 11, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 4 }}>
                              ✓ {s}
                              <span onClick={function() {
                                var arr = (data.industry || "").split(",").map(function(x) { return x.trim(); }).filter(Boolean);
                                arr = arr.filter(function(x) { return x !== s; });
                                setData(function(p) { return Object.assign({}, p, { industry: arr.length > 0 ? arr.join(", ") : "" }); });
                              }} style={{ cursor: "pointer", fontSize: 12, opacity: 0.85 }}>✕</span>
                            </span>
                          );
                        })}
                      </div>
                    );
                  })()}
                  <input type="text" placeholder="직접 입력 후 Enter로 추가 (예: 부동산임대업)"
                    onKeyDown={function(e) {
                      if (e.key !== "Enter") return;
                      e.preventDefault();
                      var v = (e.target.value || "").trim();
                      if (!v) return;
                      var arr = (data.industry || "").split(",").map(function(s) { return s.trim(); }).filter(Boolean);
                      if (arr.indexOf(v) >= 0) { e.target.value = ""; return; }
                      arr.push(v);
                      setData(function(p) { return Object.assign({}, p, { industry: arr.join(", ") }); });
                      e.target.value = "";
                    }}
                    style={{ width: "100%", padding: "5px 8px", border: "1px solid #E8E5E0", borderRadius: 5, fontSize: 11, outline: "none", boxSizing: "border-box" }} />
                </div>
                <div style={{ background: "#F7F6F3", borderRadius: 8, padding: "10px 13px" }}>
                  <div style={{ fontSize: 11, color: "#888", marginBottom: 5 }}>지역</div>
                  <input type="text" value={data.region || ""} placeholder="예: 서울_강남, 경기_안산" onChange={function(e) { var v = e.target.value; setData(function(p) { return Object.assign({}, p, { region: v }); }); }} style={{ width: "100%", fontSize: 13, fontWeight: 600, background: "transparent", border: "none", outline: "none" }} />
                  {/* 🔐 계정·인증 정보 (지역 칸 빈 공간 활용, 세로 배치) */}
                  <div style={{ marginTop: 12, borderTop: "1px solid #E8E5E0", paddingTop: 10 }}>
                    <div style={{ fontSize: 11, color: "#888", marginBottom: 8, display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}>🔐 계정·인증 정보 <span style={{ color: "#888", fontSize: 10 }}>(소진공·중진공·홈택스·계좌·아이핀 등 자유)</span></div>
                    {(Array.isArray(data.accounts) ? data.accounts : []).map(function(acc, ai) {
                      return (
                        <div key={ai} style={{ marginBottom: 8, paddingBottom: 8, borderBottom: "1px solid #E8E5E0" }}>
                          <div style={{ display: "flex", gap: 4, alignItems: "center", marginBottom: 4 }}>
                            <input value={acc.label || ""} placeholder="구분 (예: 소진공 계정)"
                              onChange={function(e) { var v = e.target.value; setData(function(p) { var a = (p.accounts || []).slice(); a[ai] = Object.assign({}, a[ai], { label: v }); return Object.assign({}, p, { accounts: a }); }); }}
                              style={{ flex: 1, minWidth: 0, fontSize: 12, fontWeight: 600, padding: "5px 7px", border: "1px solid #E8E5E0", borderRadius: 5, boxSizing: "border-box", outline: "none" }} />
                            <button onClick={function() { setData(function(p) { return Object.assign({}, p, { accounts: (p.accounts || []).filter(function(_, i) { return i !== ai; }) }); }); }}
                              style={{ border: "none", background: "transparent", color: "#888", cursor: "pointer", fontSize: 15, padding: "0 2px" }}>✕</button>
                          </div>
                          <input value={acc.id || ""} placeholder="아이디 / 내용"
                            onChange={function(e) { var v = e.target.value; setData(function(p) { var a = (p.accounts || []).slice(); a[ai] = Object.assign({}, a[ai], { id: v }); return Object.assign({}, p, { accounts: a }); }); }}
                            style={{ width: "100%", fontSize: 12, padding: "5px 7px", border: "1px solid #E8E5E0", borderRadius: 5, boxSizing: "border-box", outline: "none", marginBottom: 4 }} />
                          <input value={acc.pw || ""} placeholder="비밀번호 (선택)"
                            onChange={function(e) { var v = e.target.value; setData(function(p) { var a = (p.accounts || []).slice(); a[ai] = Object.assign({}, a[ai], { pw: v }); return Object.assign({}, p, { accounts: a }); }); }}
                            style={{ width: "100%", fontSize: 12, padding: "5px 7px", border: "1px solid #E8E5E0", borderRadius: 5, boxSizing: "border-box", outline: "none" }} />
                        </div>
                      );
                    })}
                    <button onClick={function() { setData(function(p) { return Object.assign({}, p, { accounts: (p.accounts || []).concat([{ label: "", id: "", pw: "" }]) }); }); }}
                      style={{ width: "100%", fontSize: 12, padding: "6px 10px", background: "#fff", border: "1px solid #D1D5DB", borderRadius: 6, color: "#555", fontWeight: 600, cursor: "pointer" }}>+ 항목 추가</button>
                  </div>
                </div>
              </div>
              {/* 담당자 다중선택 */}
              <div style={{ background: "#F7F6F3", borderRadius: 8, padding: "12px 14px", marginBottom: 10 }}>
                <div style={{ fontSize: 11, color: "#888", marginBottom: 8 }}>담당자 (복수 선택 가능)</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {ASSIGNEES.map(name => {
                    const selected = (data.assignee || "").split(",").map(s => s.trim()).filter(Boolean).includes(name);
                    return (
                      <button key={name} onClick={() => {
                        const current = (data.assignee || "").split(",").map(s => s.trim()).filter(Boolean);
                        const next = selected ? current.filter(a => a !== name) : [...current, name];
                        setData(p => ({ ...p, assignee: next.join(", ") }));
                      }} style={{ fontSize: 12, padding: "6px 12px", borderRadius: 99, border: `1px solid ${selected ? "#1A1917" : "#E8E5E0"}`, background: selected ? "#1A1917" : "#fff", color: selected ? "#fff" : "#555", cursor: "pointer", fontWeight: selected ? 700 : 400 }}>
                        {name}
                      </button>
                    );
                  })}
                </div>
                {data.assignee && <div style={{ fontSize: 11, color: "#555", marginTop: 8, fontWeight: 600 }}>선택: {data.assignee}</div>}
              </div>
              <div style={{ background: "#F7F6F3", borderRadius: 8, padding: "13px 15px", marginBottom: 12 }}>
                <div style={{ fontSize: 12, color: "#888", marginBottom: 4, fontWeight: 600 }}>매출액 (최근 3개년 + 26년 상반기)</div>
                <div style={{ fontSize: 10, color: "#AAA", marginBottom: 10 }}>원 단위로 입력 (예: 790000000 → 7.9억 자동 표시)</div>
                <div style={{ display: "flex", gap: 8 }}>
                  {[["2023년", "revenue_2023"], ["2024년", "revenue_2024"], ["2025년", "revenue_2025"], ["26년 상반기", "revenue_2026_h1"]].map(([label, key]) => (
                    <div key={key} style={{ flex: 1, textAlign: "center", background: "#fff", borderRadius: 7, padding: "10px 8px" }}>
                      <div style={{ fontSize: 11, color: "#AAA", marginBottom: 4 }}>{label}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#4338CA", marginBottom: 4 }}>{formatRevenue(data[key])}</div>
                      <input
                        type="number"
                        placeholder="원 단위 입력"
                        value={data[key] || ""}
                        onChange={function(e) { var v = e.target.value; setData(function(p) { return Object.assign({}, p, { [key]: v ? parseInt(v) : null }); }); }}
                        style={{ width: "100%", fontSize: 11, textAlign: "center", border: "1px solid #E8E5E0", borderRadius: 5, padding: "4px", outline: "none", boxSizing: "border-box" }} />
                    </div>
                  ))}
                </div>
              </div>
              {/* 💰 수수료 계산기 (기능5) */}
              <div style={{ background: "#F0FDF4", borderRadius: 10, padding: "13px 15px", marginBottom: 10, border: "1px solid #BBF7D0" }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: "#15803D", marginBottom: 10 }}>💰 수수료 계산기</div>
                <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
                  <div style={{ flex: 2, minWidth: 140 }}>
                    <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>승인(예상) 금액 (원)</div>
                    <input type="number" value={data.approved_amount == null ? "" : data.approved_amount} placeholder="예: 100000000"
                      onChange={function(e) { var v = e.target.value; setData(function(p) { return Object.assign({}, p, { approved_amount: v }); }); }}
                      style={{ width: "100%", fontSize: 13, padding: "7px 9px", border: "1px solid #E8E5E0", borderRadius: 6, outline: "none", boxSizing: "border-box" }} />
                    {data.approved_amount ? <div style={{ fontSize: 10, color: "#15803D", marginTop: 3, fontWeight: 700 }}>{wonToKor(parseInt(String(data.approved_amount).replace(/[^0-9]/g, ""), 10) || 0)} 원</div> : null}
                  </div>
                  <div style={{ flex: 1, minWidth: 90 }}>
                    <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>수수료율 (%)</div>
                    <select value={data.fee || 5} onChange={function(e) { var v = e.target.value; setData(function(p) { return Object.assign({}, p, { fee: v }); }); }}
                      style={{ width: "100%", fontSize: 13, padding: "7px 9px", border: "1px solid #E8E5E0", borderRadius: 6, background: "#fff", outline: "none", boxSizing: "border-box" }}>
                      {[1,2,3,4,5].map(function(r) { return <option key={r} value={r}>{r}%</option>; })}
                    </select>
                  </div>
                </div>
                <div style={{ background: "#fff", borderRadius: 8, padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 12, color: "#888", fontWeight: 600 }}>예상 수수료</span>
                  <span style={{ fontSize: 20, fontWeight: 800, color: "#15803D" }}>{expectedFee(data) > 0 ? expectedFee(data).toLocaleString() + " 원" : "-"}</span>
                </div>
              </div>
              <div style={{ background: "#F7F6F3", borderRadius: 8, padding: "13px 15px" }}>
                <div style={{ fontSize: 12, color: "#888", marginBottom: 8, fontWeight: 600 }}>수수료 현황</div>
                <div style={{ display: "flex", gap: 6 }}>
                  {["미수령","계약금수령","수수료수령완료"].map(s => (
                    <button key={s} onClick={() => setData(p => ({ ...p, fee_status: s }))}
                      style={{ flex: 1, padding: "7px 4px", borderRadius: 7, border: `1px solid ${data.fee_status === s ? "#1A1917" : "#E8E5E0"}`, background: data.fee_status === s ? "#1A1917" : "#fff", color: data.fee_status === s ? "#fff" : "#888", fontSize: 11, cursor: "pointer", fontWeight: data.fee_status === s ? 700 : 400 }}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {tab === "bizinfo" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, gap: 8, flexWrap: "wrap" }}>
                <div style={{ fontSize: 11, color: "#888" }}>기업현황표에서 자동 추출 · 직접 수정 가능</div>
                <div style={{ display: "flex", gap: 6 }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 4, background: "#FEF3C7", color: "#B45309", border: "none", borderRadius: 7, padding: "8px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                    📎 현황표 첨부
                    <input type="file" accept=".xlsx,.xls" style={{ display: "none" }} onChange={function(e) { var f = e.target.files && e.target.files[0]; e.target.value = ""; handleXlsxAttach(f); }} />
                  </label>
                  <button onClick={function() { onSave(data); }} style={{ display: "flex", alignItems: "center", gap: 5, background: "#15803D", color: "#fff", border: "none", borderRadius: 7, padding: "8px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                    <Icon name="save" size={13} color="#fff" /> 기업정보 저장
                  </button>
                </div>
              </div>

              {/* 기대출 내역 표 */}
              <div style={{ fontSize: 12, fontWeight: 700, color: "#555", marginBottom: 7 }}>💰 기대출 내역</div>
              <div style={{ overflowX: "auto", marginBottom: 8 }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11.5 }}>
                  <thead>
                    <tr style={{ background: "#F4F4F8" }}>
                      <th style={{ padding: "6px 5px", border: "1px solid #E8E5E0", fontWeight: 600, width: "26%" }}>기관</th>
                      <th style={{ padding: "6px 5px", border: "1px solid #E8E5E0", fontWeight: 600, width: "16%" }}>금액</th>
                      <th style={{ padding: "6px 5px", border: "1px solid #E8E5E0", fontWeight: 600, width: "14%" }}>은행</th>
                      <th style={{ padding: "6px 5px", border: "1px solid #E8E5E0", fontWeight: 600, width: "19%" }}>실행일</th>
                      <th style={{ padding: "6px 5px", border: "1px solid #E8E5E0", fontWeight: 600, width: "19%" }}>만기일</th>
                      <th style={{ padding: "6px 2px", border: "1px solid #E8E5E0", width: "6%" }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {(Array.isArray(data.loans) ? data.loans : []).map(function(ln, li) {
                      var updateLoan = function(field, val) {
                        setData(function(p) {
                          var arr = (Array.isArray(p.loans) ? p.loans : []).slice();
                          arr[li] = Object.assign({}, arr[li], { [field]: val });
                          return Object.assign({}, p, { loans: arr });
                        });
                      };
                      var cellStyle = { border: "1px solid #E8E5E0", padding: 0 };
                      var inStyle = { width: "100%", border: "none", padding: "6px 5px", fontSize: 11.5, background: "transparent", outline: "none", boxSizing: "border-box" };
                      return (
                        <tr key={li}>
                          <td style={cellStyle}><input value={ln.inst || ""} onChange={function(e) { updateLoan("inst", e.target.value); }} style={inStyle} /></td>
                          <td style={cellStyle}><input value={ln.amount || ""} onChange={function(e) { updateLoan("amount", e.target.value); }} style={inStyle} /></td>
                          <td style={cellStyle}><input value={ln.bank || ""} onChange={function(e) { updateLoan("bank", e.target.value); }} style={inStyle} /></td>
                          <td style={cellStyle}><input value={ln.start || ""} placeholder="26.01.13" onChange={function(e) { updateLoan("start", e.target.value); }} style={inStyle} /></td>
                          <td style={cellStyle}><input value={ln.end || ""} placeholder="31.01.13" onChange={function(e) { updateLoan("end", e.target.value); }} style={inStyle} /></td>
                          <td style={{ border: "1px solid #E8E5E0", textAlign: "center" }}>
                            <button onClick={function() { setData(function(p) { var arr = (Array.isArray(p.loans) ? p.loans : []).slice(); arr.splice(li, 1); return Object.assign({}, p, { loans: arr }); }); }}
                              style={{ background: "none", border: "none", cursor: "pointer", color: "#888", padding: 3 }}><Icon name="x" size={11} color="#CCC" /></button>
                          </td>
                        </tr>
                      );
                    })}
                    {(!Array.isArray(data.loans) || data.loans.length === 0) && (
                      <tr><td colSpan={6} style={{ border: "1px solid #E8E5E0", padding: "10px", textAlign: "center", color: "#888", fontSize: 11 }}>기대출 내역 없음</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              <button onClick={function() { setData(function(p) { var arr = (Array.isArray(p.loans) ? p.loans : []).slice(); arr.push({ inst: "", amount: "", bank: "", start: "", end: "" }); return Object.assign({}, p, { loans: arr }); }); }}
                style={{ background: "#fff", color: "#4338CA", border: "1px solid #C7D2FE", borderRadius: 7, padding: "6px 12px", fontSize: 11.5, fontWeight: 600, cursor: "pointer", marginBottom: 20 }}>
                + 대출 행 추가
              </button>

              {/* 기업정보 항목 — 기본 6개(고정) + 추가 항목(자유) */}
              {(function() {
                var DEFAULT_LABELS = ["재창업 조건 (폐업이력)", "수출실적", "연구소", "노란우산공제", "기업인증", "특허 및 상표권"];
                var infoArr = Array.isArray(data.company_info) ? data.company_info : [];
                var getVal = function(label) { var it = infoArr.find(function(x) { return x.label === label; }); return it ? (it.value || "") : ""; };
                var setVal = function(label, val) {
                  setData(function(p) {
                    var arr = (Array.isArray(p.company_info) ? p.company_info : []).slice();
                    var idx = arr.findIndex(function(x) { return x.label === label; });
                    if (idx >= 0) arr[idx] = Object.assign({}, arr[idx], { value: val });
                    else arr.push({ label: label, value: val });
                    return Object.assign({}, p, { company_info: arr });
                  });
                };
                var extraItems = infoArr.map(function(it, ii) { return { it: it, ii: ii }; }).filter(function(x) { return DEFAULT_LABELS.indexOf(x.it.label) < 0; });
                return (
                  <>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#555", marginBottom: 7, marginTop: 6 }}>📋 기업정보 (기본 항목)</div>
                    <div style={{ fontSize: 10.5, color: "#AAA", marginBottom: 8 }}>해당되는 것만 입력하세요. 여러 개면 줄바꿈으로 나열 (예: 특허 2건은 각 줄에)</div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 8, marginBottom: 16 }}>
                      {DEFAULT_LABELS.map(function(label) {
                        var val = getVal(label);
                        var filled = val && val.trim();
                        return (
                          <div key={label} style={{ background: filled ? "#F0FDF4" : "#FAFAF8", border: filled ? "1px solid #BBF7D0" : "1px solid #E8E5E0", borderRadius: 8, padding: "9px 11px" }}>
                            <div style={{ fontSize: 11, color: filled ? "#15803D" : "#999", fontWeight: 700, marginBottom: 4 }}>{label}</div>
                            <textarea value={val} placeholder="해당 없으면 비워두세요"
                              onChange={function(e) { setVal(label, e.target.value); }}
                              rows={1} style={{ width: "100%", border: "none", fontSize: 12.5, color: "#1A1917", padding: 0, background: "transparent", outline: "none", resize: "vertical", boxSizing: "border-box", fontFamily: "inherit", minHeight: 18, lineHeight: 1.5 }} />
                          </div>
                        );
                      })}
                    </div>

                    <div style={{ fontSize: 12, fontWeight: 700, color: "#555", marginBottom: 7 }}>➕ 추가 항목 (자유)</div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 8, marginBottom: 8 }}>
                      {extraItems.map(function(x) {
                        var ii = x.ii;
                        return (
                          <div key={ii} style={{ background: "#fff", border: "1px solid #E8E5E0", borderRadius: 8, padding: "8px 10px", position: "relative" }}>
                            <input value={x.it.label || ""} placeholder="항목명"
                              onChange={function(e) { var v = e.target.value; setData(function(p) { var arr = (Array.isArray(p.company_info) ? p.company_info : []).slice(); arr[ii] = Object.assign({}, arr[ii], { label: v }); return Object.assign({}, p, { company_info: arr }); }); }}
                              style={{ width: "calc(100% - 18px)", border: "none", fontSize: 10.5, color: "#888", fontWeight: 600, padding: 0, marginBottom: 3, background: "transparent", outline: "none" }} />
                            <button onClick={function() { setData(function(p) { var arr = (Array.isArray(p.company_info) ? p.company_info : []).slice(); arr.splice(ii, 1); return Object.assign({}, p, { company_info: arr }); }); }}
                              style={{ position: "absolute", top: 6, right: 6, background: "none", border: "none", cursor: "pointer", color: "#DDD", padding: 2 }}><Icon name="x" size={11} color="#DDD" /></button>
                            <textarea value={x.it.value || ""} placeholder="내용"
                              onChange={function(e) { var v = e.target.value; setData(function(p) { var arr = (Array.isArray(p.company_info) ? p.company_info : []).slice(); arr[ii] = Object.assign({}, arr[ii], { value: v }); return Object.assign({}, p, { company_info: arr }); }); }}
                              rows={1} style={{ width: "100%", border: "none", fontSize: 12.5, color: "#1A1917", padding: 0, background: "transparent", outline: "none", resize: "vertical", boxSizing: "border-box", fontFamily: "inherit", minHeight: 18 }} />
                          </div>
                        );
                      })}
                    </div>
                    <button onClick={function() { setData(function(p) { var arr = (Array.isArray(p.company_info) ? p.company_info : []).slice(); arr.push({ label: "", value: "" }); return Object.assign({}, p, { company_info: arr }); }); }}
                      style={{ background: "#fff", color: "#4338CA", border: "1px solid #C7D2FE", borderRadius: 7, padding: "6px 12px", fontSize: 11.5, fontWeight: 600, cursor: "pointer", marginBottom: 20 }}>
                      + 항목 추가
                    </button>
                  </>
                );
              })()}

              {/* 기타 메모 */}
              <div style={{ fontSize: 12, fontWeight: 700, color: "#555", marginBottom: 7, marginTop: 6 }}>📝 기타 (비고)</div>
              <textarea value={data.company_info_memo || ""} placeholder="비고·자유 입력"
                onChange={function(e) { var v = e.target.value; setData(function(p) { return Object.assign({}, p, { company_info_memo: v }); }); }}
                style={{ width: "100%", minHeight: 70, border: "1px solid #E8E5E0", borderRadius: 8, padding: "10px 12px", fontSize: 12.5, boxSizing: "border-box", outline: "none", resize: "vertical", fontFamily: "inherit", lineHeight: 1.5 }} />

              <div style={{ marginTop: 16 }}>
                <button onClick={function() { onSave(data); }} style={{ width: "100%", display: "flex", justifyContent: "center", alignItems: "center", gap: 6, background: "#15803D", color: "#fff", border: "none", borderRadius: 8, padding: "12px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                  <Icon name="save" size={14} color="#fff" /> 기업정보 저장
                </button>
              </div>
            </div>
          )}

          {tab === "docs" && (
            <div>
              {(function() {
                var reqList = (data.requested_docs || "").split(",").map(function(s) { return s.trim(); }).filter(Boolean);
                var recList = (data.received_docs || "").split(",").map(function(s) { return s.trim(); }).filter(Boolean);
                var reqDates = (data.doc_request_dates && typeof data.doc_request_dates === "object") ? data.doc_request_dates : {};
                var docStatus = function(doc) { if (recList.indexOf(doc) >= 0) return "received"; if (reqList.indexOf(doc) >= 0) return "requested"; return "none"; };
                var cycleDoc = function(doc) {
                  var st = docStatus(doc);
                  var nReq = reqList.slice(), nRec = recList.slice();
                  var nDates = Object.assign({}, reqDates);
                  if (st === "none") {
                    nReq.push(doc);
                    var t = new Date(); nDates[doc] = t.getFullYear() + "-" + String(t.getMonth() + 1).padStart(2, "0") + "-" + String(t.getDate()).padStart(2, "0"); // 요청한 오늘 날짜 기록
                  } else if (st === "requested") {
                    nReq = nReq.filter(function(d) { return d !== doc; }); nRec.push(doc);
                    delete nDates[doc]; // 수령완료되면 날짜 제거
                  } else {
                    nRec = nRec.filter(function(d) { return d !== doc; });
                    delete nDates[doc];
                  }
                  setData(function(p) { return Object.assign({}, p, { requested_docs: nReq.join(", "), received_docs: nRec.join(", "), doc_request_dates: nDates }); });
                };
                var noneList = DOC_LIST.filter(function(d) { return docStatus(d) === "none"; });
                var reqedList = DOC_LIST.filter(function(d) { return docStatus(d) === "requested"; });
                var recedList = DOC_LIST.filter(function(d) { return docStatus(d) === "received"; });
                return (
                  <>
                    <div style={{ fontSize: 11, color: "#888", marginBottom: 10, background: "#F7F6F3", borderRadius: 6, padding: "8px 11px" }}>💡 서류를 누르면 <b style={{ color: "#6B7280" }}>미요청</b> → <b style={{ color: "#B45309" }}>요청함</b> → <b style={{ color: "#15803D" }}>수령완료</b> 순으로 바뀝니다.</div>

                    {/* 1. 미요청 */}
                    <div style={{ background: "#F9FAFB", borderRadius: 8, padding: "12px 14px", marginBottom: 10, border: "1px solid #E5E7EB" }}>
                      <div style={{ fontSize: 11, color: "#6B7280", marginBottom: 8, fontWeight: 700 }}>⬜ 미요청 — 아직 요청 안 한 서류 (클릭 → 요청함) · {noneList.length}개</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {noneList.map(function(doc) {
                          return <button key={doc} onClick={function() { cycleDoc(doc); }} style={{ fontSize: 11, padding: "6px 11px", borderRadius: 99, border: "1px solid #D1D5DB", background: "#fff", color: "#6B7280", cursor: "pointer" }}>{doc}</button>;
                        })}
                        {noneList.length === 0 && <span style={{ fontSize: 11, color: "#888" }}>모두 요청했어요</span>}
                      </div>
                    </div>

                    {/* 2. 요청함(대기) */}
                    <div style={{ background: "#FFFBEB", borderRadius: 8, padding: "12px 14px", marginBottom: 10, border: "1px solid #FDE68A" }}>
                      <div style={{ fontSize: 11, color: "#B45309", marginBottom: 8, fontWeight: 700 }}>📤 요청함 — 요청했으나 아직 못 받은 서류 (클릭 → 수령완료) · {reqedList.length}개</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {reqedList.map(function(doc) {
                          var reqDate = reqDates[doc];
                          var days = null;
                          if (reqDate) {
                            var diff = Math.floor((new Date().setHours(0,0,0,0) - new Date(reqDate).setHours(0,0,0,0)) / 86400000);
                            days = diff;
                          }
                          var overdue = days !== null && days >= 3;
                          return <button key={doc} onClick={function() { cycleDoc(doc); }} style={{ fontSize: 11, padding: "6px 11px", borderRadius: 99, border: overdue ? "1px solid #DC2626" : "1px solid #FBBF24", background: overdue ? "#FEE2E2" : "#FEF3C7", color: overdue ? "#DC2626" : "#B45309", cursor: "pointer", fontWeight: 600 }}>{overdue ? "🔴" : "⏳"} {doc}{days !== null ? " (" + (days === 0 ? "오늘" : days + "일째") + ")" : ""}</button>;
                        })}
                        {reqedList.length === 0 && <span style={{ fontSize: 11, color: "#888" }}>요청 대기 중인 서류가 없어요</span>}
                      </div>
                    </div>

                    {/* 3. 수령완료 */}
                    <div style={{ background: "#F0FDF4", borderRadius: 8, padding: "12px 14px", border: "1px solid #BBF7D0" }}>
                      <div style={{ fontSize: 11, color: "#15803D", marginBottom: 8, fontWeight: 700 }}>✅ 수령완료 (클릭 → 미요청으로 되돌림) · {recedList.length}개</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {recedList.map(function(doc) {
                          return <button key={doc} onClick={function() { cycleDoc(doc); }} style={{ fontSize: 11, padding: "6px 11px", borderRadius: 99, border: "1px solid #15803D", background: "#15803D", color: "#fff", cursor: "pointer", fontWeight: 700 }}>✓ {doc}</button>;
                        })}
                        {recedList.length === 0 && <span style={{ fontSize: 11, color: "#888" }}>아직 수령된 서류가 없어요</span>}
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          )}

          {tab === "history" && (
            <>
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <div style={{ fontSize: 12, color: "#888", fontWeight: 600 }}>현재 이슈</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}><OcrButton target="issue" /><div style={{ fontSize: 10, color: "#888" }}>줄바꿈 가능 · 자유 형식</div></div>
                </div>
                <textarea value={data.issue || ""} onChange={function(e) { var v = e.target.value; setData(function(p) { return { ...p, issue: v }; }); }}
                  placeholder={"예시:\n- 신용점수 부족 (685점)\n- 매출 감소 추세\n- 5/30까지 보완서류 제출 필요"}
                  style={{ width: "100%", padding: "13px 15px", border: "1px solid #FED7AA", borderRadius: 8, fontSize: 13, lineHeight: 1.8, resize: "vertical", minHeight: 220, background: "#FFF7ED", color: "#92400E", boxSizing: "border-box", outline: "none", whiteSpace: "pre-wrap", fontFamily: "inherit" }} />
              </div>
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <div style={{ fontSize: 12, color: "#888", fontWeight: 600 }}>차기 업무 / 다음 액션</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}><OcrButton target="next_action" /><div style={{ fontSize: 10, color: "#888" }}>줄바꿈 가능 · 자유 형식</div></div>
                </div>
                <textarea value={data.next_action || ""} onChange={function(e) { var v = e.target.value; setData(function(p) { return { ...p, next_action: v }; }); }}
                  placeholder={"예시:\n1. 5/28 화요일 14시 - 추가서류 안내\n2. 5/30 금요일 - 기관 방문 동행\n3. 6/3 - 결과 확인 및 다음 단계 안내"}
                  style={{ width: "100%", padding: "13px 15px", border: "1px solid #E8E5E0", borderRadius: 8, fontSize: 13, lineHeight: 1.8, resize: "vertical", minHeight: 220, boxSizing: "border-box", outline: "none", whiteSpace: "pre-wrap", fontFamily: "inherit" }} />
              </div>
              {/* 📋 정보시트 첨부 → 소통 내역 자동 입력 (저장은 사용자가 직접) */}
              <div style={{ marginBottom: 10, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <label style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, color: "#4338CA", background: "#EEF2FF", border: "1px solid #C7D2FE", padding: "8px 14px", borderRadius: 8, cursor: infoSheetLoading ? "wait" : "pointer" }}>
                  {infoSheetLoading ? "정보시트 읽는 중..." : "📋 정보시트 첨부"}
                  <input type="file" accept=".xlsx,.xls" style={{ display: "none" }} disabled={infoSheetLoading}
                    onChange={function(e) { var f = e.target.files && e.target.files[0]; e.target.value = ""; handleInfoSheetAttach(f); }} />
                </label>
                <span style={{ fontSize: 10, color: "#AAA" }}>스크립트 정보시트(xlsx) → 아래 소통 내역에 자동 작성 (확인 후 저장)</span>
              </div>
              {/* 소통내역 박스 (이슈·액션 안에 통합) */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <div style={{ fontSize: 12, color: "#888", fontWeight: 600 }}>💬 소통 내역</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <label style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 11, fontWeight: 700, color: "#B45309", background: "#FEF3C7", padding: "4px 9px", borderRadius: 6, cursor: kakaoLoading ? "wait" : "pointer" }}>
                      {kakaoLoading ? "요약 중..." : "📷 카톡요약"}
                      <input type="file" accept="image/*" style={{ display: "none" }} disabled={kakaoLoading} onChange={function(e) { var f = e.target.files && e.target.files[0]; e.target.value = ""; handleKakaoImage(f); }} />
                    </label>
                    <div style={{ fontSize: 10, color: "#888" }}>붙여넣기·드래그 가능</div>
                  </div>
                </div>
                {kakaoLoading && <div style={{ fontSize: 11, color: "#B45309", marginBottom: 6, padding: "6px 10px", background: "#FEF9EC", borderRadius: 6 }}>🤖 카톡 대화를 읽고 요약하는 중입니다... (몇 초 걸려요)</div>}
                <textarea value={commInput}
                  onChange={function(e) { var v = e.target.value; setCommInput(v); }}
                  onPaste={function(e) {
                    var items = e.clipboardData && e.clipboardData.items;
                    if (!items) return;
                    for (var i = 0; i < items.length; i++) {
                      if (items[i].type && items[i].type.indexOf("image") === 0) {
                        e.preventDefault();
                        handleKakaoImage(items[i].getAsFile());
                        return;
                      }
                    }
                  }}
                  onDrop={function(e) {
                    var files = e.dataTransfer && e.dataTransfer.files;
                    if (files && files.length && files[0].type && files[0].type.indexOf("image") === 0) {
                      e.preventDefault();
                      handleKakaoImage(files[0]);
                    }
                  }}
                  onDragOver={function(e) { e.preventDefault(); }}
                  placeholder={"카톡 대화 캡처를 여기에 붙여넣기(Ctrl+V)하거나 끌어다 놓으면 AI가 요약해줘요.\n\n또는 직접 입력:\n- 10:30 통화 - 대표 부재중\n- 11:15 다시 통화\n- 다음 주 월요일 방문 예약"}
                  style={{ width: "100%", padding: "13px 15px", border: "1px solid #BAE6FD", borderRadius: 8, fontSize: 13, lineHeight: 1.8, resize: "vertical", minHeight: 220, background: "#F0F9FF", color: "#075985", boxSizing: "border-box", outline: "none", whiteSpace: "pre-wrap", fontFamily: "inherit" }} />
                <button onClick={saveCommLog} disabled={!commInput.trim()}
                  style={{ width: "100%", marginTop: 6, padding: "8px", background: commInput.trim() ? "#075985" : "#E8E5E0", color: commInput.trim() ? "#F0F9FF" : "#AAA", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: commInput.trim() ? "pointer" : "not-allowed" }}>
                  💬 소통 내역 저장
                </button>
                {/* 누적 소통 내역 표시 */}
                {commLogs.length > 0 && (
                  <div style={{ marginTop: 10, padding: "10px 12px", background: "#FAFAF8", borderRadius: 8, border: "1px solid #E8E5E0", maxHeight: 280, overflowY: "auto" }}>
                    <div style={{ fontSize: 11, color: "#888", fontWeight: 600, marginBottom: 8 }}>📋 누적 내역 ({commLogs.length}건)</div>
                    {commLogs.map(function(log, i) {
                      var isEditingThis = editingLogId === log.id;
                      var canEditThis = canEditLog(log);
                      return (
                        <div key={log.id || i} style={{ paddingBottom: 8, marginBottom: 8, borderBottom: i < commLogs.length - 1 ? "1px solid #F0EDE8" : "none" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                            <span style={{ fontSize: 10, color: "#888", fontWeight: 600 }}>{log.logged_by || "-"} · {log.created_at ? new Date(log.created_at).toLocaleString("ko-KR", { month: "numeric", day: "numeric", hour: "numeric", minute: "numeric" }) : "-"}</span>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              {canEditThis && !isEditingThis && (
                                <button onClick={function() { startEditLog(log); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#888", fontSize: 11, padding: "0 4px" }} title="수정">✏️</button>
                              )}
                              <button onClick={function() { if (confirm("이 소통 내역을 삭제할까요?")) deleteCommLog(log.id); }}
                                style={{ background: "none", border: "none", cursor: "pointer", color: "#888", fontSize: 11, padding: "0 4px" }} title="삭제">🗑</button>
                            </div>
                          </div>
                          {isEditingThis ? (
                            <div>
                              <textarea value={editingLogText} onChange={function(e) { setEditingLogText(e.target.value); }}
                                style={{ width: "100%", padding: "8px 10px", border: "1px solid #4338CA", borderRadius: 6, fontSize: 12, lineHeight: 1.5, resize: "vertical", minHeight: 60, boxSizing: "border-box", outline: "none", whiteSpace: "pre-wrap", fontFamily: "inherit" }} />
                              <div style={{ display: "flex", gap: 6, marginTop: 5, justifyContent: "flex-end" }}>
                                <button onClick={saveEditLog} disabled={!editingLogText.trim()} style={{ background: editingLogText.trim() ? "#4338CA" : "#E8E5E0", color: "#fff", border: "none", borderRadius: 5, padding: "5px 12px", fontSize: 11, fontWeight: 700, cursor: editingLogText.trim() ? "pointer" : "not-allowed" }}>저장</button>
                                <button onClick={function() { setEditingLogId(null); }} style={{ background: "#fff", color: "#888", border: "1px solid #E8E5E0", borderRadius: 5, padding: "5px 12px", fontSize: 11, cursor: "pointer" }}>취소</button>
                              </div>
                            </div>
                          ) : (
                            <div style={{ fontSize: 12, color: "#444", whiteSpace: "pre-wrap", lineHeight: 1.5 }}>{log.memo}</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}

          {/* 기관별 진행현황 탭 */}
          {tab === "agency" && (
            <div>
              {loadingExtra ? (
                <div style={{ textAlign: "center", padding: "40px 0", color: "#AAA", fontSize: 13 }}>불러오는 중...</div>
              ) : agencyCases.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 0", color: "#888", fontSize: 13 }}>
                  <div style={{ fontSize: 32, marginBottom: 10 }}>📋</div>
                  기관별 진행 데이터가 없어요
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                  {groupedAgency.map(function(grp) {
                    var grpObj = AGENCY_GROUPS.find(function(g) { return g.id === grp.key; });
                    var grpColor = grpObj ? grpObj.color : "#4338CA";
                    return (
                      <div key={grp.key}>
                        {/* 기관 섹션 헤더: 기관명 · 건수 · 최근 상태 · 승인 합계 */}
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                          <span style={{ fontSize: 12, padding: "3px 10px", borderRadius: 99, background: grpColor, color: "#fff", fontWeight: 700 }}>{grp.key}</span>
                          <span style={{ fontSize: 11, color: "#888", fontWeight: 600 }}>{grp.list.length}건</span>
                          {grp.latestStatus && <span style={{ fontSize: 11, color: "#555", background: "#F0EDE8", borderRadius: 99, padding: "2px 8px" }}>최근: {grp.latestStatus}</span>}
                          {grp.hasSum && <span style={{ fontSize: 11, color: "#0F6E56", fontWeight: 700, marginLeft: "auto" }}>승인 합계 {grp.sum.toLocaleString("ko-KR")}</span>}
                        </div>
                        {/* 케이스 카드 (월 역순) */}
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                          {grp.list.map(function(c, i) {
                            return (
                              <div key={c.id || i} style={{ background: "#F7F6F3", borderRadius: 10, padding: "14px 16px", border: "1px solid #E8E5E0" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                                  <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                                    {c.agency_sub && <span style={{ fontSize: 11, color: "#888" }}>{c.agency_sub}</span>}
                                    <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 99, background: "#fff", color: "#555", border: "1px solid #E8E5E0" }}>{c.status || "진행중"}</span>
                                  </div>
                                  <span style={{ fontSize: 11, color: "#AAA" }}>{c.year ? c.year + "년 " : ""}{c.month}월</span>
                                </div>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                                  {[
                                    { label: "신청금액", value: c.request_amount },
                                    { label: "신청상품", value: c.request_fund },
                                    { label: "담당자", value: c.assignee },
                                    { label: "신청일", value: c.application_date },
                                    { label: "승인결과", value: c.approval_result },
                                    { label: "승인금액", value: c.approved_amount },
                                  ].map(function(item) {
                                    return item.value ? (
                                      <div key={item.label} style={{ background: "#fff", borderRadius: 6, padding: "7px 10px" }}>
                                        <div style={{ fontSize: 10, color: "#AAA", marginBottom: 2 }}>{item.label}</div>
                                        <div style={{ fontSize: 12, fontWeight: 600, color: "#333" }}>{item.value}</div>
                                      </div>
                                    ) : null;
                                  })}
                                </div>
                                {c.notes && <div style={{ marginTop: 8, fontSize: 12, color: "#666", background: "#EEF2FF", borderRadius: 6, padding: "7px 10px" }}>{c.notes}</div>}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* 정산현황 탭 */}
          {tab === "settlement" && (
            <div>
              {loadingExtra ? (
                <div style={{ textAlign: "center", padding: "40px 0", color: "#AAA", fontSize: 13 }}>불러오는 중...</div>
              ) : settlements.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 0", color: "#888", fontSize: 13 }}>
                  <div style={{ fontSize: 32, marginBottom: 10 }}>💰</div>
                  정산 데이터가 없어요
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {settlements.map(function(s) {
                    return (
                      <div key={s.id} style={{ background: "#F7F6F3", borderRadius: 10, padding: "14px 16px", border: "1px solid #E8E5E0" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: "#1A1917" }}>{s.agency_group || "-"} · {s.month}월</span>
                          <div style={{ display: "flex", gap: 5 }}>
                            {s.invoice_issued && <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 99, background: "#ECFDF5", color: "#047857", fontWeight: 600 }}>세금계산서 발행</span>}
                            {s.fee_received && <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 99, background: "#EEF2FF", color: "#4338CA", fontWeight: 600 }}>입금완료</span>}
                          </div>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                          {[
                            { label: "신청금액", value: s.request_amount, color: "#333" },
                            { label: "계약금", value: s.contract_fee, color: "#333" },
                            { label: "수수료", value: s.commission_fee, color: "#7C3AED" },
                            { label: "입금금액", value: s.received_amount, color: "#047857" },
                            { label: "계약일", value: s.contract_date, color: "#555" },
                            { label: "입금일", value: s.fee_received_date, color: "#555" },
                          ].map(function(item) {
                            return item.value ? (
                              <div key={item.label} style={{ background: "#fff", borderRadius: 6, padding: "7px 10px" }}>
                                <div style={{ fontSize: 10, color: "#AAA", marginBottom: 2 }}>{item.label}</div>
                                <div style={{ fontSize: 12, fontWeight: 700, color: item.color }}>{item.value}</div>
                              </div>
                            ) : null;
                          })}
                        </div>
                        {s.settlement_notes && <div style={{ marginTop: 8, fontSize: 12, color: "#666", background: "#FFF7ED", borderRadius: 6, padding: "7px 10px" }}>{s.settlement_notes}</div>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* AI 상담 탭 */}
          {tab === "ai" && (
            <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
              <div style={{ marginBottom: 10 }}>
                <button onClick={function() { setTab(prevTab === "ai" ? "info" : prevTab); }} title="뒤로가기"
                  style={{ display: "flex", alignItems: "center", gap: 4, background: "#fff", border: "1px solid #E8E5E0", borderRadius: 8, padding: "6px 10px", fontSize: 12, fontWeight: 700, color: "#555", cursor: "pointer" }}>
                  ← 뒤로
                </button>
              </div>
              <div style={{ fontSize: 11, color: "#888", background: "#F0F5FF", border: "1px solid #DBE5FF", borderRadius: 8, padding: "8px 12px", marginBottom: 12 }}>
                🤖 이 업체({data.name})의 데이터만 참고해 답합니다. 비밀번호·인증서 등 민감정보는 AI에 전달하지 않습니다.
              </div>
              {aiMsgs.length === 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
                  {["현재 진행상황 요약해줘", "다음에 할 일은?", "부결/보류 사유 정리해줘", "정산 현황 알려줘"].map(function(ex) {
                    return (
                      <button key={ex} onClick={function() { setAiInput(ex); }}
                        style={{ fontSize: 11, padding: "5px 10px", borderRadius: 99, border: "1px solid #C7D2FE", background: "#EEF2FF", color: "#4338CA", cursor: "pointer" }}>
                        {ex}
                      </button>
                    );
                  })}
                </div>
              )}
              <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10, minHeight: 200, marginBottom: 12 }}>
                {aiMsgs.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "40px 0", color: "#888", fontSize: 13 }}>
                    <div style={{ fontSize: 32, marginBottom: 10 }}>💬</div>
                    이 업체에 대해 궁금한 걸 물어보세요
                  </div>
                ) : aiMsgs.map(function(m, i) {
                  var isUser = m.role === "user";
                  return (
                    <div key={i} style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start" }}>
                      <div style={{ maxWidth: "82%", background: isUser ? "#1A1917" : "#F7F6F3", color: isUser ? "#F7F6F3" : "#1A1917", border: isUser ? "none" : "1px solid #E8E5E0", borderRadius: 12, padding: "10px 14px", fontSize: 13, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
                        {m.content}
                      </div>
                    </div>
                  );
                })}
                {aiLoading && (
                  <div style={{ display: "flex", justifyContent: "flex-start" }}>
                    <div style={{ background: "#F7F6F3", border: "1px solid #E8E5E0", borderRadius: 12, padding: "10px 14px", fontSize: 13, color: "#AAA" }}>생각 중…</div>
                  </div>
                )}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <textarea value={aiInput} onChange={function(e) { setAiInput(e.target.value); }}
                  onKeyDown={function(e) { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendAiCompany(); } }}
                  placeholder="질문 입력 후 Enter (줄바꿈은 Shift+Enter)"
                  rows={2} style={{ flex: 1, padding: "10px 12px", border: "1px solid #E8E5E0", borderRadius: 8, fontSize: 13, resize: "none", boxSizing: "border-box", outline: "none", fontFamily: "inherit", lineHeight: 1.5 }} />
                <button onClick={sendAiCompany} disabled={!aiInput.trim() || aiLoading}
                  style={{ padding: "0 18px", background: (aiInput.trim() && !aiLoading) ? "#4338CA" : "#E8E5E0", color: (aiInput.trim() && !aiLoading) ? "#fff" : "#AAA", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: (aiInput.trim() && !aiLoading) ? "pointer" : "not-allowed", whiteSpace: "nowrap" }}>
                  전송
                </button>
              </div>
            </div>
          )}

          {/* 소통내역 탭 */}
          {tab === "comm" && (
            <div>
              {/* 소통 입력 */}
              <div style={{ background: "#F7F6F3", borderRadius: 10, padding: "14px", marginBottom: 16, border: "1px solid #E8E5E0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#555" }}>소통 내용 기록</div>
                  <div style={{ fontSize: 10, color: "#888" }}>줄바꿈 가능 · 여러 줄 OK</div>
                </div>
                <textarea value={commInput} onChange={function(e) { var v = e.target.value; setCommInput(v); }}
                  placeholder={"예시:\n- 10:30 통화 - 대표 부재중\n- 11:15 다시 통화\n- 다음 주 월요일 방문 예약"}
                  rows={12} style={{ width: "100%", padding: "12px 14px", border: "1px solid #E8E5E0", borderRadius: 8, fontSize: 13, resize: "vertical", boxSizing: "border-box", outline: "none", lineHeight: 1.8, minHeight: 260, fontFamily: "inherit", whiteSpace: "pre-wrap" }} />
                <button onClick={saveCommLog} disabled={!commInput.trim()}
                  style={{ width: "100%", marginTop: 8, padding: "10px", background: commInput.trim() ? "#1A1917" : "#E8E5E0", color: commInput.trim() ? "#F7F6F3" : "#AAA", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: commInput.trim() ? "pointer" : "not-allowed" }}>
                  저장
                </button>
              </div>
              {/* 소통 로그 목록 */}
              {loadingExtra ? (
                <div style={{ textAlign: "center", padding: "20px 0", color: "#AAA", fontSize: 13 }}>불러오는 중...</div>
              ) : commLogs.length === 0 ? (
                <div style={{ textAlign: "center", padding: "30px 0", color: "#888", fontSize: 13 }}>아직 소통 내역이 없어요</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {commLogs.map(function(log, i) {
                    var d = new Date(log.created_at);
                    var ts = d.toLocaleDateString("ko-KR", { month: "short", day: "numeric" }) + " " + d.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
                    var isEditing = editingLogId === log.id;
                    var canEdit = canEditLog(log);
                    return (
                      <div key={log.id} style={{ display: "flex", gap: 10 }}>
                        <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#1A1917", color: "#F7F6F3", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                          {(log.assignee || log.logged_by || "?")[0]}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, alignItems: "center" }}>
                            <span style={{ fontSize: 12, fontWeight: 600 }}>{log.assignee || log.logged_by || "-"}</span>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <span style={{ fontSize: 11, color: "#AAA" }}>{ts}</span>
                              {canEdit && !isEditing && (
                                <>
                                  <button onClick={function() { startEditLog(log); }} title="수정"
                                    style={{ background: "none", border: "none", cursor: "pointer", padding: 2, fontSize: 11, color: "#888" }}>✏️</button>
                                  <button onClick={function() { deleteCommLog(log.id); }} title="삭제"
                                    style={{ background: "none", border: "none", cursor: "pointer", padding: 2, fontSize: 11, color: "#CC4444" }}>🗑</button>
                                </>
                              )}
                            </div>
                          </div>
                          {isEditing ? (
                            <div>
                              <textarea value={editingLogText} onChange={function(e) { setEditingLogText(e.target.value); }}
                                style={{ width: "100%", padding: "10px 13px", border: "1px solid #4338CA", borderRadius: 8, fontSize: 13, lineHeight: 1.7, resize: "vertical", minHeight: 80, boxSizing: "border-box", outline: "none", whiteSpace: "pre-wrap", fontFamily: "inherit" }} />
                              <div style={{ display: "flex", gap: 6, marginTop: 6, justifyContent: "flex-end" }}>
                                <button onClick={cancelEditLog} style={{ padding: "5px 12px", background: "#fff", border: "1px solid #E8E5E0", borderRadius: 6, fontSize: 11, color: "#666", cursor: "pointer" }}>취소</button>
                                <button onClick={saveEditLog} disabled={!editingLogText.trim()}
                                  style={{ padding: "5px 12px", background: editingLogText.trim() ? "#1A1917" : "#E8E5E0", color: editingLogText.trim() ? "#fff" : "#AAA", border: "none", borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: editingLogText.trim() ? "pointer" : "not-allowed" }}>저장</button>
                              </div>
                            </div>
                          ) : (
                            <div style={{ fontSize: 13, color: "#333", lineHeight: 1.7, background: "#F7F6F3", borderRadius: 8, padding: "10px 13px", whiteSpace: "pre-wrap" }}>
                              {log.memo || log.note || "-"}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 기업현황표 자동입력 미리보기 모달 */}
        {xlsxPreview && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={function() { setXlsxPreview(null); setXlsxCommDraft(""); }}>
            <div onClick={function(e) { e.stopPropagation(); }} style={{ background: "#fff", borderRadius: 12, maxWidth: 460, width: "100%", maxHeight: "80vh", overflow: "auto", padding: 22, boxSizing: "border-box" }}>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>📄 {xlsxPreview.kind === "시트지" ? "시트지" : "기업현황표"} 자동 입력 미리보기</div>
              <div style={{ fontSize: 11.5, color: "#888", marginBottom: 14, lineHeight: 1.5 }}>인식된 항목은 기업정보로 채워지고, <b style={{ color: "#075985" }}>나머지 내용은 소통내역에 자동 기록</b>됩니다. 기존 값이 있으면 <b style={{ color: "#B45309" }}>덮어쓰기</b> 됩니다.</div>
              {(function() {
                var u = xlsxPreview.updates;
                var basicKeys = Object.keys(u).filter(function(k) { return FIELD_LABELS_X[k]; });
                var fmt = function(k, v) { return (String(k).indexOf("revenue") === 0 && v) ? Number(v).toLocaleString() + "원" : String(v == null ? "" : v); };
                if (basicKeys.length === 0 && !u.loans && !u.company_info && !u.company_info_memo) {
                  if ((xlsxCommDraft || "").trim()) {
                    return <div style={{ fontSize: 12.5, color: "#075985", padding: "8px 10px", background: "#F0F9FF", borderRadius: 6 }}>인식된 기업정보 항목은 없지만, 아래 내용이 소통내역에 기록됩니다.</div>;
                  }
                  return <div style={{ fontSize: 13, color: "#888", padding: "10px 0" }}>추출된 정보가 없습니다. 양식을 확인해주세요.</div>;
                }
                return (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {basicKeys.map(function(k) {
                      var oldV = data[k];
                      var hasOld = oldV !== null && oldV !== undefined && String(oldV) !== "";
                      return (
                        <div key={k} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, padding: "6px 10px", background: "#F7F6F3", borderRadius: 6 }}>
                          <span style={{ color: "#888", width: 86, flexShrink: 0, fontWeight: 600 }}>{FIELD_LABELS_X[k]}</span>
                          {hasOld
                            ? <span style={{ flex: 1 }}><span style={{ color: "#888", textDecoration: "line-through" }}>{fmt(k, oldV)}</span> <span style={{ color: "#B45309" }}>→</span> <b>{fmt(k, u[k])}</b></span>
                            : <b style={{ flex: 1 }}>{fmt(k, u[k])}</b>}
                        </div>
                      );
                    })}
                    {u.loans && <div style={{ fontSize: 12.5, padding: "6px 10px", background: "#EEF2FF", borderRadius: 6, color: "#4338CA", fontWeight: 600 }}>💰 기대출 내역 {u.loans.length}건 {Array.isArray(data.loans) && data.loans.length > 0 ? "(기존 " + data.loans.length + "건 교체)" : ""}</div>}
                    {u.company_info && <div style={{ fontSize: 12.5, padding: "6px 10px", background: "#EEF2FF", borderRadius: 6, color: "#4338CA", fontWeight: 600 }}>📋 기업정보 {u.company_info.length}개 항목</div>}
                    {u.company_info_memo && <div style={{ fontSize: 12.5, padding: "6px 10px", background: "#EEF2FF", borderRadius: 6, color: "#4338CA", fontWeight: 600 }}>📝 비고 메모</div>}
                  </div>
                );
              })()}
              {/* 📨 소통내역에 자동 기록될 내용 (수정 가능, 비우면 기록 안 함) */}
              <div style={{ marginTop: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#075985", marginBottom: 5 }}>📨 소통내역에 기록될 내용 <span style={{ fontSize: 10.5, color: "#888", fontWeight: 500 }}>(수정 가능 · 비우면 기록 안 함)</span></div>
                <textarea value={xlsxCommDraft} onChange={function(e) { setXlsxCommDraft(e.target.value); }}
                  placeholder="기업정보로 인식되지 않은 나머지 내용이 여기에 정리됩니다."
                  style={{ width: "100%", minHeight: 90, boxSizing: "border-box", fontSize: 12, lineHeight: 1.5, padding: "8px 10px", border: "1px solid #BAE6FD", borderRadius: 7, background: "#F0F9FF", resize: "vertical", fontFamily: "inherit" }} />
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
                <button onClick={applyXlsxPreview} style={{ flex: 1, background: "#15803D", color: "#fff", border: "none", borderRadius: 8, padding: "11px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>✓ 적용하기</button>
                <button onClick={function() { setXlsxPreview(null); setXlsxCommDraft(""); }} style={{ background: "#fff", color: "#888", border: "1px solid #E8E5E0", borderRadius: 8, padding: "11px 18px", fontSize: 13, cursor: "pointer" }}>취소</button>
              </div>
              <div style={{ fontSize: 11, color: "#AAA", marginTop: 10, textAlign: "center" }}>적용 후 반드시 저장 버튼을 눌러야 DB에 반영됩니다</div>
            </div>
          </div>
        )}

        {/* 저장 버튼 */}
        <div style={{ padding: "14px 24px", borderTop: "1px solid #E8E5E0", display: "flex", gap: 8 }}>
          <button onClick={() => onSave({ ...data, name: nameInput || data.name }, company)}
            style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, background: "#1A1917", color: "#F7F6F3", border: "none", borderRadius: 8, padding: "12px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
            <Icon name="save" size={15} color="#F7F6F3" /> DB에 저장
          </button>
          <button onClick={async function() {
            if (!data.agency) { alert("담당기관을 선택해주세요!"); return; }
            var AGENCY_MAP = {
              "소상공인시장진흥공단": "소상공인시장진흥공단",
              "중소벤처기업진흥공단": "중소벤처기업진흥공단",
              "신용보증기금": "신용보증기금",
              "농협신용보증기금": "농협신용보증기금",
              "기술보증기금": "기술보증기금",
              "신용보증재단": "신용보증재단",
              "서민금융진흥원": "신용보증재단",
              "구조혁신&사업전환": "구조혁신&사업전환",
              "기타": "기타",
            };
            var companyName = nameInput || data.name;
            var rawAgencies = data.agency.split(",").map(function(a) { return a.trim(); }).filter(Boolean);
            var mappedGroups = [];
            rawAgencies.forEach(function(a) {
              var g = AGENCY_MAP[a];
              if (g && mappedGroups.indexOf(g) === -1) mappedGroups.push(g);
            });
            if (mappedGroups.length === 0) { alert("매핑된 기관이 없어요!"); return; }

            // 기관별로 등록 월 입력받기
            var nowDate = new Date();
            var defaultYM = nowDate.getFullYear() + "-" + String(nowDate.getMonth() + 1).padStart(2, "0");
            // 기본값: data.application_month가 있으면 그걸, 없으면 이번 달
            var baseDefault = data.application_month || defaultYM;
            var agencyMonths = {}; // { 기관명: "2026-05" }
            for (var ai = 0; ai < mappedGroups.length; ai++) {
              var agName = mappedGroups[ai];
              var promptMsg = "[" + agName + "]\n어느 월에 등록할까요?\n형식: YYYY-MM (예: 2026-05)";
              if (mappedGroups.length > 1) {
                promptMsg = "(" + (ai + 1) + "/" + mappedGroups.length + ") " + promptMsg;
              }
              var inputYM = prompt(promptMsg, baseDefault);
              if (inputYM === null) return; // 취소 → 전체 등록 취소
              inputYM = inputYM.trim() || baseDefault;
              if (!/^\d{4}-\d{2}$/.test(inputYM)) {
                alert("형식이 올바르지 않습니다. 예: 2026-05\n등록을 취소합니다.");
                return;
              }
              var mNum = parseInt(inputYM.split("-")[1], 10);
              if (mNum < 1 || mNum > 12) {
                alert("월은 1~12 사이여야 합니다.\n등록을 취소합니다.");
                return;
              }
              agencyMonths[agName] = inputYM;
              baseDefault = inputYM; // 다음 기관 기본값을 직전에 입력한 값으로
            }

            // 기관별로 각각 등록
            var addedCount = 0;
            var skippedCount = 0;
            var errorMessages = [];
            var registeredGroups = []; // 첫 번째 등록된 기관/월 (이동용)
            for (var gi = 0; gi < mappedGroups.length; gi++) {
              var agencyGroup = mappedGroups[gi];
              var ym = agencyMonths[agencyGroup];
              var monthNum = parseInt(ym.split("-")[1], 10);
              var yearNum = parseInt(ym.split("-")[0], 10);
              // 중복 체크
              var existing = await supabase.from("agency_cases")
                .select("id")
                .eq("business_name", companyName)
                .eq("agency_group", agencyGroup)
                .eq("month", monthNum)
                .eq("year", yearNum)
                .is("deleted_at", null);
              if (existing.data && existing.data.length > 0) {
                skippedCount++;
                continue;
              }
              var insertData = {
                business_name: companyName,
                agency_group: agencyGroup,
                month: monthNum,
                year: yearNum,
                assignee: Array.isArray(data.assignee) ? data.assignee.join(", ") : (data.assignee || ""),
                representative: data.representative || null,
                business_number: data.business_number || null,
                region: data.region || null,
                notes: null,
                contract_date: data.contract_date || null,
                status: "시작 전",
              };
              var ins = await supabase.from("agency_cases").insert(insertData);
              if (!ins.error) {
                addedCount++;
                if (registeredGroups.length === 0) {
                  registeredGroups.push({ group: agencyGroup, month: monthNum });
                }
              } else {
                errorMessages.push(agencyGroup + ": " + ins.error.message);
              }
            }
            if (errorMessages.length > 0) {
              alert("❌ 등록 실패!\n" + errorMessages.join("\n"));
              return;
            }
            // 등록 결과 메시지 (기관별 월 표시)
            var detailMsg = mappedGroups.map(function(g) { return g + " → " + agencyMonths[g]; }).join("\n");
            var msg = "";
            if (addedCount > 0) msg += "기관별현황에 " + addedCount + "건 등록됐어요!\n\n" + detailMsg + "\n";
            if (skippedCount > 0) msg += "\n(이미 등록된 " + skippedCount + "건은 건너뛰었어요)\n";
            if (!msg) { alert("등록된 건이 없어요 (모두 중복)"); return; }
            msg += "\n확인을 누르면 기관별 현황으로 이동합니다.";
            alert(msg);
            // 약간 기다린 후 페이지 이동 (DB 반영 대기)
            await new Promise(function(r) { setTimeout(r, 300); });
            if (registeredGroups.length > 0) {
              window.location.href = window.location.origin + "?view=agency&month=" + registeredGroups[0].month + "&group=" + encodeURIComponent(registeredGroups[0].group);
            }
          }}
            style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, background: "#4338CA", color: "#fff", border: "none", borderRadius: 8, padding: "12px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
            <Icon name="building" size={15} color="#fff" /> 기관별현황에 등록
          </button>
          <button onClick={onClose}
            style={{ padding: "12px 18px", background: "#fff", color: "#888", border: "1px solid #E8E5E0", borderRadius: 8, fontSize: 13, cursor: "pointer" }}>
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}

// ── 신규 등록 모달 ─────────────────────────────────────────────────────────────
function AddModal({ onClose, onAdd, assignees, companies }) {
  // 신규 등록 모달 - 한 화면에 모든 필드 + 기업현황표 자동 입력
  const [form, setForm] = useState({
    // 기본 정보
    name: "", type: "법인", representative: "", phone: "",
    stage: "상담/진단완료", assignee: "", agency_list: [],
    business_type: "법인사업자", industry: "", team: "개인팀",
    // 추가 정보
    business_number: "",
    employee_count: "",
    credit_score_kcb: "",
    credit_score_nice: "",
    founded_year: "",
    founded_month: "",
    contract_date: "",
    region: "",
    revenue_2023: "",
    revenue_2024: "",
    revenue_2025: "",
    revenue_2026_h1: "",
    issue: "",
    next_action: "",
    application_month: "",
  });
  // 자동 입력된 필드 추적 (초록 표시용)
  const [autoFilled, setAutoFilled] = useState({});
  // 첨부 파일명 표시용
  const [attachedFile, setAttachedFile] = useState(null);
  // 팀을 사용자가 직접 골랐는지 여부 (true면 업체명 변경해도 자동 갱신 안 함)
  const [teamTouched, setTeamTouched] = useState(false);

  const set = function(k, v) { setForm(function(p) { return Object.assign({}, p, { [k]: v }); }); };
  const setMulti = function(obj) { setForm(function(p) { return Object.assign({}, p, obj); }); };
  // 사용자가 수정하면 자동입력 표시 해제
  const setManual = function(k, v) {
    setForm(function(p) { return Object.assign({}, p, { [k]: v }); });
    if (autoFilled[k]) setAutoFilled(function(p) { var n = Object.assign({}, p); delete n[k]; return n; });
  };
  const toggleAgency = function(a) {
    setForm(function(p) {
      var cur = p.agency_list || [];
      var next = cur.includes(a) ? cur.filter(function(x) { return x !== a; }) : cur.concat([a]);
      return Object.assign({}, p, { agency_list: next });
    });
  };
  const toggleAssignee = function(a) {
    setForm(function(p) {
      var cur = (p.assignee || "").split(", ").filter(Boolean);
      var next = cur.includes(a) ? cur.filter(function(x) { return x !== a; }) : cur.concat([a]);
      return Object.assign({}, p, { assignee: next.join(", ") });
    });
  };

  // 자동 입력된 필드 스타일
  const autoStyle = function(k) {
    if (autoFilled[k]) {
      return { background: "#ECFDF5", borderColor: "#86EFAC", borderWidth: 1, borderStyle: "solid" };
    }
    return { background: "#F7F6F3" };
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}
      onMouseDown={function(e) { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: "#fff", borderRadius: 14, width: 480, maxHeight: "92vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
        <div style={{ padding: "20px 24px 14px", borderBottom: "1px solid #E8E5E0", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, background: "#fff", zIndex: 1 }}>
          <div>
            <div style={{ display: "inline-block", padding: "2px 8px", background: "#EEF2FF", color: "#4338CA", borderRadius: 4, fontSize: 10, fontWeight: 700, marginBottom: 4 }}>신규 등록</div>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>새 업체 추가</h2>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer" }}><Icon name="x" size={18} color="#888" /></button>
        </div>

        {/* 📄 기업현황표 첨부 영역 */}
        <div style={{ padding: "12px 24px", background: "#FFFBEB", borderBottom: "1px solid #E8E5E0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 14 }}>📄</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#92400E" }}>기업현황표·시트지 첨부 (자동 입력)</span>
            {attachedFile && (
              <span style={{ fontSize: 10, color: "#15803D", fontWeight: 700, marginLeft: "auto" }}>✓ {attachedFile}</span>
            )}
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 12px", background: "#fff", border: "1px dashed #FDE68A", borderRadius: 7, cursor: "pointer" }}>
            <span style={{ fontSize: 14, color: "#B45309" }}>📎</span>
            <span style={{ fontSize: 11, color: "#888", flex: 1 }}>{attachedFile || "기업현황표.xlsx 또는 시트지 파일 선택"}</span>
            <span style={{ fontSize: 10, padding: "3px 10px", background: "#B45309", color: "#fff", borderRadius: 4, fontWeight: 700 }}>파일 선택</span>
            <input type="file" accept=".xlsx,.xls" style={{ display: "none" }}
              onChange={async function(e) {
                var file = e.target.files && e.target.files[0];
                if (!file) return;
                setAttachedFile(file.name);
                try {
                  var res = await parseUploadedSheet(file);
                  var upd = Object.assign({}, res.updates);
                  var extra = (res.commText || "").trim();
                  if (extra) {
                    // 신규등록엔 아직 소통내역이 없으므로 나머지 내용을 비고 메모에 보존 (등록 후 소통내역에서 이어쓰기 가능)
                    setForm(function(p) {
                      var prev = (p.company_info_memo || "").trim();
                      var addition = "📄 " + res.kind + " 업로드 내용\n" + extra;
                      return Object.assign({}, p, upd, { company_info_memo: prev ? prev + "\n\n" + addition : addition });
                    });
                  } else {
                    setMulti(upd);
                  }
                  setAutoFilled(function(p) { return Object.assign({}, p, res.auto); });
                  var msg = "📄 자동 입력 " + Object.keys(res.auto).length + "개 완료!";
                  if (extra) msg += "\n📝 인식 안 된 나머지 내용은 '비고'에 담았어요.";
                  alert(msg + "\n확인 후 빈 칸 보완해서 등록하세요.");
                } catch (err) {
                  console.error("시트 파싱 오류:", err);
                  alert("❌ 엑셀 읽기 실패: " + err.message + "\n\n엑셀(.xlsx) 파일이 맞는지 확인해주세요.");
                  setAttachedFile(null);
                }
              }} />
          </label>
          <div style={{ fontSize: 10, color: "#888", marginTop: 5, lineHeight: 1.5 }}>기업현황표·시트지 첨부하면 회사명·대표자·매출·신용점수 등이 자동 채워지고, 나머지 내용은 비고에 담깁니다. 첨부 안 해도 직접 입력 가능.</div>
        </div>

        <div style={{ padding: "18px 24px" }}>
          {/* 업체명 */}
          <div style={{ background: "#F7F6F3", borderRadius: 8, padding: "10px 13px", marginBottom: 10 }}>
            <div style={{ fontSize: 11, color: "#888", marginBottom: 5 }}>업체명 *</div>
            <input value={form.name} onChange={function(e) { var v = e.target.value; set("name", v); if (!teamTouched) set("team", teamByName(v)); }} autoFocus
              style={{ width: "100%", fontSize: 13, fontWeight: 600, background: "transparent", border: "none", outline: "none" }} />
          </div>

          {/* 대표자 + 연락처 */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
            <div style={{ background: "#F7F6F3", borderRadius: 8, padding: "10px 13px" }}>
              <div style={{ fontSize: 11, color: "#888", marginBottom: 5 }}>대표자명 *</div>
              <input value={form.representative} onChange={function(e) { set("representative", e.target.value); }}
                style={{ width: "100%", fontSize: 13, fontWeight: 600, background: "transparent", border: "none", outline: "none" }} />
            </div>
            <div style={{ background: "#F7F6F3", borderRadius: 8, padding: "10px 13px" }}>
              <div style={{ fontSize: 11, color: "#888", marginBottom: 5 }}>연락처</div>
              <input value={form.phone} placeholder="01012345678" onChange={function(e) { set("phone", formatPhone(e.target.value)); }}
                style={{ width: "100%", fontSize: 13, fontWeight: 600, background: "transparent", border: "none", outline: "none" }} />
            </div>
          </div>

          {/* 사업자등록번호 */}
          <div style={Object.assign({ borderRadius: 8, padding: "10px 13px", marginBottom: 10 }, autoStyle("business_number"))}>
            <div style={{ fontSize: 11, color: "#888", marginBottom: 5 }}>사업자등록번호 {autoFilled.business_number && <span style={{ color: "#15803D", fontSize: 9, fontWeight: 700 }}>✓ 자동</span>}</div>
            <input value={form.business_number} placeholder="1234567890" onChange={function(e) { setManual("business_number", formatBizNumber(e.target.value)); }}
              style={{ width: "100%", fontSize: 13, fontWeight: 600, background: "transparent", border: "none", outline: "none" }} />
          </div>

          {/* KCB/NICE + 종업원수 */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
            <div style={Object.assign({ borderRadius: 8, padding: "10px 13px" }, autoStyle("credit_score"))}>
              <div style={{ fontSize: 11, color: "#888", marginBottom: 5 }}>KCB / NICE {(autoFilled.credit_score_kcb || autoFilled.credit_score_nice) && <span style={{ color: "#15803D", fontSize: 9, fontWeight: 700 }}>✓ 자동</span>}</div>
              <input type="text" inputMode="numeric" value={(form.credit_score_kcb || "") + (form.credit_score_nice ? " / " + form.credit_score_nice : "")}
                placeholder="KCB / NICE"
                onChange={function(e) { var raw = e.target.value.replace(/[^0-9]/g, ""); var kcb = raw.slice(0, 3); var nice = raw.slice(3, 6); setMulti({ credit_score_kcb: kcb, credit_score_nice: nice }); setAutoFilled(function(p) { var n = Object.assign({}, p); delete n.credit_score_kcb; delete n.credit_score_nice; return n; }); }}
                style={{ width: "100%", fontSize: 13, fontWeight: 600, background: "transparent", border: "none", outline: "none" }} />
            </div>
            <div style={Object.assign({ borderRadius: 8, padding: "10px 13px" }, autoStyle("employee_count"))}>
              <div style={{ fontSize: 11, color: "#888", marginBottom: 5 }}>종업원 수 {autoFilled.employee_count && <span style={{ color: "#15803D", fontSize: 9, fontWeight: 700 }}>✓ 자동</span>}</div>
              <input type="number" value={form.employee_count} placeholder="명" onChange={function(e) { setManual("employee_count", e.target.value); }}
                style={{ width: "100%", fontSize: 13, fontWeight: 600, background: "transparent", border: "none", outline: "none" }} />
            </div>
          </div>

          {/* 설립연월 + 계약일 */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
            <div style={Object.assign({ borderRadius: 8, padding: "10px 13px" }, autoStyle("founded_year"))}>
              <div style={{ fontSize: 11, color: "#888", marginBottom: 5 }}>설립연월 {autoFilled.founded_year && <span style={{ color: "#15803D", fontSize: 9, fontWeight: 700 }}>✓ 자동</span>}</div>
              <input type="text" inputMode="numeric"
                value={(function() { if (!form.founded_year && !form.founded_month) return ""; var y = form.founded_year || ""; var m = form.founded_month; if (!m && m !== 0) return y; return y + "-" + String(m); })()}
                placeholder="YYYY-MM (예: 2018-08)"
                onChange={function(e) { var raw = e.target.value.replace(/[^0-9]/g, ""); var year = raw.slice(0, 4); var monthRaw = raw.slice(4, 6); var monthNum; if (monthRaw.length === 0) { monthNum = ""; } else { monthNum = parseInt(monthRaw); if (monthNum > 12) monthNum = 12; } setMulti({ founded_year: year, founded_month: monthNum }); setAutoFilled(function(p) { var n = Object.assign({}, p); delete n.founded_year; delete n.founded_month; return n; }); }}
                style={{ width: "100%", fontSize: 13, fontWeight: 600, background: "transparent", border: "none", outline: "none" }} />
            </div>
            <div style={{ background: "#F7F6F3", borderRadius: 8, padding: "10px 13px" }}>
              <div style={{ fontSize: 11, color: "#888", marginBottom: 5 }}>계약일</div>
              <input type="date" value={form.contract_date} onChange={function(e) { set("contract_date", e.target.value); }}
                style={{ width: "100%", fontSize: 13, fontWeight: 600, background: "transparent", border: "none", outline: "none" }} />
            </div>
          </div>

          {/* 지역 */}
          <div style={Object.assign({ borderRadius: 8, padding: "10px 13px", marginBottom: 10 }, autoStyle("region"))}>
            <div style={{ fontSize: 11, color: "#888", marginBottom: 5 }}>지역 {autoFilled.region && <span style={{ color: "#15803D", fontSize: 9, fontWeight: 700 }}>✓ 자동</span>}</div>
            <input value={form.region} placeholder="예: 서울_강남, 경기_안산" onChange={function(e) { setManual("region", e.target.value); }}
              style={{ width: "100%", fontSize: 13, fontWeight: 600, background: "transparent", border: "none", outline: "none" }} />
          </div>

          {/* 최근 3개년 매출액 */}
          <div style={Object.assign({ borderRadius: 8, padding: "13px 15px", marginBottom: 10 }, (autoFilled.revenue_2023 || autoFilled.revenue_2024 || autoFilled.revenue_2025) ? { background: "#ECFDF5", borderColor: "#86EFAC", borderWidth: 1, borderStyle: "solid" } : { background: "#F7F6F3" })}>
            <div style={{ fontSize: 12, color: "#888", marginBottom: 4, fontWeight: 600, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>매출액 (최근 3개년 + 26년 상반기)</span>
              {(autoFilled.revenue_2023 || autoFilled.revenue_2024 || autoFilled.revenue_2025) && <span style={{ color: "#15803D", fontSize: 10, fontWeight: 700 }}>✓ 자동</span>}
            </div>
            <div style={{ fontSize: 10, color: "#AAA", marginBottom: 10 }}>원 단위로 입력 (예: 790000000 → 7.9억 자동 표시)</div>
            <div style={{ display: "flex", gap: 8 }}>
              {[["2023년", "revenue_2023"], ["2024년", "revenue_2024"], ["2025년", "revenue_2025"], ["26년 상반기", "revenue_2026_h1"]].map(function(pair) {
                var label = pair[0]; var key = pair[1];
                return (
                  <div key={key} style={{ flex: 1, textAlign: "center", background: "#fff", borderRadius: 7, padding: "10px 8px" }}>
                    <div style={{ fontSize: 11, color: "#AAA", marginBottom: 4 }}>{label}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#4338CA", marginBottom: 4 }}>{formatRevenue(form[key])}</div>
                    <input
                      type="number"
                      placeholder="원 단위 입력"
                      value={form[key] || ""}
                      onChange={function(e) {
                        var v = e.target.value;
                        setManual(key, v ? parseInt(v) || "" : "");
                      }}
                      style={{ width: "100%", fontSize: 11, textAlign: "center", border: "1px solid #E8E5E0", borderRadius: 5, padding: "4px", outline: "none", boxSizing: "border-box" }} />
                  </div>
                );
              })}
            </div>
          </div>

          {/* 사업자 유형 */}
          <div style={{ background: "#F7F6F3", borderRadius: 8, padding: "10px 13px", marginBottom: 10 }}>
            <div style={{ fontSize: 11, color: "#888", marginBottom: 6 }}>사업자 유형</div>
            <div style={{ display: "flex", gap: 6 }}>
              {["개인사업자","법인사업자"].map(function(t) {
                var sel = form.business_type === t;
                return (
                  <button key={t} onClick={function() { set("business_type", t); set("type", t === "법인사업자" ? "법인" : "개인"); }}
                    style={{ flex: 1, padding: "6px 8px", borderRadius: 6, fontSize: 12, fontWeight: 600, border: "none", cursor: "pointer",
                      background: sel ? (t === "법인사업자" ? "#4338CA" : "#0F6E56") : "#fff", color: sel ? "#fff" : "#888" }}>
                    {t}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 팀 (업체명 기준 자동 분류 · 필요 시 수동 변경) */}
          <div style={{ background: "#F7F6F3", borderRadius: 8, padding: "10px 13px", marginBottom: 10 }}>
            <div style={{ fontSize: 11, color: "#888", marginBottom: 6 }}>팀 {!teamTouched && <span style={{ color: "#15803D", fontSize: 9, fontWeight: 700 }}>✓ 업체명 기준 자동</span>}</div>
            <div style={{ display: "flex", gap: 6 }}>
              {["법인팀","개인팀"].map(function(t) {
                var sel = form.team === t;
                return (
                  <button key={t} onClick={function() { setTeamTouched(true); set("team", t); }}
                    style={{ flex: 1, padding: "6px 8px", borderRadius: 6, fontSize: 12, fontWeight: 600, border: "none", cursor: "pointer",
                      background: sel ? (t === "법인팀" ? "#4338CA" : "#0F6E56") : "#fff", color: sel ? "#fff" : "#888" }}>
                    {t}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 업종 (복수 선택 가능) */}
          <div style={{ background: "#F7F6F3", borderRadius: 8, padding: "10px 13px", marginBottom: 10 }}>
            <div style={{ fontSize: 11, color: "#888", marginBottom: 6 }}>업종 (복수 선택 가능)</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 6 }}>
              {getMergedIndustryOptions(companies).map(function(ind) {
                var cur = (form.industry || "").split(",").map(function(s) { return s.trim(); }).filter(Boolean);
                var sel = cur.indexOf(ind) >= 0;
                var isCustom = INDUSTRY_OPTIONS.indexOf(ind) < 0;
                return (
                  <button key={ind} onClick={function() {
                    var arr = (form.industry || "").split(",").map(function(s) { return s.trim(); }).filter(Boolean);
                    var idx = arr.indexOf(ind);
                    if (idx >= 0) arr.splice(idx, 1);
                    else arr.push(ind);
                    set("industry", arr.length > 0 ? arr.join(", ") : "");
                  }}
                    title={isCustom ? "다른 기업에서 사용 중인 업종" : ""}
                    style={{ padding: "4px 9px", borderRadius: 99, fontSize: 11, fontWeight: sel ? 700 : 400, border: sel ? "none" : "1px solid " + (isCustom ? "#FDE68A" : "#E8E5E0"), cursor: "pointer",
                      background: sel ? "#4338CA" : (isCustom ? "#FEF3C7" : "#fff"), color: sel ? "#fff" : (isCustom ? "#92400E" : "#666") }}>
                    {sel ? "✓ " : ""}{ind}
                  </button>
                );
              })}
            </div>
            {(function() {
              var cur = (form.industry || "").split(",").map(function(s) { return s.trim(); }).filter(Boolean);
              var allOpts = getMergedIndustryOptions(companies);
              var custom = cur.filter(function(s) { return allOpts.indexOf(s) < 0; });
              if (custom.length === 0) return null;
              return (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 6 }}>
                  {custom.map(function(s) {
                    return (
                      <span key={s} style={{ background: "#0F6E56", color: "#fff", padding: "3px 9px", borderRadius: 99, fontSize: 11, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 4 }}>
                        ✓ {s}
                        <span onClick={function() {
                          var arr = (form.industry || "").split(",").map(function(x) { return x.trim(); }).filter(Boolean);
                          arr = arr.filter(function(x) { return x !== s; });
                          set("industry", arr.length > 0 ? arr.join(", ") : "");
                        }} style={{ cursor: "pointer", fontSize: 12, opacity: 0.85 }}>✕</span>
                      </span>
                    );
                  })}
                </div>
              );
            })()}
            <input type="text" placeholder="직접 입력 후 Enter로 추가 (예: 부동산임대업)"
              onKeyDown={function(e) {
                if (e.key !== "Enter") return;
                e.preventDefault();
                var v = (e.target.value || "").trim();
                if (!v) return;
                var arr = (form.industry || "").split(",").map(function(s) { return s.trim(); }).filter(Boolean);
                if (arr.indexOf(v) >= 0) { e.target.value = ""; return; }
                arr.push(v);
                set("industry", arr.join(", "));
                e.target.value = "";
              }}
              style={{ width: "100%", padding: "5px 8px", border: "1px solid #E8E5E0", borderRadius: 5, fontSize: 11, outline: "none", boxSizing: "border-box" }} />
          </div>

          {/* 진행 단계 */}
          <div style={{ background: "#F7F6F3", borderRadius: 8, padding: "10px 13px", marginBottom: 10 }}>
            <div style={{ fontSize: 11, color: "#888", marginBottom: 5 }}>진행 단계</div>
            <select value={form.stage} onChange={function(e) { set("stage", e.target.value); }}
              style={{ width: "100%", fontSize: 13, fontWeight: 600, background: "transparent", border: "none", outline: "none", cursor: "pointer" }}>
              {STAGES.map(function(s) { return <option key={s}>{s}</option>; })}
            </select>
          </div>

          {/* 담당 기관 (복수 선택) */}
          <div style={{ background: "#F7F6F3", borderRadius: 8, padding: "10px 13px", marginBottom: 10 }}>
            <div style={{ fontSize: 11, color: "#888", marginBottom: 8 }}>담당 기관 (복수 선택 가능)</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {AGENCIES.map(function(a) {
                var sel = (form.agency_list || []).includes(a);
                return (
                  <button key={a} onClick={function() { toggleAgency(a); }}
                    style={{ padding: "5px 10px", borderRadius: 99, fontSize: 11, fontWeight: 600, border: "none", cursor: "pointer",
                      background: sel ? "#4338CA" : "#fff", color: sel ? "#fff" : "#888" }}>{a}</button>
                );
              })}
            </div>
            {/* 🚨 보증기관 중복 경고 (기능9) */}
            {(form.agency_list || []).includes("신용보증기금") && (form.agency_list || []).includes("신용보증재단") && (
              <div style={{ background: "#FEE2E2", border: "1px solid #FCA5A5", borderRadius: 7, padding: "8px 11px", marginTop: 8, color: "#DC2626", fontSize: 12, fontWeight: 700 }}>
                🚨 보증기관 중복 불가: 신용보증기금과 신용보증재단은 동시 진행할 수 없어요. 하나만 선택하세요.
              </div>
            )}
          </div>

          {/* 담당자 (복수 선택) */}
          <div style={{ background: "#F7F6F3", borderRadius: 8, padding: "10px 13px", marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: "#888", marginBottom: 8 }}>담당자 (복수 선택 가능)</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {assignees.map(function(a) {
                var sel = (form.assignee || "").split(", ").filter(Boolean).includes(a);
                return (
                  <button key={a} onClick={function() { toggleAssignee(a); }}
                    style={{ padding: "5px 12px", borderRadius: 99, fontSize: 12, fontWeight: 600, border: "none", cursor: "pointer",
                      background: sel ? "#1A1917" : "#fff", color: sel ? "#fff" : "#888" }}>{a}</button>
                );
              })}
            </div>
          </div>

          {/* 📣 리드 출처 (기능8) */}
          <div style={{ background: "#F7F6F3", borderRadius: 8, padding: "10px 13px", marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: "#888", marginBottom: 8 }}>리드 출처 (어떻게 유입됐나요?)</div>
            <select value={form.lead_source || ""} onChange={function(e) { set("lead_source", e.target.value); }}
              style={{ width: "100%", fontSize: 13, padding: "8px 10px", border: "1px solid #E8E5E0", borderRadius: 6, background: "#fff", outline: "none", boxSizing: "border-box" }}>
              <option value="">— 선택 —</option>
              {LEAD_SOURCES.map(function(s) { return <option key={s} value={s}>{s}</option>; })}
            </select>
          </div>

          <div style={{ background: "#DBEAFE", borderRadius: 8, padding: "10px 13px", marginBottom: 12, fontSize: 11, color: "#1E40AF", lineHeight: 1.5 }}>
            💡 등록 후 사이드패널이 열려서 추가 정보(이슈·다음액션 등) 입력 가능해요.
          </div>

          <button onClick={function() {
            if (!form.name || !form.name.trim()) { alert("업체명을 입력해주세요."); return; }
            if (!form.representative || !form.representative.trim()) { alert("대표자명을 입력해주세요."); return; }
            var formToSend = Object.assign({}, form, {
              agency: (form.agency_list && form.agency_list[0]) || "",
              agency_list_str: (form.agency_list || []).join(", "),
            });
            onAdd(formToSend);
          }} style={{ width: "100%", padding: "13px", background: "#1A1917", color: "#F7F6F3", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
            ✓ 등록 완료
          </button>
        </div>
      </div>
    </div>
  );
}



// ── 활동 로그 ──────────────────────────────────────────────────────────────────
function ActivityLogView() {
  const [logs, setLogs] = useState([]);
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterAssignee, setFilterAssignee] = useState("전체");
  const [filterAgency, setFilterAgency] = useState("전체");
  const [filterType, setFilterType] = useState("전체");
  // 수동 메모 입력
  const [memoInput, setMemoInput] = useState("");
  const [memoAssignee, setMemoAssignee] = useState("");
  const [memoAgency, setMemoAgency] = useState("");
  const [memoSuggestions, setMemoSuggestions] = useState([]);
  const [memoSaving, setMemoSaving] = useState(false);

  useEffect(function() { fetchAll(); }, []);

  var fetchAll = async function() {
    setLoading(true);
    var r1 = await supabase.from("activity_logs").select("*").order("created_at", { ascending: false }).limit(200);
    var r2 = await supabase.from("agency_cases").select("id,business_name,agency_group,assignee").is("deleted_at", null).limit(10000);
    if (!r1.error) setLogs(r1.data || []);
    if (!r2.error) setCases(r2.data || []);
    setLoading(false);
  };

  // 자동완성 - 사업자명 입력 시 agency_cases 검색
  var handleMemoNameInput = function(val) {
    setMemoInput(val);
    if (val.length < 1) { setMemoSuggestions([]); return; }
    var matches = cases.filter(function(c) {
      return c.business_name && c.business_name.includes(val);
    }).slice(0, 6);
    setMemoSuggestions(matches);
  };

  var selectSuggestion = function(c) {
    setMemoInput(c.business_name);
    setMemoAgency(c.agency_group || "");
    setMemoAssignee(c.assignee || "");
    setMemoSuggestions([]);
  };

  var saveMemo = async function() {
    if (!memoInput.trim()) { alert("사업자명을 입력해주세요."); return; }
    if (!memoAssignee) { alert("담당자를 선택해주세요."); return; }
    setMemoSaving(true);
    var r = await supabase.from("activity_logs").insert({
      business_name: memoInput.trim(),
      agency_group: memoAgency || null,
      assignee: memoAssignee,
      log_type: "manual_memo",
      logged_by: memoAssignee,
    });
    if (!r.error) {
      setMemoInput(""); setMemoAgency(""); setMemoAssignee(""); setMemoSuggestions([]);
      fetchAll();
    }
    setMemoSaving(false);
  };

  // 필터
  var filtered = useMemo(function() {
    return logs.filter(function(l) {
      if (filterAssignee !== "전체" && l.assignee !== filterAssignee) return false;
      if (filterAgency !== "전체" && l.agency_group !== filterAgency) return false;
      if (filterType === "자동") return l.log_type === "status_change";
      if (filterType === "수동") return l.log_type === "manual_memo";
      return true;
    });
  }, [logs, filterAssignee, filterAgency, filterType]);

  // 날짜 포맷
  var fmtTime = function(iso) {
    if (!iso) return "";
    var d = new Date(iso);
    var now = new Date();
    var diff = now - d;
    var mins = Math.floor(diff / 60000);
    var hours = Math.floor(diff / 3600000);
    var days = Math.floor(diff / 86400000);
    if (mins < 1) return "방금 전";
    if (mins < 60) return mins + "분 전";
    if (hours < 24) return hours + "시간 전";
    if (days === 1) return "어제";
    if (days < 7) return days + "일 전";
    return d.toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
  };

  var fmtDate = function(iso) {
    if (!iso) return "";
    var d = new Date(iso);
    return d.toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "short" });
  };

  // 날짜 그룹핑
  var groupedLogs = useMemo(function() {
    var groups = {};
    filtered.forEach(function(l) {
      var d = l.created_at ? new Date(l.created_at).toDateString() : "unknown";
      if (!groups[d]) groups[d] = { dateStr: fmtDate(l.created_at), items: [] };
      groups[d].items.push(l);
    });
    return Object.values(groups);
  }, [filtered]);

  // KPI
  var today = new Date().toDateString();
  var thisWeekStart = new Date(); thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay());
  var todayLogs = logs.filter(function(l) { return l.created_at && new Date(l.created_at).toDateString() === today; });
  var weekLogs = logs.filter(function(l) { return l.created_at && new Date(l.created_at) >= thisWeekStart; });

  // 담당자별 활동량 (이번 주)
  var staffStats = useMemo(function() {
    var map = {};
    weekLogs.forEach(function(l) {
      if (!l.assignee) return;
      if (!map[l.assignee]) map[l.assignee] = 0;
      map[l.assignee]++;
    });
    return Object.entries(map).sort(function(a,b) { return b[1]-a[1]; });
  }, [weekLogs]);
  var maxStaff = staffStats.length > 0 ? staffStats[0][1] : 1;

  // 기관별 오늘 활동
  var agencyToday = useMemo(function() {
    var map = {};
    todayLogs.forEach(function(l) {
      if (!l.agency_group) return;
      if (!map[l.agency_group]) map[l.agency_group] = 0;
      map[l.agency_group]++;
    });
    return Object.entries(map).sort(function(a,b) { return b[1]-a[1]; });
  }, [todayLogs]);

  // 상태 변경 배지 색
  var STATUS_COLORS_MAP = {
    "승인": { bg: "#ECFDF5", text: "#047857" }, "약정": { bg: "#ECFDF5", text: "#047857" }, "완료": { bg: "#ECFDF5", text: "#047857" },
    "심사중": { bg: "#EEF2FF", text: "#4338CA" }, "최종제출": { bg: "#EEF2FF", text: "#4338CA" }, "진행 중": { bg: "#EEF2FF", text: "#4338CA" },
    "부결": { bg: "#FEF2F2", text: "#DC2626" }, "반려": { bg: "#FEF2F2", text: "#DC2626" }, "진행불가": { bg: "#FEF2F2", text: "#DC2626" },
    "보류": { bg: "#F5F3FF", text: "#7C3AED" }, "중단": { bg: "#F5F3FF", text: "#7C3AED" },
  };
  var statusBadge = function(s) {
    var sc = STATUS_COLORS_MAP[s] || { bg: "#F7F6F3", text: "#888" };
    return <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 99, background: sc.bg, color: sc.text, fontWeight: 600 }}>{s}</span>;
  };

  // 기관 배지 색
  var agencyColor = function(ag) {
    var map = { "소상공인시장진흥공단": "#4338CA", "신용보증기금": "#0F6E56", "농협신용보증기금": "#0D9488", "신용보증재단": "#B45309", "중소벤처기업진흥공단": "#7C3AED", "구조혁신&사업전환": "#BE123C", "경정청구": "#0369A1" };
    return map[ag] || "#888";
  };

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", flexDirection: "column", gap: 16 }}>
      <div style={{ width: 36, height: 36, border: "3px solid #E8E5E0", borderTopColor: "#1A1917", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <span style={{ color: "#888", fontSize: 13 }}>활동 로그 불러오는 중...</span>
    </div>
  );

  return (
    <div>
      {/* 헤더 */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.03em", margin: 0 }}>활동 로그</h1>
          <p style={{ color: "#888", fontSize: 13, margin: "4px 0 0" }}>상태 변경 자동 기록 · 수동 메모</p>
        </div>
        <button onClick={fetchAll} style={{ display: "flex", alignItems: "center", gap: 6, background: "#fff", color: "#555", border: "1px solid #E8E5E0", borderRadius: 8, padding: "8px 14px", fontSize: 12, cursor: "pointer" }}>
          <Icon name="refresh" size={13} color="#555" /> 새로고침
        </button>
      </div>

      {/* KPI */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "오늘 활동", value: todayLogs.length + "건", sub: "자동 " + todayLogs.filter(function(l){return l.log_type==="status_change";}).length + " · 수동 " + todayLogs.filter(function(l){return l.log_type==="manual_memo";}).length, color: "#4338CA" },
          { label: "이번 주 활동", value: weekLogs.length + "건", sub: "상태변경+메모 합산", color: "#047857" },
          { label: "이번 주 상태변경", value: weekLogs.filter(function(l){return l.log_type==="status_change";}).length + "건", sub: "자동 기록", color: "#7C3AED" },
          { label: "이번 주 메모", value: weekLogs.filter(function(l){return l.log_type==="manual_memo";}).length + "건", sub: "수동 작성", color: "#B45309" },
        ].map(function(k, i) {
          return (
            <div key={i} style={{ background: "#fff", borderRadius: 10, padding: "16px 18px", border: "1px solid #E8E5E0" }}>
              <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>{k.label}</div>
              <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.03em", color: k.color }}>{k.value}</div>
              <div style={{ fontSize: 11, color: "#AAA", marginTop: 3 }}>{k.sub}</div>
            </div>
          );
        })}
      </div>

      {/* 필터 */}
      <div style={{ display: "flex", gap: 16, marginBottom: 16, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
          <span style={{ fontSize: 12, color: "#888" }}>유형:</span>
          {["전체","자동","수동"].map(function(t) {
            return <div key={t} onClick={function(){setFilterType(t);}} style={{ padding: "4px 12px", borderRadius: 99, cursor: "pointer", fontSize: 12, background: filterType===t ? "#1A1917" : "#fff", color: filterType===t ? "#fff" : "#666", border: filterType===t ? "none" : "1px solid #E8E5E0" }}>{t}</div>;
          })}
        </div>
        <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
          <span style={{ fontSize: 12, color: "#888" }}>기관:</span>
          {["전체","소상공인시장진흥공단","신용보증기금","농협신용보증기금","신용보증재단","중소벤처기업진흥공단","구조혁신&사업전환"].map(function(a) {
            return <div key={a} onClick={function(){setFilterAgency(a);}} style={{ padding: "4px 12px", borderRadius: 99, cursor: "pointer", fontSize: 12, background: filterAgency===a ? "#1A1917" : "#fff", color: filterAgency===a ? "#fff" : "#666", border: filterAgency===a ? "none" : "1px solid #E8E5E0" }}>{a}</div>;
          })}
        </div>
        <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
          <span style={{ fontSize: 12, color: "#888" }}>담당자:</span>
          {["전체"].concat(ASSIGNEES).map(function(a) {
            return <div key={a} onClick={function(){setFilterAssignee(a);}} style={{ padding: "4px 12px", borderRadius: 99, cursor: "pointer", fontSize: 12, background: filterAssignee===a ? "#1A1917" : "#fff", color: filterAssignee===a ? "#fff" : "#666", border: filterAssignee===a ? "none" : "1px solid #E8E5E0" }}>{a}</div>;
          })}
        </div>
      </div>

      {/* 메인 레이아웃 */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 16, alignItems: "start" }}>

        {/* 타임라인 */}
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #E8E5E0", overflow: "hidden" }}>
          {/* 수동 메모 입력창 */}
          <div style={{ padding: "16px 20px", borderBottom: "2px solid #E8E5E0", background: "#FAFAF8" }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: "#333" }}>✏️ 수동 메모 남기기</div>
            <div style={{ position: "relative", marginBottom: 8 }}>
              <input
                value={memoInput}
                onChange={function(e) { handleMemoNameInput(e.target.value); }}
                placeholder="사업자명 검색 또는 직접 입력..."
                style={{ width: "100%", padding: "9px 13px", border: "1px solid #E8E5E0", borderRadius: 8, fontSize: 13, boxSizing: "border-box", outline: "none" }}
              />
              {memoSuggestions.length > 0 && (
                <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#fff", border: "1px solid #E8E5E0", borderRadius: 8, zIndex: 100, boxShadow: "0 4px 20px rgba(0,0,0,0.1)", overflow: "hidden" }}>
                  {memoSuggestions.map(function(c) {
                    return (
                      <div key={c.id} onClick={function() { selectSuggestion(c); }}
                        style={{ padding: "9px 13px", cursor: "pointer", fontSize: 13, borderBottom: "1px solid #F0EDE8", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                        onMouseEnter={function(e) { e.currentTarget.style.background = "#F7F6F3"; }}
                        onMouseLeave={function(e) { e.currentTarget.style.background = ""; }}>
                        <span style={{ fontWeight: 600 }}>{c.business_name}</span>
                        <div style={{ display: "flex", gap: 6 }}>
                          {c.agency_group && <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 99, background: "#EEF2FF", color: "#4338CA", fontWeight: 600 }}>{c.agency_group}</span>}
                          {c.assignee && <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 99, background: "#F7F6F3", color: "#888" }}>{c.assignee}</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
              <select value={memoAssignee} onChange={function(e) { setMemoAssignee(e.target.value); }}
                style={{ padding: "9px 13px", border: "1px solid #E8E5E0", borderRadius: 8, fontSize: 13, background: "#fff" }}>
                <option value="">담당자 선택</option>
                {ASSIGNEES.map(function(a) { return <option key={a} value={a}>{a}</option>; })}
              </select>
              <select value={memoAgency} onChange={function(e) { setMemoAgency(e.target.value); }}
                style={{ padding: "9px 13px", border: "1px solid #E8E5E0", borderRadius: 8, fontSize: 13, background: "#fff" }}>
                <option value="">기관 선택 (선택사항)</option>
                {["소상공인시장진흥공단","신용보증기금","농협신용보증기금","신용보증재단","중소벤처기업진흥공단","구조혁신&사업전환","경정청구","기타"].map(function(a) { return <option key={a} value={a}>{a}</option>; })}
              </select>
            </div>
            <button onClick={saveMemo} disabled={memoSaving}
              style={{ width: "100%", padding: "10px", background: "#1A1917", color: "#F7F6F3", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: memoSaving ? "not-allowed" : "pointer", opacity: memoSaving ? 0.7 : 1 }}>
              {memoSaving ? "저장 중..." : "메모 저장"}
            </button>
          </div>

          {/* 타임라인 목록 */}
          {filtered.length === 0 ? (
            <div style={{ padding: "60px 20px", textAlign: "center", color: "#AAA", fontSize: 13 }}>
              활동 기록이 없습니다.<br/>
              <span style={{ fontSize: 12 }}>기관별 현황에서 상태를 변경하거나 메모를 남겨보세요.</span>
            </div>
          ) : (
            <div style={{ padding: "16px 20px" }}>
              {groupedLogs.map(function(group, gi) {
                return (
                  <div key={gi} style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#AAA", letterSpacing: "0.05em", marginBottom: 12, textTransform: "uppercase" }}>{group.dateStr}</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                      {group.items.map(function(log, li) {
                        var isAuto = log.log_type === "status_change";
                        var isLast = li === group.items.length - 1 && gi === groupedLogs.length - 1;
                        return (
                          <div key={log.id} style={{ display: "flex", gap: 12, paddingBottom: 16, position: "relative" }}>
                            {!isLast && <div style={{ position: "absolute", left: 14, top: 30, bottom: 0, width: 1, background: "#E8E5E0" }} />}
                            {/* 아이콘 */}
                            <div style={{ width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: isAuto ? "#EEF2FF" : "#FFF7ED", fontSize: 13 }}>
                              {isAuto ? "🔄" : "✏️"}
                            </div>
                            {/* 내용 */}
                            <div style={{ flex: 1 }}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                                <div style={{ fontSize: 13, fontWeight: 700 }}>
                                  {log.assignee || "-"}
                                  <span style={{ fontWeight: 400, color: "#888", marginLeft: 5 }}>· {log.business_name || "-"}</span>
                                </div>
                                <div style={{ fontSize: 11, color: "#AAA", whiteSpace: "nowrap", marginLeft: 8 }}>{fmtTime(log.created_at)}</div>
                              </div>
                              <div style={{ display: "flex", flexWrap: "wrap", gap: 5, alignItems: "center" }}>
                                {log.agency_group && (
                                  <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 99, background: "#EEF2FF", color: agencyColor(log.agency_group), fontWeight: 600 }}>{log.agency_group}</span>
                                )}
                                {isAuto ? (
                                  <>
                                    {log.old_status && statusBadge(log.old_status)}
                                    <span style={{ fontSize: 11, color: "#AAA" }}>→</span>
                                    {log.new_status && statusBadge(log.new_status)}
                                    <span style={{ fontSize: 11, color: "#888" }}>상태 변경</span>
                                  </>
                                ) : (
                                  <>
                                    <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 99, background: "#FFF7ED", color: "#C2410C", fontWeight: 600 }}>수동 메모</span>
                                    {log.memo && <span style={{ fontSize: 12, color: "#555" }}>{log.memo}</span>}
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 오른쪽 사이드 */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* 담당자별 활동량 */}
          <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #E8E5E0", overflow: "hidden" }}>
            <div style={{ padding: "14px 16px", borderBottom: "1px solid #E8E5E0", fontSize: 13, fontWeight: 700 }}>
              담당자별 활동량 <span style={{ fontSize: 11, color: "#AAA", fontWeight: 400 }}>이번 주</span>
            </div>
            <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
              {staffStats.length === 0 ? (
                <div style={{ fontSize: 12, color: "#AAA", textAlign: "center", padding: "16px 0" }}>이번 주 활동 없음</div>
              ) : staffStats.map(function(s) {
                var pct = Math.round(s[1] / maxStaff * 100);
                return (
                  <div key={s[0]} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#1A1917", color: "#F7F6F3", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{s[0][0]}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                        <span style={{ fontSize: 12, fontWeight: 600 }}>{s[0]}</span>
                        <span style={{ fontSize: 11, color: "#888" }}>{s[1]}건</span>
                      </div>
                      <div style={{ height: 4, background: "#E8E5E0", borderRadius: 99 }}>
                        <div style={{ height: 4, background: "#1A1917", borderRadius: 99, width: pct + "%" }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 오늘 기관별 요약 */}
          <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #E8E5E0", overflow: "hidden" }}>
            <div style={{ padding: "14px 16px", borderBottom: "1px solid #E8E5E0", fontSize: 13, fontWeight: 700 }}>
              오늘 기관별 활동 <span style={{ fontSize: 11, color: "#AAA", fontWeight: 400 }}>건수</span>
            </div>
            <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 6 }}>
              {agencyToday.length === 0 ? (
                <div style={{ fontSize: 12, color: "#AAA", textAlign: "center", padding: "16px 0" }}>오늘 활동 없음</div>
              ) : agencyToday.map(function(a) {
                return (
                  <div key={a[0]} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px", background: "#F7F6F3", borderRadius: 8 }}>
                    <span style={{ fontSize: 12, color: "#555" }}>{a[0]}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: agencyColor(a[0]) }}>{a[1]}건</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── 업무노트 수정 카드 (독립 컴포넌트 - 입력버그 방지) ─────────────────────────
function NoteEditCard({ note, editNote, setEditNote, saveEdit, onCancel }) {
  // content가 변경되면 checkItems와 freeText로 분리
  // editNote.checkItems가 이미 있으면 그걸 우선 사용 (사용자가 편집 중인 상태)
  
  function parseContent(text) {
    if (!text) return { items: [], freeText: "" };
    var lines = text.split("\n");
    var items = [];
    var freeLines = [];
    lines.forEach(function(line) {
      var m = line.match(/^(\s*)- \[([ x])\]\s*(.*)$/i);
      if (m) {
        var textFull = m[3].trim();
        var dateStr = null;
        var displayText = textFull;
        var bracketMatch = textFull.match(/\[(\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2})\]/);
        var arrowMatch = !bracketMatch && textFull.match(/→\s*(\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2})\s*$/);
        if (bracketMatch || arrowMatch) {
          var raw = (bracketMatch ? bracketMatch[1] : arrowMatch[1]);
          if (raw.indexOf("-") >= 0) {
            dateStr = raw;
          } else {
            var parts = raw.split("/");
            var year = new Date().getFullYear();
            dateStr = year + "-" + parts[0].padStart(2,"0") + "-" + parts[1].padStart(2,"0");
          }
          displayText = textFull.replace(/\[\d{4}-\d{2}-\d{2}\]|\[\d{1,2}\/\d{1,2}\]/, "").replace(/→\s*\d{4}-\d{2}-\d{2}\s*$|→\s*\d{1,2}\/\d{1,2}\s*$/, "").trim();
        }
        items.push({ checked: m[2].toLowerCase() === "x", text: displayText, dueDate: dateStr || "" });
      } else {
        freeLines.push(line);
      }
    });
    return { items: items, freeText: freeLines.join("\n").trim() };
  }

  // 처음 한 번만 파싱 - editNote.checkItems가 없으면 content에서 추출
  useEffect(function() {
    if (editNote && editNote.id && (editNote.checkItems === undefined || editNote.checkItems === null)) {
      var parsed = parseContent(editNote.content || "");
      setEditNote(function(p) {
        return Object.assign({}, p, { 
          checkItems: parsed.items,
          freeContent: parsed.freeText
        });
      });
    }
  }, [editNote.id]);

  var checkItems = editNote.checkItems || [];
  var freeContent = editNote.freeContent !== undefined ? editNote.freeContent : (editNote.content || "");

  // 자동저장: 칸을 벗어나거나 항목 변경 시 즉시 DB 반영 (저장 버튼 안 눌러도 손실 방지)
  var autoSaveEditNow = function() {
    setEditNote(function(p) {
      if (!p || !p.id) return p;
      var items = (p.checkItems || []).filter(function(i) { return (i.text || "").trim(); }).map(function(i) {
        var line = "- [" + (i.checked ? "x" : " ") + "] " + i.text.trim();
        if (i.dueDate) line += " [" + i.dueDate + "]";
        return line;
      });
      var ft = (p.freeContent || "").trim();
      var parts = [];
      if (items.length > 0) parts.push(items.join("\n"));
      if (ft) parts.push(ft);
      var newContent = parts.join("\n");
      supabase.from("work_notes").update({ content: newContent, updated_at: new Date().toISOString() }).eq("id", p.id);
      return p;
    });
  };

  return (
    <div style={{ background: "#F0FDF4", border: "2px solid #86EFAC", borderRadius: 12, padding: "18px 20px" }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: "#15803D", marginBottom: 12 }}>✏️ 노트 수정</div>
      <div style={{ display: "flex", gap: 16, marginBottom: 10 }}>
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer" }}>
          <input type="checkbox" checked={editNote.is_todo || false} onChange={function(e) { setEditNote(function(p) { return Object.assign({}, p, { is_todo: e.target.checked }); }); }} />
          📋 할 일로 등록
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer" }}>
          <input type="checkbox" checked={editNote.pinned || false} onChange={function(e) { setEditNote(function(p) { return Object.assign({}, p, { pinned: e.target.checked }); }); }} />
          📌 상단 고정
        </label>
      </div>
      <input value={editNote.title || ""} placeholder="제목 (선택사항)" onChange={function(e) { var v = e.target.value; setEditNote(function(p) { return Object.assign({}, p, { title: v }); }); }}
        style={{ width: "100%", padding: "10px 13px", border: "1px solid #86EFAC", borderRadius: 8, fontSize: 14, fontWeight: 600, boxSizing: "border-box", outline: "none", marginBottom: 10, background: "#fff" }} />
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <label style={{ fontSize: 12, color: "#15803D", fontWeight: 600, whiteSpace: "nowrap" }}>📅 마감일</label>
        <input type="date" value={editNote.due_date || ""} onChange={function(e) { var v = e.target.value; setEditNote(function(p) { return Object.assign({}, p, { due_date: v }); }); }}
          style={{ width: "auto", padding: "7px 10px", border: "1px solid #86EFAC", borderRadius: 6, fontSize: 12, background: "#fff", outline: "none" }} />
        {editNote.due_date && <button onClick={function() { setEditNote(function(p) { return Object.assign({}, p, { due_date: "" }); }); }}
          style={{ background: "none", border: "none", cursor: "pointer", color: "#AAA", fontSize: 14 }}>✕</button>}
      </div>
      {/* 체크리스트 항목들 */}
      {checkItems.length > 0 && (
        <div style={{ border: "1px solid #86EFAC", borderRadius: 8, padding: "10px 12px", marginBottom: 8, background: "#fff" }}>
          {checkItems.map(function(item, idx) {
            return (
              <div key={idx} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <input type="checkbox" checked={item.checked || false} onChange={function(e) {
                  var ck = e.target.checked;
                  // state 업데이트
                  var newItems = checkItems.slice();
                  newItems[idx] = Object.assign({}, newItems[idx], { checked: ck });
                  setEditNote(function(p) { return Object.assign({}, p, { checkItems: newItems }); });
                  // 즉시 DB 저장 (저장 안 누르고 이탈해도 체크 상태 유지)
                  var lines = newItems.filter(function(i) { return (i.text || "").trim(); }).map(function(i) {
                    var line = "- [" + (i.checked ? "x" : " ") + "] " + i.text.trim();
                    if (i.dueDate) line += " [" + i.dueDate + "]";
                    return line;
                  });
                  var ft = (editNote.freeContent || "").trim();
                  var parts = [];
                  if (lines.length > 0) parts.push(lines.join("\n"));
                  if (ft) parts.push(ft);
                  var newContent = parts.join("\n");
                  supabase.from("work_notes").update({ content: newContent, updated_at: new Date().toISOString() }).eq("id", editNote.id);
                }} style={{ width: 15, height: 15, flexShrink: 0, cursor: "pointer" }} />
                <input type="text" value={item.text || ""} placeholder={"항목 " + (idx + 1) + " (예: 스크립트 작성)"}
                  onChange={function(e) { var v = e.target.value; setEditNote(function(p) { var items = (p.checkItems || []).slice(); items[idx] = Object.assign({}, items[idx], { text: v }); return Object.assign({}, p, { checkItems: items }); }); }}
                  onBlur={autoSaveEditNow}
                  style={{ flex: 1, border: "none", outline: "none", fontSize: 13, background: "transparent", textDecoration: item.checked ? "line-through" : "none", color: item.checked ? "#AAA" : "#333" }} />
                <input type="date" value={item.dueDate || ""} title="이 항목의 마감일 (선택)"
                  onChange={function(e) { var v = e.target.value; setEditNote(function(p) { var items = (p.checkItems || []).slice(); items[idx] = Object.assign({}, items[idx], { dueDate: v }); return Object.assign({}, p, { checkItems: items }); }); setTimeout(autoSaveEditNow, 0); }}
                  style={{ padding: "3px 6px", border: "1px solid #E8E5E0", borderRadius: 4, fontSize: 11, color: "#4338CA", outline: "none", width: 130 }} />
                <button onClick={function() { setEditNote(function(p) { var items = (p.checkItems || []).filter(function(_, i) { return i !== idx; }); return Object.assign({}, p, { checkItems: items }); }); setTimeout(autoSaveEditNow, 0); }}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#888", fontSize: 16, padding: "0 4px", lineHeight: 1 }}>×</button>
              </div>
            );
          })}
        </div>
      )}
      {/* 체크리스트 버튼 + textarea */}
      <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
        <button onClick={function() {
          setEditNote(function(p) {
            var items = (p.checkItems || []).concat([{ text: "", checked: false, dueDate: "" }]);
            return Object.assign({}, p, { checkItems: items, is_todo: true });
          });
        }} style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 12px", background: "#fff", border: "1px solid #86EFAC", borderRadius: 6, fontSize: 12, color: "#15803D", fontWeight: 600, cursor: "pointer" }}>
          ☑️ 체크리스트 항목 추가
        </button>
        <span style={{ fontSize: 10, color: "#888", alignSelf: "center", lineHeight: 1.4 }}>
          💡 직접 입력 시: <code style={{ background: "#F0EDE8", padding: "1px 4px", borderRadius: 3, fontSize: 10 }}>- [ ] 할일 [5/30]</code> 또는 <code style={{ background: "#F0EDE8", padding: "1px 4px", borderRadius: 3, fontSize: 10 }}>- [ ] 할일 → 5/30</code>
        </span>
      </div>
      <textarea value={freeContent} placeholder={checkItems.length > 0 ? "추가 메모 (선택사항)..." : "내용을 자유롭게 입력하세요..."} 
        onChange={function(e) { var v = e.target.value; setEditNote(function(p) { return Object.assign({}, p, { freeContent: v }); }); }} 
        onBlur={autoSaveEditNow}
        rows={checkItems.length > 0 ? 4 : 8}
        style={{ width: "100%", padding: "12px 13px", border: "1px solid #86EFAC", borderRadius: 8, fontSize: 13, lineHeight: 1.75, resize: "vertical", boxSizing: "border-box", outline: "none", background: "#fff", minHeight: 120 }} />
      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button onClick={saveEdit} style={{ background: "#15803D", color: "#fff", border: "none", borderRadius: 8, padding: "10px 22px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>저장</button>
        <button onClick={onCancel} style={{ background: "#fff", color: "#888", border: "1px solid #E8E5E0", borderRadius: 8, padding: "10px 16px", fontSize: 13, cursor: "pointer" }}>취소</button>
      </div>
    </div>
  );
}

// ── 업무노트 카드 (독립 컴포넌트 - 입력버그 방지) ──────────────────────────────
function NoteCard({ note, editingId, editNote, setEditNote, saveEdit, setEditingId, toggleDone, togglePin, deleteNote, fmtDate, currentUserName, onChecklistChange, moveNoteDate }) {
  var isEditing = editingId === note.id;
  var isMyNote = true;

  // 체크리스트 파싱: "- [ ] 항목" 또는 "- [x] 항목" 형식
  var parseChecklist = function(content) {
    if (!content) return null;
    var lines = content.split("\n");
    var hasChecklist = lines.some(function(l) { return /^- \[[ x]\]/.test(l.trim()); });
    if (!hasChecklist) return null;
    return lines.map(function(line, idx) {
      var m = line.trim().match(/^- \[([ x])\] (.+)/);
      if (m) return { idx: idx, checked: m[1] === "x", text: m[2], isCheck: true };
      return { idx: idx, text: line, isCheck: false };
    });
  };

  var checklist = parseChecklist(note.content);
  var checkedCount = checklist ? checklist.filter(function(i) { return i.isCheck && i.checked; }).length : 0;
  var totalCount = checklist ? checklist.filter(function(i) { return i.isCheck; }).length : 0;

  var toggleCheckItem = function(lineIdx) {
    var lines = (note.content || "").split("\n");
    var line = lines[lineIdx];
    if (/^- \[ \]/.test(line.trim())) {
      lines[lineIdx] = line.replace("- [ ]", "- [x]");
    } else if (/^- \[x\]/.test(line.trim())) {
      lines[lineIdx] = line.replace("- [x]", "- [ ]");
    }
    var newContent = lines.join("\n");
    if (onChecklistChange) onChecklistChange(note.id, newContent);
  };

  if (isEditing) {
    // 편집 중에는 그리드에서 빠짐 (상단 전체 폭으로 별도 렌더링)
    return null;
  }

  return (
    <div className="wn-card" style={{ background: note.pinned ? "#FFFBEB" : "#fff", border: note.pinned ? "1px solid #FDE68A" : "1px solid #E8E5E0", borderRadius: 12, padding: "16px 18px", opacity: note.is_done ? 0.6 : 1, transition: "opacity 0.2s" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          {note.is_todo && (
            <input type="checkbox" checked={note.is_done || false} onChange={function() { toggleDone(note); }}
              style={{ width: 16, height: 16, cursor: "pointer", accentColor: "#1A1917" }} />
          )}
          {note.pinned && <span style={{ fontSize: 14 }}>📌</span>}
          <span style={{ fontSize: 14, fontWeight: 700, color: "#1A1917", textDecoration: note.is_done ? "line-through" : "none" }}>
            {note.title || <span style={{ color: "#888", fontWeight: 400 }}>제목 없음</span>}
          </span>
          {note.is_todo && (
            <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 99, background: note.is_done ? "#ECFDF5" : "#EEF2FF", color: note.is_done ? "#047857" : "#4338CA", fontWeight: 600 }}>
              {note.is_done ? "완료" : "할일"}
            </span>
          )}
          {totalCount > 0 && (
            <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 99, background: checkedCount === totalCount ? "#ECFDF5" : "#F3F4F6", color: checkedCount === totalCount ? "#047857" : "#555", fontWeight: 600 }}>
              ✓ {checkedCount}/{totalCount}
            </span>
          )}
        </div>
        {isMyNote && (
          <div className="wn-actions" style={{ display: "flex", gap: 4 }}>
            <button onClick={function() { togglePin(note); }} title={note.pinned ? "고정 해제" : "고정"}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 8, fontSize: 18, minWidth: 40, minHeight: 40, display: "inline-flex", alignItems: "center", justifyContent: "center", touchAction: "manipulation", opacity: note.pinned ? 1 : 0.4 }}>📌</button>
            <label title="다른 날짜로 이동" style={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "pointer", padding: 8, fontSize: 18, minWidth: 40, minHeight: 40, touchAction: "manipulation" }}>
              📅
              <input type="date" defaultValue={note.note_date || ""}
                onChange={function(e) { if (e.target.value && moveNoteDate) moveNoteDate(note.id, e.target.value); }}
                style={{ position: "absolute", left: 0, top: 0, width: "100%", height: "100%", opacity: 0, cursor: "pointer" }} />
            </label>
            <button onClick={function() { setEditingId(note.id); setEditNote(Object.assign({}, note)); window.scrollTo({ top: 0, behavior: "smooth" }); }}
              title="수정" style={{ background: "none", border: "none", cursor: "pointer", padding: 8, minWidth: 40, minHeight: 40, display: "inline-flex", alignItems: "center", justifyContent: "center", touchAction: "manipulation" }}><Icon name="edit" size={18} color="#888" /></button>
            <button onClick={function() { deleteNote(note.id); }}
              title="삭제" style={{ background: "none", border: "none", cursor: "pointer", padding: 8, minWidth: 40, minHeight: 40, display: "inline-flex", alignItems: "center", justifyContent: "center", touchAction: "manipulation" }}><Icon name="x" size={18} color="#CCC" /></button>
          </div>
        )}
      </div>

      {/* 마감일 표시 */}
      {note.due_date && (function() {
        var today = kstDate();
        var dday = Math.ceil((new Date(note.due_date) - new Date(today)) / 86400000);
        var ddayLabel = dday === 0 ? "D-Day" : dday > 0 ? "D-" + dday : "D+" + Math.abs(dday);
        var ddayColor = dday < 0 ? "#DC2626" : dday === 0 ? "#EA580C" : dday <= 3 ? "#B45309" : "#15803D";
        var ddayBg = dday < 0 ? "#FEE2E2" : dday === 0 ? "#FFF7ED" : dday <= 3 ? "#FEF3C7" : "#F0FDF4";
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
            <span style={{ fontSize: 10, color: "#888" }}>📅 마감:</span>
            <span style={{ fontSize: 11, color: "#555" }}>{note.due_date}</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: ddayColor, background: ddayBg, padding: "1px 6px", borderRadius: 99 }}>{ddayLabel}</span>
          </div>
        );
      })()}

      {/* 체크리스트 or 일반 내용 */}
      {note.content && (
        checklist ? (
          <div style={{ marginBottom: 10 }}>
            {checklist.map(function(item) {
              if (!item.isCheck) {
                return item.text ? (
                  <div key={item.idx} style={{ fontSize: 13, color: "#888", lineHeight: 1.75, paddingLeft: 4 }}>{item.text}</div>
                ) : null;
              }
              return (
                <label key={item.idx} style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "4px 0", cursor: "pointer" }}>
                  <input type="checkbox" checked={item.checked} onChange={function() { toggleCheckItem(item.idx); }}
                    style={{ width: 15, height: 15, marginTop: 2, cursor: "pointer", accentColor: "#1A1917", flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: item.checked ? "#AAA" : "#333", textDecoration: item.checked ? "line-through" : "none", lineHeight: 1.6 }}>{item.text}</span>
                </label>
              );
            })}
          </div>
        ) : (
          <div style={{ fontSize: 13, color: "#555", lineHeight: 1.75, whiteSpace: "pre-wrap", marginBottom: 10, textDecoration: note.is_done ? "line-through" : "none" }}>
            {note.content}
          </div>
        )
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#1A1917", color: "#F7F6F3", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700 }}>{(note.assignee || "?")[0]}</div>
          <span style={{ fontSize: 11, color: "#AAA" }}>{note.assignee}</span>
        </div>
        <span style={{ fontSize: 11, color: "#888" }}>{fmtDate(note.updated_at || note.created_at)}</span>
      </div>
    </div>
  );
}

// ── 업무 노트 ──────────────────────────────────────────────────────────────────
// ── 브라우저 푸시 알림 함수 ──────────────────────────────────────────────
async function sendPushToUser(userName, payload) {
  try {
    var subs = await supabase.from("push_subscriptions").select("subscription").eq("user_name", userName);
    if (!subs.data || subs.data.length === 0) return; // 구독 정보 없으면 패스
    for (var i = 0; i < subs.data.length; i++) {
      var sub = subs.data[i].subscription;
      if (sub && sub.endpoint) {
        // 푸시 API 직접 호출 (클라이언트에서 Notification API 활용)
        if ("serviceWorker" in navigator && "PushManager" in window) {
          // 로컬 알림으로 대체 (같은 PC에서만 작동)
          if (Notification.permission === "granted") {
            var n = new Notification(payload.title, {
              body: payload.body,
              icon: "/favicon.ico",
              tag: "crm-worknote",
              requireInteraction: false,
            });
            n.onclick = function() { window.focus(); };
          }
        }
      }
    }
  } catch(e) {
    // 푸시 실패해도 저장은 완료
  }
}

function WorkNotesView({ profile, onBadgeUpdate }) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterAssignee, setFilterAssignee] = useState("전체");
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [newNote, setNewNote] = useState({ title: "", content: "", is_todo: false, pinned: false, target_assignee: "", checkItems: [], due_date: "", note_date: "" });
  const [editNote, setEditNote] = useState({});
  const [filterType, setFilterType] = useState("전체"); // 전체 / 메모 / 할일
  const [replyId, setReplyId] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [showTrash, setShowTrash] = useState(false);
  const [trashedNotes, setTrashedNotes] = useState([]);
  // 📅 캘린더 뷰 관련 state
  const [viewMode, setViewMode] = useState("calendar"); // "calendar" | "list"
  const [selectedDate, setSelectedDate] = useState(null); // YYYY-MM-DD or null (캘린더 보기 중)
  const [calendarMonth, setCalendarMonth] = useState(function() { var d = new Date(); return d.getFullYear() + "-" + String(d.getMonth()+1).padStart(2,"0"); });
  // 🔍 노트 검색 state
  const [noteSearchQ, setNoteSearchQ] = useState("");
  const [noteSearchOpen, setNoteSearchOpen] = useState(false);

  const [companiesList, setCompaniesList] = useState([]);
  const [pushEnabled, setPushEnabled] = useState(false);

  // 📱 업무노트 모바일 최적화 CSS 주입 (휴대폰에서 작성 편하게)
  useEffect(function() {
    if (document.getElementById("worknotes-mobile-css")) return;
    var st = document.createElement("style");
    st.id = "worknotes-mobile-css";
    st.textContent = [
      "@media(max-width:600px){",
      ".wn-root input,.wn-root textarea,.wn-root select{font-size:16px !important;}", // iOS 자동확대 방지
      ".wn-root .wn-header{flex-direction:column !important; align-items:stretch !important; gap:12px !important;}",
      ".wn-root .wn-addform{max-width:100% !important; width:100% !important; padding:14px !important;}",
      ".wn-root .wn-card{padding:14px !important;}",
      ".wn-root{padding-bottom:90px !important;}",
      "}",
      // 📱 모바일·태블릿 노트 액션(고정/이동/수정/삭제) 터치 영역 확대
      "@media(max-width:1024px){",
      ".wn-root .wn-actions{flex-wrap:wrap !important; gap:6px !important; justify-content:flex-end !important;}",
      ".wn-root .wn-actions button,.wn-root .wn-actions label{flex:0 0 auto !important; min-width:44px !important; min-height:44px !important; padding:10px !important;}",
      "}"
    ].join("");
    document.head.appendChild(st);
  }, []);

  // 브라우저 푸시 알림 권한 요청
  useEffect(function() {
    if (!profile?.name) return;
    if ("Notification" in window) {
      if (Notification.permission === "default") {
        // 자동으로 권한 요청 (처음 접속 시)
        Notification.requestPermission().then(function(perm) {
          if (perm === "granted") {
            setPushEnabled(true);
            // 구독 정보 DB에 저장 (간단 버전: endpoint만 저장)
            supabase.from("push_subscriptions").upsert({
              user_name: profile.name,
              subscription: { endpoint: "browser-" + profile.name, type: "notification" }
            }, { onConflict: "user_name" });
          }
        });
      } else if (Notification.permission === "granted") {
        setPushEnabled(true);
        supabase.from("push_subscriptions").upsert({
          user_name: profile.name,
          subscription: { endpoint: "browser-" + profile.name, type: "notification" }
        }, { onConflict: "user_name" });
      }
    }
  }, [profile?.name]);

  useEffect(function() {
    fetchNotes();
    fetchCompaniesList();
  }, []);

  // 기업 목록 가져오기 (자동 감지용)
  var fetchCompaniesList = async function() {
    var r = await supabase.from("companies").select("id, name").is("deleted_at", null);
    if (!r.error) setCompaniesList(r.data || []);
  };

  // 텍스트에서 기업명 자동 감지
  var detectCompaniesInText = function(text) {
    if (!text || !companiesList || companiesList.length === 0) return [];
    var found = [];
    companiesList.forEach(function(co) {
      if (co.name && text.indexOf(co.name) >= 0) {
        if (!found.find(function(f) { return f.id === co.id; })) found.push(co);
      }
    });
    return found;
  };

  // 활동로그에 자동 기록
  var logToActivity = async function(company, memo) {
    if (!company || !memo) return;
    await supabase.from("activity_logs").insert({
      case_id: company.id,
      case_type: "company",
      business_name: company.name,
      assignee: profile?.name || "",
      log_type: "note_auto",
      memo: memo.slice(0, 200),
      logged_by: profile?.name || "",
    });
  };

  var fetchNotes = async function() {
    setLoading(true);
    var r = await supabase.from("work_notes").select("*").is("deleted_at", null).order("pinned", { ascending: false }).order("created_at", { ascending: false });
    if (!r.error) setNotes(r.data || []);
    setLoading(false);
  };

  var fetchTrashedNotes = async function() {
    var r = await supabase.from("work_notes").select("*").not("deleted_at", "is", null).order("deleted_at", { ascending: false });
    if (!r.error) setTrashedNotes(r.data || []);
  };

  var openTrash = function() {
    fetchTrashedNotes();
    setShowTrash(true);
  };

  var restoreNote = async function(id) {
    var r = await supabase.from("work_notes").update({ deleted_at: null }).eq("id", id);
    if (!r.error) {
      setTrashedNotes(function(prev) { return prev.filter(function(n) { return n.id !== id; }); });
      fetchNotes();
    }
  };

  var permanentDeleteNote = async function(id) {
    if (!window.confirm("완전히 삭제하시겠습니까? 복구할 수 없습니다.")) return;
    var r = await supabase.from("work_notes").delete().eq("id", id);
    if (!r.error) setTrashedNotes(function(prev) { return prev.filter(function(n) { return n.id !== id; }); });
  };

  var filtered = useMemo(function() {
    return notes.filter(function(n) {
      if (filterAssignee !== "전체" && n.assignee !== filterAssignee) return false;
      if (filterType === "메모") return !n.is_todo;
      if (filterType === "할일") return n.is_todo;
      return true;
    });
  }, [notes, filterAssignee, filterType]);

  // 노트의 날짜 추출 (note_date 우선, 없으면 created_at에서)
  var getNoteDate = function(n) {
    if (n.note_date) return n.note_date;
    if (n.created_at) {
      var d = new Date(n.created_at);
      return d.getFullYear() + "-" + String(d.getMonth()+1).padStart(2,"0") + "-" + String(d.getDate()).padStart(2,"0");
    }
    return null;
  };

  // 날짜별 노트 인덱싱
  var notesByDate = useMemo(function() {
    var m = {};
    filtered.forEach(function(n) {
      var d = getNoteDate(n);
      if (!d) return;
      if (!m[d]) m[d] = [];
      m[d].push(n);
    });
    return m;
  }, [filtered]);

  // 선택된 날짜의 노트
  var notesForSelectedDate = useMemo(function() {
    if (!selectedDate) return [];
    return notesByDate[selectedDate] || [];
  }, [selectedDate, notesByDate]);

  // 미완료 체크박스 추출 - 모든 노트 content에서 - [ ] 추출
  var unfinishedItems = useMemo(function() {
    var items = [];
    filtered.forEach(function(n) {
      if (!n.content) return;
      var lines = n.content.split("\n");
      lines.forEach(function(line, idx) {
        var match = line.match(/^(\s*)- \[ \]\s*(.+)$/);
        if (match) {
          var text = match[2].trim();
          // 마감일 추출 [YYYY-MM-DD]
          var dueDateMatch = text.match(/\[(\d{4}-\d{2}-\d{2})\]/);
          var dueDate = dueDateMatch ? dueDateMatch[1] : null;
          var cleanText = text.replace(/\[\d{4}-\d{2}-\d{2}\]/, "").trim();
          items.push({
            noteId: n.id,
            noteTitle: n.title || "(제목 없음)",
            noteDate: getNoteDate(n),
            assignee: n.assignee,
            lineIdx: idx,
            text: cleanText,
            dueDate: dueDate,
          });
        }
      });
    });
    // 마감일 임박 순 → 마감일 없는 것 → 노트 날짜 최신 순
    items.sort(function(a, b) {
      if (a.dueDate && !b.dueDate) return -1;
      if (!a.dueDate && b.dueDate) return 1;
      if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
      return (b.noteDate || "").localeCompare(a.noteDate || "");
    });
    return items;
  }, [filtered]);

  // 캘린더 현재 월 정보
  var calMonthInfo = useMemo(function() {
    var parts = calendarMonth.split("-");
    var y = parseInt(parts[0], 10);
    var m = parseInt(parts[1], 10) - 1; // 0-indexed
    var firstDay = new Date(y, m, 1);
    var lastDay = new Date(y, m + 1, 0);
    var startWeekday = firstDay.getDay(); // 0=일
    var daysInMonth = lastDay.getDate();
    // 이전 달 마지막 며칠 (캘린더 채우기용)
    var prevLastDay = new Date(y, m, 0).getDate();
    return { y: y, m: m, startWeekday: startWeekday, daysInMonth: daysInMonth, prevLastDay: prevLastDay };
  }, [calendarMonth]);

  // 캘린더 셀 만들기 (42칸 = 6주)
  var calendarCells = useMemo(function() {
    var info = calMonthInfo;
    var cells = [];
    // 이전 달
    for (var i = info.startWeekday - 1; i >= 0; i--) {
      cells.push({ day: info.prevLastDay - i, currentMonth: false, dateStr: null });
    }
    // 이번 달
    for (var d = 1; d <= info.daysInMonth; d++) {
      var ds = info.y + "-" + String(info.m + 1).padStart(2,"0") + "-" + String(d).padStart(2,"0");
      cells.push({ day: d, currentMonth: true, dateStr: ds });
    }
    // 다음 달 (총 42칸 채우기)
    var nextDay = 1;
    while (cells.length < 42) {
      cells.push({ day: nextDay++, currentMonth: false, dateStr: null });
    }
    return cells;
  }, [calMonthInfo]);

  var changeMonth = function(delta) {
    var info = calMonthInfo;
    var newM = info.m + delta;
    var newY = info.y;
    if (newM < 0) { newM = 11; newY--; }
    if (newM > 11) { newM = 0; newY++; }
    setCalendarMonth(newY + "-" + String(newM + 1).padStart(2,"0"));
  };

  var todayStr = (function() { var d = new Date(); return d.getFullYear() + "-" + String(d.getMonth()+1).padStart(2,"0") + "-" + String(d.getDate()).padStart(2,"0"); })();

  // 🔍 노트 검색 결과 (제목/내용/담당자 매칭)
  var noteSearchResults = useMemo(function() {
    var q = (noteSearchQ || "").toLowerCase().trim();
    if (!q) return [];
    return filtered.filter(function(n) {
      var hay = ((n.title || "") + " " + (n.content || "") + " " + (n.assignee || "")).toLowerCase();
      return hay.indexOf(q) >= 0;
    }).slice(0, 10);
  }, [noteSearchQ, filtered]);

  var pinned = filtered.filter(function(n) { return n.pinned; });
  var unpinned = filtered.filter(function(n) { return !n.pinned; });

  var saveNew = async function() {
    // checkItems가 있으면 content로 변환해서 합치기 (마감일 [YYYY-MM-DD] 포함, 체크 상태도 반영)
    var checkContent = (newNote.checkItems && newNote.checkItems.length > 0)
      ? newNote.checkItems.filter(function(i) { return i.text.trim(); }).map(function(i) {
          var line = "- [" + (i.checked ? "x" : " ") + "] " + i.text.trim();
          if (i.dueDate) line += " [" + i.dueDate + "]";
          return line;
        }).join("\n")
      : "";
    var finalContent = newNote.content.trim();
    if (checkContent) finalContent = finalContent ? finalContent + "\n" + checkContent : checkContent;
    if (!newNote.title.trim() && !finalContent.trim()) { alert("제목 또는 내용을 입력해주세요."); return; }
    var assigneeName = newNote.target_assignee || profile?.name || "전체";
    var insertObj = {
      assignee: assigneeName,
      title: newNote.title.trim(),
      content: finalContent,
      is_todo: newNote.is_todo,
      pinned: newNote.pinned,
      created_by: profile?.name || assigneeName,
      // 노트 날짜 - 선택값 없으면 오늘
      note_date: newNote.note_date || kstDate(),
    };
    if (newNote.due_date) insertObj.due_date = newNote.due_date;
    var r = await supabase.from("work_notes").insert(insertObj).select().single();
    if (!r.error && r.data) {
      setNotes(function(prev) { return [r.data].concat(prev); });
      setShowAdd(false);
      // 담당자에게 브라우저 푸시 알림 전송
      if (assigneeName !== (profile?.name || "")) {
        await sendPushToUser(assigneeName, {
          title: "📋 새 업무가 배정됐어요",
          body: (newNote.title || finalContent.split("\n")[0] || "새 업무") + (newNote.due_date ? " · 마감: " + newNote.due_date : ""),
          url: window.location.origin + "?view=worknotes"
        });
      }
      // 기업명 자동 감지 → 활동로그 자동 기록
      var fullText = (newNote.title || "") + " " + finalContent;
      var detected = detectCompaniesInText(fullText);
      for (var i = 0; i < detected.length; i++) {
        await logToActivity(detected[i], "📝 업무노트: " + (newNote.title || newNote.content.split("\n")[0]));
      }
      setNewNote({ title: "", content: "", is_todo: false, pinned: false, target_assignee: "", checkItems: [], due_date: "", note_date: "" });
      // 사이드바 뱃지 업데이트
      if (onBadgeUpdate) onBadgeUpdate();
    } else if (r.error) {
      alert("저장 실패: " + r.error.message);
    }
  };

  var addReply = async function(noteId) {
    if (!replyText.trim()) return;
    var note = notes.find(function(n) { return n.id === noteId; });
    var replies = [];
    try { replies = JSON.parse(note.replies || "[]"); } catch(e) { replies = []; }
    replies.push({ by: profile?.name || "", text: replyText.trim(), at: new Date().toISOString() });
    await supabase.from("work_notes").update({ replies: JSON.stringify(replies) }).eq("id", noteId);
    setNotes(function(prev) { return prev.map(function(n) { return n.id === noteId ? Object.assign({}, n, { replies: JSON.stringify(replies) }) : n; }); });
    setReplyId(null);
    setReplyText("");
  };

  var onChecklistChange = async function(noteId, newContent) {
    var r = await supabase.from("work_notes").update({ content: newContent, updated_at: new Date().toISOString() }).eq("id", noteId);
    if (!r.error) {
      setNotes(function(prev) { return prev.map(function(n) { return n.id === noteId ? Object.assign({}, n, { content: newContent }) : n; }); });
      // 방금 체크 완료된 항목에 기업명이 있으면 활동로그 기록
      var prevNote = notes.find(function(n) { return n.id === noteId; });
      if (prevNote) {
        var prevLines = (prevNote.content || "").split("\n");
        var newLines = newContent.split("\n");
        for (var i = 0; i < newLines.length; i++) {
          var prevLine = prevLines[i] || "";
          var newLine = newLines[i];
          // 새로 체크된 항목 (- [ ] → - [x])
          if (/^- \[x\]/.test(newLine.trim()) && /^- \[ \]/.test(prevLine.trim())) {
            var itemText = newLine.trim().replace(/^- \[x\]\s*/, "");
            var detected = detectCompaniesInText(itemText);
            for (var j = 0; j < detected.length; j++) {
              await logToActivity(detected[j], "✅ 완료: " + itemText);
            }
          }
        }
      }
      // 사이드바 뱃지 업데이트
      if (onBadgeUpdate) onBadgeUpdate();
    }
  };

  var saveEdit = async function() {
    // checkItems + freeContent를 다시 content로 합치기
    var finalContent = editNote.content || "";
    if (editNote.checkItems !== undefined) {
      var checkLines = (editNote.checkItems || []).filter(function(i) { return (i.text || "").trim(); }).map(function(i) {
        var line = "- [" + (i.checked ? "x" : " ") + "] " + i.text.trim();
        if (i.dueDate) line += " [" + i.dueDate + "]";
        return line;
      });
      var freeText = (editNote.freeContent || "").trim();
      var parts = [];
      if (checkLines.length > 0) parts.push(checkLines.join("\n"));
      if (freeText) parts.push(freeText);
      finalContent = parts.join("\n");
    }
    
    var r = await supabase.from("work_notes").update({
      title: editNote.title,
      content: finalContent,
      is_todo: editNote.is_todo,
      pinned: editNote.pinned,
      due_date: editNote.due_date || null,
      updated_at: new Date().toISOString(),
    }).eq("id", editNote.id);
    if (!r.error) {
      setNotes(function(prev) { return prev.map(function(n) { return n.id === editNote.id ? Object.assign({}, n, editNote, { content: finalContent }) : n; }); });
      setEditingId(null); setEditNote({});
      if (onBadgeUpdate) onBadgeUpdate();
    }
  };

  var toggleDone = async function(note) {
    var r = await supabase.from("work_notes").update({ is_done: !note.is_done, updated_at: new Date().toISOString() }).eq("id", note.id);
    if (!r.error) {
      setNotes(function(prev) { return prev.map(function(n) { return n.id === note.id ? Object.assign({}, n, { is_done: !note.is_done }) : n; }); });
      // 사이드바 뱃지 업데이트
      if (onBadgeUpdate) onBadgeUpdate();
    }
  };

  var togglePin = async function(note) {
    var r = await supabase.from("work_notes").update({ pinned: !note.pinned, updated_at: new Date().toISOString() }).eq("id", note.id);
    if (!r.error) setNotes(function(prev) { return prev.map(function(n) { return n.id === note.id ? Object.assign({}, n, { pinned: !note.pinned }) : n; }); });
  };

  // 노트를 원하는 날짜로 이동 (못 한 업무를 다른 날로 넘기기)
  var moveNoteDate = async function(noteId, newDate) {
    if (!newDate) return;
    var r = await supabase.from("work_notes").update({ note_date: newDate, updated_at: new Date().toISOString() }).eq("id", noteId);
    if (!r.error) {
      setNotes(function(prev) { return prev.map(function(n) { return n.id === noteId ? Object.assign({}, n, { note_date: newDate }) : n; }); });
    } else {
      alert("날짜 이동 실패: " + r.error.message);
    }
  };

  var deleteNote = async function(id) {
    if (!window.confirm("휴지통으로 이동하시겠습니까? (휴지통에서 복구 가능)")) return;
    var r = await supabase.from("work_notes").update({ deleted_at: new Date().toISOString() }).eq("id", id);
    if (!r.error) {
      setNotes(function(prev) { return prev.filter(function(n) { return n.id !== id; }); });
      if (onBadgeUpdate) onBadgeUpdate();
    }
  };

  var fmtDate = function(iso) {
    if (!iso) return "";
    var d = new Date(iso);
    var now = new Date();
    var diff = now - d;
    var mins = Math.floor(diff / 60000);
    var hours = Math.floor(diff / 3600000);
    var days = Math.floor(diff / 86400000);
    if (mins < 1) return "방금 전";
    if (mins < 60) return mins + "분 전";
    if (hours < 24) return hours + "시간 전";
    if (days === 1) return "어제";
    if (days < 7) return days + "일 전";
    return d.toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
  };

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", flexDirection: "column", gap: 16 }}>
      <div style={{ width: 36, height: 36, border: "3px solid #E8E5E0", borderTopColor: "#1A1917", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <span style={{ color: "#888", fontSize: 13 }}>업무 노트 불러오는 중...</span>
    </div>
  );

  return (
    <div className="wn-root">
      {/* 헤더 */}
      <div className="wn-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.03em", margin: 0 }}>업무 노트</h1>
          <p style={{ color: "#888", fontSize: 13, margin: "4px 0 0" }}>메모 · 할 일 · 업무일지</p>
        </div>
        <div className="wn-actions" style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {/* 📅/📋 토글 */}
          <div style={{ display: "flex", gap: 2, padding: 3, background: "#F7F6F3", borderRadius: 8 }}>
            <button onClick={function() { setViewMode("calendar"); }}
              style={{ padding: "6px 12px", fontSize: 12, fontWeight: 600, background: viewMode === "calendar" ? "#fff" : "transparent", border: "1px solid " + (viewMode === "calendar" ? "#E8E5E0" : "transparent"), borderRadius: 6, color: viewMode === "calendar" ? "#1A1917" : "#888", cursor: "pointer" }}>📅 캘린더</button>
            <button onClick={function() { setViewMode("list"); }}
              style={{ padding: "6px 12px", fontSize: 12, fontWeight: 600, background: viewMode === "list" ? "#fff" : "transparent", border: "1px solid " + (viewMode === "list" ? "#E8E5E0" : "transparent"), borderRadius: 6, color: viewMode === "list" ? "#1A1917" : "#888", cursor: "pointer" }}>📋 목록</button>
          </div>
          <button onClick={function() { var nd = selectedDate || todayStr; var md = nd ? (parseInt(nd.slice(5,7)) + "월" + parseInt(nd.slice(8,10)) + "일") : ""; var pickName = (filterAssignee !== "전체" ? filterAssignee : (profile?.name || "")); var autoTitle = (md ? md + " " : "") + pickName + " 업무"; setShowAdd(true); setNewNote({ title: autoTitle, content: "", is_todo: false, pinned: false, target_assignee: (filterAssignee !== "전체" ? filterAssignee : ""), checkItems: [], due_date: "", note_date: nd }); }}
            style={{ display: "flex", alignItems: "center", gap: 6, background: "#1A1917", color: "#F7F6F3", border: "none", borderRadius: 8, padding: "10px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            <Icon name="plus" size={15} color="#F7F6F3" /> 새 노트
          </button>
          <button onClick={openTrash}
            style={{ display: "flex", alignItems: "center", gap: 6, background: "#fff", color: "#888", border: "1px solid #E8E5E0", borderRadius: 8, padding: "8px 14px", fontSize: 12, cursor: "pointer" }}>
            🗑️ 휴지통
          </button>
          <button onClick={fetchNotes} style={{ display: "flex", alignItems: "center", gap: 6, background: "#fff", color: "#555", border: "1px solid #E8E5E0", borderRadius: 8, padding: "8px 14px", fontSize: 12, cursor: "pointer" }}>
            <Icon name="refresh" size={13} color="#555" />
          </button>
        </div>
      </div>

      {/* 필터 */}
      <div style={{ display: "flex", gap: 16, marginBottom: 18, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
          <span style={{ fontSize: 12, color: "#888" }}>담당자:</span>
          {["전체"].concat(ASSIGNEES).map(function(a) {
            return (
              <div key={a} onClick={function() { setFilterAssignee(a); }}
                style={{ padding: "5px 13px", borderRadius: 99, cursor: "pointer", fontSize: 12, fontWeight: filterAssignee === a ? 700 : 400,
                  background: filterAssignee === a ? "#1A1917" : "#fff", color: filterAssignee === a ? "#fff" : "#666",
                  border: filterAssignee === a ? "none" : "1px solid #E8E5E0" }}>
                {a}
              </div>
            );
          })}
        </div>
        <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
          <span style={{ fontSize: 12, color: "#888" }}>유형:</span>
          {["전체","메모","할일"].map(function(t) {
            return (
              <div key={t} onClick={function() { setFilterType(t); }}
                style={{ padding: "5px 13px", borderRadius: 99, cursor: "pointer", fontSize: 12,
                  background: filterType === t ? "#1A1917" : "#fff", color: filterType === t ? "#fff" : "#666",
                  border: filterType === t ? "none" : "1px solid #E8E5E0" }}>
                {t}
              </div>
            );
          })}
        </div>
      </div>

      {/* 노트 수정 폼 (편집 중일 때 상단 전체 폭으로 표시) */}
      {editingId && (
        <div style={{ marginBottom: 20 }}>
          <NoteEditCard
            note={notes.find(function(n) { return n.id === editingId; })}
            editNote={editNote}
            setEditNote={setEditNote}
            saveEdit={saveEdit}
            onCancel={function() { setEditingId(null); setEditNote({}); }}
          />
        </div>
      )}

      {/* 새 노트 작성 폼 */}
      {showAdd && (
        <div className="wn-addform" style={{ background: "#F0FDF4", border: "2px solid #86EFAC", borderRadius: 12, padding: "18px 20px", marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#15803D", marginBottom: 12 }}>✏️ 새 노트 작성</div>
          <div style={{ display: "flex", gap: 16, marginBottom: 10, flexWrap: "wrap" }}>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer" }}>
              <input type="checkbox" checked={newNote.is_todo} onChange={function(e) { setNewNote(function(p) { return Object.assign({}, p, { is_todo: e.target.checked }); }); }} />
              📋 할 일로 등록
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer" }}>
              <input type="checkbox" checked={newNote.pinned} onChange={function(e) { setNewNote(function(p) { return Object.assign({}, p, { pinned: e.target.checked }); }); }} />
              📌 상단 고정
            </label>
          </div>
          <div style={{ marginBottom: 10 }}>
            <select value={newNote.target_assignee || profile?.name || ""} onChange={function(e) { var v = e.target.value; setNewNote(function(p) { return Object.assign({}, p, { target_assignee: v }); }); }}
              style={{ padding: "8px 12px", border: "1px solid #86EFAC", borderRadius: 8, fontSize: 13, background: "#fff", width: "auto" }}>
              <option value="">담당자 선택</option>
              {ASSIGNEES.map(function(a) { return <option key={a} value={a}>{a}</option>; })}
            </select>
          </div>
          <input value={newNote.title} placeholder="제목 (선택사항)" onChange={function(e) { var v = e.target.value; setNewNote(function(p) { return Object.assign({}, p, { title: v }); }); }}
            style={{ width: "100%", padding: "10px 13px", border: "1px solid #86EFAC", borderRadius: 8, fontSize: 14, fontWeight: 600, boxSizing: "border-box", outline: "none", marginBottom: 10, background: "#fff" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <label style={{ fontSize: 12, color: "#15803D", fontWeight: 600, whiteSpace: "nowrap" }}>📅 마감일</label>
            <input type="date" value={newNote.due_date || ""} onChange={function(e) { var v = e.target.value; setNewNote(function(p) { return Object.assign({}, p, { due_date: v }); }); }}
              style={{ width: "auto", padding: "7px 10px", border: "1px solid #86EFAC", borderRadius: 6, fontSize: 12, background: "#fff", outline: "none" }} />
            {newNote.due_date && <button onClick={function() { setNewNote(function(p) { return Object.assign({}, p, { due_date: "" }); }); }}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#AAA", fontSize: 14 }}>✕</button>}
          </div>
          {/* 체크리스트 항목들 */}
          {newNote.checkItems && newNote.checkItems.length > 0 && (
            <div style={{ border: "1px solid #86EFAC", borderRadius: 8, padding: "10px 12px", marginBottom: 8, background: "#fff" }}>
              {newNote.checkItems.map(function(item, idx) {
                return (
                  <div key={idx} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                    <input type="checkbox" disabled style={{ width: 15, height: 15, flexShrink: 0 }} />
                    <input type="text" value={item.text || ""} placeholder={"항목 " + (idx + 1) + " (예: 스크립트 작성)"}
                      onChange={function(e) { var v = e.target.value; setNewNote(function(p) { var items = p.checkItems.slice(); items[idx] = Object.assign({}, items[idx], { text: v }); return Object.assign({}, p, { checkItems: items }); }); }}
                      style={{ flex: 1, border: "none", outline: "none", fontSize: 13, background: "transparent" }} autoFocus={idx === newNote.checkItems.length - 1} />
                    <input type="date" value={item.dueDate || ""} title="이 항목의 마감일 (선택)"
                      onChange={function(e) { var v = e.target.value; setNewNote(function(p) { var items = p.checkItems.slice(); items[idx] = Object.assign({}, items[idx], { dueDate: v }); return Object.assign({}, p, { checkItems: items }); }); }}
                      style={{ padding: "3px 6px", border: "1px solid #E8E5E0", borderRadius: 4, fontSize: 11, color: "#4338CA", outline: "none", width: 130 }} />
                    <button onClick={function() { setNewNote(function(p) { var items = p.checkItems.filter(function(_, i) { return i !== idx; }); return Object.assign({}, p, { checkItems: items }); }); }}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "#888", fontSize: 16, padding: "0 4px", lineHeight: 1 }}>×</button>
                  </div>
                );
              })}
            </div>
          )}
          {/* 체크리스트 버튼 + textarea */}
          <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
            <button onClick={function() {
              setNewNote(function(p) {
                var items = (p.checkItems || []).concat([{ text: "" }]);
                return Object.assign({}, p, { checkItems: items, is_todo: true });
              });
            }} style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 12px", background: "#fff", border: "1px solid #86EFAC", borderRadius: 6, fontSize: 12, color: "#15803D", fontWeight: 600, cursor: "pointer" }}>
              ☑️ 체크리스트 항목 추가
            </button>
            <span style={{ fontSize: 10, color: "#888", alignSelf: "center", lineHeight: 1.4 }}>
              💡 직접 입력 시: <code style={{ background: "#F0EDE8", padding: "1px 4px", borderRadius: 3, fontSize: 10 }}>- [ ] 할일 [5/30]</code> 또는 <code style={{ background: "#F0EDE8", padding: "1px 4px", borderRadius: 3, fontSize: 10 }}>- [ ] 할일 → 5/30</code>
            </span>
          </div>
          <textarea value={newNote.content} placeholder={newNote.checkItems && newNote.checkItems.length > 0 ? "추가 메모 (선택사항)..." : "내용을 자유롭게 입력하세요. 업무 메모, 오늘 할 일, 주의사항 등..."} onChange={function(e) { var v = e.target.value; setNewNote(function(p) { return Object.assign({}, p, { content: v }); }); }} rows={newNote.checkItems && newNote.checkItems.length > 0 ? 2 : 6}
            style={{ width: "100%", padding: "12px 13px", border: "1px solid #86EFAC", borderRadius: 8, fontSize: 13, lineHeight: 1.75, resize: "vertical", boxSizing: "border-box", outline: "none", background: "#fff" }} />
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button onClick={saveNew} style={{ background: "#15803D", color: "#fff", border: "none", borderRadius: 8, padding: "10px 22px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>저장</button>
            <button onClick={function() { setShowAdd(false); }} style={{ background: "#fff", color: "#888", border: "1px solid #E8E5E0", borderRadius: 8, padding: "10px 16px", fontSize: 13, cursor: "pointer" }}>취소</button>
          </div>
        </div>
      )}

      {/* 📋 팀 업무 공간 (법인팀/개인팀) */}
      <TeamNotesSection profile={profile} onTakenToMyNote={function(noteData) {
        // 같은 id가 이미 notes에 있으면 교체, 없으면 새로 추가
        setNotes(function(prev) {
          var exists = prev.find(function(n) { return n.id === noteData.id; });
          if (exists) {
            return prev.map(function(n) { return n.id === noteData.id ? noteData : n; });
          }
          return [noteData].concat(prev);
        });
        if (onBadgeUpdate) onBadgeUpdate();
      }} />

      {/* 🔍 노트 검색 (양식 재활용용) */}
      <div style={{ position: "relative", marginBottom: 16, maxWidth: 600 }}>
        <div style={{ position: "relative" }}>
          <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: "#888" }}>🔍</span>
          <input type="text" value={noteSearchQ}
            onChange={function(e) { setNoteSearchQ(e.target.value); setNoteSearchOpen(true); }}
            onFocus={function() { if (noteSearchQ) setNoteSearchOpen(true); }}
            onBlur={function() { setTimeout(function() { setNoteSearchOpen(false); }, 200); }}
            onKeyDown={function(e) { if (e.key === "Escape") { setNoteSearchOpen(false); setNoteSearchQ(""); } }}
            placeholder="노트 내용·제목 검색 (양식 찾기, 비슷한 메모 참고용)"
            style={{ width: "100%", padding: "10px 14px 10px 38px", border: "1px solid #E8E5E0", borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box", background: "#fff" }} />
          {noteSearchQ && (
            <button onClick={function() { setNoteSearchQ(""); setNoteSearchOpen(false); }}
              style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "#AAA", padding: 4 }}>✕</button>
          )}
        </div>
        {/* 드롭다운 결과 */}
        {noteSearchOpen && noteSearchQ && (
          <div style={{ position: "absolute", top: "100%", left: 0, right: 0, marginTop: 4, background: "#fff", border: "1px solid #E8E5E0", borderRadius: 8, boxShadow: "0 8px 24px rgba(0,0,0,0.08)", zIndex: 100, maxHeight: 400, overflowY: "auto" }}>
            {noteSearchResults.length === 0 ? (
              <div style={{ padding: "20px 16px", textAlign: "center", color: "#AAA", fontSize: 13 }}>
                '{noteSearchQ}' 에 대한 노트가 없어요.
              </div>
            ) : (
              <>
                <div style={{ padding: "8px 14px", fontSize: 11, color: "#888", background: "#F7F6F3", borderBottom: "1px solid #E8E5E0" }}>
                  {noteSearchResults.length}건 매칭 · 클릭하면 그 날짜로 이동 · 📋 클릭하면 양식 복사
                </div>
                {noteSearchResults.map(function(n) {
                  var nd = getNoteDate(n);
                  // 검색어 매칭 부분 미리보기 (앞뒤 50자)
                  var content = n.content || "";
                  var q = noteSearchQ.toLowerCase();
                  var idx = content.toLowerCase().indexOf(q);
                  var preview;
                  if (idx >= 0) {
                    var s = Math.max(0, idx - 30);
                    var e = Math.min(content.length, idx + q.length + 50);
                    preview = (s > 0 ? "..." : "") + content.slice(s, e) + (e < content.length ? "..." : "");
                  } else {
                    preview = content.slice(0, 80) + (content.length > 80 ? "..." : "");
                  }
                  return (
                    <div key={n.id}
                      style={{ padding: "10px 14px", borderBottom: "1px solid #F7F6F3", display: "flex", gap: 10, alignItems: "flex-start" }}>
                      <div onMouseDown={function(e) {
                        e.preventDefault();
                        if (nd) {
                          setSelectedDate(nd);
                          // 캘린더 모드인데 다른 직원의 노트면 필터도 맞춤
                          if (n.assignee && filterAssignee !== "전체" && n.assignee !== filterAssignee) {
                            setFilterAssignee(n.assignee);
                          }
                        }
                        setNoteSearchOpen(false);
                        setNoteSearchQ("");
                      }} style={{ flex: 1, cursor: "pointer", minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: "#1A1917" }}>
                            {n.title || "(제목 없음)"}
                          </span>
                          <span style={{ fontSize: 10, color: "#888" }}>· {n.assignee || "-"}</span>
                          {nd && <span style={{ fontSize: 10, color: "#4338CA", background: "#EEF2FF", padding: "1px 6px", borderRadius: 99 }}>{nd}</span>}
                        </div>
                        <div style={{ fontSize: 12, color: "#666", lineHeight: 1.5, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                          {preview}
                        </div>
                      </div>
                      <button onMouseDown={function(e) {
                        e.preventDefault();
                        var txt = (n.title ? n.title + "\n\n" : "") + (n.content || "");
                        navigator.clipboard?.writeText(txt).then(function() {
                          alert("📋 양식이 복사됐어요. 새 노트에서 붙여넣기(Ctrl+V) 하세요.");
                        }).catch(function() {
                          alert("복사 실패. 브라우저에서 클립보드 권한을 허용해주세요.");
                        });
                      }} title="양식 복사 (클립보드)"
                        style={{ background: "#F7F6F3", border: "1px solid #E8E5E0", borderRadius: 6, padding: "5px 9px", fontSize: 11, cursor: "pointer", color: "#666", flexShrink: 0, fontWeight: 600 }}>📋 복사</button>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        )}
      </div>

      {/* 노트 목록 - 캘린더 모드 또는 리스트 모드 */}
      {viewMode === "calendar" ? (
        selectedDate === null ? (
          // ── 캘린더만 크게 보여줌 (날짜 선택 전) ──
          <div style={{ background: "#fff", border: "1px solid #E8E5E0", borderRadius: 12, padding: 24, maxWidth: 720, margin: "0 auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <button onClick={function() { changeMonth(-1); }} style={{ background: "#fff", border: "1px solid #E8E5E0", borderRadius: 8, padding: "8px 14px", fontSize: 14, cursor: "pointer" }}>◀ 이전 달</button>
              <div style={{ fontSize: 18, fontWeight: 700 }}>{calMonthInfo.y}년 {calMonthInfo.m + 1}월</div>
              <button onClick={function() { changeMonth(1); }} style={{ background: "#fff", border: "1px solid #E8E5E0", borderRadius: 8, padding: "8px 14px", fontSize: 14, cursor: "pointer" }}>다음 달 ▶</button>
            </div>
            {/* 요일 헤더 */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6, marginBottom: 8 }}>
              {["일","월","화","수","목","금","토"].map(function(w, i) {
                return <div key={w} style={{ textAlign: "center", fontSize: 12, fontWeight: 600, color: i === 0 ? "#DC2626" : i === 6 ? "#2563EB" : "#888", padding: "6px 0" }}>{w}</div>;
              })}
            </div>
            {/* 날짜 셀 */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6 }}>
              {calendarCells.map(function(cell, i) {
                if (!cell.currentMonth) {
                  return <div key={i} style={{ aspectRatio: "1", display: "flex", alignItems: "center", justifyContent: "center", color: "#888", fontSize: 14 }}>{cell.day}</div>;
                }
                var noteCount = (notesByDate[cell.dateStr] || []).length;
                var isToday = cell.dateStr === todayStr;
                var weekday = i % 7;
                return (
                  <div key={i} onClick={function() { setSelectedDate(cell.dateStr); }}
                    style={{ aspectRatio: "1", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", borderRadius: 10, cursor: "pointer", background: isToday ? "#1A1917" : (noteCount > 0 ? "#FEF3C7" : "#fff"), color: isToday ? "#fff" : (weekday === 0 ? "#DC2626" : weekday === 6 ? "#2563EB" : "#1A1917"), border: "1px solid " + (noteCount > 0 ? "#FCD34D" : "#F0EDE8"), position: "relative", fontWeight: noteCount > 0 || isToday ? 700 : 500, fontSize: 16, transition: "transform 0.1s" }}
                    onMouseEnter={function(e) { e.currentTarget.style.transform = "scale(1.03)"; }}
                    onMouseLeave={function(e) { e.currentTarget.style.transform = "scale(1)"; }}>
                    <span>{cell.day}</span>
                    {noteCount > 0 && !isToday && (
                      <span style={{ fontSize: 10, color: "#92400E", fontWeight: 600, marginTop: 2 }}>{noteCount}개</span>
                    )}
                    {noteCount > 0 && isToday && (
                      <span style={{ fontSize: 10, color: "#fff", marginTop: 2 }}>{noteCount}개</span>
                    )}
                  </div>
                );
              })}
            </div>
            <div style={{ marginTop: 18, padding: 14, background: "#F7F6F3", borderRadius: 8, fontSize: 12, color: "#666", textAlign: "center" }}>
              💡 어느 날짜든 클릭하면 그 날의 업무노트를 보거나 작성할 수 있어요. 미래 날짜도 가능합니다.
            </div>
          </div>
        ) : (
          // ── 선택된 날짜의 노트 + 미완료 사이드 (날짜 선택 후) ──
          <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 16, alignItems: "flex-start" }}>
            {/* 좌: 선택 날짜의 노트들 */}
            <div>
              {/* 날짜 헤더 + 캘린더로 돌아가기 */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, padding: "14px 18px", background: "#fff", borderRadius: 10, border: "1px solid #E8E5E0" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <button onClick={function() { setSelectedDate(null); }} title="캘린더로 돌아가기"
                    style={{ background: "#F7F6F3", border: "1px solid #E8E5E0", borderRadius: 8, padding: "6px 12px", fontSize: 12, cursor: "pointer", color: "#666" }}>📅 캘린더</button>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700 }}>
                      {(function() {
                        var d = new Date(selectedDate);
                        var w = ["일","월","화","수","목","금","토"][d.getDay()];
                        return d.getFullYear() + "년 " + (d.getMonth()+1) + "월 " + d.getDate() + "일 (" + w + ")";
                      })()}
                      {selectedDate === todayStr && <span style={{ marginLeft: 8, fontSize: 11, padding: "2px 8px", background: "#DCFCE7", color: "#15803D", borderRadius: 99, fontWeight: 600 }}>오늘</span>}
                      {selectedDate > todayStr && <span style={{ marginLeft: 8, fontSize: 11, padding: "2px 8px", background: "#DBEAFE", color: "#1E40AF", borderRadius: 99, fontWeight: 600 }}>예정</span>}
                    </div>
                    <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>
                      {filterAssignee === "전체" ? "전체 직원" : filterAssignee} · 노트 {notesForSelectedDate.length}개
                    </div>
                  </div>
                </div>
                <button onClick={function() { setShowAdd(true); setNewNote({ title: "", content: "", is_todo: false, pinned: false, target_assignee: (filterAssignee !== "전체" ? filterAssignee : ""), checkItems: [], due_date: "", note_date: selectedDate }); }}
                  style={{ background: "#1A1917", color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>+ 이 날짜에 노트 추가</button>
              </div>
              {/* 노트 카드들 */}
              {notesForSelectedDate.length === 0 ? (
                <div style={{ textAlign: "center", color: "#AAA", fontSize: 14, padding: "60px 0", background: "#fff", borderRadius: 10, border: "1px dashed #E8E5E0" }}>
                  <div style={{ fontSize: 36, marginBottom: 10 }}>📝</div>
                  이 날짜에 작성된 노트가 없어요.<br />
                  <span style={{ fontSize: 12 }}>"+ 이 날짜에 노트 추가" 버튼으로 작성하세요.</span>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 12 }}>
                  {notesForSelectedDate.map(function(note) {
                    return <NoteCard key={note.id} note={note} editingId={editingId} editNote={editNote} setEditNote={setEditNote} saveEdit={saveEdit} setEditingId={setEditingId} toggleDone={toggleDone} togglePin={togglePin} deleteNote={deleteNote} fmtDate={fmtDate} currentUserName={profile?.name} onChecklistChange={onChecklistChange} moveNoteDate={moveNoteDate} />;
                  })}
                </div>
              )}
            </div>
            {/* 우: 미완료 체크박스 사이드 */}
            <div style={{ background: "#fff", border: "1px solid #E8E5E0", borderRadius: 10, padding: "14px 16px", position: "sticky", top: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12, paddingBottom: 10, borderBottom: "1px solid #F0EDE8" }}>
                <span style={{ fontSize: 14 }}>📌</span>
                <div style={{ fontSize: 13, fontWeight: 700 }}>미완료 업무</div>
                <span style={{ marginLeft: "auto", fontSize: 11, color: "#888", background: "#F7F6F3", padding: "2px 8px", borderRadius: 99 }}>{unfinishedItems.length}건</span>
              </div>
              {unfinishedItems.length === 0 ? (
                <div style={{ textAlign: "center", color: "#AAA", fontSize: 12, padding: "30px 0" }}>
                  🎉 모든 업무 완료!
                </div>
              ) : (
                <div style={{ maxHeight: "calc(100vh - 200px)", overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
                  {unfinishedItems.slice(0, 50).map(function(item, i) {
                    var isDueToday = item.dueDate === todayStr;
                    var isOverdue = item.dueDate && item.dueDate < todayStr;
                    return (
                      <div key={i} onClick={function() { if (item.noteDate) setSelectedDate(item.noteDate); }}
                        style={{ padding: "8px 10px", borderRadius: 6, background: isOverdue ? "#FEE2E2" : isDueToday ? "#FEF3C7" : "#F7F6F3", cursor: "pointer", border: "1px solid " + (isOverdue ? "#FCA5A5" : isDueToday ? "#FCD34D" : "transparent") }}>
                        <div style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
                          <span style={{ fontSize: 11, marginTop: 1 }}>☐</span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 12, color: "#1A1917", lineHeight: 1.4, wordBreak: "break-word" }}>{item.text}</div>
                            <div style={{ display: "flex", gap: 6, marginTop: 4, fontSize: 10, color: "#888", flexWrap: "wrap" }}>
                              {item.assignee && <span>👤 {item.assignee}</span>}
                              {item.dueDate && (
                                <span style={{ color: isOverdue ? "#B91C1C" : isDueToday ? "#92400E" : "#888", fontWeight: 600 }}>
                                  📅 {item.dueDate}{isOverdue ? " (지남)" : isDueToday ? " (오늘)" : ""}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {unfinishedItems.length > 50 && (
                    <div style={{ textAlign: "center", fontSize: 11, color: "#888", padding: 6 }}>... 외 {unfinishedItems.length - 50}건</div>
                  )}
                </div>
              )}
            </div>
          </div>
        )
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", color: "#888", fontSize: 14, padding: "80px 0" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📝</div>
          아직 작성된 노트가 없어요.<br />
          <span style={{ fontSize: 13 }}>"새 노트" 버튼을 눌러 첫 메모를 남겨보세요!</span>
        </div>
      ) : (
        <div>
          {/* 고정 노트 */}
          {pinned.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#B45309", letterSpacing: "0.05em", marginBottom: 10 }}>📌 고정된 노트</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 12 }}>
                {pinned.map(function(note) { return <NoteCard key={note.id} note={note} editingId={editingId} editNote={editNote} setEditNote={setEditNote} saveEdit={saveEdit} setEditingId={setEditingId} toggleDone={toggleDone} togglePin={togglePin} deleteNote={deleteNote} fmtDate={fmtDate} currentUserName={profile?.name} onChecklistChange={onChecklistChange} moveNoteDate={moveNoteDate} />; })}
              </div>
            </div>
          )}
          {/* 일반 노트 */}
          {unpinned.length > 0 && (
            <div>
              {pinned.length > 0 && <div style={{ fontSize: 11, fontWeight: 700, color: "#888", letterSpacing: "0.05em", marginBottom: 10 }}>전체 노트</div>}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 12 }}>
                {unpinned.map(function(note) { return <NoteCard key={note.id} note={note} editingId={editingId} editNote={editNote} setEditNote={setEditNote} saveEdit={saveEdit} setEditingId={setEditingId} toggleDone={toggleDone} togglePin={togglePin} deleteNote={deleteNote} fmtDate={fmtDate} currentUserName={profile?.name} onChecklistChange={onChecklistChange} moveNoteDate={moveNoteDate} />; })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 휴지통 모달 */}
      {showTrash && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}
          onMouseDown={function(e) { if (e.target === e.currentTarget) setShowTrash(false); }}>
          <div style={{ background: "#fff", borderRadius: 14, width: 560, maxHeight: "80vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #E8E5E0", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, background: "#fff" }}>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>🗑️ 업무노트 휴지통 ({trashedNotes.length}건)</h2>
              <button onClick={function() { setShowTrash(false); }} style={{ background: "none", border: "none", cursor: "pointer" }}>
                <Icon name="x" size={18} color="#888" />
              </button>
            </div>
            <div style={{ padding: "16px 24px" }}>
              {trashedNotes.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 0", color: "#888", fontSize: 14 }}>
                  <div style={{ fontSize: 36, marginBottom: 10 }}>🗑️</div>
                  휴지통이 비어 있습니다
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {trashedNotes.map(function(note) {
                    var deletedAt = note.deleted_at ? new Date(note.deleted_at).toLocaleDateString("ko-KR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "";
                    return (
                      <div key={note.id} style={{ background: "#F7F6F3", borderRadius: 10, padding: "14px 16px", border: "1px solid #E8E5E0" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: "#1A1917", marginBottom: 2 }}>{note.title || "(제목 없음)"}</div>
                            <div style={{ fontSize: 11, color: "#AAA" }}>{note.assignee} · 삭제일: {deletedAt}</div>
                          </div>
                          <div style={{ display: "flex", gap: 6 }}>
                            <button onClick={function() { restoreNote(note.id); }}
                              style={{ background: "#EEF2FF", color: "#4338CA", border: "none", borderRadius: 6, padding: "5px 12px", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                              복구
                            </button>
                            <button onClick={function() { permanentDeleteNote(note.id); }}
                              style={{ background: "#FEF2F2", color: "#DC2626", border: "none", borderRadius: 6, padding: "5px 12px", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                              완전삭제
                            </button>
                          </div>
                        </div>
                        {note.content && (
                          <div style={{ fontSize: 12, color: "#888", lineHeight: 1.6, whiteSpace: "pre-wrap", maxHeight: 60, overflow: "hidden" }}>
                            {note.content}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
// ── 협업 담당자 ────────────────────────────────────────────────────────────────
function PartnersView() {
  const [partners, setPartners] = useState([]);
  const [introByRef, setIntroByRef] = useState({}); // {소개자이름: [업체...]}
  const [expandedId, setExpandedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null); // 수정 중인 항목 (null이면 신규)
  const [form, setForm] = useState({ name: "", org: "", phone: "", email: "", role: "", memo: "" });
  const [search, setSearch] = useState("");

  function fetchPartners() {
    setLoading(true);
    supabase.from("partners").select("*").order("created_at", { ascending: true }).then(function(r) {
      if (!r.error) setPartners(r.data || []);
      setLoading(false);
    });
    // 소개받은 업체 집계 (companies.referrer 기준)
    supabase.from("companies").select("id,name,stage,referrer").not("referrer", "is", null).then(function(r) {
      if (!r.error) {
        var map = {};
        (r.data || []).forEach(function(c) {
          var ref = (c.referrer || "").trim();
          if (!ref) return;
          if (!map[ref]) map[ref] = [];
          map[ref].push(c);
        });
        setIntroByRef(map);
      }
    });
  }
  useEffect(fetchPartners, []);

  function openNew() { setEditing(null); setForm({ name: "", org: "", phone: "", email: "", role: "", memo: "" }); setShowForm(true); }
  function openEdit(pt) { setEditing(pt); setForm({ name: pt.name || "", org: pt.org || "", phone: pt.phone || "", email: pt.email || "", role: pt.role || "", memo: pt.memo || "" }); setShowForm(true); }

  async function save() {
    if (!form.name.trim()) { alert("이름/직함을 입력해주세요."); return; }
    if (editing) {
      var r = await supabase.from("partners").update(form).eq("id", editing.id);
      if (r.error) { alert("저장 실패: " + r.error.message); return; }
    } else {
      var r2 = await supabase.from("partners").insert(form);
      if (r2.error) { alert("저장 실패: " + r2.error.message); return; }
    }
    setShowForm(false);
    fetchPartners();
  }
  async function remove(id) {
    if (!confirm("이 담당자를 삭제할까요?")) return;
    await supabase.from("partners").delete().eq("id", id);
    fetchPartners();
  }

  var filtered = partners.filter(function(pt) {
    if (!search.trim()) return true;
    var q = search.toLowerCase();
    return [pt.name, pt.org, pt.role, pt.phone, pt.email, pt.memo].some(function(v) { return (v || "").toLowerCase().indexOf(q) >= 0; });
  });

  var thStyle = { padding: "10px 12px", fontSize: 11, fontWeight: 600, color: "#888", textAlign: "left", background: "#F7F6F3", whiteSpace: "nowrap" };
  var tdStyle = { padding: "11px 12px", fontSize: 13, color: "#333", borderBottom: "1px solid #F0EFEA", verticalAlign: "top" };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, gap: 10, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.03em", margin: 0 }}>협업 담당자</h1>
          <p style={{ color: "#888", fontSize: 13, margin: "4px 0 0" }}>회계사 · 법무사 · 세무사 등 외부 협업 파트너 연락처</p>
        </div>
        <button onClick={openNew} style={{ background: "#534AB7", color: "#fff", border: "none", borderRadius: 8, padding: "9px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>+ 담당자 추가</button>
      </div>

      <input value={search} onChange={function(e) { setSearch(e.target.value); }} placeholder="이름 · 소속 · 업무 검색"
        style={{ width: "100%", maxWidth: 340, padding: "9px 12px", border: "1px solid #E8E5E0", borderRadius: 8, fontSize: 13, boxSizing: "border-box", outline: "none", marginBottom: 16 }} />

      {loading ? (
        <div style={{ padding: 40, textAlign: "center", color: "#888" }}>불러오는 중...</div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: 40, textAlign: "center", color: "#888", background: "#FAFAF8", borderRadius: 10 }}>{partners.length === 0 ? "아직 등록된 협업 담당자가 없어요. [+ 담당자 추가]를 눌러보세요." : "검색 결과가 없어요."}</div>
      ) : (
        <div style={{ overflowX: "auto", border: "1px solid #EEE", borderRadius: 10 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 720 }}>
            <thead>
              <tr>
                <th style={thStyle}>이름 / 직함</th>
                <th style={thStyle}>소속</th>
                <th style={thStyle}>연락처</th>
                <th style={thStyle}>이메일</th>
                <th style={thStyle}>주요 업무</th>
                <th style={Object.assign({}, thStyle, { textAlign: "center" })}>소개 업체</th>
                <th style={thStyle}>비고</th>
                <th style={Object.assign({}, thStyle, { textAlign: "center", width: 90 })}>관리</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(function(pt) {
                var intros = introByRef[pt.name] || [];
                var isExpanded = expandedId === pt.id;
                return (
                  <Fragment key={pt.id}>
                  <tr>
                    <td style={Object.assign({}, tdStyle, { fontWeight: 700 })}>{pt.name}</td>
                    <td style={tdStyle}>{pt.org || "-"}</td>
                    <td style={tdStyle}>{pt.phone ? <a href={"tel:" + pt.phone} style={{ color: "#0369A1", textDecoration: "none" }}>{pt.phone}</a> : "-"}</td>
                    <td style={tdStyle}>{pt.email ? <a href={"mailto:" + pt.email} style={{ color: "#0369A1", textDecoration: "none" }}>{pt.email}</a> : "-"}</td>
                    <td style={tdStyle}>{pt.role || "-"}</td>
                    <td style={Object.assign({}, tdStyle, { textAlign: "center" })}>
                      {intros.length > 0 ? (
                        <button onClick={function() { setExpandedId(isExpanded ? null : pt.id); }} style={{ background: "#EEF2FF", color: "#4338CA", border: "none", borderRadius: 99, padding: "3px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>{intros.length}건 {isExpanded ? "▲" : "▼"}</button>
                      ) : <span style={{ fontSize: 12, color: "#888" }}>-</span>}
                    </td>
                    <td style={Object.assign({}, tdStyle, { color: "#888", fontSize: 12, whiteSpace: "pre-wrap" })}>{pt.memo || "-"}</td>
                    <td style={Object.assign({}, tdStyle, { textAlign: "center", whiteSpace: "nowrap" })}>
                      <button onClick={function() { openEdit(pt); }} style={{ background: "none", border: "1px solid #E8E5E0", borderRadius: 6, padding: "4px 8px", fontSize: 11, cursor: "pointer", marginRight: 4 }}>수정</button>
                      <button onClick={function() { remove(pt.id); }} style={{ background: "none", border: "1px solid #F0D0D0", borderRadius: 6, padding: "4px 8px", fontSize: 11, color: "#DC2626", cursor: "pointer" }}>삭제</button>
                    </td>
                  </tr>
                  {isExpanded && intros.length > 0 && (
                    <tr>
                      <td colSpan={8} style={{ padding: "10px 16px", background: "#F7F8FC", borderBottom: "1px solid #E8E5E0" }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#4338CA", marginBottom: 6 }}>{pt.name} 님이 소개한 업체 ({intros.length}건)</div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                          {intros.map(function(c) {
                            return <span key={c.id} style={{ fontSize: 12, background: "#fff", border: "1px solid #E0E0EA", borderRadius: 6, padding: "4px 10px", color: "#333" }}>{c.name}{c.stage ? <span style={{ color: "#999", marginLeft: 5 }}>· {c.stage}</span> : ""}</span>;
                          })}
                        </div>
                      </td>
                    </tr>
                  )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div onClick={function(e) { e.stopPropagation(); }} style={{ background: "#fff", borderRadius: 12, width: "100%", maxWidth: 460, maxHeight: "90vh", overflowY: "auto", padding: 24 }}>
            <h2 style={{ margin: "0 0 18px", fontSize: 17, fontWeight: 700 }}>{editing ? "담당자 수정" : "협업 담당자 추가"}</h2>
            {[
              { k: "name", label: "이름 / 직함", ph: "예: 회계사 양용석", req: true },
              { k: "org", label: "소속", ph: "예: 안세회계법인" },
              { k: "phone", label: "연락처", ph: "예: 010-1234-5678" },
              { k: "email", label: "이메일", ph: "예: name@example.com" },
              { k: "role", label: "주요 업무", ph: "예: 법인 세무·기장·결산" },
            ].map(function(f) {
              return (
                <div key={f.k} style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 12, color: "#888", marginBottom: 5, fontWeight: 600 }}>{f.label}{f.req && <span style={{ color: "#DC2626" }}> *</span>}</div>
                  <input value={form[f.k]} onChange={function(e) { var v = e.target.value; setForm(function(p) { return Object.assign({}, p, { [f.k]: v }); }); }}
                    placeholder={f.ph} style={{ width: "100%", padding: "10px 12px", border: "1px solid #E8E5E0", borderRadius: 8, fontSize: 14, boxSizing: "border-box", outline: "none" }} />
                </div>
              );
            })}
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 12, color: "#888", marginBottom: 5, fontWeight: 600 }}>비고</div>
              <textarea value={form.memo} onChange={function(e) { var v = e.target.value; setForm(function(p) { return Object.assign({}, p, { memo: v }); }); }}
                placeholder="수수료 조건, 협업 이력 등 자유 메모" style={{ width: "100%", minHeight: 60, padding: "10px 12px", border: "1px solid #E8E5E0", borderRadius: 8, fontSize: 14, boxSizing: "border-box", outline: "none", resize: "vertical", fontFamily: "inherit" }} />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={save} style={{ flex: 1, background: "#534AB7", color: "#fff", border: "none", borderRadius: 8, padding: "12px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>{editing ? "저장" : "추가"}</button>
              <button onClick={function() { setShowForm(false); }} style={{ background: "#fff", color: "#888", border: "1px solid #E8E5E0", borderRadius: 8, padding: "12px 18px", fontSize: 14, cursor: "pointer" }}>취소</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── 연차/휴가 관리 ────────────────────────────────────────────────────────────
function LeaveView({ profile, profiles }) {
  const myName = (profile && profile.name) || "";
  const isApprover = myName === "양호" || myName === "유진";
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newReq, setNewReq] = useState({ type: "연차", start_date: "", end_date: "", reason: "" });
  const [editId, setEditId] = useState(null);
  const [calMonth, setCalMonth] = useState(function() { var d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });

  const LEAVE_TYPES = ["연차", "반차", "병가", "경조사"];
  const TYPE_COLORS = { "연차": { bg: "#E1F5EE", fg: "#0F6E56" }, "반차": { bg: "#FAEEDA", fg: "#854F0B" }, "병가": { bg: "#FCEBEB", fg: "#A32D2D" }, "경조사": { bg: "#EEEDFE", fg: "#534AB7" } };
  const STATUS_COLORS = { "대기": { bg: "#FAEEDA", fg: "#854F0B" }, "승인": { bg: "#EAF3DE", fg: "#3B6D11" }, "반려": { bg: "#FCEBEB", fg: "#A32D2D" }, "취소": { bg: "#EFEFEF", fg: "#888888" } };

  function fetchRequests() {
    setLoading(true);
    supabase.from("leave_requests").select("*").order("start_date", { ascending: false }).then(function(r) {
      if (!r.error) setRequests(r.data || []);
      setLoading(false);
    });
  }
  useEffect(fetchRequests, []);

  var myRequests = requests.filter(function(r) { return r.requester_name === myName; });
  var pending = requests.filter(function(r) { return r.status === "대기"; });
  var usedDays = myRequests.filter(function(r) { return r.status === "승인"; }).reduce(function(s, r) { return s + (Number(r.days) || 0); }, 0);

  function calcDays(start, end, type) {
    if (type === "반차") return 0.5;
    if (!start) return 0;
    if (!end || end === start) return 1;
    var d1 = new Date(start), d2 = new Date(end);
    var diff = Math.round((d2 - d1) / (1000 * 60 * 60 * 24)) + 1;
    return diff > 0 ? diff : 1;
  }

  function fmtKDate(s) {
    if (!s) return "";
    var d = new Date(s);
    var days = ["일", "월", "화", "수", "목", "금", "토"];
    return (d.getMonth() + 1) + "/" + d.getDate() + " (" + days[d.getDay()] + ")";
  }

  async function submitRequest() {
    if (!newReq.start_date) { alert("시작일을 입력해주세요."); return; }
    var end = newReq.type === "반차" ? newReq.start_date : (newReq.end_date || newReq.start_date);
    var days = calcDays(newReq.start_date, end, newReq.type);
    if (editId) {
      // 수정: 기존 신청을 다시 '대기' 상태로 (승인자 재확인 필요)
      var u = await supabase.from("leave_requests").update({
        type: newReq.type, start_date: newReq.start_date, end_date: end,
        days: days, reason: newReq.reason, status: "대기", approved_by: null,
      }).eq("id", editId);
      if (u.error) { alert("수정 실패: " + u.error.message); return; }
      setShowForm(false); setEditId(null);
      setNewReq({ type: "연차", start_date: "", end_date: "", reason: "" });
      fetchRequests();
      return;
    }
    var r = await supabase.from("leave_requests").insert({
      requester_name: myName, type: newReq.type,
      start_date: newReq.start_date, end_date: end,
      days: days, reason: newReq.reason, status: "대기",
    });
    if (r.error) { alert("신청 실패: " + r.error.message); return; }
    setShowForm(false);
    setNewReq({ type: "연차", start_date: "", end_date: "", reason: "" });
    fetchRequests();
  }

  // 수정 시작: 기존 신청 내용을 폼에 채워 모달 열기
  function startEdit(r) {
    setNewReq({ type: r.type, start_date: r.start_date, end_date: r.end_date === r.start_date ? "" : r.end_date, reason: r.reason || "" });
    setEditId(r.id);
    setShowForm(true);
  }

  // 신청 취소: 대기중이면 삭제, 승인됐으면 '취소' 상태로 (기록 남김)
  async function cancelReq(r) {
    if (r.status === "승인") {
      if (!confirm("이미 승인된 휴가입니다. 취소하면 관리자에게 취소로 표시됩니다. 취소할까요?")) return;
      var u = await supabase.from("leave_requests").update({ status: "취소" }).eq("id", r.id);
      if (u.error) { alert("취소 실패: " + u.error.message); return; }
      fetchRequests();
    } else {
      if (!confirm("이 신청을 취소(삭제)할까요?")) return;
      await supabase.from("leave_requests").delete().eq("id", r.id);
      fetchRequests();
    }
  }

  async function decide(id, status) {
    var r = await supabase.from("leave_requests").update({ status: status, approved_by: myName }).eq("id", id);
    if (r.error) { alert("처리 실패: " + r.error.message); return; }
    fetchRequests();
  }

  async function deleteReq(id) {
    if (!confirm("이 신청을 삭제할까요?")) return;
    await supabase.from("leave_requests").delete().eq("id", id);
    fetchRequests();
  }

  // 캘린더: 해당 월 승인된 휴가를 날짜별로
  var year = calMonth.getFullYear(), mon = calMonth.getMonth();
  var firstDay = new Date(year, mon, 1).getDay();
  var daysInMonth = new Date(year, mon + 1, 0).getDate();
  var leaveByDate = {};
  requests.filter(function(r) { return r.status === "승인"; }).forEach(function(r) {
    var d1 = new Date(r.start_date), d2 = new Date(r.end_date || r.start_date);
    for (var d = new Date(d1); d <= d2; d.setDate(d.getDate() + 1)) {
      if (d.getFullYear() === year && d.getMonth() === mon) {
        var key = d.getDate();
        if (!leaveByDate[key]) leaveByDate[key] = [];
        leaveByDate[key].push(r);
      }
    }
  });

  function renderRequestRow(r, showName, showActions) {
    var tc = TYPE_COLORS[r.type] || TYPE_COLORS["연차"];
    var sc = STATUS_COLORS[r.status] || STATUS_COLORS["대기"];
    var period = r.type === "반차" ? (fmtKDate(r.start_date) + " · 0.5일")
      : (r.start_date === r.end_date ? (fmtKDate(r.start_date) + " · " + r.days + "일")
        : (fmtKDate(r.start_date) + " ~ " + fmtKDate(r.end_date) + " · " + r.days + "일"));
    return (
      <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "#FAFAF8", border: "0.5px solid #E8E5E0", borderRadius: 8, fontSize: 13 }}>
        {showName && <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#EEEDFE", color: "#534AB7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{r.requester_name}</div>}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <span style={{ background: tc.bg, color: tc.fg, fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 6 }}>{r.type}</span>
            <span>{period}</span>
          </div>
          {r.reason && <div style={{ fontSize: 11, color: "#888", marginTop: 3 }}>사유: {r.reason}</div>}
        </div>
        {showActions ? (
          <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
            <button onClick={function() { decide(r.id, "승인"); }} style={{ background: "#0F6E56", color: "#fff", border: "none", borderRadius: 6, padding: "6px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>승인</button>
            <button onClick={function() { decide(r.id, "반려"); }} style={{ background: "#fff", color: "#A32D2D", border: "0.5px solid #F09595", borderRadius: 6, padding: "6px 12px", fontSize: 12, cursor: "pointer" }}>반려</button>
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
            <span style={{ background: sc.bg, color: sc.fg, fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 6 }}>{r.status === "대기" ? "대기중" : r.status === "승인" ? "승인됨" : r.status === "취소" ? "취소됨" : "반려됨"}</span>
            {r.requester_name === myName && r.status === "대기" && (
              <button onClick={function() { startEdit(r); }} style={{ background: "#fff", border: "0.5px solid #C7C3F0", borderRadius: 6, padding: "4px 10px", fontSize: 11, fontWeight: 600, color: "#534AB7", cursor: "pointer" }} title="신청 수정">수정</button>
            )}
            {r.requester_name === myName && (r.status === "대기" || r.status === "승인") && (
              <button onClick={function() { cancelReq(r); }} style={{ background: "#fff", border: "0.5px solid #E8E5E0", borderRadius: 6, padding: "4px 10px", fontSize: 11, color: "#888", cursor: "pointer" }} title="신청 취소">취소</button>
            )}
          </div>
        )}
      </div>
    );
  }

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "#888" }}>불러오는 중...</div>;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.03em", margin: 0 }}>연차 / 휴가</h1>
          <p style={{ color: "#888", fontSize: 13, margin: "4px 0 0" }}>{isApprover ? "전체 신청 관리 · 승인" : "내 휴가 신청 · 내역"}</p>
        </div>
        <button onClick={function() { setShowForm(true); }} style={{ background: "#534AB7", color: "#fff", border: "none", borderRadius: 8, padding: "9px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>+ 휴가 신청</button>
      </div>

      {/* 내 연차 현황 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 6 }}>
        <div style={{ background: "#F7F6F3", borderRadius: 8, padding: 14 }}>
          <div style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>총 연차</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#888" }}>— 일</div>
        </div>
        <div style={{ background: "#F7F6F3", borderRadius: 8, padding: 14 }}>
          <div style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>사용 (승인됨)</div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>{usedDays} 일</div>
        </div>
        <div style={{ background: "#F7F6F3", borderRadius: 8, padding: 14 }}>
          <div style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>잔여</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#0F6E56" }}>— 일</div>
        </div>
      </div>
      <div style={{ fontSize: 11, color: "#888", marginBottom: 20 }}>※ 총 연차 일수는 협의 후 입력 예정</div>

      {/* 승인권자: 승인 대기 */}
      {isApprover && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
            승인 대기 {pending.length > 0 && <span style={{ background: "#FAEEDA", color: "#854F0B", fontSize: 11, padding: "1px 7px", borderRadius: 6 }}>{pending.length}건</span>}
          </div>
          {pending.length === 0 ? (
            <div style={{ fontSize: 12, color: "#888", padding: "12px", background: "#FAFAF8", borderRadius: 8, textAlign: "center" }}>대기 중인 신청이 없습니다.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {pending.map(function(r) { return renderRequestRow(r, true, true); })}
            </div>
          )}
        </div>
      )}

      {/* 휴가 캘린더 */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{ fontSize: 13, fontWeight: 700 }}>휴가 캘린더</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button onClick={function() { setCalMonth(new Date(year, mon - 1, 1)); }} style={{ background: "none", border: "0.5px solid #E8E5E0", borderRadius: 6, padding: "4px 9px", cursor: "pointer", fontSize: 13 }}>‹</button>
            <span style={{ fontSize: 13, fontWeight: 600, minWidth: 70, textAlign: "center" }}>{year}.{mon + 1}</span>
            <button onClick={function() { setCalMonth(new Date(year, mon + 1, 1)); }} style={{ background: "none", border: "0.5px solid #E8E5E0", borderRadius: 6, padding: "4px 9px", cursor: "pointer", fontSize: 13 }}>›</button>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 3 }}>
          {["일", "월", "화", "수", "목", "금", "토"].map(function(d) {
            return <div key={d} style={{ textAlign: "center", fontSize: 11, color: "#888", padding: "3px 0", fontWeight: 600 }}>{d}</div>;
          })}
          {Array.from({ length: firstDay }).map(function(_, i) { return <div key={"e" + i}></div>; })}
          {Array.from({ length: daysInMonth }).map(function(_, i) {
            var day = i + 1;
            var leaves = leaveByDate[day] || [];
            return (
              <div key={day} style={{ minHeight: 54, borderRadius: 6, background: leaves.length ? "#F0FDF4" : "#FAFAF8", border: "0.5px solid #F0EFEa", padding: 4, fontSize: 11 }}>
                <div style={{ color: "#999", marginBottom: 2 }}>{day}</div>
                {leaves.slice(0, 3).map(function(r, idx) {
                  var tc = TYPE_COLORS[r.type] || TYPE_COLORS["연차"];
                  return <div key={idx} style={{ fontSize: 9.5, color: tc.fg, background: tc.bg, borderRadius: 3, padding: "1px 3px", marginBottom: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.requester_name} {r.type === "반차" ? "반차" : ""}</div>;
                })}
                {leaves.length > 3 && <div style={{ fontSize: 9, color: "#999" }}>+{leaves.length - 3}</div>}
              </div>
            );
          })}
        </div>
      </div>

      {/* 내 신청 내역 */}
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>내 신청 내역</div>
        {myRequests.length === 0 ? (
          <div style={{ fontSize: 12, color: "#888", padding: "12px", background: "#FAFAF8", borderRadius: 8, textAlign: "center" }}>아직 신청한 휴가가 없어요.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {myRequests.map(function(r) { return renderRequestRow(r, false, false); })}
          </div>
        )}
      </div>

      {/* 신청 폼 모달 */}
      {showForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div onClick={function(e) { e.stopPropagation(); }} style={{ background: "#fff", borderRadius: 12, width: "100%", maxWidth: 420, padding: 24 }}>
            <h2 style={{ margin: "0 0 18px", fontSize: 17, fontWeight: 700 }}>{editId ? "휴가 신청 수정" : "휴가 신청"}</h2>

            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, color: "#888", marginBottom: 6, fontWeight: 600 }}>종류</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {LEAVE_TYPES.map(function(t) {
                  var sel = newReq.type === t;
                  var tc = TYPE_COLORS[t];
                  return <button key={t} onClick={function() { setNewReq(function(p) { return Object.assign({}, p, { type: t }); }); }}
                    style={{ padding: "7px 14px", borderRadius: 8, border: sel ? ("1.5px solid " + tc.fg) : "1px solid #E8E5E0", background: sel ? tc.bg : "#fff", color: sel ? tc.fg : "#888", fontSize: 13, fontWeight: sel ? 700 : 400, cursor: "pointer" }}>{t}</button>;
                })}
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, color: "#888", marginBottom: 6, fontWeight: 600 }}>{newReq.type === "반차" ? "날짜" : "시작일"}</div>
              <input type="date" value={newReq.start_date} onChange={function(e) { var v = e.target.value; setNewReq(function(p) { return Object.assign({}, p, { start_date: v }); }); }}
                style={{ width: "100%", padding: "10px 12px", border: "1px solid #E8E5E0", borderRadius: 8, fontSize: 14, boxSizing: "border-box", outline: "none" }} />
            </div>

            {newReq.type !== "반차" && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, color: "#888", marginBottom: 6, fontWeight: 600 }}>종료일 <span style={{ color: "#888", fontWeight: 400 }}>(하루면 비워두세요)</span></div>
                <input type="date" value={newReq.end_date} onChange={function(e) { var v = e.target.value; setNewReq(function(p) { return Object.assign({}, p, { end_date: v }); }); }}
                  style={{ width: "100%", padding: "10px 12px", border: "1px solid #E8E5E0", borderRadius: 8, fontSize: 14, boxSizing: "border-box", outline: "none" }} />
              </div>
            )}

            <div style={{ marginBottom: 8, fontSize: 12, color: "#534AB7", fontWeight: 600 }}>
              → {calcDays(newReq.start_date, newReq.type === "반차" ? newReq.start_date : (newReq.end_date || newReq.start_date), newReq.type) || 0}일 신청
            </div>

            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 12, color: "#888", marginBottom: 6, fontWeight: 600 }}>사유 <span style={{ color: "#888", fontWeight: 400 }}>(선택)</span></div>
              <input value={newReq.reason} onChange={function(e) { var v = e.target.value; setNewReq(function(p) { return Object.assign({}, p, { reason: v }); }); }}
                placeholder="예: 개인 일정, 병원 진료" style={{ width: "100%", padding: "10px 12px", border: "1px solid #E8E5E0", borderRadius: 8, fontSize: 14, boxSizing: "border-box", outline: "none" }} />
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={submitRequest} style={{ flex: 1, background: "#534AB7", color: "#fff", border: "none", borderRadius: 8, padding: "12px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>{editId ? "수정하기" : "신청하기"}</button>
              <button onClick={function() { setShowForm(false); setEditId(null); setNewReq({ type: "연차", start_date: "", end_date: "", reason: "" }); }} style={{ background: "#fff", color: "#888", border: "1px solid #E8E5E0", borderRadius: 8, padding: "12px 18px", fontSize: 14, cursor: "pointer" }}>취소</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── 정산관리 ──────────────────────────────────────────────────────────────────
function SettlementView() {
  const [cases, setCases] = useState([]);       // 자동 (agency_cases)
  const [manuals, setManuals] = useState([]);   // 수동 (settlement_manual)
  const [loading, setLoading] = useState(true);
  const [activeMonth, setActiveMonth] = useState(new Date().getMonth() + 1);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [editSource, setEditSource] = useState("auto");
  const [showAddManual, setShowAddManual] = useState(false);
  const [newManual, setNewManual] = useState({});
  const [teamFilter, setTeamFilter] = useState("전체"); // 전체 / 법인팀 / 개인팀

  // 정산 건의 팀 = 사업자명 기준 자동 분류 (기업목록과 동일 규칙)
  var teamOfRow = function(row) { return teamByName(row && row.business_name); };

  useEffect(function() { fetchData(); }, []);

  var fetchData = async function() {
    setLoading(true);
    var r1 = await supabase.from("agency_cases").select("*")
      .in("status", ["승인","약정","완료","자금집행완료"])
      .order("created_at", { ascending: false });
    var r2 = await supabase.from("settlement_manual").select("*")
      .is("deleted_at", null)
      .order("created_at", { ascending: false });
    if (!r1.error) setCases(r1.data || []);
    if (!r2.error) setManuals(r2.data || []);
    setLoading(false);
  };

  // 자동 + 수동 합산 (현재 월)
  var filteredAuto = useMemo(function() {
    return cases.filter(function(c) { return c.month === activeMonth && c.year === 2026 && !c.deleted_at; });
  }, [cases, activeMonth]);

  var filteredManual = useMemo(function() {
    return manuals.filter(function(m) { return m.month === activeMonth && m.year === 2026; });
  }, [manuals, activeMonth]);

  var allFiltered = useMemo(function() {
    var auto = filteredAuto.map(function(c) { return Object.assign({}, c, { _source: "auto" }); });
    var manual = filteredManual.map(function(m) { return Object.assign({}, m, { _source: "manual" }); });
    return auto.concat(manual);
  }, [filteredAuto, filteredManual]);

  // 팀 필터 적용 (전체/법인팀/개인팀) — 사업자명 기준 자동 분류
  var teamFiltered = useMemo(function() {
    if (teamFilter === "전체") return allFiltered;
    return allFiltered.filter(function(r) { return teamOfRow(r) === teamFilter; });
  }, [allFiltered, teamFilter]);

  // 팀별 건수 (필터 버튼 뱃지용)
  var teamCounts = useMemo(function() {
    var corp = 0, indi = 0;
    allFiltered.forEach(function(r) { if (teamOfRow(r) === "법인팀") corp++; else indi++; });
    return { 전체: allFiltered.length, 법인팀: corp, 개인팀: indi };
  }, [allFiltered]);

  // 월 탭용 - 데이터 있는 월
  var monthsWithData = useMemo(function() {
    var s = new Set();
    cases.forEach(function(c) { if (c.year === 2026 && !c.deleted_at) s.add(c.month); });
    manuals.forEach(function(m) { if (m.year === 2026) s.add(m.month); });
    return s;
  }, [cases, manuals]);

  var parseAmt = function(v) {
    if (!v) return 0;
    return typeof v === "string" ? parseInt(v.replace(/[^0-9]/g, "")) || 0 : (v || 0);
  };

  var formatAmt = function(v) {
    var n = typeof v === "number" ? v : parseAmt(v);
    if (!n || n === 0) return "-";
    if (n >= 100000000) return (n / 100000000).toFixed(1) + "억";
    if (n >= 10000000) return (n / 10000000).toFixed(0) + "천만";
    if (n >= 1000000) return (n / 1000000).toFixed(0) + "백만";
    if (n >= 10000) return (n / 10000).toFixed(0) + "만";
    return n.toLocaleString() + "원";
  };

  // KPI 합산
  var monthSummary = useMemo(function() {
    var totalCommission = 0;
    var totalReceived = 0;
    teamFiltered.forEach(function(c) {
      totalCommission += parseAmt(c.commission_fee);
      totalReceived += parseAmt(c.received_amount);
    });
    return {
      total: teamFiltered.length,
      autoCount: teamFiltered.filter(function(c) { return c._source === "auto"; }).length,
      manualCount: teamFiltered.filter(function(c) { return c._source === "manual"; }).length,
      commissionSet: teamFiltered.filter(function(c) { return c.commission_fee; }).length,
      depositDone: teamFiltered.filter(function(c) { return c.fee_received; }).length,
      totalCommission: totalCommission,
      totalReceived: totalReceived,
    };
  }, [teamFiltered]);

  // 자동 건 저장
  var saveEditAuto = async function() {
    var updates = {
      contract_fee: editData.contract_fee || null,
      contract_date: editData.contract_date || null,
      commission_fee: editData.commission_fee || null,
      received_amount: editData.received_amount || null,
      invoice_issued: editData.invoice_issued || false,
      invoice_date: editData.invoice_date || null,
      fee_received: editData.fee_received || false,
      fee_received_date: editData.fee_received_date || null,
      settlement_notes: editData.settlement_notes || null,
      updated_at: new Date().toISOString(),
    };
    var r = await supabase.from("agency_cases").update(updates).eq("id", editData.id);
    if (!r.error) {
      setCases(function(prev) { return prev.map(function(c) { return c.id === editData.id ? Object.assign({}, c, updates) : c; }); });
      setEditingId(null); setEditData({});
    }
  };

  // 수동 건 저장
  var saveEditManual = async function() {
    var updates = {
      business_name: editData.business_name || null,
      agency_group: editData.agency_group || null,
      assignee: editData.assignee || null,
      request_amount: editData.request_amount || null,
      contract_fee: editData.contract_fee || null,
      contract_date: editData.contract_date || null,
      commission_fee: editData.commission_fee || null,
      received_amount: editData.received_amount || null,
      invoice_issued: editData.invoice_issued || false,
      fee_received: editData.fee_received || false,
      fee_received_date: editData.fee_received_date || null,
      settlement_notes: editData.settlement_notes || null,
      updated_at: new Date().toISOString(),
    };
    var r = await supabase.from("settlement_manual").update(updates).eq("id", editData.id);
    if (!r.error) {
      setManuals(function(prev) { return prev.map(function(m) { return m.id === editData.id ? Object.assign({}, m, updates) : m; }); });
      setEditingId(null); setEditData({});
    }
  };

  var saveEdit = function() {
    if (editSource === "manual") saveEditManual();
    else saveEditAuto();
  };

  // 수동 건 삭제
  var deleteManual = async function(id) {
    if (!window.confirm("삭제하시겠습니까?")) return;
    var r = await supabase.from("settlement_manual").update({ deleted_at: new Date().toISOString() }).eq("id", id);
    if (!r.error) setManuals(function(prev) { return prev.filter(function(m) { return m.id !== id; }); });
  };

  // 수동 신규 등록
  var openAddManual = function() {
    setNewManual({ year: 2026, month: activeMonth, business_name: "", agency_group: "", assignee: "", request_amount: "", contract_fee: "", commission_fee: "", received_amount: "", contract_date: "", invoice_issued: false, fee_received: false, fee_received_date: "", settlement_notes: "" });
    setShowAddManual(true);
  };

  var saveNewManual = async function() {
    if (!newManual.business_name) { alert("사업자명은 필수입니다."); return; }
    var dataToSave = Object.assign({}, newManual, {
      contract_date: newManual.contract_date || null,
      fee_received_date: newManual.fee_received_date || null,
    });
    var r = await supabase.from("settlement_manual").insert(dataToSave).select().single();
    if (!r.error && r.data) {
      setManuals(function(prev) { return prev.concat([r.data]); });
      setShowAddManual(false);
    } else {
      alert("저장 실패: " + (r.error ? r.error.message : ""));
    }
  };

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", flexDirection: "column", gap: 16 }}>
      <div style={{ width: 36, height: 36, border: "3px solid #E8E5E0", borderTopColor: "#1A1917", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <span style={{ color: "#888", fontSize: 13 }}>정산 데이터 불러오는 중...</span>
    </div>
  );

  // 공통 편집 행 렌더링
  var renderEditRow = function(row, idx) {
    var isManual = row._source === "manual";
    return (
      <tr key={row.id + "-edit"} style={{ borderBottom: "1px solid #F0EDE8", background: "#FEFCE8" }}>
        <td style={{ padding: "9px 8px", color: "#AAA", fontSize: 11, textAlign: "center" }}>{idx + 1}</td>
        <td style={{ padding: "6px 8px" }}>
          {isManual
            ? <input value={editData.business_name || ""} onChange={function(e) { setEditData(function(p) { return Object.assign({}, p, { business_name: e.target.value }); }); }} style={{ width: 110, padding: "4px 6px", border: "1px solid #E8E5E0", borderRadius: 4, fontSize: 12 }} />
            : <span style={{ fontWeight: 600, fontSize: 12 }}>{row.business_name}</span>}
        </td>
        <td style={{ padding: "6px 8px" }}>
          {(function() { var tm = teamByName(isManual ? editData.business_name : row.business_name); return <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 99, fontWeight: 700, whiteSpace: "nowrap", background: tm === "법인팀" ? "#EEF2FF" : "#F0FDF4", color: tm === "법인팀" ? "#4338CA" : "#15803D" }}>{tm}</span>; })()}
        </td>
        <td style={{ padding: "6px 8px" }}>
          {isManual
            ? <select value={editData.agency_group || ""} onChange={function(e) { setEditData(function(p) { return Object.assign({}, p, { agency_group: e.target.value }); }); }} style={{ width: 80, padding: "4px 6px", border: "1px solid #E8E5E0", borderRadius: 4, fontSize: 11 }}>
                <option value="">선택</option>
                {AGENCY_GROUPS.map(function(g) { return <option key={g.id} value={g.id}>{g.label}</option>; })}
              </select>
            : <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 99, background: "#EEF2FF", color: "#4338CA", fontWeight: 600 }}>{row.agency_group}</span>}
        </td>
        <td style={{ padding: "6px 8px" }}>
          {isManual
            ? <select value={editData.assignee || ""} onChange={function(e) { setEditData(function(p) { return Object.assign({}, p, { assignee: e.target.value }); }); }} style={{ width: 70, padding: "4px 6px", border: "1px solid #E8E5E0", borderRadius: 4, fontSize: 11 }}>
                <option value="">선택</option>
                {ASSIGNEES.map(function(a) { return <option key={a} value={a}>{a}</option>; })}
              </select>
            : <span style={{ fontSize: 12, color: "#555" }}>{row.assignee || "-"}</span>}
        </td>
        <td style={{ padding: "6px 8px" }}>
          {isManual
            ? <input value={editData.request_amount || ""} onChange={function(e) { setEditData(function(p) { return Object.assign({}, p, { request_amount: e.target.value }); }); }} style={{ width: 70, padding: "4px 6px", border: "1px solid #E8E5E0", borderRadius: 4, fontSize: 12 }} />
            : <span style={{ fontSize: 12, color: "#555" }}>{row.request_amount || "-"}</span>}
        </td>
        <td style={{ padding: "6px 8px" }}>
          <input value={editData.contract_fee || ""} placeholder="계약금" onChange={function(e) { setEditData(function(p) { return Object.assign({}, p, { contract_fee: e.target.value }); }); }} style={{ width: 75, padding: "4px 6px", border: "1px solid #E8E5E0", borderRadius: 4, fontSize: 12 }} />
        </td>
        <td style={{ padding: "6px 8px" }}>
          <input value={editData.commission_fee || ""} placeholder="수수료" onChange={function(e) { setEditData(function(p) { return Object.assign({}, p, { commission_fee: e.target.value }); }); }} style={{ width: 75, padding: "4px 6px", border: "1px solid #E8E5E0", borderRadius: 4, fontSize: 12 }} />
        </td>
        <td style={{ padding: "6px 8px" }}>
          <input value={editData.received_amount || ""} placeholder="입금금액" onChange={function(e) { setEditData(function(p) { return Object.assign({}, p, { received_amount: e.target.value }); }); }} style={{ width: 75, padding: "4px 6px", border: "1px solid #E8E5E0", borderRadius: 4, fontSize: 12 }} />
        </td>
        <td style={{ padding: "6px 8px" }}>
          <input type="date" value={editData.contract_date || ""} onChange={function(e) { setEditData(function(p) { return Object.assign({}, p, { contract_date: e.target.value }); }); }} style={{ width: 115, padding: "4px 6px", border: "1px solid #E8E5E0", borderRadius: 4, fontSize: 12 }} />
        </td>
        <td style={{ padding: "6px 8px", textAlign: "center" }}>
          <input type="checkbox" checked={editData.invoice_issued || false} onChange={function(e) { setEditData(function(p) { return Object.assign({}, p, { invoice_issued: e.target.checked }); }); }} />
        </td>
        <td style={{ padding: "6px 8px", textAlign: "center" }}>
          <input type="checkbox" checked={editData.fee_received || false} onChange={function(e) { setEditData(function(p) { return Object.assign({}, p, { fee_received: e.target.checked }); }); }} />
        </td>
        <td style={{ padding: "6px 8px" }}>
          <input type="date" value={editData.fee_received_date || ""} onChange={function(e) { setEditData(function(p) { return Object.assign({}, p, { fee_received_date: e.target.value }); }); }} style={{ width: 115, padding: "4px 6px", border: "1px solid #E8E5E0", borderRadius: 4, fontSize: 12 }} />
        </td>
        <td style={{ padding: "6px 8px" }}>
          <input value={editData.settlement_notes || ""} placeholder="메모" onChange={function(e) { setEditData(function(p) { return Object.assign({}, p, { settlement_notes: e.target.value }); }); }} style={{ width: 85, padding: "4px 6px", border: "1px solid #E8E5E0", borderRadius: 4, fontSize: 12 }} />
        </td>
        <td style={{ padding: "6px 8px", textAlign: "center" }}>
          <div style={{ display: "flex", gap: 4, justifyContent: "center" }}>
            <button onClick={saveEdit} style={{ background: "#15803D", color: "#fff", border: "none", borderRadius: 4, padding: "3px 8px", fontSize: 11, cursor: "pointer", fontWeight: 600 }}>저장</button>
            <button onClick={function() { setEditingId(null); setEditData({}); }} style={{ background: "#fff", color: "#888", border: "1px solid #E8E5E0", borderRadius: 4, padding: "3px 6px", fontSize: 11, cursor: "pointer" }}>취소</button>
          </div>
        </td>
      </tr>
    );
  };

  // 읽기 행 렌더링
  var renderReadRow = function(row, idx) {
    var isManual = row._source === "manual";
    return (
      <tr key={row.id} style={{ borderBottom: "1px solid #F0EDE8", background: idx % 2 === 0 ? "#fff" : "#FAFAF8" }}>
        <td style={{ padding: "9px 8px", color: "#AAA", fontSize: 11, textAlign: "center" }}>
          {isManual
            ? <span style={{ fontSize: 9, padding: "1px 5px", borderRadius: 99, background: "#FFF7ED", color: "#C2410C", fontWeight: 700 }}>수동</span>
            : idx + 1}
        </td>
        <td style={{ padding: "9px 8px", fontWeight: 600, whiteSpace: "nowrap" }}>{row.business_name || "-"}</td>
        <td style={{ padding: "9px 8px" }}>
          {(function() { var tm = teamOfRow(row); return <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 99, fontWeight: 700, whiteSpace: "nowrap", background: tm === "법인팀" ? "#EEF2FF" : "#F0FDF4", color: tm === "법인팀" ? "#4338CA" : "#15803D" }}>{tm}</span>; })()}
        </td>
        <td style={{ padding: "9px 8px" }}>
          <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 99, background: "#EEF2FF", color: "#4338CA", fontWeight: 600 }}>{row.agency_group || "-"}</span>
        </td>
        <td style={{ padding: "9px 8px", fontSize: 12, color: "#555" }}>{row.assignee || "-"}</td>
        <td style={{ padding: "9px 8px", fontSize: 12, color: "#555" }}>{row.request_amount || "-"}</td>
        <td style={{ padding: "9px 8px" }}>
          {row.contract_fee ? <span style={{ fontSize: 12, fontWeight: 700, color: "#333" }}>{row.contract_fee}</span> : <span style={{ fontSize: 11, color: "#888" }}>미입력</span>}
        </td>
        <td style={{ padding: "9px 8px" }}>
          {row.commission_fee ? <span style={{ fontSize: 12, fontWeight: 700, color: "#7C3AED" }}>{row.commission_fee}</span> : <span style={{ fontSize: 11, color: "#888" }}>미입력</span>}
        </td>
        <td style={{ padding: "9px 8px" }}>
          {row.received_amount ? <span style={{ fontSize: 12, fontWeight: 700, color: "#047857" }}>{row.received_amount}</span> : <span style={{ fontSize: 11, color: "#888" }}>미입력</span>}
        </td>
        <td style={{ padding: "9px 8px", fontSize: 11, color: "#888" }}>{row.contract_date || "-"}</td>
        <td style={{ padding: "9px 8px", textAlign: "center" }}>
          {row.invoice_issued
            ? <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 99, background: "#ECFDF5", color: "#047857", fontWeight: 600 }}>발행완료</span>
            : <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 99, background: "#F7F6F3", color: "#AAA" }}>미발행</span>}
        </td>
        <td style={{ padding: "9px 8px", textAlign: "center" }}>
          {row.fee_received
            ? <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 99, background: "#ECFDF5", color: "#047857", fontWeight: 600 }}>입금완료</span>
            : <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 99, background: "#FFF7ED", color: "#C2410C" }}>미입금</span>}
        </td>
        <td style={{ padding: "9px 8px", fontSize: 11, color: "#888" }}>{row.fee_received_date || "-"}</td>
        <td style={{ padding: "9px 8px", fontSize: 11, color: "#555", maxWidth: 100, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.settlement_notes || "-"}</td>
        <td style={{ padding: "9px 8px", textAlign: "center" }}>
          <div style={{ display: "flex", gap: 4, justifyContent: "center" }}>
            <button onClick={function() { setEditingId(row.id); setEditData(Object.assign({}, row)); setEditSource(isManual ? "manual" : "auto"); }}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
              <Icon name="edit" size={14} color="#888" />
            </button>
            {isManual && (
              <button onClick={function() { deleteManual(row.id); }}
                style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
                <Icon name="x" size={14} color="#CCC" />
              </button>
            )}
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.03em", margin: 0 }}>정산관리</h1>
          <p style={{ color: "#888", fontSize: 13, margin: "4px 0 0" }}>계약금 · 수수료 · 세금계산서 관리</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={openAddManual} style={{ display: "flex", alignItems: "center", gap: 6, background: "#1A1917", color: "#F7F6F3", border: "none", borderRadius: 8, padding: "10px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            <Icon name="plus" size={15} color="#F7F6F3" /> 직접 등록
          </button>
          <button onClick={fetchData} style={{ display: "flex", alignItems: "center", gap: 6, background: "#fff", color: "#555", border: "1px solid #E8E5E0", borderRadius: 8, padding: "8px 14px", fontSize: 12, cursor: "pointer" }}>
            <Icon name="refresh" size={13} color="#555" /> 새로고침
          </button>
        </div>
      </div>

      {/* 월 탭 */}
      <div style={{ display: "flex", gap: 4, marginBottom: 18, flexWrap: "wrap" }}>
        {MONTHS_LIST.map(function(m) {
          var isActive = activeMonth === m;
          var has = monthsWithData.has(m);
          return (
            <div key={m} onClick={function() { setActiveMonth(m); setEditingId(null); setEditData({}); setShowAddManual(false); }}
              style={{ padding: "6px 14px", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: isActive ? 700 : 400,
                background: isActive ? "#1A1917" : has ? "#fff" : "#F7F6F3",
                color: isActive ? "#fff" : has ? "#333" : "#CCC",
                border: isActive ? "none" : has ? "1px solid #E8E5E0" : "1px solid #EDEBE8" }}>
              {m}월{has && !isActive ? " ●" : ""}
            </div>
          );
        })}
      </div>

      {/* 팀 필터 (개인팀/법인팀 구분) */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16, alignItems: "center" }}>
        <span style={{ fontSize: 11, color: "#999", marginRight: 2 }}>팀 구분</span>
        {TEAM_FILTER_OPTS.map(function(t) {
          var isActive = teamFilter === t;
          var accent = t === "법인팀" ? "#4338CA" : t === "개인팀" ? "#15803D" : "#1A1917";
          return (
            <div key={t} onClick={function() { setTeamFilter(t); setEditingId(null); setEditData({}); }}
              style={{ padding: "6px 14px", borderRadius: 99, cursor: "pointer", fontSize: 12, fontWeight: isActive ? 700 : 500,
                background: isActive ? accent : "#fff", color: isActive ? "#fff" : "#666",
                border: "1px solid " + (isActive ? accent : "#E8E5E0") }}>
              {t} <span style={{ opacity: 0.75, fontWeight: 600 }}>{teamCounts[t] || 0}</span>
            </div>
          );
        })}
      </div>

      {/* KPI 카드 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "총 건수", value: monthSummary.total + "건", color: "#4338CA", sub: "자동 " + monthSummary.autoCount + " · 수동 " + monthSummary.manualCount },
          { label: "수수료 설정", value: monthSummary.commissionSet + "건", color: "#047857", sub: "수수료 입력 완료" },
          { label: "입금 완료", value: monthSummary.depositDone + "건", color: "#7C3AED", sub: "수수료 수령 완료" },
          { label: "예상 월 매출", value: formatAmt(monthSummary.totalCommission), color: "#B45309", sub: "수수료 합산" },
          { label: "실제 입금액", value: formatAmt(monthSummary.totalReceived), color: "#047857", sub: "입금금액 합산" },
        ].map(function(k, i) {
          return (
            <div key={i} style={{ background: "#fff", borderRadius: 10, padding: "16px 18px", border: "1px solid #E8E5E0" }}>
              <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>{k.label}</div>
              <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.03em", color: k.color }}>{k.value}</div>
              <div style={{ fontSize: 11, color: "#AAA", marginTop: 3 }}>{k.sub}</div>
            </div>
          );
        })}
      </div>

      {/* 테이블 */}
      <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #E8E5E0", overflow: "hidden" }}>
        {teamFiltered.length === 0 ? (
          <div style={{ padding: "60px 20px", textAlign: "center", color: "#AAA", fontSize: 13 }}>
            {activeMonth}월{teamFilter !== "전체" ? " · " + teamFilter : ""} 데이터가 없습니다. 직접 등록하거나 기관별 현황에서 승인 상태로 변경해주세요.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#F7F6F3", borderBottom: "2px solid #E8E5E0" }}>
                  {["#","사업자명","팀","기관","담당자","신청금액","계약금","수수료","입금금액","계약일","세금계산서","입금완료","입금일","비고","작업"].map(function(h) {
                    return <th key={h} style={{ textAlign: "left", padding: "10px 8px", fontWeight: 600, color: "#888", fontSize: 11, whiteSpace: "nowrap" }}>{h}</th>;
                  })}
                </tr>
              </thead>
              <tbody>
                {teamFiltered.map(function(row, idx) {
                  return editingId === row.id ? renderEditRow(row, idx) : renderReadRow(row, idx);
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 직접 등록 모달 */}
      {showAddManual && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}
          onMouseDown={function(e) { if (e.target === e.currentTarget) setShowAddManual(false); }}>
          <div style={{ background: "#fff", borderRadius: 14, width: 520, maxHeight: "88vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <div style={{ padding: "22px 24px 16px", borderBottom: "1px solid #E8E5E0", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, background: "#fff", zIndex: 1 }}>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>정산 직접 등록 ({activeMonth}월)</h2>
              <button onClick={function() { setShowAddManual(false); }} style={{ background: "none", border: "none", cursor: "pointer" }}><Icon name="x" size={18} color="#888" /></button>
            </div>
            <div style={{ padding: "20px 24px" }}>
              <div style={{ marginBottom: 13 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#555", display: "block", marginBottom: 5 }}>사업자명 *</label>
                <input value={newManual.business_name || ""} onChange={function(e) { setNewManual(function(p) { return Object.assign({}, p, { business_name: e.target.value }); }); }}
                  style={{ width: "100%", padding: "10px 13px", border: "1px solid #E8E5E0", borderRadius: 8, fontSize: 13, boxSizing: "border-box", outline: "none" }} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 13 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#555", display: "block", marginBottom: 5 }}>기관</label>
                  <select value={newManual.agency_group || ""} onChange={function(e) { setNewManual(function(p) { return Object.assign({}, p, { agency_group: e.target.value }); }); }}
                    style={{ width: "100%", padding: "10px 13px", border: "1px solid #E8E5E0", borderRadius: 8, fontSize: 13, background: "#fff" }}>
                    <option value="">선택</option>
                    {AGENCY_GROUPS.map(function(g) { return <option key={g.id} value={g.id}>{g.label}</option>; })}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#555", display: "block", marginBottom: 5 }}>담당자</label>
                  <select value={newManual.assignee || ""} onChange={function(e) { setNewManual(function(p) { return Object.assign({}, p, { assignee: e.target.value }); }); }}
                    style={{ width: "100%", padding: "10px 13px", border: "1px solid #E8E5E0", borderRadius: 8, fontSize: 13, background: "#fff" }}>
                    <option value="">선택</option>
                    {ASSIGNEES.map(function(a) { return <option key={a} value={a}>{a}</option>; })}
                  </select>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 13 }}>
                {[["신청금액","request_amount"],["계약금","contract_fee"],["수수료","commission_fee"]].map(function(f) {
                  return (
                    <div key={f[1]}>
                      <label style={{ fontSize: 12, fontWeight: 600, color: "#555", display: "block", marginBottom: 5 }}>{f[0]}</label>
                      <input value={newManual[f[1]] || ""} placeholder="예: 300만" onChange={function(e) { var k = f[1]; setNewManual(function(p) { return Object.assign({}, p, { [k]: e.target.value }); }); }}
                        style={{ width: "100%", padding: "10px 13px", border: "1px solid #E8E5E0", borderRadius: 8, fontSize: 13, boxSizing: "border-box", outline: "none" }} />
                    </div>
                  );
                })}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 13 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#555", display: "block", marginBottom: 5 }}>입금금액</label>
                  <input value={newManual.received_amount || ""} placeholder="예: 300만" onChange={function(e) { setNewManual(function(p) { return Object.assign({}, p, { received_amount: e.target.value }); }); }}
                    style={{ width: "100%", padding: "10px 13px", border: "1px solid #E8E5E0", borderRadius: 8, fontSize: 13, boxSizing: "border-box", outline: "none" }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#555", display: "block", marginBottom: 5 }}>계약일</label>
                  <input type="date" value={newManual.contract_date || ""} onChange={function(e) { setNewManual(function(p) { return Object.assign({}, p, { contract_date: e.target.value }); }); }}
                    style={{ width: "100%", padding: "10px 13px", border: "1px solid #E8E5E0", borderRadius: 8, fontSize: 13, boxSizing: "border-box", outline: "none" }} />
                </div>
              </div>
              <div style={{ display: "flex", gap: 20, marginBottom: 13 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, cursor: "pointer" }}>
                  <input type="checkbox" checked={newManual.invoice_issued || false} onChange={function(e) { setNewManual(function(p) { return Object.assign({}, p, { invoice_issued: e.target.checked }); }); }} />
                  세금계산서 발행완료
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, cursor: "pointer" }}>
                  <input type="checkbox" checked={newManual.fee_received || false} onChange={function(e) { setNewManual(function(p) { return Object.assign({}, p, { fee_received: e.target.checked }); }); }} />
                  입금완료
                </label>
              </div>
              {newManual.fee_received && (
                <div style={{ marginBottom: 13 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#555", display: "block", marginBottom: 5 }}>입금일</label>
                  <input type="date" value={newManual.fee_received_date || ""} onChange={function(e) { setNewManual(function(p) { return Object.assign({}, p, { fee_received_date: e.target.value }); }); }}
                    style={{ width: "100%", padding: "10px 13px", border: "1px solid #E8E5E0", borderRadius: 8, fontSize: 13, boxSizing: "border-box", outline: "none" }} />
                </div>
              )}
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#555", display: "block", marginBottom: 5 }}>비고</label>
                <textarea value={newManual.settlement_notes || ""} onChange={function(e) { setNewManual(function(p) { return Object.assign({}, p, { settlement_notes: e.target.value }); }); }} rows={2}
                  style={{ width: "100%", padding: "10px 13px", border: "1px solid #E8E5E0", borderRadius: 8, fontSize: 13, resize: "vertical", boxSizing: "border-box", outline: "none" }} />
              </div>
              <button onClick={saveNewManual} style={{ width: "100%", padding: "13px", background: "#1A1917", color: "#F7F6F3", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                등록하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
const MONTHS_LIST = [1,2,3,4,5,6,7,8,9,10,11,12];

// ── 캘린더 (구글 캘린더 연동 + 팔로업 알림) ───────────────────────────────────
const GOOGLE_CLIENT_ID = "675906307078-pl29fdq2uuqj2011qn4arjc6u1uvkbq3.apps.googleusercontent.com";
const FOLLOWUP_STAGES = ["기관신청완료/방문완료", "실태조사완료/약정완료", "심사중/실태조사대기"];

function CalendarView({ companies, onSelectCompany, profile }) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(null);
  // 양호님 캘린더용 + 이사님 캘린더용 토큰/이벤트 분리
  const [googleEvents, setGoogleEvents] = useState([]); // 양호님 일정
  const [directorEvents, setDirectorEvents] = useState([]); // 이사님 일정
  const [gConnected, setGConnected] = useState(false); // 양호님 연결 여부
  const [directorConnected, setDirectorConnected] = useState(false); // 이사님 연결 여부
  const [activeTab, setActiveTab] = useState("calendar"); // calendar | followup
  const [calSheet, setCalSheet] = useState("yangho"); // yangho | director
  const [customEvents, setCustomEvents] = useState([]);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: "", date: "", time: "", memo: "", sheet: "yangho", color: "9" });
  const [gToken, setGToken] = useState(""); // 양호님 토큰
  const [directorToken, setDirectorToken] = useState(""); // 이사님 토큰
  // 구글 캘린더 공식 색상 11가지 (colorId 1~11)
  const EVENT_COLORS = [
    { id: "1",  label: "라벤더",   bg: "#7986CB", light: "#E8EAF6" },
    { id: "2",  label: "세이지",   bg: "#33B679", light: "#E0F2E9" },
    { id: "3",  label: "그레이프", bg: "#8E24AA", light: "#F3E5F5" },
    { id: "4",  label: "플라밍고", bg: "#E67C73", light: "#FCE4EC" },
    { id: "5",  label: "바나나",   bg: "#F6BF26", light: "#FFF8E1" },
    { id: "6",  label: "탠저린",   bg: "#F4511E", light: "#FFEBE0" },
    { id: "7",  label: "피콕",     bg: "#039BE5", light: "#E1F5FE" },
    { id: "8",  label: "그래파이트", bg: "#616161", light: "#EEEEEE" },
    { id: "9",  label: "블루베리", bg: "#3F51B5", light: "#E8EAF6" },
    { id: "10", label: "바질",     bg: "#0B8043", light: "#E0F2E9" },
    { id: "11", label: "토마토",   bg: "#D50000", light: "#FFEBEE" },
  ];
  const getColorById = function(id) {
    var c = EVENT_COLORS.find(function(x) { return x.id === String(id); });
    return c || EVENT_COLORS[8]; // 기본: 블루베리
  };
  const todayStr = kstDate();
  const MONTH_NAMES = ["1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월","12월"];
  const DAY_NAMES = ["일","월","화","수","목","금","토"];
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // 커스텀 일정 불러오기
  useEffect(function() {
    supabase.from("calendar_events").select("*").order("created_at", { ascending: false })
      .then(function(r) { if (!r.error && r.data) setCustomEvents(r.data); });
  }, []);

  var saveEvent = async function() {
    if (!newEvent.title || !newEvent.date) { alert("제목과 날짜를 입력해주세요."); return; }
    var googleEventId = null;
    // 어느 캘린더에 등록할지 calSheet 기준
    var useToken = newEvent.sheet === "director" ? directorToken : gToken;
    // 구글 캘린더에도 동시 등록 (연결돼 있으면)
    if (useToken) {
      try {
        var startObj, endObj;
        if (newEvent.time) {
          // 시간 있는 일정: 1시간 기본
          var startISO = newEvent.date + "T" + newEvent.time + ":00";
          var startD = new Date(startISO);
          var endD = new Date(startD.getTime() + 60 * 60 * 1000);
          startObj = { dateTime: startD.toISOString(), timeZone: "Asia/Seoul" };
          endObj = { dateTime: endD.toISOString(), timeZone: "Asia/Seoul" };
        } else {
          // 종일 일정
          startObj = { date: newEvent.date };
          endObj = { date: newEvent.date };
        }
        var gres = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
          method: "POST",
          headers: { Authorization: "Bearer " + useToken, "Content-Type": "application/json" },
          body: JSON.stringify({
            summary: newEvent.title,
            description: newEvent.memo || "",
            start: startObj,
            end: endObj,
            colorId: newEvent.color || "9",
          }),
        });
        var gdata = await gres.json();
        if (gdata.id) googleEventId = gdata.id;
      } catch (err) {}
    }
    var r = await supabase.from("calendar_events").insert({
      title: newEvent.title, date: newEvent.date, time: newEvent.time || null,
      memo: newEvent.memo || null, sheet: newEvent.sheet,
      color: newEvent.color || "9",
      created_by: profile?.name || "",
    }).select().single();
    if (!r.error && r.data) {
      setCustomEvents(function(prev) { return [r.data].concat(prev); });
      // 구글에 등록된 경우 즉시 googleEvents에도 추가
      if (googleEventId) {
        var setter = newEvent.sheet === "director" ? setDirectorEvents : setGoogleEvents;
        setter(function(prev) { return prev.concat([{
          title: newEvent.title, date: newEvent.date, time: newEvent.time || "",
          color: newEvent.color || "9", googleEventId: googleEventId, memo: newEvent.memo || "",
        }]); });
      }
      setNewEvent({ title: "", date: "", time: "", memo: "", sheet: calSheet, color: "9" });
      setShowAddEvent(false);
    } else {
      alert("저장 실패: " + (r.error ? r.error.message : ""));
    }
  };

  // CRM 일정 색상 업데이트 (구글에도 반영)
  var updateEventColor = async function(eventId, colorId) {
    var ev = customEvents.find(function(e) { return e.id === eventId; });
    var r = await supabase.from("calendar_events").update({ color: colorId }).eq("id", eventId);
    if (!r.error) {
      setCustomEvents(function(prev) {
        return prev.map(function(e) { return e.id === eventId ? Object.assign({}, e, { color: colorId }) : e; });
      });
    }
  };

  // 구글 캘린더 일정 색상 직접 업데이트
  var updateGoogleEventColor = async function(googleEventId, colorId) {
    if (!gToken || !googleEventId) return;
    try {
      var res = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events/" + googleEventId, {
        method: "PATCH",
        headers: { Authorization: "Bearer " + gToken, "Content-Type": "application/json" },
        body: JSON.stringify({ colorId: colorId }),
      });
      if (res.ok) {
        setGoogleEvents(function(prev) {
          return prev.map(function(e) { return e.googleEventId === googleEventId ? Object.assign({}, e, { color: colorId }) : e; });
        });
      } else {
        alert("구글 일정 색상 변경 실패. 다시 연동해주세요.");
      }
    } catch (err) {
      alert("구글 일정 색상 변경 실패: " + err.message);
    }
  };

  var deleteEvent = async function(id) {
    if (!window.confirm("이 일정을 삭제할까요?")) return;
    await supabase.from("calendar_events").delete().eq("id", id);
    setCustomEvents(function(prev) { return prev.filter(function(e) { return e.id !== id; }); });
  };

  const prevMonth = () => { if (month === 0) { setYear(y=>y-1); setMonth(11); } else setMonth(m=>m-1); };
  const nextMonth = () => { if (month === 11) { setYear(y=>y+1); setMonth(0); } else setMonth(m=>m+1); };

  // CRM 내 연락 예정일 이벤트
  const crmEventsByDate = useMemo(() => {
    const map = {};
    companies.forEach(c => {
      if (c.next_contact) {
        if (!map[c.next_contact]) map[c.next_contact] = [];
        map[c.next_contact].push(c);
      }
    });
    return map;
  }, [companies]);

  // 팔로업 필요 건 (기관방문/실태조사 다음날)
  const followupList = useMemo(() => {
    return companies.filter(c =>
      FOLLOWUP_STAGES.includes(c.stage) &&
      c.next_contact && c.next_contact <= todayStr
    );
  }, [companies, todayStr]);

  // 구글 캘린더 연동 - target: "yangho" 또는 "director"
  const connectGoogle = (target) => {
    const scope = "https://www.googleapis.com/auth/calendar.events";
    const redirectUri = window.location.origin;
    // state 파라미터로 어느 캘린더용인지 전달 (돌아왔을 때 구분)
    const stateParam = target || "yangho";
    // prompt=select_account로 다른 계정 선택 강제
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=${encodeURIComponent(scope)}&state=${stateParam}&prompt=select_account`;
    window.location.href = authUrl;
  };

  // 이사님 캘린더 연결 해제
  const disconnectDirector = () => {
    if (!confirm("이사님 캘린더 연결을 해제하시겠어요?")) return;
    localStorage.removeItem("gcal_director_token");
    setDirectorToken("");
    setDirectorConnected(false);
    setDirectorEvents([]);
  };

  // 양호님 캘린더 연결 해제
  const disconnectYangho = () => {
    if (!confirm("김양호 캘린더 연결을 해제하시겠어요?")) return;
    localStorage.removeItem("gcal_yangho_token");
    setGToken("");
    setGConnected(false);
    setGoogleEvents([]);
  };

  // 캘린더 이벤트 가져오기 헬퍼
  const fetchCalendarEvents = async (token, target) => {
    var startDate = new Date(year, month, 1).toISOString();
    var endDate = new Date(year, month + 1, 0).toISOString();
    try {
      var r = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${startDate}&timeMax=${endDate}&singleEvents=true&orderBy=startTime`, {
        headers: { Authorization: "Bearer " + token }
      });
      var data = await r.json();
      if (data.error) {
        // 토큰 만료 등
        if (target === "yangho") {
          localStorage.removeItem("gcal_yangho_token");
          setGToken("");
          setGConnected(false);
          setGoogleEvents([]);
        } else {
          localStorage.removeItem("gcal_director_token");
          setDirectorToken("");
          setDirectorConnected(false);
          setDirectorEvents([]);
        }
        return null;
      }
      if (data.items) {
        var evs = data.items.map(function(item) {
          var dateStr = item.start.date || (item.start.dateTime ? item.start.dateTime.slice(0, 10) : "");
          var timeStr = item.start.dateTime ? new Date(item.start.dateTime).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }) : "";
          return {
            title: item.summary || "",
            date: dateStr,
            time: timeStr,
            color: item.colorId || "9",
            googleEventId: item.id,
            memo: item.description || "",
          };
        });
        if (target === "yangho") setGoogleEvents(evs);
        else setDirectorEvents(evs);
      }
    } catch (err) {
      console.error("캘린더 조회 실패:", err);
    }
  };

  // URL에서 access_token 확인 (구글 로그인 후 돌아올 때) + localStorage 복구
  useEffect(function() {
    var hash = window.location.hash;
    
    // 구글 로그인 후 콜백 처리
    if (hash && hash.includes("access_token")) {
      var token = hash.split("access_token=")[1].split("&")[0];
      var stateMatch = hash.match(/state=([^&]+)/);
      var target = stateMatch ? stateMatch[1] : "yangho";
      
      if (token) {
        if (target === "director") {
          setDirectorToken(token);
          setDirectorConnected(true);
          localStorage.setItem("gcal_director_token", token);
          fetchCalendarEvents(token, "director");
        } else {
          setGToken(token);
          setGConnected(true);
          localStorage.setItem("gcal_yangho_token", token);
          fetchCalendarEvents(token, "yangho");
        }
        // URL 해시 제거
        window.history.replaceState(null, "", window.location.pathname);
      }
    } else {
      // localStorage에 토큰 있으면 복구
      var savedYangho = localStorage.getItem("gcal_yangho_token");
      if (savedYangho) {
        setGToken(savedYangho);
        setGConnected(true);
        fetchCalendarEvents(savedYangho, "yangho");
      }
      var savedDirector = localStorage.getItem("gcal_director_token");
      if (savedDirector) {
        setDirectorToken(savedDirector);
        setDirectorConnected(true);
        fetchCalendarEvents(savedDirector, "director");
      }
    }
  }, []);

  // 월이 바뀌면 양쪽 캘린더 모두 새로 조회
  useEffect(function() {
    if (gToken) fetchCalendarEvents(gToken, "yangho");
    if (directorToken) fetchCalendarEvents(directorToken, "director");
  }, [year, month]);

  const selectedDateStr = selectedDate
    ? `${year}-${String(month+1).padStart(2,"0")}-${String(selectedDate).padStart(2,"0")}`
    : null;
  const selectedCrmEvents = selectedDateStr ? (crmEventsByDate[selectedDateStr] || []) : [];
  const selectedGoogleEvents = selectedDateStr
    ? (calSheet === "director" ? directorEvents : googleEvents).filter(e => e.date === selectedDateStr)
    : [];

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.03em", margin: 0 }}>캘린더</h1>
          <p style={{ color: "#888", fontSize: 13, margin: "4px 0 0" }}>연락 예정 · 팔로업 관리</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {!gConnected && false ? (
            <button onClick={() => connectGoogle("yangho")}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", background: "#fff", border: "1px solid #E8E5E0", borderRadius: 8, fontSize: 12, cursor: "pointer", fontWeight: 600 }}>
              📅 구글 캘린더 연동
            </button>
          ) : (
            <span style={{ fontSize: 12, color: "#15803D", padding: "8px 12px", background: "#F0FDF4", borderRadius: 8, border: "1px solid #86EFAC" }}>✅ 구글 연동됨</span>
          )}
        </div>
      </div>

      {/* 탭 */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        {[
          { id: "calendar", label: "📅 일정 캘린더" },
          { id: "followup", label: `🔔 팔로업 필요 ${followupList.length > 0 ? `(${followupList.length})` : ""}` },
        ].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            style={{ padding: "8px 16px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: activeTab === t.id ? 700 : 400, background: activeTab === t.id ? "#1A1917" : "#fff", color: activeTab === t.id ? "#fff" : "#666", border: activeTab === t.id ? "none" : "1px solid #E8E5E0" }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* 캘린더 시트 전환 + 일정추가 */}
      {activeTab === "calendar" && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <button onClick={() => setCalSheet("yangho")}
              style={{ padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: calSheet === "yangho" ? 700 : 400, background: calSheet === "yangho" ? "#4338CA" : "#fff", color: calSheet === "yangho" ? "#fff" : "#666", border: calSheet === "yangho" ? "none" : "1px solid #E8E5E0", cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
              {gConnected && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10B981" }}></span>}
              김양호 캘린더
            </button>
            <button onClick={() => setCalSheet("director")}
              style={{ padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: calSheet === "director" ? 700 : 400, background: calSheet === "director" ? "#7C3AED" : "#fff", color: calSheet === "director" ? "#fff" : "#666", border: calSheet === "director" ? "none" : "1px solid #E8E5E0", cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
              {directorConnected && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10B981" }}></span>}
              이사님 캘린더
            </button>
            {/* 연결/해제 버튼 - 현재 탭 기준 */}
            {calSheet === "yangho" && !gConnected && (
              <button onClick={() => connectGoogle("yangho")}
                style={{ marginLeft: 8, padding: "6px 12px", background: "#fff", border: "1px solid #4338CA", borderRadius: 8, fontSize: 11, color: "#4338CA", fontWeight: 600, cursor: "pointer" }}>
                🔗 김양호 구글 캘린더 연결
              </button>
            )}
            {calSheet === "yangho" && gConnected && (
              <button onClick={disconnectYangho}
                style={{ marginLeft: 8, padding: "6px 10px", background: "#fff", border: "1px solid #E8E5E0", borderRadius: 8, fontSize: 11, color: "#888", cursor: "pointer" }}
                title="연결 해제">
                ✕ 연결 해제
              </button>
            )}
            {calSheet === "director" && !directorConnected && (
              <button onClick={() => connectGoogle("director")}
                style={{ marginLeft: 8, padding: "6px 12px", background: "#fff", border: "1px solid #7C3AED", borderRadius: 8, fontSize: 11, color: "#7C3AED", fontWeight: 600, cursor: "pointer" }}>
                🔗 이사님 구글 계정으로 로그인
              </button>
            )}
            {calSheet === "director" && directorConnected && (
              <button onClick={disconnectDirector}
                style={{ marginLeft: 8, padding: "6px 10px", background: "#fff", border: "1px solid #E8E5E0", borderRadius: 8, fontSize: 11, color: "#888", cursor: "pointer" }}
                title="연결 해제">
                ✕ 연결 해제
              </button>
            )}
          </div>
          <button onClick={() => { setShowAddEvent(true); setNewEvent({ title: "", date: selectedDate ? `${year}-${String(month+1).padStart(2,"0")}-${String(selectedDate).padStart(2,"0")}` : "", time: "", memo: "", sheet: calSheet }); }}
            style={{ padding: "7px 14px", background: "#1A1917", color: "#fff", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
            + 일정 추가
          </button>
        </div>
      )}

      {activeTab === "calendar" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 16, alignItems: "start" }}>
          {/* 캘린더 본체 */}
          <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #E8E5E0", overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid #E8E5E0" }}>
              <button onClick={prevMonth} style={{ background: "none", border: "1px solid #E8E5E0", borderRadius: 8, padding: "6px 10px", cursor: "pointer", display: "flex", alignItems: "center" }}>
                <Icon name="chevronL" size={16} color="#555" />
              </button>
              <div style={{ fontSize: 18, fontWeight: 700 }}>{year}년 {MONTH_NAMES[month]}</div>
              <button onClick={nextMonth} style={{ background: "none", border: "1px solid #E8E5E0", borderRadius: 8, padding: "6px 10px", cursor: "pointer", display: "flex", alignItems: "center" }}>
                <Icon name="chevronR" size={16} color="#555" />
              </button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", borderBottom: "1px solid #E8E5E0" }}>
              {DAY_NAMES.map((d, i) => (
                <div key={d} style={{ textAlign: "center", padding: "10px 0", fontSize: 12, fontWeight: 600, color: i===0 ? "#DC2626" : i===6 ? "#4338CA" : "#888" }}>{d}</div>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}>
              {cells.map((d, i) => {
                if (!d) return <div key={`e-${i}`} style={{ minHeight: 80, borderBottom: "1px solid #F0EDE8", borderRight: "1px solid #F0EDE8" }} />;
                const dateStr = `${year}-${String(month+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
                const crmEvs = crmEventsByDate[dateStr] || [];
                const sourceEvents = calSheet === "director" ? directorEvents : googleEvents;
                const gEvs = sourceEvents.filter(e => e.date === dateStr);
                const cEvs = customEvents.filter(e => e.date === dateStr && e.sheet === calSheet);
                const isToday = dateStr === todayStr;
                const isSelected = d === selectedDate;
                const dow = (firstDay + d - 1) % 7;
                const hasFollowup = companies.some(c => FOLLOWUP_STAGES.includes(c.stage) && c.next_contact === dateStr);
                return (
                  <div key={d} onClick={() => setSelectedDate(d)}
                    style={{ minHeight: 100, borderBottom: "1px solid #F0EDE8", borderRight: "1px solid #F0EDE8", padding: "5px", cursor: "pointer", background: isSelected ? "#EEF2FF" : "transparent" }}
                    onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = "#F7F6F3"; }}
                    onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = "transparent"; }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                      <div style={{ width: 22, height: 22, borderRadius: "50%", background: isToday ? "#1A1917" : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ fontSize: 12, fontWeight: isToday ? 700 : 400, color: isToday ? "#fff" : dow===0 ? "#DC2626" : dow===6 ? "#4338CA" : "#333" }}>{d}</span>
                      </div>
                      {hasFollowup && <span style={{ fontSize: 8, background: "#FEF3C7", color: "#B45309", borderRadius: 3, padding: "1px 3px", fontWeight: 700 }}>팔로업</span>}
                    </div>
                    {crmEvs.map((ev, ei) => (
                      <div key={ei} style={{ fontSize: 9, background: "#4338CA", color: "#fff", borderRadius: 3, padding: "1px 4px", marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ev.name}</div>
                    ))}
                    {gEvs.map((ev, ei) => {
                      var gcol = getColorById(ev.color || "9");
                      return (
                        <div key={ei} style={{ fontSize: 9, background: gcol.bg, color: "#fff", borderRadius: 3, padding: "1px 4px", marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>📅 {ev.title}</div>
                      );
                    })}
                    {cEvs.map((ev, ei) => {
                      var col = getColorById(ev.color || "blue");
                      return (
                        <div key={`c-${ei}`} style={{ fontSize: 9, background: col.bg, color: "#fff", borderRadius: 3, padding: "1px 4px", marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ev.title}</div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 우측 패널 */}
          <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #E8E5E0", overflow: "hidden" }}>
            <div style={{ padding: "14px 16px", borderBottom: "1px solid #E8E5E0", background: "#F7F6F3" }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{selectedDate ? `${month+1}월 ${selectedDate}일 일정` : "날짜를 선택하세요"}</div>
              {selectedDate && <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>{selectedCrmEvents.length + selectedGoogleEvents.length}건</div>}
            </div>
            <div style={{ padding: "12px", maxHeight: 500, overflowY: "auto" }}>
              {!selectedDate && <div style={{ textAlign: "center", padding: "40px 0", color: "#888", fontSize: 13 }}>📅<br/>날짜를 클릭하세요</div>}
              {selectedGoogleEvents.map((ev, i) => {
                var gcol = getColorById(ev.color || "9");
                return (
                  <div key={i} style={{ padding: "10px 12px", borderRadius: 10, borderLeft: "4px solid " + gcol.bg, border: "1px solid " + gcol.light, borderLeftWidth: 4, marginBottom: 8, background: gcol.light }}>
                    <div style={{ fontSize: 11, color: gcol.bg, fontWeight: 700, marginBottom: 2 }}>📅 구글 캘린더</div>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{ev.title}</div>
                    {ev.time && <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>{ev.time}</div>}
                    {ev.memo && <div style={{ fontSize: 12, color: "#555", marginTop: 4, lineHeight: 1.5 }}>{ev.memo}</div>}
                    {/* 구글 일정 색상 변경 */}
                    <div style={{ display: "flex", gap: 4, marginTop: 8, alignItems: "center", flexWrap: "wrap" }}>
                      <span style={{ fontSize: 10, color: "#888" }}>색상:</span>
                      {EVENT_COLORS.map(function(c) {
                        var sel = (ev.color || "9") === c.id;
                        return (
                          <button key={c.id} onClick={function() { updateGoogleEventColor(ev.googleEventId, c.id); }}
                            title={c.label}
                            style={{ width: 16, height: 16, borderRadius: "50%", background: c.bg, border: sel ? "2px solid #1A1917" : "1px solid #fff", boxShadow: "0 0 0 1px #E8E5E0", cursor: "pointer", padding: 0 }} />
                        );
                      })}
                    </div>
                  </div>
                );
              })}
              {selectedCrmEvents.map((ev, i) => {
                const sc = STAGE_COLORS[ev.stage] || {};
                const isFollowup = FOLLOWUP_STAGES.includes(ev.stage);
                return (
                  <div key={i} onClick={() => onSelectCompany(ev)}
                    style={{ padding: "10px 12px", borderRadius: 10, border: `1px solid ${isFollowup ? "#FED7AA" : "#E8E5E0"}`, marginBottom: 8, cursor: "pointer", background: isFollowup ? "#FFF7ED" : "#fff" }}
                    onMouseEnter={e => e.currentTarget.style.background = isFollowup ? "#FEF3C7" : "#F7F6F3"}
                    onMouseLeave={e => e.currentTarget.style.background = isFollowup ? "#FFF7ED" : "#fff"}>
                    {isFollowup && <div style={{ fontSize: 10, color: "#B45309", fontWeight: 700, marginBottom: 4 }}>🔔 팔로업 필요</div>}
                    <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 3 }}>{ev.name}</div>
                    <div style={{ fontSize: 11, color: "#888", marginBottom: 5 }}>{ev.assignee} · {ev.representative} 대표</div>
                    <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 99, background: sc.bg, color: sc.text, border: `1px solid ${sc.border}`, fontWeight: 600 }}>{ev.stage}</span>
                  </div>
                );
              })}
              {selectedDate && selectedCrmEvents.length === 0 && selectedGoogleEvents.length === 0 && customEvents.filter(e => e.date === selectedDateStr && e.sheet === calSheet).length === 0 && (
                <div style={{ textAlign: "center", padding: "30px 0", color: "#888", fontSize: 13 }}>이 날 일정이 없어요</div>
              )}
              {/* 커스텀 일정 */}
              {selectedDate && customEvents.filter(e => e.date === selectedDateStr && e.sheet === calSheet).map(function(ev) {
                var col = getColorById(ev.color || "blue");
                return (
                  <div key={ev.id} style={{ padding: "10px 12px", borderRadius: 10, borderLeft: "4px solid " + col.bg, border: "1px solid " + col.light, borderLeftWidth: 4, marginBottom: 8, background: col.light }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>{ev.title}</div>
                        {ev.time && <div style={{ fontSize: 11, color: "#888" }}>{ev.time}</div>}
                        {ev.memo && <div style={{ fontSize: 12, color: "#555", marginTop: 4, lineHeight: 1.5 }}>{ev.memo}</div>}
                        <div style={{ fontSize: 10, color: "#AAA", marginTop: 4 }}>{ev.created_by || "-"}</div>
                        {/* 색상 변경 */}
                        <div style={{ display: "flex", gap: 4, marginTop: 8, alignItems: "center" }}>
                          <span style={{ fontSize: 10, color: "#888" }}>색상:</span>
                          {EVENT_COLORS.map(function(c) {
                            var sel = (ev.color || "blue") === c.id;
                            return (
                              <button key={c.id} onClick={function() { updateEventColor(ev.id, c.id); }}
                                title={c.label}
                                style={{ width: 16, height: 16, borderRadius: "50%", background: c.bg, border: sel ? "2px solid #1A1917" : "1px solid #fff", boxShadow: "0 0 0 1px #E8E5E0", cursor: "pointer", padding: 0 }} />
                            );
                          })}
                        </div>
                      </div>
                      <button onClick={function() { deleteEvent(ev.id); }} style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}>
                        <Icon name="x" size={14} color="#CCC" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 팔로업 탭 */}
      {activeTab === "followup" && (
        <div>
          <div style={{ background: "#FFF7ED", border: "1px solid #FED7AA", borderRadius: 10, padding: "12px 16px", marginBottom: 16, fontSize: 13, color: "#92400E", display: "flex", gap: 10, alignItems: "flex-start" }}>
            <span style={{ fontSize: 18 }}>🔔</span>
            <div>
              <div style={{ fontWeight: 700, marginBottom: 3 }}>팔로업이 필요한 업체예요</div>
              <div style={{ fontSize: 12, lineHeight: 1.6 }}>기관 방문/실태조사 이후 단계의 업체들이에요. 대표자가 기관에 잘 대응했는지, 진행 상황이 어떤지 확인해주세요!</div>
            </div>
          </div>
          {followupList.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: "#888", fontSize: 13 }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>🎉</div>
              팔로업이 필요한 업체가 없어요!
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 12 }}>
              {followupList.map(function(c) {
                const sc = STAGE_COLORS[c.stage] || {};
                const isVisit = c.stage === "기관신청완료/방문완료";
                const isInspect = c.stage === "심사중/실태조사대기" || c.stage === "실태조사완료/약정완료";
                return (
                  <div key={c.id} onClick={() => onSelectCompany(c)}
                    style={{ background: "#fff", borderRadius: 12, border: "1px solid #FED7AA", padding: "16px", cursor: "pointer", transition: "box-shadow 0.15s" }}
                    onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.08)"}
                    onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 3 }}>{c.name}</div>
                        <div style={{ fontSize: 12, color: "#888" }}>{c.representative} 대표 · {c.assignee}</div>
                      </div>
                      <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 99, background: sc.bg, color: sc.text, border: `1px solid ${sc.border}`, fontWeight: 700, flexShrink: 0, marginLeft: 8 }}>{c.stage}</span>
                    </div>
                    <div style={{ background: "#FFF7ED", borderRadius: 8, padding: "10px 12px", marginBottom: 10 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#B45309", marginBottom: 4 }}>
                        {isVisit ? "🏢 기관 방문 후 팔로업" : isInspect ? "🔍 실태조사 후 팔로업" : "📋 진행 상황 확인"}
                      </div>
                      <div style={{ fontSize: 12, color: "#92400E", lineHeight: 1.6 }}>
                        {isVisit ? "대표자가 기관 방문 후 어땠는지 확인해주세요. 추가 서류 요청이 있었나요?" :
                         isInspect ? "실태조사 결과가 어떻게 됐는지 확인해주세요. 심사관이 어떤 피드백을 줬나요?" :
                         "현재 진행 상황을 대표자에게 확인해주세요."}
                      </div>
                    </div>
                    {c.issue && (
                      <div style={{ fontSize: 11, color: "#666", background: "#F7F6F3", borderRadius: 6, padding: "7px 10px", marginBottom: 8 }}>
                        📌 {c.issue.slice(0, 80)}{c.issue.length > 80 ? "..." : ""}
                      </div>
                    )}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 11, color: "#AAA" }}>연락 예정: {c.next_contact || "-"}</span>
                      <span style={{ fontSize: 11, color: "#4338CA", fontWeight: 600 }}>상세보기 →</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 일정 추가 모달 */}
      {showAddEvent && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9998, display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={() => setShowAddEvent(false)}>
          <div style={{ background: "#fff", borderRadius: 14, padding: "22px", width: 380, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 15, fontWeight: 800 }}>📅 일정 추가</div>
              <button onClick={() => setShowAddEvent(false)} style={{ background: "none", border: "none", cursor: "pointer" }}>
                <Icon name="x" size={18} color="#888" />
              </button>
            </div>
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>캘린더</div>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={() => setNewEvent(function(p) { return Object.assign({}, p, { sheet: "yangho" }); })}
                  style={{ flex: 1, padding: "8px", borderRadius: 7, fontSize: 12, fontWeight: 600, background: newEvent.sheet === "yangho" ? "#4338CA" : "#fff", color: newEvent.sheet === "yangho" ? "#fff" : "#666", border: newEvent.sheet === "yangho" ? "none" : "1px solid #E8E5E0", cursor: "pointer" }}>
                  김양호
                </button>
                <button onClick={() => setNewEvent(function(p) { return Object.assign({}, p, { sheet: "director" }); })}
                  style={{ flex: 1, padding: "8px", borderRadius: 7, fontSize: 12, fontWeight: 600, background: newEvent.sheet === "director" ? "#7C3AED" : "#fff", color: newEvent.sheet === "director" ? "#fff" : "#666", border: newEvent.sheet === "director" ? "none" : "1px solid #E8E5E0", cursor: "pointer" }}>
                  이사님
                </button>
              </div>
            </div>
            <input value={newEvent.title} onChange={function(e) { var v = e.target.value; setNewEvent(function(p) { return Object.assign({}, p, { title: v }); }); }}
              placeholder="일정 제목 *" style={{ width: "100%", padding: "10px 12px", border: "1px solid #E8E5E0", borderRadius: 8, fontSize: 13, boxSizing: "border-box", outline: "none", marginBottom: 8 }} />
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <input type="date" value={newEvent.date} onChange={function(e) { var v = e.target.value; setNewEvent(function(p) { return Object.assign({}, p, { date: v }); }); }}
                style={{ flex: 1, padding: "10px 12px", border: "1px solid #E8E5E0", borderRadius: 8, fontSize: 13 }} />
              <input type="time" value={newEvent.time} onChange={function(e) { var v = e.target.value; setNewEvent(function(p) { return Object.assign({}, p, { time: v }); }); }}
                style={{ flex: 1, padding: "10px 12px", border: "1px solid #E8E5E0", borderRadius: 8, fontSize: 13 }} />
            </div>
            <textarea value={newEvent.memo} onChange={function(e) { var v = e.target.value; setNewEvent(function(p) { return Object.assign({}, p, { memo: v }); }); }}
              placeholder="메모 (선택)" rows={3}
              style={{ width: "100%", padding: "10px 12px", border: "1px solid #E8E5E0", borderRadius: 8, fontSize: 13, resize: "none", boxSizing: "border-box", outline: "none", marginBottom: 12 }} />
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, color: "#888", marginBottom: 6 }}>색상</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {EVENT_COLORS.map(function(c) {
                  var selected = newEvent.color === c.id;
                  return (
                    <button key={c.id} onClick={function() { setNewEvent(function(p) { return Object.assign({}, p, { color: c.id }); }); }}
                      title={c.label}
                      style={{ width: 28, height: 28, borderRadius: "50%", background: c.bg, border: selected ? "3px solid #1A1917" : "2px solid #fff", boxShadow: "0 0 0 1px #E8E5E0", cursor: "pointer", padding: 0 }} />
                  );
                })}
              </div>
            </div>
            <button onClick={saveEvent}
              style={{ width: "100%", padding: "11px", background: "#1A1917", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
              저장
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
const DRIVE_FOLDER_ID = "15noP_C-r-ZTo56xGbjUWFv2gAKDzXMJa";
const DRIVE_FOLDER_URL = "https://drive.google.com/drive/folders/15noP_C-r-ZTo56xGbjUWFv2gAKDzXMJa";

const FILE_ICONS = {
  pdf:  { icon: "📄", color: "#DC2626", bg: "#FEF2F2" },
  xlsx: { icon: "📊", color: "#15803D", bg: "#F0FDF4" },
  xls:  { icon: "📊", color: "#15803D", bg: "#F0FDF4" },
  hwp:  { icon: "📝", color: "#1D4ED8", bg: "#EFF6FF" },
  hwpx: { icon: "📝", color: "#1D4ED8", bg: "#EFF6FF" },
  docx: { icon: "📝", color: "#1D4ED8", bg: "#EFF6FF" },
  doc:  { icon: "📝", color: "#1D4ED8", bg: "#EFF6FF" },
  pptx: { icon: "📑", color: "#EA580C", bg: "#FFF7ED" },
  ppt:  { icon: "📑", color: "#EA580C", bg: "#FFF7ED" },
  png:  { icon: "🖼️", color: "#7C3AED", bg: "#F5F3FF" },
  jpg:  { icon: "🖼️", color: "#7C3AED", bg: "#F5F3FF" },
  jpeg: { icon: "🖼️", color: "#7C3AED", bg: "#F5F3FF" },
  mp3:  { icon: "🎵", color: "#B45309", bg: "#FFFBEB" },
  m4a:  { icon: "🎵", color: "#B45309", bg: "#FFFBEB" },
  txt:  { icon: "📃", color: "#555",    bg: "#F7F6F3" },
  zip:  { icon: "🗜️", color: "#555",    bg: "#F7F6F3" },
};

function getFileIcon(name) {
  var ext = (name || "").split(".").pop().toLowerCase();
  return FILE_ICONS[ext] || { icon: "📁", color: "#888", bg: "#F7F6F3" };
}

function formatFileSize(bytes) {
  if (!bytes) return "";
  if (bytes < 1024) return bytes + "B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + "KB";
  return (bytes / (1024 * 1024)).toFixed(1) + "MB";
}

function QuickLinksView() {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ name: "", url: "", category: "" });

  useEffect(function() { fetchLinks(); }, []);

  async function fetchLinks() {
    setLoading(true);
    var r = await supabase.from("quick_links").select("*").order("sort_order", { ascending: true }).order("created_at", { ascending: true });
    if (!r.error) setLinks(r.data || []);
    setLoading(false);
  }

  function normalizeUrl(u) {
    u = (u || "").trim();
    if (!u) return "";
    if (!/^https?:\/\//i.test(u)) u = "https://" + u;
    return u;
  }

  async function saveLink() {
    if (!form.name.trim() || !form.url.trim()) { alert("이름과 주소를 입력하세요."); return; }
    var payload = { name: form.name.trim(), url: normalizeUrl(form.url), category: form.category.trim() || "기타" };
    if (editId) {
      var r = await supabase.from("quick_links").update(payload).eq("id", editId);
      if (r.error) { alert("저장 실패: " + r.error.message); return; }
    } else {
      payload.sort_order = links.length;
      var r2 = await supabase.from("quick_links").insert(payload);
      if (r2.error) { alert("저장 실패: " + r2.error.message); return; }
    }
    setShowAdd(false); setEditId(null); setForm({ name: "", url: "", category: "" });
    fetchLinks();
  }

  async function deleteLink(id) {
    if (!confirm("이 바로가기를 삭제할까요?")) return;
    var r = await supabase.from("quick_links").delete().eq("id", id);
    if (!r.error) setLinks(function(prev) { return prev.filter(function(l) { return l.id !== id; }); });
  }

  function startEdit(l) {
    setEditId(l.id); setForm({ name: l.name, url: l.url, category: l.category || "" }); setShowAdd(true);
  }

  // 카테고리별 그룹
  var grouped = {};
  links.forEach(function(l) { var c = l.category || "기타"; if (!grouped[c]) grouped[c] = []; grouped[c].push(l); });
  var categories = Object.keys(grouped);

  return (
    <div style={{ padding: "0 4px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>🔗 바로가기</h1>
          <div style={{ fontSize: 13, color: "#888", marginTop: 4 }}>자주 쓰는 기관·사이트를 모아두고 한 번에 이동</div>
        </div>
        <button onClick={function() { setEditId(null); setForm({ name: "", url: "", category: "" }); setShowAdd(true); }}
          style={{ display: "flex", alignItems: "center", gap: 6, background: "#1A1917", color: "#F7F6F3", border: "none", borderRadius: 8, padding: "10px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          <Icon name="plus" size={15} color="#F7F6F3" /> 바로가기 추가
        </button>
      </div>

      {showAdd && (
        <div style={{ background: "#F0FDF4", border: "2px solid #86EFAC", borderRadius: 12, padding: "16px 18px", marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#15803D", marginBottom: 12 }}>{editId ? "✏️ 바로가기 수정" : "➕ 새 바로가기"}</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>이름</div>
              <input value={form.name} placeholder="예: 중진공" onChange={function(e) { var v = e.target.value; setForm(function(p) { return Object.assign({}, p, { name: v }); }); }}
                style={{ width: "100%", padding: "9px 11px", border: "1px solid #E8E5E0", borderRadius: 8, fontSize: 13, boxSizing: "border-box", outline: "none" }} />
            </div>
            <div>
              <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>주소 (URL)</div>
              <input value={form.url} placeholder="예: kosmes.or.kr" onChange={function(e) { var v = e.target.value; setForm(function(p) { return Object.assign({}, p, { url: v }); }); }}
                style={{ width: "100%", padding: "9px 11px", border: "1px solid #E8E5E0", borderRadius: 8, fontSize: 13, boxSizing: "border-box", outline: "none" }} />
            </div>
            <div>
              <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>분류 (자유)</div>
              <input value={form.category} placeholder="예: 기관 / 개인" list="ql-cats" onChange={function(e) { var v = e.target.value; setForm(function(p) { return Object.assign({}, p, { category: v }); }); }}
                style={{ width: "100%", padding: "9px 11px", border: "1px solid #E8E5E0", borderRadius: 8, fontSize: 13, boxSizing: "border-box", outline: "none" }} />
              <datalist id="ql-cats">{categories.map(function(c) { return <option key={c} value={c} />; })}</datalist>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={saveLink} style={{ background: "#15803D", color: "#fff", border: "none", borderRadius: 8, padding: "9px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>저장</button>
            <button onClick={function() { setShowAdd(false); setEditId(null); }} style={{ background: "#fff", color: "#888", border: "1px solid #E8E5E0", borderRadius: 8, padding: "9px 16px", fontSize: 13, cursor: "pointer" }}>취소</button>
          </div>
        </div>
      )}

      {loading ? <div style={{ color: "#888", fontSize: 13, padding: 20 }}>불러오는 중...</div>
        : links.length === 0 ? <div style={{ color: "#888", fontSize: 13, padding: 30, textAlign: "center" }}>아직 바로가기가 없어요. "바로가기 추가"로 등록하세요.</div>
        : categories.map(function(cat) {
          return (
            <div key={cat} style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#888", marginBottom: 10, letterSpacing: "0.03em" }}>{cat}</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 10 }}>
                {grouped[cat].map(function(l) {
                  return (
                    <div key={l.id} style={{ position: "relative", background: "#fff", border: "1px solid #E8E5E0", borderRadius: 10, padding: "14px 14px", cursor: "pointer", transition: "border 0.15s" }}
                      onClick={function() { window.open(l.url, "_blank", "noopener"); }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <Icon name="link" size={16} color="#4338CA" />
                        <span style={{ fontSize: 14, fontWeight: 600, color: "#1A1917", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.name}</span>
                      </div>
                      <div style={{ fontSize: 11, color: "#AAA", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{(l.url || "").replace(/^https?:\/\//, "")}</div>
                      <div style={{ position: "absolute", top: 8, right: 8, display: "flex", gap: 2 }}>
                        <button onClick={function(e) { e.stopPropagation(); startEdit(l); }} style={{ background: "none", border: "none", cursor: "pointer", padding: 3, opacity: 0.5 }}><Icon name="edit" size={12} color="#888" /></button>
                        <button onClick={function(e) { e.stopPropagation(); deleteLink(l.id); }} style={{ background: "none", border: "none", cursor: "pointer", padding: 3, opacity: 0.5 }}><Icon name="x" size={12} color="#CCC" /></button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
    </div>
  );
}

function ManualView() {
  const [files, setFiles] = useState([]);
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentFolderId, setCurrentFolderId] = useState(DRIVE_FOLDER_ID);
  const [breadcrumb, setBreadcrumb] = useState([{ id: DRIVE_FOLDER_ID, name: "자료실" }]);
  const [search, setSearch] = useState("");
  const [lastRefresh, setLastRefresh] = useState(null);

  const fetchFiles = useCallback(async (folderId) => {
    setLoading(true);
    setError(null);
    try {
      // Google Drive API - 공개 폴더 파일 목록 조회
      const apiKey = "AIzaSyD-9tSrke72PouQMnMX-a7eZSW0jkFmBBY"; // 공개용 API 키 필요
      const url = `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents+and+trashed=false&fields=files(id,name,mimeType,size,modifiedTime,webViewLink,webContentLink)&orderBy=name&key=${apiKey}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("API 오류");
      const data = await res.json();
      const items = data.files || [];
      const folderMime = "application/vnd.google-apps.folder";
      setFolders(items.filter(f => f.mimeType === folderMime));
      setFiles(items.filter(f => f.mimeType !== folderMime));
      setLastRefresh(new Date());
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchFiles(currentFolderId);
  }, [currentFolderId, fetchFiles]);

  const goToFolder = (folder) => {
    setCurrentFolderId(folder.id);
    setBreadcrumb(prev => [...prev, { id: folder.id, name: folder.name }]);
    setSearch("");
  };

  const goToBreadcrumb = (idx) => {
    const crumb = breadcrumb[idx];
    setBreadcrumb(prev => prev.slice(0, idx + 1));
    setCurrentFolderId(crumb.id);
    setSearch("");
  };

  const filteredFolders = folders.filter(f => !search || f.name.toLowerCase().includes(search.toLowerCase()));
  const filteredFiles = files.filter(f => !search || f.name.toLowerCase().includes(search.toLowerCase()));

  const fmtDate = (iso) => {
    if (!iso) return "";
    return new Date(iso).toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
  };

  return (
    <div>
      {/* 헤더 */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.03em", margin: 0 }}>자료실</h1>
          <p style={{ color: "#888", fontSize: 13, margin: "4px 0 0" }}>Google Drive와 실시간 연동 · 업로드/삭제는 Drive에서</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <a href={DRIVE_FOLDER_URL} target="_blank" rel="noreferrer"
            style={{ display: "flex", alignItems: "center", gap: 6, background: "#4338CA", color: "#fff", border: "none", borderRadius: 8, padding: "10px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer", textDecoration: "none" }}>
            📂 Drive에서 파일 관리
          </a>
          <button onClick={() => fetchFiles(currentFolderId)}
            style={{ display: "flex", alignItems: "center", gap: 6, background: "#fff", color: "#555", border: "1px solid #E8E5E0", borderRadius: 8, padding: "8px 14px", fontSize: 12, cursor: "pointer" }}>
            <Icon name="refresh" size={13} color="#555" /> 새로고침
          </button>
        </div>
      </div>

      {/* 안내 배너 */}
      <div style={{ background: "#EEF2FF", border: "1px solid #C7D2FE", borderRadius: 10, padding: "12px 16px", marginBottom: 16, fontSize: 13, color: "#4338CA", display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 18 }}>💡</span>
        <span><strong>파일 추가/삭제 방법:</strong> 오른쪽 위 "Drive에서 파일 관리" 버튼 클릭 → Google Drive에서 업로드하거나 삭제 → "새로고침" 버튼으로 CRM에 반영</span>
      </div>

      {/* 브레드크럼 */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
        {breadcrumb.map((crumb, idx) => (
          <span key={crumb.id} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {idx > 0 && <span style={{ color: "#888", fontSize: 13 }}>›</span>}
            <span
              onClick={() => goToBreadcrumb(idx)}
              style={{ fontSize: 13, fontWeight: idx === breadcrumb.length - 1 ? 700 : 400, color: idx === breadcrumb.length - 1 ? "#1A1917" : "#4338CA", cursor: idx === breadcrumb.length - 1 ? "default" : "pointer", textDecoration: idx === breadcrumb.length - 1 ? "none" : "underline" }}>
              {crumb.name}
            </span>
          </span>
        ))}
        {lastRefresh && (
          <span style={{ marginLeft: "auto", fontSize: 11, color: "#AAA" }}>
            마지막 업데이트: {lastRefresh.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}
          </span>
        )}
      </div>

      {/* 검색 */}
      <div style={{ position: "relative", marginBottom: 16 }}>
        <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}><Icon name="search" size={15} color="#AAA" /></div>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="파일명 검색..."
          style={{ width: "100%", padding: "10px 14px 10px 36px", border: "1px solid #E8E5E0", borderRadius: 9, fontSize: 13, boxSizing: "border-box", outline: "none" }} />
      </div>

      {/* 로딩 */}
      {loading && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "40vh", flexDirection: "column", gap: 14 }}>
          <div style={{ width: 32, height: 32, border: "3px solid #E8E5E0", borderTopColor: "#4338CA", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
          <span style={{ color: "#888", fontSize: 13 }}>파일 목록 불러오는 중...</span>
        </div>
      )}

      {/* 오류 - API 키 없는 경우 */}
      {!loading && error && (
        <div style={{ background: "#FFF7ED", border: "1px solid #FED7AA", borderRadius: 12, padding: "28px 24px", textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🔗</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#92400E", marginBottom: 8 }}>Google Drive 직접 접속</div>
          <p style={{ fontSize: 13, color: "#B45309", marginBottom: 20, lineHeight: 1.7 }}>
            Drive API 연결을 위한 추가 설정이 필요해요.<br/>
            아래 버튼으로 Drive에 직접 접속해서 파일을 관리하세요.
          </p>
          {/* 폴더 바로가기 버튼들 */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 10, marginBottom: 20, textAlign: "left" }}>
            {[
              { name: "📁 기술보증기금", path: "기술보증기금" },
              { name: "📁 보증기관 녹음 파일", path: "보증기관 녹음 파일" },
              { name: "📁 보증재단 메뉴얼 및 자료", path: "보증재단 메뉴얼 및 자료" },
              { name: "📁 소상공인 공단", path: "소상공인 공단" },
              { name: "📁 스크립트 가이드", path: "스크립트 가이드" },
              { name: "📁 신용보증기금", path: "신용보증기금" },
              { name: "📁 농협신용보증기금", path: "농협신용보증기금" },
              { name: "📁 중진공", path: "중진공" },
              { name: "📁 추가업종 제안서", path: "추가업종 제안서" },
            ].map(folder => (
              <a key={folder.name} href={DRIVE_FOLDER_URL} target="_blank" rel="noreferrer"
                style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: "#fff", border: "1px solid #E8E5E0", borderRadius: 8, fontSize: 13, color: "#333", textDecoration: "none", fontWeight: 500 }}>
                {folder.name}
              </a>
            ))}
          </div>
          <a href={DRIVE_FOLDER_URL} target="_blank" rel="noreferrer"
            style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#4338CA", color: "#fff", borderRadius: 9, padding: "12px 24px", fontSize: 14, fontWeight: 700, textDecoration: "none" }}>
            📂 Google Drive 자료실 열기
          </a>
        </div>
      )}

      {/* 파일/폴더 목록 */}
      {!loading && !error && (
        <>
          {/* 폴더 목록 */}
          {filteredFolders.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#888", letterSpacing: "0.04em", marginBottom: 10 }}>📁 폴더</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
                {filteredFolders.map(folder => (
                  <div key={folder.id} onClick={() => goToFolder(folder)}
                    style={{ display: "flex", alignItems: "center", gap: 10, padding: "13px 15px", background: "#fff", border: "1px solid #E8E5E0", borderRadius: 10, cursor: "pointer", transition: "all 0.15s" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#F0F0EC"}
                    onMouseLeave={e => e.currentTarget.style.background = "#fff"}>
                    <span style={{ fontSize: 22 }}>📁</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{folder.name}</div>
                      <div style={{ fontSize: 11, color: "#AAA" }}>{fmtDate(folder.modifiedTime)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 파일 목록 */}
          {filteredFiles.length > 0 && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#888", letterSpacing: "0.04em", marginBottom: 10 }}>
                📄 파일 <span style={{ fontWeight: 400 }}>({filteredFiles.length}개)</span>
              </div>
              <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #E8E5E0", overflow: "hidden" }}>
                {filteredFiles.map((file, i) => {
                  const fi = getFileIcon(file.name);
                  return (
                    <div key={file.id}
                      style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderBottom: i < filteredFiles.length - 1 ? "1px solid #F0EDE8" : "none", cursor: "pointer", transition: "background 0.1s" }}
                      onMouseEnter={e => e.currentTarget.style.background = "#F7F6F3"}
                      onMouseLeave={e => e.currentTarget.style.background = "#fff"}
                      onClick={() => window.open(file.webViewLink, "_blank")}>
                      <div style={{ width: 36, height: 36, borderRadius: 8, background: fi.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
                        {fi.icon}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "#1A1917" }}>{file.name}</div>
                        <div style={{ fontSize: 11, color: "#AAA", marginTop: 2 }}>
                          {formatFileSize(parseInt(file.size))} {file.size && "·"} {fmtDate(file.modifiedTime)}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                        <a href={file.webViewLink} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}
                          style={{ fontSize: 11, padding: "4px 10px", borderRadius: 6, background: "#EEF2FF", color: "#4338CA", textDecoration: "none", fontWeight: 600 }}>
                          열기
                        </a>
                        {file.webContentLink && (
                          <a href={file.webContentLink} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}
                            style={{ fontSize: 11, padding: "4px 10px", borderRadius: 6, background: "#F0FDF4", color: "#15803D", textDecoration: "none", fontWeight: 600 }}>
                            다운로드
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {filteredFolders.length === 0 && filteredFiles.length === 0 && (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "#AAA", fontSize: 13 }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>📭</div>
              {search ? "검색 결과가 없어요" : "이 폴더가 비어 있어요"}
            </div>
          )}
        </>
      )}
    </div>
  );
}
const BOJUNG_AGENCIES = ["신용보증기금", "농협신용보증기금", "기술보증기금"];

const JUNGINGONG_REGIONS = [
  "서울지역본부", "서울동부지부", "서울서부지부", "서울남부지부",
  "인천지역본부", "인천서부지부",
  "경기지역본부", "경기동부지부", "경기서부지부", "경기남부지부", "경기북부지부",
  "강원지역본부", "강원영동지부",
  "대전지역본부", "세종지역본부", "충남지역본부", "충북지역본부", "충북북부지부",
  "전북지역본부", "전북서부지부", "광주지역본부", "전남지역본부", "전남동부지부",
  "대구지역본부",
  "경북지역본부", "경북동부지부", "경북남부지부",
  "부산지역본부", "부산동부지부", "울산지역본부",
  "경남지역본부", "경남동부지부", "경남서부지부",
  "제주지역본부"
];

const STATUS_COLORS_MAP = {
  "승인": { bg: "#ECFDF5", text: "#047857" }, "약정": { bg: "#ECFDF5", text: "#047857" }, "완료": { bg: "#ECFDF5", text: "#047857" },
  "최종제출": { bg: "#EEF2FF", text: "#4338CA" }, "심사중": { bg: "#EEF2FF", text: "#4338CA" }, "심사대기": { bg: "#EEF2FF", text: "#4338CA" },
  "진행 중": { bg: "#EEF2FF", text: "#4338CA" }, "우선도 평가": { bg: "#EEF2FF", text: "#4338CA" }, "우선도 평가 예비": { bg: "#EEF2FF", text: "#4338CA" },
  "임시저장": { bg: "#FFF7ED", text: "#C2410C" }, "기관 방문 전": { bg: "#FFF7ED", text: "#C2410C" }, "기관 방문 후 대기": { bg: "#FFF7ED", text: "#C2410C" },
  "온라인 신청 후 대기": { bg: "#FFF7ED", text: "#C2410C" }, "실태 조사 예정": { bg: "#FFFBEB", text: "#B45309" }, "실태 조사 완료": { bg: "#FFFBEB", text: "#B45309" },
  "부결": { bg: "#FEF2F2", text: "#DC2626" }, "반려": { bg: "#FEF2F2", text: "#DC2626" }, "진행불가": { bg: "#FEF2F2", text: "#DC2626" }, "신청취소": { bg: "#FEF2F2", text: "#DC2626" },
  "보류": { bg: "#F5F3FF", text: "#7C3AED" }, "중단": { bg: "#F5F3FF", text: "#7C3AED" },
  "시작 전": { bg: "#F7F6F3", text: "#888" }, "신청못함": { bg: "#F7F6F3", text: "#888" },
};

const ALL_STATUS_OPTIONS = ["시작 전","진행 중","기관 방문 전","기관 방문 후 대기","온라인 신청 후 대기","임시저장","최종제출","우선도 평가 예비","우선도 평가","실태 조사 예정","실태 조사 완료","심사대기","심사중","승인","약정","완료","부결","반려","보류","중단","진행불가","신청취소","신청못함"];

function AgencyView({ jumpToMonth, jumpToGroup }) {
  var currentYear = new Date().getFullYear();
  const [activeGroup, setActiveGroup] = useState(jumpToGroup || "소상공인시장진흥공단");
  const [activeMonth, setActiveMonth] = useState(jumpToMonth || new Date().getMonth() + 1);
  const [statusFilter, setStatusFilter] = useState("all"); // "all" | "approved" | "inProgress" | "rejected"
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [showTrash, setShowTrash] = useState(false);
  const [filterAssignee, setFilterAssignee] = useState([]); // 다중선택, 빈 배열 = 전체
  const [showAddCase, setShowAddCase] = useState(false);
  const [newCase, setNewCase] = useState({});
  const [companySuggestions, setCompanySuggestions] = useState([]);
  const [companiesList, setCompaniesList] = useState([]);
  const [selectedCase, setSelectedCase] = useState(null);
  const [clipboardCase, setClipboardCase] = useState(function() {
    try {
      var saved = sessionStorage.getItem("agencyClipboard");
      return saved ? JSON.parse(saved) : null;
    } catch (e) { return null; }
  });

  // 지역본부 → 연락처 중앙 매핑 (branch_contacts 테이블)
  const [contactMap, setContactMap] = useState({});
  // 연락처 인라인 편집: 현재 편집중인 칸 키 (row.id + "_" + branch), null이면 평소 텍스트 표시
  const [editingPhoneKey, setEditingPhoneKey] = useState(null);

  // branch_contacts 테이블에서 매핑 가져오기
  var fetchContactMap = async function() {
    var r = await supabase.from("branch_contacts").select("*");
    if (!r.error && r.data) {
      var map = {};
      r.data.forEach(function(row) {
        if (row.branch_name) map[row.branch_name] = row.phone || "";
      });
      setContactMap(map);
    }
  };

  useEffect(function() { fetchContactMap(); }, []);

  // 연락처 업데이트 - 중앙 매핑 변경 (모든 업체에 즉시 반영됨)
  var updateBranchContact = async function(branchName, newPhone) {
    if (!branchName) return;
    // UI 즉시 반영
    setContactMap(function(prev) { return Object.assign({}, prev, { [branchName]: newPhone }); });
    // DB 업데이트 (upsert)
    var r = await supabase.from("branch_contacts").upsert({
      branch_name: branchName,
      phone: newPhone,
      updated_at: new Date().toISOString(),
      updated_by: "양호",
    }, { onConflict: "branch_name" });
    if (r.error) {
      alert("연락처 저장 실패: " + r.error.message);
      // 실패 시 다시 가져오기
      fetchContactMap();
    }
  };

  // 컬럼 너비 - 기관 그룹별로 localStorage에 저장
  const DEFAULT_COL_WIDTHS = {
    num: 40, business_name: 160, representative: 80, assignee: 80, amount: 70,
    product: 140, industry: 70, region: 80, contact: 130, status: 110, dup: 56, docs: 200,
    credit: 60, notes: 140, action: 120, priority: 84
  };
  const [colWidths, setColWidths] = useState(function() {
    try {
      var saved = localStorage.getItem("agencyColWidths_" + (jumpToGroup || "소상공인시장진흥공단"));
      return saved ? Object.assign({}, DEFAULT_COL_WIDTHS, JSON.parse(saved)) : DEFAULT_COL_WIDTHS;
    } catch (e) { return DEFAULT_COL_WIDTHS; }
  });
  // 그룹 바뀔 때 너비도 그 그룹 거로 복원
  useEffect(function() {
    try {
      var saved = localStorage.getItem("agencyColWidths_" + activeGroup);
      setColWidths(saved ? Object.assign({}, DEFAULT_COL_WIDTHS, JSON.parse(saved)) : DEFAULT_COL_WIDTHS);
    } catch (e) { setColWidths(DEFAULT_COL_WIDTHS); }
  }, [activeGroup]);

  // 드래그 시작 - 헤더 핸들에서 호출
  var startColResize = function(colKey, e) {
    e.stopPropagation();
    e.preventDefault();
    var startX = e.clientX;
    var startW = colWidths[colKey] || 100;
    var onMove = function(ev) {
      var newW = Math.max(40, startW + (ev.clientX - startX));
      setColWidths(function(prev) {
        var next = Object.assign({}, prev);
        next[colKey] = newW;
        return next;
      });
    };
    var onUp = function() {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      // 저장은 onUp에서 한 번만 (드래그 끝났을 때)
      setColWidths(function(prev) {
        try { localStorage.setItem("agencyColWidths_" + activeGroup, JSON.stringify(prev)); } catch (e) {}
        return prev;
      });
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  };

  // 헤더 셀 공통 스타일 생성기
  var headerCellStyle = function(colKey, extra) {
    return Object.assign({
      padding: "10px 12px", textAlign: "left", fontWeight: 600, color: "#888", fontSize: 11, background: "#F7F6F3",
      width: colWidths[colKey], minWidth: colWidths[colKey], maxWidth: colWidths[colKey],
      position: "relative", boxSizing: "border-box", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis"
    }, extra || {});
  };
  // 드래그 핸들 컴포넌트 (헤더 오른쪽에 붙임)
  var ResizeHandle = function(props) {
    return (
      <span onMouseDown={function(e) { startColResize(props.colKey, e); }}
        style={{ position: "absolute", right: 0, top: 0, height: "100%", width: 6, cursor: "col-resize", userSelect: "none", zIndex: 3 }}
        onClick={function(e) { e.stopPropagation(); }}
        title="드래그해서 열 너비 조절" />
    );
  };

  var fetchCases = async function() {
    setLoading(true);
    // Supabase 1000건 기본 limit 우회: range로 페이징
    var allData = [];
    var pageSize = 1000;
    var offset = 0;
    while (true) {
      var result = await supabase.from("agency_cases")
        .select("*")
        .order("created_at", { ascending: true })
        .range(offset, offset + pageSize - 1);
      if (result.error) {
        console.error("fetchCases error:", result.error);
        break;
      }
      if (!result.data || result.data.length === 0) break;
      allData = allData.concat(result.data);
      if (result.data.length < pageSize) break;
      offset += pageSize;
      if (offset > 50000) break; // 안전장치
    }
    setCases(allData);
    setLoading(false);
  };

  var fetchCompanies = async function() {
    var result = await supabase.from("companies").select("*").is("deleted_at", null);
    if (!result.error) setCompaniesList(result.data || []);
  };

  // 순서 이동 함수 - dir: -1(위) 또는 +1(아래)
  var moveCaseOrder = async function(caseId, dir) {
    // 현재 보이는 순서(filtered)에서 위치를 바꾸고, 전체에 sort_order를 1,2,3...으로 다시 부여 (일부만 교환하면 순서가 꼬임)
    var siblings = filtered.slice();
    var idx = siblings.findIndex(function(c) { return c.id === caseId; });
    if (idx < 0) return;
    var targetIdx = idx + dir;
    if (targetIdx < 0 || targetIdx >= siblings.length) return;
    // 배열에서 두 항목 위치 swap
    var tmp = siblings[idx]; siblings[idx] = siblings[targetIdx]; siblings[targetIdx] = tmp;
    // 새 순서대로 1,2,3... 재부여
    var orderMap = {};
    siblings.forEach(function(c, i) { orderMap[c.id] = i + 1; });
    // 즉시 UI 반영 (낙관적)
    setCases(function(prev) {
      return prev.map(function(c) { return orderMap[c.id] != null ? Object.assign({}, c, { sort_order: orderMap[c.id] }) : c; });
    });
    // DB 일괄 업데이트 (병렬)
    try {
      await Promise.all(siblings.map(function(c, i) {
        return supabase.from("agency_cases").update({ sort_order: i + 1 }).eq("id", c.id);
      }));
    } catch (e) {
      console.warn("순서 변경 저장 실패:", e);
      fetchCases();
    }
  };

  useEffect(function() { fetchCases(); fetchCompanies(); }, []);

  useEffect(function() {
    if (jumpToMonth) setActiveMonth(Number(jumpToMonth));
    if (jumpToGroup) setActiveGroup(jumpToGroup);
  }, [jumpToMonth, jumpToGroup]);

  // 중복 사업장 판단: 같은 기관(activeGroup) 안에서 사업자명+대표자명이 같으면 중복
  // (신보에도 있고 기보에도 있는 건 협업이라 중복 아님. 한 기관 안 중복 등록만 잡음)
  // 중복: 같은 기관 + 같은 업체(사업자명+대표자명) + 같은 월에 2건 이상일 때만 (전월 탈락→다음달 재신청은 중복 아님)
  const dupKeys = useMemo(function() {
    var counts = {};
    (cases || []).forEach(function(c) {
      var bn = (c.business_name || "").trim();
      var rep = (c.representative || "").trim();
      var grp = c.agency_group || c.group || "";
      var mon = c.month != null ? String(c.month) : "";
      if (!bn || !rep) return;
      var key = grp + "||" + bn + "|" + rep + "||" + mon;
      counts[key] = (counts[key] || 0) + 1;
    });
    var dups = {};
    Object.keys(counts).forEach(function(k) { if (counts[k] >= 2) dups[k] = counts[k]; });
    return dups;
  }, [cases]);
  function isDupRow(c) {
    var bn = (c.business_name || "").trim();
    var rep = (c.representative || "").trim();
    var grp = c.agency_group || c.group || "";
    var mon = c.month != null ? String(c.month) : "";
    if (!bn || !rep) return 0;
    return dupKeys[grp + "||" + bn + "|" + rep + "||" + mon] || 0;
  }

  var STATUS_GROUPS = {
    approved: ["승인","약정"],
    completed: ["완료"],
    waiting: ["기관 방문 전","기관 방문 후 대기","온라인 신청 후 대기","심사대기"],
    returned: ["반려"],
    rejected: ["부결","진행불가","신청취소","신청못함","중단"],
    inProgress: ["진행 중","심사중","최종제출","임시저장","우선도 평가","우선도 평가 예비","실태 조사 예정","실태 조사 완료"],
  };
  // 위 그룹에 안 속하면 '기타'(보류/시작 전 등) — 5개 칩 어디에도 안 잡히고 '전체'에서만 보임
  var groupOf = function(status) {
    for (var k in STATUS_GROUPS) { if (STATUS_GROUPS[k].indexOf(status) >= 0) return k; }
    return "other";
  };

  var filtered = useMemo(function() {
    var list = cases.filter(function(c) {
      var matchMonth = activeMonth === "all" ? true : Number(c.month) === Number(activeMonth);
      var matchStatus = statusFilter === "all" ? true : groupOf(c.status) === statusFilter;
      return c.agency_group === activeGroup
        && matchMonth
        && Number(c.year) === currentYear
        && !c.deleted_at
        && (filterAssignee.length === 0 || filterAssignee.some(function(n) { return (c.assignee || "").split(",").map(function(x) { return x.trim(); }).includes(n); }))
        && matchStatus;
    });
    // "전체"일 때: 같은 업체(기관+사업자명+대표자명)가 여러 달에 있으면 가장 최근 월만 표시
    if (activeMonth === "all") {
      var latest = {};
      list.forEach(function(c) {
        var bn = (c.business_name || "").trim(), rep = (c.representative || "").trim(), grp = c.agency_group || "";
        if (!bn || !rep) return;
        var k = grp + "|" + bn + "|" + rep;
        var m = Number(c.month) || 0;
        if (latest[k] == null || m > latest[k]) latest[k] = m;
      });
      list = list.filter(function(c) {
        var bn = (c.business_name || "").trim(), rep = (c.representative || "").trim(), grp = c.agency_group || "";
        if (!bn || !rep) return true;
        var k = grp + "|" + bn + "|" + rep;
        return Number(c.month) === latest[k];
      });
    }
    return list.sort(function(a, b) {
      var aOrder = a.sort_order != null ? a.sort_order : null;
      var bOrder = b.sort_order != null ? b.sort_order : null;
      if (aOrder != null && bOrder != null) return aOrder - bOrder;
      if (aOrder != null) return -1;
      if (bOrder != null) return 1;
      return (a.created_at || "").localeCompare(b.created_at || "");
    });
  }, [cases, activeGroup, activeMonth, filterAssignee, currentYear, statusFilter]);

  var trashedCases = useMemo(function() {
    return cases.filter(function(c) { return !!c.deleted_at; });
  }, [cases]);

  var monthsWithData = useMemo(function() {
    var s = new Set();
    cases.filter(function(c) {
      return c.agency_group === activeGroup && Number(c.year) === currentYear && !c.deleted_at;
    }).forEach(function(c) { s.add(Number(c.month)); });
    return s;
  }, [cases, activeGroup]);

  var assigneesInGroup = useMemo(function() {
    var s = new Set();
    cases.filter(function(c) {
      return c.agency_group === activeGroup && Number(c.month) === Number(activeMonth) && !c.deleted_at;
    }).forEach(function(c) { if (c.assignee) c.assignee.split(",").map(function(x) { return x.trim(); }).filter(Boolean).forEach(function(n) { s.add(n); }); });
    return Array.from(s).sort();
  }, [cases, activeGroup, activeMonth]);

  var summary = useMemo(function() {
    // summary는 statusFilter 무관하게 항상 전체 카운트 보여줘야 함 (클릭 가능 표시용)
    // 그래서 filtered가 아니라 별도로 계산
    var baseList = cases.filter(function(c) {
      var matchMonth = activeMonth === "all" ? true : Number(c.month) === Number(activeMonth);
      return c.agency_group === activeGroup && matchMonth && Number(c.year) === currentYear && !c.deleted_at
        && (filterAssignee.length === 0 || filterAssignee.some(function(n) { return (c.assignee || "").split(",").map(function(x) { return x.trim(); }).includes(n); }));
    });
    var approved = baseList.filter(function(c) { return groupOf(c.status) === "approved"; }).length;
    var completed = baseList.filter(function(c) { return groupOf(c.status) === "completed"; }).length;
    var waiting = baseList.filter(function(c) { return groupOf(c.status) === "waiting"; }).length;
    var inProgress = baseList.filter(function(c) { return groupOf(c.status) === "inProgress"; }).length;
    var rejected = baseList.filter(function(c) { return groupOf(c.status) === "rejected"; }).length;
    var returned = baseList.filter(function(c) { return groupOf(c.status) === "returned"; }).length;
    var total = baseList.length;
    return { total: total, approved: approved, completed: completed, waiting: waiting, inProgress: inProgress, rejected: rejected, returned: returned };
  }, [cases, activeGroup, activeMonth, filterAssignee, currentYear]);

  var activeGroupObj = AGENCY_GROUPS.find(function(g) { return g.id === activeGroup; });
  var groupColor = activeGroupObj ? activeGroupObj.color : "#4338CA";

  var onBusinessNameChange = function(value) {
    setNewCase(function(p) { return Object.assign({}, p, { business_name: value }); });
    if (!value || value.length < 1) { setCompanySuggestions([]); return; }
    var matches = companiesList.filter(function(co) {
      return (co.name || "").toLowerCase().indexOf(value.toLowerCase()) >= 0;
    }).slice(0, 8);
    setCompanySuggestions(matches);
  };

  var selectCompany = function(co) {
    setNewCase(function(p) {
      return Object.assign({}, p, {
        business_name: co.name || "",
        representative: co.representative || "",
        business_number: co.business_number || "",
        region: co.region || "",
        assignee: co.assignee || "",
        notes: "",
      });
    });
    setCompanySuggestions([]);
  };

  var openAddCase = function() {
    setNewCase({
      agency_group: activeGroup, year: currentYear, month: Number(activeMonth),
      business_name: "", representative: "", business_number: "",
      assignee: "", status: "시작 전", request_amount: "", region: "", notes: "",
    });
    setCompanySuggestions([]);
    setShowAddCase(true);
  };

  var saveNewCase = async function() {
    if (!newCase.business_name) { alert("사업자명은 필수입니다."); return; }
    var insertData = {
      agency_group: activeGroup,
      year: currentYear,
      month: Number(activeMonth),
      business_name: newCase.business_name,
      representative: newCase.representative || null,
      business_number: newCase.business_number || null,
      assignee: newCase.assignee || null,
      status: newCase.status || "시작 전",
      request_amount: newCase.request_amount || null,
      region: newCase.region || null,
      notes: newCase.notes || null,
    };
    var result = await supabase.from("agency_cases").insert(insertData).select().single();
    if (!result.error && result.data) {
      setCases(function(prev) { return prev.concat([result.data]); });
      setShowAddCase(false);
      setNewCase({});
      setCompanySuggestions([]);
    } else {
      alert("저장 실패: " + (result.error ? result.error.message : "알 수 없는 에러"));
    }
  };

  var saveEdit = async function() {
    var updates = {
      business_name: editData.business_name, representative: editData.representative,
      assignee: editData.assignee, status: editData.status,
      request_amount: editData.request_amount, region: editData.region,
      agency_sub: editData.agency_sub, notes: editData.notes,
      fund_product: editData.fund_product || null,
      delivered_docs: editData.delivered_docs || [],
      updated_at: new Date().toISOString()
    };
    var result = await supabase.from("agency_cases").update(updates).eq("id", editData.id);
    if (!result.error) {
      setCases(function(prev) { return prev.map(function(c) { return c.id === editData.id ? Object.assign({}, c, updates) : c; }); });
      setEditingId(null); setEditData({});
    }
  };

  var deleteCase = async function(id) {
    if (!window.confirm("휴지통으로 이동하시겠습니까?")) return;
    var now = new Date().toISOString();
    var result = await supabase.from("agency_cases").update({ deleted_at: now }).eq("id", id);
    if (!result.error) setCases(function(prev) { return prev.map(function(c) { return c.id === id ? Object.assign({}, c, { deleted_at: now }) : c; }); });
  };

  var restoreCase = async function(id) {
    var result = await supabase.from("agency_cases").update({ deleted_at: null }).eq("id", id);
    if (!result.error) setCases(function(prev) { return prev.map(function(c) { return c.id === id ? Object.assign({}, c, { deleted_at: null }) : c; }); });
  };

  var permanentDelete = async function(id) {
    if (!window.confirm("영구 삭제합니다. 복구할 수 없습니다.")) return;
    var result = await supabase.from("agency_cases").delete().eq("id", id);
    if (!result.error) setCases(function(prev) { return prev.filter(function(c) { return c.id !== id; }); });
  };

  var GUJOHYEOK_STATUS_OPTIONS = [
    "시작전","서류 제출 완료","자가진단 완료","전문 위원 배정","전문 위원 실사 완료",
    "컨설턴트 신청 완료","컨설팅 진행중","컨설팅 최종 완료","승인 신청서 제출 완료",
    "예산 소진으로 컨설턴트 보류","예산 소진으로 자금 신청 보류","사업전환 승인"
  ];
  var GUJOHYEOK_STATUS_COLORS = {
    "시작전":                       { bg: "#F7F6F3", text: "#888" },
    "서류 제출 완료":               { bg: "#E6F1FB", text: "#185FA5" },
    "자가진단 완료":                { bg: "#E6F1FB", text: "#0C447C" },
    "전문 위원 배정":               { bg: "#FAEEDA", text: "#633806" },
    "전문 위원 실사 완료":          { bg: "#FAEEDA", text: "#412402" },
    "컨설턴트 신청 완료":           { bg: "#FAEEDA", text: "#412402" },
    "컨설팅 진행중":                { bg: "#FAEEDA", text: "#412402" },
    "컨설팅 최종 완료":             { bg: "#EAF3DE", text: "#27500A" },
    "승인 신청서 제출 완료":        { bg: "#EAF3DE", text: "#173404" },
    "예산 소진으로 컨설턴트 보류":  { bg: "#FAC775", text: "#412402" },
    "예산 소진으로 자금 신청 보류": { bg: "#FAC775", text: "#412402" },
    "사업전환 승인":                { bg: "#1D9E75", text: "#fff" },
  };
  var DELIVERED_DOCS_OPTIONS = ["부의 기업","승인신청서","전문위원 스크립트","컨설팅 스크립트","최종 스크립트"];
  var STATUS_OPTIONS = activeGroup === "구조혁신&사업전환"
    ? GUJOHYEOK_STATUS_OPTIONS
    : ["시작 전","진행 중","심사중","심사대기","최종제출","우선도 평가","기관 방문 전","기관 방문 후 대기","온라인 신청 후 대기","실태 조사 예정","실태 조사 완료","승인","약정","완료","부결","반려","진행불가","신청취소","보류"];

  var PRIORITY_CHECKLIST = [
    { category: "고용지표", items: ["고용창출 실적 보유기업","내일채용공제 가입 등 일자리 유지 기업","인재육성형 중소기업","가족친화인증기업 지정","채용계획기업(6개월 이내)"] },
    { category: "기술지표(양산 후 3년 이내)", items: ["특허,실용신안등 지적재산권 보유(3년 이내 등록)","기업부설연구소,연구개발전담부서 보유","저작권 보유(3년 이내 등록)","양산 3년 이내 제품 개발실적 보유","Inno-Biz 인증","신기술(NET,NEP) 인증","지식재산경영인증기업","녹색기술인증","뿌리기술전문기업","벤처기업","매출액 대비 연구개발비중이 5% 이상"] },
    { category: "경영지표", items: ["Main-Biz 인증","명문장수기업","매출액 영업이익률이 동종업계 평균영업이익률의 2배 이상"] },
    { category: "기업공개", items: ["5년 내 코스닥,코넥스 상장예정기업","외부투자유치 실적 보유"] },
    { category: "수출실적", items: ["최근 1년간 수출실적(간접포함)보유"] },
    { category: "그린기술", items: ["오염물질 저감 설비,저탄소·에너지 효율화,환경오염방지 설비 등 도입","탄소중립형 스마트공장 지원사업 협약","원부자재 등을 친환경 소재로 전환","탄소중립 경영혁신 컨설팅 선정","신재생에너지,탄소저감 등 그린분야 영위기업 또는 기술 사업화 기업","탄소중립 전환지원사업 선정기업"] },
    { category: "스마트화", items: ["정부 등의 스마트공장 지원사업 참여기업","생산효율화를 위한 자동화 시설 도입"] },
    { category: "재기지원", items: ["사업전환 계획 승인기업(승인일로부터 5년 내)","사업전환 계획기업(업력 3년,종업원 5인 이상)","구조개선전용자금 요건 해당기업","통상변화대응위원기업 지정(지정일로부터 3년 내)","폐업한 개인기업 또는 법인기업 운영경험 보유(단,주점업 등은 제외)","6개월 이내 경영에로 피해 발생기업"] },
    { category: "정책우대", items: ["소부장 강소기업 100·스타트업100·경쟁력위원회 추천기업","아기유니콘 200","지역혁신 선도기업 선정","글로벌 강소기업","여성기업","무명의 수출용사","튼튼한 내수기업","글로벌 강소기업 1000+(강소이상)","수출국 다변화","수출다변화 계획보유"] },
    { category: "창업준비", items: ["중기부 기술창업활성화 지원사업(청년창업사관학교 등) 졸업 또는 수상기업","창업진흥원 예비창업패키지 사업 참여기업","창업기업확인서 보유기업","예비창업자(사업자등록번호가 없는 상태)"] },
    { category: "사회적 경제기업", items: ["사회적기업","예비사회적기업","마을기업","자활기업","협동조합(협동조합기본법에 근거한 협동조합만 해당)","소셜벤처기업"] },
  ];

  // 중진공 정책우선도 점수 계산 (카테고리별 배점, 합 100) — 위 60개 체크리스트를 근거로 점수화
  // 해당 카테고리에서 1개 이상 체크되면 그 카테고리 배점을 부여 (우선도 평가 = 우대항목 자격 충족 방식)
  var PRIORITY_WEIGHTS = {
    "고용지표": 15,
    "기술지표(양산 후 3년 이내)": 20,
    "경영지표": 10,
    "기업공개": 8,
    "수출실적": 10,
    "그린기술": 8,
    "스마트화": 7,
    "재기지원": 7,
    "정책우대": 8,
    "창업준비": 4,
    "사회적 경제기업": 3,
  };
  var calcPriorityScore = function(checks) {
    var c = checks;
    if (typeof c === "string") { try { c = JSON.parse(c || "{}"); } catch (e) { c = {}; } }
    if (!c || typeof c !== "object") c = {};
    var score = 0, qualified = 0, checkedTotal = 0;
    PRIORITY_CHECKLIST.forEach(function(cat) {
      var w = PRIORITY_WEIGHTS[cat.category] || 0;
      var n = cat.items.filter(function(it) { return c[it]; }).length;
      checkedTotal += n;
      if (n > 0) { score += w; qualified++; }
    });
    return { score: score, qualified: qualified, checked: checkedTotal };
  };
  var priorityScoreColor = function(s) { return s >= 70 ? "#15803D" : s >= 50 ? "#B45309" : "#DC2626"; };
  var priorityScoreBg = function(s) { return s >= 70 ? "#DCFCE7" : s >= 50 ? "#FEF3C7" : "#FEE2E2"; };

  const [showPriorityModal, setShowPriorityModal] = useState(false);
  const [priorityTarget, setPriorityTarget] = useState(null);
  const [priorityChecks, setPriorityChecks] = useState({});

  var openPriority = function(row) {
    setPriorityTarget(row);
    var saved = {};
    try { saved = JSON.parse(row.priority_checks || "{}"); } catch(e) { saved = {}; }
    setPriorityChecks(saved);
    setShowPriorityModal(true);
  };
  var savePriorityChecks = async function() {
    var r = await supabase.from("agency_cases").update({ priority_checks: JSON.stringify(priorityChecks) }).eq("id", priorityTarget.id);
    if (!r.error) {
      setCases(function(prev) { return prev.map(function(c) { return c.id === priorityTarget.id ? Object.assign({}, c, { priority_checks: JSON.stringify(priorityChecks) }) : c; }); });
      setShowPriorityModal(false);
      alert("체크리스트가 저장됐어요!");
    }
  };

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", flexDirection: "column", gap: 16 }}>
      <div style={{ width: 36, height: 36, border: "3px solid #E8E5E0", borderTopColor: "#1A1917", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <span style={{ color: "#888", fontSize: 13 }}>기관별 현황 불러오는 중...</span>
    </div>
  );

  return (
    <div>
      {/* 헤더 */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.03em", margin: 0 }}>기관별 현황</h1>
          <p style={{ color: "#888", fontSize: 13, margin: "4px 0 0" }}>기관 · 월별 진행건을 한눈에</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={openAddCase}
            style={{ display: "flex", alignItems: "center", gap: 6, background: "#1A1917", color: "#fff", border: "none", borderRadius: 8, padding: "10px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
            <Icon name="plus" size={14} color="#fff" /> 신규 추가
          </button>
          {clipboardCase && (
            <button onClick={async function() {
              if (!confirm("'" + clipboardCase.business_name + "'을(를) " + activeGroup + " " + activeMonth + "월에 추가할까요?")) return;
              // 핵심 필수 컬럼만 먼저 시도
              var baseData = {
                agency_group: activeGroup,
                year: currentYear,
                month: Number(activeMonth) || (new Date().getMonth() + 1),
                business_name: clipboardCase.business_name,
                representative: clipboardCase.representative || null,
                business_number: clipboardCase.business_number || null,
                assignee: clipboardCase.assignee || null,
                status: "시작 전",
                request_amount: clipboardCase.request_amount || null,
                region: clipboardCase.region || null,
                notes: clipboardCase.notes || null,
              };
              // 1차: 전체 데이터로 시도 (선택 컬럼 포함)
              var fullData = Object.assign({}, baseData);
              if (clipboardCase.credit_score != null) fullData.credit_score = clipboardCase.credit_score;
              if (clipboardCase.product) fullData.product = clipboardCase.product;
              // 우선도 + 추가정보 + 업종 같이 붙여넣기
              ["industry","priority_checks","extra_notes","ipin_account","ipin_password","resident_number","agency_login_id","agency_login_password","personal_cert_password","business_cert_password","final_confirm"].forEach(function(f) {
                if (clipboardCase[f] != null && clipboardCase[f] !== "") fullData[f] = clipboardCase[f];
              });
              var r = await supabase.from("agency_cases").insert(fullData).select();
              if (r.error) {
                console.warn("agency_cases 1차 insert 실패, 핵심 컬럼만 재시도:", r.error.message);
                // 2차: 핵심 컬럼만으로 재시도
                r = await supabase.from("agency_cases").insert(baseData).select();
              }
              if (r.error) { alert("추가 실패: " + r.error.message); return; }
              fetchCases();
              alert("✅ '" + clipboardCase.business_name + "' 추가 완료");
            }} title={"클립보드: " + clipboardCase.business_name + " (" + clipboardCase.sourceGroup + " " + clipboardCase.sourceMonth + "월)"}
              style={{ display: "flex", alignItems: "center", gap: 6, background: "#FEF3C7", color: "#92400E", border: "1px solid #FCD34D", borderRadius: 8, padding: "10px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              📋 붙여넣기
              <span style={{ fontSize: 11, fontWeight: 400, opacity: 0.8 }}>({clipboardCase.business_name.length > 8 ? clipboardCase.business_name.slice(0, 8) + "…" : clipboardCase.business_name})</span>
              <span onClick={function(e) { e.stopPropagation(); setClipboardCase(null); try { sessionStorage.removeItem("agencyClipboard"); } catch (err) {} }}
                style={{ marginLeft: 4, color: "#92400E", opacity: 0.6, fontSize: 14, lineHeight: 1 }} title="클립보드 비우기">×</span>
            </button>
          )}
          <button onClick={function() { setShowTrash(true); }}
            style={{ display: "flex", alignItems: "center", gap: 6, background: "#fff", color: "#888", border: "1px solid #E8E5E0", borderRadius: 8, padding: "8px 14px", fontSize: 12, cursor: "pointer" }}>
            🗑️ 휴지통{trashedCases.length > 0 ? " (" + trashedCases.length + ")" : ""}
          </button>
          <button onClick={function() { fetchCases(); fetchCompanies(); }}
            style={{ display: "flex", alignItems: "center", gap: 6, background: "#fff", color: "#555", border: "1px solid #E8E5E0", borderRadius: 8, padding: "8px 14px", fontSize: 12, cursor: "pointer" }}>
            <Icon name="refresh" size={13} color="#555" /> 새로고침
          </button>
        </div>
      </div>

      {/* 기관 탭 */}
      <div style={{ display: "flex", gap: 6, marginBottom: 18, flexWrap: "wrap" }}>
        {AGENCY_GROUPS.map(function(g) {
          var isActive = activeGroup === g.id;
          return (
            <div key={g.id} onClick={function() { setActiveGroup(g.id); setEditingId(null); setFilterAssignee([]); }}
              style={{ padding: "8px 16px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: isActive ? 700 : 400,
                background: isActive ? g.color : "#fff", color: isActive ? "#fff" : "#555",
                border: isActive ? "none" : "1px solid #E8E5E0", transition: "all 0.15s" }}>
              {g.label}
            </div>
          );
        })}
      </div>

      {/* 월 탭 + 전체 */}
      <div style={{ display: "flex", gap: 4, marginBottom: 18, flexWrap: "wrap" }}>
        {[1,2,3,4,5,6,7,8,9,10,11,12].map(function(m) {
          var hasData = monthsWithData.has(m);
          var isActive = Number(activeMonth) === m;
          return (
            <div key={m} onClick={function() { setActiveMonth(m); setEditingId(null); setFilterAssignee([]); setStatusFilter("all"); }}
              style={{ padding: "6px 14px", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: isActive ? 700 : 400,
                background: isActive ? groupColor : hasData ? "#fff" : "#F7F6F3",
                color: isActive ? "#fff" : hasData ? "#333" : "#CCC",
                border: isActive ? "none" : hasData ? "1px solid #E8E5E0" : "1px solid #EDEBE8" }}>
              {m}월{hasData && !isActive ? " ●" : ""}
            </div>
          );
        })}
        {/* 전체 월 보기 */}
        <div onClick={function() { setActiveMonth("all"); setEditingId(null); setFilterAssignee([]); setStatusFilter("all"); }}
          style={{ padding: "6px 14px", borderRadius: 6, cursor: "pointer", fontSize: 12,
            fontWeight: activeMonth === "all" ? 700 : 600,
            background: activeMonth === "all" ? groupColor : "#1A1917",
            color: "#fff",
            border: "none",
            marginLeft: 8 }}>
          📅 전체
        </div>
      </div>

      {/* 요약 카드 (클릭으로 필터링) */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "총 진행", value: summary.total, color: "#1A1917", key: "all" },
          { label: "승인/약정", value: summary.approved, color: "#047857", key: "approved" },
          { label: "진행중", value: summary.inProgress, color: "#4338CA", key: "inProgress" },
          { label: "반려 (기한주의)", value: summary.returned, color: "#B45309", key: "returned" },
          { label: "부결", value: summary.rejected, color: "#DC2626", key: "rejected" },
        ].map(function(s) {
          var isActive = statusFilter === s.key;
          return (
            <div key={s.label} onClick={function() { setStatusFilter(function(prev) { return prev === s.key ? "all" : s.key; }); }}
              style={{ background: isActive ? s.color : "#fff", borderRadius: 10, padding: "16px 20px",
                border: isActive ? "2px solid " + s.color : "1px solid #E8E5E0",
                cursor: "pointer", transition: "all 0.15s",
                boxShadow: isActive ? "0 2px 8px rgba(0,0,0,0.12)" : "none" }}
              onMouseEnter={function(e) { if (!isActive) e.currentTarget.style.background = "#FAFAFA"; }}
              onMouseLeave={function(e) { if (!isActive) e.currentTarget.style.background = "#fff"; }}>
              <div style={{ fontSize: 11, color: isActive ? "rgba(255,255,255,0.85)" : "#888", marginBottom: 6, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span>{s.label}</span>
                {isActive && <span style={{ fontSize: 9, opacity: 0.85 }}>✓ 필터 중</span>}
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: isActive ? "#fff" : s.color }}>{s.value}건</div>
            </div>
          );
        })}
      </div>

      {/* 상태별 모아보기 (5그룹: 진행중·대기·승인·완료·부결 → 재신청 후보 종합용) */}
      {(function() {
        var base = cases.filter(function(c) {
          if (c.agency_group !== activeGroup) return false;
          if (activeMonth !== "all" && Number(c.month) !== Number(activeMonth)) return false;
          if (Number(c.year) !== currentYear) return false;
          if (c.deleted_at) return false;
          if (filterAssignee.length > 0 && !filterAssignee.some(function(n) { return (c.assignee || "").split(",").map(function(x) { return x.trim(); }).includes(n); })) return false;
          return true;
        });
        if (base.length === 0) return null;
        var counts = { inProgress: 0, waiting: 0, approved: 0, completed: 0, returned: 0, rejected: 0, other: 0 };
        base.forEach(function(c) { counts[groupOf(c.status)] = (counts[groupOf(c.status)] || 0) + 1; });
        var groups = [
          { key: "inProgress", label: "진행중", bg: "#EEF2FF", text: "#4338CA" },
          { key: "waiting", label: "대기", bg: "#FEF3C7", text: "#B45309" },
          { key: "approved", label: "승인", bg: "#DCFCE7", text: "#15803D" },
          { key: "completed", label: "완료", bg: "#D1FAE5", text: "#047857" },
          { key: "returned", label: "반려", bg: "#FEF0D9", text: "#B45309" },
          { key: "rejected", label: "부결", bg: "#FEE2E2", text: "#DC2626" },
        ];
        return (
          <div style={{ display: "flex", gap: 5, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontSize: 11, color: "#888", marginRight: 2, fontWeight: 600 }}>상태별 모아보기:</span>
            {groups.map(function(g) {
              var active = statusFilter === g.key;
              return <div key={g.key} onClick={function() { setStatusFilter(function(p) { return p === g.key ? "all" : g.key; }); }}
                style={{ padding: "5px 13px", borderRadius: 99, cursor: "pointer", fontSize: 12, fontWeight: 600,
                  background: active ? g.text : g.bg, color: active ? "#fff" : g.text,
                  border: "1px solid " + (active ? g.text : "transparent") }}>
                {g.label} {counts[g.key] || 0}
              </div>;
            })}
            {statusFilter !== "all" && (
              <div onClick={function() { setStatusFilter("all"); }}
                style={{ padding: "5px 11px", borderRadius: 99, cursor: "pointer", fontSize: 12, color: "#888", border: "1px solid #E8E5E0" }}>
                ✕ 전체
              </div>
            )}
          </div>
        );
      })()}

      {/* 담당자 필터 (다중 선택 - 여러 명 중 한 명이라도 담당이면 표시) */}
      {assigneesInGroup.length > 0 && (
        <div style={{ display: "flex", gap: 5, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
          <div onClick={function() { setFilterAssignee([]); }}
            style={{ padding: "5px 13px", borderRadius: 99, cursor: "pointer", fontSize: 12, fontWeight: filterAssignee.length === 0 ? 700 : 400,
              background: filterAssignee.length === 0 ? "#1A1917" : "#fff", color: filterAssignee.length === 0 ? "#fff" : "#666",
              border: filterAssignee.length === 0 ? "none" : "1px solid #E8E5E0" }}>전체</div>
          {assigneesInGroup.map(function(a) {
            var active = filterAssignee.includes(a);
            return (
              <div key={a} onClick={function() { setFilterAssignee(function(prev) { return prev.includes(a) ? prev.filter(function(x) { return x !== a; }) : prev.concat([a]); }); }}
                style={{ padding: "5px 13px", borderRadius: 99, cursor: "pointer", fontSize: 12, fontWeight: active ? 700 : 400,
                  background: active ? "#4338CA" : "#fff", color: active ? "#fff" : "#666",
                  border: active ? "none" : "1px solid #E8E5E0" }}>
                {active ? "✓ " : ""}{a}
              </div>
            );
          })}
          {filterAssignee.length > 0 && <span style={{ fontSize: 11, color: "#888" }}>{filterAssignee.length}명 선택 (한 명이라도 담당이면 표시)</span>}
        </div>
      )}

      {/* 테이블 */}
      {filtered.length === 0 ? (
        <div style={{ background: "#fff", borderRadius: 10, padding: "60px 20px", textAlign: "center", color: "#AAA", fontSize: 14, border: "1px solid #E8E5E0" }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>📋</div>
          {activeGroup} {activeMonth}월 데이터가 없습니다<br />
          <span style={{ fontSize: 12 }}>기업 목록에서 기관과 신청월을 설정하고 "기관별현황에 등록" 버튼을 눌러주세요</span>
        </div>
      ) : (
        <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #E8E5E0", overflow: "hidden" }}>
          <div style={{ maxHeight: "calc(100vh - 280px)", overflowY: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, tableLayout: "fixed" }}>
            <thead>
              <tr style={{ background: "#F7F6F3", borderBottom: "2px solid #E8E5E0", position: "sticky", top: 0, zIndex: 2 }}>
                <th style={headerCellStyle("num", { width: colWidths.num })}>#<ResizeHandle colKey="num" /></th>
                <th style={headerCellStyle("business_name")}>사업자명<ResizeHandle colKey="business_name" /></th>
                {activeGroup === "중소벤처기업진흥공단" && (
                  <th style={headerCellStyle("priority", { color: "#7C3AED", textAlign: "center" })}>우선도 점수<ResizeHandle colKey="priority" /></th>
                )}
                <th style={headerCellStyle("representative")}>대표자<ResizeHandle colKey="representative" /></th>
                <th style={headerCellStyle("assignee")}>담당자<ResizeHandle colKey="assignee" /></th>
                <th style={headerCellStyle("amount")}>금액<ResizeHandle colKey="amount" /></th>
                {activeGroup === "중소벤처기업진흥공단" && (
                  <th style={headerCellStyle("priority", { textAlign: "center", color: "#7C3AED", width: 70, minWidth: 70, maxWidth: 70 })}>우선도</th>
                )}
                {(activeGroup === "중소벤처기업진흥공단" || activeGroup === "소상공인시장진흥공단") && (
                  <th style={headerCellStyle("product")}>신청상품<ResizeHandle colKey="product" /></th>
                )}
                <th style={headerCellStyle("industry")}>업종<ResizeHandle colKey="industry" /></th>
                <th style={headerCellStyle("region")}>지역<ResizeHandle colKey="region" /></th>
                {activeGroup === "구조혁신&사업전환" && (
                  <th style={headerCellStyle("contact", { color: "#0369A1" })}>📞 연락처<ResizeHandle colKey="contact" /></th>
                )}
                <th style={headerCellStyle("status", { color: activeGroup === "구조혁신&사업전환" ? "#BE123C" : "#888" })}>상태<ResizeHandle colKey="status" /></th>
                <th style={headerCellStyle("dup", { textAlign: "center" })}>중복<ResizeHandle colKey="dup" /></th>
                {activeGroup === "구조혁신&사업전환" && (
                  <th style={headerCellStyle("docs", { color: "#0F6E56", background: "#E1F5EE" })}>전달 및 완료 서류<ResizeHandle colKey="docs" /></th>
                )}
                <th style={headerCellStyle("credit")}>신용점수<ResizeHandle colKey="credit" /></th>
                <th style={headerCellStyle("notes")}>비고<ResizeHandle colKey="notes" /></th>
                <th style={headerCellStyle("action", { textAlign: "center" })}>작업<ResizeHandle colKey="action" /></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(function(row, idx) {
                var isEditing = editingId === row.id;
                var sc = STATUS_COLORS_MAP[row.status] || { bg: "#F7F6F3", text: "#888" };
                return (
                  <tr key={row.id} style={{ borderBottom: "1px solid #F0EDE8", background: selectedCase && selectedCase.id === row.id ? "#F0FDF4" : isEditing ? "#FAFFF7" : "transparent", cursor: "pointer" }} onClick={function() { if (!isEditing) setSelectedCase(row); }}>
                    <td style={{ padding: "10px 12px", color: "#AAA", fontSize: 12 }}>{idx + 1}</td>
                    <td style={{ padding: "10px 12px" }}>
                      {isEditing
                        ? <input value={editData.business_name || ""} onChange={function(e) { var v = e.target.value; setEditData(function(p) { return Object.assign({}, p, { business_name: v }); }); }}
                            style={{ padding: "4px 8px", border: "1px solid #86EFAC", borderRadius: 6, fontSize: 13, width: "100%", boxSizing: "border-box" }} />
                        : (
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ fontWeight: 600 }}>{row.business_name || "-"}</span>
                            {activeGroup === "중소벤처기업진흥공단" && (
                              <button onClick={function(e) { e.stopPropagation(); openPriority(row); }}
                                style={{ fontSize: 10, padding: "2px 7px", background: "#F3F0FF", color: "#7C3AED", border: "1px solid #DDD6FE", borderRadius: 4, cursor: "pointer", fontWeight: 600, whiteSpace: "nowrap" }}>
                                📋 우선도
                              </button>
                            )}
                          </div>
                        )}
                    </td>
                    {activeGroup === "중소벤처기업진흥공단" && (
                      <td style={{ padding: "10px 12px", textAlign: "center" }} onClick={function(e) { e.stopPropagation(); openPriority(row); }}>
                        {(function() {
                          var ps = calcPriorityScore(row.priority_checks);
                          if (ps.checked === 0) return <span style={{ fontSize: 11, color: "#888" }}>미평가</span>;
                          return (
                            <span title={ps.checked + "개 항목 · " + ps.qualified + "개 카테고리 해당"}
                              style={{ display: "inline-block", minWidth: 40, fontSize: 12, fontWeight: 800, padding: "3px 8px", borderRadius: 99, color: priorityScoreColor(ps.score), background: priorityScoreBg(ps.score), cursor: "pointer" }}>
                              {ps.score}
                            </span>
                          );
                        })()}
                      </td>
                    )}
                    <td style={{ padding: "10px 12px" }}>
                      {isEditing
                        ? <input value={editData.representative || ""} onChange={function(e) { var v = e.target.value; setEditData(function(p) { return Object.assign({}, p, { representative: v }); }); }}
                            style={{ padding: "4px 8px", border: "1px solid #86EFAC", borderRadius: 6, fontSize: 12, width: 70, boxSizing: "border-box" }} />
                        : <span style={{ fontSize: 12, color: "#555" }}>{row.representative || "-"}</span>}
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      {isEditing
                        ? <select value={editData.assignee || ""} onChange={function(e) { var v = e.target.value; setEditData(function(p) { return Object.assign({}, p, { assignee: v }); }); }}
                            style={{ padding: "4px 6px", border: "1px solid #86EFAC", borderRadius: 6, fontSize: 12 }}>
                            <option value="">선택</option>
                            {ASSIGNEES.map(function(a) { return <option key={a} value={a}>{a}</option>; })}
                          </select>
                        : <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 99, background: "#EEF2FF", color: "#4338CA", fontWeight: 600 }}>{row.assignee || "-"}</span>}
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      {isEditing
                        ? <input value={editData.request_amount || ""} onChange={function(e) { var v = e.target.value; setEditData(function(p) { return Object.assign({}, p, { request_amount: v }); }); }}
                            style={{ padding: "4px 8px", border: "1px solid #86EFAC", borderRadius: 6, fontSize: 12, width: 70, boxSizing: "border-box" }} />
                        : <span style={{ fontSize: 12, color: "#555" }}>{row.request_amount || "-"}</span>}
                    </td>
                    {activeGroup === "중소벤처기업진흥공단" && (
                      <td style={{ padding: "10px 12px", textAlign: "center" }} onClick={function(e) { e.stopPropagation(); openPriority(row); }} title="클릭하면 배점 입력">
                        {(function() {
                          var s = calcJunginggongScore(row.priority_checks);
                          if (s == null) return <span style={{ fontSize: 12, color: "#CCC" }}>-</span>;
                          return <span style={{ fontSize: 13, fontWeight: 800, color: priorityScoreColor(s), cursor: "pointer" }}>{s}</span>;
                        })()}
                      </td>
                    )}
                    {(activeGroup === "중소벤처기업진흥공단" || activeGroup === "소상공인시장진흥공단") && (
                      <td style={{ padding: "10px 12px" }}>
                        {isEditing ? (
                          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                            <select value={editData.fund_product || ""} onChange={function(e) { var v = e.target.value; setEditData(function(p) { return Object.assign({}, p, { fund_product: v }); }); }}
                              style={{ padding: "4px 6px", border: "1px solid #86EFAC", borderRadius: 6, fontSize: 11, maxWidth: 160 }}>
                              <option value="">상품 선택</option>
                              {(activeGroup === "중소벤처기업진흥공단" ? JUNGINGONG_PRODUCTS : SOJINGONG_PRODUCTS).map(function(p) { return <option key={p} value={p}>{p}</option>; })}
                            </select>
                            <input value={editData.fund_product || ""} placeholder="직접 입력" onChange={function(e) { var v = e.target.value; setEditData(function(p) { return Object.assign({}, p, { fund_product: v }); }); }}
                              style={{ padding: "4px 6px", border: "1px solid #86EFAC", borderRadius: 6, fontSize: 11, maxWidth: 160, boxSizing: "border-box" }} />
                          </div>
                        ) : row.fund_product ? (function() {
                            var col = getProductColor(row.fund_product);
                            return <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 6, fontWeight: 600, background: col.bg, color: col.text, whiteSpace: "nowrap" }}>{row.fund_product}</span>;
                          })() : <span style={{ fontSize: 11, color: "#888" }}>-</span>
                        }
                      </td>
                    )}
                    <td style={{ padding: "10px 12px" }}>
                      {(function() {
                        var matchedCo = companiesList.find(function(c) { return c.name === row.business_name; });
                        var ind = matchedCo ? matchedCo.industry : null;
                        return <span style={{ fontSize: 11, padding: ind ? "2px 7px" : 0, borderRadius: 99, background: ind ? "#EEF2FF" : "transparent", color: ind ? "#4338CA" : "#CCC", fontWeight: ind ? 600 : 400 }}>{ind || "-"}</span>;
                      })()}
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      {isEditing
                        ? <input value={editData.region || ""} onChange={function(e) { var v = e.target.value; setEditData(function(p) { return Object.assign({}, p, { region: v }); }); }}
                            style={{ padding: "4px 8px", border: "1px solid #86EFAC", borderRadius: 6, fontSize: 12, width: 80, boxSizing: "border-box" }} />
                        : (
                          <div>
                            {row.region ? (function() {
                              var rc = getRegionColor(row.region);
                              return <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 6, fontWeight: 600, background: rc.bg, color: rc.text, whiteSpace: "nowrap", display: "inline-block" }}>{row.region}</span>;
                            })() : <span style={{ fontSize: 12, color: "#888" }}>-</span>}
                            {(activeGroup === "중소벤처기업진흥공단" || activeGroup === "구조혁신&사업전환") && row.region && findJungingongBranch(row.region) && (
                              <div style={{ fontSize: 10, color: "#7C3AED", marginTop: 2, fontWeight: 600 }}>{findJungingongBranch(row.region)}</div>
                            )}
                          </div>
                        )}
                    </td>
                    {activeGroup === "구조혁신&사업전환" && (
                      <td style={{ padding: "10px 12px", verticalAlign: "top" }}>
                        {(function() {
                          // 지역본부 후보 추출 (findJungingongBranch가 쉼표로 묶어서 반환)
                          var branchesStr = findJungingongBranch(row.region);
                          var branches = (branchesStr || "").split(",").map(function(s) { return s.trim(); }).filter(Boolean);
                          // 이 업체에서 제외된 지역본부 처리
                          var excluded = row.contact_phones || {};
                          branches = branches.filter(function(b) { return !excluded["_excluded_" + b]; });
                          if (branches.length === 0) {
                            return <span style={{ fontSize: 11, color: "#888" }}>-</span>;
                          }
                          return (
                            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                              {branches.map(function(branch) {
                                // 중앙 매핑(contactMap)에서 연락처 가져옴
                                var phoneVal = contactMap[branch] !== undefined ? contactMap[branch] : "";
                                var phoneKey = row.id + "_" + branch;
                                var isEditingPhone = editingPhoneKey === phoneKey;
                                return (
                                  <div key={branch} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11 }}>
                                    <span style={{ color: "#7C3AED", fontWeight: 600, whiteSpace: "nowrap", flexShrink: 0 }}>{branch}</span>
                                    {isEditingPhone ? (
                                      <input type="text"
                                        value={phoneVal}
                                        placeholder="연락처"
                                        autoFocus
                                        onChange={function(e) {
                                          // 입력 즉시 contactMap 업데이트 (UI 반영)
                                          var v = e.target.value;
                                          setContactMap(function(prev) { return Object.assign({}, prev, { [branch]: v }); });
                                        }}
                                        onBlur={function(e) {
                                          // 포커스 빠지면 DB 저장 (모든 업체에 자동 반영) + 텍스트로 복귀
                                          updateBranchContact(branch, e.target.value);
                                          setEditingPhoneKey(null);
                                        }}
                                        onKeyDown={function(e) {
                                          if (e.key === "Enter") { e.target.blur(); }
                                          if (e.key === "Escape") { setEditingPhoneKey(null); }
                                        }}
                                        style={{ flex: 1, minWidth: 0, padding: "2px 6px", border: "1px solid #86EFAC", borderRadius: 4, fontSize: 11, background: "#fff", color: "#1A1917" }} />
                                    ) : (
                                      <span onClick={function() { setEditingPhoneKey(phoneKey); }}
                                        title="클릭하면 연락처 수정"
                                        style={{ flex: 1, minWidth: 0, cursor: "pointer", padding: "2px 6px", borderRadius: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: phoneVal ? "#1A1917" : "#CCC" }}
                                        onMouseEnter={function(e) { e.currentTarget.style.background = "#F0FDF4"; }}
                                        onMouseLeave={function(e) { e.currentTarget.style.background = "transparent"; }}>
                                        {phoneVal || "연락처 입력"}
                                      </span>
                                    )}
                                    <button onClick={async function() {
                                      // X 클릭 → 이 업체에서만 이 지역본부 제거 (중앙 매핑은 그대로)
                                      if (!confirm("'" + branch + "' 지역본부를 이 업체에서 제거할까요?\n(다른 업체에는 영향 없음)")) return;
                                      var newPhones = Object.assign({}, excluded);
                                      newPhones["_excluded_" + branch] = "1";
                                      var r = await supabase.from("agency_cases").update({ contact_phones: newPhones, updated_at: new Date().toISOString() }).eq("id", row.id);
                                      if (r.error) { alert("저장 실패: " + r.error.message); return; }
                                      setCases(function(prev) {
                                        return prev.map(function(rr) { return rr.id === row.id ? Object.assign({}, rr, { contact_phones: newPhones }) : rr; });
                                      });
                                    }}
                                      title="이 업체에서 이 지역본부 제거"
                                      style={{ background: "none", border: "none", cursor: "pointer", color: "#AAA", fontSize: 12, padding: "0 4px", flexShrink: 0 }}>✕</button>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })()}
                      </td>
                    )}
                    <td style={{ padding: "10px 12px" }}>
                      {isEditing
                        ? <select value={editData.status || ""} onChange={function(e) { var v = e.target.value; setEditData(function(p) { return Object.assign({}, p, { status: v }); }); }}
                            style={{ padding: "4px 6px", border: "1px solid #86EFAC", borderRadius: 6, fontSize: 12 }}>
                            {STATUS_OPTIONS.map(function(s) { return <option key={s} value={s}>{s}</option>; })}
                          </select>
                        : (function() {
                            var gsc = activeGroup === "구조혁신&사업전환"
                              ? (GUJOHYEOK_STATUS_COLORS[row.status] || { bg: "#F7F6F3", text: "#888" })
                              : sc;
                            var isApproved = row.status === "사업전환 승인";
                            return (
                              <span style={{ fontSize: 11, padding: isApproved ? "4px 10px" : "3px 8px", borderRadius: 99, background: gsc.bg, color: gsc.text, fontWeight: 600, border: isApproved ? "1.5px solid #0F6E56" : "none", display: "inline-flex", alignItems: "center", gap: 3 }}>
                                {isApproved && "✓ "}{row.status || "-"}
                              </span>
                            );
                          })()}
                    </td>
                    <td style={{ padding: "10px 12px", textAlign: "center" }}>
                      {(function() {
                        var cnt = isDupRow(row);
                        if (!cnt) return null;
                        return <span title={"같은 사업장(사업자명+대표자명)이 총 " + cnt + "건 등록됨"} style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 99, background: "#FEE2E2", color: "#DC2626", whiteSpace: "nowrap" }}>중복</span>;
                      })()}
                    </td>
                    {activeGroup === "구조혁신&사업전환" && (
                      <td style={{ padding: "10px 12px" }}>
                        {isEditing ? (
                          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                            {DELIVERED_DOCS_OPTIONS.map(function(doc) {
                              var checked = Array.isArray(editData.delivered_docs) && editData.delivered_docs.indexOf(doc) >= 0;
                              return (
                                <label key={doc} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, cursor: "pointer" }}>
                                  <input type="checkbox" checked={checked} onChange={function() {
                                    var cur = Array.isArray(editData.delivered_docs) ? editData.delivered_docs.slice() : [];
                                    if (checked) { cur = cur.filter(function(d) { return d !== doc; }); }
                                    else { cur.push(doc); }
                                    setEditData(function(p) { return Object.assign({}, p, { delivered_docs: cur }); });
                                  }} style={{ margin: 0 }} />
                                  {doc}
                                </label>
                              );
                            })}
                          </div>
                        ) : (
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
                            {Array.isArray(row.delivered_docs) && row.delivered_docs.length > 0
                              ? row.delivered_docs.map(function(doc) {
                                  return <span key={doc} style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: "#EAF3DE", color: "#173404" }}>{doc}</span>;
                                })
                              : <span style={{ fontSize: 11, color: "#888" }}>-</span>}
                          </div>
                        )}
                      </td>
                    )}
                    <td style={{ padding: "10px 12px" }}>
                      {(function() {
                        var matchedCo = companiesList.find(function(c) { return c.name === row.business_name; });
                        if (!matchedCo || (!matchedCo.credit_score_kcb && !matchedCo.credit_score_nice)) return <span style={{ fontSize: 12, color: "#888" }}>-</span>;
                        return <span style={{ fontSize: 12, color: "#555", fontWeight: 600 }}>{(matchedCo.credit_score_kcb || "-") + " / " + (matchedCo.credit_score_nice || "-")}</span>;
                      })()}
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      {isEditing
                        ? <input value={editData.notes || ""} onChange={function(e) { var v = e.target.value; setEditData(function(p) { return Object.assign({}, p, { notes: v }); }); }}
                            style={{ padding: "4px 8px", border: "1px solid #86EFAC", borderRadius: 6, fontSize: 12, width: "100%", boxSizing: "border-box" }} />
                        : <span style={{ fontSize: 12, color: "#777" }}>{row.notes || "-"}</span>}
                    </td>
                    <td style={{ padding: "10px 12px", textAlign: "center" }}>
                      {isEditing ? (
                        <div style={{ display: "flex", gap: 4, justifyContent: "center" }}>
                          <button onClick={saveEdit} style={{ background: "#15803D", color: "#fff", border: "none", borderRadius: 6, padding: "5px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>저장</button>
                          <button onClick={function() { setEditingId(null); setEditData({}); }} style={{ background: "#fff", color: "#888", border: "1px solid #E8E5E0", borderRadius: 6, padding: "5px 8px", fontSize: 11, cursor: "pointer" }}>취소</button>
                        </div>
                      ) : (
                        <div style={{ display: "flex", gap: 2, justifyContent: "center", alignItems: "center" }}>
                          <button onClick={function(e) { e.stopPropagation(); moveCaseOrder(row.id, -1); }} title="위로 이동"
                            style={{ background: "none", border: "1px solid #E8E5E0", borderRadius: 4, cursor: "pointer", padding: "2px 5px", fontSize: 10, color: "#888", lineHeight: 1 }}>▲</button>
                          <button onClick={function(e) { e.stopPropagation(); moveCaseOrder(row.id, +1); }} title="아래로 이동"
                            style={{ background: "none", border: "1px solid #E8E5E0", borderRadius: 4, cursor: "pointer", padding: "2px 5px", fontSize: 10, color: "#888", lineHeight: 1 }}>▼</button>
                          <button onClick={function(e) { e.stopPropagation(); setEditingId(row.id); setEditData(Object.assign({}, row)); }} title="수정"
                            style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}><Icon name="edit" size={14} color="#888" /></button>
                          <button onClick={function(e) { e.stopPropagation(); deleteCase(row.id); }} title="삭제"
                            style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}><Icon name="x" size={14} color="#CCC" /></button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        </div>
      )}
      {showPriorityModal && priorityTarget && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 1100, display: "flex", alignItems: "center", justifyContent: "center" }}
          onMouseDown={function(e) { if (e.target === e.currentTarget) setShowPriorityModal(false); }}>
          <div style={{ background: "#fff", borderRadius: 16, width: 720, maxHeight: "88vh", overflowY: "auto", boxShadow: "0 24px 80px rgba(0,0,0,0.25)" }}>
            <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #E8E5E0", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, background: "#fff", zIndex: 1 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>📋 정책우선도 체크리스트</h2>
                <div style={{ fontSize: 12, color: "#888", marginTop: 3 }}>{priorityTarget.business_name} · 중소벤처기업진흥공단</div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={savePriorityChecks} style={{ background: "#7C3AED", color: "#fff", border: "none", borderRadius: 8, padding: "8px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>저장</button>
                <button onClick={function() { setShowPriorityModal(false); }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "#888" }}>✕</button>
              </div>
            </div>
            <div style={{ padding: "20px 24px" }}>
              {(function() {
                var totalItems = 0;
                var checkedItems = 0;
                PRIORITY_CHECKLIST.forEach(function(cat) { cat.items.forEach(function(item) { totalItems++; if (priorityChecks[item]) checkedItems++; }); });
                return (
                  <div style={{ background: "#F3F0FF", borderRadius: 10, padding: "12px 16px", marginBottom: 20, display: "flex", gap: 20, alignItems: "center" }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#7C3AED" }}>총 {totalItems}개 항목 중 <span style={{ fontSize: 18 }}>{checkedItems}</span>개 해당</div>
                    <div style={{ flex: 1, background: "#DDD6FE", borderRadius: 99, height: 8, overflow: "hidden" }}>
                      <div style={{ width: (checkedItems / totalItems * 100) + "%", background: "#7C3AED", height: "100%", borderRadius: 99, transition: "width 0.3s" }} />
                    </div>
                  </div>
                );
              })()}
              {PRIORITY_CHECKLIST.map(function(cat) {
                var catChecked = cat.items.filter(function(item) { return priorityChecks[item]; }).length;
                return (
                  <div key={cat.category} style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#555", marginBottom: 8, display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ background: catChecked > 0 ? "#EDE9FE" : "#F7F6F3", color: catChecked > 0 ? "#7C3AED" : "#AAA", padding: "2px 10px", borderRadius: 6 }}>{cat.category}</span>
                      <span style={{ fontSize: 11, color: "#AAA" }}>{catChecked}/{cat.items.length}</span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                      {cat.items.map(function(item) {
                        var checked = !!priorityChecks[item];
                        return (
                          <label key={item} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 8, background: checked ? "#F3F0FF" : "#FAFAFA", border: "1px solid " + (checked ? "#DDD6FE" : "#EDEBE8"), cursor: "pointer" }}>
                            <input type="checkbox" checked={checked} onChange={function(e) { var v = e.target.checked; setPriorityChecks(function(p) { var n = Object.assign({}, p); if (v) n[item] = true; else delete n[item]; return n; }); }} style={{ width: 15, height: 15, cursor: "pointer", accentColor: "#7C3AED" }} />
                            <span style={{ fontSize: 12, color: checked ? "#5B21B6" : "#555", fontWeight: checked ? 600 : 400, lineHeight: 1.4 }}>{item}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
              {/* ── 배점표 입력 섹션 (기존 체크리스트와 별개 · 우선도 점수 자동계산) ── */}
              <div style={{ marginTop: 10, paddingTop: 18, borderTop: "2px dashed #DDD6FE" }}>
                {(function() {
                  var score = calcJunginggongScore(priorityChecks);
                  var sc = score == null ? 0 : score;
                  var col = priorityScoreColor(sc);
                  return (
                    <div style={{ display: "flex", alignItems: "center", gap: 14, background: "#F5F3FF", borderRadius: 10, padding: "12px 16px", marginBottom: 8 }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: "#6D28D9", whiteSpace: "nowrap" }}>🎯 정책우선도 점수</div>
                      <div style={{ fontSize: 22, fontWeight: 800, color: col, whiteSpace: "nowrap" }}>{score == null ? "-" : sc}<span style={{ fontSize: 12, color: "#999" }}>/100</span></div>
                      <div style={{ flex: 1, background: "#DDD6FE", borderRadius: 99, height: 8, overflow: "hidden" }}>
                        <div style={{ width: Math.min(100, sc) + "%", background: col, height: "100%", borderRadius: 99, transition: "width 0.2s" }} />
                      </div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: col, whiteSpace: "nowrap" }}>{sc >= 70 ? "우수" : sc >= 50 ? "보통" : "미흡"}</div>
                    </div>
                  );
                })()}
                <div style={{ fontSize: 11, color: "#999", marginBottom: 14 }}>⑤ 정책우대(5점)는 위 '정책우대' 카테고리 체크로 자동 반영됩니다.</div>
                {JUNGINGONG_SCORE_FORM.map(function(cat) {
                  return (
                    <div key={cat.cat} style={{ marginBottom: 14 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#6D28D9", marginBottom: 8 }}>{cat.cat}</div>
                      {cat.items.map(function(it) {
                        var cur = priorityChecks[it.key];
                        return (
                          <div key={it.key} style={{ marginBottom: 8 }}>
                            <div style={{ fontSize: 12, color: "#555", marginBottom: 5 }}>{it.label}</div>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                              {it.opts.map(function(o) {
                                var sel = cur !== undefined && cur !== null && Number(cur) === o.p;
                                return (
                                  <button key={o.t} onClick={function() { setPriorityChecks(function(p) { var n = Object.assign({}, p); n[it.key] = o.p; return n; }); }}
                                    style={{ fontSize: 11, fontWeight: sel ? 700 : 500, padding: "5px 11px", borderRadius: 99, cursor: "pointer", background: sel ? "#7C3AED" : "#fff", color: sel ? "#fff" : "#666", border: "1px solid " + (sel ? "#7C3AED" : "#E8E5E0") }}>
                                    {o.t} <span style={{ opacity: 0.7 }}>{o.p}점</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 휴지통 모달 */}
      {showTrash && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}
          onMouseDown={function(e) { if (e.target === e.currentTarget) setShowTrash(false); }}>
          <div style={{ background: "#fff", borderRadius: 14, width: 600, maxHeight: "80vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #E8E5E0", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, background: "#fff" }}>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>🗑️ 휴지통 ({trashedCases.length}건)</h2>
              <button onClick={function() { setShowTrash(false); }} style={{ background: "none", border: "none", cursor: "pointer" }}><Icon name="x" size={18} color="#888" /></button>
            </div>
            <div style={{ padding: "16px 24px" }}>
              {trashedCases.length === 0 ? (
                <div style={{ padding: "40px 0", textAlign: "center", color: "#888", fontSize: 13 }}>휴지통이 비어 있습니다</div>
              ) : (
                trashedCases.map(function(row) {
                  return (
                    <div key={row.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid #F0EDE8" }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700 }}>{row.business_name}</div>
                        <div style={{ fontSize: 11, color: "#AAA", marginTop: 2 }}>{row.agency_group} · {row.month}월 · {row.assignee}</div>
                      </div>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={function() { restoreCase(row.id); }}
                          style={{ background: "#EEF2FF", color: "#4338CA", border: "none", borderRadius: 6, padding: "5px 12px", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>복구</button>
                        <button onClick={function() { permanentDelete(row.id); }}
                          style={{ background: "#FEF2F2", color: "#DC2626", border: "none", borderRadius: 6, padding: "5px 12px", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>영구삭제</button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* 신규 진행건 추가 모달 (자동완성 포함) */}
      {showAddCase && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}
          onMouseDown={function(e) { if (e.target === e.currentTarget) { setShowAddCase(false); setCompanySuggestions([]); } }}>
          <div style={{ background: "#fff", borderRadius: 14, width: 520, maxHeight: "85vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #E8E5E0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>신규 진행건 추가 ({activeGroup} {activeMonth}월)</h2>
              <button onClick={function() { setShowAddCase(false); setCompanySuggestions([]); }} style={{ background: "none", border: "none", cursor: "pointer" }}>
                <Icon name="x" size={18} color="#888" />
              </button>
            </div>
            <div style={{ padding: "20px 24px" }}>
              {/* 사업자명 + 자동완성 */}
              <div style={{ marginBottom: 13, position: "relative" }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#555", display: "block", marginBottom: 5 }}>
                  사업자명 * <span style={{ color: "#4338CA", fontWeight: 400, marginLeft: 6 }}>(기업 목록 {companiesList.length}개 로드됨 — 입력 시 자동완성)</span>
                </label>
                <input value={newCase.business_name || ""} placeholder="사업자명 입력"
                  onChange={function(e) { onBusinessNameChange(e.target.value); }}
                  style={{ width: "100%", padding: "10px 13px", border: "1px solid #E8E5E0", borderRadius: 8, fontSize: 13, boxSizing: "border-box", outline: "none" }} />
                {companySuggestions.length > 0 && (
                  <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#fff", border: "1px solid #E8E5E0", borderRadius: 8, marginTop: 4, maxHeight: 240, overflowY: "auto", zIndex: 10, boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}>
                    {companySuggestions.map(function(co) {
                      return (
                        <div key={co.id} onClick={function() { selectCompany(co); }}
                          style={{ padding: "10px 13px", cursor: "pointer", borderBottom: "1px solid #F0EDE8", fontSize: 13 }}
                          onMouseEnter={function(e) { e.currentTarget.style.background = "#F7F6F3"; }}
                          onMouseLeave={function(e) { e.currentTarget.style.background = "#fff"; }}>
                          <div style={{ fontWeight: 700 }}>{co.name}</div>
                          <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>
                            {co.representative ? "대표: " + co.representative : ""}
                            {co.region ? " · " + co.region : ""}
                            {co.assignee ? " · 담당: " + co.assignee : ""}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              <div style={{ marginBottom: 13 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#555", display: "block", marginBottom: 5 }}>대표자명</label>
                <input value={newCase.representative || ""} onChange={function(e) { var v = e.target.value; setNewCase(function(p) { return Object.assign({}, p, { representative: v }); }); }}
                  style={{ width: "100%", padding: "10px 13px", border: "1px solid #E8E5E0", borderRadius: 8, fontSize: 13, boxSizing: "border-box", outline: "none" }} />
              </div>
              <div style={{ marginBottom: 13 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#555", display: "block", marginBottom: 5 }}>사업자등록번호</label>
                <input value={newCase.business_number || ""} onChange={function(e) { var v = e.target.value; setNewCase(function(p) { return Object.assign({}, p, { business_number: v }); }); }}
                  style={{ width: "100%", padding: "10px 13px", border: "1px solid #E8E5E0", borderRadius: 8, fontSize: 13, boxSizing: "border-box", outline: "none" }} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 13 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#555", display: "block", marginBottom: 5 }}>담당자</label>
                  <select value={newCase.assignee || ""} onChange={function(e) { var v = e.target.value; setNewCase(function(p) { return Object.assign({}, p, { assignee: v }); }); }}
                    style={{ width: "100%", padding: "10px 13px", border: "1px solid #E8E5E0", borderRadius: 8, fontSize: 13, background: "#fff" }}>
                    <option value="">선택</option>
                    {ASSIGNEES.map(function(a) { return <option key={a} value={a}>{a}</option>; })}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#555", display: "block", marginBottom: 5 }}>상태</label>
                  <select value={newCase.status || "시작 전"} onChange={function(e) { var v = e.target.value; setNewCase(function(p) { return Object.assign({}, p, { status: v }); }); }}
                    style={{ width: "100%", padding: "10px 13px", border: "1px solid #E8E5E0", borderRadius: 8, fontSize: 13, background: "#fff" }}>
                    {STATUS_OPTIONS.map(function(s) { return <option key={s} value={s}>{s}</option>; })}
                  </select>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 13 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#555", display: "block", marginBottom: 5 }}>신청금액</label>
                  <input value={newCase.request_amount || ""} placeholder="예: 1억, 5천만" onChange={function(e) { var v = e.target.value; setNewCase(function(p) { return Object.assign({}, p, { request_amount: v }); }); }}
                    style={{ width: "100%", padding: "10px 13px", border: "1px solid #E8E5E0", borderRadius: 8, fontSize: 13, boxSizing: "border-box", outline: "none" }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#555", display: "block", marginBottom: 5 }}>지역</label>
                  <input value={newCase.region || ""} placeholder="예: 서울_강남" onChange={function(e) { var v = e.target.value; setNewCase(function(p) { return Object.assign({}, p, { region: v }); }); }}
                    style={{ width: "100%", padding: "10px 13px", border: "1px solid #E8E5E0", borderRadius: 8, fontSize: 13, boxSizing: "border-box", outline: "none" }} />
                </div>
              </div>
              <div style={{ marginBottom: 13 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#555", display: "block", marginBottom: 5 }}>비고 / 메모</label>
                <textarea value={newCase.notes || ""} onChange={function(e) { var v = e.target.value; setNewCase(function(p) { return Object.assign({}, p, { notes: v }); }); }} rows={3}
                  style={{ width: "100%", padding: "10px 13px", border: "1px solid #E8E5E0", borderRadius: 8, fontSize: 13, resize: "vertical", boxSizing: "border-box", outline: "none" }} />
              </div>
              <button onClick={saveNewCase}
                style={{ width: "100%", padding: "13px", background: "#1A1917", color: "#F7F6F3", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: "pointer", marginTop: 6 }}>
                등록하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 기관별현황 사이드패널 */}
      {selectedCase && (
        <div style={{ position: "fixed", inset: 0, zIndex: 900 }}
          onMouseDown={function(e) { window.__panelMouseDownTarget = e.target; }}
          onClick={function(e) { if (window.__panelMouseDownTarget === e.target) setSelectedCase(null); window.__panelMouseDownTarget = null; }}>
          <div style={{ position: "absolute", top: 0, right: 0, width: 460, height: "100%", background: "#fff", boxShadow: "-4px 0 30px rgba(0,0,0,0.15)", overflowY: "auto" }}
            onClick={function(e) { e.stopPropagation(); }}
            onMouseDown={function(e) { e.stopPropagation(); }}>
            <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #E8E5E0", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, background: "#fff", zIndex: 1 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800 }}>{selectedCase.business_name}</div>
                <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>{activeGroup} · {selectedCase.assignee || "-"}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button onClick={function() {
                  var copyData = {
                    business_name: selectedCase.business_name,
                    representative: selectedCase.representative,
                    business_number: selectedCase.business_number,
                    assignee: selectedCase.assignee,
                    request_amount: selectedCase.request_amount,
                    region: selectedCase.region,
                    industry: selectedCase.industry,
                    notes: selectedCase.notes,
                    credit_score: selectedCase.credit_score,
                    product: selectedCase.product,
                    // 우선도 + 추가정보 같이 복사
                    priority_checks: selectedCase.priority_checks,
                    extra_notes: selectedCase.extra_notes,
                    ipin_account: selectedCase.ipin_account,
                    ipin_password: selectedCase.ipin_password,
                    resident_number: selectedCase.resident_number,
                    agency_login_id: selectedCase.agency_login_id,
                    agency_login_password: selectedCase.agency_login_password,
                    personal_cert_password: selectedCase.personal_cert_password,
                    business_cert_password: selectedCase.business_cert_password,
                    final_confirm: selectedCase.final_confirm,
                    sourceGroup: selectedCase.agency_group,
                    sourceMonth: selectedCase.month,
                  };
                  setClipboardCase(copyData);
                  try { sessionStorage.setItem("agencyClipboard", JSON.stringify(copyData)); } catch (e) {}
                  alert("'" + selectedCase.business_name + "' 복사 완료\n다른 기관/월 탭에서 '📋 붙여넣기' 버튼을 누르세요.");
                }} title="이 업체를 복사 (다른 기관/월에 붙여넣기 가능)"
                  style={{ padding: "6px 12px", background: "#fff", border: "1px solid #1A1917", borderRadius: 6, fontSize: 12, fontWeight: 600, color: "#1A1917", cursor: "pointer" }}>
                  📋 복사
                </button>
                <button onClick={function() { setSelectedCase(null); }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: "#888" }}>✕</button>
              </div>
            </div>
            <div style={{ padding: "20px 24px" }}>
              {/* 상태 변경 */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#888", marginBottom: 8 }}>상태</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {(activeGroup === "구조혁신&사업전환" ? GUJOHYEOK_STATUS_OPTIONS : ["시작 전","진행 중","보류","부결","승인","완료"]).map(function(s) {
                    var sc = activeGroup === "구조혁신&사업전환"
                      ? (GUJOHYEOK_STATUS_COLORS[s] || { bg: "#F7F6F3", text: "#888" })
                      : (STATUS_COLORS_MAP[s] || { bg: "#F7F6F3", text: "#888" });
                    var isActive = selectedCase.status === s;
                    var isApproved = s === "사업전환 승인";
                    return (
                      <button key={s} onClick={async function() {
                        var prevStatus = selectedCase.status || "";
                        var r = await supabase.from("agency_cases").update({ status: s, updated_at: new Date().toISOString() }).eq("id", selectedCase.id);
                        if (!r.error) {
                          setCases(function(prev) { return prev.map(function(c) { return c.id === selectedCase.id ? Object.assign({}, c, { status: s }) : c; }); });
                          setSelectedCase(function(p) { return Object.assign({}, p, { status: s }); });
                          // 활동 로그 자동 기록 (실제로 상태가 바뀐 경우만) — 컬럼 미생성 시 최소 필드로 재시도
                          if (prevStatus !== s) {
                            var memoTxt = "상태: " + (prevStatus || "없음") + " → " + s;
                            var full = {
                              case_id: selectedCase.id, case_type: "agency",
                              business_name: selectedCase.business_name || "",
                              agency_group: selectedCase.agency_group || activeGroup || null,
                              assignee: selectedCase.assignee || null,
                              log_type: "status_change",
                              old_status: prevStatus || null, new_status: s,
                              memo: memoTxt, logged_by: selectedCase.assignee || null,
                            };
                            var logRes = await supabase.from("activity_logs").insert(full);
                            if (logRes.error) {
                              await supabase.from("activity_logs").insert({
                                business_name: selectedCase.business_name || "",
                                agency_group: selectedCase.agency_group || activeGroup || null,
                                assignee: selectedCase.assignee || null,
                                log_type: "status_change", memo: memoTxt,
                                logged_by: selectedCase.assignee || null,
                              });
                            }
                          }
                        }
                      }} style={{ padding: "5px 12px", borderRadius: 99, border: isActive ? (isApproved ? "2px solid #0F6E56" : "2px solid " + sc.text) : "1px solid #E8E5E0", background: isActive ? sc.bg : "#fff", color: isActive ? sc.text : "#888", fontSize: 12, fontWeight: isActive ? 700 : 400, cursor: "pointer" }}>{isApproved ? "✓ " + s : s}</button>
                    );
                  })}
                </div>
                {activeGroup === "구조혁신&사업전환" && (
                  <div style={{ marginTop: 16 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#0F6E56", marginBottom: 8 }}>전달 및 완료 서류</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {DELIVERED_DOCS_OPTIONS.map(function(doc) {
                        var docs = Array.isArray(selectedCase.delivered_docs) ? selectedCase.delivered_docs : [];
                        var checked = docs.indexOf(doc) >= 0;
                        return (
                          <label key={doc} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, cursor: "pointer" }}>
                            <input type="checkbox" checked={checked} onChange={async function() {
                              var newDocs = checked ? docs.filter(function(d) { return d !== doc; }) : docs.concat([doc]);
                              var r = await supabase.from("agency_cases").update({ delivered_docs: newDocs, updated_at: new Date().toISOString() }).eq("id", selectedCase.id);
                              if (!r.error) {
                                setCases(function(prev) { return prev.map(function(c) { return c.id === selectedCase.id ? Object.assign({}, c, { delivered_docs: newDocs }) : c; }); });
                                setSelectedCase(function(p) { return Object.assign({}, p, { delivered_docs: newDocs }); });
                              }
                            }} style={{ margin: 0, width: 15, height: 15, cursor: "pointer" }} />
                            <span style={{ color: checked ? "#0F6E56" : "#555", fontWeight: checked ? 600 : 400 }}>{doc}</span>
                            {checked && <span style={{ fontSize: 10, color: "#0F6E56" }}>✓</span>}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
              {/* 기본 정보 */}
              <div style={{ marginBottom: 20, background: "#F7F6F3", borderRadius: 8, padding: "14px 16px" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#888", marginBottom: 10 }}>기본 정보</div>
                {(function() {
                  var matchedCo = companiesList.find(function(c) { return c.name === selectedCase.business_name; });
                  var indVal = matchedCo ? matchedCo.industry : null;
                  var items = [
                    { label: "대표자", value: selectedCase.representative },
                    { label: "사업자등록번호", value: selectedCase.business_number },
                    { label: "업종", value: indVal },
                    { label: "신청금액", value: selectedCase.request_amount },
                    { label: "승인금액", value: selectedCase.approved_amount },
                    { label: "지역", value: selectedCase.region },
                    { label: "신청상품", value: selectedCase.fund_product, 
                      render: selectedCase.fund_product ? function() {
                        var col = getProductColor(selectedCase.fund_product);
                        return <span style={{ fontSize: 12, padding: "3px 10px", borderRadius: 6, fontWeight: 600, background: col.bg, color: col.text }}>{selectedCase.fund_product}</span>;
                      } : null },
                  ];
                  return items;
                })().map(function(item) {
                  return item.value ? (
                    <div key={item.label} style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 13 }}>
                      <span style={{ color: "#888" }}>{item.label}</span>
                      <span style={{ fontWeight: 600 }}>{item.value}</span>
                    </div>
                  ) : null;
                })}
                {!selectedCase.representative && !selectedCase.business_number && !selectedCase.request_amount && (
                  <div style={{ fontSize: 12, color: "#AAA" }}>기본 정보가 입력되지 않았습니다.</div>
                )}
              </div>
              {/* 이슈 메모 */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#888", marginBottom: 8 }}>📝 이슈 메모</div>
                <textarea value={selectedCase.notes || ""}
                  onChange={function(e) { setSelectedCase(function(p) { return Object.assign({}, p, { notes: e.target.value }); }); }}
                  onBlur={async function() {
                    var r = await supabase.from("agency_cases").update({ notes: selectedCase.notes, updated_at: new Date().toISOString() }).eq("id", selectedCase.id);
                    if (!r.error) {
                      setCases(function(prev) { return prev.map(function(c) { return c.id === selectedCase.id ? Object.assign({}, c, { notes: selectedCase.notes }) : c; }); });
                    }
                  }}
                  placeholder="이슈 내용을 입력하세요..."
                  rows={4} style={{ width: "100%", padding: "10px 12px", border: "1px solid #E8E5E0", borderRadius: 8, fontSize: 13, lineHeight: 1.6, resize: "vertical", boxSizing: "border-box", outline: "none", fontFamily: "inherit" }} />
                <div style={{ fontSize: 11, color: "#AAA", marginTop: 4 }}>입력 후 칸 밖 클릭 시 자동 저장</div>
              </div>

              {/* 🆕 추가 정보 (아이핀, 공단계정, 인증서 등) */}
              <div style={{ marginBottom: 20, padding: "14px", background: "#F7F6F3", borderRadius: 10, border: "1px solid #E8E5E0" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#1A1917", marginBottom: 12 }}>🔐 추가 정보</div>
                {(function() {
                  // 사업자번호 자동 가져오기 (기업 목록에서 매칭)
                  var matchedCo = companiesList.find(function(c) { return c.name === selectedCase.business_name; });
                  var autoBizNum = matchedCo ? matchedCo.business_number : null;

                  // 공통 input 스타일
                  var inputStyle = { width: "100%", padding: "8px 10px", border: "1px solid #E8E5E0", borderRadius: 6, fontSize: 12, background: "#fff", outline: "none", boxSizing: "border-box", fontFamily: "inherit" };
                  var labelStyle = { fontSize: 10, fontWeight: 700, color: "#888", marginBottom: 4, display: "block" };
                  var rowStyle = { marginBottom: 10 };

                  // 필드 자동 저장 헬퍼
                  var saveField = async function(fieldName, value) {
                    var updateObj = {};
                    updateObj[fieldName] = value;
                    updateObj.updated_at = new Date().toISOString();
                    var r = await supabase.from("agency_cases").update(updateObj).eq("id", selectedCase.id);
                    if (!r.error) {
                      setCases(function(prev) { return prev.map(function(c) { if (c.id === selectedCase.id) { var n = Object.assign({}, c); n[fieldName] = value; return n; } return c; }); });
                    }
                  };

                  return (
                    <>
                      {/* 사업자번호 (자동) */}
                      <div style={rowStyle}>
                        <label style={labelStyle}>사업자번호 (기업 목록에서 자동)</label>
                        <input type="text" value={autoBizNum || "기업 목록에 등록되지 않음"} readOnly
                          style={Object.assign({}, inputStyle, { background: "#F0EDE8", color: autoBizNum ? "#1A1917" : "#AAA", cursor: "not-allowed" })} />
                      </div>

                      {/* 아이핀 계정 + 비번 */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
                        <div>
                          <label style={labelStyle}>아이핀 계정</label>
                          <input type="text" value={selectedCase.ipin_account || ""}
                            onChange={function(e) { setSelectedCase(function(p) { return Object.assign({}, p, { ipin_account: e.target.value }); }); }}
                            onBlur={function() { saveField("ipin_account", selectedCase.ipin_account || ""); }}
                            placeholder="ID" style={inputStyle} />
                        </div>
                        <div>
                          <label style={labelStyle}>아이핀 비밀번호</label>
                          <input type="text" value={selectedCase.ipin_password || ""}
                            onChange={function(e) { setSelectedCase(function(p) { return Object.assign({}, p, { ipin_password: e.target.value }); }); }}
                            onBlur={function() { saveField("ipin_password", selectedCase.ipin_password || ""); }}
                            placeholder="PW" style={inputStyle} />
                        </div>
                      </div>

                      {/* 주민등록번호 */}
                      <div style={rowStyle}>
                        <label style={labelStyle}>주민등록번호</label>
                        <input type="text" value={selectedCase.resident_number || ""}
                          onChange={function(e) { setSelectedCase(function(p) { return Object.assign({}, p, { resident_number: e.target.value }); }); }}
                          onBlur={function() { saveField("resident_number", selectedCase.resident_number || ""); }}
                          placeholder="000000-0000000" style={inputStyle} />
                      </div>

                      {/* 공단 아이디 + 비번 */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
                        <div>
                          <label style={labelStyle}>공단 아이디</label>
                          <input type="text" value={selectedCase.agency_login_id || ""}
                            onChange={function(e) { setSelectedCase(function(p) { return Object.assign({}, p, { agency_login_id: e.target.value }); }); }}
                            onBlur={function() { saveField("agency_login_id", selectedCase.agency_login_id || ""); }}
                            placeholder="ID" style={inputStyle} />
                        </div>
                        <div>
                          <label style={labelStyle}>공단 비밀번호</label>
                          <input type="text" value={selectedCase.agency_login_password || ""}
                            onChange={function(e) { setSelectedCase(function(p) { return Object.assign({}, p, { agency_login_password: e.target.value }); }); }}
                            onBlur={function() { saveField("agency_login_password", selectedCase.agency_login_password || ""); }}
                            placeholder="PW" style={inputStyle} />
                        </div>
                      </div>

                      {/* 개인 인증서 + 사업자 인증서 비밀번호 */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
                        <div>
                          <label style={labelStyle}>개인 인증서 비번</label>
                          <input type="text" value={selectedCase.personal_cert_password || ""}
                            onChange={function(e) { setSelectedCase(function(p) { return Object.assign({}, p, { personal_cert_password: e.target.value }); }); }}
                            onBlur={function() { saveField("personal_cert_password", selectedCase.personal_cert_password || ""); }}
                            placeholder="개인 인증서 PW" style={inputStyle} />
                        </div>
                        <div>
                          <label style={labelStyle}>사업자 인증서 비번</label>
                          <input type="text" value={selectedCase.business_cert_password || ""}
                            onChange={function(e) { setSelectedCase(function(p) { return Object.assign({}, p, { business_cert_password: e.target.value }); }); }}
                            onBlur={function() { saveField("business_cert_password", selectedCase.business_cert_password || ""); }}
                            placeholder="사업자 인증서 PW" style={inputStyle} />
                        </div>
                      </div>

                      {/* 최종 컨펌 */}
                      <div style={rowStyle}>
                        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", padding: "8px 10px", background: selectedCase.final_confirm ? "#ECFDF5" : "#fff", border: "1px solid " + (selectedCase.final_confirm ? "#10B981" : "#E8E5E0"), borderRadius: 6 }}>
                          <input type="checkbox" checked={!!selectedCase.final_confirm}
                            onChange={function(e) { var v = e.target.checked; setSelectedCase(function(p) { return Object.assign({}, p, { final_confirm: v }); }); saveField("final_confirm", v); }}
                            style={{ width: 16, height: 16, cursor: "pointer" }} />
                          <span style={{ fontSize: 12, fontWeight: 700, color: selectedCase.final_confirm ? "#047857" : "#888" }}>
                            {selectedCase.final_confirm ? "✅ 최종 컨펌 완료" : "최종 컨펌"}
                          </span>
                        </label>
                      </div>

                      {/* 추가 메모 */}
                      <div style={{ marginBottom: 4 }}>
                        <label style={labelStyle}>추가 메모</label>
                        <textarea value={selectedCase.extra_notes || ""}
                          onChange={function(e) { setSelectedCase(function(p) { return Object.assign({}, p, { extra_notes: e.target.value }); }); }}
                          onBlur={function() { saveField("extra_notes", selectedCase.extra_notes || ""); }}
                          placeholder="추가로 기록할 내용..."
                          rows={3} style={Object.assign({}, inputStyle, { resize: "vertical", lineHeight: 1.5 })} />
                      </div>

                      <div style={{ fontSize: 10, color: "#AAA", marginTop: 6 }}>각 입력 후 칸 밖 클릭 시 자동 저장</div>
                    </>
                  );
                })()}
              </div>

              {/* 전체 정보 수정 버튼 */}
              <button onClick={function() {
                setEditingId(selectedCase.id);
                setEditData(Object.assign({}, selectedCase));
                setSelectedCase(null);
              }} style={{ width: "100%", padding: "11px", background: "#1A1917", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                ✏️ 전체 정보 수정
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── DB리스트 (신규 고객 상담) ───────────────────────────────────────────────────
const LEAD_STATUSES = ["미연락","연결","부재","미팅","거절","보류","계약"];
const LEAD_STATUS_COLORS = {
  "연결": { bg: "#EEF2FF", text: "#4338CA" },
  "부재": { bg: "#FFF7ED", text: "#C2410C" },
  "미팅": { bg: "#ECFDF5", text: "#047857" },
  "거절": { bg: "#FEF2F2", text: "#DC2626" },
  "보류": { bg: "#F5F3FF", text: "#7C3AED" },
  "미연락": { bg: "#F7F6F3", text: "#888" },
  "계약": { bg: "#ECFDF5", text: "#047857" },
};

function DBLeadsView({ canExport }) {
  const [leads, setLeads] = useState([]);
  const [companiesForDup, setCompaniesForDup] = useState([]);
  const [dupCandidates, setDupCandidates] = useState([]);
  const [showDupModal, setShowDupModal] = useState(false);
  useEffect(function() {
    supabase.from("companies").select("name, phone, representative").then(function(r) {
      if (!r.error && r.data) setCompaniesForDup(r.data);
    });
  }, []);
  const [leadsLoading, setLeadsLoading] = useState(true);
  const [activeMonth, setActiveMonth] = useState(new Date().getMonth() + 1);
  const [filterStatus, setFilterStatus] = useState("전체");
  const [filterWeek, setFilterWeek] = useState("전체");
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [showAddLead, setShowAddLead] = useState(false);
  const [newLead, setNewLead] = useState({});
  const [expandedId, setExpandedId] = useState(null);
  const [showLeadTrash, setShowLeadTrash] = useState(false);
  const [trashedLeads, setTrashedLeads] = useState([]);
  const [dbSearch, setDbSearch] = useState("");
  const [selectedLead, setSelectedLead] = useState(null);

  useEffect(function() { fetchLeads(); }, []);

  var fetchLeads = async function() {
    setLeadsLoading(true);
    var result = await supabase.from("db_leads").select("*").order("created_at", { ascending: true });
    if (!result.error) setLeads(result.data || []);
    setLeadsLoading(false);
  };
  var fetchTrashedLeads = async function() {
    var r = await supabase.from("db_leads").select("*").not("deleted_at", "is", null).order("deleted_at", { ascending: false });
    if (!r.error) setTrashedLeads(r.data || []);
  };
  var restoreLead = async function(id) {
    var r = await supabase.from("db_leads").update({ deleted_at: null }).eq("id", id);
    if (!r.error) {
      setTrashedLeads(function(prev) { return prev.filter(function(l) { return l.id !== id; }); });
      fetchLeads();
    }
  };
  var permanentDeleteLead = async function(id) {
    if (!window.confirm("영구 삭제합니다. 복구할 수 없습니다.")) return;
    var r = await supabase.from("db_leads").delete().eq("id", id);
    if (!r.error) setTrashedLeads(function(prev) { return prev.filter(function(l) { return l.id !== id; }); });
  };

  // 1차콜 날짜에서 주차 계산
  var getWeek = function(lead) {
    var d = lead.call_1_date;
    if (!d) {
      // 기존 call_1 텍스트에서 날짜 추출 시도
      var txt = lead.call_1 || "";
      var m = txt.match(/(\d{1,2})\/(\d{1,2})/);
      if (m) {
        var day = parseInt(m[2]);
        return Math.ceil(day / 7);
      }
      return null;
    }
    var date = new Date(d);
    return Math.ceil(date.getDate() / 7);
  };

  var filtered = useMemo(function() {
    return leads.filter(function(l) {
      if ((activeMonth !== "all" && l.month !== activeMonth) || l.year !== 2026 || l.deleted_at) return false;
      if (filterStatus !== "전체" && l.status !== filterStatus) return false;
      if (filterWeek !== "전체") {
        var w = getWeek(l);
        if (w !== parseInt(filterWeek)) return false;
      }
      if (dbSearch.trim()) {
        var s = dbSearch.trim().toLowerCase();
        return (l.business_name || "").toLowerCase().includes(s) ||
               (l.contact || "").includes(s) ||
               (l.assignee || "").toLowerCase().includes(s);
      }
      return true;
    });
  }, [leads, activeMonth, filterStatus, filterWeek, dbSearch]);

  var monthsWithData = useMemo(function() {
    var s = new Set();
    leads.filter(function(l) { return l.year === 2026 && !l.deleted_at; }).forEach(function(l) { s.add(l.month); });
    return s;
  }, [leads]);

  var weeksWithData = useMemo(function() {
    var counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    leads.filter(function(l) { return (activeMonth === "all" || l.month === activeMonth) && l.year === 2026 && !l.deleted_at; }).forEach(function(l) {
      var w = getWeek(l);
      if (w && w >= 1 && w <= 5) counts[w]++;
    });
    return counts;
  }, [leads, activeMonth]);

  var summary = useMemo(function() {
    var all = leads.filter(function(l) { return (activeMonth === "all" || l.month === activeMonth) && l.year === 2026 && !l.deleted_at; });
    return {
      total: all.length,
      connected: all.filter(function(l) { return l.status === "연결"; }).length,
      absent: all.filter(function(l) { return l.status === "부재"; }).length,
      meeting: all.filter(function(l) { return l.status === "미팅"; }).length,
      rejected: all.filter(function(l) { return l.status === "거절"; }).length,
      notCalled: all.filter(function(l) { return l.status === "미연락"; }).length,
    };
  }, [leads, activeMonth]);

  var startEdit = function(row) { setEditingId(row.id); setEditData(Object.assign({}, row)); };
  var cancelEdit = function() { setEditingId(null); setEditData({}); };
  var saveEdit = async function() {
    var updates = { business_name: editData.business_name, contact: formatPhone(editData.contact || ""), assignee: editData.assignee, assigned_by: editData.assigned_by, status: editData.status, call_1: editData.call_1, call_2: editData.call_2, call_3: editData.call_3, call_4: editData.call_4, call_5: editData.call_5, etc: editData.etc, call_1_date: editData.call_1_date || null, call_1_status: editData.call_1_status || null, call_1_memo: editData.call_1_memo || null, call_2_date: editData.call_2_date || null, call_2_status: editData.call_2_status || null, call_2_memo: editData.call_2_memo || null, call_3_date: editData.call_3_date || null, call_3_status: editData.call_3_status || null, call_3_memo: editData.call_3_memo || null, call_4_date: editData.call_4_date || null, call_4_status: editData.call_4_status || null, call_4_memo: editData.call_4_memo || null, call_5_date: editData.call_5_date || null, call_5_status: editData.call_5_status || null, call_5_memo: editData.call_5_memo || null, updated_at: new Date().toISOString() };
    var result = await supabase.from("db_leads").update(updates).eq("id", editData.id);
    if (!result.error) {
      setLeads(function(prev) { return prev.map(function(l) { return l.id === editData.id ? Object.assign({}, l, updates) : l; }); });
      setEditingId(null); setEditData({});
      // 계약 상태로 변경 시 기업 목록 자동 등록 제안
      if (editData.status === "계약") {
        var existCheck = await supabase.from("companies").select("id").eq("name", editData.business_name).single();
        if (existCheck.error) {
          var doAdd = window.confirm("\"" + editData.business_name + "\"이 계약됐어요!\n기업 목록에 자동으로 추가할까요?");
          if (doAdd) {
            await supabase.from("companies").insert({
              name: editData.business_name,
              phone: editData.contact || "",
              assignee: editData.assignee || "",
              stage: "상담/진단완료",
              type: "법인",
              fee: 5,
            });
            alert("기업 목록에 추가됐어요! 기업 목록에서 추가 정보를 입력해주세요.");
          }
        }
      }
    }
  };
  var deleteLead = async function(id) {
    if (!window.confirm("휴지통으로 이동하시겠습니까?")) return;
    var now = new Date().toISOString();
    var result = await supabase.from("db_leads").update({ deleted_at: now }).eq("id", id);
    if (!result.error) { setLeads(function(prev) { return prev.map(function(l) { return l.id === id ? Object.assign({}, l, { deleted_at: now }) : l; }); }); }
  };
  var openAddLead = function() {
    setNewLead({ year: 2026, month: activeMonth === "all" ? (new Date().getMonth() + 1) : activeMonth, business_name: "", contact: "", assignee: "", assigned_by: "", status: "미연락", call_1: "", call_2: "", call_3: "", call_4: "", call_5: "", etc: "" });
    setShowAddLead(true);
  };
  var normNameDup = function(s) { return (s || "").replace(/\(주\)|㈜|주식회사|\(유\)|농업회사법인|\s/g, "").toLowerCase(); };
  var normPhoneDup = function(s) { return (s || "").replace(/[^0-9]/g, ""); };
  // 회사명+번호 둘 다 같은(2개 이상 일치) 건이 있을 때만 중복으로 표시
  var dupComboCnt = {};
  (leads || []).forEach(function(l) { if (l.deleted_at) return; var n = normNameDup(l.business_name); var p = normPhoneDup(l.contact); if (n && p) { var k = n + "|" + p; dupComboCnt[k] = (dupComboCnt[k] || 0) + 1; } });
  (companiesForDup || []).forEach(function(c) { var n = normNameDup(c.name); var p = normPhoneDup(c.phone); if (n && p) { var k = n + "|" + p; dupComboCnt[k] = (dupComboCnt[k] || 0) + 1; } });
  var isLeadDup = function(row) { var n = normNameDup(row.business_name); var p = normPhoneDup(row.contact); if (!n || !p) return false; return (dupComboCnt[n + "|" + p] || 0) >= 2; };
  // DB리스트 사이드패널 전체 저장 (자동저장 실패 대비 명시적 버튼용)
  var saveAllLead = async function() {
    if (!selectedLead || !selectedLead.id) return;
    var u = {
      business_name: selectedLead.business_name, contact: formatPhone(selectedLead.contact || ""),
      assignee: selectedLead.assignee, assigned_by: selectedLead.assigned_by, status: selectedLead.status,
      script_memo: selectedLead.script_memo || null, etc: selectedLead.etc || null,
      call_1_date: selectedLead.call_1_date || null, call_1_status: selectedLead.call_1_status || null, call_1_memo: selectedLead.call_1_memo || null,
      call_2_date: selectedLead.call_2_date || null, call_2_status: selectedLead.call_2_status || null, call_2_memo: selectedLead.call_2_memo || null,
      call_3_date: selectedLead.call_3_date || null, call_3_status: selectedLead.call_3_status || null, call_3_memo: selectedLead.call_3_memo || null,
      call_4_date: selectedLead.call_4_date || null, call_4_status: selectedLead.call_4_status || null, call_4_memo: selectedLead.call_4_memo || null,
      call_5_date: selectedLead.call_5_date || null, call_5_status: selectedLead.call_5_status || null, call_5_memo: selectedLead.call_5_memo || null,
      updated_at: new Date().toISOString(),
    };
    var r = await supabase.from("db_leads").update(u).eq("id", selectedLead.id);
    if (!r.error) {
      setLeads(function(prev) { return prev.map(function(l) { return l.id === selectedLead.id ? Object.assign({}, l, u) : l; }); });
      alert("저장됐어요!");
    } else {
      alert("저장 실패: " + r.error.message);
    }
  };

  var saveNewLead = function() {
    if (!newLead.business_name) { alert("사업자명은 필수입니다."); return; }
    var inName = normNameDup(newLead.business_name);
    var inPhone = normPhoneDup(newLead.contact);
    var cands = [];
    companiesForDup.forEach(function(c) {
      var reasons = [];
      if (inName && normNameDup(c.name) === inName) reasons.push("회사명");
      if (inPhone && c.phone && normPhoneDup(c.phone) === inPhone) reasons.push("번호");
      if (reasons.length > 0) cands.push({ src: "기업목록", name: c.name, phone: c.phone || "", rep: c.representative || "", reasons: reasons });
    });
    leads.forEach(function(l) {
      if (l.deleted_at) return;
      var reasons = [];
      if (inName && normNameDup(l.business_name) === inName) reasons.push("회사명");
      if (inPhone && l.contact && normPhoneDup(l.contact) === inPhone) reasons.push("번호");
      if (reasons.length > 0) cands.push({ src: "DB리스트", name: l.business_name, phone: l.contact || "", rep: "", reasons: reasons });
    });
    if (cands.length > 0) {
      cands.sort(function(a, b) { return b.reasons.length - a.reasons.length; });
      setDupCandidates(cands);
      setShowDupModal(true);
      return;
    }
    doInsertLead();
  };
  var doInsertLead = async function() {
    var leadData = Object.assign({}, newLead, { contact: formatPhone(newLead.contact || "") });
    var result = await supabase.from("db_leads").insert(leadData).select().single();
    if (!result.error && result.data) { setLeads(function(prev) { return prev.concat([result.data]); }); setShowAddLead(false); setShowDupModal(false); }
  };

  if (leadsLoading) return (<div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", flexDirection: "column", gap: 16 }}><div style={{ width: 36, height: 36, border: "3px solid #E8E5E0", borderTopColor: "#1A1917", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /><span style={{ color: "#888", fontSize: 13 }}>DB리스트 불러오는 중...</span></div>);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div><h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.03em", margin: 0 }}>DB리스트</h1><p style={{ color: "#888", fontSize: 13, margin: "4px 0 0" }}>신규 고객 상담 · 콜 관리</p></div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={openAddLead} style={{ display: "flex", alignItems: "center", gap: 6, background: "#1A1917", color: "#F7F6F3", border: "none", borderRadius: 8, padding: "10px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}><Icon name="plus" size={15} color="#F7F6F3" /> 신규 등록</button>
          <ExportButton rows={leads} filenamePrefix="DB리스트" label="내보내기" canExport={canExport} />
          <button onClick={function() { fetchTrashedLeads(); setShowLeadTrash(true); }} style={{ display: "flex", alignItems: "center", gap: 6, background: "#fff", color: "#888", border: "1px solid #E8E5E0", borderRadius: 8, padding: "8px 14px", fontSize: 12, cursor: "pointer" }}>🗑️ 휴지통{trashedLeads.length > 0 ? " (" + trashedLeads.length + ")" : ""}</button>
          <button onClick={fetchLeads} style={{ display: "flex", alignItems: "center", gap: 6, background: "#fff", color: "#555", border: "1px solid #E8E5E0", borderRadius: 8, padding: "8px 14px", fontSize: 12, cursor: "pointer" }}><Icon name="refresh" size={13} color="#555" /> 새로고침</button>
        </div>
      </div>

      {/* 검색창 */}
      <div style={{ marginBottom: 16, position: "relative" }}>
        <input value={dbSearch} onChange={function(e) { setDbSearch(e.target.value); }}
          placeholder="🔍 업체명, 연락처, 담당자 검색..."
          style={{ width: "100%", padding: "10px 40px 10px 14px", border: "1px solid #E8E5E0", borderRadius: 10, fontSize: 13, boxSizing: "border-box", outline: "none", background: "#fff" }} />
        {dbSearch && <button onClick={function() { setDbSearch(""); }} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "#888" }}>✕</button>}
      </div>

      <div style={{ display: "flex", gap: 4, marginBottom: 18, flexWrap: "wrap" }}>
        {MONTHS_LIST.map(function(m) { var hasData = monthsWithData.has(m); var isActive = activeMonth === m; return (<div key={m} onClick={function() { setActiveMonth(m); setFilterStatus("전체"); }} style={{ padding: "6px 14px", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: isActive ? 700 : 400, background: isActive ? "#1A1917" : hasData ? "#fff" : "#F7F6F3", color: isActive ? "#fff" : hasData ? "#333" : "#CCC", border: isActive ? "none" : hasData ? "1px solid #E8E5E0" : "1px solid #EDEBE8" }}>{m}월{hasData && !isActive ? " ●" : ""}</div>); })}
        <div onClick={function() { setActiveMonth("all"); setFilterStatus("전체"); }} style={{ padding: "6px 14px", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: activeMonth === "all" ? 700 : 600, background: activeMonth === "all" ? "#1A1917" : "#fff", color: activeMonth === "all" ? "#fff" : "#333", border: activeMonth === "all" ? "none" : "1px solid #E8E5E0" }}>📋 전체</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 10, marginBottom: 18 }}>
        {[{ label: "전체", value: summary.total, color: "#1A1917" },{ label: "연결", value: summary.connected, color: "#4338CA" },{ label: "부재", value: summary.absent, color: "#C2410C" },{ label: "미팅", value: summary.meeting, color: "#047857" },{ label: "거절", value: summary.rejected, color: "#DC2626" },{ label: "미연락", value: summary.notCalled, color: "#888" }].map(function(k, i) {
          var isOn = filterStatus === k.label || (filterStatus === "전체" && k.label === "전체");
          return (<div key={i} onClick={function() { setFilterStatus(k.label === "전체" ? "전체" : k.label); }} style={{ background: isOn ? "#1A1917" : "#fff", borderRadius: 10, padding: "12px 14px", border: "1px solid #E8E5E0", cursor: "pointer", textAlign: "center" }}><div style={{ fontSize: 10, color: isOn ? "#999" : "#888", marginBottom: 3 }}>{k.label}</div><div style={{ fontSize: 20, fontWeight: 700, color: isOn ? "#F7F6F3" : k.color }}>{k.value}건</div></div>);
        })}
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 14, alignItems: "center", flexWrap: "wrap" }}>
        <span style={{ fontSize: 12, color: "#888", marginRight: 4 }}>주차별:</span>
        {["전체","1","2","3","4","5"].map(function(w) {
          var label = w === "전체" ? "전체" : w + "주차";
          var count = w === "전체" ? "" : (weeksWithData[parseInt(w)] > 0 ? " (" + weeksWithData[parseInt(w)] + ")" : "");
          return (<div key={w} onClick={function() { setFilterWeek(w); }} style={{ padding: "4px 12px", borderRadius: 99, cursor: "pointer", fontSize: 12, background: filterWeek === w ? "#1A1917" : "#fff", color: filterWeek === w ? "#F7F6F3" : "#666", border: filterWeek === w ? "none" : "1px solid #E8E5E0" }}>{label}{count}</div>);
        })}
      </div>

      <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #E8E5E0", overflow: "hidden" }}>
        {filtered.length === 0 ? (<div style={{ padding: "60px 20px", textAlign: "center", color: "#AAA", fontSize: 13 }}>{activeMonth}월 DB리스트 데이터가 없습니다</div>) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead><tr style={{ borderBottom: "2px solid #E8E5E0" }}>
                <th style={{ textAlign: "center", padding: "10px 8px", fontWeight: 600, color: "#888", fontSize: 11, width: 36 }}>#</th>
                <th style={{ textAlign: "left", padding: "10px 8px", fontWeight: 600, color: "#888", fontSize: 11, minWidth: 120 }}>사업자명</th>
                <th style={{ textAlign: "left", padding: "10px 8px", fontWeight: 600, color: "#888", fontSize: 11, minWidth: 100 }}>연락처</th>
                <th style={{ textAlign: "left", padding: "10px 8px", fontWeight: 600, color: "#888", fontSize: 11, minWidth: 55 }}>담당자</th>
                <th style={{ textAlign: "left", padding: "10px 8px", fontWeight: 600, color: "#888", fontSize: 11, minWidth: 55 }}>배정</th>
                <th style={{ textAlign: "left", padding: "10px 8px", fontWeight: 600, color: "#888", fontSize: 11, minWidth: 70 }}>상태</th>
                <th style={{ textAlign: "left", padding: "10px 8px", fontWeight: 600, color: "#888", fontSize: 11, minWidth: 200 }}>최근 콜</th>
                <th style={{ textAlign: "center", padding: "10px 8px", fontWeight: 600, color: "#888", fontSize: 11, width: 70 }}>작업</th>
              </tr></thead>
              <tbody>
                {filtered.map(function(row, idx) {
                  var isEditing = editingId === row.id;
                  var isExpanded = expandedId === row.id;
                  var lastCall = "-";
                  for (var ci = 5; ci >= 1; ci--) {
                    var cd = row["call_" + ci + "_date"];
                    var cs = row["call_" + ci + "_status"];
                    var cm = row["call_" + ci + "_memo"];
                    if (cd || cs || cm) { lastCall = (cd || "") + " " + (cs || "") + " " + (cm || ""); break; }
                    if (row["call_" + ci]) { lastCall = row["call_" + ci]; break; }
                  }
                  var sc = LEAD_STATUS_COLORS[row.status] || { bg: "#F7F6F3", text: "#888" };
                  var CALL_STATUSES = ["통화완료","부재","거절","문자발송","카톡발송","콜백요청","미팅예약","상담완료","수신거부"];
                  return [
                    <tr key={row.id} style={{ borderBottom: isExpanded ? "none" : "1px solid #F0EDE8", background: selectedLead && selectedLead.id === row.id ? "#F0FDF4" : isEditing ? "#FEFCE8" : idx % 2 === 0 ? "#fff" : "#FAFAF8", cursor: "pointer" }} onClick={function() { setSelectedLead(row); }}>
                      <td style={{ textAlign: "center", padding: "9px 8px", color: "#AAA", fontSize: 11 }}>{idx + 1}</td>
                      <td style={{ padding: "9px 8px" }} onClick={function(e) { if (isEditing) e.stopPropagation(); }}>
                        {isEditing
                          ? <input value={editData.business_name || ""} onChange={function(e) { setEditData(function(p) { return Object.assign({}, p, { business_name: e.target.value }); }); }} style={{ padding: "4px 6px", border: "1px solid #E8E5E0", borderRadius: 4, fontSize: 12, width: "100%", boxSizing: "border-box" }} />
                          : <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><span style={{ fontWeight: 600 }}>{row.business_name || "-"}</span>{isLeadDup(row) && <span title="회사명 또는 번호가 다른 건과 겹침" style={{ fontSize: 10, padding: "1px 6px", borderRadius: 99, background: "#FEE2E2", color: "#DC2626", fontWeight: 700 }}>중복</span>}</span>}
                      </td>
                      <td style={{ padding: "9px 8px" }} onClick={function(e) { if (isEditing) e.stopPropagation(); }}>
                        {isEditing
                          ? <input value={editData.contact || ""} onChange={function(e) { setEditData(function(p) { return Object.assign({}, p, { contact: e.target.value }); }); }} style={{ padding: "4px 6px", border: "1px solid #E8E5E0", borderRadius: 4, fontSize: 12, width: "100%", boxSizing: "border-box" }} />
                          : <span style={{ fontSize: 12, color: "#555" }}>{row.contact || "-"}</span>}
                      </td>
                      <td style={{ padding: "9px 8px" }} onClick={function(e) { if (isEditing) e.stopPropagation(); }}>
                        {isEditing
                          ? <select value={editData.assignee || ""} onChange={function(e) { setEditData(function(p) { return Object.assign({}, p, { assignee: e.target.value }); }); }} style={{ padding: "4px 6px", border: "1px solid #E8E5E0", borderRadius: 4, fontSize: 12, width: "100%" }}><option value="">-</option>{DB_ASSIGNEES.map(function(a) { return <option key={a} value={a}>{a}</option>; })}</select>
                          : <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 99, background: "#EEF2FF", color: "#4338CA", fontWeight: 600 }}>{row.assignee || "-"}</span>}
                      </td>
                      <td style={{ padding: "9px 8px" }} onClick={function(e) { if (isEditing) e.stopPropagation(); }}>
                        {isEditing
                          ? <select value={editData.assigned_by || ""} onChange={function(e) { setEditData(function(p) { return Object.assign({}, p, { assigned_by: e.target.value }); }); }} style={{ padding: "4px 6px", border: "1px solid #E8E5E0", borderRadius: 4, fontSize: 12, width: "100%" }}><option value="">-</option>{DB_MANAGERS.map(function(a) { return <option key={a} value={a}>{a}</option>; })}</select>
                          : <span style={{ fontSize: 12, color: "#888" }}>{row.assigned_by || "-"}</span>}
                      </td>
                      <td style={{ padding: "9px 8px" }} onClick={function(e) { if (isEditing) e.stopPropagation(); }}>
                        {isEditing
                          ? <select value={editData.status || ""} onChange={function(e) { setEditData(function(p) { return Object.assign({}, p, { status: e.target.value }); }); }} style={{ padding: "4px 6px", border: "1px solid #E8E5E0", borderRadius: 4, fontSize: 12, width: "100%" }}>{LEAD_STATUSES.map(function(s) { return <option key={s} value={s}>{s}</option>; })}</select>
                          : <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 99, background: sc.bg, color: sc.text, fontWeight: 600 }}>{row.status || "-"}</span>}
                      </td>
                      <td style={{ padding: "9px 8px", fontSize: 11, color: "#555", maxWidth: 250, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{lastCall}</td>
                      <td style={{ textAlign: "center", padding: "9px 8px" }} onClick={function(e) { if (isEditing) e.stopPropagation(); }}>
                        <div style={{ display: "flex", gap: 4, justifyContent: "center" }}>
                          {isEditing ? <>
                            <button onClick={function(e) { e.stopPropagation(); saveEdit(); }} style={{ background: "#15803D", color: "#fff", border: "none", borderRadius: 4, padding: "3px 8px", fontSize: 11, cursor: "pointer", fontWeight: 600 }}>저장</button>
                            <button onClick={function(e) { e.stopPropagation(); cancelEdit(); }} style={{ background: "#fff", color: "#888", border: "1px solid #E8E5E0", borderRadius: 4, padding: "3px 6px", fontSize: 11, cursor: "pointer" }}>취소</button>
                          </> : <>
                            <button onClick={function(e) { e.stopPropagation(); setSelectedLead(row); }} title="상세/콜 이력 편집" style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}><Icon name="edit" size={14} color="#888" /></button>
                            <button onClick={function() { deleteLead(row.id); }} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}><Icon name="x" size={14} color="#CCC" /></button>
                          </>}
                        </div>
                      </td>
                    </tr>,
                    false && isExpanded && (<tr key={row.id + "-detail"} style={{ borderBottom: "1px solid #F0EDE8", background: "#FAFAF8" }} onClick={function(e) { if (isEditing) e.stopPropagation(); }}><td colSpan={8} style={{ padding: "12px 16px 16px 50px" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, fontSize: 12 }}>
                        {[1,2,3,4,5].map(function(n) {
                          var dateKey = "call_" + n + "_date";
                          var statusKey = "call_" + n + "_status";
                          var memoKey = "call_" + n + "_memo";
                          var oldKey = "call_" + n;
                          var dateVal = isEditing ? (editData[dateKey] || "") : (row[dateKey] || "");
                          var statusVal = isEditing ? (editData[statusKey] || "") : (row[statusKey] || "");
                          var memoVal = isEditing ? (editData[memoKey] || "") : (row[memoKey] || "");
                          var oldVal = row[oldKey] || "";
                          return (<div key={n} style={{ background: "#fff", borderRadius: 8, padding: "10px 12px", border: "1px solid #E8E5E0" }}>
                            <div style={{ fontSize: 10, color: "#888", fontWeight: 600, marginBottom: 6 }}>{n}차콜</div>
                            <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                              <input type="date" value={dateVal}
                                onClick={function(e) { if (isEditing) e.stopPropagation(); }}
                                onChange={function(e) { e.stopPropagation(); var k = dateKey; var v = e.target.value; if (!isEditing) { startEdit(row); } setEditData(function(p) { var o = Object.assign({}, p); o[k] = v; return o; }); }}
                                style={{ padding: "4px 6px", border: "1px solid #E8E5E0", borderRadius: 4, fontSize: 11, flex: 1 }} />
                              <select value={statusVal}
                                onClick={function(e) { if (isEditing) e.stopPropagation(); }}
                                onChange={function(e) { e.stopPropagation(); var k = statusKey; var v = e.target.value; if (!isEditing) { startEdit(row); } setEditData(function(p) { var o = Object.assign({}, p); o[k] = v; return o; }); }}
                                style={{ padding: "4px 6px", border: "1px solid #E8E5E0", borderRadius: 4, fontSize: 11, flex: 1 }}>
                                <option value="">상태 선택</option>
                                {CALL_STATUSES.map(function(s) { return <option key={s} value={s}>{s}</option>; })}
                              </select>
                            </div>
                            <input value={memoVal} placeholder="메모 입력"
                              onClick={function(e) { if (isEditing) e.stopPropagation(); }}
                              onChange={function(e) { e.stopPropagation(); var k = memoKey; var v = e.target.value; if (!isEditing) { startEdit(row); } setEditData(function(p) { var o = Object.assign({}, p); o[k] = v; return o; }); }}
                              style={{ padding: "4px 6px", border: "1px solid #E8E5E0", borderRadius: 4, fontSize: 11, width: "100%", boxSizing: "border-box" }} />
                            {oldVal && !dateVal && !memoVal && (<div style={{ marginTop: 3, fontSize: 10, color: "#AAA" }}>기존: {oldVal}</div>)}
                          </div>);
                        })}
                        <div style={{ background: "#fff", borderRadius: 8, padding: "8px 12px", border: "1px solid #E8E5E0" }}>
                          <div style={{ fontSize: 10, color: "#888", fontWeight: 600, marginBottom: 3 }}>기타</div>
                          <input value={isEditing ? (editData.etc || "") : (row.etc || "")} placeholder="기타 메모"
                            onChange={function(e) { var v = e.target.value; if (!isEditing) { startEdit(row); } setEditData(function(p) { return Object.assign({}, p, { etc: v }); }); }}
                            onClick={function(e) { if (isEditing) e.stopPropagation(); }}
                            style={{ padding: "4px 6px", border: "1px solid #E8E5E0", borderRadius: 4, fontSize: 11, width: "100%", boxSizing: "border-box" }} />
                        </div>
                        {isEditing && (
                          <div style={{ gridColumn: "1 / -1", display: "flex", gap: 8, marginTop: 4 }}>
                            <button onClick={function(e) { e.stopPropagation(); saveEdit(); }} style={{ background: "#15803D", color: "#fff", border: "none", borderRadius: 6, padding: "8px 20px", fontSize: 12, cursor: "pointer", fontWeight: 700 }}>저장</button>
                            <button onClick={function(e) { e.stopPropagation(); cancelEdit(); }} style={{ background: "#fff", color: "#888", border: "1px solid #E8E5E0", borderRadius: 6, padding: "8px 14px", fontSize: 12, cursor: "pointer" }}>취소</button>
                          </div>
                        )}
                      </div>
                    </td></tr>)
                  ];
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showDupModal && (<div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1100, display: "flex", alignItems: "center", justifyContent: "center" }} onMouseDown={function(e) { if (e.target === e.currentTarget) setShowDupModal(false); }}>
        <div style={{ background: "#fff", borderRadius: 12, padding: 24, width: 520, maxWidth: "90vw", maxHeight: "80vh", overflowY: "auto" }} onClick={function(e) { e.stopPropagation(); }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 20 }}>⚠️</span>
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>비슷한 기존 고객이 있어요</h2>
          </div>
          <p style={{ color: "#888", fontSize: 13, margin: "0 0 16px" }}>회사명 또는 번호가 겹치는 건이 {dupCandidates.length}개 있습니다. 확인 후 등록 여부를 결정하세요.</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 18 }}>
            {dupCandidates.map(function(d, i) {
              var strong = d.reasons.length >= 2;
              return (
                <div key={i} style={{ border: "1px solid " + (strong ? "#FCA5A5" : "#E8E5E0"), background: strong ? "#FEF2F2" : "#FAFAF8", borderRadius: 8, padding: "10px 12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                    <span style={{ fontWeight: 700, fontSize: 14 }}>{d.name}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 99, background: d.src === "기업목록" ? "#EEF2FF" : "#FEF3C7", color: d.src === "기업목록" ? "#4338CA" : "#B45309" }}>{d.src}</span>
                  </div>
                  <div style={{ fontSize: 12, color: "#666" }}>
                    {d.phone ? "📞 " + d.phone : ""}{d.rep ? "  ·  대표 " + d.rep : ""}
                  </div>
                  <div style={{ fontSize: 11, color: strong ? "#DC2626" : "#999", marginTop: 4, fontWeight: 600 }}>
                    {strong ? "🔴 " : ""}{d.reasons.join(" + ")} 일치{strong ? " (중복 가능성 높음)" : ""}
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={function() { setShowDupModal(false); }} style={{ flex: 1, padding: "12px", background: "#F1EFE8", color: "#555", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>취소</button>
            <button onClick={doInsertLead} style={{ flex: 1, padding: "12px", background: "#1A1917", color: "#F7F6F3", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>그래도 등록</button>
          </div>
        </div>
      </div>)}

      {showAddLead && (<div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }} onMouseDown={function(e) { if (e.target === e.currentTarget) setShowAddLead(false); }}>
        <div style={{ background: "#fff", borderRadius: 14, width: 520, maxHeight: "85vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
          <div style={{ padding: "22px 24px 16px", borderBottom: "1px solid #E8E5E0", display: "flex", justifyContent: "space-between", alignItems: "center" }}><h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>신규 DB 등록 ({activeMonth}월)</h2><button onClick={function() { setShowAddLead(false); }} style={{ background: "none", border: "none", cursor: "pointer" }}><Icon name="x" size={18} color="#888" /></button></div>
          <div style={{ padding: "20px 24px" }}>
            <div style={{ marginBottom: 13 }}><label style={{ fontSize: 12, fontWeight: 600, color: "#555", display: "block", marginBottom: 5 }}>사업자명 *</label><input value={newLead.business_name || ""} onChange={function(e) { setNewLead(function(p) { return Object.assign({}, p, { business_name: e.target.value }); }); }} style={{ width: "100%", padding: "10px 13px", border: "1px solid #E8E5E0", borderRadius: 8, fontSize: 13, boxSizing: "border-box", outline: "none" }} /></div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 13 }}><div><label style={{ fontSize: 12, fontWeight: 600, color: "#555", display: "block", marginBottom: 5 }}>연락처</label><input value={newLead.contact || ""} onChange={function(e) { setNewLead(function(p) { return Object.assign({}, p, { contact: e.target.value }); }); }} placeholder="010-0000-0000" style={{ width: "100%", padding: "10px 13px", border: "1px solid #E8E5E0", borderRadius: 8, fontSize: 13, boxSizing: "border-box", outline: "none" }} /></div><div><label style={{ fontSize: 12, fontWeight: 600, color: "#555", display: "block", marginBottom: 5 }}>상태</label><select value={newLead.status || "미연락"} onChange={function(e) { setNewLead(function(p) { return Object.assign({}, p, { status: e.target.value }); }); }} style={{ width: "100%", padding: "10px 13px", border: "1px solid #E8E5E0", borderRadius: 8, fontSize: 13, background: "#fff" }}>{LEAD_STATUSES.map(function(s) { return <option key={s} value={s}>{s}</option>; })}</select></div></div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 13 }}><div><label style={{ fontSize: 12, fontWeight: 600, color: "#555", display: "block", marginBottom: 5 }}>담당자</label><select value={newLead.assignee || ""} onChange={function(e) { setNewLead(function(p) { return Object.assign({}, p, { assignee: e.target.value }); }); }} style={{ width: "100%", padding: "10px 13px", border: "1px solid #E8E5E0", borderRadius: 8, fontSize: 13, background: "#fff" }}><option value="">선택</option>{DB_ASSIGNEES.map(function(a) { return <option key={a} value={a}>{a}</option>; })}</select></div><div><label style={{ fontSize: 12, fontWeight: 600, color: "#555", display: "block", marginBottom: 5 }}>배정 담당</label><select value={newLead.assigned_by || ""} onChange={function(e) { setNewLead(function(p) { return Object.assign({}, p, { assigned_by: e.target.value }); }); }} style={{ width: "100%", padding: "10px 13px", border: "1px solid #E8E5E0", borderRadius: 8, fontSize: 13, background: "#fff" }}><option value="">선택</option>{DB_MANAGERS.map(function(a) { return <option key={a} value={a}>{a}</option>; })}</select></div></div>
            <div style={{ marginBottom: 13 }}><label style={{ fontSize: 12, fontWeight: 600, color: "#555", display: "block", marginBottom: 5 }}>1차콜</label>
              <div style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                <input type="date" value={newLead.call_1_date || ""} onChange={function(e) { setNewLead(function(p) { return Object.assign({}, p, { call_1_date: e.target.value }); }); }} style={{ flex: 1, padding: "10px 13px", border: "1px solid #E8E5E0", borderRadius: 8, fontSize: 13 }} />
                <select value={newLead.call_1_status || ""} onChange={function(e) { setNewLead(function(p) { return Object.assign({}, p, { call_1_status: e.target.value }); }); }} style={{ flex: 1, padding: "10px 13px", border: "1px solid #E8E5E0", borderRadius: 8, fontSize: 13, background: "#fff" }}>
                  <option value="">상태 선택</option>
                  <option value="통화완료">통화완료</option><option value="부재">부재</option><option value="거절">거절</option><option value="문자발송">문자발송</option><option value="카톡발송">카톡발송</option><option value="콜백요청">콜백요청</option><option value="미팅예약">미팅예약</option><option value="상담완료">상담완료</option><option value="수신거부">수신거부</option>
                </select>
              </div>
              <input value={newLead.call_1_memo || ""} placeholder="1차콜 메모 (선택)" onChange={function(e) { setNewLead(function(p) { return Object.assign({}, p, { call_1_memo: e.target.value }); }); }} style={{ width: "100%", padding: "10px 13px", border: "1px solid #E8E5E0", borderRadius: 8, fontSize: 13, boxSizing: "border-box", outline: "none" }} />
            </div>
            <div style={{ marginBottom: 13 }}><label style={{ fontSize: 12, fontWeight: 600, color: "#555", display: "block", marginBottom: 5 }}>2차콜</label>
              <div style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                <input type="date" value={newLead.call_2_date || ""} onChange={function(e) { setNewLead(function(p) { return Object.assign({}, p, { call_2_date: e.target.value }); }); }} style={{ flex: 1, padding: "10px 13px", border: "1px solid #E8E5E0", borderRadius: 8, fontSize: 13 }} />
                <select value={newLead.call_2_status || ""} onChange={function(e) { setNewLead(function(p) { return Object.assign({}, p, { call_2_status: e.target.value }); }); }} style={{ flex: 1, padding: "10px 13px", border: "1px solid #E8E5E0", borderRadius: 8, fontSize: 13, background: "#fff" }}>
                  <option value="">상태 선택</option>
                  <option value="통화완료">통화완료</option><option value="부재">부재</option><option value="거절">거절</option><option value="문자발송">문자발송</option><option value="카톡발송">카톡발송</option><option value="콜백요청">콜백요청</option><option value="미팅예약">미팅예약</option><option value="상담완료">상담완료</option><option value="수신거부">수신거부</option>
                </select>
              </div>
              <input value={newLead.call_2_memo || ""} placeholder="2차콜 메모 (선택)" onChange={function(e) { setNewLead(function(p) { return Object.assign({}, p, { call_2_memo: e.target.value }); }); }} style={{ width: "100%", padding: "10px 13px", border: "1px solid #E8E5E0", borderRadius: 8, fontSize: 13, boxSizing: "border-box", outline: "none" }} />
            </div>
            <button onClick={saveNewLead} style={{ width: "100%", padding: "13px", background: "#1A1917", color: "#F7F6F3", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: "pointer", marginTop: 6 }}>등록하기</button>
          </div>
        </div>
      </div>)}

      {/* DB리스트 사이드패널 */}
      {selectedLead && (
        <div style={{ position: "fixed", inset: 0, zIndex: 900 }}
          onMouseDown={function(e) { window.__panelMouseDownTarget = e.target; }}
          onClick={function(e) { if (window.__panelMouseDownTarget === e.target) setSelectedLead(null); window.__panelMouseDownTarget = null; }}>
          <div style={{ position: "absolute", top: 0, right: 0, width: 480, height: "100%", background: "#fff", boxShadow: "-4px 0 30px rgba(0,0,0,0.15)", overflowY: "auto" }}
            onClick={function(e) { e.stopPropagation(); }}
            onMouseDown={function(e) { e.stopPropagation(); }}>
            <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #E8E5E0", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, background: "#fff", zIndex: 1 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: "#1A1917" }}>{selectedLead.business_name || "(미입력)"}</div>
                <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>{selectedLead.contact || "-"} · {selectedLead.assignee || "-"}</div>
              </div>
              <button onClick={function() { setSelectedLead(null); }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: "#888" }}>✕</button>
            </div>
            <div style={{ padding: "20px 24px" }}>
              {/* 기본 정보 수정 */}
              <div style={{ fontSize: 11, fontWeight: 700, color: "#888", marginBottom: 10, letterSpacing: "0.05em" }}>기본 정보</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
                <div style={{ background: "#F7F6F3", borderRadius: 8, padding: "10px 13px" }}>
                  <div style={{ fontSize: 11, color: "#888", marginBottom: 5 }}>사업자명</div>
                  <input value={selectedLead.business_name || ""}
                    onChange={function(e) { setSelectedLead(function(p) { return Object.assign({}, p, { business_name: e.target.value }); }); }}
                    onBlur={async function() {
                      var r = await supabase.from("db_leads").update({ business_name: selectedLead.business_name, updated_at: new Date().toISOString() }).eq("id", selectedLead.id);
                      if (!r.error) setLeads(function(prev) { return prev.map(function(l) { return l.id === selectedLead.id ? Object.assign({}, l, { business_name: selectedLead.business_name }) : l; }); });
                    }}
                    style={{ width: "100%", fontSize: 13, fontWeight: 600, background: "transparent", border: "none", outline: "none" }} />
                </div>
                <div style={{ background: "#F7F6F3", borderRadius: 8, padding: "10px 13px" }}>
                  <div style={{ fontSize: 11, color: "#888", marginBottom: 5 }}>연락처</div>
                  <input value={selectedLead.contact || ""}
                    onChange={function(e) { setSelectedLead(function(p) { return Object.assign({}, p, { contact: formatPhone(e.target.value) }); }); }}
                    onBlur={async function() {
                      var v = formatPhone(selectedLead.contact || "");
                      var r = await supabase.from("db_leads").update({ contact: v, updated_at: new Date().toISOString() }).eq("id", selectedLead.id);
                      if (!r.error) setLeads(function(prev) { return prev.map(function(l) { return l.id === selectedLead.id ? Object.assign({}, l, { contact: v }) : l; }); });
                    }}
                    style={{ width: "100%", fontSize: 13, fontWeight: 600, background: "transparent", border: "none", outline: "none" }} />
                </div>
                <div style={{ background: "#F7F6F3", borderRadius: 8, padding: "10px 13px" }}>
                  <div style={{ fontSize: 11, color: "#888", marginBottom: 5 }}>담당자</div>
                  <select value={selectedLead.assignee || ""}
                    onChange={async function(e) {
                      var v = e.target.value;
                      var r = await supabase.from("db_leads").update({ assignee: v, updated_at: new Date().toISOString() }).eq("id", selectedLead.id);
                      if (!r.error) {
                        setLeads(function(prev) { return prev.map(function(l) { return l.id === selectedLead.id ? Object.assign({}, l, { assignee: v }) : l; }); });
                        setSelectedLead(function(p) { return Object.assign({}, p, { assignee: v }); });
                      }
                    }}
                    style={{ width: "100%", fontSize: 13, fontWeight: 600, background: "transparent", border: "none", outline: "none", cursor: "pointer" }}>
                    <option value="">선택</option>
                    {DB_ASSIGNEES.map(function(a) { return <option key={a} value={a}>{a}</option>; })}
                  </select>
                </div>
                <div style={{ background: "#F7F6F3", borderRadius: 8, padding: "10px 13px" }}>
                  <div style={{ fontSize: 11, color: "#888", marginBottom: 5 }}>배정자</div>
                  <select value={selectedLead.assigned_by || ""}
                    onChange={async function(e) {
                      var v = e.target.value;
                      var r = await supabase.from("db_leads").update({ assigned_by: v, updated_at: new Date().toISOString() }).eq("id", selectedLead.id);
                      if (!r.error) {
                        setLeads(function(prev) { return prev.map(function(l) { return l.id === selectedLead.id ? Object.assign({}, l, { assigned_by: v }) : l; }); });
                        setSelectedLead(function(p) { return Object.assign({}, p, { assigned_by: v }); });
                      }
                    }}
                    style={{ width: "100%", fontSize: 13, fontWeight: 600, background: "transparent", border: "none", outline: "none", cursor: "pointer" }}>
                    <option value="">선택</option>
                    {DB_MANAGERS.map(function(a) { return <option key={a} value={a}>{a}</option>; })}
                  </select>
                </div>
              </div>

              {/* 상태 */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#888", marginBottom: 8, letterSpacing: "0.05em" }}>상태</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {LEAD_STATUSES.map(function(s) {
                    var sc = LEAD_STATUS_COLORS[s] || { bg: "#F7F6F3", text: "#888" };
                    var isActive = selectedLead.status === s;
                    return (
                      <button key={s} onClick={async function() {
                        var r = await supabase.from("db_leads").update({ status: s, updated_at: new Date().toISOString() }).eq("id", selectedLead.id);
                        if (!r.error) {
                          setLeads(function(prev) { return prev.map(function(l) { return l.id === selectedLead.id ? Object.assign({}, l, { status: s }) : l; }); });
                          setSelectedLead(function(p) { return Object.assign({}, p, { status: s }); });
                        }
                      }} style={{ padding: "5px 12px", borderRadius: 99, border: isActive ? "2px solid " + sc.text : "1px solid #E8E5E0", background: isActive ? sc.bg : "#fff", color: isActive ? sc.text : "#888", fontSize: 12, fontWeight: isActive ? 700 : 400, cursor: "pointer" }}>{s}</button>
                    );
                  })}
                </div>
              </div>

              {/* 📝 통화 스크립트 메모 (큰 영역) - 상단 배치 */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#4338CA", letterSpacing: "0.05em" }}>📝 통화 스크립트 (DB 13문항 + 메모)</div>
                  <span style={{ fontSize: 10, color: "#888" }}>자동 저장</span>
                </div>
                <textarea value={selectedLead.script_memo || ""}
                  placeholder="【고객정보】&#10;▷이름:&#10;▷연락처:&#10;▷회사이름:&#10;▷지역:&#10;&#10;【Q&A】&#10;1. 정책자금 / 세무기장 중 어떤 상담 문의&#10;-> &#10;2. 현재 하시는 업종 (제조업, 도소매업 등)&#10;-> &#10;3. 사업장 설립일자&#10;-> &#10;..."
                  onChange={function(e) { setSelectedLead(function(p) { return Object.assign({}, p, { script_memo: e.target.value }); }); }}
                  onBlur={async function() {
                    var v = selectedLead.script_memo || null;
                    var r = await supabase.from("db_leads").update({ script_memo: v, updated_at: new Date().toISOString() }).eq("id", selectedLead.id);
                    if (!r.error) setLeads(function(prev) { return prev.map(function(l) { return l.id === selectedLead.id ? Object.assign({}, l, { script_memo: v }) : l; }); });
                  }}
                  style={{ width: "100%", minHeight: 350, padding: "12px 14px", border: "2px solid #C7D2FE", borderRadius: 10, fontSize: 12, lineHeight: 1.7, fontFamily: "'Noto Sans KR', 'Malgun Gothic', monospace", boxSizing: "border-box", outline: "none", background: "#FAFAFF", resize: "vertical", whiteSpace: "pre-wrap" }} />
              </div>

              {/* 📞 콜 이력 (컴팩트) */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#888", marginBottom: 8, letterSpacing: "0.05em" }}>📞 콜 이력</div>
                <div style={{ background: "#F7F6F3", borderRadius: 8, padding: "8px 10px" }}>
                  {[1,2,3,4,5].map(function(ci) {
                    var dateKey = "call_" + ci + "_date";
                    var statusKey = "call_" + ci + "_status";
                    var memoKey = "call_" + ci + "_memo";
                    var hasData = selectedLead[dateKey] || selectedLead[statusKey] || selectedLead[memoKey];
                    return (
                      <div key={ci} style={{ marginBottom: ci < 5 ? 10 : 0, paddingBottom: ci < 5 ? 10 : 0, borderBottom: ci < 5 ? "1px solid #E8E5E0" : "none", opacity: hasData ? 1 : 0.6 }}>
                        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                          <span style={{ fontSize: 10, fontWeight: 700, color: "#4338CA", width: 32, flexShrink: 0 }}>{ci}차</span>
                          <input type="date" value={selectedLead[dateKey] || ""}
                            onChange={function(e) { setSelectedLead(function(p) { return Object.assign({}, p, { [dateKey]: e.target.value }); }); }}
                            onBlur={async function() {
                              var u = {}; u[dateKey] = selectedLead[dateKey] || null; u.updated_at = new Date().toISOString();
                              var r = await supabase.from("db_leads").update(u).eq("id", selectedLead.id);
                              if (!r.error) setLeads(function(prev) { return prev.map(function(l) { return l.id === selectedLead.id ? Object.assign({}, l, u) : l; }); });
                            }}
                            style={{ flex: 1, padding: "4px 6px", border: "1px solid #E8E5E0", borderRadius: 5, fontSize: 11, background: "#fff" }} />
                          <select value={selectedLead[statusKey] || ""}
                            onChange={async function(e) {
                              var v = e.target.value;
                              var u = {}; u[statusKey] = v || null; u.updated_at = new Date().toISOString();
                              var r = await supabase.from("db_leads").update(u).eq("id", selectedLead.id);
                              if (!r.error) {
                                setLeads(function(prev) { return prev.map(function(l) { return l.id === selectedLead.id ? Object.assign({}, l, u) : l; }); });
                                setSelectedLead(function(p) { return Object.assign({}, p, { [statusKey]: v }); });
                              }
                            }}
                            style={{ flex: 1, padding: "4px 6px", border: "1px solid #E8E5E0", borderRadius: 5, fontSize: 11, background: "#fff" }}>
                            <option value="">-</option>
                            <option value="통화완료">통화완료</option><option value="부재">부재</option><option value="거절">거절</option>
                            <option value="문자발송">문자발송</option><option value="카톡발송">카톡발송</option><option value="콜백요청">콜백요청</option>
                            <option value="미팅예약">미팅예약</option><option value="상담완료">상담완료</option><option value="수신거부">수신거부</option>
                          </select>
                        </div>
                        <input value={selectedLead[memoKey] || ""} placeholder={ci + "차콜 메모"}
                          onChange={function(e) { setSelectedLead(function(p) { return Object.assign({}, p, { [memoKey]: e.target.value }); }); }}
                          onBlur={async function() {
                            var u = {}; u[memoKey] = selectedLead[memoKey] || null; u.updated_at = new Date().toISOString();
                            var r = await supabase.from("db_leads").update(u).eq("id", selectedLead.id);
                            if (!r.error) setLeads(function(prev) { return prev.map(function(l) { return l.id === selectedLead.id ? Object.assign({}, l, u) : l; }); });
                          }}
                          style={{ width: "100%", marginTop: 5, marginLeft: 38, maxWidth: "calc(100% - 38px)", padding: "5px 7px", border: "1px solid #E8E5E0", borderRadius: 5, fontSize: 11, background: "#fff", boxSizing: "border-box", outline: "none" }} />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 이슈 메모 */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#888", marginBottom: 8 }}>📝 이슈 메모</div>
                <textarea value={selectedLead.etc || ""} placeholder="이슈 내용을 입력하세요..."
                  onChange={function(e) { setSelectedLead(function(p) { return Object.assign({}, p, { etc: e.target.value }); }); }}
                  onBlur={async function() {
                    var r = await supabase.from("db_leads").update({ etc: selectedLead.etc, updated_at: new Date().toISOString() }).eq("id", selectedLead.id);
                    if (!r.error) setLeads(function(prev) { return prev.map(function(l) { return l.id === selectedLead.id ? Object.assign({}, l, { etc: selectedLead.etc }) : l; }); });
                  }}
                  rows={4} style={{ width: "100%", padding: "10px 12px", border: "1px solid #E8E5E0", borderRadius: 8, fontSize: 13, lineHeight: 1.6, resize: "vertical", boxSizing: "border-box", outline: "none", fontFamily: "inherit" }} />
                <div style={{ fontSize: 11, color: "#AAA", marginTop: 4 }}>입력 후 칸 밖 클릭 시 자동 저장</div>
              </div>

              {/* 전체 저장 버튼 (자동저장이 안 될 때 확실히 저장) */}
              <button onClick={saveAllLead} style={{ width: "100%", padding: "13px", background: "#1A1917", color: "#F7F6F3", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: "pointer", marginBottom: 8 }}>💾 전체 저장</button>
            </div>
          </div>
        </div>
      )}

      {/* DB리스트 휴지통 모달 */}
      {showLeadTrash && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}
          onMouseDown={function(e) { if (e.target === e.currentTarget) setShowLeadTrash(false); }}>
          <div style={{ background: "#fff", borderRadius: 14, width: 600, maxHeight: "80vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #E8E5E0", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, background: "#fff" }}>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>🗑️ DB리스트 휴지통 ({trashedLeads.length}건)</h2>
              <button onClick={function() { setShowLeadTrash(false); }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "#888" }}>✕</button>
            </div>
            <div style={{ padding: "16px 24px" }}>
              {trashedLeads.length === 0 ? (
                <div style={{ padding: "40px 0", textAlign: "center", color: "#888", fontSize: 13 }}>휴지통이 비어 있습니다</div>
              ) : (
                trashedLeads.map(function(lead) {
                  var deletedAt = lead.deleted_at ? new Date(lead.deleted_at).toLocaleDateString("ko-KR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "";
                  return (
                    <div key={lead.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid #F0EDE8" }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{lead.business_name}</div>
                        <div style={{ fontSize: 11, color: "#AAA", marginTop: 2 }}>삭제일: {deletedAt} · {lead.assignee || "-"}</div>
                      </div>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={function() { restoreLead(lead.id); }} style={{ background: "#EEF2FF", color: "#4338CA", border: "none", borderRadius: 6, padding: "5px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>복구</button>
                        <button onClick={function() { permanentDeleteLead(lead.id); }} style={{ background: "#FEE2E2", color: "#DC2626", border: "none", borderRadius: 6, padding: "5px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>영구삭제</button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ========== 📚 사례집 (자금 승인 사례 관리) ==========
function ApprovalCasesView({ profile }) {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterAgency, setFilterAgency] = useState("전체");
  const [filterResult, setFilterResult] = useState("전체");
  const [filterIndustry, setFilterIndustry] = useState("전체");
  const [editingCase, setEditingCase] = useState(null); // 추가/수정 중인 사례
  const [showForm, setShowForm] = useState(false);
  const [companiesList, setCompaniesList] = useState([]); // 기업목록 (자동완성용)
  const [companySuggestions, setCompanySuggestions] = useState([]);

  useEffect(function() {
    fetchCases();
    // 기업목록 자동완성용 데이터 로딩
    supabase.from("companies").select("name,representative,business_number,region,industry,assignee").is("deleted_at", null).then(function(r) {
      if (!r.error) setCompaniesList(r.data || []);
    });
  }, []);

  var fetchCases = async function() {
    setLoading(true);
    var r = await supabase.from("approval_cases").select("*").is("deleted_at", null).order("created_at", { ascending: false });
    if (!r.error) setCases(r.data || []);
    setLoading(false);
  };

  // 필터링
  var filtered = useMemo(function() {
    return cases.filter(function(c) {
      if (filterAgency !== "전체" && c.agency_group !== filterAgency) return false;
      if (filterResult !== "전체" && c.result !== filterResult) return false;
      if (filterIndustry !== "전체" && c.industry !== filterIndustry) return false;
      if (search.trim()) {
        var s = search.toLowerCase();
        var hay = [c.business_name, c.product, c.initial_issue, c.resolution, c.key_point, c.result_reason, (c.tags||[]).join(" ")].join(" ").toLowerCase();
        if (hay.indexOf(s) < 0) return false;
      }
      return true;
    });
  }, [cases, search, filterAgency, filterResult, filterIndustry]);

  // 통계
  var stats = useMemo(function() {
    var total = cases.length;
    var approved = cases.filter(function(c) { return ["승인","약정","완료"].indexOf(c.result) >= 0; }).length;
    var rejected = cases.filter(function(c) { return ["부결","반려"].indexOf(c.result) >= 0; }).length;
    var rate = total > 0 ? Math.round((approved / total) * 100) : 0;
    return { total: total, approved: approved, rejected: rejected, rate: rate };
  }, [cases]);

  // 산업 옵션 추출
  var industryOpts = useMemo(function() {
    var s = new Set();
    cases.forEach(function(c) { if (c.industry) s.add(c.industry); });
    return ["전체"].concat(Array.from(s).sort());
  }, [cases]);

  var agencyOpts = ["전체","소상공인시장진흥공단","신용보증기금","농협신용보증기금","기술보증기금","신용보증재단","중소벤처기업진흥공단","구조혁신&사업전환","경정청구","기타"];
  var resultOpts = ["전체","승인","약정","완료","부결","반려","진행중","신청전"];

  // 기관별 신청상품 옵션 매핑
  var getProductOptions = function(agencyGroup) {
    if (agencyGroup === "중소벤처기업진흥공단") return JUNGINGONG_PRODUCTS;
    if (agencyGroup === "소상공인시장진흥공단") return SOJINGONG_PRODUCTS;
    return null; // 그 외 기관은 자유입력만
  };

  // 회사명 자동완성
  var onBusinessNameChange = function(value) {
    setEditingCase(function(p) { return Object.assign({}, p, { business_name: value }); });
    if (!value || value.length < 1) { setCompanySuggestions([]); return; }
    var matches = companiesList.filter(function(co) {
      return (co.name || "").toLowerCase().indexOf(value.toLowerCase()) >= 0;
    }).slice(0, 8);
    setCompanySuggestions(matches);
  };

  // 자동완성 선택 - 회사 정보 자동 채우기
  var selectCompany = function(co) {
    setEditingCase(function(p) {
      return Object.assign({}, p, {
        business_name: co.name || "",
        industry: co.industry || p.industry || "",
        region: co.region || p.region || "",
      });
    });
    setCompanySuggestions([]);
  };

  var openNew = function() {
    setEditingCase({
      business_name: "", agency_group: "", product: "", result: "",
      applied_amount: "", approved_amount: "", applied_at: "", result_at: "",
      industry: "", region: "", business_type: "법인", business_years: "", revenue_range: "", credit_score_range: "",
      initial_issue: "", resolution: "", key_point: "", result_reason: "",
      tags: [], blog_memo: "",
    });
    setCompanySuggestions([]);
    setShowForm(true);
  };

  var openEdit = function(c) {
    setEditingCase(Object.assign({}, c, { tags: c.tags || [] }));
    setCompanySuggestions([]);
    setShowForm(true);
  };

  var saveCase = async function() {
    if (!editingCase.business_name?.trim()) { alert("회사명은 필수입니다."); return; }
    var payload = Object.assign({}, editingCase);
    // 숫자 변환
    payload.applied_amount = payload.applied_amount ? Number(String(payload.applied_amount).replace(/[^0-9]/g, "")) || null : null;
    payload.approved_amount = payload.approved_amount ? Number(String(payload.approved_amount).replace(/[^0-9]/g, "")) || null : null;
    payload.business_years = payload.business_years ? Number(payload.business_years) || null : null;
    payload.applied_at = payload.applied_at || null;
    payload.result_at = payload.result_at || null;
    // 빈 문자열 -> null
    ["agency_group","product","result","industry","region","business_type","revenue_range","credit_score_range","initial_issue","resolution","key_point","result_reason","blog_memo"].forEach(function(k) {
      if (!payload[k]) payload[k] = null;
    });
    payload.updated_at = new Date().toISOString();

    var r;
    if (payload.id) {
      var id = payload.id;
      delete payload.id;
      delete payload.created_at;
      r = await supabase.from("approval_cases").update(payload).eq("id", id);
    } else {
      payload.created_by = profile?.name || null;
      r = await supabase.from("approval_cases").insert(payload);
    }
    if (r.error) { alert("저장 실패: " + r.error.message); return; }
    setShowForm(false);
    setEditingCase(null);
    fetchCases();
  };

  var deleteCase = async function(id) {
    if (!confirm("이 사례를 삭제할까요?")) return;
    var r = await supabase.from("approval_cases").update({ deleted_at: new Date().toISOString() }).eq("id", id);
    if (r.error) { alert("삭제 실패: " + r.error.message); return; }
    fetchCases();
  };

  var resultColor = function(result) {
    if (["승인","약정","완료"].indexOf(result) >= 0) return { bg: "#DCFCE7", color: "#15803D" };
    if (["부결","반려"].indexOf(result) >= 0) return { bg: "#FEE2E2", color: "#B91C1C" };
    return { bg: "#F3F4F6", color: "#555" };
  };

  var formatAmt = function(n) {
    if (!n) return "-";
    n = Number(n);
    if (n >= 100000000) return Math.round(n / 10000000) / 10 + "억";
    if (n >= 10000) return Math.round(n / 10000) + "만";
    return n.toLocaleString();
  };

  return (
    <div style={{ maxWidth: 1400 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>📚 사례집</h1>
          <div style={{ fontSize: 13, color: "#888", marginTop: 4 }}>자금 신청 사례를 누적·검색·재활용</div>
        </div>
        <button onClick={openNew}
          style={{ display: "flex", alignItems: "center", gap: 6, background: "#1A1917", color: "#fff", border: "none", borderRadius: 8, padding: "10px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
          <Icon name="plus" size={14} color="#fff" /> 사례 추가
        </button>
      </div>

      {/* 통계 카드 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 18 }}>
        <div style={{ background: "#fff", border: "1px solid #E8E5E0", borderRadius: 10, padding: "14px 18px" }}>
          <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>전체 사례</div>
          <div style={{ fontSize: 22, fontWeight: 800 }}>{stats.total}건</div>
        </div>
        <div style={{ background: "#fff", border: "1px solid #E8E5E0", borderRadius: 10, padding: "14px 18px" }}>
          <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>승인</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#15803D" }}>{stats.approved}건</div>
        </div>
        <div style={{ background: "#fff", border: "1px solid #E8E5E0", borderRadius: 10, padding: "14px 18px" }}>
          <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>부결/반려</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#B91C1C" }}>{stats.rejected}건</div>
        </div>
        <div style={{ background: "#fff", border: "1px solid #E8E5E0", borderRadius: 10, padding: "14px 18px" }}>
          <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>승인율</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#4338CA" }}>{stats.rate}%</div>
        </div>
      </div>

      {/* 검색 + 필터 */}
      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
        <input type="text" value={search} onChange={function(e) { setSearch(e.target.value); }} placeholder="🔍 회사명, 이슈, 해결방법, 태그..."
          style={{ flex: 1, minWidth: 220, padding: "10px 14px", border: "1px solid #E8E5E0", borderRadius: 8, fontSize: 13, outline: "none" }} />
        <select value={filterAgency} onChange={function(e) { setFilterAgency(e.target.value); }} style={{ padding: "10px 14px", border: "1px solid #E8E5E0", borderRadius: 8, fontSize: 13, background: "#fff" }}>
          {agencyOpts.map(function(o) { return <option key={o} value={o}>기관: {o}</option>; })}
        </select>
        <select value={filterResult} onChange={function(e) { setFilterResult(e.target.value); }} style={{ padding: "10px 14px", border: "1px solid #E8E5E0", borderRadius: 8, fontSize: 13, background: "#fff" }}>
          {resultOpts.map(function(o) { return <option key={o} value={o}>결과: {o}</option>; })}
        </select>
        <select value={filterIndustry} onChange={function(e) { setFilterIndustry(e.target.value); }} style={{ padding: "10px 14px", border: "1px solid #E8E5E0", borderRadius: 8, fontSize: 13, background: "#fff" }}>
          {industryOpts.map(function(o) { return <option key={o} value={o}>업종: {o}</option>; })}
        </select>
      </div>

      {/* 사례 카드 목록 */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: "#AAA" }}>불러오는 중...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, color: "#AAA", background: "#fff", borderRadius: 10, border: "1px solid #E8E5E0" }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>📚</div>
          {cases.length === 0 ? "아직 등록된 사례가 없어요. 우측 상단 [사례 추가] 버튼을 눌러보세요." : "검색 결과가 없어요."}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: 12 }}>
          {filtered.map(function(c) {
            var rc = resultColor(c.result);
            return (
              <div key={c.id} onClick={function() { openEdit(c); }}
                style={{ background: "#fff", borderRadius: 10, border: "1px solid #E8E5E0", padding: "16px 18px", cursor: "pointer", transition: "all 0.15s" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{c.business_name}</div>
                    <div style={{ fontSize: 11, color: "#888" }}>{c.agency_group || "-"} · {c.product || "-"}</div>
                  </div>
                  {c.result && (
                    <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 99, background: rc.bg, color: rc.color, whiteSpace: "nowrap" }}>{c.result}</span>
                  )}
                </div>
                <div style={{ display: "flex", gap: 14, fontSize: 11, color: "#666", marginBottom: 10, flexWrap: "wrap" }}>
                  {c.industry && <span>🏭 {c.industry}</span>}
                  {c.region && <span>📍 {c.region}</span>}
                  {c.applied_amount && <span>💰 신청 {formatAmt(c.applied_amount)}</span>}
                  {c.approved_amount && <span style={{ color: "#15803D", fontWeight: 600 }}>승인 {formatAmt(c.approved_amount)}</span>}
                </div>
                {c.initial_issue && (
                  <div style={{ fontSize: 12, color: "#92400E", background: "#FFF7ED", borderRadius: 6, padding: "8px 12px", marginBottom: 6, lineHeight: 1.5 }}>
                    <strong>이슈:</strong> {c.initial_issue.length > 80 ? c.initial_issue.slice(0, 80) + "..." : c.initial_issue}
                  </div>
                )}
                {c.key_point && (
                  <div style={{ fontSize: 12, color: "#15803D", background: "#DCFCE7", borderRadius: 6, padding: "8px 12px", marginBottom: 6, lineHeight: 1.5 }}>
                    <strong>포인트:</strong> {c.key_point.length > 80 ? c.key_point.slice(0, 80) + "..." : c.key_point}
                  </div>
                )}
                {c.tags && c.tags.length > 0 && (
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 8 }}>
                    {c.tags.map(function(t, i) {
                      return <span key={i} style={{ fontSize: 10, color: "#666", background: "#F3F4F6", padding: "2px 8px", borderRadius: 99 }}>#{t}</span>;
                    })}
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10, paddingTop: 8, borderTop: "1px solid #F3F4F6" }}>
                  <span style={{ fontSize: 10, color: "#AAA" }}>{c.created_by || "-"} · {c.created_at ? new Date(c.created_at).toLocaleDateString("ko-KR") : ""}</span>
                  <button onClick={function(e) { e.stopPropagation(); deleteCase(c.id); }} title="삭제"
                    style={{ background: "none", border: "none", cursor: "pointer", color: "#CC4444", fontSize: 12 }}>🗑</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 사례 추가/수정 폼 모달 */}
      {showForm && editingCase && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div onClick={function(e) { e.stopPropagation(); }}
            style={{ background: "#fff", borderRadius: 12, width: "100%", maxWidth: 700, maxHeight: "90vh", overflowY: "auto", padding: 24 }}>
            <h2 style={{ margin: 0, marginBottom: 20, fontSize: 18, fontWeight: 700 }}>{editingCase.id ? "사례 수정" : "사례 추가"}</h2>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              <div style={{ position: "relative" }}>
                <label style={{ fontSize: 11, color: "#888", display: "block", marginBottom: 4 }}>
                  회사명 * <span style={{ color: "#4338CA", fontWeight: 400, marginLeft: 4, fontSize: 10 }}>(기업목록 {companiesList.length}개 자동완성)</span>
                </label>
                <input type="text" value={editingCase.business_name || ""}
                  onChange={function(e) { onBusinessNameChange(e.target.value); }}
                  onBlur={function() { setTimeout(function() { setCompanySuggestions([]); }, 200); }}
                  placeholder="회사명 입력 (목록에 없어도 직접 입력 가능)"
                  style={{ width: "100%", padding: "8px 12px", border: "1px solid #E8E5E0", borderRadius: 6, fontSize: 13, boxSizing: "border-box", outline: "none" }} />
                {companySuggestions.length > 0 && (
                  <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#fff", border: "1px solid #E8E5E0", borderRadius: 6, marginTop: 2, maxHeight: 200, overflowY: "auto", zIndex: 10, boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}>
                    {companySuggestions.map(function(co, i) {
                      return (
                        <div key={i} onMouseDown={function(e) { e.preventDefault(); selectCompany(co); }}
                          style={{ padding: "8px 12px", cursor: "pointer", borderBottom: i < companySuggestions.length - 1 ? "1px solid #F7F6F3" : "none", fontSize: 12 }}
                          onMouseEnter={function(e) { e.currentTarget.style.background = "#F7F6F3"; }}
                          onMouseLeave={function(e) { e.currentTarget.style.background = "#fff"; }}>
                          <div style={{ fontWeight: 600 }}>{co.name}</div>
                          <div style={{ fontSize: 10, color: "#888", marginTop: 2 }}>{co.representative || "-"} · {co.industry || "-"} · {co.region || "-"}</div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              <div>
                <label style={{ fontSize: 11, color: "#888", display: "block", marginBottom: 4 }}>기관</label>
                <select value={editingCase.agency_group || ""} onChange={function(e) {
                  var v = e.target.value;
                  setEditingCase(function(p) {
                    // 기관 바뀌면 상품 초기화 (다른 기관 상품이 남아있으면 안 되므로)
                    return Object.assign({}, p, { agency_group: v, product: "" });
                  });
                }}
                  style={{ width: "100%", padding: "8px 12px", border: "1px solid #E8E5E0", borderRadius: 6, fontSize: 13, boxSizing: "border-box", background: "#fff" }}>
                  <option value="">선택...</option>
                  {agencyOpts.slice(1).map(function(o) { return <option key={o} value={o}>{o}</option>; })}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, color: "#888", display: "block", marginBottom: 4 }}>
                  신청 상품
                  {getProductOptions(editingCase.agency_group) && <span style={{ color: "#4338CA", fontWeight: 400, marginLeft: 4, fontSize: 10 }}>(목록에서 선택 또는 직접 입력)</span>}
                </label>
                {getProductOptions(editingCase.agency_group) ? (
                  <>
                    <select value={getProductOptions(editingCase.agency_group).indexOf(editingCase.product) >= 0 ? editingCase.product : ""}
                      onChange={function(e) { var v = e.target.value; setEditingCase(function(p) { return Object.assign({}, p, { product: v }); }); }}
                      style={{ width: "100%", padding: "8px 12px", border: "1px solid #E8E5E0", borderRadius: 6, fontSize: 13, boxSizing: "border-box", background: "#fff", marginBottom: 4 }}>
                      <option value="">선택...</option>
                      {getProductOptions(editingCase.agency_group).map(function(o) { return <option key={o} value={o}>{o}</option>; })}
                    </select>
                    <input type="text" value={editingCase.product || ""} onChange={function(e) { var v = e.target.value; setEditingCase(function(p) { return Object.assign({}, p, { product: v }); }); }} placeholder="또는 직접 입력"
                      style={{ width: "100%", padding: "6px 12px", border: "1px solid #E8E5E0", borderRadius: 6, fontSize: 12, boxSizing: "border-box", outline: "none", color: "#666" }} />
                  </>
                ) : (
                  <input type="text" value={editingCase.product || ""} onChange={function(e) { var v = e.target.value; setEditingCase(function(p) { return Object.assign({}, p, { product: v }); }); }} placeholder="상품명 직접 입력"
                    style={{ width: "100%", padding: "8px 12px", border: "1px solid #E8E5E0", borderRadius: 6, fontSize: 13, boxSizing: "border-box", outline: "none" }} />
                )}
              </div>
              <div>
                <label style={{ fontSize: 11, color: "#888", display: "block", marginBottom: 4 }}>결과</label>
                <select value={editingCase.result || ""} onChange={function(e) { var v = e.target.value; setEditingCase(function(p) { return Object.assign({}, p, { result: v }); }); }}
                  style={{ width: "100%", padding: "8px 12px", border: "1px solid #E8E5E0", borderRadius: 6, fontSize: 13, boxSizing: "border-box", background: "#fff" }}>
                  <option value="">선택...</option>
                  {resultOpts.slice(1).map(function(o) { return <option key={o} value={o}>{o}</option>; })}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, color: "#888", display: "block", marginBottom: 4 }}>신청금 (원)</label>
                <input type="text" value={editingCase.applied_amount || ""} onChange={function(e) { var v = e.target.value; setEditingCase(function(p) { return Object.assign({}, p, { applied_amount: v }); }); }} placeholder="예: 50000000"
                  style={{ width: "100%", padding: "8px 12px", border: "1px solid #E8E5E0", borderRadius: 6, fontSize: 13, boxSizing: "border-box", outline: "none" }} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: "#888", display: "block", marginBottom: 4 }}>승인금 (원)</label>
                <input type="text" value={editingCase.approved_amount || ""} onChange={function(e) { var v = e.target.value; setEditingCase(function(p) { return Object.assign({}, p, { approved_amount: v }); }); }} placeholder="예: 30000000"
                  style={{ width: "100%", padding: "8px 12px", border: "1px solid #E8E5E0", borderRadius: 6, fontSize: 13, boxSizing: "border-box", outline: "none" }} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: "#888", display: "block", marginBottom: 4 }}>업종</label>
                <input type="text" value={editingCase.industry || ""} onChange={function(e) { var v = e.target.value; setEditingCase(function(p) { return Object.assign({}, p, { industry: v }); }); }} placeholder="예: 제조업, 서비스업"
                  style={{ width: "100%", padding: "8px 12px", border: "1px solid #E8E5E0", borderRadius: 6, fontSize: 13, boxSizing: "border-box", outline: "none" }} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: "#888", display: "block", marginBottom: 4 }}>지역</label>
                <input type="text" value={editingCase.region || ""} onChange={function(e) { var v = e.target.value; setEditingCase(function(p) { return Object.assign({}, p, { region: v }); }); }} placeholder="예: 서울, 경기"
                  style={{ width: "100%", padding: "8px 12px", border: "1px solid #E8E5E0", borderRadius: 6, fontSize: 13, boxSizing: "border-box", outline: "none" }} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: "#888", display: "block", marginBottom: 4 }}>법인/개인</label>
                <select value={editingCase.business_type || "법인"} onChange={function(e) { var v = e.target.value; setEditingCase(function(p) { return Object.assign({}, p, { business_type: v }); }); }}
                  style={{ width: "100%", padding: "8px 12px", border: "1px solid #E8E5E0", borderRadius: 6, fontSize: 13, boxSizing: "border-box", background: "#fff" }}>
                  <option value="법인">법인</option>
                  <option value="개인">개인사업자</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, color: "#888", display: "block", marginBottom: 4 }}>업력 (년)</label>
                <input type="number" value={editingCase.business_years || ""} onChange={function(e) { var v = e.target.value; setEditingCase(function(p) { return Object.assign({}, p, { business_years: v }); }); }} placeholder="예: 5"
                  style={{ width: "100%", padding: "8px 12px", border: "1px solid #E8E5E0", borderRadius: 6, fontSize: 13, boxSizing: "border-box", outline: "none" }} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: "#888", display: "block", marginBottom: 4 }}>매출 구간</label>
                <select value={editingCase.revenue_range || ""} onChange={function(e) { var v = e.target.value; setEditingCase(function(p) { return Object.assign({}, p, { revenue_range: v }); }); }}
                  style={{ width: "100%", padding: "8px 12px", border: "1px solid #E8E5E0", borderRadius: 6, fontSize: 13, boxSizing: "border-box", background: "#fff" }}>
                  <option value="">선택...</option>
                  <option>1억 이하</option>
                  <option>1~5억</option>
                  <option>5~10억</option>
                  <option>10~30억</option>
                  <option>30~50억</option>
                  <option>50~100억</option>
                  <option>100억 이상</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, color: "#888", display: "block", marginBottom: 4 }}>신용점수 구간</label>
                <select value={editingCase.credit_score_range || ""} onChange={function(e) { var v = e.target.value; setEditingCase(function(p) { return Object.assign({}, p, { credit_score_range: v }); }); }}
                  style={{ width: "100%", padding: "8px 12px", border: "1px solid #E8E5E0", borderRadius: 6, fontSize: 13, boxSizing: "border-box", background: "#fff" }}>
                  <option value="">선택...</option>
                  <option>600 이하</option>
                  <option>600~650</option>
                  <option>650~700</option>
                  <option>700~750</option>
                  <option>750~800</option>
                  <option>800 이상</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, color: "#888", display: "block", marginBottom: 4 }}>신청일</label>
                <input type="date" value={editingCase.applied_at || ""} onChange={function(e) { var v = e.target.value; setEditingCase(function(p) { return Object.assign({}, p, { applied_at: v }); }); }}
                  style={{ width: "100%", padding: "8px 12px", border: "1px solid #E8E5E0", borderRadius: 6, fontSize: 13, boxSizing: "border-box", outline: "none" }} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: "#888", display: "block", marginBottom: 4 }}>결과일</label>
                <input type="date" value={editingCase.result_at || ""} onChange={function(e) { var v = e.target.value; setEditingCase(function(p) { return Object.assign({}, p, { result_at: v }); }); }}
                  style={{ width: "100%", padding: "8px 12px", border: "1px solid #E8E5E0", borderRadius: 6, fontSize: 13, boxSizing: "border-box", outline: "none" }} />
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11, color: "#888", display: "block", marginBottom: 4 }}>📍 처음 진단했던 이슈</label>
              <textarea value={editingCase.initial_issue || ""} onChange={function(e) { var v = e.target.value; setEditingCase(function(p) { return Object.assign({}, p, { initial_issue: v }); }); }} placeholder="예) 신용점수 685점, 매출 감소 추세, 부채비율 높음..."
                style={{ width: "100%", padding: "10px 12px", border: "1px solid #FED7AA", borderRadius: 6, fontSize: 13, lineHeight: 1.7, resize: "vertical", minHeight: 80, background: "#FFF7ED", boxSizing: "border-box", outline: "none", whiteSpace: "pre-wrap", fontFamily: "inherit" }} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11, color: "#888", display: "block", marginBottom: 4 }}>🔧 어떻게 해결/대응했는지</label>
              <textarea value={editingCase.resolution || ""} onChange={function(e) { var v = e.target.value; setEditingCase(function(p) { return Object.assign({}, p, { resolution: v }); }); }} placeholder="예) 재무제표 재정리, 보완서류 추가 제출, 대표자 신용 개선 안내..."
                style={{ width: "100%", padding: "10px 12px", border: "1px solid #E8E5E0", borderRadius: 6, fontSize: 13, lineHeight: 1.7, resize: "vertical", minHeight: 80, boxSizing: "border-box", outline: "none", whiteSpace: "pre-wrap", fontFamily: "inherit" }} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11, color: "#888", display: "block", marginBottom: 4 }}>⭐ 결정적 포인트 (승인/거절의 핵심)</label>
              <textarea value={editingCase.key_point || ""} onChange={function(e) { var v = e.target.value; setEditingCase(function(p) { return Object.assign({}, p, { key_point: v }); }); }} placeholder="예) 현장방문에서 사업장 평가 좋음 / 추가 매출 자료 제출이 결정적..."
                style={{ width: "100%", padding: "10px 12px", border: "1px solid #86EFAC", borderRadius: 6, fontSize: 13, lineHeight: 1.7, resize: "vertical", minHeight: 80, background: "#F0FDF4", boxSizing: "border-box", outline: "none", whiteSpace: "pre-wrap", fontFamily: "inherit" }} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11, color: "#888", display: "block", marginBottom: 4 }}>결과 사유 (한 줄)</label>
              <input type="text" value={editingCase.result_reason || ""} onChange={function(e) { var v = e.target.value; setEditingCase(function(p) { return Object.assign({}, p, { result_reason: v }); }); }} placeholder="예) 매출 안정성 및 사업 계획 우수"
                style={{ width: "100%", padding: "8px 12px", border: "1px solid #E8E5E0", borderRadius: 6, fontSize: 13, boxSizing: "border-box", outline: "none" }} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11, color: "#888", display: "block", marginBottom: 4 }}>태그 (쉼표로 구분)</label>
              <input type="text" value={(editingCase.tags || []).join(", ")} onChange={function(e) { var v = e.target.value; var arr = v.split(",").map(function(s) { return s.trim().replace(/^#/, ""); }).filter(function(s) { return s; }); setEditingCase(function(p) { return Object.assign({}, p, { tags: arr }); }); }} placeholder="예: 매출감소, 신용보완, 재신청"
                style={{ width: "100%", padding: "8px 12px", border: "1px solid #E8E5E0", borderRadius: 6, fontSize: 13, boxSizing: "border-box", outline: "none" }} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 11, color: "#888", display: "block", marginBottom: 4 }}>📝 블로그용 메모 (나중에 활용)</label>
              <textarea value={editingCase.blog_memo || ""} onChange={function(e) { var v = e.target.value; setEditingCase(function(p) { return Object.assign({}, p, { blog_memo: v }); }); }} placeholder="블로그 글로 쓸 만한 포인트, 익명화한 스토리 등..."
                style={{ width: "100%", padding: "10px 12px", border: "1px solid #E8E5E0", borderRadius: 6, fontSize: 13, lineHeight: 1.7, resize: "vertical", minHeight: 80, boxSizing: "border-box", outline: "none", whiteSpace: "pre-wrap", fontFamily: "inherit" }} />
            </div>

            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button onClick={function() { setShowForm(false); }}
                style={{ padding: "10px 18px", background: "#fff", border: "1px solid #E8E5E0", borderRadius: 8, fontSize: 13, cursor: "pointer" }}>취소</button>
              <button onClick={saveCase}
                style={{ padding: "10px 18px", background: "#1A1917", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>저장</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ========== 🔍 통합 검색 (Ctrl+K) ==========
function GlobalSearchModal({ companies, query, setQuery, onClose, onSelectCompany, onNavigate }) {
  const [notes, setNotes] = useState([]);
  const [cases, setCases] = useState([]);
  const [approvalCases, setApprovalCases] = useState([]);
  const [agencyCases, setAgencyCases] = useState([]);
  const inputRef = useRef(null);

  // 최초 진입 시 포커스 + 데이터 로딩
  useEffect(function() {
    if (inputRef.current) inputRef.current.focus();
    (async function() {
      var nRes = await supabase.from("work_notes").select("id,title,content,assignee").is("deleted_at", null).limit(200);
      if (!nRes.error) setNotes(nRes.data || []);
      var aRes = await supabase.from("agency_cases").select("id,business_name,representative,agency_group,assignee,month,year,status,notes").is("deleted_at", null).limit(500);
      if (!aRes.error) setAgencyCases(aRes.data || []);
      var pRes = await supabase.from("approval_cases").select("id,business_name,agency_group,product,result,initial_issue,resolution,key_point,tags").is("deleted_at", null).limit(200);
      if (!pRes.error) setApprovalCases(pRes.data || []);
    })();
  }, []);

  var q = (query || "").toLowerCase().trim();

  // 회사 매칭
  var matchedCompanies = useMemo(function() {
    if (!q) return [];
    return (companies || []).filter(function(c) {
      var hay = [c.name, c.representative, c.business_number, c.assignee, c.issue, c.next_action, c.region, c.industry, c.stage].join(" ").toLowerCase();
      return hay.indexOf(q) >= 0;
    }).slice(0, 8);
  }, [companies, q]);

  // 노트 매칭
  var matchedNotes = useMemo(function() {
    if (!q) return [];
    return notes.filter(function(n) {
      var hay = [n.title || "", n.content || "", n.assignee || ""].join(" ").toLowerCase();
      return hay.indexOf(q) >= 0;
    }).slice(0, 5);
  }, [notes, q]);

  // 기관별 매칭
  var matchedAgency = useMemo(function() {
    if (!q) return [];
    return agencyCases.filter(function(c) {
      var hay = [c.business_name || "", c.representative || "", c.agency_group || "", c.assignee || "", c.notes || ""].join(" ").toLowerCase();
      return hay.indexOf(q) >= 0;
    }).slice(0, 5);
  }, [agencyCases, q]);

  // 사례집 매칭
  var matchedApprovalCases = useMemo(function() {
    if (!q) return [];
    return approvalCases.filter(function(c) {
      var hay = [c.business_name || "", c.agency_group || "", c.product || "", c.result || "", c.initial_issue || "", c.resolution || "", c.key_point || "", (c.tags || []).join(" ")].join(" ").toLowerCase();
      return hay.indexOf(q) >= 0;
    }).slice(0, 5);
  }, [approvalCases, q]);

  var totalCount = matchedCompanies.length + matchedNotes.length + matchedAgency.length + matchedApprovalCases.length;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 2000, display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: 80 }} onClick={onClose}>
      <div onClick={function(e) { e.stopPropagation(); }}
        style={{ background: "#fff", borderRadius: 12, width: "100%", maxWidth: 640, maxHeight: "70vh", display: "flex", flexDirection: "column", boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }}>
        {/* 검색창 */}
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #E8E5E0", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 18, color: "#888" }}>🔍</span>
          <input ref={inputRef} type="text" value={query} onChange={function(e) { setQuery(e.target.value); }} placeholder="회사명, 이슈, 메모, 사례... 통합 검색"
            style={{ flex: 1, border: "none", fontSize: 15, outline: "none", padding: "4px 0" }} />
          <span style={{ fontSize: 11, color: "#AAA", border: "1px solid #E8E5E0", borderRadius: 4, padding: "2px 6px" }}>ESC</span>
        </div>

        {/* 결과 영역 */}
        <div style={{ overflowY: "auto", flex: 1, padding: q ? "8px 0" : "20px" }}>
          {!q ? (
            <div style={{ color: "#888", fontSize: 13 }}>
              <div style={{ marginBottom: 14 }}>💡 검색 가능한 항목</div>
              <ul style={{ paddingLeft: 18, lineHeight: 1.9, fontSize: 12 }}>
                <li>회사명, 대표자명, 사업자번호</li>
                <li>현재 이슈, 차기 업무</li>
                <li>업무 노트 (제목, 내용)</li>
                <li>기관별 진행건</li>
                <li>사례집 (이슈, 해결방법, 태그)</li>
              </ul>
              <div style={{ marginTop: 14, fontSize: 11, color: "#AAA" }}>⌨️ 단축키 <strong>Ctrl + K</strong> 로 언제든 검색 가능</div>
            </div>
          ) : totalCount === 0 ? (
            <div style={{ textAlign: "center", padding: 40, color: "#AAA", fontSize: 13 }}>
              '{query}' 에 대한 결과가 없어요.
            </div>
          ) : (
            <>
              {matchedCompanies.length > 0 && (
                <div style={{ marginBottom: 8 }}>
                  <div style={{ padding: "6px 20px", fontSize: 10, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: 0.5 }}>기업 ({matchedCompanies.length})</div>
                  {matchedCompanies.map(function(c) {
                    return (
                      <div key={c.id} onClick={function() { onSelectCompany(c); }}
                        style={{ padding: "10px 20px", cursor: "pointer", borderBottom: "1px solid #F7F6F3" }}
                        onMouseEnter={function(e) { e.currentTarget.style.background = "#F7F6F3"; }}
                        onMouseLeave={function(e) { e.currentTarget.style.background = "transparent"; }}>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{c.name} <span style={{ color: "#888", fontWeight: 400 }}>· {c.representative || "-"}</span></div>
                        <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>{c.stage || "-"} · {c.assignee || "-"} · {c.region || "-"}</div>
                      </div>
                    );
                  })}
                </div>
              )}
              {matchedAgency.length > 0 && (
                <div style={{ marginBottom: 8 }}>
                  <div style={{ padding: "6px 20px", fontSize: 10, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: 0.5 }}>기관별 진행 ({matchedAgency.length})</div>
                  {matchedAgency.map(function(c) {
                    return (
                      <div key={c.id} onClick={function() { onNavigate("agency"); }}
                        style={{ padding: "10px 20px", cursor: "pointer", borderBottom: "1px solid #F7F6F3" }}
                        onMouseEnter={function(e) { e.currentTarget.style.background = "#F7F6F3"; }}
                        onMouseLeave={function(e) { e.currentTarget.style.background = "transparent"; }}>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{c.business_name}</div>
                        <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>{c.agency_group} · {c.year}년 {c.month}월 · {c.status || "-"} · {c.assignee || "-"}</div>
                      </div>
                    );
                  })}
                </div>
              )}
              {matchedNotes.length > 0 && (
                <div style={{ marginBottom: 8 }}>
                  <div style={{ padding: "6px 20px", fontSize: 10, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: 0.5 }}>업무 노트 ({matchedNotes.length})</div>
                  {matchedNotes.map(function(n) {
                    return (
                      <div key={n.id} onClick={function() { onNavigate("worknotes"); }}
                        style={{ padding: "10px 20px", cursor: "pointer", borderBottom: "1px solid #F7F6F3" }}
                        onMouseEnter={function(e) { e.currentTarget.style.background = "#F7F6F3"; }}
                        onMouseLeave={function(e) { e.currentTarget.style.background = "transparent"; }}>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{n.title || "(제목 없음)"}</div>
                        <div style={{ fontSize: 11, color: "#888", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{(n.content || "").slice(0, 80)} · {n.assignee || "-"}</div>
                      </div>
                    );
                  })}
                </div>
              )}
              {matchedApprovalCases.length > 0 && (
                <div style={{ marginBottom: 8 }}>
                  <div style={{ padding: "6px 20px", fontSize: 10, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: 0.5 }}>사례집 ({matchedApprovalCases.length})</div>
                  {matchedApprovalCases.map(function(c) {
                    return (
                      <div key={c.id} onClick={function() { onNavigate("cases"); }}
                        style={{ padding: "10px 20px", cursor: "pointer", borderBottom: "1px solid #F7F6F3" }}
                        onMouseEnter={function(e) { e.currentTarget.style.background = "#F7F6F3"; }}
                        onMouseLeave={function(e) { e.currentTarget.style.background = "transparent"; }}>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{c.business_name} <span style={{ color: "#888", fontWeight: 400 }}>· {c.result || "-"}</span></div>
                        <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>{c.agency_group || "-"} · {c.product || "-"}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ========== 🕒 오늘 활동 내역 피드 (Dashboard용) ==========
// activity_logs(소통내역·이슈·다음액션·단계/담당자 변경)에서 '오늘(KST)' 기록을 업체별로 모아 보여준다.
function TodayActivityFeed({ companies, onSelectCompany }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(function() { fetchToday(); }, []);

  var fetchToday = async function() {
    setLoading(true);
    // 오늘 00:00(KST)을 UTC ISO로 변환 → created_at 비교 기준
    var now = new Date();
    var kst = new Date(now.getTime() + 9 * 3600000);
    var kstMidnightUtcMs = Date.UTC(kst.getUTCFullYear(), kst.getUTCMonth(), kst.getUTCDate()) - 9 * 3600000;
    var sinceStr = new Date(kstMidnightUtcMs).toISOString();
    var r = await supabase.from("activity_logs")
      .select("business_name, company_id, log_type, memo, logged_by, assignee, created_at")
      .gte("created_at", sinceStr)
      .order("created_at", { ascending: false });
    if (!r.error) setLogs(r.data || []);
    setLoading(false);
  };

  // log_type → 한글 라벨 (소통내역/이슈/다음액션 등)
  var LOG_LABEL = {
    manual_memo: "소통내역",
    issue_update: "이슈",
    action_update: "다음액션",
    stage_change: "진행단계",
    assignee_change: "담당자",
  };
  var FIELD_COLOR = {
    소통내역: { bg: "#EEF2FF", c: "#4338CA" },
    이슈: { bg: "#FEF2F2", c: "#DC2626" },
    다음액션: { bg: "#F0FDF4", c: "#15803D" },
    진행단계: { bg: "#FFF7ED", c: "#C2410C" },
    담당자: { bg: "#F5F3FF", c: "#7C3AED" },
  };

  var fmtTime = function(iso) {
    var d = new Date(iso);
    var k = new Date(d.getTime() + 9 * 3600000);
    var hh = String(k.getUTCHours()).padStart(2, "0");
    var mm = String(k.getUTCMinutes()).padStart(2, "0");
    return hh + ":" + mm;
  };

  // 업체별 그룹핑 (사업자명 기준 — 모든 log_type에 공통 존재)
  var grouped = useMemo(function() {
    var map = {};
    (logs || []).forEach(function(l) {
      var label = LOG_LABEL[l.log_type];
      if (!label) return; // 알 수 없는 유형은 제외
      var key = l.business_name || (l.company_id ? "__" + l.company_id : null);
      if (!key) return;
      if (!map[key]) map[key] = { name: l.business_name || "(이름없음)", company_id: l.company_id || null, fields: {}, latest: l.created_at, latestMemo: l.memo || "", by: l.logged_by || l.assignee || "" };
      var g = map[key];
      g.fields[label] = (g.fields[label] || 0) + 1;
      if (l.created_at > g.latest) { g.latest = l.created_at; g.latestMemo = l.memo || g.latestMemo; g.by = l.logged_by || l.assignee || g.by; }
      if (!g.company_id && l.company_id) g.company_id = l.company_id;
    });
    return Object.keys(map).map(function(k) { return map[k]; })
      .sort(function(a, b) { return a.latest < b.latest ? 1 : -1; });
  }, [logs]);

  var openCompany = function(g) {
    if (!companies || !onSelectCompany) return;
    var co = companies.find(function(c) { return (g.company_id && c.id === g.company_id) || c.name === g.name; });
    if (co) onSelectCompany(co);
  };

  return (
    <div style={{ background: "#fff", borderRadius: 12, padding: "20px 24px", border: "1px solid #E8E5E0", marginBottom: 18 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <span style={{ fontSize: 16 }}>🕒</span>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#1A1917" }}>오늘 활동 내역 <span style={{ color: "#999", fontWeight: 600 }}>{grouped.length}개 업체</span></div>
        <span style={{ fontSize: 11, color: "#888" }}>소통내역·이슈·다음액션 변경 기준</span>
      </div>
      {loading ? (
        <div style={{ textAlign: "center", color: "#888", fontSize: 13, padding: "20px 0" }}>불러오는 중…</div>
      ) : grouped.length === 0 ? (
        <div style={{ textAlign: "center", color: "#888", fontSize: 13, padding: "20px 0" }}>오늘 변경된 업체가 없습니다</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {grouped.map(function(g, i) {
            return (
              <div key={i} onClick={function() { openCompany(g); }}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", background: "#F7F6F3", borderRadius: 8, cursor: "pointer" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#1A1917" }}>{g.name}</span>
                    {Object.keys(g.fields).map(function(f) {
                      var col = FIELD_COLOR[f] || { bg: "#EEE", c: "#666" };
                      return <span key={f} style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 99, background: col.bg, color: col.c }}>{f}{g.fields[f] > 1 ? " " + g.fields[f] : ""}</span>;
                    })}
                  </div>
                  {g.latestMemo && <div style={{ fontSize: 12, color: "#888", marginTop: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{g.latestMemo}</div>}
                </div>
                {g.by && <span style={{ fontSize: 11, color: "#999", flexShrink: 0 }}>{g.by}</span>}
                <span style={{ fontSize: 11, color: "#888", flexShrink: 0, fontVariantNumeric: "tabular-nums" }}>{fmtTime(g.latest)}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ========== 👥 직원 활동 위젯 (Dashboard용) ==========
function TeamActivityWidget({ profiles }) {
  const [activity, setActivity] = useState({});
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState("week"); // "week" | "month"

  useEffect(function() {
    fetchActivity();
  }, [range]);

  var fetchActivity = async function() {
    setLoading(true);
    var now = new Date();
    var since;
    if (range === "week") {
      since = new Date(now.getTime() - 7 * 86400000);
    } else {
      since = new Date(now.getFullYear(), now.getMonth(), 1);
    }
    var sinceStr = since.toISOString();

    // 병렬 fetch
    var [notesRes, agencyRes, logsRes, approvalRes] = await Promise.all([
      supabase.from("work_notes").select("assignee,created_at,updated_at").is("deleted_at", null).gte("updated_at", sinceStr),
      supabase.from("agency_cases").select("assignee,status,updated_at").is("deleted_at", null).gte("updated_at", sinceStr),
      supabase.from("activity_logs").select("assignee,logged_by,created_at").gte("created_at", sinceStr),
      supabase.from("approval_cases").select("created_by,created_at,result").is("deleted_at", null).gte("created_at", sinceStr),
    ]);

    var data = {};
    var ensure = function(name) {
      if (!data[name]) data[name] = { notes: 0, agencyUpdates: 0, agencyApproved: 0, logs: 0, cases: 0, lastActive: null };
      return data[name];
    };

    if (!notesRes.error && notesRes.data) {
      notesRes.data.forEach(function(n) {
        if (!n.assignee) return;
        var d = ensure(n.assignee);
        d.notes++;
        if (!d.lastActive || n.updated_at > d.lastActive) d.lastActive = n.updated_at;
      });
    }
    if (!agencyRes.error && agencyRes.data) {
      agencyRes.data.forEach(function(c) {
        if (!c.assignee) return;
        var d = ensure(c.assignee);
        d.agencyUpdates++;
        if (DONE_STATUSES.indexOf(c.status) >= 0) d.agencyApproved++;
        if (!d.lastActive || c.updated_at > d.lastActive) d.lastActive = c.updated_at;
      });
    }
    if (!logsRes.error && logsRes.data) {
      logsRes.data.forEach(function(l) {
        var name = l.assignee || l.logged_by;
        if (!name) return;
        var d = ensure(name);
        d.logs++;
        if (!d.lastActive || l.created_at > d.lastActive) d.lastActive = l.created_at;
      });
    }
    if (!approvalRes.error && approvalRes.data) {
      approvalRes.data.forEach(function(c) {
        if (!c.created_by) return;
        var d = ensure(c.created_by);
        d.cases++;
        if (!d.lastActive || c.created_at > d.lastActive) d.lastActive = c.created_at;
      });
    }

    setActivity(data);
    setLoading(false);
  };

  // 정렬: 합산 활동 많은 순
  var sorted = useMemo(function() {
    var entries = Object.keys(activity).map(function(name) {
      var d = activity[name];
      var total = d.notes + d.agencyUpdates + d.logs + d.cases;
      return { name: name, ...d, total: total };
    });
    return entries.sort(function(a, b) { return b.total - a.total; });
  }, [activity]);

  // 직원 9명만 표시 (양호님 회사 직원 목록)
  var TEAM_MEMBERS = ["유진", "미현", "정원", "관호", "인선", "현애", "지혜", "동일", "양호"];

  // 이름 별칭 - 다양하게 입력된 표기를 표준 이름으로 매핑
  // (예: "최지혜" → "지혜", "김동일이사" → "동일", "김현애" → "현애")
  var resolveTeamMember = function(rawName) {
    if (!rawName) return [];
    var s = String(rawName);
    var matched = [];
    // 콤마/슬래시/공백으로 분리해서 조합 이름 처리 (예: "양호, 관호" → ["양호", "관호"])
    var parts = s.split(/[,/\s]+/).map(function(p) { return p.trim(); }).filter(function(p) { return p; });
    parts.forEach(function(part) {
      TEAM_MEMBERS.forEach(function(member) {
        // 정확 일치 또는 포함 (예: "김동일이사"에는 "동일" 포함)
        if (part === member || part.indexOf(member) >= 0) {
          if (matched.indexOf(member) < 0) matched.push(member);
        }
      });
    });
    return matched;
  };

  // 활동 집계를 9명 표준 이름 기준으로 다시 합산
  var consolidated = useMemo(function() {
    var data = {};
    TEAM_MEMBERS.forEach(function(m) {
      data[m] = { name: m, notes: 0, agencyUpdates: 0, agencyApproved: 0, logs: 0, cases: 0, lastActive: null };
    });
    Object.keys(activity).forEach(function(rawName) {
      var members = resolveTeamMember(rawName);
      var src = activity[rawName];
      members.forEach(function(m) {
        var d = data[m];
        d.notes += src.notes;
        d.agencyUpdates += src.agencyUpdates;
        d.agencyApproved += src.agencyApproved;
        d.logs += src.logs;
        d.cases += src.cases;
        if (src.lastActive && (!d.lastActive || src.lastActive > d.lastActive)) {
          d.lastActive = src.lastActive;
        }
      });
    });
    return data;
  }, [activity]);

  var displayList = useMemo(function() {
    var list = TEAM_MEMBERS.map(function(name) {
      var d = consolidated[name];
      var total = d.notes + d.agencyUpdates + d.logs + d.cases;
      return Object.assign({}, d, { total: total });
    });
    return list.sort(function(a, b) { return b.total - a.total; });
  }, [consolidated]);

  var relativeTime = function(iso) {
    if (!iso) return "활동 없음";
    var diff = Date.now() - new Date(iso).getTime();
    var mins = Math.floor(diff / 60000);
    if (mins < 1) return "방금";
    if (mins < 60) return mins + "분 전";
    var hrs = Math.floor(mins / 60);
    if (hrs < 24) return hrs + "시간 전";
    var days = Math.floor(hrs / 24);
    if (days < 30) return days + "일 전";
    return new Date(iso).toLocaleDateString("ko-KR");
  };

  return (
    <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #E8E5E0", padding: "20px 24px", marginBottom: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 16 }}>👥</span>
          <div style={{ fontSize: 14, fontWeight: 700 }}>팀 활동 현황</div>
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          <button onClick={function() { setRange("week"); }}
            style={{ padding: "4px 10px", fontSize: 11, fontWeight: 600, borderRadius: 6, cursor: "pointer", background: range === "week" ? "#1A1917" : "#fff", color: range === "week" ? "#fff" : "#666", border: "1px solid #E8E5E0" }}>이번 주</button>
          <button onClick={function() { setRange("month"); }}
            style={{ padding: "4px 10px", fontSize: 11, fontWeight: 600, borderRadius: 6, cursor: "pointer", background: range === "month" ? "#1A1917" : "#fff", color: range === "month" ? "#fff" : "#666", border: "1px solid #E8E5E0" }}>이번 달</button>
        </div>
      </div>
      {loading ? (
        <div style={{ textAlign: "center", padding: 30, color: "#AAA", fontSize: 12 }}>불러오는 중...</div>
      ) : displayList.length === 0 ? (
        <div style={{ textAlign: "center", padding: 30, color: "#AAA", fontSize: 12 }}>활동 데이터가 없어요</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 8 }}>
          {displayList.map(function(d, i) {
            var isActive = d.total > 0;
            return (
              <div key={d.name} style={{ padding: "10px 12px", background: isActive ? "#F7F6F3" : "#FAFAF8", borderRadius: 8, border: "1px solid " + (isActive ? "#E8E5E0" : "#EDEBE8"), opacity: isActive ? 1 : 0.6 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <div style={{ fontSize: 12, fontWeight: 700 }}>{d.name}</div>
                  {i < 3 && isActive && <span style={{ fontSize: 10 }}>{["🥇","🥈","🥉"][i]}</span>}
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4, fontSize: 10, color: "#666", marginBottom: 4 }}>
                  {d.notes > 0 && <span title="업무 노트">📝 {d.notes}</span>}
                  {d.agencyUpdates > 0 && <span title="기관별 진행건">🏛 {d.agencyUpdates}</span>}
                  {d.agencyApproved > 0 && <span title="승인 건" style={{ color: "#15803D", fontWeight: 600 }}>✓ {d.agencyApproved}</span>}
                  {d.logs > 0 && <span title="소통 기록">💬 {d.logs}</span>}
                  {d.cases > 0 && <span title="사례 등록">📚 {d.cases}</span>}
                </div>
                <div style={{ fontSize: 10, color: "#AAA" }}>최근: {relativeTime(d.lastActive)}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ========== 📊 담당자별 업체 수 막대그래프 (대시보드) ==========
function AssigneeWorkloadChart({ companies, setView, setFilterAssignee }) {
  // 담당자별 업체 수 집계 (별칭 정규화)
  var normalizeName = function(name) {
    if (!name) return "";
    var n = String(name).trim();
    if (n === "총무" || n === "총무(유진)") return "유진";
    if (n === "김동일이사" || n === "김이사" || n === "동일이사") return "동일";
    if (n === "김현애") return "현애";
    if (n === "최지혜") return "지혜";
    return n;
  };

  var counts = {};
  (companies || []).forEach(function(c) {
    if (!c.assignee) return;
    // 복합 담당자 (예: "유진 정원") → 첫 이름만 카운트
    var first = String(c.assignee).split(/[ ,;\/]+/)[0].trim();
    var nm = normalizeName(first);
    if (!nm) return;
    counts[nm] = (counts[nm] || 0) + 1;
  });

  // 정렬: 건수 많은 순
  var sorted = Object.keys(counts).map(function(k) {
    return { name: k, count: counts[k] };
  }).sort(function(a, b) { return b.count - a.count; });

  if (sorted.length === 0) {
    return null;
  }

  var maxCount = sorted[0].count;
  var total = sorted.reduce(function(s, x) { return s + x.count; }, 0);
  var avg = Math.round(total / sorted.length);

  // 색상 매핑 (직원별 일관성)
  var COLOR_PALETTE = ["#4338CA", "#0891B2", "#15803D", "#CA8A04", "#DC2626", "#7C3AED", "#0369A1", "#9333EA", "#DB2777"];
  var getColor = function(idx) { return COLOR_PALETTE[idx % COLOR_PALETTE.length]; };

  return (
    <div style={{ background: "#fff", borderRadius: 12, padding: "20px 24px", border: "1px solid #E8E5E0", marginBottom: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 3 }}>📊 담당자별 업체 수</div>
          <div style={{ fontSize: 11, color: "#888" }}>업무 분담 현황 한눈에 · 클릭하면 그 담당자의 업체 목록으로 이동</div>
        </div>
        <div style={{ display: "flex", gap: 16, fontSize: 11, color: "#888" }}>
          <div>전체 <span style={{ color: "#1A1917", fontWeight: 700 }}>{total}건</span></div>
          <div>평균 <span style={{ color: "#1A1917", fontWeight: 700 }}>{avg}건</span></div>
          <div>담당자 <span style={{ color: "#1A1917", fontWeight: 700 }}>{sorted.length}명</span></div>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {sorted.map(function(item, i) {
          var pct = maxCount > 0 ? (item.count / maxCount * 100) : 0;
          var avgRatio = avg > 0 ? (item.count / avg) : 0;
          var color = getColor(i);
          // 평균 대비 상태
          var statusBadge = null;
          if (avgRatio >= 1.5) statusBadge = { text: "🔥 과다", color: "#DC2626", bg: "#FEE2E2" };
          else if (avgRatio <= 0.5) statusBadge = { text: "💤 여유", color: "#0369A1", bg: "#DBEAFE" };
          return (
            <div key={item.name}
              onClick={function() {
                if (setView && setFilterAssignee) {
                  setFilterAssignee(item.name);
                  setView("list");
                }
              }}
              style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 4px", borderRadius: 6, cursor: setView ? "pointer" : "default" }}
              onMouseEnter={function(e) { if (setView) e.currentTarget.style.background = "#F7F6F3"; }}
              onMouseLeave={function(e) { e.currentTarget.style.background = "transparent"; }}>
              {/* 이름 + 배지 */}
              <div style={{ width: 100, display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#1A1917" }}>{item.name}</span>
                {statusBadge && (
                  <span style={{ fontSize: 9, padding: "2px 5px", borderRadius: 4, color: statusBadge.color, background: statusBadge.bg, fontWeight: 700, whiteSpace: "nowrap" }}>
                    {statusBadge.text}
                  </span>
                )}
              </div>
              {/* 막대그래프 */}
              <div style={{ flex: 1, position: "relative", height: 22, background: "#F7F6F3", borderRadius: 6, overflow: "hidden" }}>
                <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: pct + "%", background: "linear-gradient(90deg, " + color + " 0%, " + color + "DD 100%)", borderRadius: 6, transition: "width 0.4s ease" }}></div>
                <div style={{ position: "absolute", left: 10, top: 0, height: "100%", display: "flex", alignItems: "center", fontSize: 11, fontWeight: 700, color: "#fff", textShadow: "0 1px 2px rgba(0,0,0,0.2)" }}>
                  {pct >= 15 ? item.count + "건" : ""}
                </div>
              </div>
              {/* 우측 숫자 */}
              <div style={{ width: 60, textAlign: "right", fontSize: 12, color: "#666", fontWeight: 600, flexShrink: 0 }}>
                {pct < 15 ? <span style={{ color: "#1A1917", fontWeight: 700 }}>{item.count}건</span> : <span>{Math.round(item.count / total * 100)}%</span>}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #F0EDE8", fontSize: 10, color: "#AAA" }}>
        💡 <span style={{ color: "#DC2626" }}>🔥 과다</span> = 평균의 1.5배 이상 · <span style={{ color: "#0369A1" }}>💤 여유</span> = 평균의 절반 이하
      </div>
    </div>
  );
}

// ========== 📋 팀 노트 섹션 (법인팀/개인팀 공유 작업공간) ==========
function TeamNotesSection({ profile, onTakenToMyNote }) {
  const [allTeamNotes, setAllTeamNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("corporate"); // "corporate" | "individual"
  const [showAdd, setShowAdd] = useState(false);
  const [showDone, setShowDone] = useState(false); // 가져간/완료된 것도 볼지
  const [newNote, setNewNote] = useState({ title: "", content: "", priority: "normal", due_date: "", tags: [], checklist: [] });
  const [collapsed, setCollapsed] = useState(false); // 섹션 전체 접기
  const [editingNoteId, setEditingNoteId] = useState(null); // 수정 중인 팀 노트 ID
  const [editingDraft, setEditingDraft] = useState(null); // 수정 작업 중인 임시 데이터

  useEffect(function() { fetchTeamNotes(); }, []);

  var fetchTeamNotes = async function() {
    setLoading(true);
    var r = await supabase.from("team_notes").select("*").is("deleted_at", null).order("created_at", { ascending: false });
    if (!r.error) setAllTeamNotes(r.data || []);
    setLoading(false);
  };

  // 탭별 노트 (열린 것 우선, 가져간 것은 토글에 따라)
  var displayNotes = useMemo(function() {
    return allTeamNotes.filter(function(n) {
      if (n.team !== activeTab) return false;
      if (!showDone && n.status !== "open") return false;
      return true;
    });
  }, [allTeamNotes, activeTab, showDone]);

  var openCount = useMemo(function() {
    return {
      corporate: allTeamNotes.filter(function(n) { return n.team === "corporate" && n.status === "open"; }).length,
      individual: allTeamNotes.filter(function(n) { return n.team === "individual" && n.status === "open"; }).length,
    };
  }, [allTeamNotes]);

  // 팀 노트 새로 추가
  var addTeamNote = async function() {
    if (!newNote.title.trim() && !newNote.content.trim() && (!newNote.checklist || newNote.checklist.length === 0)) {
      alert("제목, 내용 또는 체크리스트 중 하나는 입력해주세요.");
      return;
    }
    // 체크리스트 필터: 빈 항목 제거 + 각 항목에 ID 부여
    var cleanChecklist = (newNote.checklist || []).filter(function(it) { return it && it.text && it.text.trim(); }).map(function(it) {
      return {
        id: it.id || ("ck_" + Math.random().toString(36).slice(2, 11)),
        text: it.text.trim(),
        taken_by: null,
        taken_at: null,
        taken_work_note_id: null,
        done: false,
      };
    });
    var payload = {
      team: activeTab,
      title: newNote.title.trim() || null,
      content: newNote.content.trim() || null,
      priority: newNote.priority || "normal",
      due_date: newNote.due_date || null,
      tags: newNote.tags && newNote.tags.length > 0 ? newNote.tags : null,
      posted_by: profile?.name || "익명",
      status: "open",
      checklist: cleanChecklist,
    };
    var r = await supabase.from("team_notes").insert(payload).select().single();
    if (r.error) { alert("등록 실패: " + r.error.message); return; }
    setAllTeamNotes(function(prev) { return [r.data].concat(prev); });
    setNewNote({ title: "", content: "", priority: "normal", due_date: "", tags: [], checklist: [] });
    setShowAdd(false);
  };

  // "가져가기" - 본인 work_notes로 복제 + team_notes 상태 업데이트
  // 이름 정규화 - 별칭/직책을 본명으로 변환
  var normalizeName = function(rawName) {
    if (!rawName) return rawName;
    var s = String(rawName).trim();
    if (s === "총무" || s === "총무(유진)") return "유진";
    if (s === "김동일이사" || s === "김이사") return "동일";
    if (s === "김현애") return "현애";
    if (s === "최지혜") return "지혜";
    return s;
  };

  var takeToMyNote = async function(teamNote) {
    if (!profile?.name) { alert("로그인 정보가 없습니다."); return; }
    var assigneeName = normalizeName(profile.name);
    // work_notes에 새 노트 생성
    var todayStr = kstDate();
    var teamLabel = teamNote.team === "corporate" ? "[법인팀]" : "[개인팀]";
    var workNotePayload = {
      assignee: assigneeName,
      title: teamLabel + " " + (teamNote.title || "팀 노트에서 가져온 업무"),
      content: teamNote.content || "",
      is_todo: true,
      pinned: false,
      created_by: assigneeName,
      note_date: todayStr,
    };
    if (teamNote.due_date) workNotePayload.due_date = teamNote.due_date;
    var wr = await supabase.from("work_notes").insert(workNotePayload).select().single();
    if (wr.error) { alert("내 노트로 가져오기 실패: " + wr.error.message); return; }
    // team_notes 상태 업데이트
    var tr = await supabase.from("team_notes").update({
      status: "taken",
      taken_by: assigneeName,
      taken_at: new Date().toISOString(),
      taken_work_note_id: wr.data.id,
    }).eq("id", teamNote.id);
    if (tr.error) { alert("팀 노트 상태 업데이트 실패: " + tr.error.message); return; }
    // 로컬 상태 업데이트
    setAllTeamNotes(function(prev) {
      return prev.map(function(n) {
        if (n.id === teamNote.id) return Object.assign({}, n, { status: "taken", taken_by: assigneeName, taken_at: new Date().toISOString(), taken_work_note_id: wr.data.id });
        return n;
      });
    });
    if (onTakenToMyNote) onTakenToMyNote(wr.data);
    alert("✅ '" + (teamNote.title || "팀 노트") + "'을(를) 내 노트로 가져왔습니다.\n업무노트에서 확인하세요.");
  };

  // 체크리스트 항목 하나 가져가기
  var takeChecklistItem = async function(teamNote, itemId) {
    if (!profile?.name) { alert("로그인 정보가 없습니다."); return; }
    var assigneeName = normalizeName(profile.name);
    var item = (teamNote.checklist || []).find(function(it) { return it.id === itemId; });
    if (!item) return;
    if (item.taken_by) { alert("이미 " + item.taken_by + "님이 가져간 항목입니다."); return; }

    var teamLabel = teamNote.team === "corporate" ? "[법인팀]" : "[개인팀]";
    var todayStr = kstDate();
    var noteTitle = teamLabel + " " + (teamNote.title || "팀 노트");

    // 1) 같은 팀 노트에서 이미 가져온 항목이 있는지 - 같은 사용자가 같은 team_note에서 가져온 work_note 찾기
    var existingWorkNoteId = null;
    if (teamNote.checklist) {
      var alreadyTaken = teamNote.checklist.find(function(it) { return it.taken_by === assigneeName && it.taken_work_note_id; });
      if (alreadyTaken) existingWorkNoteId = alreadyTaken.taken_work_note_id;
    }

    var workNoteId;
    if (existingWorkNoteId) {
      // 기존 노트에 항목 추가
      var fetchRes = await supabase.from("work_notes").select("*").eq("id", existingWorkNoteId).maybeSingle();
      if (fetchRes.error || !fetchRes.data) {
        // 기존 노트가 사라졌으면 새로 만듦
        existingWorkNoteId = null;
      } else {
        var existingContent = fetchRes.data.content || "";
        var newContent = existingContent + (existingContent ? "\n" : "") + "- [ ] " + item.text;
        var upd = await supabase.from("work_notes").update({ content: newContent, updated_at: new Date().toISOString() }).eq("id", existingWorkNoteId).select().single();
        if (upd.error) { alert("기존 노트 갱신 실패: " + upd.error.message); return; }
        workNoteId = existingWorkNoteId;
        // 부모 컴포넌트에 갱신된 노트 알림 (화면 즉시 반영)
        if (onTakenToMyNote && upd.data) onTakenToMyNote(upd.data);
      }
    }

    if (!existingWorkNoteId) {
      // 새 work_notes 생성
      var workNotePayload = {
        assignee: assigneeName,
        title: noteTitle,
        content: "- [ ] " + item.text,
        is_todo: true,
        pinned: false,
        created_by: assigneeName,
        note_date: todayStr,
      };
      if (teamNote.due_date) workNotePayload.due_date = teamNote.due_date;
      var wr = await supabase.from("work_notes").insert(workNotePayload).select().single();
      if (wr.error) { alert("내 노트로 가져오기 실패: " + wr.error.message); return; }
      workNoteId = wr.data.id;
      if (onTakenToMyNote) onTakenToMyNote(wr.data);
    }

    // 2) team_notes checklist 업데이트
    var newChecklist = (teamNote.checklist || []).map(function(it) {
      if (it.id === itemId) {
        return Object.assign({}, it, {
          taken_by: assigneeName,
          taken_at: new Date().toISOString(),
          taken_work_note_id: workNoteId,
        });
      }
      return it;
    });

    // 모두 가져갔으면 상태를 taken으로
    var allTaken = newChecklist.every(function(it) { return it.taken_by; });
    var updatePayload = { checklist: newChecklist };
    if (allTaken && teamNote.status === "open") {
      updatePayload.status = "taken";
      updatePayload.taken_at = new Date().toISOString();
    }

    var tr = await supabase.from("team_notes").update(updatePayload).eq("id", teamNote.id);
    if (tr.error) { alert("팀 노트 업데이트 실패: " + tr.error.message); return; }

    setAllTeamNotes(function(prev) {
      return prev.map(function(n) {
        if (n.id === teamNote.id) return Object.assign({}, n, updatePayload);
        return n;
      });
    });
  };

  // 체크리스트 항목 원위치 (가져간 것 취소)
  var untakeChecklistItem = async function(teamNote, itemId) {
    if (!profile?.name) { alert("로그인 정보가 없습니다."); return; }
    var currentUser = normalizeName(profile.name);
    var item = (teamNote.checklist || []).find(function(it) { return it.id === itemId; });
    if (!item) return;
    if (!item.taken_by) { alert("아직 가져가지 않은 항목입니다."); return; }
    // 권한: 본인이 가져간 항목 + 관리자만 (양호 또는 admin)
    var canUntake = item.taken_by === currentUser || currentUser === "양호" || profile?.role === "admin";
    if (!canUntake) {
      alert("본인이 가져간 항목만 원위치할 수 있습니다.\n(가져간 사람: " + item.taken_by + ")");
      return;
    }
    if (!confirm("'" + item.text + "'\n\n이 항목을 원위치(대기중)로 돌릴까요?\n내 업무노트에서도 해당 줄이 삭제됩니다.")) return;

    var workNoteId = item.taken_work_note_id;

    // 1) 내 work_notes에서 해당 줄 삭제
    if (workNoteId) {
      var fetchRes = await supabase.from("work_notes").select("*").eq("id", workNoteId).maybeSingle();
      if (!fetchRes.error && fetchRes.data) {
        var oldContent = fetchRes.data.content || "";
        // 정확히 "- [ ] {item.text}" 또는 "- [x] {item.text}" 줄을 제거
        var lines = oldContent.split("\n");
        var newLines = lines.filter(function(line) {
          var trimmed = line.trim();
          var matchUnchecked = "- [ ] " + item.text;
          var matchChecked = "- [x] " + item.text;
          // 마감일 [YYYY-MM-DD] 포함된 형태도 매칭
          return trimmed !== matchUnchecked && trimmed !== matchChecked &&
                 !trimmed.startsWith(matchUnchecked + " [") && !trimmed.startsWith(matchChecked + " [");
        });
        var newContent = newLines.join("\n").replace(/\n\n+/g, "\n\n").trim();
        if (newContent === "") {
          // 노트에 줄이 하나도 안 남으면 휴지통으로 (deleted_at 설정)
          var del = await supabase.from("work_notes").update({ deleted_at: new Date().toISOString() }).eq("id", workNoteId);
          if (del.error) console.warn("노트 휴지통 이동 실패:", del.error.message);
        } else {
          var upd = await supabase.from("work_notes").update({ content: newContent, updated_at: new Date().toISOString() }).eq("id", workNoteId).select().single();
          if (upd.error) { alert("노트 갱신 실패: " + upd.error.message); return; }
          // 부모 노트 목록 갱신
          if (onTakenToMyNote && upd.data) onTakenToMyNote(upd.data);
        }
      }
    }

    // 2) team_notes checklist 업데이트 (taken 정보 비우기)
    var newChecklist = (teamNote.checklist || []).map(function(it) {
      if (it.id === itemId) {
        return Object.assign({}, it, {
          taken_by: null,
          taken_at: null,
          taken_work_note_id: null,
        });
      }
      return it;
    });
    // 모두 대기 상태가 되었으면 status를 open으로 (auto-revert)
    var updatePayload2 = { checklist: newChecklist };
    if (teamNote.status === "taken") {
      // 하나라도 안 가져간 게 생기면 다시 open
      var allStillTaken = newChecklist.every(function(it) { return it.taken_by; });
      if (!allStillTaken) updatePayload2.status = "open";
    }

    var tr = await supabase.from("team_notes").update(updatePayload2).eq("id", teamNote.id);
    if (tr.error) { alert("팀 노트 업데이트 실패: " + tr.error.message); return; }

    setAllTeamNotes(function(prev) {
      return prev.map(function(n) {
        if (n.id === teamNote.id) return Object.assign({}, n, updatePayload2);
        return n;
      });
    });
  };

  // 팀 노트 수정 시작
  var startEditNote = function(note) {
    setEditingNoteId(note.id);
    setEditingDraft({
      title: note.title || "",
      content: note.content || "",
      priority: note.priority || "normal",
      due_date: note.due_date || "",
      checklist: (note.checklist || []).map(function(it) { return Object.assign({}, it); }),
    });
  };

  // 팀 노트 수정 취소
  var cancelEditNote = function() {
    setEditingNoteId(null);
    setEditingDraft(null);
  };

  // 팀 노트 수정 저장
  var saveEditNote = async function(noteId) {
    if (!editingDraft) return;
    // 빈 항목 제거 + 신규 항목은 ID 부여
    var cleanChecklist = (editingDraft.checklist || []).filter(function(it) { return it && it.text && it.text.trim(); }).map(function(it) {
      return {
        id: it.id || ("ck_" + Math.random().toString(36).slice(2, 11)),
        text: it.text.trim(),
        taken_by: it.taken_by || null,
        taken_at: it.taken_at || null,
        taken_work_note_id: it.taken_work_note_id || null,
        done: !!it.done,
      };
    });
    var payload = {
      title: editingDraft.title.trim() || null,
      content: editingDraft.content.trim() || null,
      priority: editingDraft.priority || "normal",
      due_date: editingDraft.due_date || null,
      checklist: cleanChecklist,
      updated_at: new Date().toISOString(),
    };
    var r = await supabase.from("team_notes").update(payload).eq("id", noteId);
    if (r.error) { alert("수정 실패: " + r.error.message); return; }
    setAllTeamNotes(function(prev) {
      return prev.map(function(n) { return n.id === noteId ? Object.assign({}, n, payload) : n; });
    });
    setEditingNoteId(null);
    setEditingDraft(null);
  };

  // 팀 노트 삭제 (양호님 또는 등록자만)
  var deleteTeamNote = async function(id, postedBy) {
    var canDelete = profile?.name === "양호" || profile?.role === "admin" || profile?.name === postedBy;
    if (!canDelete) { alert("본인이 등록한 노트 또는 관리자만 삭제할 수 있습니다."); return; }
    if (!confirm("이 팀 노트를 삭제하시겠습니까?")) return;
    var r = await supabase.from("team_notes").update({ deleted_at: new Date().toISOString() }).eq("id", id);
    if (r.error) { alert("삭제 실패: " + r.error.message); return; }
    setAllTeamNotes(function(prev) { return prev.filter(function(n) { return n.id !== id; }); });
  };

  // 완료 처리 (가져간 사람이 완료 표시)
  var markDone = async function(id) {
    var r = await supabase.from("team_notes").update({ status: "done" }).eq("id", id);
    if (r.error) { alert("완료 처리 실패: " + r.error.message); return; }
    setAllTeamNotes(function(prev) {
      return prev.map(function(n) { return n.id === id ? Object.assign({}, n, { status: "done" }) : n; });
    });
  };

  var priorityStyle = function(p) {
    if (p === "urgent") return { bg: "#FEE2E2", color: "#B91C1C", label: "🚨 긴급" };
    if (p === "high") return { bg: "#FEF3C7", color: "#92400E", label: "⭐ 중요" };
    return { bg: "#F3F4F6", color: "#666", label: "일반" };
  };

  var statusStyle = function(s) {
    if (s === "open") return { bg: "#DCFCE7", color: "#15803D", label: "🟢 대기중" };
    if (s === "taken") return { bg: "#DBEAFE", color: "#1E40AF", label: "🔵 진행중" };
    if (s === "done") return { bg: "#F3F4F6", color: "#666", label: "✅ 완료" };
    return { bg: "#F3F4F6", color: "#666", label: s };
  };

  return (
    <div style={{ background: "#fff", border: "1px solid #E8E5E0", borderRadius: 12, padding: "16px 20px", marginBottom: 18 }}>
      {/* 헤더 */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: collapsed ? 0 : 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={function() { setCollapsed(!collapsed); }} title={collapsed ? "펼치기" : "접기"}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "#666", padding: 2 }}>{collapsed ? "▶" : "▼"}</button>
          <span style={{ fontSize: 15, fontWeight: 700 }}>📋 팀 업무 공간</span>
          <span style={{ fontSize: 11, color: "#888" }}>· 누구든 가져갈 수 있어요</span>
          {openCount.corporate + openCount.individual > 0 && (
            <span style={{ fontSize: 11, fontWeight: 700, background: "#15803D", color: "#fff", padding: "2px 8px", borderRadius: 99 }}>
              대기 {openCount.corporate + openCount.individual}건
            </span>
          )}
        </div>
        {!collapsed && (
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#666", cursor: "pointer" }}>
              <input type="checkbox" checked={showDone} onChange={function(e) { setShowDone(e.target.checked); }} />
              가져간 것도 보기
            </label>
            <button onClick={function() { setShowAdd(true); }}
              style={{ background: "#1A1917", color: "#fff", border: "none", borderRadius: 6, padding: "6px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>+ 새 업무</button>
          </div>
        )}
      </div>

      {!collapsed && (
        <>
          {/* 탭 */}
          <div style={{ display: "flex", gap: 4, marginBottom: 12, borderBottom: "1px solid #E8E5E0" }}>
            <button onClick={function() { setActiveTab("corporate"); }}
              style={{ background: "none", border: "none", padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer", color: activeTab === "corporate" ? "#1A1917" : "#888", borderBottom: "2px solid " + (activeTab === "corporate" ? "#1A1917" : "transparent"), marginBottom: -1 }}>
              🏢 법인팀
              {openCount.corporate > 0 && <span style={{ marginLeft: 6, fontSize: 10, background: "#15803D", color: "#fff", padding: "1px 6px", borderRadius: 99 }}>{openCount.corporate}</span>}
            </button>
            <button onClick={function() { setActiveTab("individual"); }}
              style={{ background: "none", border: "none", padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer", color: activeTab === "individual" ? "#1A1917" : "#888", borderBottom: "2px solid " + (activeTab === "individual" ? "#1A1917" : "transparent"), marginBottom: -1 }}>
              👤 개인팀
              {openCount.individual > 0 && <span style={{ marginLeft: 6, fontSize: 10, background: "#15803D", color: "#fff", padding: "1px 6px", borderRadius: 99 }}>{openCount.individual}</span>}
            </button>
          </div>

          {/* 노트 목록 */}
          {loading ? (
            <div style={{ textAlign: "center", padding: 30, color: "#AAA", fontSize: 12 }}>불러오는 중...</div>
          ) : displayNotes.length === 0 ? (
            <div style={{ textAlign: "center", padding: 30, color: "#AAA", fontSize: 13, background: "#F7F6F3", borderRadius: 8 }}>
              {showDone ? "이 팀에 노트가 없어요" : "대기중인 업무가 없어요. 새 업무를 등록해보세요."}
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 10 }}>
              {displayNotes.map(function(note) {
                var ps = priorityStyle(note.priority);
                var ss = statusStyle(note.status);
                var isOpen = note.status === "open";
                var isMine = note.taken_by === profile?.name;
                var isEditing = editingNoteId === note.id;

                // ── 편집 모드 ──
                if (isEditing && editingDraft) {
                  return (
                    <div key={note.id} style={{ background: "#fff", border: "2px solid #4338CA", borderRadius: 8, padding: "12px" }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#4338CA", marginBottom: 8 }}>✏️ 수정 중</div>
                      <div style={{ marginBottom: 8 }}>
                        <label style={{ fontSize: 10, color: "#888", display: "block", marginBottom: 2 }}>제목</label>
                        <input type="text" value={editingDraft.title}
                          onChange={function(e) { var v = e.target.value; setEditingDraft(function(p) { return Object.assign({}, p, { title: v }); }); }}
                          style={{ width: "100%", padding: "6px 10px", border: "1px solid #E8E5E0", borderRadius: 5, fontSize: 12, boxSizing: "border-box", outline: "none" }} />
                      </div>
                      <div style={{ marginBottom: 8 }}>
                        <label style={{ fontSize: 10, color: "#888", display: "block", marginBottom: 2 }}>업무 내용</label>
                        <textarea value={editingDraft.content}
                          onChange={function(e) { var v = e.target.value; setEditingDraft(function(p) { return Object.assign({}, p, { content: v }); }); }}
                          style={{ width: "100%", padding: "6px 10px", border: "1px solid #E8E5E0", borderRadius: 5, fontSize: 12, lineHeight: 1.6, resize: "vertical", minHeight: 60, boxSizing: "border-box", outline: "none", whiteSpace: "pre-wrap", fontFamily: "inherit" }} />
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 8 }}>
                        <div>
                          <label style={{ fontSize: 10, color: "#888", display: "block", marginBottom: 2 }}>우선순위</label>
                          <select value={editingDraft.priority}
                            onChange={function(e) { var v = e.target.value; setEditingDraft(function(p) { return Object.assign({}, p, { priority: v }); }); }}
                            style={{ width: "100%", padding: "5px 8px", border: "1px solid #E8E5E0", borderRadius: 5, fontSize: 11, boxSizing: "border-box", background: "#fff" }}>
                            <option value="normal">일반</option>
                            <option value="high">⭐ 중요</option>
                            <option value="urgent">🚨 긴급</option>
                          </select>
                        </div>
                        <div>
                          <label style={{ fontSize: 10, color: "#888", display: "block", marginBottom: 2 }}>마감일</label>
                          <input type="date" value={editingDraft.due_date}
                            onChange={function(e) { var v = e.target.value; setEditingDraft(function(p) { return Object.assign({}, p, { due_date: v }); }); }}
                            style={{ width: "100%", padding: "5px 8px", border: "1px solid #E8E5E0", borderRadius: 5, fontSize: 11, boxSizing: "border-box", outline: "none" }} />
                        </div>
                      </div>
                      {/* 체크리스트 편집 */}
                      <div style={{ marginBottom: 8, background: "#F7F6F3", border: "1px solid #E8E5E0", borderRadius: 6, padding: "8px 10px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                          <label style={{ fontSize: 10, color: "#666", fontWeight: 600 }}>📋 체크리스트</label>
                          <button onClick={function() {
                            setEditingDraft(function(p) {
                              var arr = (p.checklist || []).slice();
                              arr.push({ id: "tmp_" + Math.random().toString(36).slice(2, 11), text: "" });
                              return Object.assign({}, p, { checklist: arr });
                            });
                          }}
                            style={{ background: "#fff", border: "1px solid #E8E5E0", color: "#666", padding: "2px 8px", fontSize: 10, borderRadius: 4, cursor: "pointer", fontWeight: 600 }}>+ 추가</button>
                        </div>
                        {(editingDraft.checklist || []).length === 0 ? (
                          <div style={{ fontSize: 10, color: "#AAA", padding: "4px 0", textAlign: "center" }}>항목 없음</div>
                        ) : (
                          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                            {editingDraft.checklist.map(function(item, idx) {
                              var locked = !!item.taken_by; // 이미 가져간 항목은 수정/삭제 불가
                              return (
                                <div key={item.id || idx} style={{ display: "flex", gap: 4, alignItems: "center" }}>
                                  <span style={{ color: locked ? "#AAA" : "#CCC", fontSize: 11 }}>☐</span>
                                  <input type="text" value={item.text} disabled={locked}
                                    onChange={function(e) {
                                      var v = e.target.value;
                                      setEditingDraft(function(p) {
                                        var arr = (p.checklist || []).slice();
                                        arr[idx] = Object.assign({}, arr[idx], { text: v });
                                        return Object.assign({}, p, { checklist: arr });
                                      });
                                    }}
                                    placeholder="항목 내용"
                                    title={locked ? item.taken_by + "님이 가져간 항목은 수정 불가" : ""}
                                    style={{ flex: 1, padding: "4px 8px", border: "1px solid #E8E5E0", borderRadius: 4, fontSize: 11, boxSizing: "border-box", outline: "none", background: locked ? "#F0EDE8" : "#fff", color: locked ? "#888" : "#1A1917", textDecoration: locked ? "line-through" : "none" }} />
                                  {locked ? (
                                    <span style={{ fontSize: 9, color: "#1E40AF", fontWeight: 700, padding: "2px 5px", background: "#DBEAFE", borderRadius: 3, whiteSpace: "nowrap" }}>👤 {item.taken_by}</span>
                                  ) : (
                                    <button onClick={function() {
                                      setEditingDraft(function(p) {
                                        var arr = (p.checklist || []).filter(function(_, i) { return i !== idx; });
                                        return Object.assign({}, p, { checklist: arr });
                                      });
                                    }}
                                      title="삭제"
                                      style={{ background: "none", border: "none", cursor: "pointer", color: "#888", fontSize: 11, padding: "2px 4px" }}>✕</button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                        {(editingDraft.checklist || []).some(function(it) { return !!it.taken_by; }) && (
                          <div style={{ marginTop: 6, fontSize: 9, color: "#92400E" }}>🔒 이미 가져간 항목은 수정·삭제할 수 없습니다.</div>
                        )}
                      </div>
                      {/* 저장/취소 */}
                      <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                        <button onClick={cancelEditNote}
                          style={{ background: "#fff", border: "1px solid #E8E5E0", color: "#666", padding: "6px 14px", fontSize: 11, borderRadius: 6, cursor: "pointer" }}>취소</button>
                        <button onClick={function() { saveEditNote(note.id); }}
                          style={{ background: "#4338CA", color: "#fff", border: "none", padding: "6px 14px", fontSize: 11, borderRadius: 6, cursor: "pointer", fontWeight: 700 }}>💾 저장</button>
                      </div>
                    </div>
                  );
                }

                // ── 일반 보기 모드 ──
                return (
                  <div key={note.id} style={{ background: isOpen ? "#FFFEF7" : "#F7F6F3", border: "1px solid " + (isOpen ? "#FEF3C7" : "#E8E5E0"), borderRadius: 8, padding: "10px 12px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 99, background: ss.bg, color: ss.color }}>{ss.label}</span>
                        {note.priority !== "normal" && (
                          <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 99, background: ps.bg, color: ps.color }}>{ps.label}</span>
                        )}
                      </div>
                      <span style={{ fontSize: 9, color: "#AAA" }}>
                        {note.created_at ? new Date(note.created_at).toLocaleDateString("ko-KR", { month: "numeric", day: "numeric" }) : ""}
                      </span>
                    </div>
                    {note.title && <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4, lineHeight: 1.4 }}>{note.title}</div>}
                    {note.content && (
                      <div style={{ fontSize: 12, color: "#444", lineHeight: 1.5, whiteSpace: "pre-wrap", marginBottom: 8, maxHeight: 100, overflowY: "auto" }}>{note.content}</div>
                    )}
                    {/* 체크리스트 (있을 때만) */}
                    {(function() {
                      var cl = note.checklist || [];
                      if (cl.length === 0) return null;
                      var takenCount = cl.filter(function(it) { return it.taken_by; }).length;
                      var pct = Math.round((takenCount / cl.length) * 100);
                      return (
                        <div style={{ marginBottom: 8 }}>
                          {/* 진행률 */}
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, padding: "6px 10px", background: "#fff", borderRadius: 6 }}>
                            <span style={{ fontSize: 10, color: "#888" }}>📋 항목별 진행</span>
                            <div style={{ flex: 1, height: 5, background: "#F7F6F3", borderRadius: 99, overflow: "hidden" }}>
                              <div style={{ width: pct + "%", height: "100%", background: "#4338CA", transition: "width 0.2s" }}></div>
                            </div>
                            <span style={{ fontSize: 10, fontWeight: 700, color: "#1A1917" }}>{takenCount}/{cl.length} 가져감</span>
                          </div>
                          {/* 항목들 */}
                          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                            {cl.map(function(item) {
                              var taken = !!item.taken_by;
                              var mine = item.taken_by === profile?.name;
                              return (
                                <div key={item.id}
                                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 8px", background: taken ? "#F7F6F3" : "#fff", borderRadius: 6, border: "0.5px solid " + (taken ? "transparent" : "#E8E5E0") }}>
                                  <span style={{ fontSize: 11, color: taken ? "#888" : "#CCC" }}>☐</span>
                                  <span style={{ flex: 1, fontSize: 11, color: taken ? "#888" : "#1A1917", textDecoration: taken ? "line-through" : "none", lineHeight: 1.4 }}>
                                    {item.text}
                                  </span>
                                  {taken ? (
                                    <span style={{ display: "flex", alignItems: "center", gap: 4, whiteSpace: "nowrap" }}>
                                      <span style={{ fontSize: 9, padding: "2px 7px", background: mine ? "#DCFCE7" : "#DBEAFE", color: mine ? "#15803D" : "#1E40AF", borderRadius: 99, fontWeight: 700 }}>
                                        👤 {item.taken_by}{mine ? " (나)" : ""}
                                      </span>
                                      {(mine || normalizeName(profile?.name) === "양호" || profile?.role === "admin") && (
                                        <button onClick={function() { untakeChecklistItem(note, item.id); }}
                                          title="원위치 (대기중으로 돌리기)"
                                          style={{ background: "none", border: "none", cursor: "pointer", padding: 2, fontSize: 11, color: "#888", lineHeight: 1 }}>↩️</button>
                                      )}
                                    </span>
                                  ) : (
                                    <button onClick={function() { takeChecklistItem(note, item.id); }}
                                      style={{ fontSize: 9, padding: "3px 8px", background: "#1A1917", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer", fontWeight: 700, whiteSpace: "nowrap" }}>
                                      📥 내가 하기
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 10, color: "#888", paddingTop: 6, borderTop: "1px solid " + (isOpen ? "#FEF3C7" : "#E8E5E0") }}>
                      <div>
                        <span>등록: {note.posted_by || "-"}</span>
                        {note.due_date && <span style={{ marginLeft: 8, color: "#B91C1C" }}>📅 {note.due_date}</span>}
                      </div>
                      <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                        {note.taken_by && (
                          <span style={{ fontSize: 10, color: "#1E40AF", fontWeight: 600 }}>👤 {note.taken_by}</span>
                        )}
                      </div>
                    </div>
                    {/* 액션 버튼 */}
                    <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                      {isOpen && (
                        <button onClick={function() { takeToMyNote(note); }}
                          style={{ flex: 1, background: "#1A1917", color: "#fff", border: "none", borderRadius: 6, padding: "6px 8px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                          📥 {(note.checklist && note.checklist.length > 0) ? "통째로 가져가기" : "가져가기"}
                        </button>
                      )}
                      {note.status === "taken" && isMine && (
                        <button onClick={function() { markDone(note.id); }}
                          style={{ flex: 1, background: "#fff", color: "#15803D", border: "1px solid #86EFAC", borderRadius: 6, padding: "6px 8px", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>✅ 완료처리</button>
                      )}
                      {/* 수정 버튼 (누구나 가능) */}
                      <button onClick={function() { startEditNote(note); }} title="수정"
                        style={{ background: "#fff", color: "#4338CA", border: "1px solid #C7D2FE", borderRadius: 6, padding: "6px 8px", fontSize: 11, cursor: "pointer" }}>✏️</button>
                      {(profile?.name === "양호" || profile?.role === "admin" || profile?.name === note.posted_by) && (
                        <button onClick={function() { deleteTeamNote(note.id, note.posted_by); }} title="삭제"
                          style={{ background: "#fff", color: "#888", border: "1px solid #E8E5E0", borderRadius: 6, padding: "6px 8px", fontSize: 11, cursor: "pointer" }}>🗑</button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* 새 팀 노트 추가 모달 */}
      {showAdd && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div onClick={function(e) { e.stopPropagation(); }}
            style={{ background: "#fff", borderRadius: 12, width: "100%", maxWidth: 500, padding: 24 }}>
            <h2 style={{ margin: 0, marginBottom: 16, fontSize: 16, fontWeight: 700 }}>📋 팀 업무 등록</h2>
            <div style={{ marginBottom: 10 }}>
              <label style={{ fontSize: 11, color: "#888", display: "block", marginBottom: 4 }}>대상 팀</label>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={function() { setActiveTab("corporate"); }}
                  style={{ flex: 1, padding: "8px", background: activeTab === "corporate" ? "#1A1917" : "#fff", color: activeTab === "corporate" ? "#fff" : "#666", border: "1px solid " + (activeTab === "corporate" ? "#1A1917" : "#E8E5E0"), borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>🏢 법인팀</button>
                <button onClick={function() { setActiveTab("individual"); }}
                  style={{ flex: 1, padding: "8px", background: activeTab === "individual" ? "#1A1917" : "#fff", color: activeTab === "individual" ? "#fff" : "#666", border: "1px solid " + (activeTab === "individual" ? "#1A1917" : "#E8E5E0"), borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>👤 개인팀</button>
              </div>
            </div>
            <div style={{ marginBottom: 10 }}>
              <label style={{ fontSize: 11, color: "#888", display: "block", marginBottom: 4 }}>제목 (선택)</label>
              <input type="text" value={newNote.title} onChange={function(e) { var v = e.target.value; setNewNote(function(p) { return Object.assign({}, p, { title: v }); }); }}
                placeholder="예: (주)메이크올 7월 신청 준비"
                style={{ width: "100%", padding: "8px 12px", border: "1px solid #E8E5E0", borderRadius: 6, fontSize: 13, boxSizing: "border-box", outline: "none" }} />
            </div>
            <div style={{ marginBottom: 10 }}>
              <label style={{ fontSize: 11, color: "#888", display: "block", marginBottom: 4 }}>업무 내용 *</label>
              <textarea value={newNote.content} onChange={function(e) { var v = e.target.value; setNewNote(function(p) { return Object.assign({}, p, { content: v }); }); }}
                placeholder="어떤 업무를 누가 가져가야 하는지 상세하게 적어주세요"
                style={{ width: "100%", padding: "10px 12px", border: "1px solid #E8E5E0", borderRadius: 6, fontSize: 13, lineHeight: 1.7, resize: "vertical", minHeight: 100, boxSizing: "border-box", outline: "none", whiteSpace: "pre-wrap", fontFamily: "inherit" }} />
            </div>

            {/* 체크리스트 입력 영역 */}
            <div style={{ marginBottom: 12, background: "#F7F6F3", border: "1px solid #E8E5E0", borderRadius: 8, padding: "10px 12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <label style={{ fontSize: 11, color: "#666", fontWeight: 600 }}>
                  📋 체크리스트 (선택) <span style={{ color: "#888", fontWeight: 400 }}>· 항목별로 가져갈 수 있어요</span>
                </label>
                <button onClick={function() {
                  setNewNote(function(p) {
                    var arr = (p.checklist || []).slice();
                    arr.push({ id: "tmp_" + Math.random().toString(36).slice(2, 11), text: "" });
                    return Object.assign({}, p, { checklist: arr });
                  });
                }}
                  style={{ background: "#fff", border: "1px solid #E8E5E0", color: "#666", padding: "3px 10px", fontSize: 11, borderRadius: 6, cursor: "pointer", fontWeight: 600 }}>+ 항목 추가</button>
              </div>
              {(newNote.checklist || []).length === 0 ? (
                <div style={{ fontSize: 11, color: "#AAA", padding: "8px 0", textAlign: "center" }}>
                  항목을 추가하면 분담 가능 (안 추가하면 통째로 가져가기만 가능)
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {newNote.checklist.map(function(item, idx) {
                    return (
                      <div key={item.id} style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        <span style={{ color: "#888", fontSize: 12 }}>☐</span>
                        <input type="text" value={item.text}
                          onChange={function(e) {
                            var v = e.target.value;
                            setNewNote(function(p) {
                              var arr = (p.checklist || []).slice();
                              arr[idx] = Object.assign({}, arr[idx], { text: v });
                              return Object.assign({}, p, { checklist: arr });
                            });
                          }}
                          placeholder="예: 사업자등록증 받기"
                          onKeyDown={function(e) {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              setNewNote(function(p) {
                                var arr = (p.checklist || []).slice();
                                arr.splice(idx + 1, 0, { id: "tmp_" + Math.random().toString(36).slice(2, 11), text: "" });
                                return Object.assign({}, p, { checklist: arr });
                              });
                            }
                          }}
                          style={{ flex: 1, padding: "5px 10px", border: "1px solid #E8E5E0", borderRadius: 5, fontSize: 12, boxSizing: "border-box", outline: "none", background: "#fff" }} />
                        <button onClick={function() {
                          setNewNote(function(p) {
                            var arr = (p.checklist || []).filter(function(_, i) { return i !== idx; });
                            return Object.assign({}, p, { checklist: arr });
                          });
                        }}
                          title="삭제"
                          style={{ background: "none", border: "none", cursor: "pointer", color: "#888", fontSize: 13, padding: "2px 6px" }}>✕</button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
              <div>
                <label style={{ fontSize: 11, color: "#888", display: "block", marginBottom: 4 }}>우선순위</label>
                <select value={newNote.priority} onChange={function(e) { var v = e.target.value; setNewNote(function(p) { return Object.assign({}, p, { priority: v }); }); }}
                  style={{ width: "100%", padding: "8px 12px", border: "1px solid #E8E5E0", borderRadius: 6, fontSize: 13, boxSizing: "border-box", background: "#fff" }}>
                  <option value="normal">일반</option>
                  <option value="high">⭐ 중요</option>
                  <option value="urgent">🚨 긴급</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, color: "#888", display: "block", marginBottom: 4 }}>마감일 (선택)</label>
                <input type="date" value={newNote.due_date} onChange={function(e) { var v = e.target.value; setNewNote(function(p) { return Object.assign({}, p, { due_date: v }); }); }}
                  style={{ width: "100%", padding: "8px 12px", border: "1px solid #E8E5E0", borderRadius: 6, fontSize: 13, boxSizing: "border-box", outline: "none" }} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button onClick={function() { setShowAdd(false); }}
                style={{ padding: "10px 18px", background: "#fff", border: "1px solid #E8E5E0", borderRadius: 8, fontSize: 13, cursor: "pointer" }}>취소</button>
              <button onClick={addTeamNote}
                style={{ padding: "10px 18px", background: "#1A1917", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>등록</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
