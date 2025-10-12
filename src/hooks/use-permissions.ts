import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole, UserRole } from './use-user-role';

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

interface DBPermission {
  id: string;
  role: string;
  module: string;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
}

export function usePermissions() {
  const { role, isAdmin, isAgent, loading: roleLoading } = useUserRole();
  const [permissions, setPermissions] = useState<DBPermission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (role) {
      loadPermissions();
    } else {
      setLoading(false);
    }
  }, [role]);

  const loadPermissions = async () => {
    try {
      // @ts-ignore - permissions table exists in DB but not in generated types
      const table: any = supabase.from('permissions');
      const { data, error } = await table
        .select('*')
        .eq('role', role);

      if (error) throw error;
      setPermissions((data as unknown as DBPermission[]) || []);
    } catch (error) {
      console.error('Error loading permissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const hasPermission = (permission: Permission): boolean => {
    if (!role) return false;
    
    // Parse permission string (e.g., "clients.view" -> module: "clients", action: "view")
    const [module, action] = permission.split('.');
    
    // Find the permission for this module
    const perm = permissions.find(p => p.module === module);
    
    if (!perm) return false;

    // Map action to database field
    switch (action) {
      case 'view':
        return perm.can_view;
      case 'create':
        return perm.can_create;
      case 'update':
      case 'update_km':
      case 'update_status':
      case 'close':
      case 'mark_transmitted':
        return perm.can_edit;
      case 'delete':
      case 'manage':
        return perm.can_delete;
      default:
        return false;
    }
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
