import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface EditInspectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedInspection: any;
  inspectionForm: any;
  setInspectionForm: (form: any) => void;
  vehicleId: string;
  onSuccess: () => void;
}

export function EditInspectionDialog({
  open,
  onOpenChange,
  selectedInspection,
  inspectionForm,
  setInspectionForm,
  vehicleId,
  onSuccess
}: EditInspectionDialogProps) {
  const { toast } = useToast();

  const handleSave = async () => {
    try {
      if (!inspectionForm.numero_ordre || !inspectionForm.date_visite || !inspectionForm.date_expiration) {
        toast({
          title: "Erreur",
          description: "Veuillez remplir tous les champs obligatoires",
          variant: "destructive"
        });
        return;
      }

      const { error } = await supabase
        .from('vehicle_technical_inspection')
        .update({
          ...inspectionForm,
          montant: inspectionForm.montant ? parseFloat(inspectionForm.montant) : null
        })
        .eq('id', selectedInspection.id);

      if (error) throw error;

      // Update vehicle expiration date
      await supabase.from('vehicles').update({
        visite_technique_expire_le: inspectionForm.date_expiration
      }).eq('id', vehicleId);

      toast({
        title: "Succès",
        description: "Visite technique modifiée avec succès"
      });

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifier la visite technique</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>N° d'ordre *</Label>
              <Input 
                value={inspectionForm.numero_ordre}
                onChange={(e) => setInspectionForm({...inspectionForm, numero_ordre: e.target.value})}
              />
            </div>
            <div>
              <Label>Centre de contrôle</Label>
              <Input 
                value={inspectionForm.centre_controle}
                onChange={(e) => setInspectionForm({...inspectionForm, centre_controle: e.target.value})}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Date de visite *</Label>
              <Input 
                type="date"
                value={inspectionForm.date_visite}
                onChange={(e) => setInspectionForm({...inspectionForm, date_visite: e.target.value})}
              />
            </div>
            <div>
              <Label>Date d'expiration *</Label>
              <Input 
                type="date"
                value={inspectionForm.date_expiration}
                onChange={(e) => setInspectionForm({...inspectionForm, date_expiration: e.target.value})}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Montant (DH)</Label>
              <Input 
                type="number"
                value={inspectionForm.montant}
                onChange={(e) => setInspectionForm({...inspectionForm, montant: e.target.value})}
              />
            </div>
            <div>
              <Label>Date de paiement</Label>
              <Input 
                type="date"
                value={inspectionForm.date_paiement}
                onChange={(e) => setInspectionForm({...inspectionForm, date_paiement: e.target.value})}
              />
            </div>
          </div>
          <div>
            <Label>Mode de paiement</Label>
            <Select 
              value={inspectionForm.mode_paiement}
              onValueChange={(value: any) => setInspectionForm({...inspectionForm, mode_paiement: value})}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="especes">Espèces</SelectItem>
                <SelectItem value="cheque">Chèque</SelectItem>
                <SelectItem value="virement">Virement</SelectItem>
                <SelectItem value="carte">Carte</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {inspectionForm.mode_paiement === 'cheque' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>N° de chèque</Label>
                <Input 
                  value={inspectionForm.numero_cheque}
                  onChange={(e) => setInspectionForm({...inspectionForm, numero_cheque: e.target.value})}
                />
              </div>
              <div>
                <Label>Banque</Label>
                <Input 
                  value={inspectionForm.banque}
                  onChange={(e) => setInspectionForm({...inspectionForm, banque: e.target.value})}
                />
              </div>
            </div>
          )}
          <div>
            <Label>Remarques</Label>
            <Textarea 
              value={inspectionForm.remarques}
              onChange={(e) => setInspectionForm({...inspectionForm, remarques: e.target.value})}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSave}>
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface EditVignetteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedVignette: any;
  vignetteForm: any;
  setVignetteForm: (form: any) => void;
  vehicleId: string;
  onSuccess: () => void;
}

export function EditVignetteDialog({
  open,
  onOpenChange,
  selectedVignette,
  vignetteForm,
  setVignetteForm,
  vehicleId,
  onSuccess
}: EditVignetteDialogProps) {
  const { toast } = useToast();

  const handleSave = async () => {
    try {
      if (!vignetteForm.numero_ordre || !vignetteForm.annee || !vignetteForm.date_expiration) {
        toast({
          title: "Erreur",
          description: "Veuillez remplir tous les champs obligatoires",
          variant: "destructive"
        });
        return;
      }

      const { error } = await supabase
        .from('vehicle_vignette')
        .update({
          ...vignetteForm,
          annee: parseInt(vignetteForm.annee),
          montant: vignetteForm.montant ? parseFloat(vignetteForm.montant) : null
        })
        .eq('id', selectedVignette.id);

      if (error) throw error;

      // Update vehicle expiration date
      await supabase.from('vehicles').update({
        vignette_expire_le: vignetteForm.date_expiration
      }).eq('id', vehicleId);

      toast({
        title: "Succès",
        description: "Vignette modifiée avec succès"
      });

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifier la vignette</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>N° d'ordre *</Label>
              <Input 
                value={vignetteForm.numero_ordre}
                onChange={(e) => setVignetteForm({...vignetteForm, numero_ordre: e.target.value})}
              />
            </div>
            <div>
              <Label>Année *</Label>
              <Input 
                type="number"
                value={vignetteForm.annee}
                onChange={(e) => setVignetteForm({...vignetteForm, annee: e.target.value})}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Date d'expiration *</Label>
              <Input 
                type="date"
                value={vignetteForm.date_expiration}
                onChange={(e) => setVignetteForm({...vignetteForm, date_expiration: e.target.value})}
              />
            </div>
            <div>
              <Label>Montant (DH)</Label>
              <Input 
                type="number"
                value={vignetteForm.montant}
                onChange={(e) => setVignetteForm({...vignetteForm, montant: e.target.value})}
              />
            </div>
          </div>
          <div>
            <Label>Date de paiement</Label>
            <Input 
              type="date"
              value={vignetteForm.date_paiement}
              onChange={(e) => setVignetteForm({...vignetteForm, date_paiement: e.target.value})}
            />
          </div>
          <div>
            <Label>Mode de paiement</Label>
            <Select 
              value={vignetteForm.mode_paiement}
              onValueChange={(value: any) => setVignetteForm({...vignetteForm, mode_paiement: value})}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="especes">Espèces</SelectItem>
                <SelectItem value="cheque">Chèque</SelectItem>
                <SelectItem value="virement">Virement</SelectItem>
                <SelectItem value="carte">Carte</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {vignetteForm.mode_paiement === 'cheque' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>N° de chèque</Label>
                <Input 
                  value={vignetteForm.numero_cheque}
                  onChange={(e) => setVignetteForm({...vignetteForm, numero_cheque: e.target.value})}
                />
              </div>
              <div>
                <Label>Banque</Label>
                <Input 
                  value={vignetteForm.banque}
                  onChange={(e) => setVignetteForm({...vignetteForm, banque: e.target.value})}
                />
              </div>
            </div>
          )}
          <div>
            <Label>Remarques</Label>
            <Textarea 
              value={vignetteForm.remarques}
              onChange={(e) => setVignetteForm({...vignetteForm, remarques: e.target.value})}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSave}>
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
