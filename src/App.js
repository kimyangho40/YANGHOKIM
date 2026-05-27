/* eslint-disable no-unused-vars, react-hooks/exhaustive-deps, no-redeclare */
import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

// ── Supabase 설정 ─────────────────────────────────────────────────────────────
const SUPABASE_URL = "https://ujdrjvnihxjvbkezjvwc.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqZHJqdm5paHhqdmJrZXpqdndjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzOTgzODIsImV4cCI6MjA5Mzk3NDM4Mn0.K0zbRGT8SrDBeZoDyc_VM61xAHZye8V0p0m2PemNUWM";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ── 상수 ─────────────────────────────────────────────────────────────────────
const STAGES = ["상담/진단완료", "필수서류 및 인증서요청", "기관신청대기/방문예정", "스크립트 전달 완료", "기관신청완료/방문완료", "심사중/실태조사대기", "실태조사완료/약정완료", "자금집행완료", "수수료대기 및 입금요청", "입금완료/사후관리", "추가 진행 예정", "추가 진행 중", "기타"];
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
  "기타":                    { bg: "#F7F6F3", text: "#666",    border: "#D1D5DB" },
};
const AGENCIES = ["소상공인시장진흥공단","중소벤처기업진흥공단","신용보증기금","신용보증재단","기술보증기금","서민금융진흥원","구조혁신&사업전환","기타"];
const JUNGINGONG_PRODUCTS = ["창업기반지원","청년창업자금","혁신성장지원","개발기술사업화","재창업","내수기업수출기업화(10만불 미만)","수출기업글로벌화(10만불 이상)","사업전환","구조개선","기타"];
const SOJINGONG_PRODUCTS = ["신용취약자금","재도전특별자금","혁신성장 촉진자금(스마트 기술)","혁신성장 촉진자금(2년 연속 매출 10% 신장)","혁신성장 촉진자금(수출 자금)","혁신성장 촉진자금(그 외 기타)","상생성장지원자금","그 외 기타","대리대출"];
const AGENCY_GROUPS = [
  { id: "소상공인시장진흥공단", label: "소상공인시장진흥공단", color: "#4338CA" },
  { id: "신용보증기금", label: "신용보증기금", color: "#0F6E56" },
  { id: "기술보증기금", label: "기술보증기금", color: "#0369A1" },
  { id: "신용보증재단", label: "신용보증재단", color: "#B45309" },
  { id: "중소벤처기업진흥공단", label: "중소벤처기업진흥공단", color: "#7C3AED" },
  { id: "구조혁신&사업전환", label: "구조혁신&사업전환", color: "#BE123C" },
  { id: "경정청구", label: "경정청구", color: "#0369A1" },
  { id: "기타", label: "기타", color: "#555" },
];
const DOC_LIST = ["사업자등록증","최근 3년치 재무제표 (23년~25년)","최근 3년치 부가세 증명원 (23년~25년)","법인 기업 금융거래 확인서","대표자 신용점수","4대보험 명부","월별 고용보험 가입자 명부","그 외 사업전환 필수 서류","최근 1년 수출실적 증명서","사업자 대출 금융거래 확인서","대표자 신분증","임대차 계약서","회사 소개서 또는 사업계획서"];
const TEAMS = ["법인전담","개인전담","관리자"];
const ASSIGNEES = ["미현","유진","관호","지혜","현애","인선","동일","양호"];
const INDUSTRY_OPTIONS = ["제조업","농업·어업","숙박업","음식점업","전자상거래업","정보통신업","도소매업","서비스업","창고업","자동차임대업"];
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
  };
  return icons[name] || null;
};

// ── 유틸 ─────────────────────────────────────────────────────────────────────
const docRate = (docs) => {
  if (!docs || docs.length === 0) return 0;
  return Math.round(docs.filter(d => d.received).length / docs.length * 100);
};

