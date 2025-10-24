import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Filter, Download, Eye, Edit, Trash2, Columns, FileText, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUserRole } from "@/hooks/use-user-role";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { exportToExcel, exportToCSV } from "@/lib/exportUtils";
import { useRealtime } from "@/hooks/use-realtime";

interface Sinistre {
  id: string;
  reference: string;
  type_sinistre: string;
  date_sinistre: string;
  lieu: string;
  vehicle_id: string | null;
  contract_id: string | null;
  client_id: string | null;
  responsabilite: string;
  gravite: string;
  description: string | null;
  cout_estime: number | null;
  statut: string;
  created_at: string;
  vehicles?: { immatriculation: string; immatriculation_provisoire?: string; marque: string; modele: string };
  clients?: { nom: string; prenom: string };
}

export default function Sinistres() {
  const navigate = useNavigate();
  const { isAdmin } = useUserRole();
  const [sinistres, setSinistres] = useState<Sinistre[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState({
    type: '',
    statut: '',
    dateDebut: '',
    dateFin: '',
  });
  const [visibleColumns, setVisibleColumns] = useState({
    reference: true,
    type: true,
    vehicule: true,
    client: true,
    date: true,
    gravite: true,
    cout: true,
    statut: true,
  });
  const { toast } = useToast();

  useEffect(() => {
    loadSinistres();
  }, []);

  // Synchronisation en temps réel
  useRealtime<Sinistre>({
    table: 'sinistres',
    onInsert: (payload) => {
      loadSinistres(); // Recharger pour avoir les relations
      toast({
        title: 'Nouveau sinistre',
        description: `Sinistre ${payload.reference} créé`,
      });
    },
    onUpdate: (payload) => {
      loadSinistres();
    },
    onDelete: ({ old }) => {
      setSinistres((prev) => prev.filter((s) => s.id !== old.id));
      toast({
        title: 'Sinistre supprimé',
        description: `Sinistre ${old.reference} supprimé`,
      });
    },
  });

  const loadSinistres = async () => {
    try {
      const { data, error } = await supabase
        .from('sinistres')
        .select(`
          *,
          vehicles (immatriculation, marque, modele)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Load clients separately if needed
      const sinistresWithClients = await Promise.all((data || []).map(async (sinistre) => {
        if (sinistre.client_id) {
          const { data: clientData } = await supabase
            .from('clients')
            .select('nom, prenom')
            .eq('id', sinistre.client_id)
            .single();
          return { ...sinistre, clients: clientData };
        }
        return { ...sinistre, clients: null };
      }));
      
      setSinistres(sinistresWithClients as any);
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
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce sinistre ?')) return;

    try {
      const { error } = await supabase
        .from('sinistres')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Succès',
        description: 'Sinistre supprimé',
      });

      loadSinistres();
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
    
    if (!confirm(`Êtes-vous sûr de vouloir supprimer ${selectedIds.size} sinistre(s) ?`)) return;

    try {
      const { error } = await supabase
        .from('sinistres')
        .delete()
        .in('id', Array.from(selectedIds));

      if (error) throw error;

      toast({
        title: 'Succès',
        description: `${selectedIds.size} sinistre(s) supprimé(s)`,
      });

      setSelectedIds(new Set());
      loadSinistres();
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredSinistres.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredSinistres.map(s => s.id)));
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

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      accident: 'Accident',
      vol: 'Vol',
      panne_grave: 'Panne grave',
      autre: 'Autre',
    };
    return labels[type] || type;
  };

  const getStatutBadge = (statut: string) => {
    const styles: Record<string, string> = {
      ouvert: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
      en_cours: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
      clos: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
    };
    const labels: Record<string, string> = {
      ouvert: 'Ouvert',
      en_cours: 'En cours',
      clos: 'Clos',
    };
    return (
      <Badge variant="outline" className={styles[statut]}>
        {labels[statut]}
      </Badge>
    );
  };

  const getGraviteBadge = (gravite: string) => {
    const styles: Record<string, string> = {
      legere: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
      moyenne: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
      grave: 'bg-red-500/10 text-red-600 border-red-500/20',
    };
    const labels: Record<string, string> = {
      legere: 'Légère',
      moyenne: 'Moyenne',
      grave: 'Grave',
    };
    return (
      <Badge variant="outline" className={styles[gravite]}>
        {labels[gravite]}
      </Badge>
    );
  };

  const filteredSinistres = sinistres.filter(s => {
    if (filters.type && filters.type.trim() !== '' && s.type_sinistre !== filters.type) return false;
    if (filters.statut && filters.statut.trim() !== '' && s.statut !== filters.statut) return false;
    if (filters.dateDebut && s.date_sinistre < filters.dateDebut) return false;
    if (filters.dateFin && s.date_sinistre > filters.dateFin) return false;
    return true;
  });

  const toggleColumn = (column: keyof typeof visibleColumns) => {
    setVisibleColumns(prev => ({ ...prev, [column]: !prev[column] }));
  };

  const prepareSinistresExport = () => {
    return filteredSinistres.map(s => ({
      'Référence': s.reference,
      'Type': getTypeLabel(s.type_sinistre),
      'Véhicule': s.vehicles ? `${s.vehicles.marque} ${s.vehicles.modele} (${s.vehicles.immatriculation || s.vehicles.immatriculation_provisoire || 'N/A'})` : '-',
      'Client': s.clients ? `${s.clients.prenom || ''} ${s.clients.nom}`.trim() : '-',
      'Date': format(new Date(s.date_sinistre), 'dd/MM/yyyy'),
      'Lieu': s.lieu,
      'Gravité': s.gravite === 'legere' ? 'Légère' : s.gravite === 'moyenne' ? 'Moyenne' : 'Grave',
      'Responsabilité': s.responsabilite === 'locataire' ? 'Locataire' : s.responsabilite === 'tiers' ? 'Tiers' : 'Indéterminée',
      'Coût estimé (DH)': s.cout_estime || 0,
      'Statut': s.statut === 'ouvert' ? 'Ouvert' : s.statut === 'en_cours' ? 'En cours' : 'Clos',
      'Créé le': format(new Date(s.created_at), 'dd/MM/yyyy')
    }));
  };

  const handleExport = (exportFormat: 'excel' | 'csv') => {
    const data = prepareSinistresExport();
    const filename = `sinistres_${format(new Date(), 'yyyy-MM-dd')}`;
    
    if (exportFormat === 'excel') {
      exportToExcel(data, filename);
    } else {
      exportToCSV(data, filename);
    }
    
    toast({
      title: 'Export réussi',
      description: `${filteredSinistres.length} sinistre(s) exporté(s) en ${exportFormat.toUpperCase()}`,
    });
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Chargement...</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <AlertTriangle className="w-6 h-6" />
            Gestion des sinistres
          </h1>
          <p className="text-sm text-muted-foreground">
            Déclarez et suivez les incidents liés aux véhicules
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <Columns className="w-4 h-4 mr-2" />
                COLONNES
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64" align="end">
              <div className="space-y-3">
                <h4 className="font-medium text-sm">Afficher les colonnes</h4>
                <div className="space-y-2">
                  {Object.entries(visibleColumns).map(([key, value]) => (
                    <div key={key} className="flex items-center space-x-2">
                      <Checkbox
                        id={`col-${key}`}
                        checked={value}
                        onCheckedChange={() => toggleColumn(key as keyof typeof visibleColumns)}
                      />
                      <label htmlFor={`col-${key}`} className="text-sm cursor-pointer capitalize">
                        {key}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                FILTRER
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <div className="space-y-4">
                <h4 className="font-medium">Filtres</h4>
                <div className="space-y-3">
                  <div>
                    <Label>Type</Label>
                    <Select value={filters.type} onValueChange={(v) => setFilters({ ...filters, type: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Tous" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value=" ">Tous</SelectItem>
                        <SelectItem value="accident">Accident</SelectItem>
                        <SelectItem value="vol">Vol</SelectItem>
                        <SelectItem value="panne_grave">Panne grave</SelectItem>
                        <SelectItem value="autre">Autre</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Statut</Label>
                    <Select value={filters.statut} onValueChange={(v) => setFilters({ ...filters, statut: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Tous" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value=" ">Tous</SelectItem>
                        <SelectItem value="ouvert">Ouvert</SelectItem>
                        <SelectItem value="en_cours">En cours</SelectItem>
                        <SelectItem value="clos">Clos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Date début</Label>
                    <Input
                      type="date"
                      value={filters.dateDebut}
                      onChange={(e) => setFilters({ ...filters, dateDebut: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Date fin</Label>
                    <Input
                      type="date"
                      value={filters.dateFin}
                      onChange={(e) => setFilters({ ...filters, dateFin: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                EXPORTER
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExport('excel')}>
                <FileText className="w-4 h-4 mr-2" />
                Exporter en Excel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('csv')}>
                <FileText className="w-4 h-4 mr-2" />
                Exporter en CSV
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button size="sm" onClick={() => navigate('/sinistres/nouveau')}>
            <Plus className="w-4 h-4 mr-2" />
            Nouveau sinistre
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {filteredSinistres.length} sinistre(s) trouvé(s)
            </p>
            {selectedIds.size > 0 && (
              <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
                <Trash2 className="w-4 h-4 mr-2" />
                Supprimer ({selectedIds.size})
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {filteredSinistres.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Aucun sinistre enregistré</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-muted-foreground border-b">
                    <th className="pb-3 pl-4 font-medium w-12">
                      <Checkbox
                        checked={selectedIds.size > 0 && selectedIds.size === filteredSinistres.length}
                        onCheckedChange={toggleSelectAll}
                      />
                    </th>
                    <th className="pb-3 font-medium">Actions</th>
                    {visibleColumns.reference && <th className="pb-3 font-medium">Référence</th>}
                    {visibleColumns.type && <th className="pb-3 font-medium">Type</th>}
                    {visibleColumns.vehicule && <th className="pb-3 font-medium">Véhicule</th>}
                    {visibleColumns.client && <th className="pb-3 font-medium">Client</th>}
                    {visibleColumns.date && <th className="pb-3 font-medium">Date</th>}
                    {visibleColumns.gravite && <th className="pb-3 font-medium">Gravité</th>}
                    {visibleColumns.cout && <th className="pb-3 font-medium">Coût estimé</th>}
                    {visibleColumns.statut && <th className="pb-3 font-medium">Statut</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredSinistres.map((sinistre) => (
                    <tr key={sinistre.id} className="border-b hover:bg-muted/50 transition-colors">
                      <td className="py-3 pl-4">
                        <Checkbox
                          checked={selectedIds.has(sinistre.id)}
                          onCheckedChange={() => toggleSelect(sinistre.id)}
                        />
                      </td>
                      <td className="py-3">
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/sinistres/${sinistre.id}`)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/sinistres/${sinistre.id}/modifier`)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          {isAdmin && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(sinistre.id)}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </td>
                      {visibleColumns.reference && (
                        <td className="py-3 font-medium">{sinistre.reference}</td>
                      )}
                      {visibleColumns.type && (
                        <td className="py-3">{getTypeLabel(sinistre.type_sinistre)}</td>
                      )}
                      {visibleColumns.vehicule && (
                        <td className="py-3">
                          {sinistre.vehicles
                            ? `${sinistre.vehicles.marque} ${sinistre.vehicles.modele}`
                            : '-'}
                        </td>
                      )}
                      {visibleColumns.client && (
                        <td className="py-3">
                          {sinistre.clients
                            ? `${sinistre.clients.prenom || ''} ${sinistre.clients.nom}`.trim()
                            : '-'}
                        </td>
                      )}
                      {visibleColumns.date && (
                        <td className="py-3">
                          {format(new Date(sinistre.date_sinistre), 'dd MMM yyyy', { locale: fr })}
                        </td>
                      )}
                      {visibleColumns.gravite && (
                        <td className="py-3">{getGraviteBadge(sinistre.gravite)}</td>
                      )}
                      {visibleColumns.cout && (
                        <td className="py-3">
                          {sinistre.cout_estime ? `${sinistre.cout_estime.toFixed(2)} DH` : '-'}
                        </td>
                      )}
                      {visibleColumns.statut && (
                        <td className="py-3">{getStatutBadge(sinistre.statut)}</td>
                      )}
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
