select 'RLS 켜짐' as check, (select relrowsecurity from pg_class where oid = 'public.menu_favorites'::regclass)::text as result
union all select 'anon 권한 0', (select count(*) from information_schema.role_table_grants where table_schema='public' and table_name='menu_favorites' and grantee='anon')::text
union all select 'authenticated 권한', (select string_agg(privilege_type, ',' order by privilege_type) from information_schema.role_table_grants where table_schema='public' and table_name='menu_favorites' and grantee='authenticated')
union all select '정책', (select string_agg(policyname || ':' || cmd || ':' || array_to_string(roles, '/'), ' | ' order by policyname) from pg_policies where schemaname='public' and tablename='menu_favorites')
union all select '정책 조건이 전부 본인+승인', (select bool_and(coalesce(qual, with_check) like '%auth.uid()%' and coalesce(qual, with_check) like '%is_approved()%') from pg_policies where schemaname='public' and tablename='menu_favorites')::text
union all select '행 수', (select count(*) from public.menu_favorites)::text
union all select 'RLS 꺼진 public 표 수(0이어야 정상)', (select count(*) from pg_class c where c.relnamespace='public'::regnamespace and c.relkind='r' and not c.relrowsecurity)::text;
