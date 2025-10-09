import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ChevronDown, ChevronUp, FileText, Download, Edit, DollarSign, Car, User, Calendar, MapPin, Key, AlertCircle, Check, CheckCircle2 } from "lucide-react";
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

export default function AssistanceDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [assistance, setAssistance] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showDeliveryDialog, setShowDeliveryDialog] = useState(false);
  const [showReturnDialog, setShowReturnDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showFranchiseDialog, setShowFranchiseDialog] = useState(false);
  const [showFranchiseStatusDialog, setShowFranchiseStatusDialog] = useState(false);
  const [showClotureLocationDialog, setShowClotureLocationDialog] = useState(false);
  const [showPaiementDialog, setShowPaiementDialog] = useState(false);
  
  const [franchiseData, setFranchiseData] = useState({
    franchise_montant: '',
  });
  
  const [franchiseStatusData, setFranchiseStatusData] = useState({
    franchise_statut: '',
    franchise_notes: '',
  });
  
  const [paiementData, setPaiementData] = useState({
    montant_paye: '',
    date_paiement_assurance: '',
    etat_paiement: 'paye' as 'paye' | 'partiellement_paye',
  });

  const [openSections, setOpenSections] = useState({
    dossier: true,
    client: true,
    vehicule: true,
    livraison: true,
    retour: true,
  });

  const [editData, setEditData] = useState({
    date_debut: '',
    date_fin: '',
    tarif_journalier: '',
    franchise_montant: '',
    remarques: '',
  });

  const [deliveryData, setDeliveryData] = useState({
    kilometrage_depart: '',
    niveau_carburant_depart: '',
    etat_vehicule_depart: '',
  });

  const [returnData, setReturnData] = useState({
    date_retour_effective: '',
    kilometrage_retour: '',
    niveau_carburant_retour: '',
    etat_vehicule_retour: '',
  });

  useEffect(() => {
    loadAssistance();
  }, [id]);

  useEffect(() => {
    if (assistance) {
      setEditData({
        date_debut: assistance.date_debut,
        date_fin: assistance.date_fin || '',
        tarif_journalier: assistance.tarif_journalier?.toString() || '',
        franchise_montant: assistance.franchise_montant?.toString() || '',
        remarques: assistance.remarques || '',
      });
      
      setFranchiseData({
        franchise_montant: assistance.franchise_montant?.toString() || '0',
      });
      
      setFranchiseStatusData({
        franchise_statut: assistance.franchise_statut || 'bloquee',
        franchise_notes: assistance.franchise_notes || '',
      });
      
      setPaiementData({
        montant_paye: assistance.montant_paye?.toString() || '0',
        date_paiement_assurance: assistance.date_paiement_assurance || '',
        etat_paiement: assistance.etat_paiement === 'partiellement_paye' ? 'partiellement_paye' : 'paye',
      });

      if (assistance.kilometrage_depart) {
        setDeliveryData({
          kilometrage_depart: assistance.kilometrage_depart?.toString() || '',
          niveau_carburant_depart: assistance.niveau_carburant_depart || '',
          etat_vehicule_depart: assistance.etat_vehicule_depart || '',
        });
      }

      if (assistance.date_retour_effective) {
        setReturnData({
          date_retour_effective: assistance.date_retour_effective || '',
          kilometrage_retour: assistance.kilometrage_retour?.toString() || '',
          niveau_carburant_retour: assistance.niveau_carburant_retour || '',
          etat_vehicule_retour: assistance.etat_vehicule_retour || '',
        });
      }
    }
  }, [assistance]);

  const loadAssistance = async () => {
    try {
      const { data, error } = await supabase
        .from('assistance')
        .select(`
          *,
          clients (id, nom, prenom, telephone, email, cin, permis_conduire),
          vehicles (id, marque, modele, immatriculation, categorie, kilometrage),
          assurances (id, nom, contact_nom, contact_telephone, contact_email)
        `)
        .eq('id', id!)
        .single();

      if (error) throw error;
      setAssistance(data);
    } catch (error: any) {
      console.error("Erreur chargement:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de charger le dossier",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelivery = async () => {
    try {
      const { error } = await supabase
        .from("assistance")
        .update({
          kilometrage_depart: parseInt(deliveryData.kilometrage_depart) || null,
          niveau_carburant_depart: deliveryData.niveau_carburant_depart,
          etat_vehicule_depart: deliveryData.etat_vehicule_depart,
          etat: 'livre',
        })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Véhicule livré, assistance en cours",
      });

      setShowDeliveryDialog(false);
      loadAssistance();
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
        .from("assistance")
        .update({
          date_retour_effective: returnData.date_retour_effective,
          kilometrage_retour: parseInt(returnData.kilometrage_retour) || null,
          niveau_carburant_retour: returnData.niveau_carburant_retour,
          etat_vehicule_retour: returnData.etat_vehicule_retour,
          etat: 'retour_effectue',
        })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Véhicule retourné avec succès",
      });

      setShowReturnDialog(false);
      loadAssistance();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message,
      });
    }
  };

  const handleUpdateAssistance = async () => {
    try {
      const days = editData.date_fin && editData.date_debut
        ? Math.ceil((new Date(editData.date_fin).getTime() - new Date(editData.date_debut).getTime()) / (1000 * 60 * 60 * 24))
        : null;
      
      const tarif = parseFloat(editData.tarif_journalier) || 0;
      const total = days && tarif ? days * tarif : null;

      const { error } = await supabase
        .from("assistance")
        .update({
          date_debut: editData.date_debut,
          date_fin: editData.date_fin || null,
          tarif_journalier: tarif || null,
          montant_total: total,
          montant_facture: total,
          franchise_montant: parseFloat(editData.franchise_montant) || null,
          remarques: editData.remarques,
        })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Dossier mis à jour avec succès",
      });

      setShowEditDialog(false);
      loadAssistance();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message,
      });
    }
  };

  const handleCloseAssistance = async () => {
    try {
      const { error } = await supabase
        .from("assistance")
        .update({ etat: 'cloture' })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Dossier clôturé",
        description: "Le dossier a été clôturé avec succès",
      });

      loadAssistance();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message,
      });
    }
  };

  const handleUpdateFranchise = async () => {
    try {
      const { error } = await supabase
        .from("assistance")
        .update({
          franchise_montant: parseFloat(franchiseData.franchise_montant) || 0,
        })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Franchise mise à jour",
      });

      setShowFranchiseDialog(false);
      loadAssistance();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message,
      });
    }
  };

  const handleUpdateFranchiseStatus = async () => {
    try {
      const { error } = await supabase
        .from("assistance")
        .update({
          franchise_statut: franchiseStatusData.franchise_statut,
          franchise_notes: franchiseStatusData.franchise_notes || null,
        })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Statut de la franchise mis à jour",
      });

      setShowFranchiseStatusDialog(false);
      loadAssistance();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message,
      });
    }
  };

  const handleClotureLocation = async () => {
    try {
      // Clôture de la location (véhicule rendu) mais dossier reste ouvert pour paiement
      const { error } = await supabase
        .from("assistance")
        .update({
          etat: 'retour_effectue', // Location clôturée
          etat_paiement: 'en_attente', // Paiement en attente
        })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Location clôturée",
        description: "La location est clôturée. Le dossier reste ouvert en attente du paiement de l'assurance.",
      });

      setShowClotureLocationDialog(false);
      loadAssistance();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message,
      });
    }
  };

  const handleEnregistrerPaiement = async () => {
    try {
      const montantPaye = parseFloat(paiementData.montant_paye) || 0;
      const montantTotal = assistance.montant_facture || assistance.montant_total || 0;
      
      let nouveauEtatPaiement: 'paye' | 'partiellement_paye' | 'en_attente' = 'en_attente';
      if (montantPaye >= montantTotal) {
        nouveauEtatPaiement = 'paye';
      } else if (montantPaye > 0) {
        nouveauEtatPaiement = 'partiellement_paye';
      }
      
      const updateData: any = {
        montant_paye: montantPaye,
        date_paiement_assurance: paiementData.date_paiement_assurance || null,
        etat_paiement: nouveauEtatPaiement,
      };
      
      // Si paiement complet, clôturer le dossier complètement
      if (nouveauEtatPaiement === 'paye') {
        updateData.etat = 'cloture';
      }

      const { error } = await supabase
        .from("assistance")
        .update(updateData)
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Paiement enregistré",
        description: nouveauEtatPaiement === 'paye' 
          ? "Le paiement est complet. Le dossier est maintenant clôturé."
          : "Le paiement partiel a été enregistré.",
      });

      setShowPaiementDialog(false);
      loadAssistance();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message,
      });
    }
  };

  const handleValiderContrat = async () => {
    try {
      const { error } = await supabase
        .from("assistance")
        .update({ etat: 'contrat_valide' })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Contrat validé",
        description: "Le contrat d'assistance a été validé",
      });

      loadAssistance();
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
      ouvert: "bg-gray-100 text-gray-800",
      contrat_valide: "bg-blue-100 text-blue-800",
      livre: "bg-green-100 text-green-800",
      retour_effectue: "bg-amber-100 text-amber-800",
      cloture: "bg-indigo-100 text-indigo-800",
    };

    const labels: Record<string, string> = {
      ouvert: "Réservation",
      contrat_valide: "Contrat validé",
      livre: "En cours",
      retour_effectue: "Retour effectué",
      cloture: "Clôturé",
    };

    return (
      <Badge variant="outline" className={`${styles[status]} border-0`}>
        {labels[status] || status}
      </Badge>
    );
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      remplacement: 'Véhicule de remplacement',
      panne: 'Panne',
      accident: 'Accident',
    };
    return labels[type] || type;
  };

  const calculateDuration = (start: string, end?: string | null) => {
    const startDate = new Date(start);
    const endDate = end ? new Date(end) : new Date();
    const diff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  if (!assistance) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <div className="text-muted-foreground mb-4">Dossier introuvable</div>
        <Button onClick={() => navigate("/assistance")}>Retour aux dossiers</Button>
      </div>
    );
  }

  const clientName = assistance.clients
    ? `${assistance.clients.nom} ${assistance.clients.prenom || ""}`.trim()
    : "Client inconnu";

  const totalAmount = assistance.montant_facture || assistance.montant_total || 0;
  const duration = calculateDuration(assistance.date_debut, assistance.date_fin);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            Dossier d'assistance N° {assistance.num_dossier}
          </h1>
          <div className="flex items-center text-sm text-muted-foreground space-x-2 mt-2">
            <Link to="/" className="hover:text-foreground">Tableau de bord</Link>
            <span>›</span>
            <Link to="/assistance" className="hover:text-foreground">Assistances</Link>
            <span>›</span>
            <span className="text-foreground">N° {assistance.num_dossier}</span>
          </div>
        </div>
        <div className="flex gap-2">
          {getStatusBadge(assistance.etat)}
          <Button variant="outline" size="sm">
            <FileText className="w-4 h-4 mr-2" />
            Générer facture
          </Button>
        </div>
      </div>

      {/* Action Cards based on status */}
      {assistance.etat === 'ouvert' && (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600" />
              <div>
                <p className="font-medium text-blue-900">Réservation en attente</p>
                <p className="text-sm text-blue-700">
                  Le contrat doit être validé avant la livraison
                </p>
              </div>
            </div>
            <Button onClick={handleValiderContrat}>
              <Check className="w-4 h-4 mr-2" />
              Valider le contrat
            </Button>
          </div>
        </Card>
      )}

      {assistance.etat === 'contrat_valide' && (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600" />
              <div>
                <p className="font-medium text-blue-900">En attente de livraison</p>
                <p className="text-sm text-blue-700">
                  Le véhicule de remplacement doit être livré au client
                </p>
              </div>
            </div>
            <Button onClick={() => setShowDeliveryDialog(true)}>
              <Check className="w-4 h-4 mr-2" />
              Marquer comme livré
            </Button>
          </div>
        </Card>
      )}

      {assistance.etat === 'livre' && (
        <Card className="p-4 bg-green-50 border-green-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="font-medium text-green-900">Assistance en cours</p>
                <p className="text-sm text-green-700">
                  En attente du retour du véhicule
                </p>
              </div>
            </div>
            <Button onClick={() => setShowReturnDialog(true)}>
              <Check className="w-4 h-4 mr-2" />
              Marquer le retour
            </Button>
          </div>
        </Card>
      )}

      {assistance.etat === 'retour_effectue' && (
        <>
          <Card className="p-4 bg-purple-50 border-purple-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Key className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="font-medium text-purple-900">Gérer la franchise</p>
                  <p className="text-sm text-purple-700">
                    La franchise est actuellement: {assistance.franchise_statut === 'bloquee' ? 'Bloquée' : assistance.franchise_statut === 'remboursee' ? 'Remboursée' : 'Utilisée'}
                  </p>
                </div>
              </div>
              <Button 
                variant="outline"
                onClick={() => {
                  setFranchiseStatusData({
                    franchise_statut: assistance.franchise_statut || 'bloquee',
                    franchise_notes: assistance.franchise_notes || '',
                  });
                  setShowFranchiseStatusDialog(true);
                }}
              >
                <Edit className="w-4 h-4 mr-2" />
                Modifier la franchise
              </Button>
            </div>
          </Card>

          {(!assistance.etat_paiement || assistance.etat_paiement === 'en_attente' || assistance.etat_paiement === 'partiellement_paye') && (
            <Card className="p-4 bg-orange-50 border-orange-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <DollarSign className="w-5 h-5 text-orange-600" />
                  <div>
                    <p className="font-medium text-orange-900">En attente du paiement de l'assurance</p>
                    <p className="text-sm text-orange-700">
                      {assistance.etat_paiement === 'partiellement_paye' 
                        ? `Payé: ${(assistance.montant_paye || 0).toFixed(2)} DH / ${totalAmount.toFixed(2)} DH`
                        : `Montant dû: ${totalAmount.toFixed(2)} DH`}
                    </p>
                  </div>
                </div>
                <Button onClick={() => setShowPaiementDialog(true)}>
                  <Check className="w-4 h-4 mr-2" />
                  Enregistrer le paiement
                </Button>
              </div>
            </Card>
          )}
        </>
      )}

      {assistance.etat === 'cloture' && (
        <Card className="p-4 bg-indigo-50 border-indigo-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-indigo-600" />
              <div>
                <p className="font-medium text-indigo-900">Dossier clôturé</p>
                <p className="text-sm text-indigo-700">
                  Le dossier est complètement clôturé. Paiement reçu le {assistance.date_paiement_assurance ? format(new Date(assistance.date_paiement_assurance), 'dd/MM/yyyy', { locale: fr }) : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Top Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Montant */}
        <Card className="border-l-4 border-l-primary shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
              <DollarSign className="w-4 h-4 text-primary" />
              <span>MONTANT FACTURÉ</span>
            </div>
            <div className="text-3xl font-bold text-foreground mb-2">
              {totalAmount.toFixed(2)}
              <span className="text-lg ml-1">DH</span>
            </div>
            <div className="text-sm text-muted-foreground">
              {assistance.tarif_journalier ? `${assistance.tarif_journalier} DH/jour` : ''}
            </div>
          </CardContent>
        </Card>

        {/* Franchise */}
        <Card className="border-l-4 border-l-primary shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Key className="w-4 h-4 text-primary" />
                <span>FRANCHISE</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFranchiseDialog(true)}
                className="h-7 w-7 p-0 hover:bg-primary/10"
                title="Modifier le montant"
              >
                <Edit className="w-4 h-4" />
              </Button>
            </div>
            <div className="text-3xl font-bold text-foreground mb-2">
              {assistance.franchise_montant ? assistance.franchise_montant.toFixed(2) : '0.00'}
              <span className="text-lg ml-1">DH</span>
            </div>
            <Badge variant="outline" className={
              assistance.franchise_statut === 'remboursee' ? 'bg-green-100 text-green-800 border-green-200' :
              assistance.franchise_statut === 'utilisee' ? 'bg-red-100 text-red-800 border-red-200' :
              'bg-orange-100 text-orange-800 border-orange-200'
            }>
              {assistance.franchise_statut === 'bloquee' && 'Bloquée'}
              {assistance.franchise_statut === 'remboursee' && 'Remboursée'}
              {assistance.franchise_statut === 'utilisee' && 'Utilisée'}
              {!assistance.franchise_statut && 'Bloquée'}
            </Badge>
          </CardContent>
        </Card>

        {/* Client */}
        <Card 
          className="border-l-4 border-l-primary shadow-sm hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => navigate(`/clients/${assistance.client_id}`)}
        >
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
              <User className="w-4 h-4 text-primary" />
              <span>CLIENT</span>
            </div>
            <div className="text-xl font-bold text-foreground mb-2">{clientName}</div>
            <div className="text-sm text-muted-foreground space-y-1">
              <div>{assistance.clients?.telephone}</div>
              <div className="truncate">{assistance.clients?.email}</div>
            </div>
          </CardContent>
        </Card>

        {/* Véhicule */}
        <Card 
          className="border-l-4 border-l-primary shadow-sm hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => navigate(`/vehicules/${assistance.vehicle_id}`)}
        >
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
              <Car className="w-4 h-4 text-primary" />
              <span>VÉHICULE</span>
            </div>
            <div className="text-xl font-bold text-foreground mb-2">
              {assistance.vehicles?.marque} {assistance.vehicles?.modele}
            </div>
            <div className="text-sm text-muted-foreground space-y-1">
              <div>{assistance.vehicles?.immatriculation}</div>
              {assistance.vehicles?.categorie && <div>Cat. {assistance.vehicles.categorie.toUpperCase()}</div>}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Informations du dossier */}
        <Card>
          <Collapsible open={openSections.dossier} onOpenChange={() => toggleSection("dossier")}>
            <CollapsibleTrigger className="w-full">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center space-x-2 text-sm font-medium">
                  <FileText className="w-4 h-4 text-primary" />
                  <span>Informations du dossier</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowEditDialog(true);
                    }}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  {openSections.dossier ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </CardContent>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="px-4 pb-4 space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">N° Dossier</span>
                  <Button
                    variant="link"
                    className="h-auto p-0 font-medium"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigator.clipboard.writeText(assistance.num_dossier);
                      toast({ title: "Copié", description: "N° Dossier copié dans le presse-papier" });
                    }}
                  >
                    {assistance.num_dossier}
                  </Button>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type</span>
                  <span className="font-medium">{getTypeLabel(assistance.type)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Assurance</span>
                  <span className="font-medium">{assistance.assureur_nom}</span>
                </div>
                {assistance.vehicles?.categorie && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Catégorie</span>
                    <span className="font-medium">Catégorie {assistance.vehicles.categorie.toUpperCase()}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Durée</span>
                  <span className="font-medium">{duration} {duration > 1 ? 'jours' : 'jour'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Départ</span>
                  <span className="font-medium">
                    {format(new Date(assistance.date_debut), "dd/MM/yyyy", { locale: fr })}
                  </span>
                </div>
                {assistance.date_fin && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Retour prévu</span>
                    <span className="font-medium">
                      {format(new Date(assistance.date_fin), "dd/MM/yyyy", { locale: fr })}
                    </span>
                  </div>
                )}
                {assistance.tarif_journalier && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Prix/Jr</span>
                    <span className="font-medium">{Number(assistance.tarif_journalier).toFixed(2)} DH</span>
                  </div>
                )}
                {assistance.franchise_montant && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Franchise</span>
                    <span className="font-medium">{Number(assistance.franchise_montant).toFixed(2)} DH</span>
                  </div>
                )}
                {assistance.date_retour_effective && (
                  <div className="flex justify-between border-t pt-3 mt-3">
                    <span className="text-muted-foreground">Retour effectif</span>
                    <span className="font-medium">
                      {format(new Date(assistance.date_retour_effective), "dd/MM/yyyy", { locale: fr })}
                    </span>
                  </div>
                )}
                {assistance.remarques && (
                  <div className="pt-3 border-t">
                    <span className="text-muted-foreground block mb-1">Remarques</span>
                    <p className="text-sm text-foreground">{assistance.remarques}</p>
                  </div>
                )}
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>

        {/* Info client */}
        <Card>
          <Collapsible open={openSections.client} onOpenChange={() => toggleSection("client")}>
            <CollapsibleTrigger className="w-full">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center space-x-2 text-sm font-medium">
                  <User className="w-4 h-4 text-primary" />
                  <span>Info client</span>
                </div>
                {openSections.client ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </CardContent>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="px-4 pb-4 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Nom</span>
                  <span className="font-medium">{clientName}</span>
                </div>
                {assistance.clients?.telephone && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Téléphone</span>
                    <span className="font-medium">{assistance.clients.telephone}</span>
                  </div>
                )}
                {assistance.clients?.email && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Email</span>
                    <span className="font-medium truncate ml-2">{assistance.clients.email}</span>
                  </div>
                )}
                {assistance.clients?.cin && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">CIN</span>
                    <span className="font-medium">{assistance.clients.cin}</span>
                  </div>
                )}
                {assistance.clients?.permis_conduire && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Permis</span>
                    <span className="font-medium">{assistance.clients.permis_conduire}</span>
                  </div>
                )}
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>

        {/* Info véhicule */}
        <Card>
          <Collapsible open={openSections.vehicule} onOpenChange={() => toggleSection("vehicule")}>
            <CollapsibleTrigger className="w-full">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center space-x-2 text-sm font-medium">
                  <Car className="w-4 h-4 text-primary" />
                  <span>Véhicule de remplacement</span>
                </div>
                {openSections.vehicule ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </CardContent>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="px-4 pb-4 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Véhicule</span>
                  <span className="font-medium">
                    {assistance.vehicles?.marque} {assistance.vehicles?.modele}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Immatriculation</span>
                  <span className="font-medium">{assistance.vehicles?.immatriculation}</span>
                </div>
                {assistance.vehicles?.categorie && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Catégorie</span>
                    <span className="font-medium">Catégorie {assistance.vehicles.categorie.toUpperCase()}</span>
                  </div>
                )}
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>

        {/* Livraison */}
        <Card>
          <Collapsible open={openSections.livraison} onOpenChange={() => toggleSection("livraison")}>
            <CollapsibleTrigger className="w-full">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center space-x-2 text-sm font-medium">
                  <MapPin className="w-4 h-4 text-primary" />
                  <span>Livraison</span>
                </div>
                {openSections.livraison ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </CardContent>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="px-4 pb-4 space-y-3 text-sm">
                {assistance.etat === 'ouvert' ? (
                  <div className="text-center py-4 text-muted-foreground">
                    <p>En attente de livraison</p>
                    <Button
                      size="sm"
                      className="mt-2"
                      onClick={() => setShowDeliveryDialog(true)}
                    >
                      Marquer comme livré
                    </Button>
                  </div>
                ) : (
                  <>
                    {assistance.kilometrage_depart && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Kilométrage départ</span>
                        <span className="font-medium">{assistance.kilometrage_depart.toLocaleString()} km</span>
                      </div>
                    )}
                    {assistance.niveau_carburant_depart && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Carburant départ</span>
                        <span className="font-medium">{assistance.niveau_carburant_depart}</span>
                      </div>
                    )}
                    {assistance.etat_vehicule_depart && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">État véhicule</span>
                        <span className="font-medium">{assistance.etat_vehicule_depart}</span>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>

        {/* Retour */}
        <Card>
          <Collapsible open={openSections.retour} onOpenChange={() => toggleSection("retour")}>
            <CollapsibleTrigger className="w-full">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center space-x-2 text-sm font-medium">
                  <MapPin className="w-4 h-4 text-primary" />
                  <span>Retour</span>
                </div>
                {openSections.retour ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </CardContent>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="px-4 pb-4 space-y-3 text-sm">
                {!assistance.date_retour_effective ? (
                  <div className="text-center py-4 text-muted-foreground">
                    <p>En attente de retour</p>
                    {assistance.etat === 'livre' && (
                      <Button
                        size="sm"
                        className="mt-2"
                        onClick={() => setShowReturnDialog(true)}
                      >
                        Marquer le retour
                      </Button>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Date retour</span>
                      <span className="font-medium">
                        {format(new Date(assistance.date_retour_effective), "dd MMM yyyy", { locale: fr })}
                      </span>
                    </div>
                    {assistance.kilometrage_retour && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Kilométrage retour</span>
                        <span className="font-medium">{assistance.kilometrage_retour.toLocaleString()} km</span>
                      </div>
                    )}
                    {assistance.kilometrage_depart && assistance.kilometrage_retour && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Distance parcourue</span>
                        <span className="font-medium">
                          {(assistance.kilometrage_retour - assistance.kilometrage_depart).toLocaleString()} km
                        </span>
                      </div>
                    )}
                    {assistance.niveau_carburant_retour && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Carburant retour</span>
                        <span className="font-medium">{assistance.niveau_carburant_retour}</span>
                      </div>
                    )}
                    {assistance.etat_vehicule_retour && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">État véhicule</span>
                        <span className="font-medium">{assistance.etat_vehicule_retour}</span>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      </div>

      {/* Delivery Dialog */}
      <Dialog open={showDeliveryDialog} onOpenChange={setShowDeliveryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Marquer comme livré</DialogTitle>
            <DialogDescription>
              Indiquez les détails de la livraison du véhicule
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Kilométrage départ</Label>
              <Input
                type="number"
                value={deliveryData.kilometrage_depart}
                onChange={(e) => setDeliveryData({ ...deliveryData, kilometrage_depart: e.target.value })}
                placeholder="Ex: 25000"
              />
            </div>
            <div>
              <Label>Niveau carburant</Label>
              <Select
                value={deliveryData.niveau_carburant_depart}
                onValueChange={(value) => setDeliveryData({ ...deliveryData, niveau_carburant_depart: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vide">Vide</SelectItem>
                  <SelectItem value="1/4">1/4</SelectItem>
                  <SelectItem value="1/2">1/2</SelectItem>
                  <SelectItem value="3/4">3/4</SelectItem>
                  <SelectItem value="plein">Plein</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>État du véhicule</Label>
              <Textarea
                value={deliveryData.etat_vehicule_depart}
                onChange={(e) => setDeliveryData({ ...deliveryData, etat_vehicule_depart: e.target.value })}
                placeholder="Décrire l'état du véhicule..."
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowDeliveryDialog(false)}>
                Annuler
              </Button>
              <Button onClick={handleDelivery}>
                Confirmer la livraison
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Return Dialog */}
      <Dialog open={showReturnDialog} onOpenChange={setShowReturnDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Marquer le retour</DialogTitle>
            <DialogDescription>
              Indiquez les détails du retour du véhicule
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Date de retour</Label>
              <Input
                type="date"
                value={returnData.date_retour_effective}
                onChange={(e) => setReturnData({ ...returnData, date_retour_effective: e.target.value })}
              />
            </div>
            <div>
              <Label>Kilométrage retour</Label>
              <Input
                type="number"
                value={returnData.kilometrage_retour}
                onChange={(e) => setReturnData({ ...returnData, kilometrage_retour: e.target.value })}
                placeholder="Ex: 25500"
              />
            </div>
            <div>
              <Label>Niveau carburant</Label>
              <Select
                value={returnData.niveau_carburant_retour}
                onValueChange={(value) => setReturnData({ ...returnData, niveau_carburant_retour: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vide">Vide</SelectItem>
                  <SelectItem value="1/4">1/4</SelectItem>
                  <SelectItem value="1/2">1/2</SelectItem>
                  <SelectItem value="3/4">3/4</SelectItem>
                  <SelectItem value="plein">Plein</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>État du véhicule</Label>
              <Textarea
                value={returnData.etat_vehicule_retour}
                onChange={(e) => setReturnData({ ...returnData, etat_vehicule_retour: e.target.value })}
                placeholder="Décrire l'état du véhicule au retour..."
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowReturnDialog(false)}>
                Annuler
              </Button>
              <Button onClick={handleReturn}>
                Confirmer le retour
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le dossier</DialogTitle>
            <DialogDescription>
              Modifiez les informations du dossier d'assistance
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Date début</Label>
              <Input
                type="date"
                value={editData.date_debut}
                onChange={(e) => setEditData({ ...editData, date_debut: e.target.value })}
              />
            </div>
            <div>
              <Label>Date fin prévue</Label>
              <Input
                type="date"
                value={editData.date_fin}
                onChange={(e) => setEditData({ ...editData, date_fin: e.target.value })}
              />
            </div>
            <div>
              <Label>Tarif journalier (DH)</Label>
              <Input
                type="number"
                step="0.01"
                value={editData.tarif_journalier}
                onChange={(e) => setEditData({ ...editData, tarif_journalier: e.target.value })}
              />
            </div>
            <div>
              <Label>Franchise (DH)</Label>
              <Input
                type="number"
                step="0.01"
                value={editData.franchise_montant}
                onChange={(e) => setEditData({ ...editData, franchise_montant: e.target.value })}
              />
            </div>
            <div>
              <Label>Remarques</Label>
              <Textarea
                value={editData.remarques}
                onChange={(e) => setEditData({ ...editData, remarques: e.target.value })}
                placeholder="Remarques diverses..."
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                Annuler
              </Button>
              <Button onClick={handleUpdateAssistance}>
                Enregistrer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog - Modifier la franchise */}
      <Dialog open={showFranchiseDialog} onOpenChange={setShowFranchiseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier la franchise</DialogTitle>
            <DialogDescription>
              Mettez à jour le montant de la franchise
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Montant de la franchise (DH)</Label>
              <Input
                type="number"
                step="0.01"
                value={franchiseData.franchise_montant}
                onChange={(e) => setFranchiseData({ ...franchiseData, franchise_montant: e.target.value })}
                placeholder="0.00"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowFranchiseDialog(false)}>
                Annuler
              </Button>
              <Button onClick={handleUpdateFranchise}>
                Enregistrer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog - Modifier le statut de la franchise */}
      <Dialog open={showFranchiseStatusDialog} onOpenChange={setShowFranchiseStatusDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Statut de la franchise</DialogTitle>
            <DialogDescription>
              Gérer le statut de la franchise
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Statut de la franchise *</Label>
              <Select 
                value={franchiseStatusData.franchise_statut} 
                onValueChange={(v) => setFranchiseStatusData({...franchiseStatusData, franchise_statut: v})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choisir..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bloquee">Bloquée</SelectItem>
                  <SelectItem value="remboursee">Remboursée</SelectItem>
                  <SelectItem value="utilisee">Utilisée</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea
                value={franchiseStatusData.franchise_notes}
                onChange={(e) => setFranchiseStatusData({...franchiseStatusData, franchise_notes: e.target.value})}
                placeholder="Notes sur la franchise..."
                rows={3}
              />
            </div>
            {franchiseStatusData.franchise_statut === 'utilisee' && (
              <div className="bg-destructive/10 border border-destructive/20 p-3 rounded-md flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
                <p className="text-sm text-destructive">
                  La franchise sera déduite du montant à payer par l'assurance.
                </p>
              </div>
            )}
            {franchiseStatusData.franchise_statut === 'remboursee' && (
              <div className="bg-green-500/10 border border-green-500/20 p-3 rounded-md flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-green-700">
                  La franchise sera remboursée au client.
                </p>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowFranchiseStatusDialog(false)}>
                Annuler
              </Button>
              <Button onClick={handleUpdateFranchiseStatus}>
                Enregistrer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog - Enregistrer paiement assurance */}
      <Dialog open={showPaiementDialog} onOpenChange={setShowPaiementDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enregistrer le paiement de l'assurance</DialogTitle>
            <DialogDescription>
              Montant total: {totalAmount.toFixed(2)} DH
              {assistance.montant_paye > 0 && ` | Déjà payé: ${assistance.montant_paye.toFixed(2)} DH`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Montant payé par l'assurance (DH) *</Label>
              <Input
                type="number"
                step="0.01"
                value={paiementData.montant_paye}
                onChange={(e) => setPaiementData({...paiementData, montant_paye: e.target.value})}
                placeholder="0.00"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Entrez le montant total payé (cumul si paiements multiples)
              </p>
            </div>
            <div>
              <Label>Date du paiement *</Label>
              <Input
                type="date"
                value={paiementData.date_paiement_assurance}
                onChange={(e) => setPaiementData({...paiementData, date_paiement_assurance: e.target.value})}
              />
            </div>
            {parseFloat(paiementData.montant_paye || '0') >= totalAmount && (
              <div className="bg-green-500/10 border border-green-500/20 p-3 rounded-md flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-green-700">
                  Le paiement est complet. Le dossier sera automatiquement clôturé.
                </p>
              </div>
            )}
            {parseFloat(paiementData.montant_paye || '0') > 0 && parseFloat(paiementData.montant_paye || '0') < totalAmount && (
              <div className="bg-orange-500/10 border border-orange-500/20 p-3 rounded-md flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-orange-700">
                  Paiement partiel. Reste à payer: {(totalAmount - parseFloat(paiementData.montant_paye || '0')).toFixed(2)} DH
                </p>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowPaiementDialog(false)}>
                Annuler
              </Button>
              <Button onClick={handleEnregistrerPaiement}>
                Enregistrer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
