/**
 * SmartMed AI — Firebase Authentication Service
 * Seamless Firebase Auth layer handling email/password sign-in, user registration,
 * session sync, role management, and error code translation.
 */

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as fbSignOut,
  sendPasswordResetEmail,
  updateProfile as fbUpdateProfile,
  onAuthStateChanged,
  type User as FirebaseUser,
} from "firebase/auth";
import { auth, isFirebaseConfigured } from "./config";
import type { UserRole, MockUser, MockProfile, SignUpPayload } from "../utils/mockAuth";

export { isFirebaseConfigured };

const PROFILE_STORAGE_KEY = "smartmed_firebase_profiles";

export interface StoredUserProfile {
  role: UserRole;
  fullName: string;
  dateOfBirth: string;
  gender: string;
  phone: string;
  isProfileComplete: boolean;
  email?: string;
}

const getSafeStorage = () => {
  if (typeof window !== "undefined" && window.localStorage) return window.localStorage;
  if (typeof localStorage !== "undefined") return localStorage;
  return null;
};

export const getStoredProfiles = (): Record<string, StoredUserProfile> => {
  const storage = getSafeStorage();
  if (!storage) return {};
  try {
    const raw: Record<string, StoredUserProfile> = JSON.parse(
      storage.getItem(PROFILE_STORAGE_KEY) || "{}"
    );
    let changed = false;
    for (const uid in raw) {
      const p = raw[uid];
      if (p.dateOfBirth === "1995-01-01" || p.dateOfBirth === "1990-01-01") {
        p.dateOfBirth = "";
        changed = true;
      }
      if (p.gender === "Unspecified") {
        p.gender = "";
        changed = true;
      }
      if (
        p.phone === "+91 98000 00000" ||
        p.phone === "+91 00000 00000" ||
        p.phone === "+91 99999 11111"
      ) {
        p.phone = "";
        changed = true;
      }
      const isComplete = Boolean(p.fullName && p.dateOfBirth && p.gender && p.phone);
      if (p.isProfileComplete !== isComplete) {
        p.isProfileComplete = isComplete;
        changed = true;
      }
    }
    if (changed) {
      storage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(raw));
    }
    return raw;
  } catch {
    return {};
  }
};

export const saveStoredProfile = (uid: string, profile: StoredUserProfile) => {
  const storage = getSafeStorage();
  if (!storage) return;
  const existing = getStoredProfiles();
  existing[uid] = profile;
  storage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(existing));
};

export const formatFirebaseAuthError = (err: any): string => {
  const code = err?.code || "";
  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
      return "Invalid email address or password. Please verify your credentials.";
    case "auth/user-not-found":
      return "No account found with this email address. Please register first.";
    case "auth/email-already-in-use":
      return "An account with this email address already exists.";
    case "auth/weak-password":
      return "Password is too weak. Please use at least 6 characters.";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/too-many-requests":
      return "Account temporarily blocked due to multiple failed attempts. Please try again later.";
    case "auth/network-request-failed":
      return "Network connection error. Please check your internet connectivity.";
    case "auth/operation-not-allowed":
      return "Email/Password sign-in is not enabled in your Firebase project console.";
    case "auth/api-key-not-valid":
    case "auth/invalid-api-key":
      return "Firebase API Key is invalid. Please provide your real Firebase credentials in .env.";
    case "auth/popup-closed-by-user":
      return "Sign-in cancelled. The Google popup was closed.";
    case "auth/popup-blocked":
      return "Google sign-in popup was blocked by your browser. Please allow popups for this site.";
    case "auth/cancelled-popup-request":
      return "Sign-in request was superseded by another window.";
    case "auth/account-exists-with-different-credential":
      return "An account already exists with this email using another sign-in provider.";
    default:
      return err?.message?.replace(/^Firebase:\s*/i, "") || "Authentication failed. Please try again.";
  }
};

/**
 * Sign in using Firebase Authentication
 */
export const firebaseSignIn = async (
  email: string,
  pass: string
): Promise<{ user?: MockUser; profile?: MockProfile; role?: UserRole; error?: string }> => {
  try {
    const cred = await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), pass);
    const fbUser = cred.user;
    const profiles = getStoredProfiles();
    const stored = profiles[fbUser.uid];

    const role: UserRole = stored?.role || "PATIENT";
    const u: MockUser = {
      id: fbUser.uid,
      email: fbUser.email || email,
      role,
      createdAt: fbUser.metadata.creationTime || new Date().toISOString(),
    };

    const isComplete = Boolean(
      (fbUser.displayName || stored?.fullName) &&
      stored?.dateOfBirth &&
      stored?.gender &&
      stored?.phone
    );

    const p: MockProfile = {
      id: `prof_${fbUser.uid}`,
      userId: fbUser.uid,
      fullName: fbUser.displayName || stored?.fullName || fbUser.email?.split("@")[0] || "",
      dateOfBirth: stored?.dateOfBirth || "",
      gender: stored?.gender || "",
      phone: stored?.phone || "",
      isProfileComplete: isComplete,
    };

    return { user: u, profile: p, role };
  } catch (err: any) {
    return { error: formatFirebaseAuthError(err) };
  }
};

