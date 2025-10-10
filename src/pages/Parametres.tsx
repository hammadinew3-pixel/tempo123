import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/use-user-role";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Settings, Building2, Bell, Printer, Upload, Loader2 } from "lucide-react";

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
  taux_tva?: number;
  alerte_cheque_jours?: number;
  alerte_vidange_kms?: number;
  alerte_visite_jours?: number;
  alerte_assurance_jours?: number;
  alerte_autorisation_jours?: number;
  masquer_logo?: boolean;
  masquer_entete?: boolean;
  masquer_pied_page?: boolean;
  inclure_cgv?: boolean;
  cgv_url?: string;
}

export default function Parametres() {
  const { isAdmin, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [settings, setSettings] = useState<AgenceSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
    }
  }, [isAdmin]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('agence_settings')
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

  const updateSettings = async (updates: Partial<AgenceSettings>) => {
    try {
      setSaving(true);
      const { error } = await supabase
        .from('agence_settings')
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
              <Label>Alerte vidange (km)</Label>
              <Input
                type="number"
                value={settings?.alerte_vidange_kms || 5000}
                onChange={(e) => setSettings(prev => prev ? {...prev, alerte_vidange_kms: parseInt(e.target.value)} : null)}
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
              alerte_vidange_kms: settings?.alerte_vidange_kms,
              alerte_visite_jours: settings?.alerte_visite_jours,
              alerte_assurance_jours: settings?.alerte_assurance_jours,
              alerte_autorisation_jours: settings?.alerte_autorisation_jours,
            })} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Enregistrer
            </Button>
          </CardContent>
        </Card>

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
            <Button onClick={() => updateSettings({
              masquer_logo: settings?.masquer_logo,
              masquer_entete: settings?.masquer_entete,
              masquer_pied_page: settings?.masquer_pied_page,
              inclure_cgv: settings?.inclure_cgv,
            })} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Enregistrer
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
