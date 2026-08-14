import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Activity,
  User as UserIcon,
  Users,
  Settings,
  Tv,
  ShieldAlert,
  Menu,
  X,
  LogIn,
  LogOut,
  ChevronDown,
  UserCircle2,
  Heart,
  Thermometer,
  Wind,
  Zap,
  Sparkles,
  WifiOff
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import { LanguageSwitcher } from "../ui/LanguageSwitcher";
import type { UserRole } from "../../utils/mockAuth";
import { SystemHealthModal } from "../ui/SystemHealthModal";
import { initOfflineSyncManager } from "../../utils/offlineSyncEngine";

interface AppShellProps {
  children: React.ReactNode;
}

const ROLE_LABEL: Record<UserRole, string> = {
  PATIENT: "Patient Portal",
  DEPARTMENT_STAFF: "Clinical Staff",
  DOCTOR: "Physician Command",
  HOSPITAL_ADMIN: "Admin Control",
};

const ROLE_COLOR: Record<UserRole, string> = {
  PATIENT: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30 shadow-glow-cyan",
  DEPARTMENT_STAFF: "bg-teal-500/10 text-teal-400 border-teal-500/30 shadow-glow-teal",
  DOCTOR: "bg-purple-500/10 text-purple-400 border-purple-500/30",
  HOSPITAL_ADMIN: "bg-amber-500/10 text-amber-400 border-amber-500/30 shadow-glow-amber",
};