/**
 * Sign in or Sign up using Google OAuth via Firebase Popup
 */
export const firebaseSignInWithGoogle = async (
  preferredRole: UserRole = "PATIENT"
): Promise<{ user?: MockUser; profile?: MockProfile; role?: UserRole; error?: string }> => {
  try {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    const cred = await signInWithPopup(auth, provider);
    const fbUser = cred.user;

    const profiles = getStoredProfiles();
    let stored = profiles[fbUser.uid];

    if (!stored) {
      stored = {
        role: preferredRole,
        fullName: fbUser.displayName || fbUser.email?.split("@")[0] || "",
        dateOfBirth: "",
        gender: "",
        phone: fbUser.phoneNumber || "",
        isProfileComplete: false,
        email: fbUser.email || undefined,
      };
      saveStoredProfile(fbUser.uid, stored);
    }

    const isComplete = Boolean(
      (fbUser.displayName || stored.fullName) &&
      stored.dateOfBirth &&
      stored.gender &&
      stored.phone
    );

    const role: UserRole = stored.role || preferredRole;
    const u: MockUser = {
      id: fbUser.uid,
      email: fbUser.email || "user@google.com",
      role,
      createdAt: fbUser.metadata.creationTime || new Date().toISOString(),
    };

    const p: MockProfile = {
      id: `prof_${fbUser.uid}`,
      userId: fbUser.uid,
      fullName: fbUser.displayName || stored.fullName || "",
      dateOfBirth: stored.dateOfBirth || "",
      gender: stored.gender || "",
      phone: stored.phone || fbUser.phoneNumber || "",
      isProfileComplete: isComplete,
    };

    return { user: u, profile: p, role };
  } catch (err: any) {
    return { error: formatFirebaseAuthError(err) };
  }
};

/**
 * Register a new user using Firebase Authentication
 */
export const firebaseSignUp = async (
  payload: SignUpPayload
): Promise<{ user?: MockUser; profile?: MockProfile; error?: string }> => {
  try {
    const email = payload.email.trim().toLowerCase();
    const cred = await createUserWithEmailAndPassword(auth, email, payload.password);
    const fbUser = cred.user;

    if (payload.fullName) {
      try {
        await fbUpdateProfile(fbUser, { displayName: payload.fullName });
      } catch {
        // Non-critical profile name update
      }
    }

    const role: UserRole = payload.role || "PATIENT";
    const storedProf: StoredUserProfile = {
      role,
      fullName: payload.fullName || "",
      dateOfBirth: payload.dateOfBirth || "",
      gender: payload.gender || "",
      phone: payload.phone || "",
      isProfileComplete: Boolean(payload.fullName && payload.phone),
      email,
    };
    saveStoredProfile(fbUser.uid, storedProf);

    const u: MockUser = {
      id: fbUser.uid,
      email,
      role,
      createdAt: new Date().toISOString(),
    };

    const p: MockProfile = {
      id: `prof_${fbUser.uid}`,
      userId: fbUser.uid,
      fullName: payload.fullName || email.split("@")[0],
      dateOfBirth: payload.dateOfBirth || "",
      gender: payload.gender || "",
      phone: payload.phone || "",
      isProfileComplete: storedProf.isProfileComplete,
    };

    return { user: u, profile: p };
  } catch (err: any) {
    return { error: formatFirebaseAuthError(err) };
  }
};

/**
 * Sign out of Firebase
 */
export const firebaseSignOut = async (): Promise<void> => {
  try {
    await fbSignOut(auth);
  } catch (err) {
    console.error("Firebase signOut error", err);
  }
};

/**
 * Send password reset email via Firebase Auth
 */
export const firebaseSendPasswordReset = async (email: string): Promise<{ ok?: boolean; error?: string }> => {
  try {
    await sendPasswordResetEmail(auth, email.trim().toLowerCase());
    return { ok: true };
  } catch (err: any) {
    return { error: formatFirebaseAuthError(err) };
  }
};

/**
 * Subscribe to Firebase auth state changes
 */
export const subscribeToFirebaseAuth = (
  callback: (user: MockUser | null, profile: MockProfile | null) => void
): (() => void) => {
  return onAuthStateChanged(auth, (fbUser: FirebaseUser | null) => {
    if (!fbUser) {
      callback(null, null);
      return;
    }

    const profiles = getStoredProfiles();
    const stored = profiles[fbUser.uid];
    const role: UserRole = stored?.role || "PATIENT";

    const u: MockUser = {
      id: fbUser.uid,
      email: fbUser.email || "",
      role,
      createdAt: fbUser.metadata.creationTime || new Date().toISOString(),
    };

    const isComplete = Boolean(
      (fbUser.displayName || stored?.fullName) &&
      stored?.dateOfBirth &&
      stored?.gender &&
      stored?.phone
    );

    const p: MockProfile = {
      id: `prof_${fbUser.uid}`,
      userId: fbUser.uid,
      fullName: fbUser.displayName || stored?.fullName || fbUser.email?.split("@")[0] || "",
      dateOfBirth: stored?.dateOfBirth || "",
      gender: stored?.gender || "",
      phone: stored?.phone || "",
      isProfileComplete: isComplete,
    };

    callback(u, p);
  });
};
