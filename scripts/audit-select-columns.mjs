// src/App.js·api/*.js 의 모든 select 컬럼 목록을 **실제 DB 스키마와 대조**한다.
// 실행: node scripts/audit-select-columns.mjs [검사할파일...]
//
// 왜 필요한가 (2026-08-15):
//   agency_cases 에 없는 컬럼 `product` 를 select 해서 PostgREST 가 400 을 줬고,
//   fetchAllRows 는 실패 시 data:null 을 주므로 **기업목록 기관 배지가 통째로 비어** 있었다.
//   화면은 "원래 배지가 없는 업체"처럼 보여 아무도 못 알아챈다. 이런 오타는 눈으로 못 잡으므로
//   배포 전에 이 스크립트로 훑는다.
//
// ⚠️ 컬럼명을 바꾸거나 새 조회를 추가했으면 이걸 돌릴 것.
// ⚠️ 커버리지를 같이 출력한다 — "0건"이 "다 봤다"는 뜻이 되려면 미검사 건수도 봐야 한다.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const PROJECT_REF = "ujdrjvnihxjvbkezjvwc";

function loadEnvLocal() {
  const p = path.join(ROOT, ".env.local");
  if (!fs.existsSync(p)) return;
  fs.readFileSync(p, "utf8").split(/\r?\n/).forEach(function (line) {
    const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "").trim();
  });
}

async function loadSchema(token) {
  const sql = `select table_name, column_name from information_schema.columns
                where table_schema='public' order by table_name, ordinal_position;`;
  const res = await fetch("https://api.supabase.com/v1/projects/" + PROJECT_REF + "/database/query", {
    method: "POST",
    headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
    body: JSON.stringify({ query: sql }),
  });
  if (!res.ok) throw new Error("스키마 조회 실패 HTTP " + res.status + ": " + (await res.text()).slice(0, 300));
  const rows = await res.json();
  const map = {};
  rows.forEach(function (r) { (map[r.table_name] = map[r.table_name] || new Set()).add(r.column_name); });
  return map;
}

const lineAt = (src, idx) => src.slice(0, idx).split(/\r?\n/).length;

// 소스 전체를 한 덩어리로 훑는다(줄바꿈으로 끊긴 체인도 잡기 위해).
//   · fetchAllRows("t", "a, b, c"            — 인자가 여러 줄에 걸쳐도 잡힘
//   · .from("t") ... .select("a, b, c")      — 사이에 update/eq/order 가 끼어도, 다음 .from 전까지만 탐색
function collectSelects(src) {
  const out = [];
  let m;

  const reFetchAll = /fetchAllRows\(\s*"([a-z_]+)"\s*,\s*"([^"]*)"/g;
  while ((m = reFetchAll.exec(src))) out.push({ table: m[1], cols: m[2], line: lineAt(src, m.index), how: "fetchAllRows" });

  const reFrom = /\.from\(\s*"([a-z_]+)"\s*\)/g;
  while ((m = reFrom.exec(src))) {
    const table = m[1];
    const start = m.index + m[0].length;
    // 다음 .from( 전까지가 이 체인의 사정권
    reFrom.lastIndex = start;
    const nextFrom = reFrom.exec(src);
    reFrom.lastIndex = start;                       // 탐색 위치 복원(다음 루프에서 이어서)
    const end = nextFrom ? nextFrom.index : Math.min(src.length, start + 1500);
    const chunk = src.slice(start, end);
    const sel = chunk.match(/\.select\(\s*"([^"]*)"/);
    if (sel) out.push({ table, cols: sel[1], line: lineAt(src, start), how: ".select" });
    else out.push({ table, cols: null, line: lineAt(src, start), how: "select없음/동적" });
  }
  return out;
}

// ── insert/update/upsert payload 키 검사 ────────────────────────────────────
// select 는 없는 컬럼이면 400(PostgREST), payload 는 없는 컬럼이면 PGRST204 다.
// 둘 다 "에러가 아니라 조용히 어긋나는" 종류라 같이 훑는다.
// ⚠️ 정적으로 읽을 수 있는 건 **객체 리터럴뿐**이다. `.update(payload)` 처럼 변수를 넘기면
//    여기서는 알 수 없으므로 "검사 불가"로 세어 커버리지에 드러낸다(0건 = 다 봤다가 아니다).

