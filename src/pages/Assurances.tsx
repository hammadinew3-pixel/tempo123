import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

type Assurance = Database['public']['Tables']['assurances']['Row'];
type AssuranceInsert = Database['public']['Tables']['assurances']['Insert'];
type Bareme = Database['public']['Tables']['assurance_bareme']['Row'];
type BaremeInsert = Database['public']['Tables']['assurance_bareme']['Insert'];

export default function Assurances() {
  const [assurances, setAssurances] = useState<Assurance[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [baremeDialogOpen, setBaremeDialogOpen] = useState(false);
  const [editingAssurance, setEditingAssurance] = useState<Assurance | null>(null);
  const [selectedAssurance, setSelectedAssurance] = useState<Assurance | null>(null);
  const [baremes, setBaremes] = useState<Bareme[]>([]);
  const { toast } = useToast();

  const [formData, setFormData] = useState<Partial<AssuranceInsert>>({
    nom: '',
    contact_nom: '',
    contact_email: '',
    contact_telephone: '',
    adresse: '',
    conditions_paiement: '',
    delai_paiement_jours: 30,
    actif: true,
  });

  const [baremeForm, setBaremeForm] = useState<Record<string, number>>({
    A: 0,
    B: 0,
    C: 0,
    D: 0,
    E: 0,
  });

  useEffect(() => {
    loadAssurances();
  }, []);

  const loadAssurances = async () => {
    try {
      const { data, error } = await supabase
        .from('assurances')
        .select('*')
        .order('nom', { ascending: true });

      if (error) throw error;
      setAssurances(data || []);
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

  const loadBaremes = async (assuranceId: string) => {
    try {
      const { data, error } = await supabase
        .from('assurance_bareme')
        .select('*')
        .eq('assurance_id', assuranceId);

      if (error) throw error;
      
      const baremeData: Record<string, number> = {
        A: 0, B: 0, C: 0, D: 0, E: 0,
      };
      
      (data || []).forEach((b) => {
        baremeData[b.categorie] = Number(b.tarif_journalier);
      });
      
      setBaremeForm(baremeData);
      setBaremes(data || []);
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingAssurance) {
        const { error } = await supabase
          .from('assurances')
          .update(formData)
          .eq('id', editingAssurance.id);

        if (error) throw error;

        toast({
          title: 'Succès',
          description: 'Assurance modifiée avec succès',
        });
      } else {
        const { error } = await supabase
          .from('assurances')
          .insert([formData as AssuranceInsert]);

        if (error) throw error;

        toast({
          title: 'Succès',
          description: 'Assurance ajoutée avec succès',
        });
      }

      setIsDialogOpen(false);
      resetForm();
      loadAssurances();
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
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette assurance ?')) return;

    try {
      const { error } = await supabase
        .from('assurances')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Succès',
        description: 'Assurance supprimée',
      });

      loadAssurances();
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleSaveBareme = async () => {
    if (!selectedAssurance) return;

    setLoading(true);
    try {
      // Delete existing baremes
      await supabase
        .from('assurance_bareme')
        .delete()
        .eq('assurance_id', selectedAssurance.id);

      // Insert new baremes
      const baremeInserts: BaremeInsert[] = Object.entries(baremeForm)
        .filter(([_, tarif]) => tarif > 0)
        .map(([categorie, tarif]) => ({
          assurance_id: selectedAssurance.id,
          categorie: categorie as any,
          tarif_journalier: tarif,
        }));

      if (baremeInserts.length > 0) {
        const { error } = await supabase
          .from('assurance_bareme')
          .insert(baremeInserts);

        if (error) throw error;
      }

      toast({
        title: 'Succès',
        description: 'Barème mis à jour avec succès',
      });
      setBaremeDialogOpen(false);
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

  const resetForm = () => {
    setFormData({
      nom: '',
      contact_nom: '',
      contact_email: '',
      contact_telephone: '',
      adresse: '',
      conditions_paiement: '',
      delai_paiement_jours: 30,
      actif: true,
    });
    setEditingAssurance(null);
  };

  const openEditDialog = (assurance: Assurance) => {
    setEditingAssurance(assurance);
    setFormData(assurance);
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Liste des assurances</h1>
          <p className="text-sm text-muted-foreground">Gérez vos partenaires assurance</p>
        </div>
        <Button 
          size="sm"
          onClick={() => { resetForm(); setIsDialogOpen(true); }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Nouvelle assurance
        </Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingAssurance ? 'Modifier' : 'Ajouter'} une assurance</DialogTitle>
            <DialogDescription>
              Remplissez les informations de l'assurance
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label htmlFor="nom">Nom de l'assurance *</Label>
                <Input
                  id="nom"
                  value={formData.nom}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_nom">Nom du contact</Label>
                <Input
                  id="contact_nom"
                  value={formData.contact_nom || ''}
                  onChange={(e) => setFormData({ ...formData, contact_nom: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_telephone">Téléphone</Label>
                <Input
                  id="contact_telephone"
                  value={formData.contact_telephone || ''}
                  onChange={(e) => setFormData({ ...formData, contact_telephone: e.target.value })}
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="contact_email">Email</Label>
                <Input
                  id="contact_email"
                  type="email"
                  value={formData.contact_email || ''}
                  onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="adresse">Adresse</Label>
                <Textarea
                  id="adresse"
                  value={formData.adresse || ''}
                  onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="delai_paiement_jours">Délai de paiement (jours)</Label>
                <Input
                  id="delai_paiement_jours"
                  type="number"
                  value={formData.delai_paiement_jours}
                  onChange={(e) => setFormData({ ...formData, delai_paiement_jours: parseInt(e.target.value) })}
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="conditions_paiement">Conditions de paiement</Label>
                <Textarea
                  id="conditions_paiement"
                  value={formData.conditions_paiement || ''}
                  onChange={(e) => setFormData({ ...formData, conditions_paiement: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); }}>
                Annuler
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={baremeDialogOpen} onOpenChange={setBaremeDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Barème de {selectedAssurance?.nom}
            </DialogTitle>
          </DialogHeader>
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Définissez les tarifs journaliers pour chaque catégorie de véhicule
                </p>
                {['A', 'B', 'C', 'D', 'E'].map((categorie) => (
                  <div key={categorie} className="grid grid-cols-2 gap-4 items-center">
                    <Label htmlFor={`cat-${categorie}`}>Catégorie {categorie}</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id={`cat-${categorie}`}
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={baremeForm[categorie] || ''}
                        onChange={(e) => setBaremeForm({
                          ...baremeForm,
                          [categorie]: parseFloat(e.target.value) || 0
                        })}
                      />
                      <span className="text-sm text-muted-foreground">MAD/jour</span>
                    </div>
                  </div>
                ))}
                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setBaremeDialogOpen(false)}
                  >
                    Annuler
                  </Button>
                  <Button onClick={handleSaveBareme} disabled={loading}>
                    {loading ? 'Enregistrement...' : 'Enregistrer'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </DialogContent>
      </Dialog>

      <Card className="border-l-4 border-l-primary shadow-sm">
        <CardContent className="pt-6">
          {loading ? (
            <p className="text-center text-muted-foreground py-8">Chargement...</p>
          ) : assurances.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Aucune assurance. Cliquez sur "Nouvelle assurance" pour commencer.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-muted-foreground border-b">
                    <th className="pb-3 pl-4 font-medium">Actions</th>
                    <th className="pb-3 font-medium">Nom</th>
                    <th className="pb-3 font-medium">Contact</th>
                    <th className="pb-3 font-medium">Téléphone</th>
                    <th className="pb-3 font-medium">Email</th>
                    <th className="pb-3 font-medium">Délai paiement</th>
                    <th className="pb-3 font-medium">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {assurances.map((assurance) => (
                    <tr 
                      key={assurance.id} 
                      className="border-b last:border-0 cursor-pointer group"
                    >
                      <td className="py-4 pl-4">
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Gérer le barème"
                            onClick={() => {
                              setSelectedAssurance(assurance);
                              loadBaremes(assurance.id);
                              setBaremeDialogOpen(true);
                            }}
                            className="hover:bg-accent transition-colors"
                          >
                            <DollarSign className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(assurance)}
                            className="hover:bg-accent transition-colors"
                            title="Modifier"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(assurance.id)}
                            className="hover:bg-accent transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                      <td className="py-4 font-semibold text-foreground">{assurance.nom}</td>
                      <td className="py-4 text-foreground">{assurance.contact_nom || '-'}</td>
                      <td className="py-4 text-foreground">{assurance.contact_telephone || '-'}</td>
                      <td className="py-4 text-muted-foreground text-sm">{assurance.contact_email || '-'}</td>
                      <td className="py-4 text-foreground">{assurance.delai_paiement_jours} jours</td>
                      <td className="py-4">
                        {assurance.actif ? (
                          <Badge variant="outline" className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20 font-medium">
                            Actif
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20 font-medium">
                            Inactif
                          </Badge>
                        )}
                      </td>
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
