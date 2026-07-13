-- [연결_확실+티와이3133] 기존 회사 company_id 연결 (실행 기록)
-- 제외(수동판단): 비티버거앤타코(희성디자인), 글라스히어로즈(인천점), 달성종합중기, 신안, 신재연
-- 대상: 54개 업체 / 88건
BEGIN;

-- 막퍼줘 회찜 → [막퍼줘 회찜  / *별세] (7건)
UPDATE agency_cases SET company_id = '830ee7ff-76d5-4709-a559-be565eb3e41e'
 WHERE deleted_at IS NULL AND company_id IS NULL
   AND business_name IN ('막퍼줘 회찜 ( 준푸드 대표님 개인 사업자 )', '막퍼줘 회찜');

-- 스마일베이글 ( 법인설립후 ) → [스마일 베이글] (5건)
UPDATE agency_cases SET company_id = '8f0a354c-f2e3-4281-813e-8ff8feffce29'
 WHERE deleted_at IS NULL AND company_id IS NULL
   AND business_name IN ('스마일베이글 ( 법인설립후 )', '스마일 베이글 ( 법인 사업자 )', '스마일 베이글 ( 법인 사업자 ) 5월');

-- 보성무역 → [보성무역 ( 법인 전환 예정 )] (4건)
UPDATE agency_cases SET company_id = '8c80213d-668d-4472-94a4-8cab6f588bd6'
 WHERE deleted_at IS NULL AND company_id IS NULL
   AND business_name IN ('보성무역(민용기컨설턴트)', '보성무역');

-- (주)경문도어시스템(말일) → [(주)경문도어시스템] (3건)
UPDATE agency_cases SET company_id = 'ab00f3bd-2bec-4130-a730-0c85ad101f16'
 WHERE deleted_at IS NULL AND company_id IS NULL
   AND business_name IN ('(주)경문도어시스템(말일)');

-- 미니 부띠끄 → [미니 부띠끄 (우선 필증, 증명원은 2월 15일이후)] (3건)
UPDATE agency_cases SET company_id = '9b9d0c00-61bb-49b9-b668-1fd86ffd82e3'
 WHERE deleted_at IS NULL AND company_id IS NULL
   AND business_name IN ('미니 부띠끄', '미니 부띠끄 ( 12월31일 기준 수출실적없음', '미니 부띠끄 ( 우선 필증으로, 증명원은 2월 15일 이후 )');

-- (주)보원유통_유선 → [(주)보원유통] (2건)
UPDATE agency_cases SET company_id = '777a58e6-30cb-4c3f-a714-a2e1c6008d30'
 WHERE deleted_at IS NULL AND company_id IS NULL
   AND business_name IN ('(주)보원유통_유선');

-- (주)에이엔알 _유선 → [(주)에이엔알] (2건)
UPDATE agency_cases SET company_id = '72a72fc8-f435-4720-8060-d5aab8c07883'
 WHERE deleted_at IS NULL AND company_id IS NULL
   AND business_name IN ('(주)에이엔알 _유선');

-- (주)엘케이네스트코리아(유선안내) → [(주)엘케이네스트코리아] (2건)
UPDATE agency_cases SET company_id = '9598c617-7ba6-4bcb-9c0d-152759221c84'
 WHERE deleted_at IS NULL AND company_id IS NULL
   AND business_name IN ('(주)엘케이네스트코리아(유선안내)');

-- (주)엠디케이컴퍼니 (유선안내) → [(주)엠디케이컴퍼니] (2건)
UPDATE agency_cases SET company_id = '97defd08-c1e8-4948-8094-c44c3a40b9e2'
 WHERE deleted_at IS NULL AND company_id IS NULL
   AND business_name IN ('(주)엠디케이컴퍼니 (유선안내)');

-- (주)유유코퍼레이션 (최종제출 안내드림) → [(주)유유코퍼레이션] (2건)
UPDATE agency_cases SET company_id = '46d83261-260a-4d35-acf1-44ee348d939f'
 WHERE deleted_at IS NULL AND company_id IS NULL
   AND business_name IN ('(주)유유코퍼레이션(스마트기기 자료 재요청중)', '(주)유유코퍼레이션 (최종제출 안내드림)');

