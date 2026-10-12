/**
 * OPDFlow AI — QR Code Payload & Verification Engine v1
 * 
 * Manages secure QR payload generation, signature validation,
 * and clinic door intake verification (CHECKED_IN transition).
 */

import { readDB, logEvent } from "./mockState";
import type { PatientVisit } from "./mockState";

export interface QRPayload {
  v: number;            // Schema version
  token: string;        // Token Number e.g. "C-028"
  ref: string;          // Secure reference UUID e.g. "qr_sec_9x8f"
  dept: string;         // Department Code e.g. "CARD"
  ts: number;           // Creation Timestamp (ms)
  sig: string;          // Verification Signature checksum
}

export interface QRScanResult {
  success: boolean;
  message: string;
  tokenNumber?: string;
  departmentCode?: string;
  patientName?: string;
  status?: string;
}

/**
 * Simple checksum signature helper for mock QR security
 */

const computeChecksum = (token: string, ref: string, dept: string): string => {
  const secret = "SMARTMED_SECURE_HMAC_KEY_2026";
  const raw = `${token}:${ref}:${dept}:${secret}`;
  // FNV-1a 64-bit mix + rotation for robust client-side verification checksum
  let h1 = 0x811c9dc5;
  let h2 = 0x19660d;
  for (let i = 0; i < raw.length; i++) {
    const ch = raw.charCodeAt(i);
    h1 ^= ch;
    h1 = Math.imul(h1, 16777619);
    h2 ^= ch;
    h2 = Math.imul(h2, 2246822507);
  }
  const hex1 = (h1 >>> 0).toString(16).padStart(8, "0");
  const hex2 = (h2 >>> 0).toString(16).padStart(8, "0");
  return `${hex1}-${hex2}`.toUpperCase();
};

/**
 * Generates a signed QR JSON payload string for a patient visit
 */
export const generateQRPayload = (visit: PatientVisit): string => {
  const payload: QRPayload = {
    v: 1,
    token: visit.tokenNumber,
    ref: visit.qrCodeReference,
    dept: visit.departmentCode,
    ts: Date.now(),
    sig: computeChecksum(visit.tokenNumber, visit.qrCodeReference, visit.departmentCode),
  };
  return JSON.stringify(payload);
};

/**
 * Parses and verifies a scanned QR string payload
 */
export const parseQRPayload = (qrString: string): { valid: boolean; payload?: QRPayload; error?: string } => {
  if (!qrString || typeof qrString !== "string") {
    return { valid: false, error: "Empty or invalid QR code input." };
  }

  try {
    const payload: QRPayload = JSON.parse(qrString.trim());
    if (!payload.token || !payload.ref || !payload.dept || !payload.sig) {
      return { valid: false, error: "Invalid QR pass: missing required digital signature fields." };
    }

    const expectedSig = computeChecksum(payload.token, payload.ref, payload.dept);
    if (payload.sig !== expectedSig) {
      return { valid: false, error: "Digital signature verification failed. Token pass may be forged or tampered." };
    }

    return { valid: true, payload };
  } catch {
    return { valid: false, error: "Failed to parse QR code. Scanner requires a signed SmartMed AI digital pass." };
  }
};

/**
 * Validates scanned QR code, matches visit record, and updates status to CHECKED_IN
 */
export const validateAndProcessQRScan = (
  qrString: string,
  staffName: string
): QRScanResult => {
  const { valid, payload, error } = parseQRPayload(qrString);
  if (!valid || !payload) {
    logEvent(staffName, "CHECKIN_FAILED", `Failed QR scan attempt: ${error || "Unrecognized payload"}`);
    return { success: false, message: error || "Unrecognized QR code." };
  }

  const db = readDB();
  const token = payload.token;

  // Search activeVisits in localStorage
  const visitIndex = db.activeVisits.findIndex(
    (v) => v.tokenNumber.toUpperCase() === token.toUpperCase()
  );

  if (visitIndex === -1) {
    // Search default mock tokens
    const dept = db.departments.find((d) => d.nextTokens.includes(token) || d.nowServing === token);
    if (dept) {
      logEvent(staffName, "CHECKIN_SUCCESS", `Patient checked in with token ${token} at ${dept.name} entrance scanner.`);
      return {
        success: true,
        message: `Check-in Verified! Patient ${token} successfully checked in for ${dept.name}.`,
        tokenNumber: token,
        departmentCode: dept.code,
        status: "CHECKED_IN",
      };
    }

    logEvent(staffName, "CHECKIN_FAILED", `Check-in failed for token ${token}: Active visit token not found.`);
    return {
      success: false,
      message: `Token ${token} not found in active OPD queue records.`,
    };
  }

  const visit = db.activeVisits[visitIndex];

  if (visit.status === "CHECKED_IN") {
    return {
      success: true,
      message: `Token ${token} is ALREADY checked in (${visit.patientName}).`,
      tokenNumber: token,
      departmentCode: visit.departmentCode,
      patientName: visit.patientName,
      status: "CHECKED_IN",
    };
  }

  if (visit.status === "COMPLETED" || visit.status === "CANCELLED" || visit.status === "NO_SHOW") {
    return {
      success: false,
      message: `Token ${token} has status ${visit.status} and cannot be checked in.`,
    };
  }

  // Update status to CHECKED_IN
  db.activeVisits[visitIndex].status = "CHECKED_IN";
  
  // Save updated state to localStorage
  localStorage.setItem("opdflow_mock_db", JSON.stringify(db));
  window.dispatchEvent(new CustomEvent("opdflow_db_update"));

  logEvent(
    staffName,
    "CHECKIN_SUCCESS",
    `Patient ${visit.patientName} (Token ${token}) scanned QR code at clinic entrance. Status updated to CHECKED_IN.`
  );

  return {
    success: true,
    message: `Check-in Verified! ${visit.patientName} (${token}) is now marked CHECKED IN.`,
    tokenNumber: token,
    departmentCode: visit.departmentCode,
    patientName: visit.patientName,
    status: "CHECKED_IN",
  };
};
