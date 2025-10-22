import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Download, TrendingDown, Filter, Search, Trash2, Columns } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { exportToExcel } from '@/lib/exportUtils';
import { useTenantInsert } from '@/hooks/use-tenant-insert';
import { useRealtime } from '@/hooks/use-realtime';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { useUserRole } from "@/hooks/use-user-role";

interface Expense {
  id: string;
  date_depense: string;
  type_depense: string;
  montant: number;
  mode_paiement: string;
  description: string;
  statut: string;
  vehicle_id?: string;
  contract_id?: string;
  fournisseur?: string;
  vehicles?: { immatriculation: string; ww?: string | null; marque: string; modele: string };
  contracts?: { numero_contrat: string };
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function Charges() {
  const { withTenantId } = useTenantInsert();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatut, setFilterStatut] = useState('all');
  const [filterVehicle, setFilterVehicle] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState({
    date: true,
    type: true,
    description: true,
    vehicule: true,
    fournisseur: true,
    montant: true,
    modePaiement: true,
    statut: true,
  });
  const { toast } = useToast();
  const { isAdmin } = useUserRole();

  const [formData, setFormData] = useState({
    date_depense: new Date().toISOString().split('T')[0],
    type_depense: 'autre',
    montant: '',
    mode_paiement: 'espece',
    description: '',
    statut: 'paye',
    fournisseur: '',
  });

  // Realtime pour auto-refresh quand une échéance est payée
  useRealtime({
    table: 'vehicules_traites_echeances',
    debounceMs: 3000,
    onUpdate: () => {
      console.log('[Charges] Échéance mise à jour, rechargement...');
      loadExpenses();
    },
  });

  useEffect(() => {
    loadExpenses();
    loadVehicles();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [expenses, searchTerm, filterType, filterStatut, filterVehicle]);

  const loadVehicles = async () => {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('id, immatriculation, ww, marque, modele')
        .order('immatriculation');

      if (error) throw error;
      setVehicles(data || []);
    } catch (error) {
      console.error('Error loading vehicles:', error);
    }
  };

