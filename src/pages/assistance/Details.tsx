import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Edit, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

type Assistance = Database['public']['Tables']['assistance']['Row'];

export default function AssistanceDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [assistance, setAssistance] = useState<Assistance | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadAssistance();
    }
  }, [id]);

  const loadAssistance = async () => {
    try {
      const { data, error } = await supabase
        .from('assistance')
        .select('*')
        .eq('id', id!)
        .single();

      if (error) throw error;
      setAssistance(data);
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      ouvert: 'bg-gray-100 text-gray-800 dark:text-gray-400 border-gray-500/20',
      contrat_valide: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
      livre: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
      retour_effectue: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
      cloture: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
    };

    const labels: Record<string, string> = {
      ouvert: 'Réservation',
      contrat_valide: 'Contrat validé',
      livre: 'En cours',
      retour_effectue: 'Retour effectué',
      cloture: 'Clôturé',
    };

    return (
      <Badge variant="outline" className={`${styles[status]} font-medium`}>
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  if (!assistance) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <p className="text-muted-foreground">Dossier non trouvé</p>
        <Button onClick={() => navigate('/assistance')}>
          Retour à la liste
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/assistance')}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Dossier {assistance.num_dossier}
            </h1>
            <p className="text-sm text-muted-foreground">
              Détails du dossier d'assistance
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <FileText className="w-4 h-4 mr-2" />
            Générer facture
          </Button>
          <Button size="sm">
            <Edit className="w-4 h-4 mr-2" />
            Modifier
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-l-4 border-l-primary col-span-2">
          <CardHeader>
            <CardTitle>Informations du dossier</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">N° Dossier</p>
                <p className="font-semibold text-foreground">{assistance.num_dossier}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Type</p>
                <p className="font-semibold text-foreground">{getTypeLabel(assistance.type)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Assurance</p>
                <p className="font-semibold text-foreground">{assistance.assureur_nom}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">État</p>
                <div className="mt-1">{getStatusBadge(assistance.etat)}</div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Date début</p>
                <p className="font-semibold text-foreground">
                  {new Date(assistance.date_debut).toLocaleDateString('fr-FR')}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Date fin</p>
                <p className="font-semibold text-foreground">
                  {assistance.date_fin ? new Date(assistance.date_fin).toLocaleDateString('fr-FR') : '-'}
                </p>
              </div>
              {assistance.tarif_journalier && (
                <div>
                  <p className="text-sm text-muted-foreground">Tarif journalier</p>
                  <p className="font-semibold text-foreground">
                    {Number(assistance.tarif_journalier).toFixed(2)} MAD/jour
                  </p>
                </div>
              )}
              {assistance.montant_total && (
                <div>
                  <p className="text-sm text-muted-foreground">Montant total</p>
                  <p className="font-semibold text-primary text-lg">
                    {Number(assistance.montant_total).toFixed(2)} MAD
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Statistiques</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Durée</p>
              <p className="text-2xl font-bold text-foreground">
                {assistance.date_fin 
                  ? Math.ceil((new Date(assistance.date_fin).getTime() - new Date(assistance.date_debut).getTime()) / (1000 * 60 * 60 * 24))
                  : Math.ceil((new Date().getTime() - new Date(assistance.date_debut).getTime()) / (1000 * 60 * 60 * 24))
                } jours
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Créé le</p>
              <p className="font-medium text-foreground">
                {new Date(assistance.created_at).toLocaleDateString('fr-FR', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
