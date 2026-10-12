import { describe, expect, it } from "vitest";
import { broadcastTokenCall, checkIsDuplicateEvent } from "./broadcastEngine";

describe("Broadcast Engine & Speech Deduplication", () => {
  it("should successfully trigger broadcastTokenCall without crashing", () => {
    expect(() => {
      broadcastTokenCall("C-042", "CARD", "Cardiology Clinic", "Room 201");
    }).not.toThrow();
  });

  it("should detect and deduplicate identical event identifiers within 30 seconds", () => {
    const eventId = "test_event_12345";
    const token = "P-099";
    const ts = Date.now();

    // First occurrence is not duplicate
    const firstCheck = checkIsDuplicateEvent(eventId, token, ts);
    expect(firstCheck).toBe(false);

    // Second occurrence with identical eventId must be flagged as duplicate
    const secondCheck = checkIsDuplicateEvent(eventId, token, ts);
    expect(secondCheck).toBe(true);
  });

  it("should allow different event IDs through", () => {
    const isDup = checkIsDuplicateEvent("another_unique_event_id_67890", "C-010", Date.now());
    expect(isDup).toBe(false);
  });
});
