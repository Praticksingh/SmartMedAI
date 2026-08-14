import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Activity,
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
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import type { UserRole } from "../../utils/mockAuth";

type LoginTab = "patient" | "staff" | "admin";

// Fix #14: removed unused accentColor field
const TAB_CONFIG: Record<LoginTab, {
  label: string;
  icon: React.ReactNode;
  roleLabel: string;
  helperText: string;
}> = {
  patient: {
    label: "Patient",
    icon: <User className="h-4 w-4" />,
    roleLabel: "Patient Portal",
    helperText: "Don't have an account?",
  },
  staff: {
    label: "Clinical Staff",
    icon: <Users className="h-4 w-4" />,
    roleLabel: "Staff / Doctor Login",
    helperText: "Accounts are provisioned by your hospital administrator.",
  },
  admin: {
    label: "Admin",
    icon: <ShieldCheck className="h-4 w-4" />,
    roleLabel: "Hospital Admin Login",
    helperText: "Restricted access — authorised personnel only.",
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

  // Fix #4: clear form + error on tab switch to prevent cross-tab credential leakage
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

    // Fix #5: navigate using the actual DB role returned from signIn, not the tab state
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 via-teal-50/40 to-slate-100 p-4">
      {/* Background decorative blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none select-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-teal-200/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-200/20 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex flex-col items-center gap-2 group">
            <div className="h-14 w-14 rounded-2xl bg-teal-600 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-200">
              <Activity className="h-8 w-8 text-white" />
            </div>
            <div>
              <span className="block text-2xl font-extrabold text-slate-800 tracking-tight">
                OPDFlow <span className="text-teal-600">AI</span>
              </span>
              <span className="block text-xs text-slate-400 font-medium tracking-wider uppercase">
                Government Hospital OPD System
              </span>
            </div>
          </Link>
        </div>

        {/* Card */}
        <div className="bg-white/80 backdrop-blur-md border border-white/60 rounded-2xl shadow-glass overflow-hidden">
          {/* Role Tabs */}
          <div className="flex border-b border-slate-100">
            {(Object.keys(TAB_CONFIG) as LoginTab[]).map((t) => (
              <button
                key={t}
                onClick={() => handleTabSwitch(t)}
                className={`
                  flex-1 flex items-center justify-center gap-1.5 py-3.5 text-xs font-semibold
                  transition-all duration-200 border-b-2
                  ${activeTab === t
                    ? "border-teal-600 text-teal-700 bg-teal-50/50"
                    : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                  }
                `}
              >
                {TAB_CONFIG[t].icon}
                <span className="hidden sm:inline">{TAB_CONFIG[t].label}</span>
              </button>
            ))}
          </div>

          {/* Form */}
          <div className="p-7">
            <div className="mb-5">
              <h1 className="text-xl font-bold text-slate-800 tracking-tight">{tab.roleLabel}</h1>
              <p className="text-xs text-slate-400 mt-1">
                {tab.helperText}{" "}
                {activeTab === "patient" && (
                  <Link to="/register" className="text-teal-600 font-semibold hover:underline">
                    Register here
                  </Link>
                )}
              </p>
            </div>

            {/* Demo account quick-fill */}
            <button
              type="button"
              onClick={fillDemo}
              className="w-full mb-5 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-dashed border-teal-300 bg-teal-50/50 text-teal-700 text-xs font-semibold hover:bg-teal-50 transition-colors"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Fill demo credentials
            </button>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <Input
                label="Email Address"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                icon={<Mail className="h-4 w-4" />}
                required
                autoComplete="email"
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
                  rightElement={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  }
                />
                {/* Forgot password link (only on patient tab) */}
                {activeTab === "patient" && (
                  <div className="flex justify-end mt-1.5">
                    <Link
                      to="/forgot-password"
                      className="text-xs text-teal-600 font-semibold hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </div>
                )}
              </div>

              {error && (
                <div className="flex items-start gap-2 p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs font-medium">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <Button type="submit" isLoading={isLoading} className="w-full mt-2 shadow-md">
                <span>Sign In</span>
                <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            </form>
          </div>

          {/* Footer hint */}
          <div className="px-7 pb-6 border-t border-slate-100 pt-4 text-center text-xs text-slate-400">
            <span className="font-semibold text-slate-500">Demo accounts:</span>{" "}
            patient@demo.com · staff@demo.com · admin@demo.com{" "}
            <span className="font-mono">(password: demo1234)</span>
          </div>
        </div>

        <p className="text-center mt-6 text-xs text-slate-400">
          <Link to="/" className="hover:text-slate-600 transition-colors">← Back to home</Link>
        </p>
      </div>
    </div>
  );
};
