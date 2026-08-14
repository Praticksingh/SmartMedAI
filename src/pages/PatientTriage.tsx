import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  Search,
  Thermometer,
  Wind,
  Heart,
  Zap,
  Activity,
  XCircle,
  Info,
  Ticket,
  QrCode,
  Clock,
  ChevronRight,
  Volume2,
  Globe
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { addPatientVisit } from "../utils/mockState";
import { 
  speakTriageQuestion, 
  LANGUAGE_OPTIONS, 
  type LanguageCode 
} from "../utils/accessibilityEngine";
import {
  BODY_SYSTEMS,
  SYMPTOMS,
  DURATION_OPTIONS,
  runTriageEngine,
  getSymptomsBySystem,
  type BodySystem,
  type TriageInput,
  type TriageResult,
} from "../utils/triageEngine";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Stepper } from "../components/ui/stepper";

const SEVERITY_LABELS: Record<number, { label: string; color: string }> = {
  1:  { label: "No pain / Minimal",  color: "text-emerald-600" },
  2:  { label: "Very mild",          color: "text-emerald-500" },
  3:  { label: "Mild",               color: "text-teal-500"    },
  4:  { label: "Mild-Moderate",      color: "text-teal-600"    },
  5:  { label: "Moderate",           color: "text-amber-500"   },
  6:  { label: "Moderate-Severe",    color: "text-amber-600"   },
  7:  { label: "Severe",             color: "text-orange-500"  },
  8:  { label: "Very Severe",        color: "text-orange-600"  },
  9:  { label: "Extreme / Unbearable", color: "text-rose-500"  },
  10: { label: "Worst Possible",     color: "text-rose-700"    },
};

// ─── Component ────────────────────────────────────────────────────────────────

