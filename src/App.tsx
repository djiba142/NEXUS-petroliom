// SIHG v1.0.0 - Système Intégré des Hydrocarbures de Guinée
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { RequireRole } from "@/components/RequireRole";
import Index from "./pages/Index";
import LandingPage from "./pages/LandingPage";
import AuthPage from "./pages/AuthPage";
import EntreprisesPage from "./pages/EntreprisesPage";
import EntrepriseDetailPage from "./pages/EntrepriseDetailPage";
import StationsPage from "./pages/StationsPage";
import StationDetailPage from "./pages/StationDetailPage";
import AlertesPage from "./pages/AlertesPage";
import UtilisateursPage from "./pages/UtilisateursPage";
import RapportsPage from "./pages/RapportsPage";
import ParametresPage from "./pages/ParametresPage";
import ProfilPage from "./pages/ProfilPage";
import CartePage from "./pages/CartePage";
import AProposPage from "./pages/AProposPage";
import AccessDeniedPage from "./pages/AccessDeniedPage";
import NotFound from "./pages/NotFound";
import OrdersPage from "./pages/admin/OrdersPage";

// Role-specific dashboards
import DashboardEntreprise from "./pages/dashboards/DashboardEntreprise";
import DashboardSuperAdmin from "./pages/dashboards/DashboardSuperAdmin";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/acces-refuse" element={<AccessDeniedPage />} />

            {/* DASHBOARDS STIRCTS - CHAQUE ROLE A LE SIEN */}
            <Route path="/panel" element={
              <ProtectedRoute>
                <RequireRole allowedRoles={['super_admin', 'responsable_entreprise']} />
              </ProtectedRoute>
            }>
              {/* Redirection intelligente gérée par le composant Index ou AuthContext */}
              <Route index element={<Index />} />
            </Route>

            <Route path="/dashboard/admin" element={
              <ProtectedRoute>
                <RequireRole allowedRoles={['super_admin']} />
              </ProtectedRoute>
            }>
              <Route index element={<DashboardSuperAdmin />} />
            </Route>

            <Route path="/dashboard/entreprise" element={
              <ProtectedRoute>
                <RequireRole allowedRoles={['responsable_entreprise']} />
              </ProtectedRoute>
            }>
              <Route index element={<DashboardEntreprise />} />
            </Route>


            {/* FONCTIONNALITÉS PARTAGÉES MAIS RESTREINTES */}

            {/* Carte : Tout le monde */}
            <Route path="/carte" element={
              <ProtectedRoute>
                <RequireRole allowedRoles={['super_admin', 'responsable_entreprise']} />
              </ProtectedRoute>
            }>
              <Route index element={<CartePage />} />
            </Route>

            {/* Entreprises : Admin seulemnent */}
            <Route path="/entreprises" element={
              <ProtectedRoute>
                <RequireRole allowedRoles={['super_admin']} />
              </ProtectedRoute>
            }>
              <Route index element={<EntreprisesPage />} />
            </Route>

            <Route path="/entreprises/:id" element={
              <ProtectedRoute>
                <RequireRole allowedRoles={['super_admin', 'responsable_entreprise']} />
              </ProtectedRoute>
            }>
              <Route index element={<EntrepriseDetailPage />} />
            </Route>

            {/* Stations : Tout le monde a un accès, mais la vue changera selon le rôle */}
            <Route path="/stations" element={
              <ProtectedRoute>
                <RequireRole allowedRoles={['super_admin', 'responsable_entreprise']} />
              </ProtectedRoute>
            }>
              <Route index element={<StationsPage />} />
            </Route>

            <Route path="/stations/:id" element={
              <ProtectedRoute>
                <RequireRole allowedRoles={['super_admin', 'responsable_entreprise']} />
              </ProtectedRoute>
            }>
              <Route index element={<StationDetailPage />} />
            </Route>

            {/* Alertes : Tout le monde */}
            <Route path="/alertes" element={
              <ProtectedRoute>
                <RequireRole allowedRoles={['super_admin', 'responsable_entreprise']} />
              </ProtectedRoute>
            }>
              <Route index element={<AlertesPage />} />
            </Route>

            {/* Rapports : Admin, Entreprise */}
            <Route path="/rapports" element={
              <ProtectedRoute>
                <RequireRole allowedRoles={['super_admin', 'responsable_entreprise']} />
              </ProtectedRoute>
            }>
              <Route index element={<RapportsPage />} />
            </Route>

            {/* ADMINISTRATION SYSTEME - STRICTEMENT SUPER ADMIN */}
            <Route path="/utilisateurs" element={
              <ProtectedRoute>
                <RequireRole allowedRoles={['super_admin', 'responsable_entreprise']} />
              </ProtectedRoute>
            }>
              <Route index element={<UtilisateursPage />} />
            </Route>

            <Route path="/admin/commandes" element={
              <ProtectedRoute>
                <RequireRole allowedRoles={['super_admin']} />
              </ProtectedRoute>
            }>
              <Route index element={<OrdersPage />} />
            </Route>

            <Route path="/parametres" element={
              <ProtectedRoute>
                <RequireRole allowedRoles={['super_admin']} />
              </ProtectedRoute>
            }>
              <Route index element={<ParametresPage />} />
            </Route>

            {/* PAGES COMMUNES */}
            <Route path="/profil" element={
              <ProtectedRoute>
                <ProfilPage />
              </ProtectedRoute>
            } />

            <Route path="/a-propos" element={
              <ProtectedRoute>
                <AProposPage />
              </ProtectedRoute>
            } />

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
