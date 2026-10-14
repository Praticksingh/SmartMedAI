import React, { useState } from "react";
import { 
  Pill, 
  FlaskConical, 
  FileText, 
  Plus, 
  X,
  Stethoscope,
  Send
} from "lucide-react";
import { Button } from "./button";
import { Badge } from "./badge";

interface ConsultationOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPatient: {
    token: string;
    name: string;
    priority: "p1" | "p2" | "p3" | "p4";
    priorityText: string;
    symptom: string;
  } | null;
  departmentName: string;
  staffName: string;
  onComplete: (orders: {
    issueRx: boolean;
    medicines: string[];
    orderLab: boolean;
    tests: string[];
    notes: string;
  }) => void;
}

const COMMON_MEDS = [
  "Paracetamol 500mg",
  "Amoxicillin 250mg",
  "Azithromycin 500mg",
  "Pantoprazole 40mg",
  "Cetirizine 10mg",
  "ORSL Hydration Pack",
  "Ibuprofen 400mg",
  "Vitamin C + Zinc"
];

const COMMON_TESTS = [
  "Complete Blood Count (CBC)",
  "Serum Electrolytes",
  "Fasting Blood Sugar",
  "HbA1c Glycated Hemoglobin",
  "Liver Function Test (LFT)",
  "Kidney Function Test (KFT)",
  "Chest X-Ray PA View",
  "ECG 12-Lead"
];

