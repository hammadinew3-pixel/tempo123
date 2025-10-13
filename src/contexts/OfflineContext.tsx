import React, { createContext, useContext, ReactNode } from 'react';
import { useOfflineSync } from '@/hooks/use-offline-sync';

interface OfflineContextType {
  isOnline: boolean;
  pendingOperations: number;
  isSyncing: boolean;
  addOfflineOperation: (table: string, operation: 'INSERT' | 'UPDATE' | 'DELETE', data: any) => Promise<void>;
  syncOperations: () => Promise<void>;
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined);

export const OfflineProvider = ({ children }: { children: ReactNode }) => {
  const offlineSync = useOfflineSync();

  return (
    <OfflineContext.Provider value={offlineSync}>
      {children}
    </OfflineContext.Provider>
  );
};

export const useOffline = () => {
  const context = useContext(OfflineContext);
  if (context === undefined) {
    throw new Error('useOffline must be used within an OfflineProvider');
  }
  return context;
};
