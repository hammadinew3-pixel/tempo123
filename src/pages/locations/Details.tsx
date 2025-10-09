import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ChevronDown, ChevronUp, FileText, Plus, Check, X, Download, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function LocationDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [contract, setContract] = useState<any>(null);
  const [secondaryDrivers, setSecondaryDrivers] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeliveryDialog, setShowDeliveryDialog] = useState(false);
  const [showReturnDialog, setShowReturnDialog] = useState(false);
  const [showDriverDialog, setShowDriverDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  
  const [openSections, setOpenSections] = useState({
    reservation: true,
    livraison: true,
    recuperation: true,
    conducteurs: true,
    paiements: true,
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
    email: '',
  });

  const [paymentData, setPaymentData] = useState({
    montant: '',
    date_paiement: new Date().toISOString().split('T')[0],
    methode: 'especes' as 'especes' | 'cheque' | 'virement' | 'carte',
    numero_cheque: '',
    banque: '',
    remarques: '',
  });

  useEffect(() => {
    loadContractData();
  }, [id]);

  const loadContractData = async () => {
    try {
      // Load contract
      const { data: contractData, error: contractError } = await supabase
        .from("contracts")
        .select(`
          *,
          clients (nom, prenom, telephone, email, cin, permis_conduire),
          vehicles (immatriculation, marque, modele, kilometrage)
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

      // Load payments
      const { data: paymentsData, error: paymentsError } = await supabase
        .from("contract_payments")
        .select("*")
        .eq("contract_id", id)
        .order("date_paiement", { ascending: false });

      if (paymentsError) throw paymentsError;
      setPayments(paymentsData || []);

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
      const { error } = await supabase
        .from("contracts")
        .update({
          delivery_type: deliveryData.delivery_type,
          delivery_date: deliveryData.delivery_date,
          delivery_km: parseInt(deliveryData.delivery_km) || null,
          delivery_fuel_level: deliveryData.delivery_fuel_level,
          delivery_notes: deliveryData.delivery_notes,
          statut: 'actif',
        })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Informations de livraison enregistrées",
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
      const { error } = await supabase
        .from("contracts")
        .update({
          return_type: returnData.return_type,
          return_date: returnData.return_date,
          return_km: parseInt(returnData.return_km) || null,
          return_fuel_level: returnData.return_fuel_level,
          return_notes: returnData.return_notes,
          statut: 'termine',
        })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Informations de retour enregistrées",
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
        .insert([{
          contract_id: id,
          ...driverData
        }]);

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
        email: '',
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
      const { error } = await supabase
        .from("contract_payments")
        .insert([{
          contract_id: id,
          montant: parseFloat(paymentData.montant),
          date_paiement: paymentData.date_paiement,
          methode: paymentData.methode,
          numero_cheque: paymentData.numero_cheque || null,
          banque: paymentData.banque || null,
          remarques: paymentData.remarques || null,
        }]);

      if (error) throw error;

      // Update contract advance_payment
      const totalPaid = payments.reduce((sum, p) => sum + parseFloat(p.montant), 0) + parseFloat(paymentData.montant);
      const { error: updateError } = await supabase
        .from("contracts")
        .update({ advance_payment: totalPaid })
        .eq("id", id);

      if (updateError) throw updateError;

      toast({
        title: "Succès",
        description: "Paiement ajouté",
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
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message,
      });
    }
  };

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      brouillon: "bg-gray-100 text-gray-800",
      actif: "bg-green-100 text-green-800",
      termine: "bg-blue-100 text-blue-800",
      annule: "bg-red-100 text-red-800",
    };

    const labels: Record<string, string> = {
      brouillon: "Brouillon",
      actif: "Actif",
      termine: "Terminé",
      annule: "Annulé",
    };

    return (
      <Badge variant="outline" className={`${styles[status]} border-0`}>
        {labels[status]}
      </Badge>
    );
  };

  const calculateDuration = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const handleGeneratePDF = async () => {
    try {
      toast({
        title: "Génération en cours",
        description: "Le PDF du contrat est en cours de génération...",
      });

      const { data, error } = await supabase.functions.invoke('generate-contract-pdf', {
        body: { contractId: id }
      });

      if (error) throw error;

      if (data?.pdfUrl) {
        window.open(data.pdfUrl, '_blank');
        toast({
          title: "Succès",
          description: "Le contrat PDF a été généré avec succès",
        });
        loadContractData();
      }
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
    if (!contract.delivery_date) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Veuillez d'abord enregistrer la livraison du véhicule",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("contracts")
        .update({ statut: 'actif' })
        .eq("id", id);

      if (error) throw error;

      // Générer le PDF automatiquement
      await handleGeneratePDF();

      toast({
        title: "Contrat activé",
        description: "Le contrat a été validé et activé avec succès",
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

  const handleRefundCaution = async () => {
    if (!confirm("Confirmer le remboursement de la caution ?")) return;

    try {
      const { error } = await supabase
        .from("contracts")
        .update({ caution_statut: 'remboursee' })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "La caution a été marquée comme remboursée",
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

  const getWorkflowStep = () => {
    if (!contract) return 0;
    
    if (contract.statut === 'brouillon') return 1;
    if (contract.statut === 'actif' && !contract.delivery_date) return 2;
    if (contract.statut === 'actif' && contract.delivery_date && !contract.return_date) return 3;
    if (contract.return_date && contract.caution_statut !== 'remboursee') return 4;
    if (contract.statut === 'termine') return 5;
    if (contract.statut === 'annule') return 0;
    
    return 0;
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

  const totalAmount = contract.total_amount || 0;
  const paidAmount = payments.reduce((sum, p) => sum + parseFloat(p.montant), 0);
  const remainingAmount = totalAmount - paidAmount;
  const duration = calculateDuration(contract.date_debut, contract.date_fin);
  const currentStep = getWorkflowStep();

  const workflowSteps = [
    { id: 1, name: "Réservation", icon: FileText },
    { id: 2, name: "Livraison", icon: CheckCircle2 },
    { id: 3, name: "En cours", icon: Clock },
    { id: 4, name: "Retour", icon: CheckCircle2 },
    { id: 5, name: "Clôturé", icon: Check },
  ];

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            Location N° {contract.numero_contrat}
          </h1>
          <div className="flex items-center text-sm text-muted-foreground space-x-2 mt-2">
            <Link to="/" className="hover:text-foreground">Tableau de bord</Link>
            <span>›</span>
            <Link to="/locations" className="hover:text-foreground">Locations</Link>
            <span>›</span>
            <span className="text-foreground">N° {contract.numero_contrat}</span>
          </div>
        </div>
        <div className="flex gap-2">
          {getStatusBadge(contract.statut)}
          {contract.pdf_url && (
            <Button variant="outline" size="sm" onClick={() => window.open(contract.pdf_url, '_blank')}>
              <Download className="w-4 h-4 mr-2" />
              Télécharger PDF
            </Button>
          )}
          {!contract.pdf_url && contract.statut !== 'brouillon' && (
            <Button variant="outline" size="sm" onClick={handleGeneratePDF}>
              <FileText className="w-4 h-4 mr-2" />
              Générer PDF
            </Button>
          )}
        </div>
      </div>

      {/* Workflow Steps */}
      {contract.statut !== 'annule' && (
        <Card className="p-6">
          <div className="flex items-center justify-between">
            {workflowSteps.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = currentStep >= step.id;
              const isCurrent = currentStep === step.id;
              
              return (
                <div key={step.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                    } ${isCurrent ? 'ring-4 ring-primary/30' : ''}`}>
                      <StepIcon className="w-6 h-6" />
                    </div>
                    <div className={`text-sm mt-2 font-medium ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {step.name}
                    </div>
                  </div>
                  {index < workflowSteps.length - 1 && (
                    <div className={`h-1 flex-1 mx-2 ${isActive ? 'bg-primary' : 'bg-muted'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Actions rapides */}
      {contract.statut === 'brouillon' && !contract.delivery_date && (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600" />
              <div>
                <p className="font-medium text-blue-900">Prochaine étape: Livraison du véhicule</p>
                <p className="text-sm text-blue-700">Enregistrez les informations de livraison pour activer le contrat</p>
              </div>
            </div>
            <Button onClick={() => setShowDeliveryDialog(true)}>
              <Check className="w-4 h-4 mr-2" />
              Marquer comme livré
            </Button>
          </div>
        </Card>
      )}

      {contract.statut === 'brouillon' && contract.delivery_date && !contract.pdf_url && (
        <Card className="p-4 bg-green-50 border-green-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <div>
                <p className="font-medium text-green-900">Prêt à activer</p>
                <p className="text-sm text-green-700">Le véhicule est livré, vous pouvez maintenant valider et activer le contrat</p>
              </div>
            </div>
            <Button onClick={handleValidateContract}>
              <Check className="w-4 h-4 mr-2" />
              Valider et activer
            </Button>
          </div>
        </Card>
      )}

      {contract.statut === 'actif' && !contract.return_date && (
        <Card className="p-4 bg-amber-50 border-amber-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-amber-600" />
              <div>
                <p className="font-medium text-amber-900">Location en cours</p>
                <p className="text-sm text-amber-700">
                  Retour prévu le {format(new Date(contract.date_fin), "dd/MM/yyyy", { locale: fr })}
                </p>
              </div>
            </div>
            <Button onClick={() => setShowReturnDialog(true)}>
              <Check className="w-4 h-4 mr-2" />
              Marquer comme retourné
            </Button>
          </div>
        </Card>
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
            <Button onClick={handleRefundCaution}>
              <Check className="w-4 h-4 mr-2" />
              Marquer comme remboursée
            </Button>
          </div>
        </Card>
      )}

      {/* Top Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total à payer */}
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-0">
          <CardContent className="p-6">
            <div className="text-sm text-muted-foreground mb-2">TOTAL À PAYER</div>
            <div className="text-4xl font-bold mb-1">
              {totalAmount.toFixed(2)}
              <span className="text-lg ml-1">DH</span>
            </div>
            <div className="text-sm mb-2">
              Payé: {paidAmount.toFixed(2)} DH
            </div>
            <div className="text-sm font-semibold">
              Reste: {remainingAmount.toFixed(2)} DH
            </div>
          </CardContent>
        </Card>

        {/* Client */}
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-0">
          <CardContent className="p-6">
            <div className="text-sm text-muted-foreground mb-2">CLIENT</div>
            <div className="text-2xl font-bold mb-2">{clientName}</div>
            <div className="text-sm">{contract.clients?.telephone}</div>
            <div className="text-sm">{contract.clients?.email}</div>
          </CardContent>
        </Card>

        {/* Véhicule */}
        <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-0">
          <CardContent className="p-6">
            <div className="text-sm text-muted-foreground mb-2">VÉHICULE</div>
            <div className="text-2xl font-bold mb-2">
              {contract.vehicles?.marque} {contract.vehicles?.modele}
            </div>
            <div className="text-sm">{contract.vehicles?.immatriculation}</div>
            <div className="text-sm">KM: {contract.vehicles?.kilometrage}</div>
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
                  <span>📋 Info de réservation</span>
                </div>
                {openSections.reservation ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
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
                  <span className="font-medium">{contract.daily_rate?.toFixed(2)} DH</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Caution</span>
                  <span className="font-medium">{contract.caution_montant?.toFixed(2)} DH</span>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>

        {/* Info de livraison + Conducteurs */}
        <Card>
          <Collapsible open={openSections.livraison} onOpenChange={() => toggleSection("livraison")}>
            <CollapsibleTrigger className="w-full">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center space-x-2 text-sm font-medium">
                  <span>🔑 Info de livraison</span>
                </div>
                {openSections.livraison ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
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
                    <Button size="sm" onClick={() => setShowDeliveryDialog(true)}>
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
                  <span>👥 Conducteurs</span>
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
                  <span>🔙 Info de retour</span>
                </div>
                {openSections.recuperation ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
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
                      {contract.statut === 'actif' ? 'Véhicule en circulation' : 'En attente de retour'}
                    </p>
                    {contract.statut === 'actif' && (
                      <Button size="sm" onClick={() => setShowReturnDialog(true)}>
                        <Check className="w-4 h-4 mr-2" />
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
                <span>💰 Paiements</span>
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
                        <th className="pb-2">Remarques</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((payment) => (
                        <tr key={payment.id} className="border-b last:border-0">
                          <td className="py-3">
                            {format(new Date(payment.date_paiement), "dd/MM/yyyy", { locale: fr })}
                          </td>
                          <td className="py-3 font-medium">{parseFloat(payment.montant).toFixed(2)} DH</td>
                          <td className="py-3 capitalize">{payment.methode}</td>
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
    </div>
  );
}
