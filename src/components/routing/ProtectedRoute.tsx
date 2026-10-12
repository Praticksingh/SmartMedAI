import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import type { UserRole } from "../../utils/mockAuth";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  redirectTo?: string;
}

const ROLE_DASHBOARD: Record<UserRole, string> = {
  PATIENT: "/patient",
  DEPARTMENT_STAFF: "/staff",
  DOCTOR: "/staff",
  RECEPTIONIST: "/staff",
  LAB_STAFF: "/staff",
  PHARMACIST: "/staff",
  HOSPITAL_ADMIN: "/admin",
  ADMIN: "/admin",
};

/**
 * Wraps a route so that:
 * 1. Unauthenticated users are sent to /login (with return path saved)
 * 2. Patient with null OR incomplete profile is redirected to /profile-setup
 * 3. Authenticated users whose role is not allowed are sent to their own dashboard
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  redirectTo = "/login",
}) => {
  const { isAuthenticated, isLoading, role, profile } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-full border-4 border-teal-600 border-t-transparent animate-spin" />
          <span className="text-sm text-slate-500 font-medium">Loading session…</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Fix #1: Guard also fires when profile is null (not just when it exists but is incomplete)
  if (
    role === "PATIENT" &&
    (!profile || !profile.isProfileComplete) &&
    location.pathname !== "/profile-setup"
  ) {
    return <Navigate to="/profile-setup" replace />;
  }

  // Role guard — bounce to own dashboard if role doesn't match
  if (allowedRoles && role && !allowedRoles.includes(role)) {
    return <Navigate to={ROLE_DASHBOARD[role]} replace />;
  }

  return <>{children}</>;
};
