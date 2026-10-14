/**
 * OPDFlow AI — Post-Consultation Pharmacy & Laboratory Routing Engine v1
 * 
 * Generates secondary tokens for hospital pharmacy dispensary counters (PHARM-xxx)
 * and laboratory sample collection desks (LAB-xxx) upon doctor consultation completion.
 */

import { logEvent } from "./mockState";

export interface PharmacyOrder {
  id: string;
  tokenNumber: string;
  medicines: string[];
  status: "WAITING_DISPENSARY" | "DISPENSED";
  counterRoom: string;
  createdAt: string;
}

export interface LabOrder {
  id: string;
  tokenNumber: string;
  tests: string[];
  status: "SAMPLE_PENDING" | "COLLECTED" | "REPORT_READY";
  counterRoom: string;
  createdAt: string;
}

const PHARMACY_STORAGE_KEY = "opdflow_pharmacy_orders";
const LAB_STORAGE_KEY = "opdflow_lab_orders";

/**
 * Creates a Pharmacy e-prescription order token
 */
export const createPharmacyOrder = (
  visitId: string,
  medicines: string[] = ["Paracetamol 500mg", "Amoxicillin 250mg", "ORSL Hydration Pack"],
  actorName: string = "Dr. Alok Sen"
): PharmacyOrder => {
  const count = Math.floor(100 + Math.random() * 899);
  const tokenNumber = `PHARM-${count}`;
  const newOrder: PharmacyOrder = {
    id: `pharm_${Date.now()}`,
    tokenNumber,
    medicines,
    status: "WAITING_DISPENSARY",
    counterRoom: "Dispensary Counter 3 (Ground Floor)",
    createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  };

  try {
    const raw = localStorage.getItem(PHARMACY_STORAGE_KEY);
    const orders: PharmacyOrder[] = raw ? JSON.parse(raw) : [];
    orders.unshift(newOrder);
    localStorage.setItem(PHARMACY_STORAGE_KEY, JSON.stringify(orders));
  } catch (e) {
    console.error("Failed to save pharmacy order", e);
  }

  logEvent(
    actorName,
    "PHARMACY_ORDER_CREATED",
    `Generated Pharmacy token ${tokenNumber} for visit ${visitId}. Directing to Dispensary Counter 3.`
  );

  return newOrder;
};

/**
 * Creates a Laboratory diagnostic order token
 */
export const createLabOrder = (
  visitId: string,
  tests: string[] = ["Complete Blood Count (CBC)", "Fasting Blood Sugar", "Serum Electrolytes"],
  actorName: string = "Dr. Alok Sen"
): LabOrder => {
  const count = Math.floor(100 + Math.random() * 899);
  const tokenNumber = `LAB-${count}`;
  const newOrder: LabOrder = {
    id: `lab_${Date.now()}`,
    tokenNumber,
    tests,
    status: "SAMPLE_PENDING",
    counterRoom: "Central Pathology Lab (1st Floor Room 102)",
    createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  };

  try {
    const raw = localStorage.getItem(LAB_STORAGE_KEY);
    const orders: LabOrder[] = raw ? JSON.parse(raw) : [];
    orders.unshift(newOrder);
    localStorage.setItem(LAB_STORAGE_KEY, JSON.stringify(orders));
  } catch (e) {
    console.error("Failed to save lab order", e);
  }

  logEvent(
    actorName,
    "LAB_ORDER_CREATED",
    `Generated Laboratory token ${tokenNumber} for visit ${visitId}. Directing to Central Pathology.`
  );

  return newOrder;
};

/**
 * Reads active pharmacy orders for display
 */
export const getActivePharmacyOrders = (): PharmacyOrder[] => {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(PHARMACY_STORAGE_KEY);
  if (!raw) return [];
  try {
    const orders = JSON.parse(raw) as PharmacyOrder[];
    return orders.filter(o => o.id !== "pharm_default");
  } catch {
    return [];
  }
};

/**
 * Reads active lab orders for display
 */
export const getActiveLabOrders = (): LabOrder[] => {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(LAB_STORAGE_KEY);
  if (!raw) return [];
  try {
    const orders = JSON.parse(raw) as LabOrder[];
    return orders.filter(o => o.id !== "lab_default");
  } catch {
    return [];
  }
};
