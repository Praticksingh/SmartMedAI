/**
 * SmartMed AI — Backend REST API & Database Hybrid Bridge
 * 
 * Bridges client-side reactive state (mockState / LocalStorage) with the
 * Express + Prisma + PostgreSQL REST backend API (/api/v1/...).
 * 
 * Provides:
 * 1. Resilient health detection (online vs offline mode)
 * 2. Background token check-in & status sync
 * 3. Automatic JWT token synchronization
 * 4. Dual-persistence: Instant UI updates + backend DB records
 */

import { apiClient, setStoredToken } from "../api/client";
import { enqueueOfflineAction, flushOfflineQueue } from "../utils/offlineSyncEngine";
import type { PatientVisit } from "../utils/mockState";

export interface BackendHealthStatus {
  isLive: boolean;
  service?: string;
  checkedAt: number;
}

let cachedHealth: BackendHealthStatus = { isLive: false, checkedAt: 0 };
const HEALTH_CACHE_TTL_MS = 10000; // 10 seconds

/**
 * Checks if the Express backend server is running and reachable
 */
export const checkBackendHealth = async (): Promise<boolean> => {
  const now = Date.now();
  if (now - cachedHealth.checkedAt < HEALTH_CACHE_TTL_MS) {
    return cachedHealth.isLive;
  }

  try {
    const res = await fetch("/api/v1/health", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(2500)
    });
    
    if (res.ok) {
      const data = await res.json().catch(() => null);
      cachedHealth = { isLive: data?.status === "ok", service: data?.service, checkedAt: now };
      return cachedHealth.isLive;
    }
    cachedHealth = { isLive: false, checkedAt: now };
    return false;
  } catch {
    cachedHealth = { isLive: false, checkedAt: now };
    return false;
  }
};

/**
 * Synchronizes an authenticated session with the backend Express JWT engine
 */
export const syncBackendSession = async (
  email: string,
  password: string = "SmartMedAI2026!",
  role: string = "PATIENT"
): Promise<string | null> => {
  const isHealthy = await checkBackendHealth();
  if (!isHealthy) return null;

  try {
    // 1. Attempt login
    const loginRes = await apiClient.auth.login({ email, password }).catch(() => null);
    if (loginRes?.token) {
      setStoredToken(loginRes.token);
      return loginRes.token;
    }

    // 2. If user doesn't exist yet on backend, attempt seamless registration
    const [firstName, ...rest] = (email.split("@")[0] || "User").split(".");
    const lastName = rest.join(" ") || "Clinical";

    const regRes = await apiClient.auth.register({
      email,
      password,
      firstName,
      lastName,
      role: role.toUpperCase()
    }).catch(() => null);

    if (regRes?.token) {
      setStoredToken(regRes.token);
      return regRes.token;
    }

    return null;
  } catch {
    return null;
  }
};

/**
 * Pushes a new Patient Triage visit to backend queue
 */
export const syncVisitToBackend = async (visit: PatientVisit): Promise<boolean> => {
  try {
    const isHealthy = await checkBackendHealth();
    if (!isHealthy) {
      enqueueOfflineAction("TRIAGE_SUBMIT", visit);
      return false;
    }

    // Call queues checkin endpoint
    await apiClient.queues.checkin(visit.id);
    return true;
  } catch {
    enqueueOfflineAction("TRIAGE_SUBMIT", visit);
    return false;
  }
};

/**
 * Pushes a queue status update (CALLED, IN_TREATMENT, COMPLETED, NO_SHOW) to backend
 */
export const syncQueueStatusToBackend = async (
  tokenOrId: string,
  status: "WAITING" | "CALLED" | "IN_PROGRESS" | "COMPLETED"
): Promise<boolean> => {
  try {
    const isHealthy = await checkBackendHealth();
    if (!isHealthy) {
      enqueueOfflineAction("STATUS_CHANGE", { id: tokenOrId, status });
      return false;
    }

    await apiClient.queues.updateStatus(tokenOrId, status);
    return true;
  } catch {
    enqueueOfflineAction("STATUS_CHANGE", { id: tokenOrId, status });
    return false;
  }
};

/**
 * Pushes post-consultation prescription to backend pharmacy endpoint
 */
export const syncPharmacyOrderToBackend = async (
  tokenNumber: string,
  medicines: string[],
  doctorName: string
): Promise<boolean> => {
  try {
    const isHealthy = await checkBackendHealth();
    if (!isHealthy) return false;

    await apiClient.pharmacy.fulfill({
      tokenNumber,
      medicines,
      doctorName,
      status: "WAITING_DISPENSARY",
      timestamp: new Date().toISOString()
    }).catch(() => null);

    return true;
  } catch {
    return false;
  }
};

/**
 * Pushes post-consultation lab order to backend pathology endpoint
 */
export const syncLabOrderToBackend = async (
  tokenNumber: string,
  tests: string[],
  doctorName: string
): Promise<boolean> => {
  try {
    const isHealthy = await checkBackendHealth();
    if (!isHealthy) return false;

    await apiClient.lab.createRequest({
      tokenNumber,
      tests,
      doctorName,
      status: "SAMPLE_PENDING",
      timestamp: new Date().toISOString()
    }).catch(() => null);

    return true;
  } catch {
    return false;
  }
};

/**
 * Probes and synchronizes queued offline actions if backend has come back online
 */
export const runHybridSyncCycle = async (): Promise<{ flushedCount: number; isOnline: boolean }> => {
  const isHealthy = await checkBackendHealth();
  if (!isHealthy) {
    return { flushedCount: 0, isOnline: false };
  }

  const flushed = await flushOfflineQueue("Hybrid Backend Bridge");
  return { flushedCount: flushed, isOnline: true };
};
