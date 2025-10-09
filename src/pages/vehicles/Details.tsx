import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { VehicleHeader } from "@/components/vehicles/VehicleHeader";
import { StatsCards } from "@/components/vehicles/StatsCards";
import { VehicleInfoCard } from "@/components/vehicles/VehicleInfoCard";
import { AlertsCard } from "@/components/vehicles/AlertsCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar, FileText, Settings } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

type Vehicle = Database['public']['Tables']['vehicles']['Row'];

export default function VehiculeDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [contracts, setContracts] = useState<any[]>([]);
  const [assistances, setAssistances] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [insurances, setInsurances] = useState<any[]>([]);
  const [technicalInspections, setTechnicalInspections] = useState<any[]>([]);
  const [vignettes, setVignettes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showContractsList, setShowContractsList] = useState(false);
  const [showExpensesList, setShowExpensesList] = useState(false);

  useEffect(() => {
    if (id) {
      loadVehicle();
    }
  }, [id]);

  const loadVehicle = async () => {
    try {
      const [vehicleRes, contractsRes, assistancesRes, expensesRes, insurancesRes, inspectionsRes, vignettesRes] = await Promise.all([
        supabase.from('vehicles').select('*').eq('id', id).single(),
        supabase.from('contracts').select(`*, clients (nom, prenom, telephone)`).eq('vehicle_id', id).order('created_at', { ascending: false }),
        supabase.from('assistance').select(`*, clients (nom, prenom, telephone)`).eq('vehicle_id', id).order('created_at', { ascending: false }),
        supabase.from('expenses').select('*').eq('vehicle_id', id).order('date_depense', { ascending: false }),
        supabase.from('vehicle_insurance').select('*').eq('vehicle_id', id).order('date_debut', { ascending: false }),
        supabase.from('vehicle_technical_inspection').select('*').eq('vehicle_id', id).order('date_visite', { ascending: false }),
        supabase.from('vehicle_vignette').select('*').eq('vehicle_id', id).order('annee', { ascending: false })
      ]);

      if (vehicleRes.error) throw vehicleRes.error;
      
      setVehicle(vehicleRes.data);
      setContracts(contractsRes.data || []);
      setAssistances(assistancesRes.data || []);
      setExpenses(expensesRes.data || []);
      setInsurances(insurancesRes.data || []);
      setTechnicalInspections(inspectionsRes.data || []);
      setVignettes(vignettesRes.data || []);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les détails du véhicule",
        variant: "destructive"
      });
      navigate('/vehicules');
    } finally {
      setLoading(false);
    }
  };

  const handleVehicleUpdate = async (data: Partial<Vehicle>) => {
    try {
      const { error } = await supabase
        .from('vehicles')
        .update(data)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Les informations du véhicule ont été mises à jour"
      });

      await loadVehicle();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const calculateTotalRevenue = () => {
    const contractRevenue = contracts.reduce((sum, contract) => sum + (contract.total_amount || 0), 0);
    const assistanceRevenue = assistances.reduce((sum, assistance) => sum + (assistance.montant_facture || assistance.montant_total || 0), 0);
    return contractRevenue + assistanceRevenue;
  };

  const calculateTotalExpenses = () => {
    return expenses.reduce((sum, expense) => sum + (expense.montant || 0), 0);
  };

  const getTotalReservations = () => {
    return contracts.length + assistances.length;
  };

  const getAlerts = () => {
    const alerts = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (!vehicle?.assurance_expire_le) {
      alerts.push({ message: "Véhicule sans assurance ajoutée.", action: "CRÉER ASSURANCE" });
    } else {
      const expirationDate = new Date(vehicle.assurance_expire_le);
      expirationDate.setHours(0, 0, 0, 0);
      if (expirationDate < today) {
        alerts.push({ message: "Assurance expirée.", action: "CRÉER ASSURANCE" });
      }
    }

    if (!vehicle?.visite_technique_expire_le) {
      alerts.push({ message: "Véhicule sans visite technique ajoutée.", action: "CRÉER VISITE" });
    } else {
      const expirationDate = new Date(vehicle.visite_technique_expire_le);
      expirationDate.setHours(0, 0, 0, 0);
      if (expirationDate < today) {
        alerts.push({ message: "Visite technique expirée.", action: "CRÉER VISITE" });
      }
    }

    if (!vehicle?.vignette_expire_le) {
      alerts.push({ message: "Véhicule sans autorisation ajoutée.", action: "CRÉER AUTORISATION" });
    } else {
      const expirationDate = new Date(vehicle.vignette_expire_le);
      expirationDate.setHours(0, 0, 0, 0);
      if (expirationDate < today) {
        alerts.push({ message: "Autorisation expirée.", action: "CRÉER AUTORISATION" });
      }
    }

    return alerts;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!vehicle) {
    return null;
  }

  const alerts = getAlerts();
  const totalRevenue = calculateTotalRevenue();
  const totalExpenses = calculateTotalExpenses();
  const totalReservations = getTotalReservations();

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <VehicleHeader 
        vehicle={vehicle} 
        onEdit={() => navigate(`/vehicules/${id}/workflow`)} 
      />

      <StatsCards
        totalRevenue={totalRevenue}
        totalExpenses={totalExpenses}
        totalReservations={totalReservations}
        onRevenueClick={() => setShowContractsList(true)}
        onExpensesClick={() => setShowExpensesList(true)}
        onReservationsClick={() => setShowContractsList(true)}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <VehicleInfoCard vehicle={vehicle} onUpdate={handleVehicleUpdate} />
        <AlertsCard alerts={alerts} />
      </div>

      {/* Interventions Section */}
      <Card className="animate-fade-in">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" />
            <CardTitle>Interventions & Maintenance</CardTitle>
          </div>
          <Button variant="outline" size="sm">
            Ajouter
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {insurances.length > 0 && (
              <div className="p-4 bg-muted/50 rounded-lg">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Assurances ({insurances.length})
                </h4>
                <div className="text-sm text-muted-foreground">
                  Dernière: {insurances[0]?.assureur || 'N/A'}
                </div>
              </div>
            )}
            {technicalInspections.length > 0 && (
              <div className="p-4 bg-muted/50 rounded-lg">
                <h4 className="font-semibold mb-2">Visites techniques ({technicalInspections.length})</h4>
                <div className="text-sm text-muted-foreground">
                  Dernière: {technicalInspections[0]?.centre_controle || 'N/A'}
                </div>
              </div>
            )}
            {vignettes.length > 0 && (
              <div className="p-4 bg-muted/50 rounded-lg">
                <h4 className="font-semibold mb-2">Vignettes ({vignettes.length})</h4>
                <div className="text-sm text-muted-foreground">
                  Dernière: {vignettes[0]?.annee || 'N/A'}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Rental History Section */}
      <Card className="animate-fade-in">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            <CardTitle>Historique des locations</CardTitle>
            <Badge variant="secondary">{totalReservations}</Badge>
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowContractsList(true)}>
            Voir tout
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4 text-center">
            <div className="p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-800">
                {(contracts.filter(c => c.statut === 'brouillon').length + 
                  assistances.filter(a => a.etat === 'ouvert').length).toString().padStart(2, '0')}
              </div>
              <div className="text-xs text-muted-foreground mt-1">En attente</div>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-800">
                {(contracts.filter(c => c.statut === 'livre' || c.statut === 'contrat_valide').length + 
                  assistances.filter(a => a.etat === 'livre' || a.etat === 'contrat_valide').length).toString().padStart(2, '0')}
              </div>
              <div className="text-xs text-muted-foreground mt-1">En cours</div>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-800">
                {(contracts.filter(c => c.statut === 'retour_effectue' || c.statut === 'termine').length + 
                  assistances.filter(a => a.etat === 'retour_effectue' || a.etat === 'cloture').length).toString().padStart(2, '0')}
              </div>
              <div className="text-xs text-muted-foreground mt-1">Terminées</div>
            </div>
            <div className="p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-800">
                {(contracts.filter(c => c.statut === 'annule').length + 
                  assistances.filter(a => a.etat === 'annule').length).toString().padStart(2, '0')}
              </div>
              <div className="text-xs text-muted-foreground mt-1">Annulées</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contracts Dialog */}
      <Dialog open={showContractsList} onOpenChange={setShowContractsList}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Historique des locations - {vehicle.immatriculation}</span>
              <Badge variant="secondary">{totalReservations} réservations</Badge>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-3 mt-4">
            {[...contracts, ...assistances].map((item) => (
              <div
                key={item.id}
                className="border rounded-lg p-4 hover:bg-muted/50 cursor-pointer transition-all hover-scale"
                onClick={() => {
                  setShowContractsList(false);
                  navigate('numero_contrat' in item ? `/locations/${item.id}` : `/assistance/${item.id}`);
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge className="bg-blue-100 text-blue-800">
                      {'numero_contrat' in item ? 'Location' : 'Assistance'}
                    </Badge>
                    <span className="font-mono text-sm">
                      {'numero_contrat' in item ? item.numero_contrat : item.num_dossier}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">
                      {('total_amount' in item ? item.total_amount : item.montant_total)?.toFixed(2) || '0.00'} DH
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(item.created_at), 'dd/MM/yyyy', { locale: fr })}
                    </div>
                  </div>
                </div>
                <div className="mt-2 text-sm text-muted-foreground">
                  Client: {item.clients?.nom} {item.clients?.prenom}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Expenses Dialog */}
      <Dialog open={showExpensesList} onOpenChange={setShowExpensesList}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Dépenses - {vehicle.immatriculation}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-2 mt-4">
            {expenses.map((expense) => (
              <div key={expense.id} className="border rounded-lg p-3 flex items-center justify-between hover:bg-muted/50">
                <div>
                  <div className="font-semibold">{expense.categorie}</div>
                  <div className="text-sm text-muted-foreground">{expense.description}</div>
                  <div className="text-xs text-muted-foreground">
                    {format(new Date(expense.date_depense), 'dd/MM/yyyy', { locale: fr })}
                  </div>
                </div>
                <div className="font-semibold text-red-600">
                  {expense.montant.toFixed(2)} DH
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
