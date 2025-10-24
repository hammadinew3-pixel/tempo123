import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Filter, Download, Eye, Edit, Trash2, Columns, FileText, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUserRole } from "@/hooks/use-user-role";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { format } from "date-fns";
import { exportToExcel, exportToCSV } from "@/lib/exportUtils";
import { useRealtime } from "@/hooks/use-realtime";

type Assistance = Database['public']['Tables']['assistance']['Row'];

export default function Assistance() {
  const navigate = useNavigate();
  const { isAdmin } = useUserRole();
  const [assistances, setAssistances] = useState<Assistance[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const ITEMS_PER_PAGE = 20;
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState({
    type: '',
    etat: '',
    dateDebut: '',
    dateFin: '',
  });
  const [visibleColumns, setVisibleColumns] = useState({
    numeroDossier: true,
    assurance: true,
    type: true,
    dateDebut: true,
    dateFin: true,
    etat: true,
    montant: true,
  });
  const { toast } = useToast();

  useEffect(() => {
    loadAssistances();
  }, [currentPage]);

  // Synchronisation en temps réel
  useRealtime<Assistance>({
    table: 'assistance',
    onInsert: (payload) => {
      loadAssistances(); // Recharger pour avoir les relations
      toast({
        title: 'Nouveau dossier',
        description: `Dossier ${payload.num_dossier} créé`,
      });
    },
    onUpdate: (payload) => {
      loadAssistances();
    },
    onDelete: ({ old }) => {
      setAssistances((prev) => prev.filter((a) => a.id !== old.id));
      toast({
        title: 'Dossier supprimé',
        description: `Dossier ${old.num_dossier} supprimé`,
      });
    },
  });

  const loadAssistances = async () => {
    try {
      // Get total count
      const { count } = await supabase
        .from('assistance')
        .select('*', { count: 'exact', head: true });
      
      setTotalCount(count || 0);

      // Get paginated data
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      const { data, error } = await supabase
        .from('assistance')
        .select('*')
        .order('created_at', { ascending: false })
        .range(from, to);

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

  const toggleColumn = (column: keyof typeof visibleColumns) => {
    setVisibleColumns(prev => ({ ...prev, [column]: !prev[column] }));
  };

  const filteredAssistances = assistances.filter(a => {
    if (filters.type && filters.type.trim() !== '' && a.type !== filters.type) return false;
    if (filters.etat && filters.etat.trim() !== '' && a.etat !== filters.etat) return false;
    if (filters.dateDebut && a.date_debut < filters.dateDebut) return false;
    if (filters.dateFin && a.date_debut > filters.dateFin) return false;
    return true;
  });

  const prepareAssistancesExport = () => {
    return filteredAssistances.map(a => ({
      'N° Dossier': a.num_dossier,
      'Assurance': a.assureur_nom,
      'Type': a.type === 'remplacement' ? 'Véhicule de remplacement' : 'Prolongation',
      'Date début': format(new Date(a.date_debut), 'dd/MM/yyyy'),
      'Date fin': a.date_fin ? format(new Date(a.date_fin), 'dd/MM/yyyy') : '-',
      'État': a.etat === 'ouvert' ? 'Ouvert' :
              a.etat === 'contrat_valide' ? 'Validé' :
              a.etat === 'livre' ? 'En cours' :
              a.etat === 'retour_effectue' ? 'Retourné' : 'Clôturé',
      'Montant total (DH)': a.montant_total || 0,
      'Montant facturé (DH)': a.montant_facture || 0,
      'Montant payé (DH)': a.montant_paye || 0,
      'Franchise (DH)': a.franchise_montant || 0,
      'État paiement': a.etat_paiement === 'en_attente' ? 'En attente' :
                       a.etat_paiement === 'paye' ? 'Payé' : 'Partiel',
      'Créé le': format(new Date(a.created_at), 'dd/MM/yyyy')
    }));
  };

  const handleExport = (exportFormat: 'excel' | 'csv') => {
    const data = prepareAssistancesExport();
    const filename = `assistances_${format(new Date(), 'yyyy-MM-dd')}`;
    
    if (exportFormat === 'excel') {
      exportToExcel(data, filename);
    } else {
      exportToCSV(data, filename);
    }
    
    toast({
      title: 'Export réussi',
      description: `${filteredAssistances.length} dossier(s) exporté(s) en ${exportFormat.toUpperCase()}`,
    });
  };


  return (
    <div className="space-y-4 md:space-y-6 p-3 md:p-0">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground">Dossiers d'assistance</h1>
          <p className="text-xs md:text-sm text-muted-foreground">Gérez les véhicules de remplacement pour les assurances</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="flex-1 md:flex-none min-w-0">
                <Columns className="w-4 h-4 md:mr-2" />
                <span className="hidden md:inline">COLONNES</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 bg-background z-50" align="end">
              <div className="space-y-3">
                <h4 className="font-medium text-sm">Afficher les colonnes</h4>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="col-numero"
                      checked={visibleColumns.numeroDossier}
                      onCheckedChange={() => toggleColumn('numeroDossier')}
                    />
                    <label htmlFor="col-numero" className="text-sm cursor-pointer">N° Dossier</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="col-assurance"
                      checked={visibleColumns.assurance}
                      onCheckedChange={() => toggleColumn('assurance')}
                    />
                    <label htmlFor="col-assurance" className="text-sm cursor-pointer">Assurance</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="col-type"
                      checked={visibleColumns.type}
                      onCheckedChange={() => toggleColumn('type')}
                    />
                    <label htmlFor="col-type" className="text-sm cursor-pointer">Type</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="col-date-debut"
                      checked={visibleColumns.dateDebut}
                      onCheckedChange={() => toggleColumn('dateDebut')}
                    />
                    <label htmlFor="col-date-debut" className="text-sm cursor-pointer">Date début</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="col-date-fin"
                      checked={visibleColumns.dateFin}
                      onCheckedChange={() => toggleColumn('dateFin')}
                    />
                    <label htmlFor="col-date-fin" className="text-sm cursor-pointer">Date fin</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="col-etat"
                      checked={visibleColumns.etat}
                      onCheckedChange={() => toggleColumn('etat')}
                    />
                    <label htmlFor="col-etat" className="text-sm cursor-pointer">État</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="col-montant"
                      checked={visibleColumns.montant}
                      onCheckedChange={() => toggleColumn('montant')}
                    />
                    <label htmlFor="col-montant" className="text-sm cursor-pointer">Montant</label>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="flex-1 md:flex-none min-w-0">
                <Filter className="w-4 h-4 md:mr-2" />
                <span className="hidden md:inline">FILTRER</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 bg-background z-50" align="end">
              <div className="space-y-4">
                <h4 className="font-medium">Filtres</h4>
                <div className="space-y-3">
                  <div>
                    <Label>Type</Label>
                    <Select value={filters.type} onValueChange={(v) => setFilters({ ...filters, type: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Tous" />
                      </SelectTrigger>
                      <SelectContent className="bg-background z-50">
                        <SelectItem value=" ">Tous</SelectItem>
                        <SelectItem value="remplacement">Véhicule de remplacement</SelectItem>
                        <SelectItem value="panne">Panne</SelectItem>
                        <SelectItem value="accident">Accident</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>État</Label>
                    <Select value={filters.etat} onValueChange={(v) => setFilters({ ...filters, etat: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Tous" />
                      </SelectTrigger>
                      <SelectContent className="bg-background z-50">
                        <SelectItem value=" ">Tous</SelectItem>
                        <SelectItem value="ouvert">Ouvert</SelectItem>
                        <SelectItem value="contrat_valide">Validé</SelectItem>
                        <SelectItem value="livre">En cours</SelectItem>
                        <SelectItem value="retour_effectue">Retourné</SelectItem>
                        <SelectItem value="cloture">Clôturé</SelectItem>
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
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => setFilters({ type: '', etat: '', dateDebut: '', dateFin: '' })}
                >
                  Réinitialiser
                </Button>
              </div>
            </PopoverContent>
          </Popover>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="flex-1 md:flex-none min-w-0">
                <Download className="w-4 h-4 md:mr-2" />
                <span className="hidden md:inline">EXPORTER</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-background z-50">
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
          {isAdmin && (
            <Button 
              size="sm"
              onClick={() => navigate('/assistance/nouveau')}
              className="flex-1 md:flex-none min-w-0"
            >
              <Plus className="w-4 h-4 md:mr-2" />
              <span className="hidden md:inline">Nouveau dossier</span>
            </Button>
          )}
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
          ) : filteredAssistances.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Aucun dossier trouvé. Ajustez vos filtres ou cliquez sur "Nouveau dossier" pour commencer.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-muted-foreground border-b">
                    <th className="pb-3 pl-4 font-medium w-12">
                      <Checkbox 
                        checked={selectedIds.size > 0 && selectedIds.size === filteredAssistances.length}
                        onCheckedChange={toggleSelectAll}
                      />
                    </th>
                    <th className="pb-3 font-medium">Actions</th>
                    {visibleColumns.numeroDossier && <th className="pb-3 font-medium">N° Dossier</th>}
                    {visibleColumns.assurance && <th className="pb-3 font-medium">Assurance</th>}
                    {visibleColumns.type && <th className="pb-3 font-medium">Type</th>}
                    {visibleColumns.dateDebut && <th className="pb-3 font-medium">Date début</th>}
                    {visibleColumns.dateFin && <th className="pb-3 font-medium">Date fin</th>}
                    {visibleColumns.etat && <th className="pb-3 font-medium">État</th>}
                    {visibleColumns.montant && <th className="pb-3 font-medium">Montant</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredAssistances.map((assistance) => (
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
                          {isAdmin && (
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
                          )}
                        </div>
                      </td>
                      {visibleColumns.numeroDossier && (
                        <td className="py-4 font-semibold text-foreground">{assistance.num_dossier}</td>
                      )}
                      {visibleColumns.assurance && (
                        <td className="py-4 text-foreground">{assistance.assureur_nom}</td>
                      )}
                      {visibleColumns.type && (
                        <td className="py-4 text-muted-foreground text-sm">{getTypeLabel(assistance.type)}</td>
                      )}
                      {visibleColumns.dateDebut && (
                        <td className="py-4 text-foreground">
                          {new Date(assistance.date_debut).toLocaleDateString('fr-FR')}
                        </td>
                      )}
                      {visibleColumns.dateFin && (
                        <td className="py-4 text-foreground">
                          {assistance.date_fin ? new Date(assistance.date_fin).toLocaleDateString('fr-FR') : '-'}
                        </td>
                      )}
                      {visibleColumns.etat && (
                        <td className="py-4">{getStatusBadge(assistance.etat)}</td>
                      )}
                      {visibleColumns.montant && (
                        <td className="py-4 font-medium text-foreground">
                          {assistance.montant_facture ? `${assistance.montant_facture.toFixed(2)} MAD` : '-'}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {!loading && filteredAssistances.length > 0 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Page {currentPage} sur {Math.ceil(totalCount / ITEMS_PER_PAGE)} ({totalCount} dossiers au total)
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Précédent
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(Math.ceil(totalCount / ITEMS_PER_PAGE), p + 1))}
                  disabled={currentPage >= Math.ceil(totalCount / ITEMS_PER_PAGE)}
                >
                  Suivant
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
