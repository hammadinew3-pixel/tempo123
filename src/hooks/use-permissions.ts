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

const rolePermissions: Record<UserRole, Permission[]> = {
  admin: [
    // Full access to everything
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
  ],
  agent: [
    // Tableau de bord - Lecture seule
    'dashboard.view',
    
    // Véhicules - Lecture + mise à jour kilométrage et statut
    'vehicles.view',
    'vehicles.update_km',
    'vehicles.update_status',
    
    // Clients - CRUD complet
    'clients.view',
    'clients.create',
    'clients.update',
    'clients.delete',
    
    // Contrats - CRUD + clôture
    'contracts.view',
    'contracts.create',
    'contracts.update',
    'contracts.close',
    'contracts.delete',
    
    // Assistance - Créer + modifier
    'assistance.view',
    'assistance.create',
    'assistance.update',
    
    // Sinistres - Créer + modifier + consulter
    'sinistres.view',
    'sinistres.create',
    'sinistres.update',
    
    // Infractions - Créer + marquer comme transmis
    'infractions.view',
    'infractions.create',
    'infractions.mark_transmitted',
    
    // Dépenses - Lecture seule
    'expenses.view',
  ],
  comptable: [
    // Comptable has access to financial data
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
  ],
};

export function usePermissions() {
  const { role, isAdmin, isAgent, loading } = useUserRole();

  const hasPermission = (permission: Permission): boolean => {
    if (!role) return false;
    return rolePermissions[role]?.includes(permission) || false;
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
