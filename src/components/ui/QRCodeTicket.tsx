import React, { useState } from "react";
import { QrCode, Maximize2, Download, Printer, ShieldCheck, CheckCircle2 } from "lucide-react";
import { Button } from "./button";
import { Badge } from "./badge";
import { Dialog } from "./dialog";
import { generateQRPayload } from "../../utils/qrEngine";
import type { PatientVisit } from "../../utils/mockState";

interface QRCodeTicketProps {
  visit: PatientVisit;
  departmentName?: string;
}

export const QRCodeTicket: React.FC<QRCodeTicketProps> = ({ visit, departmentName }) => {
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);

  const payloadString = generateQRPayload(visit);
  const deptLabel = departmentName || visit.departmentCode;

  const handlePrint = () => {
    window.print();
  };

  const handleSavePass = () => {
    const element = document.createElement("a");
    const file = new Blob(
      [
        `OPDFlow AI Digital OPD Pass\n===========================\nPatient: ${visit.patientName}\nToken: ${visit.tokenNumber}\nDepartment: ${deptLabel}\nPriority: ${visit.priorityText}\nStatus: ${visit.status}\nQR Reference: ${visit.qrCodeReference}\nPayload: ${payloadString}\n`
      ],
      { type: "text/plain" }
    );
    element.href = URL.createObjectURL(file);
    element.download = `OPDFlow_Pass_${visit.tokenNumber}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="skeuo-ticket p-5 space-y-4 text-center relative overflow-hidden">
      {/* Physical Ticket Notches */}
      <div className="skeuo-ticket-notch-left" />
      <div className="skeuo-ticket-notch-right" />

      {/* Realistic Metallic Lanyard Clip / Slot */}
      <div className="flex flex-col items-center -mt-2 mb-2">
        <div className="w-12 h-2.5 bg-gradient-to-b from-slate-400 via-slate-100 to-slate-500 rounded-full border border-slate-400 shadow-[inset_0_1px_1px_rgba(0,0,0,0.4),0_1px_2px_rgba(0,0,0,0.1)]" />
      </div>

      {/* Interactive QR Code Container */}
      <div className="relative group inline-block bg-white p-4 rounded-xl border border-slate-200 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.05),0_4px_12px_rgba(15,23,42,0.05)]">
        <div className="h-32 w-32 bg-white flex flex-col items-center justify-center relative">
          <QrCode className="h-28 w-28 text-slate-900 transition-transform duration-200 group-hover:scale-105" />
        </div>

        {/* Hover overlay button to expand */}
        <button
          onClick={() => setIsFullscreenOpen(true)}
          className="absolute inset-0 bg-slate-900/70 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-xl flex flex-col items-center justify-center text-white text-xs font-bold gap-1 cursor-pointer"
        >
          <Maximize2 className="h-5 w-5" />
          <span>Expand QR Pass</span>
        </button>
      </div>

      {/* QR Reference & Verification Badge */}
      <div className="space-y-1">
        <div className="flex items-center justify-center gap-1.5 text-[11px] font-mono font-bold text-slate-700 uppercase tracking-wider skeuo-engraved-text">
          <ShieldCheck className="h-4 w-4 text-teal-600" />
          <span>REF: {visit.qrCodeReference}</span>
        </div>
        <span className="text-[10px] text-slate-500 font-semibold block">Signed Cryptographic OPD Hardware Token</span>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center gap-2 pt-3 border-t border-dashed border-slate-300">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setIsFullscreenOpen(true)}
          className="text-xs"
        >
          <Maximize2 className="h-3.5 w-3.5 mr-1 text-slate-600" />
          <span>Fullscreen</span>
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleSavePass}
          className="text-xs"
        >
          <Download className="h-3.5 w-3.5 mr-1 text-slate-600" />
          <span>Save Pass</span>
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={handlePrint}
          className="text-xs"
        >
          <Printer className="h-3.5 w-3.5 mr-1 text-slate-600" />
          <span>Print</span>
        </Button>
      </div>

      {/* Fullscreen QR Pass Modal */}
      <Dialog
        isOpen={isFullscreenOpen}
        onClose={() => setIsFullscreenOpen(false)}
        title="Digital OPD Entrance Pass"
        description="Show this digital pass to the clinic entrance scanner or medical receptionist for automatic check-in."
        confirmText="Done"
        onConfirm={() => setIsFullscreenOpen(false)}
      >
        <div className="p-6 bg-slate-900 text-white rounded-xl border border-slate-800 text-center space-y-6">
          <div className="space-y-1">
            <span className="text-[10px] font-mono tracking-widest text-teal-400 uppercase block">HOSPITAL DIGITAL OPD TICKET</span>
            <h3 className="text-2xl font-black uppercase text-white tracking-tight">{deptLabel}</h3>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">TOKEN NUMBER</span>
            <span className="text-6xl font-black font-mono text-teal-400 tracking-tight block drop-shadow-[0_0_12px_rgba(20,184,166,0.3)]">
              {visit.tokenNumber}
            </span>
          </div>

          <div className="bg-white p-6 rounded-2xl inline-block border-4 border-teal-500 shadow-2xl">
            <QrCode className="h-48 w-48 text-slate-950" />
          </div>

          <div className="flex justify-center items-center gap-2 text-xs">
            <Badge variant={visit.priority}>{visit.priorityText}</Badge>
            <span className="text-slate-400">·</span>
            <span className="text-slate-300 font-semibold">{visit.patientName}</span>
          </div>

          <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700 text-xs text-slate-300 flex items-center justify-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>Cryptographically Verified · Present at Room Entrance</span>
          </div>
        </div>
      </Dialog>
    </div>
  );
};
