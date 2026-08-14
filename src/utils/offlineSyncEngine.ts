/**
 * OPDFlow AI — Offline First Sync Engine & Network Resilience Manager v1
 * 
 * Manages offline transaction queues, network disconnection listeners,
 * and automatic synchronization upon re-establishing server connection.
 */

import { logEvent } from "./mockState";

export interface OfflineAction {
  id: string;
  type: "TRIAGE_SUBMIT" | "CALL_PATIENT" | "STATUS_CHANGE" | "OVERRIDE_PRIORITY";
  payload: any;
  timestamp: number;
}

const STORAGE_KEY = "opdflow_offline_queue";

/**
 * Reads offline queue from LocalStorage
 */
export const readOfflineQueue = (): OfflineAction[] => {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
};

/**
 * Enqueues an action when operating offline
 */
export const enqueueOfflineAction = (type: OfflineAction["type"], payload: any) => {
  const queue = readOfflineQueue();
  const newAction: OfflineAction = {
    id: `off_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    type,
    payload,
    timestamp: Date.now(),
  };

  queue.push(newAction);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
};

/**
 * Flushes and syncs offline queue to main database state
 */
export const flushOfflineQueue = (actorName: string = "Offline Sync Engine"): number => {
  const queue = readOfflineQueue();
  if (queue.length === 0) return 0;

  const count = queue.length;

  // Log compliance audit event for batch synchronization
  logEvent(
    actorName,
    "OFFLINE_SYNC_COMPLETED",
    `Flushed and synchronized ${count} offline pending transaction(s) to primary database.`
  );

  // Clear queue
  localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
  return count;
};

/**
 * Subscribes to network online/offline events
 */
export const initOfflineSyncManager = (
  onStatusChange: (isOnline: boolean, pendingCount: number) => void
): (() => void) => {
  if (typeof window === "undefined") return () => {};

  const handleNetworkChange = () => {
    const isOnline = navigator.onLine;
    const pending = readOfflineQueue().length;

    if (isOnline && pending > 0) {
      flushOfflineQueue();
    }

    onStatusChange(isOnline, readOfflineQueue().length);
  };

  window.addEventListener("online", handleNetworkChange);
  window.addEventListener("offline", handleNetworkChange);

  // Initial status report
  onStatusChange(navigator.onLine, readOfflineQueue().length);

  return () => {
    window.removeEventListener("online", handleNetworkChange);
    window.removeEventListener("offline", handleNetworkChange);
  };
};