-- (주)한산테크(본인이 직접신청) → [(주)한산테크] (2건)
UPDATE agency_cases SET company_id = 'e28b5594-1f4b-47ae-8dbc-682358413a45'
 WHERE deleted_at IS NULL AND company_id IS NULL
   AND business_name IN ('(주)한산테크(본인이 직접신청)');

-- (주)휘율이에스티(체납건 처리해야함) → [(주)휘율이에스티] (2건)
UPDATE agency_cases SET company_id = 'f2676aa9-52fd-411f-9430-2a36a0b7acaf'
 WHERE deleted_at IS NULL AND company_id IS NULL
   AND business_name IN ('(주)휘율이에스티(체납건 처리해야함)');

-- 과천경희S한의원 → [과천경희S한의원 ( 진행전 피드백대기 )] (2건)
UPDATE agency_cases SET company_id = '25949223-de08-46fc-af10-1e93b8379cd7'
 WHERE deleted_at IS NULL AND company_id IS NULL
   AND business_name IN ('과천경희S한의원');

-- 까사피에스타 _테이블오더 ( 떨어지면 저신용 ) → [까사피에스타] (2건)
UPDATE agency_cases SET company_id = 'd44263f5-0e21-413f-bb4c-1171c560bb5c'
 WHERE deleted_at IS NULL AND company_id IS NULL
   AND business_name IN ('까사피에스타 / 폐업이력 없음, 일시적경영애로 불가', '까사피에스타 _테이블오더 ( 떨어지면 저신용 )');

-- 대령숙수_잠수 ( 지혜비서님이 추가 진행 안내드림 ) → [대령숙수_잠수] (2건)
UPDATE agency_cases SET company_id = '77d0f04c-5854-4ddb-a1b1-56bd75eefd97'
 WHERE deleted_at IS NULL AND company_id IS NULL
   AND business_name IN ('대령숙수(잠수 ( 지혜비서님이 추가 진행 안내드림 ))', '대령숙수_잠수 ( 지혜비서님이 추가 진행 안내드림 )');

-- 맥스틸우드(3/6지방세체납없음) → [맥스틸우드] (2건)
UPDATE agency_cases SET company_id = 'b4487d54-cd44-4c85-b98f-b2dfa83005fa'
 WHERE deleted_at IS NULL AND company_id IS NULL
   AND business_name IN ('맥스틸우드(3/6지방세체납없음)', '맥스틸우드(포스기 계약후 계약서 징구 / 비즈모아)');

-- 솜씨협동조합_인증 부분만 유선 → [(주)솜씨협동조합] (2건)
UPDATE agency_cases SET company_id = '6f528302-cc5e-46fb-913e-c848791af0c5'
 WHERE deleted_at IS NULL AND company_id IS NULL
   AND business_name IN ('솜씨협동조합 ( 대기, 대표자와 근로자 수 소통중 )', '솜씨협동조합_인증 부분만 유선');

-- 어나더유스_잠수 → [어나더유스] (2건)
UPDATE agency_cases SET company_id = '5fee8cc4-68a6-45d5-a75b-c45b1ef187f0'
 WHERE deleted_at IS NULL AND company_id IS NULL
   AND business_name IN ('어나더유스(2/27지방세/국세 체납없음
)', '어나더유스_잠수');

-- 유일목형(시설자금 ) → [유일목형] (2건)
UPDATE agency_cases SET company_id = 'f75b4658-e77e-438e-aa67-361534014a9d'
 WHERE deleted_at IS NULL AND company_id IS NULL
   AND business_name IN ('유일목형(시설자금 )');

-- 인네이처(주)_유선안내(내년 3월부터 가능) → [인네이처(주)] (2건)
UPDATE agency_cases SET company_id = '5cd68b6e-d9db-4e6c-9f6d-ad1b5dc4c2c8'
 WHERE deleted_at IS NULL AND company_id IS NULL
   AND business_name IN ('인네이처(주)_유선안내(내년 3월부터 가능)');

