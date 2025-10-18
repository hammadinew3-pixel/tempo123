import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarIcon, Clock, Car, User as UserIcon, Plus, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { Database } from "@/integrations/supabase/types";
import { useTenant } from "@/contexts/TenantContext";

type Bareme = Database["public"]["Tables"]["assurance_bareme"]["Row"];

export default function NouveauLocation() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [allVehicles, setAllVehicles] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [assurances, setAssurances] = useState<any[]>([]);
  const [baremes, setBaremes] = useState<Bareme[]>([]);
  const [contractType, setContractType] = useState<"standard" | "assistance">("standard");
  const [selectedCategorie, setSelectedCategorie] = useState<string>("");
  const [ordreMissionFile, setOrdreMissionFile] = useState<File | null>(null);
  const [ordreMissionPreview, setOrdreMissionPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [dateDebutOpen, setDateDebutOpen] = useState(false);
  const [dateFinOpen, setDateFinOpen] = useState(false);

  const [formData, setFormData] = useState({
    vehicle_id: "",
    client_id: "",
    assurance_id: "",
    date_debut: new Date(),
    date_fin: new Date(new Date().getTime() + 24 * 60 * 60 * 1000), // +1 jour
    start_time: "",
    end_time: "",
    numero_contrat: `CTR-${Date.now()}`,
    num_dossier: `DOS-${Date.now()}`,
    surcharge: 0,
    remise: 0,
    start_location: "",
    end_location: "",
    notes: "",
    franchise_montant: 0,
    advance_payment: 0,
    payment_method: "especes",
  });

  const [calculatedValues, setCalculatedValues] = useState({
    duration: 1,
    daily_rate: 0,
    subtotal: 0,
    total: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    calculateAmounts();
  }, [
    formData.vehicle_id,
    formData.date_debut,
    formData.date_fin,
    formData.surcharge,
    formData.remise,
    formData.assurance_id,
    contractType,
    baremes,
    selectedCategorie,
  ]);

  // Filtrer les véhicules disponibles en fonction des dates
  useEffect(() => {
    if (formData.date_debut && formData.date_fin) {
      filterAvailableVehicles();
    }
  }, [formData.date_debut, formData.date_fin, contractType, selectedCategorie]);

  const loadData = async () => {
    try {
      const [vehiclesRes, clientsRes, assurancesRes] = await Promise.all([
        supabase.from("vehicles").select("*"),
        supabase.from("clients").select("*"),
        supabase.from("assurances").select("*").eq("actif", true),
      ]);

      if (vehiclesRes.error) throw vehiclesRes.error;
      if (clientsRes.error) throw clientsRes.error;
      if (assurancesRes.error) throw assurancesRes.error;

      const vehiclesData = vehiclesRes.data || [];
      setAllVehicles(vehiclesData);
      setVehicles(vehiclesData);
      setClients(clientsRes.data || []);
      setAssurances(assurancesRes.data || []);
    } catch (error) {
      console.error("Erreur chargement:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de charger les données",
      });
    }
  };

  const filterAvailableVehicles = async () => {
    try {
      const startDate = format(formData.date_debut, 'yyyy-MM-dd');
      const endDate = format(formData.date_fin, 'yyyy-MM-dd');

      // Récupérer tous les contrats qui se chevauchent avec les dates sélectionnées
      const { data: overlappingContracts, error } = await supabase
        .from('contracts')
        .select('vehicle_id')
        .or(`and(date_debut.lte.${endDate},date_fin.gte.${startDate})`)
        .in('statut', ['brouillon', 'contrat_valide', 'livre']);

      if (error) throw error;

      // IDs des véhicules déjà réservés
      const reservedVehicleIds = overlappingContracts?.map(c => c.vehicle_id) || [];

      // Filtrer les véhicules
      let availableVehicles = allVehicles.filter(v => 
        v.statut === 'disponible' && !reservedVehicleIds.includes(v.id)
      );

      // Si c'est une assistance, filtrer par catégorie
      if (contractType === 'assistance' && selectedCategorie) {
        availableVehicles = availableVehicles.filter(v =>
          (Array.isArray(v.categories) && v.categories.includes(selectedCategorie)) || v.categorie === selectedCategorie
        );
      }

      setVehicles(availableVehicles);
      
      // Réinitialiser la sélection du véhicule si celui-ci n'est plus disponible
      if (formData.vehicle_id && !availableVehicles.find(v => v.id === formData.vehicle_id)) {
        setFormData(prev => ({ ...prev, vehicle_id: '' }));
      }
    } catch (error) {
      console.error('Erreur filtrage véhicules:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de vérifier les disponibilités",
      });
    }
  };

  const loadBaremes = async (assuranceId: string) => {
    try {
      const { data, error } = await supabase
        .from("assurance_bareme")
        .select("*")
        .eq("assurance_id", assuranceId);

      if (error) throw error;
      setBaremes(data || []);
      setSelectedCategorie("");
      setFormData((prev) => ({ ...prev, vehicle_id: "" }));
      setVehicles(allVehicles);
    } catch (error) {
      console.error("Erreur chargement barèmes:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de charger les barèmes de l'assurance",
      });
    }
  };

  const handleCategorieSelect = (categorie: string) => {
    setSelectedCategorie(categorie);
    // Filtrer les véhicules par catégorie
    const filteredVehicles = allVehicles.filter((v) => (Array.isArray(v.categories) && v.categories.includes(categorie)) || v.categorie === categorie);
    setVehicles(filteredVehicles);
    setFormData((prev) => ({ ...prev, vehicle_id: "" }));
  };

  const calculateAmounts = () => {
    let daily_rate = 0;

    if (contractType === "assistance" && selectedCategorie) {
      // Pour un contrat d'assistance, utiliser le barème de l'assurance basé sur la catégorie sélectionnée
      const bareme = baremes.find((b) => b.categorie === selectedCategorie);
      daily_rate = bareme?.tarif_journalier || 0;
    } else {
      // Pour un contrat standard, utiliser le tarif du véhicule
      const selectedVehicle = vehicles.find((v) => v.id === formData.vehicle_id);
      daily_rate = selectedVehicle?.tarif_journalier || 0;
    }

    const start = new Date(formData.date_debut);
    const end = new Date(formData.date_fin);
    const duration = Math.max(
      1,
      Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    );

    const subtotal = duration * daily_rate;
    const total = subtotal + (formData.surcharge || 0) - (formData.remise || 0);

    setCalculatedValues({
      duration,
      daily_rate,
      subtotal,
      total,
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setOrdreMissionFile(file);
      setOrdreMissionPreview(file.name);
    }
  };

  const removeFile = () => {
    setOrdreMissionFile(null);
    setOrdreMissionPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.vehicle_id || !formData.client_id) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Veuillez sélectionner un véhicule et un client",
      });
      return;
    }

    if (contractType === "assistance") {
      if (!formData.assurance_id) {
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Veuillez sélectionner une assurance",
        });
        return;
      }
      if (!selectedCategorie) {
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Veuillez sélectionner une catégorie du barème",
        });
        return;
      }
    }

    setLoading(true);

    try {
      let ordreMissionUrl = null;

      // Upload ordre de mission file if exists (only for assistance)
      if (contractType === "assistance" && ordreMissionFile) {
        const fileExt = ordreMissionFile.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `ordre-mission/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('client-documents')
          .upload(filePath, ordreMissionFile);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('client-documents')
          .getPublicUrl(filePath);

        ordreMissionUrl = urlData.publicUrl;
      }

      if (contractType === "standard") {
        // Créer un contrat standard
        const { error } = await supabase.from("contracts").insert([
          {
            numero_contrat: formData.numero_contrat,
            client_id: formData.client_id,
            vehicle_id: formData.vehicle_id,
            date_debut: format(formData.date_debut, "yyyy-MM-dd"),
            date_fin: format(formData.date_fin, "yyyy-MM-dd"),
            start_time: formData.start_time || null,
            end_time: formData.end_time || null,
            statut: "brouillon",
            caution_montant: formData.franchise_montant,
            caution_statut: "bloquee",
            advance_payment: formData.advance_payment,
            payment_method: (formData.payment_method === 'carte' ? 'carte_bancaire' : formData.payment_method) as any,
            start_location: formData.start_location || null,
            end_location: formData.end_location || null,
            notes: formData.notes || null,
          },
        ]);

        if (error) throw error;

        toast({
          title: "Succès",
          description: "Location créée avec succès",
        });

        navigate("/locations");
      } else {
        // Créer un dossier d'assistance
        const selectedAssurance = assurances.find((a) => a.id === formData.assurance_id);
        const { data, error } = await supabase.from("assistance").insert([
          {
            num_dossier: formData.num_dossier,
            client_id: formData.client_id,
            vehicle_id: formData.vehicle_id,
            assureur_id: formData.assurance_id,
            assureur_nom: selectedAssurance?.nom || "",
            date_debut: format(formData.date_debut, "yyyy-MM-dd"),
            date_fin: format(formData.date_fin, "yyyy-MM-dd"),
            type: "remplacement",
            etat: "ouvert",
            tarif_journalier: calculatedValues.daily_rate,
            montant_total: calculatedValues.total,
            franchise_montant: formData.franchise_montant,
            remarques: formData.notes || null,
            ordre_mission_url: ordreMissionUrl,
          },
        ]).select();

        if (error) throw error;

        toast({
          title: "Succès",
          description: "Dossier d'assistance créé avec succès",
        });

        // Rediriger vers la page de détails du dossier pour compléter les informations
        if (data && data[0]) {
          navigate(`/assistance/${data[0].id}`);
        } else {
          navigate("/assistance");
        }
      }
    } catch (error: any) {
      console.error("Erreur création:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message || "Impossible de créer le dossier",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header with Breadcrumb */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Ajouter une location courte durée</h1>
        <div className="flex items-center text-sm text-muted-foreground space-x-2">
          <span>Tableau de bord</span>
          <span>›</span>
          <span>Locations</span>
          <span>›</span>
          <span className="text-foreground">Nouvelle</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Type de contrat */}
        <div className="space-y-3 p-4 border rounded-lg bg-card">
          <Label className="text-base font-semibold">Type de contrat</Label>
          <RadioGroup
            value={contractType}
            onValueChange={(value: "standard" | "assistance") => {
              setContractType(value);
              setFormData({ ...formData, assurance_id: "" });
              setBaremes([]);
            }}
            className="flex gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="standard" id="standard" />
              <Label htmlFor="standard" className="cursor-pointer font-normal">
                Contrat standard
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="assistance" id="assistance" />
              <Label htmlFor="assistance" className="cursor-pointer font-normal">
                Contrat assistance
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Assurance Selection (only for assistance) */}
        {contractType === "assistance" && (
          <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
            <div className="space-y-2">
              <Label htmlFor="assurance">
                Sélectionner une assurance <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.assurance_id}
                onValueChange={(value) => {
                  setFormData({ ...formData, assurance_id: value });
                  loadBaremes(value);
                }}
              >
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Sélectionner une assurance" />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  {assurances.map((assurance) => (
                    <SelectItem key={assurance.id} value={assurance.id}>
                      {assurance.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {baremes.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-semibold">
                  Sélectionner une catégorie <span className="text-destructive">*</span>
                </Label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  {baremes.map((bareme) => (
                    <Button
                      key={bareme.id}
                      type="button"
                      variant={selectedCategorie === bareme.categorie ? "default" : "outline"}
                      onClick={() => handleCategorieSelect(bareme.categorie)}
                      className="p-4 h-auto flex flex-col items-center"
                    >
                      <p className="text-xs mb-1">Catégorie {bareme.categorie}</p>
                      <p className="text-lg font-bold">{bareme.tarif_journalier} DH</p>
                      <p className="text-xs">par jour</p>
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Dates & Times - PREMIER */}
        <div className="space-y-2 p-4 border rounded-lg bg-blue-50 dark:bg-blue-900/10">
          <div className="flex items-center gap-2 mb-2">
            <CalendarIcon className="w-5 h-5 text-blue-600" />
            <Label className="text-base font-semibold">Période de location</Label>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Sélectionnez d&apos;abord les dates pour voir les véhicules disponibles
          </p>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Date départ */}
            <div className="space-y-2">
              <Label>
                Date de départ <span className="text-destructive">*</span>
              </Label>
              <Popover open={dateDebutOpen} onOpenChange={setDateDebutOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "h-12 w-full justify-start text-left font-normal",
                      !formData.date_debut && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.date_debut ? (
                      format(formData.date_debut, "dd/MM/yyyy", { locale: fr })
                    ) : (
                      <span>Sélectionner</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.date_debut}
                    onSelect={(date) => {
                      if (date) {
                        setFormData({ ...formData, date_debut: date, date_fin: date });
                        setDateDebutOpen(false);
                      }
                    }}
                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Heure départ */}
            <div className="space-y-2">
              <Label>
                Heure de départ {contractType === "standard" && <span className="text-destructive">*</span>}
              </Label>
              <div className="relative">
                <Input
                  type="time"
                  value={formData.start_time}
                  onChange={(e) =>
                    setFormData({ ...formData, start_time: e.target.value })
                  }
                  className="h-12"
                />
                <Clock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
              </div>
            </div>

            {/* Date retour */}
            <div className="space-y-2">
              <Label>
                Date de retour <span className="text-destructive">*</span>
              </Label>
              <Popover open={dateFinOpen} onOpenChange={setDateFinOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "h-12 w-full justify-start text-left font-normal",
                      !formData.date_fin && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.date_fin ? (
                      format(formData.date_fin, "dd/MM/yyyy", { locale: fr })
                    ) : (
                      <span>Sélectionner</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.date_fin}
                    onSelect={(date) => {
                      if (date) {
                        setFormData({ ...formData, date_fin: date });
                        setDateFinOpen(false);
                      }
                    }}
                    disabled={(date) => {
                      const today = new Date(new Date().setHours(0, 0, 0, 0));
                      return date < today || (formData.date_debut && date < formData.date_debut);
                    }}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Heure retour */}
            <div className="space-y-2">
              <Label>
                Heure de retour {contractType === "standard" && <span className="text-destructive">*</span>}
              </Label>
              <div className="relative">
                <Input
                  type="time"
                  value={formData.end_time}
                  onChange={(e) =>
                    setFormData({ ...formData, end_time: e.target.value })
                  }
                  className="h-12"
                />
                <Clock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
              </div>
            </div>
          </div>
          {vehicles.length === 0 && formData.date_debut && formData.date_fin && (
            <p className="text-sm text-orange-600 mt-2">
              ⚠️ Aucun véhicule disponible pour cette période
            </p>
          )}
          {vehicles.length > 0 && formData.date_debut && formData.date_fin && (
            <p className="text-sm text-green-600 mt-2">
              ✓ {vehicles.length} véhicule(s) disponible(s) pour cette période
            </p>
          )}
        </div>

        {/* Vehicle & Client Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Vehicle */}
          <div className="space-y-2">
            <Label htmlFor="vehicle">
              Sélectionner un véhicule <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Select
                value={formData.vehicle_id}
                onValueChange={(value) =>
                  setFormData({ ...formData, vehicle_id: value })
                }
                disabled={vehicles.length === 0}
              >
                <SelectTrigger className="h-12">
                  <SelectValue placeholder={vehicles.length === 0 ? "Sélectionnez d'abord les dates" : "Sélectionner un véhicule"} />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  {vehicles.map((vehicle) => (
                    <SelectItem key={vehicle.id} value={vehicle.id}>
                      <div className="flex items-center space-x-2">
                        <Car className="w-4 h-4" />
                        <span>
                          {vehicle.marque} {vehicle.modele} - {vehicle.immatriculation}
                          {contractType === "assistance" && (
                            <span className="ml-2 text-xs text-muted-foreground">
                              {Array.isArray(vehicle.categories) && vehicle.categories.length > 0
                                ? `(Cat. ${vehicle.categories.join(', ')})`
                                : vehicle.categorie ? `(Cat. ${vehicle.categorie})` : ''}
                            </span>
                          )}
                          <span className="ml-2 text-xs text-green-600">
                            ({vehicle.tarif_journalier} DH/jour)
                          </span>
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Car className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          {/* Client */}
          <div className="space-y-2">
            <Label htmlFor="client">
              Sélectionner un client <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Select
                value={formData.client_id}
                onValueChange={(value) =>
                  setFormData({ ...formData, client_id: value })
                }
              >
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Sélectionner un client" />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      <div className="flex items-center space-x-2">
                        <UserIcon className="w-4 h-4" />
                        <span>
                          {client.nom} {client.prenom}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => navigate("/clients/nouveau")}
                >
                  <Plus className="w-4 h-4" />
                </Button>
                <UserIcon className="w-5 h-5 text-muted-foreground" />
              </div>
            </div>
          </div>
        </div>

        {/* Prices & Duration */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Prix journalier (read-only) */}
          <div className="space-y-2">
            <Label>
              Prix de journée <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Input
                type="text"
                value={calculatedValues.daily_rate.toFixed(2)}
                readOnly
                className="h-12 bg-muted"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                DH
              </span>
            </div>
          </div>

          {/* Durée (read-only) */}
          <div className="space-y-2">
            <Label>
              Durée <span className="text-destructive">*</span>
            </Label>
            <Select value={calculatedValues.duration.toString()} disabled>
              <SelectTrigger className="h-12 bg-muted">
                <SelectValue>
                  {calculatedValues.duration.toString().padStart(2, "0")} Jours
                </SelectValue>
              </SelectTrigger>
            </Select>
          </div>

          {/* Sous-total (read-only) */}
          <div className="space-y-2">
            <Label>
              Sous-total <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Input
                type="text"
                value={calculatedValues.subtotal.toFixed(2)}
                readOnly
                className="h-12 bg-muted"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                DH
              </span>
            </div>
          </div>

          {/* Numéro réservation */}
          <div className="space-y-2">
            <Label>
              N° de réservation <span className="text-destructive">*</span>
            </Label>
            <Input
              type="text"
              value={formData.numero_contrat}
              onChange={(e) =>
                setFormData({ ...formData, numero_contrat: e.target.value })
              }
              className="h-12"
            />
          </div>
        </div>

        {/* Surcharge, Remise, Lieux */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Surcharge */}
          <div className="space-y-2">
            <Label>Surcharge</Label>
            <div className="relative">
              <Input
                type="number"
                step="0.01"
                value={formData.surcharge}
                onChange={(e) =>
                  setFormData({ ...formData, surcharge: parseFloat(e.target.value) || 0 })
                }
                className="h-12"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                DH
              </span>
            </div>
          </div>

          {/* Remise */}
          <div className="space-y-2">
            <Label>Remise</Label>
            <div className="relative">
              <Input
                type="number"
                step="0.01"
                value={formData.remise}
                onChange={(e) =>
                  setFormData({ ...formData, remise: parseFloat(e.target.value) || 0 })
                }
                className="h-12"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                DH
              </span>
            </div>
          </div>

          {/* Lieu départ */}
          <div className="space-y-2">
            <Label>Lieu départ</Label>
            <Input
              type="text"
              value={formData.start_location}
              onChange={(e) =>
                setFormData({ ...formData, start_location: e.target.value })
              }
              placeholder="Ex: Casablanca"
              className="h-12"
            />
          </div>

          {/* Lieu retour */}
          <div className="space-y-2">
            <Label>Lieu retour</Label>
            <Input
              type="text"
              value={formData.end_location}
              onChange={(e) =>
                setFormData({ ...formData, end_location: e.target.value })
              }
              placeholder="Ex: Casablanca"
              className="h-12"
            />
          </div>
        </div>

        {/* Caution & Mode de paiement */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg bg-muted/30">
          {/* Montant de la caution */}
          <div className="space-y-2">
            <Label>Montant de la caution</Label>
            <div className="relative">
              <Input
                type="number"
                step="0.01"
                value={formData.franchise_montant}
                onChange={(e) =>
                  setFormData({ ...formData, franchise_montant: parseFloat(e.target.value) || 0 })
                }
                className="h-12"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                DH
              </span>
            </div>
          </div>

          {/* Mode de paiement */}
          <div className="space-y-2">
            <Label>Mode de paiement</Label>
            <Select
              value={formData.payment_method}
              onValueChange={(value) =>
                setFormData({ ...formData, payment_method: value })
              }
            >
              <SelectTrigger className="h-12">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="especes">Espèces</SelectItem>
                <SelectItem value="cheque">Chèque</SelectItem>
                <SelectItem value="carte">Carte bancaire</SelectItem>
                <SelectItem value="virement">Virement</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Options & Notes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Options (placeholder) */}
          <div className="space-y-2">
            <Label>Options</Label>
            <Select disabled>
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Sélectionner des options" />
              </SelectTrigger>
            </Select>
          </div>

          {/* Plus d'infos */}
          <div className="space-y-2">
            <Label>Plus d'infos</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Remarques diverses..."
              className="min-h-12"
              rows={1}
            />
          </div>
        </div>

        {/* Ordre de mission - Only for assistance contracts */}
        {contractType === "assistance" && (
          <div className="space-y-2">
            <Label htmlFor="ordre_mission">Ordre de mission (Fichier)</Label>
            <div className="space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileChange}
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              />
              {ordreMissionPreview ? (
                <div className="flex items-center gap-2 p-2 border rounded-md bg-muted">
                  <span className="text-sm flex-1 truncate">{ordreMissionPreview}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={removeFile}
                    className="h-6 w-6"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Télécharger le fichier
                </Button>
              )}
              <p className="text-xs text-muted-foreground">
                PDF, JPG, PNG, DOC, DOCX (facultatif)
              </p>
            </div>
          </div>
        )}

        {/* Summary Section */}
        <div className="border-2 border-dashed border-border rounded-lg p-6 bg-muted/30">
          <div className="flex items-center justify-center space-x-8 text-center">
            <div>
              <p className="text-xs text-muted-foreground uppercase mb-1">NB JOURS</p>
              <p className="text-4xl font-bold text-primary">
                {calculatedValues.duration.toString().padStart(2, "0")}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Jrs</p>
            </div>

            <div className="text-3xl font-bold text-primary">×</div>

            <div>
              <p className="text-xs text-muted-foreground uppercase mb-1">PRIX/JOUR</p>
              <p className="text-4xl font-bold text-primary">
                {calculatedValues.daily_rate.toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">DH</p>
            </div>

            <div className="text-3xl font-bold text-primary">=</div>

            <div>
              <p className="text-xs text-muted-foreground uppercase mb-1">TOTAL TTC</p>
              <p className="text-4xl font-bold text-primary">
                {calculatedValues.total.toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">DH</p>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-center pt-4">
          <Button
            type="submit"
            size="lg"
            disabled={loading}
            className="w-full md:w-auto px-12"
          >
            {loading ? "Création en cours..." : "CRÉER LA LOCATION"}
          </Button>
        </div>
      </form>
    </div>
  );
}
