import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Filter, FileDown, Wrench, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { safeFormatDate } from "@/lib/dateUtils";
import { AddInterventionDialog } from "@/components/maintenance/AddInterventionDialog";
import { MaintenanceStats } from "@/components/maintenance/MaintenanceStats";
import { exportToExcel } from "@/lib/exportUtils";

const TYPES_INTERVENTION = [
  "Vidange",
  "Freins",
  "Pneus",
  "Révision",
  "Climatisation",
  "Batterie",
  "Courroie",
  "Autre"
];

export default function Maintenance() {
  const [interventions, setInterventions] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  
  // Filtres
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [vehicleFilter, setVehicleFilter] = useState<string>("all");
  const [statutFilter, setStatutFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load interventions with vehicle data
      const { data: interventionsData, error: interventionsError } = await supabase
        .from("interventions")
        .select(`
          *,
          vehicles (
            id,
            immatriculation,
            marque,
            modele
          ),
          expenses (
            id,
            montant
          )
        `)
        .order("date_intervention", { ascending: false });

      if (interventionsError) throw interventionsError;

      // Load vehicles for filter
      const { data: vehiclesData, error: vehiclesError } = await supabase
        .from("vehicles")
        .select("id, immatriculation, marque, modele")
        .eq("en_service", true)
        .order("immatriculation");

      if (vehiclesError) throw vehiclesError;

      setInterventions(interventionsData || []);
      setVehicles(vehiclesData || []);
    } catch (error: any) {
      toast.error("Erreur lors du chargement des données");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filteredInterventions = interventions.filter((intervention) => {
    const matchesType = typeFilter === "all" || intervention.type_intervention === typeFilter;
    const matchesVehicle = vehicleFilter === "all" || intervention.vehicle_id === vehicleFilter;
    const matchesStatut = statutFilter === "all" || 
      (statutFilter === "facturee" && intervention.facturee) ||
      (statutFilter === "non_facturee" && !intervention.facturee);
    const matchesSearch = searchTerm === "" || 
      intervention.vehicles?.immatriculation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      intervention.type_intervention.toLowerCase().includes(searchTerm.toLowerCase()) ||
      intervention.nom_garage?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesType && matchesVehicle && matchesStatut && matchesSearch;
  });

  const handleExport = () => {
    const exportData = filteredInterventions.map(i => ({
      "Date": safeFormatDate(i.date_intervention, "dd/MM/yyyy"),
      "Véhicule": i.vehicles?.immatriculation || "-",
      "Type": i.type_intervention,
      "Km": i.kilometrage_actuel,
      "Garage": i.garage_externe ? (i.nom_garage || "Externe") : "Interne",
      "Montant TTC": i.montant_ttc,
      "Facturée": i.facturee ? "Oui" : "Non",
      "Référence": i.reference_facture || "-"
    }));

    exportToExcel(exportData, `interventions_${format(new Date(), "yyyy-MM-dd")}`);
    toast.success("Export réussi");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Wrench className="h-8 w-8 text-primary" />
            Maintenance & Interventions
          </h1>
          <p className="text-muted-foreground mt-1">
            Gestion complète des interventions mécaniques
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExport} variant="outline">
            <FileDown className="h-4 w-4 mr-2" />
            Exporter
          </Button>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle intervention
          </Button>
        </div>
      </div>

      <MaintenanceStats interventions={interventions} />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtres
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Type d'intervention" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                {TYPES_INTERVENTION.map((type) => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={vehicleFilter} onValueChange={setVehicleFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Véhicule" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les véhicules</SelectItem>
                {vehicles.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.immatriculation}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statutFilter} onValueChange={setStatutFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Statut facturation" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="facturee">Facturée</SelectItem>
                <SelectItem value="non_facturee">Non facturée</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            Liste des interventions ({filteredInterventions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center text-muted-foreground py-8">Chargement...</p>
          ) : filteredInterventions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Aucune intervention trouvée
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Véhicule</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Km</TableHead>
                    <TableHead>Garage</TableHead>
                    <TableHead className="text-right">Montant TTC</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInterventions.map((intervention) => (
                    <TableRow key={intervention.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell>
                        {safeFormatDate(intervention.date_intervention, "dd/MM/yyyy", { locale: fr })}
                      </TableCell>
                      <TableCell className="font-medium">
                        {intervention.vehicles?.immatriculation || "-"}
                        <div className="text-xs text-muted-foreground">
                          {intervention.vehicles?.marque} {intervention.vehicles?.modele}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {intervention.type_intervention}
                        </Badge>
                      </TableCell>
                      <TableCell>{intervention.kilometrage_actuel?.toLocaleString()} km</TableCell>
                      <TableCell>
                        {intervention.garage_externe ? (
                          <div>
                            <div className="font-medium">{intervention.nom_garage || "Externe"}</div>
                            {intervention.contact_garage && (
                              <div className="text-xs text-muted-foreground">
                                {intervention.contact_garage}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Interne</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {intervention.montant_ttc?.toLocaleString()} DH
                      </TableCell>
                      <TableCell>
                        {intervention.facturee ? (
                          <Badge className="bg-green-500">Facturée</Badge>
                        ) : (
                          <Badge variant="secondary">Non facturée</Badge>
                        )}
                        {intervention.reference_facture && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {intervention.reference_facture}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <AddInterventionDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSuccess={loadData}
      />
    </div>
  );
}
