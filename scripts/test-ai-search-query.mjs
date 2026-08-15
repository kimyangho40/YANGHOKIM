// AI 상담 도구(query_crm_data)가 **실제 DB 에서 진짜 건수를 가져오는지** 검증한다.
// 실행: node scripts/test-ai-search-query.mjs
//
// 왜 필요한가 (2026-08-15 장애):
//   pgQuote 가 최상위 조건 값까지 큰따옴표로 감싸는 바람에 PostgREST 가 따옴표째 값으로 읽어
//   **모든 문자열 필터가 200 + 0건**이었다. 에러가 아니라 0건이라 아무도 못 알아챘다.
//   그 결과 특정 업체 조회는 헛돌다 빈 응답이 되고, 집계는 "DB 에 위임"해 놓고도 0건을 받았다.
//   → 눈으로는 절대 못 잡는다. 실제 DB 에 쏴서 0건이 아닌지 확인하는 수밖에 없다.
//
// ⚠️ 읽기 전용이다(SELECT + count 만). 데이터를 바꾸지 않는다.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { runQuery } from "../api/ai-search.js";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const SUPABASE_URL = "https://ujdrjvnihxjvbkezjvwc.supabase.co";
const ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqZHJqdm5paHhqdmJrZXpqdndjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzOTgzODIsImV4cCI6MjA5Mzk3NDM4Mn0.K0zbRGT8SrDBeZoDyc_VM61xAHZye8V0p0m2PemNUWM";

function loadEnvLocal() {
  const p = path.join(ROOT, ".env.local");
  if (!fs.existsSync(p)) return;
  fs.readFileSync(p, "utf8").split(/\r?\n/).forEach(function (line) {
    const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "").trim();
  });
}

// 도구는 "사용자 본인 JWT" 로 나간다(RLS 적용). 테스트는 서비스 계정 대신
// AI_TEST_JWT 환경변수의 토큰을 쓴다. 없으면 안내하고 건너뛴다.
async function main() {
  loadEnvLocal();
  const token = process.env.AI_TEST_JWT;
  if (!token) {
    console.log("⏭  AI_TEST_JWT 가 없어 건너뜁니다.");
    console.log("   브라우저에서 CRM 로그인 후 콘솔에 아래를 붙여 넣어 토큰을 얻으세요:");
    console.log('     JSON.parse(localStorage.getItem("sb-yanghokim-auth")).access_token');
    console.log("   그리고: AI_TEST_JWT=<토큰> node scripts/test-ai-search-query.mjs");
    process.exit(0);
  }
  const creds = { token: token, anonKey: ANON };

  let pass = 0, fail = 0;
  const check = (label, cond, detail) => {
    if (cond) { pass++; console.log("  ✅ " + label); }
    else { fail++; console.log("  ❌ " + label + (detail ? "  → " + detail : "")); }
  };

  console.log("■ 문자열 필터가 실제로 행을 찾는가 (0건이면 예전 따옴표 버그 재발)");

  const eqAgency = await runQuery(
    { table: "기관진행", filters: [{ field: "agency_group", op: "eq", value: "소상공인시장진흥공단" }], limit: 0 }, creds);
  check("eq  agency_group=소상공인시장진흥공단 → 0건 아님", eqAgency.건수 > 0, JSON.stringify(eqAgency).slice(0, 200));

  const eqStatus = await runQuery(
    { table: "기관진행", filters: [{ field: "status", op: "eq", value: "부결" }], limit: 0 }, creds);
  check("eq  status=부결 → 0건 아님", eqStatus.건수 > 0, JSON.stringify(eqStatus).slice(0, 200));

  const contains = await runQuery(
    { table: "업체목록", filters: [{ field: "name", op: "contains", value: "엘케이네스트" }], limit: 5 }, creds);
  check("contains name~엘케이네스트 → 1건 이상", contains.건수 > 0, JSON.stringify(contains).slice(0, 200));
  check("  찾은 이름이 (주)엘케이네스트코리아",
    (contains.표본 || []).some(function (r) { return String(r.name || "").includes("엘케이네스트코리아"); }),
    JSON.stringify(contains.표본));

  console.log("■ 괄호·쉼표가 든 값도 깨지지 않는가 (구분자 충돌)");
  const paren = await runQuery(
    { table: "업체목록", filters: [{ field: "name", op: "contains", value: "(주)엘케이" }], limit: 3 }, creds);
  check("contains name~(주)엘케이 → 0건 아님", paren.건수 > 0, JSON.stringify(paren).slice(0, 200));

  const comma = await runQuery(
    { table: "기관진행", filters: [{ field: "assignee", op: "contains", value: "양호, 관호" }], limit: 0 }, creds);
  check("contains assignee~'양호, 관호'(쉼표 포함) → 오류 없음", !comma.error, comma.error);

  console.log("■ any_of(or) 도 동작하는가");
  const anyOf = await runQuery(
    { table: "기관진행", any_of: [{ field: "status", op: "eq", value: "부결" }, { field: "result", op: "eq", value: "부결" }], limit: 0 }, creds);
  check("any_of status=부결 or result=부결 → 0건 아님", anyOf.건수 > 0, JSON.stringify(anyOf).slice(0, 200));
  check("  any_of 건수 >= status 단독 건수", anyOf.건수 >= eqStatus.건수,
    "any_of=" + anyOf.건수 + " / status=" + eqStatus.건수);

  console.log("■ in 목록도 동작하는가");
  const inList = await runQuery(
    { table: "기관진행", filters: [{ field: "status", op: "in", value: ["부결", "진행 중"] }], limit: 0 }, creds);
  check("in status in (부결, 진행 중) → status 단독보다 많음", inList.건수 > eqStatus.건수,
    "in=" + inList.건수 + " / status=" + eqStatus.건수);

  console.log("■ 0건일 때 비슷한 이름 힌트가 붙는가 (오타 대응)");
  const typo = await runQuery(
    { table: "업체목록", filters: [{ field: "name", op: "contains", value: "주식회사 엘케이에네스트코리아" }], limit: 0 },
    creds, { names: { "업체목록": ["(주)엘케이네스트코리아", "치즈버거", "백돈시흥능곡점"] } });
  check("오타 이름 → 0건", typo.건수 === 0, String(typo.건수));
  check("  비슷한_이름 에 (주)엘케이네스트코리아 제시",
    !!(typo.조건이_0건일때 && (typo.조건이_0건일때.비슷한_이름 || []).includes("(주)엘케이네스트코리아")),
    JSON.stringify(typo.조건이_0건일때));

  console.log("\n결과: " + pass + " pass / " + fail + " fail");
  process.exit(fail ? 1 : 0);
}

main().catch(function (e) { console.error("❌ 오류:", e && e.message ? e.message : e); process.exit(1); });
