import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ChevronRight, Edit, Calendar, TrendingUp, TrendingDown, AlertCircle, FileText, Settings, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

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
  const [activeTab, setActiveTab] = useState("info");
  const [showContractsList, setShowContractsList] = useState(false);

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
        <p className="text-muted-foreground">Chargement...</p>
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
  const netProfit = totalRevenue - totalExpenses;

  const statusBadge = vehicle.statut === 'disponible' ? 'Disponible' :
                     vehicle.statut === 'loue' ? 'Loué' : 
                     vehicle.statut === 'reserve' ? 'Réservé' : 'En panne';
  
  const statusVariant = vehicle.statut === 'disponible' ? 'default' : 
                       vehicle.statut === 'loue' ? 'secondary' : 
                       vehicle.statut === 'reserve' ? 'outline' : 'destructive';

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Détails du véhicule - {vehicle.immatriculation}
          </h1>
          <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-foreground">Tableau de bord</Link>
            <ChevronRight className="w-4 h-4" />
            <Link to="/vehicules" className="hover:text-foreground">Véhicules</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-foreground">{vehicle.marque} {vehicle.modele}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={statusVariant}>{statusBadge}</Badge>
          <Button 
            onClick={() => navigate(`/vehicules/${id}/workflow`)}
          >
            <Edit className="w-4 h-4 mr-2" />
            Modifier
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Revenu Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">
                {totalRevenue.toLocaleString('fr-MA', { minimumFractionDigits: 2 })} DH
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Dépenses Totales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">
                {totalExpenses.toLocaleString('fr-MA', { minimumFractionDigits: 2 })} DH
              </div>
              <TrendingDown className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Bénéfice Net</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">
                {netProfit.toLocaleString('fr-MA', { minimumFractionDigits: 2 })} DH
              </div>
              <FileText className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Réservations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{totalReservations}</div>
              <Calendar className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <Card className="mb-6 border-orange-200 bg-orange-50/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange-600" />
              {alerts.length} alerte{alerts.length > 1 ? 's' : ''} détectée{alerts.length > 1 ? 's' : ''}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {alerts.map((alert, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-white border border-orange-200 rounded">
                <span className="text-sm">{alert.message}</span>
                <Button variant="link" className="text-orange-600 text-xs h-auto p-0">
                  {alert.action}
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <Card>
        <CardHeader>
          <CardTitle>Informations du véhicule</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="info">Informations de base</TabsTrigger>
              <TabsTrigger value="interventions">Interventions</TabsTrigger>
              <TabsTrigger value="locations">Historique locations</TabsTrigger>
              <TabsTrigger value="expenses">Dépenses</TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="mt-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Immatriculation</p>
                    <p className="font-semibold">{vehicle.immatriculation}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Marque</p>
                    <p className="font-semibold">{vehicle.marque}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Modèle</p>
                    <p className="font-semibold">{vehicle.modele}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Année</p>
                    <p className="font-semibold">{vehicle.annee}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Kilométrage</p>
                    <p className="font-semibold">{vehicle.kilometrage.toLocaleString()} km</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Tarif journalier</p>
                    <p className="font-semibold">{vehicle.tarif_journalier.toLocaleString()} DH</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Valeur d'achat</p>
                    <p className="font-semibold">{vehicle.valeur_achat?.toLocaleString() || 'N/A'} DH</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Statut</p>
                    <Badge variant={statusVariant}>{statusBadge}</Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t">
                <div>
                  <p className="text-sm text-muted-foreground">Assurance expire le</p>
                  <p className="font-semibold">
                    {vehicle.assurance_expire_le ? 
                      format(new Date(vehicle.assurance_expire_le), 'dd/MM/yyyy', { locale: fr }) : 
                      'Non défini'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Visite technique expire le</p>
                  <p className="font-semibold">
                    {vehicle.visite_technique_expire_le ? 
                      format(new Date(vehicle.visite_technique_expire_le), 'dd/MM/yyyy', { locale: fr }) : 
                      'Non défini'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Vignette expire le</p>
                  <p className="font-semibold">
                    {vehicle.vignette_expire_le ? 
                      format(new Date(vehicle.vignette_expire_le), 'dd/MM/yyyy', { locale: fr }) : 
                      'Non défini'}
                  </p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="interventions" className="mt-6">
              <div className="space-y-4">
                {/* Assurances */}
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Assurances ({insurances.length})
                  </h3>
                  {insurances.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>N° d'ordre</TableHead>
                          <TableHead>Assureur</TableHead>
                          <TableHead>Date début</TableHead>
                          <TableHead>Date expiration</TableHead>
                          <TableHead>Montant</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {insurances.slice(0, 5).map((insurance) => (
                          <TableRow key={insurance.id}>
                            <TableCell>{insurance.numero_ordre}</TableCell>
                            <TableCell>{insurance.assureur}</TableCell>
                            <TableCell>
                              {insurance.date_debut ? format(new Date(insurance.date_debut), 'dd/MM/yyyy', { locale: fr }) : '—'}
                            </TableCell>
                            <TableCell>
                              {insurance.date_expiration ? format(new Date(insurance.date_expiration), 'dd/MM/yyyy', { locale: fr }) : '—'}
                            </TableCell>
                            <TableCell>{insurance.montant?.toFixed(2)} DH</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-sm text-muted-foreground py-4">Aucune assurance enregistrée</p>
                  )}
                </div>

                {/* Visites techniques */}
                <div className="pt-6 border-t">
                  <h3 className="font-semibold mb-3">Visites techniques ({technicalInspections.length})</h3>
                  {technicalInspections.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>N° d'ordre</TableHead>
                          <TableHead>Centre contrôle</TableHead>
                          <TableHead>Date visite</TableHead>
                          <TableHead>Date expiration</TableHead>
                          <TableHead>Montant</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {technicalInspections.slice(0, 5).map((inspection) => (
                          <TableRow key={inspection.id}>
                            <TableCell>{inspection.numero_ordre}</TableCell>
                            <TableCell>{inspection.centre_controle}</TableCell>
                            <TableCell>
                              {inspection.date_visite ? format(new Date(inspection.date_visite), 'dd/MM/yyyy', { locale: fr }) : '—'}
                            </TableCell>
                            <TableCell>
                              {inspection.date_expiration ? format(new Date(inspection.date_expiration), 'dd/MM/yyyy', { locale: fr }) : '—'}
                            </TableCell>
                            <TableCell>{inspection.montant?.toFixed(2)} DH</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-sm text-muted-foreground py-4">Aucune visite technique enregistrée</p>
                  )}
                </div>

                {/* Vignettes */}
                <div className="pt-6 border-t">
                  <h3 className="font-semibold mb-3">Vignettes ({vignettes.length})</h3>
                  {vignettes.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>N° d'ordre</TableHead>
                          <TableHead>Année</TableHead>
                          <TableHead>Date expiration</TableHead>
                          <TableHead>Montant</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {vignettes.slice(0, 5).map((vignette) => (
                          <TableRow key={vignette.id}>
                            <TableCell>{vignette.numero_ordre}</TableCell>
                            <TableCell>{vignette.annee}</TableCell>
                            <TableCell>
                              {vignette.date_expiration ? format(new Date(vignette.date_expiration), 'dd/MM/yyyy', { locale: fr }) : '—'}
                            </TableCell>
                            <TableCell>{vignette.montant?.toFixed(2)} DH</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-sm text-muted-foreground py-4">Aucune vignette enregistrée</p>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="locations" className="mt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-sm text-muted-foreground">
                    Total: {totalReservations} réservation{totalReservations > 1 ? 's' : ''}
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setShowContractsList(true)}>
                    <Eye className="w-4 h-4 mr-2" />
                    Voir tout
                  </Button>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Numéro</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Date début</TableHead>
                      <TableHead>Date fin</TableHead>
                      <TableHead>Montant</TableHead>
                      <TableHead>Statut</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[...contracts, ...assistances].slice(0, 10).map((item) => (
                      <TableRow 
                        key={item.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => navigate('numero_contrat' in item ? `/locations/${item.id}` : `/assistance/${item.id}`)}
                      >
                        <TableCell>
                          <Badge variant="outline">
                            {'numero_contrat' in item ? 'Location' : 'Assistance'}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {'numero_contrat' in item ? item.numero_contrat : item.num_dossier}
                        </TableCell>
                        <TableCell>{item.clients?.nom} {item.clients?.prenom}</TableCell>
                        <TableCell>
                          {format(new Date(item.date_debut), 'dd/MM/yyyy', { locale: fr })}
                        </TableCell>
                        <TableCell>
                          {item.date_fin ? format(new Date(item.date_fin), 'dd/MM/yyyy', { locale: fr }) : '—'}
                        </TableCell>
                        <TableCell>
                          {('total_amount' in item ? item.total_amount : item.montant_total)?.toFixed(2) || '0.00'} DH
                        </TableCell>
                        <TableCell>
                          <Badge>
                            {'statut' in item ? item.statut : item.etat}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="expenses" className="mt-6">
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground mb-4">
                  Total dépenses: {totalExpenses.toLocaleString('fr-MA', { minimumFractionDigits: 2 })} DH
                </div>

                {expenses.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Catégorie</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Montant</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {expenses.map((expense) => (
                        <TableRow key={expense.id}>
                          <TableCell>
                            {format(new Date(expense.date_depense), 'dd/MM/yyyy', { locale: fr })}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{expense.categorie}</Badge>
                          </TableCell>
                          <TableCell>{expense.description || '—'}</TableCell>
                          <TableCell className="text-right font-semibold">
                            {expense.montant.toFixed(2)} DH
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-sm text-muted-foreground py-4">Aucune dépense enregistrée</p>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Contracts Dialog */}
      <Dialog open={showContractsList} onOpenChange={setShowContractsList}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Historique complet des locations - {vehicle.immatriculation}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-2 mt-4">
            {[...contracts, ...assistances].map((item) => (
              <div
                key={item.id}
                className="border rounded p-4 hover:bg-muted/50 cursor-pointer"
                onClick={() => {
                  setShowContractsList(false);
                  navigate('numero_contrat' in item ? `/locations/${item.id}` : `/assistance/${item.id}`);
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">
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
    </div>
  );
}