  const loadExpenses = async () => {
    setLoading(true);
    try {
      // Charger les dépenses normales
      const { data: expensesData, error: expensesError } = await supabase
        .from('expenses')
        .select(`
          *,
          vehicles (immatriculation, ww, marque, modele),
          contracts (numero_contrat)
        `)
        .order('date_depense', { ascending: false });

      if (expensesError) throw expensesError;

      // Charger les traites de véhicules payées
      const { data: traitesData, error: traitesError } = await supabase
        .from('vehicules_traites_echeances')
        .select(`
          *,
          vehicules_traite!inner (
            vehicle_id,
            organisme
          ),
          vehicles!inner (
            immatriculation,
            ww,
            marque,
            modele
          )
        `)
        .eq('statut', 'Payée')
        .order('date_echeance', { ascending: false });

      if (traitesError) throw traitesError;

      // Formater les dépenses normales
      const formattedExpenses: Expense[] = (expensesData || []).map(e => ({
        id: e.id,
        date_depense: e.date_depense,
        type_depense: e.type_depense,
        montant: e.montant,
        mode_paiement: e.mode_paiement,
        description: e.description,
        statut: e.statut,
        vehicle_id: e.vehicle_id,
        contract_id: e.contract_id,
        fournisseur: e.fournisseur,
        vehicles: e.vehicles,
        contracts: e.contracts,
      }));

      // Formater les traites comme des dépenses
      const formattedTraites: Expense[] = (traitesData || []).map((t: any) => ({
        id: t.id,
        date_depense: t.date_paiement || t.date_echeance,
        type_depense: 'traite',
        montant: t.montant,
        mode_paiement: 'prelevement',
        description: `Traite véhicule - ${t.vehicules_traite?.organisme || ''}`,
        statut: 'paye',
        vehicle_id: t.vehicle_id,
        fournisseur: t.vehicules_traite?.organisme,
        vehicles: t.vehicles,
      }));

      // Combiner et trier toutes les dépenses
      const allExpenses = [...formattedExpenses, ...formattedTraites].sort((a, b) =>
        new Date(b.date_depense).getTime() - new Date(a.date_depense).getTime()
      );

      setExpenses(allExpenses);
    } catch (error) {
      console.error('Error loading expenses:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les dépenses",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...expenses];

    if (searchTerm) {
      filtered = filtered.filter(e =>
        e.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.fournisseur?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterType !== 'all') {
      filtered = filtered.filter(e => e.type_depense === filterType);
    }

    if (filterStatut !== 'all') {
      filtered = filtered.filter(e => e.statut === filterStatut);
    }

    if (filterVehicle !== 'all') {
      filtered = filtered.filter(e => e.vehicle_id === filterVehicle);
    }

    setFilteredExpenses(filtered);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('expenses')
        .insert([withTenantId({
          ...formData,
          montant: parseFloat(formData.montant),
        })]);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Dépense ajoutée avec succès",
      });
      setIsDialogOpen(false);
      setFormData({
        date_depense: new Date().toISOString().split('T')[0],
        type_depense: 'autre',
        montant: '',
        mode_paiement: 'espece',
        description: '',
        statut: 'paye',
        fournisseur: '',
      });
      loadExpenses();
    } catch (error) {
      console.error('Error adding expense:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter la dépense",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette dépense ?')) return;

    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Dépense supprimée",
      });
      loadExpenses();
    } catch (error) {
      console.error('Error deleting expense:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la dépense",
        variant: "destructive",
      });
    }
  };

  const getTotalByType = () => {
    const totals: Record<string, number> = {};
    filteredExpenses.forEach(e => {
      totals[e.type_depense] = (totals[e.type_depense] || 0) + e.montant;
    });
    return Object.entries(totals).map(([name, value]) => ({ name, value }));
  };

  const getTotalAmount = () => {
    return filteredExpenses.reduce((sum, e) => sum + e.montant, 0);
  };

  const exportData = () => {
    const exportData = filteredExpenses.map(e => ({
      'Date': e.date_depense,
      'Type': e.type_depense,
      'Montant (DH)': e.montant.toFixed(2),
      'Mode Paiement': e.mode_paiement,
      'Statut': e.statut,
      'Fournisseur': e.fournisseur || '',
      'Description': e.description,
    }));
    exportToExcel(exportData, 'charges');
  };

  const toggleColumn = (column: keyof typeof visibleColumns) => {
    setVisibleColumns(prev => ({
      ...prev,
      [column]: !prev[column]
    }));
  };

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Chargement...</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <TrendingDown className="w-6 h-6" />
            Charges & Dépenses
          </h1>
          <p className="text-sm text-muted-foreground">
            Gérez toutes vos dépenses et charges de l'agence
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportData}>
            <Download className="w-4 h-4 mr-2" />
            Exporter
          </Button>
          {isAdmin && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Nouvelle Dépense
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Ajouter une Dépense</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Date</Label>
                      <Input
                        type="date"
                        value={formData.date_depense}
                        onChange={(e) => setFormData({ ...formData, date_depense: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Type de dépense</Label>
                      <Select value={formData.type_depense} onValueChange={(value) => setFormData({ ...formData, type_depense: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="maintenance">Maintenance</SelectItem>
                          <SelectItem value="document">Document</SelectItem>
                          <SelectItem value="carburant">Carburant</SelectItem>
                          <SelectItem value="entretien">Entretien</SelectItem>
                          <SelectItem value="assurance">Assurance</SelectItem>
                          <SelectItem value="amende">Amende</SelectItem>
                          <SelectItem value="reparation">Réparation</SelectItem>
                          <SelectItem value="sous_location">🤝 Sous-location</SelectItem>
                          <SelectItem value="autre">Autre</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Montant (DH)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.montant}
                        onChange={(e) => setFormData({ ...formData, montant: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Mode de paiement</Label>
                      <Select value={formData.mode_paiement} onValueChange={(value) => setFormData({ ...formData, mode_paiement: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="espece">Espèce</SelectItem>
                          <SelectItem value="virement">Virement</SelectItem>
                          <SelectItem value="cheque">Chèque</SelectItem>
                          <SelectItem value="carte">Carte</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Statut</Label>
                      <Select value={formData.statut} onValueChange={(value) => setFormData({ ...formData, statut: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="paye">Payé</SelectItem>
                          <SelectItem value="en_attente">En attente</SelectItem>
                          <SelectItem value="recurrente">Récurrente</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Fournisseur</Label>
                      <Input
                        value={formData.fournisseur}
                        onChange={(e) => setFormData({ ...formData, fournisseur: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Détails de la dépense..."
                      required
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Annuler
                    </Button>
                    <Button type="submit">Ajouter</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total des Dépenses</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-destructive">
              {getTotalAmount().toFixed(2)} DH
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Nombre de Dépenses</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">{filteredExpenses.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">En Attente</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-orange-600">
              {filteredExpenses.filter(e => e.statut === 'en_attente').length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Graphique */}
      <Card>
        <CardHeader>
          <CardTitle>Répartition par Type</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={getTotalByType()}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {getTotalByType().map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filtres
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Rechercher</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Description, fournisseur..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="document">Document</SelectItem>
                  <SelectItem value="assurance">Assurance</SelectItem>
                  <SelectItem value="vignette">Vignette</SelectItem>
                  <SelectItem value="visite_technique">Visite technique</SelectItem>
                  <SelectItem value="traite">Traite</SelectItem>
                  <SelectItem value="carburant">Carburant</SelectItem>
                  <SelectItem value="entretien">Entretien</SelectItem>
                  <SelectItem value="amende">Amende</SelectItem>
                  <SelectItem value="reparation">Réparation</SelectItem>
                  <SelectItem value="sous_location">🤝 Sous-location</SelectItem>
                  <SelectItem value="autre">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Statut</Label>
              <Select value={filterStatut} onValueChange={setFilterStatut}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="paye">Payé</SelectItem>
                  <SelectItem value="en_attente">En attente</SelectItem>
                  <SelectItem value="recurrente">Récurrente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Véhicule</Label>
              <Select value={filterVehicle} onValueChange={setFilterVehicle}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les véhicules</SelectItem>
                  {vehicles.map((vehicle) => (
                    <SelectItem key={vehicle.id} value={vehicle.id}>
                      {vehicle.immatriculation || vehicle.ww || 'N/A'} - {vehicle.marque} {vehicle.modele}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tableau */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Liste des Dépenses</CardTitle>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon">
                <Columns className="w-4 h-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64">
              <div className="space-y-4">
                <h4 className="font-semibold text-sm">Colonnes visibles</h4>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="col-date"
                      checked={visibleColumns.date}
                      onCheckedChange={() => toggleColumn('date')}
                    />
                    <label htmlFor="col-date" className="text-sm cursor-pointer">Date</label>
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
                      id="col-description"
                      checked={visibleColumns.description}
                      onCheckedChange={() => toggleColumn('description')}
                    />
                    <label htmlFor="col-description" className="text-sm cursor-pointer">Description</label>
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
                      id="col-fournisseur"
                      checked={visibleColumns.fournisseur}
                      onCheckedChange={() => toggleColumn('fournisseur')}
                    />
                    <label htmlFor="col-fournisseur" className="text-sm cursor-pointer">Fournisseur</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="col-montant"
                      checked={visibleColumns.montant}
                      onCheckedChange={() => toggleColumn('montant')}
                    />
                    <label htmlFor="col-montant" className="text-sm cursor-pointer">Montant</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="col-modePaiement"
                      checked={visibleColumns.modePaiement}
                      onCheckedChange={() => toggleColumn('modePaiement')}
                    />
                    <label htmlFor="col-modePaiement" className="text-sm cursor-pointer">Mode Paiement</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="col-statut"
                      checked={visibleColumns.statut}
                      onCheckedChange={() => toggleColumn('statut')}
                    />
                    <label htmlFor="col-statut" className="text-sm cursor-pointer">Statut</label>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  {visibleColumns.date && <TableHead>Date</TableHead>}
                  {visibleColumns.type && <TableHead>Type</TableHead>}
                  {visibleColumns.description && <TableHead>Description</TableHead>}
                  {visibleColumns.vehicule && <TableHead>Véhicule</TableHead>}
                  {visibleColumns.fournisseur && <TableHead>Fournisseur</TableHead>}
                  {visibleColumns.montant && <TableHead className="text-right">Montant</TableHead>}
                  {visibleColumns.modePaiement && <TableHead>Mode Paiement</TableHead>}
                  {visibleColumns.statut && <TableHead>Statut</TableHead>}
                  {isAdmin && <TableHead>Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExpenses.map((expense) => (
                  <TableRow key={expense.id}>
                    {visibleColumns.date && <TableCell>{expense.date_depense}</TableCell>}
                    {visibleColumns.type && (
                      <TableCell className="capitalize">
                        {expense.type_depense === 'sous_location' ? '🤝 ' : ''}
                        {expense.type_depense}
                      </TableCell>
                    )}
                    {visibleColumns.description && <TableCell>{expense.description}</TableCell>}
                    {visibleColumns.vehicule && (
                      <TableCell>
                        {expense.vehicles ? (
                          <div className="text-sm">
                            <div className="font-medium">
                              {expense.vehicles.immatriculation || expense.vehicles.ww || 'N/A'}
                            </div>
                            <div className="text-muted-foreground text-xs">
                              {expense.vehicles.marque} {expense.vehicles.modele}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    )}
                    {visibleColumns.fournisseur && <TableCell>{expense.fournisseur || '-'}</TableCell>}
                    {visibleColumns.montant && (
                      <TableCell className="text-right font-medium">
                        {expense.montant.toFixed(2)} DH
                      </TableCell>
                    )}
                    {visibleColumns.modePaiement && <TableCell className="capitalize">{expense.mode_paiement}</TableCell>}
                    {visibleColumns.statut && (
                      <TableCell>
                        <Badge variant={expense.statut === 'paye' ? 'default' : expense.statut === 'en_attente' ? 'secondary' : 'outline'}>
                          {expense.statut === 'paye' ? 'Payé' : 
                           expense.statut === 'en_attente' ? 'En attente' : 'Récurrente'}
                        </Badge>
                      </TableCell>
                    )}
                    {isAdmin && (
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(expense.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