export const ConsultationOrderModal: React.FC<ConsultationOrderModalProps> = ({
  isOpen,
  onClose,
  currentPatient,
  departmentName,
  staffName,
  onComplete,
}) => {
  const [issueRx, setIssueRx] = useState(true);
  const [prescribedMeds, setPrescribedMeds] = useState("Paracetamol 500mg, Amoxicillin 250mg, ORSL Hydration Pack");
  const [orderLab, setOrderLab] = useState(false);
  const [selectedTests, setSelectedTests] = useState("Complete Blood Count (CBC), Serum Electrolytes");
  const [clinicalNotes, setClinicalNotes] = useState("");

  if (!isOpen || !currentPatient) return null;

  const handleAddMed = (med: string) => {
    if (!prescribedMeds.includes(med)) {
      setPrescribedMeds(prev => prev ? `${prev}, ${med}` : med);
    }
  };

  const handleAddTest = (test: string) => {
    if (!selectedTests.includes(test)) {
      setSelectedTests(prev => prev ? `${prev}, ${test}` : test);
    }
  };

  const handleSubmit = (withOrders: boolean) => {
    if (withOrders) {
      const medsArray = issueRx 
        ? prescribedMeds.split(",").map(m => m.trim()).filter(Boolean) 
        : [];
      const testsArray = orderLab 
        ? selectedTests.split(",").map(t => t.trim()).filter(Boolean) 
        : [];
      
      onComplete({
        issueRx,
        medicines: medsArray,
        orderLab,
        tests: testsArray,
        notes: clinicalNotes
      });
    } else {
      onComplete({
        issueRx: false,
        medicines: [],
        orderLab: false,
        tests: [],
        notes: clinicalNotes || "Routine consultation concluded without external pharmacy or lab orders."
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Skeuomorphic Modal Box */}
      <div className="skeuo-card bg-slate-100 max-w-xl w-full z-10 overflow-hidden relative shadow-2xl border-2 border-white/90 animate-in fade-in zoom-in-95 duration-200">
        <span className="skeuo-rivet absolute top-3 left-3" />
        <span className="skeuo-rivet absolute top-3 right-3" />
        <span className="skeuo-rivet absolute bottom-3 left-3" />
        <span className="skeuo-rivet absolute bottom-3 right-3" />

        {/* Modal Header */}
        <div className="p-6 border-b border-slate-200/80 bg-gradient-to-b from-white to-slate-50">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl skeuo-btn-primary flex items-center justify-center text-white shadow-md">
                <Stethoscope className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold font-mono text-sky-800 uppercase tracking-widest block">Clinical Discharge Console</span>
                <h3 className="text-xl font-black text-slate-900 tracking-tight skeuo-embossed-text">
                  Complete Visit &mdash; {currentPatient.token}
                </h3>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 p-1 rounded-lg transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Patient Overview Inset */}
          <div className="mt-4 p-3.5 skeuo-inset rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs">
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase block font-mono">Patient</span>
              <span className="font-bold text-slate-800 text-sm">{currentPatient.name}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase block font-mono">Triage Urgency</span>
              <Badge variant={currentPatient.priority}>{currentPatient.priorityText}</Badge>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase block font-mono">Clinic / Doctor</span>
              <span className="font-bold text-slate-700">{departmentName} &middot; {staffName}</span>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[65vh] overflow-y-auto">
          {/* Clinical Assessment Notes */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider font-mono">
              <FileText className="h-3.5 w-3.5 text-sky-600" />
              <span>Doctor's Clinical Notes (Optional EMR Entry)</span>
            </label>
            <textarea
              rows={2}
              value={clinicalNotes}
              onChange={(e) => setClinicalNotes(e.target.value)}
              placeholder="e.g. Physical exam unremarkable. Vitals normal. Patient advised hydration & 3-day symptomatic rest."
              className="w-full text-xs skeuo-inset p-3 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 rounded-xl"
            />
          </div>

          {/* Section 1: Pharmacy E-Prescription Order */}
          <div className="skeuo-card p-4 space-y-3 bg-white/70">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={issueRx}
                  onChange={(e) => setIssueRx(e.target.checked)}
                  className="h-4 w-4 rounded text-teal-600 focus:ring-teal-500 cursor-pointer"
                />
                <span className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                  <Pill className="h-4 w-4 text-teal-600" />
                  <span>Issue Pharmacy E-Prescription Token</span>
                </span>
              </label>
              {issueRx && (
                <span className="text-[10px] font-bold bg-teal-100 text-teal-800 px-2 py-0.5 rounded border border-teal-200">
                  Routes to Dispensary Counter 3
                </span>
              )}
            </div>

            {issueRx && (
              <div className="space-y-2 pt-1 animate-in fade-in">
                <input
                  type="text"
                  value={prescribedMeds}
                  onChange={(e) => setPrescribedMeds(e.target.value)}
                  placeholder="Enter medicines comma-separated"
                  className="w-full text-xs skeuo-inset p-2.5 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 rounded-lg font-medium"
                />
                
                {/* Quick Add Medicine Chips */}
                <div className="flex flex-wrap items-center gap-1 pt-1">
                  <span className="text-[10px] font-bold text-slate-500 font-mono mr-1">Quick Add:</span>
                  {COMMON_MEDS.map((med, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleAddMed(med)}
                      className="inline-flex items-center gap-0.5 text-[10px] px-2 py-0.5 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded font-semibold cursor-pointer transition-colors"
                    >
                      <Plus className="h-2.5 w-2.5" />
                      <span>{med}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Pathology Diagnostic Lab Orders */}
          <div className="skeuo-card p-4 space-y-3 bg-white/70">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={orderLab}
                  onChange={(e) => setOrderLab(e.target.checked)}
                  className="h-4 w-4 rounded text-violet-600 focus:ring-violet-500 cursor-pointer"
                />
                <span className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                  <FlaskConical className="h-4 w-4 text-violet-600" />
                  <span>Order Pathology Diagnostic Tests</span>
                </span>
              </label>
              {orderLab && (
                <span className="text-[10px] font-bold bg-violet-100 text-violet-800 px-2 py-0.5 rounded border border-violet-200">
                  Routes to Central Lab Room 102
                </span>
              )}
            </div>

            {orderLab && (
              <div className="space-y-2 pt-1 animate-in fade-in">
                <input
                  type="text"
                  value={selectedTests}
                  onChange={(e) => setSelectedTests(e.target.value)}
                  placeholder="Enter diagnostic tests comma-separated"
                  className="w-full text-xs skeuo-inset p-2.5 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500 rounded-lg font-medium"
                />

                {/* Quick Add Test Chips */}
                <div className="flex flex-wrap items-center gap-1 pt-1">
                  <span className="text-[10px] font-bold text-slate-500 font-mono mr-1">Quick Add:</span>
                  {COMMON_TESTS.map((test, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleAddTest(test)}
                      className="inline-flex items-center gap-0.5 text-[10px] px-2 py-0.5 bg-violet-50 hover:bg-violet-100 text-violet-800 border border-violet-200 rounded font-semibold cursor-pointer transition-colors"
                    >
                      <Plus className="h-2.5 w-2.5" />
                      <span>{test}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="p-5 border-t border-slate-200/80 bg-slate-50 flex flex-col sm:flex-row justify-between items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleSubmit(false)}
            className="w-full sm:w-auto text-xs text-slate-600 font-bold"
          >
            Discharge Without Orders
          </Button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="w-full sm:w-auto text-xs font-semibold"
            >
              Cancel
            </Button>
            <Button
              variant="teal"
              size="sm"
              onClick={() => handleSubmit(true)}
              className="w-full sm:w-auto text-xs font-bold py-2 shadow-md"
            >
              <Send className="h-3.5 w-3.5 mr-1" />
              <span>Complete &amp; Dispatch Orders</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
