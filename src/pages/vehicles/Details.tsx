import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ChevronRight, Edit, Calendar, TrendingUp, TrendingDown, AlertCircle, FileText, Settings, Eye, Gauge, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  const [vidanges, setVidanges] = useState<any[]>([]);
  const [showVidangeDialog, setShowVidangeDialog] = useState(false);
  const [prochainKmVidange, setProchainKmVidange] = useState<string>('');

  useEffect(() => {
    if (id) {
      loadVehicle();
    }
  }, [id]);

  const loadVehicle = async () => {
    try {
      const [vehicleRes, contractsRes, assistancesRes, expensesRes, insurancesRes, inspectionsRes, vignettesRes, vidangesRes] = await Promise.all([
        supabase.from('vehicles').select('*').eq('id', id).single(),
        supabase.from('contracts').select(`*, clients (nom, prenom, telephone)`).eq('vehicle_id', id).order('created_at', { ascending: false }),
        supabase.from('assistance').select(`*, clients (nom, prenom, telephone)`).eq('vehicle_id', id).order('created_at', { ascending: false }),
        supabase.from('expenses').select('*').eq('vehicle_id', id).order('date_depense', { ascending: false }),
        supabase.from('vehicle_insurance').select('*').eq('vehicle_id', id).order('date_debut', { ascending: false }),
        supabase.from('vehicle_technical_inspection').select('*').eq('vehicle_id', id).order('date_visite', { ascending: false }),
        supabase.from('vehicle_vignette').select('*').eq('vehicle_id', id).order('annee', { ascending: false }),
        supabase.from('vidanges').select('*').eq('vehicle_id', id).order('date_vidange', { ascending: false })
      ]);

      if (vehicleRes.error) throw vehicleRes.error;
      
      setVehicle(vehicleRes.data);
      setContracts(contractsRes.data || []);
      setAssistances(assistancesRes.data || []);
      setExpenses(expensesRes.data || []);
      setInsurances(insurancesRes.data || []);
      setTechnicalInspections(inspectionsRes.data || []);
      setVignettes(vignettesRes.data || []);
      setVidanges(vidangesRes.data || []);
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

  const calculateKmDepuisVidange = () => {
    if (!vehicle) return 0;
    return vehicle.kilometrage - (vehicle.dernier_kilometrage_vidange || 0);
  };

  const needsOilChange = () => {
    if (!vehicle) return false;
    // Si un prochain kilométrage est défini, utiliser celui-ci
    if (vehicle.prochain_kilometrage_vidange) {
      return vehicle.kilometrage >= vehicle.prochain_kilometrage_vidange;
    }
    // Sinon, utiliser le calcul automatique (8000 km)
    const kmDepuis = calculateKmDepuisVidange();
    return kmDepuis > 8000;
  };

  const getOilChangeAlertLevel = () => {
    if (!vehicle) return 'ok';
    // Si un prochain kilométrage est défini, utiliser celui-ci
    if (vehicle.prochain_kilometrage_vidange) {
      const kmRestants = vehicle.prochain_kilometrage_vidange - vehicle.kilometrage;
      if (kmRestants <= 0) return 'critical'; // Dépassé
      if (kmRestants <= 1000) return 'warning'; // Moins de 1000 km
      return 'ok';
    }
    // Sinon, utiliser le calcul automatique
    const kmDepuis = calculateKmDepuisVidange();
    if (kmDepuis > 10000) return 'critical'; // Rouge
    if (kmDepuis > 8000) return 'warning'; // Orange
    return 'ok'; // Vert
  };

  const handleMarkOilChangeDone = async () => {
    if (!vehicle) return;

    try {
      const prochainKm = prochainKmVidange ? parseInt(prochainKmVidange) : null;

      // Validation du prochain kilométrage
      if (prochainKm && prochainKm <= vehicle.kilometrage) {
        toast({
          title: "Erreur",
          description: "Le prochain kilométrage de vidange doit être supérieur au kilométrage actuel",
          variant: "destructive",
        });
        return;
      }

      // Créer un enregistrement dans la table vidanges
      const { error: vidangeError } = await supabase
        .from('vidanges')
        .insert({
          vehicle_id: vehicle.id,
          kilometrage: vehicle.kilometrage,
          date_vidange: new Date().toISOString().split('T')[0],
          type: 'Vidange complète',
          remarques: prochainKm ? `Prochain kilométrage prévu: ${prochainKm} km` : null,
        });

      if (vidangeError) throw vidangeError;

      // Mettre à jour le véhicule
      const { error: updateError } = await supabase
        .from('vehicles')
        .update({
          dernier_kilometrage_vidange: vehicle.kilometrage,
          date_derniere_vidange: new Date().toISOString().split('T')[0],
          prochain_kilometrage_vidange: prochainKm,
        })
        .eq('id', vehicle.id);

      if (updateError) throw updateError;

      toast({
        title: "Succès",
        description: "Vidange enregistrée avec succès",
      });

      setShowVidangeDialog(false);
      setProchainKmVidange('');
      loadVehicle();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getAlerts = () => {
    const alerts = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Check if there are any insurance records
    if (insurances.length === 0) {
      alerts.push({ message: "Véhicule sans assurance ajoutée.", action: "CRÉER ASSURANCE", link: "/vehicules" });
    } else if (vehicle?.assurance_expire_le) {
      const expirationDate = new Date(vehicle.assurance_expire_le);
      expirationDate.setHours(0, 0, 0, 0);
      
      // Calculate days until expiration
      const daysUntilExpiration = Math.ceil((expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      if (expirationDate < today) {
        alerts.push({ message: "Assurance expirée depuis " + Math.abs(daysUntilExpiration) + " jour(s).", action: "RENOUVELER", link: "/vehicules" });
      } else if (daysUntilExpiration <= 30) {
        alerts.push({ message: `Assurance expire dans ${daysUntilExpiration} jour(s).`, action: "RENOUVELER", link: "/vehicules" });
      }
    }

    // Check if there are any technical inspection records
    if (technicalInspections.length === 0) {
      alerts.push({ message: "Véhicule sans visite technique ajoutée.", action: "CRÉER VISITE", link: "/vehicules" });
    } else if (vehicle?.visite_technique_expire_le) {
      const expirationDate = new Date(vehicle.visite_technique_expire_le);
      expirationDate.setHours(0, 0, 0, 0);
      
      const daysUntilExpiration = Math.ceil((expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      if (expirationDate < today) {
        alerts.push({ message: "Visite technique expirée depuis " + Math.abs(daysUntilExpiration) + " jour(s).", action: "RENOUVELER", link: "/vehicules" });
      } else if (daysUntilExpiration <= 30) {
        alerts.push({ message: `Visite technique expire dans ${daysUntilExpiration} jour(s).`, action: "RENOUVELER", link: "/vehicules" });
      }
    }

    // Check if there are any vignette records
    if (vignettes.length === 0) {
      alerts.push({ message: "Véhicule sans vignette ajoutée.", action: "CRÉER VIGNETTE", link: "/vehicules" });
    } else if (vehicle?.vignette_expire_le) {
      const expirationDate = new Date(vehicle.vignette_expire_le);
      expirationDate.setHours(0, 0, 0, 0);
      
      const daysUntilExpiration = Math.ceil((expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      if (expirationDate < today) {
        alerts.push({ message: "Vignette expirée depuis " + Math.abs(daysUntilExpiration) + " jour(s).", action: "RENOUVELER", link: "/vehicules" });
      } else if (daysUntilExpiration <= 30) {
        alerts.push({ message: `Vignette expire dans ${daysUntilExpiration} jour(s).`, action: "RENOUVELER", link: "/vehicules" });
      }
    }

    // Check oil change
    const kmDepuis = vehicle.kilometrage - (vehicle.dernier_kilometrage_vidange || 0);
    if (kmDepuis > 10000) {
      alerts.push({ 
        message: `Vidange urgente ! ${kmDepuis.toLocaleString()} km depuis la dernière vidange.`, 
        action: "EFFECTUER VIDANGE", 
        link: `/vehicules/${vehicle.id}` 
      });
    } else if (kmDepuis > 8000) {
      alerts.push({ 
        message: `Vidange à prévoir - ${kmDepuis.toLocaleString()} km depuis la dernière vidange.`, 
        action: "PLANIFIER", 
        link: `/vehicules/${vehicle.id}` 
      });
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
    <div className="p-3 md:p-6 space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 md:mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground">
            {vehicle.marque} {vehicle.modele}
          </h1>
          <div className="flex items-center gap-2 mt-2 text-xs md:text-sm text-muted-foreground">
            <Link to="/" className="hover:text-foreground">Tableau de bord</Link>
            <ChevronRight className="w-3 h-3 md:w-4 md:h-4" />
            <Link to="/vehicules" className="hover:text-foreground">Véhicules</Link>
            <ChevronRight className="w-3 h-3 md:w-4 md:h-4" />
            <span className="text-foreground">{vehicle.immatriculation}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant={statusVariant} className="text-xs md:text-sm">{statusBadge}</Badge>
          <Button 
            onClick={() => navigate(`/vehicules/${id}/modifier`)}
            size="sm"
            className="w-full md:w-auto"
          >
            <Edit className="w-4 h-4 mr-2" />
            Modifier
          </Button>
        </div>
      </div>

      {/* Kilométrage Card - Mise en avant */}
      <Card className={`mb-4 md:mb-6 ${
        getOilChangeAlertLevel() === 'critical' ? 'border-red-500 bg-red-50/50 dark:bg-red-950/20' :
        getOilChangeAlertLevel() === 'warning' ? 'border-orange-500 bg-orange-50/50 dark:bg-orange-950/20' :
        'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20'
      }`}>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-4 flex-1">
              <div className={`p-3 rounded-full ${
                getOilChangeAlertLevel() === 'critical' ? 'bg-red-500/20' :
                getOilChangeAlertLevel() === 'warning' ? 'bg-orange-500/20' :
                'bg-blue-500/20'
              }`}>
                <Gauge className={`w-8 h-8 ${
                  getOilChangeAlertLevel() === 'critical' ? 'text-red-600' :
                  getOilChangeAlertLevel() === 'warning' ? 'text-orange-600' :
                  'text-blue-600'
                }`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Kilométrage actuel</p>
                <p className="text-3xl md:text-4xl font-bold">
                  {vehicle.kilometrage.toLocaleString()} km
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Dernière mise à jour : {format(new Date(vehicle.updated_at), 'dd/MM/yyyy à HH:mm', { locale: fr })}
                </p>
                
                {vehicle.dernier_kilometrage_vidange > 0 && (
                  <div className="mt-3">
                    <p className="text-sm text-muted-foreground">
                      Kilométrage depuis dernière vidange : 
                      <span className={`font-semibold ml-1 ${
                        getOilChangeAlertLevel() === 'critical' ? 'text-red-600' :
                        getOilChangeAlertLevel() === 'warning' ? 'text-orange-600' :
                        'text-green-600'
                      }`}>
                        {calculateKmDepuisVidange().toLocaleString()} km
                      </span>
                    </p>
                    {vehicle.date_derniere_vidange && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Dernière vidange le {format(new Date(vehicle.date_derniere_vidange), 'dd/MM/yyyy', { locale: fr })} 
                        à {vehicle.dernier_kilometrage_vidange.toLocaleString()} km
                      </p>
                    )}
                    {vehicle.prochain_kilometrage_vidange && (
                      <p className="text-xs font-medium mt-1">
                        Prochaine vidange prévue à {vehicle.prochain_kilometrage_vidange.toLocaleString()} km
                        <span className="text-muted-foreground ml-1">
                          ({(vehicle.prochain_kilometrage_vidange - vehicle.kilometrage).toLocaleString()} km restants)
                        </span>
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2 w-full md:w-auto">
              {needsOilChange() && (
                <div className={`p-3 rounded-lg ${
                  getOilChangeAlertLevel() === 'critical' ? 'bg-red-100 dark:bg-red-950' :
                  'bg-orange-100 dark:bg-orange-950'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className={`w-5 h-5 ${
                      getOilChangeAlertLevel() === 'critical' ? 'text-red-600' : 'text-orange-600'
                    }`} />
                    <p className={`text-sm font-semibold ${
                      getOilChangeAlertLevel() === 'critical' ? 'text-red-900 dark:text-red-100' : 'text-orange-900 dark:text-orange-100'
                    }`}>
                      {getOilChangeAlertLevel() === 'critical' ? 'Vidange urgente !' : 'Vidange à prévoir'}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {vehicle.prochain_kilometrage_vidange
                      ? `Prochaine vidange prévue à ${vehicle.prochain_kilometrage_vidange.toLocaleString()} km`
                      : vehicle.dernier_kilometrage_vidange > 0
                      ? `Dernière vidange à ${vehicle.dernier_kilometrage_vidange.toLocaleString()} km`
                      : 'Aucune vidange enregistrée'}
                  </p>
                </div>
              )}
              
              <Button
                onClick={() => setShowVidangeDialog(true)}
                variant={needsOilChange() ? "default" : "outline"}
                className="w-full"
              >
                <Wrench className="w-4 h-4 mr-2" />
                Marquer vidange effectuée
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-4 md:mb-6">
        <Card>
          <CardHeader className="pb-2 md:pb-3">
            <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">Revenu Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-lg md:text-2xl font-bold">
                {totalRevenue.toLocaleString('fr-MA', { minimumFractionDigits: 2 })} DH
              </div>
              <TrendingUp className="w-6 h-6 md:w-8 md:h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 md:pb-3">
            <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">Dépenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-lg md:text-2xl font-bold">
                {totalExpenses.toLocaleString('fr-MA', { minimumFractionDigits: 2 })} DH
              </div>
              <TrendingDown className="w-6 h-6 md:w-8 md:h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 md:pb-3">
            <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">Bénéfice Net</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-lg md:text-2xl font-bold">
                {netProfit.toLocaleString('fr-MA', { minimumFractionDigits: 2 })} DH
              </div>
              <FileText className="w-6 h-6 md:w-8 md:h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 md:pb-3">
            <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">Réservations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-lg md:text-2xl font-bold">{totalReservations}</div>
              <Calendar className="w-6 h-6 md:w-8 md:h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <Card className="mb-4 md:mb-6 border-orange-200 bg-orange-50/50 dark:bg-orange-950/20">
          <CardHeader className="pb-3 md:pb-4">
            <CardTitle className="text-sm md:text-base flex items-center gap-2">
              <AlertCircle className="w-4 h-4 md:w-5 md:h-5 text-orange-600" />
              {alerts.length} alerte{alerts.length > 1 ? 's' : ''} détectée{alerts.length > 1 ? 's' : ''}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {alerts.map((alert, index) => (
              <div key={index} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-background border border-orange-200 rounded">
                <span className="text-xs md:text-sm">{alert.message}</span>
                <Button variant="link" className="text-orange-600 text-xs h-auto p-0 self-start sm:self-center whitespace-nowrap">
                  {alert.action}
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <Card>
        <CardHeader className="pb-3 md:pb-6">
          <CardTitle className="text-base md:text-lg">Informations du véhicule</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 h-auto">
              <TabsTrigger value="info" className="text-xs md:text-sm">Infos</TabsTrigger>
              <TabsTrigger value="interventions" className="text-xs md:text-sm">Interventions</TabsTrigger>
              <TabsTrigger value="vidanges" className="text-xs md:text-sm">Vidanges</TabsTrigger>
              <TabsTrigger value="locations" className="text-xs md:text-sm">Locations</TabsTrigger>
              <TabsTrigger value="expenses" className="text-xs md:text-sm">Dépenses</TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="mt-4 md:mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div className="space-y-3 md:space-y-4">
                  <div>
                    <p className="text-xs md:text-sm text-muted-foreground">Immatriculation</p>
                    <p className="font-semibold text-sm md:text-base">{vehicle.immatriculation}</p>
                  </div>
                  <div>
                    <p className="text-xs md:text-sm text-muted-foreground">Marque</p>
                    <p className="font-semibold text-sm md:text-base">{vehicle.marque}</p>
                  </div>
                  <div>
                    <p className="text-xs md:text-sm text-muted-foreground">Modèle</p>
                    <p className="font-semibold text-sm md:text-base">{vehicle.modele}</p>
                  </div>
                  <div>
                    <p className="text-xs md:text-sm text-muted-foreground">Année</p>
                    <p className="font-semibold text-sm md:text-base">{vehicle.annee}</p>
                  </div>
                </div>

                <div className="space-y-3 md:space-y-4">
                  <div>
                    <p className="text-xs md:text-sm text-muted-foreground">Kilométrage</p>
                    <p className="font-semibold text-sm md:text-base">{vehicle.kilometrage.toLocaleString()} km</p>
                  </div>
                  <div>
                    <p className="text-xs md:text-sm text-muted-foreground">Tarif journalier</p>
                    <p className="font-semibold text-sm md:text-base">{vehicle.tarif_journalier.toLocaleString()} DH</p>
                  </div>
                  <div>
                    <p className="text-xs md:text-sm text-muted-foreground">Valeur d'achat</p>
                    <p className="font-semibold text-sm md:text-base">{vehicle.valeur_achat?.toLocaleString() || 'N/A'} DH</p>
                  </div>
                  <div>
                    <p className="text-xs md:text-sm text-muted-foreground">Statut</p>
                    <Badge variant={statusVariant} className="text-xs md:text-sm">{statusBadge}</Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 mt-4 md:mt-6 pt-4 md:pt-6 border-t">
                <div className="p-3 bg-muted/30 rounded-lg">
                  <p className="text-xs md:text-sm text-muted-foreground mb-1">Assurance</p>
                  <p className="font-semibold text-sm md:text-base">
                    {insurances.length > 0 && vehicle.assurance_expire_le ? 
                      format(new Date(vehicle.assurance_expire_le), 'dd/MM/yyyy', { locale: fr }) : 
                      'Non ajoutée'}
                  </p>
                  {insurances.length > 0 && <p className="text-xs text-muted-foreground mt-1">{insurances.length} enregistrement(s)</p>}
                </div>
                <div className="p-3 bg-muted/30 rounded-lg">
                  <p className="text-xs md:text-sm text-muted-foreground mb-1">Visite technique</p>
                  <p className="font-semibold text-sm md:text-base">
                    {technicalInspections.length > 0 && vehicle.visite_technique_expire_le ? 
                      format(new Date(vehicle.visite_technique_expire_le), 'dd/MM/yyyy', { locale: fr }) : 
                      'Non ajoutée'}
                  </p>
                  {technicalInspections.length > 0 && <p className="text-xs text-muted-foreground mt-1">{technicalInspections.length} enregistrement(s)</p>}
                </div>
                <div className="p-3 bg-muted/30 rounded-lg">
                  <p className="text-xs md:text-sm text-muted-foreground mb-1">Vignette</p>
                  <p className="font-semibold text-sm md:text-base">
                    {vignettes.length > 0 && vehicle.vignette_expire_le ? 
                      format(new Date(vehicle.vignette_expire_le), 'dd/MM/yyyy', { locale: fr }) : 
                      'Non ajoutée'}
                  </p>
                  {vignettes.length > 0 && <p className="text-xs text-muted-foreground mt-1">{vignettes.length} enregistrement(s)</p>}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="interventions" className="mt-4 md:mt-6">
              <div className="space-y-4 md:space-y-6">
                {/* Assurances */}
                <div>
                  <h3 className="text-sm md:text-base font-semibold mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Assurances ({insurances.length})
                  </h3>
                  {insurances.length > 0 ? (
                    <div className="overflow-x-auto -mx-4 md:mx-0">
                      <div className="inline-block min-w-full align-middle">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="text-xs md:text-sm">N° d'ordre</TableHead>
                              <TableHead className="text-xs md:text-sm">Assureur</TableHead>
                              <TableHead className="text-xs md:text-sm">Date début</TableHead>
                              <TableHead className="text-xs md:text-sm">Date expiration</TableHead>
                              <TableHead className="text-xs md:text-sm">Montant</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {insurances.slice(0, 5).map((insurance) => (
                              <TableRow key={insurance.id}>
                                <TableCell className="text-xs md:text-sm">{insurance.numero_ordre}</TableCell>
                                <TableCell className="text-xs md:text-sm">{insurance.assureur}</TableCell>
                                <TableCell className="text-xs md:text-sm">
                                  {insurance.date_debut ? format(new Date(insurance.date_debut), 'dd/MM/yyyy', { locale: fr }) : '—'}
                                </TableCell>
                                <TableCell className="text-xs md:text-sm">
                                  {insurance.date_expiration ? format(new Date(insurance.date_expiration), 'dd/MM/yyyy', { locale: fr }) : '—'}
                                </TableCell>
                                <TableCell className="text-xs md:text-sm">{insurance.montant?.toFixed(2)} DH</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs md:text-sm text-muted-foreground py-4">Aucune assurance enregistrée</p>
                  )}
                </div>

                {/* Visites techniques */}
                <div className="pt-4 md:pt-6 border-t">
                  <h3 className="text-sm md:text-base font-semibold mb-3">Visites techniques ({technicalInspections.length})</h3>
                  {technicalInspections.length > 0 ? (
                    <div className="overflow-x-auto -mx-4 md:mx-0">
                      <div className="inline-block min-w-full align-middle">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="text-xs md:text-sm">N° d'ordre</TableHead>
                              <TableHead className="text-xs md:text-sm">Centre contrôle</TableHead>
                              <TableHead className="text-xs md:text-sm">Date visite</TableHead>
                              <TableHead className="text-xs md:text-sm">Date expiration</TableHead>
                              <TableHead className="text-xs md:text-sm">Montant</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {technicalInspections.slice(0, 5).map((inspection) => (
                              <TableRow key={inspection.id}>
                                <TableCell className="text-xs md:text-sm">{inspection.numero_ordre}</TableCell>
                                <TableCell className="text-xs md:text-sm">{inspection.centre_controle}</TableCell>
                                <TableCell className="text-xs md:text-sm">
                                  {inspection.date_visite ? format(new Date(inspection.date_visite), 'dd/MM/yyyy', { locale: fr }) : '—'}
                                </TableCell>
                                <TableCell className="text-xs md:text-sm">
                                  {inspection.date_expiration ? format(new Date(inspection.date_expiration), 'dd/MM/yyyy', { locale: fr }) : '—'}
                                </TableCell>
                                <TableCell className="text-xs md:text-sm">{inspection.montant?.toFixed(2)} DH</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs md:text-sm text-muted-foreground py-4">Aucune visite technique enregistrée</p>
                  )}
                </div>

                {/* Vignettes */}
                <div className="pt-4 md:pt-6 border-t">
                  <h3 className="text-sm md:text-base font-semibold mb-3">Vignettes ({vignettes.length})</h3>
                  {vignettes.length > 0 ? (
                    <div className="overflow-x-auto -mx-4 md:mx-0">
                      <div className="inline-block min-w-full align-middle">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="text-xs md:text-sm">N° d'ordre</TableHead>
                              <TableHead className="text-xs md:text-sm">Année</TableHead>
                              <TableHead className="text-xs md:text-sm">Date expiration</TableHead>
                              <TableHead className="text-xs md:text-sm">Montant</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {vignettes.slice(0, 5).map((vignette) => (
                              <TableRow key={vignette.id}>
                                <TableCell className="text-xs md:text-sm">{vignette.numero_ordre}</TableCell>
                                <TableCell className="text-xs md:text-sm">{vignette.annee}</TableCell>
                                <TableCell className="text-xs md:text-sm">
                                  {vignette.date_expiration ? format(new Date(vignette.date_expiration), 'dd/MM/yyyy', { locale: fr }) : '—'}
                                </TableCell>
                                <TableCell className="text-xs md:text-sm">{vignette.montant?.toFixed(2)} DH</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs md:text-sm text-muted-foreground py-4">Aucune vignette enregistrée</p>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="vidanges" className="mt-4 md:mt-6">
              <div className="space-y-4">
                <div className="p-4 bg-muted/30 rounded-lg space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Kilométrage actuel</span>
                    <span className="text-lg font-bold">{vehicle.kilometrage.toLocaleString()} km</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Dernier kilométrage vidange</span>
                    <span className="text-lg font-bold">
                      {vehicle.dernier_kilometrage_vidange > 0 
                        ? `${vehicle.dernier_kilometrage_vidange.toLocaleString()} km` 
                        : 'Aucune'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-sm text-muted-foreground">Kilométrage depuis dernière vidange</span>
                    <span className={`text-lg font-bold ${
                      getOilChangeAlertLevel() === 'critical' ? 'text-red-600' :
                      getOilChangeAlertLevel() === 'warning' ? 'text-orange-600' :
                      'text-green-600'
                    }`}>
                      {calculateKmDepuisVidange().toLocaleString()} km
                    </span>
                  </div>
                </div>

                <h3 className="text-sm md:text-base font-semibold mb-3 flex items-center gap-2">
                  <Wrench className="w-4 h-4" />
                  Historique des vidanges ({vidanges.length})
                </h3>

                {vidanges.length > 0 ? (
                  <div className="overflow-x-auto -mx-4 md:mx-0">
                    <div className="inline-block min-w-full align-middle">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-xs md:text-sm">Date</TableHead>
                            <TableHead className="text-xs md:text-sm">Kilométrage</TableHead>
                            <TableHead className="text-xs md:text-sm">Type</TableHead>
                            <TableHead className="text-xs md:text-sm">Montant</TableHead>
                            <TableHead className="text-xs md:text-sm">Remarques</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {vidanges.map((vidange) => (
                            <TableRow key={vidange.id}>
                              <TableCell className="text-xs md:text-sm">
                                {format(new Date(vidange.date_vidange), 'dd/MM/yyyy', { locale: fr })}
                              </TableCell>
                              <TableCell className="text-xs md:text-sm font-semibold">
                                {vidange.kilometrage.toLocaleString()} km
                              </TableCell>
                              <TableCell className="text-xs md:text-sm">
                                {vidange.type || '—'}
                              </TableCell>
                              <TableCell className="text-xs md:text-sm">
                                {vidange.montant ? `${vidange.montant.toFixed(2)} DH` : '—'}
                              </TableCell>
                              <TableCell className="text-xs md:text-sm">
                                {vidange.remarques || '—'}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs md:text-sm text-muted-foreground py-4 text-center">
                    Aucune vidange enregistrée
                  </p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="locations" className="mt-4 md:mt-6">
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div className="text-xs md:text-sm text-muted-foreground">
                    Total: {totalReservations} réservation{totalReservations > 1 ? 's' : ''}
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setShowContractsList(true)} className="w-full sm:w-auto">
                    <Eye className="w-4 h-4 mr-2" />
                    Voir tout
                  </Button>
                </div>

                <div className="overflow-x-auto -mx-4 md:mx-0">
                  <div className="inline-block min-w-full align-middle">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs md:text-sm">Type</TableHead>
                          <TableHead className="text-xs md:text-sm">Numéro</TableHead>
                          <TableHead className="text-xs md:text-sm">Client</TableHead>
                          <TableHead className="text-xs md:text-sm">Date début</TableHead>
                          <TableHead className="text-xs md:text-sm">Date fin</TableHead>
                          <TableHead className="text-xs md:text-sm">Montant</TableHead>
                          <TableHead className="text-xs md:text-sm">Statut</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {[...contracts, ...assistances].slice(0, 10).map((item) => (
                          <TableRow 
                            key={item.id}
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => navigate('numero_contrat' in item ? `/locations/${item.id}` : `/assistance/${item.id}`)}
                          >
                            <TableCell className="text-xs md:text-sm">
                              <Badge variant="outline" className="text-xs">
                                {'numero_contrat' in item ? 'Location' : 'Assistance'}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-mono text-xs md:text-sm">
                              {'numero_contrat' in item ? item.numero_contrat : item.num_dossier}
                            </TableCell>
                            <TableCell className="text-xs md:text-sm">{item.clients?.nom} {item.clients?.prenom}</TableCell>
                            <TableCell className="text-xs md:text-sm">
                              {format(new Date(item.date_debut), 'dd/MM/yyyy', { locale: fr })}
                            </TableCell>
                            <TableCell className="text-xs md:text-sm">
                              {item.date_fin ? format(new Date(item.date_fin), 'dd/MM/yyyy', { locale: fr }) : '—'}
                            </TableCell>
                            <TableCell className="text-xs md:text-sm">
                              {('total_amount' in item ? item.total_amount : item.montant_total)?.toFixed(2) || '0.00'} DH
                            </TableCell>
                            <TableCell className="text-xs md:text-sm">
                              <Badge className="text-xs">
                                {'statut' in item ? item.statut : item.etat}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="expenses" className="mt-4 md:mt-6">
              <div className="space-y-4">
                <div className="text-xs md:text-sm text-muted-foreground mb-4 p-3 bg-muted/30 rounded-lg">
                  Total dépenses: <span className="font-semibold text-foreground">{totalExpenses.toLocaleString('fr-MA', { minimumFractionDigits: 2 })} DH</span>
                </div>

                {expenses.length > 0 ? (
                  <div className="overflow-x-auto -mx-4 md:mx-0">
                    <div className="inline-block min-w-full align-middle">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-xs md:text-sm">Date</TableHead>
                            <TableHead className="text-xs md:text-sm">Catégorie</TableHead>
                            <TableHead className="text-xs md:text-sm">Description</TableHead>
                            <TableHead className="text-xs md:text-sm text-right">Montant</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {expenses.map((expense) => (
                            <TableRow key={expense.id}>
                              <TableCell className="text-xs md:text-sm">
                                {format(new Date(expense.date_depense), 'dd/MM/yyyy', { locale: fr })}
                              </TableCell>
                              <TableCell className="text-xs md:text-sm">
                                <Badge variant="outline" className="text-xs">{expense.categorie}</Badge>
                              </TableCell>
                              <TableCell className="text-xs md:text-sm">{expense.description || '—'}</TableCell>
                              <TableCell className="text-xs md:text-sm text-right font-semibold">
                                {expense.montant.toFixed(2)} DH
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs md:text-sm text-muted-foreground py-4">Aucune dépense enregistrée</p>
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

      {/* Dialog de confirmation de vidange */}
      <Dialog open={showVidangeDialog} onOpenChange={setShowVidangeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la vidange</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Véhicule</span>
                <span className="text-sm font-semibold">{vehicle.marque} {vehicle.modele} - {vehicle.immatriculation}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Kilométrage actuel</span>
                <span className="text-sm font-semibold">{vehicle.kilometrage.toLocaleString()} km</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Dernière vidange</span>
                <span className="text-sm font-semibold">
                  {vehicle.dernier_kilometrage_vidange > 0
                    ? `${vehicle.dernier_kilometrage_vidange.toLocaleString()} km`
                    : 'Aucune'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Km depuis dernière vidange</span>
                <span className={`text-sm font-bold ${
                  getOilChangeAlertLevel() === 'critical' ? 'text-red-600' :
                  getOilChangeAlertLevel() === 'warning' ? 'text-orange-600' :
                  'text-green-600'
                }`}>
                  {calculateKmDepuisVidange().toLocaleString()} km
                </span>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              Cette action enregistrera une vidange effectuée au kilométrage actuel ({vehicle.kilometrage.toLocaleString()} km) 
              à la date d'aujourd'hui.
            </p>

            <div className="space-y-2">
              <Label htmlFor="prochain-km">Prochain kilométrage de vidange (optionnel)</Label>
              <Input
                id="prochain-km"
                type="number"
                placeholder={`Ex: ${(vehicle.kilometrage + 10000).toLocaleString()}`}
                value={prochainKmVidange}
                onChange={(e) => setProchainKmVidange(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Définissez le kilométrage auquel vous souhaitez être notifié pour la prochaine vidange
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => {
                setShowVidangeDialog(false);
                setProchainKmVidange('');
              }}>
                Annuler
              </Button>
              <Button onClick={handleMarkOilChangeDone}>
                <Wrench className="w-4 h-4 mr-2" />
                Confirmer la vidange
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