-- 츄맥 ( 잠수 ) → [츄맥] (2건)
UPDATE agency_cases SET company_id = 'd98f1f34-214c-485a-a6be-3a8d0c5d4bdd'
 WHERE deleted_at IS NULL AND company_id IS NULL
   AND business_name IN ('츄맥 ( 오픈초기 정신없어서 잠수 )', '츄맥 ( 잠수 )');

-- 토탈아트코리아 ( 고용링크 있음 ) → [토탈아트 코리아] (2건)
UPDATE agency_cases SET company_id = 'a0086c5d-3e78-426b-90fe-d46c633c979b'
 WHERE deleted_at IS NULL AND company_id IS NULL
   AND business_name IN ('토탈아트코리아 ( 고용링크 있음 )');

-- (유)누리관광_인증서 없음 → [(유)누리관광] (1건)
UPDATE agency_cases SET company_id = '544b3df5-9d98-4d5c-bfb9-fcade563a1fd'
 WHERE deleted_at IS NULL AND company_id IS NULL
   AND business_name IN ('(유)누리관광_인증서 없음');

-- (주)123푸드 (신청 보류) → [(주)123푸드] (1건)
UPDATE agency_cases SET company_id = '2524b257-b8fe-400f-8a27-3d5c30a6f510'
 WHERE deleted_at IS NULL AND company_id IS NULL
   AND business_name IN ('(주)123푸드 (신청 보류)');

-- (주)리딩트러스트_1억 → [(주)리딩트러스트] (1건)
UPDATE agency_cases SET company_id = '7267f0ab-66cf-43b2-9a39-b2fd1dd5e9a8'
 WHERE deleted_at IS NULL AND company_id IS NULL
   AND business_name IN ('(주)리딩트러스트_1억');

-- (주)애슐런컴퍼니(최종제출 안내드림) → [(주)애슐런컴퍼니] (1건)
UPDATE agency_cases SET company_id = 'f6aa3a0b-6bf8-4743-99c0-47df4079d5cc'
 WHERE deleted_at IS NULL AND company_id IS NULL
   AND business_name IN ('(주)애슐런컴퍼니(최종제출 안내드림)');

-- (주)에스와이커뮤니티_공고링크 받아야함 → [(주)에스와이커뮤니티] (1건)
UPDATE agency_cases SET company_id = '33c2dce3-9ed4-465d-a0c8-7284a18ed80f'
 WHERE deleted_at IS NULL AND company_id IS NULL
   AND business_name IN ('(주)에스와이커뮤니티_공고링크 받아야함');

-- (주)엘앤엘디_계정 아직 안주심 → [(주)엘앤엘디] (1건)
UPDATE agency_cases SET company_id = '00cb54d5-8fc3-425a-ab5f-f509bf2fc92a'
 WHERE deleted_at IS NULL AND company_id IS NULL
   AND business_name IN ('(주)엘앤엘디_계정 아직 안주심');

-- (주)예가비즈(최종제출 안내드림) → [(주)예가비즈] (1건)
UPDATE agency_cases SET company_id = 'e367e66a-ce7f-4330-8ce2-70170ceb1bd8'
 WHERE deleted_at IS NULL AND company_id IS NULL
   AND business_name IN ('(주)예가비즈(최종제출 안내드림)');

-- (주)지제이건설 → [(주)지제이건설_목요일 최종제출 예정] (1건)
UPDATE agency_cases SET company_id = '76f8b6c5-86e6-4737-a03f-63afdcb029f7'
 WHERE deleted_at IS NULL AND company_id IS NULL
   AND business_name IN ('(주)지제이건설');

-- (주)피코스산업_계정 아직 안주심 → [(주)피코스산업] (1건)
UPDATE agency_cases SET company_id = 'e78d9a91-45cd-48a3-aa92-53caa10578ae'
 WHERE deleted_at IS NULL AND company_id IS NULL
   AND business_name IN ('(주)피코스산업_계정 아직 안주심');