// 따옴표·주석을 건너뛰며 괄호/중괄호 짝을 맞춰 끝 위치를 찾는다.
export function findBalanced(src, start) {
  const open = src[start];
  const close = open === "{" ? "}" : open === "[" ? "]" : ")";
  let depth = 0, i = start;
  while (i < src.length) {
    const c = src[i];
    if (c === '"' || c === "'" || c === "`") {           // 문자열 통째로 건너뛰기
      const quote = c; i++;
      while (i < src.length && src[i] !== quote) { if (src[i] === "\\") i++; i++; }
      i++; continue;
    }
    if (c === "/" && src[i + 1] === "/") { while (i < src.length && src[i] !== "\n") i++; continue; }
    if (c === "/" && src[i + 1] === "*") { i += 2; while (i < src.length && !(src[i] === "*" && src[i + 1] === "/")) i++; i += 2; continue; }
    if (c === "{" || c === "[" || c === "(") depth++;
    else if (c === "}" || c === "]" || c === ")") { depth--; if (depth === 0) return i + 1; }
    i++;
  }
  return -1;
}

// 객체 리터럴 텍스트("{...}")에서 **최상위 키**만 뽑는다.
// 반환 { keys:[], unknown:true }  — unknown 은 스프레드·계산된 키가 섞여 전부 알 수 없다는 뜻.
export function topLevelKeys(objText) {
  const keys = [];
  let unknown = false;
  let depth = 0, i = 0, expectKey = false;
  while (i < objText.length) {
    const c = objText[i];
    if (c === '"' || c === "'" || c === "`") {
      const quote = c; const s = i; i++;
      while (i < objText.length && objText[i] !== quote) { if (objText[i] === "\\") i++; i++; }
      i++;
      if (depth === 1 && expectKey) {
        // "키": 형태인지 확인
        let j = i; while (j < objText.length && /\s/.test(objText[j])) j++;
        if (objText[j] === ":") { keys.push(objText.slice(s + 1, i - 1)); expectKey = false; }
      }
      continue;
    }
    if (c === "/" && objText[i + 1] === "/") { while (i < objText.length && objText[i] !== "\n") i++; continue; }
    if (c === "/" && objText[i + 1] === "*") { i += 2; while (i < objText.length && !(objText[i] === "*" && objText[i + 1] === "/")) i++; i += 2; continue; }
    if (c === "{" || c === "[" || c === "(") { depth++; if (depth === 1) expectKey = true; i++; continue; }
    if (c === "}" || c === "]" || c === ")") { depth--; i++; continue; }
    if (depth === 1 && c === ",") { expectKey = true; i++; continue; }
    if (depth === 1 && expectKey) {
      if (c === "." && objText.slice(i, i + 3) === "...") { unknown = true; expectKey = false; i += 3; continue; }
      const idm = objText.slice(i).match(/^([A-Za-z_$][A-Za-z0-9_$]*)\s*([:,}])/);
      if (idm) {
        keys.push(idm[1]);                                // `a: 1` 도 `{ a, b }` 단축도 키는 같다
        expectKey = idm[2] === "," ;                      // 단축 뒤 콤마면 다음 키를 기대
        i += idm[1].length;
        continue;
      }
      if (/\S/.test(c)) expectKey = false;                // [계산된키] 등 — 아래에서 unknown 처리
    }
    i++;
  }
  if (/\[[^\]]*\]\s*:/.test(objText)) unknown = true;      // 계산된 키가 있으면 전수는 알 수 없다
  return { keys, unknown };
}

