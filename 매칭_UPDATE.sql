-- ============================================================
-- agency_cases.business_name → companies.name 정합화 UPDATE
-- 생성: 조회 기반 자동 생성 (실행 전 검토 필요)
-- 대상 DB: Supabase (Postgres) / 소프트삭제 제외(deleted_at IS NULL)
-- 트랜잭션으로 감쌈. 문제 시 ROLLBACK, 정상 시 COMMIT.
-- ============================================================
BEGIN;

-- [공감중문] 공백 없는 '공감중문'으로 통일 (companies 이름 트림 + agency_cases 메모/공백 제거)
--   companies: '공감중문  '(끝 공백2) → '공감중문'
UPDATE companies   SET name = '공감중문'          WHERE name = '공감중문  ' AND deleted_at IS NULL;
--   agency_cases: '공감중문'으로 시작하는 모든 변형(공백/메모) → '공감중문' (이미 '공감중문'인 것 제외)
UPDATE agency_cases SET business_name = '공감중문' WHERE business_name LIKE '공감중문%' AND business_name <> '공감중문' AND deleted_at IS NULL;

-- ---- [A] 자동연결: 법인표기/(주)/공백 차이만 (24건) ----
UPDATE agency_cases SET business_name = '(주)거산피앤피' WHERE business_name = '거산피앤피(주)' AND deleted_at IS NULL;  -- 1건
UPDATE agency_cases SET business_name = '(주)글라스히어로즈' WHERE business_name = '글라스히어로즈(주)' AND deleted_at IS NULL;  -- 3건
UPDATE agency_cases SET business_name = '대령숙수_잠수' WHERE business_name = '대령숙수(잠수)' AND deleted_at IS NULL;  -- 1건
UPDATE agency_cases SET business_name = '(주)블루마린' WHERE business_name = '블루마린(주)' AND deleted_at IS NULL;  -- 2건
UPDATE agency_cases SET business_name = '세인트복싱_수지점' WHERE business_name = '세인트복싱 수지점' AND deleted_at IS NULL;  -- 1건
UPDATE agency_cases SET business_name = '(주)솜씨협동조합' WHERE business_name = '솜씨협동조합' AND deleted_at IS NULL;  -- 3건
UPDATE agency_cases SET business_name = '신강' WHERE business_name = '신강 ' AND deleted_at IS NULL;  -- 1건
UPDATE agency_cases SET business_name = '(주)썸업팜' WHERE business_name = '썸업팜' AND deleted_at IS NULL;  -- 1건
UPDATE agency_cases SET business_name = '엠앤디코리아_잠수' WHERE business_name = '엠앤디코리아(잠수)' AND deleted_at IS NULL;  -- 2건
UPDATE agency_cases SET business_name = '옥이네술상' WHERE business_name = '옥이네 술상' AND deleted_at IS NULL;  -- 1건
UPDATE agency_cases SET business_name = '(주)웰딧' WHERE business_name = '웰딧' AND deleted_at IS NULL;  -- 2건
UPDATE agency_cases SET business_name = '(주)위드컴퍼니' WHERE business_name = '위드컴퍼니(주)' AND deleted_at IS NULL;  -- 1건
UPDATE agency_cases SET business_name = '(주)이산더큐브' WHERE business_name = '이산더큐브주식회사' AND deleted_at IS NULL;  -- 3건
UPDATE agency_cases SET business_name = '큰수레협동조합' WHERE business_name = '주)큰수레협동조합' AND deleted_at IS NULL;  -- 2건
UPDATE agency_cases SET business_name = '(주)신원' WHERE business_name = '주식회사 신원' AND deleted_at IS NULL;  -- 2건
UPDATE agency_cases SET business_name = '타이어프로' WHERE business_name = '타이어프로 -' AND deleted_at IS NULL;  -- 3건
UPDATE agency_cases SET business_name = '토탈아트 코리아' WHERE business_name = '토탈아트코리아' AND deleted_at IS NULL;  -- 2건
UPDATE agency_cases SET business_name = '플로리스트 파크학원' WHERE business_name = '플로리스트파크 학원' AND deleted_at IS NULL;  -- 1건
UPDATE agency_cases SET business_name = '(주)피코스산업' WHERE business_name = '피코스산업(주)' AND deleted_at IS NULL;  -- 2건
UPDATE agency_cases SET business_name = '(주)한국가스켓' WHERE business_name = '한국가스켓' AND deleted_at IS NULL;  -- 1건
UPDATE agency_cases SET business_name = '(주)허브바이오앤테크' WHERE business_name = '허브바이오앤테크' AND deleted_at IS NULL;  -- 2건
UPDATE agency_cases SET business_name = '(주)허브바이오앤테크' WHERE business_name = '허브바이오앤테크(주)' AND deleted_at IS NULL;  -- 3건
UPDATE agency_cases SET business_name = '(주)호산이엔티' WHERE business_name = '호산이엔티' AND deleted_at IS NULL;  -- 1건
UPDATE agency_cases SET business_name = '(유)JB특수시스템' WHERE business_name = 'jb특수시스템' AND deleted_at IS NULL;  -- 2건

