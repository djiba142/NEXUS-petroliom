// SIHG v1.0.0 - Système Intégré des Hydrocarbures de Guinée
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
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

// Role-specific dashboards
import DashboardSONAP from "./pages/dashboards/DashboardSONAP";
import DashboardSGP from "./pages/dashboards/DashboardSGP";
import DashboardEntreprise from "./pages/dashboards/DashboardEntreprise";
import DashboardStation from "./pages/dashboards/DashboardStation";
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
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/acces-refuse" element={<AccessDeniedPage />} />

            {/* Protected routes */}
            <Route path="/" element={
              <ProtectedRoute>
                <Index />
              </ProtectedRoute>
            } />
            <Route path="/carte" element={
              <ProtectedRoute>
                <CartePage />
              </ProtectedRoute>
            } />
            <Route path="/entreprises" element={
              <ProtectedRoute>
                <EntreprisesPage />
              </ProtectedRoute>
            } />
            <Route path="/entreprises/:id" element={
              <ProtectedRoute>
                <EntrepriseDetailPage />
              </ProtectedRoute>
            } />
            <Route path="/stations" element={
              <ProtectedRoute>
                <StationsPage />
              </ProtectedRoute>
            } />
            <Route path="/stations/:id" element={
              <ProtectedRoute>
                <StationDetailPage />
              </ProtectedRoute>
            } />
            <Route path="/alertes" element={
              <ProtectedRoute>
                <AlertesPage />
              </ProtectedRoute>
            } />
            <Route path="/rapports" element={
              <ProtectedRoute>
                <RapportsPage />
              </ProtectedRoute>
            } />
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

            {/* Role-specific dashboards */}
            <Route path="/dashboard/sonap" element={
              <ProtectedRoute requiredRole="admin_etat">
                <DashboardSONAP />
              </ProtectedRoute>
            } />
            <Route path="/dashboard/sgp" element={
              <ProtectedRoute requiredRole="admin_etat">
                <DashboardSGP />
              </ProtectedRoute>
            } />
            <Route path="/dashboard/entreprise" element={
              <ProtectedRoute requiredRole="responsable_entreprise">
                <DashboardEntreprise />
              </ProtectedRoute>
            } />
            <Route path="/dashboard/admin" element={
              <ProtectedRoute requiredRole="super_admin">
                <DashboardSuperAdmin />
              </ProtectedRoute>
            } />
            <Route path="/dashboard/station" element={
              <ProtectedRoute requiredRole="gestionnaire_station">
                <DashboardStation />
              </ProtectedRoute>
            } />

            {/* Admin routes */}
            <Route path="/utilisateurs" element={
              <ProtectedRoute requiredRole="super_admin">
                <UtilisateursPage />
              </ProtectedRoute>
            } />
            <Route path="/parametres" element={
              <ProtectedRoute requiredRole="admin_etat">
                <ParametresPage />
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
