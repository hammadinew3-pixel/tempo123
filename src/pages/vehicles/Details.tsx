import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Edit, TrendingUp, TrendingDown, Calendar as CalendarIcon, AlertCircle, Shield, ClipboardCheck, FileCheck, CreditCard, Wrench, Plus, DollarSign, Car, Gauge, FileText, Eye, Settings, Upload, Landmark, CheckCircle2, Clock, XCircle } from "lucide-react";
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
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EditInspectionDialog, EditVignetteDialog } from "@/components/vehicles/EditDialogs";
import { useUserRole } from "@/hooks/use-user-role";
type Vehicle = Database['public']['Tables']['vehicles']['Row'];
export default function VehiculeDetails() {
  const {
    id
  } = useParams();
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const { isAdmin } = useUserRole();
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

  // Traite bancaire states
  const [traites, setTraites] = useState<any[]>([]);
  const [echeances, setEcheances] = useState<any[]>([]);
  const [showTraiteDialog, setShowTraiteDialog] = useState(false);
  const [showEditTraiteDialog, setShowEditTraiteDialog] = useState(false);
  const [showPayEcheanceDialog, setShowPayEcheanceDialog] = useState(false);
  const [selectedEcheance, setSelectedEcheance] = useState<any>(null);
  const [selectedTraite, setSelectedTraite] = useState<any>(null);
  const [traiteForm, setTraiteForm] = useState({
    concessionaire: '',
    organisme: '',
    date_achat: '',
    prix_achat: '',
    avance: '',
    montant_mensuel: '',
    date_debut: '',
    duree_mois: '',
    duree_deja_paye: '0',
    plus_infos: ''
  });

  // Calculate remaining amount and validation
  const resteAPayer = parseFloat(traiteForm.prix_achat || '0') - parseFloat(traiteForm.avance || '0');
  
  const calculateEndDate = (startDate: string, months: number) => {
    if (!startDate || !months) return '';
    const start = new Date(startDate);
    start.setMonth(start.getMonth() + months - 1);
    return start.toISOString().split('T')[0];
  };

  const nombreMois = parseInt(traiteForm.duree_mois || '0');
  const dateFinCalculee = calculateEndDate(traiteForm.date_debut, nombreMois);
  const montantTotalMensualites = parseFloat(traiteForm.montant_mensuel || '0') * nombreMois;
  const isValidAmount = nombreMois > 0 && Math.abs(montantTotalMensualites - resteAPayer) < 0.01;
  const [echeancePaymentForm, setEcheancePaymentForm] = useState({
    date_paiement: new Date().toISOString().split('T')[0],
    mode_paiement: '',
    ref_paiement: '',
    notes: ''
  });

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

  // Edit dialog states
  const [editingInsurance, setEditingInsurance] = useState(false);
  const [editingInspection, setEditingInspection] = useState(false);
  const [editingVignette, setEditingVignette] = useState(false);
  const [editInsurancePhoto, setEditInsurancePhoto] = useState<File | null>(null);
  const [uploadingEditInsurance, setUploadingEditInsurance] = useState(false);
  useEffect(() => {
    if (id) {
      loadVehicle();
    }
  }, [id]);

  // Pre-fill traite form with vehicle valeur_achat
  useEffect(() => {
    if (vehicle?.valeur_achat && vehicle.valeur_achat > 0) {
      setTraiteForm(prev => ({
        ...prev,
        prix_achat: vehicle.valeur_achat.toString()
      }));
    }
  }, [vehicle]);
  const loadVehicle = async () => {
    try {
      const [vehicleRes, contractsRes, assistancesRes, expensesRes, insurancesRes, inspectionsRes, vignettesRes, vidangesRes, traitesRes, echeancesRes] = await Promise.all([supabase.from('vehicles').select('*').eq('id', id).single(), supabase.from('contracts').select(`*, clients (nom, prenom, telephone)`).eq('vehicle_id', id).order('created_at', {
        ascending: false
      }), supabase.from('assistance').select(`*, clients (nom, prenom, telephone)`).eq('vehicle_id', id).order('created_at', {
        ascending: false
      }), supabase.from('expenses').select('*').eq('vehicle_id', id).order('date_depense', {
        ascending: false
      }), supabase.from('vehicle_insurance').select('*').eq('vehicle_id', id).order('date_debut', {
        ascending: false
      }), supabase.from('vehicle_technical_inspection').select('*').eq('vehicle_id', id).order('date_visite', {
        ascending: false
      }), supabase.from('vehicle_vignette').select('*').eq('vehicle_id', id).order('annee', {
        ascending: false
      }), supabase.from('vidanges').select('*').eq('vehicle_id', id).order('date_vidange', {
        ascending: false
      }), supabase.from('vehicules_traite').select('*').eq('vehicle_id', id).order('created_at', {
        ascending: false
      }), supabase.from('vehicules_traites_echeances').select('*').eq('vehicle_id', id).order('date_echeance', {
        ascending: true
      })]);
      if (vehicleRes.error) throw vehicleRes.error;
      setVehicle(vehicleRes.data);
      setContracts(contractsRes.data || []);
      setAssistances(assistancesRes.data || []);
      setExpenses(expensesRes.data || []);
      setInsurances(insurancesRes.data || []);
      setTechnicalInspections(inspectionsRes.data || []);
      setVignettes(vignettesRes.data || []);
      setVidanges(vidangesRes.data || []);
      setTraites(traitesRes.data || []);
      setEcheances(echeancesRes.data || []);
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
      const {
        error
      } = await supabase.from('vehicles').delete().eq('id', vehicle.id);
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
          variant: "destructive"
        });
        return;
      }
      if (montant !== null && montant < 0) {
        toast({
          title: "Erreur",
          description: "Le montant doit être positif",
          variant: "destructive"
        });
        return;
      }
      const {
        error: vidangeError
      } = await supabase.from('vidanges').insert({
        vehicle_id: vehicle.id,
        kilometrage: vehicle.kilometrage,
        date_vidange: new Date().toISOString().split('T')[0],
        type: 'Vidange complète',
        montant: montant,
        remarques: prochainKm ? `Prochain kilométrage prévu: ${prochainKm} km` : null
      });
      if (vidangeError) throw vidangeError;
      if (montant !== null && montant > 0) {
        const {
          error: expenseError
        } = await supabase.from('expenses').insert([{
          vehicle_id: vehicle.id,
          categorie: 'entretien',
          montant: montant,
          date_depense: new Date().toISOString().split('T')[0],
          description: `Vidange complète à ${vehicle.kilometrage.toLocaleString()} km`
        }]);
        if (expenseError) throw expenseError;
      }
      const {
        error: updateError
      } = await supabase.from('vehicles').update({
        dernier_kilometrage_vidange: vehicle.kilometrage,
        date_derniere_vidange: new Date().toISOString().split('T')[0],
        prochain_kilometrage_vidange: prochainKm
      }).eq('id', vehicle.id);
      if (updateError) throw updateError;
      toast({
        title: "Succès",
        description: montant ? `Vidange enregistrée avec succès. Dépense de ${montant.toFixed(2)} DH ajoutée.` : "Vidange enregistrée avec succès"
      });
      setShowVidangeDialog(false);
      setProchainKmVidange('');
      setMontantVidange('');
      loadVehicle();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  // Traite bancaire functions
  const handleAddTraite = async () => {
    if (!vehicle) return;
    try {
      const prixAchat = parseFloat(traiteForm.prix_achat);
      const avance = parseFloat(traiteForm.avance) || 0;
      const montantMensuel = parseFloat(traiteForm.montant_mensuel);
      const dureeDejaPaye = parseInt(traiteForm.duree_deja_paye) || 0;

      if (!traiteForm.organisme || !traiteForm.date_debut || !traiteForm.duree_mois || !prixAchat || !montantMensuel) {
        toast({
          title: "Erreur",
          description: "Veuillez remplir tous les champs obligatoires (*)",
          variant: "destructive"
        });
        return;
      }

      if (!isValidAmount) {
        toast({
          title: "Erreur",
          description: "Le montant total des mensualités ne correspond pas au reste à payer",
          variant: "destructive"
        });
        return;
      }

      // Insert traite
      const { error } = await supabase.from('vehicules_traite').insert({
        vehicle_id: vehicle.id,
        organisme: traiteForm.organisme,
        concessionaire: traiteForm.concessionaire || null,
        date_achat: traiteForm.date_achat || null,
        montant_total: prixAchat,
        montant_mensuel: montantMensuel,
        date_debut: traiteForm.date_debut,
        nombre_traites: nombreMois,
        avance_paye: avance,
        duree_deja_paye: dureeDejaPaye,
        notes: traiteForm.plus_infos || null
      });

      if (error) throw error;

      // Update vehicle valeur_achat with prix_achat
      const { error: updateError } = await supabase
        .from('vehicles')
        .update({ valeur_achat: prixAchat })
        .eq('id', vehicle.id);

      if (updateError) throw updateError;

      toast({
        title: "Succès",
        description: `Traite bancaire ajoutée avec succès. ${nombreMois} mensualités de ${montantMensuel.toFixed(2)} DH`
      });

      setShowTraiteDialog(false);
      setTraiteForm({
        concessionaire: '',
        organisme: '',
        date_achat: '',
        prix_achat: '',
        avance: '',
        montant_mensuel: '',
        date_debut: '',
        duree_mois: '',
        duree_deja_paye: '0',
        plus_infos: ''
      });
      loadVehicle();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handlePayEcheance = async () => {
    if (!selectedEcheance) return;
    try {
      const { error } = await supabase
        .from('vehicules_traites_echeances')
        .update({
          statut: 'Payée',
          date_paiement: echeancePaymentForm.date_paiement,
          mode_paiement: echeancePaymentForm.mode_paiement || null,
          ref_paiement: echeancePaymentForm.ref_paiement || null,
          notes: echeancePaymentForm.notes || null
        })
        .eq('id', selectedEcheance.id);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Échéance marquée comme payée"
      });

      setShowPayEcheanceDialog(false);
      setSelectedEcheance(null);
      setEcheancePaymentForm({
        date_paiement: new Date().toISOString().split('T')[0],
        mode_paiement: '',
        ref_paiement: '',
        notes: ''
      });
      loadVehicle();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const getTraiteStats = () => {
    if (!traites.length || !echeances.length) return { totalPaye: 0, totalRestant: 0, pourcentage: 0 };

    const currentTraite = traites[0];
    const traiteEcheances = echeances.filter(e => e.traite_id === currentTraite.id);
    const totalPaye = traiteEcheances
      .filter(e => e.statut === 'Payée')
      .reduce((sum, e) => sum + parseFloat(e.montant), 0);
    const totalRestant = currentTraite.montant_total - totalPaye;
    const pourcentage = (totalPaye / currentTraite.montant_total) * 100;

    return { totalPaye, totalRestant, pourcentage };
  };

  const getEcheanceIcon = (statut: string) => {
    switch (statut) {
      case 'Payée':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'En retard':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-orange-500" />;
    }
  };

  const getEcheanceStatusBadge = (statut: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      'Payée': 'default',
      'À payer': 'secondary',
      'En retard': 'destructive'
    };
    return <Badge variant={variants[statut] || 'outline'}>{statut}</Badge>;
  };

  const getAlerts = () => {
    const alerts = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (insurances.length === 0) {
      alerts.push({
        message: "Véhicule sans assurance ajoutée.",
        action: "CRÉER ASSURANCE",
        link: "/vehicules",
        severity: "high"
      });
    } else {
      // Vérifier la date d'expiration de la dernière assurance (la plus récente)
      const latestInsurance = insurances[0]; // Déjà trié par date_debut desc
      if (latestInsurance?.date_expiration) {
        const expirationDate = new Date(latestInsurance.date_expiration);
        expirationDate.setHours(0, 0, 0, 0);
        const daysUntilExpiration = Math.ceil((expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (expirationDate < today) {
          alerts.push({
            message: "Assurance expirée depuis " + Math.abs(daysUntilExpiration) + " jour(s).",
            action: "RENOUVELER",
            link: "/vehicules",
            severity: "critical"
          });
        } else if (daysUntilExpiration <= 30) {
          alerts.push({
            message: `Assurance expire dans ${daysUntilExpiration} jour(s).`,
            action: "RENOUVELER",
            link: "/vehicules",
            severity: "warning"
          });
        }
      }
    }
    if (technicalInspections.length === 0) {
      alerts.push({
        message: "Véhicule sans visite technique ajoutée.",
        action: "CRÉER VISITE",
        link: "/vehicules",
        severity: "high"
      });
    } else {
      // Vérifier la date d'expiration de la dernière visite technique
      const latestInspection = technicalInspections[0]; // Déjà trié par date_visite desc
      if (latestInspection?.date_expiration) {
        const expirationDate = new Date(latestInspection.date_expiration);
        expirationDate.setHours(0, 0, 0, 0);
        const daysUntilExpiration = Math.ceil((expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (expirationDate < today) {
          alerts.push({
            message: "Visite technique expirée depuis " + Math.abs(daysUntilExpiration) + " jour(s).",
            action: "RENOUVELER",
            link: "/vehicules",
            severity: "critical"
          });
        } else if (daysUntilExpiration <= 30) {
          alerts.push({
            message: `Visite technique expire dans ${daysUntilExpiration} jour(s).`,
            action: "RENOUVELER",
            link: "/vehicules",
            severity: "warning"
          });
        }
      }
    }
    if (vignettes.length === 0) {
      alerts.push({
        message: "Véhicule sans vignette ajoutée.",
        action: "CRÉER VIGNETTE",
        link: "/vehicules",
        severity: "high"
      });
    } else {
      // Vérifier la date d'expiration de la dernière vignette
      const latestVignette = vignettes[0]; // Déjà trié par annee desc
      if (latestVignette?.date_expiration) {
        const expirationDate = new Date(latestVignette.date_expiration);
        expirationDate.setHours(0, 0, 0, 0);
        const daysUntilExpiration = Math.ceil((expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (expirationDate < today) {
          alerts.push({
            message: "Vignette expirée depuis " + Math.abs(daysUntilExpiration) + " jour(s).",
            action: "RENOUVELER",
            link: "/vehicules",
            severity: "critical"
          });
        } else if (daysUntilExpiration <= 30) {
          alerts.push({
            message: `Vignette expire dans ${daysUntilExpiration} jour(s).`,
            action: "RENOUVELER",
            link: "/vehicules",
            severity: "warning"
          });
        }
      }
    }
    return alerts;
  };
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Chargement...</p>
      </div>;
  }
  if (!vehicle) {
    return null;
  }
  const alerts = getAlerts();
  const totalRevenue = calculateTotalRevenue();
  const totalExpenses = calculateTotalExpenses();
  const totalReservations = getTotalReservations();
  const netProfit = totalRevenue - totalExpenses;
  const statusBadge = !vehicle.en_service ? 'Hors service' : vehicle.statut === 'disponible' ? 'Disponible' : vehicle.statut === 'loue' ? 'Loué' : vehicle.statut === 'reserve' ? 'Réservé' : 'En panne';
  const statusVariant = !vehicle.en_service ? 'destructive' : vehicle.statut === 'disponible' ? 'default' : vehicle.statut === 'loue' ? 'secondary' : vehicle.statut === 'reserve' ? 'outline' : 'destructive';
  return <div className="min-h-screen bg-background p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">
          Fiche véhicule Mat. N° {vehicle.immatriculation}
        </h1>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button onClick={() => navigate(`/vehicules/${id}/modifier`)} className="bg-info hover:bg-info/90 text-white gap-2">
            <Edit className="w-4 h-4" />
            MODIFIER LE VÉHICULE
          </Button>
          {isAdmin && (
            <Button onClick={() => setShowDeleteDialog(true)} variant="destructive" className="gap-2">
              <AlertCircle className="w-4 h-4" />
              SUPPRIMER LE VÉHICULE
            </Button>
          )}
        </div>
      </div>

      {/* Alertes Documents */}
      {alerts.length > 0}

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
                <CalendarIcon className="w-8 h-8 text-info" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts Section */}
      {alerts.length > 0 && <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-warning">
                <AlertCircle className="w-5 h-5" />
                {alerts.length.toString().padStart(2, '0')} alertes trouvées pour ce véhicule
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {alerts.map((alert, index) => <Alert key={index} className={`border-l-4 ${alert.severity === 'critical' ? 'border-l-destructive bg-destructive/5' : alert.severity === 'high' ? 'border-l-warning bg-warning/5' : 'border-l-warning bg-warning/5'}`}>
                <AlertCircle className={`h-4 w-4 ${alert.severity === 'critical' ? 'text-destructive' : 'text-warning'}`} />
                <AlertDescription className="flex items-center justify-between">
                  <span className="text-sm">{alert.message}</span>
                  <Button variant="outline" size="sm" className={`ml-4 ${alert.severity === 'critical' ? 'border-destructive text-destructive hover:bg-destructive hover:text-white' : 'border-warning text-warning hover:bg-warning hover:text-white'}`} onClick={() => {
              if (alert.action === "EFFECTUER VIDANGE") {
                setShowVidangeDialog(true);
              }
            }}>
                    {alert.action}
                  </Button>
                </AlertDescription>
              </Alert>)}
          </CardContent>
        </Card>}

      {/* Vidange Status Card */}
      <Card className={`border-l-4 ${getOilChangeAlertLevel() === 'critical' ? 'border-l-destructive bg-destructive/5' : getOilChangeAlertLevel() === 'warning' ? 'border-l-warning bg-warning/5' : 'border-l-success bg-success/5'}`}>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-4 flex-1">
              <div className={`p-3 rounded-lg ${getOilChangeAlertLevel() === 'critical' ? 'bg-destructive/20' : getOilChangeAlertLevel() === 'warning' ? 'bg-warning/20' : 'bg-success/20'}`}>
                <Gauge className={`w-8 h-8 ${getOilChangeAlertLevel() === 'critical' ? 'text-destructive' : getOilChangeAlertLevel() === 'warning' ? 'text-warning' : 'text-success'}`} />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-1">Kilométrage actuel</p>
                <p className="text-3xl md:text-4xl font-bold">
                  {vehicle.kilometrage.toLocaleString()} km
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Dernière mise à jour : {format(new Date(vehicle.updated_at), 'dd/MM/yyyy à HH:mm', {
                  locale: fr
                })}
                </p>
                
                {vehicle.dernier_kilometrage_vidange > 0 && <div className="mt-3">
                    <p className="text-sm text-muted-foreground">
                      Kilométrage depuis dernière vidange : 
                      <span className={`font-semibold ml-1 ${getOilChangeAlertLevel() === 'critical' ? 'text-destructive' : getOilChangeAlertLevel() === 'warning' ? 'text-warning' : 'text-success'}`}>
                        {calculateKmDepuisVidange().toLocaleString()} km
                      </span>
                    </p>
                    {vehicle.prochain_kilometrage_vidange && <p className="text-sm text-muted-foreground mt-1">
                        Prochain kilométrage prévu : <span className="font-semibold">{vehicle.prochain_kilometrage_vidange.toLocaleString()} km</span>
                      </p>}
                  </div>}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              {getOilChangeAlertLevel() === 'critical' && <Badge variant="destructive" className="whitespace-nowrap">
                  Vidange urgente
                </Badge>}
              {getOilChangeAlertLevel() === 'warning' && <Badge className="bg-warning text-white whitespace-nowrap">
                  Vidange à prévoir
                </Badge>}
              {getOilChangeAlertLevel() === 'ok' && <Badge className="bg-success text-white whitespace-nowrap">
                  Vidange OK
                </Badge>}
              {needsOilChange() && <Button size="sm" onClick={() => setShowVidangeDialog(true)} className="whitespace-nowrap">
                  <Wrench className="w-4 h-4 mr-2" />
                  Effectuer vidange
                </Button>}
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
                  {vehicle.photo_url ? <img src={vehicle.photo_url} alt={`${vehicle.marque} ${vehicle.modele}`} className="w-full h-full object-cover rounded-full" /> : <Car className="w-16 h-16 text-muted-foreground" />}
                </div>

                {/* Vehicle Name */}
                <div className="text-center">
                  <h3 className="text-xl font-bold">{vehicle.marque} / {vehicle.modele}</h3>
                  <Badge variant={statusVariant} className="mt-2">{statusBadge}</Badge>
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
                    <Switch checked={vehicle.en_service || false} onCheckedChange={async checked => {
                    try {
                      const {
                        error
                      } = await supabase.from('vehicles').update({
                        en_service: checked
                      }).eq('id', vehicle.id);
                      if (error) throw error;
                      setVehicle({
                        ...vehicle,
                        en_service: checked
                      });
                      toast({
                        title: "Succès",
                        description: `Véhicule ${checked ? 'mis en service' : 'retiré du service'}`
                      });
                    } catch (error: any) {
                      toast({
                        title: "Erreur",
                        description: error.message,
                        variant: "destructive"
                      });
                    }
                  }} />
                    <span className="text-sm font-medium">En service</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch checked={vehicle.sous_location || false} onCheckedChange={async checked => {
                    try {
                      const {
                        error
                      } = await supabase.from('vehicles').update({
                        sous_location: checked
                      }).eq('id', vehicle.id);
                      if (error) throw error;
                      setVehicle({
                        ...vehicle,
                        sous_location: checked
                      });
                      toast({
                        title: "Succès",
                        description: `Véhicule ${checked ? 'en' : 'retiré de'} sous-location`
                      });
                    } catch (error: any) {
                      toast({
                        title: "Erreur",
                        description: error.message,
                        variant: "destructive"
                      });
                    }
                  }} />
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
                    {vehicle.date_derniere_vidange ? format(new Date(vehicle.date_derniere_vidange), 'dd/MM/yyyy', {
                    locale: fr
                  }) : 'Non renseignée'}
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>


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
                {insurances.length > 0 ? <Table>
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
                      {insurances.map(insurance => {
                    const today = new Date();
                    const expirationDate = new Date(insurance.date_expiration);
                    const daysUntilExpiration = Math.ceil((expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                    return <TableRow key={insurance.id} className="cursor-pointer hover:bg-accent/50" onClick={() => setSelectedInsurance(insurance)}>
                            <TableCell>{insurance.numero_ordre}</TableCell>
                            <TableCell>{insurance.assureur}</TableCell>
                            <TableCell>{format(new Date(insurance.date_debut), 'dd/MM/yyyy', {
                          locale: fr
                        })}</TableCell>
                            <TableCell>
                              <span className={daysUntilExpiration <= 30 && daysUntilExpiration > 0 ? 'text-warning font-medium' : ''}>
                                {format(new Date(insurance.date_expiration), 'dd/MM/yyyy', {
                            locale: fr
                          })}
                              </span>
                              {daysUntilExpiration > 0 && daysUntilExpiration <= 30 && <Badge variant="outline" className="ml-2 bg-warning/10 text-warning border-warning">
                                  {daysUntilExpiration}J
                                </Badge>}
                            </TableCell>
                            <TableCell className="text-right">{insurance.montant.toFixed(2)}</TableCell>
                            <TableCell className="text-right text-muted-foreground text-sm">
                              {format(new Date(insurance.created_at), 'dd/MM/yyyy HH:mm', {
                          locale: fr
                        })}
                            </TableCell>
                            <TableCell className="text-center" onClick={e => e.stopPropagation()}>
                              {insurance.photo_url ? <Button variant="ghost" size="sm" onClick={() => window.open(insurance.photo_url, '_blank')}>
                                  <Eye className="w-4 h-4" />
                                </Button> : <span className="text-muted-foreground text-xs">-</span>}
                            </TableCell>
                          </TableRow>;
                  })}
                    </TableBody>
                  </Table> : <div className="text-center py-8 text-muted-foreground">
                    Aucune assurance enregistrée
                  </div>}
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
                {technicalInspections.length > 0 ? <Table>
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
                      {technicalInspections.map(inspection => {
                    const today = new Date();
                    const expirationDate = new Date(inspection.date_expiration);
                    const daysUntilExpiration = Math.ceil((expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                    return <TableRow key={inspection.id} className="cursor-pointer hover:bg-accent/50" onClick={() => setSelectedInspection(inspection)}>
                            <TableCell>{inspection.numero_ordre}</TableCell>
                            <TableCell>{inspection.centre_controle || '-'}</TableCell>
                            <TableCell>{format(new Date(inspection.date_visite), 'dd/MM/yyyy', {
                          locale: fr
                        })}</TableCell>
                            <TableCell>
                              <span className={daysUntilExpiration <= 30 && daysUntilExpiration > 0 ? 'text-warning font-medium' : ''}>
                                {format(new Date(inspection.date_expiration), 'dd/MM/yyyy', {
                            locale: fr
                          })}
                              </span>
                              {daysUntilExpiration > 0 && daysUntilExpiration <= 30 && <Badge variant="outline" className="ml-2 bg-warning/10 text-warning border-warning">
                                  {daysUntilExpiration}J
                                </Badge>}
                            </TableCell>
                            <TableCell className="text-right">{inspection.montant?.toFixed(2) || '-'}</TableCell>
                            <TableCell className="text-right text-muted-foreground text-sm">
                              {format(new Date(inspection.created_at), 'dd/MM/yyyy HH:mm', {
                          locale: fr
                        })}
                            </TableCell>
                            <TableCell className="text-center" onClick={e => e.stopPropagation()}>
                              {inspection.photo_url ? <Button variant="ghost" size="sm" onClick={() => window.open(inspection.photo_url, '_blank')}>
                                  <Eye className="w-4 h-4" />
                                </Button> : <span className="text-muted-foreground text-xs">-</span>}
                            </TableCell>
                          </TableRow>;
                  })}
                    </TableBody>
                  </Table> : <div className="text-center py-8 text-muted-foreground">
                    Aucune visite technique enregistrée
                  </div>}
              </div>
            </TabsContent>

            <TabsContent value="vidange" className="mt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-lg ${getOilChangeAlertLevel() === 'critical' ? 'bg-destructive/20' : getOilChangeAlertLevel() === 'warning' ? 'bg-warning/20' : 'bg-success/20'}`}>
                      <Wrench className={`w-6 h-6 ${getOilChangeAlertLevel() === 'critical' ? 'text-destructive' : getOilChangeAlertLevel() === 'warning' ? 'text-warning' : 'text-success'}`} />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Kilométrage depuis dernière vidange</p>
                      <p className={`text-2xl font-bold ${getOilChangeAlertLevel() === 'critical' ? 'text-destructive' : getOilChangeAlertLevel() === 'warning' ? 'text-warning' : 'text-success'}`}>
                        {calculateKmDepuisVidange().toLocaleString()} km
                      </p>
                    </div>
                  </div>
                  <Button onClick={() => setShowVidangeDialog(true)} className="gap-2">
                    <Plus className="w-4 h-4" />
                    EFFECTUER VIDANGE
                  </Button>
                </div>

                {vidanges.length > 0 ? <Table>
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
                      {vidanges.map(vidange => <TableRow key={vidange.id}>
                          <TableCell>{format(new Date(vidange.date_vidange), 'dd/MM/yyyy', {
                        locale: fr
                      })}</TableCell>
                          <TableCell>{vidange.kilometrage.toLocaleString()} km</TableCell>
                          <TableCell>{vidange.type || '-'}</TableCell>
                          <TableCell className="text-right">{vidange.montant?.toFixed(2) || '-'} DH</TableCell>
                          <TableCell className="text-muted-foreground text-sm">{vidange.remarques || '-'}</TableCell>
                        </TableRow>)}
                    </TableBody>
                  </Table> : <div className="text-center py-8 text-muted-foreground">
                    Aucune vidange enregistrée
                  </div>}
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
                {vignettes.length > 0 ? <Table>
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
                      {vignettes.map(vignette => {
                    const today = new Date();
                    const expirationDate = new Date(vignette.date_expiration);
                    const daysUntilExpiration = Math.ceil((expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                    return <TableRow key={vignette.id} className="cursor-pointer hover:bg-accent/50" onClick={() => setSelectedVignette(vignette)}>
                            <TableCell>{vignette.numero_ordre}</TableCell>
                            <TableCell>{vignette.annee}</TableCell>
                            <TableCell>
                              <span className={daysUntilExpiration <= 30 && daysUntilExpiration > 0 ? 'text-warning font-medium' : ''}>
                                {format(new Date(vignette.date_expiration), 'dd/MM/yyyy', {
                            locale: fr
                          })}
                              </span>
                              {daysUntilExpiration > 0 && daysUntilExpiration <= 30 && <Badge variant="outline" className="ml-2 bg-warning/10 text-warning border-warning">
                                  {daysUntilExpiration}J
                                </Badge>}
                            </TableCell>
                            <TableCell className="text-right">{vignette.montant?.toFixed(2) || '-'}</TableCell>
                            <TableCell className="text-right text-muted-foreground text-sm">
                              {format(new Date(vignette.created_at), 'dd/MM/yyyy HH:mm', {
                          locale: fr
                        })}
                            </TableCell>
                            <TableCell className="text-center" onClick={e => e.stopPropagation()}>
                              {vignette.photo_url ? <Button variant="ghost" size="sm" onClick={() => window.open(vignette.photo_url, '_blank')}>
                                  <Eye className="w-4 h-4" />
                                </Button> : <span className="text-muted-foreground text-xs">-</span>}
                            </TableCell>
                          </TableRow>;
                  })}
                    </TableBody>
                  </Table> : <div className="text-center py-8 text-muted-foreground">
                    Aucune vignette enregistrée
                  </div>}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Section Traite Bancaire séparée */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Landmark className="w-5 h-5 text-primary" />
            Les traites & Infos d'achat
          </CardTitle>
          {traites.length > 0 && (
            <Button size="sm" variant="outline" className="gap-2" onClick={() => setShowTraiteDialog(true)}>
              <Plus className="w-4 h-4" />
              Nouvelle traite
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {traites.length > 0 ? (
              <>
                {/* Layout en deux colonnes */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Colonne gauche: Les infos d'achat */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Les infos d'achat</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-muted-foreground">Prix d'achat</span>
                          <span className="font-semibold">{parseFloat(traites[0].montant_total).toFixed(2)} Dh</span>
                        </div>
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-muted-foreground">Avance</span>
                          <span className="font-semibold">{parseFloat(traites[0].avance_paye || 0).toFixed(2)} Dh</span>
                        </div>
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-muted-foreground">Durée</span>
                          <span className="font-semibold">{traites[0].nombre_traites} mois</span>
                        </div>
          <div className="flex justify-between py-2 border-b">
            <span className="text-muted-foreground">Mois payés</span>
            <span className="font-semibold">
              {echeances.filter(e => e.traite_id === traites[0].id && e.statut === 'Payée').length} mois
                          </span>
                        </div>
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-muted-foreground">Concessionaire</span>
                          <span className="font-semibold">{traites[0].concessionaire || '—'}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-muted-foreground">Organisme de crédit</span>
                          <span className="font-semibold">{traites[0].organisme}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-muted-foreground">Date du 1ère traite</span>
                          <span className="font-semibold">
                            {format(new Date(traites[0].date_debut), 'dd/MM/yyyy', { locale: fr })}
                          </span>
                        </div>
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-muted-foreground">Date d'achat</span>
                          <span className="font-semibold">
                            {traites[0].date_achat ? format(new Date(traites[0].date_achat), 'dd/MM/yyyy', { locale: fr }) : '—'}
                          </span>
                        </div>
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-muted-foreground">Plus d'infos</span>
                          <span className="font-semibold">{traites[0].notes || '—'}</span>
                        </div>
                        <div className="flex justify-between py-2">
                          <span className="text-muted-foreground">Dernière mise à jour</span>
                          <span className="font-semibold text-sm">
                            {format(new Date(traites[0].updated_at), 'dd/MM/yyyy HH:mm', { locale: fr })}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Colonne droite: L'état des traites bancaires */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">L'état des traites bancaires</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-xs">
                          Les traites bancaires sont automatiquement ajoutées chaque mois, mais vous pouvez toujours ajouter/supprimer manuellement les traites via la grille interactive ci-dessous.
                        </AlertDescription>
                      </Alert>

                      {/* Calendrier annuel */}
                      <div className="space-y-2">
                        {(() => {
                          const firstEcheance = echeances.filter(e => e.traite_id === traites[0].id)[0];
                          const lastEcheance = echeances.filter(e => e.traite_id === traites[0].id)[echeances.filter(e => e.traite_id === traites[0].id).length - 1];
                          
                          if (!firstEcheance || !lastEcheance) return null;

                          const startYear = new Date(firstEcheance.date_echeance).getFullYear();
                          const endYear = new Date(lastEcheance.date_echeance).getFullYear();
                          const years = [];
                          for (let y = startYear; y <= endYear; y++) {
                            years.push(y);
                          }

                          const months = ['Janv.', 'Fev.', 'Mars', 'Avr.', 'Mai', 'Juin', 'Juil.', 'Aout', 'Sept.', 'Oct.', 'Nov.', 'Dec.'];
                          const today = new Date();

                          return (
                            <div className="overflow-x-auto">
                              <div className="min-w-max">
                                {/* En-tête des mois */}
                                <div className="grid grid-cols-[60px_repeat(12,50px)] gap-1 mb-1">
                                  <div></div>
                                  {months.map((month, idx) => (
                                    <div key={idx} className="text-center text-xs text-muted-foreground font-medium">
                                      {month}
                                    </div>
                                  ))}
                                </div>

                                {/* Lignes par année */}
                                {years.map(year => (
                                  <div key={year} className="grid grid-cols-[60px_repeat(12,50px)] gap-1 mb-1">
                                    <div className="text-sm font-medium flex items-center">{year}</div>
                                    {Array.from({ length: 12 }, (_, monthIdx) => {
                                      const echeance = echeances.find(e => {
                                        const d = new Date(e.date_echeance);
                                        return e.traite_id === traites[0].id && 
                                               d.getFullYear() === year && 
                                               d.getMonth() === monthIdx;
                                      });

                                      const echeanceDate = echeance ? new Date(echeance.date_echeance) : null;
                                      const isPast = echeanceDate && echeanceDate < today;
                                      
                                      let bgColor = 'bg-gray-200'; // Mois prépayé (pas encore commencé)
                                      
                                      if (echeance) {
                                        if (echeance.statut === 'Payée') {
                                          bgColor = 'bg-green-500'; // Mois payé
                                        } else if (echeance.statut === 'En retard' || (isPast && echeance.statut !== 'Payée')) {
                                          bgColor = 'bg-red-500'; // Mois non payé
                                        } else {
                                          bgColor = 'bg-yellow-400'; // Mois restant
                                        }
                                      }

                                      return (
                                        <div
                                          key={monthIdx}
                                          className={`h-10 rounded cursor-pointer transition-opacity hover:opacity-80 ${bgColor}`}
                                          onClick={() => {
                                            if (echeance && echeance.statut !== 'Payée') {
                                              setSelectedEcheance(echeance);
                                              setShowPayEcheanceDialog(true);
                                            }
                                          }}
                                        />
                                      );
                                    })}
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })()}

                        {/* Légende */}
                        <div className="flex items-center justify-center gap-4 text-xs pt-2">
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded bg-green-500" />
                            <span>Mois payé</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded bg-gray-200" />
                            <span>Mois prépayé</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded bg-yellow-400" />
                            <span>Mois restant</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded bg-red-500" />
                            <span>Mois non payé</span>
                          </div>
                        </div>
                      </div>

                      {/* Tableau de résumé */}
                      <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Date du premier traite</span>
                            <span className="font-medium">
                              {format(new Date(traites[0].date_debut), 'dd MMM yyyy', { locale: fr })}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Prix d'achat</span>
                            <span className="font-medium">{parseFloat(traites[0].montant_total).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Durée/Mois</span>
                            <span className="font-medium">{traites[0].nombre_traites}</span>
                          </div>
                          <div className="flex justify-between text-sm p-2 bg-green-50 rounded">
                            <span className="font-semibold">Avance payé</span>
                            <span className="font-bold">{parseFloat(traites[0].avance_paye || 0).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-sm p-2 bg-green-50 rounded">
                            <span className="font-semibold">Montant payé</span>
                            <span className="font-bold">{getTraiteStats().totalPaye.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-sm p-2 bg-red-50 rounded">
                            <span className="font-semibold">Montant restant</span>
                            <span className="font-bold">{getTraiteStats().totalRestant.toFixed(2)}</span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Date de la dernière traite</span>
                            <span className="font-medium">
                              {(() => {
                                const lastEcheance = echeances
                                  .filter(e => e.traite_id === traites[0].id)
                                  .sort((a, b) => new Date(b.date_echeance).getTime() - new Date(a.date_echeance).getTime())[0];
                                return lastEcheance ? format(new Date(lastEcheance.date_echeance), 'dd MMM yyyy', { locale: fr }) : '—';
                              })()}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Avance payé</span>
                            <span className="font-medium">{parseFloat(traites[0].avance_paye || 0).toFixed(2)} DH</span>
                          </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Mois payés</span>
              <span className="font-medium">{traites[0].duree_deja_paye || 0} mois</span>
            </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Prix/Mois</span>
                            <span className="font-medium">{parseFloat(traites[0].montant_mensuel).toFixed(2)} DH</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Mois payés</span>
                            <span className="font-medium">
                              {echeances.filter(e => e.traite_id === traites[0].id && e.statut === 'Payée').length}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Mois retants</span>
                            <span className="font-medium">
                              {echeances.filter(e => e.traite_id === traites[0].id && e.statut !== 'Payée').length}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <div className="flex flex-col items-center gap-4">
                  <div className="p-4 bg-muted rounded-full">
                    <Landmark className="w-12 h-12 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-lg font-medium">Aucune traite bancaire</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Ajoutez un plan de financement pour ce véhicule
                    </p>
                  </div>
                  <Button onClick={() => setShowTraiteDialog(true)} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Ajouter une traite bancaire
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialog for contracts list */}
      <Dialog open={showContractsList} onOpenChange={setShowContractsList}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Locations et Assistances</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {contracts.length > 0 && <div>
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
                    {contracts.slice(0, 5).map(contract => <TableRow key={contract.id} className="cursor-pointer hover:bg-accent/50" onClick={() => navigate(`/locations/${contract.id}`)}>
                        <TableCell>{contract.numero_contrat}</TableCell>
                        <TableCell>
                          {contract.clients?.nom} {contract.clients?.prenom}
                        </TableCell>
                        <TableCell>{format(new Date(contract.date_debut), 'dd/MM/yyyy', {
                      locale: fr
                    })}</TableCell>
                        <TableCell>{format(new Date(contract.date_fin), 'dd/MM/yyyy', {
                      locale: fr
                    })}</TableCell>
                        <TableCell className="text-right">{contract.total_amount.toFixed(2)} DH</TableCell>
                      </TableRow>)}
                  </TableBody>
                </Table>
              </div>}
            {assistances.length > 0 && <div>
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
                    {assistances.slice(0, 5).map(assistance => <TableRow key={assistance.id} className="cursor-pointer hover:bg-accent/50" onClick={() => navigate(`/assistance/${assistance.id}`)}>
                        <TableCell>{assistance.num_dossier}</TableCell>
                        <TableCell>
                          {assistance.clients?.nom} {assistance.clients?.prenom}
                        </TableCell>
                        <TableCell>{format(new Date(assistance.date_debut), 'dd/MM/yyyy', {
                      locale: fr
                    })}</TableCell>
                        <TableCell>{assistance.date_fin ? format(new Date(assistance.date_fin), 'dd/MM/yyyy', {
                      locale: fr
                    }) : '-'}</TableCell>
                        <TableCell className="text-right">{(assistance.montant_facture || assistance.montant_total || 0).toFixed(2)} DH</TableCell>
                      </TableRow>)}
                  </TableBody>
                </Table>
              </div>}
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
              <Input id="prochainKm" type="number" value={prochainKmVidange} onChange={e => setProchainKmVidange(e.target.value)} placeholder={`Ex: ${(vehicle?.kilometrage || 0) + 8000}`} />
              <p className="text-xs text-muted-foreground mt-1">
                Laissez vide pour utiliser le calcul automatique (8000 km)
              </p>
            </div>
            <div>
              <Label htmlFor="montant">Montant (optionnel)</Label>
              <Input id="montant" type="number" step="0.01" value={montantVidange} onChange={e => setMontantVidange(e.target.value)} placeholder="0.00" />
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

      {/* Dialog for adding traite bancaire */}
      <Dialog open={showTraiteDialog} onOpenChange={setShowTraiteDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Ajouter une traite bancaire</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4 overflow-y-auto flex-1 px-1">
            <div>
              <Label htmlFor="concessionaire">Concessionaire / Maison d'achat</Label>
              <Input 
                id="concessionaire" 
                value={traiteForm.concessionaire}
                onChange={(e) => setTraiteForm({...traiteForm, concessionaire: e.target.value})}
                placeholder="Ex: Auto Hall"
              />
            </div>

            <div>
              <Label htmlFor="organisme">Organisme de crédit</Label>
              <Input 
                id="organisme" 
                value={traiteForm.organisme}
                onChange={(e) => setTraiteForm({...traiteForm, organisme: e.target.value})}
                placeholder="Ex: Wafasalaf"
              />
            </div>

            <div>
              <Label htmlFor="date_achat">Date d'achat</Label>
              <Input 
                id="date_achat" 
                type="date"
                value={traiteForm.date_achat}
                onChange={(e) => setTraiteForm({...traiteForm, date_achat: e.target.value})}
              />
            </div>

            <div>
              <Label htmlFor="prix_achat">Prix d'achat *</Label>
              <div className="relative">
                <Input 
                  id="prix_achat" 
                  type="number"
                  step="0.01"
                  value={traiteForm.prix_achat}
                  onChange={(e) => setTraiteForm({...traiteForm, prix_achat: e.target.value})}
                  placeholder="0.00"
                  className="pr-12"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  DH
                </span>
              </div>
            </div>

            <div>
              <Label htmlFor="avance">Avance</Label>
              <div className="relative">
                <Input 
                  id="avance" 
                  type="number"
                  step="0.01"
                  value={traiteForm.avance}
                  onChange={(e) => setTraiteForm({...traiteForm, avance: e.target.value})}
                  placeholder="0.00"
                  className="pr-12"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  DH
                </span>
              </div>
            </div>

            {resteAPayer > 0 && (
              <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                <p className="text-sm">
                  Reste à payer: <span className="font-bold text-primary text-lg">
                    {resteAPayer.toFixed(2)} DH
                  </span>
                </p>
              </div>
            )}

            <div>
              <Label htmlFor="montant_mensuel">Montant de la mensualité *</Label>
              <div className="relative">
                <Input 
                  id="montant_mensuel" 
                  type="number"
                  step="0.01"
                  value={traiteForm.montant_mensuel}
                  onChange={(e) => setTraiteForm({...traiteForm, montant_mensuel: e.target.value})}
                  placeholder="0.00"
                  className="pr-12"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  DH
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="date_debut">Date début mensualité *</Label>
                <Input 
                  id="date_debut" 
                  type="date"
                  value={traiteForm.date_debut}
                  onChange={(e) => setTraiteForm({...traiteForm, date_debut: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="duree_mois">Durée (mois) *</Label>
                <Input 
                  id="duree_mois" 
                  type="number"
                  value={traiteForm.duree_mois}
                  onChange={(e) => setTraiteForm({...traiteForm, duree_mois: e.target.value})}
                  placeholder="Ex: 36"
                />
              </div>
            </div>

            {dateFinCalculee && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Date fin mensualité calculée:</p>
                <p className="font-semibold text-lg">
                  {format(new Date(dateFinCalculee), 'dd MMMM yyyy', { locale: fr })}
                </p>
              </div>
            )}

            {nombreMois > 0 && traiteForm.montant_mensuel && (
              <div className={`p-4 rounded-lg border ${
                isValidAmount 
                  ? 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800' 
                  : 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800'
              }`}>
                <div className="space-y-2 text-sm">
                  <p>Nombre de mois: <span className="font-semibold">{nombreMois}</span></p>
                  <p>Total des mensualités: <span className="font-semibold">{montantTotalMensualites.toFixed(2)} DH</span></p>
                  <p className={`font-bold ${isValidAmount ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                    {isValidAmount 
                      ? '✓ Montant correct !' 
                      : `✗ Différence: ${Math.abs(montantTotalMensualites - resteAPayer).toFixed(2)} DH`
                    }
                  </p>
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="duree_deja_paye">Mois payés</Label>
              <Input 
                id="duree_deja_paye" 
                type="number"
                value={traiteForm.duree_deja_paye}
                onChange={(e) => setTraiteForm({...traiteForm, duree_deja_paye: e.target.value})}
                placeholder="0"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Nombre de mois déjà payés jusqu'à présent
              </p>
            </div>

            <div>
              <Label htmlFor="plus_infos">Plus d'informations</Label>
              <Textarea 
                id="plus_infos"
                value={traiteForm.plus_infos}
                onChange={(e) => setTraiteForm({...traiteForm, plus_infos: e.target.value})}
                placeholder="Informations complémentaires..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowTraiteDialog(false);
              setTraiteForm({
                concessionaire: '',
                organisme: '',
                date_achat: '',
                prix_achat: '',
                avance: '',
                montant_mensuel: '',
                date_debut: '',
                duree_mois: '',
                duree_deja_paye: '0',
                plus_infos: ''
              });
            }}>
              Annuler
            </Button>
            <Button onClick={handleAddTraite} disabled={!isValidAmount && nombreMois > 0}>
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog for paying echeance */}
      <Dialog open={showPayEcheanceDialog} onOpenChange={setShowPayEcheanceDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Marquer l'échéance comme payée</DialogTitle>
          </DialogHeader>
          {selectedEcheance && (
            <div className="space-y-4 py-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Échéance du</p>
                <p className="font-semibold">
                  {format(new Date(selectedEcheance.date_echeance), 'dd MMMM yyyy', { locale: fr })}
                </p>
                <p className="text-lg font-bold mt-2">{parseFloat(selectedEcheance.montant).toFixed(2)} DH</p>
              </div>
              <div>
                <Label htmlFor="date_paiement">Date de paiement *</Label>
                <Input 
                  id="date_paiement" 
                  type="date"
                  value={echeancePaymentForm.date_paiement}
                  onChange={(e) => setEcheancePaymentForm({...echeancePaymentForm, date_paiement: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="mode_paiement_echeance">Mode de paiement</Label>
                <Select 
                  value={echeancePaymentForm.mode_paiement} 
                  onValueChange={(value) => setEcheancePaymentForm({...echeancePaymentForm, mode_paiement: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="prelevement">Prélèvement automatique</SelectItem>
                    <SelectItem value="cheque">Chèque</SelectItem>
                    <SelectItem value="virement">Virement</SelectItem>
                    <SelectItem value="especes">Espèces</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="ref_paiement">Référence de paiement</Label>
                <Input 
                  id="ref_paiement"
                  value={echeancePaymentForm.ref_paiement}
                  onChange={(e) => setEcheancePaymentForm({...echeancePaymentForm, ref_paiement: e.target.value})}
                  placeholder="N° de chèque, référence..."
                />
              </div>
              <div>
                <Label htmlFor="notes_paiement">Notes</Label>
                <Textarea 
                  id="notes_paiement"
                  value={echeancePaymentForm.notes}
                  onChange={(e) => setEcheancePaymentForm({...echeancePaymentForm, notes: e.target.value})}
                  placeholder="Informations complémentaires..."
                  rows={2}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowPayEcheanceDialog(false);
              setSelectedEcheance(null);
              setEcheancePaymentForm({
                date_paiement: new Date().toISOString().split('T')[0],
                mode_paiement: '',
                ref_paiement: '',
                notes: ''
              });
            }}>
              Annuler
            </Button>
            <Button onClick={handlePayEcheance}>
              Confirmer le paiement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog for editing traite bancaire */}
      <Dialog open={showEditTraiteDialog} onOpenChange={setShowEditTraiteDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Modifier la traite bancaire</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4 overflow-y-auto flex-1 px-1">
            <div>
              <Label htmlFor="edit_concessionaire">Concessionaire / Maison d'achat</Label>
              <Input 
                id="edit_concessionaire" 
                value={traiteForm.concessionaire}
                onChange={(e) => setTraiteForm({...traiteForm, concessionaire: e.target.value})}
                placeholder="Ex: Auto Hall"
              />
            </div>

            <div>
              <Label htmlFor="edit_organisme">Organisme de crédit *</Label>
              <Input 
                id="edit_organisme" 
                value={traiteForm.organisme}
                onChange={(e) => setTraiteForm({...traiteForm, organisme: e.target.value})}
                placeholder="Ex: Wafasalaf"
              />
            </div>

            <div>
              <Label htmlFor="edit_date_achat">Date d'achat</Label>
              <Input 
                id="edit_date_achat" 
                type="date"
                value={traiteForm.date_achat}
                onChange={(e) => setTraiteForm({...traiteForm, date_achat: e.target.value})}
              />
            </div>

            <div>
              <Label htmlFor="edit_prix_achat">Prix d'achat *</Label>
              <div className="relative">
                <Input 
                  id="edit_prix_achat" 
                  type="number"
                  step="0.01"
                  value={traiteForm.prix_achat}
                  onChange={(e) => setTraiteForm({...traiteForm, prix_achat: e.target.value})}
                  placeholder="0.00"
                  className="pr-12"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  DH
                </span>
              </div>
            </div>

            <div>
              <Label htmlFor="edit_avance">Avance</Label>
              <div className="relative">
                <Input 
                  id="edit_avance" 
                  type="number"
                  step="0.01"
                  value={traiteForm.avance}
                  onChange={(e) => setTraiteForm({...traiteForm, avance: e.target.value})}
                  placeholder="0.00"
                  className="pr-12"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  DH
                </span>
              </div>
            </div>

            {resteAPayer > 0 && (
              <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                <p className="text-sm">
                  Reste à payer: <span className="font-bold text-primary text-lg">
                    {resteAPayer.toFixed(2)} DH
                  </span>
                </p>
              </div>
            )}

            <div>
              <Label htmlFor="edit_montant_mensuel">Montant de la mensualité *</Label>
              <div className="relative">
                <Input 
                  id="edit_montant_mensuel" 
                  type="number"
                  step="0.01"
                  value={traiteForm.montant_mensuel}
                  onChange={(e) => setTraiteForm({...traiteForm, montant_mensuel: e.target.value})}
                  placeholder="0.00"
                  className="pr-12"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  DH
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit_date_debut">Date début mensualité *</Label>
                <Input 
                  id="edit_date_debut" 
                  type="date"
                  value={traiteForm.date_debut}
                  onChange={(e) => setTraiteForm({...traiteForm, date_debut: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="edit_duree_mois">Durée (mois) *</Label>
                <Input 
                  id="edit_duree_mois" 
                  type="number"
                  value={traiteForm.duree_mois}
                  onChange={(e) => setTraiteForm({...traiteForm, duree_mois: e.target.value})}
                  placeholder="Ex: 36"
                />
              </div>
            </div>

            {dateFinCalculee && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Date fin mensualité calculée:</p>
                <p className="font-semibold text-lg">
                  {format(new Date(dateFinCalculee), 'dd MMMM yyyy', { locale: fr })}
                </p>
              </div>
            )}

            {nombreMois > 0 && traiteForm.montant_mensuel && (
              <div className={`p-4 rounded-lg border ${
                isValidAmount 
                  ? 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800' 
                  : 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800'
              }`}>
                <div className="space-y-2 text-sm">
                  <p>Nombre de mois: <span className="font-semibold">{nombreMois}</span></p>
                  <p>Total des mensualités: <span className="font-semibold">{montantTotalMensualites.toFixed(2)} DH</span></p>
                  <p className={`font-bold ${isValidAmount ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                    {isValidAmount 
                      ? '✓ Montant correct !' 
                      : `✗ Différence: ${Math.abs(montantTotalMensualites - resteAPayer).toFixed(2)} DH`
                    }
                  </p>
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="edit_duree_deja_paye">Mois payés</Label>
              <Input 
                id="edit_duree_deja_paye" 
                type="number"
                value={traiteForm.duree_deja_paye}
                onChange={(e) => setTraiteForm({...traiteForm, duree_deja_paye: e.target.value})}
                placeholder="0"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Nombre de mois déjà payés. Les premières échéances seront automatiquement marquées comme payées.
              </p>
            </div>

            <div>
              <Label htmlFor="edit_plus_infos">Plus d'informations</Label>
              <Textarea 
                id="edit_plus_infos"
                value={traiteForm.plus_infos}
                onChange={(e) => setTraiteForm({...traiteForm, plus_infos: e.target.value})}
                placeholder="Informations complémentaires..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowEditTraiteDialog(false);
              setSelectedTraite(null);
              setTraiteForm({
                concessionaire: '',
                organisme: '',
                date_achat: '',
                prix_achat: '',
                avance: '',
                montant_mensuel: '',
                date_debut: '',
                duree_mois: '',
                duree_deja_paye: '0',
                plus_infos: ''
              });
            }}>
              Annuler
            </Button>
            <Button onClick={async () => {
              if (!selectedTraite) return;
              
              const prixAchat = parseFloat(traiteForm.prix_achat);
              const avance = parseFloat(traiteForm.avance) || 0;
              const montantMensuel = parseFloat(traiteForm.montant_mensuel);
              const dureeDejaPaye = parseInt(traiteForm.duree_deja_paye) || 0;

              if (!traiteForm.organisme || !traiteForm.date_debut || !traiteForm.duree_mois || !prixAchat || !montantMensuel) {
                toast({
                  title: "Erreur",
                  description: "Veuillez remplir tous les champs obligatoires (*)",
                  variant: "destructive",
                });
                return;
              }

              if (!isValidAmount) {
                toast({
                  title: "Erreur",
                  description: "Le montant total des mensualités ne correspond pas au reste à payer",
                  variant: "destructive",
                });
                return;
              }

              try {
                const { error } = await supabase.from('vehicules_traite').update({
                  organisme: traiteForm.organisme,
                  concessionaire: traiteForm.concessionaire || null,
                  date_achat: traiteForm.date_achat || null,
                  montant_total: prixAchat,
                  montant_mensuel: montantMensuel,
                  date_debut: traiteForm.date_debut,
                  nombre_traites: nombreMois,
                  avance_paye: avance,
                  duree_deja_paye: dureeDejaPaye,
                  notes: traiteForm.plus_infos || null,
                }).eq('id', selectedTraite.id);

                if (error) throw error;

                // Update vehicle valeur_achat
                await supabase
                  .from('vehicles')
                  .update({ valeur_achat: prixAchat })
                  .eq('id', vehicle!.id);

                // Mark first X echeances as paid based on duree_deja_paye
                if (dureeDejaPaye > 0) {
                  const echeancesToPay = echeances
                    .filter(e => e.traite_id === selectedTraite.id)
                    .sort((a, b) => new Date(a.date_echeance).getTime() - new Date(b.date_echeance).getTime())
                    .slice(0, dureeDejaPaye);

                  for (const echeance of echeancesToPay) {
                    if (echeance.statut !== 'Payée') {
                      await supabase
                        .from('vehicules_traites_echeances')
                        .update({
                        statut: 'Payée',
                        date_paiement: traiteForm.date_debut,
                        notes: 'Marquée automatiquement comme payée (mois payés)'
                      })
                      .eq('id', echeance.id);
                    }
                  }
                }

                toast({
                  title: "Succès",
                  description: `Traite bancaire modifiée avec succès.${dureeDejaPaye > 0 ? ` ${dureeDejaPaye} mois marqués comme payés.` : ''}`
                });

                setShowEditTraiteDialog(false);
                setSelectedTraite(null);
                setTraiteForm({
                  concessionaire: '',
                  organisme: '',
                  date_achat: '',
                  prix_achat: '',
                  avance: '',
                  montant_mensuel: '',
                  date_debut: '',
                  duree_mois: '',
                  duree_deja_paye: '0',
                  plus_infos: ''
                });
                loadVehicle();
              } catch (error: any) {
                toast({
                  title: "Erreur",
                  description: error.message,
                  variant: "destructive",
                });
              }
            }} disabled={!isValidAmount && nombreMois > 0}>
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
              <Input id="ins-numero-ordre" value={insuranceForm.numero_ordre} onChange={e => setInsuranceForm({
              ...insuranceForm,
              numero_ordre: e.target.value
            })} placeholder="Ex: ASS001" />
            </div>
            <div>
              <Label htmlFor="ins-numero-police">N° de police</Label>
              <Input id="ins-numero-police" value={insuranceForm.numero_police} onChange={e => setInsuranceForm({
              ...insuranceForm,
              numero_police: e.target.value
            })} placeholder="Ex: POL123456" />
            </div>
            <div className="col-span-2">
              <Label htmlFor="ins-assureur">Assureur *</Label>
              <Input id="ins-assureur" value={insuranceForm.assureur} onChange={e => setInsuranceForm({
              ...insuranceForm,
              assureur: e.target.value
            })} placeholder="Ex: AXA Assurance" />
            </div>
            <div className="col-span-2">
              <Label htmlFor="ins-coordonnees">Coordonnées de l'assureur</Label>
              <Textarea id="ins-coordonnees" value={insuranceForm.coordonnees_assureur} onChange={e => setInsuranceForm({
              ...insuranceForm,
              coordonnees_assureur: e.target.value
            })} placeholder="Adresse, téléphone, email..." />
            </div>
            <div>
              <Label htmlFor="ins-date-debut">Date début *</Label>
              <Input id="ins-date-debut" type="date" value={insuranceForm.date_debut} onChange={e => setInsuranceForm({
              ...insuranceForm,
              date_debut: e.target.value
            })} />
            </div>
            <div>
              <Label htmlFor="ins-date-exp">Date d'expiration *</Label>
              <Input id="ins-date-exp" type="date" value={insuranceForm.date_expiration} onChange={e => setInsuranceForm({
              ...insuranceForm,
              date_expiration: e.target.value
            })} />
            </div>
            <div>
              <Label htmlFor="ins-montant">Montant *</Label>
              <Input id="ins-montant" type="number" step="0.01" value={insuranceForm.montant} onChange={e => setInsuranceForm({
              ...insuranceForm,
              montant: e.target.value
            })} placeholder="0.00" />
            </div>
            <div>
              <Label htmlFor="ins-date-paiement">Date de paiement *</Label>
              <Input id="ins-date-paiement" type="date" value={insuranceForm.date_paiement} onChange={e => setInsuranceForm({
              ...insuranceForm,
              date_paiement: e.target.value
            })} />
            </div>
            <div>
              <Label htmlFor="ins-mode-paiement">Mode de paiement *</Label>
              <Select value={insuranceForm.mode_paiement} onValueChange={(value: any) => setInsuranceForm({
              ...insuranceForm,
              mode_paiement: value
            })}>
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
            {insuranceForm.mode_paiement === 'cheque' && <>
                <div>
                  <Label htmlFor="ins-numero-cheque">N° de chèque</Label>
                  <Input id="ins-numero-cheque" value={insuranceForm.numero_cheque} onChange={e => setInsuranceForm({
                ...insuranceForm,
                numero_cheque: e.target.value
              })} />
                </div>
                <div>
                  <Label htmlFor="ins-banque">Banque</Label>
                  <Input id="ins-banque" value={insuranceForm.banque} onChange={e => setInsuranceForm({
                ...insuranceForm,
                banque: e.target.value
              })} />
                </div>
              </>}
            <div className="col-span-2">
              <Label htmlFor="ins-remarques">Remarques</Label>
              <Textarea id="ins-remarques" value={insuranceForm.remarques} onChange={e => setInsuranceForm({
              ...insuranceForm,
              remarques: e.target.value
            })} placeholder="Notes additionnelles..." />
            </div>
            <div className="col-span-2">
              <Label htmlFor="ins-photo">Photo du document</Label>
              <Input id="ins-photo" type="file" accept="image/*" onChange={e => setInsurancePhoto(e.target.files?.[0] || null)} />
              <p className="text-xs text-muted-foreground mt-1">
                Formats acceptés: JPG, PNG, WEBP
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
            setShowInsuranceDialog(false);
            setInsuranceForm({
              numero_ordre: '',
              numero_police: '',
              assureur: '',
              coordonnees_assureur: '',
              date_debut: '',
              date_expiration: '',
              montant: '',
              date_paiement: '',
              mode_paiement: 'especes',
              numero_cheque: '',
              banque: '',
              remarques: ''
            });
          }}>
              Annuler
            </Button>
            <Button onClick={async () => {
            try {
              if (!insuranceForm.numero_ordre || !insuranceForm.assureur || !insuranceForm.date_debut || !insuranceForm.date_expiration || !insuranceForm.montant || !insuranceForm.date_paiement) {
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
                const {
                  error: uploadError,
                  data
                } = await supabase.storage.from('vehicle-documents').upload(fileName, insurancePhoto);
                if (uploadError) throw uploadError;
                const {
                  data: {
                    publicUrl
                  }
                } = supabase.storage.from('vehicle-documents').getPublicUrl(fileName);
                photoUrl = publicUrl;
              }
              const {
                error
              } = await supabase.from('vehicle_insurance').insert({
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
                numero_ordre: '',
                numero_police: '',
                assureur: '',
                coordonnees_assureur: '',
                date_debut: '',
                date_expiration: '',
                montant: '',
                date_paiement: '',
                mode_paiement: 'especes',
                numero_cheque: '',
                banque: '',
                remarques: ''
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
          }} disabled={uploadingInsurance}>
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
              <Input id="insp-numero-ordre" value={inspectionForm.numero_ordre} onChange={e => setInspectionForm({
              ...inspectionForm,
              numero_ordre: e.target.value
            })} placeholder="Ex: VT001" />
            </div>
            <div>
              <Label htmlFor="insp-centre">Centre de contrôle</Label>
              <Input id="insp-centre" value={inspectionForm.centre_controle} onChange={e => setInspectionForm({
              ...inspectionForm,
              centre_controle: e.target.value
            })} placeholder="Ex: Centre Auto Contrôle" />
            </div>
            <div>
              <Label htmlFor="insp-date-visite">Date de visite *</Label>
              <Input id="insp-date-visite" type="date" value={inspectionForm.date_visite} onChange={e => setInspectionForm({
              ...inspectionForm,
              date_visite: e.target.value
            })} />
            </div>
            <div>
              <Label htmlFor="insp-date-exp">Date d'expiration *</Label>
              <Input id="insp-date-exp" type="date" value={inspectionForm.date_expiration} onChange={e => setInspectionForm({
              ...inspectionForm,
              date_expiration: e.target.value
            })} />
            </div>
            <div>
              <Label htmlFor="insp-montant">Montant</Label>
              <Input id="insp-montant" type="number" step="0.01" value={inspectionForm.montant} onChange={e => setInspectionForm({
              ...inspectionForm,
              montant: e.target.value
            })} placeholder="0.00" />
            </div>
            <div>
              <Label htmlFor="insp-date-paiement">Date de paiement</Label>
              <Input id="insp-date-paiement" type="date" value={inspectionForm.date_paiement} onChange={e => setInspectionForm({
              ...inspectionForm,
              date_paiement: e.target.value
            })} />
            </div>
            <div>
              <Label htmlFor="insp-mode-paiement">Mode de paiement</Label>
              <Select value={inspectionForm.mode_paiement} onValueChange={(value: any) => setInspectionForm({
              ...inspectionForm,
              mode_paiement: value
            })}>
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
            {inspectionForm.mode_paiement === 'cheque' && <>
                <div>
                  <Label htmlFor="insp-numero-cheque">N° de chèque</Label>
                  <Input id="insp-numero-cheque" value={inspectionForm.numero_cheque} onChange={e => setInspectionForm({
                ...inspectionForm,
                numero_cheque: e.target.value
              })} />
                </div>
                <div>
                  <Label htmlFor="insp-banque">Banque</Label>
                  <Input id="insp-banque" value={inspectionForm.banque} onChange={e => setInspectionForm({
                ...inspectionForm,
                banque: e.target.value
              })} />
                </div>
              </>}
            <div className="col-span-2">
              <Label htmlFor="insp-remarques">Remarques</Label>
              <Textarea id="insp-remarques" value={inspectionForm.remarques} onChange={e => setInspectionForm({
              ...inspectionForm,
              remarques: e.target.value
            })} placeholder="Notes additionnelles..." />
            </div>
            <div className="col-span-2">
              <Label htmlFor="insp-photo">Photo du document</Label>
              <Input id="insp-photo" type="file" accept="image/*" onChange={e => setInspectionPhoto(e.target.files?.[0] || null)} />
              <p className="text-xs text-muted-foreground mt-1">
                Formats acceptés: JPG, PNG, WEBP
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
            setShowInspectionDialog(false);
            setInspectionForm({
              numero_ordre: '',
              centre_controle: '',
              date_visite: '',
              date_expiration: '',
              montant: '',
              date_paiement: '',
              mode_paiement: 'especes',
              numero_cheque: '',
              banque: '',
              remarques: ''
            });
          }}>
              Annuler
            </Button>
            <Button onClick={async () => {
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
                const {
                  error: uploadError
                } = await supabase.storage.from('vehicle-documents').upload(fileName, inspectionPhoto);
                if (uploadError) throw uploadError;
                const {
                  data: {
                    publicUrl
                  }
                } = supabase.storage.from('vehicle-documents').getPublicUrl(fileName);
                photoUrl = publicUrl;
              }
              const {
                error
              } = await supabase.from('vehicle_technical_inspection').insert({
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
                numero_ordre: '',
                centre_controle: '',
                date_visite: '',
                date_expiration: '',
                montant: '',
                date_paiement: '',
                mode_paiement: 'especes',
                numero_cheque: '',
                banque: '',
                remarques: ''
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
          }} disabled={uploadingInspection}>
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
              <Input id="vig-numero-ordre" value={vignetteForm.numero_ordre} onChange={e => setVignetteForm({
              ...vignetteForm,
              numero_ordre: e.target.value
            })} placeholder="Ex: VIG001" />
            </div>
            <div>
              <Label htmlFor="vig-annee">Année *</Label>
              <Input id="vig-annee" type="number" value={vignetteForm.annee} onChange={e => setVignetteForm({
              ...vignetteForm,
              annee: e.target.value
            })} placeholder={new Date().getFullYear().toString()} />
            </div>
            <div>
              <Label htmlFor="vig-date-exp">Date d'expiration *</Label>
              <Input id="vig-date-exp" type="date" value={vignetteForm.date_expiration} onChange={e => setVignetteForm({
              ...vignetteForm,
              date_expiration: e.target.value
            })} />
            </div>
            <div>
              <Label htmlFor="vig-montant">Montant</Label>
              <Input id="vig-montant" type="number" step="0.01" value={vignetteForm.montant} onChange={e => setVignetteForm({
              ...vignetteForm,
              montant: e.target.value
            })} placeholder="0.00" />
            </div>
            <div>
              <Label htmlFor="vig-date-paiement">Date de paiement</Label>
              <Input id="vig-date-paiement" type="date" value={vignetteForm.date_paiement} onChange={e => setVignetteForm({
              ...vignetteForm,
              date_paiement: e.target.value
            })} />
            </div>
            <div>
              <Label htmlFor="vig-mode-paiement">Mode de paiement</Label>
              <Select value={vignetteForm.mode_paiement} onValueChange={(value: any) => setVignetteForm({
              ...vignetteForm,
              mode_paiement: value
            })}>
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
            {vignetteForm.mode_paiement === 'cheque' && <>
                <div>
                  <Label htmlFor="vig-numero-cheque">N° de chèque</Label>
                  <Input id="vig-numero-cheque" value={vignetteForm.numero_cheque} onChange={e => setVignetteForm({
                ...vignetteForm,
                numero_cheque: e.target.value
              })} />
                </div>
                <div>
                  <Label htmlFor="vig-banque">Banque</Label>
                  <Input id="vig-banque" value={vignetteForm.banque} onChange={e => setVignetteForm({
                ...vignetteForm,
                banque: e.target.value
              })} />
                </div>
              </>}
            <div className="col-span-2">
              <Label htmlFor="vig-remarques">Remarques</Label>
              <Textarea id="vig-remarques" value={vignetteForm.remarques} onChange={e => setVignetteForm({
              ...vignetteForm,
              remarques: e.target.value
            })} placeholder="Notes additionnelles..." />
            </div>
            <div className="col-span-2">
              <Label htmlFor="vig-photo">Photo du document</Label>
              <Input id="vig-photo" type="file" accept="image/*" onChange={e => setVignettePhoto(e.target.files?.[0] || null)} />
              <p className="text-xs text-muted-foreground mt-1">
                Formats acceptés: JPG, PNG, WEBP
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
            setShowVignetteDialog(false);
            setVignetteForm({
              numero_ordre: '',
              annee: new Date().getFullYear().toString(),
              date_expiration: '',
              montant: '',
              date_paiement: '',
              mode_paiement: 'especes',
              numero_cheque: '',
              banque: '',
              remarques: ''
            });
          }}>
              Annuler
            </Button>
            <Button onClick={async () => {
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
                const {
                  error: uploadError
                } = await supabase.storage.from('vehicle-documents').upload(fileName, vignettePhoto);
                if (uploadError) throw uploadError;
                const {
                  data: {
                    publicUrl
                  }
                } = supabase.storage.from('vehicle-documents').getPublicUrl(fileName);
                photoUrl = publicUrl;
              }
              const {
                error
              } = await supabase.from('vehicle_vignette').insert({
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
                numero_ordre: '',
                annee: new Date().getFullYear().toString(),
                date_expiration: '',
                montant: '',
                date_paiement: '',
                mode_paiement: 'especes',
                numero_cheque: '',
                banque: '',
                remarques: ''
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
          }} disabled={uploadingVignette}>
              {uploadingVignette ? "Upload en cours..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Insurance Detail Dialog */}
      <Dialog open={!!selectedInsurance && !editingInsurance} onOpenChange={() => setSelectedInsurance(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Détails de l'assurance</DialogTitle>
          </DialogHeader>
          {selectedInsurance && <div className="space-y-4">
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
                  <p className="font-medium">{format(new Date(selectedInsurance.date_debut), 'dd/MM/yyyy', {
                  locale: fr
                })}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Date d'expiration</Label>
                  <p className="font-medium">{format(new Date(selectedInsurance.date_expiration), 'dd/MM/yyyy', {
                  locale: fr
                })}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Montant</Label>
                  <p className="font-medium">{selectedInsurance.montant.toFixed(2)} DH</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Date de paiement</Label>
                  <p className="font-medium">{selectedInsurance.date_paiement ? format(new Date(selectedInsurance.date_paiement), 'dd/MM/yyyy', {
                  locale: fr
                }) : '-'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Mode de paiement</Label>
                  <p className="font-medium capitalize">{selectedInsurance.mode_paiement}</p>
                </div>
                {selectedInsurance.numero_cheque && <div>
                    <Label className="text-muted-foreground">N° de chèque</Label>
                    <p className="font-medium">{selectedInsurance.numero_cheque}</p>
                  </div>}
                {selectedInsurance.banque && <div>
                    <Label className="text-muted-foreground">Banque</Label>
                    <p className="font-medium">{selectedInsurance.banque}</p>
                  </div>}
              </div>
              {selectedInsurance.remarques && <div>
                  <Label className="text-muted-foreground">Remarques</Label>
                  <p className="font-medium">{selectedInsurance.remarques}</p>
                </div>}
              {selectedInsurance.photo_url && <div>
                  <Label className="text-muted-foreground">Photo du document</Label>
                  <img src={selectedInsurance.photo_url} alt="Document d'assurance" className="w-full mt-2 rounded-lg border" />
                </div>}
            </div>}
          <DialogFooter>
            <Button onClick={() => {
            setInsuranceForm({
              numero_ordre: selectedInsurance.numero_ordre,
              numero_police: selectedInsurance.numero_police || '',
              assureur: selectedInsurance.assureur,
              coordonnees_assureur: selectedInsurance.coordonnees_assureur || '',
              date_debut: selectedInsurance.date_debut,
              date_expiration: selectedInsurance.date_expiration,
              montant: selectedInsurance.montant.toString(),
              date_paiement: selectedInsurance.date_paiement || '',
              mode_paiement: selectedInsurance.mode_paiement,
              numero_cheque: selectedInsurance.numero_cheque || '',
              banque: selectedInsurance.banque || '',
              remarques: selectedInsurance.remarques || ''
            });
            setEditingInsurance(true);
          }}>
              <Edit className="w-4 h-4 mr-2" />
              Modifier
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Insurance Dialog */}
      <Dialog open={editingInsurance} onOpenChange={open => {
      if (!open) {
        setEditingInsurance(false);
        setSelectedInsurance(null);
      }
    }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier l'assurance</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            {/* ... keep existing insurance form fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>N° d'ordre *</Label>
                <Input value={insuranceForm.numero_ordre} onChange={e => setInsuranceForm({
                ...insuranceForm,
                numero_ordre: e.target.value
              })} />
              </div>
              <div>
                <Label>N° de police</Label>
                <Input value={insuranceForm.numero_police} onChange={e => setInsuranceForm({
                ...insuranceForm,
                numero_police: e.target.value
              })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Assureur *</Label>
                <Input value={insuranceForm.assureur} onChange={e => setInsuranceForm({
                ...insuranceForm,
                assureur: e.target.value
              })} />
              </div>
              <div>
                <Label>Coordonnées assureur</Label>
                <Input value={insuranceForm.coordonnees_assureur} onChange={e => setInsuranceForm({
                ...insuranceForm,
                coordonnees_assureur: e.target.value
              })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Date début *</Label>
                <Input type="date" value={insuranceForm.date_debut} onChange={e => setInsuranceForm({
                ...insuranceForm,
                date_debut: e.target.value
              })} />
              </div>
              <div>
                <Label>Date d'expiration *</Label>
                <Input type="date" value={insuranceForm.date_expiration} onChange={e => setInsuranceForm({
                ...insuranceForm,
                date_expiration: e.target.value
              })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Montant (DH) *</Label>
                <Input type="number" value={insuranceForm.montant} onChange={e => setInsuranceForm({
                ...insuranceForm,
                montant: e.target.value
              })} />
              </div>
              <div>
                <Label>Date de paiement</Label>
                <Input type="date" value={insuranceForm.date_paiement} onChange={e => setInsuranceForm({
                ...insuranceForm,
                date_paiement: e.target.value
              })} />
              </div>
            </div>
            <div>
              <Label>Mode de paiement</Label>
              <Select value={insuranceForm.mode_paiement} onValueChange={(value: any) => setInsuranceForm({
              ...insuranceForm,
              mode_paiement: value
            })}>
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
            {insuranceForm.mode_paiement === 'cheque' && <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>N° de chèque</Label>
                  <Input value={insuranceForm.numero_cheque} onChange={e => setInsuranceForm({
                ...insuranceForm,
                numero_cheque: e.target.value
              })} />
                </div>
                <div>
                  <Label>Banque</Label>
                  <Input value={insuranceForm.banque} onChange={e => setInsuranceForm({
                ...insuranceForm,
                banque: e.target.value
              })} />
                </div>
              </div>}
            <div>
              <Label>Remarques</Label>
              <Textarea value={insuranceForm.remarques} onChange={e => setInsuranceForm({
              ...insuranceForm,
              remarques: e.target.value
            })} />
            </div>
            <div>
              <Label>Photo du document</Label>
              <div className="mt-2">
                <Input type="file" accept="image/*" onChange={e => setEditInsurancePhoto(e.target.files?.[0] || null)} />
                {selectedInsurance?.photo_url && !editInsurancePhoto && <p className="text-sm text-muted-foreground mt-2">Photo actuelle disponible. Sélectionnez une nouvelle photo pour la remplacer.</p>}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
            setEditingInsurance(false);
            setSelectedInsurance(null);
            setEditInsurancePhoto(null);
          }}>
              Annuler
            </Button>
            <Button onClick={async () => {
            try {
              if (!insuranceForm.numero_ordre || !insuranceForm.assureur || !insuranceForm.date_debut || !insuranceForm.date_expiration || !insuranceForm.montant) {
                toast({
                  title: "Erreur",
                  description: "Veuillez remplir tous les champs obligatoires",
                  variant: "destructive"
                });
                return;
              }
              setUploadingEditInsurance(true);
              let photoUrl = selectedInsurance.photo_url;

              // Upload photo if provided
              if (editInsurancePhoto) {
                const fileExt = editInsurancePhoto.name.split('.').pop();
                const fileName = `${vehicle!.id}/insurance/${Date.now()}.${fileExt}`;
                const {
                  error: uploadError
                } = await supabase.storage.from('vehicle-documents').upload(fileName, editInsurancePhoto);
                if (uploadError) throw uploadError;
                const {
                  data: {
                    publicUrl
                  }
                } = supabase.storage.from('vehicle-documents').getPublicUrl(fileName);
                photoUrl = publicUrl;
              }
              const {
                error
              } = await supabase.from('vehicle_insurance').update({
                ...insuranceForm,
                montant: parseFloat(insuranceForm.montant),
                photo_url: photoUrl
              }).eq('id', selectedInsurance.id);
              if (error) throw error;

              // Update vehicle expiration date
              await supabase.from('vehicles').update({
                assurance_expire_le: insuranceForm.date_expiration
              }).eq('id', vehicle!.id);
              toast({
                title: "Succès",
                description: "Assurance modifiée avec succès"
              });
              setEditingInsurance(false);
              setSelectedInsurance(null);
              setEditInsurancePhoto(null);
              loadVehicle();
            } catch (error: any) {
              toast({
                title: "Erreur",
                description: error.message,
                variant: "destructive"
              });
            } finally {
              setUploadingEditInsurance(false);
            }
          }} disabled={uploadingEditInsurance}>
              {uploadingEditInsurance ? "Upload en cours..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Inspection Detail Dialog */}
      <Dialog open={!!selectedInspection && !editingInspection} onOpenChange={() => setSelectedInspection(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Détails de la visite technique</DialogTitle>
          </DialogHeader>
          {selectedInspection && <div className="space-y-4">
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
                  <p className="font-medium">{format(new Date(selectedInspection.date_visite), 'dd/MM/yyyy', {
                  locale: fr
                })}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Date d'expiration</Label>
                  <p className="font-medium">{format(new Date(selectedInspection.date_expiration), 'dd/MM/yyyy', {
                  locale: fr
                })}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Montant</Label>
                  <p className="font-medium">{selectedInspection.montant?.toFixed(2) || '-'} DH</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Date de paiement</Label>
                  <p className="font-medium">{selectedInspection.date_paiement ? format(new Date(selectedInspection.date_paiement), 'dd/MM/yyyy', {
                  locale: fr
                }) : '-'}</p>
                </div>
                {selectedInspection.mode_paiement && <div>
                    <Label className="text-muted-foreground">Mode de paiement</Label>
                    <p className="font-medium capitalize">{selectedInspection.mode_paiement}</p>
                  </div>}
                {selectedInspection.numero_cheque && <div>
                    <Label className="text-muted-foreground">N° de chèque</Label>
                    <p className="font-medium">{selectedInspection.numero_cheque}</p>
                  </div>}
                {selectedInspection.banque && <div>
                    <Label className="text-muted-foreground">Banque</Label>
                    <p className="font-medium">{selectedInspection.banque}</p>
                  </div>}
              </div>
              {selectedInspection.remarques && <div>
                  <Label className="text-muted-foreground">Remarques</Label>
                  <p className="font-medium">{selectedInspection.remarques}</p>
                </div>}
              {selectedInspection.photo_url && <div>
                  <Label className="text-muted-foreground">Photo du document</Label>
                  <img src={selectedInspection.photo_url} alt="Document de visite technique" className="w-full mt-2 rounded-lg border" />
                </div>}
            </div>}
          <DialogFooter>
            <Button onClick={() => {
            setInspectionForm({
              numero_ordre: selectedInspection.numero_ordre,
              centre_controle: selectedInspection.centre_controle || '',
              date_visite: selectedInspection.date_visite,
              date_expiration: selectedInspection.date_expiration,
              montant: selectedInspection.montant?.toString() || '',
              date_paiement: selectedInspection.date_paiement || '',
              mode_paiement: selectedInspection.mode_paiement || 'especes',
              numero_cheque: selectedInspection.numero_cheque || '',
              banque: selectedInspection.banque || '',
              remarques: selectedInspection.remarques || ''
            });
            setEditingInspection(true);
          }}>
              <Edit className="w-4 h-4 mr-2" />
              Modifier
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Vignette Detail Dialog */}
      <Dialog open={!!selectedVignette && !editingVignette} onOpenChange={() => setSelectedVignette(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Détails de la vignette</DialogTitle>
          </DialogHeader>
          {selectedVignette && <div className="space-y-4">
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
                  <p className="font-medium">{format(new Date(selectedVignette.date_expiration), 'dd/MM/yyyy', {
                  locale: fr
                })}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Montant</Label>
                  <p className="font-medium">{selectedVignette.montant?.toFixed(2) || '-'} DH</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Date de paiement</Label>
                  <p className="font-medium">{selectedVignette.date_paiement ? format(new Date(selectedVignette.date_paiement), 'dd/MM/yyyy', {
                  locale: fr
                }) : '-'}</p>
                </div>
                {selectedVignette.mode_paiement && <div>
                    <Label className="text-muted-foreground">Mode de paiement</Label>
                    <p className="font-medium capitalize">{selectedVignette.mode_paiement}</p>
                  </div>}
                {selectedVignette.numero_cheque && <div>
                    <Label className="text-muted-foreground">N° de chèque</Label>
                    <p className="font-medium">{selectedVignette.numero_cheque}</p>
                  </div>}
                {selectedVignette.banque && <div>
                    <Label className="text-muted-foreground">Banque</Label>
                    <p className="font-medium">{selectedVignette.banque}</p>
                  </div>}
              </div>
              {selectedVignette.remarques && <div>
                  <Label className="text-muted-foreground">Remarques</Label>
                  <p className="font-medium">{selectedVignette.remarques}</p>
                </div>}
              {selectedVignette.photo_url && <div>
                  <Label className="text-muted-foreground">Photo du document</Label>
                  <img src={selectedVignette.photo_url} alt="Document de vignette" className="w-full mt-2 rounded-lg border" />
                </div>}
            </div>}
          <DialogFooter>
            <Button onClick={() => {
            setVignetteForm({
              numero_ordre: selectedVignette.numero_ordre,
              annee: selectedVignette.annee.toString(),
              date_expiration: selectedVignette.date_expiration,
              montant: selectedVignette.montant?.toString() || '',
              date_paiement: selectedVignette.date_paiement || '',
              mode_paiement: selectedVignette.mode_paiement || 'especes',
              numero_cheque: selectedVignette.numero_cheque || '',
              banque: selectedVignette.banque || '',
              remarques: selectedVignette.remarques || ''
            });
            setEditingVignette(true);
          }}>
              <Edit className="w-4 h-4 mr-2" />
              Modifier
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Inspection Dialog */}
      <EditInspectionDialog open={editingInspection} onOpenChange={open => {
      if (!open) {
        setEditingInspection(false);
        setSelectedInspection(null);
      }
    }} selectedInspection={selectedInspection} inspectionForm={inspectionForm} setInspectionForm={setInspectionForm} vehicleId={vehicle!.id} onSuccess={loadVehicle} />

      {/* Edit Vignette Dialog */}
      <EditVignetteDialog open={editingVignette} onOpenChange={open => {
      if (!open) {
        setEditingVignette(false);
        setSelectedVignette(null);
      }
    }} selectedVignette={selectedVignette} vignetteForm={vignetteForm} setVignetteForm={setVignetteForm} vehicleId={vehicle!.id} onSuccess={loadVehicle} />

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
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)} disabled={deleting}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleDeleteVehicle} disabled={deleting}>
              {deleting ? "Suppression..." : "Supprimer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>;
}