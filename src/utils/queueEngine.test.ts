import { describe, expect, it } from "vitest";
import {
  sortQueueTokens,
  checkQueueAging,
  calculateEstimatedWaitTime,
  getQueuePosition,
  STARVATION_THRESHOLDS_MIN,
} from "./queueEngine";
import type { PatientVisit } from "./mockState";

describe("Queue Engine (Priority, FIFO Sorting & SLA Aging)", () => {
  it("should sort tokens strictly by clinical priority hierarchy (P1 > P2 > P3 > P4)", () => {
    const visits: PatientVisit[] = [
      {
        id: "v_1",
        tokenNumber: "ROUTINE-001",
        patientName: "Patient A",
        patientPhone: "123",
        patientAge: 30,
        patientGender: "M",
        deptCode: "GENMED",
        priority: "p4",
        status: "WAITING",
        symptoms: [],
        severity: 2,
        triageScore: 2,
        submittedAt: new Date().toISOString(),
      },
      {
        id: "v_2",
        tokenNumber: "CRITICAL-001",
        patientName: "Patient B",
        patientPhone: "123",
        patientAge: 55,
        patientGender: "F",
        deptCode: "GENMED",
        priority: "p1",
        status: "WAITING",
        symptoms: [],
        severity: 9,
        triageScore: 9,
        submittedAt: new Date().toISOString(),
      },
      {
        id: "v_3",
        tokenNumber: "URGENT-001",
        patientName: "Patient C",
        patientPhone: "123",
        patientAge: 40,
        patientGender: "M",
        deptCode: "GENMED",
        priority: "p2",
        status: "WAITING",
        symptoms: [],
        severity: 6,
        triageScore: 6,
        submittedAt: new Date().toISOString(),
      },
    ];

    const unsorted = ["ROUTINE-001", "URGENT-001", "CRITICAL-001"];
    const sorted = sortQueueTokens(unsorted, visits);

    expect(sorted).toEqual(["CRITICAL-001", "URGENT-001", "ROUTINE-001"]);
  });

  it("should correctly calculate SLA aging for ISO-8601 timestamps without 12h clock drift", () => {
    // 20 minutes ago
    const twentyMinsAgo = new Date(Date.now() - 20 * 60 * 1000).toISOString();

    // P1 SLA is 5 min -> 20 min wait should trigger isAging: true
    const p1Aging = checkQueueAging(twentyMinsAgo, "p1");
    expect(p1Aging.isAging).toBe(true);
    expect(p1Aging.waitedMinutes).toBeGreaterThanOrEqual(19);
    expect(p1Aging.threshold).toBe(STARVATION_THRESHOLDS_MIN.p1);

    // P4 SLA is 45 min -> 20 min wait should NOT trigger isAging
    const p4Aging = checkQueueAging(twentyMinsAgo, "p4");
    expect(p4Aging.isAging).toBe(false);
    expect(p4Aging.waitedMinutes).toBeGreaterThanOrEqual(19);
  });

  it("should calculate estimated wait times accurately", () => {
    expect(calculateEstimatedWaitTime(0)).toBe("Next in line");
    expect(calculateEstimatedWaitTime(1, 6)).toBe("~6 min");
    expect(calculateEstimatedWaitTime(5, 6)).toBe("~30 min");
    expect(calculateEstimatedWaitTime(10, 6)).toBe("~1h");
    expect(calculateEstimatedWaitTime(15, 6)).toBe("~1h 30m");
  });

  it("should return correct 1-based queue position", () => {
    const queue = ["C-001", "C-002", "C-003"];
    expect(getQueuePosition("C-001", queue)).toBe(1);
    expect(getQueuePosition("C-003", queue)).toBe(3);
    expect(getQueuePosition("C-999", queue)).toBe(-1);
  });
});
