import { useEffect, useCallback, useRef } from 'react';
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
  debounceMs?: number; // Debounce delay in milliseconds (default: 0 = no debounce)
}

export function useRealtime<T>({
  table,
  event = '*',
  onInsert,
  onUpdate,
  onDelete,
  filter,
  debounceMs = 0,
}: UseRealtimeOptions<T>) {
  const timeoutRef = useRef<NodeJS.Timeout>();

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const debouncedCallback = useCallback((callback: () => void) => {
    if (debounceMs === 0) {
      callback();
      return;
    }
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(callback, debounceMs);
  }, [debounceMs]);

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
            if (onInsert) {
              debouncedCallback(() => onInsert(payload.new as T));
            }
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
            if (onUpdate) {
              debouncedCallback(() => onUpdate(payload.new as T));
            }
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
            if (onDelete) {
              debouncedCallback(() => onDelete({ old: payload.old as T }));
            }
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
  }, [table, event, filter, onInsert, onUpdate, onDelete, debouncedCallback]);
}
