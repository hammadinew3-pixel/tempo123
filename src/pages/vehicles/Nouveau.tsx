import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ChevronRight, Upload, ChevronUp, X, Loader2, Layers } from "lucide-react";
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
import { useTenantPlan } from '@/hooks/useTenantPlan';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
type VehicleInsert = Database['public']['Tables']['vehicles']['Insert'] & {
  numero_chassis?: string | null;
  couleur?: string | null;
  concessionnaire?: string | null;
  puissance_fiscale?: number | null;
  nombre_places?: number | null;
  date_mise_en_circulation?: string | null;
};
export default function NouveauVehicule() {
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const [loading, setLoading] = useState(false);
  const [showMoreFields, setShowMoreFields] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [assistanceCategories, setAssistanceCategories] = useState<Array<{
    code: string;
    nom: string;
  }>>([]);
  const {
    data: planData,
    isLoading: loadingPlan
  } = useTenantPlan();
  const [formData, setFormData] = useState<Partial<VehicleInsert>>({
    marque: '',
    ww: '',
    immatriculation: '',
    modele: '',
    annee: new Date().getFullYear(),
    kilometrage: 0,
    statut: 'disponible',
    tarif_journalier: 0,
    tarif_sous_location: 0,
    valeur_achat: 0,
    en_service: true,
    sous_location: false,
    numero_chassis: '',
    couleur: '',
    concessionnaire: '',
    puissance_fiscale: undefined,
    nombre_places: undefined,
    date_mise_en_circulation: null,
    type_vehicule: 'proprietaire'
  });
  const [carburant, setCarburant] = useState<string>('diesel');
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
    Hyundai: ['i10', 'i20', 'Elantra', 'Tucson', 'Santa Fe', 'Kona']
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
    if (planData?.modules?.assistance) {
      loadAssistanceCategories();
    }
  }, [planData]);
  const loadAssistanceCategories = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('vehicle_assistance_categories').select('code, nom').eq('actif', true).order('ordre');
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
      if (!formData.marque || !formData.modele || !formData.tarif_journalier || !carburant) {
        toast({
          title: "Erreur",
          description: "Veuillez remplir tous les champs obligatoires (Marque, Modèle, Carburant, Tarif journalier)",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }
      if (formData.kilometrage === undefined || formData.kilometrage === null) {
        toast({
          title: "Erreur",
          description: "Veuillez indiquer le dernier kilométrage",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

      // Note: Pour l'instant, nous stockons juste le preview comme photo_url
      // Dans une implémentation complète, vous devriez uploader vers Supabase Storage
      const dataToInsert = {
        ...formData,
        carburant,
        categories: selectedCategories,
        photo_url: photoPreview || null,
        // Convert empty strings to null for date fields
        date_mise_en_circulation: formData.date_mise_en_circulation || null
      };
      const {
        data,
        error
      } = await supabase.from('vehicles').insert([dataToInsert as VehicleInsert]).select().single();
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
  if (loadingPlan) {
    return <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>;
  }

  // Bloquer si quota véhicules atteint
  if (planData && !planData.usage.vehicles.canAdd) {
    return <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Limite de véhicules atteinte</AlertTitle>
          <AlertDescription>
            Vous avez atteint la limite de <strong>{planData.usage.vehicles.max} véhicules</strong> de votre plan actuel ({planData.plan?.name}).
            <br />
            Pour ajouter plus de véhicules, veuillez mettre à niveau votre plan.
            <div className="mt-3">
              <Button variant="outline" asChild>
                <Link to="/parametres">
                  <Layers className="h-4 w-4 mr-2" />
                  Changer de plan
                </Link>
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>;
  }

  // Warning si proche de la limite
  const showWarning = planData && planData.usage.vehicles.percentage > 80;
  return <div className="p-6 max-w-7xl mx-auto space-y-6">
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

      {showWarning && <Alert variant="destructive" className="border-orange-500">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Vous approchez de la limite : {planData.usage.vehicles.current}/{planData.usage.vehicles.max} véhicules utilisés ({planData.usage.vehicles.percentage}%).
            Pensez à mettre à niveau votre plan.
          </AlertDescription>
        </Alert>}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Toggles */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-center gap-3">
            <Switch checked={formData.en_service} onCheckedChange={checked => setFormData({
            ...formData,
            en_service: checked
          })} id="en-service" />
            <Label htmlFor="en-service" className="text-base font-normal cursor-pointer">
              Voiture en service
            </Label>
          </div>
          <div className="space-y-2">
            <Label htmlFor="type_vehicule">Type de véhicule *</Label>
            <Select value={formData.type_vehicule} onValueChange={value => setFormData({
              ...formData,
              type_vehicule: value as any
            })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="proprietaire">✅ Véhicule propriétaire</SelectItem>
                <SelectItem value="sous_location">Véhicule en sous-location</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Encart information pour sous-location */}
        {formData.type_vehicule === 'sous_location' && (
          <Alert className="bg-muted border-border">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              💡 Ce véhicule est en sous-location ; les coûts seront enregistrés automatiquement dans les dépenses.
              Les alertes et documents techniques ne s'appliquent pas.
            </AlertDescription>
          </Alert>
        )}

        {/* Main Form Fields */}
        <div className="grid grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="marque">Marque *</Label>
              <Select value={formData.marque} onValueChange={value => setFormData({
              ...formData,
              marque: value,
              modele: ''
            })}>
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
              <Select value={formData.modele} onValueChange={value => setFormData({
              ...formData,
              modele: value
            })} disabled={!formData.marque}>
                <SelectTrigger>
                  <SelectValue placeholder={formData.marque ? "Sélectionner un modèle" : "Sélectionnez d'abord une marque"} />
                </SelectTrigger>
                <SelectContent>
                  {formData.marque && modelesParMarque[formData.marque]?.map(modele => <SelectItem key={modele} value={modele}>
                      {modele}
                    </SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ww">WW (Matricule provisoire)</Label>
              <Input id="ww" value={formData.ww || ''} onChange={e => setFormData({
              ...formData,
              ww: e.target.value
            })} placeholder="Ex: WW-1234-2024" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="matricule">Matricule</Label>
              <Input id="matricule" value={formData.immatriculation} onChange={e => setFormData({
              ...formData,
              immatriculation: e.target.value
            })} placeholder="Ex: 1234-A-67" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="carburant">Carburant *</Label>
              <Select value={carburant} onValueChange={setCarburant}>
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

            {/* Tarif client (toujours affiché) */}
            <div className="space-y-2">
              <Label htmlFor="tarif">Tarif journalier (DH) *</Label>
              <div className="relative">
                <Input
                  id="tarif"
                  type="number"
                  value={formData.tarif_journalier}
                  onChange={e => setFormData({ ...formData, tarif_journalier: parseFloat(e.target.value) || 0 })}
                  placeholder="Ex: 300"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">DH</span>
              </div>
            </div>

            {/* Coût fournisseur (uniquement pour sous-location) */}
            {formData.type_vehicule === 'sous_location' && (
              <div className="space-y-2">
                <Label htmlFor="tarif_sous_location" className="text-orange-400">
                  Coût journalier de sous-location (DH) * <span className="text-xs">(Interne)</span>
                </Label>
                <div className="relative">
                  <Input
                    id="tarif_sous_location"
                    type="number"
                    value={formData.tarif_sous_location || 0}
                    onChange={e => setFormData({ ...formData, tarif_sous_location: parseFloat(e.target.value) || 0 })}
                    placeholder="Ex: 200"
                    required
                    className="border-orange-500/50"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">DH</span>
                </div>
                <p className="text-xs text-muted-foreground">Ce coût ne sera jamais visible dans les contrats clients</p>
              </div>
            )}

            {/* Valeur d'achat (masqué pour sous-location) */}
            {formData.type_vehicule !== 'sous_location' && (
              <div className="space-y-2">
                <Label htmlFor="valeur">Valeur d'achat (Prix TTC)</Label>
                <div className="relative">
                  <Input id="valeur" type="number" step="0.01" value={formData.valeur_achat || ''} onChange={e => setFormData({
                    ...formData,
                    valeur_achat: parseFloat(e.target.value) || 0
                  })} placeholder="0.00" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    DH
                  </span>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="chassis">N° Châssis</Label>
              <Input id="chassis" value={formData.numero_chassis || ''} onChange={e => setFormData({
              ...formData,
              numero_chassis: e.target.value
            })} placeholder="Code unique de 17 caractères" />
              <p className="text-xs text-muted-foreground">
                N° Châssis (VIN) est un code unique de 17 caractères composé de lettres et de chiffres
              </p>
            </div>

          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {planData?.modules?.assistance && <div className="space-y-2">
                <Label htmlFor="categorie">Catégories (Assistance)</Label>
                <div className="space-y-2">
                  {assistanceCategories.length === 0 ? <p className="text-sm text-muted-foreground">Aucune catégorie disponible</p> : assistanceCategories.map(cat => <div key={cat.code} className="flex items-center gap-2">
                        <input type="checkbox" id={`cat-${cat.code}`} checked={selectedCategories.includes(cat.code)} onChange={e => {
                  if (e.target.checked) {
                    setSelectedCategories([...selectedCategories, cat.code]);
                  } else {
                    setSelectedCategories(selectedCategories.filter(c => c !== cat.code));
                  }
                }} className="h-4 w-4 rounded border-input" />
                        <Label htmlFor={`cat-${cat.code}`} className="cursor-pointer font-normal">
                          {cat.nom}
                        </Label>
                      </div>)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Catégories utilisées pour le calcul des tarifs d'assistance
                </p>
              </div>}

            <div className="space-y-2">
              <Label htmlFor="kilometrage">Dernier kilométrage *</Label>
              <div className="relative">
                <Input id="kilometrage" type="number" value={formData.kilometrage} onChange={e => setFormData({
                ...formData,
                kilometrage: parseInt(e.target.value) || 0
              })} placeholder="0" required />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  KM
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Indiquez le dernier kilométrage après chaque retour de réservation
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date-circulation">Date de mise en circulation</Label>
              <Input id="date-circulation" type="date" value={formData.date_mise_en_circulation || ''} onChange={e => setFormData({
              ...formData,
              date_mise_en_circulation: e.target.value
            })} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="concessionaire">Concessionaire</Label>
              <Input id="concessionaire" value={formData.concessionnaire || ''} onChange={e => setFormData({
              ...formData,
              concessionnaire: e.target.value
            })} placeholder="Nom du concessionaire" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="puissance">Puissance fiscale</Label>
              <div className="relative">
                <Input id="puissance" type="number" value={formData.puissance_fiscale || ''} onChange={e => setFormData({
                ...formData,
                puissance_fiscale: parseInt(e.target.value) || undefined
              })} placeholder="Ex: 6" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  VC
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="couleur">Couleur</Label>
              <Select value={formData.couleur || ''} onValueChange={value => setFormData({
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

            <div className="space-y-2">
              <Label htmlFor="places">Nombre de places</Label>
              <Input id="places" type="number" value={formData.nombre_places || ''} onChange={e => setFormData({
              ...formData,
              nombre_places: parseInt(e.target.value) || undefined
            })} placeholder="Ex: 5" />
            </div>
          </div>
        </div>

        {/* Collapsible Additional Fields */}
        <Collapsible open={showMoreFields} onOpenChange={setShowMoreFields}>
          <CollapsibleTrigger asChild>
            <Button type="button" variant="outline" className="w-full">
              <ChevronUp className={`w-4 h-4 mr-2 transition-transform ${showMoreFields ? '' : 'rotate-180'}`} />
              {showMoreFields ? 'Masquer les options' : 'Ajouter une photo'}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-4 space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              Pièces jointes, Concessionaire, Couleur, Puissance fiscale, Options, ...
            </p>
            
            {/* File Upload */}
            <Card className="border-dashed border-2 cursor-pointer hover:border-primary transition-colors" onDrop={handleDrop} onDragOver={handleDragOver} onClick={() => fileInputRef.current?.click()}>
              <CardContent className="flex flex-col items-center justify-center py-12">
                {photoPreview ? <div className="relative">
                    <img src={photoPreview} alt="Aperçu" className="max-w-full h-48 object-cover rounded-lg" />
                    <Button type="button" variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6 rounded-full" onClick={e => {
                  e.stopPropagation();
                  removePhoto();
                }}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div> : <>
                    <Upload className="w-12 h-12 text-primary mb-4" />
                    <p className="text-sm text-muted-foreground">
                      Glisser-déposer, ou <span className="text-primary hover:underline">explorer</span> vos fichiers.
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      PNG, JPG jusqu'à 10MB
                    </p>
                  </>}
              </CardContent>
            </Card>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
          </CollapsibleContent>
        </Collapsible>

        {/* Submit Button */}
        <div className="flex justify-center pt-4">
          <Button type="submit" size="lg" disabled={loading} className="bg-primary hover:bg-primary/90">
            {loading ? 'Création en cours...' : 'CRÉER LE VÉHICULE'}
          </Button>
        </div>
      </form>
    </div>;
}