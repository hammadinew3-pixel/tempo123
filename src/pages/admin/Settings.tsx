import { Card } from "@/components/ui/card";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Settings as SettingsIcon, Save, Globe, Bell, FileText, Building2, Shield } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useState, useEffect } from "react";
import { toast } from "sonner";

interface SuperAdminSettings {
  id: string;
  platform_name: string;
  support_email: string | null;
  maintenance_mode: boolean;
  enable_email_alerts: boolean;
  log_retention_days: number;
}

interface BankSettings {
  id: string;
  nom_banque: string;
  rib: string;
  swift: string | null;
  titulaire: string;
}

export default function AdminSettings() {
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState<SuperAdminSettings | null>(null);
  const [bankSettings, setBankSettings] = useState<BankSettings | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ['super-admin-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('super_admin_settings')
        .select('*')
        .single();
      
      if (error) throw error;
      return data as SuperAdminSettings;
    },
  });

  const { data: bankData, isLoading: bankLoading } = useQuery({
    queryKey: ['bank-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('settings_bancaires')
        .select('*')
        .single();
      
      if (error) throw error;
      return data as BankSettings;
    },
  });

  useEffect(() => {
    if (data) {
      setSettings(data);
    }
  }, [data]);

  useEffect(() => {
    if (bankData) {
      setBankSettings(bankData);
    }
  }, [bankData]);

  const updateMutation = useMutation({
    mutationFn: async (newSettings: SuperAdminSettings) => {
      const { error } = await supabase
        .from('super_admin_settings')
        .update({
          platform_name: newSettings.platform_name,
          support_email: newSettings.support_email,
          maintenance_mode: newSettings.maintenance_mode,
          enable_email_alerts: newSettings.enable_email_alerts,
          log_retention_days: newSettings.log_retention_days,
        })
        .eq('id', newSettings.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['super-admin-settings'] });
      toast.success("Paramètres sauvegardés avec succès");
    },
    onError: (error) => {
      toast.error("Erreur lors de la sauvegarde: " + error.message);
    },
  });

  const updateBankMutation = useMutation({
    mutationFn: async (newBankSettings: BankSettings) => {
      const { error } = await supabase
        .from('settings_bancaires')
        .update({
          nom_banque: newBankSettings.nom_banque,
          rib: newBankSettings.rib,
          swift: newBankSettings.swift,
          titulaire: newBankSettings.titulaire,
        })
        .eq('id', newBankSettings.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-settings'] });
      toast.success("Coordonnées bancaires sauvegardées");
    },
    onError: (error) => {
      toast.error("Erreur lors de la sauvegarde: " + error.message);
    },
  });

  const handleSave = () => {
    if (settings) {
      updateMutation.mutate(settings);
    }
  };

  const handleSaveBank = () => {
    if (bankSettings) {
      updateBankMutation.mutate(bankSettings);
    }
  };

  const handleChangePassword = async () => {
    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Tous les champs sont requis");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("Le mot de passe doit contenir au moins 8 caractères");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas");
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast.success("Mot de passe modifié avec succès");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast.error("Erreur: " + error.message);
    }
  };

  if (isLoading || !settings || bankLoading || !bankSettings) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-semibold text-black">Paramètres Globaux</h1>
        <div className="grid grid-cols-1 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-48 bg-gray-200" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-black flex items-center gap-3">
            <SettingsIcon className="h-8 w-8 text-[#c01533]" />
            Paramètres Globaux
          </h1>
          <p className="text-gray-500 mt-1">Configuration générale de la plateforme</p>
        </div>
        <Button
          onClick={handleSave}
          disabled={updateMutation.isPending}
          className="bg-[#c01533] hover:bg-[#9a0f26] text-white"
        >
          <Save className="h-4 w-4 mr-2" />
          {updateMutation.isPending ? "Sauvegarde..." : "Sauvegarder"}
        </Button>
      </div>

      {/* System Settings */}
      <Card className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-2 mb-6">
          <Globe className="h-5 w-5 text-[#c01533]" />
          <h2 className="text-xl font-semibold text-black">Paramètres Système</h2>
        </div>
        <div className="space-y-5">
          <div>
            <Label htmlFor="platform_name" className="text-gray-700 font-medium">Nom de la plateforme</Label>
            <Input
              id="platform_name"
              value={settings.platform_name}
              onChange={(e) => setSettings({ ...settings, platform_name: e.target.value })}
              className="bg-white border-gray-300 text-black mt-2"
            />
          </div>
          <div>
            <Label htmlFor="support_email" className="text-gray-700 font-medium">Email de support</Label>
            <Input
              id="support_email"
              type="email"
              value={settings.support_email || ''}
              onChange={(e) => setSettings({ ...settings, support_email: e.target.value })}
              className="bg-white border-gray-300 text-black mt-2"
              placeholder="support@crsapp.com"
            />
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div>
              <Label htmlFor="maintenance_mode" className="text-black font-medium">Mode maintenance</Label>
              <p className="text-sm text-gray-500 mt-1">Activer pour mettre la plateforme en maintenance</p>
            </div>
            <Switch
              id="maintenance_mode"
              checked={settings.maintenance_mode}
              onCheckedChange={(checked) => setSettings({ ...settings, maintenance_mode: checked })}
            />
          </div>
        </div>
      </Card>

      {/* Notifications */}
      <Card className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-2 mb-6">
          <Bell className="h-5 w-5 text-[#c01533]" />
          <h2 className="text-xl font-semibold text-black">Notifications</h2>
        </div>
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div>
            <Label htmlFor="email_alerts" className="text-black font-medium">Alertes par email</Label>
            <p className="text-sm text-gray-500 mt-1">Recevoir des notifications par email pour les événements importants</p>
          </div>
          <Switch
            id="email_alerts"
            checked={settings.enable_email_alerts}
            onCheckedChange={(checked) => setSettings({ ...settings, enable_email_alerts: checked })}
          />
        </div>
      </Card>

      {/* Logs & Audit */}
      <Card className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-2 mb-6">
          <FileText className="h-5 w-5 text-[#c01533]" />
          <h2 className="text-xl font-semibold text-black">Logs & Audit</h2>
        </div>
        <div>
          <Label htmlFor="log_retention" className="text-gray-700 font-medium">Durée de rétention des logs (jours)</Label>
          <Input
            id="log_retention"
            type="number"
            value={settings.log_retention_days}
            onChange={(e) => setSettings({ ...settings, log_retention_days: parseInt(e.target.value) })}
            className="bg-white border-gray-300 text-black mt-2"
          />
          <p className="text-sm text-gray-500 mt-2">Les logs plus anciens seront automatiquement supprimés</p>
        </div>
      </Card>

      {/* Security & Authentication */}
      <Card className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-2 mb-6">
          <Shield className="h-5 w-5 text-[#c01533]" />
          <h2 className="text-xl font-semibold text-black">Sécurité & Authentification</h2>
        </div>
        <div className="space-y-4">
          <div>
            <Label htmlFor="current_password" className="text-gray-700 font-medium">Mot de passe actuel</Label>
            <Input
              id="current_password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="bg-white border-gray-300 text-black mt-2"
              placeholder="••••••••"
            />
          </div>
          <div>
            <Label htmlFor="new_password" className="text-gray-700 font-medium">Nouveau mot de passe</Label>
            <Input
              id="new_password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="bg-white border-gray-300 text-black mt-2"
              placeholder="••••••••"
            />
            <p className="text-sm text-gray-500 mt-1">Minimum 8 caractères</p>
          </div>
          <div>
            <Label htmlFor="confirm_password" className="text-gray-700 font-medium">Confirmer le nouveau mot de passe</Label>
            <Input
              id="confirm_password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="bg-white border-gray-300 text-black mt-2"
              placeholder="••••••••"
            />
          </div>
          <Button
            onClick={handleChangePassword}
            className="bg-[#c01533] hover:bg-[#9a0f26] text-white"
          >
            Changer le mot de passe
          </Button>
        </div>
      </Card>

      {/* Bank Settings */}
      <Card className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-[#c01533]" />
            <h2 className="text-xl font-semibold text-black">Coordonnées bancaires</h2>
          </div>
          <Button
            onClick={handleSaveBank}
            disabled={updateBankMutation.isPending}
            variant="outline"
            className="border-[#c01533] text-[#c01533] hover:bg-[#c01533] hover:text-white"
          >
            <Save className="h-4 w-4 mr-2" />
            {updateBankMutation.isPending ? "Sauvegarde..." : "Sauvegarder"}
          </Button>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Ces informations seront affichées aux nouveaux utilisateurs lors du paiement par virement bancaire
        </p>
        <div className="space-y-4">
          <div>
            <Label htmlFor="nom_banque" className="text-gray-700 font-medium">Nom de la banque</Label>
            <Input
              id="nom_banque"
              value={bankSettings.nom_banque}
              onChange={(e) => setBankSettings({ ...bankSettings, nom_banque: e.target.value })}
              className="bg-white border-gray-300 text-black mt-2"
              placeholder="Banque Populaire"
            />
          </div>
          <div>
            <Label htmlFor="titulaire" className="text-gray-700 font-medium">Titulaire du compte</Label>
            <Input
              id="titulaire"
              value={bankSettings.titulaire}
              onChange={(e) => setBankSettings({ ...bankSettings, titulaire: e.target.value })}
              className="bg-white border-gray-300 text-black mt-2"
              placeholder="CRSApp SARL"
            />
          </div>
          <div>
            <Label htmlFor="rib" className="text-gray-700 font-medium">RIB</Label>
            <Input
              id="rib"
              value={bankSettings.rib}
              onChange={(e) => setBankSettings({ ...bankSettings, rib: e.target.value })}
              className="bg-white border-gray-300 text-black mt-2 font-mono"
              placeholder="000 000 000000000000 00"
            />
          </div>
          <div>
            <Label htmlFor="swift" className="text-gray-700 font-medium">SWIFT (optionnel)</Label>
            <Input
              id="swift"
              value={bankSettings.swift || ''}
              onChange={(e) => setBankSettings({ ...bankSettings, swift: e.target.value })}
              className="bg-white border-gray-300 text-black mt-2 font-mono"
              placeholder="BCMAMAMCXXX"
            />
          </div>
        </div>
      </Card>

      <Card className="bg-gray-50 border border-gray-200 rounded-xl p-6">
        <p className="text-gray-600 text-center text-sm">
          Ces paramètres s'appliquent à l'ensemble de la plateforme et affectent toutes les agences.
        </p>
      </Card>
    </div>
  );
}
