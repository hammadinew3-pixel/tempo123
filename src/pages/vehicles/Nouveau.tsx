import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ChevronRight, Upload, ChevronUp } from "lucide-react";
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
  const [enService, setEnService] = useState(true);
  const [sousLocation, setSousLocation] = useState(false);

  const [formData, setFormData] = useState<Partial<VehicleInsert>>({
    marque: '',
    immatriculation: '',
    modele: '',
    annee: new Date().getFullYear(),
    kilometrage: 0,
    statut: 'disponible',
    tarif_journalier: 0,
    valeur_achat: 0,
    categorie: undefined,
  });

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
        return;
      }

      const { data, error } = await supabase
        .from('vehicles')
        .insert([formData as VehicleInsert])
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
              checked={enService}
              onCheckedChange={setEnService}
              id="en-service"
            />
            <Label htmlFor="en-service" className="text-base font-normal cursor-pointer">
              Voiture en service
            </Label>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Switch
                checked={sousLocation}
                onCheckedChange={setSousLocation}
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
                onValueChange={(value) => setFormData({ ...formData, marque: value })}
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
              <Label htmlFor="modele">Modèle</Label>
              <Input
                id="modele"
                value={formData.modele}
                onChange={(e) => setFormData({ ...formData, modele: e.target.value })}
                placeholder="Ex: Série 3"
              />
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
              <Label htmlFor="categorie">Catégorie (Assistance) *</Label>
              <Select 
                value={formData.categorie}
                onValueChange={(value) => setFormData({ ...formData, categorie: value as any })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une catégorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">Catégorie A</SelectItem>
                  <SelectItem value="B">Catégorie B</SelectItem>
                  <SelectItem value="C">Catégorie C</SelectItem>
                  <SelectItem value="D">Catégorie D</SelectItem>
                  <SelectItem value="E">Catégorie E</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Catégorie utilisée pour le calcul des tarifs d'assistance
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
            <Card className="border-dashed border-2">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Upload className="w-12 h-12 text-primary mb-4" />
                <p className="text-sm text-muted-foreground">
                  Glisser-déposer, ou <button type="button" className="text-primary hover:underline">explorer</button> votre fichiers.
                </p>
              </CardContent>
            </Card>
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
