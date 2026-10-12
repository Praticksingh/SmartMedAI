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
  Thermometer,
  Wind,
  FileText,
  Pill,
  AlertTriangle
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { useMockDB } from "../hooks/useMockDB";

export const Landing: React.FC = () => {
  const db = useMockDB();
  
  const totalWaiting = db.departments.reduce((acc, dept) => acc + dept.waiting, 0);
  const totalTreating = db.departments.reduce((acc, dept) => acc + dept.treating, 0);
  const pausedCount = db.departments.filter(dept => dept.status === "PAUSED").length;

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

            {/* Live Patient Profile Telemetry Strip */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-wrap items-center justify-between gap-4 font-mono text-xs">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-sky-100 border border-sky-200 flex items-center justify-center text-sky-700 font-bold">
                  AW
                </div>
                <div>
                  <span className="block font-bold text-slate-900 text-sm">Alexander Woods</span>
                  <span className="text-slate-500">Male · 35 yrs old · Ref: #SM-8921</span>
                </div>
              </div>
              <div className="flex items-center gap-3 text-slate-600">
                <span className="px-2.5 py-1 rounded bg-slate-100 border border-slate-200">Blood: <strong className="text-sky-700">O+</strong></span>
                <span className="px-2.5 py-1 rounded bg-slate-100 border border-slate-200">Height: <strong className="text-sky-700">178 cm</strong></span>
                <span className="px-2.5 py-1 rounded bg-slate-100 border border-slate-200">Weight: <strong className="text-sky-700">68 kg</strong></span>
              </div>
            </div>
          </div>

          {/* Right Column: Diagnostic Visual Scanner Model */}
          <div className="lg:col-span-5 relative">
            <div className="bg-white rounded-2xl p-5 border border-sky-200/80 space-y-4 shadow-md relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 text-sky-700 font-mono font-bold text-xs">
                  <Activity className="h-4 w-4 text-sky-600 animate-pulse" />
                  <span>AI ANATOMICAL DIAGNOSTIC SCAN</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                  CONFIDENCE: 98.4%
                </span>
              </div>

              {/* Anatomical Medical Callouts */}
              <div className="space-y-3 font-mono text-xs">
                <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-900 space-y-1">
                  <div className="flex items-center justify-between font-bold">
                    <span className="flex items-center gap-1.5 text-amber-700">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      INFLAMMATION DETECTED
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">SUPRACLAVICULAR</span>
                  </div>
                  <p className="text-[11px] text-amber-800 leading-snug">
                    Tissue inflammation detected in shoulder quadrant. 35% cellular hyper-reactivity noted.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-200 text-rose-900 space-y-1">
                  <div className="flex items-center justify-between font-bold">
                    <span className="flex items-center gap-1.5 text-rose-700">
                      <Zap className="h-3.5 w-3.5 animate-pulse" />
                      ANOMALY DETECTED
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-100 text-rose-800">PRIORITY P1</span>
                  </div>
                  <p className="text-[11px] text-rose-800 leading-snug">
                    Irregular vascular pattern detected in upper quadrant. Recommended immediate clinical evaluation.
                  </p>
                </div>
              </div>

              {/* Vital Telemetry Teleport Row */}
              <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <span className="text-slate-600 flex items-center gap-1.5"><Heart className="h-3.5 w-3.5 text-rose-500" /> Heart Rate</span>
                  <span className="font-bold text-slate-900">82 <span className="text-slate-500 text-[9px]">BPM</span></span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <span className="text-slate-600 flex items-center gap-1.5"><Zap className="h-3.5 w-3.5 text-amber-500" /> Blood Press.</span>
                  <span className="font-bold text-slate-900">122/74</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <span className="text-slate-600 flex items-center gap-1.5"><Thermometer className="h-3.5 w-3.5 text-sky-500" /> Temperature</span>
                  <span className="font-bold text-slate-900">37.2 <span className="text-slate-500 text-[9px]">°C</span></span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <span className="text-slate-600 flex items-center gap-1.5"><Wind className="h-3.5 w-3.5 text-emerald-500" /> Respiration</span>
                  <span className="font-bold text-slate-900">18 <span className="text-slate-500 text-[9px]">RPM</span></span>
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
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 block">Blood Test Panel (CBC)</span>
                <span className="text-slate-500 text-[11px]">Patient: John Doe · Dept: Pathology Lab</span>
              </div>
              <span className="px-2.5 py-1 rounded bg-amber-100 text-amber-800 font-bold border border-amber-200">PROCESSING</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 block">MRI Shoulder Scan</span>
                <span className="text-slate-500 text-[11px]">Patient: Alexander Woods · Radiography</span>
              </div>
              <span className="px-2.5 py-1 rounded bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">NORMAL</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 block">ECG Telemetry Monitoring</span>
                <span className="text-slate-500 text-[11px]">Patient: Jane Smith · Cardiology</span>
              </div>
              <span className="px-2.5 py-1 rounded bg-rose-100 text-rose-800 font-bold border border-rose-200">CRITICAL P1</span>
            </div>
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
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 block">Naproxen 500mg</span>
                <span className="text-slate-500 text-[11px]">Anti-inflammatory · Oral 2x Daily</span>
              </div>
              <span className="px-2.5 py-1 rounded bg-sky-100 text-sky-800 font-bold border border-sky-200">READY</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 block">Ketorolac Injection 10mg</span>
                <span className="text-slate-500 text-[11px]">Analgesic · Single-dose IV</span>
              </div>
              <span className="px-2.5 py-1 rounded bg-sky-100 text-sky-800 font-bold border border-sky-200">READY</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 block">Aspirin 500mg</span>
                <span className="text-slate-500 text-[11px]">Cardioprotective · Daily 30 days</span>
              </div>
              <span className="px-2.5 py-1 rounded bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">DISPENSED</span>
            </div>
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
                <CardContent className="flex-grow flex items-end pt-6">
                  <Link to={portal.path} className="w-full">
                    <Button className={`w-full justify-between font-bold py-3.5 rounded-xl shadow-md transition-all duration-300 group ${portal.btnClass}`}>
                      <span>{portal.buttonText}</span>
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

    </div>
  );
};
