-- Script to clean up duplicate roles
-- Problem: Users have both 'gestionnaire_station' (default) and their assigned role (e.g., 'super_admin', 'admin_etat').
-- Solution: Delete 'gestionnaire_station' role for any user who HAS another role.

DELETE FROM public.user_roles
WHERE role = 'gestionnaire_station'
AND user_id IN (
    -- Select user_ids that have MORE than 1 role
    SELECT user_id
    FROM public.user_roles
    GROUP BY user_id
    HAVING COUNT(*) > 1
);

-- Verification: The duplicate 'gestionnaire_station' should be gone, leaving only the intended role.
