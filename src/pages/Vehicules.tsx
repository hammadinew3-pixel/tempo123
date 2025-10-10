import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Download, Plus, Edit, Trash2, Eye, X, Columns } from "lucide-react";
import { Button } from "@/components/ui/button";
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
type Vehicle = Database['public']['Tables']['vehicles']['Row'];
type VehicleInsert = Database['public']['Tables']['vehicles']['Insert'];
export default function Vehicules() {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [assurances, setAssurances] = useState<Array<{
    id: string;
    nom: string;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<'tous' | 'hors_service' | 'sous_location' | 'disponible' | 'loue' | 'reserve' | 'en_panne'>('tous');
  const [filterPopoverOpen, setFilterPopoverOpen] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({
    searchText: '',
    marques: [] as string[],
    categories: [] as string[],
    assurances: [] as string[],
    kmMin: '',
    kmMax: '',
    prixMin: '',
    prixMax: '',
    dateMin: '',
    dateMax: ''
  });
  const [visibleColumns, setVisibleColumns] = useState({
    marqueModele: true,
    matricule: true,
    etat: true,
    kilometrage: true,
    prixLocation: true,
    creeLe: true,
  });
  const {
    toast
  } = useToast();

  // Form state
  const [formData, setFormData] = useState<Partial<VehicleInsert>>({
    immatriculation: '',
    marque: '',
    modele: '',
    annee: new Date().getFullYear(),
    kilometrage: 0,
    statut: 'disponible',
    tarif_journalier: 0,
    valeur_achat: 0
  });
  useEffect(() => {
    loadVehicles();
    loadAssurances();
  }, []);
  const loadAssurances = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('assurances').select('id, nom').eq('actif', true).order('nom');
      if (error) throw error;
      setAssurances(data || []);
    } catch (error: any) {
      console.error('Error loading assurances:', error);
    }
  };
  const loadVehicles = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('vehicles').select(`
          *,
          vehicle_insurance (
            id,
            assureur
          )
        `).order('created_at', {
        ascending: false
      });
      if (error) throw error;
      setVehicles(data || []);
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingVehicle) {
        const {
          error
        } = await supabase.from('vehicles').update(formData).eq('id', editingVehicle.id);
        if (error) throw error;
        toast({
          title: 'Succès',
          description: 'Véhicule modifié avec succès'
        });
      } else {
        const {
          error
        } = await supabase.from('vehicles').insert([formData as VehicleInsert]);
        if (error) throw error;
        toast({
          title: 'Succès',
          description: 'Véhicule ajouté avec succès'
        });
      }
      setIsDialogOpen(false);
      resetForm();
      loadVehicles();
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };
  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce véhicule ?')) return;
    try {
      const {
        error
      } = await supabase.from('vehicles').delete().eq('id', id);
      if (error) throw error;
      toast({
        title: 'Succès',
        description: 'Véhicule supprimé'
      });
      loadVehicles();
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive'
      });
    }
  };
  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Êtes-vous sûr de vouloir supprimer ${selectedIds.size} véhicule(s) ?`)) return;
    try {
      const {
        error
      } = await supabase.from('vehicles').delete().in('id', Array.from(selectedIds));
      if (error) throw error;
      toast({
        title: 'Succès',
        description: `${selectedIds.size} véhicule(s) supprimé(s)`
      });
      setSelectedIds(new Set());
      loadVehicles();
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive'
      });
    }
  };
  const toggleSelectAll = () => {
    if (selectedIds.size === vehicles.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(vehicles.map(v => v.id)));
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
      immatriculation: '',
      marque: '',
      modele: '',
      annee: new Date().getFullYear(),
      kilometrage: 0,
      statut: 'disponible',
      tarif_journalier: 0,
      valeur_achat: 0
    });
    setEditingVehicle(null);
  };
  const openEditDialog = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setFormData(vehicle);
    setIsDialogOpen(true);
  };
  const getStatusBadge = (vehicle: Vehicle) => {
    // Si le véhicule est hors service, afficher "Hors service"
    if (vehicle.en_service === false) {
      return <Badge variant="outline" className="bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20 font-medium">
        Hors service
      </Badge>;
    }

    const status = vehicle.statut;
    const styles: Record<string, string> = {
      disponible: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
      loue: 'bg-primary/10 text-primary border-primary/20',
      reserve: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
      en_panne: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
    };
    const labels: Record<string, string> = {
      disponible: 'Libre',
      loue: 'En circulation',
      reserve: 'Réservé',
      en_panne: 'En panne'
    };
    return <Badge variant="outline" className={`${styles[status]} font-medium`}>
        {labels[status]}
      </Badge>;
  };
  const needsOilChange = (vehicle: Vehicle) => {
    // Si un prochain kilométrage est défini, utiliser celui-ci
    if (vehicle.prochain_kilometrage_vidange) {
      return vehicle.kilometrage >= vehicle.prochain_kilometrage_vidange;
    }
    // Sinon, utiliser le calcul automatique (8000 km)
    const kmDepuis = vehicle.kilometrage - (vehicle.dernier_kilometrage_vidange || 0);
    return kmDepuis > 8000;
  };
  const getOilChangeAlertLevel = (vehicle: Vehicle) => {
    // Si un prochain kilométrage est défini, utiliser celui-ci
    if (vehicle.prochain_kilometrage_vidange) {
      const kmRestants = vehicle.prochain_kilometrage_vidange - vehicle.kilometrage;
      if (kmRestants <= 0) return 'critical'; // Dépassé
      if (kmRestants <= 1000) return 'warning'; // Moins de 1000 km
      return 'ok';
    }
    // Sinon, utiliser le calcul automatique
    const kmDepuis = vehicle.kilometrage - (vehicle.dernier_kilometrage_vidange || 0);
    if (kmDepuis > 10000) return 'critical';
    if (kmDepuis > 8000) return 'warning';
    return 'ok';
  };
  const filteredVehicles = vehicles.filter(vehicle => {
    // Filtres de statut
    if (filter === 'hors_service' && vehicle.en_service !== false) return false;
    if (filter === 'sous_location' && vehicle.sous_location !== true) return false;
    if (filter === 'disponible' && vehicle.statut !== 'disponible') return false;
    if (filter === 'loue' && vehicle.statut !== 'loue') return false;
    if (filter === 'reserve' && vehicle.statut !== 'reserve') return false;
    if (filter === 'en_panne' && vehicle.statut !== 'en_panne') return false;

    // Recherche par mot-clé
    if (advancedFilters.searchText) {
      const searchLower = advancedFilters.searchText.toLowerCase();
      const matchesSearch = vehicle.immatriculation?.toLowerCase().includes(searchLower) || vehicle.marque?.toLowerCase().includes(searchLower) || vehicle.modele?.toLowerCase().includes(searchLower) || vehicle.categorie?.toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;
    }

    // Filtres marques
    if (advancedFilters.marques.length > 0 && !advancedFilters.marques.includes(vehicle.marque)) return false;

    // Filtres catégories
    if (advancedFilters.categories.length > 0 && vehicle.categorie && !advancedFilters.categories.includes(vehicle.categorie)) return false;

    // Filtre d'assurance
    if (advancedFilters.assurances.length > 0) {
      const vehicleInsurance = (vehicle as any).vehicle_insurance;
      if (!vehicleInsurance || vehicleInsurance.length === 0) return false;
      const hasMatchingInsurance = advancedFilters.assurances.some(assuranceId => {
        const assuranceMatch = assurances.find(a => a.id === assuranceId);
        if (!assuranceMatch) return false;
        return vehicleInsurance.some((ins: any) => ins.assureur === assuranceMatch.nom);
      });
      if (!hasMatchingInsurance) return false;
    }

    // Filtre kilométrage
    if (advancedFilters.kmMin && vehicle.kilometrage < parseInt(advancedFilters.kmMin)) return false;
    if (advancedFilters.kmMax && vehicle.kilometrage > parseInt(advancedFilters.kmMax)) return false;

    // Filtre prix journalier
    if (advancedFilters.prixMin && vehicle.tarif_journalier < parseFloat(advancedFilters.prixMin)) return false;
    if (advancedFilters.prixMax && vehicle.tarif_journalier > parseFloat(advancedFilters.prixMax)) return false;

    // Filtre date d'ajout
    if (advancedFilters.dateMin) {
      const vehicleDate = new Date(vehicle.created_at);
      const minDate = new Date(advancedFilters.dateMin);
      if (vehicleDate < minDate) return false;
    }
    if (advancedFilters.dateMax) {
      const vehicleDate = new Date(vehicle.created_at);
      const maxDate = new Date(advancedFilters.dateMax);
      maxDate.setHours(23, 59, 59, 999);
      if (vehicleDate > maxDate) return false;
    }
    return true;
  });

  // Extraire les valeurs uniques pour les filtres
  const uniqueMarques = Array.from(new Set(vehicles.map(v => v.marque).filter(Boolean))).sort();
  const uniqueCategories = Array.from(new Set(vehicles.map(v => v.categorie).filter(Boolean))).sort();
  const resetAdvancedFilters = () => {
    setAdvancedFilters({
      searchText: '',
      marques: [],
      categories: [],
      assurances: [],
      kmMin: '',
      kmMax: '',
      prixMin: '',
      prixMax: '',
      dateMin: '',
      dateMax: ''
    });
  };
  const hasActiveFilters = advancedFilters.searchText || advancedFilters.marques.length > 0 || advancedFilters.categories.length > 0 || advancedFilters.assurances.length > 0 || advancedFilters.kmMin || advancedFilters.kmMax || advancedFilters.prixMin || advancedFilters.prixMax || advancedFilters.dateMin || advancedFilters.dateMax;
  const toggleMarque = (marque: string) => {
    setAdvancedFilters(prev => ({
      ...prev,
      marques: prev.marques.includes(marque) ? prev.marques.filter(m => m !== marque) : [...prev.marques, marque]
    }));
  };
  const toggleCategorie = (categorie: string) => {
    setAdvancedFilters(prev => ({
      ...prev,
      categories: prev.categories.includes(categorie) ? prev.categories.filter(c => c !== categorie) : [...prev.categories, categorie]
    }));
  };
  const toggleAssurance = (assuranceId: string) => {
    setAdvancedFilters(prev => ({
      ...prev,
      assurances: prev.assurances.includes(assuranceId) ? prev.assurances.filter(a => a !== assuranceId) : [...prev.assurances, assuranceId]
    }));
  };
  const toggleColumn = (column: keyof typeof visibleColumns) => {
    setVisibleColumns(prev => ({ ...prev, [column]: !prev[column] }));
  };
  const countHorsService = vehicles.filter(v => v.en_service === false).length;
  const countSousLocation = vehicles.filter(v => v.sous_location === true).length;
  const countDisponible = vehicles.filter(v => v.statut === 'disponible' && v.en_service !== false).length;
  const countLoue = vehicles.filter(v => v.statut === 'loue' && v.en_service !== false).length;
  const countReserve = vehicles.filter(v => v.statut === 'reserve' && v.en_service !== false).length;
  const countEnPanne = vehicles.filter(v => v.statut === 'en_panne' && v.en_service !== false).length;
  return <div className="space-y-4 md:space-y-6 p-3 md:p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground">Liste des véhicules</h1>
          <p className="text-xs md:text-sm text-muted-foreground">Gérez votre flotte de véhicules</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Popover open={filterPopoverOpen} onOpenChange={setFilterPopoverOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="flex-1 sm:flex-none text-xs md:text-sm relative">
                <Filter className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                <span className="hidden sm:inline">FILTRER</span>
                <span className="sm:hidden">Filtrer</span>
                {hasActiveFilters && <Badge className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center" variant="destructive">
                    !
                  </Badge>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[600px] max-w-[90vw] bg-background p-6" align="start">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Filtrer les véhicules</h3>
                
                {/* Recherche par mot-clé */}
                <div className="space-y-2">
                  <Label className="text-sm text-primary">Recherche par un Mot-clé</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input placeholder="Matricule, Marque, Modèle, Catégorie, ..." value={advancedFilters.searchText} onChange={e => setAdvancedFilters({
                    ...advancedFilters,
                    searchText: e.target.value
                  })} className="pl-10 h-12 border-primary" />
                  </div>
                </div>

                {/* Marques - Multi-select avec checkboxes */}
                <div className="space-y-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-between h-12 font-normal">
                        <span className={advancedFilters.marques.length === 0 ? "text-muted-foreground" : ""}>
                          {advancedFilters.marques.length === 0 ? "Sélectionnez une ou plusieurs marque" : `${advancedFilters.marques.length} marque(s) sélectionnée(s)`}
                        </span>
                        <Filter className="w-4 h-4 ml-2" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-3 bg-background z-50">
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {uniqueMarques.map(marque => <div key={marque} className="flex items-center space-x-2">
                            <Checkbox id={`marque-${marque}`} checked={advancedFilters.marques.includes(marque)} onCheckedChange={() => toggleMarque(marque)} />
                            <label htmlFor={`marque-${marque}`} className="text-sm cursor-pointer flex-1">
                              {marque}
                            </label>
                          </div>)}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Catégories - Multi-select avec checkboxes */}
                <div className="space-y-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-between h-12 font-normal">
                        <span className={advancedFilters.categories.length === 0 ? "text-muted-foreground" : ""}>
                          {advancedFilters.categories.length === 0 ? "Sélectionnez une ou plusieurs catégorie" : `${advancedFilters.categories.length} catégorie(s) sélectionnée(s)`}
                        </span>
                        <Filter className="w-4 h-4 ml-2" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-3 bg-background z-50">
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {uniqueCategories.map(categorie => <div key={categorie} className="flex items-center space-x-2">
                            <Checkbox id={`categorie-${categorie}`} checked={advancedFilters.categories.includes(categorie)} onCheckedChange={() => toggleCategorie(categorie)} />
                            <label htmlFor={`categorie-${categorie}`} className="text-sm cursor-pointer flex-1">
                              {categorie}
                            </label>
                          </div>)}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Assurances - Multi-select avec checkboxes */}
                <div className="space-y-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-3 bg-background z-50">
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {assurances.map(assurance => <div key={assurance.id} className="flex items-center space-x-2">
                            <Checkbox id={`assurance-${assurance.id}`} checked={advancedFilters.assurances.includes(assurance.id)} onCheckedChange={() => toggleAssurance(assurance.id)} />
                            <label htmlFor={`assurance-${assurance.id}`} className="text-sm cursor-pointer flex-1">
                              {assurance.nom}
                            </label>
                          </div>)}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Kilométrage */}
                

                {/* Prix journalier */}
                

                {/* Dates d'ajout */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    
                  </div>
                  <div className="space-y-2">
                    
                  </div>
                </div>

                {/* Boutons */}
                <div className="flex justify-end gap-3 pt-2">
                  <Button variant="ghost" onClick={() => {
                  resetAdvancedFilters();
                  setFilterPopoverOpen(false);
                }} className="text-primary font-semibold">
                    ANNULER
                  </Button>
                  <Button onClick={() => setFilterPopoverOpen(false)} className="font-semibold">
                    APPLIQUER
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="flex-1 sm:flex-none text-xs md:text-sm">
                <Columns className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                <span className="hidden sm:inline">COLONNES</span>
                <span className="sm:hidden">Colonnes</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64" align="end">
              <div className="space-y-3">
                <h4 className="font-medium text-sm">Afficher les colonnes</h4>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="col-marque"
                      checked={visibleColumns.marqueModele}
                      onCheckedChange={() => toggleColumn('marqueModele')}
                    />
                    <label htmlFor="col-marque" className="text-sm cursor-pointer">Marque/Modèle</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="col-matricule"
                      checked={visibleColumns.matricule}
                      onCheckedChange={() => toggleColumn('matricule')}
                    />
                    <label htmlFor="col-matricule" className="text-sm cursor-pointer">Matricule</label>
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
                      id="col-km"
                      checked={visibleColumns.kilometrage}
                      onCheckedChange={() => toggleColumn('kilometrage')}
                    />
                    <label htmlFor="col-km" className="text-sm cursor-pointer">Kilométrage</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="col-prix"
                      checked={visibleColumns.prixLocation}
                      onCheckedChange={() => toggleColumn('prixLocation')}
                    />
                    <label htmlFor="col-prix" className="text-sm cursor-pointer">Prix location</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="col-cree"
                      checked={visibleColumns.creeLe}
                      onCheckedChange={() => toggleColumn('creeLe')}
                    />
                    <label htmlFor="col-cree" className="text-sm cursor-pointer">Créé le</label>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          <Button variant="outline" size="sm" className="flex-1 sm:flex-none text-xs md:text-sm">
            <Download className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
            <span className="hidden sm:inline">IMPORTER</span>
            <span className="sm:hidden">Import</span>
          </Button>
          <Button size="sm" onClick={() => navigate('/vehicules/nouveau')} className="w-full sm:w-auto text-xs md:text-sm">
            <Plus className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
            <span className="hidden sm:inline">Nouveau véhicule</span>
            <span className="sm:hidden">Nouveau</span>
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={open => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto hidden">
              <DialogHeader>
                <DialogTitle>{editingVehicle ? 'Modifier' : 'Ajouter'} un véhicule</DialogTitle>
                <DialogDescription>
                  Remplissez les informations du véhicule
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="immatriculation">Immatriculation *</Label>
                    <Input id="immatriculation" value={formData.immatriculation} onChange={e => setFormData({
                    ...formData,
                    immatriculation: e.target.value
                  })} placeholder="A-12345-B" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="marque">Marque *</Label>
                    <Input id="marque" value={formData.marque} onChange={e => setFormData({
                    ...formData,
                    marque: e.target.value
                  })} placeholder="Dacia" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="modele">Modèle *</Label>
                    <Input id="modele" value={formData.modele} onChange={e => setFormData({
                    ...formData,
                    modele: e.target.value
                  })} placeholder="Sandero" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="annee">Année *</Label>
                    <Input id="annee" type="number" value={formData.annee} onChange={e => setFormData({
                    ...formData,
                    annee: parseInt(e.target.value)
                  })} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="kilometrage">Kilométrage</Label>
                    <Input id="kilometrage" type="number" value={formData.kilometrage} onChange={e => setFormData({
                    ...formData,
                    kilometrage: parseInt(e.target.value)
                  })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="statut">Statut</Label>
                    <Select value={formData.statut} onValueChange={value => setFormData({
                    ...formData,
                    statut: value as any
                  })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="disponible">Disponible</SelectItem>
                        <SelectItem value="loue">Loué</SelectItem>
                        <SelectItem value="reserve">Réservé</SelectItem>
                        <SelectItem value="en_panne">En panne</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tarif">Tarif journalier (MAD) *</Label>
                    <Input id="tarif" type="number" step="0.01" value={formData.tarif_journalier} onChange={e => setFormData({
                    ...formData,
                    tarif_journalier: parseFloat(e.target.value)
                  })} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="valeur">Valeur d'achat (MAD)</Label>
                    <Input id="valeur" type="number" step="0.01" value={formData.valeur_achat || ''} onChange={e => setFormData({
                    ...formData,
                    valeur_achat: parseFloat(e.target.value) || undefined
                  })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="assurance">Assurance expire le</Label>
                    <Input id="assurance" type="date" value={formData.assurance_expire_le || ''} onChange={e => setFormData({
                    ...formData,
                    assurance_expire_le: e.target.value || null
                  })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vignette">Vignette expire le</Label>
                    <Input id="vignette" type="date" value={formData.vignette_expire_le || ''} onChange={e => setFormData({
                    ...formData,
                    vignette_expire_le: e.target.value || null
                  })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="visite">Visite technique expire le</Label>
                    <Input id="visite" type="date" value={formData.visite_technique_expire_le || ''} onChange={e => setFormData({
                    ...formData,
                    visite_technique_expire_le: e.target.value || null
                  })} />
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => {
                  setIsDialogOpen(false);
                  resetForm();
                }}>
                    Annuler
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Enregistrement...' : 'Enregistrer'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="border-l-4 border-l-primary shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="space-y-4 p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 md:gap-6 text-xs md:text-sm font-medium overflow-x-auto">
              <button onClick={() => setFilter('tous')} className={`pb-2 transition-colors whitespace-nowrap ${filter === 'tous' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-primary'}`}>
                TOUS ({vehicles.length})
              </button>
              <button onClick={() => setFilter('disponible')} className={`pb-2 transition-colors whitespace-nowrap ${filter === 'disponible' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-primary'}`}>
                DISPONIBLE ({countDisponible})
              </button>
              <button onClick={() => setFilter('loue')} className={`pb-2 transition-colors whitespace-nowrap ${filter === 'loue' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-primary'}`}>
                LOUÉ ({countLoue})
              </button>
              <button onClick={() => setFilter('reserve')} className={`pb-2 transition-colors whitespace-nowrap ${filter === 'reserve' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-primary'}`}>
                RÉSERVÉ ({countReserve})
              </button>
              <button onClick={() => setFilter('en_panne')} className={`pb-2 transition-colors whitespace-nowrap ${filter === 'en_panne' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-primary'}`}>
                EN PANNE ({countEnPanne})
              </button>
              <button onClick={() => setFilter('hors_service')} className={`pb-2 transition-colors whitespace-nowrap ${filter === 'hors_service' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-primary'}`}>
                HORS SERVICE ({countHorsService})
              </button>
              <button onClick={() => setFilter('sous_location')} className={`pb-2 transition-colors whitespace-nowrap ${filter === 'sous_location' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-primary'}`}>
                SOUS LOCATION ({countSousLocation})
              </button>
            </div>
            {selectedIds.size > 0 && <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
                <Trash2 className="w-4 h-4 mr-2" />
                Supprimer ({selectedIds.size})
              </Button>}
          </div>
        </CardHeader>
        <CardContent className="p-0 md:p-6">
          {loading ? <p className="text-center text-muted-foreground py-8 text-sm">Chargement...</p> : vehicles.length === 0 ? <p className="text-center text-muted-foreground py-8 px-4 text-sm">
              Aucun véhicule. Cliquez sur "Nouveau véhicule" pour commencer.
            </p> : <>
              {/* Vue mobile - Cards */}
              <div className="block lg:hidden space-y-3 p-3">
                {filteredVehicles.map(vehicle => <Card key={vehicle.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(`/vehicules/${vehicle.id}`)}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3 flex-1">
                          <div onClick={e => e.stopPropagation()}>
                            <Checkbox checked={selectedIds.has(vehicle.id)} onCheckedChange={() => toggleSelect(vehicle.id)} />
                          </div>
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-medium text-primary">{vehicle.marque.charAt(0)}</span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-semibold text-foreground truncate">{vehicle.marque} {vehicle.modele}</div>
                            <div className="text-xs text-muted-foreground">{vehicle.immatriculation}</div>
                          </div>
                        </div>
                        <div className="flex flex-col gap-1">
                          {getStatusBadge(vehicle)}
                          {needsOilChange(vehicle) && <Badge variant="outline" className={`${getOilChangeAlertLevel(vehicle) === 'critical' ? 'bg-red-500/10 text-red-600 border-red-500/20' : 'bg-orange-500/10 text-orange-600 border-orange-500/20'} text-xs`}>
                              🛠️ Vidange
                            </Badge>}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                        <div>
                          <span className="text-muted-foreground">Kilométrage:</span>
                          <div className="font-medium">{vehicle.kilometrage.toLocaleString()} km</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Prix/jour:</span>
                          <div className="font-medium">{vehicle.tarif_journalier.toFixed(2)} MAD</div>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-3 border-t">
                        <Button variant="outline" size="sm" onClick={e => {
                    e.stopPropagation();
                    navigate(`/vehicules/${vehicle.id}`);
                  }} className="flex-1 text-xs">
                          <Eye className="w-3 h-3 mr-1" />
                          Voir
                        </Button>
                        <Button variant="outline" size="sm" onClick={e => {
                    e.stopPropagation();
                    navigate(`/vehicules/${vehicle.id}/modifier`);
                  }} className="flex-1 text-xs">
                          <Edit className="w-3 h-3 mr-1" />
                          Modifier
                        </Button>
                        <Button variant="outline" size="sm" onClick={e => {
                    e.stopPropagation();
                    handleDelete(vehicle.id);
                  }} className="text-xs">
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>)}
              </div>

              {/* Vue desktop - Tableau */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-sm text-muted-foreground border-b">
                      <th className="pb-3 pl-4 font-medium w-12">
                        <Checkbox checked={selectedIds.size > 0 && selectedIds.size === filteredVehicles.length} onCheckedChange={toggleSelectAll} />
                      </th>
                    <th className="pb-3 font-medium">Actions</th>
                    {visibleColumns.marqueModele && <th className="pb-3 font-medium">Marque/Modèle</th>}
                    {visibleColumns.matricule && <th className="pb-3 font-medium">Matricule</th>}
                    {visibleColumns.etat && <th className="pb-3 font-medium">État</th>}
                    {visibleColumns.kilometrage && <th className="pb-3 font-medium">Kilométrage</th>}
                    {visibleColumns.prixLocation && <th className="pb-3 font-medium">Prix location</th>}
                    {visibleColumns.creeLe && <th className="pb-3 font-medium">Créé le</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredVehicles.map(vehicle => <tr key={vehicle.id} className="border-b last:border-0 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate(`/vehicules/${vehicle.id}`)}>
                        <td className="py-4 pl-4" onClick={e => e.stopPropagation()}>
                          <Checkbox checked={selectedIds.has(vehicle.id)} onCheckedChange={() => toggleSelect(vehicle.id)} />
                        </td>
                        <td className="py-4">
                          <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                            <Button variant="ghost" size="sm" onClick={e => {
                        e.stopPropagation();
                        navigate(`/vehicules/${vehicle.id}`);
                      }} className="hover:bg-accent transition-colors" title="Afficher les détails">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={e => {
                        e.stopPropagation();
                        navigate(`/vehicules/${vehicle.id}/modifier`);
                      }} className="hover:bg-accent transition-colors" title="Modifier">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={e => {
                        e.stopPropagation();
                        handleDelete(vehicle.id);
                      }} className="hover:bg-accent transition-colors" title="Supprimer">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                        {visibleColumns.marqueModele && (
                          <td className="py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <span className="text-xs font-medium text-primary">{vehicle.marque.charAt(0)}</span>
                              </div>
                              <div>
                                <div className="font-medium text-foreground">{vehicle.marque} {vehicle.modele}</div>
                                <div className="text-xs text-muted-foreground">Cat. {vehicle.categorie || 'Mixte'}</div>
                              </div>
                            </div>
                          </td>
                        )}
                        {visibleColumns.matricule && (
                          <td className="py-4 font-semibold text-foreground">{vehicle.immatriculation}</td>
                        )}
                        {visibleColumns.etat && (
                          <td className="py-4">
                            <div className="flex flex-col gap-1">
                              {getStatusBadge(vehicle)}
                              {needsOilChange(vehicle) && <Badge variant="outline" className={`${getOilChangeAlertLevel(vehicle) === 'critical' ? 'bg-red-500/10 text-red-600 border-red-500/20' : 'bg-orange-500/10 text-orange-600 border-orange-500/20'} text-xs`}>
                                  🛠️ Vidange à faire
                                </Badge>}
                            </div>
                          </td>
                        )}
                        {visibleColumns.kilometrage && (
                          <td className="py-4 text-foreground">{vehicle.kilometrage.toLocaleString()} km</td>
                        )}
                        {visibleColumns.prixLocation && (
                          <td className="py-4 font-medium text-foreground">{vehicle.tarif_journalier.toFixed(2)} MAD</td>
                        )}
                        {visibleColumns.creeLe && (
                          <td className="py-4 text-muted-foreground text-xs">
                            {new Date(vehicle.created_at).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                      })}
                          </td>
                        )}
                      </tr>)}
                  </tbody>
                </table>
              </div>
            </>}
        </CardContent>
      </Card>
    </div>;
}