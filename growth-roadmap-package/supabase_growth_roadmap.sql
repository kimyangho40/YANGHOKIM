-- 성장 로드맵 · CRM용 Supabase 스키마 + 시드
-- 실행: Supabase SQL Editor 에 통째로 붙여넣기 (재실행해도 안전 — upsert)
-- 참고: RLS 를 켜면 authenticated 롤에 GRANT 가 별도로 필요 (아래 포함)

create table if not exists public.growth_paths (
  id            integer primary key,
  industry      text not null,           -- food·service·retail·build·edu·mfg·it
  industry_label text not null,
  from_stage    text not null,           -- 예: 음식점
  to_stage      text not null,           -- 예: 식품 브랜드 (OEM)
  months        text not null,           -- 예: 6~12개월
  opens         integer not null default 0,   -- +N건 열림
  summary       text not null default '',
  prep          jsonb not null default '{}'::jsonb,  -- {"지식재산":[...], "인허가":[...]}
  opportunities text[] not null default '{}',
  source        text not null default 'authored',      -- video | authored
  sort_order    integer not null default 0,
  is_active     boolean not null default true,
  updated_at    timestamptz not null default now()
);
create index if not exists growth_paths_industry_idx on public.growth_paths (industry);

-- 화면 공통 문구 (한 행짜리 설정)
create table if not exists public.growth_roadmap_copy (
  id   integer primary key default 1 check (id = 1),
  copy jsonb not null
);

alter table public.growth_paths enable row level security;
alter table public.growth_roadmap_copy enable row level security;
drop policy if exists "growth_paths read for authenticated" on public.growth_paths;
create policy "growth_paths read for authenticated" on public.growth_paths for select to authenticated using (true);
drop policy if exists "growth_copy read for authenticated" on public.growth_roadmap_copy;
create policy "growth_copy read for authenticated" on public.growth_roadmap_copy for select to authenticated using (true);
grant select on public.growth_paths to authenticated;
grant select on public.growth_roadmap_copy to authenticated;

insert into public.growth_paths
  (id, industry, industry_label, from_stage, to_stage, months, opens, summary, prep, opportunities, source, sort_order)