-- ---- [B] 꼬리표(상태메모) 제거 매칭 (61건, 제외 3건 반영) ----
UPDATE agency_cases SET business_name = '(주)그린준' WHERE business_name = '(주)그린준_법인' AND deleted_at IS NULL;  -- 4건
UPDATE agency_cases SET business_name = '(주)글라스히어로즈' WHERE business_name = '(주)글라스히어로즈_유선' AND deleted_at IS NULL;  -- 1건
UPDATE agency_cases SET business_name = '(주)더푸른식품' WHERE business_name = '(주)더푸른식품_(보내준다고하심)' AND deleted_at IS NULL;  -- 1건
UPDATE agency_cases SET business_name = '(주)마블링축산' WHERE business_name = '(주)마블링축산_법인' AND deleted_at IS NULL;  -- 3건
UPDATE agency_cases SET business_name = '(주)에스엔정보시스템' WHERE business_name = '(주)에스엔정보시스템_인증 부분만 유선' AND deleted_at IS NULL;  -- 2건
UPDATE agency_cases SET business_name = '(주)웰딧' WHERE business_name = '(주)웰딧_인증서 없음' AND deleted_at IS NULL;  -- 2건
UPDATE agency_cases SET business_name = '(주)유건' WHERE business_name = '(주)유건 / 교육 이수 후 접수 완료' AND deleted_at IS NULL;  -- 1건
UPDATE agency_cases SET business_name = '(주)유건' WHERE business_name = '(주)유건_법인' AND deleted_at IS NULL;  -- 2건
UPDATE agency_cases SET business_name = '(주)입체로' WHERE business_name = '(주)입체로_2억 5천' AND deleted_at IS NULL;  -- 1건
UPDATE agency_cases SET business_name = '(주)칸린' WHERE business_name = '(주)칸린_법인' AND deleted_at IS NULL;  -- 4건
UPDATE agency_cases SET business_name = '(주)텍코' WHERE business_name = '(주)텍코_유선_2억 5천' AND deleted_at IS NULL;  -- 1건
UPDATE agency_cases SET business_name = '(주)거산피앤피' WHERE business_name = '거산피앤피(주)_요건 넘어서 안됨' AND deleted_at IS NULL;  -- 1건
UPDATE agency_cases SET business_name = '구도로통닭' WHERE business_name = '구도로통닭(소진공 단기연체존재 )' AND deleted_at IS NULL;  -- 1건
UPDATE agency_cases SET business_name = '구도로통닭' WHERE business_name = '구도로통닭(혁신성장 스마트기기)' AND deleted_at IS NULL;  -- 1건
UPDATE agency_cases SET business_name = '동선목장' WHERE business_name = '동선목장_잠수' AND deleted_at IS NULL;  -- 1건
UPDATE agency_cases SET business_name = '등짝' WHERE business_name = '등짝_김양호' AND deleted_at IS NULL;  -- 1건
UPDATE agency_cases SET business_name = '딜리온픽배달대행' WHERE business_name = '딜리온픽배달대행(혁신성장 스마트기술)' AND deleted_at IS NULL;  -- 1건
UPDATE agency_cases SET business_name = '리리즈' WHERE business_name = '리리즈(소진공 연체없음 )' AND deleted_at IS NULL;  -- 1건
UPDATE agency_cases SET business_name = '리리즈' WHERE business_name = '리리즈(재도전 특별자금)' AND deleted_at IS NULL;  -- 1건
UPDATE agency_cases SET business_name = '명성태권도' WHERE business_name = '명성태권도(2/27지방세/국세체납없음)/ 재도전 업력초과' AND deleted_at IS NULL;  -- 1건
UPDATE agency_cases SET business_name = '명성태권도' WHERE business_name = '명성태권도(혁신성장 스마트기기)' AND deleted_at IS NULL;  -- 1건
UPDATE agency_cases SET business_name = '물고기블루스' WHERE business_name = '물고기블루스(체납)' AND deleted_at IS NULL;  -- 1건
UPDATE agency_cases SET business_name = '미진축산' WHERE business_name = '미진축산(소진공 연체없음 )' AND deleted_at IS NULL;  -- 1건
UPDATE agency_cases SET business_name = '미진축산' WHERE business_name = '미진축산(혁신성장 스마트기기)' AND deleted_at IS NULL;  -- 2건
UPDATE agency_cases SET business_name = '세인트복싱' WHERE business_name = '세인트복싱_얼굴인식시스템' AND deleted_at IS NULL;  -- 2건
UPDATE agency_cases SET business_name = '세인트복싱' WHERE business_name = '세인트복싱(혁신성장, 스마트기기)(체납)' AND deleted_at IS NULL;  -- 1건
UPDATE agency_cases SET business_name = '(주)솜씨협동조합' WHERE business_name = '솜씨협동조합_공고링크 받아야함' AND deleted_at IS NULL;  -- 1건
UPDATE agency_cases SET business_name = '(주)솜씨협동조합' WHERE business_name = '솜씨협동조합_법인' AND deleted_at IS NULL;  -- 3건
UPDATE agency_cases SET business_name = '수목원파크' WHERE business_name = '수목원파크 ( 지들이 하겠다고 통보 )' AND deleted_at IS NULL;  -- 1건
UPDATE agency_cases SET business_name = '스마일 베이글' WHERE business_name = '스마일 베이글 ( 신규 이력없음 )' AND deleted_at IS NULL;  -- 1건
UPDATE agency_cases SET business_name = '스마일 베이글' WHERE business_name = '스마일 베이글(혁신성장 스마트기기)' AND deleted_at IS NULL;  -- 1건
UPDATE agency_cases SET business_name = '신강' WHERE business_name = '신강( 전체자료 미회신 )' AND deleted_at IS NULL;  -- 1건
UPDATE agency_cases SET business_name = '신강' WHERE business_name = '신강(잠수)' AND deleted_at IS NULL;  -- 1건
UPDATE agency_cases SET business_name = '어나더유스' WHERE business_name = '어나더유스( 소진공 연체없음 )' AND deleted_at IS NULL;  -- 1건
UPDATE agency_cases SET business_name = '어나더유스' WHERE business_name = '어나더유스(2/27지방세/국세 체납없음 )' AND deleted_at IS NULL;  -- 1건
UPDATE agency_cases SET business_name = '어나더유스' WHERE business_name = '어나더유스(혁신성장 수출실적)' AND deleted_at IS NULL;  -- 1건
UPDATE agency_cases SET business_name = '에스에프헤어' WHERE business_name = '에스에프헤어 _스마트모델 기술보급 ( 스마트미러, 키오스크 )' AND deleted_at IS NULL;  -- 1건
UPDATE agency_cases SET business_name = '에스에프헤어' WHERE business_name = '에스에프헤어 (재도전 임대사업자 및 업력때문에 안됌)' AND deleted_at IS NULL;  -- 1건
UPDATE agency_cases SET business_name = '에스에프헤어' WHERE business_name = '에스에프헤어(혁신성장 스마트기기)' AND deleted_at IS NULL;  -- 1건
UPDATE agency_cases SET business_name = '엘포테크' WHERE business_name = '엘포테크/ 재도전 도약, 혁신 졸업후보 안됌' AND deleted_at IS NULL;  -- 1건
UPDATE agency_cases SET business_name = '영진물류' WHERE business_name = '영진물류(대환대출 진행)' AND deleted_at IS NULL;  -- 2건
UPDATE agency_cases SET business_name = '오이구컴퍼니' WHERE business_name = '오이구컴퍼니 ( 신규 이력없음 )' AND deleted_at IS NULL;  -- 1건
UPDATE agency_cases SET business_name = '오이구컴퍼니' WHERE business_name = '오이구컴퍼니 ( 정책자금보다 정부지원금 요구ㅠ )' AND deleted_at IS NULL;  -- 1건
UPDATE agency_cases SET business_name = '오이구컴퍼니' WHERE business_name = '오이구컴퍼니(3/5국세체납없음,과태료3건 체납, 1건 미납)' AND deleted_at IS NULL;  -- 1건
UPDATE agency_cases SET business_name = '오케이포케' WHERE business_name = '오케이포케 ( 신규 이력없음 )' AND deleted_at IS NULL;  -- 1건
UPDATE agency_cases SET business_name = '오케이포케' WHERE business_name = '오케이포케(혁신성장 스마트기기)(체납)' AND deleted_at IS NULL;  -- 1건
UPDATE agency_cases SET business_name = '유일목형' WHERE business_name = '유일목형 ( 수출로 이후 안되면 저신용 )' AND deleted_at IS NULL;  -- 2건
UPDATE agency_cases SET business_name = '의왕베이스볼아카데미' WHERE business_name = '의왕베이스볼아카데미(체납)' AND deleted_at IS NULL;  -- 1건
UPDATE agency_cases SET business_name = '이엔에프에너지' WHERE business_name = '이엔에프에너지(재도전특별자금)' AND deleted_at IS NULL;  -- 1건
UPDATE agency_cases SET business_name = '제로디톡스' WHERE business_name = '제로디톡스(소진공 저신용)' AND deleted_at IS NULL;  -- 1건
UPDATE agency_cases SET business_name = '제로디톡스' WHERE business_name = '제로디톡스(재도전 70백만원이 있어 3월 신청 예정)' AND deleted_at IS NULL;  -- 2건
UPDATE agency_cases SET business_name = '찡어맨' WHERE business_name = '찡어맨 ( 재도전 상환연장은 다음달에 진횅 )' AND deleted_at IS NULL;  -- 1건
UPDATE agency_cases SET business_name = '찡어맨' WHERE business_name = '찡어맨(지방세 체납 )' AND deleted_at IS NULL;  -- 1건
UPDATE agency_cases SET business_name = '천하종합상사' WHERE business_name = '천하종합상사 / 교육 이수 후 접수 완료' AND deleted_at IS NULL;  -- 1건
UPDATE agency_cases SET business_name = '천하종합상사' WHERE business_name = '천하종합상사(체납)' AND deleted_at IS NULL;  -- 1건
UPDATE agency_cases SET business_name = '청풍발리호텔' WHERE business_name = '청풍발리호텔(키오스크 계약서 요청, 설치후 철수 인정서밖에 없음)' AND deleted_at IS NULL;  -- 1건
UPDATE agency_cases SET business_name = '풍짬' WHERE business_name = '풍짬 (2월 스마트 기기)' AND deleted_at IS NULL;  -- 1건
UPDATE agency_cases SET business_name = '피치플레이' WHERE business_name = '피치플레이(소진공 신청이력없음 )' AND deleted_at IS NULL;  -- 1건
UPDATE agency_cases SET business_name = '피치플레이' WHERE business_name = '피치플레이(혁신성장 스마트기술)' AND deleted_at IS NULL;  -- 1건
UPDATE agency_cases SET business_name = '헤움' WHERE business_name = '헤움 ( 5년에 3번이상 수혜(저신용포함)' AND deleted_at IS NULL;  -- 2건
UPDATE agency_cases SET business_name = '(유)JB특수시스템' WHERE business_name = 'jb특수시스템(소진공 저신용)' AND deleted_at IS NULL;  -- 1건

-- 검증: 아래 SELECT가 0이면 미매칭 없음 (COMMIT 전 확인 권장)
-- SELECT count(*) FROM agency_cases ac WHERE ac.deleted_at IS NULL
--   AND NOT EXISTS (SELECT 1 FROM companies c WHERE c.name = ac.business_name AND c.deleted_at IS NULL);

COMMIT;
