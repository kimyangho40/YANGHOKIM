// companiesWithoutCard 검증 (2026-08-30)
//   파이프라인 보드 「＋ 카드 없는 기업」 목록이 DB 사실과 맞는지 확인한다.
//
// ⚠️ App.js 소스에서 memo 콜백을 **떼어내 그대로 실행**한다 — 손으로 옮겨 적으면 코드 검증이 아니다.
//    (test-amount-unit.mjs · test-debtor-change.mjs 와 같은 방식)
// ⚠️ 읽기 전용이다. SELECT 하나만 돌리고 아무것도 쓰지 않는다.
//
// 사용법: node scripts/test-nocard.mjs
//   .env.local 의 SUPABASE_ACCESS_TOKEN 이 필요하다(run-sql.js 와 동일).
import fs from "fs";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";
import { execFileSync } from "child_process";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// ── ① App.js 에서 memo 콜백 본문만 떼어낸다 ─────────────────────────────────
const HEAD = "const companiesWithoutCard = useMemo(() => {";
const TAIL = "}, [companies, pipelineCards]);";
const src = fs.readFileSync(path.join(ROOT, "src/App.js"), "utf8");
const start = src.indexOf(HEAD);
if (start < 0) { console.error("❌ companiesWithoutCard 를 App.js 에서 못 찾았습니다 (이름이 바뀌었나요?)"); process.exit(1); }
const rest = src.slice(start);
const end = rest.indexOf(TAIL);
if (end < 0) { console.error("❌ memo 의 끝(의존성 배열)을 못 찾았습니다."); process.exit(1); }
const body = rest.slice(rest.indexOf("{") + 1, end);
const companiesWithoutCard = new Function("companies", "pipelineCards", body);
console.log("── App.js 에서 떼어낸 소스 " + body.trim().split("\n").length + "줄 ──");

// ── ② 실제 DB 를 읽는다 (읽기 전용 SELECT 1개) ──────────────────────────────
const sql = `
select json_build_object(
  'companies', (select coalesce(json_agg(json_build_object('id',id,'name',name,'deleted_at',deleted_at,'stage',stage)),'[]'::json) from public.companies),
  'cards',     (select coalesce(json_agg(json_build_object('company_id',company_id,'deleted_at',deleted_at)),'[]'::json) from public.pipeline_cards),
  'expected',  (select coalesce(json_agg(c.name order by c.name),'[]'::json) from public.companies c
                 where c.deleted_at is null
                   and not exists (select 1 from public.pipeline_cards p
                                    where p.company_id = c.id and p.deleted_at is null))
) as payload;
`;
const tmp = path.join(os.tmpdir(), "nocard-check-" + process.pid + ".sql");
fs.writeFileSync(tmp, sql);
let raw;
try {
  raw = execFileSync("node", [path.join(ROOT, "scripts/run-sql.js"), tmp], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
} catch (e) {
  console.error("❌ DB 조회 실패 — .env.local 의 SUPABASE_ACCESS_TOKEN 을 확인하세요.");
  console.error(String((e && e.stdout) || (e && e.message) || e).slice(-400));
  process.exit(1);
} finally { try { fs.unlinkSync(tmp); } catch (_) {} }
if (raw.indexOf("[") < 0) { console.error("❌ 조회 결과를 못 읽었습니다:\n" + raw.slice(-400)); process.exit(1); }
const { companies, cards, expected } = JSON.parse(raw.slice(raw.indexOf("[")))[0].payload;
console.log(`기업 ${companies.length}행 · 카드 ${cards.length}장 · SQL 기대값 ${expected.length}개`);

// ── ③ 대조 ─────────────────────────────────────────────────────────────────
const got = companiesWithoutCard(companies, cards).map(c => c.name);
const exp = expected.slice().sort((a, b) => (a || "").localeCompare(b || "", "ko"));
const liveCardCo = new Set(cards.filter(c => !c.deleted_at && c.company_id).map(c => c.company_id));

let pass = 0, fail = 0;
const check = (name, ok, detail) => {
  if (ok) { pass++; console.log("  ✅ " + name); }
  else { fail++; console.log("  ❌ " + name + " — " + detail); }
};

check("건수가 SQL 과 일치", got.length === exp.length, `JS ${got.length} vs SQL ${exp.length}`);
check("목록이 SQL 과 일치", JSON.stringify(got) === JSON.stringify(exp),
  "\n     JS  = " + JSON.stringify(got) + "\n     SQL = " + JSON.stringify(exp));
check("휴지통 기업은 안 들어간다",
  !got.some(n => (companies.find(c => c.name === n) || {}).deleted_at), "휴지통 기업이 섞였습니다");
check("살아있는 카드가 있는 기업은 안 들어간다",
  !companies.some(co => liveCardCo.has(co.id) && got.includes(co.name)), "카드 있는 기업이 섞였습니다");
check("결과가 이름순으로 정렬돼 있다",
  JSON.stringify(got) === JSON.stringify(got.slice().sort((a, b) => (a || "").localeCompare(b || "", "ko"))), "정렬이 어긋납니다");

console.log(`\n── 카드 없는 기업 (${got.length}개) ──`);
got.forEach(n => {
  const co = companies.find(c => c.name === n) || {};
  console.log("  · " + String(n).replace(/\r?\n/g, " ") + "  [" + (co.stage || "단계없음") + "]");
});
console.log(`\n결과: ${pass}/${pass + fail} 통과`);
process.exit(fail ? 1 : 0);
