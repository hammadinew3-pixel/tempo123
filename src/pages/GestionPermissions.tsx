import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/use-user-role";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Shield, Loader2, Check, X } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Permission {
  id: string;
  role: 'admin' | 'agent' | 'comptable';
  module: string;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
}

const MODULES = [
  { key: 'dashboard', label: 'Tableau de bord' },
  { key: 'vehicles', label: 'Véhicules' },
  { key: 'clients', label: 'Clients' },
  { key: 'contracts', label: 'Contrats' },
  { key: 'assistance', label: 'Assistance' },
  { key: 'sinistres', label: 'Sinistres' },
  { key: 'infractions', label: 'Infractions' },
  { key: 'expenses', label: 'Dépenses' },
  { key: 'settings', label: 'Paramètres' },
  { key: 'users', label: 'Utilisateurs' },
];

const ROLES = [
  { key: 'admin' as const, label: 'Administrateur', color: 'bg-green-500' },
  { key: 'agent' as const, label: 'Agent commercial', color: 'bg-blue-500' },
  { key: 'comptable' as const, label: 'Comptable', color: 'bg-purple-500' },
];

export default function GestionPermissions() {
  const { isAdmin, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<'admin' | 'agent' | 'comptable'>('agent');

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
      loadPermissions();
    }
  }, [isAdmin]);

  const loadPermissions = async () => {
    try {
      setLoading(true);
      // @ts-ignore - permissions table exists in DB but not in generated types
      const table: any = supabase.from('permissions');
      const { data, error } = await table
        .select('*')
        .order('role')
        .order('module');

      if (error) throw error;
      setPermissions((data as unknown as Permission[]) || []);
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

  const updatePermission = async (
    role: 'admin' | 'agent' | 'comptable',
    module: string,
    action: 'can_view' | 'can_create' | 'can_edit' | 'can_delete',
    value: boolean
  ) => {
    try {
      // Find existing permission
      const existing = permissions.find(p => p.role === role && p.module === module);

      if (existing) {
        // Update existing permission
        // @ts-ignore - permissions table exists in DB but not in generated types
        const updateTable: any = supabase.from('permissions');
        const { error } = await updateTable
          .update({ [action]: value })
          .eq('id', existing.id);

        if (error) throw error;

        // Update local state
        setPermissions(prev =>
          prev.map(p =>
            p.id === existing.id ? { ...p, [action]: value } : p
          )
        );
      } else {
        // Create new permission
        const newPermission = {
          role,
          module,
          can_view: action === 'can_view' ? value : false,
          can_create: action === 'can_create' ? value : false,
          can_edit: action === 'can_edit' ? value : false,
          can_delete: action === 'can_delete' ? value : false,
        };

        // @ts-ignore - permissions table exists in DB but not in generated types
        const insertTable: any = supabase.from('permissions');
        const { data, error } = await insertTable
          .insert(newPermission)
          .select()
          .single();

        if (error) throw error;

        // Update local state
        if (data) {
          setPermissions(prev => [...prev, data as unknown as Permission]);
        }
      }

      toast({
        title: "Permission mise à jour",
        description: "Les permissions ont été sauvegardées avec succès.",
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getPermission = (role: 'admin' | 'agent' | 'comptable', module: string) => {
    return permissions.find(p => p.role === role && p.module === module) || {
      can_view: false,
      can_create: false,
      can_edit: false,
      can_delete: false,
    };
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
          <Shield className="w-8 h-8" />
          Gestion des Permissions
        </h1>
        <p className="text-muted-foreground mt-1">
          Gérez les droits d'accès par rôle et par module
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configuration des permissions</CardTitle>
          <CardDescription>
            Activez ou désactivez les permissions pour chaque rôle. Les modifications sont sauvegardées automatiquement.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedRole} onValueChange={(v) => setSelectedRole(v as any)}>
            <TabsList className="grid w-full grid-cols-3">
              {ROLES.map(role => (
                <TabsTrigger key={role.key} value={role.key}>
                  <Badge className={`${role.color} mr-2`}>
                    {role.key === 'admin' && <Shield className="w-3 h-3" />}
                  </Badge>
                  {role.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {ROLES.map(role => (
              <TabsContent key={role.key} value={role.key} className="mt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px]">Module</TableHead>
                      <TableHead className="text-center">Lecture</TableHead>
                      <TableHead className="text-center">Création</TableHead>
                      <TableHead className="text-center">Modification</TableHead>
                      <TableHead className="text-center">Suppression</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {MODULES.map(module => {
                      const perm = getPermission(role.key, module.key);
                      return (
                        <TableRow key={module.key}>
                          <TableCell className="font-medium">{module.label}</TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center">
                              <Switch
                                checked={perm.can_view}
                                onCheckedChange={(checked) =>
                                  updatePermission(role.key, module.key, 'can_view', checked)
                                }
                              />
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center">
                              <Switch
                                checked={perm.can_create}
                                onCheckedChange={(checked) =>
                                  updatePermission(role.key, module.key, 'can_create', checked)
                                }
                              />
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center">
                              <Switch
                                checked={perm.can_edit}
                                onCheckedChange={(checked) =>
                                  updatePermission(role.key, module.key, 'can_edit', checked)
                                }
                              />
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center">
                              <Switch
                                checked={perm.can_delete}
                                onCheckedChange={(checked) =>
                                  updatePermission(role.key, module.key, 'can_delete', checked)
                                }
                              />
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
