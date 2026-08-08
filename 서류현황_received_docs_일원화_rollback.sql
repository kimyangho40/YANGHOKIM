-- 되돌리기 — 서류현황_received_docs_일원화.sql 실행 전 상태로 복원 (2026-08-08 기준)
--
-- 아래 값은 이관 직전 12개 기업의 received_docs 원본이다.
-- 새 테이블을 만들지 않기 위해(테이블 신설 시 RLS 규칙이 따라붙는다) 값을 그대로 박아 두었다.
--
-- ⚠️ 이관 이후 담당자가 화면에서 서류를 체크했다면 그 변경분도 함께 되돌아간다.
--    이관 직후에만 안전하게 쓸 수 있다.

begin;

update public.companies set received_docs = '' where id = '62bd5c4e-f138-4e84-8aef-5754cff685d6'::uuid;  -- (주)엠씨리컴퍼니
update public.companies set received_docs = '최근 3년치 부가세 증명원 (23년~25년), 사업자 대출 금융거래 확인서' where id = '3fc11c34-0a84-4df9-865f-742bea5f1478'::uuid;  -- 당희스튜디오
update public.companies set received_docs = '' where id = '77d0f04c-5854-4ddb-a1b1-56bd75eefd97'::uuid;  -- 대령숙수_잠수
update public.companies set received_docs = '' where id = '8728a300-e895-48a4-bc0e-9c387b8b40cc'::uuid;  -- 리리즈
update public.companies set received_docs = '사업자등록증, 최근 3년치 부가세 증명원 (23년~25년), 대표자 신용점수, 임대차 계약서, 대표자 신분증, 사업자 대출 금융거래 확인서, 최근 3년치 재무제표 (23년~25년), 직전연도 상시근로자 수 파악' where id = 'b4487d54-cd44-4c85-b98f-b2dfa83005fa'::uuid;  -- 맥스틸우드
update public.companies set received_docs = '' where id = 'cee54ae5-807f-4d2f-9fc2-d43eacf807ee'::uuid;  -- 미진축산
update public.companies set received_docs = '' where id = '10fba667-ccc9-4535-927f-5fc1bb2193e9'::uuid;  -- 수목원파크
update public.companies set received_docs = '' where id = '353c67a6-a84c-4f4e-a6ca-e3883a58102c'::uuid;  -- 엠앤디코리아_잠수
update public.companies set received_docs = '' where id = '94f93d80-e937-4c7b-9664-09ed56fff49e'::uuid;  -- 오이구컴퍼니
update public.companies set received_docs = '' where id = '68305480-3eca-4b65-8375-1d3a6a7da953'::uuid;  -- 찡어맨
update public.companies set received_docs = '사업자등록증, 최근 3년치 재무제표 (23년~25년), 최근 3년치 부가세 증명원 (23년~25년), 대표자 신용점수, 사업자 대출 금융거래 확인서, 대표자 신분증, 임대차 계약서, 회사 소개서 또는 사업계획서' where id = 'd6a34947-af74-4d78-a48c-43f011e88989'::uuid;  -- 헤움
update public.companies set received_docs = '' where id = 'b328d2de-34c1-4821-b1a2-8e12e1faa641'::uuid;  -- 희성디자인

commit;
