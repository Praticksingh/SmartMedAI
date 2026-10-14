import React, { useState } from "react";
import { 
  Building, 
  Users, 
  Clock, 
  History, 
  PauseCircle, 
  PlayCircle, 
  AlertTriangle, 
  Search, 
  Filter, 
  FileSpreadsheet, 
  FileJson,
  Sparkles,
  Siren,
  Zap,
  ShieldAlert
} from "lucide-react";
import { Card, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Dialog } from "../components/ui/dialog";
import { TriageRuleCard } from "../components/ui/TriageRuleCard";
import { StaffAssignmentModal } from "../components/ui/StaffAssignmentModal";
import { useMockDB } from "../hooks/useMockDB";
import { setDepartmentStatus, addDepartment, resetDB } from "../utils/mockState";
import { calculateDepartmentCongestion, calculateHospitalOverview } from "../utils/congestionEngine";
import { filterAuditLogs, exportAuditLogsCSV, exportAuditLogsJSON, getEventCategory } from "../utils/auditEngine";
import { calculateHospitalLoadBalancing, applyQueueDiversion } from "../utils/aiForecastEngine";
import { readEmergencyState, toggleDisasterSurgeMode, triggerCodeBlueAlert } from "../utils/emergencyEngine";
import { useAuth } from "../context/AuthContext";

