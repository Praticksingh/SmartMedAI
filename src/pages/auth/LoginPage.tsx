import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  Users,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  Sparkles,
  ShieldAlert
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import type { UserRole } from "../../utils/mockAuth";

type LoginTab = "patient" | "staff" | "admin";

const TAB_CONFIG: Record<LoginTab, {
  label: string;
  icon: React.ReactNode;
  roleLabel: string;
  helperText: string;
}> = {
  patient: {
    label: "Patient",
    icon: <User className="h-4 w-4" />,
    roleLabel: "Patient Portal Login",
    helperText: "Don't have an account?",
  },
  staff: {
    label: "Clinical Staff",
    icon: <Users className="h-4 w-4" />,
    roleLabel: "Physician & Staff Command",
    helperText: "Accounts are provisioned by hospital administrator.",
  },
  admin: {
    label: "Hospital Admin",
    icon: <ShieldCheck className="h-4 w-4" />,
    roleLabel: "Hospital Command Login",
    helperText: "Restricted access — authorized personnel only.",
  },
};

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

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, signInWithGoogle } = useAuth();

  const [activeTab, setActiveTab] = useState<LoginTab>("patient");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname;

  const handleTabSwitch = (t: LoginTab) => {
    setActiveTab(t);
    setEmail("");
    setPassword("");
    setError("");
    setShowPassword(false);
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setIsGoogleLoading(true);
    const targetRole: UserRole =
      activeTab === "admin"
        ? "HOSPITAL_ADMIN"
        : activeTab === "staff"
        ? "DEPARTMENT_STAFF"
        : "PATIENT";

    const result = await signInWithGoogle(targetRole);
    setIsGoogleLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    const destination = from ?? (result.role ? ROLE_DASHBOARD[result.role] : "/");
    navigate(destination, { replace: true });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please enter both email address and password.");
      return;
    }

    setIsLoading(true);
    const result = await signIn(email, password);
    setIsLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    const destination = from ?? (result.role ? ROLE_DASHBOARD[result.role] : "/");
    navigate(destination, { replace: true });
  };

  const tab = TAB_CONFIG[activeTab];
  const isLocked = error.toLowerCase().includes("blocked") || error.toLowerCase().includes("locked") || error.toLowerCase().includes("maximum limit");

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-sky-50/50 to-teal-50/30 p-4 text-slate-800 font-sans">
      <div className="fixed inset-0 overflow-hidden pointer-events-none select-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-sky-200/40 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-teal-200/30 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex flex-col items-center gap-2 group">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-sky-600 via-blue-600 to-teal-500 flex items-center justify-center shadow-lg shadow-sky-500/25 group-hover:scale-105 transition-transform duration-200">
              <Sparkles className="h-8 w-8 text-white animate-spin-slow" />
            </div>
            <div>
              <span className="block text-2xl font-black text-slate-900 tracking-tight">
                SmartMed<span className="text-gradient-cyan">AI</span> Command
              </span>
              <span className="block text-xs text-sky-600 font-mono tracking-widest uppercase font-semibold">
                Hospital Outpatient Management
              </span>
            </div>
          </Link>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl overflow-hidden border border-slate-200/90 shadow-xl shadow-slate-900/5">
          {/* Role Tabs */}
          <div className="flex border-b border-slate-200 bg-slate-50/70">
            {(Object.keys(TAB_CONFIG) as LoginTab[]).map((t) => (
              <button
                key={t}
                onClick={() => handleTabSwitch(t)}
                className={`
                  flex-1 flex items-center justify-center gap-1.5 py-3.5 text-xs font-mono font-bold uppercase tracking-wider
                  transition-all duration-200 border-b-2 cursor-pointer
                  ${activeTab === t
                    ? "border-sky-600 text-sky-700 bg-white"
                    : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/60"
                  }
                `}
              >
                {TAB_CONFIG[t].icon}
                <span className="hidden sm:inline">{TAB_CONFIG[t].label}</span>
              </button>
            ))}
          </div>

          {/* Form */}
          <div className="p-8 space-y-6">
            <div>
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">{tab.roleLabel}</h1>
                {activeTab === "patient" && (
                  <Link
                    to="/register"
                    className="text-xs font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 px-3 py-1.5 rounded-full border border-sky-200 transition-colors shadow-xs"
                  >
                    + Sign Up / Register
                  </Link>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                {tab.helperText}{" "}
                {activeTab === "patient" && (
                  <Link to="/register" className="text-sky-600 font-bold hover:underline">
                    Register here
                  </Link>
                )}
              </p>
            </div>

            {/* Security Attempt Limit Info Badge */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-600 flex items-center justify-between">
              <span className="text-slate-500 flex items-center gap-1.5">
                <ShieldAlert className="h-4 w-4 text-sky-600" />
                SECURITY RULE:
              </span>
              <span className="text-amber-700 font-bold">MAX 3 FAILED ATTEMPTS</span>
            </div>

            {/* Google Quick Sign-In (Patients Only) */}
            {activeTab === "patient" && (
              <>
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading || isGoogleLoading || isLocked}
                  className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 font-semibold text-xs uppercase tracking-wider shadow-sm transition-all duration-150 disabled:opacity-60 cursor-pointer group"
                >
                  <svg className="h-4 w-4 shrink-0 transition-transform group-hover:scale-110" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>{isGoogleLoading ? "Connecting with Google..." : "Continue with Google"}</span>
                </button>

                {/* Divider */}
                <div className="relative flex items-center justify-center">
                  <div className="border-t border-slate-200 w-full" />
                  <span className="bg-white px-3 text-[11px] font-mono uppercase text-slate-400">or sign in with email</span>
                  <div className="border-t border-slate-200 w-full" />
                </div>
              </>
            )}

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <Input
                label="Email Address"
                type="email"
                placeholder="user@hospital.gov.in"
                value={email}
                onChange={e => setEmail(e.target.value)}
                icon={<Mail className="h-4 w-4" />}
                required
                autoComplete="email"
                disabled={isLocked}
              />

              <div>
                <Input
                  label="Password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  icon={<Lock className="h-4 w-4" />}
                  required
                  autoComplete="current-password"
                  disabled={isLocked}
                  rightElement={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-slate-400 hover:text-slate-600 transition-colors focus:outline-none cursor-pointer"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  }
                />
                {activeTab === "patient" && (
                  <div className="flex justify-end mt-1.5">
                    <Link
                      to="/forgot-password"
                      className="text-xs text-sky-600 font-semibold hover:underline font-mono"
                    >
                      Forgot password?
                    </Link>
                  </div>
                )}
              </div>

              {/* Error / Lockout Banner */}
              {error && (
                <div className={`p-4 rounded-xl border text-xs font-mono font-medium flex items-start gap-2.5 shadow-sm ${
                  isLocked 
                    ? "bg-rose-50 border-rose-300 text-rose-800" 
                    : "bg-amber-50 border-amber-300 text-amber-800"
                }`}>
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
                  <div>
                    <span className="font-bold block uppercase">{isLocked ? "ACCESS BLOCKED — LOCKOUT ACTIVE" : "AUTHENTICATION WARNING"}</span>
                    <span className="leading-relaxed block mt-0.5">{error}</span>
                  </div>
                </div>
              )}

              <Button type="submit" isLoading={isLoading} disabled={isLocked} className="w-full mt-2 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white shadow-md shadow-sky-500/20 font-bold py-2.5 cursor-pointer">
                <span>{isLocked ? "Account Locked" : "Sign In to Dashboard"}</span>
                <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            </form>

            {/* Create New Account / Sign Up Callout */}
            <div className="pt-5 border-t border-slate-100">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl bg-gradient-to-r from-sky-50 to-teal-50/50 border border-sky-100">
                <div className="text-left">
                  <span className="block text-xs font-bold text-slate-900 uppercase tracking-wide">New Patient to SmartMed?</span>
                  <span className="block text-[11px] text-slate-500 mt-0.5">Create your digital patient profile in 1 minute</span>
                </div>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white text-xs font-bold shadow-sm transition-all shrink-0 cursor-pointer"
                >
                  <span>Sign Up / Register</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        <p className="text-center mt-6 text-xs text-slate-500 font-mono">
          <Link to="/" className="hover:text-sky-600 transition-colors">← Back to Command Center</Link>
        </p>
      </div>
    </div>
  );
};
