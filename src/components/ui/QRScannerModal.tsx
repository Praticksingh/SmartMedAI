import React, { useState, useEffect, useRef } from "react";
import { 
  Scan, 
  Camera, 
  CheckCircle2, 
  XCircle, 
  Zap
} from "lucide-react";
import { Dialog } from "./dialog";
import { Button } from "./button";
import { validateAndProcessQRScan, generateQRPayload } from "../../utils/qrEngine";
import { useMockDB } from "../../hooks/useMockDB";

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  staffName: string;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  isOpen,
  onClose,
  staffName,
}) => {
  const [activeTab, setActiveTab] = useState<"CAMERA" | "SIMULATED">("CAMERA");
  const [manualTokenInput, setManualTokenInput] = useState("");
  const [scanResult, setScanResult] = useState<{
    success: boolean;
    message: string;
    tokenNumber?: string;
    departmentCode?: string;
    patientName?: string;
  } | null>(null);

  const [hasCameraAccess, setHasCameraAccess] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const db = useMockDB();

  // Initialize camera when camera tab is open
  useEffect(() => {
    if (isOpen && activeTab === "CAMERA") {
      let isMounted = true;
      navigator.mediaDevices
        ?.getUserMedia({ video: { facingMode: "environment" } })
        .then((stream) => {
          if (isMounted) {
            streamRef.current = stream;
            if (videoRef.current) {
              videoRef.current.srcObject = stream;
            }
            setHasCameraAccess(true);
          }
        })
        .catch(() => {
          if (isMounted) {
            setHasCameraAccess(false);
          }
        });

      return () => {
        isMounted = false;
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
        }
      };
    }
  }, [isOpen, activeTab]);

  const triggerAudioBeep = (success: boolean) => {
    if ("speechSynthesis" in window) {
      const text = success ? "Check-in Verified" : "Scan Error";
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.2;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleExecuteScan = (rawQRString: string) => {
    let inputToProcess = rawQRString.trim();
    if (inputToProcess && !inputToProcess.startsWith("{")) {
      // Manual token lookup fallback for patients with broken screens/paper slips
      const matched = db.activeVisits.find((v) => v.tokenNumber.toUpperCase() === inputToProcess.toUpperCase());
      if (matched) {
        inputToProcess = generateQRPayload(matched);
      }
    }
    const result = validateAndProcessQRScan(inputToProcess, staffName);
    setScanResult(result);
    triggerAudioBeep(result.success);
  };

  const handleSimulatedScanToken = (token: string) => {
    const matchedVisit = db.activeVisits.find((v) => v.tokenNumber === token);
    const payload = matchedVisit 
      ? generateQRPayload(matchedVisit)
      : JSON.stringify({
          v: 1,
          token,
          ref: `ref_${token}`,
          dept: token.split("-")[0],
          ts: Date.now(),
          sig: "INVALID_DEMO"
        });

    handleExecuteScan(payload);
  };

  // Collect active waiting tokens for instant demo scan buttons
  const availableTokens = db.departments.flatMap((d) => d.nextTokens).slice(0, 8);

  return (
    <Dialog
      isOpen={isOpen}
      onClose={() => {
        setScanResult(null);
        onClose();
      }}
      title="Clinic Intake QR Code Scanner"
      description="Scan patient digital OPD QR passes at the clinic door to verify token authenticity and update status to CHECKED_IN."
      confirmText="Done"
      onConfirm={() => {
        setScanResult(null);
        onClose();
      }}
    >
      <div className="space-y-6 pt-2">
        {/* Scanner Mode Tabs */}
        <div className="flex border-b border-slate-200 text-xs font-semibold">
          <button
            onClick={() => setActiveTab("CAMERA")}
            className={`pb-2.5 px-4 flex items-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
              activeTab === "CAMERA"
                ? "border-teal-600 text-teal-700 font-bold"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            <Camera className="h-4 w-4" />
            <span>Webcam Live Feed</span>
          </button>

          <button
            onClick={() => setActiveTab("SIMULATED")}
            className={`pb-2.5 px-4 flex items-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
              activeTab === "SIMULATED"
                ? "border-teal-600 text-teal-700 font-bold"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            <Zap className="h-4 w-4" />
            <span>Instant Test Scanner</span>
          </button>
        </div>

        {/* Tab 1: Live Webcam Viewfinder */}
        {activeTab === "CAMERA" && (
          <div className="space-y-4">
            <div className="relative bg-slate-950 rounded-xl overflow-hidden aspect-video flex items-center justify-center border-2 border-slate-800 shadow-inner">
              {hasCameraAccess === false ? (
                <div className="p-6 text-center text-slate-400 space-y-2">
                  <Camera className="h-10 w-10 mx-auto text-slate-600" />
                  <p className="text-xs font-medium">Webcam access unavailable or permission denied.</p>
                  <p className="text-[10px] text-slate-500">Switch to the "Instant Test Scanner" tab to perform live intake verification.</p>
                </div>
              ) : (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  {/* Targeting Reticle Frame */}
                  <div className="absolute inset-0 flex items-center justify-center p-8 pointer-events-none">
                    <div className="w-48 h-48 border-2 border-teal-400 rounded-2xl relative animate-pulse shadow-[0_0_20px_rgba(45,212,191,0.4)]">
                      <div className="absolute -top-1 -left-1 w-4 h-4 border-t-4 border-l-4 border-teal-400 rounded-tl" />
                      <div className="absolute -top-1 -right-1 w-4 h-4 border-t-4 border-r-4 border-teal-400 rounded-tr" />
                      <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-4 border-l-4 border-teal-400 rounded-bl" />
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-4 border-r-4 border-teal-400 rounded-br" />
                    </div>
                  </div>
                  <span className="absolute bottom-2 text-[10px] bg-slate-900/80 text-teal-300 px-3 py-1 rounded-full font-mono">
                    ALIGN PATIENT QR CODE IN FRAME
                  </span>
                </>
              )}
            </div>

            {/* Quick Trigger Button for camera mode */}
            <div className="flex gap-2">
              <input
                type="text"
                value={manualTokenInput}
                onChange={(e) => setManualTokenInput(e.target.value)}
                placeholder="Or paste QR payload / Token (e.g. C-028)"
                className="text-xs border border-slate-300 rounded-md px-3 py-2 flex-grow bg-white text-slate-800"
              />
              <Button
                size="sm"
                onClick={() => handleExecuteScan(manualTokenInput)}
                disabled={!manualTokenInput.trim()}
              >
                Scan Token
              </Button>
            </div>
          </div>
        )}

        {/* Tab 2: Simulated Quick Test Scanner */}
        {activeTab === "SIMULATED" && (
          <div className="space-y-4">
            <p className="text-xs text-slate-500">
              Click any active waiting token below to simulate scanning a patient's digital QR pass at the entrance:
            </p>

            <div className="flex flex-wrap gap-2">
              {availableTokens.map((token) => (
                <button
                  key={token}
                  onClick={() => handleSimulatedScanToken(token)}
                  className="px-3 py-2 bg-slate-100 hover:bg-teal-50 hover:border-teal-300 border border-slate-200 rounded-lg text-xs font-bold font-mono text-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Scan className="h-3.5 w-3.5 text-teal-600" />
                  <span>Scan {token}</span>
                </button>
              ))}

              {availableTokens.length === 0 && (
                <span className="text-xs text-slate-400 italic">No active waiting tokens in queue.</span>
              )}
            </div>
          </div>
        )}

        {/* Scan Result Feedback Panel */}
        {scanResult && (
          <div
            className={`p-4 rounded-xl border flex items-start gap-3 transition-all duration-300 ${
              scanResult.success
                ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                : "bg-rose-50 border-rose-200 text-rose-900"
            }`}
          >
            {scanResult.success ? (
              <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <XCircle className="h-6 w-6 text-rose-600 shrink-0 mt-0.5" />
            )}

            <div className="space-y-1">
              <h4 className="font-bold text-sm">
                {scanResult.success ? "Check-in Verification Successful!" : "Scan Verification Failed"}
              </h4>
              <p className="text-xs">{scanResult.message}</p>
              {scanResult.tokenNumber && (
                <div className="flex items-center gap-2 pt-1 font-mono text-xs font-bold">
                  <span>TOKEN: {scanResult.tokenNumber}</span>
                  {scanResult.departmentCode && <span>· CLINIC: {scanResult.departmentCode}</span>}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Dialog>
  );
};
