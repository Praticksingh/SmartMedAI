import React, { useState, useEffect } from "react";
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
  Video,
  Pill,
  FlaskConical,
  Edit3
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
import { TelehealthModal } from "../components/ui/TelehealthModal";

export const PatientDashboard: React.FC = () => {
  const navigate = useNavigate();
  const db = useMockDB();
  const { profile, user, updateProfile } = useAuth();
  const { t } = useLanguage();

  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [editFullName, setEditFullName] = useState("");
  const [editDob, setEditDob] = useState("");
  const [editGender, setEditGender] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSaveError, setProfileSaveError] = useState("");
  const [profileSaveSuccess, setProfileSaveSuccess] = useState("");

  useEffect(() => {
    if (profile) {
      setEditFullName(profile.fullName || "");
      setEditDob(profile.dateOfBirth && profile.dateOfBirth !== "1995-01-01" ? profile.dateOfBirth : "");
      setEditGender(profile.gender && profile.gender !== "Unspecified" ? profile.gender : "");
      setEditPhone(profile.phone && !profile.phone.includes("0000") && !profile.phone.includes("1111") ? profile.phone : "");
    }
  }, [profile, isEditProfileOpen]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaveError("");
    setProfileSaveSuccess("");
    if (!editFullName.trim()) { setProfileSaveError("Please enter your full name."); return; }
    if (!editDob) { setProfileSaveError("Please enter your date of birth."); return; }
    if (!editGender) { setProfileSaveError("Please select your gender."); return; }
    if (!editPhone.trim()) { setProfileSaveError("Please enter your mobile number."); return; }

    setIsSavingProfile(true);
    const res = await updateProfile({
      fullName: editFullName.trim(),
      dateOfBirth: editDob,
      gender: editGender,
      phone: editPhone.trim(),
    });
    setIsSavingProfile(false);

    if (res.error) {
      setProfileSaveError(res.error);
      return;
    }

    setProfileSaveSuccess("Profile updated successfully!");
    setTimeout(() => {
      setIsEditProfileOpen(false);
      setProfileSaveSuccess("");
    }, 1200);
  };

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

  const allVisits = completedVisits;

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
    <div className="space-y-8 animate-in fade-in duration-300 text-slate-800">
      
      {/* Header and User greeting - Skeuomorphic Raised Plate */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 skeuo-card p-6 relative">
        <span className="skeuo-rivet absolute top-3 left-3" />
        <span className="skeuo-rivet absolute top-3 right-3" />
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-sky-800 uppercase tracking-wider font-mono skeuo-engraved-text">{t("patient.hubTitle")}</span>
            <span className="px-2.5 py-0.5 rounded-lg bg-sky-100 border border-sky-300 text-sky-800 font-mono text-xs font-bold shadow-xs">
              Phase 15 · Pharmacy & Lab Routing
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 mt-1 skeuo-embossed-text">
            {t("patient.greeting")}, {patientName}
          </h1>
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-600 mt-1 font-medium">
            {profile?.gender ? (
              <span className="font-bold text-slate-700">{profile.gender} · </span>
            ) : null}
            {profile?.dateOfBirth ? (
              <span>DOB: <strong className="text-slate-800 font-bold">{profile.dateOfBirth}</strong> · </span>
            ) : (
              <span className="text-amber-700 font-bold">DOB: Not provided · </span>
            )}
            {profile?.phone ? (
              <span>Mobile: <strong className="text-slate-800 font-bold">{profile.phone}</strong></span>
            ) : (
              <span className="text-amber-700 font-bold">Mobile: Not provided</span>
            )}
            <button
              type="button"
              onClick={() => setIsEditProfileOpen(true)}
              className="text-sky-700 hover:text-sky-900 font-bold underline ml-1.5 cursor-pointer"
            >
              (Edit / Add)
            </button>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Header Language Control */}
          <div className="flex items-center gap-2 skeuo-inset p-2 rounded-xl">
            <LanguageSwitcher />
            <span className="text-[11px] font-bold text-slate-700 hidden md:inline">
              {t("lang.helperMessage")}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsEditProfileOpen(true)}
            className="skeuo-btn skeuo-btn-secondary px-3.5 py-2 text-xs font-bold text-slate-800 flex items-center gap-1.5 cursor-pointer"
          >
            <Edit3 className="h-3.5 w-3.5 text-sky-600" />
            <span>Edit Profile</span>
          </button>
        </div>
      </div>

      {/* Incomplete profile prompt banner */}
      {(!profile?.dateOfBirth || !profile?.phone || !profile?.gender) && (
        <div className="skeuo-card-amber p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-800 shrink-0 font-bold shadow-xs">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-black text-amber-950 uppercase tracking-tight">Incomplete Patient Demographics</h4>
              <p className="text-xs text-amber-900 mt-0.5 font-medium">
                Please add your Date of Birth and Mobile Number so clinical staff and OPD queue engines can properly prioritize your care.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => setIsEditProfileOpen(true)}
            className="skeuo-btn skeuo-btn-primary bg-amber-600 border-amber-700 text-white shrink-0 cursor-pointer"
          >
            Add DOB & Mobile
          </Button>
        </div>
      )}

      {/* Triage Reference Rules Sheet */}
      <TriageRuleCard />

      {/* Main Grid: Active Queue Intake & Current Token */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left/Middle Column: Primary Call To Action */}
        <div className="md:col-span-2 space-y-6">
          <Card hoverLift rivets className="border border-white/95">
            <CardHeader>
              <div className="h-12 w-12 rounded-xl skeuo-btn-primary flex items-center justify-center text-white mb-2 shadow-md">
                <ClipboardPlus className="h-6 w-6" />
              </div>
              <CardTitle className="text-xl skeuo-embossed-text">{t("patient.symptomTitle")}</CardTitle>
              <CardDescription className="text-slate-600 font-medium">
                {t("patient.symptomDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-4 skeuo-inset text-xs text-slate-600 space-y-2">
                <div className="flex gap-2 text-amber-800 font-bold">
                  <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
                  <span>{t("patient.disclaimerTitle")}</span>
                </div>
                <p className="font-medium leading-relaxed">
                  {t("patient.disclaimerDesc")}
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                variant="primary"
                onClick={() => navigate("/triage")} 
                disabled={!!activeVisit}
                className="w-full sm:w-auto py-3 text-sm"
              >
                <Stethoscope className="h-4 w-4 mr-1.5" />
                <span>{t("patient.startAssessment")}</span>
                <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            </CardFooter>
          </Card>

          {/* Previous Visits Table */}
          <div className="space-y-4">
            <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2 skeuo-embossed-text">
              <span className="skeuo-led skeuo-led-cyan" />
              <FileClock className="h-5 w-5 text-sky-600" />
              <span>{t("patient.previousVisits")}</span>
            </h2>
            
            <div className="space-y-3">
              {allVisits.map((visit) => (
                <div 
                  key={visit.id} 
                  className="skeuo-inset p-4 flex justify-between items-center text-sm"
                >
                  <div className="space-y-1">
                    <span className="block font-bold text-slate-900">{visit.department}</span>
                    <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {visit.date}
                    </span>
                  </div>
                  <div className="text-right space-y-1">
                    <Badge variant="success">{visit.status}</Badge>
                    <span className="block text-xs text-slate-500 font-mono font-bold">Token: {visit.token}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Active Visit / Token Ticket (Connected to useMockDB) */}
        <div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight mb-4 flex items-center gap-2 skeuo-embossed-text">
            <Ticket className="h-5 w-5 text-sky-600" />
            <span>{t("patient.activeTokenStatus")}</span>
          </h2>

          {activeVisit ? (
            /* High Fidelity Skeuomorphic OPD Ticket Card */
            <div className="skeuo-card overflow-hidden p-0 relative border border-white/95">
              <span className="skeuo-rivet absolute top-3 left-3 z-20" />
              <span className="skeuo-rivet absolute top-3 right-3 z-20" />

              {/* Ticket header - Metallic / Console strip */}
              <div className="bg-gradient-to-r from-sky-700 via-blue-700 to-teal-700 text-white px-6 py-4 flex justify-between items-center shadow-md border-b border-sky-600">
                <div>
                  <span className="text-[10px] font-bold tracking-wider uppercase text-sky-200 block font-mono">{t("patient.opdTicket")}</span>
                  <h4 className="font-black text-sm uppercase mt-0.5 tracking-tight text-white">{activeDept?.name || activeVisit.departmentCode}</h4>
                </div>
                <Badge variant={activeVisit.priority}>{activeVisit.priorityText}</Badge>
              </div>

              {/* Ticket body */}
              <div className="p-5 text-center space-y-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block font-mono skeuo-engraved-text">{t("patient.yourTokenNumber")}</span>
                  <span className="text-5xl font-black text-slate-900 font-mono tracking-tight block skeuo-embossed-text">{activeVisit.tokenNumber}</span>
                </div>

                {/* Queue Position Pill */}
                {queuePos > 0 ? (
                  <div className="space-y-2">
                    <div className="skeuo-inset py-2.5 px-3 flex items-center justify-center gap-2 text-sky-900 text-xs font-bold">
                      <Users className="h-4 w-4 text-sky-600" />
                      <span>{t("patient.queuePosition")}: #{queuePos} ({queuePos - 1} {t("patient.ahead")})</span>
                    </div>

                    {/* AI Predictive Forecast Card - Skeuomorphic LCD Display */}
                    {(() => {
                      const forecast = predictPatientWaitTime(activeVisit.tokenNumber, activeVisit.departmentCode, db.activeVisits, db.departments);
                      return (
                        <div className="skeuo-screen p-3.5 text-left space-y-1 text-sky-300">
                          <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-sky-400 relative z-10">
                            <span className="flex items-center gap-1.5 font-mono">
                              <span className="skeuo-led skeuo-led-cyan animate-pulse" />
                              <Sparkles className="h-3 w-3 text-sky-300" /> AI Wait Forecast
                            </span>
                            <span className="bg-sky-950/80 border border-sky-500/40 px-2 py-0.5 rounded-lg text-emerald-300 font-mono text-[10px]">
                              {forecast.confidenceScore}% Accuracy
                            </span>
                          </div>
                          <div className="flex justify-between items-center font-black text-sm pt-0.5 relative z-10">
                            <span className="text-white font-mono">Predicted Call: {forecast.predictedTurnTime}</span>
                            <span className="text-amber-300 text-xs font-mono font-bold">~{forecast.estimatedWaitMinutes} mins</span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="skeuo-card-highlight p-3 text-emerald-900 text-xs font-bold flex items-center justify-center gap-2">
                      <span className="skeuo-led skeuo-led-green animate-pulse" />
                      <span>{t("patient.currentlyCalled")}</span>
                    </div>
                    {/* Tele-Health Video Call Button */}
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setIsVideoModalOpen(true)}
                      className="w-full text-xs font-bold"
                    >
                      <Video className="h-4 w-4 mr-1.5" />
                      <span>{t("patient.joinVideoCall")}</span>
                    </Button>
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
            </div>
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

      {/* Edit Profile & Demographics Modal */}
      {isEditProfileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-teal-600 to-teal-700 px-6 py-5 text-white flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold">Patient Profile & Demographics</h3>
                <p className="text-xs text-teal-100 mt-0.5">Update your DOB, mobile number, and personal details</p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditProfileOpen(false)}
                className="text-teal-200 hover:text-white rounded-lg p-1 text-xl leading-none cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="p-6 space-y-4">
              {profileSaveError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
                  {profileSaveError}
                </div>
              )}
              {profileSaveSuccess && (
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 font-medium">
                  {profileSaveSuccess}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editFullName}
                  onChange={e => setEditFullName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  placeholder="e.g. Prabhat Vishwakarma"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    required
                    value={editDob}
                    onChange={e => setEditDob(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Gender</label>
                  <select
                    required
                    value={editGender}
                    onChange={e => setEditGender(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none bg-white"
                  >
                    <option value="">Select...</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile Number</label>
                <input
                  type="tel"
                  required
                  value={editPhone}
                  onChange={e => setEditPhone(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  placeholder="e.g. +91 98765 43210"
                />
                <span className="text-[11px] text-slate-400 mt-0.5 block">Used for OPD queue alerts and SMS token updates</span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditProfileOpen(false)}
                  disabled={isSavingProfile}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  isLoading={isSavingProfile}
                  className="bg-teal-600 hover:bg-teal-700 text-white"
                >
                  Save Profile
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Patient Telehealth Video Call In-App Modal */}
      {activeVisit && (
        <TelehealthModal
          isOpen={isVideoModalOpen}
          onClose={() => setIsVideoModalOpen(false)}
          tokenNumber={activeVisit.tokenNumber}
          departmentCode={activeVisit.departmentCode}
          roomUrl={generateVirtualRoomUrl(activeVisit.tokenNumber, activeVisit.departmentCode).roomUrl}
          patientName={patientName}
        />
      )}

    </div>
  );
};

export const PatientPlaceholder = PatientDashboard;
