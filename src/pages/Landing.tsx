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
      
      {/* Top Skeuomorphic Medical Hardware Hero Console */}
      <div className="skeuo-panel p-6 sm:p-10 relative overflow-hidden border border-white/90">
        <span className="skeuo-rivet absolute top-4 left-4" />
        <span className="skeuo-rivet absolute top-4 right-4" />
        <span className="skeuo-rivet absolute bottom-4 left-4" />
        <span className="skeuo-rivet absolute bottom-4 right-4" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Column: AI Diagnostics Header */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 text-sky-800 text-xs font-mono font-bold tracking-widest uppercase shadow-[inset_1px_1px_2px_#ffffff,2px_2px_5px_#cad4e2]">
              <span className="skeuo-led skeuo-led-cyan animate-pulse" />
              <span>SmartMed AI Outpatient Command Center</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 leading-tight skeuo-embossed-text">
              Clinical Intelligence & <span className="text-gradient-cyan">OPD Triage Platform</span>
            </h1>

            <p className="text-slate-600 text-base sm:text-lg leading-relaxed font-medium">
              Autonomous hospital outpatient command system powered by clinical AI triage scoring, SLA priority queue aging (P1-P4), digital QR passes, real-time counter load balancing, and multilingual voice broadcasts.
            </p>

            {/* Live Hospital Command Telemetry Well */}
            <div className="p-4 rounded-2xl skeuo-inset flex flex-wrap items-center justify-between gap-4 font-mono text-xs">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl skeuo-btn-secondary flex items-center justify-center text-sky-700 font-bold border border-slate-300">
                  HC
                </div>
                <div>
                  <span className="block font-bold text-slate-900 text-sm">Hospital Command Telemetry</span>
                  <span className="text-slate-500 font-semibold">OPD Network: {db.departments.length} Monitored Clinics</span>
                </div>
              </div>
              <div className="flex items-center gap-2.5 text-slate-700 font-bold">
                <span className="px-3 py-1 rounded-lg bg-white border border-slate-300 shadow-[inset_0_1px_1px_#ffffff,1px_1px_3px_#cad4e2] flex items-center gap-1.5">
                  <span className="skeuo-led skeuo-led-green" /> System: <strong className="text-emerald-700">Online</strong>
                </span>
                <span className="px-3 py-1 rounded-lg bg-white border border-slate-300 shadow-[inset_0_1px_1px_#ffffff,1px_1px_3px_#cad4e2]">
                  AI Triage: <strong className="text-sky-700">P1-P4 SLA</strong>
                </span>
                <span className="px-3 py-1 rounded-lg bg-white border border-slate-300 shadow-[inset_0_1px_1px_#ffffff,1px_1px_3px_#cad4e2]">
                  Queue: <strong className="text-sky-700">Deterministic</strong>
                </span>
              </div>
            </div>

            {/* Direct Patient Registration & Login CTAs */}
            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              <Link
                to="/register"
                className="skeuo-btn skeuo-btn-primary px-6 py-3.5 text-sm font-bold flex items-center gap-2"
              >
                <User className="h-4 w-4" />
                <span>New Patient? Sign Up / Create Account</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/login"
                className="skeuo-btn skeuo-btn-secondary px-5 py-3.5 text-sm font-bold text-slate-800 hover:text-sky-700"
              >
                <span>Existing User? Sign In</span>
              </Link>
            </div>
          </div>

          {/* Right Column: Live OPD Clinical Queue Monitor - Skeuomorphic LCD Monitor */}
          <div className="lg:col-span-5 relative">
            <div className="skeuo-screen p-5 space-y-4 text-sky-300">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 relative z-10">
                <div className="flex items-center gap-2 text-sky-400 font-mono font-bold text-xs">
                  <span className="skeuo-led skeuo-led-cyan animate-pulse" />
                  <Activity className="h-4 w-4 animate-pulse" />
                  <span className="tracking-wider">OPD CLINICAL QUEUE MONITOR</span>
                </div>
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 font-bold flex items-center gap-1">
                  <span className="skeuo-led skeuo-led-green" />
                  OPERATIONAL
                </span>
              </div>

              {/* Priority Distribution / Live Intake Status */}
              <div className="space-y-3 font-mono text-xs relative z-10">
                {latestVisit ? (
                  <div className="p-3 rounded-xl bg-slate-900/80 border border-sky-500/40 text-slate-200 space-y-1">
                    <div className="flex items-center justify-between font-bold">
                      <span className="flex items-center gap-1.5 text-sky-400">
                        <Activity className="h-3.5 w-3.5 text-sky-400" />
                        LATEST TRIAGE INTAKE
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-400/40 uppercase font-black">
                        {latestVisit.tokenNumber}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-snug">
                      Assigned to {db.departments.find(d => d.code === latestVisit.departmentCode)?.name || latestVisit.departmentCode} · {latestVisit.priorityText}
                    </p>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-xl bg-slate-900/80 border border-emerald-500/30 text-slate-200 space-y-1">
                    <div className="flex items-center justify-between font-bold">
                      <span className="flex items-center gap-1.5 text-emerald-400">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                        QUEUES CLEAR
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">NORMAL FLOW</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-snug">
                      All 11 outpatient clinics are ready for patient intake & symptom triage.
                    </p>
                  </div>
                )}

                {/* Priority Breakdown Matrix */}
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-500/40 flex items-center justify-between">
                    <span className="text-rose-300 font-bold flex items-center gap-1.5">
                      <span className="skeuo-led skeuo-led-red" /> P1 Critical
                    </span>
                    <span className="font-mono font-bold text-rose-200 text-xs">
                      {db.activeVisits ? db.activeVisits.filter(v => v.priority === "p1" && v.status === "WAITING").length : 0}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/40 flex items-center justify-between">
                    <span className="text-amber-300 font-bold flex items-center gap-1.5">
                      <span className="skeuo-led skeuo-led-amber" /> P2 High
                    </span>
                    <span className="font-mono font-bold text-amber-200 text-xs">
                      {db.activeVisits ? db.activeVisits.filter(v => v.priority === "p2" && v.status === "WAITING").length : 0}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-sky-950/40 border border-sky-500/40 flex items-center justify-between">
                    <span className="text-sky-300 font-bold flex items-center gap-1.5">
                      <Clock className="h-3 w-3 text-sky-400" /> P3 Moderate
                    </span>
                    <span className="font-mono font-bold text-sky-200 text-xs">
                      {db.activeVisits ? db.activeVisits.filter(v => v.priority === "p3" && v.status === "WAITING").length : 0}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-700 flex items-center justify-between">
                    <span className="text-slate-300 font-bold flex items-center gap-1.5">
                      <Activity className="h-3 w-3 text-slate-400" /> P4 Routine
                    </span>
                    <span className="font-mono font-bold text-slate-200 text-xs">
                      {db.activeVisits ? db.activeVisits.filter(v => v.priority === "p4" && v.status === "WAITING").length : 0}
                    </span>
                  </div>
                </div>
              </div>

              {/* Real-time System Telemetry Grid */}
              <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[11px] relative z-10">
                <div className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-300 flex items-center gap-1.5"><Heart className="h-3.5 w-3.5 text-rose-400" /> Waiting Total</span>
                  <span className="font-bold text-white text-xs">{totalWaiting}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-300 flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-emerald-400" /> Treating Total</span>
                  <span className="font-bold text-white text-xs">{totalTreating}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-300 flex items-center gap-1.5"><Zap className="h-3.5 w-3.5 text-amber-400" /> Clinics Active</span>
                  <span className="font-bold text-white text-xs">{db.departments.filter(d => d.status === "ACTIVE").length}/{db.departments.length}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-300 flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5 text-sky-400" /> AI Confidence</span>
                  <span className="font-bold text-sky-300 text-xs">99.2%</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Hospital Metrics Summary Bar - Skeuomorphic Raised Plates */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="skeuo-card p-6 flex items-center gap-5 skeuo-card-hover relative overflow-hidden">
          <span className="skeuo-rivet absolute top-3 right-3" />
          <div className="h-14 w-14 rounded-2xl skeuo-btn-secondary flex items-center justify-center text-sky-600 shadow-md shrink-0 border border-slate-300">
            <Heart className="h-7 w-7 text-sky-600" />
          </div>
          <div>
            <span className="block text-3xl font-black text-slate-900 font-mono tracking-tight skeuo-embossed-text">{totalWaiting}</span>
            <span className="text-xs font-bold uppercase tracking-wider text-sky-800 font-mono">Patients In OPD Queue</span>
            <span className="block text-xs text-slate-500 font-semibold mt-0.5">Triage intake waiting for consultation</span>
          </div>
        </div>

        <div className="skeuo-card p-6 flex items-center gap-5 skeuo-card-hover relative overflow-hidden">
          <span className="skeuo-rivet absolute top-3 right-3" />
          <div className="h-14 w-14 rounded-2xl skeuo-btn-secondary flex items-center justify-center text-emerald-600 shadow-md shrink-0 border border-slate-300">
            <Clock className="h-7 w-7 text-emerald-600" />
          </div>
          <div>
            <span className="block text-3xl font-black text-slate-900 font-mono tracking-tight skeuo-embossed-text">{totalTreating}</span>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 font-mono">Active Consultations</span>
            <span className="block text-xs text-slate-500 font-semibold mt-0.5">Patients currently with clinicians</span>
          </div>
        </div>

        <div className="skeuo-card p-6 flex items-center gap-5 skeuo-card-hover relative overflow-hidden">
          <span className="skeuo-rivet absolute top-3 right-3" />
          <div className="h-14 w-14 rounded-2xl skeuo-btn-secondary flex items-center justify-center text-amber-600 shadow-md shrink-0 border border-slate-300">
            <AlertCircle className="h-7 w-7 text-amber-600" />
          </div>
          <div>
            <span className="block text-3xl font-black text-slate-900 font-mono tracking-tight skeuo-embossed-text">{pausedCount}</span>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800 font-mono">Clinic Overload Alerts</span>
            <span className="block text-xs text-slate-500 font-semibold mt-0.5">Departments at max capacity</span>
          </div>
        </div>
      </div>

      {/* Clinical Activity & Medical Inventory Quick Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Recent Medical Activity */}
        <div className="skeuo-card p-6 space-y-4 relative">
          <span className="skeuo-rivet absolute top-3 right-3" />
          <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
            <h3 className="font-mono font-bold text-sm text-sky-800 flex items-center gap-2 skeuo-embossed-text">
              <span className="skeuo-led skeuo-led-cyan" />
              <FileText className="h-4 w-4 text-sky-600" />
              RECENT CLINICAL ACTIVITY LOG
            </h3>
            <span className="text-[10px] font-mono text-slate-500 font-bold">REAL-TIME</span>
          </div>
          <div className="space-y-3 font-mono text-xs">
            {db.auditLogs && db.auditLogs.length > 0 ? (
              db.auditLogs.slice(0, 3).map((log, index) => (
                <div key={index} className="skeuo-inset p-3.5 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900 block">{log.action}</span>
                    <span className="text-slate-600 text-[11px] font-medium">{log.actor} · {log.desc}</span>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 text-sky-800 font-bold shadow-xs">{log.time}</span>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-slate-400 border border-dashed border-slate-300 rounded-xl">
                No recent clinical activity recorded yet.
              </div>
            )}
          </div>
        </div>

        {/* Active Medical Inventory & Prescriptions */}
        <div className="skeuo-card p-6 space-y-4 relative">
          <span className="skeuo-rivet absolute top-3 right-3" />
          <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
            <h3 className="font-mono font-bold text-sm text-sky-800 flex items-center gap-2 skeuo-embossed-text">
              <span className="skeuo-led skeuo-led-green" />
              <Pill className="h-4 w-4 text-emerald-600" />
              ACTIVE PHARMACY MEDICATIONS
            </h3>
            <span className="text-[10px] font-mono text-slate-500 font-bold">DISPENSED DISPATCH</span>
          </div>
          <div className="space-y-3 font-mono text-xs">
            {pharmacyOrders && pharmacyOrders.length > 0 ? (
              pharmacyOrders.slice(0, 3).map(order => (
                <div key={order.id} className="skeuo-inset p-3.5 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900 block">{order.tokenNumber}</span>
                    <span className="text-slate-600 text-[11px] font-medium">{order.medicines.join(", ")}</span>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-white border border-emerald-300 text-emerald-800 font-bold shadow-xs">{order.status}</span>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-slate-400 border border-dashed border-slate-300 rounded-xl">
                No active dispensary prescriptions in queue.
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Clinical Workspace Portals */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-slate-300 pb-3">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight skeuo-embossed-text">
              Hospital Clinical Command Portals
            </h2>
            <p className="text-sm text-slate-600 font-medium mt-0.5">
              Select a specialized workspace module to execute patient triage, clinic queue management, or hospital administration.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {portals.map((portal) => {
            const IconComponent = portal.icon;
            return (
              <Card key={portal.path} hoverLift={true} rivets={true} className="flex flex-col h-full border border-white/95">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold px-3 py-1 rounded-lg border uppercase tracking-wider bg-white text-slate-800 border-slate-300 shadow-[inset_0_1px_1px_#ffffff,2px_2px_5px_#cad4e2]">
                      {portal.badgeText}
                    </span>
                    <div className="h-11 w-11 rounded-xl skeuo-btn-secondary flex items-center justify-center text-sky-700 shadow-md border border-slate-300">
                      <IconComponent className="h-5 w-5" />
                    </div>
                  </div>
                  <CardTitle className="mt-4 text-2xl font-black text-slate-900 tracking-tight skeuo-embossed-text">{portal.title}</CardTitle>
                  <CardDescription className="text-sm text-slate-600 font-medium leading-relaxed mt-1">{portal.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow flex flex-col justify-end pt-6">
                  <Link to={portal.path} className="w-full">
                    <Button variant="primary" className="w-full justify-between py-3.5 text-base group">
                      <span>{portal.buttonText}</span>
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                  {portal.path === "/patient" && (
                    <p className="text-center text-xs text-slate-500 mt-2.5 font-medium">
                      Don't have an account?{" "}
                      <Link to="/register" className="text-sky-700 font-bold hover:underline">
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
