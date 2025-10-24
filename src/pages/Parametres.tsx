import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/use-user-role";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useTenantInsert } from '@/hooks/use-tenant-insert';
import { useTenant } from '@/contexts/TenantContext';
import { useAuth } from '@/contexts/AuthContext';
import { Settings, Building2, Bell, Printer, Upload, Loader2, X, ImageIcon, Tag, Plus, Trash2, CheckCircle2, KeyRound, FileDown } from "lucide-react";
import html2pdf from 'html2pdf.js';
import vehicleInspectionDiagram from '@/assets/vehicle-inspection-diagram.png';
import { format } from 'date-fns';
import { useTenantPlan } from "@/hooks/useTenantPlan";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface AgenceSettings {
  id: string;
  raison_sociale?: string;
  ice?: string;
  if_number?: string;
  rc?: string;
  cnss?: string;
  patente?: string;
  adresse?: string;
  email?: string;
  telephone?: string;
  logo_url?: string;
  signature_agence_url?: string;
  taux_tva?: number;
  alerte_cheque_jours?: number;
  alerte_visite_jours?: number;
  alerte_assurance_jours?: number;
  alerte_autorisation_jours?: number;
  masquer_logo?: boolean;
  masquer_entete?: boolean;
  masquer_pied_page?: boolean;
  inclure_cgv?: boolean;
  cgv_url?: string;
  cgv_texte?: string;
}

