# 정부 기관 사이트 — CRM 이식 패키지

레퍼런스: yng_biz 스토리 영상의 "정부 기관 사이트 · 대한민국 기업지원 기관 포털" 페이지.
영상과 같은 체계(12 카테고리 · 17 지역 · 기관 256곳)와 같은 화면 구성(검색 → 추천검색 → 카테고리 칩 → 지역/유형 필터 → 카드, 지자체는 지역 선택 패널)으로 만들었다.

## 폴더

| 파일 | 용도 |
|---|---|
| `정부기관사이트.html` | **단독 실행 페이지.** 더블클릭으로 열림. 외부 의존성 없음(폰트만 CDN). 즐겨찾기는 브라우저 localStorage. |
| `agencies.json` | 기관 256건 원본 데이터 (카테고리·지역·유형·태그·URL). 모든 산출물의 단일 원천. |
| `crm/supabase_agency_sites.sql` | CRM(Supabase) 테이블 `agency_sites` + 즐겨찾기 `agency_site_favorites` + RLS + 시드 256건. 재실행 안전(upsert). |
| `crm/AgencySites.jsx` | CRM(React CRA) 드롭인 페이지 컴포넌트. Supabase 연동 + 사용자별 즐겨찾기. 스타일 자체 포함. |
| `crm/agencies.csv` | 구글시트/엑셀로 검토·편집용 (UTF-8 BOM). |
| `scripts/build_agencies.py` | 데이터 원본(코드) → `agencies.json` |
| `scripts/verify_urls.py` | 256개 URL 전수 접속 검증 → `scripts/url_check.csv` |
| `scripts/build_html.py` | `agencies.json` + `template.html` → `정부기관사이트.html` |
| `scripts/build_handoff.py` | `agencies.json` → `crm/*.sql`, `crm/*.csv` |

## CRM에 넣는 방법 (2가지)

### A. 지금 당장 — 링크만 (5분)
CRM 소스 없이도 됨. `정부기관사이트.html`을 Vercel/Netlify/GitHub Pages 아무 데나 정적 배포하고
CRM 사이드바 **바로가기** 메뉴에 URL을 추가. 새 탭 또는 iframe으로 열림.
즐겨찾기는 각자 브라우저에 저장된다.

### B. 정식 — CRM 메뉴로 (CRM 개발자, 30분)
1. Supabase SQL Editor 에 `crm/supabase_agency_sites.sql` 통째로 실행
   (RLS 켜져 있고 `authenticated` 롤에 GRANT까지 포함. 로그인 사용자만 읽기, 즐겨찾기는 본인 것만.)
2. `crm/AgencySites.jsx` 를 `src/pages/AgencySites.jsx` 로 복사
3. 라우트 추가: `<Route path="/agency-sites" element={<AgencySites supabase={supabase} />} />`
4. 사이드바 "주요 메뉴"에 `🏛️ 기관 사이트` 항목 추가 (기업 목록 아래 권장)
5. 즐겨찾기가 사용자별로 DB에 저장되고, 팀원이 각자 자기 즐겨찾기를 갖는다

기관을 추가/수정하려면 Supabase `agency_sites` 테이블에서 직접 편집하면 된다. `is_active=false` 로 숨김.

## 데이터 검증 (2026-08-30 실측)
- 256개 URL 전수 HTTP 접속: **249 OK**, 1건 봇차단(무역아카데미 403, 사이트 정상), 6건은 파이썬 SSL 구형암호 문제로 브라우저/curl에선 정상(소진공·산단공·KIMST·경기도청·충북도청·충북TP 모두 curl 200).
- 검증 중 교체한 것: 새출발기금(newstartfund.or.kr), 환경부→**기후에너지환경부**(mcee.go.kr), 판판대로(fanfandaero.kr), 메인비즈(smes.go.kr/mainbiz), 창업에듀(k-startup.go.kr/edu), KDB NextRound(nextround.kr), 대구·전북·제주·충남 신보 정식 도메인, 부산정보산업진흥원(bipa.kr 접속불가)→부산울산중소벤처기업청.
- 지역지식재산센터 17곳은 통합포털(ripc.org)로 연결 — 영상도 동일 방식.

## 데이터 갱신 순서
```
py -3.13 scripts/build_agencies.py   # 데이터 수정 후
py -3.13 scripts/verify_urls.py      # URL 재검증
py -3.13 scripts/build_html.py       # HTML 재생성
py -3.13 scripts/build_handoff.py    # SQL/CSV 재생성
```
