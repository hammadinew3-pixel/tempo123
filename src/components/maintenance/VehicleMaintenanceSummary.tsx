import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Wrench, AlertCircle, CheckCircle2, XCircle, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format, addDays } from "date-fns";
import { fr } from "date-fns/locale";
import { AddInterventionDialog } from "./AddInterventionDialog";
import { useNavigate } from "react-router-dom";

interface VehicleMaintenanceSummaryProps {
  vehicleId: string;
  currentKm: number;
  dateLastVidange?: string | null;
  kmLastVidange?: number | null;
  nextKmVidange?: number | null;
}

const TYPES_INTERVENTION = [
  "Tous",
  "Vidange",
  "Freins",
  "Pneus",
  "Révision",
  "Climatisation",
  "Batterie",
  "Courroie",
  "Autre"
];

export function VehicleMaintenanceSummary({ 
  vehicleId, 
  currentKm, 
  dateLastVidange, 
  kmLastVidange,
  nextKmVidange 
}: VehicleMaintenanceSummaryProps) {
  const navigate = useNavigate();
  const [showInterventionDialog, setShowInterventionDialog] = useState(false);
  const [interventionType, setInterventionType] = useState<string | undefined>();
  const [interventions, setInterventions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState("Tous");

  useEffect(() => {
    loadInterventions();
  }, [vehicleId]);

  const loadInterventions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("interventions")
        .select("*, depense_id")
        .eq("vehicle_id", vehicleId)
        .order("date_intervention", { ascending: false });

      if (error) throw error;
      setInterventions(data || []);
    } catch (error) {
      console.error("Erreur lors du chargement des interventions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddVidange = () => {
    setInterventionType("Vidange");
    setShowInterventionDialog(true);
  };

  const handleAddIntervention = () => {
    setInterventionType(undefined);
    setShowInterventionDialog(true);
  };

  const calculateNextVidange = () => {
    if (nextKmVidange) {
      return {
        km: nextKmVidange,
        kmRemaining: nextKmVidange - currentKm
      };
    }
    
    const defaultInterval = 10000;
    const nextKm = (kmLastVidange || 0) + defaultInterval;
    return {
      km: nextKm,
      kmRemaining: nextKm - currentKm
    };
  };

  const calculateNextVidangeDate = () => {
    if (!dateLastVidange) return null;
    const lastDate = new Date(dateLastVidange);
    const nextDate = addDays(lastDate, 180); // 6 months
    return nextDate;
  };

  const getVidangeAlertLevel = () => {
    const { kmRemaining } = calculateNextVidange();
    if (kmRemaining <= 0) return "critical";
    if (kmRemaining <= 1000) return "warning";
    return "ok";
  };

  const filteredInterventions = interventions.filter(intervention => 
    filterType === "Tous" || intervention.type_intervention === filterType
  );

  const nextVidange = calculateNextVidange();
  const nextVidangeDate = calculateNextVidangeDate();
  const alertLevel = getVidangeAlertLevel();

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="w-5 h-5" />
            Maintenance & Interventions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Résumé Vidange */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Vidange</h3>
              <Button onClick={handleAddVidange} size="sm" className="gap-2">
                <Plus className="w-4 h-4" />
                Ajouter une vidange
              </Button>
            </div>

            {alertLevel !== "ok" && (
              <Alert variant={alertLevel === "critical" ? "destructive" : "default"}>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {alertLevel === "critical" 
                    ? "Vidange urgente ! Le kilométrage prévu est dépassé."
                    : "Vidange à prévoir bientôt (moins de 1000 km)."}
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Dernière vidange</p>
                <p className="font-medium">
                  {dateLastVidange 
                    ? format(new Date(dateLastVidange), "dd/MM/yyyy", { locale: fr })
                    : "—"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {kmLastVidange ? `${kmLastVidange.toLocaleString()} km` : "—"}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Prochaine vidange</p>
                <p className="font-medium">
                  {nextVidangeDate 
                    ? format(nextVidangeDate, "dd/MM/yyyy", { locale: fr })
                    : "À définir"}
                </p>
                <p className={`text-sm font-medium ${
                  alertLevel === "critical" ? "text-destructive" :
                  alertLevel === "warning" ? "text-orange-600 dark:text-orange-400" :
                  "text-muted-foreground"
                }`}>
                  {nextVidange.km.toLocaleString()} km ({nextVidange.kmRemaining > 0 ? "-" : "+"}{Math.abs(nextVidange.kmRemaining).toLocaleString()} km)
                </p>
              </div>
            </div>
          </div>

          {/* Historique des interventions */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Historique des interventions</h3>
              <div className="flex items-center gap-2">
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TYPES_INTERVENTION.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={handleAddIntervention} size="sm" className="gap-2">
                  <Plus className="w-4 h-4" />
                  Nouvelle intervention
                </Button>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Chargement...
              </div>
            ) : filteredInterventions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  {filterType === "Tous" 
                    ? "Aucune intervention enregistrée"
                    : `Aucune intervention de type "${filterType}"`}
                </p>
              </div>
            ) : (
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Km</TableHead>
                      <TableHead className="text-right">Montant TTC</TableHead>
                      <TableHead>Garage</TableHead>
                      <TableHead>Facturée</TableHead>
                      <TableHead>Dépense</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInterventions.map((intervention) => (
                      <TableRow key={intervention.id}>
                        <TableCell>
                          {format(new Date(intervention.date_intervention), "dd/MM/yyyy", { locale: fr })}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{intervention.type_intervention}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {intervention.kilometrage_actuel.toLocaleString()} km
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {intervention.montant_ttc.toFixed(2)} DH
                        </TableCell>
                        <TableCell>
                          {intervention.garage_externe 
                            ? intervention.nom_garage || "Garage externe"
                            : "Interne"}
                        </TableCell>
                        <TableCell>
                          {intervention.facturee ? (
                            <Badge variant="default" className="gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              Oui
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="gap-1">
                              <XCircle className="w-3 h-3" />
                              Non
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {intervention.depense_id ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate("/charges")}
                              className="gap-1 h-8 px-2"
                            >
                              <ExternalLink className="w-3 h-3" />
                              Voir
                            </Button>
                          ) : (
                            <span className="text-muted-foreground text-sm">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <AddInterventionDialog
        open={showInterventionDialog}
        onOpenChange={setShowInterventionDialog}
        onSuccess={() => {
          loadInterventions();
          window.location.reload(); // Reload to update vehicle data
        }}
        vehicleId={vehicleId}
        defaultType={interventionType}
      />
    </>
  );
}
