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
import { Badge } from "../components/ui/badge";
import { useMockDB } from "../hooks/useMockDB";
import { useLanguage } from "../context/LanguageContext";
import { subscribeToTVBroadcast, speakMedicalCall } from "../utils/broadcastEngine";

export const PublicWaitingDisplay: React.FC = () => {
  const [selectedDept, setSelectedDept] = useState("CARD");
  const [autoAnnounce, setAutoAnnounce] = useState(true);
  const [viewMode, setViewMode] = useState<"SINGLE_DEPT" | "HOSPITAL_GRID">("SINGLE_DEPT");
  const { language, setLanguage, t } = useLanguage();
  const tvLang = language === "hi" ? "HI" : "EN";
  const speechRate = 0.9;
  const [flashToken, setFlashToken] = useState<string | null>(null);

  const db = useMockDB();

  // Find department metadata dynamically from synchronized database state
  const currentDept = db.departments.find(d => d.code === selectedDept) || db.departments[0];
  const lastServedRef = useRef<string | null>(currentDept.nowServing);

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
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Settings bar / Controls */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 flex-wrap">
          <Tv className="h-5 w-5 text-slate-400" />
          <span className="text-sm font-semibold text-slate-700">{t("public.title")}</span>
          <Badge variant="neutral">Live TV Broadcast Command</Badge>
        </div>

        {/* Action Controls & Settings */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto text-xs">
          
          {/* View Mode Switcher */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 font-semibold">
            <button
              onClick={() => setViewMode("SINGLE_DEPT")}
              className={`px-2.5 py-1 rounded transition-colors ${
                viewMode === "SINGLE_DEPT" ? "bg-white text-slate-900 shadow-xs font-bold" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {t("public.singleClinic")}
            </button>
            <button
              onClick={() => setViewMode("HOSPITAL_GRID")}
              className={`px-2.5 py-1 rounded transition-colors flex items-center gap-1 ${
                viewMode === "HOSPITAL_GRID" ? "bg-white text-slate-900 shadow-xs font-bold" : "text-slate-500 hover:text-slate-700"
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
              className="text-xs border border-slate-300 rounded px-2.5 py-1.5 bg-white text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
            >
              {db.departments.map((d) => (
                <option key={d.code} value={d.code}>{t(`dept.${d.code}`) || d.name} ({d.room})</option>
              ))}
            </select>
          )}

          {/* Language Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 font-semibold">
            <Globe className="h-3.5 w-3.5 text-slate-400 ml-1 mr-0.5" />
            <button
              onClick={() => setLanguage("en")}
              className={`px-2 py-0.5 rounded transition-colors ${language === "en" ? "bg-white text-teal-700 font-bold" : "text-slate-500"}`}
            >
              ENG
            </button>
            <button
              onClick={() => setLanguage("hi")}
              className={`px-2 py-0.5 rounded transition-colors ${language === "hi" ? "bg-white text-teal-700 font-bold" : "text-slate-500"}`}
            >
              HIN
            </button>
          </div>

          {/* Auto Announce Toggle */}
          <Button 
            variant={autoAnnounce ? "primary" : "outline"} 
            size="sm"
            onClick={() => setAutoAnnounce(!autoAnnounce)}
            title="Toggle automatic voice calling when a patient is called"
          >
            {autoAnnounce ? <Volume2 className="h-4 w-4 mr-1 text-white" /> : <VolumeX className="h-4 w-4 mr-1 text-slate-400" />}
            <span>{autoAnnounce ? "Audio ON" : "Audio OFF"}</span>
          </Button>

          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              if (currentDept.nowServing) {
                speakMedicalCall(currentDept.nowServing, t(`dept.${currentDept.code}`) || currentDept.name, currentDept.room, tvLang, speechRate);
              }
            }}
            disabled={!currentDept.nowServing}
            title={currentDept.nowServing ? "Replay Voice Announcement" : "No token currently being served"}
          >
            <Volume2 className="h-4 w-4 text-teal-600 mr-1" />
            <span>Replay Voice</span>
          </Button>
        </div>
      </div>

      {/* Mode 1: Single Clinic Focus View */}
      {viewMode === "SINGLE_DEPT" && (
        <div className="bg-slate-950 text-white rounded-2xl border-4 border-slate-800 shadow-premium overflow-hidden p-6 sm:p-12 text-center space-y-12 relative">
          
          {/* Header Display */}
          <div className="flex justify-between items-center border-b border-slate-800 pb-6">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-teal-500 rounded-full flex items-center justify-center">
                <Building className="h-5 w-5 text-slate-950" />
              </div>
              <span className="text-lg sm:text-2xl font-bold tracking-tight text-slate-100 uppercase">
                {t(`dept.${currentDept.code}`) || currentDept.name} &mdash; {currentDept.room}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-600 animate-ping" />
              <span className="text-xs sm:text-sm font-mono text-slate-500 font-semibold tracking-widest">
                LIVE BROADCAST ({language.toUpperCase()})
              </span>
            </div>
          </div>

          {/* Primary Call: NOW SERVING */}
          {currentDept.nowServing ? (
            <div className="space-y-6">
              <span className="block text-slate-400 text-lg sm:text-xl font-bold tracking-widest uppercase">
                {t("public.nowServing")}
              </span>
              <div className={`text-7xl sm:text-9xl font-black tracking-tight font-mono transition-all duration-300 ${
                flashToken === currentDept.nowServing ? "text-amber-400 scale-105 animate-bounce drop-shadow-[0_0_25px_rgba(251,191,36,0.6)]" : "text-teal-400 drop-shadow-[0_0_15px_rgba(20,184,166,0.15)]"
              }`}>
                {currentDept.nowServing}
              </div>
              <p className="text-2xl sm:text-3xl text-slate-100 font-bold tracking-tight">
                {t("public.proceedTo")} <span className="underline decoration-teal-500 decoration-2 underline-offset-4">{currentDept.room}</span>
              </p>
            </div>
          ) : (
            <div className="space-y-6 py-12">
              <span className="block text-slate-500 text-lg sm:text-xl font-bold tracking-widest uppercase">
                DEPT QUEUE STATUS
              </span>
              <div className="text-4xl sm:text-6xl font-black tracking-tight text-slate-600 uppercase">
                {t("public.noTokenCalled")}
              </div>
            </div>
          )}

          {/* Next Tokens Row */}
          <div className="border-t border-slate-800 pt-8 flex flex-col sm:flex-row justify-between items-center gap-6">
            <span className="text-slate-400 text-sm sm:text-base font-bold tracking-wider uppercase">
              {t("public.nextWaiting")}
            </span>
            {currentDept.nextTokens.length > 0 ? (
              <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 font-mono text-xl sm:text-3xl font-extrabold text-slate-300">
                {currentDept.nextTokens.slice(0, 5).map((t, idx) => (
                  <React.Fragment key={t}>
                    {idx > 0 && <ChevronRight className="h-5 w-5 text-slate-600 shrink-0" />}
                    <span className="hover:text-white transition-colors duration-200">{t}</span>
                  </React.Fragment>
                ))}
                {currentDept.nextTokens.length > 5 && (
                  <span className="text-sm text-slate-500 font-sans tracking-wide">
                    +{currentDept.nextTokens.length - 5} more
                  </span>
                )}
              </div>
            ) : (
              <span className="text-slate-600 font-mono text-sm tracking-widest">
                NO PATIENTS WAITING
              </span>
            )}
          </div>

        </div>
      )}

      {/* Mode 2: Hospital-Wide Multi-Department Grid Ticker */}
      {viewMode === "HOSPITAL_GRID" && (
        <div className="bg-slate-950 text-white rounded-2xl border-4 border-slate-800 p-6 sm:p-8 space-y-6 shadow-premium">
          <div className="flex justify-between items-center border-b border-slate-800 pb-4">
            <h3 className="text-xl font-bold tracking-tight text-white uppercase flex items-center gap-2">
              <Grid className="h-5 w-5 text-teal-400" />
              <span>All OPD Clinics — Live Monitor Ticker</span>
            </h3>
            <span className="text-xs font-mono text-slate-400 uppercase tracking-widest">
              WALL MONITOR DISPLAY MODE
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {db.departments.map((dept) => {
              const isCalling = flashToken === dept.nowServing;
              return (
                <div 
                  key={dept.code}
                  className={`bg-slate-900 border ${
                    isCalling ? "border-amber-400 ring-2 ring-amber-400 animate-pulse" : "border-slate-800"
                  } rounded-xl p-4 space-y-3`}
                >
                  <div className="flex justify-between items-center border-b border-slate-800/80 pb-2">
                    <span className="font-bold text-sm text-slate-200 uppercase tracking-tight truncate">{dept.name}</span>
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">{dept.room}</span>
                  </div>

                  <div className="text-center py-2 space-y-1">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">NOW SERVING</span>
                    {dept.nowServing ? (
                      <span className="text-4xl font-black font-mono text-teal-400 tracking-tight block">
                        {dept.nowServing}
                      </span>
                    ) : (
                      <span className="text-lg font-bold text-slate-600 block uppercase">
                        {dept.status === "PAUSED" ? "PAUSED" : "STANDBY"}
                      </span>
                    )}
                  </div>

                  <div className="border-t border-slate-800/80 pt-2 flex justify-between items-center text-xs text-slate-400">
                    <span>Waiting: <strong className="text-slate-200">{dept.waiting}</strong></span>
                    <span>Next: <strong className="text-slate-300 font-mono">{dept.nextTokens[0] || "—"}</strong></span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Safety info disclaimer at the footer */}
      <div className="bg-slate-100 border border-slate-200 rounded-lg p-5 flex items-start gap-3.5 shadow-sm text-xs text-slate-500 leading-relaxed max-w-3xl mx-auto">
        <AlertCircle className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
        <div>
          <h4 className="font-semibold text-slate-700">Patient Confidentiality & Accessibility Note</h4>
          <p className="mt-0.5">
            To ensure patient privacy compliant with international healthcare recommendations, this public queuing screen never displays patient names, diagnosis descriptions, symptoms, phone numbers, or administrative registration IDs. It serves solely as a token calling mechanism visible from a distance.
          </p>
        </div>
      </div>

    </div>
  );
};

export const PublicDisplayPlaceholder = PublicWaitingDisplay;
