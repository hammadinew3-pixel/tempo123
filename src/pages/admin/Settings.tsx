import { Card } from "@/components/ui/card";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Settings as SettingsIcon, Save, Globe, Shield, Bell, FileText } from "lucide-react";
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
  default_max_vehicles: number;
  default_max_users: number;
  trial_duration_days: number;
  enable_email_alerts: boolean;
  log_retention_days: number;
}

export default function AdminSettings() {
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState<SuperAdminSettings | null>(null);

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

  useEffect(() => {
    if (data) {
      setSettings(data);
    }
  }, [data]);

  const updateMutation = useMutation({
    mutationFn: async (newSettings: SuperAdminSettings) => {
      const { error } = await supabase
        .from('super_admin_settings')
        .update({
          platform_name: newSettings.platform_name,
          support_email: newSettings.support_email,
          maintenance_mode: newSettings.maintenance_mode,
          default_max_vehicles: newSettings.default_max_vehicles,
          default_max_users: newSettings.default_max_users,
          trial_duration_days: newSettings.trial_duration_days,
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

  const handleSave = () => {
    if (settings) {
      updateMutation.mutate(settings);
    }
  };

  if (isLoading || !settings) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <SettingsIcon className="h-8 w-8 text-emerald-500" />
          <h1 className="text-3xl font-bold text-white">Paramètres Globaux</h1>
        </div>
        <div className="grid grid-cols-1 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 bg-slate-800" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <SettingsIcon className="h-8 w-8 text-emerald-500" />
          <h1 className="text-3xl font-bold text-white">Paramètres Globaux</h1>
        </div>
        <Button
          onClick={handleSave}
          disabled={updateMutation.isPending}
          className="bg-emerald-500 hover:bg-emerald-600 text-white"
        >
          <Save className="h-4 w-4 mr-2" />
          {updateMutation.isPending ? "Sauvegarde..." : "Sauvegarder"}
        </Button>
      </div>

      {/* Paramètres Système */}
      <Card className="bg-slate-900 border-slate-800 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Globe className="h-5 w-5 text-emerald-500" />
          <h2 className="text-xl font-semibold text-white">Paramètres Système</h2>
        </div>
        <div className="space-y-4">
          <div>
            <Label htmlFor="platform_name" className="text-gray-300">Nom de la plateforme</Label>
            <Input
              id="platform_name"
              value={settings.platform_name}
              onChange={(e) => setSettings({ ...settings, platform_name: e.target.value })}
              className="bg-slate-800 border-slate-700 text-white mt-1"
            />
          </div>
          <div>
            <Label htmlFor="support_email" className="text-gray-300">Email de support</Label>
            <Input
              id="support_email"
              type="email"
              value={settings.support_email || ''}
              onChange={(e) => setSettings({ ...settings, support_email: e.target.value })}
              className="bg-slate-800 border-slate-700 text-white mt-1"
              placeholder="support@crsapp.com"
            />
          </div>
          <div className="flex items-center justify-between p-4 bg-slate-800 rounded-lg">
            <div>
              <Label htmlFor="maintenance_mode" className="text-white font-medium">Mode maintenance</Label>
              <p className="text-sm text-gray-400">Activer pour mettre la plateforme en maintenance</p>
            </div>
            <Switch
              id="maintenance_mode"
              checked={settings.maintenance_mode}
              onCheckedChange={(checked) => setSettings({ ...settings, maintenance_mode: checked })}
            />
          </div>
        </div>
      </Card>

      {/* Limites par Tenant */}
      <Card className="bg-slate-900 border-slate-800 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="h-5 w-5 text-emerald-500" />
          <h2 className="text-xl font-semibold text-white">Limites par Agence</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="max_vehicles" className="text-gray-300">Véhicules max</Label>
            <Input
              id="max_vehicles"
              type="number"
              value={settings.default_max_vehicles}
              onChange={(e) => setSettings({ ...settings, default_max_vehicles: parseInt(e.target.value) })}
              className="bg-slate-800 border-slate-700 text-white mt-1"
            />
          </div>
          <div>
            <Label htmlFor="max_users" className="text-gray-300">Utilisateurs max</Label>
            <Input
              id="max_users"
              type="number"
              value={settings.default_max_users}
              onChange={(e) => setSettings({ ...settings, default_max_users: parseInt(e.target.value) })}
              className="bg-slate-800 border-slate-700 text-white mt-1"
            />
          </div>
          <div>
            <Label htmlFor="trial_duration" className="text-gray-300">Durée d'essai (jours)</Label>
            <Input
              id="trial_duration"
              type="number"
              value={settings.trial_duration_days}
              onChange={(e) => setSettings({ ...settings, trial_duration_days: parseInt(e.target.value) })}
              className="bg-slate-800 border-slate-700 text-white mt-1"
            />
          </div>
        </div>
      </Card>

      {/* Notifications */}
      <Card className="bg-slate-900 border-slate-800 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="h-5 w-5 text-emerald-500" />
          <h2 className="text-xl font-semibold text-white">Notifications</h2>
        </div>
        <div className="flex items-center justify-between p-4 bg-slate-800 rounded-lg">
          <div>
            <Label htmlFor="email_alerts" className="text-white font-medium">Alertes par email</Label>
            <p className="text-sm text-gray-400">Recevoir des notifications par email pour les événements importants</p>
          </div>
          <Switch
            id="email_alerts"
            checked={settings.enable_email_alerts}
            onCheckedChange={(checked) => setSettings({ ...settings, enable_email_alerts: checked })}
          />
        </div>
      </Card>

      {/* Logs & Audit */}
      <Card className="bg-slate-900 border-slate-800 p-6">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="h-5 w-5 text-emerald-500" />
          <h2 className="text-xl font-semibold text-white">Logs & Audit</h2>
        </div>
        <div>
          <Label htmlFor="log_retention" className="text-gray-300">Durée de rétention des logs (jours)</Label>
          <Input
            id="log_retention"
            type="number"
            value={settings.log_retention_days}
            onChange={(e) => setSettings({ ...settings, log_retention_days: parseInt(e.target.value) })}
            className="bg-slate-800 border-slate-700 text-white mt-1"
          />
          <p className="text-sm text-gray-400 mt-2">Les logs plus anciens seront automatiquement supprimés</p>
        </div>
      </Card>

      <Card className="bg-slate-900 border-slate-800 p-6">
        <p className="text-gray-400 text-center">
          Ces paramètres s'appliquent à l'ensemble de la plateforme et affectent toutes les agences.
        </p>
      </Card>
    </div>
  );
}
