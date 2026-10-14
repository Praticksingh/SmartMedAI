import { useState, useEffect } from "react";
import { readDB, subscribeToDB } from "../utils/mockState";
import { runHybridSyncCycle } from "../services/backendBridge";

/**
 * Custom React hook to query the localStorage mock database state.
 * Triggers re-renders in real-time when the state changes anywhere in the application.
 * Also monitors backend connectivity and flushes pending offline actions.
 */
export const useMockDB = () => {
  const [db, setDb] = useState(readDB());

  useEffect(() => {
    const handleUpdate = () => {
      setDb(readDB());
    };

    // Trigger initial background sync cycle with backend
    runHybridSyncCycle().catch(() => {});

    // Subscribe to state updates (internal custom events + cross-tab storage changes)
    const unsubscribe = subscribeToDB(handleUpdate);

    return () => {
      unsubscribe();
    };
  }, []);

  return db;
};
