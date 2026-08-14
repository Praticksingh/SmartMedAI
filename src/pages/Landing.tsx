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
      accent: "from-cyan-500 to-blue-600"
    },
    {
      title: "Department Staff Hub",
      description: "Manage real-time clinic queues, execute QR scanner check-ins, call next tokens, and issue lab/prescription orders.",
      path: "/staff",
      icon: Users,
      buttonText: "Launch Staff Command",
      badgeText: "Clinical Operations",
      accent: "from-teal-500 to-emerald-600"
    },
    {
      title: "Hospital Command Admin",
      description: "Configure clinic capacities, monitor congestion alerts, execute Code Blue emergency dispatch, and export audit trails.",
      path: "/admin",
      icon: Settings,
      buttonText: "Launch Command Center",
      badgeText: "Hospital Administration",
      accent: "from-amber-500 to-orange-600"
    },
    {
      title: "Public Waiting Room TV Display",
      description: "Wall-mounted broadcast display showing live queue position, calling tokens to counters with multi-lingual voice announcements.",
      path: "/public-display",
      icon: Tv,
      buttonText: "Open TV Broadcast",
      badgeText: "Kiosk Broadcast",
      accent: "from-purple-500 to-indigo-600"
    }
  ];

  return (
    <div className="space-y-10 animate-in fade-in duration-300 pb-12 text-slate-100">
      
      {/* NovaHealth Top Medical Analysis Hero Header */}
      <div className="med-card-glowing rounded-3xl p-6 sm:p-10 relative overflow-hidden border border-cyan-500/40 shadow-glow-cyan">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Column: AI Diagnostics Header */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 text-xs font-mono font-bold tracking-widest uppercase shadow-glow-cyan">
              <Sparkles className="h-4 w-4 text-cyan-400 animate-pulse" />
              <span>NovaHealth AI Medical Command Center</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
              Clinical Intelligence & <span className="text-gradient-cyan">OPD Triage Dashboard</span>
            </h1>

            <p className="text-slate-300 text-base sm:text-lg leading-relaxed font-medium">
              Autonomous OPD queue command platform powered by AI preliminary triage scoring, deterministic priority aging (P1-P4), digital QR passes, real-time congestion monitors, and multi-lingual voice broadcast.
            </p>

            {/* Live Patient Profile Telemetry Strip */}
            <div className="p-4 rounded-2xl bg-[#0B1220]/80 border border-slate-700/80 flex flex-wrap items-center justify-between gap-4 font-mono text-xs">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300 font-bold">
                  AW
                </div>
                <div>
                  <span className="block font-bold text-white text-sm">Alexander Woods</span>
                  <span className="text-slate-400">Male · 35 yrs old · Ref: #NV-8921</span>
                </div>
              </div>
              <div className="flex items-center gap-3 text-slate-300">
                <span className="px-2.5 py-1 rounded bg-slate-800 border border-slate-700">Blood: <strong className="text-cyan-400">O+</strong></span>
                <span className="px-2.5 py-1 rounded bg-slate-800 border border-slate-700">Height: <strong className="text-cyan-400">178 cm</strong></span>
                <span className="px-2.5 py-1 rounded bg-slate-800 border border-slate-700">Weight: <strong className="text-cyan-400">68 kg</strong></span>
              </div>
            </div>
          </div>

          {/* Right Column: NovaHealth Diagnostic Visual Scanner Model */}
          <div className="lg:col-span-5 relative">
            <div className="med-card rounded-2xl p-5 border border-cyan-500/30 space-y-4 shadow-2xl relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2 text-cyan-400 font-mono font-bold text-xs">
                  <Activity className="h-4 w-4 animate-pulse" />
                  <span>AI ANATOMICAL DIAGNOSTIC SCAN</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                  SCAN CONFIDENCE: 98%
                </span>
              </div>

              {/* Anatomical Medical Callouts */}
              <div className="space-y-3 font-mono text-xs">
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 space-y-1">
                  <div className="flex items-center justify-between font-bold">
                    <span className="flex items-center gap-1.5 text-amber-400">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      INFLAMMATION DETECTED
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20">SUPRACLAVICULAR</span>
                  </div>
                  <p className="text-[11px] text-amber-300/80 leading-snug">
                    Tissue inflammation detected in shoulder quadrant. 35% cellular hyper-reactivity noted.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-200 space-y-1">
                  <div className="flex items-center justify-between font-bold">
                    <span className="flex items-center gap-1.5 text-rose-400">
                      <Zap className="h-3.5 w-3.5 animate-pulse" />
                      ANOMALY DETECTED
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300">PRIORITY P1</span>
                  </div>
                  <p className="text-[11px] text-rose-300/80 leading-snug">
                    Irregular vascular pattern detected in upper quadrant. Recommended immediate clinical evaluation.
                  </p>
                </div>
              </div>

              {/* Vital Telemetry Teleport Row */}
              <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
                <div className="p-2.5 rounded-lg bg-[#080C14] border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1.5"><Heart className="h-3.5 w-3.5 text-rose-400" /> Heart Rate</span>
                  <span className="font-bold text-white">82 <span className="text-slate-400 text-[9px]">BPM</span></span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#080C14] border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1.5"><Zap className="h-3.5 w-3.5 text-amber-400" /> Blood Press.</span>
                  <span className="font-bold text-white">122/74</span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#080C14] border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1.5"><Thermometer className="h-3.5 w-3.5 text-cyan-400" /> Temperature</span>
                  <span className="font-bold text-white">37.2 <span className="text-slate-400 text-[9px]">°C</span></span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#080C14] border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1.5"><Wind className="h-3.5 w-3.5 text-emerald-400" /> Respiration</span>
                  <span className="font-bold text-white">18 <span className="text-slate-400 text-[9px]">RPM</span></span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Hospital Metrics Summary Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="med-card rounded-2xl p-6 flex items-center gap-5 hover-lift">
          <div className="h-14 w-14 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-glow-cyan shrink-0">
            <Heart className="h-7 w-7" />
          </div>
          <div>
            <span className="block text-3xl font-black text-white font-mono tracking-tight">{totalWaiting}</span>
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 font-mono">Patients In OPD Queue</span>
            <span className="block text-xs text-slate-400 font-medium mt-0.5">Triage intake waiting for consultation</span>
          </div>
        </div>

        <div className="med-card rounded-2xl p-6 flex items-center gap-5 hover-lift">
          <div className="h-14 w-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-glow-teal shrink-0">
            <Clock className="h-7 w-7" />
          </div>
          <div>
            <span className="block text-3xl font-black text-white font-mono tracking-tight">{totalTreating}</span>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 font-mono">Active Consultations</span>
            <span className="block text-xs text-slate-400 font-medium mt-0.5">Patients currently with clinicians</span>
          </div>
        </div>

        <div className="med-card rounded-2xl p-6 flex items-center gap-5 hover-lift">
          <div className="h-14 w-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-glow-amber shrink-0">
            <AlertCircle className="h-7 w-7" />
          </div>
          <div>
            <span className="block text-3xl font-black text-white font-mono tracking-tight">{pausedCount}</span>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400 font-mono">Clinic Overload Alerts</span>
            <span className="block text-xs text-slate-400 font-medium mt-0.5">Departments at max capacity</span>
          </div>
        </div>
      </div>

      {/* Clinical Activity & Medical Inventory Quick Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Recent Medical Activity */}
        <div className="med-card rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-mono font-bold text-sm text-cyan-400 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              RECENT CLINICAL ACTIVITY LOG
            </h3>
            <span className="text-[10px] font-mono text-slate-400">UPDATED REAL-TIME</span>
          </div>
          <div className="space-y-3 font-mono text-xs">
            <div className="p-3 rounded-xl bg-[#0B1220] border border-slate-800 flex items-center justify-between">
              <div>
                <span className="font-bold text-white block">Blood Test Panel (CBC)</span>
                <span className="text-slate-400 text-[11px]">Patient: John Doe · Dept: Lab</span>
              </div>
              <span className="px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40">PENDING</span>
            </div>
            <div className="p-3 rounded-xl bg-[#0B1220] border border-slate-800 flex items-center justify-between">
              <div>
                <span className="font-bold text-white block">MRI Shoulder Scan</span>
                <span className="text-slate-400 text-[11px]">Patient: Alexander Woods · Radiography</span>
              </div>
              <span className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40">NORMAL</span>
            </div>
            <div className="p-3 rounded-xl bg-[#0B1220] border border-slate-800 flex items-center justify-between">
              <div>
                <span className="font-bold text-white block">ECG Telemetry Monitoring</span>
                <span className="text-slate-400 text-[11px]">Patient: Jane Smith · Cardiology</span>
              </div>
              <span className="px-2.5 py-1 rounded bg-rose-500/20 text-rose-300 font-bold border border-rose-500/40">CRITICAL P1</span>
            </div>
          </div>
        </div>

        {/* Active Medical Inventory & Prescriptions */}
        <div className="med-card rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-mono font-bold text-sm text-cyan-400 flex items-center gap-2">
              <Pill className="h-4 w-4" />
              ACTIVE PHARMACY MEDICATIONS
            </h3>
            <span className="text-[10px] font-mono text-slate-400">DISPENSED DISPATCH</span>
          </div>
          <div className="space-y-3 font-mono text-xs">
            <div className="p-3 rounded-xl bg-[#0B1220] border border-slate-800 flex items-center justify-between">
              <div>
                <span className="font-bold text-white block">Naproxen 500mg</span>
                <span className="text-slate-400 text-[11px]">Anti-inflammatory · Oral 2x Daily</span>
              </div>
              <span className="px-2.5 py-1 rounded bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40">READY</span>
            </div>
            <div className="p-3 rounded-xl bg-[#0B1220] border border-slate-800 flex items-center justify-between">
              <div>
                <span className="font-bold text-white block">Ketorolac Injection 10mg</span>
                <span className="text-slate-400 text-[11px]">Analgesic · Single-dose IV</span>
              </div>
              <span className="px-2.5 py-1 rounded bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40">READY</span>
            </div>
            <div className="p-3 rounded-xl bg-[#0B1220] border border-slate-800 flex items-center justify-between">
              <div>
                <span className="font-bold text-white block">Aspirin 500mg</span>
                <span className="text-slate-400 text-[11px]">Cardioprotective · Daily 30 days</span>
              </div>
              <span className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40">DISPENSED</span>
            </div>
          </div>
        </div>

      </div>

      {/* Clinical Workspace Portals */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight">
              NovaHealth Clinical Command Portals
            </h2>
            <p className="text-sm text-slate-400 font-medium mt-0.5">
              Select a workspace module to execute patient triage, clinic queue management, or hospital administration.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {portals.map((portal) => {
            const IconComponent = portal.icon;
            return (
              <Card key={portal.path} hoverLift={true} className="med-card flex flex-col h-full rounded-2xl border-slate-800 hover:border-cyan-500/60 transition-all duration-300">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 uppercase tracking-wider">
                      {portal.badgeText}
                    </span>
                    <div className="h-10 w-10 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-cyan-400">
                      <IconComponent className="h-5 w-5 text-cyan-400" />
                    </div>
                  </div>
                  <CardTitle className="mt-4 text-2xl font-black text-white tracking-tight">{portal.title}</CardTitle>
                  <CardDescription className="text-sm text-slate-400 font-medium leading-relaxed mt-1">{portal.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow flex items-end pt-6">
                  <Link to={portal.path} className="w-full">
                    <Button variant="outline" className="w-full justify-between bg-slate-900/90 text-slate-200 border-slate-700 hover:border-cyan-400 hover:bg-gradient-cyan hover:text-white font-bold py-3.5 rounded-xl shadow-lg transition-all duration-300 group">
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
