import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import type { UserRole } from "../../utils/mockAuth";

interface PublicOnlyRouteProps {
  children: React.ReactNode;
}

const roleDashboard: Record<UserRole, string> = {
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
 * Redirects already-authenticated users away from /login and /register
 * to their appropriate dashboard.
 */
export const PublicOnlyRoute: React.FC<PublicOnlyRouteProps> = ({ children }) => {
  const { isAuthenticated, role, isLoading } = useAuth();

  if (isLoading) return null;

  if (isAuthenticated && role) {
    return <Navigate to={roleDashboard[role]} replace />;
  }

  return <>{children}</>;
};
