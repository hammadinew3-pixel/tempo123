import { useState, useEffect } from 'react';
import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface OfflineOperation {
  id?: number;
  table: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  data: any;
  timestamp: number;
}

interface OfflineDB extends DBSchema {
  operations: {
    key: number;
    value: OfflineOperation;
    indexes: { 'by-timestamp': number };
  };
}

export const useOfflineSync = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingOperations, setPendingOperations] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [db, setDb] = useState<IDBPDatabase<OfflineDB> | null>(null);

  useEffect(() => {
    const initDB = async () => {
      const database = await openDB<OfflineDB>('offline-sync', 1, {
        upgrade(db) {
          const store = db.createObjectStore('operations', {
            keyPath: 'id',
            autoIncrement: true,
          });
          store.createIndex('by-timestamp', 'timestamp');
        },
      });
      setDb(database);
      
      // Count pending operations
      const count = await database.count('operations');
      setPendingOperations(count);
    };

    initDB();
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Connexion rétablie');
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.warning('Mode hors ligne activé');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const addOfflineOperation = async (
    table: string,
    operation: 'INSERT' | 'UPDATE' | 'DELETE',
    data: any
  ) => {
    if (!db) return;

    await db.add('operations', {
      table,
      operation,
      data,
      timestamp: Date.now(),
    });

    const count = await db.count('operations');
    setPendingOperations(count);
  };

  const syncOperations = async () => {
    if (!db || isSyncing) return;

    setIsSyncing(true);
    const operations = await db.getAll('operations');
    
    let successCount = 0;
    let failCount = 0;

    for (const op of operations) {
      try {
        switch (op.operation) {
          case 'INSERT':
            await (supabase as any).from(op.table).insert(op.data);
            break;
          case 'UPDATE':
            await (supabase as any).from(op.table).update(op.data).eq('id', op.data.id);
            break;
          case 'DELETE':
            await (supabase as any).from(op.table).delete().eq('id', op.data.id);
            break;
        }
        
        // Remove successful operation from queue
        if (op.id) {
          await db.delete('operations', op.id);
        }
        successCount++;
      } catch (error) {
        console.error('Sync error:', error);
        failCount++;
      }
    }

    const count = await db.count('operations');
    setPendingOperations(count);
    setIsSyncing(false);

    if (successCount > 0) {
      toast.success(`${successCount} opération(s) synchronisée(s)`);
    }
    if (failCount > 0) {
      toast.error(`${failCount} opération(s) échouée(s)`);
    }
  };

  return {
    isOnline,
    pendingOperations,
    isSyncing,
    addOfflineOperation,
    syncOperations,
  };
};
