import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Users as UsersIcon, Building, Shield } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";

interface UserWithTenant {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  actif: boolean;
  tenant_name: string;
  tenant_id: string;
  role: string;
}

export default function AdminUsers() {
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [tenantFilter, setTenantFilter] = useState<string>("all");

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data: profiles } = await supabase
        .from('profiles')
        .select(`
          id,
          email,
          nom,
          prenom,
          actif
        `);

      if (!profiles) return [];

      const usersWithDetails = await Promise.all(
        profiles.map(async (profile) => {
          const { data: userTenant } = await supabase
            .from('user_tenants')
            .select(`
              tenant_id,
              tenants (
                name
              )
            `)
            .eq('user_id', profile.id)
            .eq('is_active', true)
            .single();

          const { data: userRole } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', profile.id)
            .maybeSingle();

          return {
            ...profile,
            tenant_name: userTenant?.tenants?.name || 'N/A',
            tenant_id: userTenant?.tenant_id || '',
            role: userRole?.role || 'agent',
          };
        })
      );

      return usersWithDetails;
    },
  });

  const { data: tenants = [] } = useQuery({
    queryKey: ['tenants-filter'],
    queryFn: async () => {
      const { data } = await supabase
        .from('tenants')
        .select('id, name')
        .order('name');
      return data || [];
    },
  });

  const filteredUsers = users.filter((user) => {
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    const matchesTenant = tenantFilter === "all" || user.tenant_id === tenantFilter;
    return matchesRole && matchesTenant;
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-semibold text-black">Gestion des Utilisateurs</h1>
        <div className="grid grid-cols-1 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 bg-gray-200" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold text-black flex items-center gap-3">
          <UsersIcon className="h-8 w-8 text-[#c01533]" />
          Gestion des Utilisateurs
        </h1>
        <p className="text-gray-500 mt-1">Vue globale de tous les utilisateurs de la plateforme</p>
      </div>

      <div className="flex gap-4">
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[200px] bg-white border-gray-300 text-black">
            <SelectValue placeholder="Filtrer par rôle" />
          </SelectTrigger>
          <SelectContent className="bg-white border-gray-200">
            <SelectItem value="all">Tous les rôles</SelectItem>
            <SelectItem value="admin">Admins</SelectItem>
            <SelectItem value="agent">Agents</SelectItem>
            <SelectItem value="super_admin">Super Admins</SelectItem>
          </SelectContent>
        </Select>

        <Select value={tenantFilter} onValueChange={setTenantFilter}>
          <SelectTrigger className="w-[200px] bg-white border-gray-300 text-black">
            <SelectValue placeholder="Filtrer par agence" />
          </SelectTrigger>
          <SelectContent className="bg-white border-gray-200">
            <SelectItem value="all">Toutes les agences</SelectItem>
            {tenants.map((tenant) => (
              <SelectItem key={tenant.id} value={tenant.id}>
                {tenant.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-gray-200 hover:bg-transparent">
                <TableHead className="text-gray-600 font-semibold">Nom</TableHead>
                <TableHead className="text-gray-600 font-semibold">Email</TableHead>
                <TableHead className="text-gray-600 font-semibold">Agence</TableHead>
                <TableHead className="text-center text-gray-600 font-semibold">Rôle</TableHead>
                <TableHead className="text-center text-gray-600 font-semibold">Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow
                  key={user.id}
                  className="hover:bg-gray-50 border-gray-200"
                >
                  <TableCell className="font-medium text-black">
                    {user.nom || user.prenom ? `${user.nom} ${user.prenom}`.trim() : 'N/A'}
                  </TableCell>
                  <TableCell className="text-gray-700">{user.email}</TableCell>
                  <TableCell className="text-gray-700">
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-[#c01533]" />
                      {user.tenant_name}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      className={
                        user.role === 'admin'
                          ? 'bg-blue-50 text-blue-600 border border-blue-200'
                          : user.role === 'super_admin'
                          ? 'bg-purple-50 text-purple-600 border border-purple-200'
                          : 'bg-gray-100 text-gray-600 border border-gray-200'
                      }
                    >
                      <Shield className="h-3 w-3 mr-1" />
                      {user.role === 'super_admin' ? 'Super Admin' : user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      className={user.actif 
                        ? 'bg-green-50 text-green-600 border border-green-200' 
                        : 'bg-red-50 text-red-600 border border-red-200'
                      }
                    >
                      {user.actif ? 'Actif' : 'Inactif'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            Aucun utilisateur trouvé avec les filtres sélectionnés
          </div>
        )}
      </Card>

      <Card className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <p className="text-gray-600 text-center">
          Total: <span className="text-black font-semibold">{filteredUsers.length}</span> utilisateur(s) 
          {roleFilter !== "all" && ` (${roleFilter})`}
          {tenantFilter !== "all" && ` - ${tenants.find(t => t.id === tenantFilter)?.name}`}
        </p>
      </Card>
    </div>
  );
}
