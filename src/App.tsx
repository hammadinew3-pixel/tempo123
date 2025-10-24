import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { TenantProvider } from "./contexts/TenantContext";
import { Layout } from "./components/layout/Layout";
import { AdminLayout } from "./components/layout/AdminLayout";
import { SuperAdminRoute } from "./components/SuperAdminRoute";
import { AssistanceRoute } from "./components/AssistanceRoute";
import { SubscriptionGuard } from "./components/SubscriptionGuard";
import { useSuperAdmin } from "./hooks/use-super-admin";
import LoginSuperAdmin from "./pages/admin/LoginSuperAdmin";
import AdminDashboard from "./pages/admin/Dashboard";
import TenantsList from "./pages/admin/TenantsList";
import TenantDetails from "./pages/admin/TenantDetails";
import AdminUsers from "./pages/admin/Users";
import AdminSettings from "./pages/admin/Settings";
import AdminPlans from "./pages/admin/Plans";
import DemandesAbonnement from "./pages/admin/DemandesAbonnement";
import DemandesChangementPack from "./pages/admin/DemandesChangementPack";
import AdminRevenus from "./pages/admin/Revenus";
import Dashboard from "./pages/Dashboard";
import Tenants from "./pages/admin/Tenants";
import Suspended from "./pages/Suspended";
import Register from "./pages/Register";
import ChoisirPack from "./pages/ChoisirPack";
import Paiement from "./pages/Paiement";
import AttenteValidation from "./pages/AttenteValidation";
import Locations from "./pages/Locations";
import NouveauLocation from "./pages/locations/Nouveau";
import LocationDetails from "./pages/locations/Details";
import Vehicules from "./pages/Vehicules";
import VehiculeDetails from "./pages/vehicles/Details";
import NouveauVehicule from "./pages/vehicles/Nouveau";
import ModifierVehicule from "./pages/vehicles/Modifier";
import WorkflowWrapper from "./pages/vehicles/WorkflowWrapper";
import Clients from "./pages/Clients";
import ClientDetails from "./pages/clients/Details";
import Assistance from "./pages/Assistance";
import NouveauAssistance from "./pages/assistance/Nouveau";
import AssistanceDetails from "./pages/assistance/Details";
import Assurances from "./pages/Assurances";
import Factures from "./pages/Factures";
import Calendrier from "./pages/Calendrier";
import Revenus from "./pages/Revenus";
import Charges from "./pages/Charges";
import Cheques from "./pages/Cheques";
import Maintenance from "./pages/Maintenance";
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
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import Utilisateurs from "./pages/Utilisateurs";
import Parametres from "./pages/Parametres";
import MonAbonnement from "./pages/MonAbonnement";
import Onboarding from "./pages/Onboarding";

import NotFound from "./pages/NotFound";
import ContractTemplate from "./pages/ContractTemplate";
import AssistanceContractTemplate from "./pages/AssistanceContractTemplate";
import AssistanceDossierTemplate from "./pages/AssistanceDossierTemplate";
import AssistanceFactureTemplate from "./pages/AssistanceFactureTemplate";
import LocationFactureTemplate from "./pages/LocationFactureTemplate";
import AssistanceCompletTemplate from "./pages/AssistanceCompletTemplate";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}

