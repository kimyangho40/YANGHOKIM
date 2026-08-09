-- 구글드라이브 업체 폴더 ↔ 기업목록 일괄 자동연결 — 2026-08-09
-- App.js matchDriveFolders() 를 그대로 돌린 결과(자동 104건).
--   판정 기준: 폴더명 이름유사도 + 대표자명 일치. 한 기업에 폴더가 2개 겹치거나
--   대표자만 우연히 같은 건은 auto 에 들어가지 않고 사람 확인(review)으로 빠진다.
-- 이미 drive_folder_id 가 있는 기업은 덮어쓰지 않는다(실행 시점 기준 전 건 비어 있었음).
begin;
-- ㈜더케이앤씨 <- (주)더케이앤씨_김남철대표
update public.companies set drive_folder_id='1X-abLlzpdwz1KQHrVPiBZFcIDI2xPQ2j' where id='da373a95-adbe-4315-99ec-4702bdd86e5b' and (drive_folder_id is null or btrim(drive_folder_id)='');
-- (주)동락포스 <- (주)동락포스_강병화대표
update public.companies set drive_folder_id='16H8_UwXxfVRK3xPCM3KWG3p6Df30mslK' where id='17708883-f3ce-406f-aaea-d836a07229ff' and (drive_folder_id is null or btrim(drive_folder_id)='');
-- (주)텐핏글로벌 <- (주)텐핏글로벌_우경호대표
update public.companies set drive_folder_id='1gK6bp9ORuNKa5oDhDB9tWt5C591ejQu2' where id='46f5ee1e-e796-4911-809d-2f12a7fe8636' and (drive_folder_id is null or btrim(drive_folder_id)='');
-- 골드이엔지(주) <- 골드이엔지(주)_김경환대표님
update public.companies set drive_folder_id='1WIF2S2KcjKjJGbXRoMDbLchs-clIuRz6' where id='0c19dc1b-3146-4695-9ceb-3a408f815391' and (drive_folder_id is null or btrim(drive_folder_id)='');
-- (주)제천한약영농조합법인 <- 제천한약농업회사법인(주)_구교창대표
update public.companies set drive_folder_id='1L8yOK9983bYib6570mVfpRdv1LFJrQh3' where id='bfd05fda-d0de-4810-95f9-4d2c165d510d' and (drive_folder_id is null or btrim(drive_folder_id)='');
-- (주)마인드트리 <- (주)마인드트리_황필수대표
update public.companies set drive_folder_id='1LHnm2Uh2Xsa05dPWf2Yg7jWgmzQRuktD' where id='3f713082-009f-4248-a97e-0edf74f455af' and (drive_folder_id is null or btrim(drive_folder_id)='');
-- (주)위드컴퍼니 <- 위드컴퍼니주식회사_정재동대표
update public.companies set drive_folder_id='1HFi57mWY4Cr1fMN9IX6_PyhuPLQ_G-ro' where id='2bcd6701-d647-4b70-ab1b-6ed398fb097b' and (drive_folder_id is null or btrim(drive_folder_id)='');
-- (주)수호 <- (주)수호_이호대표,김남주대표(김승수)
update public.companies set drive_folder_id='1xhLyi6phyZDvG0giPRsQVCHkGCovxbOU' where id='d9cccdb0-f625-48aa-8b1f-c5a12c294316' and (drive_folder_id is null or btrim(drive_folder_id)='');
-- (주)포스트케어 <- 포스트케어_안치환대표
update public.companies set drive_folder_id='1EL2j8uTFU7c6Gs52EFeZQYhhzaCxZBxa' where id='3e6d21e6-2024-4947-b612-96a2fd77219f' and (drive_folder_id is null or btrim(drive_folder_id)='');
-- ㈜청당한얼 <- (주)청당한얼_장혜림, 장래홍대표
update public.companies set drive_folder_id='1fGiS59IZQUtPkdVbNipKW-WxnjRDCCzu' where id='4c01d126-3286-4bb1-8c47-eab1965ef053' and (drive_folder_id is null or btrim(drive_folder_id)='');
-- (주)리첸시아스크린 <- (주)리첸시아스크린_김동일대표
update public.companies set drive_folder_id='1iHXJTjjjTGl-5UxMCZ3ds4SZ6Plu-JCB' where id='f3007d80-99a1-4128-bb0b-2e061f5d4e04' and (drive_folder_id is null or btrim(drive_folder_id)='');
-- ㈜제일중기건업 <- (주)제일중기건업_김현구대표
update public.companies set drive_folder_id='1XdElTYzqhrsnXdQ6BcXD9GxHYbPU664u' where id='359f6706-d16d-4e1e-899b-97437168caa7' and (drive_folder_id is null or btrim(drive_folder_id)='');
-- 행복창고김해가구단지 <- 행복창고김해가구단지_서성구대표
update public.companies set drive_folder_id='1A-bHPX8vQUIxdh9iReMC3sXZ_8o-hKop' where id='6afd53d9-7501-4c69-b6d9-25f58488a942' and (drive_folder_id is null or btrim(drive_folder_id)='');
-- 전라도밥상 <- 전라도밥상_공수현대표
update public.companies set drive_folder_id='1iOaVOvxG-3U4TcUwF1oTcop5Egqox6Ub' where id='ce5d0f49-b106-4353-8616-8a23405bab83' and (drive_folder_id is null or btrim(drive_folder_id)='');
-- ㈜디스이즈 <- (주)디스이즈_이민주대표
update public.companies set drive_folder_id='1_PXGp5r4s58uKLZW-9DYUXtoxkPbHFyp' where id='42dbf748-af2f-4591-8d51-803353406866' and (drive_folder_id is null or btrim(drive_folder_id)='');
-- 퀸즈PC Cafe <- 퀸즈PC Cafe_김인경대표
update public.companies set drive_folder_id='1wx0kntWYmgflKJdbM9Yrnvw26xVJJnNP' where id='a2bde741-7e79-4086-b3e8-e1830c90c6c8' and (drive_folder_id is null or btrim(drive_folder_id)='');
-- 코모랩 <- 코모랩_임삼환대표
update public.companies set drive_folder_id='1KVrkLEte1RQXWBaBARFLZBxV5dnxOd5b' where id='5f43c76f-8962-4bee-812a-e461286fc479' and (drive_folder_id is null or btrim(drive_folder_id)='');
-- (주)웰딧 <- 주식회사 웰딧_이충인대표
update public.companies set drive_folder_id='12PBrUBxTv-1x_rRhHmj4qw4sfoY4dZH5' where id='8e775590-37cc-4d3d-b843-8c3c23a2a454' and (drive_folder_id is null or btrim(drive_folder_id)='');
-- 반지하 서울대입구역점 <- 반지하서울대입구역점_변일형대표
update public.companies set drive_folder_id='1sGip4z1y-M-IqSpA_9BwYjJH14vqMqn_' where id='be98eb00-fafe-42da-8748-5a8ec618b67f' and (drive_folder_id is null or btrim(drive_folder_id)='');
-- 크레패밀리 <- 크레패밀리_박종희대표
update public.companies set drive_folder_id='1i-G7YOcl1uiwDJKDsLQgj_CC1hWCPxyw' where id='b203f8ac-5247-446d-8335-5a888de55e21' and (drive_folder_id is null or btrim(drive_folder_id)='');
-- 위즈코리아 <- 위즈코리아_이상흠대표
update public.companies set drive_folder_id='1pnNQI1TnsMQ5f9p-RqcTppaUt5LWHaCU' where id='faec9daa-dcf6-4894-a863-4e640b586d66' and (drive_folder_id is null or btrim(drive_folder_id)='');
-- 보타이 <- 보타이_한옥두대표
update public.companies set drive_folder_id='1GpFTlVezhhZpVQe-OzMEuRP3hwU8Gqzf' where id='fb446b0b-0394-423f-b07f-3e4cdba0e9d0' and (drive_folder_id is null or btrim(drive_folder_id)='');
-- 프리즘축구클럽 <- 프리즘축구클럽_김태원대표
update public.companies set drive_folder_id='1zm6LcBKdbrDzUMzNOaCpNgDdUEtP1fFV' where id='4e21566a-b7bc-4476-8058-dd79812f7d8c' and (drive_folder_id is null or btrim(drive_folder_id)='');
-- 비비스톤앤선 <- 비비스톤앤선_석대용대표
update public.companies set drive_folder_id='1DMXexctZwkDmk20E0cCA1Zi5uJVzXZW9' where id='d1f6f001-bdd8-4bd8-82ca-531ad766baee' and (drive_folder_id is null or btrim(drive_folder_id)='');
-- 프라이빗 <- 프라이빗_이선호대표
update public.companies set drive_folder_id='1IvCNXbHR-P06hw5ImmOyJ9cAFZfFRRpw' where id='01771f14-db43-455e-8746-f66d8ad3bdfb' and (drive_folder_id is null or btrim(drive_folder_id)='');
-- 진도포차 <- 진도포차_박혜영대표
update public.companies set drive_folder_id='1RTdAjKZaCfPUX5N7tEPNKeKdzhapEi8Y' where id='fc95543d-1dcd-4369-80b4-d08229a85fdd' and (drive_folder_id is null or btrim(drive_folder_id)='');
-- 골목식당(일반과세자) <- 골목식당_김성용대표
update public.companies set drive_folder_id='1kU9hcGY85X-dedY0sJ5oKL08zIls0w0B' where id='d3dce313-e600-410a-b1cf-81c492986d82' and (drive_folder_id is null or btrim(drive_folder_id)='');
-- 성광통운 <- 성광통운_유두형대표
update public.companies set drive_folder_id='1DKK1k_uIUUACjFKdI2RgbxKreQ1TJZDm' where id='f6ae475f-2e8f-4105-9d6b-25529b69973d' and (drive_folder_id is null or btrim(drive_folder_id)='');
-- 꽁페띠베르(플라워클래스) <- 꽁페띠베르_임단비대표
update public.companies set drive_folder_id='1eYKeZMoMGX6DhP8drjJqv1AVuYFUhTdr' where id='7905faac-783d-49cf-a294-ef54b5b12924' and (drive_folder_id is null or btrim(drive_folder_id)='');
-- 원조태백물닭갈비 <- 원조태백물닭갈비_박무봉대표
update public.companies set drive_folder_id='1BUD2CWvrdddJPZGwO48T1sx4I5nOQz1j' where id='9eb07198-5867-44ab-baf1-a11fff786a7c' and (drive_folder_id is null or btrim(drive_folder_id)='');
-- 골드쑥뜸 <- 골드쑥뜸_유원대표
update public.companies set drive_folder_id='1YNaaZL66Z-AC8AzbuBVsQfJkzNFFsdC1' where id='ae88949d-adc5-43c8-9290-029f5155c8d4' and (drive_folder_id is null or btrim(drive_folder_id)='');
-- 운혜상사 <- 운혜상사_최요한대표
update public.companies set drive_folder_id='1fPDgTs-P9Rok-FpnyM_waBceHVnoVtoE' where id='0d783ae8-2dbf-46bb-8d3b-e72c30d5ec73' and (drive_folder_id is null or btrim(drive_folder_id)='');
-- 비즈팟 (일반과세자) <- 비즈팟_서성현대표
update public.companies set drive_folder_id='1xPWCYnZJjrHuU3MsoFi0hhqEgOmt3Mux' where id='526144b5-744a-4afb-af17-107108edd046' and (drive_folder_id is null or btrim(drive_folder_id)='');
-- 선사현대창의사고력수학교습소 <- 선사현대창의사고력수학교습소_유하열대표
update public.companies set drive_folder_id='1k_xb9jUy8PqGCw9IbdonJfUhJlYEgJyr' where id='fa21eb06-0a0c-4603-abb0-dd543df8029a' and (drive_folder_id is null or btrim(drive_folder_id)='');
-- 신영주류(명) <- 신영주류(명)__김봉수대표
update public.companies set drive_folder_id='10XEfEG-DI2-o6yT7_eE_EQMq_V0HGU38' where id='cc9a7ae4-beb5-44d3-831a-6f4d13f31f6d' and (drive_folder_id is null or btrim(drive_folder_id)='');
-- 일신상운 <- 일신상운_김수철대표
update public.companies set drive_folder_id='1zYoH8f7hP1BPJzvS7_7cvSniUlZfSomG' where id='0cd85f6a-62a8-44b7-9a7e-358d34858eca' and (drive_folder_id is null or btrim(drive_folder_id)='');
-- 학림통운 <- 학림통운_박창호대표
update public.companies set drive_folder_id='19wdvXr5vpYKTf2EfgOAC8zg_Wd7dahfM' where id='ea690ed9-bad3-47d4-b257-6169b0fca7a5' and (drive_folder_id is null or btrim(drive_folder_id)='');
-- 예일1:1맞춤코칭학원 (+알짜컴) <- 예일맞춤코칭학원_권현주대표
update public.companies set drive_folder_id='1HYzpJsT6XVEdQC43h0JdJldW27pdTsVH' where id='cd2fadf0-9394-4ff3-81ee-f40acbb7dfdb' and (drive_folder_id is null or btrim(drive_folder_id)='');
-- 왕십리골프피팅 <- 왕십리골프피팅_김석주대표
update public.companies set drive_folder_id='1suGQsHCzCqaXal2R7OfmyJhCU_uaCCEm' where id='ebc9b31f-5691-4d08-b154-bb61c65a982d' and (drive_folder_id is null or btrim(drive_folder_id)='');
-- 풍동자전거 <- 풍동자전거_조영기대표
update public.companies set drive_folder_id='1uUcIFMte9qWNOJUFHv4UJDGSnRnoDEzz' where id='b838aeab-4c99-40f8-be4d-2567981477c6' and (drive_folder_id is null or btrim(drive_folder_id)='');
-- 에스투코퍼레이션 <- 에스투코퍼레이션_한상돈대표
update public.companies set drive_folder_id='1WEXxaVvcxpvUWeyeFM2HHZGmQ0zUtazn' where id='fef079b1-7549-41d3-953a-bdf9dcedccdf' and (drive_folder_id is null or btrim(drive_folder_id)='');
-- 홍대개미울산삼산점 <- 홍대개미울산삼산동_홍덕표대표
update public.companies set drive_folder_id='1ZH3hx31rgwz_rqO_HOKCMvDLzAA9lhjj' where id='66a4180b-ccbe-46c4-bf3b-f519fa481891' and (drive_folder_id is null or btrim(drive_folder_id)='');
-- 스튜디오오도씨 <- 스투디오오도씨_오상훈대표
update public.companies set drive_folder_id='1mORiucHyb791Wix_fPmHYzcuPZw-H9ts' where id='2fc19a91-3d83-4bf3-b3ec-26c3e2433684' and (drive_folder_id is null or btrim(drive_folder_id)='');
-- 오성상사 노루페인트 <- 오성상사_정영민대표님
update public.companies set drive_folder_id='13eTdkN9UoEqVfqzQ3GRo_n_pMG1bTN0E' where id='937a6045-7aaa-4b2c-8dc5-8bbe1950395e' and (drive_folder_id is null or btrim(drive_folder_id)='');
-- 지에스25계양도두리점 <- GS25 계양도두리점_김종현대표
update public.companies set drive_folder_id='1WaWftJ4Uqxqv1hT7vr_dQUHkxLJezsrG' where id='595ac11d-a3bf-400c-ae14-b2b9cb1c2cd9' and (drive_folder_id is null or btrim(drive_folder_id)='');
-- 세상을뒤집다 <- 세상을뒤집다_김현정,배순애대표
update public.companies set drive_folder_id='1T_LBZCYGPRVeXABivibGHLX7-XF8Si42' where id='d16fffcf-45d6-4cc3-b039-bc5c6a62d173' and (drive_folder_id is null or btrim(drive_folder_id)='');
-- 넘버원택배 <- 넘버원택배_김송훈대표님
update public.companies set drive_folder_id='19wwmMbpSDfJPUDGIjOcL3XZ4-wgMrzrv' where id='77706395-6c5c-4afc-b4ad-337598fd9928' and (drive_folder_id is null or btrim(drive_folder_id)='');
-- 세인트복싱_수지점 <- 세인트복싱 수지점_김은숙대표님
update public.companies set drive_folder_id='17zT0NVTNzwAL6Yhqz7IdX4cUMT39CQxZ' where id='1628d5e2-ff59-4bf5-b8de-5b10fa6163b6' and (drive_folder_id is null or btrim(drive_folder_id)='');
-- 어반트랜드대화점 <- 어반트랜드대화점_공혜림대표
update public.companies set drive_folder_id='1Dutue44LeBbqbzH8sfR1pOsnzYR4pfig' where id='725f7a62-3fb9-4b12-8467-4c08a4d7774e' and (drive_folder_id is null or btrim(drive_folder_id)='');
-- 영진물류 <- 영진물류(우주물류)_장현석대표
update public.companies set drive_folder_id='1Lh8VzkQLxwyyd91c4qJuoe_YyitbTCcw' where id='707ba5d9-503f-4ea1-997d-bd113d0fe570' and (drive_folder_id is null or btrim(drive_folder_id)='');
-- 순천연합건기 <- 순천연합건기_이우근 대표
update public.companies set drive_folder_id='1iqqr2b1JzpgRN6dQej2spJXlss6aKJ8I' where id='25c7eba4-0e0e-4956-a8fd-e3c46af41ad3' and (drive_folder_id is null or btrim(drive_folder_id)='');
-- 동진건설_방치 <- 동진건설_김종관대표
update public.companies set drive_folder_id='1K0bGuuQkaYY2XjZ9uVdwXZNe9eoO-VPX' where id='001687b2-94e9-42d7-a77e-3fc6ee99b57b' and (drive_folder_id is null or btrim(drive_folder_id)='');
-- 대성엔텍 <- 대성엔텍_김기호,고민주대표님
update public.companies set drive_folder_id='16hoHsXyTmUmnVxJekzTe9gdUgv29-YJV' where id='ce01a2fb-7994-46a7-912c-3f258a915e7f' and (drive_folder_id is null or btrim(drive_folder_id)='');
-- 에스디케이 <- 에스디케이_남평우대표
update public.companies set drive_folder_id='10L4Sk4_Nj7Le9DrRKFlxuBz_sEdTkTYN' where id='91afc701-4bbc-45e3-bd8a-b8d02f4097cb' and (drive_folder_id is null or btrim(drive_folder_id)='');
-- 이엔에프에너지 <- 이엔에프에너지_남순덕대표
update public.companies set drive_folder_id='1aFSsmg40Yz_riXrfAQk8WTI-6-xWHOUT' where id='45fea9f9-2b3b-4400-9453-443ea67d8502' and (drive_folder_id is null or btrim(drive_folder_id)='');
-- 서린테크 <- 서린테크_이용필 대표
update public.companies set drive_folder_id='1szBUQmcFi6wRbJQ1r_utxrjXeJeLwBuX' where id='33403c3f-1327-4359-8cfc-25597e071696' and (drive_folder_id is null or btrim(drive_folder_id)='');
-- 지엠아이 <- 지엠아이_정영하대표
update public.companies set drive_folder_id='1_Xh3Zj23UciitUv4UHLlQjPc5beWY-2I' where id='547b3250-088c-47d1-9cd3-f81fa1c855a8' and (drive_folder_id is null or btrim(drive_folder_id)='');
-- 오이구컴퍼니 <- 오이구컴퍼니_한희진대표
update public.companies set drive_folder_id='128cA0QdM0GQOOKMdTyssMjYkfPHtQKlA' where id='94f93d80-e937-4c7b-9664-09ed56fff49e' and (drive_folder_id is null or btrim(drive_folder_id)='');
-- 비에스테크(국세 체납) <- 비에스테크_백순종대표님
update public.companies set drive_folder_id='1oj_crF5N06z5fDOd43MSSIRRrgdx_I8i' where id='0bc5893d-227d-4a25-80b7-f7d570e6be33' and (drive_folder_id is null or btrim(drive_folder_id)='');
-- 뚱이농산 <- 뚱이농산_이동수대표
update public.companies set drive_folder_id='1shIPKHopiS8rXhpRuzntqnrQRDQovBTg' where id='767b0973-7338-4261-ae17-b9a73adc2ba5' and (drive_folder_id is null or btrim(drive_folder_id)='');
-- 블랙씨스튜디오 <- 블랙씨스튜디오_백승우대표
update public.companies set drive_folder_id='1r2rMgOGA41n5pqblTpBmjFeuMXiBLXkT' where id='173eff22-a040-4047-8f02-5ae0855f7ce4' and (drive_folder_id is null or btrim(drive_folder_id)='');
-- 그라티아 <- 그라티아_김혜신대표
update public.companies set drive_folder_id='1ONpTles4QTwE2JQl0HmV3y8Ofh03gHeE' where id='86a77f9b-6444-425a-a6cc-9a9f9faeb04c' and (drive_folder_id is null or btrim(drive_folder_id)='');
-- (주)F2MG글로벌아카데미 <- F2MG글로벌뷰티아카데미_김선미대표
update public.companies set drive_folder_id='1R2--ZaANV_BJtW4T0DVi4dFBkCMS4m5B' where id='3aea381e-aaee-4090-b886-d80cbc069e86' and (drive_folder_id is null or btrim(drive_folder_id)='');
-- (주)리딩트러스트 <- (주)리딩트러스트_김태경대표
update public.companies set drive_folder_id='18YVvGzhBgjbakzW_DkHz-njVEpjgtc_U' where id='7267f0ab-66cf-43b2-9a39-b2fd1dd5e9a8' and (drive_folder_id is null or btrim(drive_folder_id)='');
-- (유)JB특수시스템 <- (유)JB특수시스템_김용현대표
update public.companies set drive_folder_id='1QE2QRvmB_U5mZ-_fm8TBXksP6MblYr00' where id='b42a73f3-e921-4b90-b434-199fac5a898c' and (drive_folder_id is null or btrim(drive_folder_id)='');
-- 희성디자인 <- 희성디자인_노희성대표님
update public.companies set drive_folder_id='1IxU56zp7qd5Z5buR4guREV3325GYgUbw' where id='b328d2de-34c1-4821-b1a2-8e12e1faa641' and (drive_folder_id is null or btrim(drive_folder_id)='');
-- 찡어맨 <- 찡어맨_우희철대표
update public.companies set drive_folder_id='1gHzFv5a9ydoM584Skha0VW9ElIBXC-Tp' where id='68305480-3eca-4b65-8375-1d3a6a7da953' and (drive_folder_id is null or btrim(drive_folder_id)='');
-- 세인트복싱 <- 세인트복싱_김민규대표
update public.companies set drive_folder_id='1Sfg2686UXM1V-x0ZWuPZ1o-9m1_2IcoN' where id='1fa5024d-018b-406c-a7a2-24372b4a8949' and (drive_folder_id is null or btrim(drive_folder_id)='');
-- 헤움 <- 헤움_이진영대표
update public.companies set drive_folder_id='1sbWVInqxLIt4VlaYOciVDVc3YSUrDRet' where id='d6a34947-af74-4d78-a48c-43f011e88989' and (drive_folder_id is null or btrim(drive_folder_id)='');
-- 의왕베이스볼아카데미 <- 의왕베이스볼아카데미_조경환대표
update public.companies set drive_folder_id='1ZkpSro8HcX22wdKBczq3Oqh3NXfa9U3w' where id='3f9f719a-45f5-4179-ad51-eb56a132109f' and (drive_folder_id is null or btrim(drive_folder_id)='');
-- 프로페나인어클락 <- 프로페나인어클락_황순호대표
update public.companies set drive_folder_id='1gwedgumOPBYk1z_l6ZQ-r5guY0pR45J2' where id='94abad50-c380-4a90-a84c-444b66cf5154' and (drive_folder_id is null or btrim(drive_folder_id)='');
-- 선진무역 <- 선진무역_박칠복대표
update public.companies set drive_folder_id='1tqkJhus6pRsSZc33SL9Hen7cjdlZlWoP' where id='acf1dec5-d83d-4ac1-941a-6af183bc9b67' and (drive_folder_id is null or btrim(drive_folder_id)='');
-- 제로디톡스 <- 제로디톡스 바디첼린지_최대경 대표
update public.companies set drive_folder_id='1InLXVG9O6l0l3zgA7Le48snIrmGJeWx-' where id='aa30e69f-2150-466d-8b44-0e614648bdc6' and (drive_folder_id is null or btrim(drive_folder_id)='');
-- (주)태양로지스틱스 <- (주)태양로지스틱스_서영욱 대표님
update public.companies set drive_folder_id='1NANt0rZBotQ3kzYNaHwjOWXPZ6By5ONB' where id='2ad9354c-b621-44b9-8e72-166cda36b37a' and (drive_folder_id is null or btrim(drive_folder_id)='');
-- 샘플하우스 <- 샘플하우스_송현주대표
update public.companies set drive_folder_id='1FXB30fc3jks99FeGL-MChb2U3nzCk7RK' where id='a444ff27-1a69-4a73-8ae0-92ba755fdefa' and (drive_folder_id is null or btrim(drive_folder_id)='');
-- (주)세븐아이 <- (주)세븐아이_홍강식 대표
update public.companies set drive_folder_id='1D4yUQExlK3y2eayUC7DkRdNNZUcGfPhT' where id='8a8f3643-1111-4ac6-8eae-ca4ac1952c91' and (drive_folder_id is null or btrim(drive_folder_id)='');
-- (주)엠씨리컴퍼니 <- (주)엠씨리컴퍼니_이민철 대표
update public.companies set drive_folder_id='1BIqmf4yW_dE2tmAvoDxBsak5hGVPvhGJ' where id='62bd5c4e-f138-4e84-8aef-5754cff685d6' and (drive_folder_id is null or btrim(drive_folder_id)='');
-- (주)모닝코리아 <- (주)모닝코리아_강형건대표
update public.companies set drive_folder_id='1W_ctlUxQE_j2hbTxR-sgmSeW1sqpmvOJ' where id='ba98497e-09c0-4408-ba05-a84d4aad55cc' and (drive_folder_id is null or btrim(drive_folder_id)='');
-- 청화정보기술 <- (주)청화정보기술_이수철,이진희대표
update public.companies set drive_folder_id='1hqqovZ7KuyZuENIZajxwA2qUXNeAJ2PH' where id='f850387b-a041-4754-9f08-0a4b5d3c5f83' and (drive_folder_id is null or btrim(drive_folder_id)='');
-- 동선목장 <- 동선목장_이기연대표
update public.companies set drive_folder_id='14ktffDtETrU0LCenWKAeG_4b1u-MZeSt' where id='8590bd80-8de2-4982-837d-7f9f5057048a' and (drive_folder_id is null or btrim(drive_folder_id)='');
-- (주)허브바이오앤테크 <- 주식회사 허브바이오엔테크_김미란대표
update public.companies set drive_folder_id='1iQzErDus4WEBjzdxMcl1q72UcPnznsrW' where id='e4811184-d945-4370-8c2a-4d059e47ef71' and (drive_folder_id is null or btrim(drive_folder_id)='');
-- 츄맥 <- 츄맥_유병욱대표
update public.companies set drive_folder_id='1kEqerOVCjIYz-LsYZqG7v8h-PBODmcQ1' where id='d98f1f34-214c-485a-a6be-3a8d0c5d4bdd' and (drive_folder_id is null or btrim(drive_folder_id)='');
-- 어나더유스 <- 어나더유스_박지훈대표
update public.companies set drive_folder_id='1IPQk47lYA8jHb3dWp4CR8PUNphPh6dYQ' where id='5fee8cc4-68a6-45d5-a75b-c45b1ef187f0' and (drive_folder_id is null or btrim(drive_folder_id)='');
-- 새봄약국 <- 새봄약국_주암천대표
update public.companies set drive_folder_id='14snh28_4ubxlQ5xbeDy3idBekQN4jFCw' where id='9829543c-fe06-4935-9c4c-d4b47f716a05' and (drive_folder_id is null or btrim(drive_folder_id)='');
-- 토브 <- 토브_이인영 대표
update public.companies set drive_folder_id='1ApcO5dosA8gZ_ITLKClbtB7LxEUwoIR0' where id='bb8f262f-1057-4688-a53b-273c2d564911' and (drive_folder_id is null or btrim(drive_folder_id)='');
-- 오조(떡) <- 오조떡_박보겸,안은희 대표
update public.companies set drive_folder_id='13-vzDKEF-Sb_aBFAZ4O7TfAaV5CPx-zT' where id='a6e2368f-ce92-4a68-8c45-8af330d05a8f' and (drive_folder_id is null or btrim(drive_folder_id)='');
-- (주)케어박스 <- (주)케어박스_한영희대표, 한영관본부장
update public.companies set drive_folder_id='1oYR2dRfv64keLUM_t3m31-2awXqQC0W8' where id='4aa1cda1-a244-4b7d-812e-ebe24d29ed2a' and (drive_folder_id is null or btrim(drive_folder_id)='');
-- 다인디자인 <- 다인디자인_강덕성대표
update public.companies set drive_folder_id='1fhyIEL9D8H24WeamboVKsJJGFI5Uowz8' where id='9152e266-de2c-465e-96d5-5ae14f78cf37' and (drive_folder_id is null or btrim(drive_folder_id)='');
-- 진수네간장게장 <- 진수네간장게장_안윤미대표
update public.companies set drive_folder_id='1QLusspota06iuITEk5n03Ks86XYM6rLo' where id='6b636f4a-6266-43b0-9b10-14694179221a' and (drive_folder_id is null or btrim(drive_folder_id)='');
-- 애플&블루베리자연농장 <- 애플&블루베리자연농장_이권희대표
update public.companies set drive_folder_id='1BYeSphJsKQcP6xmpvdNycMiWPB6S8Yup' where id='280af9ae-19c3-4c0e-b2c0-4085a1e622e0' and (drive_folder_id is null or btrim(drive_folder_id)='');
-- 구도로통닭 <- 구도로통닭수내점_안소영대표
update public.companies set drive_folder_id='1F6blh9zjrdHCfpu5OOYBFwIAlDmoWj5r' where id='a63bd69b-d09c-41c8-b6bb-72b5dcff0fee' and (drive_folder_id is null or btrim(drive_folder_id)='');
-- 천막집 <- 천막집_김근호대표
update public.companies set drive_folder_id='1yjpGNqf82C_dL6wexObN1EUpK6g9pp4W' where id='f5a00df5-ee5b-4e34-98cc-c9063827c2d2' and (drive_folder_id is null or btrim(drive_folder_id)='');
-- 에스에프헤어 <- 에스에프헤어_신광일대표
update public.companies set drive_folder_id='1Qf1V6p9iVG39aRB5V6WcdtY3ZBHY9Uf_' where id='454bfa7c-c452-430a-90bc-04c198b30f23' and (drive_folder_id is null or btrim(drive_folder_id)='');
-- 인네이처(주) <- 인네이처(주)_한세진대표
update public.companies set drive_folder_id='1fmDKIqnwZ1XF3uFfpU8IanzZQ7vnk2f6' where id='5cd68b6e-d9db-4e6c-9f6d-ad1b5dc4c2c8' and (drive_folder_id is null or btrim(drive_folder_id)='');
-- 가마치통닭 <- 가마치통닭지행점_안성재대표
update public.companies set drive_folder_id='1H68bTvHQDZYtMiCtzPMLTh2BEQXDP1bl' where id='40eec65c-edea-4ab4-8dca-74b4da75582d' and (drive_folder_id is null or btrim(drive_folder_id)='');
-- 파이브투 <- 파이브투_설재연대표
update public.companies set drive_folder_id='1L7TlL-6qRbCtGxqmNVXsJDPph3ey-Xae' where id='debe5159-5447-4b00-88cc-9a1f191371c4' and (drive_folder_id is null or btrim(drive_folder_id)='');
-- 명인설렁탕 <- 명인설렁탕송도센트럴점_이승묵대표
update public.companies set drive_folder_id='1LxDCcvh8FId7iqH4_ZXphxwPStq7kh6t' where id='3bfb34ba-dd68-473c-b825-88a7e89cc42f' and (drive_folder_id is null or btrim(drive_folder_id)='');
-- 엠앤디코리아_잠수 <- 엠앤디코리아_한문규대표
update public.companies set drive_folder_id='1V5f2QKutdh0NGa7yMkgarr8Mt3Rn72l9' where id='353c67a6-a84c-4f4e-a6ca-e3883a58102c' and (drive_folder_id is null or btrim(drive_folder_id)='');
-- 대령숙수_잠수 <- 대령숙수1450_송대우대표
update public.companies set drive_folder_id='1QI8w8ot9JjoRTPk_qgrL0hZPTJesrMDB' where id='77d0f04c-5854-4ddb-a1b1-56bd75eefd97' and (drive_folder_id is null or btrim(drive_folder_id)='');
-- 세일축산 <- 세일축산_박옥란대표
update public.companies set drive_folder_id='1Hsi7owAnqBFhahr_nwh7FNx2w1q_0gbi' where id='c277db0d-bc69-49f2-bcce-c4ff9895f429' and (drive_folder_id is null or btrim(drive_folder_id)='');
-- (주)에어퍼스트 <- (주)에어퍼스트_이정호대표,이충인대표
update public.companies set drive_folder_id='1GSQ0jDJD6ERtfpoQ3_klY-erc-QbdWM8' where id='6ccbac38-748c-4b8f-b1a4-d76cbbe7974a' and (drive_folder_id is null or btrim(drive_folder_id)='');
-- 청풍발리호텔 <- 청풍발리호텔_김용순, 김종만 대표
update public.companies set drive_folder_id='1fMJXLTCVkOCRoCXNK21huRuIQ13B60Mc' where id='56d78b67-d6a1-4160-a50c-4b7d0168aee1' and (drive_folder_id is null or btrim(drive_folder_id)='');
-- 올타임커피 <- 올타임커피_이용덕대표
update public.companies set drive_folder_id='1SBnjRZc4MRzewIpnEIwCQgKwoaBIhHzg' where id='e01faacf-f638-4d05-9f80-a596831dafc3' and (drive_folder_id is null or btrim(drive_folder_id)='');
-- 피치플레이 <- 피치플레이_정재호 대표
update public.companies set drive_folder_id='1Y6V2_9V4i15p6Xxkb0cFxH6NZJRqOTjy' where id='cfeeeaad-ddec-4745-b15f-5c19d31c37a5' and (drive_folder_id is null or btrim(drive_folder_id)='');
commit;

select count(*) as 연결됨 from public.companies where deleted_at is null and drive_folder_id is not null;
