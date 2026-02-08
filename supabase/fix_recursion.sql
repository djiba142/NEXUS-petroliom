
-- 1. Drop the problematic policy
DROP POLICY IF EXISTS "Responsable entreprise can view profiles in their company" ON public.profiles;

-- 2. Re-create it using the secure function
CREATE POLICY "Responsable entreprise can view profiles in their company"
ON public.profiles FOR SELECT
USING (
  public.has_role(auth.uid(), 'responsable_entreprise') AND
  entreprise_id::text = public.get_user_entreprise_id(auth.uid())
);

-- 3. Also add a policy to allow Super Admins to insert profiles (good practice)
CREATE POLICY "Super admins can insert any profile"
ON public.profiles FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));
