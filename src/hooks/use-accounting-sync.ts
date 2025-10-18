import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useAccountingSync() {
  const [isSyncing, setIsSyncing] = useState(false);

  const syncExistingData = async () => {
    setIsSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('sync-existing-data', {
        body: {},
      });

      if (error) throw error;

      toast.success('Synchronisation terminée', {
        description: `${data.results.contracts} contrats, ${data.results.revenus} revenus, ${data.results.expenses} dépenses synchronisés`,
      });

      return data;
    } catch (error: any) {
      console.error('Erreur synchronisation:', error);
      toast.error('Erreur lors de la synchronisation', {
        description: error.message,
      });
      throw error;
    } finally {
      setIsSyncing(false);
    }
  };

  const generateEntry = async (docType: string, docId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('generate-accounting-entry', {
        body: { doc_type: docType, doc_id: docId },
      });

      if (error) throw error;

      return data;
    } catch (error: any) {
      console.error('Erreur génération écriture:', error);
      throw error;
    }
  };

  return {
    isSyncing,
    syncExistingData,
    generateEntry,
  };
}
