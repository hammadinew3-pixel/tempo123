import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { Layout } from "./components/layout/Layout";
import { usePermissions } from "./hooks/use-permissions";
import { useUserRole } from "./hooks/use-user-role";
import Dashboard from "./pages/Dashboard";
import Locations from "./pages/Locations";
import NouveauLocation from "./pages/locations/Nouveau";
import LocationDetails from "./pages/locations/Details";
import Vehicules from "./pages/Vehicules";
import VehiculeDetails from "./pages/vehicles/Details";
import NouveauVehicule from "./pages/vehicles/Nouveau";
import ModifierVehicule from "./pages/vehicles/Modifier";
import ModifierVehiculeSimple from "./pages/vehicles/ModifierSimple";
import WorkflowWrapper from "./pages/vehicles/WorkflowWrapper";
import Clients from "./pages/Clients";
import ClientDetails from "./pages/clients/Details";
import Assistance from "./pages/Assistance";
import NouveauAssistance from "./pages/assistance/Nouveau";
import AssistanceDetails from "./pages/assistance/Details";
import Assurances from "./pages/Assurances";
import Factures from "./pages/Factures";
import Calendrier from "./pages/Calendrier";
import Statistiques from "./pages/Statistiques";
import Revenus from "./pages/Revenus";
import Charges from "./pages/Charges";
import Cheques from "./pages/Cheques";
import Alertes from "./pages/Alertes";
import Historique from "./pages/Historique";
import Rapports from "./pages/Rapports";
import Sinistres from "./pages/Sinistres";
import NouveauSinistre from "./pages/sinistres/Nouveau";
import SinistreDetails from "./pages/sinistres/Details";
import ModifierSinistre from "./pages/sinistres/Modifier";
import Infractions from "./pages/Infractions";
import NouvelleInfraction from "./pages/infractions/Nouveau";
import InfractionDetails from "./pages/infractions/Details";
import ModifierInfraction from "./pages/infractions/Modifier";
import Auth from "./pages/Auth";
import Utilisateurs from "./pages/Utilisateurs";
import Parametres from "./pages/Parametres";
import NotFound from "./pages/NotFound";
import ContractTemplate from "./pages/ContractTemplate";
import AssistanceContractTemplate from "./pages/AssistanceContractTemplate";
import AssistanceDossierTemplate from "./pages/AssistanceDossierTemplate";
import AssistanceFactureTemplate from "./pages/AssistanceFactureTemplate";

const queryClient = new QueryClient();

