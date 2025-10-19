import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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

export default function ModifierSinistre() {
  const { withTenantId } = useTenantInsert();
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [existingFiles, setExistingFiles] = useState<any[]>([]);

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
    statut: 'ouvert',
  });

  useEffect(() => {
    loadData();
    loadSinistre();
    loadFiles();
  }, [id]);

  const loadData = async () => {
    try {
      const [vehiclesRes, clientsRes, contractsRes] = await Promise.all([
        supabase.from('vehicles').select('id, immatriculation, marque, modele').order('immatriculation'),
        supabase.from('clients').select('id, nom, prenom').order('nom'),
        supabase.from('contracts').select('id, numero_contrat').order('created_at', { ascending: false }),
      ]);

      if (vehiclesRes.data) setVehicles(vehiclesRes.data);
      if (clientsRes.data) setClients(clientsRes.data);
      if (contractsRes.data) setContracts(contractsRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const loadSinistre = async () => {
    try {
      const { data, error } = await supabase
        .from('sinistres')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      if (data) {
        setFormData({
          type_sinistre: data.type_sinistre,
          date_sinistre: data.date_sinistre,
          lieu: data.lieu,
          vehicle_id: data.vehicle_id || '',
          contract_id: data.contract_id || '',
          client_id: data.client_id || '',
          responsabilite: data.responsabilite,
          gravite: data.gravite,
          description: data.description || '',
          cout_estime: data.cout_estime?.toString() || '',
          statut: data.statut || 'ouvert',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
      navigate('/sinistres');
    }
  };

  const loadFiles = async () => {
    try {
      const { data, error } = await supabase
        .from('sinistre_files')
        .select('*')
        .eq('sinistre_id', id);

      if (error) throw error;
      setExistingFiles(data || []);
    } catch (error: any) {
      console.error('Error loading files:', error);
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

  const deleteExistingFile = async (fileId: string) => {
    if (!confirm('Supprimer ce fichier ?')) return;

    try {
      const { error } = await supabase
        .from('sinistre_files')
        .delete()
        .eq('id', fileId);

      if (error) throw error;

      toast({
        title: 'Succès',
        description: 'Fichier supprimé',
      });

      loadFiles();
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
      // Get old vehicle_id and statut before update
      const { data: oldSinistre } = await supabase
        .from('sinistres')
        .select('vehicle_id, statut')
        .eq('id', id)
        .single();

      // Update sinistre
      const { error: updateError } = await supabase
        .from('sinistres')
        .update({
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
        })
        .eq('id', id);

      if (updateError) throw updateError;

      // Gérer le statut du véhicule si celui-ci a changé
      if (oldSinistre) {
        // Si l'ancien véhicule existe et est différent du nouveau, le remettre disponible
        if (oldSinistre.vehicle_id && oldSinistre.vehicle_id !== formData.vehicle_id) {
          await supabase
            .from('vehicles')
            .update({ statut: 'disponible' })
            .eq('id', oldSinistre.vehicle_id);
        }

        // FORCER le nouveau véhicule en immobilisé si le sinistre n'est pas clos (même s'il est loué)
        if (formData.vehicle_id && formData.statut !== 'clos' && formData.statut !== 'ferme') {
          await supabase
            .from('vehicles')
            .update({ statut: 'immobilise' })
            .eq('id', formData.vehicle_id);
        }
      }

      // Upload new files if any
      if (uploadedFiles.length > 0) {
        for (const file of uploadedFiles) {
          const fileExt = file.name.split('.').pop();
          const fileName = `${id}/${Date.now()}.${fileExt}`;
          
          const { error: uploadError } = await supabase.storage
            .from('vehicle-documents')
            .upload(fileName, file);

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('vehicle-documents')
            .getPublicUrl(fileName);

          await supabase.from('sinistre_files').insert([withTenantId({
            sinistre_id: id,
            file_name: file.name,
            file_url: publicUrl,
            file_type: 'autre' as any,
          })]);
        }
      }

      toast({
        title: 'Succès',
        description: 'Sinistre modifié avec succès',
      });

      navigate(`/sinistres/${id}`);
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
        <Button variant="ghost" size="sm" onClick={() => navigate(`/sinistres/${id}`)}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Modifier le sinistre</h1>
          <p className="text-sm text-muted-foreground">Mettez à jour les informations du sinistre</p>
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
                  onChange={(e) => setFormData({ ...formData, date_sinistre: e.target.value })}
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
              <Label htmlFor="vehicle">Véhicule</Label>
              <Select
                value={formData.vehicle_id}
                onValueChange={(v) => setFormData({ ...formData, vehicle_id: v })}
              >
                <SelectTrigger id="vehicle">
                  <SelectValue placeholder="Sélectionner un véhicule" />
                </SelectTrigger>
                <SelectContent>
                  {vehicles.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.marque} {v.modele} ({v.immatriculation})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="client">Client</Label>
              <Select
                value={formData.client_id}
                onValueChange={(v) => setFormData({ ...formData, client_id: v })}
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="contract">Contrat</Label>
              <Select
                value={formData.contract_id}
                onValueChange={(v) => setFormData({ ...formData, contract_id: v })}
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
            {existingFiles.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Documents existants</p>
                {existingFiles.map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-2 bg-muted rounded">
                    <span className="text-sm">{file.file_name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteExistingFile(file.id)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

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
                  Cliquez pour ajouter de nouveaux documents
                </p>
              </label>
            </div>

            {uploadedFiles.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Nouveaux documents</p>
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
          <Button type="button" variant="outline" onClick={() => navigate(`/sinistres/${id}`)}>
            Annuler
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Modification...' : 'Enregistrer les modifications'}
          </Button>
        </div>
      </form>
    </div>
  );
}
