import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useTenantInsert } from '@/hooks/use-tenant-insert';

export default function NouveauSinistre() {
  const { withTenantId } = useTenantInsert();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [vehicleChanges, setVehicleChanges] = useState<any[]>([]);
  const [autoFilledFromContract, setAutoFilledFromContract] = useState(false);

  const [formData, setFormData] = useState({
    type_sinistre: 'accident',
    date_sinistre: '',
    lieu: '',
    vehicle_id: '',
    contract_id: '',
    client_id: '',
    responsabilite: 'locataire',
    gravite: 'legere',
    description: '',
    cout_estime: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [vehiclesRes, clientsRes, contractsRes] = await Promise.all([
        supabase.from('vehicles').select('id, immatriculation, marque, modele').order('immatriculation'),
        supabase.from('clients').select('id, nom, prenom').order('nom'),
        supabase.from('contracts').select('id, numero_contrat, client_id, vehicle_id, date_debut, date_fin').order('created_at', { ascending: false }),
      ]);

      if (vehiclesRes.data) setVehicles(vehiclesRes.data);
      if (clientsRes.data) setClients(clientsRes.data);
      if (contractsRes.data) setContracts(contractsRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const loadVehicleChanges = async (contractId: string) => {
    try {
      const { data, error } = await supabase
        .from('vehicle_changes')
        .select('*')
        .eq('contract_id', contractId)
        .order('change_date', { ascending: true });

      if (error) throw error;
      setVehicleChanges(data || []);
    } catch (error) {
      console.error('Error loading vehicle changes:', error);
    }
  };

  const determineVehicleForDate = (contractId: string, sinistreDate: string) => {
    const contract = contracts.find(c => c.id === contractId);
    if (!contract) return '';

    // Si pas de date de sinistre, utiliser le véhicule initial
    if (!sinistreDate) return contract.vehicle_id;

    // Trouver le véhicule actif à la date du sinistre
    let activeVehicleId = contract.vehicle_id;
    
    for (const change of vehicleChanges) {
      if (new Date(change.change_date) <= new Date(sinistreDate)) {
        activeVehicleId = change.new_vehicle_id;
      } else {
        break;
      }
    }

    return activeVehicleId;
  };

  const handleContractChange = async (contractId: string) => {
    const contract = contracts.find(c => c.id === contractId);
    if (!contract) return;

    // Charger les changements de véhicule pour ce contrat
    await loadVehicleChanges(contractId);

    // Déterminer le véhicule en fonction de la date du sinistre
    const vehicleId = determineVehicleForDate(contractId, formData.date_sinistre);

    setFormData({
      ...formData,
      contract_id: contractId,
      client_id: contract.client_id,
      vehicle_id: vehicleId,
    });
    setAutoFilledFromContract(true);
  };

  const handleDateChange = (date: string) => {
    setFormData({ ...formData, date_sinistre: date });

    // Si un contrat est sélectionné, recalculer le véhicule
    if (formData.contract_id && autoFilledFromContract) {
      const vehicleId = determineVehicleForDate(formData.contract_id, date);
      setFormData(prev => ({ ...prev, vehicle_id: vehicleId, date_sinistre: date }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setUploadedFiles([...uploadedFiles, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(uploadedFiles.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Generate reference
      const { data: refData, error: refError } = await supabase.rpc('generate_sinistre_reference');
      if (refError) throw refError;

      // Insert sinistre
      const { data: sinistre, error: sinistreError } = await supabase
        .from('sinistres')
        .insert([withTenantId({
          reference: refData,
          type_sinistre: formData.type_sinistre as any,
          date_sinistre: formData.date_sinistre,
          lieu: formData.lieu,
          vehicle_id: formData.vehicle_id || null,
          contract_id: formData.contract_id || null,
          client_id: formData.client_id || null,
          responsabilite: formData.responsabilite as any,
          gravite: formData.gravite as any,
          description: formData.description,
          cout_estime: formData.cout_estime ? parseFloat(formData.cout_estime) : null,
          statut: 'ouvert' as any,
        })])
        .select()
        .single();

      if (sinistreError) throw sinistreError;

      // FORCER le véhicule en statut "immobilisé" même s'il est actuellement loué
      if (formData.vehicle_id) {
        const { error: vehicleError } = await supabase
          .from('vehicles')
          .update({ statut: 'immobilise' })
          .eq('id', formData.vehicle_id);

        if (vehicleError) {
          console.error('Erreur lors de la mise à jour du statut du véhicule:', vehicleError);
          // On continue même en cas d'erreur pour ne pas bloquer la création du sinistre
        }
      }

      // Upload files if any
      if (uploadedFiles.length > 0 && sinistre) {
        for (const file of uploadedFiles) {
          const fileExt = file.name.split('.').pop();
          const fileName = `${sinistre.id}/${Date.now()}.${fileExt}`;
          
          const { error: uploadError } = await supabase.storage
            .from('documents_vehicules')
            .upload(fileName, file);

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('documents_vehicules')
            .getPublicUrl(fileName);

          await supabase.from('sinistre_files').insert([withTenantId({
            sinistre_id: sinistre.id,
            file_name: file.name,
            file_url: publicUrl,
            file_type: 'autre',
          })]);
        }
      }

      toast({
        title: 'Succès',
        description: `Sinistre ${refData} créé avec succès`,
      });

      navigate('/sinistres');
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
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/sinistres')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Nouveau sinistre</h1>
          <p className="text-sm text-muted-foreground">Déclarez un incident lié à un véhicule</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Informations générales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Type de sinistre *</Label>
                <Select
                  value={formData.type_sinistre}
                  onValueChange={(v) => setFormData({ ...formData, type_sinistre: v })}
                >
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="accident">Accident</SelectItem>
                    <SelectItem value="vol">Vol</SelectItem>
                    <SelectItem value="panne_grave">Panne grave</SelectItem>
                    <SelectItem value="autre">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Date du sinistre *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date_sinistre}
                  onChange={(e) => handleDateChange(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="lieu">Lieu *</Label>
              <Input
                id="lieu"
                value={formData.lieu}
                onChange={(e) => setFormData({ ...formData, lieu: e.target.value })}
                placeholder="Adresse ou description du lieu"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="gravite">Gravité *</Label>
                <Select
                  value={formData.gravite}
                  onValueChange={(v) => setFormData({ ...formData, gravite: v })}
                >
                  <SelectTrigger id="gravite">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="legere">Légère</SelectItem>
                    <SelectItem value="moyenne">Moyenne</SelectItem>
                    <SelectItem value="grave">Grave</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="responsabilite">Responsabilité *</Label>
                <Select
                  value={formData.responsabilite}
                  onValueChange={(v) => setFormData({ ...formData, responsabilite: v })}
                >
                  <SelectTrigger id="responsabilite">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="locataire">Locataire</SelectItem>
                    <SelectItem value="tiers">Tiers</SelectItem>
                    <SelectItem value="indeterminee">Indéterminée</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cout">Coût estimé (DH)</Label>
              <Input
                id="cout"
                type="number"
                step="0.01"
                value={formData.cout_estime}
                onChange={(e) => setFormData({ ...formData, cout_estime: e.target.value })}
                placeholder="0.00"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Liens</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="contract">Contrat *</Label>
              <Select
                value={formData.contract_id}
                onValueChange={handleContractChange}
              >
                <SelectTrigger id="contract">
                  <SelectValue placeholder="Sélectionner un contrat" />
                </SelectTrigger>
                <SelectContent>
                  {contracts.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.numero_contrat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="client">Client</Label>
              <Select
                value={formData.client_id}
                onValueChange={(v) => !autoFilledFromContract && setFormData({ ...formData, client_id: v })}
                disabled={autoFilledFromContract}
              >
                <SelectTrigger id="client">
                  <SelectValue placeholder="Sélectionner un client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.prenom} {c.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {autoFilledFromContract && (
                <p className="text-xs text-muted-foreground">Renseigné automatiquement depuis le contrat</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="vehicle">Véhicule</Label>
              <Select
                value={formData.vehicle_id}
                onValueChange={(v) => !autoFilledFromContract && setFormData({ ...formData, vehicle_id: v })}
                disabled={autoFilledFromContract}
              >
                <SelectTrigger id="vehicle">
                  <SelectValue placeholder="Sélectionner un véhicule" />
                </SelectTrigger>
                <SelectContent>
                  {vehicles.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.marque} {v.modele} ({v.immatriculation || v.immatriculation_provisoire || v.ww || 'N/A'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {autoFilledFromContract && (
                <p className="text-xs text-muted-foreground">
                  Véhicule déterminé selon la date du sinistre
                  {vehicleChanges.length > 0 && ' (changements de véhicule détectés)'}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Description</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Décrivez les circonstances du sinistre..."
              rows={6}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Documents</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed rounded-lg p-6 text-center">
              <input
                type="file"
                id="file-upload"
                multiple
                onChange={handleFileChange}
                className="hidden"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Cliquez pour ajouter des photos, constats, factures...
                </p>
              </label>
            </div>

            {uploadedFiles.length > 0 && (
              <div className="space-y-2">
                {uploadedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                    <span className="text-sm">{file.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => navigate('/sinistres')}>
            Annuler
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Création...' : 'Créer le sinistre'}
          </Button>
        </div>
      </form>
    </div>
  );
}
