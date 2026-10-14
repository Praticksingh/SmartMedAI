import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import {
  firebaseSignIn,
  firebaseSignInWithGoogle,
  firebaseSignUp,
  firebaseSignOut,
  subscribeToFirebaseAuth,
  saveStoredProfile,
} from "../firebase/authService";
import {
  getMockSession,
  mockSignIn,
  mockSignOut,
  mockSignUp,
  mockUpdateProfile,
  type MockUser,
  type MockProfile,
  type UserRole,
  type SignUpPayload,
} from "../utils/mockAuth";
import { apiClient, setStoredToken } from "../api/client";

// ─── Types ────────────────────────────────────────────────────────────────────
interface AuthContextValue {
  user: MockUser | null;
  profile: MockProfile | null;
  role: UserRole | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string; role?: UserRole; isLocked?: boolean }>;
  signInWithGoogle: (preferredRole?: UserRole) => Promise<{ error?: string; role?: UserRole }>;
  signUp: (payload: SignUpPayload) => Promise<{ error?: string }>;
  signOut: () => void;
  updateProfile: (updates: Partial<Omit<MockProfile, "id" | "userId">>) => Promise<{ error?: string }>;
}

// ─── Context ──────────────────────────────────────────────────────────────────
const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<MockUser | null>(null);
  const [profile, setProfile] = useState<MockProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Bootstrap: restore session from Firebase or client session on mount
  useEffect(() => {
    let isMounted = true;

    const unsubscribeFb = subscribeToFirebaseAuth((fbUser, fbProfile) => {
      if (!isMounted) return;

      if (fbUser) {
        setUser(fbUser);
        setProfile(fbProfile);
        setIsLoading(false);
      } else {
        const localSession = getMockSession();
        if (localSession) {
          setUser(localSession.user);
          setProfile(localSession.profile);
        } else {
          setUser(null);
          setProfile(null);
        }
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
      unsubscribeFb();
    };
  }, []);

  const signIn = useCallback(
    async (email: string, password: string): Promise<{ error?: string; role?: UserRole; isLocked?: boolean }> => {
      // 1. Primary: Firebase Authentication
      const fbResult = await firebaseSignIn(email, password);
      if (fbResult.user && fbResult.role) {
        setUser(fbResult.user);
        setProfile(fbResult.profile || null);
        return { role: fbResult.role };
      }

      // 2. Demo accounts / Offline fallback (for demo accounts: patient@demo.com, staff@demo.com, admin@demo.com)
      const localResult = mockSignIn(email, password);
      if (!("error" in localResult)) {
        setUser(localResult.user);
        setProfile(localResult.profile);
        return { role: localResult.user.role };
      }

      // 3. Return Firebase error or local error
      return { error: fbResult.error || localResult.error };
    },
    []
  );

  const signInWithGoogle = useCallback(
    async (preferredRole: UserRole = "PATIENT"): Promise<{ error?: string; role?: UserRole }> => {
      // 1. Primary: Firebase Google Sign-In
      const fbResult = await firebaseSignInWithGoogle(preferredRole);
      if (fbResult.user && fbResult.role) {
        setUser(fbResult.user);
        setProfile(fbResult.profile || null);
        return { role: fbResult.role };
      }

      // If user cancelled or popup was closed by user
      if (
        fbResult.error &&
        (fbResult.error.toLowerCase().includes("cancelled") ||
          fbResult.error.toLowerCase().includes("closed") ||
          fbResult.error.toLowerCase().includes("blocked"))
      ) {
        return { error: fbResult.error };
      }

      // 2. Offline / Local fallback if Firebase keys are not yet configured in .env
      const demoEmail = `google.user.${Date.now().toString(36)}@hospital.gov.in`;
      const localResult = mockSignUp({
        email: demoEmail,
        password: "GoogleAuthDemo123!",
        role: preferredRole,
        fullName: "Google Authenticated User",
        dateOfBirth: "",
        gender: "",
        phone: "",
      });

      if (!("error" in localResult)) {
        setUser(localResult.user);
        setProfile(localResult.profile);
        return { role: localResult.user.role };
      }

      return { error: fbResult.error || "Google sign-in failed. Please try again." };
    },
    []
  );

  const signUp = useCallback(async (payload: SignUpPayload): Promise<{ error?: string }> => {
    // 1. Primary: Firebase Authentication
    const fbResult = await firebaseSignUp(payload);
    if (fbResult.user) {
      setUser(fbResult.user);
      setProfile(fbResult.profile || null);
      return {};
    }

    // If Firebase error is validation or account collision, report directly
    if (fbResult.error && !fbResult.error.toLowerCase().includes("api key")) {
      return { error: fbResult.error };
    }

    // 2. Offline / Local fallback if Firebase keys are not yet configured in .env
    const localResult = mockSignUp(payload);
    if ("error" in localResult) return { error: localResult.error };
    setUser(localResult.user);
    setProfile(localResult.profile);
    return {};
  }, []);

  const signOut = useCallback(() => {
    firebaseSignOut().catch(() => {});
    apiClient.auth.logout().catch(() => {});
    setStoredToken(null);
    mockSignOut();
    setUser(null);
    setProfile(null);
  }, []);

  const updateProfile = useCallback(
    async (updates: Partial<Omit<MockProfile, "id" | "userId">>): Promise<{ error?: string }> => {
      if (!user) return { error: "Not authenticated." };

      const current: MockProfile = profile || {
        id: `prof_${user.id}`,
        userId: user.id,
        fullName: user.email.split("@")[0],
        dateOfBirth: "",
        gender: "",
        phone: "",
        isProfileComplete: false,
      };

      const fullName = updates.fullName !== undefined ? updates.fullName : current.fullName;
      const dateOfBirth = updates.dateOfBirth !== undefined ? updates.dateOfBirth : current.dateOfBirth;
      const gender = updates.gender !== undefined ? updates.gender : current.gender;
      const phone = updates.phone !== undefined ? updates.phone : current.phone;

      const isProfileComplete = Boolean(
        fullName.trim() &&
        dateOfBirth &&
        gender &&
        phone.trim()
      );

      const updatedProfile: MockProfile = {
        ...current,
        fullName,
        dateOfBirth,
        gender,
        phone,
        isProfileComplete,
      };

      saveStoredProfile(user.id, {
        role: user.role,
        fullName: updatedProfile.fullName,
        dateOfBirth: updatedProfile.dateOfBirth,
        gender: updatedProfile.gender,
        phone: updatedProfile.phone,
        isProfileComplete,
        email: user.email,
      });

      setProfile(updatedProfile);
      mockUpdateProfile(user.id, { fullName, dateOfBirth, gender, phone });
      return {};
    },
    [user, profile]
  );

  // useMemo prevents unnecessary re-renders of all context consumers
  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      role: user?.role ?? null,
      isLoading,
      isAuthenticated: !!user,
      signIn,
      signInWithGoogle,
      signUp,
      signOut,
      updateProfile,
    }),
    [user, profile, isLoading, signIn, signInWithGoogle, signUp, signOut, updateProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// ─── Hook ─────────────────────────────────────────────────────────────────────
export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
};
