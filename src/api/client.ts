/**
 * SmartMed AI — Centralized API Client Layer
 * Enterprise-grade client with JWT injection, automatic token refresh,
 * offline interceptor integration, and full REST endpoint typings.
 */

import { enqueueOfflineAction } from "../utils/offlineSyncEngine";

const API_BASE = "/api/v1";
const TOKEN_KEY = "smartmed_access_token";

export interface ApiError {
  code: string;
  message: string;
  details?: any;
  status: number;
}

export class ApiException extends Error {
  code: string;
  status: number;
  details?: any;

  constructor(error: ApiError) {
    super(error.message);
    this.name = "ApiException";
    this.code = error.code;
    this.status = error.status;
    this.details = error.details;
  }
}

export const getStoredToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
};

export const setStoredToken = (token: string | null) => {
  if (typeof window === "undefined") return;
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
};

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
  offlineFallbackType?: "TRIAGE_SUBMIT" | "CALL_PATIENT" | "STATUS_CHANGE" | "OVERRIDE_PRIORITY"
): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const url = endpoint.startsWith("http") ? endpoint : `${API_BASE}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  try {
    const res = await fetch(url, {
      ...options,
      headers,
      credentials: "include",
    });

    if (res.status === 401 && !endpoint.includes("/auth/")) {
      // Attempt token refresh
      try {
        const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        });
        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          if (refreshData.token) {
            setStoredToken(refreshData.token);
            headers["Authorization"] = `Bearer ${refreshData.token}`;
            // Retry original request
            const retryRes = await fetch(url, { ...options, headers, credentials: "include" });
            if (retryRes.ok) return await retryRes.json();
          }
        }
      } catch {
        // Refresh failed, proceed to handle 401
      }
    }

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const errPayload = data?.error || {
        code: `HTTP_${res.status}`,
        message: data?.message || res.statusText || "Request failed",
      };
      throw new ApiException({
        code: errPayload.code || "REQUEST_FAILED",
        message: errPayload.message || "An unexpected error occurred",
        details: errPayload.details,
        status: res.status,
      });
    }

    return data as T;
  } catch (error: any) {
    if (error instanceof ApiException) {
      throw error;
    }

    // Network disconnection or fetch failure
    if (!navigator.onLine || error.name === "TypeError") {
      if (offlineFallbackType && options.body) {
        try {
          const payload = JSON.parse(options.body as string);
          enqueueOfflineAction(offlineFallbackType, payload);
        } catch {
          // ignore parsing error
        }
      }
    }

    throw new ApiException({
      code: "NETWORK_ERROR",
      message: error.message || "Failed to communicate with server",
      status: 0,
    });
  }
}

export const apiClient = {
  get: <T>(endpoint: string) => request<T>(endpoint, { method: "GET" }),
  post: <T>(endpoint: string, body?: any, offlineAction?: any) =>
    request<T>(endpoint, { method: "POST", body: body ? JSON.stringify(body) : undefined }, offlineAction),
  put: <T>(endpoint: string, body?: any) =>
    request<T>(endpoint, { method: "PUT", body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(endpoint: string, body?: any, offlineAction?: any) =>
    request<T>(endpoint, { method: "PATCH", body: body ? JSON.stringify(body) : undefined }, offlineAction),
  delete: <T>(endpoint: string) => request<T>(endpoint, { method: "DELETE" }),

  // ─── Module Endpoints ─────────────────────────────────────────────────────────

  auth: {
    login: (credentials: { email: string; password: string }) =>
      apiClient.post<{ token: string; user: any }>("/auth/login", credentials),
    register: (payload: any) =>
      apiClient.post<{ token: string; user: any }>("/auth/register", payload),
    me: () => apiClient.get<{ user: any }>("/auth/me"),
    logout: () => apiClient.post<{ message: string }>("/auth/logout"),
  },

  queues: {
    getDashboard: () => apiClient.get<any>("/queues/dashboard"),
    getLive: () => apiClient.get<any>("/queues/live"),
    checkin: (visitId: string) =>
      apiClient.post<any>("/queues/checkin", { visitId }, "TRIAGE_SUBMIT"),
    updateStatus: (queueId: string, status: string) =>
      apiClient.patch<any>(`/queues/${queueId}/status`, { status }, "STATUS_CHANGE"),
  },

  patients: {
    getProfile: () => apiClient.get<any>("/patients/me"),
    updateProfile: (profile: any) => apiClient.put<any>("/patients/profile", profile),
    getDashboard: () => apiClient.get<any>("/patients/dashboard"),
  },

  appointments: {
    book: (payload: any) => apiClient.post<any>("/appointments", payload),
    getMy: () => apiClient.get<any>("/appointments/my"),
    getDoctorList: () => apiClient.get<any>("/appointments/doctor"),
    cancel: (id: string) => apiClient.patch<any>(`/appointments/${id}/cancel`),
  },

  emr: {
    getPatientRecords: (patientId: string) => apiClient.get<any>(`/emr/patient/${patientId}`),
    getVisitRecord: (visitId: string) => apiClient.get<any>(`/emr/visit/${visitId}`),
    createRecord: (record: any) => apiClient.post<any>("/emr/record", record),
    getSummary: (patientId: string) => apiClient.get<any>(`/emr/summary/${patientId}`),
  },

  billing: {
    getInvoices: () => apiClient.get<any>("/billing/invoices"),
    createInvoice: (inv: any) => apiClient.post<any>("/billing/invoices", inv),
    recordPayment: (invoiceId: string, payload: any) =>
      apiClient.patch<any>(`/billing/invoices/${invoiceId}/payment`, payload),
    getPatientInvoices: (patientId: string) => apiClient.get<any>(`/billing/patient/${patientId}`),
  },

  pharmacy: {
    getInventory: () => apiClient.get<any>("/pharmacy/inventory"),
    addMedicine: (medicine: any) => apiClient.post<any>("/pharmacy/inventory", medicine),
    fulfill: (payload: any) => apiClient.post<any>("/pharmacy/fulfill", payload),
    getFulfillments: () => apiClient.get<any>("/pharmacy/fulfillment"),
  },

  lab: {
    getRequests: () => apiClient.get<any>("/lab/requests"),
    createRequest: (req: any) => apiClient.post<any>("/lab/requests", req),
    updateReport: (requestId: string, report: any) =>
      apiClient.patch<any>(`/lab/requests/${requestId}/report`, report),
    getPatientRequests: (patientId: string) => apiClient.get<any>(`/lab/patient/${patientId}`),
  },

  notifications: {
    getMy: () => apiClient.get<any>("/notifications/my"),
    create: (notif: any) => apiClient.post<any>("/notifications", notif),
    markRead: (id: string) => apiClient.patch<any>(`/notifications/${id}/read`),
    getStats: () => apiClient.get<any>("/notifications/stats"),
  },

  admin: {
    getDashboard: () => apiClient.get<any>("/admin/dashboard"),
    getUsers: () => apiClient.get<any>("/admin/users"),
    search: (query: string, scope = "ALL") =>
      apiClient.get<any>(`/admin/search?query=${encodeURIComponent(query)}&scope=${scope}`),
    getAuditLogs: () => apiClient.get<any>("/admin/audit-log"),
  },
};
