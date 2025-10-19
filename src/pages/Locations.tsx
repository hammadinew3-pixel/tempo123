import { useEffect, useState } from 'react';
import { useNavigate } from "react-router-dom";
import { Search, Filter, Download, Plus, Edit, Trash2, FileText, Eye, Car, User, Columns } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUserRole } from "@/hooks/use-user-role";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { format } from "date-fns";
import { exportToExcel, exportToCSV } from "@/lib/exportUtils";
import { useRealtime } from "@/hooks/use-realtime";

type Contract = Database['public']['Tables']['contracts']['Row'];
type ContractInsert = Database['public']['Tables']['contracts']['Insert'];

export default function Locations() {
  const navigate = useNavigate();
  const { isAdmin } = useUserRole();
  const [contracts, setContracts] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<any>(null);
  const [filterType, setFilterType] = useState<'all' | 'location' | 'assistance'>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState({
    statut: '',
    dateDebut: '',
    dateFin: '',
    client: '',
    vehicule: '',
  });
  const [visibleColumns, setVisibleColumns] = useState({
    type: true,
    numeroContrat: true,
    client: true,
    vehicule: true,
    dates: true,
    statut: true,
    montant: true,
  });
  const { toast } = useToast();

  const [formData, setFormData] = useState<Partial<ContractInsert>>({
    client_id: '',
    vehicle_id: '',
    date_debut: '',
    date_fin: '',
    statut: 'brouillon',
    caution_montant: 0,
    caution_statut: 'bloquee',
    advance_payment: 0,
    payment_method: 'especes',
    start_location: '',
    end_location: '',
    start_time: null,
    end_time: null,
    notes: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  // Synchronisation en temps réel pour les contrats
  useRealtime<any>({
    table: 'contracts',
    onInsert: (payload) => {
      loadData(); // Recharger pour avoir les relations
      toast({
        title: 'Nouveau contrat',
        description: `Contrat ${payload.numero_contrat} créé`,
      });
    },
    onUpdate: (payload) => {
      loadData();
    },
    onDelete: ({ old }) => {
      setContracts((prev) => prev.filter((c) => c.id !== old.id));
      toast({
        title: 'Contrat supprimé',
        description: `Contrat ${old.numero_contrat} supprimé`,
      });
    },
  });

  // Synchronisation en temps réel pour les assistances
  useRealtime<any>({
    table: 'assistance',
    onInsert: (payload) => {
      loadData();
      toast({
        title: 'Nouveau dossier assistance',
        description: `Dossier ${payload.num_dossier} créé`,
      });
    },
    onUpdate: (payload) => {
      loadData();
    },
    onDelete: ({ old }) => {
      loadData();
      toast({
        title: 'Dossier supprimé',
        description: `Dossier ${old.num_dossier} supprimé`,
      });
    },
  });

  const loadData = async () => {
    try {
      console.log('🔄 Chargement des données...');
      
      const [contractsRes, assistancesRes, vehiclesRes, clientsRes] = await Promise.all([
        supabase
          .from('contracts')
          .select(`
            *,
            clients (nom, prenom, telephone),
            vehicles (immatriculation, marque, modele, tarif_journalier)
          `)
          .order('created_at', { ascending: false }),
        supabase
          .from('assistance')
          .select(`
            *,
            clients (nom, prenom, telephone),
            vehicles (immatriculation, marque, modele, tarif_journalier)
          `)
          .order('created_at', { ascending: false }),
        supabase
          .from('vehicles')
          .select('*')
          .eq('statut', 'disponible'),
        supabase
          .from('clients')
          .select('*')
      ]);

      if (contractsRes.error) {
        console.error('❌ Erreur contrats:', contractsRes.error);
        throw contractsRes.error;
      }
      if (assistancesRes.error) {
        console.error('❌ Erreur assistances:', assistancesRes.error);
        throw assistancesRes.error;
      }
      if (vehiclesRes.error) {
        console.error('❌ Erreur véhicules:', vehiclesRes.error);
        throw vehiclesRes.error;
      }
      if (clientsRes.error) {
        console.error('❌ Erreur clients:', clientsRes.error);
        throw clientsRes.error;
      }

      console.log('✅ Contrats chargés:', contractsRes.data?.length || 0);
      console.log('✅ Assistances chargées:', assistancesRes.data?.length || 0);
      console.log('✅ Véhicules chargés:', vehiclesRes.data?.length || 0);
      console.log('✅ Clients chargés:', clientsRes.data?.length || 0);

      // Fusionner les contrats et assistances avec un indicateur de type
      const normalizedContracts = (contractsRes.data || []).map(c => ({
        ...c,
        type_contrat: 'location' as const,
        statut: c.statut || 'brouillon',
      }));

      const normalizedAssistances = (assistancesRes.data || []).map(a => ({
        ...a,
        type_contrat: 'assistance' as const,
        numero_contrat: a.num_dossier,
        statut: a.etat_paiement, // Afficher le statut de paiement pour les assistances
        etat_vehicule: a.etat, // Garder l'état du véhicule séparément
        date_debut: a.date_debut,
        date_fin: a.date_fin,
        total_amount: a.montant_facture || a.montant_total,
      }));

      const allContracts = [...normalizedContracts, ...normalizedAssistances].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setContracts(allContracts);
      setVehicles(vehiclesRes.data || []);
      setClients(clientsRes.data || []);
    } catch (error: any) {
      console.error('❌ Erreur lors du chargement:', error);
      toast({
        title: 'Erreur de chargement',
        description: error.message || 'Impossible de charger les données',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Préparer les données en convertissant les chaînes vides en null pour les champs time
      const dataToSubmit = {
        ...formData,
        start_time: formData.start_time || null,
        end_time: formData.end_time || null,
        start_location: formData.start_location || null,
        end_location: formData.end_location || null,
        notes: formData.notes || null,
      };

      console.log('📝 Données à enregistrer:', dataToSubmit);

      if (editingContract) {
        const { error } = await supabase
          .from('contracts')
          .update(dataToSubmit)
          .eq('id', editingContract.id);

        if (error) {
          console.error('❌ Erreur modification:', error);
          throw error;
        }

        toast({
          title: 'Succès',
          description: 'Contrat modifié avec succès',
        });
      } else {
        const { error } = await supabase
          .from('contracts')
          .insert([dataToSubmit as ContractInsert]);

        if (error) {
          console.error('❌ Erreur création:', error);
          throw error;
        }

        toast({
          title: 'Succès',
          description: 'Contrat créé avec succès',
        });
      }

      setIsDialogOpen(false);
      resetForm();
      loadData();
    } catch (error: any) {
      console.error('❌ Erreur handleSubmit:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Une erreur est survenue',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce contrat ?')) return;

    try {
      const { error } = await supabase
        .from('contracts')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Succès',
        description: 'Contrat supprimé',
      });

      loadData();
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
    
    if (!confirm(`Êtes-vous sûr de vouloir supprimer ${selectedIds.size} élément(s) ?`)) return;

    try {
      const locationIds = Array.from(selectedIds).filter(id => 
        contracts.find(c => c.id === id && c.type_contrat === 'location')
      );
      
      const assistanceIds = Array.from(selectedIds).filter(id => 
        contracts.find(c => c.id === id && c.type_contrat === 'assistance')
      );

      if (locationIds.length > 0) {
        const { error } = await supabase
          .from('contracts')
          .delete()
          .in('id', locationIds);
        if (error) throw error;
      }

      if (assistanceIds.length > 0) {
        const { error } = await supabase
          .from('assistance')
          .delete()
          .in('id', assistanceIds);
        if (error) throw error;
      }

      toast({
        title: 'Succès',
        description: `${selectedIds.size} élément(s) supprimé(s)`,
      });

      setSelectedIds(new Set());
      loadData();
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const toggleSelectAll = () => {
    const filtered = contracts.filter(contract => {
      if (filterType === 'all') return true;
      return contract.type_contrat === filterType;
    });
    
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map(c => c.id)));
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

  const resetForm = () => {
    setFormData({
      client_id: '',
      vehicle_id: '',
      date_debut: '',
      date_fin: '',
      statut: 'brouillon',
      caution_montant: 0,
      caution_statut: 'bloquee',
      advance_payment: 0,
      payment_method: 'especes',
      start_location: '',
      end_location: '',
      start_time: null,
      end_time: null,
      notes: '',
    });
    setEditingContract(null);
  };

  const openEditDialog = (contract: any) => {
    setEditingContract(contract);
    setFormData({
      numero_contrat: contract.numero_contrat,
      client_id: contract.client_id,
      vehicle_id: contract.vehicle_id,
      date_debut: contract.date_debut,
      date_fin: contract.date_fin,
      statut: contract.statut,
      caution_montant: contract.caution_montant,
      caution_statut: contract.caution_statut,
      advance_payment: contract.advance_payment || 0,
      payment_method: contract.payment_method || 'especes',
      start_location: contract.start_location || '',
      end_location: contract.end_location || '',
      start_time: contract.start_time || '',
      end_time: contract.end_time || '',
      notes: contract.notes || '',
    });
    setIsDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      // Statuts pour les contrats de location
      brouillon: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100',
      ouvert: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100',
      contrat_valide: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
      livre: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
      retour_effectue: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100',
      termine: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-100',
      cloture: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-100',
      annule: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100',
      // Statuts de paiement pour les assistances
      en_attente: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100',
      paye: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
      partiellement_paye: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100',
    };

    const labels: Record<string, string> = {
      // Labels pour les contrats de location
      brouillon: 'Réservation',
      ouvert: 'Réservation',
      contrat_valide: 'Contrat validé',
      livre: 'En cours',
      retour_effectue: 'Retour effectué',
      termine: 'Clôturé',
      cloture: 'Clôturé',
      annule: 'Annulé',
      // Labels pour les statuts de paiement (assistances)
      en_attente: 'En attente de paiement',
      paye: 'Payé',
      partiellement_paye: 'Partiellement payé',
    };

    return (
      <Badge variant="outline" className={`${styles[status]} border-0`}>
        {labels[status] || status}
      </Badge>
    );
  };

  const calculateDuration = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const toggleColumn = (column: keyof typeof visibleColumns) => {
    setVisibleColumns(prev => ({ ...prev, [column]: !prev[column] }));
  };

  const filteredContracts = contracts.filter(contract => {
    if (filterType !== 'all' && contract.type_contrat !== filterType) return false;
    if (filters.statut && filters.statut.trim() !== '' && contract.statut !== filters.statut) return false;
    if (filters.dateDebut && contract.date_debut < filters.dateDebut) return false;
    if (filters.dateFin && contract.date_debut > filters.dateFin) return false;
    return true;
  });

  const prepareLocationsExport = () => {
    return filteredContracts.map(c => ({
      'Type': c.type_contrat === 'location' ? 'Location' : 'Assistance',
      'N° Contrat': c.numero_contrat,
      'Client': c.clients ? `${c.clients.prenom || ''} ${c.clients.nom}`.trim() : '-',
      'Véhicule': c.vehicles ? `${c.vehicles.marque} ${c.vehicles.modele} (${c.vehicles.immatriculation})` : '-',
      'Date début': format(new Date(c.date_debut), 'dd/MM/yyyy'),
      'Date fin': format(new Date(c.date_fin), 'dd/MM/yyyy'),
      'Durée (jours)': calculateDuration(c.date_debut, c.date_fin),
      'Statut': c.statut === 'brouillon' ? 'Brouillon' :
                c.statut === 'contrat_valide' ? 'Validé' :
                c.statut === 'livre' ? 'En cours' :
                c.statut === 'retour_effectue' ? 'Retourné' :
                c.statut === 'termine' ? 'Terminé' : 'Annulé',
      'Montant total (DH)': c.total_amount || 0,
      'Avance (DH)': c.advance_payment || 0,
      'Reste (DH)': c.remaining_amount || 0,
      'Caution (DH)': c.caution_montant || 0,
      'Créé le': format(new Date(c.created_at), 'dd/MM/yyyy')
    }));
  };

  const handleExport = (exportFormat: 'excel' | 'csv') => {
    const data = prepareLocationsExport();
    const filename = `locations_${format(new Date(), 'yyyy-MM-dd')}`;
    
    if (exportFormat === 'excel') {
      exportToExcel(data, filename);
    } else {
      exportToCSV(data, filename);
    }
    
    toast({
      title: 'Export réussi',
      description: `${data.length} location(s) exportée(s) en ${exportFormat.toUpperCase()}`,
    });
  };

  const handleGeneratePDF = async (contractId: string) => {
    try {
      console.log('📄 Génération du PDF pour le contrat:', contractId);
      
      toast({
        title: "Ouverture du contrat",
        description: "Le contrat s'ouvre pour impression...",
      });

      // Ouvrir le contrat dans une nouvelle fenêtre pour impression
      const printWindow = window.open(`/contract-template?id=${contractId}`, '_blank');
      
      if (printWindow) {
        toast({
          title: 'Contrat prêt',
          description: 'Utilisez Ctrl+P (ou Cmd+P sur Mac) pour sauvegarder en PDF',
        });
      } else {
        throw new Error('Impossible d\'ouvrir la fenêtre d\'impression');
      }
      
      // Recharger les données
      loadData();
    } catch (error: any) {
      console.error('❌ Erreur lors de la génération du PDF:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible d\'ouvrir le contrat',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Liste des locations</h1>
          <p className="text-sm text-muted-foreground">Gérez vos contrats de location</p>
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
                      id="col-numero"
                      checked={visibleColumns.numeroContrat}
                      onCheckedChange={() => toggleColumn('numeroContrat')}
                    />
                    <label htmlFor="col-numero" className="text-sm cursor-pointer">N° Contrat</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="col-client"
                      checked={visibleColumns.client}
                      onCheckedChange={() => toggleColumn('client')}
                    />
                    <label htmlFor="col-client" className="text-sm cursor-pointer">Client</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="col-vehicule"
                      checked={visibleColumns.vehicule}
                      onCheckedChange={() => toggleColumn('vehicule')}
                    />
                    <label htmlFor="col-vehicule" className="text-sm cursor-pointer">Véhicule</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="col-dates"
                      checked={visibleColumns.dates}
                      onCheckedChange={() => toggleColumn('dates')}
                    />
                    <label htmlFor="col-dates" className="text-sm cursor-pointer">Dates</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="col-statut"
                      checked={visibleColumns.statut}
                      onCheckedChange={() => toggleColumn('statut')}
                    />
                    <label htmlFor="col-statut" className="text-sm cursor-pointer">Statut</label>
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
                    <Label>Statut</Label>
                    <Select value={filters.statut} onValueChange={(v) => setFilters({ ...filters, statut: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Tous" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value=" ">Tous</SelectItem>
                        <SelectItem value="ouvert">Réservation</SelectItem>
                        <SelectItem value="contrat_valide">Contrat validé</SelectItem>
                        <SelectItem value="livre">En cours</SelectItem>
                        <SelectItem value="retour_effectue">Retour effectué</SelectItem>
                        <SelectItem value="termine">Terminé</SelectItem>
                        <SelectItem value="annule">Annulé</SelectItem>
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
                  onClick={() => setFilters({ statut: '', dateDebut: '', dateFin: '', client: '', vehicule: '' })}
                >
                  Réinitialiser
                </Button>
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
          <Button variant="outline" size="sm">
            CHECK DISPONIBILITÉ
          </Button>
          {isAdmin && (
            <Button size="sm" onClick={() => navigate('/locations/nouveau')}>
              <Plus className="w-4 h-4 mr-2" />
              Nouveau contrat
            </Button>
          )}
        </div>
      </div>


      <Card>
        <CardHeader className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm font-medium">
              <button 
                onClick={() => setFilterType('all')}
                className={`pb-2 transition-colors ${
                  filterType === 'all' 
                    ? 'text-primary border-b-2 border-primary' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                TOUS ({contracts.length})
              </button>
              <button 
                onClick={() => setFilterType('location')}
                className={`pb-2 transition-colors ${
                  filterType === 'location' 
                    ? 'text-primary border-b-2 border-primary' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                LOCATIONS ({contracts.filter(c => c.type_contrat === 'location').length})
              </button>
              <button 
                onClick={() => setFilterType('assistance')}
                className={`pb-2 transition-colors ${
                  filterType === 'assistance' 
                    ? 'text-primary border-b-2 border-primary' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                ASSISTANCES ({contracts.filter(c => c.type_contrat === 'assistance').length})
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
        <CardContent>{loading ? (
            <p className="text-center text-muted-foreground py-8">Chargement...</p>
          ) : filteredContracts.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Aucun contrat trouvé. Ajustez vos filtres ou cliquez sur "Nouveau contrat" pour commencer.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-muted-foreground border-b">
                    <th className="pb-3 pl-4 font-medium w-12">
                      <Checkbox 
                        checked={selectedIds.size > 0 && selectedIds.size === filteredContracts.length}
                        onCheckedChange={toggleSelectAll}
                      />
                    </th>
                    <th className="pb-3 font-medium">Actions</th>
                    {visibleColumns.type && <th className="pb-3 font-medium">Type</th>}
                    {visibleColumns.numeroContrat && <th className="pb-3 font-medium">N° Contrat</th>}
                    {visibleColumns.vehicule && <th className="pb-3 font-medium">Véhicule</th>}
                    {visibleColumns.client && <th className="pb-3 font-medium">Client</th>}
                    {visibleColumns.dates && <th className="pb-3 font-medium">Période</th>}
                    {visibleColumns.dates && <th className="pb-3 font-medium">Durée</th>}
                    {visibleColumns.montant && <th className="pb-3 font-medium">Montant</th>}
                    {visibleColumns.statut && <th className="pb-3 font-medium">Statut</th>}
                    <th className="pb-3 font-medium">Créé le</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredContracts.map((contract) => {
                    const isAssistance = contract.type_contrat === 'assistance';
                    const detailsUrl = isAssistance ? `/assistance/${contract.id}` : `/locations/${contract.id}`;
                    
                    return (
                      <tr 
                        key={contract.id} 
                        className="border-b last:border-0 hover:bg-muted/50 cursor-pointer"
                        onClick={() => navigate(detailsUrl)}
                      >
                        <td className="py-4 pl-4" onClick={(e) => e.stopPropagation()}>
                          <Checkbox 
                            checked={selectedIds.has(contract.id)}
                            onCheckedChange={() => toggleSelect(contract.id)}
                          />
                        </td>
                        <td className="py-4">
                          <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(detailsUrl)}
                              title="Voir"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (isAssistance) {
                                  navigate(detailsUrl);
                                } else {
                                  openEditDialog(contract);
                                }
                              }}
                              title="Modifier"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            {isAdmin && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(contract.id)}
                                title="Supprimer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </td>
                        {visibleColumns.type && (
                          <td className="py-4">
                            <Badge 
                              variant="outline" 
                              className={isAssistance ? 'bg-orange-500/10 text-orange-600 border-orange-500/20' : 'bg-blue-500/10 text-blue-600 border-blue-500/20'}
                            >
                              {isAssistance ? 'Assistance' : 'Location'}
                            </Badge>
                          </td>
                        )}
                        {visibleColumns.numeroContrat && (
                          <td className="py-4 font-medium text-foreground">{contract.numero_contrat}</td>
                        )}
                        {visibleColumns.vehicule && (
                          <td className="py-4 text-foreground">
                            {contract.vehicles?.marque} {contract.vehicles?.modele}
                          </td>
                        )}
                        {visibleColumns.client && (
                          <td className="py-4 text-foreground">
                            {contract.clients?.nom} {contract.clients?.prenom}
                          </td>
                        )}
                        {visibleColumns.dates && (
                          <>
                            <td className="py-4 text-foreground text-sm">
                              {new Date(contract.date_debut).toLocaleDateString('fr-FR')} - {contract.date_fin ? new Date(contract.date_fin).toLocaleDateString('fr-FR') : 'En cours'}
                            </td>
                            <td className="py-4 text-foreground">
                              {contract.date_fin ? (contract.duration || calculateDuration(contract.date_debut, contract.date_fin)) + ' jours' : '-'}
                            </td>
                          </>
                        )}
                        {visibleColumns.montant && (
                          <td className="py-4 text-foreground">{(() => {
                            const ta = Number(contract.total_amount || 0);
                            if (ta > 0) return `${ta.toFixed(2)} MAD`;
                            const rate = Number(contract.daily_rate ?? contract.vehicles?.tarif_journalier) || 0;
                            const days = contract.date_fin ? (contract.duration || calculateDuration(contract.date_debut, contract.date_fin)) : 0;
                            const computed = rate * days;
                            return `${computed.toFixed(2)} MAD`;
                          })()}</td>
                        )}
                        {visibleColumns.statut && (
                          <td className="py-4">{getStatusBadge(contract.statut)}</td>
                        )}
                        <td className="py-4 text-foreground text-sm">
                          {new Date(contract.created_at).toLocaleString('fr-FR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
