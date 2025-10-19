import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Download, TrendingUp, Filter, Search, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { exportToExcel } from '@/lib/exportUtils';
import { useTenantInsert } from '@/hooks/use-tenant-insert';
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
import { useUserRole } from "@/hooks/use-user-role";
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Revenue {
  id: string;
  date_encaissement: string;
  source_revenu: string;
  montant: number;
  mode_paiement: string;
  statut: string;
  client_id?: string;
  contract_id?: string;
  note?: string;
  num_dossier?: string;
  vehicle_id?: string;
  clients?: { nom: string; prenom: string };
  contracts?: { numero_contrat: string };
  vehicles?: { immatriculation: string; marque: string; modele: string };
}

export default function Revenus() {
  const { withTenantId } = useTenantInsert();
  const [revenues, setRevenues] = useState<Revenue[]>([]);
  const [filteredRevenues, setFilteredRevenues] = useState<Revenue[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSource, setFilterSource] = useState('all');
  const [filterStatut, setFilterStatut] = useState('all');
  const [filterPeriod, setFilterPeriod] = useState('all');
  const [filterVehicle, setFilterVehicle] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const { isAdmin } = useUserRole();

  const [formData, setFormData] = useState({
    date_encaissement: new Date().toISOString().split('T')[0],
    source_revenu: 'contrat',
    montant: '',
    mode_paiement: 'espece',
    statut: 'paye',
    note: '',
  });

  useEffect(() => {
    loadRevenues();
    loadVehicles();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [revenues, searchTerm, filterSource, filterStatut, filterPeriod, filterVehicle]);

  const loadVehicles = async () => {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('id, immatriculation, marque, modele')
        .order('immatriculation');

      if (error) throw error;
      setVehicles(data || []);
    } catch (error) {
      console.error('Error loading vehicles:', error);
    }
  };

  const loadRevenues = async () => {
    setLoading(true);
    try {
      // Charger les revenus manuels
      const { data: revenusData, error: revenusError } = await supabase
        .from('revenus')
        .select(`
          *,
          clients (nom, prenom),
          contracts (numero_contrat, vehicle_id, vehicles (immatriculation, marque, modele))
        `)
        .order('date_encaissement', { ascending: false });

      if (revenusError) throw revenusError;

      // Charger les paiements de contrats
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('contract_payments')
        .select(`
          *,
          contracts!inner (
            numero_contrat,
            vehicle_id,
            clients (nom, prenom),
            vehicles (immatriculation, marque, modele)
          )
        `)
        .order('date_paiement', { ascending: false });

      if (paymentsError) throw paymentsError;

      // Charger les paiements d'assistance (seulement ceux qui sont payés)
      const { data: assistanceData, error: assistanceError } = await supabase
        .from('assistance')
        .select(`
          *,
          clients (nom, prenom),
          vehicles (immatriculation, marque, modele)
        `)
        .neq('montant_paye', 0)
        .not('montant_paye', 'is', null)
        .neq('etat_paiement', 'en_attente')
        .order('date_debut', { ascending: false });

      if (assistanceError) throw assistanceError;

      // Formater les revenus manuels
      const formattedRevenus: Revenue[] = (revenusData || []).map(r => ({
        id: r.id,
        date_encaissement: r.date_encaissement,
        source_revenu: r.source_revenu,
        montant: r.montant,
        mode_paiement: r.mode_paiement,
        statut: r.statut,
        client_id: r.client_id,
        contract_id: r.contract_id,
        vehicle_id: r.contracts?.vehicle_id,
        note: r.note,
        clients: r.clients,
        contracts: r.contracts,
        vehicles: r.contracts?.vehicles,
      }));

      // Formater les paiements de contrats comme des revenus
      const formattedPayments: Revenue[] = (paymentsData || []).map((p: any) => ({
        id: p.id,
        date_encaissement: p.date_paiement,
        source_revenu: 'contrat',
        montant: p.montant,
        mode_paiement: p.methode || 'espece',
        statut: 'paye',
        contract_id: p.contract_id,
        vehicle_id: p.contracts?.vehicle_id,
        note: `Paiement contrat ${p.contracts?.numero_contrat || ''}`,
        clients: p.contracts?.clients,
        contracts: { numero_contrat: p.contracts?.numero_contrat },
        vehicles: p.contracts?.vehicles,
      }));

      // Formater les paiements d'assistance comme des revenus
      const formattedAssistance: Revenue[] = (assistanceData || []).map((a: any) => ({
        id: a.id,
        date_encaissement: a.date_debut,
        source_revenu: 'assistance',
        montant: a.montant_paye,
        mode_paiement: 'virement',
        statut: a.etat_paiement === 'paye' ? 'paye' : 'partiel',
        client_id: a.client_id,
        vehicle_id: a.vehicle_id,
        num_dossier: a.num_dossier,
        note: `Paiement assistance ${a.num_dossier || ''}`,
        clients: a.clients,
        contracts: null,
        vehicles: a.vehicles,
      }));

      // Combiner et trier tous les revenus
      const allRevenues = [...formattedRevenus, ...formattedPayments, ...formattedAssistance].sort((a, b) =>
        new Date(b.date_encaissement).getTime() - new Date(a.date_encaissement).getTime()
      );

      setRevenues(allRevenues);
    } catch (error) {
      console.error('Error loading revenues:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les revenus",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...revenues];

    if (searchTerm) {
      filtered = filtered.filter(r =>
        r.note?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.clients?.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.contracts?.numero_contrat.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterSource !== 'all') {
      filtered = filtered.filter(r => r.source_revenu === filterSource);
    }

    if (filterStatut !== 'all') {
      filtered = filtered.filter(r => r.statut === filterStatut);
    }

    if (filterVehicle !== 'all') {
      filtered = filtered.filter(r => r.vehicle_id === filterVehicle);
    }

    if (filterPeriod !== 'all') {
      const now = new Date();
      const startOfPeriod = new Date();
      
      if (filterPeriod === 'month') {
        startOfPeriod.setMonth(now.getMonth());
        startOfPeriod.setDate(1);
      } else if (filterPeriod === 'week') {
        startOfPeriod.setDate(now.getDate() - 7);
      }
      
      filtered = filtered.filter(r => new Date(r.date_encaissement) >= startOfPeriod);
    }

    setFilteredRevenues(filtered);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('revenus')
        .insert([withTenantId({
          ...formData,
          montant: parseFloat(formData.montant),
        })]);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Revenu ajouté avec succès",
      });
      setIsDialogOpen(false);
      setFormData({
        date_encaissement: new Date().toISOString().split('T')[0],
        source_revenu: 'contrat',
        montant: '',
        mode_paiement: 'espece',
        statut: 'paye',
        note: '',
      });
      loadRevenues();
    } catch (error) {
      console.error('Error adding revenue:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter le revenu",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce revenu ?')) return;

    try {
      const { error } = await supabase
        .from('revenus')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Revenu supprimé",
      });
      loadRevenues();
    } catch (error) {
      console.error('Error deleting revenue:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le revenu",
        variant: "destructive",
      });
    }
  };

  const getTotalAmount = () => {
    return filteredRevenues.reduce((sum, r) => sum + r.montant, 0);
  };

  const getMonthlyData = () => {
    const monthlyTotals: Record<string, number> = {};
    filteredRevenues.forEach(r => {
      const month = format(new Date(r.date_encaissement), 'MMM yyyy', { locale: fr });
      monthlyTotals[month] = (monthlyTotals[month] || 0) + r.montant;
    });
    return Object.entries(monthlyTotals).map(([month, total]) => ({ month, total }));
  };

  const exportData = () => {
    const exportData = filteredRevenues.map(r => ({
      'Date': r.date_encaissement,
      'Source': r.source_revenu,
      'Montant (DH)': r.montant.toFixed(2),
      'Mode Paiement': r.mode_paiement,
      'Statut': r.statut,
      'Client': r.clients ? `${r.clients.nom} ${r.clients.prenom}` : '',
      'Contrat': r.contracts?.numero_contrat || '',
      'Note': r.note || '',
    }));
    exportToExcel(exportData, 'revenus');
  };

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Chargement...</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <TrendingUp className="w-6 h-6" />
            Revenus & Encaissements
          </h1>
          <p className="text-sm text-muted-foreground">
            Suivez tous vos encaissements et revenus
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
                  Nouvel Encaissement
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Ajouter un Encaissement</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Date</Label>
                      <Input
                        type="date"
                        value={formData.date_encaissement}
                        onChange={(e) => setFormData({ ...formData, date_encaissement: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Source</Label>
                      <Select value={formData.source_revenu} onValueChange={(value) => setFormData({ ...formData, source_revenu: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="contrat">Contrat</SelectItem>
                          <SelectItem value="vente">Vente</SelectItem>
                          <SelectItem value="remboursement">Remboursement</SelectItem>
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
                          <SelectItem value="partiel">Partiel</SelectItem>
                          <SelectItem value="en_attente">En attente</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Note</Label>
                    <Textarea
                      value={formData.note}
                      onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                      placeholder="Informations complémentaires..."
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total Encaissé</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">
              {getTotalAmount().toFixed(2)} DH
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Nombre d'Encaissements</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">{filteredRevenues.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">En Attente</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-orange-600">
              {filteredRevenues.filter(r => r.statut === 'en_attente').reduce((sum, r) => sum + r.montant, 0).toFixed(2)} DH
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Moyenne par Encaissement</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-600">
              {filteredRevenues.length > 0 ? (getTotalAmount() / filteredRevenues.length).toFixed(2) : 0} DH
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Graphique */}
      <Card>
        <CardHeader>
          <CardTitle>Encaissements par Mois</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={getMonthlyData()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="total" fill="hsl(var(--primary))" name="Total (DH)" />
            </BarChart>
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
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label>Rechercher</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Client, contrat, note..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Source</Label>
              <Select value={filterSource} onValueChange={setFilterSource}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes</SelectItem>
                  <SelectItem value="contrat">Contrat</SelectItem>
                  <SelectItem value="assistance">Assistance</SelectItem>
                  <SelectItem value="vente">Vente</SelectItem>
                  <SelectItem value="remboursement">Remboursement</SelectItem>
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
                  <SelectItem value="partiel">Partiel</SelectItem>
                  <SelectItem value="en_attente">En attente</SelectItem>
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
                  <SelectItem value="all">Tous</SelectItem>
                  {vehicles.map((vehicle) => (
                    <SelectItem key={vehicle.id} value={vehicle.id}>
                      {vehicle.immatriculation} - {vehicle.marque} {vehicle.modele}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Période</Label>
              <Select value={filterPeriod} onValueChange={setFilterPeriod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes</SelectItem>
                  <SelectItem value="week">Cette semaine</SelectItem>
                  <SelectItem value="month">Ce mois</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tableau */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des Encaissements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Contrat</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                  <TableHead>Mode Paiement</TableHead>
                  <TableHead>Statut</TableHead>
                  {isAdmin && <TableHead>Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRevenues.map((revenue) => (
                  <TableRow key={revenue.id}>
                    <TableCell>{format(new Date(revenue.date_encaissement), 'dd/MM/yyyy')}</TableCell>
                    <TableCell className="capitalize">{revenue.source_revenu}</TableCell>
                    <TableCell>
                      {revenue.clients ? `${revenue.clients.nom} ${revenue.clients.prenom}` : '-'}
                    </TableCell>
                    <TableCell>{revenue.contracts?.numero_contrat || '-'}</TableCell>
                    <TableCell className="text-right font-medium text-green-600">
                      {revenue.montant.toFixed(2)} DH
                    </TableCell>
                    <TableCell className="capitalize">{revenue.mode_paiement}</TableCell>
                    <TableCell>
                      <Badge variant={revenue.statut === 'paye' ? 'default' : revenue.statut === 'partiel' ? 'secondary' : 'outline'}>
                        {revenue.statut === 'paye' ? 'Payé' : 
                         revenue.statut === 'partiel' ? 'Partiel' : 'En attente'}
                      </Badge>
                    </TableCell>
                    {isAdmin && (
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(revenue.id)}
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
