import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ChevronDown, ChevronUp, FileText, Download, Edit, DollarSign, Car, User, Calendar, MapPin, Key, AlertCircle, Check } from "lucide-react";
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
                <p className="font-medium text-blue-900">Dossier en attente de livraison</p>
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
        <Card className="p-4 bg-amber-50 border-amber-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              <div>
                <p className="font-medium text-amber-900">Retour effectué</p>
                <p className="text-sm text-amber-700">
                  Le dossier peut être clôturé
                </p>
              </div>
            </div>
            <Button onClick={handleCloseAssistance}>
              <Check className="w-4 h-4 mr-2" />
              Clôturer le dossier
            </Button>
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
        {assistance.franchise_montant && (
          <Card className="border-l-4 border-l-primary shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                <Key className="w-4 h-4 text-primary" />
                <span>FRANCHISE</span>
              </div>
              <div className="text-3xl font-bold text-foreground mb-2">
                {assistance.franchise_montant.toFixed(2)}
                <span className="text-lg ml-1">DH</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Client */}
        <Card className="border-l-4 border-l-primary shadow-sm hover:shadow-md transition-shadow">
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
        <Card className="border-l-4 border-l-primary shadow-sm hover:shadow-md transition-shadow">
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
        {/* Info du dossier */}
        <Card>
          <Collapsible open={openSections.dossier} onOpenChange={() => toggleSection("dossier")}>
            <CollapsibleTrigger className="w-full">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center space-x-2 text-sm font-medium">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span>Info du dossier</span>
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
                <div className="flex justify-between">
                  <span className="text-muted-foreground">N° Dossier</span>
                  <span className="font-medium">{assistance.num_dossier}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type</span>
                  <span className="font-medium">{getTypeLabel(assistance.type)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Assurance</span>
                  <span className="font-medium">{assistance.assureur_nom}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Durée</span>
                  <span className="font-medium">{duration} {duration > 1 ? 'jours' : 'jour'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date début</span>
                  <span className="font-medium">
                    {format(new Date(assistance.date_debut), "dd MMM yyyy", { locale: fr })}
                  </span>
                </div>
                {assistance.date_fin && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date fin prévue</span>
                    <span className="font-medium">
                      {format(new Date(assistance.date_fin), "dd MMM yyyy", { locale: fr })}
                    </span>
                  </div>
                )}
                {assistance.date_retour_effective && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date retour</span>
                    <span className="font-medium">
                      {format(new Date(assistance.date_retour_effective), "dd MMM yyyy", { locale: fr })}
                    </span>
                  </div>
                )}
                {assistance.remarques && (
                  <div className="pt-2 border-t">
                    <span className="text-muted-foreground block mb-1">Remarques</span>
                    <span className="text-foreground">{assistance.remarques}</span>
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
    </div>
  );
}
