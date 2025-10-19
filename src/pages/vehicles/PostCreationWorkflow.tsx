import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useTenantInsert } from '@/hooks/use-tenant-insert';

interface PostCreationWorkflowProps {
  vehicleId: string;
  vehicleInfo: {
    marque: string;
    immatriculation: string;
  };
}

type Step = 'assurance' | 'visite_technique' | 'vignette' | 'complete';

export default function PostCreationWorkflow({ vehicleId, vehicleInfo }: PostCreationWorkflowProps) {
  const { withTenantId } = useTenantInsert();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState<Step>('assurance');
  const [loading, setLoading] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<Step[]>([]);

  // Assurance form data
  const [assuranceData, setAssuranceData] = useState({
    numero_ordre: '',
    numero_police: '',
    assureur: '',
    coordonnees_assureur: '',
    date_debut: undefined as Date | undefined,
    date_expiration: undefined as Date | undefined,
    montant: '',
    date_paiement: undefined as Date | undefined,
    mode_paiement: 'especes' as 'especes' | 'cheque' | 'virement' | 'carte',
    numero_cheque: '',
    banque: '',
    remarques: '',
  });

  // Visite technique form data
  const [visiteData, setVisiteData] = useState({
    numero_ordre: '',
    date_visite: undefined as Date | undefined,
    date_expiration: undefined as Date | undefined,
    centre_controle: '',
    montant: '',
    date_paiement: undefined as Date | undefined,
    mode_paiement: 'especes' as 'especes' | 'cheque' | 'virement' | 'carte',
    numero_cheque: '',
    banque: '',
    remarques: '',
  });

  // Vignette form data
  const [vignetteData, setVignetteData] = useState({
    numero_ordre: '',
    annee: new Date().getFullYear(),
    date_expiration: undefined as Date | undefined,
    montant: '',
    date_paiement: undefined as Date | undefined,
    mode_paiement: 'especes' as 'especes' | 'cheque' | 'virement' | 'carte',
    numero_cheque: '',
    banque: '',
    remarques: '',
  });

  const handleSubmitAssurance = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('vehicle_insurance')
        .insert([withTenantId({
          vehicle_id: vehicleId,
          ...assuranceData,
          date_debut: assuranceData.date_debut?.toISOString().split('T')[0],
          date_expiration: assuranceData.date_expiration?.toISOString().split('T')[0],
          date_paiement: assuranceData.date_paiement?.toISOString().split('T')[0],
          montant: parseFloat(assuranceData.montant),
        })]);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Assurance ajoutée avec succès"
      });

      setCompletedSteps([...completedSteps, 'assurance']);
      setCurrentStep('visite_technique');
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitVisite = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('vehicle_technical_inspection')
        .insert([withTenantId({
          vehicle_id: vehicleId,
          ...visiteData,
          date_visite: visiteData.date_visite?.toISOString().split('T')[0],
          date_expiration: visiteData.date_expiration?.toISOString().split('T')[0],
          date_paiement: visiteData.date_paiement?.toISOString().split('T')[0],
          montant: visiteData.montant ? parseFloat(visiteData.montant) : null,
        })]);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Visite technique ajoutée avec succès"
      });

      setCompletedSteps([...completedSteps, 'visite_technique']);
      setCurrentStep('vignette');
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitVignette = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('vehicle_vignette')
        .insert([withTenantId({
          vehicle_id: vehicleId,
          date_debut: vignetteData.date_expiration?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
          date_expiration: vignetteData.date_expiration?.toISOString().split('T')[0],
          date_paiement: vignetteData.date_paiement?.toISOString().split('T')[0],
          montant: vignetteData.montant ? parseFloat(vignetteData.montant) : null,
        })]);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Vignette ajoutée avec succès"
      });

      setCompletedSteps([...completedSteps, 'vignette']);
      setCurrentStep('complete');
      
      // Redirect to vehicle details after a short delay
      setTimeout(() => {
        navigate(`/vehicules/${vehicleId}`);
      }, 1500);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    if (currentStep === 'assurance') {
      setCurrentStep('visite_technique');
    } else if (currentStep === 'visite_technique') {
      setCurrentStep('vignette');
    } else if (currentStep === 'vignette') {
      navigate(`/vehicules/${vehicleId}`);
    }
  };

  const handleFinish = () => {
    navigate(`/vehicules/${vehicleId}`);
  };

  const renderStepIndicator = () => {
    const steps = [
      { key: 'assurance' as Step, label: 'Assurance' },
      { key: 'visite_technique' as Step, label: 'Visite Technique' },
      { key: 'vignette' as Step, label: 'Vignette' },
    ];

    return (
      <div className="flex items-center justify-center mb-8">
        {steps.map((step, index) => (
          <div key={step.key} className="flex items-center">
            <div className={cn(
              "flex items-center justify-center w-10 h-10 rounded-full border-2",
              completedSteps.includes(step.key) ? "bg-primary border-primary text-primary-foreground" :
              currentStep === step.key ? "border-primary text-primary" :
              "border-muted-foreground text-muted-foreground"
            )}>
              {completedSteps.includes(step.key) ? (
                <Check className="w-5 h-5" />
              ) : (
                <span>{index + 1}</span>
              )}
            </div>
            <div className={cn(
              "ml-2 mr-4 text-sm font-medium",
              completedSteps.includes(step.key) ? "text-primary" :
              currentStep === step.key ? "text-foreground" :
              "text-muted-foreground"
            )}>
              {step.label}
            </div>
            {index < steps.length - 1 && (
              <ChevronRight className="w-5 h-5 text-muted-foreground mr-4" />
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderDatePicker = (
    value: Date | undefined,
    onChange: (date: Date | undefined) => void,
    label: string,
    required: boolean = false
  ) => {
    return (
      <div className="space-y-2">
        <Label>{label} {required && '*'}</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !value && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {value ? format(value, "dd/MM/yyyy", { locale: fr }) : <span>Sélectionner une date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={value}
              onSelect={onChange}
              initialFocus
              className="pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      </div>
    );
  };

  if (currentStep === 'complete') {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mb-4">
              <Check className="w-8 h-8 text-primary-foreground" />
            </div>
            <h2 className="text-2xl font-semibold mb-2">Configuration terminée !</h2>
            <p className="text-muted-foreground mb-6">
              Le véhicule {vehicleInfo.marque} ({vehicleInfo.immatriculation}) a été configuré avec succès.
            </p>
            <Button onClick={handleFinish}>
              Voir le véhicule
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Configuration du véhicule</h1>
        <p className="text-muted-foreground">
          {vehicleInfo.marque} - {vehicleInfo.immatriculation}
        </p>
      </div>

      {renderStepIndicator()}

      {/* Assurance Form */}
      {currentStep === 'assurance' && (
        <Card>
          <CardHeader>
            <CardTitle>Ajouter une assurance</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitAssurance} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="numero_ordre">N° d'order *</Label>
                  <Input
                    id="numero_ordre"
                    value={assuranceData.numero_ordre}
                    onChange={(e) => setAssuranceData({ ...assuranceData, numero_ordre: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="numero_police">N° de la police</Label>
                  <Input
                    id="numero_police"
                    value={assuranceData.numero_police}
                    onChange={(e) => setAssuranceData({ ...assuranceData, numero_police: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="assureur">Assureur *</Label>
                  <Input
                    id="assureur"
                    value={assuranceData.assureur}
                    onChange={(e) => setAssuranceData({ ...assuranceData, assureur: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="coordonnees_assureur">Coordonnées assureur</Label>
                  <Input
                    id="coordonnees_assureur"
                    value={assuranceData.coordonnees_assureur}
                    onChange={(e) => setAssuranceData({ ...assuranceData, coordonnees_assureur: e.target.value })}
                  />
                </div>

                {renderDatePicker(
                  assuranceData.date_debut,
                  (date) => setAssuranceData({ ...assuranceData, date_debut: date }),
                  "Date début",
                  true
                )}

                {renderDatePicker(
                  assuranceData.date_expiration,
                  (date) => setAssuranceData({ ...assuranceData, date_expiration: date }),
                  "Date d'expiration",
                  true
                )}

                <div className="space-y-2">
                  <Label htmlFor="montant">Montant *</Label>
                  <div className="relative">
                    <Input
                      id="montant"
                      type="number"
                      step="0.01"
                      value={assuranceData.montant}
                      onChange={(e) => setAssuranceData({ ...assuranceData, montant: e.target.value })}
                      required
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      DH
                    </span>
                  </div>
                </div>

                {renderDatePicker(
                  assuranceData.date_paiement,
                  (date) => setAssuranceData({ ...assuranceData, date_paiement: date }),
                  "Date de paiement",
                  true
                )}

                <div className="space-y-2">
                  <Label htmlFor="mode_paiement">Mode de paiement *</Label>
                  <Select
                    value={assuranceData.mode_paiement}
                    onValueChange={(value: any) => setAssuranceData({ ...assuranceData, mode_paiement: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="especes">Espèce</SelectItem>
                      <SelectItem value="cheque">Chèque</SelectItem>
                      <SelectItem value="virement">Virement</SelectItem>
                      <SelectItem value="carte">Carte bancaire</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {assuranceData.mode_paiement === 'cheque' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="numero_cheque">N° Chèque *</Label>
                      <Input
                        id="numero_cheque"
                        value={assuranceData.numero_cheque}
                        onChange={(e) => setAssuranceData({ ...assuranceData, numero_cheque: e.target.value })}
                        required={assuranceData.mode_paiement === 'cheque'}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="banque">Banque</Label>
                      <Input
                        id="banque"
                        value={assuranceData.banque}
                        onChange={(e) => setAssuranceData({ ...assuranceData, banque: e.target.value })}
                      />
                    </div>
                  </>
                )}

                <div className="col-span-2 space-y-2">
                  <Label htmlFor="remarques">Remarques</Label>
                  <Textarea
                    id="remarques"
                    value={assuranceData.remarques}
                    onChange={(e) => setAssuranceData({ ...assuranceData, remarques: e.target.value })}
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={handleSkip}>
                  Passer cette étape
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Enregistrement...' : 'Enregistrer et continuer'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Visite Technique Form */}
      {currentStep === 'visite_technique' && (
        <Card>
          <CardHeader>
            <CardTitle>Ajouter une visite technique</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitVisite} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="visite_numero_ordre">N° d'order *</Label>
                  <Input
                    id="visite_numero_ordre"
                    value={visiteData.numero_ordre}
                    onChange={(e) => setVisiteData({ ...visiteData, numero_ordre: e.target.value })}
                    required
                  />
                </div>

                {renderDatePicker(
                  visiteData.date_visite,
                  (date) => setVisiteData({ ...visiteData, date_visite: date }),
                  "Date de visite",
                  true
                )}

                {renderDatePicker(
                  visiteData.date_expiration,
                  (date) => setVisiteData({ ...visiteData, date_expiration: date }),
                  "Date d'expiration",
                  true
                )}

                <div className="space-y-2">
                  <Label htmlFor="centre_controle">Centre de contrôle</Label>
                  <Input
                    id="centre_controle"
                    value={visiteData.centre_controle}
                    onChange={(e) => setVisiteData({ ...visiteData, centre_controle: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="visite_montant">Montant</Label>
                  <div className="relative">
                    <Input
                      id="visite_montant"
                      type="number"
                      step="0.01"
                      value={visiteData.montant}
                      onChange={(e) => setVisiteData({ ...visiteData, montant: e.target.value })}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      DH
                    </span>
                  </div>
                </div>

                {renderDatePicker(
                  visiteData.date_paiement,
                  (date) => setVisiteData({ ...visiteData, date_paiement: date }),
                  "Date de paiement"
                )}

                <div className="space-y-2">
                  <Label htmlFor="visite_mode_paiement">Mode de paiement</Label>
                  <Select
                    value={visiteData.mode_paiement}
                    onValueChange={(value: any) => setVisiteData({ ...visiteData, mode_paiement: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="especes">Espèce</SelectItem>
                      <SelectItem value="cheque">Chèque</SelectItem>
                      <SelectItem value="virement">Virement</SelectItem>
                      <SelectItem value="carte">Carte bancaire</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {visiteData.mode_paiement === 'cheque' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="visite_numero_cheque">N° Chèque</Label>
                      <Input
                        id="visite_numero_cheque"
                        value={visiteData.numero_cheque}
                        onChange={(e) => setVisiteData({ ...visiteData, numero_cheque: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="visite_banque">Banque</Label>
                      <Input
                        id="visite_banque"
                        value={visiteData.banque}
                        onChange={(e) => setVisiteData({ ...visiteData, banque: e.target.value })}
                      />
                    </div>
                  </>
                )}

                <div className="col-span-2 space-y-2">
                  <Label htmlFor="visite_remarques">Remarques</Label>
                  <Textarea
                    id="visite_remarques"
                    value={visiteData.remarques}
                    onChange={(e) => setVisiteData({ ...visiteData, remarques: e.target.value })}
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={handleSkip}>
                  Passer cette étape
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Enregistrement...' : 'Enregistrer et continuer'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Vignette Form */}
      {currentStep === 'vignette' && (
        <Card>
          <CardHeader>
            <CardTitle>Ajouter une vignette/autorisation</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitVignette} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vignette_numero_ordre">N° d'order *</Label>
                  <Input
                    id="vignette_numero_ordre"
                    value={vignetteData.numero_ordre}
                    onChange={(e) => setVignetteData({ ...vignetteData, numero_ordre: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="annee">Année *</Label>
                  <Input
                    id="annee"
                    type="number"
                    value={vignetteData.annee}
                    onChange={(e) => setVignetteData({ ...vignetteData, annee: parseInt(e.target.value) })}
                    required
                  />
                </div>

                {renderDatePicker(
                  vignetteData.date_expiration,
                  (date) => setVignetteData({ ...vignetteData, date_expiration: date }),
                  "Date d'expiration",
                  true
                )}

                <div className="space-y-2">
                  <Label htmlFor="vignette_montant">Montant</Label>
                  <div className="relative">
                    <Input
                      id="vignette_montant"
                      type="number"
                      step="0.01"
                      value={vignetteData.montant}
                      onChange={(e) => setVignetteData({ ...vignetteData, montant: e.target.value })}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      DH
                    </span>
                  </div>
                </div>

                {renderDatePicker(
                  vignetteData.date_paiement,
                  (date) => setVignetteData({ ...vignetteData, date_paiement: date }),
                  "Date de paiement"
                )}

                <div className="space-y-2">
                  <Label htmlFor="vignette_mode_paiement">Mode de paiement</Label>
                  <Select
                    value={vignetteData.mode_paiement}
                    onValueChange={(value: any) => setVignetteData({ ...vignetteData, mode_paiement: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="especes">Espèce</SelectItem>
                      <SelectItem value="cheque">Chèque</SelectItem>
                      <SelectItem value="virement">Virement</SelectItem>
                      <SelectItem value="carte">Carte bancaire</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {vignetteData.mode_paiement === 'cheque' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="vignette_numero_cheque">N° Chèque</Label>
                      <Input
                        id="vignette_numero_cheque"
                        value={vignetteData.numero_cheque}
                        onChange={(e) => setVignetteData({ ...vignetteData, numero_cheque: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="vignette_banque">Banque</Label>
                      <Input
                        id="vignette_banque"
                        value={vignetteData.banque}
                        onChange={(e) => setVignetteData({ ...vignetteData, banque: e.target.value })}
                      />
                    </div>
                  </>
                )}

                <div className="col-span-2 space-y-2">
                  <Label htmlFor="vignette_remarques">Remarques</Label>
                  <Textarea
                    id="vignette_remarques"
                    value={vignetteData.remarques}
                    onChange={(e) => setVignetteData({ ...vignetteData, remarques: e.target.value })}
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={handleSkip}>
                  Terminer plus tard
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Enregistrement...' : 'Enregistrer et terminer'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
