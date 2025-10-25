import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ChevronDown, ChevronUp, FileText, Plus, Check, X, Download, CheckCircle2, AlertCircle, Clock, Edit, DollarSign, Car, User, Calendar, MapPin, Key, RotateCcw, Users, CreditCard, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ContractWorkflow } from "@/components/workflow/ContractWorkflow";
import { computeChangeAmounts, safeRemaining, resolveRates } from "@/lib/contractPricing";
import { useTenantInsert } from '@/hooks/use-tenant-insert';
import { useRealtime } from '@/hooks/use-realtime';

export default function LocationDetails() {
  const { withTenantId } = useTenantInsert();
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [contract, setContract] = useState<any>(null);
  const [secondaryDrivers, setSecondaryDrivers] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [vehicleChanges, setVehicleChanges] = useState<any[]>([]);
  const [availableVehicles, setAvailableVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeliveryDialog, setShowDeliveryDialog] = useState(false);
  const [showReturnDialog, setShowReturnDialog] = useState(false);
  const [showDriverDialog, setShowDriverDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showEditContractDialog, setShowEditContractDialog] = useState(false);
  const [showCautionDialog, setShowCautionDialog] = useState(false);
  const [showChangeVehicleDialog, setShowChangeVehicleDialog] = useState(false);
  const [showProlongationDialog, setShowProlongationDialog] = useState(false);
  
  const [contractEditData, setContractEditData] = useState({
    date_debut: '',
    date_fin: '',
    daily_rate: '',
    caution_montant: '',
    start_location: '',
    end_location: '',
    notes: '',
  });

  const [cautionData, setCautionData] = useState({
    caution_statut: '',
    caution_notes: '',
  });
  
  const [openSections, setOpenSections] = useState({
    reservation: true,
    livraison: true,
    recuperation: true,
    conducteurs: true,
    paiements: true,
    vehicleHistory: true,
    prolongations: true,
  });

  const [changeVehicleData, setChangeVehicleData] = useState({
    new_vehicle_id: '',
    reason: '',
    notes: '',
    change_date: '',
  });

  const [deliveryData, setDeliveryData] = useState({
    delivery_type: '',
    delivery_date: '',
    delivery_km: '',
    delivery_fuel_level: '',
    delivery_notes: '',
  });

  const [returnData, setReturnData] = useState({
    return_type: '',
    return_date: '',
    return_km: '',
    return_fuel_level: '',
    return_notes: '',
  });

  const [driverData, setDriverData] = useState({
    nom: '',
    prenom: '',
    cin: '',
    permis_conduire: '',
    telephone: '',
    email: ''
  });

  const [paymentData, setPaymentData] = useState({
    montant: '',
    date_paiement: new Date().toISOString().split('T')[0],
    methode: 'especes' as 'especes' | 'cheque' | 'virement' | 'carte',
    numero_cheque: '',
    banque: '',
    remarques: '',
  });

  const [prolongationData, setProlongationData] = useState({
    nouvelle_date_fin: '',
    raison: '',
  });

  const [sousLocationExpense, setSousLocationExpense] = useState<any>(null);

  useEffect(() => {
    loadContractData();
  }, [id]);

  useEffect(() => {
    if (contract) {
      setContractEditData({
        date_debut: contract.date_debut,
        date_fin: contract.date_fin,
        daily_rate: contract.daily_rate?.toString() || '',
        caution_montant: contract.caution_montant?.toString() || '',
        start_location: contract.start_location || '',
        end_location: contract.end_location || '',
        notes: contract.notes || '',
      });
      
      if (contract.delivery_date) {
        setDeliveryData({
          delivery_type: contract.delivery_type || '',
          delivery_date: contract.delivery_date ? new Date(contract.delivery_date).toISOString().slice(0, 16) : '',
          delivery_km: contract.delivery_km?.toString() || '',
          delivery_fuel_level: contract.delivery_fuel_level || '',
          delivery_notes: contract.delivery_notes || '',
        });
      }
      
      if (contract.return_date) {
        setReturnData({
          return_type: contract.return_type || '',
          return_date: contract.return_date ? new Date(contract.return_date).toISOString().slice(0, 16) : '',
          return_km: contract.return_km?.toString() || '',
          return_fuel_level: contract.return_fuel_level || '',
          return_notes: contract.return_notes || '',
        });
      }
    }
  }, [contract]);

  // Écouter les changements sur contract_payments
  useRealtime({
    table: 'contract_payments',
    event: '*',
    filter: `contract_id=eq.${id}`,
    onInsert: () => loadContractData(),
    onUpdate: () => loadContractData(),
    onDelete: () => loadContractData(),
  });

  // Écouter les changements sur revenus
  useRealtime({
    table: 'revenus',
    event: '*',
    onInsert: () => loadContractData(),
    onUpdate: () => loadContractData(),
    onDelete: () => loadContractData(),
  });

  const loadContractData = async () => {
    try {
      // Load contract
      const { data: contractData, error: contractError } = await supabase
        .from("contracts")
        .select(`
          *,
          clients (nom, prenom, telephone, email, cin, permis_conduire),
          vehicles (immatriculation, immatriculation_provisoire, marque, modele, kilometrage, tarif_journalier)
        `)
        .eq("id", id)
        .single();

      if (contractError) throw contractError;
      setContract(contractData);

      // Load secondary drivers
      const { data: driversData, error: driversError } = await supabase
        .from("secondary_drivers")
        .select("*")
        .eq("contract_id", id);

      if (driversError) throw driversError;
      setSecondaryDrivers(driversData || []);

      // Load payments from contract_payments
      const { data: contractPaymentsData, error: contractPaymentsError } = await supabase
        .from("contract_payments")
        .select("*")
        .eq("contract_id", id)
        .order("date_paiement", { ascending: false });

      if (contractPaymentsError) throw contractPaymentsError;

      // Load payments from revenus table for this client
      const { data: revenusData, error: revenusError } = await supabase
        .from("revenus")
        .select("*")
        .eq("client_id", contractData.client_id)
        .eq("source_revenu", "contrat")
        .order("date_encaissement", { ascending: false });

      if (revenusError) throw revenusError;

      // Merge both sources
      const allPayments = [
        ...(contractPaymentsData || []).map(p => ({
          ...p,
          source: 'contract_payments',
          date_paiement: p.date_paiement,
          methode: p.methode,
        })),
        ...(revenusData || []).map(r => ({
          ...r,
          source: 'revenus',
          date_paiement: r.date_encaissement,
          methode: r.mode_paiement,
          remarques: r.note,
        }))
      ].sort((a, b) => new Date(b.date_paiement).getTime() - new Date(a.date_paiement).getTime());

      setPayments(allPayments);

      // Load vehicle changes history
      const { data: changesData, error: changesError } = await supabase
        .from("vehicle_changes")
        .select(`
          *,
          old_vehicle:old_vehicle_id (immatriculation, marque, modele),
          new_vehicle:new_vehicle_id (immatriculation, marque, modele)
        `)
        .eq("contract_id", id)
        .order("change_date", { ascending: false });

      if (changesError) throw changesError;
      setVehicleChanges(changesData || []);

      // Load available vehicles for change
      const { data: availableData, error: availableError } = await supabase
        .from("vehicles")
        .select("*")
        .eq("statut", "disponible");

      if (availableError) throw availableError;
      setAvailableVehicles(availableData || []);

      // Load sous-location expense if vehicle is sous-loué
      if ((contractData.vehicles as any)?.type_vehicule === 'sous_location') {
        const { data: expenseData, error: expenseError } = await supabase
          .from("expenses")
          .select("*")
          .eq("contract_id", id)
          .eq("type_depense", "sous_location")
          .single();

        if (!expenseError && expenseData) {
          setSousLocationExpense(expenseData);
        }
      }

    } catch (error: any) {
      console.error("Erreur chargement:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de charger la location",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelivery = async () => {
    try {
      const updateData: any = {
        delivery_type: deliveryData.delivery_type,
        delivery_date: deliveryData.delivery_date,
        delivery_km: parseInt(deliveryData.delivery_km) || null,
        delivery_fuel_level: deliveryData.delivery_fuel_level,
        delivery_notes: deliveryData.delivery_notes,
        statut: 'livre', // Passe au statut "livre" (en cours)
      };

      const { error } = await supabase
        .from("contracts")
        .update(updateData)
        .eq("id", id);

      if (error) throw error;

      // Update vehicle status to loue when contract is delivered
      if (contract?.vehicle_id) {
        const { error: vehicleError } = await supabase
          .from("vehicles")
          .update({ 
            statut: 'loue',
            updated_at: new Date().toISOString()
          })
          .eq("id", contract.vehicle_id);

        if (vehicleError) throw vehicleError;
      }

      toast({
        title: "Succès",
        description: "Véhicule livré, location en cours",
      });

      setShowDeliveryDialog(false);
      loadContractData();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message,
      });
    }
  };

  const handleReturn = async () => {
    try {
      const updateData: any = {
        return_type: returnData.return_type,
        return_date: returnData.return_date,
        return_km: parseInt(returnData.return_km) || null,
        return_fuel_level: returnData.return_fuel_level,
        return_notes: returnData.return_notes,
        statut: 'retour_effectue', // Passe au statut "retour effectué"
      };

      const { error } = await supabase
        .from("contracts")
        .update(updateData)
        .eq("id", id);

      if (error) throw error;

      // Update vehicle kilometrage and status when returned
      if (contract?.vehicle_id) {
        const vehicleUpdate: any = {
          statut: 'disponible',
          updated_at: new Date().toISOString()
        };
        
        if (returnData.return_km) {
          vehicleUpdate.kilometrage = parseInt(returnData.return_km);
        }
        
        const { error: vehicleError } = await supabase
          .from("vehicles")
          .update(vehicleUpdate)
          .eq("id", contract.vehicle_id);

        if (vehicleError) throw vehicleError;
      }

      toast({
        title: "Succès",
        description: "Véhicule retourné avec succès",
      });

      setShowReturnDialog(false);
      loadContractData();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message,
      });
    }
  };

  const handleAddDriver = async () => {
    try {
      const { error } = await supabase
        .from("secondary_drivers")
        .insert([withTenantId({
          contract_id: id,
          nom: driverData.nom,
          prenom: driverData.prenom,
          cin: driverData.cin,
          permis_conduire: driverData.permis_conduire,
          telephone: driverData.telephone || null,
          email: driverData.email || null
        })]);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Conducteur ajouté",
      });

      setShowDriverDialog(false);
      setDriverData({
        nom: '',
        prenom: '',
        cin: '',
        permis_conduire: '',
        telephone: '',
        email: ''
      });
      loadContractData();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message,
      });
    }
  };

  const handleDeleteDriver = async (driverId: string) => {
    if (!confirm("Voulez-vous supprimer ce conducteur ?")) return;

    try {
      const { error } = await supabase
        .from("secondary_drivers")
        .delete()
        .eq("id", driverId);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Conducteur supprimé",
      });

      loadContractData();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message,
      });
    }
  };

  const handleAddPayment = async () => {
    try {
      // Validation
      if (!paymentData.montant || parseFloat(paymentData.montant) <= 0) {
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Veuillez entrer un montant valide",
        });
        return;
      }

      const montantPaiement = parseFloat(paymentData.montant);
      
      const methode = paymentData.methode === 'carte' ? 'carte_bancaire' : paymentData.methode;
      
      const { error } = await supabase
        .from("contract_payments")
        .insert([withTenantId({
          contract_id: id,
          montant: montantPaiement,
          date_paiement: paymentData.date_paiement,
          methode: methode as 'especes' | 'cheque' | 'virement' | 'carte_bancaire',
        })]);

      if (error) throw error;

      // Update contract advance_payment
      const totalPaid = payments.reduce((sum, p) => sum + parseFloat(p.montant), 0) + montantPaiement;
      const { error: updateError } = await supabase
        .from("contracts")
        .update({ advance_payment: totalPaid })
        .eq("id", id);

      if (updateError) throw updateError;

      toast({
        title: "Succès",
        description: `Paiement de ${montantPaiement.toFixed(2)} DH enregistré`,
      });

      setShowPaymentDialog(false);
      setPaymentData({
        montant: '',
        date_paiement: new Date().toISOString().split('T')[0],
        methode: 'especes',
        numero_cheque: '',
        banque: '',
        remarques: '',
      });
      loadContractData();
    } catch (error: any) {
      console.error("Erreur ajout paiement:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message || "Impossible d'ajouter le paiement",
      });
    }
  };

  const handleChangeVehicle = async () => {
    if (!changeVehicleData.new_vehicle_id) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Veuillez sélectionner un nouveau véhicule",
      });
      return;
    }

    if (!changeVehicleData.reason) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Veuillez indiquer la raison du changement",
      });
      return;
    }

    if (!changeVehicleData.change_date) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Veuillez indiquer la date du changement",
      });
      return;
    }

    try {
      // Récupérer le véhicule sélectionné et vérifier qu'il est différent
      const selectedVehicle = availableVehicles.find(v => v.id === changeVehicleData.new_vehicle_id);
      if (!selectedVehicle) {
        toast({ variant: "destructive", title: "Erreur", description: "Véhicule invalide" });
        return;
      }
      if (selectedVehicle.id === contract.vehicle_id) {
        toast({ variant: "destructive", title: "Erreur", description: "Veuillez choisir un véhicule différent" });
        return;
      }

      // Valider la date de changement (inclusif entre début et fin)
      const startStr = contract.date_debut;
      const endStr = contract.date_fin;
      const changeStr = changeVehicleData.change_date;
      const startDate = new Date(`${startStr}T00:00:00`);
      const changeDate = new Date(`${changeStr}T00:00:00`);
      const endDate = new Date(`${endStr}T00:00:00`);
      if (changeDate < startDate || changeDate > endDate) {
        toast({
          variant: "destructive",
          title: "Date invalide",
          description: "La date de changement doit être comprise entre la date de début et la date de fin",
        });
        return;
      }

      // Résoudre les tarifs
      let { oldRate: oldDailyRate, newRate: newDailyRate } = resolveRates(contract, selectedVehicle);

      // Fallback: si le tarif ancien est 0, récupérer depuis la table vehicles
      if (!oldDailyRate || oldDailyRate <= 0) {
        const { data: oldVeh, error: oldVehErr } = await supabase
          .from('vehicles')
          .select('tarif_journalier')
          .eq('id', contract.vehicle_id)
          .maybeSingle();
        if (!oldVehErr && oldVeh?.tarif_journalier) {
          oldDailyRate = Number(oldVeh.tarif_journalier) || 0;
        }
      }

      // Calculs robustes (jours et montants)
      const { totalDays, daysOld, daysNew, amountOld, amountNew, total } = computeChangeAmounts({
        start: startStr,
        end: endStr,
        change: changeStr,
        oldRate: oldDailyRate,
        newRate: newDailyRate,
      });

      const newTotalAmount = total;
      const newRemainingAmount = safeRemaining(newTotalAmount, contract.advance_payment);

      // Message de calcul détaillé
      const calculationNote = `Changement le ${format(changeDate, 'dd/MM/yyyy', { locale: fr })} (jour ${daysOld + 1}/${totalDays}). ` +
        `Ancien véhicule: ${daysOld} jours × ${oldDailyRate} DH = ${amountOld.toFixed(2)} DH. ` +
        `Nouveau véhicule: ${daysNew} jours × ${newDailyRate} DH = ${amountNew.toFixed(2)} DH. ` +
        `Montant total: ${newTotalAmount.toFixed(2)} DH. ` +
        `${changeVehicleData.notes ? changeVehicleData.notes : ''}`;

      // 1) Historiser le changement
      const { error: changeError } = await supabase
        .from('vehicle_changes')
        .insert([withTenantId({ 
          contract_id: id,
          old_vehicle_id: contract.vehicle_id,
          new_vehicle_id: changeVehicleData.new_vehicle_id,
          reason: changeVehicleData.reason,
          notes: calculationNote,
          change_date: changeVehicleData.change_date,
        })]);
      if (changeError) throw changeError;

      // 2) Mettre à jour le contrat
      const { error: contractError } = await supabase
        .from('contracts')
        .update({ 
          vehicle_id: changeVehicleData.new_vehicle_id,
          daily_rate: newDailyRate,
          total_amount: newTotalAmount,
          remaining_amount: newRemainingAmount,
        } as any)
        .eq('id', id);
      if (contractError) throw contractError;

      // 3) Mettre à jour les statuts véhicules (éviter maj si même véhicule)
      const { error: oldVehicleError } = await supabase
        .from('vehicles')
        .update({ statut: 'disponible' })
        .eq('id', contract.vehicle_id);
      if (oldVehicleError) throw oldVehicleError;

      const { error: newVehicleError } = await supabase
        .from('vehicles')
        .update({ statut: 'loue' })
        .eq('id', changeVehicleData.new_vehicle_id);
      if (newVehicleError) throw newVehicleError;

      toast({ title: 'Succès', description: `Véhicule changé. Nouveau montant: ${newTotalAmount.toFixed(2)} DH` });

      setShowChangeVehicleDialog(false);
      setChangeVehicleData({ new_vehicle_id: '', reason: '', notes: '', change_date: '' });
      loadContractData();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message,
      });
    }
  };

  const handleProlongation = async () => {
    try {
      if (!prolongationData.nouvelle_date_fin) {
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Veuillez entrer une nouvelle date de fin",
        });
        return;
      }

      const nouvelleDateFin = new Date(prolongationData.nouvelle_date_fin);
      const dateActuelle = new Date(contract.date_fin);

      if (nouvelleDateFin <= dateActuelle) {
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "La nouvelle date doit être postérieure à la date de fin actuelle",
        });
        return;
      }

      // Recalculer la durée et le montant total
      const dateDebut = new Date(contract.date_debut);
      const newDuration = Math.ceil((nouvelleDateFin.getTime() - dateDebut.getTime()) / (1000 * 60 * 60 * 24));
      const dailyRate = contract.daily_rate || 0;
      const nouveauMontantTotal = newDuration * dailyRate;

      // Get current prolongations array
      const currentProlongations = contract.prolongations || [];
      
      // Add new prolongation to the array
      const newProlongation = {
        date: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
        ancienne_date_fin: format(dateActuelle, 'yyyy-MM-dd'),
        nouvelle_date_fin: format(nouvelleDateFin, 'yyyy-MM-dd'),
        raison: prolongationData.raison || 'Non spécifiée'
      };

      const { error } = await supabase
        .from("contracts")
        .update({
          date_fin: format(nouvelleDateFin, 'yyyy-MM-dd'),
          duration: newDuration,
          total_amount: nouveauMontantTotal,
          remaining_amount: nouveauMontantTotal - (contract.advance_payment || 0),
          prolongations: [...currentProlongations, newProlongation],
        })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Location prolongée",
        description: `La location a été prolongée jusqu'au ${format(nouvelleDateFin, 'dd/MM/yyyy', { locale: fr })}. Nouveau montant: ${nouveauMontantTotal.toFixed(2)} DH`,
      });

      setShowProlongationDialog(false);
      setProlongationData({ nouvelle_date_fin: '', raison: '' });
      loadContractData();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message,
      });
    }
  };

  const handleGenerateInvoice = async () => {
    try {
      toast({
        title: "Génération en cours",
        description: "Veuillez patienter...",
      });

      const { data, error } = await supabase.functions.invoke('generate-pdf', {
        body: { type: 'facture-location', id: id }
      });
      
      if (error) throw error;
      
      if (data?.url) {
        window.open(data.url, '_blank');
        toast({
          title: "Facture générée",
          description: "La facture PDF va s'ouvrir dans un nouvel onglet",
        });
      } else {
        throw new Error('Aucune URL de PDF reçue');
      }
    } catch (error: any) {
      console.error('Erreur génération facture:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message || "Impossible de générer la facture",
      });
    }
  };

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      brouillon: "bg-gray-100 text-gray-800",
      contrat_valide: "bg-blue-100 text-blue-800",
      livre: "bg-green-100 text-green-800",
      retour_effectue: "bg-amber-100 text-amber-800",
      termine: "bg-indigo-100 text-indigo-800",
      annule: "bg-red-100 text-red-800",
    };

    const labels: Record<string, string> = {
      brouillon: "Réservation",
      contrat_valide: "Contrat validé",
      livre: "En cours",
      retour_effectue: "Retour effectué",
      termine: "Clôturé",
      annule: "Annulé",
    };

    return (
      <Badge variant="outline" className={`${styles[status]} border-0`}>
        {labels[status] || status}
      </Badge>
    );
  };

  const calculateDuration = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const handleDownloadExistingPDF = async () => {
    try {
      if (!contract?.pdf_url) return;
      const response = await fetch(contract.pdf_url);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Contrat_${contract.numero_contrat || id}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast({ title: 'Téléchargement', description: 'Contrat téléchargé' });
    } catch (e) {
      console.error('Erreur téléchargement contrat:', e);
      window.open(contract!.pdf_url, '_blank');
    }
  };

  const handleGeneratePDF = async () => {
    try {
      toast({
        title: "Génération du contrat",
        description: "Veuillez patienter...",
      });

      const { data, error } = await supabase.functions.invoke('generate-pdf', {
        body: { type: 'contract', id }
      });
      
      if (error) throw error;
      
      window.open(data.url, '_blank');
      toast({
        title: 'Succès',
        description: 'Contrat généré avec succès',
      });
    } catch (error: any) {
      console.error('Erreur génération PDF:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message || "Impossible de générer le PDF",
      });
    }
  };

  const handleValidateContract = async () => {
    try {
      const { error } = await supabase
        .from("contracts")
        .update({ statut: 'contrat_valide' })
        .eq("id", id);

      if (error) throw error;

      // Générer le PDF automatiquement
      await handleGeneratePDF();

      toast({
        title: "Contrat validé",
        description: "Le contrat a été validé avec succès",
      });

      loadContractData();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message,
      });
    }
  };

  const handleUpdateContract = async () => {
    try {
      // Recalculate duration and amounts
      const startDate = new Date(contractEditData.date_debut);
      const endDate = new Date(contractEditData.date_fin);
      const duration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const dailyRate = parseFloat(contractEditData.daily_rate);
      const totalAmount = duration * dailyRate;
      const remainingAmount = totalAmount - paidAmount;

      const { error } = await supabase
        .from("contracts")
        .update({
          date_debut: contractEditData.date_debut,
          date_fin: contractEditData.date_fin,
          duration,
          daily_rate: dailyRate,
          total_amount: totalAmount,
          remaining_amount: remainingAmount,
          caution_montant: parseFloat(contractEditData.caution_montant),
          start_location: contractEditData.start_location,
          end_location: contractEditData.end_location,
          notes: contractEditData.notes,
        })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Contrat mis à jour avec succès",
      });

      setShowEditContractDialog(false);
      loadContractData();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message,
      });
    }
  };

  const handleUpdateCaution = async () => {
    try {
      const { error } = await supabase
        .from("contracts")
        .update({ 
          caution_statut: cautionData.caution_statut as any,
        })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Statut de la caution mis à jour",
      });

      setShowCautionDialog(false);
      loadContractData();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message,
      });
    }
  };

  const openDeliveryDialog = () => {
    // Pré-remplir le kilométrage de départ avec le kilométrage actuel du véhicule
    if (contract?.vehicles?.kilometrage && !deliveryData.delivery_km) {
      setDeliveryData(prev => ({
        ...prev,
        delivery_km: contract.vehicles.kilometrage.toString(),
      }));
    }
    setShowDeliveryDialog(true);
  };

  const openReturnDialog = () => {
    // Pré-remplir le kilométrage de retour avec le kilométrage de départ si disponible
    if (contract?.delivery_km && !returnData.return_km) {
      setReturnData(prev => ({
        ...prev,
        return_km: contract.delivery_km.toString(),
      }));
    }
    setShowReturnDialog(true);
  };

  const handleWorkflowAction = async (step: string) => {
    if (step === 'contrat_valide') {
      await handleValidateContract();
    } else if (step === 'livre') {
      openDeliveryDialog();
    } else if (step === 'retour_effectue') {
      openReturnDialog();
    } else if (step === 'termine') {
      // Clôturer le contrat
      try {
        const { error } = await supabase
          .from("contracts")
          .update({ statut: 'termine' })
          .eq("id", id);

        if (error) throw error;

        // Update vehicle status to disponible when contract is closed
        if (contract?.vehicle_id) {
          const { error: vehicleError } = await supabase
            .from("vehicles")
            .update({ 
              statut: 'disponible',
              updated_at: new Date().toISOString()
            })
            .eq("id", contract.vehicle_id);

          if (vehicleError) throw vehicleError;
        }

        toast({
          title: "Contrat clôturé",
          description: "Le contrat a été clôturé avec succès",
        });

        loadContractData();
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Erreur",
          description: error.message,
        });
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <div className="text-muted-foreground mb-4">Location introuvable</div>
        <Button onClick={() => navigate("/locations")}>Retour aux locations</Button>
      </div>
    );
  }

  const clientName = contract.clients 
    ? `${contract.clients.nom} ${contract.clients.prenom || ""}`.trim()
    : "Client inconnu";

  const duration = calculateDuration(contract.date_debut, contract.date_fin);
  
  // Calculer le tarif journalier si manquant
  const dailyRate = contract.daily_rate || contract.vehicles?.tarif_journalier || 0;
  
  // Calculer le montant total si manquant
  const totalAmount = contract.total_amount || (duration * dailyRate);
  
  const paidAmount = payments.reduce((sum, p) => sum + parseFloat(p.montant), 0);
  const remainingAmount = Math.max(0, totalAmount - paidAmount);

  return (
    <div className="max-w-7xl mx-auto p-3 md:p-6 space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold">
            Location N° {contract.numero_contrat}
          </h1>
          <div className="flex items-center text-xs md:text-sm text-muted-foreground space-x-2 mt-2 overflow-x-auto">
            <Link to="/" className="hover:text-foreground whitespace-nowrap">Tableau de bord</Link>
            <span>›</span>
            <Link to="/locations" className="hover:text-foreground whitespace-nowrap">Locations</Link>
            <span>›</span>
            <span className="text-foreground whitespace-nowrap">N° {contract.numero_contrat}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {getStatusBadge(contract.statut)}
          <Button variant="outline" size="sm" onClick={handleGenerateInvoice} className="flex-1 md:flex-none min-w-0">
            <FileText className="w-4 h-4 md:mr-2" />
            <span className="hidden md:inline">Générer facture</span>
          </Button>
          {(contract.statut === 'livre' || contract.statut === 'contrat_valide') && (
            <Button variant="outline" size="sm" onClick={() => setShowChangeVehicleDialog(true)} className="flex-1 md:flex-none min-w-0">
              <RefreshCw className="w-4 h-4 md:mr-2" />
              <span className="hidden md:inline">Changer véhicule</span>
            </Button>
          )}
          {contract.pdf_url && (
            <Button variant="outline" size="sm" onClick={handleDownloadExistingPDF} className="flex-1 md:flex-none min-w-0">
              <Download className="w-4 h-4 md:mr-2" />
              <span className="hidden md:inline">Télécharger contrat</span>
            </Button>
          )}
          {!contract.pdf_url && contract.statut !== 'brouillon' && (
            <Button variant="outline" size="sm" onClick={handleGeneratePDF} className="flex-1 md:flex-none min-w-0">
              <FileText className="w-4 h-4 md:mr-2" />
              <span className="hidden md:inline">Générer PDF</span>
            </Button>
          )}
        </div>
      </div>

      {/* Workflow Component */}
      {contract.statut !== 'annule' && (
        <ContractWorkflow
          currentStatus={contract.statut}
          onStepAction={handleWorkflowAction}
          canProceed={true}
        />
      )}

      {contract.statut === 'termine' && contract.caution_statut === 'bloquee' && (
        <Card className="p-4 bg-purple-50 border-purple-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-purple-600" />
              <div>
                <p className="font-medium text-purple-900">Caution à rembourser</p>
                <p className="text-sm text-purple-700">
                  Montant: {contract.caution_montant?.toFixed(2)} DH
                </p>
              </div>
            </div>
            <Button onClick={() => {
              setCautionData({ 
                caution_statut: 'remboursee',
                caution_notes: '' 
              });
              setShowCautionDialog(true);
            }}>
              <Check className="w-4 h-4 mr-2" />
              Marquer comme remboursée
            </Button>
          </div>
        </Card>
      )}

      {/* Top Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total à payer */}
        <Card className="border-l-4 border-l-primary shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
              <DollarSign className="w-4 h-4 text-primary" />
              <span>TOTAL À PAYER</span>
            </div>
            <div className="text-3xl font-bold text-foreground mb-2">
              {totalAmount.toFixed(2)}
              <span className="text-lg ml-1">DH</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Payé:</span>
              <span className="font-medium">{paidAmount.toFixed(2)} DH</span>
            </div>
            <div className="flex justify-between text-sm font-semibold text-primary mt-1">
              <span>Reste:</span>
              <span>{remainingAmount.toFixed(2)} DH</span>
            </div>
          </CardContent>
        </Card>

        {/* Caution */}
        <Card className="border-l-4 border-l-primary shadow-sm hover:shadow-md transition-shadow relative">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Key className="w-4 h-4 text-primary" />
                <span>CAUTION</span>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 w-7 p-0 hover:bg-primary/10"
                onClick={() => {
                  setCautionData({ 
                    caution_statut: contract.caution_statut,
                    caution_notes: '' 
                  });
                  setShowCautionDialog(true);
                }}
              >
                <Edit className="w-3 h-3 text-primary" />
              </Button>
            </div>
            <div className="text-3xl font-bold text-foreground mb-2">
              {contract.caution_montant?.toFixed(2)}
              <span className="text-lg ml-1">DH</span>
            </div>
            <Badge variant="outline" className={
              contract.caution_statut === 'remboursee' ? 'bg-success/10 text-success border-success/20' :
              contract.caution_statut === 'utilisee' ? 'bg-destructive/10 text-destructive border-destructive/20' :
              'bg-warning/10 text-warning border-warning/20'
            }>
              {contract.caution_statut === 'bloquee' && 'Bloquée'}
              {contract.caution_statut === 'remboursee' && 'Remboursée'}
              {contract.caution_statut === 'utilisee' && 'Utilisée'}
            </Badge>
          </CardContent>
        </Card>

        {/* Client */}
        <Card className="border-l-4 border-l-primary shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
              <User className="w-4 h-4 text-primary" />
              <span>CLIENT</span>
            </div>
            <div className="text-xl font-bold text-foreground mb-2">{clientName}</div>
            <div className="text-sm text-muted-foreground space-y-1">
              <div>{contract.clients?.telephone}</div>
              <div className="truncate">{contract.clients?.email}</div>
            </div>
          </CardContent>
        </Card>

        {/* Véhicule */}
        <Card className="border-l-4 border-l-primary shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
              <Car className="w-4 h-4 text-primary" />
              <span>VÉHICULE</span>
            </div>
            <div className="text-xl font-bold text-foreground mb-2">
              {contract.vehicles?.marque} {contract.vehicles?.modele}
            </div>
            <div className="text-sm text-muted-foreground space-y-1">
              <div>{contract.vehicles?.immatriculation || contract.vehicles?.immatriculation_provisoire || '—'}</div>
              <div>KM: {contract.vehicles?.kilometrage}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Info de réservation */}
        <Card>
          <Collapsible open={openSections.reservation} onOpenChange={() => toggleSection("reservation")}>
            <CollapsibleTrigger className="w-full">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center space-x-2 text-sm font-medium">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span>Info de réservation</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowEditContractDialog(true);
                    }}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  {openSections.reservation ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </CardContent>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="px-4 pb-4 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">N° Contrat</span>
                  <span className="font-medium">{contract.numero_contrat}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Durée</span>
                  <span className="font-medium">{duration} jours</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Départ</span>
                  <span className="font-medium">
                    {format(new Date(contract.date_debut), "dd/MM/yyyy", { locale: fr })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Retour</span>
                  <span className="font-medium">
                    {format(new Date(contract.date_fin), "dd/MM/yyyy", { locale: fr })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Prix/Jr</span>
                  <span className="font-medium">{dailyRate?.toFixed(2) || '0.00'} DH</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Caution</span>
                  <span className="font-medium">{contract.caution_montant?.toFixed(2)} DH</span>
                </div>
                {(contract.statut === 'livre' || contract.statut === 'contrat_valide') && (
                  <div className="pt-3 border-t">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full" 
                      onClick={() => setShowProlongationDialog(true)}
                    >
                      <Calendar className="w-4 h-4 mr-2" />
                      Prolonger la location
                    </Button>
                  </div>
                )}
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>

        {/* Note si véhicule sous-loué */}
        {(contract?.vehicles as any)?.type_vehicule === 'sous_location' && (
          <Alert className="bg-primary/5 border-primary/20">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="flex items-center justify-between">
                <div>
                  💡 <strong>Véhicule en sous-location</strong> - Une dépense de sous-location a été générée automatiquement.
                </div>
                {sousLocationExpense && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/charges')}
                  >
                    Voir la dépense
                  </Button>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Info de livraison + Conducteurs */}
        <Card>
          <Collapsible open={openSections.livraison} onOpenChange={() => toggleSection("livraison")}>
            <CollapsibleTrigger className="w-full">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center space-x-2 text-sm font-medium">
                  <Key className="w-4 h-4 text-primary" />
                  <span>Info de livraison</span>
                </div>
                <div className="flex items-center gap-2">
                  {contract.delivery_date && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        openDeliveryDialog();
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  )}
                  {openSections.livraison ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </CardContent>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="px-4 pb-4">
                {contract.delivery_type ? (
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Type</span>
                      <Badge variant="outline">
                        {contract.delivery_type === 'recupere' ? 'Récupéré' : 'Livré'}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Date</span>
                      <span className="font-medium">
                        {contract.delivery_date && format(new Date(contract.delivery_date), "dd/MM/yyyy HH:mm", { locale: fr })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Kilométrage</span>
                      <span className="font-medium">{contract.delivery_km || '—'} km</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Carburant</span>
                      <span className="font-medium">{contract.delivery_fuel_level || '—'}</span>
                    </div>
                    {contract.delivery_notes && (
                      <div>
                        <span className="text-muted-foreground">Notes:</span>
                        <p className="text-sm mt-1">{contract.delivery_notes}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground mb-4">En attente de livraison</p>
                    <Button size="sm" onClick={openDeliveryDialog}>
                      <Check className="w-4 h-4 mr-2" />
                      Marquer comme livré
                    </Button>
                  </div>
                )}
              </CardContent>
            </CollapsibleContent>
          </Collapsible>

          {/* Conducteurs */}
          <Collapsible open={openSections.conducteurs} onOpenChange={() => toggleSection("conducteurs")} className="border-t">
            <CollapsibleTrigger className="w-full">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center space-x-2 text-sm font-medium">
                  <Users className="w-4 h-4 text-primary" />
                  <span>Conducteurs</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDriverDialog(true);
                    }}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                  {openSections.conducteurs ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </CardContent>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="px-4 pb-4 space-y-2">
                <div className="bg-muted/50 p-3 rounded-md">
                  <div className="text-sm font-medium">1er conducteur</div>
                  <div className="text-sm">{clientName}</div>
                  <div className="text-xs text-muted-foreground">
                    Permis: {contract.clients?.permis_conduire || '—'}
                  </div>
                </div>
                {secondaryDrivers.map((driver, index) => (
                  <div key={driver.id} className="bg-muted/50 p-3 rounded-md relative">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2 h-6 w-6 p-0"
                      onClick={() => handleDeleteDriver(driver.id)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                    <div className="text-sm font-medium">{index + 2}ème conducteur</div>
                    <div className="text-sm">{driver.nom} {driver.prenom}</div>
                    <div className="text-xs text-muted-foreground">
                      Permis: {driver.permis_conduire || '—'}
                    </div>
                  </div>
                ))}
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>

        {/* Info de récupération */}
        <Card>
          <Collapsible open={openSections.recuperation} onOpenChange={() => toggleSection("recuperation")}>
            <CollapsibleTrigger className="w-full">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center space-x-2 text-sm font-medium">
                  <RotateCcw className="w-4 h-4 text-primary" />
                  <span>Info de retour</span>
                </div>
                <div className="flex items-center gap-2">
                  {contract.return_date && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        openReturnDialog();
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  )}
                  {openSections.recuperation ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </CardContent>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="px-4 pb-4">
                {contract.return_type ? (
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Type</span>
                      <Badge variant="outline">
                        {contract.return_type === 'recupere' ? 'Récupéré' : 'Rendu'}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Date</span>
                      <span className="font-medium">
                        {contract.return_date && format(new Date(contract.return_date), "dd/MM/yyyy HH:mm", { locale: fr })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Kilométrage</span>
                      <span className="font-medium">{contract.return_km || '—'} km</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Carburant</span>
                      <span className="font-medium">{contract.return_fuel_level || '—'}</span>
                    </div>
                    {contract.return_notes && (
                      <div>
                        <span className="text-muted-foreground">Notes:</span>
                        <p className="text-sm mt-1">{contract.return_notes}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground mb-4">
                      {contract.statut === 'livre' ? 'Véhicule en circulation' : 'En attente de retour'}
                    </p>
                    {contract.statut === 'livre' && (
                      <Button size="sm" onClick={openReturnDialog}>
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Marquer comme retourné
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      </div>

      {/* Paiements */}
      <Card>
        <Collapsible open={openSections.paiements} onOpenChange={() => toggleSection("paiements")}>
          <CollapsibleTrigger className="w-full">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center space-x-2 text-sm font-medium">
                <CreditCard className="w-4 h-4 text-primary" />
                <span>Paiements</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowPaymentDialog(true);
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter
                </Button>
                {openSections.paiements ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </CardContent>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="px-4 pb-4">
              {payments.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">Aucun paiement</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left border-b">
                        <th className="pb-2">Date</th>
                        <th className="pb-2">Montant</th>
                        <th className="pb-2">Méthode</th>
                        <th className="pb-2">Source</th>
                        <th className="pb-2">Remarques</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((payment) => (
                        <tr key={`${payment.source}-${payment.id}`} className="border-b last:border-0">
                          <td className="py-3">
                            {format(new Date(payment.date_paiement), "dd/MM/yyyy", { locale: fr })}
                          </td>
                          <td className="py-3 font-medium">{parseFloat(payment.montant).toFixed(2)} DH</td>
                          <td className="py-3 capitalize">{payment.methode}</td>
                          <td className="py-3">
                            <Badge variant={payment.source === 'contract_payments' ? 'default' : 'secondary'} className="text-xs">
                              {payment.source === 'contract_payments' ? 'Paiement' : 'Revenu'}
                            </Badge>
                          </td>
                          <td className="py-3 text-muted-foreground">{payment.remarques || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Historique des changements de véhicule */}
      {vehicleChanges.length > 0 && (
        <Card>
          <Collapsible open={openSections.vehicleHistory} onOpenChange={() => toggleSection("vehicleHistory")}>
            <CollapsibleTrigger className="w-full">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center space-x-2 text-sm font-medium">
                  <RefreshCw className="w-4 h-4 text-primary" />
                  <span>Historique des changements de véhicule</span>
                </div>
                {openSections.vehicleHistory ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </CardContent>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="px-4 pb-4">
                <div className="space-y-4">
                  {vehicleChanges.map((change: any) => (
                    <div key={change.id} className="border-l-2 border-primary pl-4 py-2">
                      <div className="text-sm space-y-1">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <span>{format(new Date(change.change_date), "dd/MM/yyyy HH:mm", { locale: fr })}</span>
                        </div>
                        <div className="font-medium">
                          <span className="text-red-600">
                            {change.old_vehicle?.marque} {change.old_vehicle?.modele} ({change.old_vehicle?.immatriculation})
                          </span>
                          {' → '}
                          <span className="text-green-600">
                            {change.new_vehicle?.marque} {change.new_vehicle?.modele} ({change.new_vehicle?.immatriculation})
                          </span>
                        </div>
                        <div className="text-muted-foreground">
                          <span className="font-medium">Raison:</span> {change.reason}
                        </div>
                        {change.notes && (
                          <div className="text-muted-foreground">
                            <span className="font-medium">Notes:</span> {change.notes}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      )}

      {/* Historique des prolongations */}
      {contract.prolongations && contract.prolongations.length > 0 && (
        <Card>
          <Collapsible open={openSections.prolongations} onOpenChange={() => toggleSection("prolongations")}>
            <CollapsibleTrigger className="w-full">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center space-x-2 text-sm font-medium">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span>Historique des prolongations</span>
                  <Badge variant="outline" className="ml-2">
                    {contract.prolongations.length}
                  </Badge>
                </div>
                {openSections.prolongations ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </CardContent>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="px-4 pb-4 space-y-4">
                {contract.prolongations.map((prolongation: any, index: number) => (
                  <div key={index} className="p-3 bg-muted/50 rounded-lg space-y-2 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Prolongation #{index + 1}</span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(prolongation.date), "dd/MM/yyyy 'à' HH:mm", { locale: fr })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Ancienne date de fin</span>
                      <span className="font-medium">
                        {format(new Date(prolongation.ancienne_date_fin), "dd/MM/yyyy", { locale: fr })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Nouvelle date de fin</span>
                      <span className="font-medium text-primary">
                        {format(new Date(prolongation.nouvelle_date_fin), "dd/MM/yyyy", { locale: fr })}
                      </span>
                    </div>
                    {prolongation.raison && (
                      <div>
                        <span className="text-muted-foreground">Raison:</span>
                        <p className="text-sm mt-1">{prolongation.raison}</p>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      )}

      {/* Dialog Prolongation */}
      <Dialog open={showProlongationDialog} onOpenChange={setShowProlongationDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Prolonger la location</DialogTitle>
            <DialogDescription>
              Date de fin actuelle: {format(new Date(contract.date_fin), 'dd/MM/yyyy', { locale: fr })}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nouvelle date de fin *</Label>
              <Input
                type="date"
                value={prolongationData.nouvelle_date_fin}
                onChange={(e) => setProlongationData({ ...prolongationData, nouvelle_date_fin: e.target.value })}
                min={contract.date_fin}
              />
              <p className="text-xs text-muted-foreground mt-1">
                La date doit être postérieure à la date de fin actuelle
              </p>
            </div>
            <div>
              <Label>Raison de la prolongation</Label>
              <Textarea
                value={prolongationData.raison}
                onChange={(e) => setProlongationData({ ...prolongationData, raison: e.target.value })}
                placeholder="Ex: Client a demandé une prolongation..."
                rows={3}
              />
            </div>
            <div className="bg-blue-50 border border-blue-200 p-3 rounded-md">
              <p className="text-sm text-blue-900">
                Le montant total sera recalculé automatiquement en fonction de la nouvelle durée et du tarif journalier actuel ({contract.daily_rate?.toFixed(2)} DH/jour).
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowProlongationDialog(false)}>
                Annuler
              </Button>
              <Button onClick={handleProlongation}>
                Prolonger
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Livraison */}
      <Dialog open={showDeliveryDialog} onOpenChange={setShowDeliveryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Marquer la livraison</DialogTitle>
            <DialogDescription>
              Enregistrez les détails de la livraison du véhicule
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Type de livraison *</Label>
              <Select value={deliveryData.delivery_type} onValueChange={(v) => setDeliveryData({...deliveryData, delivery_type: v})}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recupere">Récupéré par le client</SelectItem>
                  <SelectItem value="livre">Livré au client</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Date et heure *</Label>
              <Input
                type="datetime-local"
                value={deliveryData.delivery_date}
                onChange={(e) => setDeliveryData({...deliveryData, delivery_date: e.target.value})}
              />
            </div>
            <div>
              <Label>Kilométrage</Label>
              <Input
                type="number"
                value={deliveryData.delivery_km}
                onChange={(e) => setDeliveryData({...deliveryData, delivery_km: e.target.value})}
                placeholder="Ex: 50000"
              />
            </div>
            <div>
              <Label>Niveau de carburant</Label>
              <Select value={deliveryData.delivery_fuel_level} onValueChange={(v) => setDeliveryData({...deliveryData, delivery_fuel_level: v})}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="plein">Plein</SelectItem>
                  <SelectItem value="3/4">3/4</SelectItem>
                  <SelectItem value="1/2">1/2</SelectItem>
                  <SelectItem value="1/4">1/4</SelectItem>
                  <SelectItem value="vide">Vide</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea
                value={deliveryData.delivery_notes}
                onChange={(e) => setDeliveryData({...deliveryData, delivery_notes: e.target.value})}
                placeholder="Remarques diverses..."
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowDeliveryDialog(false)}>
                Annuler
              </Button>
              <Button onClick={handleDelivery}>
                Enregistrer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Retour */}
      <Dialog open={showReturnDialog} onOpenChange={setShowReturnDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Marquer le retour</DialogTitle>
            <DialogDescription>
              Enregistrez les détails du retour du véhicule
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Type de retour *</Label>
              <Select value={returnData.return_type} onValueChange={(v) => setReturnData({...returnData, return_type: v})}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recupere">Récupéré chez le client</SelectItem>
                  <SelectItem value="rendu">Rendu par le client</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Date et heure *</Label>
              <Input
                type="datetime-local"
                value={returnData.return_date}
                onChange={(e) => setReturnData({...returnData, return_date: e.target.value})}
              />
            </div>
            <div>
              <Label>Kilométrage</Label>
              <Input
                type="number"
                value={returnData.return_km}
                onChange={(e) => setReturnData({...returnData, return_km: e.target.value})}
                placeholder="Ex: 51000"
              />
            </div>
            <div>
              <Label>Niveau de carburant</Label>
              <Select value={returnData.return_fuel_level} onValueChange={(v) => setReturnData({...returnData, return_fuel_level: v})}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="plein">Plein</SelectItem>
                  <SelectItem value="3/4">3/4</SelectItem>
                  <SelectItem value="1/2">1/2</SelectItem>
                  <SelectItem value="1/4">1/4</SelectItem>
                  <SelectItem value="vide">Vide</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea
                value={returnData.return_notes}
                onChange={(e) => setReturnData({...returnData, return_notes: e.target.value})}
                placeholder="Remarques diverses..."
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowReturnDialog(false)}>
                Annuler
              </Button>
              <Button onClick={handleReturn}>
                Enregistrer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Conducteur */}
      <Dialog open={showDriverDialog} onOpenChange={setShowDriverDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter un conducteur</DialogTitle>
            <DialogDescription>
              Ajoutez un conducteur secondaire pour cette location
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nom *</Label>
                <Input
                  value={driverData.nom}
                  onChange={(e) => setDriverData({...driverData, nom: e.target.value})}
                />
              </div>
              <div>
                <Label>Prénom</Label>
                <Input
                  value={driverData.prenom}
                  onChange={(e) => setDriverData({...driverData, prenom: e.target.value})}
                />
              </div>
            </div>
            <div>
              <Label>CIN</Label>
              <Input
                value={driverData.cin}
                onChange={(e) => setDriverData({...driverData, cin: e.target.value})}
              />
            </div>
            <div>
              <Label>Permis de conduire</Label>
              <Input
                value={driverData.permis_conduire}
                onChange={(e) => setDriverData({...driverData, permis_conduire: e.target.value})}
              />
            </div>
            <div>
              <Label>Téléphone</Label>
              <Input
                value={driverData.telephone}
                onChange={(e) => setDriverData({...driverData, telephone: e.target.value})}
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={driverData.email}
                onChange={(e) => setDriverData({...driverData, email: e.target.value})}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowDriverDialog(false)}>
                Annuler
              </Button>
              <Button onClick={handleAddDriver}>
                Ajouter
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Paiement */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter un paiement</DialogTitle>
            <DialogDescription>
              Enregistrez un paiement pour cette location
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Montant *</Label>
              <Input
                type="number"
                step="0.01"
                value={paymentData.montant}
                onChange={(e) => setPaymentData({...paymentData, montant: e.target.value})}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label>Date de paiement *</Label>
              <Input
                type="date"
                value={paymentData.date_paiement}
                onChange={(e) => setPaymentData({...paymentData, date_paiement: e.target.value})}
              />
            </div>
            <div>
              <Label>Méthode de paiement *</Label>
              <Select value={paymentData.methode} onValueChange={(v) => setPaymentData({...paymentData, methode: v as typeof paymentData.methode})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="especes">Espèces</SelectItem>
                  <SelectItem value="cheque">Chèque</SelectItem>
                  <SelectItem value="virement">Virement</SelectItem>
                  <SelectItem value="carte">Carte bancaire</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {paymentData.methode === 'cheque' && (
              <>
                <div>
                  <Label>N° Chèque</Label>
                  <Input
                    value={paymentData.numero_cheque}
                    onChange={(e) => setPaymentData({...paymentData, numero_cheque: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Banque</Label>
                  <Input
                    value={paymentData.banque}
                    onChange={(e) => setPaymentData({...paymentData, banque: e.target.value})}
                  />
                </div>
              </>
            )}
            <div>
              <Label>Remarques</Label>
              <Textarea
                value={paymentData.remarques}
                onChange={(e) => setPaymentData({...paymentData, remarques: e.target.value})}
                placeholder="Notes optionnelles..."
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>
                Annuler
              </Button>
              <Button onClick={handleAddPayment}>
                Enregistrer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Modifier Contrat */}
      <Dialog open={showEditContractDialog} onOpenChange={setShowEditContractDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier la réservation</DialogTitle>
            <DialogDescription>
              Modifiez les dates, tarifs ou prolongez la location
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Date début *</Label>
                <Input
                  type="date"
                  value={contractEditData.date_debut}
                  onChange={(e) => setContractEditData({...contractEditData, date_debut: e.target.value})}
                />
              </div>
              <div>
                <Label>Date fin *</Label>
                <Input
                  type="date"
                  value={contractEditData.date_fin}
                  onChange={(e) => setContractEditData({...contractEditData, date_fin: e.target.value})}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tarif journalier *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={contractEditData.daily_rate}
                  onChange={(e) => setContractEditData({...contractEditData, daily_rate: e.target.value})}
                  placeholder="Ex: 300.00"
                />
              </div>
              <div>
                <Label>Caution *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={contractEditData.caution_montant}
                  onChange={(e) => setContractEditData({...contractEditData, caution_montant: e.target.value})}
                  placeholder="Ex: 3000.00"
                />
              </div>
            </div>
            <div>
              <Label>Lieu de départ</Label>
              <Input
                value={contractEditData.start_location}
                onChange={(e) => setContractEditData({...contractEditData, start_location: e.target.value})}
                placeholder="Ex: Casablanca"
              />
            </div>
            <div>
              <Label>Lieu de retour</Label>
              <Input
                value={contractEditData.end_location}
                onChange={(e) => setContractEditData({...contractEditData, end_location: e.target.value})}
                placeholder="Ex: Marrakech"
              />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea
                value={contractEditData.notes}
                onChange={(e) => setContractEditData({...contractEditData, notes: e.target.value})}
                placeholder="Remarques diverses..."
                rows={3}
              />
            </div>
            <div className="bg-blue-50 p-4 rounded-md">
              <p className="text-sm font-medium text-blue-900 mb-2">Aperçu du calcul</p>
              <div className="text-sm text-blue-700 space-y-1">
                <p>Durée: {calculateDuration(contractEditData.date_debut, contractEditData.date_fin)} jours</p>
                <p>Total: {(calculateDuration(contractEditData.date_debut, contractEditData.date_fin) * parseFloat(contractEditData.daily_rate || '0')).toFixed(2)} DH</p>
                <p>Reste à payer: {((calculateDuration(contractEditData.date_debut, contractEditData.date_fin) * parseFloat(contractEditData.daily_rate || '0')) - paidAmount).toFixed(2)} DH</p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowEditContractDialog(false)}>
                Annuler
              </Button>
              <Button onClick={handleUpdateContract}>
                Enregistrer les modifications
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Gestion Caution */}
      <Dialog open={showCautionDialog} onOpenChange={setShowCautionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gestion de la caution</DialogTitle>
            <DialogDescription>
              Modifier le statut de la caution ({contract.caution_montant?.toFixed(2)} DH)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Statut de la caution *</Label>
              <Select value={cautionData.caution_statut} onValueChange={(v) => setCautionData({...cautionData, caution_statut: v})}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bloquee">Bloquée</SelectItem>
                  <SelectItem value="remboursee">Remboursée</SelectItem>
                  <SelectItem value="utilisee">Utilisée (retenue)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Notes (optionnel)</Label>
              <Textarea
                value={cautionData.caution_notes}
                onChange={(e) => setCautionData({...cautionData, caution_notes: e.target.value})}
                placeholder="Raison de l'utilisation de la caution, etc."
                rows={3}
              />
            </div>
            {cautionData.caution_statut === 'utilisee' && (
              <div className="bg-destructive/10 border border-destructive/20 p-3 rounded-md flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
                <p className="text-sm text-destructive">
                  Attention: La caution sera marquée comme utilisée et ne pourra pas être remboursée automatiquement.
                </p>
              </div>
            )}
            {cautionData.caution_statut === 'remboursee' && (
              <div className="bg-success/10 border border-success/20 p-3 rounded-md flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                <p className="text-sm text-success">
                  La caution sera marquée comme remboursée au client.
                </p>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCautionDialog(false)}>
                Annuler
              </Button>
              <Button onClick={handleUpdateCaution}>
                Enregistrer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Changement de véhicule */}
      <Dialog open={showChangeVehicleDialog} onOpenChange={setShowChangeVehicleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Changer de véhicule</DialogTitle>
            <DialogDescription>
              Remplacer le véhicule actuel par un autre véhicule disponible
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-muted p-3 rounded-md">
              <div className="text-sm font-medium mb-1">Véhicule actuel</div>
              <div className="text-sm text-muted-foreground">
                {contract.vehicles?.marque} {contract.vehicles?.modele} - {contract.vehicles?.immatriculation}
              </div>
            </div>
            
            <div>
              <Label>Nouveau véhicule *</Label>
              <Select 
                value={changeVehicleData.new_vehicle_id} 
                onValueChange={(v) => {
                  setChangeVehicleData({
                    ...changeVehicleData, 
                    new_vehicle_id: v,
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un véhicule" />
                </SelectTrigger>
                <SelectContent>
                  {availableVehicles.map((vehicle) => (
                    <SelectItem key={vehicle.id} value={vehicle.id}>
                      {vehicle.marque} {vehicle.modele} - {vehicle.immatriculation || vehicle.immatriculation_provisoire || vehicle.ww || 'N/A'} ({vehicle.tarif_journalier} DH/jour)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Date du changement *</Label>
              <Input
                type="date"
                min={contract.date_debut}
                max={contract.date_fin}
                value={changeVehicleData.change_date}
                onChange={(e) => setChangeVehicleData({...changeVehicleData, change_date: e.target.value})}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Date à laquelle le changement de véhicule a lieu (entre {format(new Date(contract.date_debut), 'dd/MM/yyyy', { locale: fr })} et {format(new Date(contract.date_fin), 'dd/MM/yyyy', { locale: fr })})
              </p>
            </div>

            {changeVehicleData.new_vehicle_id && changeVehicleData.change_date && contract.duration && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-3 rounded-md">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">Calcul au prorata</p>
                {(() => {
                  const selectedVehicle = availableVehicles.find(v => v.id === changeVehicleData.new_vehicle_id);
                  if (!selectedVehicle) return null;

                  const oldRate = Number(contract.daily_rate ?? contract.vehicles?.tarif_journalier) || 0;
                  const newRate = Number(selectedVehicle.tarif_journalier) || oldRate;
                   const startDate = new Date(`${contract.date_debut}T00:00:00`);
                   const changeDate = new Date(`${changeVehicleData.change_date}T00:00:00`);
                   const endDate = new Date(`${contract.date_fin}T00:00:00`);
                   const dayMs = 1000 * 60 * 60 * 24;
                   const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / dayMs);
                   const daysWithOld = Math.floor((changeDate.getTime() - startDate.getTime()) / dayMs) + 1;
                   const daysWithNew = totalDays - daysWithOld;
                  
                  if (daysWithOld < 0 || daysWithNew <= 0) {
                    return (
                      <p className="text-sm text-red-600 dark:text-red-400">
                        Date invalide. Veuillez choisir une date entre le début et la fin de la location.
                      </p>
                    );
                  }

                  const amountOld = daysWithOld * oldRate;
                  const amountNew = daysWithNew * newRate;
                  const totalAmount = amountOld + amountNew;
                  const difference = totalAmount - (contract.total_amount || 0);

                  return (
                    <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                      <p>• Ancien véhicule: {daysWithOld} jour{daysWithOld > 1 ? 's' : ''} × {oldRate} DH = {amountOld.toFixed(2)} DH</p>
                      <p>• Nouveau véhicule: {daysWithNew} jour{daysWithNew > 1 ? 's' : ''} × {newRate} DH = {amountNew.toFixed(2)} DH</p>
                      <p className="font-semibold pt-1 border-t border-blue-300 dark:border-blue-700">
                        Nouveau montant total: {totalAmount.toFixed(2)} DH
                        {difference !== 0 && (
                          <span className={difference > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}>
                            {' '}({difference > 0 ? '+' : ''}{difference.toFixed(2)} DH)
                          </span>
                        )}
                      </p>
                      {contract.advance_payment > 0 && (
                        <p>Reste à payer: {(totalAmount - contract.advance_payment).toFixed(2)} DH</p>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}
            
            <div>
              <Label>Raison du changement *</Label>
              <Select 
                value={changeVehicleData.reason} 
                onValueChange={(v) => setChangeVehicleData({...changeVehicleData, reason: v})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une raison" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="panne">Panne technique</SelectItem>
                  <SelectItem value="accident">Accident</SelectItem>
                  <SelectItem value="demande_client">Demande du client</SelectItem>
                  <SelectItem value="maintenance">Maintenance urgente</SelectItem>
                  <SelectItem value="autre">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Notes complémentaires</Label>
              <Textarea
                value={changeVehicleData.notes}
                onChange={(e) => setChangeVehicleData({...changeVehicleData, notes: e.target.value})}
                placeholder="Détails supplémentaires sur le changement..."
                rows={3}
              />
            </div>

            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3 rounded-md flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800 dark:text-amber-200">
                <p className="font-medium mb-1">Important</p>
                <p>Le véhicule actuel sera libéré et marqué comme disponible. Le nouveau véhicule sera marqué comme loué.</p>
              </div>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowChangeVehicleDialog(false)}>
                Annuler
              </Button>
              <Button onClick={handleChangeVehicle}>
                Confirmer le changement
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
