// 빌드 시점의 커밋 해시/시각을 src/buildInfo.json에 기록한다.
// - Vercel: 빌드 환경변수 VERCEL_GIT_COMMIT_SHA 사용 (실제 배포 커밋)
// - 로컬: git rev-parse 로 현재 HEAD
// prebuild / prestart 에서 실행됨.
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

var commit = process.env.VERCEL_GIT_COMMIT_SHA || "";
if (!commit) {
  try { commit = execSync("git rev-parse HEAD", { stdio: ["ignore", "pipe", "ignore"] }).toString().trim(); } catch (e) {}
}
var short = commit ? commit.slice(0, 7) : "dev";

// KST(UTC+9) 기준 날짜/시각 문자열
var d = new Date(Date.now() + 9 * 3600 * 1000);
var pad = function (n) { return String(n).padStart(2, "0"); };
var builtAt = d.getUTCFullYear() + "-" + pad(d.getUTCMonth() + 1) + "-" + pad(d.getUTCDate()) + " " + pad(d.getUTCHours()) + ":" + pad(d.getUTCMinutes());

var info = { commit: short, builtAt: builtAt };
var outPath = path.join(__dirname, "..", "src", "buildInfo.json");
fs.writeFileSync(outPath, JSON.stringify(info, null, 2) + "\n");
console.log("[gen-version] buildInfo:", JSON.stringify(info));
