/**
 * OPDFlow AI — Hospital Congestion Analytics & Staff Allocation Engine v1
 * 
 * Computes dynamic clinic congestion levels, room occupancy percentages,
 * hospital-wide health scores, and automated mitigation recommendations.
 */

import type { DepartmentData, PatientVisit } from "./mockState";

export type CongestionLevel = "NORMAL" | "MODERATE" | "HIGH" | "CRITICAL";

export interface DepartmentCongestionStatus {
  departmentCode: string;
  departmentName: string;
  congestionLevel: CongestionLevel;
  occupancyPercentage: number;
  waitingCount: number;
  criticalP1Count: number;
  recommendation: string;
  badgeColor: string;
  badgeBg: string;
}

export interface HospitalOverviewMetrics {
  healthIndexScore: number; // 0–100%
  totalWaiting: number;
  totalTreating: number;
  totalP1Critical: number;
  congestedClinicsCount: number;
  alerts: string[];
}

/**
 * Calculates congestion status for a single department
 */
export const calculateDepartmentCongestion = (
  dept: DepartmentData,
  activeVisits: PatientVisit[]
): DepartmentCongestionStatus => {
  const deptVisits = activeVisits.filter(
    (v) => v.departmentCode === dept.code && v.status !== "COMPLETED" && v.status !== "CANCELLED" && v.status !== "NO_SHOW"
  );
  
  const criticalP1Count = deptVisits.filter((v) => v.priority === "p1").length;
  const occupancyPercentage = Math.round(
    Math.min((dept.currentCapacity / (dept.maxCapacity || 1)) * 100, 100)
  );

  let congestionLevel: CongestionLevel = "NORMAL";
  let recommendation = "Clinic operating within normal operational capacity.";
  let badgeColor = "text-emerald-700 border-emerald-300";
  let badgeBg = "bg-emerald-50";

  if (dept.status === "PAUSED") {
    congestionLevel = "CRITICAL";
    recommendation = "Clinic Queue is currently PAUSED. Resume department to restore patient flow.";
    badgeColor = "text-rose-700 border-rose-300";
    badgeBg = "bg-rose-50";
  } else if (occupancyPercentage >= 90 || criticalP1Count >= 3 || dept.waiting >= 6) {
    congestionLevel = "CRITICAL";
    recommendation = `🚨 Critical congestion! ${criticalP1Count} P1 case(s) waiting. Immediately re-allocate +1 doctor to ${dept.name}.`;
    badgeColor = "text-rose-700 border-rose-300";
    badgeBg = "bg-rose-50";
  } else if (occupancyPercentage >= 75 || criticalP1Count >= 2 || dept.waiting >= 4) {
    congestionLevel = "HIGH";
    recommendation = `High occupancy (${occupancyPercentage}%). Monitor waiting room and consider staff transfer.`;
    badgeColor = "text-orange-700 border-orange-300";
    badgeBg = "bg-orange-50";
  } else if (occupancyPercentage >= 50 || dept.waiting >= 2) {
    congestionLevel = "MODERATE";
    recommendation = "Moderate patient volume. Standard clinical rotation maintaining flow.";
    badgeColor = "text-amber-700 border-amber-300";
    badgeBg = "bg-amber-50";
  }

  return {
    departmentCode: dept.code,
    departmentName: dept.name,
    congestionLevel,
    occupancyPercentage,
    waitingCount: dept.waiting,
    criticalP1Count,
    recommendation,
    badgeColor,
    badgeBg,
  };
};

/**
 * Calculates hospital-wide metrics and health score
 */
export const calculateHospitalOverview = (
  departments: DepartmentData[],
  activeVisits: PatientVisit[]
): HospitalOverviewMetrics => {
  const deptStatuses = departments.map((d) => calculateDepartmentCongestion(d, activeVisits));
  
  const totalWaiting = departments.reduce((acc, d) => acc + d.waiting, 0);
  const totalTreating = departments.reduce((acc, d) => acc + d.treating, 0);
  const totalP1Critical = activeVisits.filter(
    (v) => v.priority === "p1" && v.status !== "COMPLETED" && v.status !== "CANCELLED" && v.status !== "NO_SHOW"
  ).length;

  const congestedClinics = deptStatuses.filter(
    (s) => s.congestionLevel === "HIGH" || s.congestionLevel === "CRITICAL"
  );

  // Health Index Score: Start at 100%, deduct for congestion and critical cases
  let penalty = 0;
  penalty += congestedClinics.length * 15;
  penalty += totalP1Critical * 10;
  if (totalWaiting > 15) penalty += 15;
  const healthIndexScore = Math.max(20, Math.min(100, 100 - penalty));

  const alerts: string[] = [];
  if (totalP1Critical > 0) {
    alerts.push(`🚨 ${totalP1Critical} P1 Critical patient(s) currently queued across hospital clinics.`);
  }
  congestedClinics.forEach((c) => {
    alerts.push(`⚠️ ${c.departmentName} clinic flagged for ${c.congestionLevel} congestion (${c.occupancyPercentage}% room occupancy).`);
  });

  return {
    healthIndexScore,
    totalWaiting,
    totalTreating,
    totalP1Critical,
    congestedClinicsCount: congestedClinics.length,
    alerts,
  };
};
