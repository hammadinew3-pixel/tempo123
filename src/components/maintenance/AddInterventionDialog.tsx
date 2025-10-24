import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useTenantInsert } from '@/hooks/use-tenant-insert';
import { useTenantSettings } from '@/hooks/use-tenant-settings';

const TYPES_INTERVENTION = [
  "Vidange",
  "Freins",
  "Pneus",
  "Révision",
  "Climatisation",
  "Batterie",
  "Courroie",
  "Autre"
];

const DETAILS_OPTIONS = {
  Vidange: ["Huile moteur", "Filtre à huile", "Filtre à air", "Filtre à carburant"],
  Freins: ["Plaquettes avant", "Plaquettes arrière", "Disques avant", "Disques arrière", "Liquide de frein"],
  Pneus: ["Pneu avant gauche", "Pneu avant droit", "Pneu arrière gauche", "Pneu arrière droit", "Équilibrage", "Géométrie"],
  Révision: ["Contrôle général", "Vidange", "Filtres", "Freins", "Pneus", "Éclairage"],
  Climatisation: ["Recharge gaz", "Contrôle circuit", "Filtre habitacle", "Désinfection"],
  Batterie: ["Remplacement batterie", "Contrôle alternateur", "Nettoyage cosses"],
  Courroie: ["Courroie distribution", "Courroie accessoires", "Galets tendeurs"],
  Autre: []
};

interface AddInterventionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  vehicleId?: string;
  defaultType?: string;
  interventionToEdit?: any;
}

