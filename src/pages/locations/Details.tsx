import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ChevronDown, ChevronUp, Edit, FileText, Receipt, Trash2, X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function LocationDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [contract, setContract] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [openSections, setOpenSections] = useState({
    reservation: true,
    livraison: false,
    recuperation: false,
    conducteurs: false,
    paiements: false,
  });

  useEffect(() => {
    loadContract();
  }, [id]);

  const loadContract = async () => {
    try {
      const { data, error } = await supabase
        .from("contracts")
        .select(`
          *,
          clients (nom, prenom, telephone, email, cin, permis_conduire),
          vehicles (immatriculation, marque, modele, kilometrage)
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      setContract(data);
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

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      brouillon: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100",
      actif: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
      termine: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
      annule: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
    };

    const labels: Record<string, string> = {
      brouillon: "Brouillon",
      actif: "Livré",
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
  const paidAmount = contract.advance_payment || 0;
  const remainingAmount = totalAmount - paidAmount;
  const duration = calculateDuration(contract.date_debut, contract.date_fin);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            Location courte durée N° {contract.numero_contrat}, par {clientName}
          </h1>
          <div className="flex items-center text-sm text-muted-foreground space-x-2 mt-2">
            <Link to="/" className="hover:text-foreground">Tableau de bord</Link>
            <span>›</span>
            <Link to="/locations" className="hover:text-foreground">Locations</Link>
            <span>›</span>
            <span className="text-foreground">Location N° {contract.numero_contrat}</span>
          </div>
        </div>
        <Button>
          <Edit className="w-4 h-4 mr-2" />
          MODIFIER LA RÉSERVATION
        </Button>
      </div>

      {/* Top Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total à payer */}
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-0">
          <CardContent className="p-6">
            <div className="text-sm text-muted-foreground mb-2">TOTAL À PAYER</div>
            <div className="text-4xl font-bold mb-1">
              {totalAmount.toFixed(2)}
              <span className="text-lg ml-1">DH</span>
            </div>
            <div className="text-sm text-muted-foreground mb-4">
              Payé: {paidAmount.toFixed(2)} Dh
            </div>
            <Button variant="link" className="p-0 h-auto text-primary">
              ↓ VOIR LES PAIEMENTS
            </Button>
          </CardContent>
        </Card>

        {/* Contrat */}
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-0">
          <CardContent className="p-6">
            <div className="text-sm text-muted-foreground mb-2">CONTRAT N°</div>
            <div className="text-4xl font-bold mb-8">{contract.numero_contrat}</div>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm">
                <FileText className="w-4 h-4 mr-2" />
                AFFICHER
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Edit className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Facture */}
        <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-950 dark:to-indigo-900 border-0">
          <CardContent className="p-6">
            <div className="text-sm text-muted-foreground mb-2">FACTURE N°</div>
            <div className="text-4xl font-bold mb-8">003</div>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm">
                <Receipt className="w-4 h-4 mr-2" />
                AFFICHER
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Edit className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content - 3 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Info de réservation */}
        <Card>
          <Collapsible open={openSections.reservation} onOpenChange={() => toggleSection("reservation")}>
            <CollapsibleTrigger className="w-full">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center space-x-2 text-sm font-medium">
                  <span className="text-blue-600">ℹ️</span>
                  <span>Info de réservation N° {contract.numero_contrat}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <button className="text-muted-foreground hover:text-foreground">⋮</button>
                  {openSections.reservation ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </CardContent>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="px-4 pb-4 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Rés. N°</span>
                  <span className="font-medium">{contract.numero_contrat}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">État</span>
                  <span>{getStatusBadge(contract.statut)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Client</span>
                  <span className="font-medium">{clientName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Véhicule</span>
                  <span className="font-medium">
                    {contract.vehicles?.marque} {contract.vehicles?.modele} - {contract.vehicles?.immatriculation}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Kilométrage</span>
                  <span className="font-medium">{contract.vehicles?.kilometrage || 0} Kms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Durée (Jrs)</span>
                  <span className="font-medium">{duration.toString().padStart(2, "0")} Jours</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date de départ</span>
                  <span className="font-medium">
                    {format(new Date(contract.date_debut), "dd/MM/yyyy", { locale: fr })}
                    {contract.start_time && ` ${contract.start_time}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date de retour</span>
                  <span className="font-medium">
                    {format(new Date(contract.date_fin), "dd/MM/yyyy", { locale: fr })}
                    {contract.end_time && ` ${contract.end_time}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Prix/Jr</span>
                  <span className="font-medium">{contract.daily_rate?.toFixed(2) || "0.00"} Dh</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Surcharge</span>
                  <span className="font-medium">—</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Remise</span>
                  <span className="font-medium">—</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Options</span>
                  <span className="font-medium">—</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ajouté par</span>
                  <span className="font-medium">Hammadi Anouar</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ajouté le</span>
                  <span className="font-medium">
                    {format(new Date(contract.created_at), "dd/MM/yyyy HH:mm", { locale: fr })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Dernière MÀJ</span>
                  <span className="font-medium">
                    {format(new Date(contract.updated_at), "dd/MM/yyyy HH:mm", { locale: fr })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Plus d'infos</span>
                  <span className="font-medium">—</span>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>

        {/* Info de livraison */}
        <Card>
          <Collapsible open={openSections.livraison} onOpenChange={() => toggleSection("livraison")}>
            <CollapsibleTrigger className="w-full">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center space-x-2 text-sm font-medium">
                  <span className="text-blue-600">🔑</span>
                  <span>Info de livraison</span>
                </div>
                <div className="flex items-center space-x-2">
                  <button className="text-muted-foreground hover:text-foreground">✏️</button>
                  <button className="text-muted-foreground hover:text-foreground">✕</button>
                  {openSections.livraison ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </CardContent>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="px-4 pb-4 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date de départ</span>
                  <span className="font-medium">
                    {format(new Date(contract.date_debut), "dd/MM/yyyy HH:mm", { locale: fr })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Kilométrage de départ</span>
                  <span className="font-medium">{contract.vehicles?.kilometrage || 0} Kms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Place de départ</span>
                  <span className="font-medium">{contract.start_location || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Carburant de départ</span>
                  <span className="font-medium">—</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Plus d'info de départ</span>
                  <span className="font-medium">—</span>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>

          {/* Les conducteurs */}
          <Collapsible open={openSections.conducteurs} onOpenChange={() => toggleSection("conducteurs")}>
            <CollapsibleTrigger className="w-full border-t">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center space-x-2 text-sm font-medium">
                  <span className="text-blue-600">👥</span>
                  <span>Les conducteurs</span>
                </div>
                <div className="flex items-center space-x-2">
                  <button className="text-blue-600 hover:text-blue-700">
                    <Plus className="w-4 h-4" />
                  </button>
                  {openSections.conducteurs ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </CardContent>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="px-4 pb-4">
                <div className="bg-muted/50 p-4 rounded-md">
                  <div className="flex items-start space-x-3">
                    <div className="text-sm">
                      <div className="font-medium">01 ère conducteur</div>
                      <div className="text-muted-foreground">{clientName}</div>
                      <div className="text-muted-foreground text-xs">N° Permis: {contract.clients?.permis_conduire || "---"}</div>
                    </div>
                  </div>
                </div>
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
                  <span className="text-blue-600">🔙</span>
                  <span>Info de récupération</span>
                </div>
                <div className="flex items-center space-x-2">
                  {openSections.recuperation ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </CardContent>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="px-4 pb-4 text-center py-8">
                <div className="text-muted-foreground mb-4">Véhicule en attente de récupération.</div>
                <Button className="w-full">
                  RÉCUPÉRER LE VÉHICULE →
                </Button>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>

          {/* Situation des paiements */}
          <Collapsible open={openSections.paiements} onOpenChange={() => toggleSection("paiements")}>
            <CollapsibleTrigger className="w-full border-t">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center space-x-2 text-sm font-medium">
                  <span className="text-blue-600">💰</span>
                  <span>Situation des paiements</span>
                </div>
                <div className="flex items-center space-x-2">
                  <button className="text-blue-600 hover:text-blue-700">
                    <Plus className="w-4 h-4" />
                  </button>
                  {openSections.paiements ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </CardContent>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="px-4 pb-4 space-y-4">
                {/* Summary */}
                <div className="flex justify-between text-sm">
                  <div className="text-center">
                    <div className="text-muted-foreground text-xs">Total à payer</div>
                    <div className="font-bold">{totalAmount.toFixed(2)}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-muted-foreground text-xs">Total payé</div>
                    <div className="font-bold text-green-600">{paidAmount.toFixed(2)}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-muted-foreground text-xs">Solde</div>
                    <div className="font-bold text-red-600">{remainingAmount.toFixed(2)}</div>
                  </div>
                </div>

                {/* Payment list */}
                {paidAmount > 0 && (
                  <div className="space-y-2">
                    <div className="bg-muted/50 p-3 rounded-md text-sm">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-medium">Paiment de {paidAmount.toFixed(2)} Dh en Espèce</span>
                        <button className="text-muted-foreground hover:text-foreground">⋮</button>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        ajouté le {format(new Date(contract.created_at), "dd/MM/yyyy", { locale: fr })} par hammadi anouar
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      </div>

      {/* Delete button */}
      <Card className="bg-muted/30 border-dashed">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Vous ne pouvez pas supprimer une réservation si elle contient des paiements.
          </div>
          <Button variant="outline" disabled>
            <Trash2 className="w-4 h-4 mr-2" />
            SUPPRIMER CETTE RÉSERVATION
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
