-- Fix user role assignment
-- The user 'Admin État' was incorrectly assigned 'gestionnaire_station' due to default trigger behavior.
-- We will manually update the role for the admin user.

-- OPTION 1: If you know the email involved (replace with actual email if known, e.g. 'admin@nexus.com'?)
-- But since I don't know the EXACT email the user is testing with (screenshots showed 'admin@nexus.com' as Super Admin?),
-- I will provide a generic query that the user can run by plugging in the email.

-- HOWEVER, the screenshot showed "admin@nexus.com" having "Super Administrateur" in the UI but "gestionnaire_station" in database.
-- This means the profile says one thing, but `user_roles` says another!

-- Let's fix 'admin@nexus.com' specifically to be 'super_admin' in user_roles
UPDATE public.user_roles
SET role = 'super_admin'
WHERE user_id IN (
    SELECT id FROM auth.users WHERE email = 'admin@nexus.com'
);

-- And also ensure any other intended Admin État is fixed.
-- For example if there is a 'sonap@nexus.com' or 'etat@nexus.com'.

-- ALSO, we need to fix the `handle_new_user` trigger to NOT override roles if they are already set?
-- Actually, `handle_new_user` runs AFTER INSERT on auth.users.
-- Our `createUser` function in AuthContext does:
-- 1. `tempClient.auth.signUp` -> triggers `handle_new_user` -> inserts 'gestionnaire_station'
-- 2. `supabase.from('user_roles').upsert` -> SHOULD update it to the correct role.

-- IF the upsert fails or doesn't happen, the user is stuck as 'gestionnaire_station'.
-- The previous "infinite recursion" error might have PREVENTED the upsert from working!
-- Now that recursion is fixed, new creations should work.

-- BUT for the existing broken user, we need to fix it manually.

-- Script to clear bad roles for a specific user (replace EMAIL_HERE)
UPDATE public.user_roles
SET role = 'admin_etat'
WHERE user_id IN (
    SELECT id FROM auth.users WHERE email = 'admin_etat@nexus.com' -- Example
);
