import { useEffect, useState } from "react";
import { Search, Filter, Download, Plus, Eye, Printer, FileText, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export default function FacturesAssurance() {
  const [assistances, setAssistances] = useState<any[]>([]);
  const [filteredAssistances, setFilteredAssistances] = useState<any[]>([]);
  const [assurances, setAssurances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAssurance, setSelectedAssurance] = useState<string>("all");
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [showFilters, setShowFilters] = useState(false);
  const [selectedForStatus, setSelectedForStatus] = useState<string[]>([]);
  const [selectedForInvoice, setSelectedForInvoice] = useState<string[]>([]);
  const [showGroupDialog, setShowGroupDialog] = useState(false);
  const [groupDialogAssurance, setGroupDialogAssurance] = useState<string>("all");
  const [groupDialogDateRange, setGroupDialogDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [groupDialogSearch, setGroupDialogSearch] = useState("");
  const [filteredGroupDossiers, setFilteredGroupDossiers] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterAssistances();
  }, [searchTerm, selectedAssurance, dateRange, assistances]);

  useEffect(() => {
    filterGroupDossiers();
  }, [groupDialogSearch, groupDialogAssurance, groupDialogDateRange, assistances]);

  const loadData = async () => {
    try {
      const { data: assistanceData } = await supabase
        .from('assistance')
        .select(`
          *,
          clients (nom, prenom),
          vehicles (marque, modele, immatriculation),
          assurances (nom)
        `)
        .order('created_at', { ascending: false });

      const { data: assurancesData } = await supabase
        .from('assurances')
        .select('*')
        .eq('actif', true)
        .order('nom');

      setAssistances(assistanceData || []);
      setFilteredAssistances(assistanceData || []);
      setAssurances(assurancesData || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAssistances = () => {
    let filtered = [...assistances];

    if (searchTerm) {
      filtered = filtered.filter(a => 
        a.num_dossier.toLowerCase().includes(searchTerm.toLowerCase()) ||
        `${a.clients?.nom} ${a.clients?.prenom}`.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedAssurance && selectedAssurance !== 'all') {
      filtered = filtered.filter(a => a.assureur_id === selectedAssurance);
    }

    if (dateRange.from) {
      filtered = filtered.filter(a => new Date(a.date_debut) >= dateRange.from!);
    }

    if (dateRange.to) {
      filtered = filtered.filter(a => new Date(a.date_debut) <= dateRange.to!);
    }

    setFilteredAssistances(filtered);
  };

  const filterGroupDossiers = () => {
    let filtered = [...assistances];

    if (groupDialogSearch) {
      filtered = filtered.filter(a => 
        a.num_dossier.toLowerCase().includes(groupDialogSearch.toLowerCase()) ||
        `${a.clients?.nom} ${a.clients?.prenom}`.toLowerCase().includes(groupDialogSearch.toLowerCase())
      );
    }

    if (groupDialogAssurance && groupDialogAssurance !== 'all') {
      filtered = filtered.filter(a => a.assureur_id === groupDialogAssurance);
    }

    if (groupDialogDateRange.from) {
      filtered = filtered.filter(a => new Date(a.date_debut) >= groupDialogDateRange.from!);
    }

    if (groupDialogDateRange.to) {
      filtered = filtered.filter(a => new Date(a.date_debut) <= groupDialogDateRange.to!);
    }

    setFilteredGroupDossiers(filtered);
  };

  const handlePrintInvoice = (assistanceId: string) => {
    window.open(`/assistance-facture-template?id=${assistanceId}&print=true`, '_blank');
  };

  const handleGroupInvoice = () => {
    if (selectedForInvoice.length === 0) return;
    const ids = selectedForInvoice.join(',');
    window.open(`/assistance-facture-template?ids=${ids}&print=true`, '_blank');
    setShowGroupDialog(false);
    setSelectedForInvoice([]);
    setGroupDialogAssurance('all');
    setGroupDialogDateRange({});
    setGroupDialogSearch('');
  };

  const toggleInvoiceSelection = (id: string) => {
    setSelectedForInvoice(prev => 
      prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]
    );
  };

  const toggleStatusSelection = (id: string) => {
    setSelectedForStatus(prev => 
      prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]
    );
  };

  const toggleSelectAllForStatus = () => {
    if (selectedForStatus.length === filteredAssistances.length) {
      setSelectedForStatus([]);
    } else {
      setSelectedForStatus(filteredAssistances.map(a => a.id));
    }
  };

  const handleGroupStatusChange = async (newStatus: string) => {
    if (selectedForStatus.length === 0) return;
    
    try {
      await supabase
        .from('assistance')
        .update({ etat_paiement: newStatus })
        .in('id', selectedForStatus);
      
      await loadData();
      setSelectedForStatus([]);
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const getStatusBadge = (etatPaiement: string) => {
    const status = {
      paye: { label: 'Payée', color: 'bg-[hsl(var(--success))]' },
      partiellement_paye: { label: 'Partiel', color: 'bg-[hsl(var(--warning))]' },
      en_attente: { label: 'En attente', color: 'bg-[hsl(var(--destructive))]' },
    }[etatPaiement] || { label: 'Inconnu', color: 'bg-muted' };

    return (
      <Badge className={`${status.color} text-white`}>
        {status.label}
      </Badge>
    );
  };

  const getTotalAmount = (assistance: any) => {
    return (assistance.montant_facture || assistance.montant_total || 0).toFixed(2);
  };

  const handleDownloadInvoice = (assistanceId: string) => {
    // Ouvre la facture dans un nouvel onglet - l'utilisateur peut l'enregistrer en PDF via son navigateur
    window.open(`/assistance-facture-template?id=${assistanceId}`, '_blank');
  };

  const handleEditInvoice = (assistanceId: string) => {
    // Redirige vers la page de détails de l'assistance pour modification
    window.location.href = `/assistance/${assistanceId}`;
  };

  const handleDeleteInvoice = async (assistanceId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette facture ?')) return;
    
    try {
      await supabase
        .from('assistance')
        .delete()
        .eq('id', assistanceId);
      
      await loadData();
    } catch (error) {
      console.error('Error deleting invoice:', error);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Factures Assurance</h1>
          <p className="text-sm text-muted-foreground">Gérez vos factures et paiements d'assurance</p>
        </div>
        <div className="flex items-center space-x-2">
          {selectedForStatus.length > 0 && (
            <div className="flex items-center space-x-2 bg-primary/10 px-4 py-2 rounded-lg">
              <span className="text-sm font-medium">{selectedForStatus.length} sélectionné(s)</span>
              <Select onValueChange={handleGroupStatusChange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Changer le statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="paye">Marquer comme payé</SelectItem>
                  <SelectItem value="partiellement_paye">Partiellement payé</SelectItem>
                  <SelectItem value="en_attente">En attente</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setSelectedForStatus([])}
              >
                Annuler
              </Button>
            </div>
          )}
          <Dialog open={showGroupDialog} onOpenChange={setShowGroupDialog}>
            <DialogTrigger asChild>
              <Button variant="default" size="sm">
                <FileText className="w-4 h-4 mr-2" />
                Facture groupée
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
              <DialogHeader>
                <DialogTitle>Sélectionner les dossiers pour la facture groupée</DialogTitle>
              </DialogHeader>
              
              {/* Filters in dialog */}
              <div className="space-y-4 pb-4 border-b">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Rechercher par N° dossier ou client..."
                    className="pl-10"
                    value={groupDialogSearch}
                    onChange={(e) => setGroupDialogSearch(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs mb-1">Assurance</Label>
                    <Select value={groupDialogAssurance} onValueChange={setGroupDialogAssurance}>
                      <SelectTrigger>
                        <SelectValue placeholder="Toutes les assurances" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Toutes les assurances</SelectItem>
                        {assurances.map((assurance) => (
                          <SelectItem key={assurance.id} value={assurance.id}>
                            {assurance.nom}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs mb-1">Période</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                          {groupDialogDateRange.from ? (
                            groupDialogDateRange.to ? (
                              <>
                                {format(groupDialogDateRange.from, "dd/MM/yyyy")} - {format(groupDialogDateRange.to, "dd/MM/yyyy")}
                              </>
                            ) : (
                              format(groupDialogDateRange.from, "dd/MM/yyyy")
                            )
                          ) : (
                            <span>Sélectionner</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="range"
                          selected={{ from: groupDialogDateRange.from, to: groupDialogDateRange.to }}
                          onSelect={(range) => setGroupDialogDateRange({ from: range?.from, to: range?.to })}
                          locale={fr}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setGroupDialogAssurance('all');
                    setGroupDialogDateRange({});
                    setGroupDialogSearch('');
                  }}
                >
                  Réinitialiser les filtres
                </Button>
              </div>

              {/* Dossiers list */}
              <div className="flex-1 overflow-y-auto max-h-96">
                {filteredGroupDossiers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Aucun dossier trouvé
                  </div>
                ) : (
                  filteredGroupDossiers.map((assistance) => (
                    <div key={assistance.id} className="flex items-center space-x-3 py-3 px-2 border-b hover:bg-muted/50 rounded transition-colors">
                      <Checkbox
                        id={`dialog-${assistance.id}`}
                        checked={selectedForInvoice.includes(assistance.id)}
                        onCheckedChange={() => toggleInvoiceSelection(assistance.id)}
                      />
                      <Label htmlFor={`dialog-${assistance.id}`} className="flex-1 cursor-pointer">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{assistance.num_dossier} - {assistance.clients?.nom} {assistance.clients?.prenom}</div>
                            <div className="text-xs text-muted-foreground">
                              {assistance.assurances?.nom || assistance.assureur_nom} • {format(new Date(assistance.date_debut), 'dd/MM/yyyy', { locale: fr })}
                            </div>
                          </div>
                          <span className="font-semibold">{getTotalAmount(assistance)} DH</span>
                        </div>
                      </Label>
                    </div>
                  ))
                )}
              </div>

              <div className="flex justify-between items-center pt-4 border-t">
                <span className="text-sm text-muted-foreground">
                  {selectedForInvoice.length} dossier(s) sélectionné(s)
                </span>
                <div className="flex space-x-2">
                  <Button variant="outline" onClick={() => {
                    setShowGroupDialog(false);
                    setSelectedForInvoice([]);
                  }}>
                    Annuler
                  </Button>
                  <Button onClick={handleGroupInvoice} disabled={selectedForInvoice.length === 0}>
                    <Printer className="w-4 h-4 mr-2" />
                    Générer la facture
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Exporter
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Factures d'assistance</CardTitle>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Rechercher..."
                  className="pl-10 w-64"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="w-4 h-4 mr-2" />
                Filtres
              </Button>
            </div>
          </div>
          {showFilters && (
            <div className="flex items-center space-x-4 mt-4 p-4 bg-muted/50 rounded-lg">
              <div className="flex-1">
                <Label className="text-xs mb-1">Assurance</Label>
                <Select value={selectedAssurance} onValueChange={setSelectedAssurance}>
                  <SelectTrigger>
                    <SelectValue placeholder="Toutes les assurances" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les assurances</SelectItem>
                    {assurances.map((assurance) => (
                      <SelectItem key={assurance.id} value={assurance.id}>
                        {assurance.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <Label className="text-xs mb-1">Période</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      {dateRange.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, "dd/MM/yyyy")} - {format(dateRange.to, "dd/MM/yyyy")}
                          </>
                        ) : (
                          format(dateRange.from, "dd/MM/yyyy")
                        )
                      ) : (
                        <span>Sélectionner une période</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="range"
                      selected={{ from: dateRange.from, to: dateRange.to }}
                      onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })}
                      locale={fr}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedAssurance('all');
                  setDateRange({});
                  setSearchTerm('');
                }}
              >
                Réinitialiser
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-muted-foreground border-b">
                  <th className="pb-3 font-medium w-12">
                    <Checkbox
                      checked={selectedForStatus.length === filteredAssistances.length && filteredAssistances.length > 0}
                      onCheckedChange={toggleSelectAllForStatus}
                    />
                  </th>
                  <th className="pb-3 font-medium">N° Facture</th>
                  <th className="pb-3 font-medium">N° Dossier</th>
                  <th className="pb-3 font-medium">Assurance</th>
                  <th className="pb-3 font-medium">Client</th>
                  <th className="pb-3 font-medium">Date</th>
                  <th className="pb-3 font-medium">Montant</th>
                  <th className="pb-3 font-medium">Statut</th>
                  <th className="pb-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={9} className="text-center py-8">Chargement...</td>
                  </tr>
                ) : filteredAssistances.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-8 text-muted-foreground">
                      Aucune facture trouvée
                    </td>
                  </tr>
                ) : (
                  filteredAssistances.map((assistance) => (
                    <tr key={assistance.id} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="py-4">
                        <Checkbox
                          checked={selectedForStatus.includes(assistance.id)}
                          onCheckedChange={() => toggleStatusSelection(assistance.id)}
                        />
                      </td>
                      <td className="py-4 font-medium text-foreground">FAC-{assistance.num_dossier}</td>
                      <td className="py-4 text-foreground">{assistance.num_dossier}</td>
                      <td className="py-4 text-foreground">
                        {assistance.assurances?.nom || assistance.assureur_nom}
                      </td>
                      <td className="py-4 text-foreground">
                        {assistance.clients?.nom} {assistance.clients?.prenom}
                      </td>
                      <td className="py-4 text-foreground">
                        {format(new Date(assistance.date_debut), 'dd/MM/yyyy', { locale: fr })}
                      </td>
                      <td className="py-4 font-medium text-foreground">
                        {getTotalAmount(assistance)} DH
                      </td>
                      <td className="py-4">
                        {getStatusBadge(assistance.etat_paiement)}
                      </td>
                      <td className="py-4">
                        <div className="flex space-x-1">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handlePrintInvoice(assistance.id)}
                            title="Imprimer"
                          >
                            <Printer className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDownloadInvoice(assistance.id)}
                            title="Télécharger"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleEditInvoice(assistance.id)}
                            title="Modifier"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDeleteInvoice(assistance.id)}
                            title="Supprimer"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
