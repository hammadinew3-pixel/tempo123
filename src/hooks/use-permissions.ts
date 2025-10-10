import { useEffect, useState } from 'react';
import { useUserRole, UserRole } from './use-user-role';
import { supabase } from '@/integrations/supabase/client';

export type Permission =
  | 'dashboard.view'
  | 'vehicles.view'
  | 'vehicles.update_km'
  | 'vehicles.update_status'
  | 'vehicles.create'
  | 'vehicles.delete'
  | 'clients.view'
  | 'clients.create'
  | 'clients.update'
  | 'clients.delete'
  | 'contracts.view'
  | 'contracts.create'
  | 'contracts.update'
  | 'contracts.close'
  | 'contracts.delete'
  | 'assistance.view'
  | 'assistance.create'
  | 'assistance.update'
  | 'assistance.delete'
  | 'sinistres.view'
  | 'sinistres.create'
  | 'sinistres.update'
  | 'sinistres.delete'
  | 'infractions.view'
  | 'infractions.create'
  | 'infractions.mark_transmitted'
  | 'infractions.update'
  | 'infractions.delete'
  | 'expenses.view'
  | 'expenses.create'
  | 'expenses.update'
  | 'expenses.delete'
  | 'settings.view'
  | 'settings.update'
  | 'users.view'
  | 'users.manage';

// Default permissions for admin (full access)
const adminPermissions: Permission[] = [
  'dashboard.view',
  'vehicles.view',
  'vehicles.update_km',
  'vehicles.update_status',
  'vehicles.create',
  'vehicles.delete',
  'clients.view',
  'clients.create',
  'clients.update',
  'clients.delete',
  'contracts.view',
  'contracts.create',
  'contracts.update',
  'contracts.close',
  'contracts.delete',
  'assistance.view',
  'assistance.create',
  'assistance.update',
  'assistance.delete',
  'sinistres.view',
  'sinistres.create',
  'sinistres.update',
  'sinistres.delete',
  'infractions.view',
  'infractions.create',
  'infractions.mark_transmitted',
  'infractions.update',
  'infractions.delete',
  'expenses.view',
  'expenses.create',
  'expenses.update',
  'expenses.delete',
  'settings.view',
  'settings.update',
  'users.view',
  'users.manage',
];

// Default permissions for comptable
const comptablePermissions: Permission[] = [
  'dashboard.view',
  'vehicles.view',
  'clients.view',
  'contracts.view',
  'assistance.view',
  'sinistres.view',
  'infractions.view',
  'expenses.view',
  'expenses.create',
  'expenses.update',
  'expenses.delete',
];

export function usePermissions() {
  const { role, isAdmin, isAgent, loading: roleLoading } = useUserRole();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPermissions() {
      if (!role) {
        setPermissions([]);
        setLoading(false);
        return;
      }

      // Admins always have full permissions
      if (role === 'admin') {
        setPermissions(adminPermissions);
        setLoading(false);
        return;
      }

      // Comptables have fixed permissions
      if (role === 'comptable') {
        setPermissions(comptablePermissions);
        setLoading(false);
        return;
      }

      // For agents, load from database
      try {
        const { data, error } = await supabase
          .from('role_permissions')
          .select('permission, enabled')
          .eq('role', role)
          .eq('enabled', true);

        if (error) throw error;

        const loadedPermissions = data?.map(p => p.permission as Permission) || [];
        setPermissions(loadedPermissions);
      } catch (error) {
        console.error('Error loading permissions:', error);
        setPermissions([]);
      } finally {
        setLoading(false);
      }
    }

    loadPermissions();
  }, [role]);

  const hasPermission = (permission: Permission): boolean => {
    if (!role) return false;
    return permissions.includes(permission);
  };

  const hasAnyPermission = (permissions: Permission[]): boolean => {
    return permissions.some(permission => hasPermission(permission));
  };

  const hasAllPermissions = (permissions: Permission[]): boolean => {
    return permissions.every(permission => hasPermission(permission));
  };

  const canView = (module: string): boolean => {
    return hasPermission(`${module}.view` as Permission);
  };

  const canCreate = (module: string): boolean => {
    return hasPermission(`${module}.create` as Permission);
  };

  const canUpdate = (module: string): boolean => {
    return hasPermission(`${module}.update` as Permission);
  };

  const canDelete = (module: string): boolean => {
    return hasPermission(`${module}.delete` as Permission);
  };

  return {
    role,
    isAdmin,
    isAgent,
    loading,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canView,
    canCreate,
    canUpdate,
    canDelete,
  };
}