-- 감상커뮤니케이션 (부동산 가압류 5월 진행할것 5.6) → [감상커뮤니케이션] (1건)
UPDATE agency_cases SET company_id = 'f686e94b-0c10-4bf2-9952-f1d43e06cca4'
 WHERE deleted_at IS NULL AND company_id IS NULL
   AND business_name IN ('감상커뮤니케이션 (부동산 가압류 5월 진행할것 5.6)');

-- 그라티아(카누 조달청 조달 및 특허청 디자인등록) → [그라티아] (1건)
UPDATE agency_cases SET company_id = '86a77f9b-6444-425a-a6cc-9a9f9faeb04c'
 WHERE deleted_at IS NULL AND company_id IS NULL
   AND business_name IN ('그라티아(카누 조달청 조달 및 특허청 디자인등록)');

-- 기동정밀 / 폐업이력 없고, 졸업후보, 사회적경제기업 미해당 → [기동정밀] (1건)
UPDATE agency_cases SET company_id = 'd4f6ff6d-f814-4ad6-9274-ccf84ff01481'
 WHERE deleted_at IS NULL AND company_id IS NULL
   AND business_name IN ('기동정밀 / 폐업이력 없고, 졸업후보, 사회적경제기업 미해당');

-- 넘버원택배(혁신성장) → [넘버원택배] (1건)
UPDATE agency_cases SET company_id = '77706395-6c5c-4afc-b4ad-337598fd9928'
 WHERE deleted_at IS NULL AND company_id IS NULL
   AND business_name IN ('넘버원택배(혁신성장)');

-- 대박관(국세없음,지방세없음) → [대박관] (1건)
UPDATE agency_cases SET company_id = '66b320a0-6d4c-450d-bd8a-e6696492d44a'
 WHERE deleted_at IS NULL AND company_id IS NULL
   AND business_name IN ('대박관(국세없음,지방세없음)');

-- 동진건설 → [동진건설_방치] (1건)
UPDATE agency_cases SET company_id = '001687b2-94e9-42d7-a77e-3fc6ee99b57b'
 WHERE deleted_at IS NULL AND company_id IS NULL
   AND business_name IN ('동진건설');

-- 리즈코스( 5월말 뷰티론 신청 ) → [리즈코스] (1건)
UPDATE agency_cases SET company_id = '9b6b5a33-c02e-47b9-b291-ed66a3a8a66c'
 WHERE deleted_at IS NULL AND company_id IS NULL
   AND business_name IN ('리즈코스( 5월말 뷰티론 신청 )');

-- 미진축산(혁신성장 스마트기기)(월세2천1백 체납) → [미진축산] (1건)
UPDATE agency_cases SET company_id = 'cee54ae5-807f-4d2f-9fc2-d43eacf807ee'
 WHERE deleted_at IS NULL AND company_id IS NULL
   AND business_name IN ('미진축산(혁신성장 스마트기기)(월세2천1백 체납)');

-- 아이디어스푼 / → [아이디어스푼] (1건)
UPDATE agency_cases SET company_id = '1585a5ba-c827-478d-8e3c-b4025f5881df'
 WHERE deleted_at IS NULL AND company_id IS NULL
   AND business_name IN ('아이디어스푼 /');

-- 안다미로 → [안다미로(교육수료는 14일에 처리되어 상세페이지 반영필요 )] (1건)
UPDATE agency_cases SET company_id = '6aa38c19-1ddb-4332-aec4-b1633f1581cf'
 WHERE deleted_at IS NULL AND company_id IS NULL
   AND business_name IN ('안다미로');

