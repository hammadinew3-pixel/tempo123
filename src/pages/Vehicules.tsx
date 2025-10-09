import { useEffect, useState } from 'react';
import { Search, Filter, Download, Plus, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

type Vehicle = Database['public']['Tables']['vehicles']['Row'];
type VehicleInsert = Database['public']['Tables']['vehicles']['Insert'];

export default function Vehicules() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState<Partial<VehicleInsert>>({
    immatriculation: '',
    marque: '',
    modele: '',
    annee: new Date().getFullYear(),
    kilometrage: 0,
    statut: 'disponible',
    tarif_journalier: 0,
    valeur_achat: 0,
  });

  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = async () => {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVehicles(data || []);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingVehicle) {
        const { error } = await supabase
          .from('vehicles')
          .update(formData)
          .eq('id', editingVehicle.id);

        if (error) throw error;

        toast({
          title: 'Succès',
          description: 'Véhicule modifié avec succès',
        });
      } else {
        const { error } = await supabase
          .from('vehicles')
          .insert([formData as VehicleInsert]);

        if (error) throw error;

        toast({
          title: 'Succès',
          description: 'Véhicule ajouté avec succès',
        });
      }

      setIsDialogOpen(false);
      resetForm();
      loadVehicles();
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
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce véhicule ?')) return;

    try {
      const { error } = await supabase
        .from('vehicles')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Succès',
        description: 'Véhicule supprimé',
      });

      loadVehicles();
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
      immatriculation: '',
      marque: '',
      modele: '',
      annee: new Date().getFullYear(),
      kilometrage: 0,
      statut: 'disponible',
      tarif_journalier: 0,
      valeur_achat: 0,
    });
    setEditingVehicle(null);
  };

  const openEditDialog = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setFormData(vehicle);
    setIsDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      disponible: 'bg-green-500',
      loue: 'bg-blue-500',
      reserve: 'bg-yellow-500',
      en_panne: 'bg-red-500',
    };

    const labels: Record<string, string> = {
      disponible: 'Disponible',
      loue: 'Loué',
      reserve: 'Réservé',
      en_panne: 'En panne',
    };

    return (
      <Badge className={`${styles[status]} text-white`}>
        {labels[status]}
      </Badge>
    );
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Liste des véhicules</h1>
          <p className="text-sm text-muted-foreground">Gérez votre flotte de véhicules</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Exporter
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Nouveau véhicule
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
                    <Input
                      id="immatriculation"
                      value={formData.immatriculation}
                      onChange={(e) => setFormData({ ...formData, immatriculation: e.target.value })}
                      placeholder="A-12345-B"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="marque">Marque *</Label>
                    <Input
                      id="marque"
                      value={formData.marque}
                      onChange={(e) => setFormData({ ...formData, marque: e.target.value })}
                      placeholder="Dacia"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="modele">Modèle *</Label>
                    <Input
                      id="modele"
                      value={formData.modele}
                      onChange={(e) => setFormData({ ...formData, modele: e.target.value })}
                      placeholder="Sandero"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="annee">Année *</Label>
                    <Input
                      id="annee"
                      type="number"
                      value={formData.annee}
                      onChange={(e) => setFormData({ ...formData, annee: parseInt(e.target.value) })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="kilometrage">Kilométrage</Label>
                    <Input
                      id="kilometrage"
                      type="number"
                      value={formData.kilometrage}
                      onChange={(e) => setFormData({ ...formData, kilometrage: parseInt(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="statut">Statut</Label>
                    <Select
                      value={formData.statut}
                      onValueChange={(value) => setFormData({ ...formData, statut: value as any })}
                    >
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
                    <Input
                      id="tarif"
                      type="number"
                      step="0.01"
                      value={formData.tarif_journalier}
                      onChange={(e) => setFormData({ ...formData, tarif_journalier: parseFloat(e.target.value) })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="valeur">Valeur d'achat (MAD)</Label>
                    <Input
                      id="valeur"
                      type="number"
                      step="0.01"
                      value={formData.valeur_achat || ''}
                      onChange={(e) => setFormData({ ...formData, valeur_achat: parseFloat(e.target.value) || undefined })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="assurance">Assurance expire le</Label>
                    <Input
                      id="assurance"
                      type="date"
                      value={formData.assurance_expire_le || ''}
                      onChange={(e) => setFormData({ ...formData, assurance_expire_le: e.target.value || null })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vignette">Vignette expire le</Label>
                    <Input
                      id="vignette"
                      type="date"
                      value={formData.vignette_expire_le || ''}
                      onChange={(e) => setFormData({ ...formData, vignette_expire_le: e.target.value || null })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="visite">Visite technique expire le</Label>
                    <Input
                      id="visite"
                      type="date"
                      value={formData.visite_technique_expire_le || ''}
                      onChange={(e) => setFormData({ ...formData, visite_technique_expire_le: e.target.value || null })}
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
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Véhicules ({vehicles.length})</CardTitle>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Rechercher..."
                  className="pl-10 w-64"
                />
              </div>
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Filtres
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center text-muted-foreground py-8">Chargement...</p>
          ) : vehicles.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Aucun véhicule. Cliquez sur "Nouveau véhicule" pour commencer.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-muted-foreground border-b">
                    <th className="pb-3 font-medium">Immatriculation</th>
                    <th className="pb-3 font-medium">Marque</th>
                    <th className="pb-3 font-medium">Modèle</th>
                    <th className="pb-3 font-medium">Année</th>
                    <th className="pb-3 font-medium">Kilométrage</th>
                    <th className="pb-3 font-medium">Tarif/jour</th>
                    <th className="pb-3 font-medium">Statut</th>
                    <th className="pb-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {vehicles.map((vehicle) => (
                    <tr key={vehicle.id} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="py-4 font-medium text-foreground">{vehicle.immatriculation}</td>
                      <td className="py-4 text-foreground">{vehicle.marque}</td>
                      <td className="py-4 text-foreground">{vehicle.modele}</td>
                      <td className="py-4 text-foreground">{vehicle.annee}</td>
                      <td className="py-4 text-foreground">{vehicle.kilometrage.toLocaleString()} km</td>
                      <td className="py-4 text-foreground">{vehicle.tarif_journalier} MAD</td>
                      <td className="py-4">{getStatusBadge(vehicle.statut)}</td>
                      <td className="py-4">
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(vehicle)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(vehicle.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
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
