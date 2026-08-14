/**
 * OPDFlow AI — Multi-Lingual Accessibility & Audio Voice Guidance Engine v1
 * 
 * Provides localized translations for English, Hindi (हिंदी), and Bengali (বাংলা),
 * as well as auditory voice reading for patient triage intake.
 */

export type LanguageCode = "EN" | "HI" | "BN";

export interface LanguageOption {
  code: LanguageCode;
  label: string;
  nativeName: string;
}

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: "EN", label: "English", nativeName: "English" },
  { code: "HI", label: "Hindi", nativeName: "हिंदी" },
  { code: "BN", label: "Bengali", nativeName: "বাংলা" },
];

const TRANSLATIONS: Record<string, Record<LanguageCode, string>> = {
  triageTitle: {
    EN: "AI Preliminary Symptom Triage Assessment",
    HI: "एआई प्रारंभिक लक्षण जांच मूल्यांकन",
    BN: "এআই প্রাথমিক লক্ষণ মূল্যায়ন",
  },
  triageSubtitle: {
    EN: "Select your primary symptoms to receive an automated queue priority token.",
    HI: "स्वचालित कतार प्राथमिकता टोकन प्राप्त करने के लिए अपने प्राथमिक लक्षण चुनें।",
    BN: "স্বয়ংক্রিয় কিউ অগ্রাধিকার টোকেন পেতে আপনার প্রাথমিক লক্ষণগুলি নির্বাচন করুন।",
  },
  nextStep: {
    EN: "Proceed to Next Step",
    HI: "अगले चरण पर जाएं",
    BN: "পরবর্তী পদক্ষেপে যান",
  },
  previousStep: {
    EN: "Back to Previous Step",
    HI: "पिछले चरण पर वापस जाएं",
    BN: "আগের পদক্ষেপে ফিরে যান",
  },
  submitTriage: {
    EN: "Submit & Generate OPD Pass",
    HI: "सबमिट करें और ओपीडी पास जनरेट करें",
    BN: "জমা দিন এবং ওপিডি পাস তৈরি করুন",
  },
  readOutLoud: {
    EN: "Read Question Out Loud",
    HI: "प्रश्न जोर से पढ़ें",
    BN: "প্রশ্নটি উচ্চস্বরে পড়ুন",
  },
};

/**
 * Resolves translated string for a given key and language
 */
export const getTranslation = (key: string, lang: LanguageCode = "EN"): string => {
  if (TRANSLATIONS[key] && TRANSLATIONS[key][lang]) {
    return TRANSLATIONS[key][lang];
  }
  return TRANSLATIONS[key]?.EN || key;
};

/**
 * Reads triage questions out loud using browser SpeechSynthesis
 */
export const speakTriageQuestion = (text: string, lang: LanguageCode = "EN") => {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.9;

  if (lang === "HI") {
    utterance.lang = "hi-IN";
  } else if (lang === "BN") {
    utterance.lang = "bn-IN";
  } else {
    utterance.lang = "en-IN";
  }

  window.speechSynthesis.speak(utterance);
};