-- 어장관리(국세 없음 → [어장관리] (1건)
UPDATE agency_cases SET company_id = 'd3c63ebb-f25a-4115-8c7a-5b861361bc0b'
 WHERE deleted_at IS NULL AND company_id IS NULL
   AND business_name IN ('어장관리(국세 없음');

-- 엘포테크_추가 기대출은 부담된다고 하여 중단 → [엘포테크] (1건)
UPDATE agency_cases SET company_id = '45fbc2ee-84ee-4d06-84a3-98fc6e3d1e52'
 WHERE deleted_at IS NULL AND company_id IS NULL
   AND business_name IN ('엘포테크_추가 기대출은 부담된다고 하여 중단');

-- 유성기계_사이드보기 별첨 → [유성기계] (1건)
UPDATE agency_cases SET company_id = 'e197c5a0-6dc3-47c3-b375-98641b226c5d'
 WHERE deleted_at IS NULL AND company_id IS NULL
   AND business_name IN ('유성기계_사이드보기 별첨');

-- 응암식당(3/5국세체납없음,지방세미납-신청후안내할예정) → [응암식당] (1건)
UPDATE agency_cases SET company_id = 'b30a3397-4179-4daa-a8af-17b06f9664fa'
 WHERE deleted_at IS NULL AND company_id IS NULL
   AND business_name IN ('응암식당(3/5국세체납없음,지방세미납-신청후안내할예정)');

-- 의왕베이스볼아카데미(체납)_비협조 → [의왕베이스볼아카데미] (1건)
UPDATE agency_cases SET company_id = '3f9f719a-45f5-4179-ad51-eb56a132109f'
 WHERE deleted_at IS NULL AND company_id IS NULL
   AND business_name IN ('의왕베이스볼아카데미(체납)_비협조');

-- 제천한약영농조합법인 → [(주)제천한약영농조합법인] (1건)
UPDATE agency_cases SET company_id = 'bfd05fda-d0de-4810-95f9-4d2c165d510d'
 WHERE deleted_at IS NULL AND company_id IS NULL
   AND business_name IN ('제천한약영농조합법인');

-- 주식회사 와이에스푸드 ( 다미설 법인 )_1억조달완료 → [주식회사 와이에스푸드 ( 다미설 법인 )] (1건)
UPDATE agency_cases SET company_id = 'b6f6a2e1-a8c5-4af3-a2dd-57f34dcf2fbe'
 WHERE deleted_at IS NULL AND company_id IS NULL
   AND business_name IN ('주식회사 와이에스푸드 ( 다미설 법인 )_1억조달완료');

-- 티와이3133 → [티와이3133(엘에스에너지)] (1건)  [사용자판단 포함]
UPDATE agency_cases SET company_id = 'f657cf8c-72bb-459e-ae07-84ed41c659c1'
 WHERE deleted_at IS NULL AND company_id IS NULL
   AND business_name IN ('티와이3133');

-- 파이브투_재단 부결 및 저신용 3천 받으심 비협조로 방치중 → [파이브투] (1건)
UPDATE agency_cases SET company_id = 'debe5159-5447-4b00-88cc-9a1f191371c4'
 WHERE deleted_at IS NULL AND company_id IS NULL
   AND business_name IN ('파이브투_재단 부결 및 저신용 3천 받으심 비협조로 방치중');

-- 풍짬(3/5국세지방세 체납없음) → [풍짬] (1건)
UPDATE agency_cases SET company_id = '18ff6884-d074-489f-84c0-4e630b0ca64b'
 WHERE deleted_at IS NULL AND company_id IS NULL
   AND business_name IN ('풍짬(3/5국세지방세 체납없음)');

-- 피치플레이_AI 스마트 자판기, S/W → [피치플레이] (1건)
UPDATE agency_cases SET company_id = 'cfeeeaad-ddec-4745-b15f-5c19d31c37a5'
 WHERE deleted_at IS NULL AND company_id IS NULL
   AND business_name IN ('피치플레이_AI 스마트 자판기, S/W');

-- 하은운송(3/6국세지방세체납없음) → [하은운송] (1건)
UPDATE agency_cases SET company_id = '2575f0f5-3859-419a-ad43-94d84c280458'
 WHERE deleted_at IS NULL AND company_id IS NULL
   AND business_name IN ('하은운송(3/6국세지방세체납없음)');

-- 헤움 ( 집중관리기업 3회차 납부 확인후 신청 ) → [헤움] (1건)
UPDATE agency_cases SET company_id = 'd6a34947-af74-4d78-a48c-43f011e88989'
 WHERE deleted_at IS NULL AND company_id IS NULL
   AND business_name IN ('헤움 ( 집중관리기업 3회차 납부 확인후 신청 )');

COMMIT;
