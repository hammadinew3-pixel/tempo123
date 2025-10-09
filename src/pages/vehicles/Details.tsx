import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ChevronRight, ArrowDownToLine, ArrowUpFromLine, Calendar, Edit, MoreVertical, AlertCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
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
  const [activeTab, setActiveTab] = useState("resume");
  const [activeInterventionTab, setActiveInterventionTab] = useState("assurance");
  const [showContractsList, setShowContractsList] = useState(false);

  useEffect(() => {
    if (id) {
      loadVehicle();
    }
  }, [id]);

  const loadVehicle = async () => {
    try {
      const [vehicleRes, contractsRes, assistancesRes, expensesRes, insurancesRes, inspectionsRes, vignettesRes] = await Promise.all([
        supabase
          .from('vehicles')
          .select('*')
          .eq('id', id)
          .single(),
        supabase
          .from('contracts')
          .select(`
            *,
            clients (nom, prenom, telephone)
          `)
          .eq('vehicle_id', id)
          .order('created_at', { ascending: false }),
        supabase
          .from('assistance')
          .select(`
            *,
            clients (nom, prenom, telephone)
          `)
          .eq('vehicle_id', id)
          .order('created_at', { ascending: false }),
        supabase
          .from('expenses')
          .select('*')
          .eq('vehicle_id', id)
          .order('date_depense', { ascending: false }),
        supabase
          .from('vehicle_insurance')
          .select('*')
          .eq('vehicle_id', id)
          .order('date_debut', { ascending: false }),
        supabase
          .from('vehicle_technical_inspection')
          .select('*')
          .eq('vehicle_id', id)
          .order('date_visite', { ascending: false }),
        supabase
          .from('vehicle_vignette')
          .select('*')
          .eq('vehicle_id', id)
          .order('annee', { ascending: false })
      ]);

      if (vehicleRes.error) throw vehicleRes.error;
      if (contractsRes.error) throw contractsRes.error;
      if (assistancesRes.error) throw assistancesRes.error;
      if (expensesRes.error) throw expensesRes.error;
      if (insurancesRes.error) throw insurancesRes.error;
      if (inspectionsRes.error) throw inspectionsRes.error;
      if (vignettesRes.error) throw vignettesRes.error;

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
    const contractRevenue = contracts.reduce((sum, contract) => {
      return sum + (contract.total_amount || 0);
    }, 0);
    
    const assistanceRevenue = assistances.reduce((sum, assistance) => {
      return sum + (assistance.montant_facture || assistance.montant_total || 0);
    }, 0);
    
    return contractRevenue + assistanceRevenue;
  };

  const calculateTotalExpenses = () => {
    return expenses.reduce((sum, expense) => sum + (expense.montant || 0), 0);
  };

  const getTotalReservations = () => {
    return contracts.length + assistances.length;
  };

  const getDaysRemaining = (expirationDate: string | null) => {
    if (!expirationDate) return null;
    const today = new Date();
    const expDate = new Date(expirationDate);
    const diffTime = expDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const renderInterventionTable = () => {
    let data: any[] = [];
    let columns = [];

    if (activeInterventionTab === 'assurance') {
      data = insurances;
      columns = ['N° d\'ordre', 'Assureur', 'Date début', 'Date d\'expiration', 'Jours restant', 'Montant', 'Date création'];
    } else if (activeInterventionTab === 'visite') {
      data = technicalInspections;
      columns = ['N° d\'ordre', 'Centre contrôle', 'Date visite', 'Date d\'expiration', 'Jours restant', 'Montant', 'Date création'];
    } else if (activeInterventionTab === 'vignette') {
      data = vignettes;
      columns = ['N° d\'ordre', 'Année', '', 'Date d\'expiration', 'Jours restant', 'Montant', 'Date création'];
    }

    if (data.length === 0) {
      return (
        <TableBody>
          <TableRow>
            <TableCell colSpan={8}>
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <div className="w-16 h-16 bg-muted rounded-lg mb-4" />
                <p>Aucun résultat</p>
              </div>
            </TableCell>
          </TableRow>
        </TableBody>
      );
    }

    return (
      <TableBody>
        {data.map((item) => {
          const daysRemaining = getDaysRemaining(
            activeInterventionTab === 'assurance' ? item.date_expiration :
            activeInterventionTab === 'visite' ? item.date_expiration :
            item.date_expiration
          );

          return (
            <TableRow key={item.id}>
              <TableCell>
                <Button variant="ghost" size="sm">
                  <Edit className="w-4 h-4" />
                </Button>
              </TableCell>
              <TableCell>{item.numero_ordre}</TableCell>
              <TableCell>
                {activeInterventionTab === 'assurance' ? item.assureur :
                 activeInterventionTab === 'visite' ? item.centre_controle :
                 item.annee}
              </TableCell>
              <TableCell>
                {activeInterventionTab === 'assurance' ? 
                  (item.date_debut ? format(new Date(item.date_debut), 'dd/MM/yyyy', { locale: fr }) : '—') :
                 activeInterventionTab === 'visite' ? 
                  (item.date_visite ? format(new Date(item.date_visite), 'dd/MM/yyyy', { locale: fr }) : '—') :
                  '—'}
              </TableCell>
              <TableCell>
                {item.date_expiration ? format(new Date(item.date_expiration), 'dd/MM/yyyy', { locale: fr }) : '—'}
              </TableCell>
              <TableCell>
                {daysRemaining !== null ? (
                  <Badge variant={daysRemaining < 0 ? 'destructive' : daysRemaining < 30 ? 'outline' : 'secondary'}>
                    {daysRemaining < 0 ? `Expiré depuis ${Math.abs(daysRemaining)} jours` : `${daysRemaining} jours`}
                  </Badge>
                ) : '—'}
              </TableCell>
              <TableCell>{item.montant ? `${item.montant.toFixed(2)} DH` : '—'}</TableCell>
              <TableCell>
                {item.created_at ? format(new Date(item.created_at), 'dd/MM/yyyy', { locale: fr }) : '—'}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    );
  };

  const getAlerts = () => {
    const alerts = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to compare dates only
    
    // Alert only if insurance doesn't exist OR is expired
    if (!vehicle?.assurance_expire_le) {
      alerts.push({
        message: "Véhicule sans assurance ajoutée.",
        action: "CRÉER ASSURANCE"
      });
    } else {
      const expirationDate = new Date(vehicle.assurance_expire_le);
      expirationDate.setHours(0, 0, 0, 0);
      if (expirationDate < today) {
        alerts.push({
          message: "Assurance expirée.",
          action: "CRÉER ASSURANCE"
        });
      }
    }

    // Alert only if technical inspection doesn't exist OR is expired
    if (!vehicle?.visite_technique_expire_le) {
      alerts.push({
        message: "Véhicule sans visite technique ajoutée.",
        action: "CRÉER VISITE"
      });
    } else {
      const expirationDate = new Date(vehicle.visite_technique_expire_le);
      expirationDate.setHours(0, 0, 0, 0);
      if (expirationDate < today) {
        alerts.push({
          message: "Visite technique expirée.",
          action: "CRÉER VISITE"
        });
      }
    }

    // Alert only if vignette doesn't exist OR is expired
    if (!vehicle?.vignette_expire_le) {
      alerts.push({
        message: "Véhicule sans autorisation ajoutée.",
        action: "CRÉER AUTORISATION"
      });
    } else {
      const expirationDate = new Date(vehicle.vignette_expire_le);
      expirationDate.setHours(0, 0, 0, 0);
      if (expirationDate < today) {
        alerts.push({
          message: "Autorisation expirée.",
          action: "CRÉER AUTORISATION"
        });
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
  const statusBadge = vehicle.statut === 'disponible' ? 'Libre' :
                     vehicle.statut === 'loue' ? 'Loué' : 
                     vehicle.statut === 'reserve' ? 'Réservé' : 'En panne';
  const statusColor = vehicle.statut === 'disponible' ? 'bg-green-100 text-green-800' : 
                     vehicle.statut === 'loue' ? 'bg-blue-100 text-blue-800' : 
                     vehicle.statut === 'reserve' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800';

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Fiche véhicule Mat. N° {vehicle.immatriculation}</h1>
          <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-foreground">Tableau de bord</Link>
            <ChevronRight className="w-4 h-4" />
            <Link to="/vehicules" className="hover:text-foreground">Véhicules</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-foreground">Véhicule Mat. {vehicle.immatriculation}</span>
          </div>
        </div>
        <Button 
          className="bg-primary"
          onClick={() => navigate(`/vehicules/${id}/workflow`)}
        >
          <Edit className="w-4 h-4 mr-2" />
          MODIFIER LE VÉHICULE
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card 
          className="bg-green-50 border-green-100 cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => setShowContractsList(true)}
        >
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-green-700 font-medium">REVENU TOTAL</p>
                <p className="text-3xl font-bold text-green-900">
                  {totalRevenue.toLocaleString('fr-MA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  <span className="text-lg">DH</span>
                </p>
              </div>
              <div className="bg-green-200 p-3 rounded-lg">
                <ArrowDownToLine className="w-6 h-6 text-green-700" />
              </div>
            </div>
            <Button variant="link" className="text-green-700 p-0 h-auto mt-2">
              → CONSULTER LES DÉTAILS
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-red-50 border-red-100">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-red-700 font-medium">DÉPENSE TOTALE</p>
                <p className="text-3xl font-bold text-red-900">
                  {totalExpenses.toLocaleString('fr-MA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  <span className="text-lg">DH</span>
                </p>
              </div>
              <div className="bg-red-200 p-3 rounded-lg">
                <ArrowUpFromLine className="w-6 h-6 text-red-700" />
              </div>
            </div>
            <Button variant="link" className="text-red-700 p-0 h-auto mt-2">
              → CONSULTER LES DÉTAILS
            </Button>
          </CardContent>
        </Card>

        <Card 
          className="bg-blue-50 border-blue-100 cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => setShowContractsList(true)}
        >
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-blue-700 font-medium">RÉSERVATIONS</p>
                <p className="text-3xl font-bold text-blue-900">
                  {totalReservations.toString().padStart(2, '0')}
                </p>
              </div>
              <div className="bg-blue-200 p-3 rounded-lg">
                <Calendar className="w-6 h-6 text-blue-700" />
              </div>
            </div>
            <Button variant="link" className="text-blue-700 p-0 h-auto mt-2">
              ↓ PLUS DE DÉTAILS
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Left Column - Informations */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full" />
              <CardTitle className="text-base">Informations</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon">
                <Edit className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="resume">RÉSUMÉ</TabsTrigger>
                <TabsTrigger value="info">INFO DE BASE</TabsTrigger>
                <TabsTrigger value="details">PLUS DE DÉTAILS</TabsTrigger>
              </TabsList>
              
              <TabsContent value="resume" className="mt-6">
                <div className="flex flex-col items-center space-y-4">
                  <div className="w-32 h-32 rounded-full bg-muted flex items-center justify-center text-6xl font-bold">
                    {vehicle.marque?.charAt(0) || 'V'}
                  </div>
                  <h3 className="text-xl font-semibold">{vehicle.marque}</h3>
                  <Badge className={statusColor}>{statusBadge}</Badge>
                  
                  <div className="grid grid-cols-4 gap-4 w-full mt-6">
                    <div className="text-center">
                      <div className="text-blue-500 text-2xl font-bold">#</div>
                      <p className="text-xs text-muted-foreground mt-1">Matricule</p>
                      <p className="font-semibold mt-1">{vehicle.immatriculation}</p>
                    </div>
                    <div className="text-center">
                      <div className="text-blue-500 text-2xl font-bold">⊙</div>
                      <p className="text-xs text-muted-foreground mt-1">Kilométrage</p>
                      <p className="font-semibold mt-1">{vehicle.kilometrage.toLocaleString()} Km</p>
                    </div>
                    <div className="text-center">
                      <div className="text-blue-500 text-2xl font-bold">$</div>
                      <p className="text-xs text-muted-foreground mt-1">Prix location</p>
                      <p className="font-semibold mt-1">{vehicle.tarif_journalier.toLocaleString()} Dh</p>
                    </div>
                    <div className="text-center">
                      <div className="text-blue-500 text-2xl font-bold">⛽</div>
                      <p className="text-xs text-muted-foreground mt-1">Carburant</p>
                      <p className="font-semibold mt-1">Diesel</p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="info">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
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
                    <div>
                      <p className="text-sm text-muted-foreground">Valeur d'achat</p>
                      <p className="font-semibold">{vehicle.valeur_achat?.toLocaleString() || 'N/A'} Dh</p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="details">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Assurance expire le</p>
                      <p className="font-semibold">{vehicle.assurance_expire_le || 'Non défini'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Visite technique expire le</p>
                      <p className="font-semibold">{vehicle.visite_technique_expire_le || 'Non défini'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Vignette expire le</p>
                      <p className="font-semibold">{vehicle.vignette_expire_le || 'Non défini'}</p>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Right Column - Alerts */}
        <Collapsible defaultOpen>
          <Card>
            <CollapsibleTrigger className="w-full">
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-orange-500" />
                  <CardTitle className="text-base">
                    {alerts.length.toString().padStart(2, '0')} alertes trouvées pour ce véhicule
                  </CardTitle>
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-3">
                {alerts.map((alert, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-orange-500" />
                      <span className="text-sm">{alert.message}</span>
                    </div>
                    <Button variant="link" className="text-orange-700 text-xs h-auto p-0">
                      {alert.action}
                    </Button>
                  </div>
                ))}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      </div>

      {/* Interventions Section */}
      <Collapsible defaultOpen>
        <Card>
          <CollapsibleTrigger className="w-full">
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                <CardTitle className="text-base">Assurances, Interventions,...</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              <Tabs value={activeInterventionTab} onValueChange={setActiveInterventionTab}>
                <TabsList className="w-full justify-start">
                  <TabsTrigger value="assurance">ASSURANCE</TabsTrigger>
                  <TabsTrigger value="visite">VISITE TECHNIQUE</TabsTrigger>
                  <TabsTrigger value="vidange">VIDANGE</TabsTrigger>
                  <TabsTrigger value="autorisation">AUTORISATION</TabsTrigger>
                  <TabsTrigger value="vignette">VIGNETTE</TabsTrigger>
                  <TabsTrigger value="reparation">RÉPARATION</TabsTrigger>
                  <TabsTrigger value="infraction">INFRACTION</TabsTrigger>
                  <TabsTrigger value="incident">INCIDENT</TabsTrigger>
                </TabsList>
                
                <TabsContent value={activeInterventionTab} className="mt-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Actions</TableHead>
                        <TableHead>N° d'ordre</TableHead>
                        <TableHead>
                          {activeInterventionTab === 'assurance' ? 'Assureur' :
                           activeInterventionTab === 'visite' ? 'Centre contrôle' :
                           activeInterventionTab === 'vignette' ? 'Année' : 'Info'}
                        </TableHead>
                        <TableHead>
                          {activeInterventionTab === 'assurance' ? 'Date début' :
                           activeInterventionTab === 'visite' ? 'Date visite' : ''}
                        </TableHead>
                        <TableHead>Date d'expiration</TableHead>
                        <TableHead>Jours restant</TableHead>
                        <TableHead>Montant</TableHead>
                        <TableHead>Date création</TableHead>
                      </TableRow>
                    </TableHeader>
                    {renderInterventionTable()}
                  </Table>
                  
                  <Button variant="link" className="text-primary mt-4">
                    ⊕ AJOUTER {activeInterventionTab === 'assurance' ? 'ASSURANCE' :
                              activeInterventionTab === 'visite' ? 'VISITE TECHNIQUE' :
                              activeInterventionTab === 'vignette' ? 'VIGNETTE' :
                              activeInterventionTab.toUpperCase()}
                  </Button>
                </TabsContent>
              </Tabs>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Purchase Info Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Infos d'achat / Les traites</CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            La création des infos d'achat vous permet de gérer et de suivre facilement les traites bancaires de ce véhicule
          </p>
        </CardHeader>
        <CardContent>
          <Button variant="link" className="text-primary">
            ⊕ AJOUTER
          </Button>
        </CardContent>
      </Card>

      {/* Rental Situation Section */}
      <Collapsible defaultOpen>
        <Card>
          <CollapsibleTrigger className="w-full">
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                <CardTitle className="text-base">Situation des locations</CardTitle>
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type location</TableHead>
                    <TableHead className="text-center">En attente</TableHead>
                    <TableHead className="text-center">Livrée</TableHead>
                    <TableHead className="text-center">Récupérée</TableHead>
                    <TableHead className="text-center">Annulée</TableHead>
                    <TableHead className="text-center">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>Locations</TableCell>
                    <TableCell className="text-center">
                      {contracts.filter(c => c.statut === 'brouillon').length.toString().padStart(2, '0')}
                    </TableCell>
                    <TableCell className="text-center">
                      {contracts.filter(c => c.statut === 'livre' || c.statut === 'contrat_valide').length.toString().padStart(2, '0')}
                    </TableCell>
                    <TableCell className="text-center">
                      {contracts.filter(c => c.statut === 'retour_effectue' || c.statut === 'termine').length.toString().padStart(2, '0')}
                    </TableCell>
                    <TableCell className="text-center">
                      {contracts.filter(c => c.statut === 'annule').length.toString().padStart(2, '0')}
                    </TableCell>
                    <TableCell className="text-center">
                      {contracts.length.toString().padStart(2, '0')}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Assistances</TableCell>
                    <TableCell className="text-center">
                      {assistances.filter(a => a.etat === 'ouvert').length.toString().padStart(2, '0')}
                    </TableCell>
                    <TableCell className="text-center">
                      {assistances.filter(a => a.etat === 'livre' || a.etat === 'contrat_valide').length.toString().padStart(2, '0')}
                    </TableCell>
                    <TableCell className="text-center">
                      {assistances.filter(a => a.etat === 'retour_effectue' || a.etat === 'cloture').length.toString().padStart(2, '0')}
                    </TableCell>
                    <TableCell className="text-center">
                      {assistances.filter(a => a.etat === 'annule').length.toString().padStart(2, '0')}
                    </TableCell>
                    <TableCell className="text-center">
                      {assistances.length.toString().padStart(2, '0')}
                    </TableCell>
                  </TableRow>
                  <TableRow className="font-semibold">
                    <TableCell>Total</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                        {(contracts.filter(c => c.statut === 'brouillon').length + 
                          assistances.filter(a => a.etat === 'ouvert').length).toString().padStart(2, '0')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        {(contracts.filter(c => c.statut === 'livre' || c.statut === 'contrat_valide').length + 
                          assistances.filter(a => a.etat === 'livre' || a.etat === 'contrat_valide').length).toString().padStart(2, '0')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        {(contracts.filter(c => c.statut === 'retour_effectue' || c.statut === 'termine').length + 
                          assistances.filter(a => a.etat === 'retour_effectue' || a.etat === 'cloture').length).toString().padStart(2, '0')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="bg-red-100 text-red-800">
                        {(contracts.filter(c => c.statut === 'annule').length + 
                          assistances.filter(a => a.etat === 'annule').length).toString().padStart(2, '0')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary">
                        {totalReservations.toString().padStart(2, '0')}
                      </Badge>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
              
              <div className="mt-4 space-y-2">
                <Button
                  variant="link"
                  className="text-primary p-0 h-auto"
                  onClick={() => setShowContractsList(true)}
                >
                  → Voir l'historique complet des locations
                </Button>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Dialog - Historique des locations */}
      <Dialog open={showContractsList} onOpenChange={setShowContractsList}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Historique des locations - {vehicle.immatriculation}</span>
              <Badge variant="secondary">{totalReservations} réservations</Badge>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-3 mt-4">
            {contracts.length === 0 && assistances.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Calendar className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <p>Aucune réservation pour ce véhicule</p>
              </div>
            ) : (
              <>
                {contracts.map((contract) => (
                  <div
                    key={contract.id}
                    className="border rounded-lg p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => {
                      setShowContractsList(false);
                      navigate(`/locations/${contract.id}`);
                    }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Badge className="bg-blue-100 text-blue-800 border-blue-200">Location</Badge>
                        <Badge variant="outline" className={
                          contract.statut === 'livre' || contract.statut === 'contrat_valide' 
                            ? 'bg-green-100 text-green-800 border-green-200' 
                            : contract.statut === 'termine' || contract.statut === 'retour_effectue'
                            ? 'bg-indigo-100 text-indigo-800 border-indigo-200'
                            : contract.statut === 'annule'
                            ? 'bg-red-100 text-red-800 border-red-200'
                            : 'bg-gray-100 text-gray-800 border-gray-200'
                        }>
                          {contract.statut === 'brouillon' ? 'Réservation' :
                           contract.statut === 'contrat_valide' ? 'Validé' :
                           contract.statut === 'livre' ? 'En cours' :
                           contract.statut === 'retour_effectue' ? 'Retourné' :
                           contract.statut === 'termine' ? 'Clôturé' :
                           contract.statut === 'annule' ? 'Annulé' : contract.statut}
                        </Badge>
                        <span className="text-sm font-mono text-muted-foreground">{contract.numero_contrat}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-lg">{contract.total_amount?.toFixed(2) || '0.00'} DH</div>
                        <div className="text-xs text-muted-foreground">{contract.duration || 0} jours</div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Client: </span>
                        <span className="font-medium">
                          {contract.clients?.nom} {contract.clients?.prenom || ''}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Tél: </span>
                        <span className="font-medium">{contract.clients?.telephone}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Début: </span>
                        <span className="font-medium">
                          {contract.date_debut ? format(new Date(contract.date_debut), 'dd/MM/yyyy', { locale: fr }) : '—'}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Fin: </span>
                        <span className="font-medium">
                          {contract.date_fin ? format(new Date(contract.date_fin), 'dd/MM/yyyy', { locale: fr }) : '—'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                
                {assistances.map((assistance) => (
                  <div
                    key={assistance.id}
                    className="border rounded-lg p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => {
                      setShowContractsList(false);
                      navigate(`/assistance/${assistance.id}`);
                    }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Badge className="bg-orange-100 text-orange-800 border-orange-200">Assistance</Badge>
                        <Badge variant="outline" className={
                          assistance.etat === 'livre' || assistance.etat === 'contrat_valide' 
                            ? 'bg-green-100 text-green-800 border-green-200' 
                            : assistance.etat === 'cloture' || assistance.etat === 'retour_effectue'
                            ? 'bg-indigo-100 text-indigo-800 border-indigo-200'
                            : assistance.etat === 'annule'
                            ? 'bg-red-100 text-red-800 border-red-200'
                            : 'bg-gray-100 text-gray-800 border-gray-200'
                        }>
                          {assistance.etat === 'ouvert' ? 'En attente' :
                           assistance.etat === 'contrat_valide' ? 'Validé' :
                           assistance.etat === 'livre' ? 'En cours' :
                           assistance.etat === 'retour_effectue' ? 'Retourné' :
                           assistance.etat === 'cloture' ? 'Clôturé' :
                           assistance.etat === 'annule' ? 'Annulé' : assistance.etat}
                        </Badge>
                        <span className="text-sm font-mono text-muted-foreground">{assistance.num_dossier}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-lg">
                          {(assistance.montant_facture || assistance.montant_total || 0).toFixed(2)} DH
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {assistance.date_debut && assistance.date_fin ? 
                            Math.ceil((new Date(assistance.date_fin).getTime() - new Date(assistance.date_debut).getTime()) / (1000 * 60 * 60 * 24)) : 0} jours
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Client: </span>
                        <span className="font-medium">
                          {assistance.clients?.nom} {assistance.clients?.prenom || ''}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Tél: </span>
                        <span className="font-medium">{assistance.clients?.telephone}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Début: </span>
                        <span className="font-medium">
                          {assistance.date_debut ? format(new Date(assistance.date_debut), 'dd/MM/yyyy', { locale: fr }) : '—'}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Fin: </span>
                        <span className="font-medium">
                          {assistance.date_fin ? format(new Date(assistance.date_fin), 'dd/MM/yyyy', { locale: fr }) : '—'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Button */}
      <div>
        <Button variant="destructive" className="bg-red-600 hover:bg-red-700">
          🗑 SUPPRIMER CE VÉHICULE
        </Button>
      </div>
    </div>
  );
}
