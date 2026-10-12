/**
 * OPDFlow AI — Audit Trail & Compliance Export Engine v1
 * 
 * Provides log categorization, real-time query filtering,
 * and regulatory CSV/JSON export capabilities for hospital compliance audits.
 */

import type { AuditLog } from "./mockState";

export type AuditCategory = 
  | "TRIAGE" 
  | "CLINICAL_OVERRIDE" 
  | "STAFF_MANAGEMENT" 
  | "SECURITY_CHECKIN" 
  | "SYSTEM_OPERATION";

export interface AuditCategoryMeta {
  category: AuditCategory;
  label: string;
  badgeBg: string;
  badgeColor: string;
}

/**
 * Resolves category classification for an audit action string
 */
export const getEventCategory = (action: string): AuditCategoryMeta => {
  const upper = action.toUpperCase();

  if (upper.includes("TRIAGE")) {
    return { category: "TRIAGE", label: "Triage Intake", badgeBg: "bg-indigo-50", badgeColor: "text-indigo-700 border-indigo-200" };
  }
  if (upper.includes("OVERRIDE")) {
    return { category: "CLINICAL_OVERRIDE", label: "Clinical Override", badgeBg: "bg-amber-50", badgeColor: "text-amber-800 border-amber-300" };
  }
  if (upper.includes("STAFF") || upper.includes("CAPACITY")) {
    return { category: "STAFF_MANAGEMENT", label: "Staff & Capacity", badgeBg: "bg-violet-50", badgeColor: "text-violet-700 border-violet-200" };
  }
  if (upper.includes("CHECKIN") || upper.includes("SCAN")) {
    return { category: "SECURITY_CHECKIN", label: "Door Intake / QR", badgeBg: "bg-emerald-50", badgeColor: "text-emerald-700 border-emerald-200" };
  }

  return { category: "SYSTEM_OPERATION", label: "System Operation", badgeBg: "bg-slate-100", badgeColor: "text-slate-700 border-slate-300" };
};

/**
 * Filters audit logs by keyword and action category
 */
export const filterAuditLogs = (
  logs: AuditLog[],
  keyword: string,
  categoryFilter: string = "ALL"
): AuditLog[] => {
  return logs.filter((log) => {
    const meta = getEventCategory(log.action);

    // Category filter check
    if (categoryFilter !== "ALL" && meta.category !== categoryFilter) {
      return false;
    }

    // Keyword search check
    if (!keyword.trim()) return true;

    const query = keyword.toLowerCase();
    return (
      log.actor.toLowerCase().includes(query) ||
      log.action.toLowerCase().includes(query) ||
      log.desc.toLowerCase().includes(query) ||
      log.time.toLowerCase().includes(query)
    );
  });
};

/**
 * Triggers a browser download of audit logs in CSV format
 */
export const exportAuditLogsCSV = (logs: AuditLog[]) => {
  const headers = ["Timestamp", "Actor", "Action Type", "Category", "Description"];
  const rows = logs.map((log) => {
    const meta = getEventCategory(log.action);
    const escapedDesc = `"${log.desc.replace(/"/g, '""')}"`;
    const escapedActor = `"${log.actor.replace(/"/g, '""')}"`;
    return [log.time, escapedActor, log.action, meta.label, escapedDesc].join(",");
  });

  const csvContent = [headers.join(","), ...rows].join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `smartmed_audit_compliance_report_${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Triggers a browser download of audit logs in JSON format
 */
export const exportAuditLogsJSON = (logs: AuditLog[]) => {
  const formattedLogs = logs.map((log) => ({
    ...log,
    categoryMeta: getEventCategory(log.action),
  }));

  const jsonStr = JSON.stringify(formattedLogs, null, 2);
  const blob = new Blob([jsonStr], { type: "application/json;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `smartmed_audit_logs_${Date.now()}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
