import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Filter, Download, Eye, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

type Assistance = Database['public']['Tables']['assistance']['Row'];

export default function Assistance() {
  const navigate = useNavigate();
  const [assistances, setAssistances] = useState<Assistance[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  useEffect(() => {
    loadAssistances();
  }, []);

  const loadAssistances = async () => {
    try {
      const { data, error } = await supabase
        .from('assistance')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAssistances(data || []);
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

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce dossier ?')) return;

    try {
      const { error } = await supabase
        .from('assistance')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Succès',
        description: 'Dossier supprimé',
      });

      loadAssistances();
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    
    if (!confirm(`Êtes-vous sûr de vouloir supprimer ${selectedIds.size} dossier(s) ?`)) return;

    try {
      const { error } = await supabase
        .from('assistance')
        .delete()
        .in('id', Array.from(selectedIds));

      if (error) throw error;

      toast({
        title: 'Succès',
        description: `${selectedIds.size} dossier(s) supprimé(s)`,
      });

      setSelectedIds(new Set());
      loadAssistances();
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === assistances.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(assistances.map(a => a.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      ouvert: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100',
      contrat_valide: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
      livre: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
      retour_effectue: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
      cloture: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
    };

    const labels: Record<string, string> = {
      ouvert: 'Réservation',
      contrat_valide: 'Contrat validé',
      livre: 'En cours',
      retour_effectue: 'En attente paiement',
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dossiers d'assistance</h1>
          <p className="text-sm text-muted-foreground">Gérez les véhicules de remplacement pour les assurances</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            FILTRER
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            RAPPORT
          </Button>
          <Button 
            size="sm"
            onClick={() => navigate('/assistance/nouveau')}
          >
            <Plus className="w-4 h-4 mr-2" />
            Nouveau dossier
          </Button>
        </div>
      </div>

      <Card className="border-l-4 border-l-primary shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6 text-sm font-medium">
              <button className="text-primary border-b-2 border-primary pb-2 transition-colors">
                TOUS ({assistances.length})
              </button>
              <button className="text-muted-foreground hover:text-primary pb-2 transition-colors">
                OUVERTS ({assistances.filter(a => a.etat === 'ouvert').length})
              </button>
              <button className="text-muted-foreground hover:text-primary pb-2 transition-colors">
                CLÔTURÉS ({assistances.filter(a => a.etat === 'cloture').length})
              </button>
            </div>
            {selectedIds.size > 0 && (
              <Button 
                variant="destructive" 
                size="sm"
                onClick={handleBulkDelete}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Supprimer ({selectedIds.size})
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center text-muted-foreground py-8">Chargement...</p>
          ) : assistances.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Aucun dossier d'assistance. Cliquez sur "Nouveau dossier" pour commencer.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-muted-foreground border-b">
                    <th className="pb-3 pl-4 font-medium w-12">
                      <Checkbox 
                        checked={selectedIds.size > 0 && selectedIds.size === assistances.length}
                        onCheckedChange={toggleSelectAll}
                      />
                    </th>
                    <th className="pb-3 font-medium">Actions</th>
                    <th className="pb-3 font-medium">N° Dossier</th>
                    <th className="pb-3 font-medium">Assurance</th>
                    <th className="pb-3 font-medium">Type</th>
                    <th className="pb-3 font-medium">Date début</th>
                    <th className="pb-3 font-medium">Date fin</th>
                    <th className="pb-3 font-medium">État</th>
                    <th className="pb-3 font-medium">Montant</th>
                  </tr>
                </thead>
                <tbody>
                  {assistances.map((assistance) => (
                    <tr 
                      key={assistance.id} 
                      className="border-b last:border-0 cursor-pointer group"
                      onClick={() => navigate(`/assistance/${assistance.id}`)}
                    >
                      <td className="py-4 pl-4" onClick={(e) => e.stopPropagation()}>
                        <Checkbox 
                          checked={selectedIds.has(assistance.id)}
                          onCheckedChange={() => toggleSelect(assistance.id)}
                        />
                      </td>
                      <td className="py-4">
                        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/assistance/${assistance.id}`);
                            }}
                            className="hover:bg-accent transition-colors"
                            title="Afficher les détails"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(assistance.id);
                            }}
                            className="hover:bg-accent transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                      <td className="py-4 font-semibold text-foreground">{assistance.num_dossier}</td>
                      <td className="py-4 text-foreground">{assistance.assureur_nom}</td>
                      <td className="py-4 text-muted-foreground text-sm">{getTypeLabel(assistance.type)}</td>
                      <td className="py-4 text-foreground">
                        {new Date(assistance.date_debut).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="py-4 text-foreground">
                        {assistance.date_fin ? new Date(assistance.date_fin).toLocaleDateString('fr-FR') : '-'}
                      </td>
                      <td className="py-4">{getStatusBadge(assistance.etat)}</td>
                      <td className="py-4 font-medium text-foreground">
                        {assistance.montant_facture ? `${assistance.montant_facture.toFixed(2)} MAD` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
