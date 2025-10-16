import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Download, CreditCard, Filter, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { exportToExcel } from '@/lib/exportUtils';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useUserRole } from "@/hooks/use-user-role";
import { format } from 'date-fns';

interface Cheque {
  id: string;
  numero_cheque: string;
  banque: string;
  montant: number;
  date_emission: string;
  date_echeance: string;
  statut: string;
  client_id?: string;
  contract_id?: string;
  note?: string;
  clients?: { nom: string; prenom: string };
  contracts?: { numero_contrat: string };
}

interface Traite {
  id: string;
  reference_traite: string;
  banque: string;
  montant: number;
  date_echeance: string;
  statut: string;
  vehicle_id?: string;
  fournisseur?: string;
  note?: string;
  vehicles?: { immatriculation: string };
}

export default function Cheques() {
  const [cheques, setCheques] = useState<Cheque[]>([]);
  const [traites, setTraites] = useState<Traite[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<'cheque' | 'traite'>('cheque');
  const { toast } = useToast();
  const { isAdmin } = useUserRole();

  const [chequeForm, setChequeForm] = useState({
    numero_cheque: '',
    banque: '',
    montant: '',
    date_emission: new Date().toISOString().split('T')[0],
    date_echeance: new Date().toISOString().split('T')[0],
    statut: 'en_attente',
    note: '',
  });

  const [traiteForm, setTraiteForm] = useState({
    reference_traite: '',
    banque: '',
    montant: '',
    date_echeance: new Date().toISOString().split('T')[0],
    statut: 'en_attente',
    fournisseur: '',
    note: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [chequesRes, traitesRes] = await Promise.all([
        supabase.from('cheques').select('*, clients(nom, prenom), contracts(numero_contrat)').order('date_echeance', { ascending: false }),
        supabase.from('traites').select('*, vehicles(immatriculation)').order('date_echeance', { ascending: false })
      ]);

      if (chequesRes.error) throw chequesRes.error;
      if (traitesRes.error) throw traitesRes.error;

      setCheques(chequesRes.data || []);
      setTraites(traitesRes.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({ title: "Erreur", description: "Impossible de charger les données", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitCheque = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('cheques').insert([{ ...chequeForm, montant: parseFloat(chequeForm.montant) }]);
      if (error) throw error;
      toast({ title: "Succès", description: "Chèque ajouté" });
      setIsDialogOpen(false);
      loadData();
    } catch (error) {
      toast({ title: "Erreur", description: "Impossible d'ajouter le chèque", variant: "destructive" });
    }
  };

  const handleSubmitTraite = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('traites').insert([{ ...traiteForm, montant: parseFloat(traiteForm.montant) }]);
      if (error) throw error;
      toast({ title: "Succès", description: "Traite ajoutée" });
      setIsDialogOpen(false);
      loadData();
    } catch (error) {
      toast({ title: "Erreur", description: "Impossible d'ajouter la traite", variant: "destructive" });
    }
  };

  if (loading) return <div className="text-center py-8 text-muted-foreground">Chargement...</div>;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <CreditCard className="w-6 h-6" />
            Chèques & Traites
          </h1>
          <p className="text-sm text-muted-foreground">Suivi des paiements bancaires</p>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <Button onClick={() => { setDialogType('cheque'); setIsDialogOpen(true); }}>
              <Plus className="w-4 h-4 mr-2" />
              Nouveau Chèque
            </Button>
            <Button variant="outline" onClick={() => { setDialogType('traite'); setIsDialogOpen(true); }}>
              <Plus className="w-4 h-4 mr-2" />
              Nouvelle Traite
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-sm">Chèques Reçus</CardTitle></CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">{cheques.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Traites Bancaires</CardTitle></CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-600">{traites.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">En Attente</CardTitle></CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-orange-600">
              {cheques.filter(c => c.statut === 'en_attente').length + traites.filter(t => t.statut === 'en_attente').length}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="cheques">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="cheques">Chèques Reçus</TabsTrigger>
          <TabsTrigger value="traites">Traites Bancaires</TabsTrigger>
        </TabsList>
        
        <TabsContent value="cheques">
          <Card>
            <CardHeader><CardTitle>Liste des Chèques</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>N° Chèque</TableHead>
                    <TableHead>Banque</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead className="text-right">Montant</TableHead>
                    <TableHead>Échéance</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cheques.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>{c.numero_cheque}</TableCell>
                      <TableCell>{c.banque}</TableCell>
                      <TableCell>{c.clients ? `${c.clients.nom} ${c.clients.prenom}` : '-'}</TableCell>
                      <TableCell className="text-right font-medium">{c.montant.toFixed(2)} DH</TableCell>
                      <TableCell>{format(new Date(c.date_echeance), 'dd/MM/yyyy')}</TableCell>
                      <TableCell>
                        <Badge variant={c.statut === 'encaisse' ? 'default' : c.statut === 'rejete' ? 'destructive' : 'secondary'}>
                          {c.statut}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="traites">
          <Card>
            <CardHeader><CardTitle>Liste des Traites</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Référence</TableHead>
                    <TableHead>Banque</TableHead>
                    <TableHead>Fournisseur</TableHead>
                    <TableHead className="text-right">Montant</TableHead>
                    <TableHead>Échéance</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {traites.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell>{t.reference_traite}</TableCell>
                      <TableCell>{t.banque}</TableCell>
                      <TableCell>{t.fournisseur || '-'}</TableCell>
                      <TableCell className="text-right font-medium">{t.montant.toFixed(2)} DH</TableCell>
                      <TableCell>{format(new Date(t.date_echeance), 'dd/MM/yyyy')}</TableCell>
                      <TableCell>
                        <Badge variant={t.statut === 'payee' ? 'default' : t.statut === 'impayee' ? 'destructive' : 'secondary'}>
                          {t.statut}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogType === 'cheque' ? 'Nouveau Chèque' : 'Nouvelle Traite'}</DialogTitle>
          </DialogHeader>
          {dialogType === 'cheque' ? (
            <form onSubmit={handleSubmitCheque} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>N° Chèque</Label>
                  <Input value={chequeForm.numero_cheque} onChange={(e) => setChequeForm({...chequeForm, numero_cheque: e.target.value})} required />
                </div>
                <div className="space-y-2">
                  <Label>Banque</Label>
                  <Input value={chequeForm.banque} onChange={(e) => setChequeForm({...chequeForm, banque: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Montant (DH)</Label>
                  <Input type="number" step="0.01" value={chequeForm.montant} onChange={(e) => setChequeForm({...chequeForm, montant: e.target.value})} required />
                </div>
                <div className="space-y-2">
                  <Label>Date Échéance</Label>
                  <Input type="date" value={chequeForm.date_echeance} onChange={(e) => setChequeForm({...chequeForm, date_echeance: e.target.value})} required />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Annuler</Button>
                <Button type="submit">Ajouter</Button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSubmitTraite} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Référence</Label>
                  <Input value={traiteForm.reference_traite} onChange={(e) => setTraiteForm({...traiteForm, reference_traite: e.target.value})} required />
                </div>
                <div className="space-y-2">
                  <Label>Banque</Label>
                  <Input value={traiteForm.banque} onChange={(e) => setTraiteForm({...traiteForm, banque: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Montant (DH)</Label>
                  <Input type="number" step="0.01" value={traiteForm.montant} onChange={(e) => setTraiteForm({...traiteForm, montant: e.target.value})} required />
                </div>
                <div className="space-y-2">
                  <Label>Date Échéance</Label>
                  <Input type="date" value={traiteForm.date_echeance} onChange={(e) => setTraiteForm({...traiteForm, date_echeance: e.target.value})} required />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Annuler</Button>
                <Button type="submit">Ajouter</Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
