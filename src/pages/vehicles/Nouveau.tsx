import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ChevronRight, Upload, ChevronUp, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

type VehicleInsert = Database['public']['Tables']['vehicles']['Insert'];

export default function NouveauVehicule() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showMoreFields, setShowMoreFields] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [assistanceCategories, setAssistanceCategories] = useState<Array<{code: string, nom: string}>>([]);

  const [formData, setFormData] = useState<Partial<VehicleInsert>>({
    marque: '',
    immatriculation: '',
    modele: '',
    annee: new Date().getFullYear(),
    kilometrage: 0,
    statut: 'disponible',
    tarif_journalier: 0,
    valeur_achat: 0,
    en_service: true,
    sous_location: false,
  });

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  // Mapping marque -> modèles
  const modelesParMarque: Record<string, string[]> = {
    BMW: ['Série 1', 'Série 3', 'Série 5', 'Série 7', 'X1', 'X3', 'X5', 'X7'],
    Mercedes: ['Classe A', 'Classe C', 'Classe E', 'Classe S', 'GLA', 'GLC', 'GLE', 'GLS'],
    Audi: ['A3', 'A4', 'A6', 'A8', 'Q3', 'Q5', 'Q7', 'Q8'],
    Volkswagen: ['Golf', 'Polo', 'Passat', 'Tiguan', 'T-Roc', 'Touareg'],
    Renault: ['Clio', 'Mégane', 'Captur', 'Kadjar', 'Koleos', 'Talisman'],
    Peugeot: ['208', '308', '508', '2008', '3008', '5008'],
    Dacia: ['Sandero', 'Logan', 'Duster', 'Lodgy', 'Dokker'],
    Toyota: ['Yaris', 'Corolla', 'Camry', 'RAV4', 'Land Cruiser', 'Hilux'],
    Hyundai: ['i10', 'i20', 'Elantra', 'Tucson', 'Santa Fe', 'Kona'],
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const removePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  useEffect(() => {
    loadAssistanceCategories();
  }, []);

  const loadAssistanceCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('vehicle_assistance_categories')
        .select('code, nom')
        .eq('actif', true)
        .order('ordre');
      
      if (error) throw error;
      setAssistanceCategories(data || []);
    } catch (error: any) {
      console.error('Error loading assistance categories:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validation
      if (!formData.marque || !formData.immatriculation || !formData.tarif_journalier) {
        toast({
          title: "Erreur",
          description: "Veuillez remplir tous les champs obligatoires",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

      // Note: Pour l'instant, nous stockons juste le preview comme photo_url
      // Dans une implémentation complète, vous devriez uploader vers Supabase Storage
      const dataToInsert = {
        ...formData,
        categories: selectedCategories,
        photo_url: photoPreview || null,
      };

      const { data, error } = await supabase
        .from('vehicles')
        .insert([dataToInsert as VehicleInsert])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Le véhicule a été créé avec succès"
      });

      // Navigate to post-creation workflow
      navigate(`/vehicules/${data.id}/workflow`, {
        state: {
          vehicleInfo: {
            marque: data.marque,
            immatriculation: data.immatriculation
          }
        }
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de créer le véhicule",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold">Ajouter véhicule</h1>
        <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground">Tableau de bord</Link>
          <ChevronRight className="w-4 h-4" />
          <Link to="/vehicules" className="hover:text-foreground">Véhicules</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-foreground">Nouveau</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Toggles */}
        <div className="grid grid-cols-2 gap-6">
          <div className="flex items-center gap-3">
            <Switch
              checked={formData.en_service}
              onCheckedChange={(checked) => setFormData({ ...formData, en_service: checked })}
              id="en-service"
            />
            <Label htmlFor="en-service" className="text-base font-normal cursor-pointer">
              Voiture en service
            </Label>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Switch
                checked={formData.sous_location}
                onCheckedChange={(checked) => setFormData({ ...formData, sous_location: checked })}
                id="sous-location"
              />
              <Label htmlFor="sous-location" className="text-base font-normal cursor-pointer">
                Voiture sous location
              </Label>
            </div>
            <p className="text-xs text-muted-foreground ml-11">
              Indiquez si la voiture appartient à une autre agence et que vous utilisez en sous location
            </p>
          </div>
        </div>

        {/* Main Form Fields */}
        <div className="grid grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="marque">Marque *</Label>
              <Select
                value={formData.marque}
                onValueChange={(value) => setFormData({ ...formData, marque: value, modele: '' })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une marque" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BMW">BMW</SelectItem>
                  <SelectItem value="Mercedes">Mercedes</SelectItem>
                  <SelectItem value="Audi">Audi</SelectItem>
                  <SelectItem value="Volkswagen">Volkswagen</SelectItem>
                  <SelectItem value="Renault">Renault</SelectItem>
                  <SelectItem value="Peugeot">Peugeot</SelectItem>
                  <SelectItem value="Dacia">Dacia</SelectItem>
                  <SelectItem value="Toyota">Toyota</SelectItem>
                  <SelectItem value="Hyundai">Hyundai</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="modele">Modèle *</Label>
              <Select
                value={formData.modele}
                onValueChange={(value) => setFormData({ ...formData, modele: value })}
                disabled={!formData.marque}
              >
                <SelectTrigger>
                  <SelectValue placeholder={formData.marque ? "Sélectionner un modèle" : "Sélectionnez d'abord une marque"} />
                </SelectTrigger>
                <SelectContent>
                  {formData.marque && modelesParMarque[formData.marque]?.map((modele) => (
                    <SelectItem key={modele} value={modele}>
                      {modele}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="matricule">Matricule *</Label>
              <Input
                id="matricule"
                value={formData.immatriculation}
                onChange={(e) => setFormData({ ...formData, immatriculation: e.target.value })}
                placeholder="Ex: 1234-A-67"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="carburant">Carburant *</Label>
              <Select defaultValue="diesel">
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

            <div className="space-y-2">
              <Label htmlFor="valeur">Valeur d'achat (Prix TTC)</Label>
              <div className="relative">
                <Input
                  id="valeur"
                  type="number"
                  step="0.01"
                  value={formData.valeur_achat || ''}
                  onChange={(e) => setFormData({ ...formData, valeur_achat: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  DH
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="chassis">N° Châssis</Label>
              <Input
                id="chassis"
                placeholder="Code unique de 17 caractères"
              />
              <p className="text-xs text-muted-foreground">
                N° Châssis (VIN) est un code unique de 17 caractères composé de lettres et de chiffres
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="places">Nombre de places</Label>
              <Input
                id="places"
                type="number"
                placeholder="Ex: 5"
              />
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="categorie">Catégories (Assistance) *</Label>
              <div className="space-y-2">
                {assistanceCategories.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Aucune catégorie disponible</p>
                ) : (
                  assistanceCategories.map((cat) => (
                    <div key={cat.code} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`cat-${cat.code}`}
                        checked={selectedCategories.includes(cat.code)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedCategories([...selectedCategories, cat.code]);
                          } else {
                            setSelectedCategories(selectedCategories.filter(c => c !== cat.code));
                          }
                        }}
                        className="h-4 w-4 rounded border-input"
                      />
                      <Label htmlFor={`cat-${cat.code}`} className="cursor-pointer font-normal">
                        {cat.nom}
                      </Label>
                    </div>
                  ))
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Catégories utilisées pour le calcul des tarifs d'assistance
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="kilometrage">Dernier kilométrage *</Label>
              <div className="relative">
                <Input
                  id="kilometrage"
                  type="number"
                  value={formData.kilometrage}
                  onChange={(e) => setFormData({ ...formData, kilometrage: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                  required
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  KM
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Indiquez le dernier kilométrage après chaque retour de réservation
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="prix">Prix location *</Label>
              <div className="relative">
                <Input
                  id="prix"
                  type="number"
                  step="0.01"
                  value={formData.tarif_journalier}
                  onChange={(e) => setFormData({ ...formData, tarif_journalier: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                  required
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  DH
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date-circulation">Date de mise en circulation</Label>
              <Input
                id="date-circulation"
                type="date"
                value={formData.annee ? `${formData.annee}-01-01` : ''}
                onChange={(e) => {
                  const year = new Date(e.target.value).getFullYear();
                  setFormData({ ...formData, annee: year });
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="concessionaire">Concessionaire</Label>
              <Input
                id="concessionaire"
                placeholder="Nom du concessionaire"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="puissance">Puissance fiscale</Label>
              <div className="relative">
                <Input
                  id="puissance"
                  type="number"
                  placeholder="Ex: 6"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  VC
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="couleur">Couleur</Label>
              <Select defaultValue="">
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
          </div>
        </div>

        {/* Collapsible Additional Fields */}
        <Collapsible open={showMoreFields} onOpenChange={setShowMoreFields}>
          <CollapsibleTrigger asChild>
            <Button type="button" variant="link" className="text-primary mx-auto block">
              <ChevronUp className={`w-4 h-4 mr-2 transition-transform ${!showMoreFields ? 'rotate-180' : ''}`} />
              {showMoreFields ? 'AFFICHER MOINS DE CHAMPS' : 'AFFICHER PLUS DE CHAMPS'}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-4 space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              Pièces jointes, Concessionaire, Couleur, Puissance fiscale, Options, ...
            </p>
            
            {/* File Upload */}
            <Card 
              className="border-dashed border-2 cursor-pointer hover:border-primary transition-colors"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => fileInputRef.current?.click()}
            >
              <CardContent className="flex flex-col items-center justify-center py-12">
                {photoPreview ? (
                  <div className="relative">
                    <img 
                      src={photoPreview} 
                      alt="Aperçu" 
                      className="max-w-full h-48 object-cover rounded-lg"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        removePhoto();
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <Upload className="w-12 h-12 text-primary mb-4" />
                    <p className="text-sm text-muted-foreground">
                      Glisser-déposer, ou <span className="text-primary hover:underline">explorer</span> vos fichiers.
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      PNG, JPG jusqu'à 10MB
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </CollapsibleContent>
        </Collapsible>

        {/* Submit Button */}
        <div className="flex justify-center pt-4">
          <Button type="submit" size="lg" disabled={loading} className="bg-primary hover:bg-primary/90">
            {loading ? 'Création en cours...' : 'CRÉER LE VÉHICULE'}
          </Button>
        </div>
      </form>
    </div>
  );
}
