/**
 * OPDFlow AI — Emergency Protocols & Code Blue Rapid Escalation Engine v1
 * 
 * Provides real-time disaster surge mode toggles, Code Blue rapid triage dispatch,
 * and emergency alert broadcasting across clinical stations and public monitors.
 */

import { logEvent } from "./mockState";
import { broadcastTokenCall } from "./broadcastEngine";

export interface EmergencyAlert {
  id: string;
  type: "CODE_BLUE" | "DISASTER_SURGE";
  departmentCode: string;
  room: string;
  triggeredBy: string;
  timestamp: string;
  status: "ACTIVE" | "RESOLVED";
  notes?: string;
}

export interface EmergencyState {
  isDisasterSurgeActive: boolean;
  surgeReason: string;
  alerts: EmergencyAlert[];
}

const STORAGE_KEY = "opdflow_emergency_state";
const CUSTOM_EVENT = "opdflow_emergency_update";

const DEFAULT_STATE: EmergencyState = {
  isDisasterSurgeActive: false,
  surgeReason: "",
  alerts: [],
};

/**
 * Reads emergency state from localStorage
 */
export const readEmergencyState = (): EmergencyState => {
  if (typeof window === "undefined") return DEFAULT_STATE;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return DEFAULT_STATE;
  try {
    return JSON.parse(raw);
  } catch (e) {
    return DEFAULT_STATE;
  }
};

/**
 * Writes emergency state to localStorage and fires event
 */
const writeEmergencyState = (state: EmergencyState) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  window.dispatchEvent(new CustomEvent(CUSTOM_EVENT));
};

/**
 * Toggles Hospital Disaster Surge Mode
 */
export const toggleDisasterSurgeMode = (
  active: boolean,
  reason: string,
  adminName: string
) => {
  const state = readEmergencyState();
  state.isDisasterSurgeActive = active;
  state.surgeReason = active ? reason : "";

  logEvent(
    adminName,
    active ? "EMERGENCY_SURGE_ACTIVATED" : "EMERGENCY_SURGE_DEACTIVATED",
    active
      ? `🚨 HOSPITAL DISASTER SURGE MODE ACTIVATED! Reason: ${reason}. All triage intake auto-escalated to P1 Critical priority.`
      : `Disaster Surge Mode deactivated. Normal priority queue operations restored.`
  );

  writeEmergencyState(state);
};

/**
 * Triggers a Code Blue Emergency Alert
 */
export const triggerCodeBlueAlert = (
  departmentCode: string,
  room: string,
  staffName: string,
  notes: string = "Acute Cardiac / Respiratory Arrest"
): EmergencyAlert => {
  const state = readEmergencyState();
  const newAlert: EmergencyAlert = {
    id: `cb_${Date.now()}`,
    type: "CODE_BLUE",
    departmentCode,
    room,
    triggeredBy: staffName,
    timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    status: "ACTIVE",
    notes,
  };

  state.alerts.unshift(newAlert);

  logEvent(
    staffName,
    "CODE_BLUE_TRIGGERED",
    `🚨 CODE BLUE EMERGENCY DISPATCH! Location: ${departmentCode} (${room}). Initiated by ${staffName}.`
  );

  // Broadcast alert to open windows
  broadcastTokenCall("CODE-BLUE", departmentCode, "EMERGENCY DISPATCH", room);

  writeEmergencyState(state);
  return newAlert;
};

/**
 * Resolves an active Code Blue alert
 */
export const resolveEmergencyAlert = (alertId: string, staffName: string) => {
  const state = readEmergencyState();
  state.alerts = state.alerts.map((a) => {
    if (a.id === alertId) {
      return { ...a, status: "RESOLVED" as const };
    }
    return a;
  });

  logEvent(
    staffName,
    "CODE_BLUE_RESOLVED",
    `Code Blue Emergency (ID: ${alertId}) marked RESOLVED by ${staffName}. Resuscitation team clear.`
  );

  writeEmergencyState(state);
};
