import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ChevronRight, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

type Vehicle = Database['public']['Tables']['vehicles']['Row'];
type VehicleStatus = Database['public']['Enums']['vehicle_status'];
type VehicleCategory = Database['public']['Enums']['vehicle_category'];

export default function ModifierVehicule() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAllFields, setShowAllFields] = useState(false);
  
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
    assurance_expire_le: '',
    visite_technique_expire_le: '',
    vignette_expire_le: ''
  });

  const [isInService, setIsInService] = useState(true);
  const [isSousLocation, setIsSousLocation] = useState(false);

  useEffect(() => {
    if (id) {
      loadVehicle();
    }
  }, [id]);

  const loadVehicle = async () => {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('id', id)
        .single();

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
        assurance_expire_le: data.assurance_expire_le || '',
        visite_technique_expire_le: data.visite_technique_expire_le || '',
        vignette_expire_le: data.vignette_expire_le || ''
      });

      setIsInService(data.statut === 'disponible' || data.statut === 'loue' || data.statut === 'reserve');
      
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const updateData = {
        ...formData,
        statut: isInService ? formData.statut : 'en_panne' as VehicleStatus
      };

      const { error } = await supabase
        .from('vehicles')
        .update(updateData)
        .eq('id', id);

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

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Modifier le véhicule {formData.immatriculation}
        </h1>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground">Tableau de bord</Link>
          <ChevronRight className="w-4 h-4" />
          <Link to="/vehicules" className="hover:text-foreground">Véhicules</Link>
          <ChevronRight className="w-4 h-4" />
          <Link to={`/vehicules/${id}`} className="hover:text-foreground">
            Véhicule Mat. {formData.immatriculation}
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-foreground">Modifier</span>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="p-6">
          {/* Switches */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-semibold">Voiture en service</Label>
              </div>
              <Switch
                checked={isInService}
                onCheckedChange={setIsInService}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-semibold">Voiture sous location</Label>
                <p className="text-sm text-muted-foreground">
                  Indiquez si la voiture appartient à une autre agence et que vous utilisez en sous-location
                </p>
              </div>
              <Switch
                checked={isSousLocation}
                onCheckedChange={setIsSousLocation}
              />
            </div>
          </div>

          {/* Basic Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Marque */}
            <div>
              <Label htmlFor="marque">Marque *</Label>
              <Select 
                value={formData.marque} 
                onValueChange={(value) => setFormData({...formData, marque: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner" />
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
                  <SelectItem value="Kia">Kia</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Catégorie */}
            <div>
              <Label htmlFor="categorie">Catégorie *</Label>
              <Select 
                value={formData.categorie} 
                onValueChange={(value) => setFormData({...formData, categorie: value as VehicleCategory})}
              >
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
              <Input
                id="immatriculation"
                value={formData.immatriculation}
                onChange={(e) => setFormData({...formData, immatriculation: e.target.value})}
                required
              />
            </div>

            {/* Dernier kilométrage */}
            <div>
              <Label htmlFor="kilometrage">Dernier kilométrage *</Label>
              <div className="relative">
                <Input
                  id="kilometrage"
                  type="number"
                  value={formData.kilometrage}
                  onChange={(e) => setFormData({...formData, kilometrage: parseInt(e.target.value) || 0})}
                  required
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">KM</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Indiquez le dernier kilométrage après chaque retour de réservation
              </p>
            </div>

            {/* Modèle */}
            <div>
              <Label htmlFor="modele">Modèle</Label>
              <Input
                id="modele"
                value={formData.modele}
                onChange={(e) => setFormData({...formData, modele: e.target.value})}
                placeholder="Ex: Serie 3"
              />
            </div>

            {/* Prix location */}
            <div>
              <Label htmlFor="tarif_journalier">Prix location *</Label>
              <div className="relative">
                <Input
                  id="tarif_journalier"
                  type="number"
                  value={formData.tarif_journalier}
                  onChange={(e) => setFormData({...formData, tarif_journalier: parseFloat(e.target.value) || 0})}
                  required
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">DH</span>
              </div>
            </div>

            {/* Date de mise en circulation */}
            <div className="md:col-span-2">
              <Label htmlFor="annee">Date de mise en circulation</Label>
              <Input
                id="annee"
                type="number"
                value={formData.annee}
                onChange={(e) => setFormData({...formData, annee: parseInt(e.target.value) || new Date().getFullYear()})}
                placeholder="YYYY"
              />
            </div>
          </div>

          {/* Show all fields toggle */}
          <div className="mb-6">
            <button
              type="button"
              onClick={() => setShowAllFields(!showAllFields)}
              className="flex items-center gap-2 text-primary hover:underline font-medium"
            >
              AFFICHER TOUS LES CHAMPS
              {showAllFields ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            <p className="text-sm text-muted-foreground mt-1">
              Pièces jointes, Concessionaire, Couleur, Puissance fiscale, Options, ...
            </p>
          </div>

          {/* Advanced Fields */}
          {showAllFields && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 pt-6 border-t">
              <div>
                <Label htmlFor="valeur_achat">Valeur d'achat</Label>
                <div className="relative">
                  <Input
                    id="valeur_achat"
                    type="number"
                    value={formData.valeur_achat}
                    onChange={(e) => setFormData({...formData, valeur_achat: parseFloat(e.target.value) || 0})}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">DH</span>
                </div>
              </div>

              <div>
                <Label htmlFor="photo_url">URL de la photo</Label>
                <Input
                  id="photo_url"
                  value={formData.photo_url}
                  onChange={(e) => setFormData({...formData, photo_url: e.target.value})}
                  placeholder="https://..."
                />
              </div>

              <div>
                <Label htmlFor="assurance_expire_le">Date d'expiration assurance</Label>
                <Input
                  id="assurance_expire_le"
                  type="date"
                  value={formData.assurance_expire_le}
                  onChange={(e) => setFormData({...formData, assurance_expire_le: e.target.value})}
                />
              </div>

              <div>
                <Label htmlFor="visite_technique_expire_le">Date d'expiration visite technique</Label>
                <Input
                  id="visite_technique_expire_le"
                  type="date"
                  value={formData.visite_technique_expire_le}
                  onChange={(e) => setFormData({...formData, visite_technique_expire_le: e.target.value})}
                />
              </div>

              <div>
                <Label htmlFor="vignette_expire_le">Date d'expiration vignette</Label>
                <Input
                  id="vignette_expire_le"
                  type="date"
                  value={formData.vignette_expire_le}
                  onChange={(e) => setFormData({...formData, vignette_expire_le: e.target.value})}
                />
              </div>

              <div>
                <Label htmlFor="statut">Statut</Label>
                <Select 
                  value={formData.statut} 
                  onValueChange={(value) => setFormData({...formData, statut: value as VehicleStatus})}
                  disabled={!isInService}
                >
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
          )}

          {/* Submit Button */}
          <div className="flex justify-center pt-4">
            <Button 
              type="submit" 
              size="lg"
              disabled={saving}
            >
              {saving ? "ENREGISTREMENT..." : "ENREGISTRER LES MODIFICATIONS"}
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
}
