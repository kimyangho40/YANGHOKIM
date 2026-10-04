-- 업무요청 완료상태 과거분 1회 보정
-- 생성: scripts/backfill-request-status.mjs (2026-10-04T04:01:26.462Z) · 17건
-- 판정: App.js ⛳ 업무요청-동기화 planRequestBackfill (받는 사람 노트의 📩 줄 체크 상태 → work_requests)
-- 가드: 각 UPDATE 는 옛 상태일 때만 바뀐다. 그 사이 사람이 바꾼 행은 건너뛴다.
begin;
update public.work_requests set status = 'done', done_at = null where id = '7217a1c5-02c5-4383-8338-0cdd0931b5e5' and status = 'read';
update public.work_requests set status = 'done', done_at = null where id = 'bb1b4fd2-7023-48b3-a14e-22cb705d2420' and status = 'read';
update public.work_requests set status = 'done', done_at = null where id = 'daf41141-153b-4417-8ec3-068cbd715fbc' and status = 'read';
update public.work_requests set status = 'done', done_at = null where id = 'f48b40f1-f3de-423d-8497-cd61e5616c4f' and status = 'read';
update public.work_requests set status = 'done', done_at = null where id = '1b37a039-abf1-4821-b4f6-30a44ffe1c02' and status = 'read';
update public.work_requests set status = 'done', done_at = null where id = '083d6d39-200a-40ef-952a-389859685035' and status = 'read';
update public.work_requests set status = 'done', done_at = null where id = '3a7c3519-9d9c-4e46-86f0-a57c4f8d3e40' and status = 'read';
update public.work_requests set status = 'done', done_at = null where id = 'ad796d7d-dd51-4cd0-8da9-dbe7b6ca2df5' and status = 'read';
update public.work_requests set status = 'done', done_at = null where id = '8b56637a-213b-475b-ba41-d7b246da94af' and status = 'read';
update public.work_requests set status = 'done', done_at = null where id = '9ce7a2b3-e09f-411c-9f9f-3c90af4a814f' and status = 'read';
update public.work_requests set status = 'done', done_at = null where id = 'dad80ce9-f7f8-481a-936f-3bd296f0f2ba' and status = 'read';
update public.work_requests set status = 'done', done_at = null where id = '899b6bf9-7715-4b09-864a-2ecfd7e4e97b' and status = 'read';
update public.work_requests set status = 'done', done_at = null where id = '9eca8ac1-cf46-4df6-ae7b-a0b1902fb4b0' and status = 'read';
update public.work_requests set status = 'done', done_at = null where id = '57110fda-d536-4b05-b75b-9a91afb824c0' and status = 'read';
update public.work_requests set status = 'done', done_at = null where id = 'f564e26f-94a3-49fa-8c6b-b34e542c9965' and status = 'read';
update public.work_requests set status = 'done', done_at = null where id = '846c9de1-a161-41db-bdbd-91ca5481c573' and status = 'read';
update public.work_requests set status = 'done', done_at = null where id = '6c9880af-7f3f-4f75-b48f-344da9c512b5' and status = 'read';
commit;

-- 검증은 이 파일의 SELECT 가 아니라 별도 조회로 한다(CLAUDE.md 2-2).
