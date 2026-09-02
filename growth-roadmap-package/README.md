# 성장 로드맵 — CRM 이식 패키지

레퍼런스: yng_biz 스토리 영상(2026-08-31)의 "성장경로 · 어떤 사업을 하고 계신가요?" 화면.
업종 탭 7개 → 업종별 성장 경로 카드 → 카드마다 요약 + "이 방향에서 준비할 것"(지식재산 /
기업·기술 인증 / 인허가 / 사업확장 기반) + "활용할 수 있는 기회" + 소요기간(+N건 열림).
어제 만든 「CRM 정부기관사이트」와 같은 구조로 만들었다.

## 데이터 출처 구분 (중요)

경로 16개 중 **12개는 영상에서 그대로 판독**(source=video), **4개는 영상에 없던
서비스·교육 업종을 같은 문체로 채운 것**(source=authored — 서비스→다점포·가맹,
도소매→수출, 교육 2개). authored 경로의 제도·요건 명칭은 발행 전 공고 원문 대조 권장.
`crm/roadmap.csv` 마지막 열에서 구분된다.

## 폴더

| 파일 | 용도 |
|---|---|
| `성장로드맵.html` | **단독 실행 페이지.** 더블클릭으로 열림. 외부 의존성 없음(폰트만 CDN). |
| `roadmap.json` | 경로 16건 원본 데이터 (업종·경로·요약·준비 칩·기회 칩). 모든 산출물의 단일 원천. |
| `crm/supabase_growth_roadmap.sql` | CRM(Supabase) 테이블 `growth_paths` + 문구 `growth_roadmap_copy` + RLS + 시드. 재실행 안전(upsert). |
| `crm/GrowthRoadmap.jsx` | CRM(React CRA) 드롭인 페이지 컴포넌트. 스타일 자체 포함. `industry` prop 으로 기업 상세 드로어에 해당 업종만 임베드 가능. |
| `crm/roadmap.csv` | 구글시트/엑셀 검토·편집용 (UTF-8 BOM). |
| `scripts/build_roadmap.py` | 데이터 원본(코드) → `roadmap.json` |
| `scripts/build_html.py` | `roadmap.json` + `template.html` → `성장로드맵.html` |
| `scripts/build_handoff.py` | `roadmap.json` → `crm/*.sql`, `crm/*.csv` |

## CRM에 넣는 방법 (2가지)

### A. 지금 당장 — 링크만 (5분)
`성장로드맵.html`을 정적 배포(Vercel/Netlify/GitHub Pages)하고 CRM 사이드바
**바로가기**에 URL 추가. 정부기관사이트와 같은 방식.

### B. 정식 — CRM 메뉴로 (CRM 개발자, 30분)
1. Supabase SQL Editor 에 `crm/supabase_growth_roadmap.sql` 통째로 실행
2. `crm/GrowthRoadmap.jsx` 를 `src/pages/GrowthRoadmap.jsx` 로 복사
3. 라우트: `<Route path="/growth-roadmap" element={<GrowthRoadmap supabase={supabase} />} />`
4. 사이드바에 `🧭 성장 로드맵` 항목 추가 (기관 사이트 아래 권장)
5. (선택) 기업 상세 드로어에 `<GrowthRoadmap supabase={supabase} industry={company.industryCode} embedded />`
   로 그 업체 업종의 경로만 표시 — 상담 화면에서 바로 보여주는 용도

경로를 추가/수정하려면 Supabase `growth_paths` 테이블에서 직접 편집. `is_active=false` 로 숨김.
화면 문구는 `growth_roadmap_copy` 한 행에서 수정.

## 문구 원칙 (규제)

- 칩은 제도·서류의 **정식 명칭만**. "100% 승인"·"무조건"류 단정 표현 없음.
- 경로마다 고지: "기업정보를 넣어야 판정할 수 있습니다. 정보 없이 '자금 필요'라고 적지 않습니다."
- 하단 고지: "성장 시나리오 예시입니다. 실제 고객 사례가 아니며 결과는 사업 여건에 따라 달라집니다."

## 데이터 갱신 순서
```
py -3.13 scripts/build_roadmap.py    # 데이터 수정 후
py -3.13 scripts/build_html.py       # HTML 재생성
py -3.13 scripts/build_handoff.py    # SQL/CSV 재생성
```
