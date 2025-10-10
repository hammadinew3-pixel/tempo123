import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Edit, TrendingUp, TrendingDown, Calendar, AlertCircle, Shield, ClipboardCheck, FileCheck, CreditCard, Wrench, Plus, DollarSign, Car, Gauge, FileText, Eye, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
  const [vidanges, setVidanges] = useState<any[]>([]);
  const [showVidangeDialog, setShowVidangeDialog] = useState(false);
  const [prochainKmVidange, setProchainKmVidange] = useState<string>('');
  const [montantVidange, setMontantVidange] = useState<string>('');

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
    if (vehicle.prochain_kilometrage_vidange) {
      return vehicle.kilometrage >= vehicle.prochain_kilometrage_vidange;
    }
    const kmDepuis = calculateKmDepuisVidange();
    return kmDepuis > 8000;
  };

  const getOilChangeAlertLevel = () => {
    if (!vehicle) return 'ok';
    if (vehicle.prochain_kilometrage_vidange) {
      const kmRestants = vehicle.prochain_kilometrage_vidange - vehicle.kilometrage;
      if (kmRestants <= 0) return 'critical';
      if (kmRestants <= 1000) return 'warning';
      return 'ok';
    }
    const kmDepuis = calculateKmDepuisVidange();
    if (kmDepuis > 10000) return 'critical';
    if (kmDepuis > 8000) return 'warning';
    return 'ok';
  };

  const handleMarkOilChangeDone = async () => {
    if (!vehicle) return;

    try {
      const prochainKm = prochainKmVidange ? parseInt(prochainKmVidange) : null;
      const montant = montantVidange ? parseFloat(montantVidange) : null;

      if (prochainKm && prochainKm <= vehicle.kilometrage) {
        toast({
          title: "Erreur",
          description: "Le prochain kilométrage de vidange doit être supérieur au kilométrage actuel",
          variant: "destructive",
        });
        return;
      }

      if (montant !== null && montant < 0) {
        toast({
          title: "Erreur",
          description: "Le montant doit être positif",
          variant: "destructive",
        });
        return;
      }

      const { error: vidangeError } = await supabase
        .from('vidanges')
        .insert({
          vehicle_id: vehicle.id,
          kilometrage: vehicle.kilometrage,
          date_vidange: new Date().toISOString().split('T')[0],
          type: 'Vidange complète',
          montant: montant,
          remarques: prochainKm ? `Prochain kilométrage prévu: ${prochainKm} km` : null,
        });

      if (vidangeError) throw vidangeError;

      if (montant !== null && montant > 0) {
        const { error: expenseError } = await supabase
          .from('expenses')
          .insert([{
            vehicle_id: vehicle.id,
            categorie: 'entretien',
            montant: montant,
            date_depense: new Date().toISOString().split('T')[0],
            description: `Vidange complète à ${vehicle.kilometrage.toLocaleString()} km`,
          }]);

        if (expenseError) throw expenseError;
      }

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
        description: montant ? `Vidange enregistrée avec succès. Dépense de ${montant.toFixed(2)} DH ajoutée.` : "Vidange enregistrée avec succès",
      });

      setShowVidangeDialog(false);
      setProchainKmVidange('');
      setMontantVidange('');
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
    
    if (insurances.length === 0) {
      alerts.push({ message: "Véhicule sans assurance ajoutée.", action: "CRÉER ASSURANCE", link: "/vehicules", severity: "high" });
    } else if (vehicle?.assurance_expire_le) {
      const expirationDate = new Date(vehicle.assurance_expire_le);
      expirationDate.setHours(0, 0, 0, 0);
      const daysUntilExpiration = Math.ceil((expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      if (expirationDate < today) {
        alerts.push({ message: "Assurance expirée depuis " + Math.abs(daysUntilExpiration) + " jour(s).", action: "RENOUVELER", link: "/vehicules", severity: "critical" });
      } else if (daysUntilExpiration <= 30) {
        alerts.push({ message: `Assurance expire dans ${daysUntilExpiration} jour(s).`, action: "RENOUVELER", link: "/vehicules", severity: "warning" });
      }
    }

    if (technicalInspections.length === 0) {
      alerts.push({ message: "Véhicule sans visite technique ajoutée.", action: "CRÉER VISITE", link: "/vehicules", severity: "high" });
    } else if (vehicle?.visite_technique_expire_le) {
      const expirationDate = new Date(vehicle.visite_technique_expire_le);
      expirationDate.setHours(0, 0, 0, 0);
      const daysUntilExpiration = Math.ceil((expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      if (expirationDate < today) {
        alerts.push({ message: "Visite technique expirée depuis " + Math.abs(daysUntilExpiration) + " jour(s).", action: "RENOUVELER", link: "/vehicules", severity: "critical" });
      } else if (daysUntilExpiration <= 30) {
        alerts.push({ message: `Visite technique expire dans ${daysUntilExpiration} jour(s).`, action: "RENOUVELER", link: "/vehicules", severity: "warning" });
      }
    }

    if (vignettes.length === 0) {
      alerts.push({ message: "Véhicule sans vignette ajoutée.", action: "CRÉER VIGNETTE", link: "/vehicules", severity: "high" });
    } else if (vehicle?.vignette_expire_le) {
      const expirationDate = new Date(vehicle.vignette_expire_le);
      expirationDate.setHours(0, 0, 0, 0);
      const daysUntilExpiration = Math.ceil((expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      if (expirationDate < today) {
        alerts.push({ message: "Vignette expirée depuis " + Math.abs(daysUntilExpiration) + " jour(s).", action: "RENOUVELER", link: "/vehicules", severity: "critical" });
      } else if (daysUntilExpiration <= 30) {
        alerts.push({ message: `Vignette expire dans ${daysUntilExpiration} jour(s).`, action: "RENOUVELER", link: "/vehicules", severity: "warning" });
      }
    }

    const kmDepuis = vehicle.kilometrage - (vehicle.dernier_kilometrage_vidange || 0);
    if (kmDepuis > 10000) {
      alerts.push({ 
        message: `Vidange urgente ! ${kmDepuis.toLocaleString()} km depuis la dernière vidange.`, 
        action: "EFFECTUER VIDANGE", 
        link: `/vehicules/${vehicle.id}`,
        severity: "critical"
      });
    } else if (kmDepuis > 8000) {
      alerts.push({ 
        message: `Vidange à prévoir - ${kmDepuis.toLocaleString()} km depuis la dernière vidange.`, 
        action: "PLANIFIER", 
        link: `/vehicules/${vehicle.id}`,
        severity: "warning"
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
    <div className="min-h-screen bg-background p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">
          Fiche véhicule Mat. N° {vehicle.immatriculation}
        </h1>
        <Button 
          onClick={() => navigate(`/vehicules/${id}/modifier`)}
          className="bg-info hover:bg-info/90 text-white gap-2"
        >
          <Edit className="w-4 h-4" />
          MODIFIER LE VÉHICULE
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Revenu Total */}
        <Card className="border-l-4 border-l-success bg-success/5">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground mb-2">REVENU TOTAL</p>
                <p className="text-3xl font-bold text-foreground">{totalRevenue.toFixed(2)}<span className="text-lg">DH</span></p>
                <Button variant="link" className="text-success hover:text-success/80 p-0 h-auto mt-2" onClick={() => setShowContractsList(true)}>
                  → CONSULTER LES DÉTAILS
                </Button>
              </div>
              <div className="p-3 rounded-lg bg-success/20">
                <TrendingUp className="w-8 h-8 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dépense Totale */}
        <Card className="border-l-4 border-l-destructive bg-destructive/5">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground mb-2">DÉPENSE TOTALE</p>
                <p className="text-3xl font-bold text-foreground">{totalExpenses.toFixed(2)}<span className="text-lg">DH</span></p>
                <Button variant="link" className="text-destructive hover:text-destructive/80 p-0 h-auto mt-2">
                  → CONSULTER LES DÉTAILS
                </Button>
              </div>
              <div className="p-3 rounded-lg bg-destructive/20">
                <TrendingDown className="w-8 h-8 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Réservations */}
        <Card className="border-l-4 border-l-info bg-info/5">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground mb-2">RÉSERVATIONS</p>
                <p className="text-5xl font-bold text-foreground">{totalReservations.toString().padStart(2, '0')}</p>
                <Button variant="link" className="text-info hover:text-info/80 p-0 h-auto mt-2" onClick={() => setShowContractsList(true)}>
                  ↓ PLUS DE DÉTAILS
                </Button>
              </div>
              <div className="p-3 rounded-lg bg-info/20">
                <Calendar className="w-8 h-8 text-info" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Vidange Status Card */}
      <Card className={`border-l-4 ${
        getOilChangeAlertLevel() === 'critical' ? 'border-l-destructive bg-destructive/5' :
        getOilChangeAlertLevel() === 'warning' ? 'border-l-warning bg-warning/5' :
        'border-l-success bg-success/5'
      }`}>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-4 flex-1">
              <div className={`p-3 rounded-lg ${
                getOilChangeAlertLevel() === 'critical' ? 'bg-destructive/20' :
                getOilChangeAlertLevel() === 'warning' ? 'bg-warning/20' :
                'bg-success/20'
              }`}>
                <Gauge className={`w-8 h-8 ${
                  getOilChangeAlertLevel() === 'critical' ? 'text-destructive' :
                  getOilChangeAlertLevel() === 'warning' ? 'text-warning' :
                  'text-success'
                }`} />
              </div>
              <div className="flex-1">
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
                        getOilChangeAlertLevel() === 'critical' ? 'text-destructive' :
                        getOilChangeAlertLevel() === 'warning' ? 'text-warning' :
                        'text-success'
                      }`}>
                        {calculateKmDepuisVidange().toLocaleString()} km
                      </span>
                    </p>
                    {vehicle.prochain_kilometrage_vidange && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Prochain kilométrage prévu : <span className="font-semibold">{vehicle.prochain_kilometrage_vidange.toLocaleString()} km</span>
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              {getOilChangeAlertLevel() === 'critical' && (
                <Badge variant="destructive" className="whitespace-nowrap">
                  Vidange urgente
                </Badge>
              )}
              {getOilChangeAlertLevel() === 'warning' && (
                <Badge className="bg-warning text-white whitespace-nowrap">
                  Vidange à prévoir
                </Badge>
              )}
              {getOilChangeAlertLevel() === 'ok' && (
                <Badge className="bg-success text-white whitespace-nowrap">
                  Vidange OK
                </Badge>
              )}
              {needsOilChange() && (
                <Button 
                  size="sm"
                  onClick={() => setShowVidangeDialog(true)}
                  className="whitespace-nowrap"
                >
                  <Wrench className="w-4 h-4 mr-2" />
                  Effectuer vidange
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Informations Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-info" />
            Informations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="resume" className="w-full">
            <TabsList className="w-full justify-start border-b rounded-none bg-transparent p-0 h-auto">
              <TabsTrigger value="resume" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">
                RÉSUMÉ
              </TabsTrigger>
              <TabsTrigger value="base" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">
                INFO DE BASE
              </TabsTrigger>
              <TabsTrigger value="details" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">
                PLUS DE DÉTAILS
              </TabsTrigger>
            </TabsList>

            <TabsContent value="resume" className="mt-6">
              <div className="flex flex-col items-center space-y-6">
                {/* Vehicle Logo/Image */}
                <div className="w-32 h-32 rounded-full bg-muted flex items-center justify-center">
                  {vehicle.photo_url ? (
                    <img src={vehicle.photo_url} alt={`${vehicle.marque} ${vehicle.modele}`} className="w-full h-full object-cover rounded-full" />
                  ) : (
                    <Car className="w-16 h-16 text-muted-foreground" />
                  )}
                </div>

                {/* Vehicle Name */}
                <div className="text-center">
                  <h3 className="text-xl font-bold">{vehicle.marque} / {vehicle.modele}</h3>
                  <Badge variant="secondary" className="mt-2">En circulation</Badge>
                </div>

                {/* Vehicle Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 w-full max-w-2xl">
                  <div className="text-center">
                    <div className="flex justify-center mb-2">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">Matricule</p>
                    <p className="font-bold">{vehicle.immatriculation}</p>
                  </div>

                  <div className="text-center">
                    <div className="flex justify-center mb-2">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <TrendingUp className="w-5 h-5 text-primary" />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">Kilométrage</p>
                    <p className="font-bold">{vehicle.kilometrage.toLocaleString()} Km</p>
                  </div>

                  <div className="text-center">
                    <div className="flex justify-center mb-2">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <DollarSign className="w-5 h-5 text-primary" />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">Prix location</p>
                    <p className="font-bold">{vehicle.tarif_journalier.toFixed(2)} Dh</p>
                  </div>

                  <div className="text-center">
                    <div className="flex justify-center mb-2">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Wrench className="w-5 h-5 text-primary" />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">Carburant</p>
                    <p className="font-bold">Diesel</p>
                  </div>
                </div>

                {/* Service Toggles */}
                <div className="flex items-center gap-8">
                  <div className="flex items-center gap-3">
                    <Switch checked={vehicle.en_service} disabled />
                    <span className="text-sm font-medium">En service</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch checked={vehicle.sous_location} disabled />
                    <span className="text-sm font-medium">Sous location</span>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="base" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-muted-foreground">Marque</Label>
                  <p className="font-medium mt-1">{vehicle.marque}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Modèle</Label>
                  <p className="font-medium mt-1">{vehicle.modele}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Immatriculation</Label>
                  <p className="font-medium mt-1">{vehicle.immatriculation}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Année</Label>
                  <p className="font-medium mt-1">{vehicle.annee}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Catégorie</Label>
                  <p className="font-medium mt-1">{vehicle.categorie || 'Non spécifiée'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Statut</Label>
                  <Badge variant={statusVariant} className="mt-1">{statusBadge}</Badge>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="details" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-muted-foreground">Tarif journalier</Label>
                  <p className="font-medium mt-1">{vehicle.tarif_journalier.toFixed(2)} DH</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Valeur d'achat</Label>
                  <p className="font-medium mt-1">{vehicle.valeur_achat?.toFixed(2) || '-'} DH</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Kilométrage actuel</Label>
                  <p className="font-medium mt-1">{vehicle.kilometrage.toLocaleString()} km</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Dernière vidange</Label>
                  <p className="font-medium mt-1">
                    {vehicle.date_derniere_vidange 
                      ? format(new Date(vehicle.date_derniere_vidange), 'dd/MM/yyyy', { locale: fr })
                      : 'Non renseignée'
                    }
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Alerts Section */}
      {alerts.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-warning">
                <AlertCircle className="w-5 h-5" />
                {alerts.length.toString().padStart(2, '0')} alertes trouvées pour ce véhicule
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {alerts.map((alert, index) => (
              <Alert 
                key={index}
                className={`border-l-4 ${
                  alert.severity === 'critical' ? 'border-l-destructive bg-destructive/5' :
                  alert.severity === 'high' ? 'border-l-warning bg-warning/5' :
                  'border-l-warning bg-warning/5'
                }`}
              >
                <AlertCircle className={`h-4 w-4 ${
                  alert.severity === 'critical' ? 'text-destructive' : 'text-warning'
                }`} />
                <AlertDescription className="flex items-center justify-between">
                  <span className="text-sm">{alert.message}</span>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className={`ml-4 ${
                      alert.severity === 'critical' 
                        ? 'border-destructive text-destructive hover:bg-destructive hover:text-white' 
                        : 'border-warning text-warning hover:bg-warning hover:text-white'
                    }`}
                    onClick={() => {
                      if (alert.action === "EFFECTUER VIDANGE") {
                        setShowVidangeDialog(true);
                      }
                    }}
                  >
                    {alert.action}
                  </Button>
                </AlertDescription>
              </Alert>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Assurances, interventions Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" />
            Assurances, interventions, ...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="assurance" className="w-full">
            <TabsList className="w-full justify-start flex-wrap h-auto gap-1 bg-transparent p-0">
              <TabsTrigger value="assurance" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                ASSURANCE
              </TabsTrigger>
              <TabsTrigger value="visite" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                VISITE TECHNIQUE
              </TabsTrigger>
              <TabsTrigger value="vidange" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                VIDANGE
              </TabsTrigger>
              <TabsTrigger value="vignette" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                VIGNETTE
              </TabsTrigger>
            </TabsList>

            <TabsContent value="assurance" className="mt-6">
              <div className="space-y-4">
                <div className="flex justify-end">
                  <Button size="sm" className="gap-2">
                    <Plus className="w-4 h-4" />
                    AJOUTER ASSURANCE
                  </Button>
                </div>
                {insurances.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>N° d'ordre</TableHead>
                        <TableHead>Assureur</TableHead>
                        <TableHead>Date début</TableHead>
                        <TableHead>Date d'expiration</TableHead>
                        <TableHead className="text-right">Montant</TableHead>
                        <TableHead className="text-right">Date création</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {insurances.map((insurance) => {
                        const today = new Date();
                        const expirationDate = new Date(insurance.date_expiration);
                        const daysUntilExpiration = Math.ceil((expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                        
                        return (
                          <TableRow key={insurance.id}>
                            <TableCell>{insurance.numero_ordre}</TableCell>
                            <TableCell>{insurance.assureur}</TableCell>
                            <TableCell>{format(new Date(insurance.date_debut), 'dd/MM/yyyy', { locale: fr })}</TableCell>
                            <TableCell>
                              <span className={daysUntilExpiration <= 30 && daysUntilExpiration > 0 ? 'text-warning font-medium' : ''}>
                                {format(new Date(insurance.date_expiration), 'dd/MM/yyyy', { locale: fr })}
                              </span>
                              {daysUntilExpiration > 0 && daysUntilExpiration <= 30 && (
                                <Badge variant="outline" className="ml-2 bg-warning/10 text-warning border-warning">
                                  {daysUntilExpiration}J
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">{insurance.montant.toFixed(2)}</TableCell>
                            <TableCell className="text-right text-muted-foreground text-sm">
                              {format(new Date(insurance.created_at), 'dd/MM/yyyy HH:mm', { locale: fr })}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Aucune assurance enregistrée
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="visite" className="mt-6">
              <div className="space-y-4">
                <div className="flex justify-end">
                  <Button size="sm" className="gap-2">
                    <Plus className="w-4 h-4" />
                    AJOUTER VISITE
                  </Button>
                </div>
                {technicalInspections.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>N° d'ordre</TableHead>
                        <TableHead>Centre de contrôle</TableHead>
                        <TableHead>Date visite</TableHead>
                        <TableHead>Date d'expiration</TableHead>
                        <TableHead className="text-right">Montant</TableHead>
                        <TableHead className="text-right">Date création</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {technicalInspections.map((inspection) => (
                        <TableRow key={inspection.id}>
                          <TableCell>{inspection.numero_ordre}</TableCell>
                          <TableCell>{inspection.centre_controle || '-'}</TableCell>
                          <TableCell>{format(new Date(inspection.date_visite), 'dd/MM/yyyy', { locale: fr })}</TableCell>
                          <TableCell>{format(new Date(inspection.date_expiration), 'dd/MM/yyyy', { locale: fr })}</TableCell>
                          <TableCell className="text-right">{inspection.montant?.toFixed(2) || '-'}</TableCell>
                          <TableCell className="text-right text-muted-foreground text-sm">
                            {format(new Date(inspection.created_at), 'dd/MM/yyyy HH:mm', { locale: fr })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Aucune visite technique enregistrée
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="vidange" className="mt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-lg ${
                      getOilChangeAlertLevel() === 'critical' ? 'bg-destructive/20' :
                      getOilChangeAlertLevel() === 'warning' ? 'bg-warning/20' :
                      'bg-success/20'
                    }`}>
                      <Wrench className={`w-6 h-6 ${
                        getOilChangeAlertLevel() === 'critical' ? 'text-destructive' :
                        getOilChangeAlertLevel() === 'warning' ? 'text-warning' :
                        'text-success'
                      }`} />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Kilométrage depuis dernière vidange</p>
                      <p className={`text-2xl font-bold ${
                        getOilChangeAlertLevel() === 'critical' ? 'text-destructive' :
                        getOilChangeAlertLevel() === 'warning' ? 'text-warning' :
                        'text-success'
                      }`}>
                        {calculateKmDepuisVidange().toLocaleString()} km
                      </p>
                    </div>
                  </div>
                  <Button 
                    onClick={() => setShowVidangeDialog(true)}
                    className="gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    EFFECTUER VIDANGE
                  </Button>
                </div>

                {vidanges.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Kilométrage</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-right">Montant</TableHead>
                        <TableHead>Remarques</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {vidanges.map((vidange) => (
                        <TableRow key={vidange.id}>
                          <TableCell>{format(new Date(vidange.date_vidange), 'dd/MM/yyyy', { locale: fr })}</TableCell>
                          <TableCell>{vidange.kilometrage.toLocaleString()} km</TableCell>
                          <TableCell>{vidange.type || '-'}</TableCell>
                          <TableCell className="text-right">{vidange.montant?.toFixed(2) || '-'} DH</TableCell>
                          <TableCell className="text-muted-foreground text-sm">{vidange.remarques || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Aucune vidange enregistrée
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="vignette" className="mt-6">
              <div className="space-y-4">
                <div className="flex justify-end">
                  <Button size="sm" className="gap-2">
                    <Plus className="w-4 h-4" />
                    AJOUTER VIGNETTE
                  </Button>
                </div>
                {vignettes.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>N° d'ordre</TableHead>
                        <TableHead>Année</TableHead>
                        <TableHead>Date d'expiration</TableHead>
                        <TableHead className="text-right">Montant</TableHead>
                        <TableHead className="text-right">Date création</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {vignettes.map((vignette) => (
                        <TableRow key={vignette.id}>
                          <TableCell>{vignette.numero_ordre}</TableCell>
                          <TableCell>{vignette.annee}</TableCell>
                          <TableCell>{format(new Date(vignette.date_expiration), 'dd/MM/yyyy', { locale: fr })}</TableCell>
                          <TableCell className="text-right">{vignette.montant?.toFixed(2) || '-'}</TableCell>
                          <TableCell className="text-right text-muted-foreground text-sm">
                            {format(new Date(vignette.created_at), 'dd/MM/yyyy HH:mm', { locale: fr })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Aucune vignette enregistrée
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Dialog for contracts list */}
      <Dialog open={showContractsList} onOpenChange={setShowContractsList}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Locations et Assistances</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {contracts.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Contrats ({contracts.length})</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>N° Contrat</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Date début</TableHead>
                      <TableHead>Date fin</TableHead>
                      <TableHead className="text-right">Montant</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contracts.slice(0, 5).map((contract) => (
                      <TableRow key={contract.id}>
                        <TableCell>{contract.numero_contrat}</TableCell>
                        <TableCell>
                          {contract.clients?.nom} {contract.clients?.prenom}
                        </TableCell>
                        <TableCell>{format(new Date(contract.date_debut), 'dd/MM/yyyy', { locale: fr })}</TableCell>
                        <TableCell>{format(new Date(contract.date_fin), 'dd/MM/yyyy', { locale: fr })}</TableCell>
                        <TableCell className="text-right">{contract.total_amount.toFixed(2)} DH</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            {assistances.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Assistances ({assistances.length})</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>N° Dossier</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Date début</TableHead>
                      <TableHead>Date fin</TableHead>
                      <TableHead className="text-right">Montant</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assistances.slice(0, 5).map((assistance) => (
                      <TableRow key={assistance.id}>
                        <TableCell>{assistance.num_dossier}</TableCell>
                        <TableCell>
                          {assistance.clients?.nom} {assistance.clients?.prenom}
                        </TableCell>
                        <TableCell>{format(new Date(assistance.date_debut), 'dd/MM/yyyy', { locale: fr })}</TableCell>
                        <TableCell>{assistance.date_fin ? format(new Date(assistance.date_fin), 'dd/MM/yyyy', { locale: fr }) : '-'}</TableCell>
                        <TableCell className="text-right">{(assistance.montant_facture || assistance.montant_total || 0).toFixed(2)} DH</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog for marking vidange as done */}
      <Dialog open={showVidangeDialog} onOpenChange={setShowVidangeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Effectuer la vidange</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="prochainKm">Prochain kilométrage de vidange (optionnel)</Label>
              <Input
                id="prochainKm"
                type="number"
                value={prochainKmVidange}
                onChange={(e) => setProchainKmVidange(e.target.value)}
                placeholder={`Ex: ${(vehicle?.kilometrage || 0) + 8000}`}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Laissez vide pour utiliser le calcul automatique (8000 km)
              </p>
            </div>
            <div>
              <Label htmlFor="montant">Montant (optionnel)</Label>
              <Input
                id="montant"
                type="number"
                step="0.01"
                value={montantVidange}
                onChange={(e) => setMontantVidange(e.target.value)}
                placeholder="0.00"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Si renseigné, une dépense sera créée automatiquement
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowVidangeDialog(false);
              setProchainKmVidange('');
              setMontantVidange('');
            }}>
              Annuler
            </Button>
            <Button onClick={handleMarkOilChangeDone}>
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