values
(1, 'food', '음식·숙박', '음식점', '식품 브랜드 (OEM)', '6~12개월', 5, '현재 음식점을 운영하고 계시지만, 자체 메뉴와 레시피를 보유하고 계시다면 제조는 OEM에 맡기고 브랜드와 유통을 직접 가져가는 확장을 검토할 수 있습니다. 공장을 짓지 않고도 제조업 매출을 만들 수 있는 경로입니다.', '{"인허가": ["식품제조가공업", "통신판매업"], "사업확장 기반": ["식품표시 기준 준수"]}'::jsonb, array['소상공인 온라인 판로지원','브랜드·디자인 개발 지원','상표 출원 지원','수출바우처','제조업 전환 시 정책자금 확대']::text[], 'video', 1),
(2, 'food', '음식·숙박', '음식점', '식품 제조기업', '12~24개월', 5, 'OEM이 아니라 직접 제조로 가면 제조업 사업자가 됩니다. 정책자금 한도와 대상 사업이 소상공인 기준에서 제조업 기준으로 바뀌고, 기술개발(R&D)과 시설자금까지 검토 범위에 들어옵니다. 대신 시설과 인허가가 먼저입니다.', '{"인허가": ["식품제조가공업", "HACCP"], "사업확장 기반": ["품목제조보고"]}'::jsonb, array['제조업 시설자금','스마트공장 지원','식품 R&D 과제','HACCP 인증 지원','벤처기업 확인 가능성']::text[], 'video', 2),
(3, 'food', '음식·숙박', '음식점', '프랜차이즈', '12~24개월', 3, '직영점 운영 경험과 인기 메뉴가 있다면 가맹사업으로 확장할 수 있습니다. 다만 가맹사업은 정보공개서 등록이 법적 요건이고, 직영점 1년 운영 이력이 원칙적으로 필요합니다.', '{"지식재산": ["상표"], "인허가": ["가맹사업 정보공개서 등록"], "사업확장 기반": ["직영점 운영 요건"]}'::jsonb, array['프랜차이즈 수준 진단','브랜드 개발 지원','상표 출원 지원']::text[], 'video', 3),
(4, 'service', '서비스', '서비스', '온라인·플랫폼', '12~24개월', 4, '시간을 파는 구조는 매출 상한이 사람 수로 정해집니다. 예약·구독·콘텐츠처럼 온라인으로 반복 판매되는 상품을 만들면 그 상한이 풀립니다. 온라인 판매가 시작되는 순간 통신판매업 신고와 개인정보 처리 기준이 먼저 걸립니다.', '{"인허가": ["통신판매업"], "사업확장 기반": ["개인정보 처리방침", "온라인 결제 체계"]}'::jsonb, array['소상공인 온라인 판로지원','콘텐츠 제작 지원','브랜드 개발 지원','상표 출원 지원']::text[], 'video', 4),
(5, 'service', '서비스', '서비스', '다점포·가맹', '12~24개월', 3, '한 곳에서 검증된 운영 방식이 있다면 두 번째 지점이 다음 걸음입니다. 2호점부터는 감이 아니라 매뉴얼이 필요하고, 가맹으로 갈 거라면 음식점과 마찬가지로 정보공개서 등록과 직영 운영 이력이 요건입니다.', '{"지식재산": ["상표"], "인허가": ["가맹사업 정보공개서 등록(가맹 시)"], "사업확장 기반": ["운영 매뉴얼", "직영점 운영 이력"]}'::jsonb, array['프랜차이즈 수준 진단','소상공인 성장 지원','상표 출원 지원']::text[], 'authored', 5),
(6, 'retail', '도소매', '도소매', '자체 브랜드 제조·유통', '6~12개월', 4, '이미 무엇이 팔리는지 아신다는 게 가장 큰 자산입니다. 그 판단으로 자체 브랜드를 만들면 마진 구조가 달라지고, 상표·디자인권이 회사 자산으로 쌓입니다.', '{"기업·기술 인증": ["품목별 인증(전기·안전·식품 등)"], "인허가": ["통신판매업"]}'::jsonb, array['온라인 판로지원','상표·디자인 출원 지원','수출바우처','브랜드 개발 지원']::text[], 'video', 6),
(7, 'retail', '도소매', '도소매', '수출·해외 판로', '12~24개월', 4, '국내에서 팔리는 품목은 대개 해외에도 같은 수요가 있습니다. 수출은 첫 실적 한 건을 만드는 일이 가장 어렵고, 그 한 건이 생기면 바우처·전시회·정책자금 평가에서 모두 근거로 쓰입니다.', '{"사업확장 기반": ["무역업 고유번호", "원산지 관리"], "기업·기술 인증": ["목표국 인증"]}'::jsonb, array['수출바우처','해외 전시회 지원','무역보험','수출 첫걸음 지원']::text[], 'authored', 7),
(8, 'build', '건설·인테리어', '인테리어·시공', '자체 제품·조달', '12~24개월', 5, '현장에서 불편해서 직접 고쳐 쓴 자재나 공법이 있다면 그게 특허와 제품의 출발점입니다. 제품이 되면 시공 매출 외에 납품 매출이 생기고, 조달 등록으로 공공시장이 열립니다.', '{"지식재산": ["특허"], "인허가": ["직접생산확인"], "사업확장 기반": ["시험성적서"]}'::jsonb, array['특허 출원 지원','조달 진출 지원','기술개발 R&D','이노비즈·벤처 확인','제조업 정책자금']::text[], 'video', 8),
(9, 'edu', '교육', '교육', '온라인 콘텐츠·구독', '6~12개월', 3, '강의는 한 번 하면 사라지지만 콘텐츠는 남아서 반복 판매됩니다. 온라인으로 옮기는 순간 원격교육 형태에 따른 신고 요건과 저작권 정리가 먼저입니다 — 특히 교안·영상의 권리 관계는 만들 때 정리해 두는 것이 나중에 정리하는 것보다 훨씬 쌉니다.', '{"지식재산": ["저작권 등록"], "인허가": ["원격평생교육시설 신고(해당 시)"], "사업확장 기반": ["온라인 결제·구독 체계"]}'::jsonb, array['콘텐츠 제작 지원','온라인 판로지원','상표 출원 지원']::text[], 'authored', 9),
(10, 'edu', '교육', '교육', '기업·기관 교육(B2B)', '12~24개월', 3, '개인 수강생 모집은 광고비 싸움이지만, 기업·기관 교육은 실적과 자격으로 들어가는 시장입니다. 위탁훈련·입찰에 참여하려면 기관 인정과 실적 증빙이 요건이라, 개인 대상 매출을 쌓으면서 서류를 미리 갖추는 순서가 맞습니다.', '{"기업·기술 인증": ["위탁훈련기관 인정(해당 시)"], "사업확장 기반": ["교육 실적 증빙", "강사진 이력"]}'::jsonb, array['직업능력개발 위탁훈련','정부·지자체 교육사업 입찰','조달 등록(학습 서비스)']::text[], 'authored', 10),
(11, 'mfg', '제조', '제조', '수출기업', '6~18개월', 4, '제조 역량이 있는 기업의 다음 한 걸음은 대개 새 제품이 아니라 새 시장입니다. 수출 실적은 정책자금·인증·R&D 평가에서 모두 가점으로 쓰입니다.', '{"기업·기술 인증": ["목표국 인증"], "사업확장 기반": ["수출", "원산지 관리"]}'::jsonb, array['수출바우처','해외 전시회 지원','수출기업 정책자금','무역보험']::text[], 'video', 11),
(12, 'mfg', '제조', '제조', '기술기업', '12~24개월', 4, '같은 제조기업이라도 기술을 등록해 두었는지에 따라 열리는 문이 다릅니다. 중진공 개발기술사업화자금은 지원대상을 ''특허·실용신안·저작권 등록 기술, 기업부설연구소·전담부서 보유 기업의 개발기술, 벤처·이노비즈 자체기술, 정부 R&D 성공 기술''로 못 박고 있습니다. 현장에 이미 있는 기술을 문서로 만드는 일이 먼저입니다.', '{"지식재산": ["특허", "실용신안"], "기업·기술 인증": ["연구개발전담부서", "기업부설연구소"], "사업확장 기반": ["기술인력"]}'::jsonb, array['개발기술사업화자금','창업성장기술개발','벤처기업 확인','이노비즈']::text[], 'video', 12),
(13, 'mfg', '제조', '제조', '공공조달', '6~18개월', 4, '민간 납품과 달리 공공조달은 자격을 갖추면 참여 기회가 반복됩니다. 다만 순서가 정해져 있습니다 — 직접생산확인 없이는 조달등록이 되지 않고, 공장등록 없이는 직접생산확인이 어렵습니다. 순서를 건너뛰면 서류가 되돌아옵니다.', '{"기업·기술 인증": ["ISO"], "인허가": ["공장등록", "직접생산확인"], "사업확장 기반": ["조달등록"]}'::jsonb, array['공공조달 참여','중소기업자간 경쟁제품','여성기업·장애인기업 우대','조달 실적 기반 정책자금']::text[], 'video', 13),
(14, 'it', 'IT·소프트웨어', '개발', '자체 제품(SaaS)', '6~12개월', 3, '외주 매출은 사람 수만큼만 늘고, 프로젝트가 끝나면 같이 끝납니다. 반복되는 요구를 제품으로 묶으면 매출이 계약이 아니라 구독으로 쌓입니다. 만든 코드의 권리를 회사 자산으로 등록해 두는 것이 첫 서류입니다.', '{"지식재산": ["SW 저작권 등록"], "기업·기술 인증": ["벤처기업 확인(준비)"], "사업확장 기반": ["과금·구독 체계"]}'::jsonb, array['초기창업패키지','클라우드 이용 지원','창업성장기술개발']::text[], 'video', 14),
(15, 'it', 'IT·소프트웨어', 'SaaS', '투자 유치', '12~24개월', 3, '투자는 계획서로 받는 것이 아니라 숫자로 받습니다. 사용자·유지율·매출이 쌓인 뒤에야 벤처확인과 시드가 순서대로 열리고, TIPS는 운영사 투자가 선행되어야 신청할 수 있습니다. 순서를 거꾸로 잡으면 시간만 씁니다.', '{"지식재산": ["특허"], "기업·기술 인증": ["벤처기업"], "사업확장 기반": ["지표 대시보드", "IR 자료"]}'::jsonb, array['TIPS 일반트랙','초기창업패키지','민관공동창업자 발굴육성']::text[], 'video', 15),
(16, 'it', 'IT·소프트웨어', 'SaaS', '해외 진출', '18~36개월', 2, '제품을 다국어로 만드는 일보다 결제와 규제가 먼저 걸립니다. 특히 개인정보 처리 기준은 나라마다 달라서, 준비 없이 열면 서비스를 닫아야 하는 경우가 생깁니다. 상표도 나라별로 따로 출원해야 합니다 — 국내 상표는 해외에서 효력이 없습니다.', '{"지식재산": ["상표"], "인허가": ["현지 규제 대응"], "사업확장 기반": ["다국어"]}'::jsonb, array['수출바우처','신시장진출지원자금']::text[], 'video', 16)
on conflict (id) do update set
  industry = excluded.industry, industry_label = excluded.industry_label,
  from_stage = excluded.from_stage, to_stage = excluded.to_stage,
  months = excluded.months, opens = excluded.opens, summary = excluded.summary,
  prep = excluded.prep, opportunities = excluded.opportunities,
  source = excluded.source, sort_order = excluded.sort_order, updated_at = now();

