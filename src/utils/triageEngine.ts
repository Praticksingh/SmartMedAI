/**
 * OPDFlow AI — Triage Engine v1
 *
 * Implements a rule-based priority scoring system with:
 * - Structured symptom taxonomy (body systems → symptoms)
 * - Severity + duration multipliers
 * - Red-flag keyword detection (immediate P1 override)
 * - Department auto-recommendation
 * - Human-readable AI reasoning chain
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type TriagePriority = "P1" | "P2" | "P3" | "P4";
export type BodySystem =
  | "cardiac"
  | "respiratory"
  | "neurological"
  | "gastrointestinal"
  | "musculoskeletal"
  | "dermatological"
  | "urological"
  | "psychiatric"
  | "pediatric"
  | "general";

export interface Symptom {
  id: string;
  label: string;
  system: BodySystem;
  baseScore: number; // 1–10: higher = more urgent
  redFlag: boolean;  // true = automatic P1 consideration
  keywords: string[];
}

export interface TriageInput {
  symptoms: string[]; // symptom IDs
  severity: number;   // 1–10 pain/distress scale
  durationHours: number; // how long symptoms have been present
  hasFever: boolean;
  hasBreathingDifficulty: boolean;
  hasChestPain: boolean;
  hasLossOfConsciousness: boolean;
  isPregnant: boolean;
  isChild: boolean; // under 12
  isSenior: boolean; // over 65
  additionalContext: string; // free text
  isDisasterSurgeActive?: boolean;
  surgeReason?: string;
}

export interface TriageResult {
  priority: TriagePriority;
  priorityCode: "p1" | "p2" | "p3" | "p4";
  score: number; // raw computed score
  recommendedDeptCode: string;
  recommendedDeptName: string;
  reasoning: string[]; // list of human-readable rationale bullets
  estimatedWaitLabel: string;
  colorClass: string;
  bgClass: string;
  borderClass: string;
}

// ─── Symptom taxonomy ─────────────────────────────────────────────────────────

export const SYMPTOMS: Symptom[] = [
  // Cardiac
  { id: "chest_pain",         label: "Chest Pain",             system: "cardiac",         baseScore: 9,  redFlag: true,  keywords: ["chest", "heart", "angina", "crushing"] },
  { id: "palpitations",       label: "Palpitations / Irregular Heartbeat", system: "cardiac", baseScore: 7, redFlag: false, keywords: ["palpitation", "racing heart", "irregular", "fluttering"] },
  { id: "swelling_legs",      label: "Leg Swelling / Oedema",  system: "cardiac",         baseScore: 5,  redFlag: false, keywords: ["swelling", "oedema", "edema", "puffy feet"] },
  { id: "fainting",           label: "Fainting / Syncope",     system: "cardiac",         baseScore: 8,  redFlag: true,  keywords: ["faint", "syncope", "blackout", "lost consciousness"] },

  // Respiratory
  { id: "breathlessness",     label: "Breathlessness / Shortness of Breath", system: "respiratory", baseScore: 9, redFlag: true, keywords: ["breathless", "short of breath", "dyspnea", "can't breathe"] },
  { id: "wheezing",           label: "Wheezing / Asthma Attack", system: "respiratory",   baseScore: 7,  redFlag: false, keywords: ["wheeze", "asthma", "whistle", "tight chest"] },
  { id: "persistent_cough",   label: "Persistent Cough",       system: "respiratory",     baseScore: 4,  redFlag: false, keywords: ["cough", "throat", "dry cough", "wet cough"] },
  { id: "blood_in_sputum",    label: "Blood in Sputum / Haemoptysis", system: "respiratory", baseScore: 8, redFlag: true, keywords: ["blood sputum", "haemoptysis", "coughing blood"] },

  // Neurological
  { id: "severe_headache",    label: "Severe / Sudden Headache", system: "neurological",  baseScore: 8,  redFlag: true,  keywords: ["worst headache", "thunderclap", "sudden severe"] },
  { id: "vision_changes",     label: "Vision Changes / Blurring", system: "neurological", baseScore: 7,  redFlag: false, keywords: ["blurry vision", "double vision", "vision loss"] },
  { id: "weakness_numbness",  label: "Limb Weakness / Numbness", system: "neurological",  baseScore: 8,  redFlag: true,  keywords: ["weakness", "numbness", "paralysis", "arm drooping"] },
  { id: "seizure",            label: "Seizure / Fits",          system: "neurological",   baseScore: 10, redFlag: true,  keywords: ["seizure", "fit", "convulsion", "epilepsy"] },
  { id: "dizziness",          label: "Dizziness / Vertigo",     system: "neurological",   baseScore: 5,  redFlag: false, keywords: ["dizzy", "vertigo", "spinning", "lightheaded"] },
  { id: "confusion",          label: "Confusion / Altered Mental Status", system: "neurological", baseScore: 9, redFlag: true, keywords: ["confused", "disoriented", "altered", "not responding"] },

  // Gastrointestinal
  { id: "severe_abdo_pain",   label: "Severe Abdominal Pain",  system: "gastrointestinal", baseScore: 8, redFlag: true,  keywords: ["severe abdo", "stomach pain", "peritonitis", "rigid belly"] },
  { id: "nausea_vomiting",    label: "Nausea / Vomiting",      system: "gastrointestinal", baseScore: 4, redFlag: false, keywords: ["nausea", "vomiting", "throwing up", "sick"] },
  { id: "diarrhoea",          label: "Diarrhoea",              system: "gastrointestinal", baseScore: 3, redFlag: false, keywords: ["diarrhoea", "diarrhea", "loose stool", "watery stool"] },
  { id: "blood_in_stool",     label: "Blood in Stool / PR Bleed", system: "gastrointestinal", baseScore: 7, redFlag: true, keywords: ["blood stool", "rectal bleed", "melena", "haematochezia"] },
  { id: "jaundice",           label: "Jaundice / Yellow Skin", system: "gastrointestinal", baseScore: 7, redFlag: false, keywords: ["jaundice", "yellow skin", "yellow eyes", "scleral icterus"] },

  // Musculoskeletal
  { id: "joint_pain",         label: "Joint Pain / Arthritis", system: "musculoskeletal", baseScore: 3,  redFlag: false, keywords: ["joint", "arthritis", "rheumatoid", "swollen joint"] },
  { id: "back_pain",          label: "Back Pain",              system: "musculoskeletal", baseScore: 3,  redFlag: false, keywords: ["back pain", "lumbar", "spine", "disc"] },
  { id: "fracture_suspected", label: "Suspected Fracture / Trauma", system: "musculoskeletal", baseScore: 7, redFlag: false, keywords: ["fracture", "broken", "trauma", "injury"] },
  { id: "muscle_weakness",    label: "Widespread Muscle Weakness", system: "musculoskeletal", baseScore: 5, redFlag: false, keywords: ["muscle weakness", "myopathy", "can't walk"] },

  // Dermatological
  { id: "rash",               label: "Rash / Skin Lesion",    system: "dermatological",  baseScore: 3,  redFlag: false, keywords: ["rash", "skin", "lesion", "eczema"] },
  { id: "urticaria",          label: "Hives / Urticaria",     system: "dermatological",  baseScore: 5,  redFlag: false, keywords: ["urticaria", "hives", "itchy rash", "allergic rash"] },
  { id: "anaphylaxis_signs",  label: "Signs of Anaphylaxis",  system: "dermatological",  baseScore: 10, redFlag: true,  keywords: ["anaphylaxis", "throat swelling", "allergic shock"] },
  { id: "wound_infection",    label: "Wound / Infection",     system: "dermatological",  baseScore: 4,  redFlag: false, keywords: ["wound", "infection", "pus", "abscess"] },

  // Urological
  { id: "dysuria",            label: "Painful Urination / UTI", system: "urological",    baseScore: 4,  redFlag: false, keywords: ["dysuria", "uti", "burning urine", "frequency"] },
  { id: "blood_in_urine",     label: "Blood in Urine / Haematuria", system: "urological", baseScore: 6, redFlag: false, keywords: ["haematuria", "blood urine", "pink urine"] },
  { id: "renal_colic",        label: "Renal / Ureteric Colic", system: "urological",     baseScore: 7,  redFlag: false, keywords: ["renal colic", "kidney stone", "ureteric", "loin pain"] },

  // Psychiatric
  { id: "anxiety_panic",      label: "Anxiety / Panic Attack", system: "psychiatric",    baseScore: 5,  redFlag: false, keywords: ["anxiety", "panic", "fear", "hyperventilate"] },
  { id: "self_harm",          label: "Self-Harm / Suicidal Ideation", system: "psychiatric", baseScore: 10, redFlag: true, keywords: ["self harm", "suicidal", "suicide", "overdose"] },
  { id: "psychosis",          label: "Acute Psychosis / Hallucinations", system: "psychiatric", baseScore: 8, redFlag: true, keywords: ["psychosis", "hallucination", "hearing voices"] },

  // Pediatric
  { id: "high_fever_child",   label: "High Fever in Child (<12)",   system: "pediatric", baseScore: 7, redFlag: false, keywords: ["child fever", "infant fever", "febrile child"] },
  { id: "febrile_seizure",    label: "Febrile Seizure (Child)",     system: "pediatric", baseScore: 10, redFlag: true, keywords: ["febrile seizure", "child fit", "baby convulsion"] },
  { id: "choking_infant",     label: "Choking / Airway Obstruction", system: "pediatric", baseScore: 10, redFlag: true, keywords: ["choking", "airway", "foreign body"] },

  // General
  { id: "high_fever",         label: "High Fever (>38.5 °C)",      system: "general",   baseScore: 5,  redFlag: false, keywords: ["fever", "high temperature", "pyrexia"] },
  { id: "dehydration",        label: "Severe Dehydration",         system: "general",    baseScore: 6,  redFlag: false, keywords: ["dehydration", "dry mouth", "no urine", "sunken eyes"] },
  { id: "malaise_fatigue",    label: "General Malaise / Fatigue",  system: "general",    baseScore: 2,  redFlag: false, keywords: ["tired", "fatigue", "weakness", "unwell"] },
  { id: "weight_loss",        label: "Unexplained Weight Loss",    system: "general",    baseScore: 4,  redFlag: false, keywords: ["weight loss", "losing weight"] },
];

// ─── Body system metadata ─────────────────────────────────────────────────────

export const BODY_SYSTEMS: Record<BodySystem, { label: string; emoji: string; deptCode: string; deptName: string }> = {
  cardiac:          { label: "Heart & Circulation",  emoji: "❤️",  deptCode: "CARD",  deptName: "Cardiology" },
  respiratory:      { label: "Lungs & Breathing",    emoji: "🫁",  deptCode: "RESP",  deptName: "Respiratory Medicine" },
  neurological:     { label: "Brain & Nerves",       emoji: "🧠",  deptCode: "NEURO", deptName: "Neurology" },
  gastrointestinal: { label: "Stomach & Digestive",  emoji: "🫀",  deptCode: "GASTRO",deptName: "Gastroenterology" },
  musculoskeletal:  { label: "Bones & Muscles",      emoji: "🦴",  deptCode: "ORTHO", deptName: "Orthopaedics" },
  dermatological:   { label: "Skin & Allergy",       emoji: "🩺",  deptCode: "DERM",  deptName: "Dermatology" },
  urological:       { label: "Kidney & Urinary",     emoji: "💧",  deptCode: "UROL",  deptName: "Urology" },
  psychiatric:      { label: "Mental Health",        emoji: "🧘",  deptCode: "PSYCH", deptName: "Psychiatry" },
  pediatric:        { label: "Children's Health",    emoji: "👶",  deptCode: "PEDI",  deptName: "Paediatrics" },
  general:          { label: "General / Other",      emoji: "🏥",  deptCode: "GENMED",deptName: "General Medicine" },
};

// ─── Priority definitions ─────────────────────────────────────────────────────

const PRIORITY_META: Record<TriagePriority, {
  code: "p1" | "p2" | "p3" | "p4";
  label: string;
  waitLabel: string;
  colorClass: string;
  bgClass: string;
  borderClass: string;
}> = {
  P1: { code: "p1", label: "P1 — Critical / Immediate", waitLabel: "Immediate (<5 min)", colorClass: "text-rose-700", bgClass: "bg-rose-50", borderClass: "border-rose-300" },
  P2: { code: "p2", label: "P2 — High / Urgent",        waitLabel: "Within 15 minutes",  colorClass: "text-orange-700", bgClass: "bg-orange-50", borderClass: "border-orange-300" },
  P3: { code: "p3", label: "P3 — Moderate / Semi-urgent", waitLabel: "Within 30 minutes", colorClass: "text-amber-700", bgClass: "bg-amber-50", borderClass: "border-amber-300" },
  P4: { code: "p4", label: "P4 — Routine / Non-urgent",   waitLabel: "Within 60 minutes", colorClass: "text-teal-700", bgClass: "bg-teal-50", borderClass: "border-teal-300" },
};

// ─── Core scoring function ────────────────────────────────────────────────────

export const runTriageEngine = (input: TriageInput): TriageResult => {
  const selectedSymptoms = SYMPTOMS.filter(s => input.symptoms.includes(s.id));
  const reasoning: string[] = [];
  let score = 0;

  // 1. Base symptom scores (highest 3 symptoms)
  const sortedByScore = [...selectedSymptoms].sort((a, b) => b.baseScore - a.baseScore);
  const topSymptoms = sortedByScore.slice(0, 3);
  const symptomScore = topSymptoms.reduce((acc, s) => acc + s.baseScore, 0);
  score += symptomScore;
  if (topSymptoms.length > 0) {
    reasoning.push(`Primary symptoms reported: ${topSymptoms.map(s => s.label).join(", ")}.`);
  }

  // 2. Severity multiplier
  const severityMult = 1 + (input.severity - 1) * 0.08;
  score *= severityMult;
  if (input.severity >= 8) {
    reasoning.push(`High self-reported severity (${input.severity}/10) — significant distress indicated.`);
  } else if (input.severity >= 5) {
    reasoning.push(`Moderate severity (${input.severity}/10).`);
  }

  // 3. Duration factor — recent onset can be more acute
  if (input.durationHours <= 1) {
    score += 5;
    reasoning.push("Very recent onset (< 1 hour) — acute presentation, requires prompt evaluation.");
  } else if (input.durationHours <= 6) {
    score += 3;
    reasoning.push("Acute onset (< 6 hours) — warrants timely clinical assessment.");
  } else if (input.durationHours > 72) {
    score -= 2;
    reasoning.push("Chronic / long-duration presentation (>72 hours) — likely sub-acute.");
  }

  // 4. Red-flag overrides
  const redFlagSymptoms = selectedSymptoms.filter(s => s.redFlag);
  if (redFlagSymptoms.length > 0) {
    score = Math.max(score, 28); // forces P1 floor
    reasoning.push(`🚨 Red-flag symptom(s) detected: ${redFlagSymptoms.map(s => s.label).join(", ")} — immediate clinical review required.`);
  }

  // 5. Special context bonuses
  if (input.hasLossOfConsciousness) { score += 10; reasoning.push("Loss of consciousness — emergency presentation."); }
  if (input.hasBreathingDifficulty) { score += 8;  reasoning.push("Breathing difficulty reported — respiratory compromise possible."); }
  if (input.hasChestPain)           { score += 8;  reasoning.push("Chest pain — cardiac cause must be excluded urgently."); }
  if (input.hasFever && input.severity >= 7) { score += 4; reasoning.push("High fever with severe symptoms — systemic infection / sepsis risk."); }
  if (input.isChild)  { score += 4; reasoning.push("Paediatric patient — lower threshold for urgent triage."); }
  if (input.isSenior) { score += 3; reasoning.push("Senior patient — increased vulnerability, closer monitoring advised."); }
  if (input.isPregnant) { score += 5; reasoning.push("Patient is pregnant — obstetric risk assessment required."); }

  // 5b. Hospital Disaster Surge Mode Emergency Override
  if (input.isDisasterSurgeActive) {
    score = Math.max(score, 35);
    reasoning.unshift(`🚨 CODE DISASTER: Hospital Surge Protocol Active (${input.surgeReason || "Mass Casualty / Epidemic Alert"}). Intake auto-escalated to P1 Critical priority.`);
  }

  // 6. Map score → priority
  let priority: TriagePriority;
  if (score >= 28)      priority = "P1";
  else if (score >= 18) priority = "P2";
  else if (score >= 10) priority = "P3";
  else                  priority = "P4";

  // 7. Department recommendation — most urgent symptom's system wins
  const topSystem = topSymptoms[0]?.system ?? "general";
  let deptInfo = BODY_SYSTEMS[topSystem];

  // Override: certain context forces specific depts
  if (input.isChild) deptInfo = BODY_SYSTEMS.pediatric;
  if (input.isPregnant) deptInfo = { label: "Obstetrics", emoji: "🤰", deptCode: "OBS", deptName: "Obstetrics & Gynaecology" };

  // Add department recommendation to reasoning
  reasoning.push(`Recommended department: ${deptInfo.deptName} based on primary symptom presentation.`);

  if (priority === "P4") {
    reasoning.push("No red-flag features identified. Routine triage pathway appropriate.");
  }

  const meta = PRIORITY_META[priority];

  return {
    priority,
    priorityCode: meta.code,
    score: Math.round(score),
    recommendedDeptCode: deptInfo.deptCode,
    recommendedDeptName: deptInfo.deptName,
    reasoning,
    estimatedWaitLabel: meta.waitLabel,
    colorClass: meta.colorClass,
    bgClass: meta.bgClass,
    borderClass: meta.borderClass,
  };
};

// ─── Helper: get symptoms by system ──────────────────────────────────────────

export const getSymptomsBySystem = (system: BodySystem): Symptom[] =>
  SYMPTOMS.filter(s => s.system === system);

export const getSymptomById = (id: string): Symptom | undefined =>
  SYMPTOMS.find(s => s.id === id);

// ─── Duration options ─────────────────────────────────────────────────────────

export const DURATION_OPTIONS = [
  { label: "Just started (< 1 hour)",  hours: 0.5 },
  { label: "1 – 6 hours",              hours: 3 },
  { label: "6 – 24 hours",             hours: 12 },
  { label: "1 – 3 days",               hours: 48 },
  { label: "More than 3 days",         hours: 96 },
];
