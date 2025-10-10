import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Edit, Trash2, Eye, Send, CheckCircle2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function InfractionDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [infraction, setInfraction] = useState<any>(null);
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTransmitDialog, setShowTransmitDialog] = useState(false);
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [commentaire, setCommentaire] = useState("");

  useEffect(() => {
    loadInfraction();
  }, [id]);

  const loadInfraction = async () => {
    try {
      const { data: infractionData, error: infractionError } = await supabase
        .from("infractions")
        .select(`
          *,
          vehicles (immatriculation, marque, modele),
          clients (nom, prenom, telephone, email),
          contracts (numero_contrat)
        `)
        .eq("id", id!)
        .single();

      if (infractionError) throw infractionError;
      setInfraction(infractionData);

      const { data: filesData, error: filesError } = await supabase
        .from("infraction_files")
        .select("*")
        .eq("infraction_id", id!);

      if (filesError) throw filesError;
      setFiles(filesData || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message,
      });
      navigate("/infractions");
    } finally {
      setLoading(false);
    }
  };

  const handleTransmit = async () => {
    try {
      const { error } = await supabase
        .from("infractions")
        .update({
          statut_traitement: "transmis",
          date_transmission: format(new Date(), "yyyy-MM-dd"),
          commentaire: commentaire || null,
        })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Infraction transmise au client",
      });

      setShowTransmitDialog(false);
      loadInfraction();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message,
      });
    }
  };

  const handleClose = async () => {
    try {
      const { error } = await supabase
        .from("infractions")
        .update({
          statut_traitement: "clos",
          commentaire: commentaire || null,
        })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Dossier clôturé",
      });

      setShowCloseDialog(false);
      loadInfraction();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message,
      });
    }
  };

  const handleDelete = async () => {
    if (!confirm("Voulez-vous vraiment supprimer cette infraction ?")) return;

    try {
      const { error } = await supabase.from("infractions").delete().eq("id", id);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Infraction supprimée",
      });

      navigate("/infractions");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message,
      });
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      exces_vitesse: "Excès de vitesse",
      stationnement: "Stationnement",
      feu_rouge: "Feu rouge",
      telephone: "Téléphone",
      autre: "Autre",
    };
    return labels[type] || type;
  };

  const getStatutBadge = (statut: string) => {
    const badges: Record<string, { label: string; className: string }> = {
      nouveau: { label: "Nouveau", className: "bg-red-500 text-white" },
      transmis: { label: "Transmis au client", className: "bg-orange-500 text-white" },
      clos: { label: "Clos", className: "bg-green-500 text-white" },
    };
    const badge = badges[statut] || badges.nouveau;
    return <Badge className={badge.className}>{badge.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  if (!infraction) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <div className="text-muted-foreground mb-4">Infraction introuvable</div>
        <Button onClick={() => navigate("/infractions")}>Retour</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/infractions")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Infraction {infraction.reference}</h1>
            <div className="flex items-center text-sm text-muted-foreground space-x-2 mt-1">
              <Link to="/" className="hover:text-foreground">Tableau de bord</Link>
              <span>›</span>
              <Link to="/infractions" className="hover:text-foreground">Infractions</Link>
              <span>›</span>
              <span className="text-foreground">{infraction.reference}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {getStatutBadge(infraction.statut_traitement)}
          {infraction.statut_traitement === "nouveau" && (
            <Button onClick={() => setShowTransmitDialog(true)} className="gap-2">
              <Send className="w-4 h-4" />
              Transmettre au client
            </Button>
          )}
          {infraction.statut_traitement === "transmis" && (
            <Button onClick={() => setShowCloseDialog(true)} variant="outline" className="gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Clôturer le dossier
            </Button>
          )}
          <Button variant="outline" onClick={() => navigate(`/infractions/${id}/modifier`)}>
            <Edit className="w-4 h-4 mr-2" />
            Modifier
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="w-4 h-4 mr-2" />
            Supprimer
          </Button>
        </div>
      </div>

      {/* Main Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Détails de l'infraction</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-muted-foreground">Référence</Label>
              <p className="font-medium">{infraction.reference}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Date</Label>
              <p className="font-medium">
                {format(new Date(infraction.date_infraction), "dd/MM/yyyy", { locale: fr })}
              </p>
            </div>
            <div>
              <Label className="text-muted-foreground">Lieu</Label>
              <p className="font-medium">{infraction.lieu}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Type</Label>
              <p className="font-medium">{getTypeLabel(infraction.type_infraction)}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Montant</Label>
              <p className="text-2xl font-bold text-primary">{infraction.montant.toFixed(2)} DH</p>
            </div>
            {infraction.description && (
              <div>
                <Label className="text-muted-foreground">Description</Label>
                <p className="text-sm">{infraction.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Véhicule et Client</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-muted-foreground">Véhicule</Label>
              <p className="font-medium">
                <Link to={`/vehicules/${infraction.vehicle_id}`} className="text-primary hover:underline">
                  {infraction.vehicles?.marque} {infraction.vehicles?.modele}
                </Link>
              </p>
              <p className="text-sm text-muted-foreground">{infraction.vehicles?.immatriculation}</p>
            </div>
            {infraction.contracts && (
              <div>
                <Label className="text-muted-foreground">Contrat</Label>
                <p className="font-medium">
                  <Link to={`/locations/${infraction.contract_id}`} className="text-primary hover:underline">
                    {infraction.contracts.numero_contrat}
                  </Link>
                </p>
              </div>
            )}
            {infraction.clients && (
              <div>
                <Label className="text-muted-foreground">Client responsable</Label>
                <p className="font-medium">
                  <Link to={`/clients/${infraction.client_id}`} className="text-primary hover:underline">
                    {infraction.clients.nom} {infraction.clients.prenom}
                  </Link>
                </p>
                <p className="text-sm text-muted-foreground">{infraction.clients.telephone}</p>
                {infraction.clients.email && (
                  <p className="text-sm text-muted-foreground">{infraction.clients.email}</p>
                )}
              </div>
            )}
            {!infraction.clients && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-700">
                  Aucun client identifié. Le véhicule n'était pas en location à cette date.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Status Info */}
      {infraction.date_transmission && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-muted-foreground">Date de transmission</Label>
                <p className="font-medium">
                  {format(new Date(infraction.date_transmission), "dd/MM/yyyy", { locale: fr })}
                </p>
              </div>
              {infraction.commentaire && (
                <div className="flex-1 ml-6">
                  <Label className="text-muted-foreground">Commentaire</Label>
                  <p className="text-sm">{infraction.commentaire}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Files */}
      <Card>
        <CardHeader>
          <CardTitle>Documents</CardTitle>
        </CardHeader>
        <CardContent>
          {files.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Aucun document</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {files.map((file) => (
                <div key={file.id} className="border rounded-lg p-4 space-y-2">
                  <p className="text-sm font-medium truncate">{file.file_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(file.uploaded_at), "dd/MM/yyyy HH:mm", { locale: fr })}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => window.open(file.file_url, "_blank")}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Voir
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog Transmettre */}
      <Dialog open={showTransmitDialog} onOpenChange={setShowTransmitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transmettre au client</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Confirmez la transmission de cette infraction au client{" "}
              <span className="font-medium text-foreground">
                {infraction.clients?.nom} {infraction.clients?.prenom}
              </span>
            </p>
            <div>
              <Label>Commentaire (optionnel)</Label>
              <Textarea
                value={commentaire}
                onChange={(e) => setCommentaire(e.target.value)}
                placeholder="Notes sur la transmission..."
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowTransmitDialog(false)}>
                Annuler
              </Button>
              <Button onClick={handleTransmit}>
                <Send className="w-4 h-4 mr-2" />
                Transmettre
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Clôturer */}
      <Dialog open={showCloseDialog} onOpenChange={setShowCloseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clôturer le dossier</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Confirmez la clôture de ce dossier d'infraction.
            </p>
            <div>
              <Label>Commentaire (optionnel)</Label>
              <Textarea
                value={commentaire}
                onChange={(e) => setCommentaire(e.target.value)}
                placeholder="Notes sur la clôture..."
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCloseDialog(false)}>
                Annuler
              </Button>
              <Button onClick={handleClose}>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Clôturer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
