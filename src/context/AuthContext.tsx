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
import { apiClient, setStoredToken, ApiException } from "../api/client";

// ─── Types ────────────────────────────────────────────────────────────────────
interface AuthContextValue {
  user: MockUser | null;
  profile: MockProfile | null;
  role: UserRole | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  // Returns role alongside error so callers can navigate without re-reading context
  signIn: (email: string, password: string) => Promise<{ error?: string; role?: UserRole; isLocked?: boolean }>;
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

  // Bootstrap: restore session from API or localStorage on mount
  useEffect(() => {
    let isMounted = true;
    const bootstrap = async () => {
      try {
        const remoteUser = await apiClient.auth.me();
        if (remoteUser?.user && isMounted) {
          const u: MockUser = {
            id: remoteUser.user.id,
            email: remoteUser.user.email,
            role: remoteUser.user.role as UserRole,
            createdAt: remoteUser.user.createdAt || new Date().toISOString(),
          };
          setUser(u);
          setProfile({
            id: `prof_${u.id}`,
            userId: u.id,
            fullName: remoteUser.user.profile?.fullName || remoteUser.user.email.split("@")[0],
            dateOfBirth: "1995-01-01",
            gender: "Unspecified",
            phone: "+91 00000 00000",
            isProfileComplete: true,
          });
          setIsLoading(false);
          return;
        }
      } catch {
        // Fallback to local session
      }

      if (isMounted) {
        const session = getMockSession();
        if (session) {
          setUser(session.user);
          setProfile(session.profile);
        }
        setIsLoading(false);
      }
    };

    bootstrap();
    return () => {
      isMounted = false;
    };
  }, []);

  const signIn = useCallback(
    async (email: string, password: string): Promise<{ error?: string; role?: UserRole; isLocked?: boolean }> => {
      try {
        const res = await apiClient.auth.login({ email, password });
        if (res?.token && res?.user) {
          setStoredToken(res.token);
          const u: MockUser = {
            id: res.user.id,
            email: res.user.email,
            role: res.user.role as UserRole,
            createdAt: res.user.createdAt || new Date().toISOString(),
          };
          const p: MockProfile = {
            id: `prof_${u.id}`,
            userId: u.id,
            fullName: res.user.profile?.fullName || email.split("@")[0],
            dateOfBirth: "1995-01-01",
            gender: "Unspecified",
            phone: "+91 00000 00000",
            isProfileComplete: true,
          };
          setUser(u);
          setProfile(p);
          return { role: u.role };
        }
      } catch (err: any) {
        if (err instanceof ApiException) {
          if (err.status === 429 || err.code === "ACCOUNT_LOCKED") {
            return {
              error: err.message || "Account temporarily locked due to multiple failed attempts. Try again in 15 minutes.",
              isLocked: true,
            };
          }
          if (err.status === 401 || err.code === "INVALID_CREDENTIALS") {
            // Also try mock credentials for offline testing
            const localResult = mockSignIn(email, password);
            if (!("error" in localResult)) {
              setUser(localResult.user);
              setProfile(localResult.profile);
              return { role: localResult.user.role };
            }
            return { error: err.message || "Invalid credentials." };
          }
        }
      }

      // Offline fallback
      const result = mockSignIn(email, password);
      if ("error" in result) return { error: result.error };
      setUser(result.user);
      setProfile(result.profile);
      return { role: result.user.role };
    },
    []
  );

  const signUp = useCallback(async (payload: SignUpPayload): Promise<{ error?: string }> => {
    try {
      const name = payload.fullName || "User";
      const nameParts = name.split(" ");
      const res = await apiClient.auth.register({
        email: payload.email,
        password: payload.password,
        firstName: nameParts[0] || "User",
        lastName: nameParts.slice(1).join(" ") || "Patient",
        role: payload.role,
      });

      if (res?.token && res?.user) {
        setStoredToken(res.token);
        const u: MockUser = {
          id: res.user.id,
          email: res.user.email,
          role: res.user.role as UserRole,
          createdAt: new Date().toISOString(),
        };
        const p: MockProfile = {
          id: `prof_${u.id}`,
          userId: u.id,
          fullName: payload.fullName || "",
          dateOfBirth: payload.dateOfBirth || "",
          gender: payload.gender || "",
          phone: payload.phone || "",
          isProfileComplete: true,
        };
        setUser(u);
        setProfile(p);
        return {};
      }
    } catch {
      // Fallback
    }

    const result = mockSignUp(payload);
    if ("error" in result) return { error: result.error };
    setUser(result.user);
    setProfile(result.profile);
    return {};
  }, []);

  const signOut = useCallback(() => {
    apiClient.auth.logout().catch(() => {});
    setStoredToken(null);
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
