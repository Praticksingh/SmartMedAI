/**
 * OPDFlow AI — Tele-Health Virtual Consultation & Remote Queue Engine v1
 * 
 * Provides virtual WebRTC video room link generation, remote token tracking,
 * and clinical virtual consultation room launch controls.
 */

export type ConsultationMode = "IN_PERSON" | "TELEHEALTH_VIRTUAL";

export interface VirtualRoomSession {
  roomUrl: string;
  tokenNumber: string;
  departmentCode: string;
  createdAt: string;
}

/**
 * Generates a secure virtual video consultation room link
 */
export const generateVirtualRoomUrl = (
  tokenNumber: string,
  departmentCode: string
): VirtualRoomSession => {
  const sanitizedToken = tokenNumber.replace(/[^a-zA-Z0-9-]/g, "");
  const roomUrl = `https://telehealth.opdflow.ai/room/${departmentCode}-${sanitizedToken}`;

  return {
    roomUrl,
    tokenNumber,
    departmentCode,
    createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  };
};

/**
 * Helper to check if a visit token is virtual tele-health
 */
export const isVirtualVisit = (tokenNumber: string): boolean => {
  return tokenNumber.endsWith("V") || tokenNumber.includes("-V");
};
