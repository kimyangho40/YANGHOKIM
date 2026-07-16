// Supabase DDL/SQL 실행기 (Management API 사용)
// 사용법: node scripts/run-sql.js <sql파일경로>
// 인증: .env.local 의 SUPABASE_ACCESS_TOKEN (Personal Access Token, sbp_...) 를 읽음.
//   - anon key 로는 DDL 불가, supabase-js 는 임의 SQL 실행 불가 → Management API 로 실행.
//   - .env.local 은 .gitignore 처리돼 있어 토큰이 git 에 올라가지 않음.
const fs = require("fs");
const path = require("path");

const PROJECT_REF = "ujdrjvnihxjvbkezjvwc";

// .env.local 을 직접 파싱 (dotenv 의존성 없이)
function loadEnvLocal() {
  var p = path.join(__dirname, "..", ".env.local");
  if (!fs.existsSync(p)) return;
  fs.readFileSync(p, "utf8").split(/\r?\n/).forEach(function (line) {
    var m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m) return;
    var key = m[1];
    var val = m[2].replace(/^["']|["']$/g, "").trim();
    if (!(key in process.env)) process.env[key] = val;
  });
}

async function main() {
  loadEnvLocal();
  var token = process.env.SUPABASE_ACCESS_TOKEN;
  if (!token) {
    console.error("❌ SUPABASE_ACCESS_TOKEN 이 없습니다.");
    console.error("   .env.local 파일에 아래 한 줄을 넣어주세요:");
    console.error("   SUPABASE_ACCESS_TOKEN=sbp_여기에_토큰");
    process.exit(1);
  }
  var file = process.argv[2];
  if (!file) {
    console.error("❌ 사용법: node scripts/run-sql.js <sql파일경로>");
    process.exit(1);
  }
  if (!fs.existsSync(file)) {
    console.error("❌ 파일을 찾을 수 없습니다: " + file);
    process.exit(1);
  }
  var sql = fs.readFileSync(file, "utf8");
  console.log("▶ 프로젝트:", PROJECT_REF);
  console.log("▶ 실행 파일:", file, "(" + sql.length + " chars)");

  var res = await fetch("https://api.supabase.com/v1/projects/" + PROJECT_REF + "/database/query", {
    method: "POST",
    headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
    body: JSON.stringify({ query: sql }),
  });
  var text = await res.text();
  if (!res.ok) {
    console.error("❌ 실행 실패 (HTTP " + res.status + "):");
    console.error(text);
    process.exit(1);
  }
  console.log("✅ 실행 성공. 마지막 SELECT 결과:");
  try {
    console.log(JSON.stringify(JSON.parse(text), null, 2));
  } catch (e) {
    console.log(text);
  }
}

main().catch(function (e) {
  console.error("❌ 오류:", e && e.message ? e.message : e);
  process.exit(1);
});
