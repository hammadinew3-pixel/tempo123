import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function NouvelleInfraction() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const [formData, setFormData] = useState<{
    date_infraction: string;
    lieu: string;
    type_infraction: "exces_vitesse" | "stationnement" | "feu_rouge" | "telephone" | "autre";
    vehicle_id: string;
    contract_id: string;
    client_id: string;
    description: string;
    montant: string;
  }>({
    date_infraction: "",
    lieu: "",
    type_infraction: "exces_vitesse",
    vehicle_id: "",
    contract_id: "",
    client_id: "",
    description: "",
    montant: "",
  });

  useEffect(() => {
    loadVehicles();
  }, []);

  useEffect(() => {
    if (formData.vehicle_id && formData.date_infraction) {
      findContractForDate();
    }
  }, [formData.vehicle_id, formData.date_infraction]);

  const loadVehicles = async () => {
    const { data, error } = await supabase
      .from("vehicles")
      .select("*")
      .order("immatriculation");

    if (!error && data) {
      setVehicles(data);
    }
  };

  const findContractForDate = async () => {
    try {
      const { data, error } = await supabase
        .from("contracts")
        .select("*, clients(id, nom, prenom, telephone, cin_url, permis_url)")
        .eq("vehicle_id", formData.vehicle_id)
        .lte("date_debut", formData.date_infraction)
        .gte("date_fin", formData.date_infraction)
        .order("date_debut", { ascending: false })
        .limit(1);

      if (error) throw error;

      if (data && data.length > 0) {
        const contract = data[0];
        setFormData(prev => ({
          ...prev,
          contract_id: contract.id,
          client_id: contract.client_id,
        }));
        setContracts([contract]);
      } else {
        setFormData(prev => ({
          ...prev,
          contract_id: "",
          client_id: "",
        }));
        setContracts([]);
        toast({
          variant: "destructive",
          title: "Aucun contrat trouvé",
          description: "Aucun contrat actif trouvé pour ce véhicule à cette date",
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message,
      });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles([...selectedFiles, ...Array.from(e.target.files)]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Generate reference
      const { data: refData, error: refError } = await supabase.rpc("generate_infraction_reference");
      if (refError) throw refError;

      const reference = refData;

      // Create infraction
      const { data: infractionData, error: infractionError } = await supabase
        .from("infractions")
        .insert([
          {
            reference,
            date_infraction: formData.date_infraction,
            lieu: formData.lieu,
            type_infraction: formData.type_infraction,
            vehicle_id: formData.vehicle_id,
            contract_id: formData.contract_id || null,
            client_id: formData.client_id || null,
            description: formData.description || null,
            montant: parseFloat(formData.montant) || 0,
            statut_traitement: "nouveau",
          },
        ])
        .select()
        .single();

      if (infractionError) throw infractionError;

      // Upload files
      if (selectedFiles.length > 0) {
        for (const file of selectedFiles) {
          const fileExt = file.name.split(".").pop();
          const fileName = `${infractionData.id}/${Date.now()}.${fileExt}`;
          const filePath = `infractions/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from("vehicle-documents")
            .upload(filePath, file);

          if (uploadError) throw uploadError;

          const { data: urlData } = supabase.storage
            .from("vehicle-documents")
            .getPublicUrl(filePath);

          await supabase.from("infraction_files").insert([
            {
              infraction_id: infractionData.id,
              file_name: file.name,
              file_url: urlData.publicUrl,
              file_type: "pv",
            },
          ]);
        }
      }

      // Automatically add client documents (CIN and Permis) and contract PDF if contract exists
      if (formData.contract_id && contracts.length > 0) {
        const contract = contracts[0];
        const client = contract.clients;

        if (client) {
          // Add CIN if available
          if (client.cin_url) {
            await supabase.from("infraction_files").insert([
              {
                infraction_id: infractionData.id,
                file_name: `CIN_${client.nom}_${client.prenom || ''}`.trim(),
                file_url: client.cin_url,
                file_type: "cin",
              },
            ]);
          }

          // Add Permis if available
          if (client.permis_url) {
            await supabase.from("infraction_files").insert([
              {
                infraction_id: infractionData.id,
                file_name: `Permis_${client.nom}_${client.prenom || ''}`.trim(),
                file_url: client.permis_url,
                file_type: "permis",
              },
            ]);
          }
        }

        // Add contract PDF if available
        if (contract.pdf_url) {
          await supabase.from("infraction_files").insert([
            {
              infraction_id: infractionData.id,
              file_name: `Contrat_${contract.numero_contrat}`,
              file_url: contract.pdf_url,
              file_type: "contrat",
            },
          ]);
        }
      }

      toast({
        title: "Succès",
        description: `Infraction ${reference} créée`,
      });

      navigate(`/infractions/${infractionData.id}`);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedContract = contracts.find(c => c.id === formData.contract_id);

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/infractions")}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Nouvelle Infraction</h1>
          <p className="text-muted-foreground">Enregistrer une nouvelle contravention</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Informations de l'infraction</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Date de l'infraction *</Label>
                <Input
                  type="date"
                  value={formData.date_infraction}
                  onChange={(e) => setFormData({ ...formData, date_infraction: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Lieu *</Label>
                <Input
                  value={formData.lieu}
                  onChange={(e) => setFormData({ ...formData, lieu: e.target.value })}
                  placeholder="Ex: Avenue Mohammed V, Casablanca"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Type d'infraction *</Label>
                <Select
                  value={formData.type_infraction}
                  onValueChange={(value: "exces_vitesse" | "stationnement" | "feu_rouge" | "telephone" | "autre") => 
                    setFormData({ ...formData, type_infraction: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="exces_vitesse">Excès de vitesse</SelectItem>
                    <SelectItem value="stationnement">Stationnement</SelectItem>
                    <SelectItem value="feu_rouge">Feu rouge</SelectItem>
                    <SelectItem value="telephone">Téléphone</SelectItem>
                    <SelectItem value="autre">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Montant (DH) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.montant}
                  onChange={(e) => setFormData({ ...formData, montant: e.target.value })}
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Détails de l'infraction..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Véhicule et Client</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Véhicule *</Label>
              <Select
                value={formData.vehicle_id}
                onValueChange={(value: string) => setFormData({ ...formData, vehicle_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choisir un véhicule..." />
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

            {selectedContract && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg space-y-2">
                <p className="font-medium text-green-900">Contrat trouvé automatiquement</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-green-700">N° Contrat:</span>
                    <span className="font-medium ml-2">{selectedContract.numero_contrat}</span>
                  </div>
                  <div>
                    <span className="text-green-700">Client:</span>
                    <span className="font-medium ml-2">
                      {selectedContract.clients?.nom} {selectedContract.clients?.prenom}
                    </span>
                  </div>
                  <div>
                    <span className="text-green-700">Période:</span>
                    <span className="font-medium ml-2">
                      {format(new Date(selectedContract.date_debut), "dd/MM/yyyy", { locale: fr })} - {format(new Date(selectedContract.date_fin), "dd/MM/yyyy", { locale: fr })}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {formData.vehicle_id && formData.date_infraction && !selectedContract && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">
                  Aucun contrat actif trouvé pour ce véhicule à cette date. L'infraction sera créée sans lien avec un client.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Documents</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Ajouter des fichiers (PV, photos, etc.)</Label>
              <div className="mt-2">
                <label className="flex items-center justify-center gap-2 border-2 border-dashed rounded-lg p-6 cursor-pointer hover:bg-accent/50">
                  <Upload className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Cliquez pour sélectionner des fichiers</span>
                  <input
                    type="file"
                    multiple
                    accept="image/*,application/pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {selectedFiles.length > 0 && (
              <div className="space-y-2">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span className="text-sm truncate">{file.name}</span>
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
          <Button type="button" variant="outline" onClick={() => navigate("/infractions")}>
            Annuler
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Enregistrement..." : "Enregistrer l'infraction"}
          </Button>
        </div>
      </form>
    </div>
  );
}
