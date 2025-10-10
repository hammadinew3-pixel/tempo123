import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Edit, TrendingUp, TrendingDown, Calendar, AlertCircle, Shield, ClipboardCheck, FileCheck, CreditCard, Wrench, Plus, DollarSign, Car, Gauge, FileText, Eye, Settings, Upload } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  
  // Dialog states for adding documents
  const [showInsuranceDialog, setShowInsuranceDialog] = useState(false);
  const [showInspectionDialog, setShowInspectionDialog] = useState(false);
  const [showVignetteDialog, setShowVignetteDialog] = useState(false);
  
  // Form states for insurance
  const [insuranceForm, setInsuranceForm] = useState({
    numero_ordre: '',
    numero_police: '',
    assureur: '',
    coordonnees_assureur: '',
    date_debut: '',
    date_expiration: '',
    montant: '',
    date_paiement: '',
    mode_paiement: 'especes' as 'especes' | 'cheque' | 'virement' | 'carte',
    numero_cheque: '',
    banque: '',
    remarques: ''
  });
  const [insurancePhoto, setInsurancePhoto] = useState<File | null>(null);
  const [uploadingInsurance, setUploadingInsurance] = useState(false);
  
  // Form states for inspection
  const [inspectionForm, setInspectionForm] = useState({
    numero_ordre: '',
    centre_controle: '',
    date_visite: '',
    date_expiration: '',
    montant: '',
    date_paiement: '',
    mode_paiement: 'especes' as 'especes' | 'cheque' | 'virement' | 'carte',
    numero_cheque: '',
    banque: '',
    remarques: ''
  });
  const [inspectionPhoto, setInspectionPhoto] = useState<File | null>(null);
  const [uploadingInspection, setUploadingInspection] = useState(false);
  
  // Form states for vignette
  const [vignetteForm, setVignetteForm] = useState({
    numero_ordre: '',
    annee: new Date().getFullYear().toString(),
    date_expiration: '',
    montant: '',
    date_paiement: '',
    mode_paiement: 'especes' as 'especes' | 'cheque' | 'virement' | 'carte',
    numero_cheque: '',
    banque: '',
    remarques: ''
  });
  const [vignettePhoto, setVignettePhoto] = useState<File | null>(null);
  const [uploadingVignette, setUploadingVignette] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  // View detail states
  const [selectedInsurance, setSelectedInsurance] = useState<any>(null);
  const [selectedInspection, setSelectedInspection] = useState<any>(null);
  const [selectedVignette, setSelectedVignette] = useState<any>(null);

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

  const handleDeleteVehicle = async () => {
    if (!vehicle) return;
    
    setDeleting(true);
    try {
      // Check if vehicle has active contracts or assistances
      const activeContracts = contracts.filter(c => c.statut === 'livre' || c.statut === 'contrat_valide');
      const activeAssistances = assistances.filter(a => a.etat === 'livre' || a.etat === 'contrat_valide');
      
      if (activeContracts.length > 0 || activeAssistances.length > 0) {
        toast({
          title: "Impossible de supprimer",
          description: "Ce véhicule a des contrats ou assistances actifs",
          variant: "destructive"
        });
        setDeleting(false);
        setShowDeleteDialog(false);
        return;
      }

      const { error } = await supabase
        .from('vehicles')
        .delete()
        .eq('id', vehicle.id);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Véhicule supprimé avec succès"
      });

      navigate('/vehicules');
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de supprimer le véhicule",
        variant: "destructive"
      });
      setDeleting(false);
    }
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
        <div className="flex flex-col sm:flex-row gap-2">
          <Button 
            onClick={() => navigate(`/vehicules/${id}/modifier`)}
            className="bg-info hover:bg-info/90 text-white gap-2"
          >
            <Edit className="w-4 h-4" />
            MODIFIER LE VÉHICULE
          </Button>
          <Button 
            onClick={() => setShowDeleteDialog(true)}
            variant="destructive"
            className="gap-2"
          >
            <AlertCircle className="w-4 h-4" />
            SUPPRIMER LE VÉHICULE
          </Button>
        </div>
      </div>

      {/* Alertes Documents */}
      {alerts.length > 0 && (
        <Card className="border-l-4 border-l-warning bg-warning/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-warning">
              <AlertCircle className="w-5 h-5" />
              Alertes Documents
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {alerts.map((alert, index) => (
              <Alert 
                key={index} 
                className={`${
                  alert.severity === 'critical' ? 'border-destructive bg-destructive/5' : 
                  alert.severity === 'warning' ? 'border-warning bg-warning/5' : 
                  'border-info bg-info/5'
                }`}
              >
                <AlertDescription className="flex items-center justify-between">
                  <span className="font-medium">{alert.message}</span>
                  <Button 
                    size="sm" 
                    variant={alert.severity === 'critical' ? 'destructive' : 'default'}
                    className="text-xs"
                    onClick={() => {
                      if (alert.action.includes('ASSURANCE') || alert.message.includes('Assurance')) {
                        setShowInsuranceDialog(true);
                      } else if (alert.action.includes('VISITE') || alert.message.includes('Visite technique')) {
                        setShowInspectionDialog(true);
                      } else if (alert.action.includes('VIGNETTE') || alert.message.includes('Vignette')) {
                        setShowVignetteDialog(true);
                      } else if (alert.action.includes('VIDANGE') || alert.message.includes('Vidange')) {
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
                    <Switch 
                      checked={vehicle.en_service || false} 
                      onCheckedChange={async (checked) => {
                        try {
                          const { error } = await supabase
                            .from('vehicles')
                            .update({ en_service: checked })
                            .eq('id', vehicle.id);
                          
                          if (error) throw error;
                          
                          setVehicle({ ...vehicle, en_service: checked });
                          toast({
                            title: "Succès",
                            description: `Véhicule ${checked ? 'mis en service' : 'retiré du service'}`,
                          });
                        } catch (error: any) {
                          toast({
                            title: "Erreur",
                            description: error.message,
                            variant: "destructive"
                          });
                        }
                      }}
                    />
                    <span className="text-sm font-medium">En service</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch 
                      checked={vehicle.sous_location || false}
                      onCheckedChange={async (checked) => {
                        try {
                          const { error } = await supabase
                            .from('vehicles')
                            .update({ sous_location: checked })
                            .eq('id', vehicle.id);
                          
                          if (error) throw error;
                          
                          setVehicle({ ...vehicle, sous_location: checked });
                          toast({
                            title: "Succès",
                            description: `Véhicule ${checked ? 'en' : 'retiré de'} sous-location`,
                          });
                        } catch (error: any) {
                          toast({
                            title: "Erreur",
                            description: error.message,
                            variant: "destructive"
                          });
                        }
                      }}
                    />
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
                  <Button size="sm" className="gap-2" onClick={() => setShowInsuranceDialog(true)}>
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
                        <TableHead className="text-center">Photo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {insurances.map((insurance) => {
                        const today = new Date();
                        const expirationDate = new Date(insurance.date_expiration);
                        const daysUntilExpiration = Math.ceil((expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                        
                        return (
                          <TableRow 
                            key={insurance.id}
                            className="cursor-pointer hover:bg-accent/50"
                            onClick={() => setSelectedInsurance(insurance)}
                          >
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
                            <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                              {insurance.photo_url ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => window.open(insurance.photo_url, '_blank')}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                              ) : (
                                <span className="text-muted-foreground text-xs">-</span>
                              )}
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
                  <Button size="sm" className="gap-2" onClick={() => setShowInspectionDialog(true)}>
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
                        <TableHead className="text-center">Photo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {technicalInspections.map((inspection) => {
                        const today = new Date();
                        const expirationDate = new Date(inspection.date_expiration);
                        const daysUntilExpiration = Math.ceil((expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                        
                        return (
                          <TableRow 
                            key={inspection.id}
                            className="cursor-pointer hover:bg-accent/50"
                            onClick={() => setSelectedInspection(inspection)}
                          >
                            <TableCell>{inspection.numero_ordre}</TableCell>
                            <TableCell>{inspection.centre_controle || '-'}</TableCell>
                            <TableCell>{format(new Date(inspection.date_visite), 'dd/MM/yyyy', { locale: fr })}</TableCell>
                            <TableCell>
                              <span className={daysUntilExpiration <= 30 && daysUntilExpiration > 0 ? 'text-warning font-medium' : ''}>
                                {format(new Date(inspection.date_expiration), 'dd/MM/yyyy', { locale: fr })}
                              </span>
                              {daysUntilExpiration > 0 && daysUntilExpiration <= 30 && (
                                <Badge variant="outline" className="ml-2 bg-warning/10 text-warning border-warning">
                                  {daysUntilExpiration}J
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">{inspection.montant?.toFixed(2) || '-'}</TableCell>
                            <TableCell className="text-right text-muted-foreground text-sm">
                              {format(new Date(inspection.created_at), 'dd/MM/yyyy HH:mm', { locale: fr })}
                            </TableCell>
                            <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                              {inspection.photo_url ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => window.open(inspection.photo_url, '_blank')}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                              ) : (
                                <span className="text-muted-foreground text-xs">-</span>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
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
                  <Button size="sm" className="gap-2" onClick={() => setShowVignetteDialog(true)}>
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
                        <TableHead className="text-center">Photo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {vignettes.map((vignette) => {
                        const today = new Date();
                        const expirationDate = new Date(vignette.date_expiration);
                        const daysUntilExpiration = Math.ceil((expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                        
                        return (
                          <TableRow 
                            key={vignette.id}
                            className="cursor-pointer hover:bg-accent/50"
                            onClick={() => setSelectedVignette(vignette)}
                          >
                            <TableCell>{vignette.numero_ordre}</TableCell>
                            <TableCell>{vignette.annee}</TableCell>
                            <TableCell>
                              <span className={daysUntilExpiration <= 30 && daysUntilExpiration > 0 ? 'text-warning font-medium' : ''}>
                                {format(new Date(vignette.date_expiration), 'dd/MM/yyyy', { locale: fr })}
                              </span>
                              {daysUntilExpiration > 0 && daysUntilExpiration <= 30 && (
                                <Badge variant="outline" className="ml-2 bg-warning/10 text-warning border-warning">
                                  {daysUntilExpiration}J
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">{vignette.montant?.toFixed(2) || '-'}</TableCell>
                            <TableCell className="text-right text-muted-foreground text-sm">
                              {format(new Date(vignette.created_at), 'dd/MM/yyyy HH:mm', { locale: fr })}
                            </TableCell>
                            <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                              {vignette.photo_url ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => window.open(vignette.photo_url, '_blank')}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                              ) : (
                                <span className="text-muted-foreground text-xs">-</span>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
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

      {/* Dialog for adding insurance */}
      <Dialog open={showInsuranceDialog} onOpenChange={setShowInsuranceDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Ajouter une assurance</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div>
              <Label htmlFor="ins-numero-ordre">N° d'ordre *</Label>
              <Input
                id="ins-numero-ordre"
                value={insuranceForm.numero_ordre}
                onChange={(e) => setInsuranceForm({ ...insuranceForm, numero_ordre: e.target.value })}
                placeholder="Ex: ASS001"
              />
            </div>
            <div>
              <Label htmlFor="ins-numero-police">N° de police</Label>
              <Input
                id="ins-numero-police"
                value={insuranceForm.numero_police}
                onChange={(e) => setInsuranceForm({ ...insuranceForm, numero_police: e.target.value })}
                placeholder="Ex: POL123456"
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="ins-assureur">Assureur *</Label>
              <Input
                id="ins-assureur"
                value={insuranceForm.assureur}
                onChange={(e) => setInsuranceForm({ ...insuranceForm, assureur: e.target.value })}
                placeholder="Ex: AXA Assurance"
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="ins-coordonnees">Coordonnées de l'assureur</Label>
              <Textarea
                id="ins-coordonnees"
                value={insuranceForm.coordonnees_assureur}
                onChange={(e) => setInsuranceForm({ ...insuranceForm, coordonnees_assureur: e.target.value })}
                placeholder="Adresse, téléphone, email..."
              />
            </div>
            <div>
              <Label htmlFor="ins-date-debut">Date début *</Label>
              <Input
                id="ins-date-debut"
                type="date"
                value={insuranceForm.date_debut}
                onChange={(e) => setInsuranceForm({ ...insuranceForm, date_debut: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="ins-date-exp">Date d'expiration *</Label>
              <Input
                id="ins-date-exp"
                type="date"
                value={insuranceForm.date_expiration}
                onChange={(e) => setInsuranceForm({ ...insuranceForm, date_expiration: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="ins-montant">Montant *</Label>
              <Input
                id="ins-montant"
                type="number"
                step="0.01"
                value={insuranceForm.montant}
                onChange={(e) => setInsuranceForm({ ...insuranceForm, montant: e.target.value })}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label htmlFor="ins-date-paiement">Date de paiement *</Label>
              <Input
                id="ins-date-paiement"
                type="date"
                value={insuranceForm.date_paiement}
                onChange={(e) => setInsuranceForm({ ...insuranceForm, date_paiement: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="ins-mode-paiement">Mode de paiement *</Label>
              <Select value={insuranceForm.mode_paiement} onValueChange={(value: any) => setInsuranceForm({ ...insuranceForm, mode_paiement: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="especes">Espèces</SelectItem>
                  <SelectItem value="cheque">Chèque</SelectItem>
                  <SelectItem value="virement">Virement</SelectItem>
                  <SelectItem value="carte">Carte</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {insuranceForm.mode_paiement === 'cheque' && (
              <>
                <div>
                  <Label htmlFor="ins-numero-cheque">N° de chèque</Label>
                  <Input
                    id="ins-numero-cheque"
                    value={insuranceForm.numero_cheque}
                    onChange={(e) => setInsuranceForm({ ...insuranceForm, numero_cheque: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="ins-banque">Banque</Label>
                  <Input
                    id="ins-banque"
                    value={insuranceForm.banque}
                    onChange={(e) => setInsuranceForm({ ...insuranceForm, banque: e.target.value })}
                  />
                </div>
              </>
            )}
            <div className="col-span-2">
              <Label htmlFor="ins-remarques">Remarques</Label>
              <Textarea
                id="ins-remarques"
                value={insuranceForm.remarques}
                onChange={(e) => setInsuranceForm({ ...insuranceForm, remarques: e.target.value })}
                placeholder="Notes additionnelles..."
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="ins-photo">Photo du document</Label>
              <Input
                id="ins-photo"
                type="file"
                accept="image/*"
                onChange={(e) => setInsurancePhoto(e.target.files?.[0] || null)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Formats acceptés: JPG, PNG, WEBP
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowInsuranceDialog(false);
              setInsuranceForm({
                numero_ordre: '', numero_police: '', assureur: '', coordonnees_assureur: '',
                date_debut: '', date_expiration: '', montant: '', date_paiement: '',
                mode_paiement: 'especes', numero_cheque: '', banque: '', remarques: ''
              });
            }}>
              Annuler
            </Button>
            <Button 
              onClick={async () => {
                try {
                  if (!insuranceForm.numero_ordre || !insuranceForm.assureur || !insuranceForm.date_debut || 
                      !insuranceForm.date_expiration || !insuranceForm.montant || !insuranceForm.date_paiement) {
                    toast({
                      title: "Erreur",
                      description: "Veuillez remplir tous les champs obligatoires",
                      variant: "destructive"
                    });
                    return;
                  }

                  setUploadingInsurance(true);
                  let photoUrl = null;

                  // Upload photo if provided
                  if (insurancePhoto) {
                    const fileExt = insurancePhoto.name.split('.').pop();
                    const fileName = `${vehicle!.id}/insurance/${Date.now()}.${fileExt}`;
                    
                    const { error: uploadError, data } = await supabase.storage
                      .from('vehicle-documents')
                      .upload(fileName, insurancePhoto);

                    if (uploadError) throw uploadError;

                    const { data: { publicUrl } } = supabase.storage
                      .from('vehicle-documents')
                      .getPublicUrl(fileName);
                    
                    photoUrl = publicUrl;
                  }

                  const { error } = await supabase.from('vehicle_insurance').insert({
                    vehicle_id: vehicle!.id,
                    ...insuranceForm,
                    montant: parseFloat(insuranceForm.montant),
                    photo_url: photoUrl
                  });

                  if (error) throw error;

                  // Update vehicle expiration date
                  await supabase.from('vehicles').update({
                    assurance_expire_le: insuranceForm.date_expiration
                  }).eq('id', vehicle!.id);

                  toast({
                    title: "Succès",
                    description: "Assurance ajoutée avec succès"
                  });

                  setShowInsuranceDialog(false);
                  setInsuranceForm({
                    numero_ordre: '', numero_police: '', assureur: '', coordonnees_assureur: '',
                    date_debut: '', date_expiration: '', montant: '', date_paiement: '',
                    mode_paiement: 'especes', numero_cheque: '', banque: '', remarques: ''
                  });
                  setInsurancePhoto(null);
                  loadVehicle();
                } catch (error: any) {
                  toast({
                    title: "Erreur",
                    description: error.message,
                    variant: "destructive"
                  });
                } finally {
                  setUploadingInsurance(false);
                }
              }}
              disabled={uploadingInsurance}
            >
              {uploadingInsurance ? "Upload en cours..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog for adding technical inspection */}
      <Dialog open={showInspectionDialog} onOpenChange={setShowInspectionDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Ajouter une visite technique</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div>
              <Label htmlFor="insp-numero-ordre">N° d'ordre *</Label>
              <Input
                id="insp-numero-ordre"
                value={inspectionForm.numero_ordre}
                onChange={(e) => setInspectionForm({ ...inspectionForm, numero_ordre: e.target.value })}
                placeholder="Ex: VT001"
              />
            </div>
            <div>
              <Label htmlFor="insp-centre">Centre de contrôle</Label>
              <Input
                id="insp-centre"
                value={inspectionForm.centre_controle}
                onChange={(e) => setInspectionForm({ ...inspectionForm, centre_controle: e.target.value })}
                placeholder="Ex: Centre Auto Contrôle"
              />
            </div>
            <div>
              <Label htmlFor="insp-date-visite">Date de visite *</Label>
              <Input
                id="insp-date-visite"
                type="date"
                value={inspectionForm.date_visite}
                onChange={(e) => setInspectionForm({ ...inspectionForm, date_visite: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="insp-date-exp">Date d'expiration *</Label>
              <Input
                id="insp-date-exp"
                type="date"
                value={inspectionForm.date_expiration}
                onChange={(e) => setInspectionForm({ ...inspectionForm, date_expiration: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="insp-montant">Montant</Label>
              <Input
                id="insp-montant"
                type="number"
                step="0.01"
                value={inspectionForm.montant}
                onChange={(e) => setInspectionForm({ ...inspectionForm, montant: e.target.value })}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label htmlFor="insp-date-paiement">Date de paiement</Label>
              <Input
                id="insp-date-paiement"
                type="date"
                value={inspectionForm.date_paiement}
                onChange={(e) => setInspectionForm({ ...inspectionForm, date_paiement: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="insp-mode-paiement">Mode de paiement</Label>
              <Select value={inspectionForm.mode_paiement} onValueChange={(value: any) => setInspectionForm({ ...inspectionForm, mode_paiement: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="especes">Espèces</SelectItem>
                  <SelectItem value="cheque">Chèque</SelectItem>
                  <SelectItem value="virement">Virement</SelectItem>
                  <SelectItem value="carte">Carte</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {inspectionForm.mode_paiement === 'cheque' && (
              <>
                <div>
                  <Label htmlFor="insp-numero-cheque">N° de chèque</Label>
                  <Input
                    id="insp-numero-cheque"
                    value={inspectionForm.numero_cheque}
                    onChange={(e) => setInspectionForm({ ...inspectionForm, numero_cheque: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="insp-banque">Banque</Label>
                  <Input
                    id="insp-banque"
                    value={inspectionForm.banque}
                    onChange={(e) => setInspectionForm({ ...inspectionForm, banque: e.target.value })}
                  />
                </div>
              </>
            )}
            <div className="col-span-2">
              <Label htmlFor="insp-remarques">Remarques</Label>
              <Textarea
                id="insp-remarques"
                value={inspectionForm.remarques}
                onChange={(e) => setInspectionForm({ ...inspectionForm, remarques: e.target.value })}
                placeholder="Notes additionnelles..."
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="insp-photo">Photo du document</Label>
              <Input
                id="insp-photo"
                type="file"
                accept="image/*"
                onChange={(e) => setInspectionPhoto(e.target.files?.[0] || null)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Formats acceptés: JPG, PNG, WEBP
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowInspectionDialog(false);
              setInspectionForm({
                numero_ordre: '', centre_controle: '', date_visite: '', date_expiration: '',
                montant: '', date_paiement: '', mode_paiement: 'especes',
                numero_cheque: '', banque: '', remarques: ''
              });
            }}>
              Annuler
            </Button>
            <Button 
              onClick={async () => {
                try {
                  if (!inspectionForm.numero_ordre || !inspectionForm.date_visite || !inspectionForm.date_expiration) {
                    toast({
                      title: "Erreur",
                      description: "Veuillez remplir tous les champs obligatoires",
                      variant: "destructive"
                    });
                    return;
                  }

                  setUploadingInspection(true);
                  let photoUrl = null;

                  // Upload photo if provided
                  if (inspectionPhoto) {
                    const fileExt = inspectionPhoto.name.split('.').pop();
                    const fileName = `${vehicle!.id}/inspection/${Date.now()}.${fileExt}`;
                    
                    const { error: uploadError } = await supabase.storage
                      .from('vehicle-documents')
                      .upload(fileName, inspectionPhoto);

                    if (uploadError) throw uploadError;

                    const { data: { publicUrl } } = supabase.storage
                      .from('vehicle-documents')
                      .getPublicUrl(fileName);
                    
                    photoUrl = publicUrl;
                  }

                  const { error } = await supabase.from('vehicle_technical_inspection').insert({
                    vehicle_id: vehicle!.id,
                    ...inspectionForm,
                    montant: inspectionForm.montant ? parseFloat(inspectionForm.montant) : null,
                    photo_url: photoUrl
                  });

                  if (error) throw error;

                  // Update vehicle expiration date
                  await supabase.from('vehicles').update({
                    visite_technique_expire_le: inspectionForm.date_expiration
                  }).eq('id', vehicle!.id);

                  toast({
                    title: "Succès",
                    description: "Visite technique ajoutée avec succès"
                  });

                  setShowInspectionDialog(false);
                  setInspectionForm({
                    numero_ordre: '', centre_controle: '', date_visite: '', date_expiration: '',
                    montant: '', date_paiement: '', mode_paiement: 'especes',
                    numero_cheque: '', banque: '', remarques: ''
                  });
                  setInspectionPhoto(null);
                  loadVehicle();
                } catch (error: any) {
                  toast({
                    title: "Erreur",
                    description: error.message,
                    variant: "destructive"
                  });
                } finally {
                  setUploadingInspection(false);
                }
              }}
              disabled={uploadingInspection}
            >
              {uploadingInspection ? "Upload en cours..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog for adding vignette */}
      <Dialog open={showVignetteDialog} onOpenChange={setShowVignetteDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Ajouter une vignette</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div>
              <Label htmlFor="vig-numero-ordre">N° d'ordre *</Label>
              <Input
                id="vig-numero-ordre"
                value={vignetteForm.numero_ordre}
                onChange={(e) => setVignetteForm({ ...vignetteForm, numero_ordre: e.target.value })}
                placeholder="Ex: VIG001"
              />
            </div>
            <div>
              <Label htmlFor="vig-annee">Année *</Label>
              <Input
                id="vig-annee"
                type="number"
                value={vignetteForm.annee}
                onChange={(e) => setVignetteForm({ ...vignetteForm, annee: e.target.value })}
                placeholder={new Date().getFullYear().toString()}
              />
            </div>
            <div>
              <Label htmlFor="vig-date-exp">Date d'expiration *</Label>
              <Input
                id="vig-date-exp"
                type="date"
                value={vignetteForm.date_expiration}
                onChange={(e) => setVignetteForm({ ...vignetteForm, date_expiration: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="vig-montant">Montant</Label>
              <Input
                id="vig-montant"
                type="number"
                step="0.01"
                value={vignetteForm.montant}
                onChange={(e) => setVignetteForm({ ...vignetteForm, montant: e.target.value })}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label htmlFor="vig-date-paiement">Date de paiement</Label>
              <Input
                id="vig-date-paiement"
                type="date"
                value={vignetteForm.date_paiement}
                onChange={(e) => setVignetteForm({ ...vignetteForm, date_paiement: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="vig-mode-paiement">Mode de paiement</Label>
              <Select value={vignetteForm.mode_paiement} onValueChange={(value: any) => setVignetteForm({ ...vignetteForm, mode_paiement: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="especes">Espèces</SelectItem>
                  <SelectItem value="cheque">Chèque</SelectItem>
                  <SelectItem value="virement">Virement</SelectItem>
                  <SelectItem value="carte">Carte</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {vignetteForm.mode_paiement === 'cheque' && (
              <>
                <div>
                  <Label htmlFor="vig-numero-cheque">N° de chèque</Label>
                  <Input
                    id="vig-numero-cheque"
                    value={vignetteForm.numero_cheque}
                    onChange={(e) => setVignetteForm({ ...vignetteForm, numero_cheque: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="vig-banque">Banque</Label>
                  <Input
                    id="vig-banque"
                    value={vignetteForm.banque}
                    onChange={(e) => setVignetteForm({ ...vignetteForm, banque: e.target.value })}
                  />
                </div>
              </>
            )}
            <div className="col-span-2">
              <Label htmlFor="vig-remarques">Remarques</Label>
              <Textarea
                id="vig-remarques"
                value={vignetteForm.remarques}
                onChange={(e) => setVignetteForm({ ...vignetteForm, remarques: e.target.value })}
                placeholder="Notes additionnelles..."
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="vig-photo">Photo du document</Label>
              <Input
                id="vig-photo"
                type="file"
                accept="image/*"
                onChange={(e) => setVignettePhoto(e.target.files?.[0] || null)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Formats acceptés: JPG, PNG, WEBP
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowVignetteDialog(false);
              setVignetteForm({
                numero_ordre: '', annee: new Date().getFullYear().toString(), date_expiration: '',
                montant: '', date_paiement: '', mode_paiement: 'especes',
                numero_cheque: '', banque: '', remarques: ''
              });
            }}>
              Annuler
            </Button>
            <Button 
              onClick={async () => {
                try {
                  if (!vignetteForm.numero_ordre || !vignetteForm.annee || !vignetteForm.date_expiration) {
                    toast({
                      title: "Erreur",
                      description: "Veuillez remplir tous les champs obligatoires",
                      variant: "destructive"
                    });
                    return;
                  }

                  setUploadingVignette(true);
                  let photoUrl = null;

                  // Upload photo if provided
                  if (vignettePhoto) {
                    const fileExt = vignettePhoto.name.split('.').pop();
                    const fileName = `${vehicle!.id}/vignette/${Date.now()}.${fileExt}`;
                    
                    const { error: uploadError } = await supabase.storage
                      .from('vehicle-documents')
                      .upload(fileName, vignettePhoto);

                    if (uploadError) throw uploadError;

                    const { data: { publicUrl } } = supabase.storage
                      .from('vehicle-documents')
                      .getPublicUrl(fileName);
                    
                    photoUrl = publicUrl;
                  }

                  const { error } = await supabase.from('vehicle_vignette').insert({
                    vehicle_id: vehicle!.id,
                    ...vignetteForm,
                    annee: parseInt(vignetteForm.annee),
                    montant: vignetteForm.montant ? parseFloat(vignetteForm.montant) : null,
                    photo_url: photoUrl
                  });

                  if (error) throw error;

                  // Update vehicle expiration date
                  await supabase.from('vehicles').update({
                    vignette_expire_le: vignetteForm.date_expiration
                  }).eq('id', vehicle!.id);

                  toast({
                    title: "Succès",
                    description: "Vignette ajoutée avec succès"
                  });

                  setShowVignetteDialog(false);
                  setVignetteForm({
                    numero_ordre: '', annee: new Date().getFullYear().toString(), date_expiration: '',
                    montant: '', date_paiement: '', mode_paiement: 'especes',
                    numero_cheque: '', banque: '', remarques: ''
                  });
                  setVignettePhoto(null);
                  loadVehicle();
                } catch (error: any) {
                  toast({
                    title: "Erreur",
                    description: error.message,
                    variant: "destructive"
                  });
                } finally {
                  setUploadingVignette(false);
                }
              }}
              disabled={uploadingVignette}
            >
              {uploadingVignette ? "Upload en cours..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Insurance Detail Dialog */}
      <Dialog open={!!selectedInsurance} onOpenChange={() => setSelectedInsurance(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Détails de l'assurance</DialogTitle>
          </DialogHeader>
          {selectedInsurance && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">N° d'ordre</Label>
                  <p className="font-medium">{selectedInsurance.numero_ordre}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">N° de police</Label>
                  <p className="font-medium">{selectedInsurance.numero_police || '-'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Assureur</Label>
                  <p className="font-medium">{selectedInsurance.assureur}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Coordonnées assureur</Label>
                  <p className="font-medium">{selectedInsurance.coordonnees_assureur || '-'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Date début</Label>
                  <p className="font-medium">{format(new Date(selectedInsurance.date_debut), 'dd/MM/yyyy', { locale: fr })}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Date d'expiration</Label>
                  <p className="font-medium">{format(new Date(selectedInsurance.date_expiration), 'dd/MM/yyyy', { locale: fr })}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Montant</Label>
                  <p className="font-medium">{selectedInsurance.montant.toFixed(2)} DH</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Date de paiement</Label>
                  <p className="font-medium">{selectedInsurance.date_paiement ? format(new Date(selectedInsurance.date_paiement), 'dd/MM/yyyy', { locale: fr }) : '-'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Mode de paiement</Label>
                  <p className="font-medium capitalize">{selectedInsurance.mode_paiement}</p>
                </div>
                {selectedInsurance.numero_cheque && (
                  <div>
                    <Label className="text-muted-foreground">N° de chèque</Label>
                    <p className="font-medium">{selectedInsurance.numero_cheque}</p>
                  </div>
                )}
                {selectedInsurance.banque && (
                  <div>
                    <Label className="text-muted-foreground">Banque</Label>
                    <p className="font-medium">{selectedInsurance.banque}</p>
                  </div>
                )}
              </div>
              {selectedInsurance.remarques && (
                <div>
                  <Label className="text-muted-foreground">Remarques</Label>
                  <p className="font-medium">{selectedInsurance.remarques}</p>
                </div>
              )}
              {selectedInsurance.photo_url && (
                <div>
                  <Label className="text-muted-foreground">Photo du document</Label>
                  <img 
                    src={selectedInsurance.photo_url} 
                    alt="Document d'assurance" 
                    className="w-full mt-2 rounded-lg border"
                  />
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* View Inspection Detail Dialog */}
      <Dialog open={!!selectedInspection} onOpenChange={() => setSelectedInspection(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Détails de la visite technique</DialogTitle>
          </DialogHeader>
          {selectedInspection && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">N° d'ordre</Label>
                  <p className="font-medium">{selectedInspection.numero_ordre}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Centre de contrôle</Label>
                  <p className="font-medium">{selectedInspection.centre_controle || '-'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Date de visite</Label>
                  <p className="font-medium">{format(new Date(selectedInspection.date_visite), 'dd/MM/yyyy', { locale: fr })}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Date d'expiration</Label>
                  <p className="font-medium">{format(new Date(selectedInspection.date_expiration), 'dd/MM/yyyy', { locale: fr })}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Montant</Label>
                  <p className="font-medium">{selectedInspection.montant?.toFixed(2) || '-'} DH</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Date de paiement</Label>
                  <p className="font-medium">{selectedInspection.date_paiement ? format(new Date(selectedInspection.date_paiement), 'dd/MM/yyyy', { locale: fr }) : '-'}</p>
                </div>
                {selectedInspection.mode_paiement && (
                  <div>
                    <Label className="text-muted-foreground">Mode de paiement</Label>
                    <p className="font-medium capitalize">{selectedInspection.mode_paiement}</p>
                  </div>
                )}
                {selectedInspection.numero_cheque && (
                  <div>
                    <Label className="text-muted-foreground">N° de chèque</Label>
                    <p className="font-medium">{selectedInspection.numero_cheque}</p>
                  </div>
                )}
                {selectedInspection.banque && (
                  <div>
                    <Label className="text-muted-foreground">Banque</Label>
                    <p className="font-medium">{selectedInspection.banque}</p>
                  </div>
                )}
              </div>
              {selectedInspection.remarques && (
                <div>
                  <Label className="text-muted-foreground">Remarques</Label>
                  <p className="font-medium">{selectedInspection.remarques}</p>
                </div>
              )}
              {selectedInspection.photo_url && (
                <div>
                  <Label className="text-muted-foreground">Photo du document</Label>
                  <img 
                    src={selectedInspection.photo_url} 
                    alt="Document de visite technique" 
                    className="w-full mt-2 rounded-lg border"
                  />
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* View Vignette Detail Dialog */}
      <Dialog open={!!selectedVignette} onOpenChange={() => setSelectedVignette(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Détails de la vignette</DialogTitle>
          </DialogHeader>
          {selectedVignette && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">N° d'ordre</Label>
                  <p className="font-medium">{selectedVignette.numero_ordre}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Année</Label>
                  <p className="font-medium">{selectedVignette.annee}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Date d'expiration</Label>
                  <p className="font-medium">{format(new Date(selectedVignette.date_expiration), 'dd/MM/yyyy', { locale: fr })}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Montant</Label>
                  <p className="font-medium">{selectedVignette.montant?.toFixed(2) || '-'} DH</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Date de paiement</Label>
                  <p className="font-medium">{selectedVignette.date_paiement ? format(new Date(selectedVignette.date_paiement), 'dd/MM/yyyy', { locale: fr }) : '-'}</p>
                </div>
                {selectedVignette.mode_paiement && (
                  <div>
                    <Label className="text-muted-foreground">Mode de paiement</Label>
                    <p className="font-medium capitalize">{selectedVignette.mode_paiement}</p>
                  </div>
                )}
                {selectedVignette.numero_cheque && (
                  <div>
                    <Label className="text-muted-foreground">N° de chèque</Label>
                    <p className="font-medium">{selectedVignette.numero_cheque}</p>
                  </div>
                )}
                {selectedVignette.banque && (
                  <div>
                    <Label className="text-muted-foreground">Banque</Label>
                    <p className="font-medium">{selectedVignette.banque}</p>
                  </div>
                )}
              </div>
              {selectedVignette.remarques && (
                <div>
                  <Label className="text-muted-foreground">Remarques</Label>
                  <p className="font-medium">{selectedVignette.remarques}</p>
                </div>
              )}
              {selectedVignette.photo_url && (
                <div>
                  <Label className="text-muted-foreground">Photo du document</Label>
                  <img 
                    src={selectedVignette.photo_url} 
                    alt="Document de vignette" 
                    className="w-full mt-2 rounded-lg border"
                  />
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Vehicle Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-muted-foreground">
              Êtes-vous sûr de vouloir supprimer ce véhicule ? Cette action est irréversible.
            </p>
            <p className="text-sm text-destructive mt-2">
              Véhicule: {vehicle.marque} {vehicle.modele} - Mat. {vehicle.immatriculation}
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={deleting}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteVehicle}
              disabled={deleting}
            >
              {deleting ? "Suppression..." : "Supprimer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
