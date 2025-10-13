import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, DollarSign, TrendingDown, FileText, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useUserRole } from "@/hooks/use-user-role";

type Expense = {
  id: string;
  categorie: string;
  montant: number;
  date_depense: string;
  description: string | null;
  vehicle_id: string | null;
  vehicle?: {
    marque: string;
    modele: string;
    immatriculation: string;
  };
  source?: 'expense' | 'traite'; // Pour différencier les sources
};

export default function Charges() {
  const { toast } = useToast();
  const { isAdmin } = useUserRole();
  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    categorie: 'entretien' as 'entretien' | 'assurance' | 'loyer' | 'marketing' | 'salaires' | 'traite' | 'autres',
    montant: 0,
    date_depense: format(new Date(), 'yyyy-MM-dd'),
    description: '',
    vehicle_id: '',
  });

  useEffect(() => {
    loadExpenses();
    loadVehicles();
  }, []);

  const loadExpenses = async () => {
    try {
      // Charger les dépenses normales
      const { data: expensesData, error: expensesError } = await supabase
        .from('expenses')
        .select(`
          *,
          vehicles (marque, modele, immatriculation)
        `)
        .order('date_depense', { ascending: false });

      if (expensesError) throw expensesError;

      // Charger les traites payées
      const { data: traitesData, error: traitesError } = await supabase
        .from('vehicules_traites_echeances')
        .select(`
          *,
          vehicles:vehicle_id (marque, modele, immatriculation)
        `)
        .eq('statut', 'Payée')
        .order('date_paiement', { ascending: false });

      if (traitesError) throw traitesError;

      // Formater les dépenses normales
      const formattedExpenses: Expense[] = (expensesData || []).map(e => ({
        id: e.id,
        categorie: e.categorie,
        montant: e.montant || 0,
        date_depense: e.date_depense,
        description: e.description,
        vehicle_id: e.vehicle_id,
        vehicle: e.vehicles,
        source: 'expense' as const
      }));

      // Formater les traites comme des charges
      const formattedTraites: Expense[] = (traitesData || []).map(t => ({
        id: t.id,
        categorie: 'traite',
        montant: t.montant ? parseFloat(t.montant.toString()) : 0,
        date_depense: t.date_paiement || t.date_echeance,
        description: t.notes || `Traite bancaire - Échéance du ${format(new Date(t.date_echeance), 'dd/MM/yyyy')}`,
        vehicle_id: t.vehicle_id,
        vehicle: t.vehicles,
        source: 'traite' as const
      }));

      // Combiner et trier toutes les charges par date
      const allExpenses = [...formattedExpenses, ...formattedTraites].sort((a, b) => 
        new Date(b.date_depense).getTime() - new Date(a.date_depense).getTime()
      );

      setExpenses(allExpenses);
      
      const total = allExpenses.reduce((sum, e) => sum + (e.montant || 0), 0);
      setTotalExpenses(total);
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

  const loadVehicles = async () => {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .order('marque');

      if (error) throw error;
      setVehicles(data || []);
    } catch (error: any) {
      console.error('Erreur chargement véhicules:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Empêcher l'ajout manuel de traites (elles sont auto-générées)
      if (formData.categorie === 'traite') {
        toast({
          title: 'Information',
          description: 'Les traites bancaires sont gérées automatiquement depuis la page du véhicule',
          variant: 'default',
        });
        setLoading(false);
        return;
      }

      const { error } = await supabase.from('expenses').insert([{
        categorie: formData.categorie as 'entretien' | 'assurance' | 'loyer' | 'marketing' | 'salaires' | 'autres',
        montant: formData.montant,
        date_depense: formData.date_depense,
        description: formData.description || null,
        vehicle_id: formData.vehicle_id || null,
      }]);

      if (error) throw error;

      toast({
        title: 'Succès',
        description: 'Charge ajoutée avec succès',
      });

      setIsDialogOpen(false);
      resetForm();
      loadExpenses();
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

  const handleDelete = async (id: string, source: 'expense' | 'traite' = 'expense') => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette charge ?')) return;

    try {
      if (source === 'traite') {
        // Ne pas permettre la suppression des traites depuis cette page
        toast({
          title: 'Information',
          description: 'Les traites bancaires doivent être gérées depuis la page du véhicule',
          variant: 'default',
        });
        return;
      }

      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Succès',
        description: 'Charge supprimée',
      });

      loadExpenses();
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      categorie: 'entretien' as 'entretien' | 'assurance' | 'loyer' | 'marketing' | 'salaires' | 'traite' | 'autres',
      montant: 0,
      date_depense: format(new Date(), 'yyyy-MM-dd'),
      description: '',
      vehicle_id: '',
    });
  };

  const getCategoryBadge = (category: string) => {
    const styles: Record<string, string> = {
      entretien: 'bg-blue-100 text-blue-800',
      assurance: 'bg-purple-100 text-purple-800',
      loyer: 'bg-amber-100 text-amber-800',
      marketing: 'bg-green-100 text-green-800',
      salaires: 'bg-indigo-100 text-indigo-800',
      traite: 'bg-rose-100 text-rose-800',
      autres: 'bg-gray-100 text-gray-800',
    };

    return (
      <Badge className={`${styles[category] || styles.autres} border-0`}>
        {category.charAt(0).toUpperCase() + category.slice(1)}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Chargement des charges...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Charges</h1>
          <p className="text-sm text-muted-foreground">
            Gestion des dépenses et charges
          </p>
        </div>
        {isAdmin && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nouvelle charge
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ajouter une charge</DialogTitle>
              <DialogDescription>
                Enregistrez une nouvelle dépense
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Catégorie *</Label>
                <Select
                  value={formData.categorie}
                  onValueChange={(value) => setFormData({ ...formData, categorie: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entretien">Entretien</SelectItem>
                    <SelectItem value="assurance">Assurance</SelectItem>
                    <SelectItem value="loyer">Loyer</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="salaires">Salaires</SelectItem>
                    <SelectItem value="traite">Traite</SelectItem>
                    <SelectItem value="autres">Autres</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Véhicule (optionnel)</Label>
                <Select
                  value={formData.vehicle_id}
                  onValueChange={(value) => setFormData({ ...formData, vehicle_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un véhicule" />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicles.map((vehicle) => (
                      <SelectItem key={vehicle.id} value={vehicle.id}>
                        {vehicle.marque} {vehicle.modele} - {vehicle.immatriculation}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Montant (DH) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.montant}
                  onChange={(e) => setFormData({ ...formData, montant: parseFloat(e.target.value) })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Date *</Label>
                <Input
                  type="date"
                  value={formData.date_depense}
                  onChange={(e) => setFormData({ ...formData, date_depense: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Détails de la dépense..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit" disabled={loading}>
                  Ajouter
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
        )}
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total des charges</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{totalExpenses.toFixed(2)} DH</div>
            <p className="text-xs text-muted-foreground">
              Toutes catégories confondues
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nombre de charges</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{expenses.length}</div>
            <p className="text-xs text-muted-foreground">
              Dépenses enregistrées
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Moyenne par charge</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {expenses.length > 0 ? (totalExpenses / expenses.length).toFixed(2) : 0} DH
            </div>
            <p className="text-xs text-muted-foreground">
              Montant moyen
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Liste des charges */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des charges</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {expenses.map((expense) => (
              <div
                key={expense.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {getCategoryBadge(expense.categorie)}
                    {expense.vehicle && (
                      <span className="text-sm text-muted-foreground">
                        {expense.vehicle.marque} {expense.vehicle.modele}
                      </span>
                    )}
                  </div>
                  <p className="text-sm">{expense.description || 'Aucune description'}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {format(new Date(expense.date_depense), 'dd MMMM yyyy', { locale: fr })}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-lg font-bold text-red-600">{expense.montant.toFixed(2)} DH</p>
                  {isAdmin && expense.source !== 'traite' && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(expense.id, expense.source)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  )}
                  {expense.source === 'traite' && (
                    <Badge variant="outline" className="text-xs">Auto</Badge>
                  )}
                </div>
              </div>
            ))}

            {expenses.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Aucune charge enregistrée
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
