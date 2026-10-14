/**
 * OPDFlow AI — Priority Queue Engine v1
 * 
 * Implements deterministic priority queue sorting:
 * 1. Urgency hierarchy: P1 Critical (4) > P2 High (3) > P3 Moderate (2) > P4 Routine (1)
 * 2. FIFO arrival ordering within identical priority tiers
 * 3. Dynamic queue aging / starvation alerts
 * 4. Real-time estimated wait time & queue position calculations
 */

import type { PatientVisit } from "./mockState";

export type PriorityCode = "p1" | "p2" | "p3" | "p4";

export const PRIORITY_WEIGHTS: Record<PriorityCode, number> = {
  p1: 4,
  p2: 3,
  p3: 2,
  p4: 1,
};

// Target SLA wait thresholds in minutes before triggering queue aging alert
export const STARVATION_THRESHOLDS_MIN: Record<PriorityCode, number> = {
  p1: 5,   // Immediate
  p2: 15,  // High urgency
  p3: 30,  // Moderate
  p4: 45,  // Routine
};

/**
 * Resolves priority code for a token string
 */
export const getTokenPriorityCode = (
  token: string,
  activeVisits: PatientVisit[]
): PriorityCode => {
  const visit = activeVisits.find((v) => v.tokenNumber === token);
  if (visit) return visit.priority;
  return "p4";
};

/**
 * Sorts array of token numbers using Priority > Arrival Time (FIFO)
 */
export const sortQueueTokens = (
  tokens: string[],
  activeVisits: PatientVisit[]
): string[] => {
  return [...tokens].sort((a, b) => {
    const weightA = PRIORITY_WEIGHTS[getTokenPriorityCode(a, activeVisits)];
    const weightB = PRIORITY_WEIGHTS[getTokenPriorityCode(b, activeVisits)];

    if (weightA !== weightB) {
      return weightB - weightA; // Higher priority (P1 = 4) comes first
    }

    // Same priority: sort by visit submission time if available, otherwise by token sequence number
    const visitA = activeVisits.find((v) => v.tokenNumber === a);
    const visitB = activeVisits.find((v) => v.tokenNumber === b);

    if (visitA && visitB) {
      return visitA.id.localeCompare(visitB.id);
    }

    const numA = parseInt(a.split("-")[1] || "999", 10);
    const numB = parseInt(b.split("-")[1] || "999", 10);
    return numA - numB;
  });
};

/**
 * Calculates estimated wait time string based on queue position and average consultation pace
 */
export const calculateEstimatedWaitTime = (
  queuePosition: number,
  avgMinutesPerConsultation: number = 6
): string => {
  if (queuePosition <= 0) return "Next in line";
  const totalMins = queuePosition * avgMinutesPerConsultation;
  if (totalMins < 60) return `~${totalMins} min`;
  const hrs = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  return mins > 0 ? `~${hrs}h ${mins}m` : `~${hrs}h`;
};

/**
 * Gets 1-based position of token in department's nextTokens array
 */
export const getQueuePosition = (
  tokenNumber: string,
  nextTokens: string[]
): number => {
  const index = nextTokens.indexOf(tokenNumber);
  return index === -1 ? -1 : index + 1;
};

/**
 * Checks if a token has exceeded its target SLA threshold
 */
export const checkQueueAging = (
  submittedAt: string,
  priority: PriorityCode
): { isAging: boolean; waitedMinutes: number; threshold: number } => {
  const threshold = STARVATION_THRESHOLDS_MIN[priority];
  if (!submittedAt) return { isAging: false, waitedMinutes: 0, threshold };

  const now = Date.now();
  let subTimeMs: number | null = null;

  // Check if it's a valid ISO or epoch timestamp
  const parsedTime = Date.parse(submittedAt);
  if (!isNaN(parsedTime) && submittedAt.includes("T")) {
    subTimeMs = parsedTime;
  } else {
    // Legacy fallback: parse "HH:MM"
    const parts = submittedAt.trim().split(":");
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    if (!isNaN(hours) && !isNaN(minutes)) {
      const subDate = new Date();
      subDate.setHours(hours, minutes, 0, 0);
      if (subDate.getTime() > now) {
        subDate.setDate(subDate.getDate() - 1);
      }
      subTimeMs = subDate.getTime();
    }
  }

  if (subTimeMs === null) {
    return { isAging: false, waitedMinutes: 0, threshold };
  }

  const diffMs = Math.max(0, now - subTimeMs);
  const waitedMinutes = Math.floor(diffMs / (1000 * 60));

  return {
    isAging: waitedMinutes > threshold,
    waitedMinutes,
    threshold,
  };
};

export const formatSubmittedTime = (submittedAt: string): string => {
  if (!submittedAt) return "—";
  const parsed = Date.parse(submittedAt);
  if (!isNaN(parsed) && submittedAt.includes("T")) {
    return new Date(parsed).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
  }
  return submittedAt;
};
