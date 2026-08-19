-- 기대출 맨숫자 15건 중 14건 단위 확정 (2026-08-19, 사용자 승인)
-- 업체별 원래 단위: 스튜디오오도씨·우진종합철거=천원 / 퀸즈PC Cafe=백만원 / 사투99=만원
-- 보성무역 26.05 는 제외(원문 확인 대기)
begin;

-- 사투99 | 신용대출 | 3,000 -> 3000만 (만원)
update public.companies set loans = jsonb_set(loans, '{1,amount}', to_jsonb('3000만'::text), false)
 where id = '651cae45-acbb-4edf-a771-b4d56d486b0f'::uuid
   and loans->1->>'amount' = '3,000';

-- 스튜디오오도씨 | 소진공(신용대출/종합통장대출) | 12,353 -> 1235.3만 (천원)
update public.companies set loans = jsonb_set(loans, '{0,amount}', to_jsonb('1235.3만'::text), false)
 where id = '2fc19a91-3d83-4bf3-b3ec-26c3e2433684'::uuid
   and loans->0->>'amount' = '12,353';

-- 스튜디오오도씨 | 소진공(신용대출/종합통장대출) | 20,588 -> 2058.8만 (천원)
update public.companies set loans = jsonb_set(loans, '{1,amount}', to_jsonb('2058.8만'::text), false)
 where id = '2fc19a91-3d83-4bf3-b3ec-26c3e2433684'::uuid
   and loans->1->>'amount' = '20,588';

-- 스튜디오오도씨 | 하나은행 | 16,676 -> 1667.6만 (천원)
update public.companies set loans = jsonb_set(loans, '{2,amount}', to_jsonb('1667.6만'::text), false)
 where id = '2fc19a91-3d83-4bf3-b3ec-26c3e2433684'::uuid
   and loans->2->>'amount' = '16,676';

-- 스튜디오오도씨 | 서울신용보증재단 | 15,843 -> 1584.3만 (천원)
update public.companies set loans = jsonb_set(loans, '{3,amount}', to_jsonb('1584.3만'::text), false)
 where id = '2fc19a91-3d83-4bf3-b3ec-26c3e2433684'::uuid
   and loans->3->>'amount' = '15,843';

-- 스튜디오오도씨 | 카카오뱅크 | 10,000 -> 1000만 (천원)
update public.companies set loans = jsonb_set(loans, '{4,amount}', to_jsonb('1000만'::text), false)
 where id = '2fc19a91-3d83-4bf3-b3ec-26c3e2433684'::uuid
   and loans->4->>'amount' = '10,000';

-- 스튜디오오도씨 | 서울신용보증재단 | 8,500 -> 850만 (천원)
update public.companies set loans = jsonb_set(loans, '{5,amount}', to_jsonb('850만'::text), false)
 where id = '2fc19a91-3d83-4bf3-b3ec-26c3e2433684'::uuid
   and loans->5->>'amount' = '8,500';

-- 우진종합철거(주) | 현대커머셜 | 92938 -> 9293.8만 (천원)
update public.companies set loans = jsonb_set(loans, '{2,amount}', to_jsonb('9293.8만'::text), false)
 where id = '38417d22-53bf-4840-874a-1e21c1c875ea'::uuid
   and loans->2->>'amount' = '92938';

-- 우진종합철거(주) | 전문건설공제조합 | 32000 -> 3200만 (천원)
update public.companies set loans = jsonb_set(loans, '{3,amount}', to_jsonb('3200만'::text), false)
 where id = '38417d22-53bf-4840-874a-1e21c1c875ea'::uuid
   and loans->3->>'amount' = '32000';

-- 우진종합철거(주) | 전문건설공제조합 | 11200 -> 1120만 (천원)
update public.companies set loans = jsonb_set(loans, '{4,amount}', to_jsonb('1120만'::text), false)
 where id = '38417d22-53bf-4840-874a-1e21c1c875ea'::uuid
   and loans->4->>'amount' = '11200';

-- 우진종합철거(주) | 롯데오토리스 | 14084 -> 1408.4만 (천원)
update public.companies set loans = jsonb_set(loans, '{5,amount}', to_jsonb('1408.4만'::text), false)
 where id = '38417d22-53bf-4840-874a-1e21c1c875ea'::uuid
   and loans->5->>'amount' = '14084';

-- 퀸즈PC Cafe | 교보생명 | 30 -> 3000만 (백만원)
update public.companies set loans = jsonb_set(loans, '{0,amount}', to_jsonb('3000만'::text), false)
 where id = 'a2bde741-7e79-4086-b3e8-e1830c90c6c8'::uuid
   and loans->0->>'amount' = '30';

-- 퀸즈PC Cafe | 삼성카드 | 8 -> 800만 (백만원)
update public.companies set loans = jsonb_set(loans, '{1,amount}', to_jsonb('800만'::text), false)
 where id = 'a2bde741-7e79-4086-b3e8-e1830c90c6c8'::uuid
   and loans->1->>'amount' = '8';

-- 퀸즈PC Cafe | 소진공 | 50 -> 5000만 (백만원)
update public.companies set loans = jsonb_set(loans, '{2,amount}', to_jsonb('5000만'::text), false)
 where id = 'a2bde741-7e79-4086-b3e8-e1830c90c6c8'::uuid
   and loans->2->>'amount' = '50';

commit;