const ROLE_DASHBOARD: Record<UserRole, string> = {
  PATIENT: "/patient",
  DEPARTMENT_STAFF: "/staff",
  DOCTOR: "/staff",
  HOSPITAL_ADMIN: "/admin",
};

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isHealthModalOpen, setIsHealthModalOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);

  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user, profile, role, signOut } = useAuth();
  const { t } = useLanguage();

  useEffect(() => {
    const unsubscribe = initOfflineSyncManager((onlineStatus, pending) => {
      setIsOnline(onlineStatus);
      setPendingSyncCount(pending);
    });
    return () => unsubscribe();
  }, []);

  const allNavItems = [
    { label: t("nav.patientDashboard"), path: "/patient", icon: UserIcon, roles: ["PATIENT"] },
    { label: t("nav.staffDashboard"), path: "/staff", icon: Users, roles: ["DEPARTMENT_STAFF", "DOCTOR"] },
    { label: t("nav.hospitalAdmin"), path: "/admin", icon: Settings, roles: ["HOSPITAL_ADMIN"] },
    { label: t("nav.publicQueue"), path: "/public-display", icon: Tv, roles: [] },
  ];

  const navItems = allNavItems.filter(item =>
    item.roles.length === 0 || (role && item.roles.includes(role))
  );

  const handleSignOut = () => {
    signOut();
    setShowUserMenu(false);
    navigate("/login", { replace: true });
  };

  const initials = profile?.fullName
    ? profile.fullName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
    : user?.email?.[0].toUpperCase() ?? "?";

  return (
    <div className="flex flex-col min-h-screen bg-[#080C14] text-slate-100 font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      
      {/* NovaHealth Top Medical Telemetry Bar */}
      <div className="bg-[#0B0F17] border-b border-slate-800/80 text-xs py-1.5 px-4 hidden md:flex items-center justify-between text-slate-400 font-mono">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-1.5 text-cyan-400">
            <Activity className="h-3.5 w-3.5 animate-pulse" />
            <span className="font-bold tracking-wider text-[11px]">NOVAHEALTH AI TELEMETRY</span>
          </div>
          <div className="flex items-center gap-2">
            <Heart className="h-3 w-3 text-rose-400 animate-pulse" />
            <span>PULSE: <strong className="text-slate-200 font-bold">82 BPM</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="h-3 w-3 text-amber-400" />
            <span>BP: <strong className="text-slate-200 font-bold">122/74 mmHg</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <Thermometer className="h-3 w-3 text-cyan-400" />
            <span>TEMP: <strong className="text-slate-200 font-bold">37.2 °C</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <Wind className="h-3 w-3 text-emerald-400" />
            <span>RESP: <strong className="text-slate-200 font-bold">18 RPM</strong></span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-[11px]">
          <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
            SYSTEM STABLE
          </span>
          <span className="text-slate-400">AI DIAGNOSTICS DETECT 99.8% ACCURACY</span>
        </div>
      </div>

      {/* Emergency & Prototype Disclaimer Banner */}
      <div className="bg-gradient-to-r from-amber-950/80 via-amber-900/60 to-amber-950/80 text-amber-200 px-4 py-1 text-center text-xs font-semibold tracking-wide flex items-center justify-center gap-2 border-b border-amber-500/30">
        <ShieldAlert className="h-4 w-4 text-amber-400 animate-pulse shrink-0" />
        <span>DevFusion 4.0 Clinical Command Center Prototype — Emergency Protocols Active</span>
      </div>

      {/* Phase 12: Offline Network Status Banner */}
      {!isOnline && (
        <div className="bg-slate-950 text-amber-300 px-4 py-1.5 text-center text-xs font-bold flex items-center justify-center gap-2 border-b border-amber-500/40">
          <WifiOff className="h-4 w-4 text-amber-400 animate-pulse" />
          <span>Offline Telemetry Caching Active ({pendingSyncCount} pending events)</span>
        </div>
      )}

      {/* NovaHealth Main Dark Navigation Header */}
      <header className="sticky top-0 z-40 bg-[#0B0F17]/90 backdrop-blur-xl border-b border-slate-800/80 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">

            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 active-shrink shrink-0 group">
              <div className="h-10 w-10 bg-gradient-cyan rounded-xl flex items-center justify-center shadow-glow-cyan group-hover:scale-105 transition-transform duration-200">
                <Sparkles className="h-5 w-5 text-white animate-spin-slow" />
              </div>
              <div>
                <span className="text-xl font-black tracking-tight text-white flex items-center gap-1.5">
                  Nova<span className="text-gradient-cyan">Health</span> <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">4.0</span>
                </span>
                <span className="block text-[10px] text-cyan-400 font-mono font-semibold tracking-widest uppercase -mt-1">
                  Medical AI Command Center
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-2 bg-[#111827] p-1.5 rounded-xl border border-slate-800">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                      isActive
                        ? "bg-cyan-500/15 text-cyan-300 shadow-glow-cyan border border-cyan-500/40"
                        : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${isActive ? "text-cyan-400" : "text-slate-400"}`} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* Right side — auth & system health & language switcher */}
            <div className="hidden lg:flex items-center gap-3">
              <LanguageSwitcher />

              {/* System Health Pill */}
              <button
                onClick={() => setIsHealthModalOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 text-xs font-mono font-bold hover:bg-cyan-900/60 transition-all shadow-glow-cyan cursor-pointer"
                title="View Diagnostic Metrics"
              >
                <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
                <span>AI CONNECTED</span>
              </button>

              {isAuthenticated && role ? (
                <>
                  <span className={`px-3 py-1 rounded-full border text-xs font-mono font-bold ${ROLE_COLOR[role]}`}>
                    {ROLE_LABEL[role]}
                  </span>

                  <div className="relative">
                    <button
                      onClick={() => setShowUserMenu(!showUserMenu)}
                      className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full border border-slate-700 bg-slate-900 hover:border-cyan-500/60 transition-all duration-200 shadow-lg group"
                      aria-haspopup="true"
                    >
                      <div className="h-7 w-7 rounded-full bg-gradient-cyan flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-md">
                        {initials}
                      </div>
                      <span className="text-sm font-semibold text-slate-200 max-w-[120px] truncate">
                        {profile?.fullName ?? user?.email?.split("@")[0]}
                      </span>
                      <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${showUserMenu ? "rotate-180" : ""}`} />
                    </button>

                    {showUserMenu && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                        <div className="absolute right-0 top-full mt-2 w-60 bg-[#0F172A] border border-slate-700/80 rounded-2xl shadow-2xl z-50 overflow-hidden text-slate-200">
                          <div className="px-4 py-3 border-b border-slate-800 bg-[#0B0F17]">
                            <p className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest">Medical Personnel</p>
                            <p className="text-sm font-bold text-white truncate mt-0.5">{user?.email}</p>
                          </div>
                          <div className="py-1">
                            <Link
                              to={ROLE_DASHBOARD[role]}
                              onClick={() => setShowUserMenu(false)}
                              className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-800/80 transition-colors"
                            >
                              <UserCircle2 className="h-4 w-4 text-cyan-400" />
                              Clinical Dashboard
                            </Link>
                          </div>
                          <div className="py-1 border-t border-slate-800">
                            <button
                              onClick={handleSignOut}
                              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-rose-400 hover:bg-rose-950/40 transition-colors"
                            >
                              <LogOut className="h-4 w-4" />
                              Sign Out Command
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </>
              ) : (
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-cyan text-white text-sm font-bold hover:shadow-glow-cyan transition-all shadow-md"
                >
                  <LogIn className="h-4 w-4" />
                  Clinical Login
                </Link>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="flex md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none"
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-slate-800 bg-[#0F172A] px-3 pt-2 pb-4 space-y-1 shadow-2xl animate-in slide-in-from-top duration-200">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-base font-semibold ${
                    isActive ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40" : "text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  <Icon className="h-5 w-5 text-cyan-400" />
                  {item.label}
                </Link>
              );
            })}
            <div className="pt-4 pb-2 border-t border-slate-800 px-3 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-slate-400">{t("lang.toggle")}</span>
                <LanguageSwitcher />
              </div>
              <div className="flex flex-wrap gap-2 items-center justify-between pt-1">
                {isAuthenticated && role ? (
                  <>
                    <span className={`px-3 py-1 rounded-full border text-xs font-mono font-bold ${ROLE_COLOR[role]}`}>
                      {ROLE_LABEL[role]}
                    </span>
                    <button
                      onClick={handleSignOut}
                      className="flex items-center gap-1.5 text-xs text-rose-400 font-semibold"
                    >
                      <LogOut className="h-3.5 w-3.5" /> Sign Out
                    </button>
                  </>
                ) : (
                  <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-1.5 text-xs text-cyan-400 font-semibold">
                    <LogIn className="h-3.5 w-3.5" /> Clinical Login
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main body */}
      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-[#0B0F17] text-slate-400 border-t border-slate-800/80 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2.5 text-white font-bold text-lg mb-1">
                <Sparkles className="h-5 w-5 text-cyan-400" />
                <span>NovaHealth DevFusion 4.0 Command</span>
              </div>
              <p className="text-sm text-slate-500">{t("footer.rights")}</p>
            </div>
            <div className="flex flex-wrap justify-center gap-6 text-sm">
              <Link to="/patient" className="hover:text-cyan-400 transition-colors">{t("nav.patientDashboard")}</Link>
              <Link to="/staff" className="hover:text-cyan-400 transition-colors">{t("nav.staffDashboard")}</Link>
              <Link to="/admin" className="hover:text-cyan-400 transition-colors">{t("nav.hospitalAdmin")}</Link>
              <Link to="/public-display" className="hover:text-cyan-400 transition-colors">{t("nav.publicQueue")}</Link>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-slate-800/80 text-center text-xs text-slate-500 font-mono">
            &copy; {new Date().getFullYear()} NovaHealth Medical Intelligence Platform. All Rights Reserved.
          </div>
        </div>
      </footer>

      {/* System Health Diagnostic Modal */}
      <SystemHealthModal
        isOpen={isHealthModalOpen}
        onClose={() => setIsHealthModalOpen(false)}
      />
    </div>
  );
};
