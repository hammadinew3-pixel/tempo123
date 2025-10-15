export interface AuditLog {
  id: string;
  table_name: string;
  record_id: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  old_data: any;
  new_data: any;
  changed_fields: string[] | null;
  user_id: string | null;
  user_email: string | null;
  created_at: string;
}

export interface AuditFilter {
  tableName?: string;
  recordId?: string;
  userId?: string;
  action?: 'INSERT' | 'UPDATE' | 'DELETE';
  startDate?: string;
  endDate?: string;
}

export const TABLE_LABELS: Record<string, string> = {
  vehicles: 'Véhicules',
  clients: 'Clients',
  contracts: 'Contrats',
  assistance: 'Assistances',
  expenses: 'Charges',
  invoices: 'Factures',
};

export const ACTION_LABELS: Record<string, string> = {
  INSERT: 'Création',
  UPDATE: 'Modification',
  DELETE: 'Suppression',
};

export const ACTION_COLORS: Record<string, string> = {
  INSERT: 'text-green-600 dark:text-green-400',
  UPDATE: 'text-blue-600 dark:text-blue-400',
  DELETE: 'text-red-600 dark:text-red-400',
};
