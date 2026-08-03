-- 팀 업무 공간 "+ 새 업무"에 업무 날짜 추가 — team_notes.work_date 컬럼
--
-- 배경: 개인 업무노트(work_notes)는 note_date 로 "이 업무가 언제 것인지"를 갖는데,
--       팀 업무(team_notes)에는 due_date(마감일)뿐이라 같은 개념이 없었다.
--       화면에서 날짜를 고르면 제목이 "O월O일 업무"로 자동 채워지는 UX를 붙이기 위해 추가.
--
-- ⚠️ 이름 주의: 이미 있는 것들과 의미가 다르다. 절대 섞지 말 것.
--    · due_date   = 마감일 (기존, 유지)
--    · taken_at   = 누가 가져간 시각 (기존, 유지)
--    · work_notes.note_date = 개인 노트의 날짜 (다른 테이블)
--    · work_date  = ★이번 추가★ 팀 업무 자체의 업무 날짜
--    프런트의 takePickDate(가져가기 팝업에서 고르는 "내 노트로 담을 날짜")와도 무관하다.
--
-- RLS: team_notes 는 이미 RLS 활성 + p_team_notes_all(is_approved()) 정책이 걸려 있고
--      anon GRANT 도 회수된 상태다. 컬럼 추가는 기존 정책을 그대로 상속하므로
--      새 정책·회수가 필요 없다. (아래 검증 쿼리로 확인)

alter table public.team_notes
  add column if not exists work_date date;

comment on column public.team_notes.work_date is
  '팀 업무의 업무 날짜(YYYY-MM-DD). 마감일(due_date)과 다름. 비어 있어도 됨 — 기존 행은 NULL.';

-- 기존 행은 NULL로 둔다(백필하지 않음).
--   created_at 으로 백필하면 "등록일"과 "업무 날짜"가 뒤섞여, 나중에 날짜로 거를 때
--   실제로 지정한 적 없는 값이 지정된 것처럼 보인다. 미지정은 미지정으로 남긴다.

-- 검증 — 컬럼이 생겼는지
select column_name, data_type, is_nullable
  from information_schema.columns
 where table_schema = 'public'
   and table_name = 'team_notes'
   and column_name = 'work_date';
