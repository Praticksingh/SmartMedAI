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
  HOSPITAL_ADMIN: "/admin",
};

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn } = useAuth();

  const [activeTab, setActiveTab] = useState<LoginTab>("patient");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname;

  const handleTabSwitch = (t: LoginTab) => {
    setActiveTab(t);
    setEmail("");
    setPassword("");
    setError("");
    setShowPassword(false);
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

  const fillDemo = () => {
    const demos: Record<LoginTab, { email: string; pw: string }> = {
      patient: { email: "patient@demo.com", pw: "demo1234" },
      staff:   { email: "staff@demo.com",   pw: "demo1234" },
      admin:   { email: "admin@demo.com",   pw: "demo1234" },
    };
    setEmail(demos[activeTab].email);
    setPassword(demos[activeTab].pw);
    setError("");
  };

  const tab = TAB_CONFIG[activeTab];
  const isLocked = error.includes("ACCOUNT BLOCKED") || error.includes("Maximum limit");

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#080C14] p-4 text-slate-100 font-sans">
      <div className="fixed inset-0 overflow-hidden pointer-events-none select-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex flex-col items-center gap-2 group">
            <div className="h-14 w-14 rounded-2xl bg-gradient-cyan flex items-center justify-center shadow-glow-cyan group-hover:scale-105 transition-transform duration-200">
              <Sparkles className="h-8 w-8 text-white animate-spin-slow" />
            </div>
            <div>
              <span className="block text-2xl font-black text-white tracking-tight">
                Nova<span className="text-gradient-cyan">Health</span> AI Command
              </span>
              <span className="block text-xs text-cyan-400 font-mono tracking-widest uppercase">
                3-Attempt Security Lock Engine Enabled
              </span>
            </div>
          </Link>
        </div>

        {/* Card */}
        <div className="med-card-glowing rounded-3xl overflow-hidden border border-slate-800 shadow-2xl">
          {/* Role Tabs */}
          <div className="flex border-b border-slate-800 bg-[#0B0F17]">
            {(Object.keys(TAB_CONFIG) as LoginTab[]).map((t) => (
              <button
                key={t}
                onClick={() => handleTabSwitch(t)}
                className={`
                  flex-1 flex items-center justify-center gap-1.5 py-3.5 text-xs font-mono font-bold uppercase tracking-wider
                  transition-all duration-200 border-b-2
                  ${activeTab === t
                    ? "border-cyan-400 text-cyan-300 bg-cyan-500/10"
                    : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
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
              <h1 className="text-2xl font-black text-white tracking-tight">{tab.roleLabel}</h1>
              <p className="text-xs text-slate-400 mt-1 font-medium">
                {tab.helperText}{" "}
                {activeTab === "patient" && (
                  <Link to="/register" className="text-cyan-400 font-bold hover:underline">
                    Register here
                  </Link>
                )}
              </p>
            </div>

            {/* Security Attempt Limit Info Badge */}
            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs font-mono text-slate-300 flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1.5">
                <ShieldAlert className="h-4 w-4 text-cyan-400" />
                SECURITY RULE:
              </span>
              <span className="text-amber-400 font-bold">MAX 3 FAILED ATTEMPTS</span>
            </div>

            {/* Demo account quick-fill */}
            <button
              type="button"
              onClick={fillDemo}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-cyan-500/40 bg-cyan-500/10 text-cyan-300 text-xs font-mono font-bold hover:bg-cyan-500/20 transition-all cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
              Fill Demo Credentials
            </button>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <Input
                label="Email Address"
                type="email"
                placeholder="user@demo.com"
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
                      className="text-slate-400 hover:text-slate-200 transition-colors focus:outline-none"
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
                      className="text-xs text-cyan-400 font-semibold hover:underline font-mono"
                    >
                      Forgot password?
                    </Link>
                  </div>
                )}
              </div>

              {/* Error / Lockout Banner */}
              {error && (
                <div className={`p-4 rounded-xl border text-xs font-mono font-medium flex items-start gap-2.5 shadow-lg ${
                  isLocked 
                    ? "bg-rose-950/80 border-rose-500/60 text-rose-200 shadow-glow-rose" 
                    : "bg-amber-950/80 border-amber-500/60 text-amber-200 shadow-glow-amber"
                }`}>
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block uppercase">{isLocked ? "ACCESS BLOCKED — LOCKOUT ACTIVE" : "AUTHENTICATION WARNING"}</span>
                    <span className="leading-relaxed block mt-0.5">{error}</span>
                  </div>
                </div>
              )}

              <Button type="submit" isLoading={isLoading} disabled={isLocked} className="w-full mt-2 shadow-glow-cyan">
                <span>{isLocked ? "Account Locked" : "Sign In to Dashboard"}</span>
                <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            </form>
          </div>

          <div className="px-8 py-4 border-t border-slate-800 bg-[#0B0F17] text-center text-xs text-slate-400 font-mono">
            <span className="font-bold text-slate-300">Demo Accounts:</span>{" "}
            patient@demo.com · staff@demo.com · admin@demo.com{" "}
            <span className="text-cyan-400">(demo1234)</span>
          </div>
        </div>

        <p className="text-center mt-6 text-xs text-slate-400 font-mono">
          <Link to="/" className="hover:text-cyan-400 transition-colors">← Back to Command Center</Link>
        </p>
      </div>
    </div>
  );
};
