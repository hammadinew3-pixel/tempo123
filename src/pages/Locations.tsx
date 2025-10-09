import { useEffect, useState } from 'react';
import { Search, Filter, Download, Plus, Edit, Trash2, FileText } from "lucide-react";
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

type Contract = Database['public']['Tables']['contracts']['Row'];
type ContractInsert = Database['public']['Tables']['contracts']['Insert'];

export default function Locations() {
  const [contracts, setContracts] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<any>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState<Partial<ContractInsert>>({
    numero_contrat: `CTR-${Date.now()}`,
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
    start_time: '',
    end_time: '',
    notes: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [contractsRes, vehiclesRes, clientsRes] = await Promise.all([
        supabase
          .from('contracts')
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

      if (contractsRes.error) throw contractsRes.error;
      if (vehiclesRes.error) throw vehiclesRes.error;
      if (clientsRes.error) throw clientsRes.error;

      setContracts(contractsRes.data || []);
      setVehicles(vehiclesRes.data || []);
      setClients(clientsRes.data || []);
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
      if (editingContract) {
        const { error } = await supabase
          .from('contracts')
          .update(formData)
          .eq('id', editingContract.id);

        if (error) throw error;

        toast({
          title: 'Succès',
          description: 'Contrat modifié avec succès',
        });
      } else {
        const { error } = await supabase
          .from('contracts')
          .insert([formData as ContractInsert]);

        if (error) throw error;

        toast({
          title: 'Succès',
          description: 'Contrat créé avec succès',
        });
      }

      setIsDialogOpen(false);
      resetForm();
      loadData();
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

  const resetForm = () => {
    setFormData({
      numero_contrat: `CTR-${Date.now()}`,
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
      start_time: '',
      end_time: '',
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
      brouillon: 'bg-gray-500',
      actif: 'bg-blue-500',
      termine: 'bg-green-500',
      annule: 'bg-red-500',
    };

    const labels: Record<string, string> = {
      brouillon: 'Brouillon',
      actif: 'Actif',
      termine: 'Terminé',
      annule: 'Annulé',
    };

    return (
      <Badge className={`${styles[status]} text-white`}>
        {labels[status]}
      </Badge>
    );
  };

  const calculateDuration = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const handleGeneratePDF = async (contractId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('generate-contract-pdf', {
        body: { contractId }
      });

      if (error) throw error;

      toast({
        title: 'Succès',
        description: 'PDF généré avec succès',
      });

      // Reload to get updated pdf_url
      loadData();
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

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Locations / Contrats</h1>
          <p className="text-sm text-muted-foreground">Gérez vos contrats de location</p>
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
                Nouveau contrat
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingContract ? 'Modifier' : 'Créer'} un contrat</DialogTitle>
                <DialogDescription>
                  Remplissez les informations du contrat
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="numero">Numéro de contrat</Label>
                    <Input
                      id="numero"
                      value={formData.numero_contrat}
                      onChange={(e) => setFormData({ ...formData, numero_contrat: e.target.value })}
                      readOnly
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="client">Client *</Label>
                    <Select
                      value={formData.client_id}
                      onValueChange={(value) => setFormData({ ...formData, client_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un client" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.nom} {client.prenom}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="vehicle">Véhicule *</Label>
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
                    <Label htmlFor="date_debut">Date début *</Label>
                    <Input
                      id="date_debut"
                      type="date"
                      value={formData.date_debut}
                      onChange={(e) => setFormData({ ...formData, date_debut: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="date_fin">Date fin *</Label>
                    <Input
                      id="date_fin"
                      type="date"
                      value={formData.date_fin}
                      onChange={(e) => setFormData({ ...formData, date_fin: e.target.value })}
                      required
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
                        <SelectItem value="brouillon">Brouillon</SelectItem>
                        <SelectItem value="actif">Actif</SelectItem>
                        <SelectItem value="termine">Terminé</SelectItem>
                        <SelectItem value="annule">Annulé</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="caution">Caution (MAD)</Label>
                    <Input
                      id="caution"
                      type="number"
                      step="0.01"
                      value={formData.caution_montant}
                      onChange={(e) => setFormData({ ...formData, caution_montant: parseFloat(e.target.value) })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="advance">Acompte (MAD)</Label>
                    <Input
                      id="advance"
                      type="number"
                      step="0.01"
                      value={formData.advance_payment}
                      onChange={(e) => setFormData({ ...formData, advance_payment: parseFloat(e.target.value) })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="payment_method">Mode de paiement</Label>
                    <Select
                      value={formData.payment_method}
                      onValueChange={(value) => setFormData({ ...formData, payment_method: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="especes">Espèces</SelectItem>
                        <SelectItem value="carte">Carte bancaire</SelectItem>
                        <SelectItem value="virement">Virement</SelectItem>
                        <SelectItem value="cheque">Chèque</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="start_location">Lieu de départ</Label>
                    <Input
                      id="start_location"
                      value={formData.start_location}
                      onChange={(e) => setFormData({ ...formData, start_location: e.target.value })}
                      placeholder="Ex: Casablanca"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="end_location">Lieu de retour</Label>
                    <Input
                      id="end_location"
                      value={formData.end_location}
                      onChange={(e) => setFormData({ ...formData, end_location: e.target.value })}
                      placeholder="Ex: Casablanca"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="start_time">Heure de départ</Label>
                    <Input
                      id="start_time"
                      type="time"
                      value={formData.start_time}
                      onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="end_time">Heure de retour</Label>
                    <Input
                      id="end_time"
                      type="time"
                      value={formData.end_time}
                      onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="notes">Notes / Remarques</Label>
                    <Input
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Remarques diverses..."
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
            <CardTitle>Contrats ({contracts.length})</CardTitle>
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
          ) : contracts.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Aucun contrat. Cliquez sur "Nouveau contrat" pour commencer.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-muted-foreground border-b">
                    <th className="pb-3 font-medium">N° Contrat</th>
                    <th className="pb-3 font-medium">Véhicule</th>
                    <th className="pb-3 font-medium">Client</th>
                    <th className="pb-3 font-medium">Période</th>
                    <th className="pb-3 font-medium">Montant</th>
                    <th className="pb-3 font-medium">Reste</th>
                    <th className="pb-3 font-medium">Statut</th>
                    <th className="pb-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {contracts.map((contract) => (
                    <tr key={contract.id} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="py-4 font-medium text-foreground">{contract.numero_contrat}</td>
                      <td className="py-4 text-foreground">
                        {contract.vehicles?.marque} {contract.vehicles?.modele}
                      </td>
                      <td className="py-4 text-foreground">
                        {contract.clients?.nom} {contract.clients?.prenom}
                      </td>
                      <td className="py-4 text-foreground">
                        <div className="text-sm">
                          <div>{new Date(contract.date_debut).toLocaleDateString('fr-FR')}</div>
                          <div className="text-muted-foreground">au {new Date(contract.date_fin).toLocaleDateString('fr-FR')}</div>
                          <div className="text-xs">({contract.duration || calculateDuration(contract.date_debut, contract.date_fin)} jours)</div>
                        </div>
                      </td>
                      <td className="py-4 text-foreground">
                        <div className="font-semibold">{contract.total_amount?.toFixed(2) || '0.00'} MAD</div>
                        <div className="text-xs text-muted-foreground">
                          Acompte: {contract.advance_payment?.toFixed(2) || '0.00'} MAD
                        </div>
                      </td>
                      <td className="py-4 text-foreground">
                        <span className="font-medium text-orange-600">
                          {contract.remaining_amount?.toFixed(2) || '0.00'} MAD
                        </span>
                      </td>
                      <td className="py-4">{getStatusBadge(contract.statut)}</td>
                      <td className="py-4">
                        <div className="flex space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(contract)}
                            title="Modifier"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleGeneratePDF(contract.id)}
                            disabled={loading}
                            title="Générer PDF"
                          >
                            <FileText className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(contract.id)}
                            title="Supprimer"
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
