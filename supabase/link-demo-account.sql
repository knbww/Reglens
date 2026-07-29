-- Attach the seeded demo businesses to your own Supabase Auth account.
--
-- Run this AFTER schema.sql and seed.sql, and AFTER you have signed up once in
-- the app (or created a user under Authentication -> Users).
--
-- seed.sql ships the five demo businesses owned by a placeholder user row. This
-- repoints that row at a real auth account. Every foreign key in the schema is
-- ON UPDATE CASCADE, so the businesses, tasks, reminders, monitoring, saved
-- policies, conversations and reports all follow automatically.
--
-- ⚠ Edit the email on the line marked below, then run the whole file.

update "public"."User" u
set
  id = a.id,
  email = a.email
from auth.users a
where u."isDemo" = true
  and a.email = 'you@example.com';   -- <<< PUT YOUR SIGN-UP EMAIL HERE

-- Verify: should list the five demo businesses against your account.
select b."name", b."city", u."email"
from "public"."Business" b
join "public"."User" u on u.id = b."ownerId"
order by b."name";
