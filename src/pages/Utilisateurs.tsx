import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/use-user-role";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Shield, Users, Loader2, Plus, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useTenantInsert } from '@/hooks/use-tenant-insert';
import { useTenant } from '@/contexts/TenantContext';
import { z } from 'zod';

interface UserWithRole {
  id: string;
  email: string;
  nom: string;
  role: 'admin' | 'agent' | null;
  actif: boolean;
}

export default function Utilisateurs() {
  const { withTenantId } = useTenantInsert();
  const { currentTenant } = useTenant();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [newUser, setNewUser] = useState({
    email: "",
    password: "",
    nom: "",
    role: "agent" as 'admin' | 'agent'
  });

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
      loadUsers();
    }
  }, [isAdmin]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      
      // Fetch all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('nom');

      if (profilesError) throw profilesError;

      // Fetch all user roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');

      if (rolesError) throw rolesError;

      // Combine data - include both admins and agents
      const usersWithRoles: UserWithRole[] = profiles?.map(profile => {
        const userRole = roles?.find(r => r.user_id === profile.id);
        const roleValue = (userRole?.role as any) === 'admin' ? ('admin' as const) : 
                         (userRole?.role as any) === 'agent' ? ('agent' as const) : null;
        return {
          id: profile.id,
          email: profile.email,
          nom: profile.nom,
          role: roleValue,
          actif: profile.actif,
        };
      }).filter(u => u.role === 'admin' || u.role === 'agent') || [];

      setUsers(usersWithRoles);
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

  const updateUserRole = async (userId: string, newRole: 'admin' | 'agent') => {
    try {
      // Check if user already has a role
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (existingRole) {
        // Update existing role
        const { error } = await supabase
          .from('user_roles')
          .update({ role: newRole as any })
          .eq('user_id', userId);

        if (error) throw error;
      } else {
        // Insert new role
        const { error } = await supabase
          .from('user_roles')
          .insert(withTenantId({ user_id: userId, role: newRole as any }));

        if (error) throw error;
      }

      toast({
        title: "Rôle mis à jour",
        description: "Le rôle de l'utilisateur a été modifié avec succès.",
      });

      loadUsers();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ actif: !currentStatus })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "Statut mis à jour",
        description: `L'utilisateur a été ${!currentStatus ? 'activé' : 'désactivé'}.`,
      });

      loadUsers();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const createUser = async () => {
    if (!currentTenant?.id) {
      toast({
        title: "Erreur",
        description: "Aucune agence active",
        variant: "destructive",
      });
      return;
    }

    try {
      const userSchema = z.object({
        email: z.string().trim().email({ message: 'Email invalide' }),
        password: z.string().min(6, { message: 'Mot de passe de 6 caractères minimum' }),
        nom: z.string().trim().min(1, { message: 'Le nom est requis' }),
        role: z.enum(['admin','agent'])
      });

      const parsed = userSchema.safeParse(newUser);
      if (!parsed.success) {
        const first = parsed.error.errors[0];
        toast({ title: 'Validation', description: first.message, variant: 'destructive' });
        return;
      }

      const { data, error } = await supabase.functions.invoke('create-user', {
        body: {
          email: newUser.email,
          password: newUser.password,
          nom: newUser.nom,
          role: newUser.role,
          tenant_id: currentTenant.id
        }
      });

      if (error) {
        let serverMessage = (data as any)?.error as string | undefined;
        let errorCode = (data as any)?.code as string | undefined;
        
        // Try to extract detailed error from Supabase Functions error context
        const anyErr: any = error as any;
        if (!serverMessage && anyErr?.context?.response) {
          try {
            const json = await anyErr.context.response.clone().json();
            serverMessage = json?.error || json?.message || json?.details;
            errorCode = json?.code;
          } catch {
            try {
              const text = await anyErr.context.response.text();
              serverMessage = text;
            } catch {}
          }
        }
        
        // Map specific error codes/messages to user-friendly text
        if (errorCode === 'QUOTA_EXCEEDED') {
          serverMessage = serverMessage || 'Quota utilisateurs atteint';
        } else if (serverMessage?.includes('already registered') || serverMessage?.includes('User already registered')) {
          serverMessage = 'Cet email est déjà utilisé';
        } else if (serverMessage?.includes('Unauthorized') || error.message?.includes('401')) {
          serverMessage = 'Non autorisé. Veuillez vous reconnecter.';
        }
        
        throw new Error(serverMessage || error.message || 'Erreur inconnue');
      }
      if ((data as any)?.error) throw new Error((data as any).error);

      toast({
        title: "Utilisateur créé",
        description: "Le nouvel utilisateur a été créé avec succès.",
      });

      setCreateDialogOpen(false);
      setNewUser({ email: "", password: "", nom: "", role: "agent" });
      loadUsers();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const deleteUser = async () => {
    if (!userToDelete) return;

    try {
      const { data, error } = await supabase.functions.invoke('delete-user', {
        body: { userId: userToDelete }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({
        title: "Utilisateur supprimé",
        description: "L'utilisateur a été supprimé avec succès.",
      });

      setDeleteDialogOpen(false);
      setUserToDelete(null);
      loadUsers();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (roleLoading || !isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="w-8 h-8" />
            Gestion des utilisateurs
          </h1>
          <p className="text-muted-foreground mt-1">
            Gérez les utilisateurs du système (Administrateurs et Agents)
          </p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nouvel utilisateur
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Créer un nouvel utilisateur</DialogTitle>
              <DialogDescription>
                Entrez les informations du nouvel utilisateur
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="nom">Nom</Label>
                <Input
                  id="nom"
                  value={newUser.nom}
                  onChange={(e) => setNewUser({ ...newUser, nom: e.target.value })}
                  placeholder="Nom complet"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="email@exemple.com"
                />
              </div>
              <div>
                <Label htmlFor="password">Mot de passe</Label>
                <Input
                  id="password"
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  placeholder="Mot de passe"
                />
              </div>
              <div>
                <Label htmlFor="role">Rôle</Label>
                <Select value={newUser.role} onValueChange={(value: 'admin' | 'agent') => setNewUser({ ...newUser, role: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un rôle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrateur</SelectItem>
                    <SelectItem value="agent">Agent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Annuler
              </Button>
              <Button onClick={createUser}>
                Créer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. L'utilisateur sera définitivement supprimé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setUserToDelete(null)}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction onClick={deleteUser} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Card>
        <CardHeader>
          <CardTitle>Utilisateurs</CardTitle>
          <CardDescription>
            Liste des utilisateurs du système (Administrateurs et Agents)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : (
            <div className="space-y-4">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="font-medium">{user.nom}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                      {user.role === 'admin' && (
                        <Badge variant="default" className="bg-green-500">
                          <Shield className="w-3 h-3 mr-1" /> Administrateur
                        </Badge>
                      )}
                      {user.role === 'agent' && (
                        <Badge variant="default" className="bg-blue-500">
                          <Shield className="w-3 h-3 mr-1" /> Agent
                        </Badge>
                      )}
                      {!user.actif && (
                        <Badge variant="outline" className="text-destructive">
                          Désactivé
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Select 
                      value={user.role || 'agent'} 
                      onValueChange={(value: 'admin' | 'agent') => updateUserRole(user.id, value)}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Administrateur</SelectItem>
                        <SelectItem value="agent">Agent</SelectItem>
                      </SelectContent>
                    </Select>

                    <Button
                      variant={user.actif ? "outline" : "default"}
                      size="sm"
                      onClick={() => toggleUserStatus(user.id, user.actif)}
                    >
                      {user.actif ? 'Désactiver' : 'Activer'}
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setUserToDelete(user.id);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