export function AddInterventionDialog({ open, onOpenChange, onSuccess, vehicleId, defaultType, interventionToEdit }: AddInterventionDialogProps) {
  const isEditMode = !!interventionToEdit;
  const { withTenantId } = useTenantInsert();
  const { data: tenantSettings } = useTenantSettings();
  const [loading, setLoading] = useState(false);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<string>(vehicleId || "");
  const [dateIntervention, setDateIntervention] = useState<Date>(new Date());
  const [kilometrage, setKilometrage] = useState("");
  const [typeIntervention, setTypeIntervention] = useState("");
  const [detailsIntervention, setDetailsIntervention] = useState<string[]>([]);
  const [garageExterne, setGarageExterne] = useState(false);
  const [nomGarage, setNomGarage] = useState("");
  const [contactGarage, setContactGarage] = useState("");
  const [telephoneGarage, setTelephoneGarage] = useState("");
  const [montantHT, setMontantHT] = useState("");
  const [tauxTVA, setTauxTVA] = useState("");
  const [facturee, setFacturee] = useState(false);
  const [referenceFature, setReferenceFature] = useState("");
  const [notes, setNotes] = useState("");
  const [prochainKilometrageVidange, setProchainKilometrageVidange] = useState("");

  useEffect(() => {
    if (open) {
      loadVehicles();
      
      // Set default TVA from tenant settings
      if (!interventionToEdit && tenantSettings?.taux_tva) {
        setTauxTVA(tenantSettings.taux_tva.toString());
      }
      
      if (interventionToEdit) {
        // Mode édition: charger les données de l'intervention
        setSelectedVehicle(interventionToEdit.vehicle_id);
        setDateIntervention(new Date(interventionToEdit.date_intervention));
        setKilometrage(interventionToEdit.kilometrage_actuel.toString());
        setTypeIntervention(interventionToEdit.type_intervention);
        setDetailsIntervention(interventionToEdit.details_intervention || []);
        setGarageExterne(interventionToEdit.garage_externe || false);
        setNomGarage(interventionToEdit.nom_garage || "");
        setContactGarage(interventionToEdit.contact_garage || "");
        setTelephoneGarage(interventionToEdit.telephone_garage || "");
        setMontantHT(interventionToEdit.montant_ht?.toString() || "");
        setTauxTVA(interventionToEdit.montant_tva ? ((interventionToEdit.montant_tva / interventionToEdit.montant_ht) * 100).toString() : (tenantSettings?.taux_tva?.toString() || "20"));
        setFacturee(interventionToEdit.facturee || false);
        setReferenceFature(interventionToEdit.reference_facture || "");
        setNotes(interventionToEdit.notes || "");
        setProchainKilometrageVidange(interventionToEdit.prochain_kilometrage_vidange?.toString() || "");
      } else {
        // Mode ajout
        if (vehicleId) {
          setSelectedVehicle(vehicleId);
          loadVehicleKm(vehicleId);
        }
        if (defaultType) {
          setTypeIntervention(defaultType);
        }
      }
    }
  }, [open, vehicleId, defaultType, interventionToEdit, tenantSettings]);

  const loadVehicles = async () => {
    const { data } = await supabase
      .from("vehicles")
      .select("id, immatriculation, marque, modele, kilometrage")
      .eq("en_service", true)
      .order("immatriculation");
    
    if (data) setVehicles(data);
  };

  const loadVehicleKm = async (vId: string) => {
    const { data } = await supabase
      .from("vehicles")
      .select("kilometrage")
      .eq("id", vId)
      .single();
    
    if (data) setKilometrage(data.kilometrage?.toString() || "");
  };

  const calculateMontantTTC = () => {
    const ht = parseFloat(montantHT) || 0;
    const tva = parseFloat(tauxTVA) || 0;
    const montantTVA = (ht * tva) / 100;
    return ht + montantTVA;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedVehicle || !typeIntervention || !kilometrage) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    setLoading(true);
    try {
      const ht = parseFloat(montantHT) || 0;
      const tva = (ht * parseFloat(tauxTVA)) / 100;
      const ttc = calculateMontantTTC();

      const interventionData = {
        vehicle_id: selectedVehicle,
        date_intervention: format(dateIntervention, "yyyy-MM-dd"),
        kilometrage_actuel: parseInt(kilometrage),
        type_intervention: typeIntervention,
        details_intervention: detailsIntervention,
        garage_externe: garageExterne,
        nom_garage: garageExterne ? nomGarage : null,
        contact_garage: garageExterne ? contactGarage : null,
        telephone_garage: garageExterne ? telephoneGarage : null,
        montant_ht: ht,
        montant_tva: tva,
        montant_ttc: ttc,
        facturee: facturee,
        reference_facture: facturee ? referenceFature : null,
        notes: notes || null,
        prochain_kilometrage_vidange: typeIntervention === "Vidange" && prochainKilometrageVidange 
          ? parseInt(prochainKilometrageVidange) 
          : null
      };

      if (isEditMode) {
        // Mode édition: UPDATE
        const { error } = await supabase
          .from("interventions")
          .update(interventionData)
          .eq("id", interventionToEdit.id);

        if (error) throw error;
        toast.success("Intervention modifiée avec succès");
      } else {
        // Mode ajout: INSERT
        const { error } = await supabase
          .from("interventions")
          .insert(withTenantId(interventionData));

        if (error) throw error;
        toast.success("Intervention ajoutée avec succès");
      }

      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch (error: any) {
      toast.error(isEditMode ? "Erreur lors de la modification de l'intervention" : "Erreur lors de l'ajout de l'intervention");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedVehicle(vehicleId || "");
    setDateIntervention(new Date());
    setKilometrage("");
    setTypeIntervention("");
    setDetailsIntervention([]);
    setGarageExterne(false);
    setNomGarage("");
    setContactGarage("");
    setTelephoneGarage("");
    setMontantHT("");
    setTauxTVA(tenantSettings?.taux_tva?.toString() || "20");
    setFacturee(false);
    setReferenceFature("");
    setNotes("");
    setProchainKilometrageVidange("");
  };

  const handleDetailToggle = (detail: string) => {
    setDetailsIntervention(prev => 
      prev.includes(detail) 
        ? prev.filter(d => d !== detail)
        : [...prev, detail]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Modifier l'intervention" : "Nouvelle intervention"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Véhicule *</Label>
              <Select value={selectedVehicle} onValueChange={(value) => {
                setSelectedVehicle(value);
                loadVehicleKm(value);
              }} disabled={!!vehicleId || isEditMode}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un véhicule" />
                </SelectTrigger>
                <SelectContent>
                  {vehicles.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.immatriculation || v.immatriculation_provisoire || v.ww || 'N/A'} - {v.marque} {v.modele}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Date d'intervention *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(dateIntervention, "dd/MM/yyyy", { locale: fr })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dateIntervention}
                    onSelect={(date) => date && setDateIntervention(date)}
                    initialFocus
                    locale={fr}
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Kilométrage actuel *</Label>
              <Input
                type="number"
                value={kilometrage}
                onChange={(e) => setKilometrage(e.target.value)}
                placeholder="Ex: 45000"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Type d'intervention *</Label>
              <Select value={typeIntervention} onValueChange={(value) => {
                setTypeIntervention(value);
                setDetailsIntervention([]);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  {TYPES_INTERVENTION.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {typeIntervention && DETAILS_OPTIONS[typeIntervention as keyof typeof DETAILS_OPTIONS]?.length > 0 && (
            <div className="space-y-2">
              <Label>Détails de l'intervention</Label>
              <div className="grid grid-cols-2 gap-2 p-4 border rounded-lg">
                {DETAILS_OPTIONS[typeIntervention as keyof typeof DETAILS_OPTIONS].map((detail) => (
                  <div key={detail} className="flex items-center space-x-2">
                    <Checkbox
                      id={detail}
                      checked={detailsIntervention.includes(detail)}
                      onCheckedChange={() => handleDetailToggle(detail)}
                    />
                    <label htmlFor={detail} className="text-sm cursor-pointer">
                      {detail}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Prochain kilométrage vidange (only for Vidange) */}
          {typeIntervention === "Vidange" && (
            <div className="space-y-2">
              <Label htmlFor="prochain-km-vidange">
                Prochain kilométrage pour vidange (facultatif)
              </Label>
              <Input
                id="prochain-km-vidange"
                type="number"
                value={prochainKilometrageVidange}
                onChange={(e) => setProchainKilometrageVidange(e.target.value)}
                placeholder="Ex: 55000"
              />
              <p className="text-xs text-muted-foreground">
                Sera automatiquement synchronisé avec la fiche du véhicule
              </p>
            </div>
          )}

          <div className="space-y-4 border-t pt-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="garage-externe">Garage externe</Label>
              <Switch
                id="garage-externe"
                checked={garageExterne}
                onCheckedChange={setGarageExterne}
              />
            </div>

            {garageExterne && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pl-4 border-l-2">
                <div className="space-y-2">
                  <Label>Nom du garage</Label>
                  <Input
                    value={nomGarage}
                    onChange={(e) => setNomGarage(e.target.value)}
                    placeholder="Garage Auto Plus"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Contact</Label>
                  <Input
                    value={contactGarage}
                    onChange={(e) => setContactGarage(e.target.value)}
                    placeholder="Ahmed Benani"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Téléphone</Label>
                  <Input
                    value={telephoneGarage}
                    onChange={(e) => setTelephoneGarage(e.target.value)}
                    placeholder="0612345678"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4 border-t pt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Montant HT</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={montantHT}
                  onChange={(e) => setMontantHT(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label>TVA (%)</Label>
                <Select value={tauxTVA} onValueChange={setTauxTVA}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">0%</SelectItem>
                    <SelectItem value="10">10%</SelectItem>
                    <SelectItem value="20">20%</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Montant TTC</Label>
                <div className="h-10 flex items-center px-3 border rounded-md bg-muted font-medium">
                  {calculateMontantTTC().toFixed(2)} DH
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4 border-t pt-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="facturee">Intervention facturée</Label>
              <Switch
                id="facturee"
                checked={facturee}
                onCheckedChange={setFacturee}
              />
            </div>

            {facturee && (
              <div className="space-y-2 pl-4 border-l-2">
                <Label>Référence facture</Label>
                <Input
                  value={referenceFature}
                  onChange={(e) => setReferenceFature(e.target.value)}
                  placeholder="FACT-2025-001"
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Remarques ou observations..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Enregistrement..." : isEditMode ? "Modifier" : "Valider"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
