'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { QuizState } from '@/lib/types';
import { INITIAL_QUIZ_STATE } from '@/lib/defaultData';
import { startClockSync } from '@/lib/clockSync';

export function useQuizSync() {
  const [state, setState] = useState<QuizState>(INITIAL_QUIZ_STATE);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);

  // Apply state update only when something actually changed — returning the
  // same `prev` reference lets React skip re-rendering entirely, so background
  // polls/SSE stay invisible to the user instead of flickering the UI.
  const updateStateIfNewer = useCallback((newState: QuizState) => {
    setState((prev) => {
      if (newState.version > prev.version || newState.updatedAt > prev.updatedAt) {
        return newState;
      }
      return prev;
    });
  }, []);

  const failCountRef = useRef(0);

  // Fetch state manually
  const fetchState = useCallback(async () => {
    try {
      // 3.5s timeout: on a half-dead WiFi link a fetch can hang for the OS TCP
      // timeout (tens of seconds) and stall all updates. Fail fast, let the
      // next poll/SSE reconnect recover.
      const res = await fetch('/api/quiz', {
        cache: 'no-store',
        signal: AbortSignal.timeout(3500),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.state) {
          updateStateIfNewer(json.state);
          failCountRef.current = 0;
          setIsConnected(true);
        }
      }
    } catch (e) {
      console.warn('Fetch quiz state failed:', e);
      // Tolerate a transient failure — only show "Connecting..." after 2+
      // consecutive misses so one hiccup doesn't flash the badge/UI.
      if (++failCountRef.current >= 2) setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  }, [updateStateIfNewer]);

  // Execute action on server
  const executeAction = useCallback(
    async (action: string, payload: Record<string, unknown> = {}) => {
      try {
        const res = await fetch('/api/quiz', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action, payload }),
        });
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.state) {
            updateStateIfNewer(json.state);
            // Also notify local BroadcastChannel
            if (broadcastChannelRef.current) {
              broadcastChannelRef.current.postMessage({ type: 'STATE_UPDATE', state: json.state });
            }
          }
          return json;
        }
      } catch (err) {
        console.error('Execute action failed:', err);
      }
      return { success: false };
    },
    [updateStateIfNewer]
  );

  useEffect(() => {
    // 0. Sync this device's clock to the server for fair buzzer timing
    startClockSync();

    // 1. Initial fetch asynchronously
    const initialTimer = setTimeout(() => {
      void fetchState();
    }, 0);

    // 2. Setup BroadcastChannel for multi-tab zero-latency sync on same machine
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const bc = new BroadcastChannel('viplava_quiz_sync');
        broadcastChannelRef.current = bc;
        bc.onmessage = (event) => {
          if (event.data?.type === 'STATE_UPDATE' && event.data.state) {
            updateStateIfNewer(event.data.state);
          }
        };
      }
    } catch {
      // BroadcastChannel might fail in private windows
    }

    // 3. Setup Server-Sent Events (SSE)
    let eventSource: EventSource | null = null;
    let fallbackInterval: NodeJS.Timeout | null = null;

    try {
      eventSource = new EventSource('/api/quiz/events');

      eventSource.onopen = () => {
        setIsConnected(true);
        // Re-sync the clock on every (re)connect — after a WiFi drop the
        // offset estimate may be stale and buzzer fairness depends on it.
        startClockSync();
      };

      eventSource.onmessage = (e) => {
        try {
          const parsed = JSON.parse(e.data);
          updateStateIfNewer(parsed);
          setIsConnected(true);
        } catch (err) {
          console.error('Error parsing SSE data', err);
        }
      };

      eventSource.onerror = () => {
        setIsConnected(false);
        // Will auto-retry
      };
    } catch (e) {
      console.warn('SSE not supported or failed to init', e);
    }

    // 4. Polling backstop every 1200ms — only fires when SSE isn't live,
    //    otherwise it doubles traffic for zero benefit on a fragile link.
    fallbackInterval = setInterval(() => {
      if (eventSource && eventSource.readyState === EventSource.OPEN) return;
      fetchState();
    }, 1200);

    return () => {
      clearTimeout(initialTimer);
      if (eventSource) {
        eventSource.close();
      }
      if (fallbackInterval) {
        clearInterval(fallbackInterval);
      }
      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.close();
      }
    };
  }, [fetchState, updateStateIfNewer]);

  return {
    state,
    isConnected,
    isLoading,
    executeAction,
    refresh: fetchState,
  };
}
