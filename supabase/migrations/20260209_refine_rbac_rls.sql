-- Refinement of RLS Policies for SIHG RBAC

-- 1. Entreprises visibility
DROP POLICY IF EXISTS "Authenticated users can view all entreprises" ON public.entreprises;
CREATE POLICY "Super and State Admin see all entreprises"
  ON public.entreprises FOR SELECT
  TO authenticated
  USING (public.can_access_level(auth.uid(), 'admin_etat'));

CREATE POLICY "Users see their own entreprise"
  ON public.entreprises FOR SELECT
  TO authenticated
  USING (id::text = public.get_user_entreprise_id(auth.uid()));

-- 2. Stations visibility
DROP POLICY IF EXISTS "Authenticated users can view all stations" ON public.stations;
CREATE POLICY "Super and State Admin see all stations"
  ON public.stations FOR SELECT
  TO authenticated
  USING (public.can_access_level(auth.uid(), 'admin_etat'));

CREATE POLICY "Responsable entreprise sees their own stations"
  ON public.stations FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'responsable_entreprise') AND 
    entreprise_id::text = public.get_user_entreprise_id(auth.uid())
  );

CREATE POLICY "Gestionnaire sees their assigned station"
  ON public.stations FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'gestionnaire_station') AND 
    id::text = public.get_user_station_id(auth.uid())
  );

-- 3. Profiles visibility (Users)
DROP POLICY IF EXISTS "Responsable entreprise can view profiles in their company" ON public.profiles;
CREATE POLICY "Responsable entreprise can view data for their company users"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'responsable_entreprise') AND 
    entreprise_id::text = public.get_user_entreprise_id(auth.uid())
  );

-- 4. Delegated User Management (user_roles)
DROP POLICY IF EXISTS "Super admins can manage roles" ON public.user_roles;
CREATE POLICY "Super admin manages all roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Responsable entreprise can assign gestionnaire roles"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'responsable_entreprise') AND
    role = 'gestionnaire_station'
  );
