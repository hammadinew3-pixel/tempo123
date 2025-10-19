import { useTenantPlan } from "@/hooks/useTenantPlan";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface AssistanceRouteProps {
  children: React.ReactNode;
}

export function AssistanceRoute({ children }: AssistanceRouteProps) {
  const { data: planData, isLoading, hasModuleAccess } = useTenantPlan();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  // Vérifier si le module Assistance est accessible
  if (!hasModuleAccess('assistance')) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Alert variant="destructive" className="max-w-2xl mx-auto">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Accès refusé</AlertTitle>
          <AlertDescription>
            Le module Assistance n'est pas inclus dans votre plan actuel.
            Veuillez contacter votre administrateur pour mettre à niveau votre abonnement.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return <>{children}</>;
}
