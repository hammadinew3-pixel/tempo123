import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CreditCard, AlertCircle } from "lucide-react";
import { useTenantPlan } from "@/hooks/useTenantPlan";
import { Skeleton } from "@/components/ui/skeleton";

export default function MonAbonnement() {
  const { data: planData, isLoading } = useTenantPlan();

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <CreditCard className="w-8 h-8 text-emerald-500" />
          Mon Abonnement
        </h1>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!planData?.plan) {
    return (
      <div className="p-6 space-y-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <CreditCard className="w-8 h-8 text-emerald-500" />
          Mon Abonnement
        </h1>
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-8 text-center">
            <p className="text-gray-400 mb-6">
              Aucun abonnement actif pour le moment.
            </p>
            <Button 
              asChild 
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <a href="https://crsapp.ma/tarifs" target="_blank" rel="noopener noreferrer">
                Choisir un plan
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { plan, usage, modules } = planData;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <CreditCard className="w-8 h-8 text-emerald-500" />
          Mon Abonnement
        </h1>
        <p className="text-muted-foreground mt-1">
          Gérez votre plan et consultez vos quotas
        </p>
      </div>

      {/* Plan actuel */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-emerald-400 text-2xl">
              {plan.name}
            </CardTitle>
            <p className="text-gray-400 text-sm mt-1">
              {plan.price} {plan.currency} / mois
            </p>
          </div>
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
            Actif
          </Badge>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Quotas d'utilisation */}
          <div>
            <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
              📊 Utilisation des quotas
            </h3>
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

          {/* Modules inclus */}
          <div>
            <h3 className="text-sm font-semibold text-gray-300 mb-3">🔌 Modules inclus</h3>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20">
                🚗 Sinistres ✓
              </Badge>
              <Badge variant="outline" className="bg-orange-500/10 text-orange-400 border-orange-500/20">
                ⚠️ Infractions ✓
              </Badge>
              <Badge variant="outline" className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20">
                🔔 Alertes ✓
              </Badge>
              <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/20">
                📊 Rapports ✓
              </Badge>
              
              {/* Module premium */}
              <Badge 
                variant={modules.assistance ? "outline" : "secondary"} 
                className={modules.assistance 
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                  : "bg-slate-700/50 text-slate-400 border-slate-600/20"
                }
              >
                🆘 Assistance/Assurance {modules.assistance ? '✓' : '✗'}
              </Badge>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end pt-4 border-t border-slate-800">
            <Button
              asChild
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <a href="https://crsapp.ma/tarifs" target="_blank" rel="noopener noreferrer">
                Mettre à jour mon plan
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
