import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTenant } from "@/contexts/TenantContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Check, Building2, Settings, FileText, Upload, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function Onboarding() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentTenant } = useTenant();
  const { toast } = useToast();

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Step 1 - Welcome (read-only)
  const [raisonSociale, setRaisonSociale] = useState("");
  const [ice, setIce] = useState("");

  // Step 2 - Agency info
  const [logo, setLogo] = useState<File | null>(null);
  const [logoUrl, setLogoUrl] = useState("");
  const [cachet, setCachet] = useState<File | null>(null);
  const [cachetUrl, setCachetUrl] = useState("");
  const [telephone, setTelephone] = useState("");
  const [email, setEmail] = useState("");
  const [adresse, setAdresse] = useState("");

  // Step 3 - Settings
  const [tauxTva, setTauxTva] = useState("20");
  const [delaiReglement, setDelaiReglement] = useState("7");
  const [alertesActives, setAlertesActives] = useState(true);

  // Step 4 - CGV
  const [cgv, setCgv] = useState(`Article 1: ETAT DU VÉHICULE

Le véhicule est délivré au locataire en parfait état de marche. Ce véhicule sera rendu dans le même état qu'à son départ. A défaut, le client devra acquitter le montant de remise en état. Les cinq pneus sont au départ en bon état, en cas de détérioration de l'un d'entre eux pour une cause autre que l'usure normale, ou de disparition de l'un d'entre eux, le client s'engage à le remplacer immédiatement par un pneu de même dimension, de la même marque et d'usure sensiblement égale.

Article 2: ENTRETIEN ET RÉPARATION

L'usure mécanique normale est à la charge du loueur. Toutes les réparations provenant soit d'une usure anormale, soit d'une négligence de la part du client soit une cause accidentelle seront à la charge du client, leur montant sera augmenté d'indemnité d'immobilisation.

Article 3: UTILISATION DU VÉHICULE

La location est personnelle et n'est en aucun cas transmissible. Le client s'engage à ne pas laisser conduire la voiture par d'autres personnes que celles figurant sur le contrat.

Article 4: ASSURANCE ET ACCIDENTS

Le client est assuré suivant les conditions générales des polices d'assurances qui sont contractées par le loueur qu'il déclare bien connaître:

A) Les accidents causés aux tiers sans limitation.

B) Les dégâts causés à la voiture sont supportés en totalité par le client s'il est fautif. Si ce dernier n'est pas fautif, il doit payer une franchise selon la catégorie du véhicule.

Le client devra déclarer au loueur dans les plus brefs délais, tout accident, vol ou incendie, sa déclaration devra mentionner les circonstances exactes, notamment le lieu de l'accident, la date, l'heure, les témoins (avec à l'appui le constat d'un agent de la police, ou de la gendarmerie).

C) Le client peut accepter ou refuser l'assurance des personnes transportées aux conditions des tarifs en vigueur, En aucun cas le nombre de personnes transportées dans la voiture ne devra excéder celui indiqué sur la police d'assurance du véhicule sous peine de voir la seule responsabilité du client.

Article 5: RÈGLEMENT DE LA LOCATION - PROLONGATION - RETOUR DU VÉHICULE

Les montants de location et de versement du pré-paiement sont déterminés par les tarifs en vigueur et payables d'avances. Le versement ne pourra servir en aucun cas à une prolongation de location. Afin d'éviter toutes contestation et pour le cas où le client voudrait conserver la voiture pour un temps supérieur à celui indiqué sur le contrat de location, il devrait, après avoir obtenu l'accord du loueur,  faire parvenir le montant de la période supplémentaire avant l'expiration de la location en cours sous peine de s'exposer  des poursuites judiciaire pour détournement de véhicule et abus de confiance.

Article 6: DOCUMENT DE LA VOITURE

Le client remettra au loueur, dès retour de la voiture, tous les titres de circulation afférents à cette dernière, faute de quoi, la location continuera de lui être facturée au prix initial jusqu'à production d'un certificat de perte et règlement des frais de duplicata.

Article 7: RESPONSABILITES

Le client demeure seul responsable des amendes, contraventions, procès-verbaux et poursuites douanières établis contre lui.`);

  const steps = [
    { number: 1, label: "Bienvenue", icon: Building2 },
    { number: 2, label: "Informations", icon: Upload },
    { number: 3, label: "Paramètres", icon: Settings },
    { number: 4, label: "Finalisation", icon: FileText },
  ];

  const progressPercent = (currentStep / steps.length) * 100;

  // Load existing data and resume from saved step
  useEffect(() => {
    const loadData = async () => {
      if (!currentTenant) return;

      try {
        // Load tenant data
        const { data: tenantData } = await supabase
          .from("tenants")
          .select("onboarding_step, onboarding_completed")
          .eq("id", currentTenant.id)
          .single();

        if (tenantData) {
          // If onboarding already completed, redirect to dashboard
          if (tenantData.onboarding_completed) {
            navigate("/dashboard");
            return;
          }

          // Resume from saved step
          const savedStep = localStorage.getItem("onboardingStep");
          const stepToResume = savedStep ? parseInt(savedStep) : tenantData.onboarding_step || 1;
          setCurrentStep(stepToResume);
        }

        // Load tenant settings (includes raison_sociale and ICE)
        const { data: settingsData } = await supabase
          .from("tenant_settings")
          .select("*")
          .eq("tenant_id", currentTenant.id)
          .single();

        if (settingsData) {
          setRaisonSociale(settingsData.raison_sociale || "");
          setIce(settingsData.ice || "");
          setLogoUrl(settingsData.logo_url || "");
          setCachetUrl(settingsData.signature_agence_url || "");
          setTelephone(settingsData.telephone || "");
          setEmail(settingsData.email || "");
          setAdresse(settingsData.adresse || "");
          setTauxTva(settingsData.taux_tva?.toString() || "20");
          if (settingsData.cgv_texte) {
            setCgv(settingsData.cgv_texte);
          }
        }
      } catch (error) {
        console.error("Error loading onboarding data:", error);
      }
    };

    loadData();
  }, [currentTenant, navigate]);

  // Save step progress
  const saveStepProgress = async (step: number) => {
    if (!currentTenant) return;

    localStorage.setItem("onboardingStep", step.toString());

    try {
      await supabase
        .from("tenants")
        .update({ onboarding_step: step })
        .eq("id", currentTenant.id);
    } catch (error) {
      console.error("Error saving step progress:", error);
    }
  };

  // Upload file to storage
  const uploadFile = async (file: File, bucket: string, path: string): Promise<string> => {
    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${path}_${Date.now()}.${fileExt}`;
      const filePath = `${currentTenant?.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      return publicUrl;
    } finally {
      setUploading(false);
    }
  };

  // Save agency info (Step 2)
  const saveAgencyInfo = async () => {
    if (!currentTenant) return;

    setLoading(true);
    try {
      let finalLogoUrl = logoUrl;
      let finalCachetUrl = cachetUrl;

      // Upload logo if new file selected
      if (logo) {
        finalLogoUrl = await uploadFile(logo, "agency-logos", "logo");
      }

      // Upload cachet if new file selected
      if (cachet) {
        finalCachetUrl = await uploadFile(cachet, "agency-logos", "cachet");
      }

      // Update or insert tenant settings
      const { error } = await supabase
        .from("tenant_settings")
        .upsert({
          tenant_id: currentTenant.id,
          logo_url: finalLogoUrl,
          signature_agence_url: finalCachetUrl,
          telephone,
          email,
          adresse,
        }, {
          onConflict: 'tenant_id'
        });

      if (error) throw error;

      setLogoUrl(finalLogoUrl);
      setCachetUrl(finalCachetUrl);

      await saveStepProgress(3);
      setCurrentStep(3);

      toast({
        title: "✓ Informations sauvegardées",
        description: "Les informations de votre agence ont été enregistrées.",
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Save settings (Step 3)
  const saveSettings = async () => {
    if (!currentTenant) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("tenant_settings")
        .upsert({
          tenant_id: currentTenant.id,
          taux_tva: parseFloat(tauxTva),
          alerte_cheque_jours: alertesActives ? parseInt(delaiReglement) : null,
        }, {
          onConflict: 'tenant_id'
        });

      if (error) throw error;

      await saveStepProgress(4);
      setCurrentStep(4);

      toast({
        title: "✓ Paramètres sauvegardés",
        description: "Vos paramètres de gestion ont été configurés.",
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Complete onboarding (Step 4)
  const completeOnboarding = async () => {
    if (!currentTenant) return;

    setLoading(true);
    try {
      // Save CGV
      await supabase
        .from("tenant_settings")
        .upsert({
          tenant_id: currentTenant.id,
          cgv_texte: cgv,
        }, {
          onConflict: 'tenant_id'
        });

      // Mark onboarding as completed
      const { error } = await supabase
        .from("tenants")
        .update({
          onboarding_completed: true,
          onboarding_step: 4,
        })
        .eq("id", currentTenant.id);

      if (error) throw error;

      // Clear localStorage
      localStorage.removeItem("onboardingStep");

      toast({
        title: "🎉 Configuration terminée !",
        description: "Votre compte CRSApp est prêt à l'emploi.",
      });

      // Redirect to dashboard
      setTimeout(() => {
        navigate("/dashboard");
      }, 1500);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (currentStep === 1) {
      saveStepProgress(2);
      setCurrentStep(2);
    } else if (currentStep === 2) {
      saveAgencyInfo();
    } else if (currentStep === 3) {
      saveSettings();
    } else if (currentStep === 4) {
      completeOnboarding();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      const prevStep = currentStep - 1;
      saveStepProgress(prevStep);
      setCurrentStep(prevStep);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-3xl">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">CRSApp</h1>
          <p className="text-muted-foreground">Configuration de votre agence</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <Progress value={progressPercent} className="h-2 mb-4" />
          <div className="flex justify-between">
            {steps.map((step) => {
              const Icon = step.icon;
              const isActive = currentStep === step.number;
              const isCompleted = currentStep > step.number;

              return (
                <div key={step.number} className="flex flex-col items-center gap-2">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                      isCompleted
                        ? "bg-primary text-primary-foreground"
                        : isActive
                        ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                  </div>
                  <span
                    className={`text-xs font-medium ${
                      isActive ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <Card>
          <CardHeader>
            <CardTitle>
              {currentStep === 1 && "Bienvenue sur CRSApp 👋"}
              {currentStep === 2 && "Informations de l'agence"}
              {currentStep === 3 && "Paramètres de gestion"}
              {currentStep === 4 && "Conditions générales"}
            </CardTitle>
            <CardDescription>
              {currentStep === 1 && "Configurez votre agence en quelques étapes simples"}
              {currentStep === 2 && "Ajoutez les informations de contact et les documents de votre agence"}
              {currentStep === 3 && "Configurez les paramètres financiers et administratifs"}
              {currentStep === 4 && "Saisissez vos conditions générales de ventes ou utilisez notre modèle déjà prêt à l'emploi"}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Step 1: Welcome */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div>
                  <Label>Raison sociale</Label>
                  <Input value={raisonSociale} disabled className="bg-muted" />
                </div>
                <div>
                  <Label>ICE</Label>
                  <Input value={ice} disabled className="bg-muted" />
                </div>
                <div className="bg-secondary/50 border border-border rounded-lg p-4 mt-6">
                  <p className="text-sm text-foreground">
                    Ces informations ont été fournies lors de votre inscription. Vous allez maintenant
                    configurer les détails de votre agence pour commencer à utiliser CRSApp.
                  </p>
                </div>
              </div>
            )}

            {/* Step 2: Agency Info */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div>
                  <Label>Logo de l'agence</Label>
                  <div className="flex items-center gap-4 mt-2">
                    {logoUrl && (
                      <img src={logoUrl} alt="Logo" className="h-16 w-16 object-contain border rounded" />
                    )}
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setLogo(e.target.files?.[0] || null)}
                      disabled={uploading}
                    />
                  </div>
                </div>

                <div>
                  <Label>Cachet de l'agence</Label>
                  <div className="flex items-center gap-4 mt-2">
                    {cachetUrl && (
                      <img src={cachetUrl} alt="Cachet" className="h-16 w-16 object-contain border rounded" />
                    )}
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setCachet(e.target.files?.[0] || null)}
                      disabled={uploading}
                    />
                  </div>
                </div>

                <div>
                  <Label>Téléphone *</Label>
                  <Input
                    value={telephone}
                    onChange={(e) => setTelephone(e.target.value)}
                    placeholder="+212 6XX XXX XXX"
                  />
                </div>

                <div>
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contact@votre-agence.ma"
                  />
                </div>

                <div>
                  <Label>Adresse *</Label>
                  <Textarea
                    value={adresse}
                    onChange={(e) => setAdresse(e.target.value)}
                    placeholder="Adresse complète de votre agence"
                    rows={3}
                  />
                </div>
              </div>
            )}

            {/* Step 3: Settings */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <div>
                  <Label>Taux de TVA (%)</Label>
                  <Input
                    type="number"
                    value={tauxTva}
                    onChange={(e) => setTauxTva(e.target.value)}
                    placeholder="20"
                    min="0"
                    max="100"
                  />
                </div>

                <div>
                  <Label>Alerte Encaissement Chèque (jours)</Label>
                  <Input
                    type="number"
                    value={delaiReglement}
                    onChange={(e) => setDelaiReglement(e.target.value)}
                    placeholder="7"
                    min="0"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="alertes"
                    checked={alertesActives}
                    onCheckedChange={(checked) => setAlertesActives(checked as boolean)}
                  />
                  <Label htmlFor="alertes" className="cursor-pointer">
                    Activer les alertes automatiques (documents expirés, échéances, etc.)
                  </Label>
                </div>

                <div className="bg-secondary/50 border border-border rounded-lg p-4 mt-6">
                  <p className="text-sm text-muted-foreground">
                    💡 Vous pourrez modifier ces paramètres à tout moment depuis la page Paramètres.
                  </p>
                </div>
              </div>
            )}

            {/* Step 4: CGV */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <div>
                  <Label>Conditions générales de vente (optionnel)</Label>
                  <Textarea
                    value={cgv}
                    onChange={(e) => setCgv(e.target.value)}
                    placeholder="Saisissez vos conditions générales de vente..."
                    rows={8}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Ces CGV apparaîtront sur vos contrats de location
                  </p>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6 border-t">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 1 || loading}
              >
                Retour
              </Button>

              <Button onClick={handleNext} disabled={loading || uploading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enregistrement...
                  </>
                ) : currentStep === 4 ? (
                  "Finaliser l'onboarding"
                ) : (
                  "Continuer"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