// ── 메인 앱 ──────────────────────────────────────────────────────────────────
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
  return <CRMApp profile={profile} session={session} />;
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
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "60px 80px" }}>
        <div style={{ fontSize: 11, letterSpacing: "0.14em", color: "#555", marginBottom: 12, textTransform: "uppercase" }}>Policy Fund</div>
        <h1 style={{ fontSize: 42, fontWeight: 800, color: "#F7F6F3", letterSpacing: "-0.04em", lineHeight: 1.15, margin: "0 0 20px" }}>
          정책자금<br />컨설팅 CRM
        </h1>
        <p style={{ color: "#666", fontSize: 15, lineHeight: 1.7, maxWidth: 360 }}>
          200개 업체, 15명 팀원의 업무를<br />하나의 화면에서 관리하세요.
        </p>
        <div style={{ marginTop: 48, display: "flex", flexDirection: "column", gap: 14 }}>
          {["5단계 파이프라인 추적","서류 체크리스트 자동화","정체 업체 실시간 알림","팀원별 업무 대시보드"].map(f => (
            <div key={f} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#2E2C29", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name="check" size={11} color="#4ADE80" />
              </div>
              <span style={{ color: "#888", fontSize: 13 }}>{f}</span>
            </div>
          ))}
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
      const todayStr = new Date().toISOString().slice(0, 10);
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
    const matchSearch = !s || c.name?.includes(s) || c.representative?.includes(s);
    const matchStage = filterStage === "전체" || c.stage === filterStage;
    const matchAssignee = filterAssignee === "전체" || c.assignee === filterAssignee;
    const matchType = filterType === "전체" || c.type === filterType;
    return matchSearch && matchStage && matchAssignee && matchType;
  }), [companies, search, filterStage, filterAssignee, filterType]);

  const stagnant = companies.filter(c => c.stagnant_days >= 7);
  const assignees = ["전체", ...new Set(profiles.map(p => p.name))];

  const logout = () => supabase.auth.signOut();

  // 30분 자동 로그아웃
  useEffect(() => {
    let timer;
    const reset = () => {
      clearTimeout(timer);
      timer = setTimeout(() => { supabase.auth.signOut(); }, 30 * 60 * 1000);
    };
    const events = ["mousedown", "keydown", "touchstart", "scroll"];
    events.forEach(e => window.addEventListener(e, reset));
    reset();
    return () => { clearTimeout(timer); events.forEach(e => window.removeEventListener(e, reset)); };
  }, []);

  // 회사 저장
  const saveCompany = async (data, prevData) => {
    const { documents, ...rest } = data;
    const { error } = await supabase.from("companies").update({
      name: rest.name, type: rest.type, representative: rest.representative,
      phone: rest.phone, stage: rest.stage, assignee: rest.assignee,
      agency: rest.agency, received_docs: rest.received_docs, last_contact: rest.last_contact,
      next_contact: rest.next_contact, call_count: rest.call_count,
      fee: rest.fee, fee_status: rest.fee_status,
      revenue_2023: rest.revenue_2023, revenue_2024: rest.revenue_2024, revenue_2025: rest.revenue_2025,
      issue: rest.issue, next_action: rest.next_action,
      employee_count: rest.employee_count || null, credit_score: rest.credit_score || null,
      credit_score_kcb: rest.credit_score_kcb ? parseInt(rest.credit_score_kcb) || null : null,
      credit_score_nice: rest.credit_score_nice ? parseInt(rest.credit_score_nice) || null : null,
      founded_year: rest.founded_year || null, founded_month: rest.founded_month ? parseInt(rest.founded_month) || null : null,
      application_month: rest.application_month || null,
      business_number: rest.business_number || null,
      business_type: rest.business_type || null,
      industry: rest.industry || null,
      region: rest.region || null,
      contract_date: rest.contract_date || null,
    }).eq("id", rest.id);
    if (!error) {
      // 신청예정월 + 담당기관이 있으면 기관별 현황에 자동 반영
      if (rest.application_month && rest.agency) {
        var monthNum = parseInt(rest.application_month.split("-")[1], 10);
        var yearNum = parseInt(rest.application_month.split("-")[0], 10);
        var AGENCY_MAP = {
          "소상공인시장진흥공단": "소상공인시장진흥공단",
          "중소벤처기업진흥공단": "중소벤처기업진흥공단",
          "신용보증기금": "신용보증기금",
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
              notes: rest.issue || null,
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
      showToast("저장됐어요!"); fetchAll();
    }
    else showToast("저장 실패: " + error.message, "error");
  };

  // 서류 토글
  const toggleDoc = async (docId, current) => {
    await supabase.from("documents").update({ received: !current, received_at: !current ? new Date().toISOString().slice(0,10) : null }).eq("id", docId);
    fetchAll();
  };

  // 신규 회사 추가
  const addCompany = async (form) => {
    if (!form.name || !form.name.trim()) { showToast("업체명을 입력해주세요.", "error"); return; }
    if (!form.representative || !form.representative.trim()) { showToast("대표자명을 입력해주세요.", "error"); return; }
    var insertData = {
      name: form.name.trim(),
      type: form.type || "법인",
      representative: form.representative.trim(),
      phone: form.phone || "",
      stage: form.stage || "상담/진단완료",
      assignee: form.assignee || "",
      agency: form.agency || "",
      last_contact: new Date().toISOString().slice(0,10),
      issue: form.issue || "",
      next_action: form.next_action || "",
      fee: form.fee || 5,
      fee_status: "미수령",
      stagnant_days: 0,
      stage_updated_at: new Date().toISOString().slice(0,10),
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
    // 빠른 등록에서 agency_list(배열)와 agency 처리
    if (Array.isArray(form.agency_list) && form.agency_list.length > 0) {
      insertData.agency = form.agency_list.join(", ");
      insertData.agency_list = form.agency_list.join(", ");
    } else if (form.agency_list_str) {
      insertData.agency_list = form.agency_list_str;
    }

    const { data: co, error } = await supabase.from("companies").insert(insertData).select().single();
    if (!error && co) {
      // 서류 체크리스트 자동 생성
      var docsInsert = await supabase.from("documents").insert(DOC_LIST.map(d => ({ company_id: co.id, doc_name: d, received: false }))).select();
      var newCompany = Object.assign({}, co, { documents: docsInsert.data || [] });
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
        const todayStr = new Date().toISOString().slice(0, 10);
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
          {/* 자주 쓰는 메뉴 */}
          <div style={{ fontSize: 10, color: "#444", letterSpacing: "0.08em", padding: "4px 12px 6px", fontWeight: 600 }}>주요 메뉴</div>
          {[
            { id: "dashboard",  label: "대시보드",   icon: "dashboard" },
            { id: "mytodo",     label: "내 할일",     icon: "check" },
            { id: "agency",     label: "기관별 현황", icon: "building" },
            { id: "worknotes",  label: "업무 노트",   icon: "edit" },
            { id: "list",       label: "기업 목록",   icon: "list" },
            { id: "pipeline",   label: "파이프라인",  icon: "pipeline" },
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
            <div>
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
              {companies.filter(c => c.next_contact === new Date().toISOString().slice(0,10)).length > 0 && (
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
                <div style={{ padding: "40px 0", textAlign: "center", color: "#CCC", fontSize: 13 }}>
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
            {view === "dashboard" && <Dashboard companies={companies} profiles={profiles} stagnant={stagnant} onSelectCompany={setSelectedCompany} setView={setView} setFilterStage={setFilterStage} setDashboardFilter={setDashboardFilter} onAdd={() => setShowAdd(true)} />}
            {view === "agency" && <AgencyView jumpToMonth={agencyJumpMonth} jumpToGroup={agencyJumpGroup} />}
            {view === "dbleads" && <DBLeadsView />}
            {view === "settlement" && <SettlementView />}
            {view === "activitylog" && <ActivityLogView />}
            {view === "worknotes" && <WorkNotesView profile={profile} onBadgeUpdate={function() { fetchWorkNotesBadge(profile?.name); }} />}
            {view === "calendar" && <CalendarView companies={companies} onSelectCompany={setSelectedCompany} profile={profile} />}
            {view === "manual" && <ManualView />}
            {view === "pipeline" && <PipelineView filtered={filtered} filterAssignee={filterAssignee} setFilterAssignee={setFilterAssignee} assignees={assignees} onSelect={setSelectedCompany} />}
            {view === "mytodo" && <MyTodoView currentUser={profile?.name} isAdmin={profile?.role === "admin" || profile?.name === "양호"} onSelectCompany={setSelectedCompany} setView={setView} />}
            {view === "list" && <ListView filtered={filtered} search={search} setSearch={setSearch} filterStage={filterStage} setFilterStage={setFilterStage} filterAssignee={filterAssignee} setFilterAssignee={setFilterAssignee} filterType={filterType} setFilterType={setFilterType} assignees={assignees} onSelect={setSelectedCompany} onAdd={() => setShowAdd(true)} setCompanies={setCompanies} showToast={showToast} dashboardFilter={dashboardFilter} setDashboardFilter={setDashboardFilter} />}
            {view === "stagnant" && <StagnantView stagnant={stagnant} onSelect={setSelectedCompany} />}
            {view === "members" && profile.role === "admin" && <MembersView profiles={profiles} onRefresh={fetchAll} showToast={showToast} />}
          </>
        )}
      </div>

      {selectedCompany && (
        <CompanyModal
          company={selectedCompany}
          onClose={() => setSelectedCompany(null)}
          onSave={saveCompany}
          onToggleDoc={toggleDoc}
          currentUser={profile}
          onAgencyRegistered={function() {}}
        />
      )}
      {showAdd && <AddModal onClose={() => setShowAdd(false)} onAdd={addCompany} assignees={assignees.filter(a => a !== "전체")} />}

      {/* 모바일 하단 네비게이션 */}
      <div className="crm-mobile-nav">
        {[
          { id: "dashboard",  label: "홈",      icon: "dashboard" },
          { id: "agency",     label: "기관",     icon: "building" },
          { id: "dbleads",    label: "DB",       icon: "phone" },
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

// ── 대시보드 ──────────────────────────────────────────────────────────────────
function Dashboard({ companies, profiles, stagnant, onSelectCompany, setView, setFilterStage, setDashboardFilter, onAdd }) {
  const contractDone = companies.filter(c => c.fee_status === "수수료수령완료").length;
  const contracted = companies.filter(c => c.fee_status !== "미수령").length;
  // const thisWeek = companies.filter(c => c.next_contact && c.next_contact <= "2026-05-15").length;
  const stageCount = STAGES.reduce((a, s) => ({ ...a, [s]: companies.filter(c => c.stage === s).length }), {});

  const [agencyCases, setAgencyCases] = useState([]);
  const [kpiGoals, setKpiGoals] = useState([]);
  const [editingKpi, setEditingKpi] = useState(false);
  const [kpiEdits, setKpiEdits] = useState({});
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
  const DASHBOARD_AGENCY_GROUPS = [
    { id: "소상공인시장진흥공단", label: "소진공", color: "#4338CA", ids: ["소상공인시장진흥공단"] },
    { id: "중소벤처기업진흥공단", label: "중진공", color: "#7C3AED", ids: ["중소벤처기업진흥공단","구조혁신&사업전환"] },
    { id: "기금", label: "보증기금", color: "#0F6E56", ids: ["신용보증기금"] },
    { id: "재단", label: "보증재단", color: "#B45309", ids: ["신용보증재단"] },
    { id: "기타", label: "경정청구/기타", color: "#555", ids: ["경정청구","기타"] },
  ];
  const agencyStats = DASHBOARD_AGENCY_GROUPS.map(function(g) {
    const cases = monthCases.filter(c => g.ids.includes(c.agency_group));
    const approved = cases.filter(c => ["승인","약정","완료"].includes(c.status)).length;
    const total = cases.length;
    const rate = total > 0 ? Math.round(approved / total * 100) : 0;
    return { id: g.id, label: g.label, color: g.color, ids: g.ids, total, approved, rate };
  });

  // 담당자별 KPI
  const assigneeKpi = ASSIGNEES.map(function(name) {
    const myCases = monthCases.filter(c => c.assignee === name);
    const approved = myCases.filter(c => ["승인","약정","완료"].includes(c.status)).length;
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

      {/* 기관별 이번 달 현황 */}
      {true && (
        <div style={{ background: "#fff", borderRadius: 12, padding: "20px 24px", border: "1px solid #E8E5E0", marginBottom: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>기관별 이번 달 현황 <span style={{ fontSize: 12, color: "#888", fontWeight: 400 }}>{thisMonth}월</span></div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10 }}>
            {agencyStats.map(function(g) {
              var allCases = agencyCases.filter(function(c) { return g.ids.includes(c.agency_group); });
              var doneCases = allCases.filter(function(c) { return ["승인","약정","완료"].includes(c.status) && c.contract_date; });
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

      {/* 🆕 미완료 업무 노트 위젯 */}
      {(function() {
        var today = new Date().toISOString().slice(0, 10);
        var myTodos = companies ? [] : []; // 실제 work_notes에서 가져와야 하므로 별도 처리
        return null; // 업무노트는 WorkNotesView에서 관리
      })()}

      {/* 🆕 오늘의 할 일 위젯 */}
      {(function() {
        var today = new Date().toISOString().slice(0, 10);
        var tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
        var weekLater = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
        var todayItems = companies.filter(function(c) { return c.next_contact === today || c.contract_date === today; });
        var tomorrowItems = companies.filter(function(c) { return c.next_contact === tomorrow || c.contract_date === tomorrow; });
        var overdue = companies.filter(function(c) { return c.next_contact && c.next_contact < today; });
        var stagnant14 = companies.filter(function(c) { return c.stagnant_days >= 14; });
        var stagnant7 = companies.filter(function(c) { return c.stagnant_days >= 7 && c.stagnant_days < 14; });
        var weekContracts = companies.filter(function(c) { return c.contract_date && c.contract_date > today && c.contract_date <= weekLater; });
        var totalCount = todayItems.length + tomorrowItems.length + overdue.length + stagnant14.length + stagnant7.length + weekContracts.length;
        if (totalCount === 0) return null;
        return (
          <div style={{ background: "linear-gradient(135deg, #FFF7ED 0%, #FEF3C7 100%)", borderRadius: 12, padding: "20px 24px", border: "1px solid #FCD34D", marginBottom: 18 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <span style={{ fontSize: 16 }}>📋</span>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#92400E" }}>오늘의 할 일</div>
              <span style={{ fontSize: 11, color: "#92400E", background: "#FEF3C7", padding: "2px 8px", borderRadius: 99, fontWeight: 600, border: "1px solid #FCD34D" }}>{totalCount}건</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
              {/* 📋 내 할일 위젯 - work_notes 체크박스 기반 */}
              <MyTodoWidget setView={setView} />
              
              {/* companies 기반 위젯 제거됨 - work_notes 기반 "내 할일" 위젯이 메인 */}
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
            </div>
          </div>
        );
      })()}

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
          <div style={{ textAlign: "center", color: "#CCC", fontSize: 13, padding: "20px 0" }}>
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
          {companies.filter(c => c.stagnant_days >= 7 || (c.next_contact && c.next_contact <= new Date().toISOString().slice(0,10))).slice(0, 6).map(c => (
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
          {companies.filter(c => c.stagnant_days >= 7 || (c.next_contact && c.next_contact <= new Date().toISOString().slice(0,10))).length === 0 && (
            <div style={{ textAlign: "center", color: "#CCC", fontSize: 13, padding: "30px 0" }}>오늘 이슈가 없어요 👍</div>
          )}
        </div>
      </div>
    </>
  );
}

// ── 파이프라인 ────────────────────────────────────────────────────────────────
function PipelineView({ filtered, filterAssignee, setFilterAssignee, assignees, onSelect }) {
  return (
    <>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.03em", margin: 0 }}>파이프라인</h1>
          <p style={{ color: "#888", fontSize: 13, margin: "4px 0 0" }}>단계별 업체 현황</p>
        </div>
        <select value={filterAssignee} onChange={e => setFilterAssignee(e.target.value)}
          style={{ padding: "7px 12px", border: "1px solid #E8E5E0", borderRadius: 7, fontSize: 13, background: "#fff", cursor: "pointer" }}>
          {assignees.map(a => <option key={a}>{a}</option>)}
        </select>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, alignItems: "start" }}>
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
          return (
            <div key={stage} style={{ background: "#fff", borderRadius: 14, border: "1px solid #E8E5E0", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
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
              <div style={{ padding: "8px", display: "flex", flexDirection: "column", gap: 6, maxHeight: "calc(100vh - 220px)", overflowY: "auto" }}>
                {items.map(co => {
                  const docPct = docRate(co.documents);
                  return (
                    <div key={co.id} onClick={() => onSelect(co)}
                      style={{ background: co.stagnant_days >= 7 ? "#FEF2F2" : "#F7F6F3", borderRadius: 10, padding: "10px 12px", cursor: "pointer", border: co.stagnant_days >= 7 ? "1px solid #FECACA" : "1px solid transparent", transition: "all 0.15s" }}
                      onMouseEnter={e => e.currentTarget.style.background = co.stagnant_days >= 7 ? "#FEE2E2" : "#EDEDE9"}
                      onMouseLeave={e => e.currentTarget.style.background = co.stagnant_days >= 7 ? "#FEF2F2" : "#F7F6F3"}>
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
                {items.length === 0 && <div style={{ fontSize: 12, color: "#DDD", textAlign: "center", padding: "24px 0" }}>없음</div>}
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
function MyTodoView({ currentUser, isAdmin, onSelectCompany, setView }) {
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
            if (itemDueDate < new Date(Date.now() - 180 * 86400000).toISOString().slice(0, 10)) {
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
  var today = new Date().toISOString().slice(0, 10);
  var tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  var weekEnd = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);

  var unchecked = allItems.filter(function(i) { return !i.checked; });
  var checked = allItems.filter(function(i) { return i.checked; });
  
  var overdue = unchecked.filter(function(i) { return i.dueDate && i.dueDate < today; });
  var todayItems = unchecked.filter(function(i) { return i.dueDate === today; });
  var tomorrowItems = unchecked.filter(function(i) { return i.dueDate === tomorrow; });
  var thisWeek = unchecked.filter(function(i) { return i.dueDate && i.dueDate > tomorrow && i.dueDate <= weekEnd; });
  var noDue = unchecked.filter(function(i) { return !i.dueDate; });
  var later = unchecked.filter(function(i) { return i.dueDate && i.dueDate > weekEnd; });

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

      {allItems.length === 0 && (
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
      
      var today = new Date().toISOString().slice(0, 10);
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
  
  if (count.total === 0) return null;
  
  return (
    <div onClick={function() { setView("mytodo"); }}
      style={{ background: "linear-gradient(135deg, #4338CA 0%, #6366F1 100%)", borderRadius: 10, padding: "14px 16px", cursor: "pointer", color: "#fff", boxShadow: "0 2px 8px rgba(67, 56, 202, 0.2)" }}>
      <div style={{ fontSize: 10, fontWeight: 700, marginBottom: 4, opacity: 0.9 }}>📋 내 할일</div>
      <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>{count.total}건</div>
      <div style={{ fontSize: 10, opacity: 0.9 }}>
        {count.overdue > 0 && <span style={{ marginRight: 6 }}>⏰ 지남 {count.overdue}</span>}
        {count.today > 0 && <span>📅 오늘 {count.today}</span>}
        {count.overdue === 0 && count.today === 0 && <span>모두 진행 중</span>}
      </div>
    </div>
  );
}

// ── 업종 셀 컴포넌트 (인라인 편집 + 자동완성 드롭다운) ──────────────────────
function IndustryCell({ co, setCompanies }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState("");
  const ref = useRef(null);

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
        background: selectedList.length > 0 ? "#EEF2FF" : "transparent", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
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
          {INDUSTRY_OPTIONS.map(function(opt) {
            var sel = selectedList.indexOf(opt) >= 0;
            return (
              <button key={opt} onClick={function() { toggleItem(opt); }}
                style={{ padding: "3px 9px", borderRadius: 99, fontSize: 10, fontWeight: sel ? 700 : 400,
                  background: sel ? "#4338CA" : "#fff", color: sel ? "#fff" : "#666",
                  border: sel ? "none" : "1px solid #E8E5E0", cursor: "pointer" }}>
                {sel ? "✓ " : ""}{opt}
              </button>
            );
          })}
        </div>
        {/* 직접 입력한 커스텀 업종 표시 */}
        {selectedList.filter(function(s) { return INDUSTRY_OPTIONS.indexOf(s) < 0; }).length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 8 }}>
            {selectedList.filter(function(s) { return INDUSTRY_OPTIONS.indexOf(s) < 0; }).map(function(s) {
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

function ListView({ filtered, search, setSearch, filterStage, setFilterStage, filterAssignee, setFilterAssignee, filterType, setFilterType, assignees, onSelect, onAdd, setCompanies, showToast, dashboardFilter, setDashboardFilter }) {
  const [showCompanyTrash, setShowCompanyTrash] = useState(false);
  const [trashedCompanies, setTrashedCompanies] = useState([]);

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
          <button onClick={openTrash} style={{ display: "flex", alignItems: "center", gap: 6, background: "#fff", color: "#888", border: "1px solid #E8E5E0", borderRadius: 8, padding: "8px 14px", fontSize: 12, cursor: "pointer" }}>
            🗑️ 휴지통{trashedCompanies.length > 0 ? " (" + trashedCompanies.length + ")" : ""}
          </button>
        </div>
      </div>
      <div style={{ background: "#fff", borderRadius: 10, padding: "12px 16px", border: "1px solid #E8E5E0", marginBottom: 14, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 160 }}>
          <div style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }}><Icon name="search" size={14} color="#AAA" /></div>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="업체명 · 대표자 검색"
            style={{ width: "100%", padding: "8px 10px 8px 32px", border: "1px solid #E8E5E0", borderRadius: 7, fontSize: 13, outline: "none", boxSizing: "border-box" }} />
        </div>
        {[
          { v: filterStage, set: setFilterStage, opts: ["전체", ...STAGES] },
          { v: filterAssignee, set: setFilterAssignee, opts: assignees },
          { v: filterType, set: setFilterType, opts: ["전체", "법인", "개인"] },
        ].map(({ v, set, opts }, i) => (
          <select key={i} value={v} onChange={e => set(e.target.value)}
            style={{ padding: "8px 10px", border: "1px solid #E8E5E0", borderRadius: 7, fontSize: 13, background: "#fff", cursor: "pointer" }}>
            {opts.map(o => <option key={o}>{o}</option>)}
          </select>
        ))}
        {(search || filterStage !== "전체" || filterAssignee !== "전체" || filterType !== "전체") && (
          <button onClick={() => { setSearch(""); setFilterStage("전체"); setFilterAssignee("전체"); setFilterType("전체"); }}
            style={{ fontSize: 12, color: "#888", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>초기화</button>
        )}
      </div>
      <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #E8E5E0", overflow: "hidden" }}>
        <div style={{ overflowX: "auto", maxHeight: "calc(100vh - 220px)", overflowY: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1200 }}>
          <thead>
            <tr style={{ background: "#F7F6F3", borderBottom: "1px solid #E8E5E0", position: "sticky", top: 0, zIndex: 2 }}>
              {["업체명","유형","지역","업종","대표자","담당","진행단계","정체일수","신청예정/자금","계약일","진행기관","23년~25년 매출","신용점수","기타","작업"].map(h => (
                <th key={h} style={{ padding: "10px 8px", fontSize: 11, fontWeight: 600, color: "#888", textAlign: "left", letterSpacing: "0.03em", whiteSpace: "nowrap", background: "#F7F6F3", maxWidth: h === "지역" ? 90 : h === "대표자" ? 70 : undefined }}>{h}</th>
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
                  <td style={{ padding: "11px 13px", fontSize: 13, fontWeight: 600, whiteSpace: "nowrap" }} onClick={e => e.stopPropagation()}>
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
                        <span>{co.name}</span>
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
                  <td style={{ padding: "11px 13px", whiteSpace: "nowrap" }}><span style={{ fontSize: 11, padding: "2px 7px", borderRadius: 99, background: co.type === "법인" ? "#EEF2FF" : "#F0FDF4", color: co.type === "법인" ? "#4338CA" : "#15803D", fontWeight: 600 }}>{co.type === "법인" ? "법인사업자" : "개인사업자"}</span></td>
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
                        {co.region || <span style={{ color: "#CCC" }}>+ 입력</span>}
                        <Icon name="edit" size={10} color="#AAA" />
                      </span>
                    )}
                  </td>
                  <td style={{ padding: "6px 8px", fontSize: 12, color: "#555", whiteSpace: "nowrap", maxWidth: 80 }} onClick={function(e) { e.stopPropagation(); }}>
                    <IndustryCell co={co} setCompanies={setCompanies} />
                  </td>
                  <td style={{ padding: "11px 8px", fontSize: 12, color: "#555", whiteSpace: "nowrap", maxWidth: 70, overflow: "hidden", textOverflow: "ellipsis" }}>{co.representative || "-"}</td>
                  <td style={{ padding: "11px 13px", fontSize: 12, whiteSpace: "nowrap" }}>{co.assignee || "-"}</td>
                  <td style={{ padding: "11px 13px", whiteSpace: "nowrap" }}><span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 99, background: sc.bg, color: sc.text, border: `1px solid ${sc.border}`, fontWeight: 600 }}>{co.stage}</span></td>
                  <td style={{ padding: "11px 13px", whiteSpace: "nowrap", textAlign: "center" }}>{(function() { var d = co.stagnant_days || 0; if (d >= 14) return <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 99, background: "#FEE2E2", color: "#DC2626", fontWeight: 700 }}>⚠ {d}일</span>; if (d >= 7) return <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 99, background: "#FEF3C7", color: "#B45309", fontWeight: 700 }}>{d}일</span>; return <span style={{ fontSize: 11, color: "#AAA" }}>{d}일</span>; })()}</td>
                  <td style={{ padding: "11px 13px", fontSize: 11, color: "#555", maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{co.fund_plan || "-"}</td>
                  <td style={{ padding: "11px 13px", fontSize: 12, color: "#555", whiteSpace: "nowrap" }}>{co.contract_date || "-"}</td>
                  <td style={{ padding: "11px 13px", fontSize: 11, color: "#555", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{co.agency || "-"}</td>
                  <td style={{ padding: "11px 13px", fontSize: 11, color: "#555", whiteSpace: "nowrap" }}>{[formatRevenue(co.revenue_2023), formatRevenue(co.revenue_2024), formatRevenue(co.revenue_2025)].filter(r=>r&&r!=="-").join(" / ") || "-"}</td>
                  <td style={{ padding: "11px 13px", fontSize: 11, color: "#555", whiteSpace: "nowrap" }}>{(co.credit_score_kcb || co.credit_score_nice) ? ((co.credit_score_kcb || "-") + " / " + (co.credit_score_nice || "-")) : "-"}</td>
                  <td style={{ padding: "11px 13px", fontSize: 11, color: "#555", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{co.next_action || "-"}</td>
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
        {filtered.length === 0 && <div style={{ padding: "40px", textAlign: "center", color: "#CCC", fontSize: 13 }}>검색 결과가 없어요</div>}
      </div>

      {/* 기업목록 휴지통 모달 */}
      {showCompanyTrash && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={function(e) { if (e.target === e.currentTarget) setShowCompanyTrash(false); }}>
          <div style={{ background: "#fff", borderRadius: 14, width: 640, maxHeight: "80vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #E8E5E0", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, background: "#fff" }}>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>🗑️ 기업목록 휴지통 ({trashedCompanies.length}건)</h2>
              <button onClick={function() { setShowCompanyTrash(false); }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "#888" }}>✕</button>
            </div>
            <div style={{ padding: "16px 24px" }}>
              {trashedCompanies.length === 0 ? (
                <div style={{ padding: "40px 0", textAlign: "center", color: "#CCC", fontSize: 13 }}>휴지통이 비어 있습니다</div>
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
    await supabase.from("profiles").update({ role }).eq("id", id);
    showToast("권한이 변경됐어요");
    onRefresh();
  };

  return (
    <>
      <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.03em", margin: "0 0 22px" }}>팀원 관리</h1>
      <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #E8E5E0", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#F7F6F3", borderBottom: "1px solid #E8E5E0" }}>
              {["이름","소속팀","권한","가입일"].map(h => (
                <th key={h} style={{ padding: "11px 16px", fontSize: 11, fontWeight: 600, color: "#888", textAlign: "left" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {profiles.map(p => (
              <tr key={p.id} style={{ borderBottom: "1px solid #F0EDE8" }}>
                <td style={{ padding: "13px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#1A1917", color: "#F7F6F3", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700 }}>{p.name[0]}</div>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{p.name}</span>
                  </div>
                </td>
                <td style={{ padding: "13px 16px", fontSize: 13, color: "#555" }}>{p.team}</td>
                <td style={{ padding: "13px 16px" }}>
                  <select value={p.role} onChange={e => updateRole(p.id, e.target.value)}
                    style={{ padding: "5px 9px", border: "1px solid #E8E5E0", borderRadius: 6, fontSize: 12, background: "#fff", cursor: "pointer" }}>
                    <option value="member">팀원</option>
                    <option value="admin">관리자</option>
                  </select>
                </td>
                <td style={{ padding: "13px 16px", fontSize: 12, color: "#888" }}>{p.created_at?.slice(0,10)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ marginTop: 16, background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 10, padding: "14px 18px", fontSize: 13, color: "#92400E" }}>
        💡 새 팀원 추가: 팀원에게 앱 주소를 공유하고 이메일로 회원가입하게 해주세요. 가입 후 이 화면에 자동으로 나타나요.
      </div>
    </>
  );
}

// ── 기업 상세 모달 ─────────────────────────────────────────────────────────────
function CompanyModal({ company, onClose, onSave, onToggleDoc, currentUser, onAgencyRegistered }) {
  const [tab, setTab] = useState("info");
  const [data, setData] = useState({ ...company });
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(company.name || "");
  const [agencyCases, setAgencyCases] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [commLogs, setCommLogs] = useState([]);
  const [commInput, setCommInput] = useState("");
  const [loadingExtra, setLoadingExtra] = useState(false);
  const [kakaoText, setKakaoText] = useState("");
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

  var saveCommLog = async function() {
    if (!commInput.trim()) return;
    var r = await supabase.from("activity_logs").insert({
      company_id: company.id, business_name: company.name,
      assignee: currentUser?.name || "", log_type: "manual_memo",
      memo: commInput.trim(), logged_by: currentUser?.name || "",
    });
    if (!r.error) {
      setCommInput("");
      var r2 = await supabase.from("activity_logs").select("*").eq("company_id", company.id).order("created_at", { ascending: false });
      if (!r2.error) { setCommLogs(r2.data || []); }
    }
  };

  const copyComm = () => {
    const txt = `[${data.name}] / ${data.representative} 대표\n현재단계: ${data.stage}\n이슈: ${data.issue}\n다음액션: ${data.next_action}\n기한: ${data.next_contact}\n담당: ${data.assignee}`;
    navigator.clipboard?.writeText(txt).then(() => {});
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "flex-end" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
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
              <div style={{ fontSize: 13, color: "#666", marginTop: 4, display: "flex", alignItems: "center", gap: 6 }}>
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
            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#888" }}><Icon name="x" size={20} color="#888" /></button>
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

        {/* 탭 */}
        <div style={{ display: "flex", borderBottom: "1px solid #E8E5E0", background: "#FAFAF8", overflowX: "auto" }}>
          {[
            { id: "info", label: "기본정보" },
            { id: "docs", label: "서류현황" },
            { id: "history", label: "이슈·액션" },
            { id: "agency", label: "기관진행", badge: agencyCases.length },
            { id: "settlement", label: "정산현황", badge: settlements.length },
            { id: "comm", label: "소통내역", badge: commLogs.length },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ flex: "0 0 auto", padding: "11px 14px", fontSize: 12, fontWeight: tab === t.id ? 700 : 400, color: tab === t.id ? "#1A1917" : "#888", background: "none", border: "none", borderBottom: `2px solid ${tab === t.id ? "#1A1917" : "transparent"}`, cursor: "pointer", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 4 }}>
              {t.label}
              {t.badge > 0 && <span style={{ fontSize: 10, background: tab === t.id ? "#1A1917" : "#E8E5E0", color: tab === t.id ? "#fff" : "#888", borderRadius: 99, padding: "1px 5px", fontWeight: 700 }}>{t.badge}</span>}
            </button>
          ))}
        </div>

        <div style={{ flex: 1, padding: "20px 24px", overflowY: "auto" }}>
          {tab === "info" && (
            <>
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
                  <div style={{ fontSize: 11, color: "#888", marginBottom: 6 }}>업종 (복수 선택 가능)</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 6 }}>
                    {INDUSTRY_OPTIONS.map(function(ind) {
                      var cur = (data.industry || "").split(",").map(function(s) { return s.trim(); }).filter(Boolean);
                      var sel = cur.indexOf(ind) >= 0;
                      return (
                        <button key={ind} onClick={function() {
                          var arr = (data.industry || "").split(",").map(function(s) { return s.trim(); }).filter(Boolean);
                          var idx = arr.indexOf(ind);
                          if (idx >= 0) arr.splice(idx, 1);
                          else arr.push(ind);
                          var newVal = arr.length > 0 ? arr.join(", ") : "";
                          setData(function(p) { return Object.assign({}, p, { industry: newVal }); });
                        }}
                          style={{ padding: "4px 9px", borderRadius: 99, fontSize: 11, fontWeight: sel ? 700 : 400,
                            background: sel ? "#4338CA" : "#fff", color: sel ? "#fff" : "#666",
                            border: sel ? "none" : "1px solid #E8E5E0", cursor: "pointer" }}>
                          {sel ? "✓ " : ""}{ind}
                        </button>
                      );
                    })}
                  </div>
                  {/* 직접 입력한 커스텀 업종 표시 */}
                  {(function() {
                    var cur = (data.industry || "").split(",").map(function(s) { return s.trim(); }).filter(Boolean);
                    var custom = cur.filter(function(s) { return INDUSTRY_OPTIONS.indexOf(s) < 0; });
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
                <div style={{ fontSize: 12, color: "#888", marginBottom: 4, fontWeight: 600 }}>최근 3개년 매출액</div>
                <div style={{ fontSize: 10, color: "#AAA", marginBottom: 10 }}>원 단위로 입력 (예: 790000000 → 7.9억 자동 표시)</div>
                <div style={{ display: "flex", gap: 8 }}>
                  {[["2023년", "revenue_2023"], ["2024년", "revenue_2024"], ["2025년", "revenue_2025"]].map(([label, key]) => (
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

          {tab === "docs" && (
            <div>
              <div style={{ background: "#F7F6F3", borderRadius: 8, padding: "12px 14px", marginBottom: 10 }}>
                <div style={{ fontSize: 11, color: "#888", marginBottom: 8 }}>수령 완료 서류 (복수 선택 가능)</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {DOC_LIST.map(function(doc) {
                    const selected = (data.received_docs || "").split(",").map(function(s) { return s.trim(); }).filter(Boolean).includes(doc);
                    return (
                      <button key={doc} onClick={function() {
                        const current = (data.received_docs || "").split(",").map(function(s) { return s.trim(); }).filter(Boolean);
                        const next = selected ? current.filter(function(a) { return a !== doc; }) : [...current, doc];
                        setData(function(p) { return { ...p, received_docs: next.join(", ") }; });
                      }} style={{ fontSize: 11, padding: "6px 11px", borderRadius: 99, border: selected ? "1px solid #15803D" : "1px solid #E8E5E0", background: selected ? "#15803D" : "#fff", color: selected ? "#fff" : "#555", cursor: "pointer", fontWeight: selected ? 700 : 400 }}>
                        {doc}
                      </button>
                    );
                  })}
                </div>
                {data.received_docs ? (
                  <div style={{ fontSize: 11, color: "#15803D", marginTop: 10, fontWeight: 600 }}>
                    수령완료: {data.received_docs.split(",").filter(Boolean).length}개
                  </div>
                ) : null}
              </div>
              <div style={{ background: "#F7F6F3", borderRadius: 8, padding: "12px 14px" }}>
                <div style={{ fontSize: 11, color: "#888", marginBottom: 8 }}>미수령 서류</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {DOC_LIST.filter(function(doc) {
                    return !(data.received_docs || "").split(",").map(function(s) { return s.trim(); }).includes(doc);
                  }).map(function(doc) {
                    return <span key={doc} style={{ fontSize: 11, padding: "5px 10px", borderRadius: 99, background: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA" }}>{doc}</span>;
                  })}
                </div>
              </div>
            </div>
          )}

          {tab === "history" && (
            <>
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, color: "#888", marginBottom: 6, fontWeight: 600 }}>현재 이슈</div>
                <textarea value={data.issue || ""} onChange={function(e) { var v = e.target.value; setData(function(p) { return { ...p, issue: v }; }); }}
                  style={{ width: "100%", padding: "11px 13px", border: "1px solid #FED7AA", borderRadius: 8, fontSize: 13, resize: "vertical", minHeight: 80, background: "#FFF7ED", color: "#92400E", boxSizing: "border-box", outline: "none" }} />
              </div>
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 12, color: "#888", marginBottom: 6, fontWeight: 600 }}>차기 업무 / 다음 액션</div>
                <textarea value={data.next_action || ""} onChange={function(e) { var v = e.target.value; setData(function(p) { return { ...p, next_action: v }; }); }}
                  style={{ width: "100%", padding: "11px 13px", border: "1px solid #E8E5E0", borderRadius: 8, fontSize: 13, resize: "vertical", minHeight: 80, boxSizing: "border-box", outline: "none" }} />
              </div>
              <div style={{ background: "#F7F6F3", border: "1px solid #E8E5E0", borderRadius: 8, padding: "13px 15px" }}>
                <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 10, color: "#555" }}>📋 카톡 공유용 소통 양식</div>
                <textarea
                  value={kakaoText}
                  onChange={function(e) { setKakaoText(e.target.value); }}
                  placeholder={"예시)\n[" + (data.name||"업체명") + "] / " + (data.representative||"대표자") + " 대표\n현재단계: " + (data.stage||"") + "\n이슈: \n다음액션: \n기한: \n담당: " + (data.assignee||"")}
                  style={{ width: "100%", padding: "10px 12px", border: "1px solid #E8E5E0", borderRadius: 6, fontSize: 12, lineHeight: 1.9, fontFamily: "monospace", resize: "vertical", minHeight: 130, background: "#fff", boxSizing: "border-box", outline: "none" }}
                />
                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  <button onClick={function() {
                    var defaultTxt = "[" + data.name + "] / " + data.representative + " 대표\n현재단계: " + data.stage + "\n이슈: " + (data.issue||"") + "\n다음액션: " + (data.next_action||"") + "\n기한: " + (data.next_contact||"") + "\n담당: " + (data.assignee||"");
                    setKakaoText(defaultTxt);
                  }} style={{ fontSize: 12, color: "#888", background: "none", border: "1px solid #E8E5E0", borderRadius: 6, padding: "5px 12px", cursor: "pointer" }}>기본값 불러오기</button>
                  <button onClick={function() { navigator.clipboard?.writeText(kakaoText).then(function() {}); }}
                    style={{ fontSize: 12, color: "#4338CA", background: "none", border: "1px solid #C7D2FE", borderRadius: 6, padding: "5px 12px", cursor: "pointer", fontWeight: 600, display: "flex", alignItems: "center", gap: 5 }}>
                    <Icon name="copy" size={13} color="#4338CA" /> 복사하기
                  </button>
                </div>
              </div>
            </>
          )}

          {/* 기관별 진행현황 탭 */}
          {tab === "agency" && (
            <div>
              {loadingExtra ? (
                <div style={{ textAlign: "center", padding: "40px 0", color: "#AAA", fontSize: 13 }}>불러오는 중...</div>
              ) : agencyCases.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 0", color: "#CCC", fontSize: 13 }}>
                  <div style={{ fontSize: 32, marginBottom: 10 }}>📋</div>
                  기관별 진행 데이터가 없어요
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {agencyCases.map(function(c, i) {
                    var grpObj = AGENCY_GROUPS.find(function(g) { return g.id === c.agency_group; });
                    var grpColor = grpObj ? grpObj.color : "#4338CA";
                    return (
                      <div key={c.id} style={{ background: "#F7F6F3", borderRadius: 10, padding: "14px 16px", border: "1px solid #E8E5E0" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                            <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 99, background: grpColor, color: "#fff", fontWeight: 700 }}>{c.agency_group}</span>
                            {c.agency_sub && <span style={{ fontSize: 11, color: "#888" }}>{c.agency_sub}</span>}
                            <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 99, background: "#fff", color: "#555", border: "1px solid #E8E5E0" }}>{c.status || "진행중"}</span>
                          </div>
                          <span style={{ fontSize: 11, color: "#AAA" }}>{c.month}월</span>
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
              )}
            </div>
          )}

          {/* 정산현황 탭 */}
          {tab === "settlement" && (
            <div>
              {loadingExtra ? (
                <div style={{ textAlign: "center", padding: "40px 0", color: "#AAA", fontSize: 13 }}>불러오는 중...</div>
              ) : settlements.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 0", color: "#CCC", fontSize: 13 }}>
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

          {/* 소통내역 탭 */}
          {tab === "comm" && (
            <div>
              {/* 소통 입력 */}
              <div style={{ background: "#F7F6F3", borderRadius: 10, padding: "14px", marginBottom: 16, border: "1px solid #E8E5E0" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#555", marginBottom: 8 }}>소통 내용 기록</div>
                <textarea value={commInput} onChange={function(e) { var v = e.target.value; setCommInput(v); }}
                  placeholder="통화 결과, 방문 내용, 메모 등 자유롭게 입력하세요..."
                  rows={3} style={{ width: "100%", padding: "10px 12px", border: "1px solid #E8E5E0", borderRadius: 8, fontSize: 13, resize: "none", boxSizing: "border-box", outline: "none", lineHeight: 1.6 }} />
                <button onClick={saveCommLog} disabled={!commInput.trim()}
                  style={{ width: "100%", marginTop: 8, padding: "10px", background: commInput.trim() ? "#1A1917" : "#E8E5E0", color: commInput.trim() ? "#F7F6F3" : "#AAA", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: commInput.trim() ? "pointer" : "not-allowed" }}>
                  저장
                </button>
              </div>
              {/* 소통 로그 목록 */}
              {loadingExtra ? (
                <div style={{ textAlign: "center", padding: "20px 0", color: "#AAA", fontSize: 13 }}>불러오는 중...</div>
              ) : commLogs.length === 0 ? (
                <div style={{ textAlign: "center", padding: "30px 0", color: "#CCC", fontSize: 13 }}>아직 소통 내역이 없어요</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {commLogs.map(function(log, i) {
                    var d = new Date(log.created_at);
                    var ts = d.toLocaleDateString("ko-KR", { month: "short", day: "numeric" }) + " " + d.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
                    return (
                      <div key={log.id} style={{ display: "flex", gap: 10 }}>
                        <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#1A1917", color: "#F7F6F3", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                          {(log.assignee || log.logged_by || "?")[0]}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                            <span style={{ fontSize: 12, fontWeight: 600 }}>{log.assignee || log.logged_by || "-"}</span>
                            <span style={{ fontSize: 11, color: "#AAA" }}>{ts}</span>
                          </div>
                          <div style={{ fontSize: 13, color: "#333", lineHeight: 1.6, background: "#F7F6F3", borderRadius: 8, padding: "9px 12px" }}>
                            {log.memo || log.note || "-"}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

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
                notes: data.issue || null,
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
function AddModal({ onClose, onAdd, assignees }) {
  // 빠른 등록 모달 - 필수 정보만 받고, 나머지는 상세 화면에서 입력
  const [form, setForm] = useState({
    name: "", type: "법인", representative: "", phone: "",
    stage: "상담/진단완료", assignee: "", agency_list: [],
    business_type: "법인사업자", industry: "",
  });
  const set = function(k, v) { setForm(function(p) { return Object.assign({}, p, { [k]: v }); }); };
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

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}
      onClick={function(e) { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: "#fff", borderRadius: 14, width: 460, maxHeight: "92vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
        <div style={{ padding: "20px 24px 14px", borderBottom: "1px solid #E8E5E0", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, background: "#fff", zIndex: 1 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>빠른 신규 등록</h2>
            <div style={{ fontSize: 11, color: "#888", marginTop: 3 }}>필수 정보만 입력하면 상세 화면이 열려요</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer" }}><Icon name="x" size={18} color="#888" /></button>
        </div>
        <div style={{ padding: "18px 24px" }}>
          {/* 업체명 */}
          <div style={{ background: "#F7F6F3", borderRadius: 8, padding: "10px 13px", marginBottom: 10 }}>
            <div style={{ fontSize: 11, color: "#888", marginBottom: 5 }}>업체명 *</div>
            <input value={form.name} onChange={function(e) { set("name", e.target.value); }} autoFocus
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

          {/* 업종 (복수 선택 가능) */}
          <div style={{ background: "#F7F6F3", borderRadius: 8, padding: "10px 13px", marginBottom: 10 }}>
            <div style={{ fontSize: 11, color: "#888", marginBottom: 6 }}>업종 (복수 선택 가능)</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 6 }}>
              {INDUSTRY_OPTIONS.map(function(ind) {
                var cur = (form.industry || "").split(",").map(function(s) { return s.trim(); }).filter(Boolean);
                var sel = cur.indexOf(ind) >= 0;
                return (
                  <button key={ind} onClick={function() {
                    var arr = (form.industry || "").split(",").map(function(s) { return s.trim(); }).filter(Boolean);
                    var idx = arr.indexOf(ind);
                    if (idx >= 0) arr.splice(idx, 1);
                    else arr.push(ind);
                    set("industry", arr.length > 0 ? arr.join(", ") : "");
                  }}
                    style={{ padding: "4px 9px", borderRadius: 99, fontSize: 11, fontWeight: sel ? 700 : 400, border: sel ? "none" : "1px solid #E8E5E0", cursor: "pointer",
                      background: sel ? "#4338CA" : "#fff", color: sel ? "#fff" : "#666" }}>
                    {sel ? "✓ " : ""}{ind}
                  </button>
                );
              })}
            </div>
            {(function() {
              var cur = (form.industry || "").split(",").map(function(s) { return s.trim(); }).filter(Boolean);
              var custom = cur.filter(function(s) { return INDUSTRY_OPTIONS.indexOf(s) < 0; });
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

          <div style={{ background: "#FEF3C7", borderRadius: 8, padding: "10px 13px", marginBottom: 12, fontSize: 11, color: "#B45309", lineHeight: 1.5 }}>
            💡 등록 후 곧바로 상세 화면이 열려요.<br />매출, 신용점수, 지역 등 나머지 정보는 거기서 입력하세요.
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
            등록하고 상세 정보 입력하기 →
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
    var map = { "소상공인시장진흥공단": "#4338CA", "신용보증기금": "#0F6E56", "신용보증재단": "#B45309", "중소벤처기업진흥공단": "#7C3AED", "구조혁신&사업전환": "#BE123C", "경정청구": "#0369A1" };
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
          {["전체","소상공인시장진흥공단","신용보증기금","신용보증재단","중소벤처기업진흥공단","구조혁신&사업전환"].map(function(a) {
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
                {["소상공인시장진흥공단","신용보증기금","신용보증재단","중소벤처기업진흥공단","구조혁신&사업전환","경정청구","기타"].map(function(a) { return <option key={a} value={a}>{a}</option>; })}
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
                <input type="checkbox" checked={item.checked || false} onChange={function(e) { var ck = e.target.checked; setEditNote(function(p) { var items = (p.checkItems || []).slice(); items[idx] = Object.assign({}, items[idx], { checked: ck }); return Object.assign({}, p, { checkItems: items }); }); }} style={{ width: 15, height: 15, flexShrink: 0, cursor: "pointer" }} />
                <input type="text" value={item.text || ""} placeholder={"항목 " + (idx + 1) + " (예: 스크립트 작성)"}
                  onChange={function(e) { var v = e.target.value; setEditNote(function(p) { var items = (p.checkItems || []).slice(); items[idx] = Object.assign({}, items[idx], { text: v }); return Object.assign({}, p, { checkItems: items }); }); }}
                  style={{ flex: 1, border: "none", outline: "none", fontSize: 13, background: "transparent", textDecoration: item.checked ? "line-through" : "none", color: item.checked ? "#AAA" : "#333" }} />
                <input type="date" value={item.dueDate || ""} title="이 항목의 마감일 (선택)"
                  onChange={function(e) { var v = e.target.value; setEditNote(function(p) { var items = (p.checkItems || []).slice(); items[idx] = Object.assign({}, items[idx], { dueDate: v }); return Object.assign({}, p, { checkItems: items }); }); }}
                  style={{ padding: "3px 6px", border: "1px solid #E8E5E0", borderRadius: 4, fontSize: 11, color: "#4338CA", outline: "none", width: 130 }} />
                <button onClick={function() { setEditNote(function(p) { var items = (p.checkItems || []).filter(function(_, i) { return i !== idx; }); return Object.assign({}, p, { checkItems: items }); }); }}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#CCC", fontSize: 16, padding: "0 4px", lineHeight: 1 }}>×</button>
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
function NoteCard({ note, editingId, editNote, setEditNote, saveEdit, setEditingId, toggleDone, togglePin, deleteNote, fmtDate, currentUserName, onChecklistChange }) {
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
    <div style={{ background: note.pinned ? "#FFFBEB" : "#fff", border: note.pinned ? "1px solid #FDE68A" : "1px solid #E8E5E0", borderRadius: 12, padding: "16px 18px", opacity: note.is_done ? 0.6 : 1, transition: "opacity 0.2s" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          {note.is_todo && (
            <input type="checkbox" checked={note.is_done || false} onChange={function() { toggleDone(note); }}
              style={{ width: 16, height: 16, cursor: "pointer", accentColor: "#1A1917" }} />
          )}
          {note.pinned && <span style={{ fontSize: 14 }}>📌</span>}
          <span style={{ fontSize: 14, fontWeight: 700, color: "#1A1917", textDecoration: note.is_done ? "line-through" : "none" }}>
            {note.title || <span style={{ color: "#CCC", fontWeight: 400 }}>제목 없음</span>}
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
          <div style={{ display: "flex", gap: 4 }}>
            <button onClick={function() { togglePin(note); }} title={note.pinned ? "고정 해제" : "고정"}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 4, fontSize: 14, opacity: note.pinned ? 1 : 0.4 }}>📌</button>
            <button onClick={function() { setEditingId(note.id); setEditNote(Object.assign({}, note)); window.scrollTo({ top: 0, behavior: "smooth" }); }}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}><Icon name="edit" size={14} color="#888" /></button>
            <button onClick={function() { deleteNote(note.id); }}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}><Icon name="x" size={14} color="#CCC" /></button>
          </div>
        )}
      </div>

      {/* 마감일 표시 */}
      {note.due_date && (function() {
        var today = new Date().toISOString().slice(0, 10);
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
        <span style={{ fontSize: 11, color: "#CCC" }}>{fmtDate(note.updated_at || note.created_at)}</span>
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
  const [newNote, setNewNote] = useState({ title: "", content: "", is_todo: false, pinned: false, target_assignee: "", checkItems: [], due_date: "" });
  const [editNote, setEditNote] = useState({});
  const [filterType, setFilterType] = useState("전체"); // 전체 / 메모 / 할일
  const [replyId, setReplyId] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [showTrash, setShowTrash] = useState(false);
  const [trashedNotes, setTrashedNotes] = useState([]);

  const [companiesList, setCompaniesList] = useState([]);
  const [pushEnabled, setPushEnabled] = useState(false);

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

  var pinned = filtered.filter(function(n) { return n.pinned; });
  var unpinned = filtered.filter(function(n) { return !n.pinned; });

  var saveNew = async function() {
    // checkItems가 있으면 content로 변환해서 합치기 (마감일 [YYYY-MM-DD] 포함)
    var checkContent = (newNote.checkItems && newNote.checkItems.length > 0)
      ? newNote.checkItems.filter(function(i) { return i.text.trim(); }).map(function(i) {
          var line = "- [ ] " + i.text.trim();
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
      setNewNote({ title: "", content: "", is_todo: false, pinned: false, target_assignee: "", checkItems: [], due_date: "" });
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
    <div>
      {/* 헤더 */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.03em", margin: 0 }}>업무 노트</h1>
          <p style={{ color: "#888", fontSize: 13, margin: "4px 0 0" }}>메모 · 할 일 · 업무일지</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={function() { setShowAdd(true); setNewNote({ title: "", content: "", is_todo: false, pinned: false, checkItems: [] }); }}
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
        <div style={{ background: "#F0FDF4", border: "2px solid #86EFAC", borderRadius: 12, padding: "18px 20px", marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#15803D", marginBottom: 12 }}>✏️ 새 노트 작성</div>
          <div style={{ display: "flex", gap: 16, marginBottom: 10 }}>
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
                      style={{ background: "none", border: "none", cursor: "pointer", color: "#CCC", fontSize: 16, padding: "0 4px", lineHeight: 1 }}>×</button>
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

      {/* 노트 목록 */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", color: "#CCC", fontSize: 14, padding: "80px 0" }}>
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
                {pinned.map(function(note) { return <NoteCard key={note.id} note={note} editingId={editingId} editNote={editNote} setEditNote={setEditNote} saveEdit={saveEdit} setEditingId={setEditingId} toggleDone={toggleDone} togglePin={togglePin} deleteNote={deleteNote} fmtDate={fmtDate} currentUserName={profile?.name} onChecklistChange={onChecklistChange} />; })}
              </div>
            </div>
          )}
          {/* 일반 노트 */}
          {unpinned.length > 0 && (
            <div>
              {pinned.length > 0 && <div style={{ fontSize: 11, fontWeight: 700, color: "#888", letterSpacing: "0.05em", marginBottom: 10 }}>전체 노트</div>}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 12 }}>
                {unpinned.map(function(note) { return <NoteCard key={note.id} note={note} editingId={editingId} editNote={editNote} setEditNote={setEditNote} saveEdit={saveEdit} setEditingId={setEditingId} toggleDone={toggleDone} togglePin={togglePin} deleteNote={deleteNote} fmtDate={fmtDate} currentUserName={profile?.name} onChecklistChange={onChecklistChange} />; })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 휴지통 모달 */}
      {showTrash && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={function(e) { if (e.target === e.currentTarget) setShowTrash(false); }}>
          <div style={{ background: "#fff", borderRadius: 14, width: 560, maxHeight: "80vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #E8E5E0", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, background: "#fff" }}>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>🗑️ 업무노트 휴지통 ({trashedNotes.length}건)</h2>
              <button onClick={function() { setShowTrash(false); }} style={{ background: "none", border: "none", cursor: "pointer" }}>
                <Icon name="x" size={18} color="#888" />
              </button>
            </div>
            <div style={{ padding: "16px 24px" }}>
              {trashedNotes.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 0", color: "#CCC", fontSize: 14 }}>
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
    allFiltered.forEach(function(c) {
      totalCommission += parseAmt(c.commission_fee);
      totalReceived += parseAmt(c.received_amount);
    });
    return {
      total: allFiltered.length,
      autoCount: filteredAuto.length,
      manualCount: filteredManual.length,
      commissionSet: allFiltered.filter(function(c) { return c.commission_fee; }).length,
      depositDone: allFiltered.filter(function(c) { return c.fee_received; }).length,
      totalCommission: totalCommission,
      totalReceived: totalReceived,
    };
  }, [allFiltered, filteredAuto, filteredManual]);

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
          <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 99, background: "#EEF2FF", color: "#4338CA", fontWeight: 600 }}>{row.agency_group || "-"}</span>
        </td>
        <td style={{ padding: "9px 8px", fontSize: 12, color: "#555" }}>{row.assignee || "-"}</td>
        <td style={{ padding: "9px 8px", fontSize: 12, color: "#555" }}>{row.request_amount || "-"}</td>
        <td style={{ padding: "9px 8px" }}>
          {row.contract_fee ? <span style={{ fontSize: 12, fontWeight: 700, color: "#333" }}>{row.contract_fee}</span> : <span style={{ fontSize: 11, color: "#CCC" }}>미입력</span>}
        </td>
        <td style={{ padding: "9px 8px" }}>
          {row.commission_fee ? <span style={{ fontSize: 12, fontWeight: 700, color: "#7C3AED" }}>{row.commission_fee}</span> : <span style={{ fontSize: 11, color: "#CCC" }}>미입력</span>}
        </td>
        <td style={{ padding: "9px 8px" }}>
          {row.received_amount ? <span style={{ fontSize: 12, fontWeight: 700, color: "#047857" }}>{row.received_amount}</span> : <span style={{ fontSize: 11, color: "#CCC" }}>미입력</span>}
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
        {allFiltered.length === 0 ? (
          <div style={{ padding: "60px 20px", textAlign: "center", color: "#AAA", fontSize: 13 }}>
            {activeMonth}월 데이터가 없습니다. 직접 등록하거나 기관별 현황에서 승인 상태로 변경해주세요.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#F7F6F3", borderBottom: "2px solid #E8E5E0" }}>
                  {["#","사업자명","기관","담당자","신청금액","계약금","수수료","입금금액","계약일","세금계산서","입금완료","입금일","비고","작업"].map(function(h) {
                    return <th key={h} style={{ textAlign: "left", padding: "10px 8px", fontWeight: 600, color: "#888", fontSize: 11, whiteSpace: "nowrap" }}>{h}</th>;
                  })}
                </tr>
              </thead>
              <tbody>
                {allFiltered.map(function(row, idx) {
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
          onClick={function(e) { if (e.target === e.currentTarget) setShowAddManual(false); }}>
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
  const [googleEvents, setGoogleEvents] = useState([]);
  const [gConnected, setGConnected] = useState(false);
  const [activeTab, setActiveTab] = useState("calendar"); // calendar | followup
  const [calSheet, setCalSheet] = useState("yangho"); // yangho | director
  const [customEvents, setCustomEvents] = useState([]);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: "", date: "", time: "", memo: "", sheet: "yangho", color: "9" });
  const [gToken, setGToken] = useState("");
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
  const todayStr = today.toISOString().slice(0, 10);
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
    // 구글 캘린더에도 동시 등록 (연결돼 있으면)
    if (gToken) {
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
          headers: { Authorization: "Bearer " + gToken, "Content-Type": "application/json" },
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
        setGoogleEvents(function(prev) { return prev.concat([{
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

  // ─────────────────────────────────────────────────────────
  // 구글 캘린더 영구 연동 (OAuth Code Flow + Supabase DB 토큰 저장)
  // - 양호 캘린더 / 이사님 캘린더 2개를 분리 저장
  // - calSheet 변수에 따라 적절한 토큰 조회 (yangho → '양호', director → '이사님')
  // - refresh_token으로 자동 갱신 (영구 연동)
  // ─────────────────────────────────────────────────────────
  const GCAL_REDIRECT_URI = window.location.origin + "/";
  const sheetToUserLabel = function(sheet) {
    return sheet === "director" ? "이사님" : "양호";
  };

  // [1] 구글 OAuth 동의 화면으로 이동 (해당 캘린더의 주인이 로그인)
  const connectGoogle = function() {
    var userLabel = sheetToUserLabel(calSheet);
    var scope = "https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/userinfo.email";
    // state에 user_label 포함시켜 콜백 시 어떤 캘린더 연동인지 식별
    var state = encodeURIComponent(JSON.stringify({ sheet: calSheet }));
    var authUrl = "https://accounts.google.com/o/oauth2/v2/auth"
      + "?client_id=" + GOOGLE_CLIENT_ID
      + "&redirect_uri=" + encodeURIComponent(GCAL_REDIRECT_URI)
      + "&response_type=code"
      + "&scope=" + encodeURIComponent(scope)
      + "&access_type=offline"
      + "&prompt=consent"
      + "&include_granted_scopes=true"
      + "&state=" + state;
    window.location.href = authUrl;
  };

  // [2] DB에서 토큰 가져오기 + 만료시 자동 갱신 (Edge Function 호출)
  var getValidAccessToken = async function(userLabel) {
    try {
      var refreshUrl = SUPABASE_URL + "/functions/v1/google-oauth-refresh";
      var res = await fetch(refreshUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": SUPABASE_ANON_KEY,
          "Authorization": "Bearer " + SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ user_label: userLabel }),
      });
      var data = await res.json();
      if (!res.ok) {
        return { ok: false, needsConnection: data.needsConnection || false, error: data.error };
      }
      return { ok: true, access_token: data.access_token, google_email: data.google_email };
    } catch (err) {
      return { ok: false, error: String(err) };
    }
  };

  // [3] 구글 캘린더에서 일정 가져오기
  var fetchGoogleEventsForSheet = async function(sheet) {
    var userLabel = sheetToUserLabel(sheet);
    var tokenResult = await getValidAccessToken(userLabel);
    if (!tokenResult.ok) {
      setGConnected(false);
      setGToken("");
      setGoogleEvents([]);
      return;
    }
    setGConnected(true);
    setGToken(tokenResult.access_token);

    var startDate = new Date(year, month, 1).toISOString();
    var endDate = new Date(year, month + 1, 0, 23, 59, 59).toISOString();
    try {
      var r = await fetch(
        "https://www.googleapis.com/calendar/v3/calendars/primary/events"
        + "?timeMin=" + encodeURIComponent(startDate)
        + "&timeMax=" + encodeURIComponent(endDate)
        + "&singleEvents=true&orderBy=startTime&maxResults=250",
        { headers: { Authorization: "Bearer " + tokenResult.access_token } }
      );
      var data = await r.json();
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
        setGoogleEvents(evs);
      } else {
        setGoogleEvents([]);
      }
    } catch (err) {
      setGoogleEvents([]);
    }
  };

  // [4] OAuth 콜백 처리: URL의 ?code=... 를 받아서 Edge Function으로 교환
  useEffect(function() {
    var urlParams = new URLSearchParams(window.location.search);
    var code = urlParams.get("code");
    var stateParam = urlParams.get("state");
    if (code && stateParam) {
      var stateData = null;
      try { stateData = JSON.parse(decodeURIComponent(stateParam)); } catch (e) {}
      if (!stateData || !stateData.sheet) {
        window.history.replaceState(null, "", window.location.pathname);
        return;
      }
      // Edge Function에 code 보내서 토큰 교환 + DB 저장
      var exchangeUrl = SUPABASE_URL + "/functions/v1/smart-handler";
      fetch(exchangeUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": SUPABASE_ANON_KEY,
          "Authorization": "Bearer " + SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          code: code,
          user_label: stateData.sheet,
          redirect_uri: GCAL_REDIRECT_URI,
        }),
      })
      .then(function(r) { return r.json().then(function(d) { return { ok: r.ok, data: d }; }); })
      .then(function(result) {
        if (result.ok) {
          alert("✅ " + sheetToUserLabel(stateData.sheet) + " 캘린더가 영구 연동되었습니다!\n(" + (result.data.google_email || "") + ")");
          if (stateData.sheet) setCalSheet(stateData.sheet);
        } else {
          alert("❌ 연동 실패: " + (result.data.error || "알 수 없는 오류"));
        }
        // URL 정리 후 캘린더 로드
        window.history.replaceState(null, "", window.location.pathname);
        fetchGoogleEventsForSheet(stateData.sheet || calSheet);
      })
      .catch(function(err) {
        alert("❌ 연동 요청 실패: " + err.message);
        window.history.replaceState(null, "", window.location.pathname);
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // [5] 탭(calSheet) 또는 월(year/month) 변경 시 해당 캘린더 일정 다시 로드
  useEffect(function() {
    fetchGoogleEventsForSheet(calSheet);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calSheet, year, month]);

  const selectedDateStr = selectedDate
    ? `${year}-${String(month+1).padStart(2,"0")}-${String(selectedDate).padStart(2,"0")}`
    : null;
  const selectedCrmEvents = selectedDateStr ? (crmEventsByDate[selectedDateStr] || []) : [];
  const selectedGoogleEvents = selectedDateStr
    ? googleEvents.filter(e => e.date === selectedDateStr)
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
          {!gConnected ? (
            <button onClick={connectGoogle}
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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <button onClick={() => setCalSheet("yangho")}
              style={{ padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: calSheet === "yangho" ? 700 : 400, background: calSheet === "yangho" ? "#4338CA" : "#fff", color: calSheet === "yangho" ? "#fff" : "#666", border: calSheet === "yangho" ? "none" : "1px solid #E8E5E0", cursor: "pointer" }}>
              김양호 캘린더
            </button>
            <button onClick={() => setCalSheet("director")}
              style={{ padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: calSheet === "director" ? 700 : 400, background: calSheet === "director" ? "#7C3AED" : "#fff", color: calSheet === "director" ? "#fff" : "#666", border: calSheet === "director" ? "none" : "1px solid #E8E5E0", cursor: "pointer" }}>
              이사님 캘린더
            </button>
            {/* 연동 상태 표시 */}
            <span style={{ marginLeft: 8, padding: "4px 10px", borderRadius: 12, fontSize: 11, fontWeight: 600, background: gConnected ? "#DCFCE7" : "#FEE2E2", color: gConnected ? "#166534" : "#991B1B" }}>
              {gConnected ? "✓ 구글 연동됨" : "✗ 미연동"}
            </span>
            {/* 미연동 시 연결 버튼 노출 */}
            {!gConnected && (
              <button onClick={connectGoogle}
                style={{ padding: "6px 12px", background: "#4285F4", color: "#fff", border: "none", borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                title={`${sheetToUserLabel(calSheet)}님 구글 계정으로 로그인하여 캘린더 영구 연동`}>
                🔗 {sheetToUserLabel(calSheet)} 구글 계정 연동
              </button>
            )}
            {/* 연동된 경우 재연동 옵션 (만약 다른 계정으로 바꾸고 싶을 때) */}
            {gConnected && (
              <button onClick={connectGoogle}
                style={{ padding: "6px 10px", background: "transparent", color: "#666", border: "1px solid #E8E5E0", borderRadius: 8, fontSize: 11, fontWeight: 500, cursor: "pointer" }}
                title="다른 구글 계정으로 다시 연동">
                재연동
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
                const gEvs = googleEvents.filter(e => e.date === dateStr);
                const cEvs = customEvents.filter(e => e.date === dateStr && e.sheet === calSheet);
                const isToday = dateStr === todayStr;
                const isSelected = d === selectedDate;
                const dow = (firstDay + d - 1) % 7;
                const hasFollowup = companies.some(c => FOLLOWUP_STAGES.includes(c.stage) && c.next_contact === dateStr);
                return (
                  <div key={d} onClick={() => setSelectedDate(d)}
                    style={{ minHeight: 80, borderBottom: "1px solid #F0EDE8", borderRight: "1px solid #F0EDE8", padding: "5px", cursor: "pointer", background: isSelected ? "#EEF2FF" : "transparent" }}
                    onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = "#F7F6F3"; }}
                    onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = "transparent"; }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                      <div style={{ width: 22, height: 22, borderRadius: "50%", background: isToday ? "#1A1917" : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ fontSize: 12, fontWeight: isToday ? 700 : 400, color: isToday ? "#fff" : dow===0 ? "#DC2626" : dow===6 ? "#4338CA" : "#333" }}>{d}</span>
                      </div>
                      {hasFollowup && <span style={{ fontSize: 8, background: "#FEF3C7", color: "#B45309", borderRadius: 3, padding: "1px 3px", fontWeight: 700 }}>팔로업</span>}
                    </div>
                    {crmEvs.slice(0, 2).map((ev, ei) => (
                      <div key={ei} style={{ fontSize: 9, background: "#4338CA", color: "#fff", borderRadius: 3, padding: "1px 4px", marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ev.name}</div>
                    ))}
                    {gEvs.slice(0, 1).map((ev, ei) => {
                      var gcol = getColorById(ev.color || "9");
                      return (
                        <div key={ei} style={{ fontSize: 9, background: gcol.bg, color: "#fff", borderRadius: 3, padding: "1px 4px", marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>📅 {ev.title}</div>
                      );
                    })}
                    {cEvs.slice(0, 2).map((ev, ei) => {
                      var col = getColorById(ev.color || "blue");
                      return (
                        <div key={`c-${ei}`} style={{ fontSize: 9, background: col.bg, color: "#fff", borderRadius: 3, padding: "1px 4px", marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ev.title}</div>
                      );
                    })}
                    {(crmEvs.length + gEvs.length + cEvs.length) > 3 && <div style={{ fontSize: 9, color: "#888" }}>+{crmEvs.length + gEvs.length + cEvs.length - 3}</div>}
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
              {!selectedDate && <div style={{ textAlign: "center", padding: "40px 0", color: "#CCC", fontSize: 13 }}>📅<br/>날짜를 클릭하세요</div>}
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
                <div style={{ textAlign: "center", padding: "30px 0", color: "#CCC", fontSize: 13 }}>이 날 일정이 없어요</div>
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
            <div style={{ textAlign: "center", padding: "60px 0", color: "#CCC", fontSize: 13 }}>
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
            {idx > 0 && <span style={{ color: "#CCC", fontSize: 13 }}>›</span>}
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
const BOJUNG_AGENCIES = ["신용보증기금", "기술보증기금"];

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
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [showTrash, setShowTrash] = useState(false);
  const [filterAssignee, setFilterAssignee] = useState("전체");
  const [showAddCase, setShowAddCase] = useState(false);
  const [newCase, setNewCase] = useState({});
  const [companySuggestions, setCompanySuggestions] = useState([]);
  const [companiesList, setCompaniesList] = useState([]);
  const [selectedCase, setSelectedCase] = useState(null);

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

  useEffect(function() { fetchCases(); fetchCompanies(); }, []);

  useEffect(function() {
    if (jumpToMonth) setActiveMonth(Number(jumpToMonth));
    if (jumpToGroup) setActiveGroup(jumpToGroup);
  }, [jumpToMonth, jumpToGroup]);

  var filtered = useMemo(function() {
    return cases.filter(function(c) {
      return c.agency_group === activeGroup
        && Number(c.month) === Number(activeMonth)
        && Number(c.year) === currentYear
        && !c.deleted_at
        && (filterAssignee === "전체" || c.assignee === filterAssignee);
    });
  }, [cases, activeGroup, activeMonth, filterAssignee, currentYear]);

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
    }).forEach(function(c) { if (c.assignee) s.add(c.assignee); });
    return ["전체"].concat(Array.from(s).sort());
  }, [cases, activeGroup, activeMonth]);

  var summary = useMemo(function() {
    var approved = filtered.filter(function(c) { return ["승인","약정","완료"].indexOf(c.status) >= 0; }).length;
    var inProgress = filtered.filter(function(c) { return ["진행 중","심사중","심사대기","최종제출","임시저장","우선도 평가","기관 방문 전","기관 방문 후 대기","온라인 신청 후 대기","실태 조사 예정","실태 조사 완료"].indexOf(c.status) >= 0; }).length;
    var rejected = filtered.filter(function(c) { return ["부결","반려","진행불가","신청취소"].indexOf(c.status) >= 0; }).length;
    return { total: filtered.length, approved: approved, inProgress: inProgress, rejected: rejected };
  }, [filtered]);

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
        notes: co.issue || "",
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
            <div key={g.id} onClick={function() { setActiveGroup(g.id); setEditingId(null); setFilterAssignee("전체"); }}
              style={{ padding: "8px 16px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: isActive ? 700 : 400,
                background: isActive ? g.color : "#fff", color: isActive ? "#fff" : "#555",
                border: isActive ? "none" : "1px solid #E8E5E0", transition: "all 0.15s" }}>
              {g.label}
            </div>
          );
        })}
      </div>

      {/* 월 탭 */}
      <div style={{ display: "flex", gap: 4, marginBottom: 18, flexWrap: "wrap" }}>
        {[1,2,3,4,5,6,7,8,9,10,11,12].map(function(m) {
          var hasData = monthsWithData.has(m);
          var isActive = Number(activeMonth) === m;
          return (
            <div key={m} onClick={function() { setActiveMonth(m); setEditingId(null); setFilterAssignee("전체"); }}
              style={{ padding: "6px 14px", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: isActive ? 700 : 400,
                background: isActive ? groupColor : hasData ? "#fff" : "#F7F6F3",
                color: isActive ? "#fff" : hasData ? "#333" : "#CCC",
                border: isActive ? "none" : hasData ? "1px solid #E8E5E0" : "1px solid #EDEBE8" }}>
              {m}월{hasData && !isActive ? " ●" : ""}
            </div>
          );
        })}
      </div>

      {/* 요약 카드 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "총 진행", value: summary.total, color: "#1A1917" },
          { label: "승인/약정", value: summary.approved, color: "#047857" },
          { label: "진행중", value: summary.inProgress, color: "#4338CA" },
          { label: "부결/반려", value: summary.rejected, color: "#DC2626" },
        ].map(function(s) {
          return (
            <div key={s.label} style={{ background: "#fff", borderRadius: 10, padding: "16px 20px", border: "1px solid #E8E5E0" }}>
              <div style={{ fontSize: 11, color: "#888", marginBottom: 6 }}>{s.label}</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{s.value}건</div>
            </div>
          );
        })}
      </div>

      {/* 담당자 필터 */}
      {assigneesInGroup.length > 1 && (
        <div style={{ display: "flex", gap: 5, marginBottom: 14, flexWrap: "wrap" }}>
          {assigneesInGroup.map(function(a) {
            return (
              <div key={a} onClick={function() { setFilterAssignee(a); }}
                style={{ padding: "5px 13px", borderRadius: 99, cursor: "pointer", fontSize: 12,
                  background: filterAssignee === a ? "#1A1917" : "#fff", color: filterAssignee === a ? "#fff" : "#666",
                  border: filterAssignee === a ? "none" : "1px solid #E8E5E0" }}>
                {a}
              </div>
            );
          })}
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
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#F7F6F3", borderBottom: "2px solid #E8E5E0" }}>
                <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 600, color: "#888", fontSize: 11, width: 30 }}>#</th>
                <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 600, color: "#888", fontSize: 11 }}>사업자명</th>
                <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 600, color: "#888", fontSize: 11 }}>대표자</th>
                <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 600, color: "#888", fontSize: 11 }}>담당자</th>
                <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 600, color: "#888", fontSize: 11 }}>금액</th>
                {(activeGroup === "중소벤처기업진흥공단" || activeGroup === "소상공인시장진흥공단") && (
                  <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 600, color: "#888", fontSize: 11 }}>신청상품</th>
                )}
                <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 600, color: "#888", fontSize: 11 }}>업종</th>
                <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 600, color: "#888", fontSize: 11 }}>지역</th>
                <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 600, color: activeGroup === "구조혁신&사업전환" ? "#BE123C" : "#888", fontSize: 11 }}>상태</th>
                {activeGroup === "구조혁신&사업전환" && (
                  <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 600, color: "#0F6E56", fontSize: 11, background: "#E1F5EE" }}>전달 및 완료 서류</th>
                )}
                <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 600, color: "#888", fontSize: 11 }}>신용점수</th>
                <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 600, color: "#888", fontSize: 11 }}>비고</th>
                <th style={{ padding: "10px 12px", textAlign: "center", fontWeight: 600, color: "#888", fontSize: 11, width: 80 }}>작업</th>
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
                        ) : (
                          <span style={{ fontSize: 11, color: "#555" }}>{row.fund_product || "-"}</span>
                        )}
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
                            <div style={{ fontSize: 12, color: "#555" }}>{row.region || "-"}</div>
                            {(activeGroup === "중소벤처기업진흥공단" || activeGroup === "구조혁신&사업전환") && row.region && findJungingongBranch(row.region) && (
                              <div style={{ fontSize: 10, color: "#7C3AED", marginTop: 2, fontWeight: 600 }}>{findJungingongBranch(row.region)}</div>
                            )}
                          </div>
                        )}
                    </td>
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
                              : <span style={{ fontSize: 11, color: "#CCC" }}>-</span>}
                          </div>
                        )}
                      </td>
                    )}
                    <td style={{ padding: "10px 12px" }}>
                      {(function() {
                        var matchedCo = companiesList.find(function(c) { return c.name === row.business_name; });
                        if (!matchedCo || (!matchedCo.credit_score_kcb && !matchedCo.credit_score_nice)) return <span style={{ fontSize: 12, color: "#CCC" }}>-</span>;
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
                        <div style={{ display: "flex", gap: 4, justifyContent: "center" }}>
                          <button onClick={function() { setEditingId(row.id); setEditData(Object.assign({}, row)); }}
                            style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}><Icon name="edit" size={14} color="#888" /></button>
                          <button onClick={function() { deleteCase(row.id); }}
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
      )}

      {/* 우선도 체크리스트 모달 */}
      {showPriorityModal && priorityTarget && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 1100, display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={function(e) { if (e.target === e.currentTarget) setShowPriorityModal(false); }}>
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
            </div>
          </div>
        </div>
      )}

      {/* 휴지통 모달 */}
      {showTrash && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={function(e) { if (e.target === e.currentTarget) setShowTrash(false); }}>
          <div style={{ background: "#fff", borderRadius: 14, width: 600, maxHeight: "80vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #E8E5E0", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, background: "#fff" }}>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>🗑️ 휴지통 ({trashedCases.length}건)</h2>
              <button onClick={function() { setShowTrash(false); }} style={{ background: "none", border: "none", cursor: "pointer" }}><Icon name="x" size={18} color="#888" /></button>
            </div>
            <div style={{ padding: "16px 24px" }}>
              {trashedCases.length === 0 ? (
                <div style={{ padding: "40px 0", textAlign: "center", color: "#CCC", fontSize: 13 }}>휴지통이 비어 있습니다</div>
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
          onClick={function(e) { if (e.target === e.currentTarget) { setShowAddCase(false); setCompanySuggestions([]); } }}>
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
        <div style={{ position: "fixed", inset: 0, zIndex: 900 }} onClick={function() { setSelectedCase(null); }}>
          <div style={{ position: "absolute", top: 0, right: 0, width: 460, height: "100%", background: "#fff", boxShadow: "-4px 0 30px rgba(0,0,0,0.15)", overflowY: "auto" }}
            onClick={function(e) { e.stopPropagation(); }}>
            <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #E8E5E0", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, background: "#fff", zIndex: 1 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800 }}>{selectedCase.business_name}</div>
                <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>{activeGroup} · {selectedCase.assignee || "-"}</div>
              </div>
              <button onClick={function() { setSelectedCase(null); }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: "#888" }}>✕</button>
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
                        var r = await supabase.from("agency_cases").update({ status: s, updated_at: new Date().toISOString() }).eq("id", selectedCase.id);
                        if (!r.error) {
                          setCases(function(prev) { return prev.map(function(c) { return c.id === selectedCase.id ? Object.assign({}, c, { status: s }) : c; }); });
                          setSelectedCase(function(p) { return Object.assign({}, p, { status: s }); });
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
                    { label: "신청상품", value: selectedCase.fund_product },
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

function DBLeadsView() {
  const [leads, setLeads] = useState([]);
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
      if (l.month !== activeMonth || l.year !== 2026 || l.deleted_at) return false;
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
    leads.filter(function(l) { return l.month === activeMonth && l.year === 2026 && !l.deleted_at; }).forEach(function(l) {
      var w = getWeek(l);
      if (w && w >= 1 && w <= 5) counts[w]++;
    });
    return counts;
  }, [leads, activeMonth]);

  var summary = useMemo(function() {
    var all = leads.filter(function(l) { return l.month === activeMonth && l.year === 2026 && !l.deleted_at; });
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
    setNewLead({ year: 2026, month: activeMonth, business_name: "", contact: "", assignee: "", assigned_by: "", status: "미연락", call_1: "", call_2: "", call_3: "", call_4: "", call_5: "", etc: "" });
    setShowAddLead(true);
  };
  var saveNewLead = async function() {
    if (!newLead.business_name) { alert("사업자명은 필수입니다."); return; }
    var leadData = Object.assign({}, newLead, { contact: formatPhone(newLead.contact || "") });
    var result = await supabase.from("db_leads").insert(leadData).select().single();
    if (!result.error && result.data) { setLeads(function(prev) { return prev.concat([result.data]); }); setShowAddLead(false); }
  };

  if (leadsLoading) return (<div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", flexDirection: "column", gap: 16 }}><div style={{ width: 36, height: 36, border: "3px solid #E8E5E0", borderTopColor: "#1A1917", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /><span style={{ color: "#888", fontSize: 13 }}>DB리스트 불러오는 중...</span></div>);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div><h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.03em", margin: 0 }}>DB리스트</h1><p style={{ color: "#888", fontSize: 13, margin: "4px 0 0" }}>신규 고객 상담 · 콜 관리</p></div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={openAddLead} style={{ display: "flex", alignItems: "center", gap: 6, background: "#1A1917", color: "#F7F6F3", border: "none", borderRadius: 8, padding: "10px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}><Icon name="plus" size={15} color="#F7F6F3" /> 신규 등록</button>
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
                      <td style={{ padding: "9px 8px" }} onClick={function(e) { e.stopPropagation(); }}>
                        {isEditing
                          ? <input value={editData.business_name || ""} onChange={function(e) { setEditData(function(p) { return Object.assign({}, p, { business_name: e.target.value }); }); }} style={{ padding: "4px 6px", border: "1px solid #E8E5E0", borderRadius: 4, fontSize: 12, width: "100%", boxSizing: "border-box" }} />
                          : <span style={{ fontWeight: 600 }}>{row.business_name || "-"}</span>}
                      </td>
                      <td style={{ padding: "9px 8px" }} onClick={function(e) { e.stopPropagation(); }}>
                        {isEditing
                          ? <input value={editData.contact || ""} onChange={function(e) { setEditData(function(p) { return Object.assign({}, p, { contact: e.target.value }); }); }} style={{ padding: "4px 6px", border: "1px solid #E8E5E0", borderRadius: 4, fontSize: 12, width: "100%", boxSizing: "border-box" }} />
                          : <span style={{ fontSize: 12, color: "#555" }}>{row.contact || "-"}</span>}
                      </td>
                      <td style={{ padding: "9px 8px" }} onClick={function(e) { e.stopPropagation(); }}>
                        {isEditing
                          ? <select value={editData.assignee || ""} onChange={function(e) { setEditData(function(p) { return Object.assign({}, p, { assignee: e.target.value }); }); }} style={{ padding: "4px 6px", border: "1px solid #E8E5E0", borderRadius: 4, fontSize: 12, width: "100%" }}><option value="">-</option>{DB_ASSIGNEES.map(function(a) { return <option key={a} value={a}>{a}</option>; })}</select>
                          : <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 99, background: "#EEF2FF", color: "#4338CA", fontWeight: 600 }}>{row.assignee || "-"}</span>}
                      </td>
                      <td style={{ padding: "9px 8px" }} onClick={function(e) { e.stopPropagation(); }}>
                        {isEditing
                          ? <select value={editData.assigned_by || ""} onChange={function(e) { setEditData(function(p) { return Object.assign({}, p, { assigned_by: e.target.value }); }); }} style={{ padding: "4px 6px", border: "1px solid #E8E5E0", borderRadius: 4, fontSize: 12, width: "100%" }}><option value="">-</option>{DB_MANAGERS.map(function(a) { return <option key={a} value={a}>{a}</option>; })}</select>
                          : <span style={{ fontSize: 12, color: "#888" }}>{row.assigned_by || "-"}</span>}
                      </td>
                      <td style={{ padding: "9px 8px" }} onClick={function(e) { e.stopPropagation(); }}>
                        {isEditing
                          ? <select value={editData.status || ""} onChange={function(e) { setEditData(function(p) { return Object.assign({}, p, { status: e.target.value }); }); }} style={{ padding: "4px 6px", border: "1px solid #E8E5E0", borderRadius: 4, fontSize: 12, width: "100%" }}>{LEAD_STATUSES.map(function(s) { return <option key={s} value={s}>{s}</option>; })}</select>
                          : <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 99, background: sc.bg, color: sc.text, fontWeight: 600 }}>{row.status || "-"}</span>}
                      </td>
                      <td style={{ padding: "9px 8px", fontSize: 11, color: "#555", maxWidth: 250, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{lastCall}</td>
                      <td style={{ textAlign: "center", padding: "9px 8px" }} onClick={function(e) { e.stopPropagation(); }}>
                        <div style={{ display: "flex", gap: 4, justifyContent: "center" }}>
                          {isEditing ? <>
                            <button onClick={function(e) { e.stopPropagation(); saveEdit(); }} style={{ background: "#15803D", color: "#fff", border: "none", borderRadius: 4, padding: "3px 8px", fontSize: 11, cursor: "pointer", fontWeight: 600 }}>저장</button>
                            <button onClick={function(e) { e.stopPropagation(); cancelEdit(); }} style={{ background: "#fff", color: "#888", border: "1px solid #E8E5E0", borderRadius: 4, padding: "3px 6px", fontSize: 11, cursor: "pointer" }}>취소</button>
                          </> : <>
                            <button onClick={function() { startEdit(row); setExpandedId(row.id); }} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}><Icon name="edit" size={14} color="#888" /></button>
                            <button onClick={function() { deleteLead(row.id); }} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}><Icon name="x" size={14} color="#CCC" /></button>
                          </>}
                        </div>
                      </td>
                    </tr>,
                    isExpanded && (<tr key={row.id + "-detail"} style={{ borderBottom: "1px solid #F0EDE8", background: "#FAFAF8" }} onClick={function(e) { e.stopPropagation(); }}><td colSpan={8} style={{ padding: "12px 16px 16px 50px" }}>
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
                                onClick={function(e) { e.stopPropagation(); }}
                                onChange={function(e) { e.stopPropagation(); var k = dateKey; var v = e.target.value; if (!isEditing) { startEdit(row); } setEditData(function(p) { var o = Object.assign({}, p); o[k] = v; return o; }); }}
                                style={{ padding: "4px 6px", border: "1px solid #E8E5E0", borderRadius: 4, fontSize: 11, flex: 1 }} />
                              <select value={statusVal}
                                onClick={function(e) { e.stopPropagation(); }}
                                onChange={function(e) { e.stopPropagation(); var k = statusKey; var v = e.target.value; if (!isEditing) { startEdit(row); } setEditData(function(p) { var o = Object.assign({}, p); o[k] = v; return o; }); }}
                                style={{ padding: "4px 6px", border: "1px solid #E8E5E0", borderRadius: 4, fontSize: 11, flex: 1 }}>
                                <option value="">상태 선택</option>
                                {CALL_STATUSES.map(function(s) { return <option key={s} value={s}>{s}</option>; })}
                              </select>
                            </div>
                            <input value={memoVal} placeholder="메모 입력"
                              onClick={function(e) { e.stopPropagation(); }}
                              onChange={function(e) { e.stopPropagation(); var k = memoKey; var v = e.target.value; if (!isEditing) { startEdit(row); } setEditData(function(p) { var o = Object.assign({}, p); o[k] = v; return o; }); }}
                              style={{ padding: "4px 6px", border: "1px solid #E8E5E0", borderRadius: 4, fontSize: 11, width: "100%", boxSizing: "border-box" }} />
                            {oldVal && !dateVal && !memoVal && (<div style={{ marginTop: 3, fontSize: 10, color: "#AAA" }}>기존: {oldVal}</div>)}
                          </div>);
                        })}
                        <div style={{ background: "#fff", borderRadius: 8, padding: "8px 12px", border: "1px solid #E8E5E0" }}>
                          <div style={{ fontSize: 10, color: "#888", fontWeight: 600, marginBottom: 3 }}>기타</div>
                          <input value={isEditing ? (editData.etc || "") : (row.etc || "")} placeholder="기타 메모"
                            onChange={function(e) { var v = e.target.value; if (!isEditing) { startEdit(row); } setEditData(function(p) { return Object.assign({}, p, { etc: v }); }); }}
                            onClick={function(e) { e.stopPropagation(); }}
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

      {showAddLead && (<div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={function(e) { if (e.target === e.currentTarget) setShowAddLead(false); }}>
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
        <div style={{ position: "fixed", inset: 0, zIndex: 900 }} onClick={function() { setSelectedLead(null); }}>
          <div style={{ position: "absolute", top: 0, right: 0, width: 480, height: "100%", background: "#fff", boxShadow: "-4px 0 30px rgba(0,0,0,0.15)", overflowY: "auto" }}
            onClick={function(e) { e.stopPropagation(); }}>
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

              {/* 1~5차콜 */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#888", marginBottom: 10, letterSpacing: "0.05em" }}>콜 기록</div>
                {[1,2,3,4,5].map(function(ci) {
                  var dateKey = "call_" + ci + "_date";
                  var statusKey = "call_" + ci + "_status";
                  var memoKey = "call_" + ci + "_memo";
                  return (
                    <div key={ci} style={{ background: "#F7F6F3", borderRadius: 8, padding: "10px 14px", marginBottom: 8, borderLeft: (selectedLead[dateKey] || selectedLead[statusKey] || selectedLead[memoKey]) ? "3px solid #4338CA" : "3px solid #E8E5E0" }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#4338CA", marginBottom: 6 }}>{ci}차콜</div>
                      <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                        <input type="date" value={selectedLead[dateKey] || ""}
                          onChange={function(e) { setSelectedLead(function(p) { return Object.assign({}, p, { [dateKey]: e.target.value }); }); }}
                          onBlur={async function() {
                            var u = {}; u[dateKey] = selectedLead[dateKey] || null; u.updated_at = new Date().toISOString();
                            var r = await supabase.from("db_leads").update(u).eq("id", selectedLead.id);
                            if (!r.error) setLeads(function(prev) { return prev.map(function(l) { return l.id === selectedLead.id ? Object.assign({}, l, u) : l; }); });
                          }}
                          style={{ flex: 1, padding: "6px 8px", border: "1px solid #fff", borderRadius: 6, fontSize: 12, background: "#fff" }} />
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
                          style={{ flex: 1, padding: "6px 8px", border: "1px solid #fff", borderRadius: 6, fontSize: 12, background: "#fff" }}>
                          <option value="">상태 선택</option>
                          <option value="통화완료">통화완료</option><option value="부재">부재</option><option value="거절">거절</option>
                          <option value="문자발송">문자발송</option><option value="카톡발송">카톡발송</option><option value="콜백요청">콜백요청</option>
                          <option value="미팅예약">미팅예약</option><option value="상담완료">상담완료</option><option value="수신거부">수신거부</option>
                        </select>
                      </div>
                      <input value={selectedLead[memoKey] || ""} placeholder={ci + "차콜 메모 (선택)"}
                        onChange={function(e) { setSelectedLead(function(p) { return Object.assign({}, p, { [memoKey]: e.target.value }); }); }}
                        onBlur={async function() {
                          var u = {}; u[memoKey] = selectedLead[memoKey] || null; u.updated_at = new Date().toISOString();
                          var r = await supabase.from("db_leads").update(u).eq("id", selectedLead.id);
                          if (!r.error) setLeads(function(prev) { return prev.map(function(l) { return l.id === selectedLead.id ? Object.assign({}, l, u) : l; }); });
                        }}
                        style={{ width: "100%", padding: "6px 8px", border: "1px solid #fff", borderRadius: 6, fontSize: 12, boxSizing: "border-box", outline: "none", background: "#fff" }} />
                    </div>
                  );
                })}
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
            </div>
          </div>
        </div>
      )}

      {/* DB리스트 휴지통 모달 */}
      {showLeadTrash && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={function(e) { if (e.target === e.currentTarget) setShowLeadTrash(false); }}>
          <div style={{ background: "#fff", borderRadius: 14, width: 600, maxHeight: "80vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #E8E5E0", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, background: "#fff" }}>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>🗑️ DB리스트 휴지통 ({trashedLeads.length}건)</h2>
              <button onClick={function() { setShowLeadTrash(false); }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "#888" }}>✕</button>
            </div>
            <div style={{ padding: "16px 24px" }}>
              {trashedLeads.length === 0 ? (
                <div style={{ padding: "40px 0", textAlign: "center", color: "#CCC", fontSize: 13 }}>휴지통이 비어 있습니다</div>
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
