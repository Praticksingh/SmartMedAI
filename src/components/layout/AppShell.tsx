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
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import { LanguageSwitcher } from "../ui/LanguageSwitcher";
import type { UserRole } from "../../utils/mockAuth";

interface AppShellProps {
  children: React.ReactNode;
}

const ROLE_LABEL: Record<UserRole, string> = {
  PATIENT: "Patient",
  DEPARTMENT_STAFF: "Clinical Staff",
  DOCTOR: "Doctor",
  HOSPITAL_ADMIN: "Admin",
};

const ROLE_COLOR: Record<UserRole, string> = {
  PATIENT: "bg-teal-100 text-teal-700 border-teal-200",
  DEPARTMENT_STAFF: "bg-indigo-100 text-indigo-700 border-indigo-200",
  DOCTOR: "bg-violet-100 text-violet-700 border-violet-200",
  HOSPITAL_ADMIN: "bg-slate-200 text-slate-700 border-slate-300",
};

const ROLE_DASHBOARD: Record<UserRole, string> = {
  PATIENT: "/patient",
  DEPARTMENT_STAFF: "/staff",
  DOCTOR: "/staff",
  HOSPITAL_ADMIN: "/admin",
};

import { SystemHealthModal } from "../ui/SystemHealthModal";
import { initOfflineSyncManager } from "../../utils/offlineSyncEngine";
import { WifiOff } from "lucide-react";

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
    { label: t("nav.publicQueue"), path: "/public-display", icon: Tv, roles: [] }, // always visible
  ];

  // Filter nav items based on authenticated role; always show Public Queue
  const navItems = allNavItems.filter(item =>
    item.roles.length === 0 || (role && item.roles.includes(role))
  );

  const handleSignOut = () => {
    signOut();
    setShowUserMenu(false);
    navigate("/login", { replace: true });
  };

  // User initials for avatar
  const initials = profile?.fullName
    ? profile.fullName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
    : user?.email?.[0].toUpperCase() ?? "?";

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 font-sans">
      {/* Emergency banner */}
      <div className="bg-amber-500 text-white px-4 py-1.5 text-center text-xs font-semibold tracking-wide flex items-center justify-center gap-1.5 shadow-sm">
        <ShieldAlert className="h-4 w-4 animate-pulse shrink-0" />
        <span>Hackathon Prototype — Not a diagnostic tool. In an emergency dial medical services immediately.</span>
      </div>

      {/* Phase 12: Offline Network Status Banner */}
      {!isOnline && (
        <div className="bg-slate-900 text-amber-300 px-4 py-1.5 text-center text-xs font-bold flex items-center justify-center gap-2 border-b border-amber-500/30">
          <WifiOff className="h-4 w-4 text-amber-400 animate-pulse" />
          <span>Offline Mode Active — Local storage caching active. ({pendingSyncCount} pending items)</span>
        </div>
      )}

      {/* Main header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200/80 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">

            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 active-shrink shrink-0">
              <div className="h-10 w-10 bg-teal-600 rounded-lg flex items-center justify-center shadow-md">
                <Activity className="h-6 w-6 text-white" />
              </div>
              <div>
                <span className="text-xl font-bold tracking-tight text-slate-800">
                  OPDFlow <span className="text-teal-600">AI</span>
                </span>
                <span className="block text-[10px] text-slate-400 font-medium tracking-wider uppercase -mt-1">
                  Govt Hospital OPD Triage
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? "bg-teal-50 text-teal-700 shadow-sm border border-teal-100/50"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${isActive ? "text-teal-600" : "text-slate-400"}`} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* Right side — auth & system health & language switcher */}
            <div className="hidden lg:flex items-center gap-3">
              {/* Language Switcher */}
              <LanguageSwitcher />

              {/* System Health Diagnostic Pill Button */}
              <button
                onClick={() => setIsHealthModalOpen(true)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold hover:bg-emerald-100 transition-colors cursor-pointer"
                title="View System Health & Environment Diagnostics"
              >
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>System Operational</span>
              </button>
              {isAuthenticated && role ? (
                <>
                  {/* Role badge */}
                  <span className={`px-2.5 py-1 rounded-full border text-xs font-semibold ${ROLE_COLOR[role]}`}>
                    {ROLE_LABEL[role]}
                  </span>

                  {/* User avatar dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setShowUserMenu(!showUserMenu)}
                      className="flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-full border border-slate-200 hover:border-teal-300 bg-white hover:bg-slate-50 transition-all duration-150 group"
                      aria-haspopup="true"
                    >
                      <div className="h-7 w-7 rounded-full bg-teal-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {initials}
                      </div>
                      <span className="text-sm font-semibold text-slate-700 max-w-[120px] truncate">
                        {profile?.fullName ?? user?.email?.split("@")[0]}
                      </span>
                      <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${showUserMenu ? "rotate-180" : ""}`} />
                    </button>

                    {/* Dropdown menu */}
                    {showUserMenu && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                        <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden">
                          <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Signed in as</p>
                            <p className="text-sm font-bold text-slate-800 truncate mt-0.5">{user?.email}</p>
                          </div>
                          <div className="py-1">
                            <Link
                              to={ROLE_DASHBOARD[role]}
                              onClick={() => setShowUserMenu(false)}
                              className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                            >
                              <UserCircle2 className="h-4 w-4 text-slate-400" />
                              My Dashboard
                            </Link>
                          </div>
                          <div className="py-1 border-t border-slate-100">
                            <button
                              onClick={handleSignOut}
                              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 transition-colors"
                            >
                              <LogOut className="h-4 w-4" />
                              Sign Out
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
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700 transition-colors shadow-md"
                >
                  <LogIn className="h-4 w-4" />
                  Sign In
                </Link>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="flex md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-slate-400 hover:text-slate-500 hover:bg-slate-100 focus:outline-none"
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-slate-100 bg-white px-2 pt-2 pb-3 space-y-1 shadow-inner animate-in slide-in-from-top duration-200">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-base font-medium ${
                    isActive ? "bg-teal-50 text-teal-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <Icon className="h-5 w-5 text-slate-400" />
                  {item.label}
                </Link>
              );
            })}
            <div className="pt-4 pb-2 border-t border-slate-100 px-3 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">{t("lang.toggle")}</span>
                <LanguageSwitcher />
              </div>
              <div className="flex flex-wrap gap-2 items-center justify-between pt-1">
                {isAuthenticated && role ? (
                  <>
                    <span className={`px-2.5 py-1 rounded-full border text-xs font-semibold ${ROLE_COLOR[role]}`}>
                      {ROLE_LABEL[role]} · {profile?.fullName ?? user?.email?.split("@")[0]}
                    </span>
                    <button
                      onClick={handleSignOut}
                      className="flex items-center gap-1.5 text-xs text-rose-600 font-semibold"
                    >
                      <LogOut className="h-3.5 w-3.5" /> Sign Out
                    </button>
                  </>
                ) : (
                  <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-1.5 text-xs text-teal-600 font-semibold">
                    <LogIn className="h-3.5 w-3.5" /> Sign In
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
      <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2.5 text-white font-bold text-lg mb-1">
                <Activity className="h-5 w-5 text-teal-500" />
                <span>OPDFlow AI</span>
              </div>
              <p className="text-sm text-slate-500">{t("footer.rights")}</p>
            </div>
            <div className="flex flex-wrap justify-center gap-6 text-sm">
              <Link to="/patient" className="hover:text-white transition-colors">{t("nav.patientDashboard")}</Link>
              <Link to="/staff" className="hover:text-white transition-colors">{t("nav.staffDashboard")}</Link>
              <Link to="/admin" className="hover:text-white transition-colors">{t("nav.hospitalAdmin")}</Link>
              <Link to="/public-display" className="hover:text-white transition-colors">{t("nav.publicQueue")}</Link>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-slate-800 text-center text-xs text-slate-600">
            &copy; {new Date().getFullYear()} OPDFlow AI System. {t("footer.disclaimer")}
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