export default function Parametres() {
  const { withTenantId } = useTenantInsert();
  const { currentTenant } = useTenant();
  const { user } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const { data: planData, isLoading: planLoading, hasModuleAccess } = useTenantPlan();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [settings, setSettings] = useState<AgenceSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingSignature, setUploadingSignature] = useState(false);
  const [assistanceCategories, setAssistanceCategories] = useState<any[]>([]);
  const [newCategoryCode, setNewCategoryCode] = useState("");
  const [onboardingCompleted, setOnboardingCompleted] = useState(true);
  const [isChangePasswordDialogOpen, setIsChangePasswordDialogOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [generatingBlankContract, setGeneratingBlankContract] = useState(false);

  useEffect(() => {
    if (!roleLoading && !isAdmin) {
      navigate('/');
      toast({
        title: "Accès refusé",
        description: "Vous n'avez pas les permissions pour accéder à cette page.",
        variant: "destructive",
      });
    }
  }, [isAdmin, roleLoading, navigate, toast]);

  useEffect(() => {
    if (isAdmin) {
      loadSettings();
      loadTenantOnboardingStatus();
      if (planData?.modules?.assistance) {
        loadAssistanceCategories();
      }
    }
  }, [isAdmin, planData]);

  const loadTenantOnboardingStatus = async () => {
    try {
      if (!currentTenant?.id) return;
      
      const { data, error } = await supabase
        .from('tenants')
        .select('onboarding_completed')
        .eq('id', currentTenant.id)
        .single();
      
      if (error) throw error;
      setOnboardingCompleted(data?.onboarding_completed ?? true);
    } catch (error: any) {
      console.error('Error loading onboarding status:', error);
    }
  };

  const loadSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tenant_settings')
        .select('*')
        .single();

      if (error) throw error;
      setSettings(data);
    } catch (error: any) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAssistanceCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('vehicle_assistance_categories')
        .select('*')
        .eq('actif', true)
        .order('ordre');
      
      if (error) throw error;
      setAssistanceCategories(data || []);
    } catch (error: any) {
      console.error('Error loading assistance categories:', error);
    }
  };

  const addAssistanceCategory = async () => {
    if (!newCategoryCode.trim()) {
      toast({
        title: "Erreur",
        description: "Le code est obligatoire.",
        variant: "destructive",
      });
      return;
    }

    try {
      const maxOrdre = assistanceCategories.reduce((max, cat) => Math.max(max, cat.ordre), 0);
      
      const { error } = await supabase
        .from('vehicle_assistance_categories')
        .insert(withTenantId({
          nom: newCategoryCode.toUpperCase(),
          label: newCategoryCode.toUpperCase(),
          ordre: maxOrdre + 1,
          actif: true,
          code: newCategoryCode.toUpperCase()
        }));

      if (error) throw error;

      setNewCategoryCode('');
      await loadAssistanceCategories();
      
      toast({
        title: "Catégorie ajoutée",
        description: "La nouvelle catégorie d'assistance a été créée.",
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const deleteAssistanceCategory = async (categoryId: string) => {
    try {
      const { error } = await supabase
        .from('vehicle_assistance_categories')
        .update({ actif: false })
        .eq('id', categoryId);

      if (error) throw error;

      await loadAssistanceCategories();
      
      toast({
        title: "Catégorie désactivée",
        description: "La catégorie a été désactivée.",
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const updateSettings = async (updates: Partial<AgenceSettings>) => {
    try {
      setSaving(true);
      const { error } = await supabase
        .from('tenant_settings')
        .update(updates)
        .eq('id', settings?.id);

      if (error) throw error;

      setSettings(prev => prev ? { ...prev, ...updates } : null);

      // Marquer l'onboarding comme terminé si ce n'était pas encore fait
      if (!onboardingCompleted && currentTenant?.id) {
        const { error: tenantError } = await supabase
          .from('tenants')
          .update({ onboarding_completed: true })
          .eq('id', currentTenant.id);
        
        if (!tenantError) {
          setOnboardingCompleted(true);
          toast({
            title: "🎉 Pré-configuration terminée !",
            description: "Votre agence est maintenant configurée.",
          });
          return;
        }
      }
      
      toast({
        title: "Paramètres enregistrés",
        description: "Les modifications ont été sauvegardées.",
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner une image (PNG, JPG, etc.)",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "Erreur",
        description: "L'image ne doit pas dépasser 2MB",
        variant: "destructive",
      });
      return;
    }

    try {
      setUploadingLogo(true);

      // Delete old logo if exists
      if (settings?.logo_url) {
        const oldPath = settings.logo_url.split('/').pop();
        if (oldPath) {
          await supabase.storage
            .from('agency-logos')
            .remove([oldPath]);
        }
      }

      // Upload new logo
      const fileExt = file.name.split('.').pop();
      const fileName = `logo-${Date.now()}.${fileExt}`;
      const { error: uploadError, data } = await supabase.storage
        .from('agency-logos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('agency-logos')
        .getPublicUrl(fileName);

      // Update settings
      await updateSettings({ logo_url: publicUrl });

      toast({
        title: "Logo mis à jour",
        description: "Votre logo a été enregistré avec succès.",
      });
    } catch (error: any) {
      console.error('Error uploading logo:', error);
      toast({
        title: "Erreur",
        description: "Impossible de télécharger le logo.",
        variant: "destructive",
      });
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleRemoveLogo = async () => {
    if (!settings?.logo_url) return;

    try {
      setUploadingLogo(true);

      const oldPath = settings.logo_url.split('/').pop();
      if (oldPath) {
        await supabase.storage
          .from('agency-logos')
          .remove([oldPath]);
      }

      await updateSettings({ logo_url: null });

      toast({
        title: "Logo supprimé",
        description: "Le logo a été retiré.",
      });
    } catch (error: any) {
      console.error('Error removing logo:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le logo.",
        variant: "destructive",
      });
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSignatureUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner une image (PNG, JPG, etc.)",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "Erreur",
        description: "L'image ne doit pas dépasser 2MB",
        variant: "destructive",
      });
      return;
    }

    try {
      setUploadingSignature(true);

      if (settings?.signature_agence_url) {
        const oldPath = settings.signature_agence_url.split('/').pop();
        if (oldPath) {
          await supabase.storage
            .from('agency-logos')
            .remove([oldPath]);
        }
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `signature-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('agency-logos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('agency-logos')
        .getPublicUrl(fileName);

      await updateSettings({ signature_agence_url: publicUrl });

      toast({
        title: "Signature mise à jour",
        description: "Votre signature/cachet a été enregistré avec succès.",
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploadingSignature(false);
    }
  };

  const handleRemoveSignature = async () => {
    if (!settings?.signature_agence_url) return;

    try {
      setUploadingSignature(true);

      const oldPath = settings.signature_agence_url.split('/').pop();
      if (oldPath) {
        await supabase.storage
          .from('agency-logos')
          .remove([oldPath]);
      }

      await updateSettings({ signature_agence_url: null });

      toast({
        title: "Signature supprimée",
        description: "La signature/cachet a été retiré.",
      });
    } catch (error: any) {
      console.error('Error removing signature:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la signature.",
        variant: "destructive",
      });
    } finally {
      setUploadingSignature(false);
    }
  };

  const handleChangePassword = async () => {
    // Validation
    if (!oldPassword || !newPassword || !confirmPassword) {
      toast({
        title: "Erreur",
        description: "Tous les champs sont obligatoires.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Erreur",
        description: "Le nouveau mot de passe doit contenir au moins 6 caractères.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Erreur",
        description: "Les nouveaux mots de passe ne correspondent pas.",
        variant: "destructive",
      });
      return;
    }

    try {
      setChangingPassword(true);

      // Vérifier l'ancien mot de passe en tentant une connexion
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || '',
        password: oldPassword,
      });

      if (signInError) {
        throw new Error("L'ancien mot de passe est incorrect.");
      }

      // Réinitialiser le mot de passe via l'edge function
      const { error } = await supabase.functions.invoke('reset-user-password', {
        body: { 
          targetUserId: user?.id,
          newPassword: newPassword
        }
      });

      if (error) throw error;

      toast({
        title: "Mot de passe modifié",
        description: "Votre mot de passe a été modifié avec succès.",
      });

      // Réinitialiser les champs et fermer le dialog
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setIsChangePasswordDialogOpen(false);
    } catch (error: any) {
      console.error('Error changing password:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de modifier le mot de passe.",
        variant: "destructive",
      });
    } finally {
      setChangingPassword(false);
    }
  };

  const generateBlankContractHTML = (agenceSettings: AgenceSettings): string => {
    const hasCgvPage = Boolean(
      agenceSettings?.inclure_cgv &&
      agenceSettings?.cgv_texte &&
      agenceSettings.cgv_texte.trim().length > 0
    );

    return `
      <style>
        @page { 
          size: A4 portrait;
          margin: 10mm;
        }
        #blank-contract-content {
          width: 100%;
          max-width: 190mm;
          margin: auto;
          overflow: hidden;
          font-family: Arial, Helvetica, sans-serif;
        }
        .contract-page {
          width: 190mm;
          height: 277mm;
          overflow: hidden;
        }
        .cgv-page {
          width: 190mm;
          min-height: 277mm;
        }
        .page-break-before { 
          page-break-before: always;
        }
      </style>
      
      <div style="background: white; width: 190mm; margin: auto; font-family: Arial, Helvetica, sans-serif;">
        
        <!-- Page 1 - Contrat -->
        <div class="contract-page" style="height: 277mm; overflow: hidden; padding: 24px; display: flex; flex-direction: column;">
          
          <!-- En-tête -->
          ${!agenceSettings?.masquer_entete ? `
            <div style="margin-bottom: 16px; padding-bottom: 8px; border-bottom: 2px solid black;">
              <div style="display: flex; justify-content: space-between; align-items: start;">
                ${!agenceSettings?.masquer_logo && agenceSettings?.logo_url ? `
                  <div style="width: 25%;">
                    <img src="${agenceSettings.logo_url}" alt="Logo" style="height: 64px; width: auto; object-fit: contain;" crossorigin="anonymous" />
                  </div>
                ` : ''}
                <div style="flex: 1; text-align: center;">
                  <h1 style="font-size: 14pt; font-weight: bold; margin-bottom: 4px;">CONTRAT DE LOCATION</h1>
                  <p style="font-size: 11pt; font-weight: 600;">N° __________________</p>
                </div>
                ${!agenceSettings?.masquer_logo && agenceSettings?.logo_url ? `
                  <div style="width: 25%; text-align: right; font-size: 8pt; color: #6b7280;">
                    ${format(new Date(), 'dd/MM/yyyy')}
                  </div>
                ` : ''}
              </div>
            </div>
          ` : ''}

          <!-- Informations principales -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
            
            <!-- LOCATAIRE -->
            <div style="border: 2px solid black;">
              <div style="background: #e5e7eb; border-bottom: 2px solid black; padding: 8px; text-align: center;">
                <strong style="font-size: 11pt;">LOCATAIRE</strong>
              </div>
              <div style="padding: 12px; font-size: 9pt;">
                <div><strong>Nom & Prénom:</strong> _______________________________</div>
                <div style="margin-top: 4px; display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                  <div><strong>CIN:</strong> _______________</div>
                  <div><strong>Permis:</strong> _______________</div>
                </div>
                <div style="margin-top: 4px;"><strong>Téléphone:</strong> _______________________________</div>
                <div style="margin-top: 4px;"><strong>Adresse:</strong> _______________________________</div>
              </div>
            </div>

            <!-- 2ÈME CONDUCTEUR -->
            <div style="border: 2px solid black;">
              <div style="background: #e5e7eb; border-bottom: 2px solid black; padding: 8px; text-align: center;">
                <strong style="font-size: 11pt;">2ÈME CONDUCTEUR</strong>
              </div>
              <div style="padding: 12px; font-size: 9pt;">
                <div><strong>Nom & Prénom:</strong> _______________________________</div>
                <div style="margin-top: 4px;"><strong>CIN:</strong> _______________________________</div>
                <div style="margin-top: 4px;"><strong>Permis:</strong> _______________________________</div>
              </div>
            </div>
          </div>

          <!-- VÉHICULE et LOCATION -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
            
            <!-- VÉHICULE -->
            <div style="border: 2px solid black;">
              <div style="background: #e5e7eb; border-bottom: 2px solid black; padding: 8px; text-align: center;">
                <strong style="font-size: 11pt;">VÉHICULE</strong>
              </div>
              <div style="padding: 12px; font-size: 9pt;">
                <div><strong>Marque/Modèle:</strong> _______________________________</div>
                <div style="margin-top: 4px;"><strong>Immatriculation:</strong> _______________________________</div>
                <div style="margin-top: 4px;"><strong>Km départ:</strong> _______________________________</div>
              </div>
            </div>

            <!-- LOCATION -->
            <div style="border: 2px solid black;">
              <div style="background: #e5e7eb; border-bottom: 2px solid black; padding: 8px; text-align: center;">
                <strong style="font-size: 11pt;">LOCATION</strong>
              </div>
              <div style="padding: 12px; font-size: 9pt;">
                <div><strong>Départ:</strong> ____________ - <strong>Retour:</strong> ____________</div>
                <div style="margin-top: 4px;"><strong>Durée:</strong> ______ jour(s) - <strong>Prix/Jr:</strong> ________ DH</div>
                <div style="margin-top: 4px;"><strong>Prix total:</strong> ________ DH - <strong>Caution:</strong> ________ DH</div>
              </div>
            </div>
          </div>

          <!-- ÉTAT DU VÉHICULE et OBSERVATIONS -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
            
            <div style="border: 2px solid black;">
              <div style="background: #e5e7eb; border-bottom: 2px solid black; padding: 8px; text-align: center;">
                <strong style="font-size: 10pt;">ÉTAT DU VÉHICULE</strong>
              </div>
              <div style="padding: 8px; display: flex; align-items: center; justify-content: center;">
                <img src="${vehicleInspectionDiagram}" alt="Schéma inspection" style="width: 100%; height: auto; max-height: 125px; object-fit: contain;" />
              </div>
            </div>

            <div style="border: 2px solid black;">
              <div style="background: #e5e7eb; border-bottom: 2px solid black; padding: 8px; text-align: center;">
                <strong style="font-size: 10pt;">OBSERVATIONS</strong>
              </div>
              <div style="padding: 8px; font-size: 9pt; min-height: 125px;">
                <!-- Espace pour observations -->
              </div>
            </div>
          </div>

          <!-- Note CGV -->
          <div style="text-align: center; font-size: 8pt; font-style: italic; margin: 8px 0;">
            * En signant le contrat, le client accepte les conditions générales de location.
          </div>

          <!-- SIGNATURES -->
          <div style="margin-top: auto; margin-bottom: 12px;">
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px;">
              
              <div style="text-align: center;">
                <div style="height: 64px; margin-bottom: 4px; display: flex; align-items: center; justify-content: center;">
                  ${agenceSettings?.signature_agence_url ? `
                    <img src="${agenceSettings.signature_agence_url}" alt="Signature agence" style="max-height: 64px; width: auto; object-fit: contain; transform: scale(1.2);" crossorigin="anonymous" />
                  ` : ''}
                </div>
                <div style="border-top: 2px solid black; padding-top: 4px;">
                  <strong style="font-size: 9pt;">Signature Agence</strong>
                </div>
              </div>
              
              <div style="text-align: center;">
                <div style="height: 64px; margin-bottom: 4px;"></div>
                <div style="border-top: 2px solid black; padding-top: 4px;">
                  <strong style="font-size: 9pt;">Signature Locataire</strong>
                </div>
              </div>
              
              <div style="text-align: center;">
                <div style="height: 64px; margin-bottom: 4px;"></div>
                <div style="border-top: 2px solid black; padding-top: 4px;">
                  <strong style="font-size: 9pt;">Signature 2ème Conducteur</strong>
                </div>
              </div>
            </div>
          </div>

          <!-- FOOTER -->
          ${!agenceSettings?.masquer_pied_page ? `
            <div style="text-align: center; font-size: 10pt; color: #6b7280; margin-top: 0; padding-top: 4px; border-top: 1px solid #9ca3af;">
              ${agenceSettings?.raison_sociale ? `<strong>${agenceSettings.raison_sociale}</strong>` : ''}
              ${agenceSettings?.ice ? ` | ICE: ${agenceSettings.ice}` : ''}
              ${agenceSettings?.if_number ? ` | IF: ${agenceSettings.if_number}` : ''}
              ${agenceSettings?.rc ? ` | RC: ${agenceSettings.rc}` : ''}
              ${agenceSettings?.cnss ? ` | CNSS: ${agenceSettings.cnss}` : ''}
              ${agenceSettings?.patente ? ` | Patente: ${agenceSettings.patente}` : ''}
              <br/>
              ${agenceSettings?.adresse ? `Adresse: ${agenceSettings.adresse}` : ''}
              ${agenceSettings?.telephone ? ` | Tél: ${agenceSettings.telephone}` : ''}
              ${agenceSettings?.email ? ` | Email: ${agenceSettings.email}` : ''}
            </div>
          ` : ''}
        </div>

        <!-- Page 2 - CGV -->
        ${hasCgvPage ? `
          <div class="page-break-before cgv-page" style="padding: 16px; font-family: Arial, Helvetica, sans-serif;">
            <div style="text-center; margin-bottom: 12px;">
              <h2 style="font-size: 13pt; font-weight: bold; text-transform: uppercase;">CONDITIONS GÉNÉRALES DE LOCATION</h2>
            </div>
            <div style="white-space: pre-wrap; text-align: justify; font-size: 9.5pt; line-height: 1.4;">
${agenceSettings.cgv_texte}
            </div>
          </div>
        ` : ''}

      </div>
    `;
  };

  const downloadBlankContract = async () => {
    if (!settings) {
      toast({
        title: "Erreur",
        description: "Les paramètres de l'agence ne sont pas chargés.",
        variant: "destructive",
      });
      return;
    }

    setGeneratingBlankContract(true);

    try {
      // Créer un élément temporaire pour le contenu HTML
      const tempDiv = document.createElement('div');
      tempDiv.id = 'blank-contract-content';
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.width = '190mm';
      document.body.appendChild(tempDiv);

      // Générer le HTML du contrat vierge
      const contractHTML = generateBlankContractHTML(settings);
      tempDiv.innerHTML = contractHTML;

      // Attendre que les images se chargent
      await new Promise(resolve => setTimeout(resolve, 500));

      // Configuration PDF
      const opt = {
        margin: 10,
        filename: 'Contrat_Vierge_CRSAPP.pdf',
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { 
          scale: 2, 
          useCORS: true,
          allowTaint: true,
          logging: false,
          backgroundColor: '#ffffff'
        },
        jsPDF: { 
          unit: 'mm' as const, 
          format: 'a4' as const, 
          orientation: 'portrait' as const
        },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
      };

      // Générer et télécharger le PDF
      await html2pdf().set(opt).from(tempDiv).save();

      // Nettoyer
      document.body.removeChild(tempDiv);

      toast({
        title: "Succès",
        description: "Le contrat vierge a été téléchargé.",
      });
    } catch (error: any) {
      console.error('Error generating blank contract:', error);
      toast({
        title: "Erreur",
        description: "Impossible de générer le contrat vierge.",
        variant: "destructive",
      });
    } finally {
      setGeneratingBlankContract(false);
    }
  };

  if (roleLoading || planLoading || !isAdmin || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Settings className="w-8 h-8" />
          Paramètres de l'agence
        </h1>
        <p className="text-muted-foreground mt-1">
          Configurez les informations et préférences de votre agence
        </p>
      </div>

      {/* Bannière d'onboarding */}
      {!onboardingCompleted && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3 mb-3">
              <CheckCircle2 className="text-red-600 w-6 h-6 flex-shrink-0 mt-0.5" />
              <div>
                <h2 className="text-xl font-semibold text-red-700 mb-2">
                  Bienvenue sur CRSApp 🚗
                </h2>
                <p className="text-gray-700 text-sm leading-relaxed">
                  Avant de démarrer, veuillez compléter les informations de votre agence :
                  logo, coordonnées, alertes et paramètres TVA.  
                  Une fois terminé, cliquez sur le bouton <strong>"Enregistrer"</strong> dans chaque section ci-dessous pour finaliser votre configuration.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Informations d'agence */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Informations d'agence
            </CardTitle>
            <CardDescription>
              Ces informations apparaîtront sur vos factures et contrats
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Logo Upload */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                Logo de l'agence
              </Label>
              <div className="flex items-center gap-4">
                {settings?.logo_url ? (
                  <div className="relative">
                    <img 
                      src={settings.logo_url} 
                      alt="Logo" 
                      className="h-20 w-auto object-contain border rounded p-2"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 h-6 w-6"
                      onClick={handleRemoveLogo}
                      disabled={uploadingLogo}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="h-20 w-20 border-2 border-dashed rounded flex items-center justify-center text-muted-foreground">
                    <ImageIcon className="w-8 h-8" />
                  </div>
                )}
                <div className="flex-1">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    disabled={uploadingLogo}
                    className="cursor-pointer"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    PNG, JPG ou WEBP (max 2MB)
                  </p>
                </div>
              </div>
            </div>

            {/* Signature/Cachet Upload */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                Signature / Cachet de l&apos;agence
              </Label>
              <div className="flex items-center gap-4">
                {settings?.signature_agence_url ? (
                  <div className="relative">
                    <img 
                      src={settings.signature_agence_url} 
                      alt="Signature agence" 
                      className="h-20 w-auto object-contain border rounded p-2"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 h-6 w-6"
                      onClick={handleRemoveSignature}
                      disabled={uploadingSignature}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="h-20 w-20 border-2 border-dashed rounded flex items-center justify-center text-muted-foreground">
                    <ImageIcon className="w-8 h-8" />
                  </div>
                )}
                <div className="flex-1">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleSignatureUpload}
                    disabled={uploadingSignature}
                    className="cursor-pointer"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    PNG, JPG ou WEBP (max 2MB) - Sera affichée automatiquement sur les contrats
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Raison sociale</Label>
              <Input
                value={settings?.raison_sociale || ''}
                readOnly
                disabled
                className="bg-muted cursor-not-allowed"
              />
              <p className="text-xs text-muted-foreground">
                Non modifiable après inscription
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>ICE</Label>
                <Input
                  value={settings?.ice || ''}
                  readOnly
                  disabled
                  className="bg-muted cursor-not-allowed"
                />
                <p className="text-xs text-muted-foreground">
                  Non modifiable après inscription
                </p>
              </div>
              <div className="space-y-2">
                <Label>IF</Label>
                <Input
                  value={settings?.if_number || ''}
                  onChange={(e) => setSettings(prev => prev ? {...prev, if_number: e.target.value} : null)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>RC</Label>
                <Input
                  value={settings?.rc || ''}
                  onChange={(e) => setSettings(prev => prev ? {...prev, rc: e.target.value} : null)}
                />
              </div>
              <div className="space-y-2">
                <Label>CNSS</Label>
                <Input
                  value={settings?.cnss || ''}
                  onChange={(e) => setSettings(prev => prev ? {...prev, cnss: e.target.value} : null)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Patente</Label>
              <Input
                value={settings?.patente || ''}
                onChange={(e) => setSettings(prev => prev ? {...prev, patente: e.target.value} : null)}
              />
            </div>
            <div className="space-y-2">
              <Label>Adresse</Label>
              <Input
                value={settings?.adresse || ''}
                onChange={(e) => setSettings(prev => prev ? {...prev, adresse: e.target.value} : null)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={settings?.email || ''}
                  onChange={(e) => setSettings(prev => prev ? {...prev, email: e.target.value} : null)}
                />
              </div>
              <div className="space-y-2">
                <Label>Téléphone</Label>
                <Input
                  value={settings?.telephone || ''}
                  onChange={(e) => setSettings(prev => prev ? {...prev, telephone: e.target.value} : null)}
                />
              </div>
            </div>
            <Button onClick={() => updateSettings({
              raison_sociale: settings?.raison_sociale,
              ice: settings?.ice,
              if_number: settings?.if_number,
              rc: settings?.rc,
              cnss: settings?.cnss,
              patente: settings?.patente,
              adresse: settings?.adresse,
              email: settings?.email,
              telephone: settings?.telephone,
            })} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Enregistrer
            </Button>
          </CardContent>
        </Card>

        {/* Alertes et TVA */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Alertes et TVA
            </CardTitle>
            <CardDescription>
              Configuration des seuils d'alerte et taux de TVA
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Taux de TVA (%)</Label>
              <Input
                type="number"
                value={settings?.taux_tva || 20}
                onChange={(e) => setSettings(prev => prev ? {...prev, taux_tva: parseFloat(e.target.value)} : null)}
              />
            </div>
            <div className="space-y-2">
              <Label>Alerte chèque (jours)</Label>
              <Input
                type="number"
                value={settings?.alerte_cheque_jours || 30}
                onChange={(e) => setSettings(prev => prev ? {...prev, alerte_cheque_jours: parseInt(e.target.value)} : null)}
              />
            </div>
            <div className="space-y-2">
              <Label>Alerte visite technique (jours)</Label>
              <Input
                type="number"
                value={settings?.alerte_visite_jours || 30}
                onChange={(e) => setSettings(prev => prev ? {...prev, alerte_visite_jours: parseInt(e.target.value)} : null)}
              />
            </div>
            <div className="space-y-2">
              <Label>Alerte assurance (jours)</Label>
              <Input
                type="number"
                value={settings?.alerte_assurance_jours || 30}
                onChange={(e) => setSettings(prev => prev ? {...prev, alerte_assurance_jours: parseInt(e.target.value)} : null)}
              />
            </div>
            <div className="space-y-2">
              <Label>Alerte vignette (jours)</Label>
              <Input
                type="number"
                value={settings?.alerte_autorisation_jours || 30}
                onChange={(e) => setSettings(prev => prev ? {...prev, alerte_autorisation_jours: parseInt(e.target.value)} : null)}
              />
            </div>
            <Button onClick={() => updateSettings({
              taux_tva: settings?.taux_tva,
              alerte_cheque_jours: settings?.alerte_cheque_jours,
              alerte_visite_jours: settings?.alerte_visite_jours,
              alerte_assurance_jours: settings?.alerte_assurance_jours,
              alerte_autorisation_jours: settings?.alerte_autorisation_jours,
            })} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Enregistrer
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Second row - Categories + Print settings */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Gestion des catégories d'assistance - Masquer si module non accessible */}
        {hasModuleAccess('assistance') && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="w-5 h-5" />
                Catégories d'assistance
            </CardTitle>
            <CardDescription>
              Gérez les catégories disponibles pour les contrats d'assistance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Code catégorie (ex: A, F, G...)"
                value={newCategoryCode}
                onChange={(e) => setNewCategoryCode(e.target.value.toUpperCase())}
                onKeyPress={(e) => e.key === 'Enter' && addAssistanceCategory()}
                maxLength={3}
              />
              <Button onClick={addAssistanceCategory} size="icon">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-2">
              {assistanceCategories.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Aucune catégorie définie
                </p>
              ) : (
                assistanceCategories.map((cat) => (
                  <div key={cat.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="font-bold text-lg">{cat.code}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteAssistanceCategory(cat.id)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
        )}

        {/* Paramètres d'impression */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Printer className="w-5 h-5" />
              Paramètres d'impression
            </CardTitle>
            <CardDescription>
              Options d'affichage pour les documents imprimés
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Masquer le logo</Label>
              <Switch
                checked={settings?.masquer_logo || false}
                onCheckedChange={(checked) => setSettings(prev => prev ? {...prev, masquer_logo: checked} : null)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Masquer l'en-tête</Label>
              <Switch
                checked={settings?.masquer_entete || false}
                onCheckedChange={(checked) => setSettings(prev => prev ? {...prev, masquer_entete: checked} : null)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Masquer le pied de page</Label>
              <Switch
                checked={settings?.masquer_pied_page || false}
                onCheckedChange={(checked) => setSettings(prev => prev ? {...prev, masquer_pied_page: checked} : null)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Inclure les CGV</Label>
              <Switch
                checked={settings?.inclure_cgv || false}
                onCheckedChange={(checked) => setSettings(prev => prev ? {...prev, inclure_cgv: checked} : null)}
              />
            </div>
            {settings?.inclure_cgv && (
              <div className="space-y-2">
                <Label>Conditions Générales de Vente (CGV)</Label>
                <Textarea
                  placeholder="Saisissez les conditions générales de vente qui apparaîtront au dos des contrats..."
                  value={settings?.cgv_texte || ''}
                  onChange={(e) => setSettings(prev => prev ? {...prev, cgv_texte: e.target.value} : null)}
                  rows={10}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Les CGV apparaîtront sur une nouvelle page au dos du contrat de location
                </p>
              </div>
            )}
            <Button onClick={() => updateSettings({
              masquer_logo: settings?.masquer_logo,
              masquer_entete: settings?.masquer_entete,
              masquer_pied_page: settings?.masquer_pied_page,
              inclure_cgv: settings?.inclure_cgv,
              cgv_texte: settings?.cgv_texte,
            })} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Enregistrer
            </Button>
            
            {/* Bouton télécharger contrat vierge */}
            <div className="pt-4 border-t">
              <Button
                onClick={downloadBlankContract}
                disabled={generatingBlankContract}
                className="w-full bg-red-600 hover:bg-red-700 text-white"
              >
                {generatingBlankContract ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Génération en cours...
                  </>
                ) : (
                  <>
                    <FileDown className="w-4 h-4 mr-2" />
                    Télécharger un contrat vierge
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Génère un PDF de contrat sans informations client/véhicule, à remplir manuellement
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Security Section - Moved to bottom */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="w-5 h-5" />
            Sécurité du compte
          </CardTitle>
          <CardDescription>
            Modifiez votre mot de passe
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => setIsChangePasswordDialogOpen(true)}>
            <KeyRound className="w-4 h-4 mr-2" />
            Modifier mon mot de passe
          </Button>
        </CardContent>
      </Card>

      {/* Change Password Dialog */}
      <Dialog open={isChangePasswordDialogOpen} onOpenChange={setIsChangePasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier mon mot de passe</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="oldPassword">Ancien mot de passe</Label>
              <Input
                id="oldPassword"
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="Entrez votre ancien mot de passe"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">Nouveau mot de passe</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 6 caractères"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmer le nouveau mot de passe</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirmez le nouveau mot de passe"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsChangePasswordDialogOpen(false);
                  setOldPassword("");
                  setNewPassword("");
                  setConfirmPassword("");
                }}
              >
                Annuler
              </Button>
              <Button 
                onClick={handleChangePassword} 
                disabled={changingPassword}
              >
                {changingPassword ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Modification...
                  </>
                ) : (
                  'Modifier'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
