import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ChevronRight, ChevronDown, ChevronUp, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { useUserRole } from "@/hooks/use-user-role";
type Vehicle = Database['public']['Tables']['vehicles']['Row'];
type VehicleStatus = Database['public']['Enums']['vehicle_status'];
type VehicleCategory = Database['public']['Enums']['vehicle_category'];

// Mapping des marques et leurs modèles
const MARQUES_MODELES: Record<string, string[]> = {
  BMW: ['Série 1', 'Série 2', 'Série 3', 'Série 4', 'Série 5', 'Série 6', 'Série 7', 'X1', 'X2', 'X3', 'X4', 'X5', 'X6', 'X7', 'Z4', 'i3', 'i4', 'iX'],
  Mercedes: ['Classe A', 'Classe B', 'Classe C', 'Classe E', 'Classe S', 'CLA', 'CLS', 'GLA', 'GLB', 'GLC', 'GLE', 'GLS', 'EQA', 'EQB', 'EQC', 'EQE', 'EQS'],
  Audi: ['A1', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'Q2', 'Q3', 'Q4 e-tron', 'Q5', 'Q7', 'Q8', 'e-tron', 'TT'],
  Volkswagen: ['Polo', 'Golf', 'Jetta', 'Passat', 'Arteon', 'T-Cross', 'T-Roc', 'Tiguan', 'Touareg', 'ID.3', 'ID.4', 'ID.5'],
  Renault: ['Clio', 'Captur', 'Mégane', 'Kadjar', 'Arkana', 'Austral', 'Koleos', 'Talisman', 'Twingo', 'Zoe'],
  Peugeot: ['208', '2008', '308', '3008', '408', '508', '5008', 'Rifter', 'e-208', 'e-2008'],
  Dacia: ['Sandero', 'Sandero Stepway', 'Logan', 'Duster', 'Jogger', 'Spring'],
  Toyota: ['Yaris', 'Corolla', 'Camry', 'C-HR', 'RAV4', 'Highlander', 'Land Cruiser', 'Prius', 'Aygo X'],
  Hyundai: ['i10', 'i20', 'i30', 'Bayon', 'Kona', 'Tucson', 'Santa Fe', 'Ioniq 5', 'Ioniq 6'],
  Kia: ['Picanto', 'Rio', 'Ceed', 'Stonic', 'Niro', 'Sportage', 'Sorento', 'EV6', 'EV9'],
  Fiat: ['500', 'Panda', 'Tipo', '500X', 'Doblo'],
  Citroën: ['C3', 'C3 Aircross', 'C4', 'C5 Aircross', 'Berlingo', 'ë-C4'],
  Nissan: ['Micra', 'Juke', 'Qashqai', 'X-Trail', 'Ariya', 'Leaf'],
  Ford: ['Fiesta', 'Focus', 'Puma', 'Kuga', 'Explorer', 'Mustang Mach-E'],
  Opel: ['Corsa', 'Astra', 'Crossland', 'Grandland', 'Mokka', 'Combo'],
  Seat: ['Ibiza', 'Leon', 'Arona', 'Ateca', 'Tarraco'],
  Skoda: ['Fabia', 'Scala', 'Octavia', 'Kamiq', 'Karoq', 'Kodiaq', 'Enyaq']
};
export default function ModifierVehicule() {
  const {
    id
  } = useParams();
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const { isAdmin, isAgent } = useUserRole();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    marque: '',
    modele: '',
    immatriculation: '',
    annee: new Date().getFullYear(),
    categorie: 'A' as VehicleCategory,
    kilometrage: 0,
    tarif_journalier: 0,
    valeur_achat: 0,
    statut: 'disponible' as VehicleStatus,
    photo_url: '',
    carburant: 'diesel',
    chassis: '',
    places: 5,
    concessionaire: '',
    puissance: '',
    couleur: ''
  });
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isInService, setIsInService] = useState(true);
  const [isSousLocation, setIsSousLocation] = useState(false);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  useEffect(() => {
    if (id) {
      loadVehicle();
    }
  }, [id]);
  const loadVehicle = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('vehicles').select('*').eq('id', id).single();
      if (error) throw error;
      setFormData({
        marque: data.marque || '',
        modele: data.modele || '',
        immatriculation: data.immatriculation || '',
        annee: data.annee || new Date().getFullYear(),
        categorie: data.categorie || 'A',
        kilometrage: data.kilometrage || 0,
        tarif_journalier: data.tarif_journalier || 0,
        valeur_achat: data.valeur_achat || 0,
        statut: data.statut || 'disponible',
        photo_url: data.photo_url || '',
        carburant: 'diesel',
        chassis: '',
        places: 5,
        concessionaire: '',
        puissance: '',
        couleur: ''
      });
      setIsInService(data.en_service ?? true);
      setIsSousLocation(data.sous_location ?? false);

      // Set available models based on the vehicle's brand
      if (data.marque && MARQUES_MODELES[data.marque]) {
        setAvailableModels(MARQUES_MODELES[data.marque]);
      }
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les données du véhicule",
        variant: "destructive"
      });
      navigate('/vehicules');
    } finally {
      setLoading(false);
    }
  };
  const handleMarqueChange = (marque: string) => {
    setFormData({
      ...formData,
      marque,
      modele: '' // Reset model when brand changes
    });
    setAvailableModels(MARQUES_MODELES[marque] || []);
  };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
    }
  };
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = () => {
    setIsDragging(false);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && (file.type.startsWith('image/') || file.type === 'application/pdf')) {
      setUploadedFile(file);
    } else {
      toast({
        title: "Erreur",
        description: "Veuillez déposer une image ou un PDF",
        variant: "destructive"
      });
    }
  };
  const removeFile = () => {
    setUploadedFile(null);
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updateData = {
        marque: formData.marque,
        modele: formData.modele,
        immatriculation: formData.immatriculation,
        annee: formData.annee,
        categorie: formData.categorie,
        kilometrage: formData.kilometrage,
        tarif_journalier: formData.tarif_journalier,
        valeur_achat: formData.valeur_achat,
        statut: isInService ? formData.statut : 'en_panne' as VehicleStatus,
        en_service: isInService,
        sous_location: isSousLocation
      };
      const {
        error
      } = await supabase.from('vehicles').update(updateData).eq('id', id);
      if (error) throw error;
      toast({
        title: "Succès",
        description: "Véhicule modifié avec succès"
      });
      navigate(`/vehicules/${id}`);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de modifier le véhicule",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };
  if (loading) {
    return <div className="p-6">Chargement...</div>;
  }
  return <div className="p-3 md:p-6">
      {/* Header */}
      <div className="mb-4 md:mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-foreground mb-2">
          Modifier le véhicule {formData.immatriculation}
        </h1>
        <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground overflow-x-auto">
          <Link to="/" className="hover:text-foreground whitespace-nowrap">Tableau de bord</Link>
          <ChevronRight className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
          <Link to="/vehicules" className="hover:text-foreground whitespace-nowrap">Véhicules</Link>
          <ChevronRight className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
          <Link to={`/vehicules/${id}`} className="hover:text-foreground whitespace-nowrap">
            Véhicule Mat. {formData.immatriculation}
          </Link>
          <ChevronRight className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
          <span className="text-foreground whitespace-nowrap">Modifier</span>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="p-4 md:p-6">
          {/* Switches */}
          <div className="grid grid-cols-1 gap-4 md:gap-6 mb-4 md:mb-6">
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <div>
                <Label className="text-sm md:text-base font-semibold">Voiture en service</Label>
              </div>
              <Switch checked={isInService} onCheckedChange={setIsInService} disabled={isAgent} />
            </div>

            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <div className="flex-1 mr-3">
                <Label className="text-sm md:text-base font-semibold">Voiture sous location</Label>
                <p className="text-xs md:text-sm text-muted-foreground mt-1">
                  Indiquez si la voiture appartient à une autre agence et que vous utilisez en sous-location
                </p>
              </div>
              <Switch checked={isSousLocation} onCheckedChange={setIsSousLocation} disabled={isAgent} />
            </div>

            <div>
              <Label htmlFor="statut">Statut</Label>
              <Select value={formData.statut} onValueChange={value => setFormData({
              ...formData,
              statut: value as VehicleStatus
            })} disabled={!isInService}>
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
          </div>

          {/* Basic Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Marque */}
            <div>
              <Label htmlFor="marque">Marque *</Label>
              <Select value={formData.marque} onValueChange={handleMarqueChange} disabled={isAgent}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent className="bg-background">
                  {Object.keys(MARQUES_MODELES).sort().map(marque => <SelectItem key={marque} value={marque}>{marque}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Modèle */}
            <div>
              <Label htmlFor="modele">Modèle</Label>
              <Select value={formData.modele} onValueChange={value => setFormData({
              ...formData,
              modele: value
            })} disabled={isAgent || !formData.marque || availableModels.length === 0}>
                <SelectTrigger>
                  <SelectValue placeholder={formData.marque ? "Sélectionner un modèle" : "Sélectionnez d'abord une marque"} />
                </SelectTrigger>
                <SelectContent className="bg-background">
                  {availableModels.map(modele => <SelectItem key={modele} value={modele}>{modele}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Catégorie */}
            <div>
              <Label htmlFor="categorie">Catégorie *</Label>
              <Select value={formData.categorie} onValueChange={value => setFormData({
              ...formData,
              categorie: value as VehicleCategory
            })} disabled={isAgent}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">A - Citadine</SelectItem>
                  <SelectItem value="B">B - Economique</SelectItem>
                  <SelectItem value="C">C - Compacte</SelectItem>
                  <SelectItem value="D">D - Berline</SelectItem>
                  <SelectItem value="E">E - SUV/Luxe</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Matricule */}
            <div>
              <Label htmlFor="immatriculation">Matricule *</Label>
              <Input id="immatriculation" value={formData.immatriculation} onChange={e => setFormData({
              ...formData,
              immatriculation: e.target.value
            })} required disabled={isAgent} />
            </div>

            {/* Dernier kilométrage */}
            <div>
              <Label htmlFor="kilometrage">Dernier kilométrage *</Label>
              <div className="relative">
                <Input id="kilometrage" type="number" value={formData.kilometrage} onChange={e => setFormData({
                ...formData,
                kilometrage: parseInt(e.target.value) || 0
              })} required />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">KM</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Indiquez le dernier kilométrage après chaque retour de réservation
              </p>
            </div>

            {/* Prix location */}
            <div>
              <Label htmlFor="tarif_journalier">Prix location *</Label>
              <div className="relative">
                <Input id="tarif_journalier" type="number" value={formData.tarif_journalier} onChange={e => setFormData({
                ...formData,
                tarif_journalier: parseFloat(e.target.value) || 0
              })} required disabled={isAgent} />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">DH</span>
              </div>
            </div>

            {/* Carburant */}
            <div>
              <Label htmlFor="carburant">Carburant *</Label>
              <Select value={formData.carburant} onValueChange={value => setFormData({
              ...formData,
              carburant: value
            })} disabled={isAgent}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="diesel">Diesel</SelectItem>
                  <SelectItem value="essence">Essence</SelectItem>
                  <SelectItem value="electrique">Électrique</SelectItem>
                  <SelectItem value="hybride">Hybride</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Année de mise en circulation */}
            <div>
              <Label htmlFor="annee">Année de mise en circulation</Label>
              <Input id="annee" type="number" min="1900" max={new Date().getFullYear() + 1} value={formData.annee} onChange={e => setFormData({
              ...formData,
              annee: parseInt(e.target.value) || new Date().getFullYear()
            })} placeholder="YYYY" disabled={isAgent} />
              <p className="text-xs text-muted-foreground mt-1">
                Année de la première immatriculation du véhicule
              </p>
            </div>

            {/* Valeur d'achat */}
            <div>
              <Label htmlFor="valeur_achat">Valeur d'achat (Prix TTC)</Label>
              <div className="relative">
                <Input id="valeur_achat" type="number" step="0.01" value={formData.valeur_achat} onChange={e => setFormData({
                ...formData,
                valeur_achat: parseFloat(e.target.value) || 0
              })} disabled={isAgent} />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">DH</span>
              </div>
            </div>

            {/* N° Châssis */}
            <div>
              <Label htmlFor="chassis">N° Châssis</Label>
              <Input id="chassis" value={formData.chassis} onChange={e => setFormData({
              ...formData,
              chassis: e.target.value
            })} placeholder="Code unique de 17 caractères" />
              <p className="text-xs text-muted-foreground mt-1">
                N° Châssis (VIN) est un code unique de 17 caractères composé de lettres et de chiffres
              </p>
            </div>

            {/* Nombre de places */}
            <div>
              <Label htmlFor="places">Nombre de places</Label>
              <Input id="places" type="number" value={formData.places} onChange={e => setFormData({
              ...formData,
              places: parseInt(e.target.value) || 5
            })} placeholder="Ex: 5" />
            </div>

            {/* Concessionaire */}
            <div>
              <Label htmlFor="concessionaire">Concessionaire</Label>
              <Input id="concessionaire" value={formData.concessionaire} onChange={e => setFormData({
              ...formData,
              concessionaire: e.target.value
            })} placeholder="Nom du concessionaire" />
            </div>

            {/* Puissance fiscale */}
            <div>
              <Label htmlFor="puissance">Puissance fiscale</Label>
              <div className="relative">
                <Input id="puissance" type="number" value={formData.puissance} onChange={e => setFormData({
                ...formData,
                puissance: e.target.value
              })} placeholder="Ex: 6" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">VC</span>
              </div>
            </div>

            {/* Couleur */}
            <div>
              <Label htmlFor="couleur">Couleur</Label>
              <Select value={formData.couleur} onValueChange={value => setFormData({
              ...formData,
              couleur: value
            })}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une couleur" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="blanc">Blanc</SelectItem>
                  <SelectItem value="noir">Noir</SelectItem>
                  <SelectItem value="gris">Gris</SelectItem>
                  <SelectItem value="bleu">Bleu</SelectItem>
                  <SelectItem value="rouge">Rouge</SelectItem>
                  <SelectItem value="argent">Argent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Photo Upload */}
            <div className="md:col-span-2">
              <Label>Photo du véhicule</Label>
              <div onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} className={`mt-2 border-2 border-dashed rounded-lg p-6 text-center transition-colors ${isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}`}>
                {uploadedFile ? <div className="flex items-center justify-between bg-muted p-4 rounded">
                    <div className="flex items-center gap-3">
                      <Upload className="w-5 h-5 text-primary" />
                      <span className="text-sm font-medium">{uploadedFile.name}</span>
                      <span className="text-xs text-muted-foreground">
                        ({(uploadedFile.size / 1024).toFixed(2)} KB)
                      </span>
                    </div>
                    <Button type="button" variant="ghost" size="sm" onClick={removeFile}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div> : <div className="space-y-2">
                    <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
                    <div className="text-sm text-muted-foreground">
                      Glissez-déposez une image ou un PDF ici
                    </div>
                    <div className="text-xs text-muted-foreground">ou</div>
                    <label className="inline-block">
                      <input type="file" accept="image/*,application/pdf" onChange={handleFileChange} className="hidden" />
                      <Button type="button" variant="outline" size="sm" onClick={() => document.querySelector<HTMLInputElement>('input[type="file"]')?.click()}>
                        Sélectionner un fichier
                      </Button>
                    </label>
                  </div>}
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex flex-col md:flex-row justify-center gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              size="lg" 
              onClick={() => navigate(`/vehicules/${id}`)}
              className="w-full md:w-auto"
            >
              ANNULER
            </Button>
            <Button type="submit" size="lg" disabled={saving} className="w-full md:w-auto">
              {saving ? "ENREGISTREMENT..." : "ENREGISTRER LES MODIFICATIONS"}
            </Button>
          </div>
        </Card>
      </form>
    </div>;
}