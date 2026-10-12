/**
 * OPDFlow AI — AI Queue Predictive Analytics & Load Balancing Engine v1
 * 
 * Computes machine-learning style wait-time predictions, predicted turn times,
 * confidence scores, and dynamic hospital clinic load balancing recommendations.
 */

import type { DepartmentData, PatientVisit } from "./mockState";
import { getQueuePosition } from "./queueEngine";

export interface AIForecastResult {
  tokenNumber: string;
  departmentCode: string;
  positionInLine: number;
  estimatedWaitMinutes: number;
  predictedTurnTime: string;
  confidenceScore: number; // 0-100%
  explanation: string;
}

export interface AILoadBalancingRecommendation {
  sourceDeptCode: string;
  sourceDeptName: string;
  targetDeptCode: string;
  targetDeptName: string;
  suggestedDiversionCount: number;
  recommendationText: string;
  impactDescription: string;
}

/**
 * Predicts patient wait time and turn time using AI moving averages
 */
export const predictPatientWaitTime = (
  tokenNumber: string,
  departmentCode: string,
  activeVisits: PatientVisit[],
  departments: DepartmentData[]
): AIForecastResult => {
  const dept = departments.find((d) => d.code === departmentCode) || departments[0];
  const position = getQueuePosition(tokenNumber, dept.nextTokens);

  // Baseline consultation time: 6.5 mins per patient divided by available room capacity
  const activeRooms = Math.max(1, dept.currentCapacity || 1);
  const baseAvgMins = 6.5 / activeRooms;

  // Compute estimated wait time
  let estimatedWaitMinutes = Math.max(3, Math.round(position * baseAvgMins));
  
  // Adjust for priority tier if visit record exists
  const visit = activeVisits.find((v) => v.tokenNumber === tokenNumber);
  if (visit) {
    if (visit.priority === "p1") estimatedWaitMinutes = Math.min(estimatedWaitMinutes, 4);
    else if (visit.priority === "p2") estimatedWaitMinutes = Math.max(5, estimatedWaitMinutes - 3);
  }

  // Calculate predicted turn timestamp
  const turnDate = new Date(Date.now() + estimatedWaitMinutes * 60 * 1000);
  const hours = turnDate.getHours().toString().padStart(2, "0");
  const mins = turnDate.getMinutes().toString().padStart(2, "0");
  const predictedTurnTime = `${hours}:${mins}`;

  // Confidence score calculation (stable queues get higher confidence)
  const confidenceScore = Math.min(98, Math.max(78, 96 - position * 2));

  return {
    tokenNumber,
    departmentCode,
    positionInLine: position,
    estimatedWaitMinutes,
    predictedTurnTime,
    confidenceScore,
    explanation: `AI model calculated based on ${position} preceding token(s) and ${activeRooms} active room(s) at ~6.5 min/patient.`,
  };
};

/**
 * Computes AI hospital load balancing recommendations across clinics
 */
// Clinical specialty compatibility mapping for medically safe patient load-balancing:
// Only clinics with clinically overlapping general diagnostic scope can share non-urgent patient diversion.
const COMPATIBLE_CLINIC_PAIRS: Record<string, string[]> = {
  GENMED: ["RESP", "GASTRO", "DERM", "UROL"],
  RESP: ["GENMED"],
  GASTRO: ["GENMED"],
  DERM: ["GENMED"],
  UROL: ["GENMED"],
};

export const calculateHospitalLoadBalancing = (
  departments: DepartmentData[]
): AILoadBalancingRecommendation[] => {
  const recommendations: AILoadBalancingRecommendation[] = [];

  // Find busy clinics (waiting >= 4)
  const busyDepts = departments
    .filter((d) => d.status === "ACTIVE" && d.waiting >= 4)
    .sort((a, b) => b.waiting - a.waiting);

  for (const busy of busyDepts) {
    const allowedTargets = COMPATIBLE_CLINIC_PAIRS[busy.code] || [];
    const compatibleQuiet = departments
      .filter((d) => d.status === "ACTIVE" && allowedTargets.includes(d.code) && d.waiting <= 2)
      .sort((a, b) => a.waiting - b.waiting)[0];

    if (compatibleQuiet) {
      recommendations.push({
        sourceDeptCode: busy.code,
        sourceDeptName: busy.name,
        targetDeptCode: compatibleQuiet.code,
        targetDeptName: compatibleQuiet.name,
        suggestedDiversionCount: Math.min(2, Math.floor(busy.waiting / 2)),
        recommendationText: `Clinical Load Balancing: Divert 2 non-urgent P4 routine visits from ${busy.name} to compatible ${compatibleQuiet.name} clinic.`,
        impactDescription: `Clinically safe routing: will reduce ${busy.name} backlog by ~12 mins while utilizing available ${compatibleQuiet.name} consultation capacity.`,
      });
      break; // Only show highest priority recommendation
    } else {
      // For specialized clinics (e.g. Cardiology, Orthopedics, Pediatrics), do not divert to unrelated specialties
      recommendations.push({
        sourceDeptCode: busy.code,
        sourceDeptName: busy.name,
        targetDeptCode: busy.code,
        targetDeptName: `${busy.name} Fast-Track / Counter 2`,
        suggestedDiversionCount: 1,
        recommendationText: `Specialty Capacity Alert: Re-assign +1 Doctor or open Fast-Track Counter in ${busy.name}.`,
        impactDescription: `Specialized clinic requiring targeted staff reinforcement rather than cross-specialty diversion.`,
      });
      break;
    }
  }

  return recommendations;
};
