import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Download, Filter, Search, CheckCircle, XCircle, CreditCard } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUserRole } from "@/hooks/use-user-role";
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

interface Cheque {
  id: string;
  type_cheque: 'reçu' | 'émis';
  numero_cheque: string;
  banque: string;
  montant: number;
  date_emission: string;
  date_echeance: string;
  date_encaissement?: string;
  date_paiement?: string;
  statut: 'en_attente' | 'encaissé' | 'payé' | 'rejeté';
  client_id?: string;
  fournisseur?: string;
  contract_id?: string;
  note?: string;
  clients?: { nom: string; prenom: string };
  contracts?: { numero_contrat: string };
}

const COLORS = ['hsl(var(--primary))', '#10b981', '#f59e0b', '#ef4444'];

export default function Cheques() {
  const { withTenantId } = useTenantInsert();
  const [cheques, setCheques] = useState<Cheque[]>([]);
  const [filteredCheques, setFilteredCheques] = useState<Cheque[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBanque, setFilterBanque] = useState('all');
  const [filterStatut, setFilterStatut] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<'reçu' | 'émis'>('reçu');
  const { toast } = useToast();
  const { isAdmin } = useUserRole();

  const [formData, setFormData] = useState({
    numero_cheque: '',
    banque: '',
    montant: '',
    date_emission: new Date().toISOString().split('T')[0],
    date_echeance: new Date().toISOString().split('T')[0],
    statut: 'en_attente' as const,
    fournisseur: '',
    note: '',
  });

  useEffect(() => {
    loadCheques();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [cheques, searchTerm, filterBanque, filterStatut]);

  const loadCheques = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('cheques')
        .select(`
          *,
          clients (nom, prenom),
          contracts (numero_contrat)
        `)
        .order('date_echeance', { ascending: false });

      if (error) throw error;
      setCheques((data || []) as Cheque[]);
    } catch (error) {
      console.error('Error loading cheques:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les chèques",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...cheques];

    if (searchTerm) {
      filtered = filtered.filter(c =>
        c.numero_cheque?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.banque?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.fournisseur?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.clients?.nom.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterBanque !== 'all') {
      filtered = filtered.filter(c => c.banque === filterBanque);
    }

    if (filterStatut !== 'all') {
      filtered = filtered.filter(c => c.statut === filterStatut);
    }

    setFilteredCheques(filtered);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('cheques')
        .insert([withTenantId({
          ...formData,
          type_cheque: dialogType,
          montant: parseFloat(formData.montant),
        })]);

      if (error) throw error;

      toast({
        title: "Succès",
        description: `Chèque ${dialogType} ajouté avec succès`,
      });
      setIsDialogOpen(false);
      setFormData({
        numero_cheque: '',
        banque: '',
        montant: '',
        date_emission: new Date().toISOString().split('T')[0],
        date_echeance: new Date().toISOString().split('T')[0],
        statut: 'en_attente',
        fournisseur: '',
        note: '',
      });
      loadCheques();
    } catch (error) {
      console.error('Error adding cheque:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter le chèque",
        variant: "destructive",
      });
    }
  };

  const handleMarkAsPaid = async (id: string, type: 'reçu' | 'émis') => {
    try {
      const updateData = type === 'reçu' 
        ? { statut: 'encaissé', date_encaissement: new Date().toISOString().split('T')[0] }
        : { statut: 'payé', date_paiement: new Date().toISOString().split('T')[0] };

      const { error } = await supabase
        .from('cheques')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Succès",
        description: `Chèque marqué comme ${type === 'reçu' ? 'encaissé' : 'payé'}`,
      });
      loadCheques();
    } catch (error) {
      console.error('Error updating cheque:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le chèque",
        variant: "destructive",
      });
    }
  };

  const handleMarkAsRejected = async (id: string) => {
    try {
      const { error } = await supabase
        .from('cheques')
        .update({ statut: 'rejeté' })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Chèque marqué comme rejeté",
      });
      loadCheques();
    } catch (error) {
      console.error('Error updating cheque:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le chèque",
        variant: "destructive",
      });
    }
  };

  const getBanques = () => {
    return [...new Set(cheques.map(c => c.banque).filter(Boolean))];
  };

  const getChequesRecus = () => filteredCheques.filter(c => c.type_cheque === 'reçu');
  const getChequesEmis = () => filteredCheques.filter(c => c.type_cheque === 'émis');

  const getTotalRecus = () => getChequesRecus().reduce((sum, c) => sum + c.montant, 0);
  const getTotalEmis = () => getChequesEmis().reduce((sum, c) => sum + c.montant, 0);

  const getStatusData = () => {
    const statuts: Record<string, number> = {};
    filteredCheques.forEach(c => {
      statuts[c.statut] = (statuts[c.statut] || 0) + 1;
    });
    return Object.entries(statuts).map(([name, value]) => ({ name, value }));
  };

  const getComparisonData = () => [
    { name: 'Chèques Reçus', value: getTotalRecus() },
    { name: 'Chèques Émis', value: getTotalEmis() },
  ];

  const isOverdue = (dateEcheance: string) => {
    return new Date(dateEcheance) < new Date();
  };

  const isNearDue = (dateEcheance: string) => {
    const diff = new Date(dateEcheance).getTime() - new Date().getTime();
    const days = diff / (1000 * 60 * 60 * 24);
    return days > 0 && days <= 7;
  };

  const exportData = (type: 'reçu' | 'émis') => {
    const data = type === 'reçu' ? getChequesRecus() : getChequesEmis();
    const exportData = data.map(c => ({
      'Numéro': c.numero_cheque,
      'Banque': c.banque,
      'Montant (DH)': c.montant.toFixed(2),
      'Date Émission': c.date_emission,
      'Date Échéance': c.date_echeance,
      'Statut': c.statut,
      'Client/Fournisseur': type === 'reçu' 
        ? (c.clients ? `${c.clients.nom} ${c.clients.prenom}` : '')
        : (c.fournisseur || ''),
      'Note': c.note || '',
    }));
    exportToExcel(exportData, `cheques-${type}`);
  };

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Chargement...</div>;
  }

  const renderChequeRow = (cheque: Cheque) => (
    <TableRow key={cheque.id}>
      <TableCell>{cheque.numero_cheque}</TableCell>
      <TableCell>{cheque.banque}</TableCell>
      <TableCell>
        {cheque.type_cheque === 'reçu' 
          ? (cheque.clients ? `${cheque.clients.nom} ${cheque.clients.prenom}` : '-')
          : (cheque.fournisseur || '-')}
      </TableCell>
      <TableCell className="text-right font-medium">
        {cheque.montant.toFixed(2)} DH
      </TableCell>
      <TableCell>{format(new Date(cheque.date_emission), 'dd/MM/yyyy')}</TableCell>
      <TableCell>
        <span className={
          isOverdue(cheque.date_echeance) && cheque.statut === 'en_attente' 
            ? 'text-red-600 font-semibold' 
            : isNearDue(cheque.date_echeance) && cheque.statut === 'en_attente'
            ? 'text-orange-600 font-semibold'
            : ''
        }>
          {format(new Date(cheque.date_echeance), 'dd/MM/yyyy')}
        </span>
      </TableCell>
      <TableCell>
        <Badge variant={
          cheque.statut === 'encaissé' || cheque.statut === 'payé' ? 'default' : 
          cheque.statut === 'rejeté' ? 'destructive' : 'secondary'
        }>
          {cheque.statut}
        </Badge>
      </TableCell>
      {isAdmin && (
        <TableCell>
          <div className="flex gap-2">
            {cheque.statut === 'en_attente' && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleMarkAsPaid(cheque.id, cheque.type_cheque)}
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  {cheque.type_cheque === 'reçu' ? 'Encaissé' : 'Payé'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleMarkAsRejected(cheque.id)}
                >
                  <XCircle className="w-4 h-4 mr-1" />
                  Rejeté
                </Button>
              </>
            )}
          </div>
        </TableCell>
      )}
    </TableRow>
  );

  return (
    <div className="space-y-6 p-3 md:p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-2">
            <CreditCard className="w-5 h-5 md:w-6 md:h-6" />
            Gestion des Chèques
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground">
            Gérez les chèques reçus et émis
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total Chèques Reçus</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">
              {getTotalRecus().toFixed(2)} DH
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total Chèques Émis</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-600">
              {getTotalEmis().toFixed(2)} DH
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">En Attente</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-orange-600">
              {filteredCheques.filter(c => c.statut === 'en_attente').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Traités</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">
              {filteredCheques.filter(c => c.statut === 'encaissé' || c.statut === 'payé').length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Répartition par Statut</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={getStatusData()}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {getStatusData().map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Comparaison Reçus / Émis</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={getComparisonData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="hsl(var(--primary))" name="Montant (DH)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filtres
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Rechercher</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Numéro, banque, client..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Banque</Label>
              <Select value={filterBanque} onValueChange={setFilterBanque}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes</SelectItem>
                  {getBanques().map(banque => (
                    <SelectItem key={banque} value={banque}>{banque}</SelectItem>
                  ))}
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
                  <SelectItem value="en_attente">En attente</SelectItem>
                  <SelectItem value="encaissé">Encaissé</SelectItem>
                  <SelectItem value="payé">Payé</SelectItem>
                  <SelectItem value="rejeté">Rejeté</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="recus" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="recus">🟢 Chèques Reçus</TabsTrigger>
          <TabsTrigger value="emis">🔴 Chèques Émis</TabsTrigger>
        </TabsList>

        <TabsContent value="recus">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Chèques Reçus</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => exportData('reçu')}>
                  <Download className="w-4 h-4 mr-2" />
                  Exporter
                </Button>
                {isAdmin && (
                  <Dialog open={isDialogOpen && dialogType === 'reçu'} onOpenChange={(open) => {
                    setIsDialogOpen(open);
                    setDialogType('reçu');
                  }}>
                    <DialogTrigger asChild>
                      <Button onClick={() => setDialogType('reçu')} size="sm" className="md:size-default whitespace-nowrap">
                        <Plus className="w-4 h-4 mr-1 sm:mr-2" />
                        <span className="hidden sm:inline">Nouveau Chèque Reçu</span>
                        <span className="sm:hidden">Nouveau</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Ajouter un Chèque Reçu</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Numéro du chèque</Label>
                            <Input
                              value={formData.numero_cheque}
                              onChange={(e) => setFormData({ ...formData, numero_cheque: e.target.value })}
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Banque</Label>
                            <Input
                              value={formData.banque}
                              onChange={(e) => setFormData({ ...formData, banque: e.target.value })}
                              required
                            />
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
                            <Label>Date d'émission</Label>
                            <Input
                              type="date"
                              value={formData.date_emission}
                              onChange={(e) => setFormData({ ...formData, date_emission: e.target.value })}
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Date d'échéance</Label>
                            <Input
                              type="date"
                              value={formData.date_echeance}
                              onChange={(e) => setFormData({ ...formData, date_echeance: e.target.value })}
                              required
                            />
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
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Numéro</TableHead>
                      <TableHead>Banque</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead className="text-right">Montant</TableHead>
                      <TableHead>Date Émission</TableHead>
                      <TableHead>Date Échéance</TableHead>
                      <TableHead>Statut</TableHead>
                      {isAdmin && <TableHead>Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getChequesRecus().map(renderChequeRow)}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="emis">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Chèques Émis</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => exportData('émis')}>
                  <Download className="w-4 h-4 mr-2" />
                  Exporter
                </Button>
                {isAdmin && (
                  <Dialog open={isDialogOpen && dialogType === 'émis'} onOpenChange={(open) => {
                    setIsDialogOpen(open);
                    setDialogType('émis');
                  }}>
                    <DialogTrigger asChild>
                      <Button onClick={() => setDialogType('émis')} size="sm" className="md:size-default whitespace-nowrap">
                        <Plus className="w-4 h-4 mr-1 sm:mr-2" />
                        <span className="hidden sm:inline">Nouveau Chèque Émis</span>
                        <span className="sm:hidden">Nouveau</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Ajouter un Chèque Émis</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Numéro du chèque</Label>
                            <Input
                              value={formData.numero_cheque}
                              onChange={(e) => setFormData({ ...formData, numero_cheque: e.target.value })}
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Banque</Label>
                            <Input
                              value={formData.banque}
                              onChange={(e) => setFormData({ ...formData, banque: e.target.value })}
                              required
                            />
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
                            <Label>Fournisseur</Label>
                            <Input
                              value={formData.fournisseur}
                              onChange={(e) => setFormData({ ...formData, fournisseur: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Date d'émission</Label>
                            <Input
                              type="date"
                              value={formData.date_emission}
                              onChange={(e) => setFormData({ ...formData, date_emission: e.target.value })}
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Date d'échéance</Label>
                            <Input
                              type="date"
                              value={formData.date_echeance}
                              onChange={(e) => setFormData({ ...formData, date_echeance: e.target.value })}
                              required
                            />
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
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Numéro</TableHead>
                      <TableHead>Banque</TableHead>
                      <TableHead>Fournisseur</TableHead>
                      <TableHead className="text-right">Montant</TableHead>
                      <TableHead>Date Émission</TableHead>
                      <TableHead>Date Échéance</TableHead>
                      <TableHead>Statut</TableHead>
                      {isAdmin && <TableHead>Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getChequesEmis().map(renderChequeRow)}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