// .from("t") 체인에서 insert/update/upsert payload 를 찾는다.
export function collectWrites(src) {
  const out = [];
  const reFrom = /\.from\(\s*"([a-z_]+)"\s*\)/g;
  let m;
  while ((m = reFrom.exec(src))) {
    const table = m[1];
    const start = m.index + m[0].length;
    reFrom.lastIndex = start;
    const nextFrom = reFrom.exec(src);
    reFrom.lastIndex = start;
    const end = nextFrom ? nextFrom.index : Math.min(src.length, start + 2000);
    const chunk = src.slice(start, end);

    const reOp = /\.(insert|update|upsert)\(\s*/g;
    let om;
    while ((om = reOp.exec(chunk))) {
      const kind = om[1];
      const argStart = start + om.index + om[0].length;
      const ch = src[argStart];
      const line = lineAt(src, argStart);
      if (ch !== "{" && ch !== "[") { out.push({ table, kind, line, dynamic: true, keys: [] }); continue; }
      const stop = findBalanced(src, argStart);
      if (stop < 0) { out.push({ table, kind, line, dynamic: true, keys: [] }); continue; }
      const text = src.slice(argStart, stop);
      if (ch === "[") {
        // 배열 insert: 안의 객체 리터럴들을 각각 본다. 변수 배열이면 키가 안 잡혀 dynamic 처리됨.
        let inner = text.slice(1, -1).trim();
        if (!inner.startsWith("{")) { out.push({ table, kind, line, dynamic: true, keys: [] }); continue; }
        const objEnd = findBalanced(inner, 0);
        const r = topLevelKeys(inner.slice(0, objEnd));
        out.push({ table, kind, line, dynamic: r.unknown, keys: r.keys });
        continue;
      }
      const r = topLevelKeys(text);
      out.push({ table, kind, line, dynamic: r.unknown && r.keys.length === 0, keys: r.keys, partial: r.unknown });
    }
  }

  // 이 저장소 전용 래퍼: writeGuarded({ table: "t", op: "update", payload: {...} })
  // supabase 체인이 아니라 위 로직에 안 걸린다. 여기서 따로 본다.
  const reWG = /writeGuarded\(\s*\{/g;
  let wm;
  while ((wm = reWG.exec(src))) {
    const objStart = wm.index + wm[0].length - 1;      // '{' 위치
    const objEnd = findBalanced(src, objStart);
    if (objEnd < 0) continue;
    const argText = src.slice(objStart, objEnd);
    const tm = argText.match(/\btable\s*:\s*"([a-z_]+)"/);
    if (!tm) continue;
    const table = tm[1];
    const line = lineAt(src, objStart);
    const pIdx = argText.search(/\bpayload\s*:\s*\{/);
    if (pIdx < 0) { out.push({ table, kind: "writeGuarded", line, dynamic: true, keys: [] }); continue; }
    const braceIdx = argText.indexOf("{", pIdx);
    const pEnd = findBalanced(argText, braceIdx);
    if (pEnd < 0) { out.push({ table, kind: "writeGuarded", line, dynamic: true, keys: [] }); continue; }
    const r = topLevelKeys(argText.slice(braceIdx, pEnd));
    out.push({ table, kind: "writeGuarded", line, dynamic: r.unknown && r.keys.length === 0, keys: r.keys, partial: r.unknown });
  }
  return out;
}

// "a, b, rel(x), c:alias, count" → 검사 가능한 평범한 컬럼만 남긴다
function splitCols(colStr) {
  const noEmbed = colStr.replace(/\([^)]*\)/g, "");   // 관계 임베드는 검사 대상 아님
  const all = noEmbed.split(",").map(function (s) { return s.trim(); }).filter(Boolean);
  const plain = all.filter(function (s) { return s !== "*" && !/[:.]/.test(s) && /^[a-z_][a-z0-9_]*$/.test(s); });
  return { all: all, plain: plain, skipped: all.filter(function (s) { return plain.indexOf(s) < 0; }) };
}

async function main() {
  loadEnvLocal();
  const token = process.env.SUPABASE_ACCESS_TOKEN;
  if (!token) { console.error("❌ .env.local 의 SUPABASE_ACCESS_TOKEN 이 없습니다."); process.exit(1); }

  const targets = process.argv.slice(2).length
    ? process.argv.slice(2)
    : [path.join(ROOT, "src", "App.js"), path.join(ROOT, "api", "ai-search.js")];

  const schema = await loadSchema(token);
  let bad = 0, checkedCols = 0, sites = 0, starSites = 0, dynamicSites = 0;
  let writeSites = 0, writeCheckedKeys = 0, writeDynamic = 0, writePartial = 0;
  const unknownTables = [];
  const skippedBits = new Set();

  console.log("■ select 컬럼 ↔ 실제 스키마 대조  (public 테이블 " + Object.keys(schema).length + "개)");

  targets.forEach(function (file) {
    const src = fs.readFileSync(file, "utf8");
    const rel = path.relative(ROOT, file);
    const selects = collectSelects(src);
    sites += selects.length;
    console.log("\n· " + rel + " — 조회 지점 " + selects.length + "곳");

    selects.forEach(function (s) {
      if (s.cols === null) { dynamicSites++; return; }
      const cols = schema[s.table];
      if (!cols) { unknownTables.push(s.table + " (" + rel + ":" + s.line + ")"); return; }
      const parts = splitCols(s.cols);
      if (parts.all.length === 1 && parts.all[0] === "*") { starSites++; return; }
      parts.skipped.forEach(function (b) { skippedBits.add(b); });
      checkedCols += parts.plain.length;
      const missing = parts.plain.filter(function (c) { return !cols.has(c); });
      if (missing.length) {
        bad++;
        console.log("  ❌ " + rel + ":" + s.line + "  " + s.table + " → 없는 컬럼: " + missing.join(", "));
        missing.forEach(function (mcol) {
          const near = [...cols].filter(function (c) { return c.includes(mcol) || mcol.includes(c); });
          console.log("       ↳ " + (near.length ? "혹시 이건가요? " + near.join(" / ") : "비슷한 이름 없음 — 컬럼을 추가해야 할 수도 있습니다"));
        });
      }
    });

    // ── insert/update/upsert payload 키 ──────────────────────────────────
    const writes = collectWrites(src);
    writeSites += writes.length;
    writes.forEach(function (w) {
      const cols = schema[w.table];
      if (!cols) { unknownTables.push(w.table + " (" + rel + ":" + w.line + ")"); return; }
      if (w.dynamic) { writeDynamic++; return; }
      if (w.partial) writePartial++;
      writeCheckedKeys += w.keys.length;
      const missing = w.keys.filter(function (k) { return !cols.has(k); });
      if (missing.length) {
        bad++;
        console.log("  ❌ " + rel + ":" + w.line + "  " + w.table + "." + w.kind + "() → 없는 컬럼: " + missing.join(", "));
        missing.forEach(function (mcol) {
          const near = [...cols].filter(function (c) { return c.includes(mcol) || mcol.includes(c); });
          console.log("       ↳ " + (near.length ? "혹시 이건가요? " + near.join(" / ") : "비슷한 이름 없음 — 컬럼을 추가해야 할 수도 있습니다"));
        });
      }
    });
  });

  console.log("\n■ 커버리지 (0건이 '다 봤다'가 되려면 아래도 같이 볼 것)");
  console.log("  [select]");
  console.log("  · 실제로 대조한 컬럼: " + checkedCols + "개");
  console.log("  · select(\"*\") 라 검사 불가: " + starSites + "곳  (컬럼을 안 적으므로 오타가 날 수 없음)");
  console.log("  · select 가 없거나 동적: " + dynamicSites + "곳");
  if (skippedBits.size) console.log("  · 별칭·임베드라 건너뜀: " + [...skippedBits].join(", "));
  console.log("  [insert/update/upsert payload]");
  console.log("  · 실제로 대조한 키: " + writeCheckedKeys + "개 (" + writeSites + "곳 중)");
  console.log("  · payload 가 변수라 검사 불가: " + writeDynamic + "곳  ← 여기 오타는 이 도구로 못 잡는다");
  console.log("  · 스프레드/계산된 키가 섞여 일부만 검사: " + writePartial + "곳");
  if (unknownTables.length) console.log("  · public 에 없는 표: " + [...new Set(unknownTables)].join(", "));

  console.log("\n결과: 조회 지점 " + sites + "곳 · 쓰기 지점 " + writeSites + "곳 · 문제 " + bad + "곳");
  process.exit(bad ? 1 : 0);
}

// 직접 실행할 때만 감사를 돌린다. 테스트가 파서만 import 할 수 있도록 분리.
const runDirect = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (runDirect) {
  main().catch(function (e) { console.error("❌ 오류:", e && e.message ? e.message : e); process.exit(1); });
}
