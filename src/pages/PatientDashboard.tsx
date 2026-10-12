import React from "react";
import { useNavigate } from "react-router-dom";
import { 
  Sparkles, 
  ArrowRight, 
  Clock, 
  Ticket, 
  AlertCircle, 
  XCircle, 
  Users, 
  ClipboardPlus, 
  Stethoscope, 
  FileClock, 
  UserCheck,
  Video,
  Pill,
  FlaskConical
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { TriageRuleCard } from "../components/ui/TriageRuleCard";
import { QRCodeTicket } from "../components/ui/QRCodeTicket";
import { useMockDB } from "../hooks/useMockDB";
import { logEvent, readDB } from "../utils/mockState";
import { getQueuePosition, calculateEstimatedWaitTime, formatSubmittedTime } from "../utils/queueEngine";
import { predictPatientWaitTime } from "../utils/aiForecastEngine";
import { generateVirtualRoomUrl } from "../utils/telehealthEngine";
import { getActivePharmacyOrders, getActiveLabOrders } from "../utils/pharmacyLabEngine";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { LanguageSwitcher } from "../components/ui/LanguageSwitcher";

export const PatientDashboard: React.FC = () => {
  const navigate = useNavigate();
  const db = useMockDB();
  const { profile, user } = useAuth();
  const { t } = useLanguage();

  const patientName = profile?.fullName ?? user?.email?.split("@")[0] ?? "Guest";
  
  // Find current active visit for this patient
  const activeVisit = db.activeVisits.find(
    v => v.patientName === patientName && 
    v.status !== "COMPLETED" && 
    v.status !== "NO_SHOW" && 
    v.status !== "CANCELLED"
  );

  // Retrieve department metadata for active visit
  const activeDept = activeVisit 
    ? db.departments.find(d => d.code === activeVisit.departmentCode) 
    : null;

  // Calculate live queue position & wait time
  const queuePos = activeVisit && activeDept 
    ? getQueuePosition(activeVisit.tokenNumber, activeDept.nextTokens) 
    : -1;

  const dynamicEstWait = queuePos > 0 
    ? calculateEstimatedWaitTime(queuePos - 1, 6)
    : activeDept?.wait || "Calculating";

  const previousVisits = [
    { id: "p_1", date: "July 24, 2026", department: "Cardiology", status: t("patient.statusCompleted"), token: "C-012" },
    { id: "p_2", date: "June 11, 2026", department: "Pediatrics", status: t("patient.statusCompleted"), token: "P-044" }
  ];

  // Resolve dynamic completed visits from localStorage
  const completedVisits = db.activeVisits
    .filter(
      v => v.patientName === patientName && 
      (v.status === "COMPLETED" || v.status === "NO_SHOW" || v.status === "CANCELLED")
    )
    .map(v => ({
      id: v.id,
      date: `Today, ${formatSubmittedTime(v.submittedAt)}`,
      department: db.departments.find(d => d.code === v.departmentCode)?.name || v.departmentCode,
      status: v.status === "COMPLETED" ? t("patient.statusCompleted") : v.status === "NO_SHOW" ? t("patient.statusNoShow") : t("patient.statusCancelled"),
      token: v.tokenNumber
    }));

  const allVisits = [...completedVisits, ...previousVisits];

  const cancelActiveVisit = () => {
    if (!activeVisit) return;
    const currentDB = readDB();
    
    // Remove patient from department nextTokens list
    currentDB.departments = currentDB.departments.map(d => {
      if (d.code === activeVisit.departmentCode) {
        return {
          ...d,
          waiting: Math.max(0, d.waiting - 1),
          nextTokens: d.nextTokens.filter(t => t !== activeVisit.tokenNumber)
        };
      }
      return d;
    });

    // Update active visit status
    currentDB.activeVisits = currentDB.activeVisits.map(v => {
      if (v.id === activeVisit.id) {
        return { ...v, status: "CANCELLED" as const };
      }
      return v;
    });

    localStorage.setItem("opdflow_mock_db", JSON.stringify(currentDB));
    window.dispatchEvent(new CustomEvent("opdflow_db_update"));

    logEvent(patientName, "VISIT_CANCELLED", `Patient voluntarily cancelled active visit token ${activeVisit.tokenNumber}.`);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Header and User greeting */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-lg border border-slate-200/80 shadow-premium">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-600 uppercase tracking-wider">{t("patient.hubTitle")}</span>
            <Badge variant="neutral">Phase 15 · Pharmacy & Lab Routing</Badge>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mt-1">
            {t("patient.greeting")}, {patientName}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {profile?.gender && <span>{profile.gender} · </span>}
            {profile?.dateOfBirth && (
              <span>DOB: {profile.dateOfBirth} · </span>
            )}
            {profile?.phone && <span>{profile.phone}</span>}
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Header Language Control */}
          <div className="flex items-center gap-2 bg-teal-50/70 border border-teal-200/80 p-2 rounded-xl">
            <LanguageSwitcher />
            <span className="text-[11px] font-medium text-teal-800 hidden md:inline">
              {t("lang.helperMessage")}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100 shadow-sm">
            <UserCheck className="h-4 w-4" />
            <span>{t("patient.profileVerified")}</span>
          </div>
        </div>
      </div>

      {/* Triage Reference Rules Sheet */}
      <TriageRuleCard />

      {/* Main Grid: Active Queue Intake & Current Token */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left/Middle Column: Primary Call To Action */}
        <div className="md:col-span-2 space-y-6">
          <Card className="border-teal-100 bg-gradient-to-br from-white to-teal-50/10">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-teal-100 flex items-center justify-center text-teal-600 mb-2">
                <ClipboardPlus className="h-7 w-7" />
              </div>
              <CardTitle className="text-xl">{t("patient.symptomTitle")}</CardTitle>
              <CardDescription>
                {t("patient.symptomDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-500 space-y-2">
                <div className="flex gap-2 text-amber-700 font-semibold">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{t("patient.disclaimerTitle")}</span>
                </div>
                <p>
                  {t("patient.disclaimerDesc")}
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={() => navigate("/triage")} 
                disabled={!!activeVisit}
                className="w-full sm:w-auto shadow-md"
              >
                <Stethoscope className="h-4 w-4 mr-1.5" />
                <span>{t("patient.startAssessment")}</span>
                <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            </CardFooter>
          </Card>

          {/* Previous Visits Table */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-800 tracking-tight flex items-center gap-2">
              <FileClock className="h-5 w-5 text-teal-600" />
              <span>{t("patient.previousVisits")}</span>
            </h2>
            
            <div className="space-y-3">
              {allVisits.map((visit) => (
                <div 
                  key={visit.id} 
                  className="bg-white border border-slate-200/80 rounded-md p-4 flex justify-between items-center text-sm shadow-sm"
                >
                  <div className="space-y-1">
                    <span className="block font-semibold text-slate-800">{visit.department}</span>
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {visit.date}
                    </span>
                  </div>
                  <div className="text-right space-y-1">
                    <Badge variant="success">{visit.status}</Badge>
                    <span className="block text-xs text-slate-400 font-mono">Token: {visit.token}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Active Visit / Token Ticket (Connected to useMockDB) */}
        <div>
          <h2 className="text-lg font-bold text-slate-800 tracking-tight mb-4 flex items-center gap-2">
            <Ticket className="h-5 w-5 text-slate-400" />
            <span>{t("patient.activeTokenStatus")}</span>
          </h2>

          {activeVisit ? (
            /* High Fidelity OPD Ticket Card */
            <Card className="border-teal-200 border-2 overflow-hidden shadow-lg p-0 relative bg-white">
              {/* Ticket header */}
              <div className="bg-teal-700 text-white px-5 py-4 flex justify-between items-center">
                <div>
                  <span className="text-[10px] font-bold tracking-wider uppercase text-teal-200">{t("patient.opdTicket")}</span>
                  <h4 className="font-extrabold text-sm uppercase mt-0.5 tracking-tight">{activeDept?.name || activeVisit.departmentCode}</h4>
                </div>
                <Badge variant={activeVisit.priority}>{activeVisit.priorityText}</Badge>
              </div>

              {/* Ticket body */}
              <div className="p-5 text-center space-y-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">{t("patient.yourTokenNumber")}</span>
                  <span className="text-5xl font-black text-slate-800 font-mono tracking-tight block">{activeVisit.tokenNumber}</span>
                </div>

                {/* Queue Position Pill */}
                {queuePos > 0 ? (
                  <div className="space-y-2">
                    <div className="bg-teal-50 border border-teal-200 rounded-lg py-2 px-3 flex items-center justify-center gap-2 text-teal-800 text-xs font-bold shadow-xs">
                      <Users className="h-4 w-4 text-teal-600" />
                      <span>{t("patient.queuePosition")}: #{queuePos} ({queuePos - 1} {t("patient.ahead")})</span>
                    </div>

                    {/* AI Predictive Forecast Card */}
                    {(() => {
                      const forecast = predictPatientWaitTime(activeVisit.tokenNumber, activeVisit.departmentCode, db.activeVisits, db.departments);
                      return (
                        <div className="bg-indigo-900 text-white rounded-xl p-3 text-left space-y-1 shadow-sm">
                          <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-indigo-300">
                            <span className="flex items-center gap-1">
                              <Sparkles className="h-3 w-3 text-amber-400" /> AI Wait Forecast
                            </span>
                            <span className="bg-indigo-800 px-1.5 py-0.5 rounded text-teal-300 font-mono">
                              {forecast.confidenceScore}% Accuracy
                            </span>
                          </div>
                          <div className="flex justify-between items-center font-extrabold text-sm pt-0.5">
                            <span className="text-white">Predicted Call: {forecast.predictedTurnTime}</span>
                            <span className="text-amber-300 text-xs font-semibold">~{forecast.estimatedWaitMinutes} mins</span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="bg-indigo-50 border border-indigo-200 rounded-lg py-2 px-3 text-indigo-800 text-xs font-bold">
                      {t("patient.currentlyCalled")}
                    </div>
                    {/* Tele-Health Video Call Button */}
                    {(() => {
                      const room = generateVirtualRoomUrl(activeVisit.tokenNumber, activeVisit.departmentCode);
                      return (
                        <Button
                          size="sm"
                          onClick={() => window.open(room.roomUrl, "_blank")}
                          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          <Video className="h-4 w-4 text-amber-300" />
                          <span>{t("patient.joinVideoCall")}</span>
                        </Button>
                      );
                    })()}
                  </div>
                )}

                {/* Symptom summary chips */}
                {activeVisit.mainSymptom && (
                  <div className="flex items-center justify-center flex-wrap gap-1.5">
                    {activeVisit.mainSymptom.split(", ").map((s, i) => (
                      <span key={i} className="inline-flex items-center px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold">
                        {s}
                      </span>
                    ))}
                  </div>
                )}

                {/* Priority severity bar */}
                <div className="space-y-1">
                  {(() => {
                    const barConfig: Record<string, { width: string; color: string; label: string }> = {
                      p1: { width: "w-full",   color: "bg-rose-500",   label: "Critical — Immediate" },
                      p2: { width: "w-3/4",    color: "bg-orange-400", label: "High Urgency" },
                      p3: { width: "w-1/2",    color: "bg-amber-400",  label: "Moderate" },
                      p4: { width: "w-1/4",    color: "bg-teal-500",   label: "Routine" },
                    };
                    const bar = barConfig[activeVisit.priority] ?? barConfig.p4;
                    return (
                      <>
                        <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          <span>{t("patient.urgencyLevel")}</span>
                          <span className="font-semibold">{activeVisit.priorityText}</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2">
                          <div className={`${bar.width} ${bar.color} h-2 rounded-full transition-all duration-500`} />
                        </div>
                      </>
                    );
                  })()}
                </div>

                <div className="flex justify-between items-center text-xs border-y border-slate-100 py-3 px-2">
                  <div className="text-left">
                    <span className="text-slate-400 block text-[9px] uppercase font-bold">{t("patient.status")}</span>
                    <span className="font-bold text-teal-700 uppercase tracking-wide">{activeVisit.status}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 block text-[9px] uppercase font-bold">{t("patient.estWait")}</span>
                    <span className="font-bold text-slate-700">{dynamicEstWait}</span>
                  </div>
                </div>

                {/* Interactive Digital QR Pass */}
                <QRCodeTicket visit={activeVisit} departmentName={activeDept?.name} />
              </div>

              {/* Cancel Button */}
              <div className="bg-slate-50 border-t border-slate-100 py-3.5 px-5 flex justify-center">
                <button 
                  onClick={cancelActiveVisit}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-800 hover:underline active-shrink focus:outline-none"
                >
                  <XCircle className="h-4 w-4" />
                  <span>{t("patient.cancelToken")}</span>
                </button>
              </div>
            </Card>
          ) : (
            <Card className="border-dashed border-2 border-slate-300 bg-slate-50/50 flex flex-col justify-center items-center py-12 text-center">
              <div className="h-16 w-16 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 mb-4 animate-pulse">
                <Ticket className="h-8 w-8" />
              </div>
              <h3 className="font-semibold text-slate-700">{t("patient.noActiveTicket")}</h3>
              <p className="text-xs text-slate-400 max-w-[200px] mt-1.5 leading-relaxed">
                {t("patient.noActiveTicketDesc")}
              </p>
              <Button 
                onClick={() => navigate("/triage")} 
                size="sm" 
                className="mt-5 shadow-sm"
              >
                {t("patient.getOpdToken")}
              </Button>
            </Card>
          )}

          {/* Post-Consultation Pharmacy Dispensary Ticket */}
          {(() => {
            const pharmacyOrders = getActivePharmacyOrders();
            if (pharmacyOrders.length === 0) return null;
            const order = pharmacyOrders[0];
            return (
              <Card className="border-teal-200 bg-gradient-to-br from-white to-teal-50/20 shadow-sm p-4 space-y-3">
                <div className="flex justify-between items-center border-b border-teal-100 pb-2">
                  <div className="flex items-center gap-2">
                    <Pill className="h-4 w-4 text-teal-600" />
                    <span className="font-bold text-xs text-slate-800 uppercase tracking-wider">{t("pass.pharmacyTitle")}</span>
                  </div>
                  <Badge variant="success">{order.tokenNumber}</Badge>
                </div>
                <div className="text-xs space-y-1">
                  <span className="text-slate-500 font-semibold block">{t("pass.pickupLocation")}</span>
                  <span className="font-bold text-slate-800 block">{order.counterRoom}</span>
                  <div className="pt-1.5 flex flex-wrap gap-1">
                    {order.medicines.map((m, idx) => (
                      <span key={idx} className="bg-white border border-teal-200 text-teal-800 text-[10px] font-bold px-2 py-0.5 rounded">
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              </Card>
            );
          })()}

          {/* Post-Consultation Pathology Lab Sample Ticket */}
          {(() => {
            const labOrders = getActiveLabOrders();
            if (labOrders.length === 0) return null;
            const order = labOrders[0];
            return (
              <Card className="border-violet-200 bg-gradient-to-br from-white to-violet-50/20 shadow-sm p-4 space-y-3">
                <div className="flex justify-between items-center border-b border-violet-100 pb-2">
                  <div className="flex items-center gap-2">
                    <FlaskConical className="h-4 w-4 text-violet-600" />
                    <span className="font-bold text-xs text-slate-800 uppercase tracking-wider">{t("pass.labTitle")}</span>
                  </div>
                  <Badge variant="secondary" className="bg-violet-100 text-violet-800">{order.tokenNumber}</Badge>
                </div>
                <div className="text-xs space-y-1">
                  <span className="text-slate-500 font-semibold block">{t("pass.sampleDesk")}</span>
                  <span className="font-bold text-slate-800 block">{order.counterRoom}</span>
                  <div className="pt-1.5 flex flex-wrap gap-1">
                    {order.tests.map((tItem, idx) => (
                      <span key={idx} className="bg-white border border-violet-200 text-violet-800 text-[10px] font-bold px-2 py-0.5 rounded">
                        {tItem}
                      </span>
                    ))}
                  </div>
                </div>
              </Card>
            );
          })()}
        </div>

      </div>

    </div>
  );
};

export const PatientPlaceholder = PatientDashboard;