export const HospitalAdminCenter: React.FC = () => {
  const [isAddDeptOpen, setIsAddDeptOpen] = useState(false);
  const [newDeptName, setNewDeptName] = useState("");
  const [newDeptCode, setNewDeptCode] = useState("");
  const [newDeptCap, setNewDeptCap] = useState("3");

  // Staff Assignment Modal State
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [selectedStaffDeptCode, setSelectedStaffDeptCode] = useState("");
  const [selectedStaffDeptName, setSelectedStaffDeptName] = useState("");

  // Audit Query & Export State
  const [auditSearchKeyword, setAuditSearchKeyword] = useState("");
  const [auditCategoryFilter, setAuditCategoryFilter] = useState("ALL");
  const [diversionFeedback, setDiversionFeedback] = useState<string | null>(null);

  // Emergency Modal States (Replaces browser prompt)
  const [isSurgeModalOpen, setIsSurgeModalOpen] = useState(false);
  const [surgeReasonInput, setSurgeReasonInput] = useState("Mass Casualty Incident / Local Epidemic Spike");

  const [isCodeBlueModalOpen, setIsCodeBlueModalOpen] = useState(false);
  const [codeBlueDeptCode, setCodeBlueDeptCode] = useState("CARD");
  const [codeBlueRoomInput, setCodeBlueRoomInput] = useState("Room 204");

  const db = useMockDB();
  const { profile, user } = useAuth();

  const adminName = profile?.fullName ?? user?.email?.split("@")[0] ?? "Administrator";

  // Calculate Congestion Metrics
  const overview = calculateHospitalOverview(db.departments, db.activeVisits);

  // Filter audit logs
  const filteredLogs = filterAuditLogs(db.auditLogs, auditSearchKeyword, auditCategoryFilter);

  const adminStats = [
    { label: "Hospital Health Score", value: `${overview.healthIndexScore}%`, subtext: overview.healthIndexScore >= 80 ? "Optimal Flow" : "Congestion Alert" },
    { label: "Total Waiting", value: `${overview.totalWaiting} Patients`, subtext: "Across active departments" },
    { label: "Rooms Occupied", value: `${overview.totalTreating} Consultation(s)`, subtext: "Live treating patients" },
    { label: "P1 Critical Count", value: `${overview.totalP1Critical} Cases`, subtext: "Requiring immediate call" },
  ];

  const handleToggleStatus = (code: string, currentStatus: string) => {
    const nextStatus = currentStatus === "ACTIVE" ? "PAUSED" : "ACTIVE";
    setDepartmentStatus(code, nextStatus, adminName);
  };

  const handleOpenStaffModal = (code: string, name: string) => {
    setSelectedStaffDeptCode(code);
    setSelectedStaffDeptName(name);
    setIsStaffModalOpen(true);
  };

  const handleCreateDepartment = () => {
    if (!newDeptName || !newDeptCode) return;
    const capacity = parseInt(newDeptCap, 10) || 3;
    const success = addDepartment(newDeptName, newDeptCode, capacity, adminName);
    
    if (success) {
      setIsAddDeptOpen(false);
      setNewDeptName("");
      setNewDeptCode("");
      setNewDeptCap("3");
    } else {
      alert("A department with this code already exists!");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Header - Skeuomorphic Raised Plate */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 skeuo-card p-6 relative">
        <span className="skeuo-rivet absolute top-3 left-3" />
        <span className="skeuo-rivet absolute top-3 right-3" />
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-sky-800 uppercase tracking-wider font-mono skeuo-engraved-text">Hospital Administration</span>
            <span className="px-2.5 py-0.5 rounded-lg bg-sky-100 border border-sky-300 text-sky-800 font-mono text-xs font-bold shadow-xs">
              Disaster Surge & Code Blue Ready
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 mt-1 skeuo-embossed-text">
            OPD Operations Command Center
          </h1>
          <p className="text-xs text-slate-600 mt-0.5 font-medium">
            Admin Profile: <strong className="text-slate-800">{adminName}</strong> | Hospital-wide emergency escalation & Code Blue rapid dispatch.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button 
            variant="secondary"
            size="sm" 
            className="text-rose-700 hover:text-rose-900 font-bold"
            onClick={() => {
              const state = readEmergencyState();
              if (state.isDisasterSurgeActive) {
                toggleDisasterSurgeMode(false, "", adminName);
              } else {
                setSurgeReasonInput("Mass Casualty Incident / Local Epidemic Spike");
                setIsSurgeModalOpen(true);
              }
            }}
          >
            <Siren className="h-4 w-4 mr-1 text-rose-600 animate-pulse" />
            <span>{readEmergencyState().isDisasterSurgeActive ? "Deactivate Surge Mode" : "Trigger Surge Mode"}</span>
          </Button>

          <Button 
            variant="danger"
            size="sm" 
            onClick={() => {
              setCodeBlueDeptCode(db.departments[0]?.code || "CARD");
              setCodeBlueRoomInput(db.departments[0]?.room || "Room 204");
              setIsCodeBlueModalOpen(true);
            }}
          >
            <Zap className="h-4 w-4 mr-1 text-amber-200" />
            <span>Code Blue Alert</span>
          </Button>

          <Button variant="secondary" size="sm" onClick={resetDB}>
            Reset DB
          </Button>
        </div>
      </div>

      {/* Active Disaster Surge Alert Bar */}
      {readEmergencyState().isDisasterSurgeActive && (
        <div className="skeuo-card-rose p-4 flex items-center justify-between shadow-lg animate-pulse">
          <div className="flex items-center gap-3">
            <span className="skeuo-led skeuo-led-red" />
            <ShieldAlert className="h-6 w-6 text-rose-600 shrink-0" />
            <div>
              <span className="font-black text-sm text-rose-950 block uppercase tracking-wider">
                🚨 HOSPITAL DISASTER SURGE MODE IS ACTIVE!
              </span>
              <span className="text-xs text-rose-900 font-medium">
                Reason: {readEmergencyState().surgeReason || "Emergency Surge Activated"} &mdash; All triage intake auto-escalated to P1 Critical priority.
              </span>
            </div>
          </div>
          <Button 
            variant="secondary"
            size="sm" 
            onClick={() => toggleDisasterSurgeMode(false, "", adminName)}
            className="text-xs font-bold text-rose-700"
          >
            Deactivate Surge
          </Button>
        </div>
      )}

      {/* AI Queue Load Balancing & Forecasting Banner */}
      {(() => {
        const recommendations = calculateHospitalLoadBalancing(db.departments);
        if (recommendations.length === 0) return null;
        return (
          <div className="skeuo-screen p-5 space-y-3">
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-2 font-mono font-bold text-sm text-sky-400">
                <span className="skeuo-led skeuo-led-cyan animate-pulse" />
                <Sparkles className="h-5 w-5 text-sky-300 shrink-0" />
                <span>AI Predictive Queue Load Balancing Recommendation</span>
              </div>
              <span className="bg-emerald-500/20 border border-emerald-400/40 px-2.5 py-0.5 rounded-lg text-emerald-300 font-mono font-bold text-[10px]">
                AI ACTIVE
              </span>
            </div>
            {recommendations.map((rec, i) => (
              <div key={i} className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs relative z-10 font-mono">
                <div className="space-y-0.5">
                  <span className="font-bold text-cyan-300 block">{rec.recommendationText}</span>
                  <span className="text-slate-300 block">{rec.impactDescription}</span>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    const res = applyQueueDiversion(
                      rec.sourceDeptCode,
                      rec.targetDeptCode,
                      rec.suggestedDiversionCount,
                      adminName
                    );
                    if (res.success) {
                      setDiversionFeedback(res.message);
                      setTimeout(() => setDiversionFeedback(null), 6000);
                    } else {
                      alert(res.message);
                    }
                  }}
                  className="whitespace-nowrap text-xs py-1.5"
                >
                  Apply Diversion
                </Button>
              </div>
            ))}

            {diversionFeedback && (
              <div className="bg-emerald-950/80 border border-emerald-500/60 rounded-xl p-3 text-xs text-emerald-300 font-mono flex items-center gap-2 animate-in fade-in relative z-10">
                <span className="skeuo-led skeuo-led-green animate-pulse" />
                <span>{diversionFeedback}</span>
              </div>
            )}
          </div>
        );
      })()}

      {/* Hospital stats widgets - Skeuomorphic Raised Plates */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {adminStats.map((stat, i) => (
          <div key={i} className="skeuo-card p-5 relative overflow-hidden">
            <span className="skeuo-rivet absolute top-2.5 right-2.5" />
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block font-mono skeuo-engraved-text">{stat.label}</span>
              <span className="text-2xl font-black text-slate-900 font-mono tracking-tight block skeuo-embossed-text">{stat.value}</span>
              <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider font-mono">{stat.subtext}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Congestion Alerts Banner */}
      {overview.alerts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 p-4 rounded-xl space-y-2 shadow-sm">
          <div className="flex items-center gap-2 font-bold text-sm text-amber-800">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
            <span>Hospital Operational Congestion Alerts ({overview.alerts.length})</span>
          </div>
          <ul className="space-y-1 text-xs pl-7 list-disc">
            {overview.alerts.map((alertText, idx) => (
              <li key={idx} className="font-medium">{alertText}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Triage Reference Rules Sheet */}
      <TriageRuleCard />

      {/* Department Cards Grid */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-800 tracking-tight flex items-center gap-2">
          <Building className="h-5 w-5 text-slate-400" />
          <span>Department Performance & Congestion Cards</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {db.departments.map((dept) => {
            const isPaused = dept.status === "PAUSED";
            const isBreak = dept.status === "ON_BREAK";
            const congestion = calculateDepartmentCongestion(dept, db.activeVisits);
            const assignedStaffCount = db.staffMembers.filter(s => s.assignedDeptCode === dept.code).length;
            
            return (
              <Card key={dept.id} className="flex flex-col justify-between hover:border-slate-300 transition-colors">
                <div>
                  <CardHeader className="p-0 mb-3 flex items-start justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-400 tracking-wider uppercase">{dept.code}</span>
                      <CardTitle className="text-base mt-0.5">{dept.name}</CardTitle>
                    </div>
                    <Badge variant={isPaused ? "p1" : isBreak ? "p3" : "success"}>
                      {dept.status}
                    </Badge>
                  </CardHeader>

                  <div className="space-y-3.5 text-sm my-4">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500">Congestion Level:</span>
                      <span className={`font-bold px-2 py-0.5 rounded border text-[10px] ${congestion.badgeBg} ${congestion.badgeColor}`}>
                        {congestion.congestionLevel}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500">Queue Wait List:</span>
                      <span className="font-bold text-slate-700">{dept.waiting} waiting</span>
                    </div>

                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500">Assigned Staff / Rooms:</span>
                      <span className="font-semibold text-slate-700">
                        {assignedStaffCount} Staff · {dept.currentCapacity} / {dept.maxCapacity} Rms
                      </span>
                    </div>

                    {/* Capacity meter */}
                    <div className="space-y-1">
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-300 ${
                            isPaused || isBreak ? "bg-slate-300" : congestion.occupancyPercentage >= 75 ? "bg-rose-500" : "bg-teal-600"
                          }`}
                          style={{ width: `${congestion.occupancyPercentage}%` }}
                        />
                      </div>
                      <span className="block text-[9px] text-right text-slate-400 font-semibold uppercase">
                        {congestion.occupancyPercentage}% Room Occupancy
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100 text-xs font-semibold text-slate-600">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      <span>Est: {dept.wait}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="flex-grow text-xs justify-center"
                    onClick={() => handleOpenStaffModal(dept.code, dept.name)}
                  >
                    <Users className="h-3.5 w-3.5 mr-1" />
                    <span>Assign Staff ({assignedStaffCount})</span>
                  </Button>
                  <button 
                    onClick={() => handleToggleStatus(dept.code, dept.status)}
                    className="p-2 rounded bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-500 active-shrink"
                    title={isPaused ? "Activate Department Queue" : "Pause Department Queue"}
                  >
                    {isPaused ? (
                      <PlayCircle className="h-5 w-5 text-emerald-600" />
                    ) : (
                      <PauseCircle className="h-5 w-5 text-rose-600" />
                    )}
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Audit Trails & Compliance Export Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <History className="h-5 w-5 text-slate-400" />
            <span>Database Audit Logs & Regulatory Reports ({filteredLogs.length})</span>
          </h2>

          {/* Export CSV & JSON Buttons */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportAuditLogsCSV(filteredLogs)}
              className="text-xs"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 mr-1 text-emerald-600" />
              <span>Export CSV</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => exportAuditLogsJSON(filteredLogs)}
              className="text-xs"
            >
              <FileJson className="h-3.5 w-3.5 mr-1 text-indigo-600" />
              <span>Export JSON</span>
            </Button>
          </div>
        </div>

        {/* Audit Search & Filter Controls */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between text-xs">
          <div className="relative w-full sm:w-72">
            <Search className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={auditSearchKeyword}
              onChange={(e) => setAuditSearchKeyword(e.target.value)}
              placeholder="Search by actor, action, or details..."
              className="w-full border border-slate-300 rounded-md pl-9 pr-3 py-1.5 bg-slate-50 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
            />
          </div>

          {/* Category Filter Chips */}
          <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto font-semibold">
            <Filter className="h-3.5 w-3.5 text-slate-400 mr-1 shrink-0" />
            {[
              { id: "ALL", label: "All Logs" },
              { id: "TRIAGE", label: "Triage" },
              { id: "CLINICAL_OVERRIDE", label: "Overrides" },
              { id: "STAFF_MANAGEMENT", label: "Staff" },
              { id: "SECURITY_CHECKIN", label: "Door Intake" },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setAuditCategoryFilter(cat.id)}
                className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap cursor-pointer ${
                  auditCategoryFilter === cat.id
                    ? "bg-teal-600 text-white font-bold"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        <Card>
          <div className="space-y-3.5 divide-y divide-slate-100">
            {filteredLogs.map((log, i) => {
              const categoryMeta = getEventCategory(log.action);
              return (
                <div 
                  key={i} 
                  className={`flex items-start gap-4 p-3 hover:bg-slate-50/50 rounded transition-colors text-xs ${i > 0 ? "pt-3.5" : ""}`}
                >
                  <span className="font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded shrink-0">
                    {log.time}
                  </span>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-700">{log.actor}</span>
                      <Badge variant="secondary" className="px-1.5 py-0 text-[9px]">
                        {log.action}
                      </Badge>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${categoryMeta.badgeBg} ${categoryMeta.badgeColor}`}>
                        {categoryMeta.label}
                      </span>
                    </div>
                    <p className="text-slate-600 font-medium">
                      {log.desc}
                    </p>
                  </div>
                </div>
              );
            })}

            {filteredLogs.length === 0 && (
              <div className="p-8 text-center text-slate-400 text-xs italic">
                No audit log entries match your search criteria.
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Admin Add Department Modal */}
      <Dialog
        isOpen={isAddDeptOpen}
        onClose={() => setIsAddDeptOpen(false)}
        title="Add Hospital OPD Clinic Department"
        description="Creates a new clinic queue with custom rooms and maximum capacity configurations."
        confirmText="Create Department"
        onConfirm={handleCreateDepartment}
      >
        <div className="space-y-4 pt-2">
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Department Name:
            </label>
            <input 
              type="text"
              value={newDeptName}
              onChange={(e) => setNewDeptName(e.target.value)}
              placeholder="e.g. Ophthalmology"
              className="text-sm border border-slate-300 rounded-md w-full px-3 py-2 bg-white text-slate-700 font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Department Code (3-4 Letters):
            </label>
            <input 
              type="text"
              maxLength={5}
              value={newDeptCode}
              onChange={(e) => setNewDeptCode(e.target.value)}
              placeholder="e.g. OPHTH"
              className="text-sm border border-slate-300 rounded-md w-full px-3 py-2 bg-white text-slate-700 font-semibold placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 uppercase"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Max Room Capacity:
            </label>
            <select
              value={newDeptCap}
              onChange={(e) => setNewDeptCap(e.target.value)}
              className="text-sm border border-slate-300 rounded-md w-full px-3 py-2 bg-white text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="1">1 Room</option>
              <option value="2">2 Rooms</option>
              <option value="3">3 Rooms</option>
              <option value="4">4 Rooms</option>
              <option value="5">5 Rooms</option>
            </select>
          </div>
        </div>
      </Dialog>

      {/* Staff Allocation Modal */}
      <StaffAssignmentModal
        isOpen={isStaffModalOpen}
        onClose={() => setIsStaffModalOpen(false)}
        departmentCode={selectedStaffDeptCode}
        departmentName={selectedStaffDeptName}
        adminName={adminName}
      />

      {/* Hospital Disaster Surge Activation Modal */}
      <Dialog
        isOpen={isSurgeModalOpen}
        onClose={() => setIsSurgeModalOpen(false)}
        title="Activate Hospital Disaster Surge Mode"
        description="Surge mode immediately flags the entire hospital system into mass casualty protocol. All incoming patient triage assessments will automatically escalate to P1 Critical priority."
        confirmText="Activate Emergency Surge"
        variant="danger"
        onConfirm={() => {
          toggleDisasterSurgeMode(true, surgeReasonInput.trim() || "Hospital Influx Emergency", adminName);
          setIsSurgeModalOpen(false);
        }}
      >
        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider font-mono">
              Surge Reason / Incident Description:
            </label>
            <input
              type="text"
              value={surgeReasonInput}
              onChange={(e) => setSurgeReasonInput(e.target.value)}
              placeholder="e.g. Mass Casualty Influx / Viral Epidemic Spike"
              className="text-sm border border-slate-300 rounded-lg w-full px-3 py-2 bg-white text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block font-mono">Quick Preset Incidents:</span>
            <div className="flex flex-wrap gap-1.5">
              {[
                "Mass Casualty Incident (MCI)",
                "Local Viral Epidemic Spike",
                "Multi-Vehicle Highway Collision",
                "Regional Facility Outage Influx"
              ].map((preset, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSurgeReasonInput(preset)}
                  className="text-[10px] px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded font-semibold cursor-pointer transition-colors"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Dialog>

      {/* Code Blue Rapid Resuscitation Alert Modal */}
      <Dialog
        isOpen={isCodeBlueModalOpen}
        onClose={() => setIsCodeBlueModalOpen(false)}
        title="🚨 Initiate Hospital Code Blue Emergency"
        description="Triggering Code Blue alerts resuscitation crash teams, clinical workstations, and digital displays hospital-wide for immediate life-support intervention."
        confirmText="Broadcast Code Blue"
        variant="danger"
        onConfirm={() => {
          triggerCodeBlueAlert(codeBlueDeptCode.toUpperCase(), codeBlueRoomInput.trim() || "Emergency Floor", adminName);
          setIsCodeBlueModalOpen(false);
        }}
      >
        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider font-mono">
              Emergency Location / Department:
            </label>
            <select
              value={codeBlueDeptCode}
              onChange={(e) => {
                const found = db.departments.find(d => d.code === e.target.value);
                setCodeBlueDeptCode(e.target.value);
                if (found) setCodeBlueRoomInput(found.room);
              }}
              className="text-sm border border-slate-300 rounded-lg w-full px-3 py-2 bg-white text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500 cursor-pointer"
            >
              {db.departments.map(d => (
                <option key={d.code} value={d.code}>{d.name} ({d.code}) &mdash; {d.room}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider font-mono">
              Room / Bed Identification:
            </label>
            <input
              type="text"
              value={codeBlueRoomInput}
              onChange={(e) => setCodeBlueRoomInput(e.target.value)}
              placeholder="e.g. Room 204 Bed 2"
              className="text-sm border border-slate-300 rounded-lg w-full px-3 py-2 bg-white text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>
        </div>
      </Dialog>

    </div>
  );
};

export const AdminPlaceholder = HospitalAdminCenter;
