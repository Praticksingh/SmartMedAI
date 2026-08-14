import React, { useState } from "react";
import { Users, UserPlus, ArrowRightLeft, Stethoscope, HeartPulse } from "lucide-react";
import { Dialog } from "./dialog";
import { Button } from "./button";
import { Badge } from "./badge";
import { useMockDB } from "../../hooks/useMockDB";
import { reassignStaffMember, updateDepartmentCapacity } from "../../utils/mockState";

interface StaffAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  departmentCode: string;
  departmentName: string;
  adminName: string;
}

export const StaffAssignmentModal: React.FC<StaffAssignmentModalProps> = ({
  isOpen,
  onClose,
  departmentCode,
  departmentName,
  adminName,
}) => {
  const db = useMockDB();
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [customCapacity, setCustomCapacity] = useState("");

  const dept = db.departments.find((d) => d.code === departmentCode);
  const assignedStaff = db.staffMembers.filter((s) => s.assignedDeptCode === departmentCode);
  const unassignedOrOtherStaff = db.staffMembers.filter((s) => s.assignedDeptCode !== departmentCode);

  const handleReassign = () => {
    if (!selectedStaffId) return;
    reassignStaffMember(selectedStaffId, departmentCode, adminName);
    setSelectedStaffId("");
  };

  const handleCapacityUpdate = () => {
    const cap = parseInt(customCapacity, 10);
    if (!isNaN(cap) && cap > 0) {
      updateDepartmentCapacity(departmentCode, cap, adminName);
      setCustomCapacity("");
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={`Staff Allocation — ${departmentName} (${departmentCode})`}
      description="Hospital Administrators can dynamically re-assign clinical staff and adjust room capacities to mitigate queue bottlenecks."
      confirmText="Done"
      onConfirm={onClose}
    >
      <div className="space-y-6 pt-2 text-xs">
        
        {/* Current Assigned Roster */}
        <div className="space-y-2">
          <h4 className="font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Users className="h-4 w-4 text-teal-600" />
            <span>Currently Assigned Staff ({assignedStaff.length})</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {assignedStaff.map((staff) => (
              <div
                key={staff.id}
                className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  {staff.role === "DOCTOR" ? (
                    <Stethoscope className="h-4 w-4 text-indigo-600" />
                  ) : (
                    <HeartPulse className="h-4 w-4 text-rose-500" />
                  )}
                  <div>
                    <span className="font-bold text-slate-800 block">{staff.name}</span>
                    <span className="text-[10px] text-slate-500">{staff.role}</span>
                  </div>
                </div>
                <Badge variant={staff.status === "ACTIVE" ? "success" : "neutral"}>
                  {staff.status}
                </Badge>
              </div>
            ))}

            {assignedStaff.length === 0 && (
              <div className="col-span-2 p-4 text-center text-slate-400 border border-dashed rounded-lg">
                No clinical staff currently assigned to this department.
              </div>
            )}
          </div>
        </div>

        {/* Transfer / Reassign Staff Form */}
        <div className="space-y-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
          <h4 className="font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <ArrowRightLeft className="h-4 w-4 text-indigo-600" />
            <span>Re-allocate Staff Member to {departmentCode}</span>
          </h4>

          <div className="flex gap-2">
            <select
              value={selectedStaffId}
              onChange={(e) => setSelectedStaffId(e.target.value)}
              className="w-full border border-slate-300 rounded-md px-3 py-2 bg-white text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500 text-xs cursor-pointer"
            >
              <option value="">-- Select Staff Member from Hospital Roster --</option>
              {unassignedOrOtherStaff.map((staff) => (
                <option key={staff.id} value={staff.id}>
                  {staff.name} ({staff.role}) — Currently at {staff.assignedDeptCode}
                </option>
              ))}
            </select>

            <Button
              size="sm"
              disabled={!selectedStaffId}
              onClick={handleReassign}
              className="bg-indigo-600 text-white hover:bg-indigo-700 whitespace-nowrap"
            >
              <UserPlus className="h-3.5 w-3.5 mr-1" />
              <span>Transfer</span>
            </Button>
          </div>
        </div>

        {/* Adjust Department Room Capacity */}
        <div className="space-y-3 pt-2 border-t border-slate-200">
          <h4 className="font-bold text-slate-800 uppercase tracking-wider">
            Adjust Clinic Room Capacity (Current: {dept?.maxCapacity || 3} rooms)
          </h4>

          <div className="flex gap-2 items-center">
            <input
              type="number"
              min={1}
              max={10}
              value={customCapacity}
              onChange={(e) => setCustomCapacity(e.target.value)}
              placeholder={`New room capacity (e.g. ${(dept?.maxCapacity || 3) + 1})`}
              className="border border-slate-300 rounded-md px-3 py-2 text-xs flex-grow bg-white text-slate-800 font-semibold"
            />
            <Button size="sm" variant="outline" onClick={handleCapacityUpdate} disabled={!customCapacity}>
              Update Capacity
            </Button>
          </div>
        </div>

      </div>
    </Dialog>
  );
};
