/**
 * 배정DB_김동일 이사님 → CRM 자동 동기화
 * ────────────────────────────────────────────────────────────────────────
 * 이 스크립트는 CRM 저장소에 참고용으로만 들어 있습니다. 실제로는 구글시트 안에서 돕니다.
 *
 * 설치 방법 (한 번만)
 *   1. 시트 열기 → 상단 메뉴 [확장 프로그램] → [Apps Script]
 *   2. 기존 내용을 모두 지우고 이 파일 전체를 붙여넣기
 *   3. 아래 SYNC_SECRET 에 전달받은 비밀키를 붙여넣기
 *   4. 상단 함수 목록에서 setupAssignDbSync 를 고르고 [실행]
 *      → 구글 권한 승인 팝업이 한 번 뜹니다. "고급" → "안전하지 않은 페이지로 이동" → 허용
 *        (내가 만든 스크립트라 구글이 확인되지 않았다고 경고하는 것이 정상입니다)
 *   5. "설치 완료" 알림이 뜨면 끝. 이후 시트를 고치면 CRM에 자동 반영됩니다.
 *
 * 잘 되는지 확인: testAssignDbSync 실행 → [실행 로그]에 "성공 — N행 전송"
 * 되돌리기:       removeAssignDbSync 실행 (트리거 전부 제거)
 * ────────────────────────────────────────────────────────────────────────
 */

// ⚙️ 설정 ─────────────────────────────────────────────────────────────────
var CRM_ENDPOINT = "https://crm-beta-snowy.vercel.app/api/assign-db-sync";
var SYNC_SECRET  = "여기에_비밀키_붙여넣기";   // ← Vercel 환경변수 ASSIGN_DB_SYNC_SECRET 과 같은 값
var SHEET_NAME   = "";                          // 비워두면 첫 번째 탭. 특정 탭만 보내려면 탭 이름을 적으세요.
var TIMER_MINUTES = 10;                         // 안전망 주기(분) — 트리거가 놓친 변경을 따라잡습니다.

// ── 설치 / 제거 ───────────────────────────────────────────────────────────
function setupAssignDbSync() {
  if (SYNC_SECRET === "여기에_비밀키_붙여넣기") {
    throw new Error("SYNC_SECRET 을 먼저 붙여넣어 주세요 (파일 위쪽 설정 부분).");
  }
  removeAssignDbSync_();                          // 중복 설치 방지
  var ss = SpreadsheetApp.getActive();
  ScriptApp.newTrigger("onAssignDbChange").forSpreadsheet(ss).onChange().create();   // 즉시 반영
  ScriptApp.newTrigger("onAssignDbTimer").timeBased().everyMinutes(TIMER_MINUTES).create(); // 안전망
  var msg = syncAssignDb("manual");
  Logger.log(msg);
  try {
    SpreadsheetApp.getUi().alert(
      "설치 완료\n\n" + msg +
      "\n\n이제 시트를 수정하면 CRM 배정DB 화면에 자동으로 반영됩니다." +
      "\n(" + TIMER_MINUTES + "분마다 한 번 더 확인합니다)"
    );
  } catch (e) { /* 편집기에서 직접 실행하면 UI 가 없을 수 있다 — 로그로 충분 */ }
}

function removeAssignDbSync() { removeAssignDbSync_(); Logger.log("트리거를 모두 제거했습니다."); }

function removeAssignDbSync_() {
  var all = ScriptApp.getProjectTriggers();
  for (var i = 0; i < all.length; i++) {
    var fn = all[i].getHandlerFunction();
    if (fn === "onAssignDbChange" || fn === "onAssignDbTimer") ScriptApp.deleteTrigger(all[i]);
  }
}

// ── 트리거 진입점 ─────────────────────────────────────────────────────────
function onAssignDbChange(e) { syncAssignDb("change"); }
function onAssignDbTimer()   { syncAssignDb("timer"); }
function testAssignDbSync()  { Logger.log(syncAssignDb("manual")); }

// ── 본체 ──────────────────────────────────────────────────────────────────
// 시트를 화면에 보이는 문자열 그대로(getDisplayValues) 읽어 통째로 보낸다.
// ⚠️ 여기서 헤더를 찾거나 컬럼을 가공하지 않는다. 그건 CRM 쪽 buildAssignDbTable() 담당이다.
//    양쪽에서 가공하면 규칙이 갈라져 "시트를 고쳐도 CRM 은 안 고친다"가 깨진다.
function syncAssignDb(source) {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) return "다른 동기화가 진행 중이라 건너뜀";
  try {
    var ss = SpreadsheetApp.getActive();
    var sh = SHEET_NAME ? ss.getSheetByName(SHEET_NAME) : ss.getSheets()[0];
    if (!sh) throw new Error("시트를 찾을 수 없습니다: " + SHEET_NAME);
    var grid = sh.getDataRange().getDisplayValues();
    if (!grid || !grid.length) return "시트가 비어 있어 전송하지 않음";

    var props = PropertiesService.getScriptProperties();
    // 내용이 그대로면 보내지 않는다 — 안전망 타이머가 10분마다 돌아도 헛일을 안 하게.
    var fingerprint = md5_(JSON.stringify({ grid: grid, sheetName: sh.getName() }));
    if (source !== "manual" && props.getProperty("lastHash") === fingerprint) return "변경 없음 — 전송 생략";

    var res = UrlFetchApp.fetch(CRM_ENDPOINT, {
      method: "post",
      contentType: "application/json",
      headers: { "x-sync-secret": SYNC_SECRET },
      payload: JSON.stringify({ grid: grid, sheetName: sh.getName(), source: source || "manual" }),
      muteHttpExceptions: true,
    });
    var code = res.getResponseCode(), body = res.getContentText();
    if (code === 200) {
      props.setProperty("lastHash", fingerprint);
      props.setProperty("lastSyncAt", new Date().toISOString());
      props.deleteProperty("lastError");
      return "성공 — " + grid.length + "행 전송";
    }
    props.setProperty("lastError", new Date().toISOString() + " · " + code + " " + body);
    throw new Error("전송 실패 " + code + ": " + body);
  } finally {
    lock.releaseLock();
  }
}

function md5_(s) {
  var b = Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, s, Utilities.Charset.UTF_8);
  var out = "";
  for (var i = 0; i < b.length; i++) {
    var v = (b[i] + 256) % 256;
    out += (v < 16 ? "0" : "") + v.toString(16);
  }
  return out;
}
