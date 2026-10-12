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
import { calculateHospitalLoadBalancing } from "../utils/aiForecastEngine";
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
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-lg border border-slate-200/80 shadow-premium">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-600 uppercase tracking-wider">Hospital Administration</span>
            <Badge variant="neutral">Disaster Surge & Code Blue Ready</Badge>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mt-1">
            OPD Operations Command Center
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Admin Profile: {adminName} | Hospital-wide emergency escalation & Code Blue rapid dispatch.
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            size="sm" 
            className="border-rose-300 text-rose-700 bg-rose-50 hover:bg-rose-100 font-bold"
            onClick={() => {
              const state = readEmergencyState();
              if (state.isDisasterSurgeActive) {
                toggleDisasterSurgeMode(false, "", adminName);
              } else {
                const reason = prompt("Enter Hospital Disaster Surge Reason:", "Mass Casualty Incident / Local Epidemic Spike");
                if (reason) toggleDisasterSurgeMode(true, reason, adminName);
              }
            }}
          >
            <Siren className="h-4 w-4 mr-1 text-rose-600 animate-pulse" />
            <span>{readEmergencyState().isDisasterSurgeActive ? "Deactivate Surge Mode" : "Trigger Surge Mode"}</span>
          </Button>

          <Button 
            size="sm" 
            className="bg-rose-700 hover:bg-rose-800 text-white font-bold"
            onClick={() => {
              const dept = prompt("Enter Code Blue Clinic Code:", "CARD");
              if (dept) {
                triggerCodeBlueAlert(dept.toUpperCase(), "Room 204", adminName);
              }
            }}
          >
            <Zap className="h-4 w-4 mr-1 text-amber-300" />
            <span>Code Blue Alert</span>
          </Button>

          <Button variant="outline" size="sm" onClick={resetDB}>
            Reset DB
          </Button>
        </div>
      </div>

      {/* Active Disaster Surge Alert Bar */}
      {readEmergencyState().isDisasterSurgeActive && (
        <div className="bg-gradient-to-r from-rose-600 to-red-600 text-white p-4 rounded-2xl shadow-md flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-3">
            <ShieldAlert className="h-6 w-6 text-white shrink-0" />
            <div>
              <span className="font-extrabold text-sm text-white block uppercase tracking-wider">
                🚨 HOSPITAL DISASTER SURGE MODE IS ACTIVE!
              </span>
              <span className="text-xs text-rose-100 font-medium">
                Reason: {readEmergencyState().surgeReason || "Emergency Surge Activated"} &mdash; All triage intake auto-escalated to P1 Critical priority.
              </span>
            </div>
          </div>
          <Button 
            size="sm" 
            onClick={() => toggleDisasterSurgeMode(false, "", adminName)}
            className="bg-white text-rose-700 font-bold hover:bg-rose-50 text-xs shadow-xs"
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
          <div className="bg-gradient-to-r from-sky-600 via-indigo-600 to-blue-700 text-white p-5 rounded-2xl shadow-md space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-sm text-white">
                <Sparkles className="h-5 w-5 text-amber-300 shrink-0" />
                <span>AI Predictive Queue Load Balancing Recommendation</span>
              </div>
              <Badge variant="success" className="bg-emerald-400 text-slate-900 font-extrabold text-[10px]">
                AI ACTIVE
              </Badge>
            </div>
            {recommendations.map((rec, i) => (
              <div key={i} className="bg-white/15 backdrop-blur-md border border-white/20 rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-0.5">
                  <span className="font-bold text-amber-200 block">{rec.recommendationText}</span>
                  <span className="text-slate-100 block">{rec.impactDescription}</span>
                </div>
                <Button
                  size="sm"
                  onClick={() => alert(`Applied AI Load Balancing Diversion: Redirected ${rec.suggestedDiversionCount} P4 tokens from ${rec.sourceDeptName} to ${rec.targetDeptName}.`)}
                  className="bg-white hover:bg-sky-50 text-sky-800 font-bold text-xs whitespace-nowrap shadow-xs"
                >
                  Apply Diversion
                </Button>
              </div>
            ))}
          </div>
        );
      })()}

      {/* Hospital stats widgets */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {adminStats.map((stat, i) => (
          <Card key={i}>
            <div className="space-y-1">
              <span className="text-xs font-medium text-slate-500 block">{stat.label}</span>
              <span className="text-2xl font-bold text-slate-800 tracking-tight block">{stat.value}</span>
              <span className="text-[10px] text-slate-400 font-medium block uppercase tracking-wider">{stat.subtext}</span>
            </div>
          </Card>
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

    </div>
  );
};

export const AdminPlaceholder = HospitalAdminCenter;