insert into public.growth_roadmap_copy (id, copy) values (1, '{"eyebrow": "성장경로", "title": "어떤 사업을 하고 계신가요?", "intro": "공고는 해마다 바뀌지만 “음식점 → OEM → 유통 → 수출”은 바뀌지 않습니다. 그래서 한국기업진단협회는 이 지도를 따로 관리합니다.", "path_footer": "대표님 회사에 지금 무엇이 필요한지는 기업정보를 넣어야 판정할 수 있습니다. 정보 없이 ‘자금 필요’라고 적지 않습니다.", "disclaimer": "성장 시나리오 예시입니다. 실제 고객 사례가 아니며 결과는 사업 여건에 따라 달라집니다.", "cta": "내 기업으로 확인", "analyze_headline": "그렇다면, 대표님 회사는 어떨까요?", "analyze_sub": "업종을 고르고 이미 갖춘 서류·인증에 표시하면, 어느 경로가 가장 가깝고 무엇이 남았는지 보여드립니다. 입력한 내용은 저장되지 않습니다.", "analyze_cta": "내 기업 분석하기", "analyze_pick": "업종을 선택하세요", "analyze_have": "이미 갖춘 것에 표시하세요", "analyze_result": "대표님 회사에서 가까운 순서", "analyze_left": "남은 준비물", "analyze_done": "준비물 충족", "analyze_note": "체크한 정보만으로 계산한 거리입니다. 정확한 판정은 기업정보를 보고 해야 합니다 — 상담 1533-8728.", "prep_label": "이 방향에서 준비할 것", "opps_label": "활용할 수 있는 기회", "found_suffix": "개 경로 발견", "opens_suffix": "건 열림"}'::jsonb)
on conflict (id) do update set copy = excluded.copy;
