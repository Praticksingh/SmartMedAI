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

import { useMockDB } from "../../hooks/useMockDB";
import { readEmergencyState } from "../../utils/emergencyEngine";
import { calculateHospitalOverview } from "../../utils/congestionEngine";
import { checkQueueAging, getQueuePosition } from "../../utils/queueEngine";

interface AppShellProps {
  children: React.ReactNode;
}

const ROLE_LABEL: Record<UserRole, string> = {
  PATIENT: "Patient Portal",
  DEPARTMENT_STAFF: "Clinical Staff",
  DOCTOR: "Physician Command",
  RECEPTIONIST: "Intake Reception",
  LAB_STAFF: "Pathology Lab",
  PHARMACIST: "Dispensary Hub",
  HOSPITAL_ADMIN: "Hospital Admin",
  ADMIN: "Hospital Admin",
};

const ROLE_COLOR: Record<UserRole, string> = {
  PATIENT: "bg-sky-50 text-sky-700 border-sky-200 shadow-xs",
  DEPARTMENT_STAFF: "bg-teal-50 text-teal-700 border-teal-200 shadow-xs",
  DOCTOR: "bg-indigo-50 text-indigo-700 border-indigo-200 shadow-xs",
  RECEPTIONIST: "bg-emerald-50 text-emerald-700 border-emerald-200 shadow-xs",
  LAB_STAFF: "bg-blue-50 text-blue-700 border-blue-200 shadow-xs",
  PHARMACIST: "bg-emerald-50 text-emerald-700 border-emerald-200 shadow-xs",
  HOSPITAL_ADMIN: "bg-amber-50 text-amber-700 border-amber-200 shadow-xs",
  ADMIN: "bg-amber-50 text-amber-700 border-amber-200 shadow-xs",
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
  const db = useMockDB();

  useEffect(() => {
    const unsubscribe = initOfflineSyncManager((onlineStatus, pending) => {
      setIsOnline(onlineStatus);
      setPendingSyncCount(pending);
    });
    return () => unsubscribe();
  }, []);

  const allNavItems = [
    { label: t("nav.patientDashboard"), path: "/patient", icon: UserIcon, roles: ["PATIENT"] },
    { label: t("nav.staffDashboard"), path: "/staff", icon: Users, roles: ["DEPARTMENT_STAFF", "DOCTOR", "RECEPTIONIST", "LAB_STAFF", "PHARMACIST"] },
    { label: t("nav.hospitalAdmin"), path: "/admin", icon: Settings, roles: ["HOSPITAL_ADMIN", "ADMIN"] },
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

  // Contextual telemetry calculations
  const emergencyState = readEmergencyState();
  const activeCodeBlue = emergencyState.alerts.find(a => a.status === "ACTIVE");
  const hospitalOverview = calculateHospitalOverview(db.departments, db.activeVisits);

  const patientName = profile?.fullName ?? user?.email?.split("@")[0] ?? "Guest";
  const patientActiveVisit = db.activeVisits.find(
    v => v.patientName === patientName && 
    v.status !== "COMPLETED" && 
    v.status !== "NO_SHOW" && 
    v.status !== "CANCELLED"
  );
  const patientDept = patientActiveVisit
    ? db.departments.find(d => d.code === patientActiveVisit.departmentCode)
    : null;
  const patientQueuePos = patientActiveVisit && patientDept
    ? getQueuePosition(patientActiveVisit.tokenNumber, patientDept.nextTokens)
    : -1;

  // Staff telemetry (for selected/first clinic)
  const staffDept = db.departments[0];
  const agingVisits = db.activeVisits.filter(v => checkQueueAging(v.submittedAt, v.priority).isAging);

  return (
    <div className="flex flex-col min-h-screen bg-[#F8FAFC] text-slate-800 font-sans selection:bg-sky-500/20 selection:text-sky-900">
      
      {/* SmartMed Contextual Medical Telemetry Bar */}
      <div className="bg-slate-900 border-b border-slate-800 text-xs py-2 px-4 hidden md:flex items-center justify-between text-slate-300 font-mono shadow-sm">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-1.5 text-sky-400">
            <Activity className="h-3.5 w-3.5 animate-pulse" />
            <span className="font-bold tracking-wider text-[11px]">SMARTMED AI COMMAND TELEMETRY</span>
          </div>

          {role === "PATIENT" && (
            <>
              {patientActiveVisit ? (
                <>
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <span className="text-sky-400 font-bold">TOKEN:</span>
                    <strong className="text-white font-bold">{patientActiveVisit.tokenNumber} ({patientDept?.name ?? patientActiveVisit.departmentCode})</strong>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <span className="text-amber-400 font-bold">POSITION:</span>
                    <span>#{patientQueuePos > 0 ? patientQueuePos : "Called"}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <span className="text-rose-400 font-bold">PRIORITY:</span>
                    <span>{patientActiveVisit.priorityText}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <span className="text-emerald-400 font-bold">STATUS:</span>
                    <span>{patientActiveVisit.status}</span>
                  </div>
                </>
              ) : (
                <div className="text-slate-400">
                  <span>QUEUE PASS: <strong className="text-slate-200">Ready for Symptom Triage</strong></span>
                </div>
              )}
            </>
          )}

          {(role === "DEPARTMENT_STAFF" || role === "DOCTOR" || role === "RECEPTIONIST" || role === "LAB_STAFF" || role === "PHARMACIST") && (
            <>
              <div className="flex items-center gap-1.5 text-slate-300">
                <span className="text-teal-400 font-bold">CLINIC:</span>
                <strong className="text-white font-bold">{staffDept?.name} ({staffDept?.room})</strong>
              </div>
              <div className="flex items-center gap-1.5 text-slate-300">
                <span className="text-amber-400 font-bold">WAITING:</span>
                <span>{staffDept?.waiting ?? 0} In Line</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-300">
                <span className="text-sky-400 font-bold">SERVING:</span>
                <strong className="text-teal-300">{staffDept?.nowServing || "Standby"}</strong>
              </div>
              <div className="flex items-center gap-1.5 text-slate-300">
                <span className="text-rose-400 font-bold">SLA DELAY:</span>
                <span className={agingVisits.length > 0 ? "text-rose-400 font-bold" : "text-emerald-400"}>
                  {agingVisits.length} Breaches
                </span>
              </div>
            </>
          )}

          {(role === "HOSPITAL_ADMIN" || role === "ADMIN") && (
            <>
              <div className="flex items-center gap-1.5 text-slate-300">
                <span className="text-teal-400 font-bold">HEALTH SCORE:</span>
                <strong className="text-emerald-400 font-bold">{hospitalOverview.healthIndexScore}% Optimal</strong>
              </div>
              <div className="flex items-center gap-1.5 text-slate-300">
                <span className="text-amber-400 font-bold">TOTAL WAITING:</span>
                <span>{hospitalOverview.totalWaiting} Patients</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-300">
                <span className="text-rose-400 font-bold">P1 CRITICAL:</span>
                <span className="text-rose-400 font-bold">{hospitalOverview.totalP1Critical} Active</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-300">
                <span className="text-sky-400 font-bold">CLINICS:</span>
                <span>{db.departments.length} Monitored</span>
              </div>
            </>
          )}

          {!role && (
            <>
              <div className="flex items-center gap-2">
                <Heart className="h-3 w-3 text-rose-400 animate-pulse" />
                <span>OPD COMMAND: <strong className="text-white font-bold">ACTIVE</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-3 w-3 text-amber-400" />
                <span>AI TRIAGE: <strong className="text-white font-bold">ONLINE (P1-P4)</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <Thermometer className="h-3 w-3 text-sky-400" />
                <span>QUEUE ARCHITECTURE: <strong className="text-white font-bold">FIFO SLA</strong></span>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-4 text-[11px]">
          {activeCodeBlue ? (
            <span className="px-2 py-0.5 rounded bg-rose-500/20 border border-rose-500/50 text-rose-300 font-bold flex items-center gap-1 animate-pulse">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
              CODE BLUE: {activeCodeBlue.departmentCode}
            </span>
          ) : emergencyState.isDisasterSurgeActive ? (
            <span className="px-2 py-0.5 rounded bg-rose-500/20 border border-rose-500/50 text-rose-300 font-bold flex items-center gap-1 animate-pulse">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
              SURGE ACTIVE
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
              CLINICAL FLOW NORMAL
            </span>
          )}
          <span className="text-slate-400">SMARTMED AI 2026.1 READY</span>
        </div>
      </div>

      {/* Emergency & Protocol Banner */}
      {activeCodeBlue ? (
        <div className="bg-rose-600 text-white px-4 py-1.5 text-center text-xs font-semibold tracking-wide flex items-center justify-center gap-2 shadow-sm animate-pulse">
          <ShieldAlert className="h-4 w-4 text-white shrink-0" />
          <span>EMERGENCY: Code Blue Alert active in {activeCodeBlue.departmentCode} ({activeCodeBlue.room}) &mdash; Resuscitation Protocol Enforced</span>
        </div>
      ) : emergencyState.isDisasterSurgeActive ? (
        <div className="bg-amber-600 text-white px-4 py-1.5 text-center text-xs font-semibold tracking-wide flex items-center justify-center gap-2 shadow-sm animate-pulse">
          <ShieldAlert className="h-4 w-4 text-white shrink-0" />
          <span>DISASTER SURGE ACTIVE: All intake triage prioritized to P1 Critical &mdash; {emergencyState.surgeReason}</span>
        </div>
      ) : null}

      {/* Offline Network Status Banner */}
      {!isOnline && (
        <div className="bg-amber-500 text-slate-900 px-4 py-1.5 text-center text-xs font-bold flex items-center justify-center gap-2 shadow-sm">
          <WifiOff className="h-4 w-4 text-slate-900 animate-pulse" />
          <span>Offline Telemetry Caching Active ({pendingSyncCount} pending transactions)</span>
        </div>
      )}

      {/* SmartMed Main Navigation Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">

            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 active-shrink shrink-0 group">
              <div className="h-10 w-10 bg-gradient-to-tr from-sky-600 via-blue-600 to-teal-500 rounded-xl flex items-center justify-center shadow-md shadow-sky-500/20 group-hover:scale-105 transition-transform duration-200">
                <Sparkles className="h-5 w-5 text-white animate-spin-slow" />
              </div>
              <div>
                <span className="text-xl font-black tracking-tight text-slate-900 flex items-center gap-1.5">
                  SmartMed<span className="text-gradient-cyan">AI</span> <span className="text-xs px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200 font-mono font-bold">OPD</span>
                </span>
                <span className="block text-[10px] text-sky-600 font-mono font-semibold tracking-widest uppercase -mt-1">
                  Hospital Outpatient Command
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-1.5 bg-slate-100/80 p-1.5 rounded-xl border border-slate-200/80">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                      isActive
                        ? "bg-white text-sky-600 shadow-sm border border-slate-200/80"
                        : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${isActive ? "text-sky-600" : "text-slate-400"}`} />
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
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-mono font-bold hover:bg-emerald-100 transition-all shadow-xs cursor-pointer"
                title="View Diagnostic Metrics"
              >
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
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
                      className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full border border-slate-200 bg-white hover:border-sky-300 transition-all duration-200 shadow-xs group"
                      aria-haspopup="true"
                    >
                      <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-sky-600 to-teal-500 flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-xs">
                        {initials}
                      </div>
                      <span className="text-sm font-semibold text-slate-800 max-w-[120px] truncate">
                        {profile?.fullName ?? user?.email?.split("@")[0]}
                      </span>
                      <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${showUserMenu ? "rotate-180" : ""}`} />
                    </button>

                    {showUserMenu && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                        <div className="absolute right-0 top-full mt-2 w-60 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden text-slate-700">
                          <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                            <p className="text-[10px] font-mono text-sky-600 uppercase tracking-widest font-bold">Medical Personnel</p>
                            <p className="text-sm font-bold text-slate-900 truncate mt-0.5">{user?.email}</p>
                          </div>
                          <div className="py-1">
                            <Link
                              to={ROLE_DASHBOARD[role]}
                              onClick={() => setShowUserMenu(false)}
                              className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-sky-50 hover:text-sky-700 transition-colors"
                            >
                              <UserCircle2 className="h-4 w-4 text-sky-600" />
                              Clinical Dashboard
                            </Link>
                          </div>
                          <div className="py-1 border-t border-slate-100">
                            <button
                              onClick={handleSignOut}
                              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 transition-colors"
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
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 text-white text-sm font-bold hover:shadow-md hover:shadow-sky-500/25 transition-all shadow-xs"
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
                className="inline-flex items-center justify-center p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 focus:outline-none"
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white px-3 pt-2 pb-4 space-y-1 shadow-lg animate-in slide-in-from-top duration-200">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-base font-semibold ${
                    isActive ? "bg-sky-50 text-sky-700 border border-sky-200" : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <Icon className="h-5 w-5 text-sky-600" />
                  {item.label}
                </Link>
              );
            })}
            <div className="pt-4 pb-2 border-t border-slate-200 px-3 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-slate-500">{t("lang.toggle")}</span>
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
                      className="flex items-center gap-1.5 text-xs text-rose-600 font-semibold"
                    >
                      <LogOut className="h-3.5 w-3.5" /> Sign Out
                    </button>
                  </>
                ) : (
                  <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-1.5 text-xs text-sky-600 font-semibold">
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
      <footer className="bg-white text-slate-500 border-t border-slate-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2.5 text-slate-900 font-bold text-lg mb-1">
                <Sparkles className="h-5 w-5 text-sky-600" />
                <span>SmartMed AI &mdash; Hospital OPD Command Center</span>
              </div>
              <p className="text-sm text-slate-500">{t("footer.rights")}</p>
            </div>
            <div className="flex flex-wrap justify-center gap-6 text-sm font-medium">
              <Link to="/patient" className="hover:text-sky-600 transition-colors">{t("nav.patientDashboard")}</Link>
              <Link to="/staff" className="hover:text-sky-600 transition-colors">{t("nav.staffDashboard")}</Link>
              <Link to="/admin" className="hover:text-sky-600 transition-colors">{t("nav.hospitalAdmin")}</Link>
              <Link to="/public-display" className="hover:text-sky-600 transition-colors">{t("nav.publicQueue")}</Link>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-slate-100 text-center text-xs text-slate-400 font-mono">
            &copy; {new Date().getFullYear()} SmartMed AI Medical Command & Triage Platform. All Rights Reserved.
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
