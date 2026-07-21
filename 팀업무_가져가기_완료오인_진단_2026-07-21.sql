-- 팀 업무 "가져가기"가 완료로 오인되던 버그 — 진단/복구 확인 SQL
-- 날짜: 2026-07-21
--
-- [원인] 코드(App.js)의 표시 로직이 team_notes.status "taken"(가져감=진행중)을
--        "done"(완료)과 동일하게 취급해서, 가져가기만 해도 목록에서 숨겨지고
--        "완료된 업무 N건"에 집계되었음. (DB에는 잘못 쓰인 값이 없음)
--
-- [중요] 가져가기(takeToMyNote)는 처음부터 항상 status='taken'만 기록했고,
--        status='done'은 오직 "✅ 완료처리" 버튼(markDone)에서만 기록됨.
--        => DB 데이터 손상 없음. 코드 표시 수정만으로 진행중 업무가 자동 복구됨.
--        => 아래는 "복구가 필요한 손상 데이터가 없음"을 눈으로 확인하는 검증용 쿼리.

-- 1) 상태별 현황 확인 (taken 건들이 그대로 살아있는지 = 진행중으로 잘 복구되는지)
SELECT status, COUNT(*) AS cnt
FROM team_notes
WHERE deleted_at IS NULL
GROUP BY status
ORDER BY status;

-- 2) 진행중(taken) 업무 목록 — 이 건들이 이제 화면에 "🔵 진행중"으로 다시 보임
SELECT id, team, title, status, taken_by, taken_at, taken_work_note_id, created_at
FROM team_notes
WHERE deleted_at IS NULL AND status = 'taken'
ORDER BY taken_at DESC NULLS LAST;

-- 3) 완료(done) 업무 목록 — 실제로 "완료처리" 버튼을 눌러 완료된 건만 있어야 정상.
--    혹시 taken_by는 있는데 완료처리한 기억이 없는 항목이 보이면 아래 4)로 되돌릴 수 있음.
SELECT id, team, title, status, taken_by, taken_at, created_at
FROM team_notes
WHERE deleted_at IS NULL AND status = 'done'
ORDER BY created_at DESC;

-- 4) (선택) 특정 done 업무를 다시 진행중(taken)으로 되돌리기 — 담당자 확인 후 개별 실행
--    ※ 무분별한 일괄 실행 금지. 실제로 완료 안 한 게 확실한 id만 지정.
-- UPDATE team_notes
--   SET status = 'taken'
--   WHERE id = '<되돌릴_team_note_id>' AND status = 'done';
