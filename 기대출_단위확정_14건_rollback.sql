-- 되돌리기: 2026-08-19 기대출 단위 확정 14건을 원래 값으로 복구
begin;

-- 사투99 | 신용대출 | 3000만 -> 3,000
update public.companies set loans = jsonb_set(loans, '{1,amount}', to_jsonb('3,000'::text), false)
 where id = '651cae45-acbb-4edf-a771-b4d56d486b0f'::uuid and loans->1->>'amount' = '3000만';

-- 스튜디오오도씨 | 소진공(신용대출/종합통장대출) | 1235.3만 -> 12,353
update public.companies set loans = jsonb_set(loans, '{0,amount}', to_jsonb('12,353'::text), false)
 where id = '2fc19a91-3d83-4bf3-b3ec-26c3e2433684'::uuid and loans->0->>'amount' = '1235.3만';

-- 스튜디오오도씨 | 소진공(신용대출/종합통장대출) | 2058.8만 -> 20,588
update public.companies set loans = jsonb_set(loans, '{1,amount}', to_jsonb('20,588'::text), false)
 where id = '2fc19a91-3d83-4bf3-b3ec-26c3e2433684'::uuid and loans->1->>'amount' = '2058.8만';

-- 스튜디오오도씨 | 하나은행 | 1667.6만 -> 16,676
update public.companies set loans = jsonb_set(loans, '{2,amount}', to_jsonb('16,676'::text), false)
 where id = '2fc19a91-3d83-4bf3-b3ec-26c3e2433684'::uuid and loans->2->>'amount' = '1667.6만';

-- 스튜디오오도씨 | 서울신용보증재단 | 1584.3만 -> 15,843
update public.companies set loans = jsonb_set(loans, '{3,amount}', to_jsonb('15,843'::text), false)
 where id = '2fc19a91-3d83-4bf3-b3ec-26c3e2433684'::uuid and loans->3->>'amount' = '1584.3만';

-- 스튜디오오도씨 | 카카오뱅크 | 1000만 -> 10,000
update public.companies set loans = jsonb_set(loans, '{4,amount}', to_jsonb('10,000'::text), false)
 where id = '2fc19a91-3d83-4bf3-b3ec-26c3e2433684'::uuid and loans->4->>'amount' = '1000만';

-- 스튜디오오도씨 | 서울신용보증재단 | 850만 -> 8,500
update public.companies set loans = jsonb_set(loans, '{5,amount}', to_jsonb('8,500'::text), false)
 where id = '2fc19a91-3d83-4bf3-b3ec-26c3e2433684'::uuid and loans->5->>'amount' = '850만';

-- 우진종합철거(주) | 현대커머셜 | 9293.8만 -> 92938
update public.companies set loans = jsonb_set(loans, '{2,amount}', to_jsonb('92938'::text), false)
 where id = '38417d22-53bf-4840-874a-1e21c1c875ea'::uuid and loans->2->>'amount' = '9293.8만';

-- 우진종합철거(주) | 전문건설공제조합 | 3200만 -> 32000
update public.companies set loans = jsonb_set(loans, '{3,amount}', to_jsonb('32000'::text), false)
 where id = '38417d22-53bf-4840-874a-1e21c1c875ea'::uuid and loans->3->>'amount' = '3200만';

-- 우진종합철거(주) | 전문건설공제조합 | 1120만 -> 11200
update public.companies set loans = jsonb_set(loans, '{4,amount}', to_jsonb('11200'::text), false)
 where id = '38417d22-53bf-4840-874a-1e21c1c875ea'::uuid and loans->4->>'amount' = '1120만';

-- 우진종합철거(주) | 롯데오토리스 | 1408.4만 -> 14084
update public.companies set loans = jsonb_set(loans, '{5,amount}', to_jsonb('14084'::text), false)
 where id = '38417d22-53bf-4840-874a-1e21c1c875ea'::uuid and loans->5->>'amount' = '1408.4만';

-- 퀸즈PC Cafe | 교보생명 | 3000만 -> 30
update public.companies set loans = jsonb_set(loans, '{0,amount}', to_jsonb('30'::text), false)
 where id = 'a2bde741-7e79-4086-b3e8-e1830c90c6c8'::uuid and loans->0->>'amount' = '3000만';

-- 퀸즈PC Cafe | 삼성카드 | 800만 -> 8
update public.companies set loans = jsonb_set(loans, '{1,amount}', to_jsonb('8'::text), false)
 where id = 'a2bde741-7e79-4086-b3e8-e1830c90c6c8'::uuid and loans->1->>'amount' = '800만';

-- 퀸즈PC Cafe | 소진공 | 5000만 -> 50
update public.companies set loans = jsonb_set(loans, '{2,amount}', to_jsonb('50'::text), false)
 where id = 'a2bde741-7e79-4086-b3e8-e1830c90c6c8'::uuid and loans->2->>'amount' = '5000만';

commit;