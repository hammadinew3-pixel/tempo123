import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { Layout } from "./components/layout/Layout";
import Dashboard from "./pages/Dashboard";
import Locations from "./pages/Locations";
import NouveauLocation from "./pages/locations/Nouveau";
import LocationDetails from "./pages/locations/Details";
import Vehicules from "./pages/Vehicules";
import VehiculeDetails from "./pages/vehicles/Details";
import NouveauVehicule from "./pages/vehicles/Nouveau";
import Clients from "./pages/Clients";
import Factures from "./pages/Factures";
import Calendrier from "./pages/Calendrier";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import ContractTemplate from "./pages/ContractTemplate";

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
                <ProtectedRoute>
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
                <ProtectedRoute>
                  <Layout><Locations /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/locations/nouveau"
              element={
                <ProtectedRoute>
                  <Layout><NouveauLocation /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/locations/:id"
              element={
                <ProtectedRoute>
                  <Layout><LocationDetails /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/vehicules"
              element={
                <ProtectedRoute>
                  <Layout><Vehicules /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/vehicules/nouveau"
              element={
                <ProtectedRoute>
                  <Layout><NouveauVehicule /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/vehicules/:id"
              element={
                <ProtectedRoute>
                  <Layout><VehiculeDetails /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/clients"
              element={
                <ProtectedRoute>
                  <Layout><Clients /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/factures"
              element={
                <ProtectedRoute>
                  <Layout><Factures /></Layout>
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
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
