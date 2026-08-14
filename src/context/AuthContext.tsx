import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
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

// ─── Types ────────────────────────────────────────────────────────────────────
interface AuthContextValue {
  user: MockUser | null;
  profile: MockProfile | null;
  role: UserRole | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  // Returns role alongside error so callers can navigate without re-reading context
  signIn: (email: string, password: string) => Promise<{ error?: string; role?: UserRole }>;
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

  // Bootstrap: restore session from localStorage on mount
  useEffect(() => {
    const session = getMockSession();
    if (session) {
      setUser(session.user);
      setProfile(session.profile);
    }
    setIsLoading(false);
  }, []);

  const signIn = useCallback(
    async (email: string, password: string): Promise<{ error?: string; role?: UserRole }> => {
      const result = mockSignIn(email, password);
      if ("error" in result) return { error: result.error };
      setUser(result.user);
      setProfile(result.profile);
      // Return role so LoginPage can navigate without relying on UI tab state
      return { role: result.user.role };
    },
    []
  );

  const signUp = useCallback(async (payload: SignUpPayload): Promise<{ error?: string }> => {
    const result = mockSignUp(payload);
    if ("error" in result) return { error: result.error };
    setUser(result.user);
    setProfile(result.profile);
    return {};
  }, []);

  const signOut = useCallback(() => {
    mockSignOut();
    setUser(null);
    setProfile(null);
  }, []);

  const updateProfile = useCallback(
    async (updates: Partial<Omit<MockProfile, "id" | "userId">>): Promise<{ error?: string }> => {
      if (!user) return { error: "Not authenticated." };
      const result = mockUpdateProfile(user.id, updates);
      if ("error" in result) return { error: result.error };
      setProfile(result);
      return {};
    },
    [user]
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
      signUp,
      signOut,
      updateProfile,
    }),
    [user, profile, isLoading, signIn, signUp, signOut, updateProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// ─── Hook ─────────────────────────────────────────────────────────────────────
export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
};
