import { describe, expect, it } from "vitest";
import { runTriageEngine, type TriageInput } from "./triageEngine";

describe("Clinical Triage AI Engine", () => {
  it("should enforce P1 Critical priority for acute chest pain red-flag", () => {
    const input: TriageInput = {
      symptoms: ["chest_pain"],
      severity: 8,
      durationHours: 1,
      hasFever: false,
      hasBreathingDifficulty: false,
      hasChestPain: true,
      hasLossOfConsciousness: false,
      isPregnant: false,
      isChild: false,
      isSenior: false,
      additionalContext: "Crushing retrosternal chest pain radiating to left arm",
    };

    const result = runTriageEngine(input);
    expect(result.priority).toBe("P1");
    expect(result.priorityCode).toBe("p1");
    expect(result.recommendedDeptCode).toBe("CARD");
    expect(result.reasoning.some((r) => r.includes("Red-flag symptom(s) detected"))).toBe(true);
  });

  it("should prioritize pediatric patient with high fever and respiratory distress", () => {
    const input: TriageInput = {
      symptoms: ["high_fever_child", "breathlessness"],
      severity: 7,
      durationHours: 4,
      hasFever: true,
      hasBreathingDifficulty: true,
      hasChestPain: false,
      hasLossOfConsciousness: false,
      isPregnant: false,
      isChild: true,
      isSenior: false,
      additionalContext: "Pediatric wheezing and high fever",
    };

    const result = runTriageEngine(input);
    expect(["P1", "P2"]).toContain(result.priority);
    expect(result.recommendedDeptCode).toBe("PEDI");
    expect(result.reasoning.some((r) => r.includes("Paediatric"))).toBe(true);
  });

  it("should apply obstetric priority boost for pregnant patient", () => {
    const input: TriageInput = {
      symptoms: ["severe_abdo_pain"],
      severity: 8,
      durationHours: 2,
      hasFever: false,
      hasBreathingDifficulty: false,
      hasChestPain: false,
      hasLossOfConsciousness: false,
      isPregnant: true,
      isChild: false,
      isSenior: false,
      additionalContext: "Second trimester acute pelvic cramping",
    };

    const result = runTriageEngine(input);
    expect(["P1", "P2"]).toContain(result.priority);
    expect(result.reasoning.some((r) => r.includes("pregnant") || r.includes("obstetric"))).toBe(true);
  });

  it("should enforce P1 Critical override during active Disaster Surge mode", () => {
    const input: TriageInput = {
      symptoms: ["malaise_fatigue"],
      severity: 3,
      durationHours: 12,
      hasFever: false,
      hasBreathingDifficulty: false,
      hasChestPain: false,
      hasLossOfConsciousness: false,
      isPregnant: false,
      isChild: false,
      isSenior: false,
      additionalContext: "Mild fatigue",
      isDisasterSurgeActive: true,
      surgeReason: "Mass Casualty Incident - Level 3 Surge Protocol",
    };

    const result = runTriageEngine(input);
    expect(result.priority).toBe("P1");
    expect(result.reasoning.some((r) => r.includes("CODE DISASTER"))).toBe(true);
  });
});