function RootRedirect() {
  const { isSuperAdmin, loading } = useSuperAdmin();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  if (isSuperAdmin) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <Navigate to="/dashboard" replace />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <TenantProvider>
            <Routes>
            {/* Routes publiques */}
            <Route path="/auth" element={<Auth />} />
            <Route path="/auth/forgot-password" element={<ForgotPassword />} />
            <Route path="/auth/reset-password" element={<ResetPassword />} />
            <Route path="/register" element={<Register />} />
            <Route path="/choisir-pack" element={<ChoisirPack />} />
            <Route path="/paiement" element={<Paiement />} />
            <Route path="/attente-validation" element={<AttenteValidation />} />
            <Route path="/admin/login" element={<LoginSuperAdmin />} />
            <Route
              path="/onboarding"
              element={
                <ProtectedRoute>
                  <Onboarding />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <RootRedirect />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <SubscriptionGuard>
                    <Layout><Dashboard /></Layout>
                  </SubscriptionGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="/calendrier"
              element={
                <ProtectedRoute>
                  <SubscriptionGuard>
                    <Layout><Calendrier /></Layout>
                  </SubscriptionGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="/locations"
              element={
                <ProtectedRoute>
                  <SubscriptionGuard>
                    <Layout><Locations /></Layout>
                  </SubscriptionGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="/locations/nouveau"
              element={
                <ProtectedRoute>
                  <SubscriptionGuard>
                    <Layout><NouveauLocation /></Layout>
                  </SubscriptionGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="/locations/:id"
              element={
                <ProtectedRoute>
                  <SubscriptionGuard>
                    <Layout><LocationDetails /></Layout>
                  </SubscriptionGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="/vehicules"
              element={
                <ProtectedRoute>
                  <SubscriptionGuard>
                    <Layout><Vehicules /></Layout>
                  </SubscriptionGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="/vehicules/nouveau"
              element={
                <ProtectedRoute>
                  <SubscriptionGuard>
                    <Layout><NouveauVehicule /></Layout>
                  </SubscriptionGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="/vehicules/:id/workflow"
              element={
                <ProtectedRoute>
                  <SubscriptionGuard>
                    <Layout><WorkflowWrapper /></Layout>
                  </SubscriptionGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="/vehicules/:id/modifier"
              element={
                <ProtectedRoute>
                  <SubscriptionGuard>
                    <Layout><ModifierVehicule /></Layout>
                  </SubscriptionGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="/vehicules/:id"
              element={
                <ProtectedRoute>
                  <SubscriptionGuard>
                    <Layout><VehiculeDetails /></Layout>
                  </SubscriptionGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="/clients"
              element={
                <ProtectedRoute>
                  <SubscriptionGuard>
                    <Layout><Clients /></Layout>
                  </SubscriptionGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="/clients/:id"
              element={
                <ProtectedRoute>
                  <SubscriptionGuard>
                    <Layout><ClientDetails /></Layout>
                  </SubscriptionGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="/assistance"
              element={
                <ProtectedRoute>
                  <SubscriptionGuard>
                    <Layout>
                      <AssistanceRoute>
                        <Assistance />
                      </AssistanceRoute>
                    </Layout>
                  </SubscriptionGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="/assistance/nouveau"
              element={
                <ProtectedRoute>
                  <Layout>
                    <AssistanceRoute>
                      <NouveauAssistance />
                    </AssistanceRoute>
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/assistance/:id"
              element={
                <ProtectedRoute>
                  <Layout>
                    <AssistanceRoute>
                      <AssistanceDetails />
                    </AssistanceRoute>
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/assurances"
              element={
                <ProtectedRoute>
                  <Layout>
                    <AssistanceRoute>
                      <Assurances />
                    </AssistanceRoute>
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/factures"
              element={
                <ProtectedRoute>
                  <Layout>
                    <AssistanceRoute>
                      <Factures />
                    </AssistanceRoute>
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/revenus"
              element={
                <ProtectedRoute>
                  <SubscriptionGuard>
                    <Layout><Revenus /></Layout>
                  </SubscriptionGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="/charges"
              element={
                <ProtectedRoute>
                  <SubscriptionGuard>
                    <Layout><Charges /></Layout>
                  </SubscriptionGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="/cheques"
              element={
                <ProtectedRoute>
                  <SubscriptionGuard>
                    <Layout><Cheques /></Layout>
                  </SubscriptionGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="/maintenance"
              element={
                <ProtectedRoute>
                  <SubscriptionGuard>
                    <Layout><Maintenance /></Layout>
                  </SubscriptionGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="/alertes"
              element={
                <ProtectedRoute>
                  <SubscriptionGuard>
                    <Layout><Alertes /></Layout>
                  </SubscriptionGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="/historique"
              element={
                <ProtectedRoute>
                  <SubscriptionGuard>
                    <Layout><Historique /></Layout>
                  </SubscriptionGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="/rapports"
              element={
                <ProtectedRoute>
                  <SubscriptionGuard>
                    <Layout><Rapports /></Layout>
                  </SubscriptionGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="/sinistres"
              element={
                <ProtectedRoute>
                  <SubscriptionGuard>
                    <Layout><Sinistres /></Layout>
                  </SubscriptionGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="/sinistres/nouveau"
              element={
                <ProtectedRoute>
                  <Layout><NouveauSinistre /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/sinistres/:id"
              element={
                <ProtectedRoute>
                  <Layout><SinistreDetails /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/sinistres/:id/modifier"
              element={
                <ProtectedRoute>
                  <Layout><ModifierSinistre /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/infractions"
              element={
                <ProtectedRoute>
                  <Layout><Infractions /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/infractions/nouveau"
              element={
                <ProtectedRoute>
                  <Layout><NouvelleInfraction /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/infractions/:id"
              element={
                <ProtectedRoute>
                  <Layout><InfractionDetails /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/infractions/:id/modifier"
              element={
                <ProtectedRoute>
                  <Layout><ModifierInfraction /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/utilisateurs"
              element={
                <ProtectedRoute>
                  <SubscriptionGuard>
                    <Layout><Utilisateurs /></Layout>
                  </SubscriptionGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="/parametres"
              element={
                <ProtectedRoute>
                  <SubscriptionGuard>
                    <Layout><Parametres /></Layout>
                  </SubscriptionGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="/mon-abonnement"
              element={
                <ProtectedRoute>
                  <SubscriptionGuard>
                    <Layout><MonAbonnement /></Layout>
                  </SubscriptionGuard>
                </ProtectedRoute>
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
                  <AssistanceRoute>
                    <AssistanceDossierTemplate />
                  </AssistanceRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/assistance-facture-template"
              element={
                <ProtectedRoute>
                  <AssistanceRoute>
                    <AssistanceFactureTemplate />
                  </AssistanceRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/location-facture-template"
              element={<LocationFactureTemplate />}
            />
            <Route
              path="/assistance-complet-template"
              element={
                <ProtectedRoute>
                  <AssistanceRoute>
                    <AssistanceCompletTemplate />
                  </AssistanceRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/suspended"
              element={
                <ProtectedRoute>
                  <Suspended />
                </ProtectedRoute>
              }
            />
            {/* Super Admin Routes */}
            <Route path="/admin" element={<SuperAdminRoute />}>
              <Route
                path="dashboard"
                element={
                  <AdminLayout>
                    <AdminDashboard />
                  </AdminLayout>
                }
              />
            <Route
              path="tenants"
              element={
                <AdminLayout>
                  <TenantsList />
                </AdminLayout>
              }
            />
            <Route
              path="tenants/:id"
              element={
                <AdminLayout>
                  <TenantDetails />
                </AdminLayout>
              }
            />
            <Route
              path="users"
              element={
                <AdminLayout>
                  <AdminUsers />
                </AdminLayout>
              }
            />
          <Route
            path="settings"
            element={
              <AdminLayout>
                <AdminSettings />
              </AdminLayout>
            }
          />
          <Route
            path="plans"
            element={
              <AdminLayout>
                <AdminPlans />
              </AdminLayout>
            }
          />
          <Route
            path="demandes-abonnement"
            element={
              <AdminLayout>
                <DemandesAbonnement />
              </AdminLayout>
            }
          />
          <Route
            path="demandes-changement"
            element={
              <AdminLayout>
                <DemandesChangementPack />
              </AdminLayout>
            }
          />
          <Route
            path="revenus"
            element={
              <AdminLayout>
                <AdminRevenus />
              </AdminLayout>
            }
          />
        </Route>
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
            </Routes>
          </TenantProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