export const PatientTriage: React.FC = () => {
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  const { language, setLanguage, t, getSymptomName } = useLanguage();

  const patientName = profile?.fullName ?? user?.email?.split("@")[0] ?? "Guest";

  // Sync internal triage wizard lang state with centralized LanguageContext
  const lang: LanguageCode = language === "hi" ? "HI" : "EN";
  const setLang = (l: LanguageCode) => setLanguage(l === "HI" ? "hi" : "en");
  const [step, setStep] = useState(0);
  const [selectedSystem, setSelectedSystem] = useState<BodySystem | null>(null);
  const [selectedSymptomIds, setSelectedSymptomIds] = useState<string[]>([]);
  const [symptomSearch, setSymptomSearch] = useState("");
  const [severity, setSeverity] = useState(5);
  const [selectedDuration, setSelectedDuration] = useState(DURATION_OPTIONS[1]);
  const [hasFever, setHasFever] = useState(false);
  const [hasBreathingDifficulty, setHasBreathingDifficulty] = useState(false);
  const [hasChestPain, setHasChestPain] = useState(false);
  const [hasLossOfConsciousness, setHasLossOfConsciousness] = useState(false);
  const [isPregnant, setIsPregnant] = useState(false);
  const [isChild, setIsChild] = useState(false);
  const [isSenior, setIsSenior] = useState(false);
  const [additionalContext, setAdditionalContext] = useState("");

  const [triageResult, setTriageResult] = useState<TriageResult | null>(null);
  const [generatedVisit, setGeneratedVisit] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const triageStepsLocalized = [
    { label: t("triage.step0Label"), description: t("triage.step0Desc") },
    { label: t("triage.step1Label"), description: t("triage.step1Desc") },
    { label: t("triage.step2Label"), description: t("triage.step2Desc") },
    { label: t("triage.step3Label"), description: t("triage.step3Desc") },
    { label: t("triage.step4Label"), description: t("triage.step4Desc") },
    { label: t("triage.step5Label"), description: t("triage.step5Desc") },
  ];

  // Filtered symptoms for current system + search
  const systemSymptoms = useMemo(() => {
    const base = selectedSystem ? getSymptomsBySystem(selectedSystem) : SYMPTOMS;
    if (!symptomSearch) return base;
    const q = symptomSearch.toLowerCase();
    return base.filter(
      s => getSymptomName(s.id, s.label).toLowerCase().includes(q) ||
           s.label.toLowerCase().includes(q) ||
           s.keywords.some(k => k.toLowerCase().includes(q))
    );
  }, [selectedSystem, symptomSearch, language]);

  const toggleSymptom = (id: string) => {
    setSelectedSymptomIds(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const runAnalysis = () => {
    const input: TriageInput = {
      symptoms: selectedSymptomIds,
      severity,
      durationHours: selectedDuration.hours,
      hasFever,
      hasBreathingDifficulty,
      hasChestPain,
      hasLossOfConsciousness,
      isPregnant,
      isChild,
      isSenior,
      additionalContext,
    };
    const result = runTriageEngine(input);
    setTriageResult(result);
    setStep(4);
  };

  const confirmAndGetToken = async () => {
    if (!triageResult) return;
    setIsSubmitting(true);

    const visit = addPatientVisit(
      patientName,
      triageResult.recommendedDeptCode,
      triageResult.priorityCode,
      selectedSymptomIds.slice(0, 2).map(id => getSymptomName(id)).join(", ")
    );

    setGeneratedVisit(visit);
    setIsSubmitting(false);
    setStep(5);
  };

  const goBack = () => setStep(s => Math.max(0, s - 1));

  // ─── Step 0: Body System Selector ─────────────────────────────────────────

  const renderStep0 = () => (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-slate-800">{t("triage.step0Title")}</h2>
        <p className="text-sm text-slate-400 mt-1">{t("triage.step0Subtitle")}</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {(Object.entries(BODY_SYSTEMS) as [BodySystem, typeof BODY_SYSTEMS[BodySystem]][]).map(([system, meta]) => (
          <button
            key={system}
            onClick={() => { setSelectedSystem(system); setStep(1); }}
            className={`
              flex flex-col items-center gap-2 p-4 rounded-xl border-2 text-center transition-all duration-200 hover:shadow-md active:scale-95
              ${selectedSystem === system
                ? "border-teal-500 bg-teal-50 shadow-md"
                : "border-slate-200 bg-white hover:border-teal-300 hover:bg-teal-50/30"
              }
            `}
          >
            <span className="text-3xl leading-none">{meta.emoji}</span>
            <span className="text-xs font-semibold text-slate-700 leading-tight">{t(`sys.${system}`)}</span>
          </button>
        ))}
      </div>
      <button
        onClick={() => { setSelectedSystem(null); setStep(1); }}
        className="w-full py-2.5 text-xs text-slate-500 font-semibold hover:text-teal-600 transition-colors border border-dashed border-slate-300 rounded-lg"
      >
        {t("triage.notSure")}
      </button>
    </div>
  );

  // ─── Step 1: Symptom Multi-Picker ─────────────────────────────────────────

  const renderStep1 = () => (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-slate-800">{t("triage.step1Title")}</h2>
        <p className="text-sm text-slate-400 mt-1">{t("triage.step1Subtitle")}</p>
      </div>

      {/* Search box */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder={t("triage.searchSymptoms")}
          value={symptomSearch}
          onChange={e => setSymptomSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-300 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white"
        />
      </div>

      {/* Symptom tags */}
      <div className="max-h-72 overflow-y-auto pr-1 space-y-1.5">
        {systemSymptoms.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-8">{t("triage.noSymptoms")}</p>
        ) : (
          systemSymptoms.map(symptom => {
            const isSelected = selectedSymptomIds.includes(symptom.id);
            return (
              <button
                key={symptom.id}
                onClick={() => toggleSymptom(symptom.id)}
                className={`
                  w-full flex items-center justify-between px-4 py-3 rounded-lg border text-left
                  transition-all duration-150
                  ${isSelected
                    ? "border-teal-400 bg-teal-50 text-teal-800"
                    : "border-slate-200 bg-white text-slate-700 hover:border-teal-200 hover:bg-slate-50"
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <div className={`h-4 w-4 rounded border-2 flex items-center justify-center shrink-0 transition-all ${isSelected ? "border-teal-500 bg-teal-500" : "border-slate-300"}`}>
                    {isSelected && <CheckCircle2 className="h-3 w-3 text-white" />}
                  </div>
                  <span className="text-sm font-medium">{getSymptomName(symptom.id, symptom.label)}</span>
                </div>
                {symptom.redFlag && (
                  <span className="text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded-full shrink-0 ml-2">
                    {t("triage.redFlag")}
                  </span>
                )}
              </button>
            );
          })
        )}
      </div>

      {selectedSymptomIds.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {selectedSymptomIds.map(id => {
            const s = SYMPTOMS.find(sy => sy.id === id);
            return s ? (
              <span key={id} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-teal-100 text-teal-800 text-xs font-semibold">
                {getSymptomName(id, s.label)}
                <button onClick={() => toggleSymptom(id)} className="ml-0.5 text-teal-600 hover:text-teal-900">
                  <XCircle className="h-3 w-3" />
                </button>
              </span>
            ) : null;
          })}
        </div>
      )}
    </div>
  );

  // ─── Step 2: Severity & Duration ──────────────────────────────────────────

  const renderStep2 = () => {
    const sevLabel = SEVERITY_LABELS[severity];
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800">{t("triage.step2Title")}</h2>
          <p className="text-sm text-slate-400 mt-1">{t("triage.step2Subtitle")}</p>
        </div>

        {/* Severity slider */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500 font-medium">{t("triage.noPain")}</span>
            <span className={`text-2xl font-extrabold ${sevLabel.color}`}>{severity}</span>
            <span className="text-sm text-slate-500 font-medium">{t("triage.extreme")}</span>
          </div>
          <input
            type="range"
            min={1}
            max={10}
            value={severity}
            onChange={e => setSeverity(Number(e.target.value))}
            className="w-full h-3 appearance-none rounded-full cursor-pointer"
            style={{
              background: `linear-gradient(to right, #0d9488 0%, #0d9488 ${(severity - 1) / 9 * 100}%, #e2e8f0 ${(severity - 1) / 9 * 100}%, #e2e8f0 100%)`
            }}
          />
          <div className="text-center">
            <span className={`text-base font-bold ${sevLabel.color}`}>{sevLabel.label}</span>
          </div>
        </div>

        {/* Severity color band */}
        <div className="flex rounded-lg overflow-hidden h-3">
          {Array.from({ length: 10 }, (_, i) => {
            const lvl = i + 1;
            const color = lvl <= 3 ? "bg-emerald-400" : lvl <= 5 ? "bg-amber-400" : lvl <= 7 ? "bg-orange-400" : "bg-rose-500";
            return <div key={lvl} className={`flex-1 ${color} ${lvl <= severity ? "opacity-100" : "opacity-20"} transition-opacity duration-200`} />;
          })}
        </div>

        {/* Duration */}
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-slate-700">{t("triage.duration")}</h3>
          <div className="grid grid-cols-1 gap-2">
            {DURATION_OPTIONS.map((opt, idx) => {
              const durKeys = ["dur.h05", "dur.h3", "dur.h12", "dur.h48", "dur.h96"];
              const localizedLabel = t(durKeys[idx]) || opt.label;
              return (
                <button
                  key={opt.label}
                  onClick={() => setSelectedDuration(opt)}
                  className={`
                    flex items-center justify-between px-4 py-3 rounded-lg border text-sm font-medium transition-all
                    ${selectedDuration.label === opt.label
                      ? "border-teal-500 bg-teal-50 text-teal-800"
                      : "border-slate-200 bg-white text-slate-600 hover:border-teal-200"
                    }
                  `}
                >
                  <span>{localizedLabel}</span>
                  {selectedDuration.label === opt.label && <CheckCircle2 className="h-4 w-4 text-teal-600" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // ─── Step 3: Context Questions ─────────────────────────────────────────────

  const ContextToggle = ({ label, icon, value, onChange }: { label: string; icon: React.ReactNode; value: boolean; onChange: (v: boolean) => void }) => (
    <button
      onClick={() => onChange(!value)}
      className={`
        flex items-center gap-3 w-full px-4 py-3 rounded-lg border text-left transition-all
        ${value ? "border-rose-400 bg-rose-50 text-rose-800" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"}
      `}
    >
      <span className={`shrink-0 ${value ? "text-rose-500" : "text-slate-400"}`}>{icon}</span>
      <span className="text-sm font-medium">{label}</span>
      <div className={`ml-auto h-5 w-10 rounded-full transition-all duration-200 flex items-center px-0.5 ${value ? "bg-rose-500" : "bg-slate-200"}`}>
        <div className={`h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${value ? "translate-x-5" : "translate-x-0"}`} />
      </div>
    </button>
  );

  const renderStep3 = () => (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-slate-800">{t("triage.step3Title")}</h2>
        <p className="text-sm text-slate-400 mt-1">{t("triage.step3Subtitle")}</p>
      </div>

      <div className="space-y-2">
        <ContextToggle label={t("triage.fever")}                 icon={<Thermometer className="h-5 w-5" />} value={hasFever}               onChange={setHasFever} />
        <ContextToggle label={t("triage.difficultyBreathing")}    icon={<Wind className="h-5 w-5" />}        value={hasBreathingDifficulty} onChange={setHasBreathingDifficulty} />
        <ContextToggle label={t("triage.chestPain")}              icon={<Heart className="h-5 w-5" />}       value={hasChestPain}           onChange={setHasChestPain} />
        <ContextToggle label={t("triage.lossOfConsciousness")}   icon={<Zap className="h-5 w-5" />}         value={hasLossOfConsciousness} onChange={setHasLossOfConsciousness} />
        <ContextToggle label={t("triage.pregnant")}              icon={<Activity className="h-5 w-5" />}    value={isPregnant}             onChange={setIsPregnant} />
        <ContextToggle label={t("triage.child")}                 icon={<Activity className="h-5 w-5" />}    value={isChild}                onChange={setIsChild} />
        <ContextToggle label={t("triage.senior")}                icon={<Activity className="h-5 w-5" />}    value={isSenior}               onChange={setIsSenior} />
      </div>

      <div className="space-y-1.5">
        <label className="block text-sm font-semibold text-slate-700">
          {t("triage.anythingElse")} <span className="text-slate-400 font-normal">{t("triage.optional")}</span>
        </label>
        <textarea
          value={additionalContext}
          onChange={e => setAdditionalContext(e.target.value)}
          placeholder={t("triage.additionalPlaceholder")}
          rows={3}
          className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
        />
      </div>
    </div>
  );

  // ─── Step 4: AI Triage Result ─────────────────────────────────────────────

  const renderStep4 = () => {
    if (!triageResult) return null;
    const priorityColors: Record<string, string> = {
      P1: "from-rose-600 to-rose-700",
      P2: "from-orange-500 to-orange-600",
      P3: "from-amber-500 to-amber-600",
      P4: "from-teal-600 to-teal-700",
    };
    const priorityKey = triageResult.priority.toLowerCase();
    const localizedDeptName = t(`dept.${triageResult.recommendedDeptCode}`) || triageResult.recommendedDeptName;
    const localizedPriorityLabel = t(`prio.${priorityKey}`) || triageResult.priority;
    const localizedWait = t(`prio.wait${triageResult.priority}`) || triageResult.estimatedWaitLabel;

    return (
      <div className="space-y-5">
        <div>
          <h2 className="text-xl font-bold text-slate-800">{t("triage.step4Title")}</h2>
          <p className="text-sm text-slate-400 mt-1">{t("triage.step4Subtitle")}</p>
        </div>

        {/* Priority banner */}
        <div className={`rounded-2xl bg-gradient-to-r ${priorityColors[triageResult.priority]} p-5 text-white shadow-lg`}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold uppercase tracking-widest opacity-80">{t("triage.clinicalPriority")}</span>
            <span className="text-xs font-bold opacity-80">{t("triage.priorityScore")} {triageResult.score}</span>
          </div>
          <div className="text-3xl font-extrabold tracking-tight">{triageResult.priority}</div>
          <div className="text-sm font-semibold mt-1 opacity-90">
            {localizedPriorityLabel}
          </div>
          <div className="flex items-center gap-2 mt-3 text-xs font-semibold opacity-90">
            <Clock className="h-4 w-4" />
            {localizedWait}
          </div>
        </div>

        {/* Department recommendation */}
        <div className={`p-4 rounded-xl border-2 ${triageResult.borderClass} ${triageResult.bgClass}`}>
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">{t("triage.recommendedDept")}</div>
          <div className={`text-lg font-bold ${triageResult.colorClass}`}>{localizedDeptName}</div>
        </div>

        {/* AI Reasoning */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2 mb-3">
            <Info className="h-4 w-4 text-teal-600" />
            <span className="text-sm font-bold text-slate-700">{t("triage.clinicalReasoning")}</span>
          </div>
          {triageResult.reasoning.map((line, idx) => (
            <div key={idx} className="flex items-start gap-2 text-xs text-slate-600">
              <ChevronRight className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
              <span>{line}</span>
            </div>
          ))}
        </div>

        <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 text-xs text-amber-700">
          ⚠️ {t("triage.disclaimerNotice")}
        </div>
      </div>
    );
  };

  // ─── Step 5: Confirm Token ────────────────────────────────────────────────

  const renderStep5 = () => {
    if (!generatedVisit || !triageResult) return null;
    const localizedDeptName = t(`dept.${triageResult.recommendedDeptCode}`) || triageResult.recommendedDeptName;
    const localizedWait = t(`prio.wait${triageResult.priority}`) || triageResult.estimatedWaitLabel;

    return (
      <div className="space-y-5 text-center">
        <div className="h-16 w-16 rounded-full bg-teal-100 flex items-center justify-center mx-auto">
          <CheckCircle2 className="h-9 w-9 text-teal-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800">{t("triage.step5Title")}</h2>
          <p className="text-sm text-slate-400 mt-1">{t("triage.step5Subtitle")}</p>
        </div>

        {/* Token card */}
        <div className={`rounded-2xl border-2 ${triageResult.borderClass} ${triageResult.bgClass} p-6 space-y-4`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Ticket className={`h-5 w-5 ${triageResult.colorClass}`} />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{t("patient.opdTicket")}</span>
            </div>
            <Badge variant={triageResult.priorityCode as any}>{triageResult.priority}</Badge>
          </div>
          <div className={`text-5xl font-extrabold tracking-tight ${triageResult.colorClass}`}>
            {generatedVisit.tokenNumber}
          </div>
          <div className="text-sm font-semibold text-slate-700">{localizedDeptName}</div>
          <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
            <Clock className="h-3.5 w-3.5" />
            {t("patient.estWait")}: {localizedWait}
          </div>
          <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400">
            <QrCode className="h-4 w-4" />
            <span className="font-mono">{generatedVisit.qrCodeReference}</span>
          </div>
        </div>

        <div className="text-xs text-slate-400 leading-relaxed">
          {t("triage.step5Subtitle")}
        </div>

        <Button
          onClick={() => navigate("/patient")}
          variant="outline"
          className="w-full"
        >
          {t("triage.viewDashboard")}
        </Button>
      </div>
    );
  };

  // ─── Navigation helpers ────────────────────────────────────────────────────

  const canProceed = useMemo(() => {
    if (step === 0) return selectedSystem !== null;
    if (step === 1) return selectedSymptomIds.length > 0;
    return true;
  }, [step, selectedSystem, selectedSymptomIds]);

  const handleNext = () => {
    if (step === 3) { runAnalysis(); return; }
    if (step === 4) { confirmAndGetToken(); return; }
    setStep(s => s + 1);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">
              {t("triage.title")}
            </h1>
            <Badge variant="neutral">Phase 11 · Multi-Lingual Kiosk Touch</Badge>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">
            {t("triage.subtitle")}
          </p>
        </div>

        {/* Phase 11 Accessibility & Language Controls */}
        <div className="flex items-center gap-2">
          {/* Language Selector Dropdown */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-semibold">
            <Globe className="h-3.5 w-3.5 text-slate-400 ml-1.5 mr-1" />
            {LANGUAGE_OPTIONS.map((opt) => (
              <button
                key={opt.code}
                onClick={() => setLang(opt.code)}
                className={`px-2 py-0.5 rounded transition-colors ${
                  lang === opt.code ? "bg-teal-700 text-white font-bold" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {opt.nativeName}
              </button>
            ))}
          </div>

          {/* Read Out Loud Button */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => speakTriageQuestion(t("triage.subtitle"), lang)}
            title="Read triage instructions out loud"
            className="text-xs"
          >
            <Volume2 className="h-4 w-4 text-teal-600 mr-1" />
            <span className="hidden sm:inline">{t("triage.readOutLoud")}</span>
          </Button>

          {step < 5 && (
            <button
              onClick={() => navigate("/patient")}
              className="text-xs text-slate-400 hover:text-slate-600 font-semibold transition-colors"
            >
              {t("btn.cancel")} ✕
            </button>
          )}
        </div>
      </div>

      {/* Stepper */}
      {step < 5 && (
        <div className="bg-white border border-slate-200 rounded-xl px-6 py-5 shadow-sm">
          <Stepper steps={triageStepsLocalized} currentStep={step} />
        </div>
      )}

      {/* P1 red-flag banner */}
      {(hasBreathingDifficulty || hasChestPain || hasLossOfConsciousness) && step < 5 && (
        <div className="flex items-start gap-3 bg-rose-50 border border-rose-300 rounded-xl px-5 py-4">
          <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-rose-800">Emergency symptoms detected</p>
            <p className="text-xs text-rose-600 mt-0.5">If you are in immediate danger, please go directly to the emergency department or call emergency services.</p>
          </div>
        </div>
      )}

      {/* Step content */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm min-h-[400px]">
        {step === 0 && renderStep0()}
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}
        {step === 5 && renderStep5()}
      </div>

      {/* Navigation */}
      {step < 5 && step !== 0 && (
        <div className="flex items-center justify-between gap-4">
          <Button variant="outline" onClick={goBack} disabled={step === 0}>
            <ArrowLeft className="h-4 w-4 mr-1.5" /> {t("btn.back")}
          </Button>

          {step < 4 ? (
            <Button onClick={handleNext} disabled={!canProceed}>
              {step === 3 ? (
                <><Activity className="h-4 w-4 mr-1.5" /> {t("triage.step4Title")}</>
              ) : (
                <>{t("btn.continue")} <ArrowRight className="h-4 w-4 ml-1.5" /></>
              )}
            </Button>
          ) : (
            <Button onClick={handleNext} isLoading={isSubmitting} className="shadow-md">
              <Ticket className="h-4 w-4 mr-1.5" /> {t("triage.confirmGetToken")}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
