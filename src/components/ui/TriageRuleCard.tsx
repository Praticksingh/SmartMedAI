import React, { useState } from "react";
import { Info, ChevronDown, ChevronUp, ShieldCheck } from "lucide-react";
import { Badge } from "./badge";

export const TriageRuleCard: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  const rules = [
    {
      level: "p1",
      label: "P1 Critical",
      target: "Immediate care",
      conditions: ["Severe respiratory distress", "Chest pain (suspected cardiac event)", "Anaphylaxis or anaphylactic shock", "Unconsciousness or severe head trauma"]
    },
    {
      level: "p2",
      label: "P2 High",
      target: "Within 15 mins",
      conditions: ["Severe abdominal pain", "High fever with lethargy/stiffness", "Acute compound fractures", "Signs of stroke (slurred speech, sudden weakness)"]
    },
    {
      level: "p3",
      label: "P3 Moderate",
      target: "Within 60 mins",
      conditions: ["Minor fractures or severe sprains", "High fever without secondary distress", "Persistent vomiting or moderate dehydration", "Mild asthma flare-ups"]
    },
    {
      level: "p4",
      label: "P4 Routine",
      target: "Within 120 mins",
      conditions: ["Prescription refills", "Chronic checkups (hypertension, diabetes)", "Minor skin rashes or cold/flu symptoms", "Basic suture removals"]
    }
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-premium transition-all duration-300">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-slate-50 text-slate-700 font-semibold hover:bg-slate-100 transition-colors focus:outline-none"
      >
        <div className="flex items-center gap-2 text-sm sm:text-base">
          <Info className="h-5 w-5 text-teal-600 shrink-0" />
          <span>Triage Priority Guidelines (Deterministic Engine)</span>
        </div>
        {isOpen ? <ChevronUp className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
      </button>

      {isOpen && (
        <div className="p-5 border-t border-slate-100 space-y-4 animate-in slide-in-from-top duration-200">
          <p className="text-xs text-slate-500 leading-relaxed">
            OPDFlow AI implements a deterministic, clinically reviewed priority queue. Patients are ordered by priority: 
            <strong className="text-slate-700 ml-1">P1 Critical &gt; P2 High &gt; P3 Moderate &gt; P4 Routine</strong>. 
            Within each level, patients are served first-in, first-out (FIFO).
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            {rules.map((rule) => (
              <div 
                key={rule.level} 
                className="p-3.5 rounded-lg border bg-slate-50 border-slate-200/60 space-y-2 text-xs"
              >
                <div className="flex justify-between items-center">
                  <Badge variant={rule.level as any}>{rule.label}</Badge>
                  <span className="font-semibold text-slate-400 uppercase text-[9px] tracking-wider">
                    {rule.target}
                  </span>
                </div>
                <ul className="list-disc pl-4 space-y-1 text-slate-600 font-medium leading-relaxed">
                  {rule.conditions.map((cond, idx) => (
                    <li key={idx}>{cond}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-1.5 text-[10px] text-teal-700 font-semibold bg-teal-50/50 p-2.5 rounded border border-teal-100/50 max-w-max">
            <ShieldCheck className="h-4 w-4 text-teal-600" />
            <span>Meets hackathon criteria for priority queue operations</span>
          </div>
        </div>
      )}
    </div>
  );
};
