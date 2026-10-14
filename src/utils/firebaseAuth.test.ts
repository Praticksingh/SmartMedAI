import { describe, expect, it, beforeEach } from "vitest";
import {
  formatFirebaseAuthError,
  getStoredProfiles,
  saveStoredProfile,
  type StoredUserProfile,
} from "../firebase/authService";

const storageMap = new Map<string, string>();
const mockLocalStorage = {
  getItem: (k: string) => storageMap.get(k) ?? null,
  setItem: (k: string, v: string) => { storageMap.set(k, String(v)); },
  removeItem: (k: string) => { storageMap.delete(k); },
  clear: () => { storageMap.clear(); },
};

Object.defineProperty(globalThis, "localStorage", {
  value: mockLocalStorage,
  configurable: true,
  writable: true,
});

describe("Firebase Auth Service & Profile Management", () => {
  beforeEach(() => {
    mockLocalStorage.clear();
  });

  describe("formatFirebaseAuthError", () => {
    it("should translate auth/user-not-found to friendly message", () => {
      const msg = formatFirebaseAuthError({ code: "auth/user-not-found" });
      expect(msg).toBe("No account found with this email address. Please register first.");
    });

    it("should translate auth/wrong-password and auth/invalid-credential", () => {
      const expected = "Invalid email address or password. Please verify your credentials.";
      expect(formatFirebaseAuthError({ code: "auth/wrong-password" })).toBe(expected);
      expect(formatFirebaseAuthError({ code: "auth/invalid-credential" })).toBe(expected);
    });

    it("should translate auth/email-already-in-use", () => {
      expect(formatFirebaseAuthError({ code: "auth/email-already-in-use" })).toBe(
        "An account with this email address already exists."
      );
    });

    it("should translate auth/too-many-requests", () => {
      expect(formatFirebaseAuthError({ code: "auth/too-many-requests" })).toContain(
        "Account temporarily blocked"
      );
    });

    it("should translate auth/invalid-api-key", () => {
      expect(formatFirebaseAuthError({ code: "auth/invalid-api-key" })).toContain(
        "Firebase API Key is invalid"
      );
    });

    it("should translate Google popup cancellation and blocked errors", () => {
      expect(formatFirebaseAuthError({ code: "auth/popup-closed-by-user" })).toContain(
        "Google popup was closed"
      );
      expect(formatFirebaseAuthError({ code: "auth/popup-blocked" })).toContain(
        "Google sign-in popup was blocked"
      );
    });

    it("should clean leading 'Firebase:' prefix on generic messages", () => {
      const msg = formatFirebaseAuthError({ message: "Firebase: Error (auth/network-error)." });
      expect(msg).not.toContain("Firebase:");
    });
  });

  describe("Profile Persistence", () => {
    it("should persist and retrieve stored user profiles keyed by UID", () => {
      const testProfile: StoredUserProfile = {
        role: "DOCTOR",
        fullName: "Dr. Vikram Seth",
        dateOfBirth: "1980-05-12",
        gender: "Male",
        phone: "+91 98765 43210",
        isProfileComplete: true,
        email: "doctor@hospital.gov.in",
      };

      saveStoredProfile("uid_doctor_123", testProfile);

      const profiles = getStoredProfiles();
      expect(profiles["uid_doctor_123"]).toBeDefined();
      expect(profiles["uid_doctor_123"].role).toBe("DOCTOR");
      expect(profiles["uid_doctor_123"].fullName).toBe("Dr. Vikram Seth");
    });

    it("should purge mock dummy values from existing profiles and reset isProfileComplete", () => {
      const dummyProfile: StoredUserProfile = {
        role: "PATIENT",
        fullName: "Test User",
        dateOfBirth: "1995-01-01",
        gender: "Unspecified",
        phone: "+91 98000 00000",
        isProfileComplete: true,
        email: "test@user.com",
      };

      saveStoredProfile("uid_test_dummy", dummyProfile);
      const cleaned = getStoredProfiles()["uid_test_dummy"];
      expect(cleaned.dateOfBirth).toBe("");
      expect(cleaned.gender).toBe("");
      expect(cleaned.phone).toBe("");
      expect(cleaned.isProfileComplete).toBe(false);
    });
  });
});
