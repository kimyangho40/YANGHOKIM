-- 수수료율(companies.fee)을 소수점까지 저장할 수 있게 numeric 으로 바꾼다. (2026-08-15)
--
-- ■ 왜
-- companies.fee 는 "수수료율(%)"이다. 화면 입력칸은 처음부터 소수를 받도록 되어 있고
-- (App.js: <input type="number" step="0.1">), 정산으로 넘기는 짝꿍 컬럼
-- settlement_manual.commission_rate 도 numeric 이다. **companies.fee 만 integer 였다.**
--
-- 그래서 수수료율 4.8% 인 업체에서 계약 상태 '계약금입금완료' 버튼을 누르면
-- (그 버튼은 계약금·수수료율을 같은 UPDATE 에 실어 보낸다) 이렇게 거절됐다:
--     invalid input syntax for type integer: "4.8"
-- 실측(2026-08-15): 백돈시흥능곡점 건이 브라우저 재시도 큐에서 **421번** 재시도해
-- 421번 모두 실패하고 "아직 저장 못 한 내용 1건" 띠가 영구히 떠 있었다.
-- (activity_logs 2026-08-12 04:43 '저장실패' 기록으로 확인)
--
-- ■ 안전한가
-- integer → numeric 은 값 손실이 없는 확대 변환이다. 기존 값(정수)은 그대로 남는다.
-- 읽는 쪽은 전부 parseFloat/문자열 표시라 영향이 없다(App.js 2479, 2503, 13579).
alter table public.companies
  alter column fee type numeric using fee::numeric;

comment on column public.companies.fee is
  '수수료율(%). 소수 허용(예: 4.8). settlement_manual.commission_rate 와 짝. 2026-08-15 integer→numeric.';
