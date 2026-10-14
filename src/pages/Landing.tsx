import React from "react";
import { Link } from "react-router-dom";
import { 
  User, 
  Users, 
  Settings, 
  Tv, 
  Heart, 
  Clock, 
  AlertCircle, 
  ArrowRight,
  Sparkles,
  Activity,
  Zap,
  FileText,
  Pill,
  AlertTriangle,
  CheckCircle2
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { useMockDB } from "../hooks/useMockDB";
import { getActivePharmacyOrders } from "../utils/pharmacyLabEngine";

export const Landing: React.FC = () => {
  const db = useMockDB();
  const pharmacyOrders = getActivePharmacyOrders();
  
  const totalWaiting = db.departments.reduce((acc, dept) => acc + dept.waiting, 0);
  const totalTreating = db.departments.reduce((acc, dept) => acc + dept.treating, 0);
  const pausedCount = db.departments.filter(dept => dept.status === "PAUSED").length;
  const latestVisit = db.activeVisits && db.activeVisits.length > 0 ? db.activeVisits[db.activeVisits.length - 1] : null;

  const portals = [
    {
      title: "Patient Triage Portal",
      description: "Start AI symptom intake wizard, receive clinical priority triage (P1-P4), and obtain digital QR token pass.",
      path: "/patient",
      icon: User,
      buttonText: "Launch Patient Flow",
      badgeText: "Patient Intake",
      color: "sky",
      badgeClass: "bg-sky-50 text-sky-700 border-sky-200",
      iconBg: "bg-sky-100 text-sky-600",
      btnClass: "bg-sky-600 hover:bg-sky-700 text-white"
    },
    {
      title: "Department Staff Hub",
      description: "Manage real-time clinic queues, execute QR scanner check-ins, call next tokens, and issue lab/prescription orders.",
      path: "/staff",
      icon: Users,
      buttonText: "Launch Staff Command",
      badgeText: "Clinical Operations",
      color: "teal",
      badgeClass: "bg-teal-50 text-teal-700 border-teal-200",
      iconBg: "bg-teal-100 text-teal-600",
      btnClass: "bg-teal-600 hover:bg-teal-700 text-white"
    },
    {
      title: "Hospital Command Admin",
      description: "Configure clinic capacities, monitor congestion alerts, execute Code Blue emergency dispatch, and export audit trails.",
      path: "/admin",
      icon: Settings,
      buttonText: "Launch Command Center",
      badgeText: "Hospital Administration",
      color: "amber",
      badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
      iconBg: "bg-amber-100 text-amber-600",
      btnClass: "bg-amber-600 hover:bg-amber-700 text-white"
    },
    {
      title: "Public Waiting Room TV Display",
      description: "Wall-mounted broadcast display showing live queue position, calling tokens to counters with multi-lingual voice announcements.",
      path: "/public-display",
      icon: Tv,
      buttonText: "Open TV Broadcast",
      badgeText: "Kiosk Broadcast",
      color: "indigo",
      badgeClass: "bg-indigo-50 text-indigo-700 border-indigo-200",
      iconBg: "bg-indigo-100 text-indigo-600",
      btnClass: "bg-indigo-600 hover:bg-indigo-700 text-white"
    }
  ];

  return (
    <div className="space-y-10 animate-in fade-in duration-300 pb-12 text-slate-800">
      
      {/* Top Radiant Medical Hero Header */}
      <div className="bg-gradient-to-br from-white via-sky-50/50 to-teal-50/30 rounded-3xl p-6 sm:p-10 relative overflow-hidden border border-sky-200/80 shadow-md shadow-sky-500/5">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-sky-200/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-teal-200/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Column: AI Diagnostics Header */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-sky-200 text-sky-700 text-xs font-mono font-bold tracking-widest uppercase shadow-xs">
              <Sparkles className="h-4 w-4 text-sky-600 animate-pulse" />
              <span>SmartMed AI Outpatient Command Center</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 leading-tight">
              Clinical Intelligence & <span className="text-gradient-cyan">OPD Triage Platform</span>
            </h1>

            <p className="text-slate-600 text-base sm:text-lg leading-relaxed font-normal">
              Autonomous hospital outpatient command system powered by clinical AI triage scoring, SLA priority queue aging (P1-P4), digital QR passes, real-time counter load balancing, and multilingual voice broadcasts.
            </p>

            {/* Live Hospital Command Telemetry Strip */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-wrap items-center justify-between gap-4 font-mono text-xs">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-sky-100 border border-sky-200 flex items-center justify-center text-sky-700 font-bold">
                  HC
                </div>
                <div>
                  <span className="block font-bold text-slate-900 text-sm">Hospital Command Telemetry</span>
                  <span className="text-slate-500">OPD Network: {db.departments.length} Monitored Clinics</span>
                </div>
              </div>
              <div className="flex items-center gap-3 text-slate-600">
                <span className="px-2.5 py-1 rounded bg-slate-100 border border-slate-200">System: <strong className="text-emerald-700">Online</strong></span>
                <span className="px-2.5 py-1 rounded bg-slate-100 border border-slate-200">AI Triage: <strong className="text-sky-700">P1-P4 SLA</strong></span>
                <span className="px-2.5 py-1 rounded bg-slate-100 border border-slate-200">Queue Flow: <strong className="text-sky-700">Deterministic</strong></span>
              </div>
            </div>

            {/* Direct Patient Registration & Login CTAs */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-sky-600 via-blue-600 to-teal-600 text-white font-bold text-sm shadow-md shadow-sky-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
              >
                <User className="h-4 w-4" />
                <span>New Patient? Sign Up / Create Account</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-white border border-slate-300 hover:border-sky-400 hover:bg-slate-50 text-slate-700 font-bold text-sm shadow-xs transition-all cursor-pointer"
              >
                <span>Existing User? Sign In</span>
              </Link>
            </div>
          </div>

          {/* Right Column: Live OPD Clinical Queue Monitor */}
          <div className="lg:col-span-5 relative">
            <div className="bg-white rounded-2xl p-5 border border-sky-200/80 space-y-4 shadow-md relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 text-sky-700 font-mono font-bold text-xs">
                  <Activity className="h-4 w-4 text-sky-600 animate-pulse" />
                  <span>OPD CLINICAL QUEUE MONITOR</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                  STATUS: OPERATIONAL
                </span>
              </div>

              {/* Priority Distribution / Live Intake Status */}
              <div className="space-y-3 font-mono text-xs">
                {latestVisit ? (
                  <div className="p-3 rounded-xl bg-sky-50/70 border border-sky-200 text-sky-900 space-y-1">
                    <div className="flex items-center justify-between font-bold">
                      <span className="flex items-center gap-1.5 text-sky-700">
                        <Activity className="h-3.5 w-3.5" />
                        LATEST TRIAGE INTAKE
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-100 text-sky-800 uppercase">
                        {latestVisit.tokenNumber}
                      </span>
                    </div>
                    <p className="text-[11px] text-sky-800 leading-snug">
                      Assigned to {db.departments.find(d => d.code === latestVisit.departmentCode)?.name || latestVisit.departmentCode} · {latestVisit.priorityText}
                    </p>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 space-y-1">
                    <div className="flex items-center justify-between font-bold">
                      <span className="flex items-center gap-1.5 text-emerald-700">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        QUEUES CLEAR
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">NORMAL FLOW</span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-snug">
                      All 11 outpatient clinics are ready for patient intake & symptom triage.
                    </p>
                  </div>
                )}

                {/* Priority Breakdown Matrix */}
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-between">
                    <span className="text-rose-800 font-bold flex items-center gap-1">
                      <Zap className="h-3 w-3 text-rose-600" /> P1 Critical
                    </span>
                    <span className="font-bold text-rose-900">
                      {db.activeVisits ? db.activeVisits.filter(v => v.priority === "p1" && v.status === "WAITING").length : 0}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between">
                    <span className="text-amber-800 font-bold flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3 text-amber-600" /> P2 High
                    </span>
                    <span className="font-bold text-amber-900">
                      {db.activeVisits ? db.activeVisits.filter(v => v.priority === "p2" && v.status === "WAITING").length : 0}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-between">
                    <span className="text-sky-800 font-bold flex items-center gap-1">
                      <Clock className="h-3 w-3 text-sky-600" /> P3 Moderate
                    </span>
                    <span className="font-bold text-sky-900">
                      {db.activeVisits ? db.activeVisits.filter(v => v.priority === "p3" && v.status === "WAITING").length : 0}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <span className="text-slate-700 font-bold flex items-center gap-1">
                      <Activity className="h-3 w-3 text-slate-500" /> P4 Routine
                    </span>
                    <span className="font-bold text-slate-900">
                      {db.activeVisits ? db.activeVisits.filter(v => v.priority === "p4" && v.status === "WAITING").length : 0}
                    </span>
                  </div>
                </div>
              </div>

              {/* Real-time System Telemetry Grid */}
              <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <span className="text-slate-600 flex items-center gap-1.5"><Heart className="h-3.5 w-3.5 text-rose-500" /> Waiting Total</span>
                  <span className="font-bold text-slate-900">{totalWaiting}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <span className="text-slate-600 flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-emerald-500" /> Treating Total</span>
                  <span className="font-bold text-slate-900">{totalTreating}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <span className="text-slate-600 flex items-center gap-1.5"><Zap className="h-3.5 w-3.5 text-amber-500" /> Clinics Active</span>
                  <span className="font-bold text-slate-900">{db.departments.filter(d => d.status === "ACTIVE").length}/{db.departments.length}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <span className="text-slate-600 flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5 text-sky-500" /> AI Confidence</span>
                  <span className="font-bold text-slate-900">99.2%</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Hospital Metrics Summary Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-sky-100 shadow-sm hover:shadow-md transition-all flex items-center gap-5 hover-lift">
          <div className="h-14 w-14 rounded-2xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600 shadow-xs shrink-0">
            <Heart className="h-7 w-7" />
          </div>
          <div>
            <span className="block text-3xl font-black text-slate-900 font-mono tracking-tight">{totalWaiting}</span>
            <span className="text-xs font-bold uppercase tracking-wider text-sky-700 font-mono">Patients In OPD Queue</span>
            <span className="block text-xs text-slate-500 font-medium mt-0.5">Triage intake waiting for consultation</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-emerald-100 shadow-sm hover:shadow-md transition-all flex items-center gap-5 hover-lift">
          <div className="h-14 w-14 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-xs shrink-0">
            <Clock className="h-7 w-7" />
          </div>
          <div>
            <span className="block text-3xl font-black text-slate-900 font-mono tracking-tight">{totalTreating}</span>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 font-mono">Active Consultations</span>
            <span className="block text-xs text-slate-500 font-medium mt-0.5">Patients currently with clinicians</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-amber-100 shadow-sm hover:shadow-md transition-all flex items-center gap-5 hover-lift">
          <div className="h-14 w-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shadow-xs shrink-0">
            <AlertCircle className="h-7 w-7" />
          </div>
          <div>
            <span className="block text-3xl font-black text-slate-900 font-mono tracking-tight">{pausedCount}</span>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700 font-mono">Clinic Overload Alerts</span>
            <span className="block text-xs text-slate-500 font-medium mt-0.5">Departments at max capacity</span>
          </div>
        </div>
      </div>

      {/* Clinical Activity & Medical Inventory Quick Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Recent Medical Activity */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-mono font-bold text-sm text-sky-800 flex items-center gap-2">
              <FileText className="h-4 w-4 text-sky-600" />
              RECENT CLINICAL ACTIVITY LOG
            </h3>
            <span className="text-[10px] font-mono text-slate-400">UPDATED REAL-TIME</span>
          </div>
          <div className="space-y-3 font-mono text-xs">
            {db.auditLogs && db.auditLogs.length > 0 ? (
              db.auditLogs.slice(0, 3).map((log, index) => (
                <div key={index} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900 block">{log.action}</span>
                    <span className="text-slate-500 text-[11px]">{log.actor} · {log.desc}</span>
                  </div>
                  <span className="px-2.5 py-1 rounded bg-sky-100 text-sky-800 font-bold border border-sky-200">{log.time}</span>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-slate-400 border border-dashed rounded-xl">
                No recent clinical activity recorded yet.
              </div>
            )}
          </div>
        </div>

        {/* Active Medical Inventory & Prescriptions */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-mono font-bold text-sm text-sky-800 flex items-center gap-2">
              <Pill className="h-4 w-4 text-sky-600" />
              ACTIVE PHARMACY MEDICATIONS
            </h3>
            <span className="text-[10px] font-mono text-slate-400">DISPENSED DISPATCH</span>
          </div>
          <div className="space-y-3 font-mono text-xs">
            {pharmacyOrders && pharmacyOrders.length > 0 ? (
              pharmacyOrders.slice(0, 3).map(order => (
                <div key={order.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900 block">{order.tokenNumber}</span>
                    <span className="text-slate-500 text-[11px]">{order.medicines.join(", ")}</span>
                  </div>
                  <span className="px-2.5 py-1 rounded bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">{order.status}</span>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-slate-400 border border-dashed rounded-xl">
                No active dispensary prescriptions in queue.
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Clinical Workspace Portals */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Hospital Clinical Command Portals
            </h2>
            <p className="text-sm text-slate-500 font-medium mt-0.5">
              Select a specialized workspace module to execute patient triage, clinic queue management, or hospital administration.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {portals.map((portal) => {
            const IconComponent = portal.icon;
            return (
              <Card key={portal.path} hoverLift={true} className="bg-white flex flex-col h-full rounded-2xl border border-slate-200/90 hover:border-sky-400 hover:shadow-xl transition-all duration-300">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-mono font-bold px-3 py-1 rounded-full border uppercase tracking-wider ${portal.badgeClass}`}>
                      {portal.badgeText}
                    </span>
                    <div className={`h-11 w-11 rounded-xl flex items-center justify-center shadow-xs ${portal.iconBg}`}>
                      <IconComponent className="h-5 w-5" />
                    </div>
                  </div>
                  <CardTitle className="mt-4 text-2xl font-black text-slate-900 tracking-tight">{portal.title}</CardTitle>
                  <CardDescription className="text-sm text-slate-500 font-normal leading-relaxed mt-1">{portal.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow flex flex-col justify-end pt-6">
                  <Link to={portal.path} className="w-full">
                    <Button className={`w-full justify-between font-bold py-3.5 rounded-xl shadow-md transition-all duration-300 group ${portal.btnClass}`}>
                      <span>{portal.buttonText}</span>
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                  {portal.path === "/patient" && (
                    <p className="text-center text-xs text-slate-500 mt-2.5 font-medium">
                      Don't have an account?{" "}
                      <Link to="/register" className="text-sky-600 font-bold hover:underline">
                        Sign up here →
                      </Link>
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

    </div>
  );
};
