import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

type AssistanceInsert = Database['public']['Tables']['assistance']['Insert'];
type Client = Database['public']['Tables']['clients']['Row'];
type Vehicle = Database['public']['Tables']['vehicles']['Row'];
type Assurance = Database['public']['Tables']['assurances']['Row'];

export default function NouveauAssistance() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [assurances, setAssurances] = useState<Assurance[]>([]);

  const [formData, setFormData] = useState<Partial<AssistanceInsert>>({
    num_dossier: `ASS-${Date.now()}`,
    client_id: undefined,
    vehicle_id: undefined,
    assureur_id: undefined,
    assureur_nom: '',
    date_debut: new Date().toISOString().split('T')[0],
    date_fin: undefined,
    type: 'remplacement',
    montant_facture: undefined,
    etat: 'ouvert',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [clientsRes, vehiclesRes, assurancesRes] = await Promise.all([
        supabase.from('clients').select('*').order('nom'),
        supabase.from('vehicles').select('*').eq('statut', 'disponible').order('marque'),
        supabase.from('assurances').select('*').eq('actif', true).order('nom'),
      ]);

      if (clientsRes.error) throw clientsRes.error;
      if (vehiclesRes.error) throw vehiclesRes.error;
      if (assurancesRes.error) throw assurancesRes.error;

      setClients(clientsRes.data || []);
      setVehicles(vehiclesRes.data || []);
      setAssurances(assurancesRes.data || []);
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleAssuranceChange = (assuranceId: string) => {
    const assurance = assurances.find(a => a.id === assuranceId);
    if (assurance) {
      setFormData({
        ...formData,
        assureur_id: assuranceId,
        assureur_nom: assurance.nom,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('assistance')
        .insert([formData as AssistanceInsert])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Succès',
        description: 'Dossier d\'assistance créé avec succès',
      });

      navigate(`/assistance/${data.id}`);
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
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/assistance')}
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Nouveau dossier d'assistance</h1>
          <p className="text-sm text-muted-foreground">Créer un dossier de véhicule de remplacement</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="border-l-4 border-l-primary">
          <CardHeader>
            <CardTitle>Informations du dossier</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="num_dossier">N° Dossier *</Label>
                <Input
                  id="num_dossier"
                  value={formData.num_dossier}
                  onChange={(e) => setFormData({ ...formData, num_dossier: e.target.value })}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="type">Type *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value as any })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="remplacement">Véhicule de remplacement</SelectItem>
                    <SelectItem value="panne">Panne</SelectItem>
                    <SelectItem value="accident">Accident</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="assurance">Assurance *</Label>
                <Select
                  value={formData.assureur_id}
                  onValueChange={handleAssuranceChange}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une assurance" />
                  </SelectTrigger>
                  <SelectContent>
                    {assurances.map((assurance) => (
                      <SelectItem key={assurance.id} value={assurance.id}>
                        {assurance.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="client">Client *</Label>
                <Select
                  value={formData.client_id}
                  onValueChange={(value) => setFormData({ ...formData, client_id: value })}
                  required
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
                  required
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
                <Label htmlFor="date_fin">Date fin prévue</Label>
                <Input
                  id="date_fin"
                  type="date"
                  value={formData.date_fin || ''}
                  onChange={(e) => setFormData({ ...formData, date_fin: e.target.value || undefined })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="montant">Montant facture (MAD)</Label>
                <Input
                  id="montant"
                  type="number"
                  step="0.01"
                  value={formData.montant_facture || ''}
                  onChange={(e) => setFormData({ ...formData, montant_facture: parseFloat(e.target.value) || undefined })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="etat">État</Label>
                <Select
                  value={formData.etat}
                  onValueChange={(value) => setFormData({ ...formData, etat: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ouvert">Ouvert</SelectItem>
                    <SelectItem value="cloture">Clôturé</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/assistance')}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Création...' : 'Créer le dossier'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
