// Vercel 서버리스 함수: 구글시트(배정DB) → Supabase 스냅샷 저장
// 위치: 프로젝트 루트의 api/assign-db-sync.js
//
// ⚠️⚠️ 이 파일은 다른 5개 엔드포인트와 **인증 방식이 다르다.** 반드시 읽고 고칠 것.
//   다른 엔드포인트(ai-search·ai-company·summarize-kakao·voice-command·parse-credit)는
//   `denyUnauthorized()` 로 "로그인한 사람"을 검사한다. 이 함수는 **사람이 아니라 기계**
//   (구글 Apps Script)가 부르므로 Supabase JWT 가 없다. 그래서 공유 비밀키로 검사한다.
//   · 비밀키는 Vercel 환경변수 ASSIGN_DB_SYNC_SECRET (구글 Apps Script 에도 같은 값).
//   · 이 키로 할 수 있는 일은 **배정DB 스냅샷 1행 갱신뿐**이다. 키가 새도 그 이상은 못 한다.
//   · 그래서 service_role 키를 구글에 두지 않는다 — 시트 편집 권한자가 스크립트를 열면
//     RLS 를 통째로 우회하는 DB 마스터키를 보게 되기 때문. service_role 은 이 서버에만 있다.
//
// ⚠️ 파일 하나로 완결이어야 한다. api/ 안의 `_` 시작 공유 모듈은 Vercel 이 배포 번들에서
//    빼버려 함수가 아예 못 뜬다(과거 FUNCTION_INVOCATION_FAILED 500). import 를 늘리지 말 것.
//
// 환경변수 2개 필요:
//   ASSIGN_DB_SYNC_SECRET      — Apps Script 와 나눠 갖는 공유 비밀키
//   SUPABASE_SERVICE_ROLE_KEY  — Supabase Settings → API → service_role
const SUPABASE_URL = "https://ujdrjvnihxjvbkezjvwc.supabase.co";
const SNAPSHOT_ID = "default";          // 항상 1행만 쓴다
const MAX_CELLS = 400000;               // 시트 폭주 방어 (지금 시트는 약 2천 칸)

// 상수시간 비교 — 길이는 새지만 43자 랜덤 키에는 의미 없는 정보다.
function safeEqual(a, b) {
  const x = String(a == null ? "" : a);
  const y = String(b == null ? "" : b);
  if (x.length !== y.length) return false;
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x.charCodeAt(i) ^ y.charCodeAt(i);
  return diff === 0;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "POST 요청만 허용됩니다." });
    return;
  }

  const secret = process.env.ASSIGN_DB_SYNC_SECRET;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret || !serviceKey) {
    // 설정 누락을 "인증 실패"로 숨기지 않는다 — 설치할 때 원인을 못 찾으면 더 위험하다.
    res.status(500).json({ error: "서버 설정 누락: ASSIGN_DB_SYNC_SECRET / SUPABASE_SERVICE_ROLE_KEY 를 확인하세요." });
    return;
  }
  if (!safeEqual(req.headers["x-sync-secret"], secret)) {
    res.status(401).json({ error: "인증 실패" });
    return;
  }

  const body = req.body || {};
  const grid = body.grid;
  if (!Array.isArray(grid)) {
    res.status(400).json({ error: "grid 는 2차원 배열이어야 합니다." });
    return;
  }
  // 시트가 통째로 비어 보이는 순간(수식 오류·실수로 전체 삭제 등)에 멀쩡한 스냅샷을
  // 빈 값으로 덮어쓰지 않는다. 시트가 원본이므로 다음 정상 동기화 때 자연히 복구된다.
  if (grid.length === 0) {
    res.status(400).json({ error: "빈 시트는 반영하지 않습니다(기존 스냅샷 보존)." });
    return;
  }
  let cells = 0;
  for (let i = 0; i < grid.length; i++) {
    if (!Array.isArray(grid[i])) {
      res.status(400).json({ error: "grid[" + i + "] 가 배열이 아닙니다." });
      return;
    }
    cells += grid[i].length;
    if (cells > MAX_CELLS) {
      res.status(413).json({ error: "시트가 너무 큽니다 (" + MAX_CELLS + "칸 초과)." });
      return;
    }
  }

  const row = {
    id: SNAPSHOT_ID,
    grid: grid,
    row_count: grid.length,
    sheet_name: typeof body.sheetName === "string" ? body.sheetName.slice(0, 200) : null,
    source: typeof body.source === "string" ? body.source.slice(0, 20) : null,
    synced_at: new Date().toISOString(),
  };

  try {
    // service_role 은 RLS 를 우회한다 → 쓰기 정책이 없는 이 테이블에 유일하게 쓸 수 있는 경로.
    const r = await fetch(SUPABASE_URL + "/rest/v1/assign_db_snapshot?on_conflict=id", {
      method: "POST",
      headers: {
        apikey: serviceKey,
        Authorization: "Bearer " + serviceKey,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify([row]),
    });
    if (!r.ok) {
      const text = await r.text();
      res.status(502).json({ error: "Supabase 저장 실패 (" + r.status + "): " + text.slice(0, 300) });
      return;
    }
    res.status(200).json({ ok: true, rows: grid.length, cells: cells, syncedAt: row.synced_at });
  } catch (e) {
    res.status(503).json({ error: "Supabase 에 연결할 수 없습니다: " + (e && e.message) });
  }
}
