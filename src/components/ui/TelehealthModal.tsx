import React from "react";
import { Video, ExternalLink, X, Shield, PhoneOff } from "lucide-react";
import { Button } from "./button";

interface TelehealthModalProps {
  isOpen: boolean;
  onClose: () => void;
  tokenNumber: string;
  departmentCode: string;
  roomUrl: string;
  patientName?: string;
}

export const TelehealthModal: React.FC<TelehealthModalProps> = ({
  isOpen,
  onClose,
  tokenNumber,
  departmentCode,
  roomUrl,
  patientName,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
      {/* Dark overlay */}
      <div 
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Video Modal Container */}
      <div className="skeuo-card bg-slate-900 border-2 border-slate-700 text-white max-w-4xl w-full z-10 overflow-hidden relative shadow-2xl flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        <span className="skeuo-rivet absolute top-3 left-3" />
        <span className="skeuo-rivet absolute top-3 right-3" />

        {/* Header Bar */}
        <div className="p-4 bg-slate-950/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-400">
              <Video className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold text-sky-400 uppercase tracking-widest">
                  Live Virtual Consultation
                </span>
                <span className="bg-emerald-500/20 border border-emerald-400/40 px-2 py-0.5 rounded text-emerald-300 font-mono font-bold text-[9px] flex items-center gap-1">
                  <span className="skeuo-led skeuo-led-green animate-pulse" /> WebRTC ACTIVE
                </span>
              </div>
              <h3 className="text-base font-black text-white tracking-tight font-mono">
                Room: {departmentCode} &mdash; Token: {tokenNumber} {patientName ? `(${patientName})` : ""}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => window.open(roomUrl, "_blank")}
              className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-600"
            >
              <ExternalLink className="h-3.5 w-3.5 mr-1" />
              <span>Full Tab</span>
            </Button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Embedded WebRTC IFrame Screen */}
        <div className="relative flex-grow bg-slate-950 min-h-[420px] flex flex-col items-center justify-center">
          <iframe
            src={roomUrl}
            title={`Telehealth Video Consultation - ${tokenNumber}`}
            allow="camera; microphone; display-capture; autoplay; clipboard-write; speaker"
            className="w-full h-full min-h-[460px] border-none"
          />
        </div>

        {/* Footer controls & security notice */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px]">
            <Shield className="h-3.5 w-3.5 text-emerald-400" />
            <span>End-to-end encrypted medical consultation channel.</span>
          </div>

          <Button
            variant="danger"
            size="sm"
            onClick={onClose}
            className="text-xs font-bold py-1.5"
          >
            <PhoneOff className="h-3.5 w-3.5 mr-1" />
            <span>End Video Session</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
