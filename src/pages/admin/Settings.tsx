import { Card } from "@/components/ui/card";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Settings as SettingsIcon, Save, Globe, Bell, FileText } from "lucide-react";
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
        <h1 className="text-3xl font-semibold text-black">Paramètres Globaux</h1>
        <div className="grid grid-cols-1 gap-4">
          {[1, 2, 3].map((i) => (
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

      <Card className="bg-gray-50 border border-gray-200 rounded-xl p-6">
        <p className="text-gray-600 text-center text-sm">
          Ces paramètres s'appliquent à l'ensemble de la plateforme et affectent toutes les agences.
        </p>
      </Card>
    </div>
  );
}
