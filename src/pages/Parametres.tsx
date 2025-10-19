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
import { Settings, Building2, Bell, Printer, Upload, Loader2, X, ImageIcon, Tag, Plus, Trash2 } from "lucide-react";
import { CurrentPlanCard } from "@/components/settings/CurrentPlanCard";
import { PlanSelectionDialog } from "@/components/settings/PlanSelectionDialog";
import { useTenantPlan } from "@/hooks/useTenantPlan";

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
  const { isAdmin, loading: roleLoading } = useUserRole();
  const { hasModuleAccess } = useTenantPlan();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [settings, setSettings] = useState<AgenceSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingSignature, setUploadingSignature] = useState(false);
  const [assistanceCategories, setAssistanceCategories] = useState<any[]>([]);
  const [newCategoryCode, setNewCategoryCode] = useState("");
  const [showPlanSelection, setShowPlanSelection] = useState(false);

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
      if (hasModuleAccess('assistance')) {
        loadAssistanceCategories();
      }
    }
  }, [isAdmin, hasModuleAccess]);

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

  if (roleLoading || !isAdmin || loading) {
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

      {/* NOUVEAU : Plan actuel - EN PREMIER */}
      <CurrentPlanCard onChangePlan={() => setShowPlanSelection(true)} />

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
                onChange={(e) => setSettings(prev => prev ? {...prev, raison_sociale: e.target.value} : null)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>ICE</Label>
                <Input
                  value={settings?.ice || ''}
                  onChange={(e) => setSettings(prev => prev ? {...prev, ice: e.target.value} : null)}
                />
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
              <Label>Alerte autorisation (jours)</Label>
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
          </CardContent>
        </Card>
      </div>

      {/* Modal de sélection de plan */}
      <PlanSelectionDialog 
        open={showPlanSelection} 
        onOpenChange={setShowPlanSelection} 
      />
    </div>
  );
}
