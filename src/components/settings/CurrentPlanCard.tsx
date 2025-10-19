import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Layers, AlertCircle } from "lucide-react";
import { useTenantPlan } from "@/hooks/useTenantPlan";
import { Skeleton } from "@/components/ui/skeleton";

interface CurrentPlanCardProps {
  onChangePlan: () => void;
}

export function CurrentPlanCard({ onChangePlan }: CurrentPlanCardProps) {
  const { data: planData, isLoading } = useTenantPlan();

  if (isLoading) {
    return (
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <Skeleton className="h-8 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!planData) {
    return null;
  }

  const { plan, usage, modules } = planData;

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-emerald-400 text-2xl">
            {plan ? plan.name : "Aucun plan actif"}
          </CardTitle>
          {plan && (
            <p className="text-gray-400 text-sm mt-1">
              {plan.price} {plan.currency} / mois
            </p>
          )}
        </div>
        <Button 
          onClick={onChangePlan}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          <Layers className="h-4 w-4 mr-2" />
          Changer de plan
        </Button>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Section Quotas */}
        <div>
          <h4 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
            📊 Utilisation des quotas
          </h4>
          <div className="space-y-4">
            {/* Véhicules */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-400 flex items-center gap-2">
                  🚗 Véhicules
                </span>
                <span className="text-white font-medium">
                  {usage.vehicles.current} / {usage.vehicles.max}
                </span>
              </div>
              <Progress value={usage.vehicles.percentage} className="h-2" />
              {usage.vehicles.percentage > 80 && (
                <p className="text-xs text-orange-400 mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Proche de la limite
                </p>
              )}
            </div>

            {/* Utilisateurs */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-400 flex items-center gap-2">
                  👥 Utilisateurs
                </span>
                <span className="text-white font-medium">
                  {usage.users.current} / {usage.users.max}
                </span>
              </div>
              <Progress value={usage.users.percentage} className="h-2" />
            </div>

            {/* Contrats */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-400 flex items-center gap-2">
                  📋 Contrats
                </span>
                <span className="text-white font-medium">
                  {usage.contracts.current} / {usage.contracts.max}
                </span>
              </div>
              <Progress value={usage.contracts.percentage} className="h-2" />
            </div>

            {/* Clients */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-400 flex items-center gap-2">
                  👤 Clients
                </span>
                <span className="text-white font-medium">
                  {usage.clients.current} / {usage.clients.max}
                </span>
              </div>
              <Progress value={usage.clients.percentage} className="h-2" />
            </div>
          </div>
        </div>

        {/* Section Modules */}
        {plan && (
          <div>
            <h4 className="text-sm font-semibold text-gray-300 mb-3">🔌 Modules activés</h4>
            <div className="flex flex-wrap gap-2">
              {modules.assistance && (
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                  🆘 Assistance
                </Badge>
              )}
              {modules.sinistres && (
                <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20">
                  🚗 Sinistres
                </Badge>
              )}
              {modules.infractions && (
                <Badge variant="outline" className="bg-orange-500/10 text-orange-400 border-orange-500/20">
                  ⚠️ Infractions
                </Badge>
              )}
              {modules.alertes && (
                <Badge variant="outline" className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20">
                  🔔 Alertes
                </Badge>
              )}
              {modules.rapports && (
                <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/20">
                  📊 Rapports
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
