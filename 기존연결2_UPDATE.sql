-- [기존연결 2차] 동일업체(표기/오타/꼬리표 차이) → 기존 companies.name 으로 정합화
-- 오탐·지점·애매 항목은 제외(신규등록 CSV에 flag). 이전 제외 3건(글라스/비티버거)도 제외.
BEGIN;
UPDATE agency_cases SET business_name = '(주)백발명가' WHERE business_name = '(주)백발명가(스마트기기 요건 확인안됨)' AND deleted_at IS NULL;  -- 1건
UPDATE agency_cases SET business_name = '(주)베누스메드' WHERE business_name = '(주)베누스메드(최종제출 안내드림)' AND deleted_at IS NULL;  -- 1건
UPDATE agency_cases SET business_name = '(주)썸업팜' WHERE business_name = '(주)썸업팜  ( 주소지 변경 후 신청 )' AND deleted_at IS NULL;  -- 1건
UPDATE agency_cases SET business_name = '(주)이루미기획' WHERE business_name = '(주)이루미기획(혁신성장 스마트기기)' AND deleted_at IS NULL;  -- 1건
UPDATE agency_cases SET business_name = '(주)태양로지스틱스' WHERE business_name = '(주)태양로지스틱스(전진통운)' AND deleted_at IS NULL;  -- 1건
UPDATE agency_cases SET business_name = '(주)포스트케어' WHERE business_name = '(주)포스트케어(혁신성장 수출실적)' AND deleted_at IS NULL;  -- 1건
UPDATE agency_cases SET business_name = '(주)해온푸드' WHERE business_name = '(주)해온푸드(재무자료 요청X)' AND deleted_at IS NULL;  -- 1건
UPDATE agency_cases SET business_name = '(주)우정에프앤비' WHERE business_name = '(주)우정에프엔비' AND deleted_at IS NULL;  -- 1건
UPDATE agency_cases SET business_name = '샤인디엔피' WHERE business_name = '샤인디앤피' AND deleted_at IS NULL;  -- 1건
UPDATE agency_cases SET business_name = '샤인디엔피' WHERE business_name = '샤인디앤피 (장애인기업확인서 있음)' AND deleted_at IS NULL;  -- 1건
UPDATE agency_cases SET business_name = '스튜디오오도씨' WHERE business_name = '스투디오오도씨' AND deleted_at IS NULL;  -- 1건
UPDATE agency_cases SET business_name = '스튜디오오도씨' WHERE business_name = '스투디오오도씨 ( 채무조정 29이상 불가 )' AND deleted_at IS NULL;  -- 1건
UPDATE agency_cases SET business_name = '스튜디오오도씨' WHERE business_name = '스투디오오도씨(혁신성장 스마트기기)' AND deleted_at IS NULL;  -- 1건
UPDATE agency_cases SET business_name = '프로페나이어클락' WHERE business_name = '프로페나인어클락' AND deleted_at IS NULL;  -- 1건
UPDATE agency_cases SET business_name = '(주)더스티치 _법인' WHERE business_name = '(주)더스티치 (체납처리 확인 )' AND deleted_at IS NULL;  -- 2건
UPDATE agency_cases SET business_name = '(주)CBSC_법인' WHERE business_name = '(주)CBSC' AND deleted_at IS NULL;  -- 1건
UPDATE agency_cases SET business_name = 'CU수서나선점' WHERE business_name = '씨유 수서나선점' AND deleted_at IS NULL;  -- 1건
UPDATE agency_cases SET business_name = '엑스비씨 유한회사_법인' WHERE business_name = '엑스비씨 유한회사' AND deleted_at IS NULL;  -- 2건
UPDATE agency_cases SET business_name = '엠앤디코리아_잠수' WHERE business_name = '엠앤디코리아' AND deleted_at IS NULL;  -- 1건
UPDATE agency_cases SET business_name = '이안서가중고등학원' WHERE business_name = '이안서가중고등 ( 법인 사업자 )' AND deleted_at IS NULL;  -- 1건
UPDATE agency_cases SET business_name = '(주)제천한약영농조합법인' WHERE business_name = '제천한약영농조합' AND deleted_at IS NULL;  -- 1건
UPDATE agency_cases SET business_name = '(주)CBSC_법인' WHERE business_name = '주)cbsc / 교육 이수 후 접수 완료' AND deleted_at IS NULL;  -- 1건
UPDATE agency_cases SET business_name = '(주)에이치제이에프1, 봉이밥' WHERE business_name = '(주)에이치제이에프1 _법인' AND deleted_at IS NULL;  -- 2건
UPDATE agency_cases SET business_name = '(주)에이치제이에프1, 봉이밥' WHERE business_name = '에이치제이에프1(주)' AND deleted_at IS NULL;  -- 1건
UPDATE agency_cases SET business_name = '(주)잔나비에프앤비 ( 화정미트 )' WHERE business_name = '(주)잔나비에프앤비' AND deleted_at IS NULL;  -- 2건
UPDATE agency_cases SET business_name = '유일목형' WHERE business_name = '4/20 유일목형 N844( 신용점수 초과로 신청못함 )' AND deleted_at IS NULL;  -- 1건
UPDATE agency_cases SET business_name = '도담조경(산들바람)' WHERE business_name = '도담조경 ( 체납 (가압류 ) )' AND deleted_at IS NULL;  -- 1건
UPDATE agency_cases SET business_name = '딜리온픽배달대행' WHERE business_name = '딜리온픽' AND deleted_at IS NULL;  -- 1건
UPDATE agency_cases SET business_name = '(주)백발명가' WHERE business_name = '백발명가 법인 카페' AND deleted_at IS NULL;  -- 1건
UPDATE agency_cases SET business_name = '유일목형' WHERE business_name = '유일목형 N844(수출로 안되면 저신용)(3/5국세/지방세체납없음)' AND deleted_at IS NULL;  -- 1건
COMMIT;
