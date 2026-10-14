import React, { useState, useEffect, useRef } from "react";
import { 
  Tv, 
  Volume2, 
  VolumeX, 
  ChevronRight, 
  AlertCircle, 
  Building, 
  Globe, 
  Grid 
} from "lucide-react";
import { Button } from "../components/ui/button";
import { useMockDB } from "../hooks/useMockDB";
import { useLanguage } from "../context/LanguageContext";
import { subscribeToTVBroadcast, speakMedicalCall, unlockKioskAudio } from "../utils/broadcastEngine";

export const PublicWaitingDisplay: React.FC = () => {
  const [selectedDept, setSelectedDept] = useState("CARD");
  const [autoAnnounce, setAutoAnnounce] = useState(true);
  const [viewMode, setViewMode] = useState<"SINGLE_DEPT" | "HOSPITAL_GRID">("SINGLE_DEPT");
  const [isAudioUnlocked, setIsAudioUnlocked] = useState(false);
  const { language, setLanguage, t } = useLanguage();
  const tvLang: "EN" | "HI" | "BN" = language === "hi" ? "HI" : language === "bn" ? "BN" : "EN";
  const speechRate = 0.9;
  const [flashToken, setFlashToken] = useState<string | null>(null);

  const db = useMockDB();

  // Find department metadata dynamically from synchronized database state
  const currentDept = db.departments.find(d => d.code === selectedDept) || db.departments[0];
  const lastServedRef = useRef<string | null>(currentDept.nowServing);

  const handleUnlockAudio = () => {
    if (!isAudioUnlocked) {
      unlockKioskAudio();
      setIsAudioUnlocked(true);
    }
  };

  useEffect(() => {
    const handleFirstInteraction = () => {
      handleUnlockAudio();
    };
    window.addEventListener("click", handleFirstInteraction, { once: true });
    window.addEventListener("keydown", handleFirstInteraction, { once: true });
    return () => {
      window.removeEventListener("click", handleFirstInteraction);
      window.removeEventListener("keydown", handleFirstInteraction);
    };
  }, [isAudioUnlocked]);

  const triggerCallOut = (token: string, deptName: string, room: string) => {
    setFlashToken(token);
    setTimeout(() => setFlashToken(null), 5000);
    if (autoAnnounce) {
      speakMedicalCall(token, deptName, room, tvLang, speechRate);
    }
  };

  // Subscribe to real-time broadcast channel & storage events (deduplicated by broadcastEngine)
  useEffect(() => {
    const unsubscribe = subscribeToTVBroadcast((event) => {
      if (event.type === "TOKEN_CALLED") {
        if (viewMode === "SINGLE_DEPT" && event.deptCode === selectedDept) {
          triggerCallOut(event.tokenNumber, event.deptName, event.room);
        } else if (viewMode === "HOSPITAL_GRID") {
          triggerCallOut(event.tokenNumber, event.deptName, event.room);
        }
      }
    });

    return () => unsubscribe();
  }, [viewMode, selectedDept, autoAnnounce, tvLang, speechRate]);

  useEffect(() => {
    lastServedRef.current = currentDept.nowServing;
  }, [currentDept.nowServing]);

  return (
    <div className="space-y-8 animate-in fade-in duration-300 text-slate-800">
      
      {/* Kiosk Autoplay Audio Unblocker Banner */}
      {!isAudioUnlocked && (
        <div 
          onClick={handleUnlockAudio}
          className="skeuo-card-amber p-4 cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg animate-pulse"
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shrink-0 shadow-md">
              <Volume2 className="h-6 w-6" />
            </div>
            <div>
              <span className="font-black text-sm text-amber-950 uppercase tracking-wider block font-mono">
                Click Screen to Enable Hospital Audio Announcements
              </span>
              <span className="text-xs text-amber-900 font-medium">
                Modern browsers require a single tap/click to unlock automated voice broadcasting for wall-mounted TV displays.
              </span>
            </div>
          </div>
          <Button
            size="sm"
            onClick={handleUnlockAudio}
            className="bg-amber-600 hover:bg-amber-700 text-white font-bold shrink-0"
          >
            Enable Audio
          </Button>
        </div>
      )}
      
      {/* Settings bar / Controls - Skeuomorphic Raised Plate */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 skeuo-card p-4 relative">
        <span className="skeuo-rivet absolute top-3 right-3" />
        <div className="flex items-center gap-2 flex-wrap">
          <div className="h-9 w-9 rounded-xl skeuo-btn-secondary flex items-center justify-center text-sky-600 border border-slate-300">
            <Tv className="h-5 w-5" />
          </div>
          <div>
            <span className="text-sm font-black text-slate-900 skeuo-embossed-text">{t("public.title")}</span>
            <span className="block text-[10px] font-mono font-bold text-sky-800 uppercase tracking-wider">Live TV Broadcast Command</span>
          </div>
        </div>

        {/* Action Controls & Settings */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto text-xs">
          
          {/* View Mode Switcher */}
          <div className="skeuo-tab-track">
            <button
              onClick={() => setViewMode("SINGLE_DEPT")}
              className={`skeuo-tab-btn text-xs py-1.5 px-3 ${
                viewMode === "SINGLE_DEPT" ? "skeuo-tab-btn-active" : "hover:text-slate-900"
              }`}
            >
              {t("public.singleClinic")}
            </button>
            <button
              onClick={() => setViewMode("HOSPITAL_GRID")}
              className={`skeuo-tab-btn text-xs py-1.5 px-3 flex items-center gap-1.5 ${
                viewMode === "HOSPITAL_GRID" ? "skeuo-tab-btn-active" : "hover:text-slate-900"
              }`}
            >
              <Grid className="h-3.5 w-3.5" />
              <span>{t("public.hospitalGrid")}</span>
            </button>
          </div>

          {/* Department Filter (Single Dept Mode) */}
          {viewMode === "SINGLE_DEPT" && (
            <select 
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="skeuo-input text-xs px-3 py-1.5 font-bold cursor-pointer"
            >
              {db.departments.map((d) => (
                <option key={d.code} value={d.code}>{t(`dept.${d.code}`) || d.name} ({d.room})</option>
              ))}
            </select>
          )}

          {/* Language Toggle */}
          <div className="skeuo-tab-track">
            <Globe className="h-3.5 w-3.5 text-slate-500 ml-1.5 my-auto" />
            <button
              onClick={() => setLanguage("en")}
              className={`skeuo-tab-btn text-xs py-1 px-2.5 ${language === "en" ? "skeuo-tab-btn-active" : ""}`}
            >
              ENG
            </button>
            <button
              onClick={() => setLanguage("hi")}
              className={`skeuo-tab-btn text-xs py-1 px-2.5 ${language === "hi" ? "skeuo-tab-btn-active" : ""}`}
            >
              HIN
            </button>
          </div>

          {/* Auto Announce Toggle */}
          <Button 
            variant={autoAnnounce ? "primary" : "secondary"} 
            size="sm"
            onClick={() => setAutoAnnounce(!autoAnnounce)}
            title="Toggle automatic voice calling when a patient is called"
            className="text-xs"
          >
            {autoAnnounce ? <Volume2 className="h-4 w-4 mr-1 text-white" /> : <VolumeX className="h-4 w-4 mr-1 text-slate-500" />}
            <span>{autoAnnounce ? "Audio ON" : "Audio OFF"}</span>
          </Button>

          <Button 
            variant="secondary" 
            size="sm"
            onClick={() => {
              if (currentDept.nowServing) {
                speakMedicalCall(currentDept.nowServing, t(`dept.${currentDept.code}`) || currentDept.name, currentDept.room, tvLang, speechRate);
              }
            }}
            disabled={!currentDept.nowServing}
            title={currentDept.nowServing ? "Replay Voice Announcement" : "No token currently being served"}
            className="text-xs"
          >
            <Volume2 className="h-4 w-4 text-sky-600 mr-1" />
            <span>Replay Voice</span>
          </Button>
        </div>
      </div>

      {/* Mode 1: Single Clinic Focus View - Skeuomorphic Wall Mounted Monitor */}
      {viewMode === "SINGLE_DEPT" && (
        <div className="skeuo-screen border-4 border-slate-700 shadow-[0_16px_40px_rgba(0,0,0,0.6)] p-6 sm:p-12 text-center space-y-12 relative overflow-hidden">
          <span className="skeuo-rivet absolute top-4 left-4 z-20" />
          <span className="skeuo-rivet absolute top-4 right-4 z-20" />
          <span className="skeuo-rivet absolute bottom-4 left-4 z-20" />
          <span className="skeuo-rivet absolute bottom-4 right-4 z-20" />
          
          {/* Header Display */}
          <div className="flex justify-between items-center border-b border-slate-800 pb-6 relative z-10">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 bg-sky-500/20 border border-sky-400/40 rounded-xl flex items-center justify-center">
                <Building className="h-5 w-5 text-sky-300" />
              </div>
              <span className="text-lg sm:text-2xl font-black tracking-tight text-white uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                {t(`dept.${currentDept.code}`) || currentDept.name} &mdash; {currentDept.room}
              </span>
            </div>
            <div className="flex items-center gap-2 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800">
              <span className="skeuo-led skeuo-led-red animate-pulse" />
              <span className="text-xs sm:text-sm font-mono text-slate-300 font-bold tracking-widest">
                LIVE BROADCAST ({language.toUpperCase()})
              </span>
            </div>
          </div>

          {/* Primary Call: NOW SERVING */}
          {currentDept.nowServing ? (
            <div className="space-y-6 relative z-10">
              <span className="block text-sky-400 text-lg sm:text-xl font-mono font-bold tracking-widest uppercase drop-shadow-[0_0_8px_rgba(56,189,248,0.5)]">
                {t("public.nowServing")}
              </span>
              <div className={`text-7xl sm:text-9xl font-black tracking-tight font-mono transition-all duration-300 ${
                flashToken === currentDept.nowServing 
                  ? "text-amber-400 scale-105 animate-bounce drop-shadow-[0_0_35px_rgba(251,191,36,0.8)]" 
                  : "text-cyan-300 drop-shadow-[0_0_25px_rgba(6,182,212,0.5)]"
              }`}>
                {currentDept.nowServing}
              </div>
              <p className="text-2xl sm:text-3xl text-slate-100 font-bold tracking-tight">
                {t("public.proceedTo")} <span className="underline decoration-cyan-400 decoration-4 underline-offset-8 text-cyan-200">{currentDept.room}</span>
              </p>
            </div>
          ) : (
            <div className="space-y-6 py-12 relative z-10">
              <span className="block text-slate-400 text-lg sm:text-xl font-mono font-bold tracking-widest uppercase">
                DEPT QUEUE STATUS
              </span>
              <div className="text-4xl sm:text-6xl font-black tracking-tight text-slate-500 uppercase font-mono">
                {t("public.noTokenCalled")}
              </div>
            </div>
          )}

          {/* Next Tokens Row */}
          <div className="border-t border-slate-800 pt-8 flex flex-col sm:flex-row justify-between items-center gap-6 relative z-10">
            <span className="text-sky-300 text-sm sm:text-base font-mono font-bold tracking-wider uppercase">
              {t("public.nextWaiting")}
            </span>
            {currentDept.nextTokens.length > 0 ? (
              <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 font-mono text-xl sm:text-3xl font-black text-cyan-200">
                {currentDept.nextTokens.slice(0, 5).map((t, idx) => (
                  <React.Fragment key={t}>
                    {idx > 0 && <ChevronRight className="h-5 w-5 text-slate-600 shrink-0" />}
                    <span className="hover:text-white transition-colors duration-200 bg-slate-900/80 px-3 py-1 rounded-xl border border-slate-800 shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)]">{t}</span>
                  </React.Fragment>
                ))}
                {currentDept.nextTokens.length > 5 && (
                  <span className="text-sm text-slate-400 font-mono tracking-wide">
                    +{currentDept.nextTokens.length - 5} more
                  </span>
                )}
              </div>
            ) : (
              <span className="text-slate-500 font-mono text-sm tracking-widest font-bold">
                NO PATIENTS WAITING
              </span>
            )}
          </div>

        </div>
      )}

      {/* Mode 2: Hospital-Wide Multi-Department Grid Ticker */}
      {viewMode === "HOSPITAL_GRID" && (
        <div className="skeuo-screen border-4 border-slate-700 p-6 sm:p-8 space-y-6 shadow-2xl relative">
          <span className="skeuo-rivet absolute top-3 left-3 z-20" />
          <span className="skeuo-rivet absolute top-3 right-3 z-20" />

          <div className="flex justify-between items-center border-b border-slate-800 pb-4 relative z-10">
            <h3 className="text-xl font-black tracking-tight text-white uppercase flex items-center gap-2 drop-shadow-sm font-mono">
              <Grid className="h-5 w-5 text-cyan-400" />
              <span>All OPD Clinics — Live Monitor Ticker</span>
            </h3>
            <span className="text-xs font-mono text-cyan-400 font-bold uppercase tracking-widest bg-cyan-950/60 border border-cyan-800 px-3 py-1 rounded-lg">
              WALL MONITOR DISPLAY MODE
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 relative z-10">
            {db.departments.map((dept) => {
              const isCalling = flashToken === dept.nowServing;
              return (
                <div 
                  key={dept.code}
                  className={`bg-slate-900/90 border ${
                    isCalling ? "border-amber-400 ring-2 ring-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.5)]" : "border-slate-800"
                  } rounded-xl p-4 space-y-3 shadow-inner`}
                >
                  <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                    <span className="font-bold text-sm text-slate-200 uppercase tracking-tight truncate">{dept.name}</span>
                    <span className="text-[10px] font-mono text-cyan-300 bg-slate-800 border border-slate-700 px-2 py-0.5 rounded font-bold">{dept.room}</span>
                  </div>

                  <div className="text-center py-2 space-y-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block font-mono">NOW SERVING</span>
                    {dept.nowServing ? (
                      <span className="text-4xl font-black font-mono text-cyan-300 tracking-tight block drop-shadow-[0_0_8px_rgba(6,182,212,0.4)]">
                        {dept.nowServing}
                      </span>
                    ) : (
                      <span className="text-base font-bold text-slate-500 block uppercase font-mono">
                        {dept.status === "PAUSED" ? "PAUSED" : "STANDBY"}
                      </span>
                    )}
                  </div>

                  <div className="border-t border-slate-800 pt-2 flex justify-between items-center text-xs text-slate-400 font-mono">
                    <span>Waiting: <strong className="text-white">{dept.waiting}</strong></span>
                    <span>Next: <strong className="text-cyan-300">{dept.nextTokens[0] || "—"}</strong></span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Safety info disclaimer at the footer */}
      <div className="skeuo-card p-5 max-w-3xl mx-auto flex items-start gap-3.5 text-xs text-slate-600 leading-relaxed border border-white/95">
        <AlertCircle className="h-5 w-5 text-sky-600 shrink-0 mt-0.5" />
        <div>
          <h4 className="font-bold text-slate-900 skeuo-embossed-text">Patient Confidentiality & Accessibility Note</h4>
          <p className="mt-0.5 font-medium">
            To ensure patient privacy compliant with international healthcare recommendations, this public queuing screen never displays patient names, diagnosis descriptions, symptoms, phone numbers, or administrative registration IDs. It serves solely as a token calling mechanism visible from a distance.
          </p>
        </div>
      </div>

    </div>
  );
};

export const PublicDisplayPlaceholder = PublicWaitingDisplay;
