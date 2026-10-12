import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { LanguageProvider } from "./context/LanguageContext";
import { AppShell } from "./components/layout/AppShell";
import { ProtectedRoute } from "./components/routing/ProtectedRoute";
import { PublicOnlyRoute } from "./components/routing/PublicOnlyRoute";

// Pages
import { Landing } from "./pages/Landing";
import { PatientDashboard } from "./pages/PatientDashboard";
import { PatientTriage } from "./pages/PatientTriage";
import { StaffStation } from "./pages/StaffStation";
import { HospitalAdminCenter } from "./pages/HospitalAdminCenter";
import { PublicWaitingDisplay } from "./pages/PublicWaitingDisplay";

// Auth pages
import { LoginPage } from "./pages/auth/LoginPage";
import { RegisterPage } from "./pages/auth/RegisterPage";
import { ProfileSetupPage } from "./pages/auth/ProfileSetupPage";
import { OTPVerifyPage } from "./pages/auth/OTPVerifyPage";
import { ForgotPasswordPage } from "./pages/auth/ForgotPasswordPage";

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <AuthProvider>
        <Routes>
          {/* ── Public auth routes (redirect away if already signed in) ── */}
          <Route
            path="/login"
            element={
              <PublicOnlyRoute>
                <LoginPage />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicOnlyRoute>
                <RegisterPage />
              </PublicOnlyRoute>
            }
          />
          <Route path="/verify-otp" element={<OTPVerifyPage />} />
          <Route
            path="/forgot-password"
            element={
              <PublicOnlyRoute>
                <ForgotPasswordPage />
              </PublicOnlyRoute>
            }
          />

          {/* ── Profile setup (requires auth, but no shell) ── */}
          <Route
            path="/profile-setup"
            element={
              <ProtectedRoute allowedRoles={["PATIENT"]}>
                <ProfileSetupPage />
              </ProtectedRoute>
            }
          />

          {/* ── Shell-wrapped routes ── */}
          <Route
            path="/*"
            element={
              <AppShell>
                <Routes>
                  {/* Landing page — always public */}
                  <Route path="/" element={<Landing />} />

                  {/* Public TV display — no auth required */}
                  <Route path="/public-display" element={<PublicWaitingDisplay />} />

                  {/* Patient area */}
                  <Route
                    path="/patient"
                    element={
                      <ProtectedRoute allowedRoles={["PATIENT"]}>
                        <PatientDashboard />
                      </ProtectedRoute>
                    }
                  />

                  {/* Phase 2: AI Symptom Triage wizard */}
                  <Route
                    path="/triage"
                    element={
                      <ProtectedRoute allowedRoles={["PATIENT"]}>
                        <PatientTriage />
                      </ProtectedRoute>
                    }
                  />

                  {/* Staff area */}
                  <Route
                    path="/staff"
                    element={
                      <ProtectedRoute allowedRoles={["DEPARTMENT_STAFF", "DOCTOR", "RECEPTIONIST", "LAB_STAFF", "PHARMACIST"]}>
                        <StaffStation />
                      </ProtectedRoute>
                    }
                  />

                  {/* Admin area */}
                  <Route
                    path="/admin"
                    element={
                      <ProtectedRoute allowedRoles={["HOSPITAL_ADMIN", "ADMIN"]}>
                        <HospitalAdminCenter />
                      </ProtectedRoute>
                    }
                  />

                  {/* Fallback */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </AppShell>
            }
          />
        </Routes>
      </AuthProvider>
    </LanguageProvider>
  </BrowserRouter>
  );
};

export default App;
