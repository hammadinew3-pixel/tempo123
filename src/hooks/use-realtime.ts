import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

type RealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE' | '*';

interface UseRealtimeOptions<T> {
  table: string;
  event?: RealtimeEvent;
  onInsert?: (payload: T) => void;
  onUpdate?: (payload: T) => void;
  onDelete?: (payload: { old: T }) => void;
  filter?: string;
}

export function useRealtime<T>({
  table,
  event = '*',
  onInsert,
  onUpdate,
  onDelete,
  filter,
}: UseRealtimeOptions<T>) {
  useEffect(() => {
    let channel: RealtimeChannel;

    const setupChannel = () => {
      channel = supabase.channel(`${table}-changes`);

      // Subscribe to all events or specific event
      if (event === '*' || event === 'INSERT') {
        channel = channel.on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table,
            filter,
          },
          (payload) => {
            console.log(`[Realtime] INSERT on ${table}:`, payload);
            if (onInsert) onInsert(payload.new as T);
          }
        );
      }

      if (event === '*' || event === 'UPDATE') {
        channel = channel.on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table,
            filter,
          },
          (payload) => {
            console.log(`[Realtime] UPDATE on ${table}:`, payload);
            if (onUpdate) onUpdate(payload.new as T);
          }
        );
      }

      if (event === '*' || event === 'DELETE') {
        channel = channel.on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table,
            filter,
          },
          (payload) => {
            console.log(`[Realtime] DELETE on ${table}:`, payload);
            if (onDelete) onDelete({ old: payload.old as T });
          }
        );
      }

      channel.subscribe((status) => {
        console.log(`[Realtime] Subscription status for ${table}:`, status);
      });
    };

    setupChannel();

    return () => {
      console.log(`[Realtime] Cleaning up channel for ${table}`);
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [table, event, filter, onInsert, onUpdate, onDelete]);
}