function ProtectedRoute({ children, requiredPermission }: { children: React.ReactNode; requiredPermission?: string }) {
  const { user, loading: authLoading } = useAuth();
  const { hasPermission, loading: permLoading } = usePermissions();

  if (authLoading || permLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (requiredPermission && !hasPermission(requiredPermission as any)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole();

  if (authLoading || roleLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route
              path="/"
              element={
                <ProtectedRoute requiredPermission="dashboard.view">
                  <Layout><Dashboard /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/calendrier"
              element={
                <ProtectedRoute>
                  <Layout><Calendrier /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/locations"
              element={
                <ProtectedRoute requiredPermission="contracts.view">
                  <Layout><Locations /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/locations/nouveau"
              element={
                <ProtectedRoute requiredPermission="contracts.create">
                  <Layout><NouveauLocation /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/locations/:id"
              element={
                <ProtectedRoute requiredPermission="contracts.view">
                  <Layout><LocationDetails /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/vehicules"
              element={
                <ProtectedRoute requiredPermission="vehicles.view">
                  <Layout><Vehicules /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/vehicules/nouveau"
              element={
                <ProtectedRoute requiredPermission="vehicles.create">
                  <Layout><NouveauVehicule /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/vehicules/:id/workflow"
              element={
                <ProtectedRoute requiredPermission="vehicles.create">
                  <Layout><WorkflowWrapper /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/vehicules/:id/modifier"
              element={
                <AdminRoute>
                  <Layout><ModifierVehicule /></Layout>
                </AdminRoute>
              }
            />
            <Route
              path="/vehicules/:id/modifier-simple"
              element={
                <ProtectedRoute requiredPermission="vehicles.update_km">
                  <Layout><ModifierVehiculeSimple /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/vehicules/:id"
              element={
                <ProtectedRoute requiredPermission="vehicles.view">
                  <Layout><VehiculeDetails /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/clients"
              element={
                <ProtectedRoute requiredPermission="clients.view">
                  <Layout><Clients /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/clients/:id"
              element={
                <ProtectedRoute requiredPermission="clients.view">
                  <Layout><ClientDetails /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/assistance"
              element={
                <ProtectedRoute requiredPermission="assistance.view">
                  <Layout><Assistance /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/assistance/nouveau"
              element={
                <ProtectedRoute requiredPermission="assistance.create">
                  <Layout><NouveauAssistance /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/assistance/:id"
              element={
                <ProtectedRoute requiredPermission="assistance.view">
                  <Layout><AssistanceDetails /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/assurances"
              element={
                <ProtectedRoute requiredPermission="assistance.view">
                  <Layout><Assurances /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/factures"
              element={
                <ProtectedRoute requiredPermission="assistance.view">
                  <Layout><Factures /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/statistiques"
              element={
                <ProtectedRoute>
                  <Layout><Statistiques /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/revenus"
              element={
                <ProtectedRoute>
                  <Layout><Revenus /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/charges"
              element={
                <ProtectedRoute requiredPermission="expenses.view">
                  <Layout><Charges /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/cheques"
              element={
                <ProtectedRoute requiredPermission="expenses.view">
                  <Layout><Cheques /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/alertes"
              element={
                <ProtectedRoute>
                  <Layout><Alertes /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/historique"
              element={
                <ProtectedRoute>
                  <Layout><Historique /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/rapports"
              element={
                <ProtectedRoute>
                  <Layout><Rapports /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/sinistres"
              element={
                <ProtectedRoute requiredPermission="sinistres.view">
                  <Layout><Sinistres /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/sinistres/nouveau"
              element={
                <ProtectedRoute requiredPermission="sinistres.create">
                  <Layout><NouveauSinistre /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/sinistres/:id"
              element={
                <ProtectedRoute requiredPermission="sinistres.view">
                  <Layout><SinistreDetails /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/sinistres/:id/modifier"
              element={
                <ProtectedRoute requiredPermission="sinistres.update">
                  <Layout><ModifierSinistre /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/infractions"
              element={
                <ProtectedRoute requiredPermission="infractions.view">
                  <Layout><Infractions /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/infractions/nouveau"
              element={
                <ProtectedRoute requiredPermission="infractions.create">
                  <Layout><NouvelleInfraction /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/infractions/:id"
              element={
                <ProtectedRoute requiredPermission="infractions.view">
                  <Layout><InfractionDetails /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/infractions/:id/modifier"
              element={
                <ProtectedRoute requiredPermission="infractions.update">
                  <Layout><ModifierInfraction /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/utilisateurs"
              element={
                <AdminRoute>
                  <Layout><Utilisateurs /></Layout>
                </AdminRoute>
              }
            />
            <Route
              path="/parametres"
              element={
                <AdminRoute>
                  <Layout><Parametres /></Layout>
                </AdminRoute>
              }
            />
            <Route
              path="/contract-template"
              element={
                <ProtectedRoute>
                  <ContractTemplate />
                </ProtectedRoute>
              }
            />
            <Route
              path="/assistance-contract-template"
              element={
                <ProtectedRoute>
                  <AssistanceContractTemplate />
                </ProtectedRoute>
              }
            />
            <Route
              path="/assistance-dossier-template"
              element={
                <ProtectedRoute>
                  <AssistanceDossierTemplate />
                </ProtectedRoute>
              }
            />
            <Route
              path="/assistance-facture-template"
              element={
                <ProtectedRoute>
                  <AssistanceFactureTemplate />
                </ProtectedRoute>
              }
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
