import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
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

export default function ModifierInfraction() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [availableVehicles, setAvailableVehicles] = useState<any[]>([]);

  const [formData, setFormData] = useState<{
    date_infraction: string;
    lieu: string;
    type_infraction: "exces_vitesse" | "stationnement" | "feu_rouge" | "telephone" | "autre";
    vehicle_id: string;
    description: string;
    montant: string;
  }>({
    date_infraction: "",
    lieu: "",
    type_infraction: "exces_vitesse",
    vehicle_id: "",
    description: "",
    montant: "",
  });

  useEffect(() => {
    loadData();
  }, [id]);

  useEffect(() => {
    if (formData.date_infraction) {
      loadAvailableVehicles();
    }
  }, [formData.date_infraction]);

  const loadData = async () => {
    try {
      const [infractionRes, vehiclesRes] = await Promise.all([
        supabase.from("infractions").select("*").eq("id", id!).single(),
        supabase.from("vehicles").select("*").order("immatriculation"),
      ]);

      if (infractionRes.error) throw infractionRes.error;
      if (vehiclesRes.error) throw vehiclesRes.error;

      const infraction = infractionRes.data;
      setFormData({
        date_infraction: infraction.date_infraction,
        lieu: infraction.lieu,
        type_infraction: (infraction.type_infraction || 'autre') as any,
        vehicle_id: infraction.vehicle_id,
        description: infraction.description || "",
        montant: infraction.montant.toString(),
      });

      setVehicles(vehiclesRes.data);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message,
      });
      navigate("/infractions");
    }
  };

  const loadAvailableVehicles = async () => {
    if (!formData.date_infraction) {
      setAvailableVehicles(vehicles);
      return;
    }

    try {
      // Récupérer les véhicules actifs à la date d'infraction
      const { data: affectations, error } = await supabase
        .from("vehicle_affectations")
        .select("vehicle_id, vehicles(*)")
        .lte("date_debut", formData.date_infraction)
        .or(`date_fin.gte.${formData.date_infraction},date_fin.is.null`);

      if (error) throw error;

      if (affectations && affectations.length > 0) {
        const activeVehicles = affectations.map(a => a.vehicles).filter(Boolean);
        setAvailableVehicles(activeVehicles);
      } else {
        // Si aucune affectation trouvée, afficher tous les véhicules
        setAvailableVehicles(vehicles);
      }
    } catch (error: any) {
      console.error("Erreur lors du chargement des véhicules disponibles:", error);
      setAvailableVehicles(vehicles);
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
      // Update infraction
      const { error: updateError } = await supabase
        .from("infractions")
        .update({
          date_infraction: formData.date_infraction,
          lieu: formData.lieu,
          type_infraction: formData.type_infraction,
          vehicle_id: formData.vehicle_id,
          description: formData.description || null,
          montant: parseFloat(formData.montant) || 0,
        })
        .eq("id", id);

      if (updateError) throw updateError;

      // Upload new files
      if (selectedFiles.length > 0) {
        for (const file of selectedFiles) {
          const fileExt = file.name.split(".").pop();
          const fileName = `${id}/${Date.now()}.${fileExt}`;
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
              infraction_id: id,
              file_name: file.name,
              file_url: urlData.publicUrl,
              file_type: "pv",
            },
          ]);
        }
      }

      toast({
        title: "Succès",
        description: "Infraction mise à jour",
      });

      navigate(`/infractions/${id}`);
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

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(`/infractions/${id}`)}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Modifier l'infraction</h1>
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
                    <SelectValue />
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
              <Label>Véhicule *</Label>
              <Select
                value={formData.vehicle_id}
                onValueChange={(value: string) => setFormData({ ...formData, vehicle_id: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(availableVehicles.length > 0 ? availableVehicles : vehicles).map((vehicle) => (
                    <SelectItem key={vehicle.id} value={vehicle.id}>
                      {vehicle.marque} {vehicle.modele} - {vehicle.immatriculation}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formData.date_infraction && availableVehicles.length > 0 && availableVehicles.length < vehicles.length && (
                <p className="text-xs text-muted-foreground mt-1">
                  Véhicules actifs à cette date uniquement
                </p>
              )}
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
            <CardTitle>Ajouter des documents</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
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
          <Button type="button" variant="outline" onClick={() => navigate(`/infractions/${id}`)}>
            Annuler
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Enregistrement..." : "Enregistrer les modifications"}
          </Button>
        </div>
      </form>
    </div>
  );
}
