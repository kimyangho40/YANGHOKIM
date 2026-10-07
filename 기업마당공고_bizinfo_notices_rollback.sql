-- 되돌리기: 기업마당공고_bizinfo_notices.sql — 테이블 통째로 삭제(공고 거울이라 원본은 기업마당에 있다)
-- ⚠️ App.js 「📢 지원사업」 탭을 먼저 되돌릴 것 — 남겨 두면 탭이 조회 실패 배너를 띄운다.
drop table if exists public.bizinfo_notices;
