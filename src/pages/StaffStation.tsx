import React, { useState } from "react";
import { 
  Users, 
  Play, 
  Pause, 
  Coffee, 
  Scan, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  UserPlus, 
  ShieldAlert, 
  SlidersHorizontal, 
  Camera,
  Siren,
  Video
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Dialog } from "../components/ui/dialog";
import { TriageRuleCard } from "../components/ui/TriageRuleCard";
import { QRScannerModal } from "../components/ui/QRScannerModal";
import { useMockDB } from "../hooks/useMockDB";
import { 
  setDepartmentStatus, 
  callNextPatient, 
  completeCurrentPatient, 
  markPatientNoShow,
  overridePatientPriority
} from "../utils/mockState";
import { checkQueueAging, formatSubmittedTime } from "../utils/queueEngine";
import { readEmergencyState } from "../utils/emergencyEngine";
import { generateVirtualRoomUrl } from "../utils/telehealthEngine";
import { useAuth } from "../context/AuthContext";
import { broadcastTokenCall, speakMedicalCall } from "../utils/broadcastEngine";

export const StaffStation: React.FC = () => {
  const [selectedDeptCode, setSelectedDeptCode] = useState("CARD");
  const [isConfirmActionOpen, setIsConfirmActionOpen] = useState(false);
  const [confirmDetails, setConfirmDetails] = useState({ title: "", desc: "", action: () => {} });
  
  // Priority filter & override modal state
  const [priorityFilter, setPriorityFilter] = useState<"ALL" | "p1" | "p2" | "p3" | "p4">("ALL");
  const [isOverrideOpen, setIsOverrideOpen] = useState(false);
  const [overrideTargetToken, setOverrideTargetToken] = useState("");
  const [overrideTargetPriority, setOverrideTargetPriority] = useState<"p1" | "p2" | "p3" | "p4">("p1");
  const [overrideReasonText, setOverrideReasonText] = useState("");

  // QR Intake Scanner Modal State
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);

  const db = useMockDB();
  const { profile, user } = useAuth();

  // Find selected department metadata
  const dept = db.departments.find(d => d.code === selectedDeptCode) || db.departments[0];
  const isQueuePaused = dept.status === "PAUSED";
  const isBreakActive = dept.status === "ON_BREAK";

  const staffName = profile?.fullName ?? user?.email?.split("@")[0] ?? "Staff Member";

  // Resolve currently treating patient info from database
  let currentPatient: any = null;
  if (dept.nowServing) {
    const matchedVisit = db.activeVisits.find(v => v.tokenNumber === dept.nowServing);
    if (matchedVisit) {
      currentPatient = {
        token: matchedVisit.tokenNumber,
        priority: matchedVisit.priority,
        priorityText: matchedVisit.priorityText,
        name: matchedVisit.patientName + " (Anonymized)",
        symptom: matchedVisit.mainSymptom,
        duration: "Just Started"
      };
    } else {
      const fallbackNames: Record<string, string> = {
        "C-027": "Subhash K. (Anonymized)",
        "P-044": "Rohan M. (Anonymized)",
        "D-009": "Kiran J. (Anonymized)",
        "O-018": "Meena S. (Anonymized)"
      };
      
      const priorityCodes: Record<string, "p1" | "p2" | "p3" | "p4"> = {
        "C-027": "p2",
        "P-044": "p3",
        "D-009": "p4",
        "O-018": "p3"
      };

      const priorityTexts = { p1: "P1 Critical", p2: "P2 High", p3: "P3 Moderate", p4: "P4 Routine" };
      const code = priorityCodes[dept.nowServing] || "p4";

      currentPatient = {
        token: dept.nowServing,
        priority: code,
        priorityText: priorityTexts[code],
        name: fallbackNames[dept.nowServing] || "Patient (Anonymized)",
        symptom: "Symptom Intake Complete",
        duration: "12 Mins"
      };
    }
  }

  // Helper to resolve waiting list queue items from token strings
  const getQueueList = () => {
    return dept.nextTokens.map(token => {
      const visit = db.activeVisits.find(v => v.tokenNumber === token);
      if (visit) {
        const aging = checkQueueAging(visit.submittedAt, visit.priority);
        return {
          token: visit.tokenNumber,
          priority: visit.priority,
          priorityText: visit.priorityText,
          wait: `Sub: ${formatSubmittedTime(visit.submittedAt)}`,
          status: visit.status,
          symptom: visit.mainSymptom || "—",
          isAging: aging.isAging,
          waitedMinutes: aging.waitedMinutes
        };
      }
      
      const tokenChar = token.slice(0, 1);
      const isCritical = token.endsWith("8");
      const priorityCode = isCritical ? "p1" : tokenChar === "C" ? "p2" : tokenChar === "P" ? "p2" : "p3";
      const priorityTexts = { p1: "P1 Critical", p2: "P2 High", p3: "P3 Moderate", p4: "P4 Routine" };
      
      return {
        token,
        priority: priorityCode as any,
        priorityText: priorityTexts[priorityCode as "p1" | "p2" | "p3"],
        wait: "Est. 15 Mins",
        status: "WAITING",
        symptom: "Symptom Intake Complete",
        isAging: false,
        waitedMinutes: 0
      };
    });
  };

  const rawQueueList = getQueueList();
  const queueList = priorityFilter === "ALL" 
    ? rawQueueList 
    : rawQueueList.filter(item => item.priority === priorityFilter);

  const triggerConfirmation = (title: string, desc: string, action: () => void) => {
    setConfirmDetails({ title, desc, action });
    setIsConfirmActionOpen(true);
  };

  const openOverrideModal = (token: string, currentPriority: "p1" | "p2" | "p3" | "p4") => {
    setOverrideTargetToken(token);
    setOverrideTargetPriority(currentPriority);
    setOverrideReasonText("");
    setIsOverrideOpen(true);
  };

  const handleConfirmOverride = () => {
    if (!overrideTargetToken || !overrideReasonText.trim()) {
      alert("Please specify a clinical justification reason for the override.");
      return;
    }
    overridePatientPriority(overrideTargetToken, overrideTargetPriority, overrideReasonText, staffName);
    setIsOverrideOpen(false);
  };

  const handlePauseToggle = () => {
    const nextState = isQueuePaused ? "ACTIVE" : "PAUSED";
    triggerConfirmation(
      isQueuePaused ? "Resume OPD Queue?" : "Pause OPD Queue?",
      isQueuePaused
        ? "Resuming will allow calling waiting patients immediately."
        : "Pausing will alert the reception and public dashboard. No new tokens will be called until resumed.",
      () => setDepartmentStatus(dept.code, nextState, staffName)
    );
  };

  const handleBreakToggle = () => {
    const nextState = isBreakActive ? "ACTIVE" : "ON_BREAK";
    triggerConfirmation(
      isBreakActive ? "End Break?" : "Set Department on Break?",
      isBreakActive
        ? "Resuming will clear the lunch/break status."
        : "Marking break will set status to break. The public and admin panels will update to reflect this.",
      () => setDepartmentStatus(dept.code, nextState, staffName)
    );
  };

  const stats = [
    { label: "Waiting in Queue", value: `${dept.waiting} Patients`, color: "text-amber-600" },
    { label: "Currently Treating", value: `${dept.treating} Patient`, color: "text-teal-600" },
    { label: "Clinic Capacity", value: `${dept.currentCapacity} / ${dept.maxCapacity} (Max)`, color: "text-slate-700" },
    { label: "Est. Avg Delay", value: dept.wait, color: "text-slate-500" }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Emergency Alert Bar */}
      {(() => {
        const emergencyState = readEmergencyState();
        const activeCodeBlue = emergencyState.alerts.find(a => a.status === "ACTIVE");
        if (!emergencyState.isDisasterSurgeActive && !activeCodeBlue) return null;
        return (
          <div className="bg-gradient-to-r from-rose-600 to-red-600 text-white p-4 rounded-2xl shadow-md flex items-center gap-3 animate-pulse">
            <Siren className="h-6 w-6 text-amber-200 shrink-0" />
            <div className="text-xs">
              <span className="font-extrabold text-sm text-amber-200 uppercase tracking-wider block">
                {activeCodeBlue ? `🚨 CODE BLUE EMERGENCY — ${activeCodeBlue.departmentCode} (${activeCodeBlue.room})` : "🚨 HOSPITAL DISASTER SURGE ACTIVE"}
              </span>
              <span className="text-rose-100 font-medium">
                {activeCodeBlue ? `Initiated by ${activeCodeBlue.triggeredBy}. Resuscitation team responding.` : emergencyState.surgeReason}
              </span>
            </div>
          </div>
        );
      })()}

      {/* Staff and Department Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-lg border border-slate-200/80 shadow-premium">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-indigo-600 uppercase tracking-wider">Clinical Station</span>
            <Badge variant="secondary">Emergency Command Ready</Badge>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
              {dept.name} &mdash; {dept.room}
            </h1>
            
            {/* Department switcher dropdown */}
            <select
              value={selectedDeptCode}
              onChange={(e) => setSelectedDeptCode(e.target.value)}
              className="text-xs border border-slate-300 bg-slate-50 hover:bg-slate-100 rounded px-2 py-1 text-slate-600 font-semibold focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer"
            >
              {db.departments.map(d => (
                <option key={d.code} value={d.code}>{d.code} Clinic</option>
              ))}
            </select>
          </div>
          <p className="text-xs text-slate-500">
            Logged In: {staffName} | Dept Status: 
            <span className={`font-semibold ml-1.5 ${isQueuePaused ? "text-rose-600" : isBreakActive ? "text-amber-600" : "text-emerald-600"}`}>
              {isQueuePaused ? "PAUSED" : isBreakActive ? "ON LUNCH/BREAK" : "ACTIVE"}
            </span>
          </p>
        </div>

        {/* Action Controls for Department Status */}
        <div className="flex flex-wrap gap-2.5">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handlePauseToggle}
          >
            {isQueuePaused ? <Play className="h-4 w-4 mr-1.5 text-emerald-600" /> : <Pause className="h-4 w-4 mr-1.5 text-rose-500" />}
            <span>{isQueuePaused ? "Resume Queue" : "Pause Queue"}</span>
          </Button>

          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleBreakToggle}
          >
            <Coffee className="h-4 w-4 mr-1.5 text-indigo-500" />
            <span>{isBreakActive ? "End Break" : "Set Break"}</span>
          </Button>
        </div>
      </div>

      {/* Warning Alert if Paused */}
      {isQueuePaused && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-lg flex items-start gap-3 shadow-sm">
          <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-sm">OPD Queue Paused</h4>
            <p className="text-xs text-rose-700 mt-0.5">
              No patients will be routed or called to treatment until the station resumes active status.
            </p>
          </div>
        </div>
      )}

      {/* Triage Guideline sheet for quick verification */}
      <TriageRuleCard />

      {/* Stats Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <Card key={i}>
            <div className="text-center space-y-1">
              <span className="text-xs font-medium text-slate-500 block">{stat.label}</span>
              <span className={`text-2xl font-bold tracking-tight ${stat.color} block`}>{stat.value}</span>
            </div>
          </Card>
        ))}
      </div>

      {/* Operational Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Columns: Current Patient & Waiting List */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Currently Serving Panel */}
          <Card className="border-teal-200 bg-teal-50/5">
            <CardHeader>
              <CardTitle className="text-slate-800 text-lg flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-teal-600" />
                <span>Currently Serving Patient</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {currentPatient ? (
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-white border border-slate-200 rounded-lg gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xl font-bold text-slate-800 tracking-tight">{currentPatient.token}</span>
                      <Badge variant={currentPatient.priority}>{currentPatient.priorityText}</Badge>
                    </div>
                    <span className="block text-sm font-semibold text-slate-700">{currentPatient.name}</span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Chief Complaint:</span>
                      {currentPatient.symptom.split(", ").map((s: string, i: number) => (
                        <span key={i} className="inline-flex items-center px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold">
                          {s}
                        </span>
                      ))}
                    </div>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" /> Treatment duration: {currentPatient.duration}
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto flex-wrap">
                    <Button 
                      variant="outline" 
                      className="sm:w-auto text-xs border-indigo-200 text-indigo-700 bg-indigo-50 hover:bg-indigo-100"
                      onClick={() => {
                        const room = generateVirtualRoomUrl(currentPatient.token, dept.code);
                        window.open(room.roomUrl, "_blank");
                      }}
                    >
                      <Video className="h-3.5 w-3.5 mr-1 text-indigo-600" />
                      <span>Tele-Health Video</span>
                    </Button>

                    <Button 
                      variant="outline" 
                      className="sm:w-auto text-xs"
                      onClick={() => triggerConfirmation(
                        "Mark patient as No-Show?",
                        `Marking ${currentPatient.token} as No-Show will release this consultation room.`,
                        () => markPatientNoShow(dept.code, staffName)
                      )}
                    >
                      Mark No-Show
                    </Button>
                    <Button 
                      className="sm:w-auto text-xs bg-teal-700 text-white"
                      onClick={() => triggerConfirmation(
                        "Complete Consultation?",
                        `Confirm completion of medical check for token ${currentPatient.token}.`,
                        () => completeCurrentPatient(dept.code, staffName)
                      )}
                    >
                      Complete Visit
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="p-6 bg-white border border-slate-200 border-dashed rounded-lg text-center text-sm text-slate-400">
                  No patient currently in treatment room. Click "Call Next Patient" to advance the queue.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Waiting List */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-slate-800 tracking-tight flex items-center gap-2">
                <Users className="h-5 w-5 text-slate-400" />
                <span>Waiting Room Queue ({queueList.length})</span>
              </h2>
              
              <div className="flex items-center gap-2">
                {/* Priority filter buttons */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-semibold">
                  <SlidersHorizontal className="h-3.5 w-3.5 text-slate-400 ml-1" />
                  {(["ALL", "p1", "p2", "p3", "p4"] as const).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPriorityFilter(p)}
                      className={`px-2 py-1 rounded transition-colors ${
                        priorityFilter === p 
                          ? "bg-white text-slate-800 shadow-xs font-bold" 
                          : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      {p === "ALL" ? "All" : p.toUpperCase()}
                    </button>
                  ))}
                </div>

                <Button 
                  size="sm" 
                  disabled={dept.nextTokens.length === 0 || !!dept.nowServing || isQueuePaused || isBreakActive}
                  onClick={() => triggerConfirmation(
                    "Call Next Patient?",
                    "This will advance the queue and call the next eligible patient according to priority. (Priority-based FIFO).",
                    () => {
                      const called = callNextPatient(dept.code, staffName);
                      if (called) {
                        broadcastTokenCall(called, dept.code, dept.name, dept.room);
                        speakMedicalCall(called, dept.name, dept.room);
                      }
                    }
                  )}
                >
                  <UserPlus className="h-4 w-4 mr-1.5" />
                  <span>Call Next Patient</span>
                </Button>
              </div>
            </div>

            {queueList.length > 0 ? (
              <>
                {/* Desktop View Table */}
                <div className="hidden sm:block bg-white border border-slate-200/80 rounded-lg overflow-hidden shadow-sm">
                  <table className="min-w-full divide-y divide-slate-200 text-left text-sm text-slate-600">
                    <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-xs">
                      <tr>
                        <th className="px-4 py-3">Token</th>
                        <th className="px-4 py-3">Priority</th>
                        <th className="px-4 py-3">Chief Complaint</th>
                        <th className="px-4 py-3">Queued</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {queueList.map((patient) => {
                        const priorityBar: Record<string, string> = {
                          p1: "bg-rose-500",
                          p2: "bg-orange-400",
                          p3: "bg-amber-400",
                          p4: "bg-teal-500",
                        };
                        return (
                          <tr key={patient.token} className="hover:bg-slate-50/50">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div className={`w-1 h-8 rounded-full ${priorityBar[patient.priority] ?? "bg-slate-300"}`} />
                                <div>
                                  <span className="font-bold text-slate-800">{patient.token}</span>
                                  {patient.isAging && (
                                    <span className="block text-[9px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200 w-max mt-0.5">
                                      SLA Delayed ({patient.waitedMinutes}m)
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <Badge variant={patient.priority}>{patient.priorityText}</Badge>
                            </td>
                            <td className="px-4 py-3">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold max-w-[160px] truncate">
                                {(patient as any).symptom || "—"}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-xs text-slate-500">{patient.wait}</td>
                            <td className="px-4 py-3 text-right">
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-xs text-slate-600 hover:text-indigo-600 hover:border-indigo-300"
                                onClick={() => openOverrideModal(patient.token, patient.priority)}
                              >
                                <ShieldAlert className="h-3.5 w-3.5 mr-1 text-slate-400" />
                                <span>Override</span>
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile View Stacked Cards */}
                <div className="block sm:hidden space-y-3">
                  {queueList.map((patient) => {
                    const priorityBorder: Record<string, string> = {
                      p1: "border-l-rose-500",
                      p2: "border-l-orange-400",
                      p3: "border-l-amber-400",
                      p4: "border-l-teal-500",
                    };
                    return (
                      <div key={patient.token} className={`bg-white border border-slate-200 border-l-4 ${priorityBorder[patient.priority] ?? "border-l-slate-300"} rounded-lg p-4 space-y-2.5 shadow-sm`}>
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-slate-800 text-base">{patient.token}</span>
                          <Badge variant={patient.priority}>{patient.priorityText}</Badge>
                        </div>
                        {patient.isAging && (
                          <div className="text-xs text-rose-700 font-semibold bg-rose-50 px-2 py-1 rounded border border-rose-200 flex items-center gap-1">
                            <AlertTriangle className="h-3.5 w-3.5" />
                            <span>SLA Breach: Waiting {patient.waitedMinutes} mins</span>
                          </div>
                        )}
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold">
                          {(patient as any).symptom || "—"}
                        </span>
                        <div className="flex justify-between items-center text-xs text-slate-500 pt-2 border-t border-slate-100">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" /> Queued: {patient.wait}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs"
                            onClick={() => openOverrideModal(patient.token, patient.priority)}
                          >
                            <ShieldAlert className="h-3 w-3 mr-1 text-slate-400" />
                            <span>Override</span>
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="p-12 border-2 border-dashed border-slate-200 rounded-lg bg-slate-50/50 text-center text-sm text-slate-400">
                Waiting room is currently empty.
              </div>
            )}

          </div>

        </div>

        {/* Right Column: Physical Flow Scanner Station */}
        <div className="space-y-6">
          <h2 className="text-lg font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <Scan className="h-5 w-5 text-slate-400" />
            <span>QR Scanner Station</span>
          </h2>

          <Card className="border-teal-200 bg-gradient-to-br from-white to-teal-50/30 flex flex-col justify-center items-center py-10 text-center shadow-md">
            <div className="h-16 w-16 rounded-full bg-teal-100 border border-teal-200 flex items-center justify-center text-teal-700 mb-4 animate-pulse">
              <Camera className="h-8 w-8" />
            </div>
            <h3 className="font-semibold text-slate-800">Clinic Door Intake Scanner</h3>
            <p className="text-xs text-slate-500 max-w-[220px] mt-1.5 leading-relaxed">
              Scan patient digital OPD QR passes to verify token authenticity and update status to CHECKED IN.
            </p>
            <Button 
              size="sm" 
              className="mt-5 shadow-sm bg-teal-700 hover:bg-teal-800 text-white"
              onClick={() => setIsQRScannerOpen(true)}
            >
              <Scan className="h-4 w-4 mr-1.5" />
              <span>Launch QR Scanner</span>
            </Button>
          </Card>
        </div>

      </div>

      {/* Confirmation dialogues modal wrapper */}
      <Dialog
        isOpen={isConfirmActionOpen}
        onClose={() => setIsConfirmActionOpen(false)}
        title={confirmDetails.title}
        description={confirmDetails.desc}
        confirmText="Confirm Action"
        onConfirm={confirmDetails.action}
        variant="danger"
      />

      {/* Clinical Priority Override Modal */}
      <Dialog
        isOpen={isOverrideOpen}
        onClose={() => setIsOverrideOpen(false)}
        title={`Override Priority — Token ${overrideTargetToken}`}
        description="Clinical staff can manually escalate or de-escalate patient priority. Every override is logged to the system audit trail."
        confirmText="Submit Clinical Override"
        onConfirm={handleConfirmOverride}
      >
        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
              Select New Priority Tier:
            </label>
            <select
              value={overrideTargetPriority}
              onChange={(e) => setOverrideTargetPriority(e.target.value as any)}
              className="w-full text-sm border border-slate-300 rounded-md px-3 py-2 bg-white text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="p1">P1 Critical — Immediate Consultation Floor</option>
              <option value="p2">P2 High — Urgent Attention Needed</option>
              <option value="p3">P3 Moderate — Standard Priority</option>
              <option value="p4">P4 Routine — Low Priority</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
              Clinical Override Reason (Mandatory Audit):
            </label>
            <textarea
              rows={3}
              value={overrideReasonText}
              onChange={(e) => setOverrideReasonText(e.target.value)}
              placeholder="e.g. Patient exhibits signs of acute respiratory distress / oxygen saturation drop."
              className="w-full text-sm border border-slate-300 rounded-md p-2.5 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>
      </Dialog>

      {/* QR Intake Scanner Station Modal */}
      <QRScannerModal
        isOpen={isQRScannerOpen}
        onClose={() => setIsQRScannerOpen(false)}
        staffName={staffName}
      />

    </div>
  );
};

export const StaffPlaceholder = StaffStation;
