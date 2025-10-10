import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { Permission } from "@/hooks/use-permissions";

interface PermissionConfig {
  permission: Permission;
  enabled: boolean;
  label: string;
  description: string;
}

const permissionGroups = [
  {
    title: "Tableau de bord",
    permissions: [
      { permission: 'dashboard.view' as Permission, label: 'Voir le tableau de bord', description: 'Accès au tableau de bord principal' },
    ]
  },
  {
    title: "Véhicules",
    permissions: [
      { permission: 'vehicles.view' as Permission, label: 'Voir les véhicules', description: 'Consulter la liste des véhicules' },
      { permission: 'vehicles.create' as Permission, label: 'Créer des véhicules', description: 'Ajouter de nouveaux véhicules' },
      { permission: 'vehicles.update_km' as Permission, label: 'Mettre à jour le kilométrage', description: 'Modifier le kilométrage des véhicules' },
      { permission: 'vehicles.update_status' as Permission, label: 'Mettre à jour le statut', description: 'Changer le statut des véhicules' },
      { permission: 'vehicles.delete' as Permission, label: 'Supprimer des véhicules', description: 'Supprimer des véhicules du système' },
    ]
  },
  {
    title: "Clients",
    permissions: [
      { permission: 'clients.view' as Permission, label: 'Voir les clients', description: 'Consulter la liste des clients' },
      { permission: 'clients.create' as Permission, label: 'Créer des clients', description: 'Ajouter de nouveaux clients' },
      { permission: 'clients.update' as Permission, label: 'Modifier les clients', description: 'Mettre à jour les informations clients' },
      { permission: 'clients.delete' as Permission, label: 'Supprimer des clients', description: 'Supprimer des clients' },
    ]
  },
  {
    title: "Contrats de location",
    permissions: [
      { permission: 'contracts.view' as Permission, label: 'Voir les contrats', description: 'Consulter les contrats' },
      { permission: 'contracts.create' as Permission, label: 'Créer des contrats', description: 'Créer de nouveaux contrats' },
      { permission: 'contracts.update' as Permission, label: 'Modifier les contrats', description: 'Mettre à jour les contrats' },
      { permission: 'contracts.close' as Permission, label: 'Clôturer les contrats', description: 'Marquer les contrats comme terminés' },
      { permission: 'contracts.delete' as Permission, label: 'Supprimer des contrats', description: 'Supprimer des contrats' },
    ]
  },
  {
    title: "Assistance",
    permissions: [
      { permission: 'assistance.view' as Permission, label: 'Voir les dossiers', description: 'Consulter les dossiers d\'assistance' },
      { permission: 'assistance.create' as Permission, label: 'Créer des dossiers', description: 'Créer de nouveaux dossiers' },
      { permission: 'assistance.update' as Permission, label: 'Modifier les dossiers', description: 'Mettre à jour les dossiers' },
      { permission: 'assistance.delete' as Permission, label: 'Supprimer des dossiers', description: 'Supprimer des dossiers' },
    ]
  },
  {
    title: "Sinistres",
    permissions: [
      { permission: 'sinistres.view' as Permission, label: 'Voir les sinistres', description: 'Consulter les sinistres' },
      { permission: 'sinistres.create' as Permission, label: 'Créer des sinistres', description: 'Déclarer de nouveaux sinistres' },
      { permission: 'sinistres.update' as Permission, label: 'Modifier les sinistres', description: 'Mettre à jour les sinistres' },
      { permission: 'sinistres.delete' as Permission, label: 'Supprimer des sinistres', description: 'Supprimer des sinistres' },
    ]
  },
  {
    title: "Infractions",
    permissions: [
      { permission: 'infractions.view' as Permission, label: 'Voir les infractions', description: 'Consulter les infractions' },
      { permission: 'infractions.create' as Permission, label: 'Créer des infractions', description: 'Enregistrer de nouvelles infractions' },
      { permission: 'infractions.mark_transmitted' as Permission, label: 'Marquer comme transmis', description: 'Marquer les infractions comme transmises' },
      { permission: 'infractions.update' as Permission, label: 'Modifier les infractions', description: 'Mettre à jour les infractions' },
      { permission: 'infractions.delete' as Permission, label: 'Supprimer des infractions', description: 'Supprimer des infractions' },
    ]
  },
  {
    title: "Dépenses",
    permissions: [
      { permission: 'expenses.view' as Permission, label: 'Voir les dépenses', description: 'Consulter les dépenses' },
      { permission: 'expenses.create' as Permission, label: 'Créer des dépenses', description: 'Enregistrer de nouvelles dépenses' },
      { permission: 'expenses.update' as Permission, label: 'Modifier les dépenses', description: 'Mettre à jour les dépenses' },
      { permission: 'expenses.delete' as Permission, label: 'Supprimer des dépenses', description: 'Supprimer des dépenses' },
    ]
  },
  {
    title: "Paramètres",
    permissions: [
      { permission: 'settings.view' as Permission, label: 'Voir les paramètres', description: 'Accès aux paramètres' },
      { permission: 'settings.update' as Permission, label: 'Modifier les paramètres', description: 'Modifier les paramètres système' },
    ]
  },
  {
    title: "Utilisateurs",
    permissions: [
      { permission: 'users.view' as Permission, label: 'Voir les utilisateurs', description: 'Consulter la liste des utilisateurs' },
      { permission: 'users.manage' as Permission, label: 'Gérer les utilisateurs', description: 'Créer, modifier et supprimer des utilisateurs' },
    ]
  },
];

export function PermissionsManager() {
  const { toast } = useToast();
  const [permissions, setPermissions] = useState<PermissionConfig[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPermissions();
  }, []);

  const loadPermissions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('role_permissions')
        .select('*')
        .eq('role', 'agent')
        .order('permission');

      if (error) throw error;

      const allPermissions: PermissionConfig[] = [];
      permissionGroups.forEach(group => {
        group.permissions.forEach(p => {
          const dbPerm = data?.find(d => d.permission === p.permission);
          allPermissions.push({
            permission: p.permission,
            enabled: dbPerm?.enabled ?? false,
            label: p.label,
            description: p.description,
          });
        });
      });

      setPermissions(allPermissions);
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

  const togglePermission = async (permission: Permission, enabled: boolean) => {
    try {
      const { error } = await supabase
        .from('role_permissions')
        .upsert({
          role: 'agent',
          permission,
          enabled,
        }, {
          onConflict: 'role,permission'
        });

      if (error) throw error;

      setPermissions(prev =>
        prev.map(p =>
          p.permission === permission ? { ...p, enabled } : p
        )
      );

      toast({
        title: "Permission mise à jour",
        description: `La permission "${permission}" a été ${enabled ? 'activée' : 'désactivée'}.`,
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {permissionGroups.map((group) => (
        <Card key={group.title}>
          <CardHeader>
            <CardTitle className="text-lg">{group.title}</CardTitle>
            <CardDescription>
              Gérez les permissions pour les agents commerciaux
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {group.permissions.map((p) => {
              const perm = permissions.find(pm => pm.permission === p.permission);
              if (!perm) return null;

              return (
                <div key={p.permission} className="flex items-center justify-between space-x-4 border-b pb-4 last:border-0 last:pb-0">
                  <div className="flex-1">
                    <Label htmlFor={p.permission} className="cursor-pointer">
                      {p.label}
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {p.description}
                    </p>
                  </div>
                  <Switch
                    id={p.permission}
                    checked={perm.enabled}
                    onCheckedChange={(checked) => togglePermission(p.permission, checked)}
                  />
                </div>
              );
            })}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
