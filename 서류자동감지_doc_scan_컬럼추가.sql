-- 서류 자동감지 3단계 — companies.doc_scan 컬럼 추가 (2026-08-09)
--
-- 무엇을 담나: 구글드라이브 업체 폴더를 훑어 나온 "서류 감지 결과 최신 1건".
--   {
--     scannedAt, scannedBy, folderId, fileCount, truncated,
--     found:     { "서류명": [{ id, name, path, webViewLink, confidence }] },  -- 확정
--     ambiguous: [{ file:{...}, candidates:[...], why }],                      -- 사람이 골라야 함
--     unknownCount: 7                                                          -- 서류로 안 보이는 파일 수
--   }
--
-- 왜 별도 테이블이 아니라 companies 의 jsonb 한 칸인가
--   · 새 테이블을 만들면 RLS 정책 4종을 같은 커밋에서 새로 짜야 한다(CLAUDE.md 2-2).
--     companies 는 이미 정책이 있어 이 컬럼에 그대로 적용된다 → 추가 보안 조치 없음.
--   · 스캔 결과는 기업당 "최신 1건"만 쓰고 이력을 보지 않는다.
--   · received_docs 가 이미 companies 에 있어 조인 없이 같이 읽힌다.
--
-- ⚠️ 이 컬럼은 "제안"만 담는다. received_docs 를 자동으로 덮어쓰지 않는다.
--    사람이 화면에서 [수령완료로 표시] 를 눌러야 received_docs 로 넘어간다.
--    서류현황은 "받은 줄 알고 안 받는" 사고가 미분류보다 훨씬 나쁘기 때문이다.
--
-- ⚠️ App.js 저장 화이트리스트(allFields)에 doc_scan 을 넣지 말 것.
--    넣으면 기업 상세 일반 저장이 화면에 들고 있던 낡은 스캔 결과를 되쓴다.
--    이 컬럼을 쓰는 경로는 자동감지 버튼(writeGuarded) 하나뿐이어야 한다.

alter table public.companies
  add column if not exists doc_scan jsonb;

comment on column public.companies.doc_scan is
  '구글드라이브 서류 자동감지 결과(최신 1건). 제안만 담고 received_docs 를 자동으로 바꾸지 않는다. 쓰는 곳은 App.js 자동감지 버튼뿐.';

-- 검증(실행 후 별도로 다시 조회할 것 — run-sql.js 는 마지막 SELECT 하나만 출력한다)
select column_name, data_type, is_nullable
  from information_schema.columns
 where table_schema = 'public' and table_name = 'companies' and column_name = 'doc_scan';
