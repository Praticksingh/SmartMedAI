import React, { createContext, useContext, useState } from "react";

export type Language = "en" | "hi";

export const translations: Record<Language, Record<string, string>> = {
  en: {
    // Nav & Shell
    "nav.patientDashboard": "Patient Dashboard",
    "nav.staffDashboard": "Staff Dashboard",
    "nav.hospitalAdmin": "Hospital Admin",
    "nav.publicQueue": "Public Queue",
    "nav.signOut": "Sign Out",
    "nav.myDashboard": "My Dashboard",

    // Language Toggle Accessibility
    "lang.toggle": "Switch Language / भाषा बदलें",
    "lang.en": "English",
    "lang.hi": "हिंदी",
    "lang.helperMessage": "You can change the language anytime.",

    // Landing Page
    "landing.badge": "Intelligent Queue Management",
    "landing.title": "Streamlining Hospital Flow with AI Triage",
    "landing.subtitle": "OPDFlow AI helps public healthcare clinics optimize wait times, prioritize critical cases deterministic-first, and coordinate QR-based patient flow securely.",
    "landing.patientsWaiting": "Patients Waiting",
    "landing.waitingDesc": "Waiting in Active Queues",
    "landing.activeTreatments": "Active Treatments",
    "landing.treatmentsDesc": "Clinical Treatments in Progress",
    "landing.pausedWarnings": "Clinic Overload Warnings",
    "landing.pausedText": "Paused",
    "landing.selectWorkspace": "Select Your Workspace / Dashboard",
    "landing.selectSub": "Choose a route to view the functional shell and mock features.",
    "landing.patientPortalTitle": "Patient Portal",
    "landing.patientPortalDesc": "Start symptom assessment, receive priority triage recommendation, and check in via secure QR code.",
    "landing.startPatientFlow": "Start Patient Flow",

    // Patient Dashboard Header
    "patient.hubTitle": "Patient OPD Hub",
    "patient.greeting": "Namaste",
    "patient.profileVerified": "Profile Verified",

    // Symptom Card Intake
    "patient.symptomTitle": "Do you have symptoms today?",
    "patient.symptomDesc": "Start our guided symptom intake assistant. Our AI will analyze your symptoms to provide a preliminary triage recommendation to direct you to the correct department queue.",
    "patient.disclaimerTitle": "Important Medical Disclaimer",
    "patient.disclaimerDesc": "This assessment is a hackathon prototype helper for routing purposes and does not substitute professional clinical diagnostics, medical treatment, or healthcare thresholds.",
    "patient.startAssessment": "Start AI Triage Assessment",

    // Previous Visits Log
    "patient.previousVisits": "Previous Visits Log",
    "patient.statusCompleted": "Completed",
    "patient.statusNoShow": "No Show",
    "patient.statusCancelled": "Cancelled",

    // Active Token Ticket
    "patient.activeTokenStatus": "Active Token Status",
    "patient.opdTicket": "OPD CLINIC TICKET",
    "patient.yourTokenNumber": "YOUR TOKEN NUMBER",
    "patient.queuePosition": "Queue Position",
    "patient.ahead": "ahead",
    "patient.currentlyCalled": "Currently Called / In Consultation",
    "patient.joinVideoCall": "Join Virtual Video Consultation Room",
    "patient.urgencyLevel": "Urgency Level",
    "patient.status": "Status",
    "patient.estWait": "Est. Wait",
    "patient.cancelToken": "Cancel Active Token",
    "patient.noActiveTicket": "No Active Ticket",
    "patient.noActiveTicketDesc": "You currently do not have an active queue token. Start a symptom assessment to generate a ticket.",
    "patient.getOpdToken": "Get OPD Token",

    // Post-Consultation Passes
    "pass.pharmacyTitle": "Pharmacy Dispensary Pass",
    "pass.pickupLocation": "Pickup Location:",
    "pass.labTitle": "Pathology Lab Sample Pass",
    "pass.sampleDesk": "Sample Collection Desk:",

    // Patient Triage Assessment Wizard Steps & Headings
    "triage.title": "AI Preliminary Symptom Triage Assessment",
    "triage.subtitle": "Select your primary symptoms to receive an automated queue priority token.",
    "triage.readOutLoud": "Read Question Out Loud",

    "triage.step0Label": "Body System",
    "triage.step0Desc": "Affected area",
    "triage.step1Label": "Symptoms",
    "triage.step1Desc": "What you feel",
    "triage.step2Label": "Severity",
    "triage.step2Desc": "How bad?",
    "triage.step3Label": "Context",
    "triage.step3Desc": "Risk factors",
    "triage.step4Label": "AI Analysis",
    "triage.step4Desc": "Priority score",
    "triage.step5Label": "Confirm",
    "triage.step5Desc": "Get token",

    // Triage Step 0
    "triage.step0Title": "Which area is affected?",
    "triage.step0Subtitle": "Select the body system closest to your main concern. You can pick specific symptoms next.",
    "triage.notSure": "Not sure — show me all symptoms",

    // Triage Step 1
    "triage.step1Title": "Select your symptoms",
    "triage.step1Subtitle": "Choose all that apply. Select at least one to continue.",
    "triage.searchSymptoms": "Search symptoms…",
    "triage.noSymptoms": "No symptoms found for your search.",
    "triage.redFlag": "RED FLAG",

    // Triage Step 2
    "triage.step2Title": "How severe are your symptoms?",
    "triage.step2Subtitle": "Rate your overall distress level from 1 (none) to 10 (worst possible).",
    "triage.noPain": "1 — No pain",
    "triage.extreme": "10 — Extreme",
    "triage.duration": "How long have you had these symptoms?",

    // Triage Step 3
    "triage.step3Title": "Additional context",
    "triage.step3Subtitle": "Toggle any that apply — these help determine urgency.",
    "triage.fever": "Fever / High Temperature",
    "triage.difficultyBreathing": "Difficulty Breathing",
    "triage.chestPain": "Chest Pain / Tightness",
    "triage.lossOfConsciousness": "Loss of Consciousness",
    "triage.pregnant": "Currently Pregnant",
    "triage.child": "Patient is a Child (< 12)",
    "triage.senior": "Senior Patient (> 65)",
    "triage.anythingElse": "Anything else?",
    "triage.optional": "(Optional)",
    "triage.additionalPlaceholder": "E.g. diabetic patient, recent surgery, known allergies…",

    // Triage Step 4 - AI Result
    "triage.step4Title": "AI Triage Result",
    "triage.step4Subtitle": "Based on your inputs, our clinical decision engine has assessed your case.",
    "triage.clinicalPriority": "Clinical Priority",
    "triage.priorityScore": "Score:",
    "triage.recommendedDept": "Recommended Department",
    "triage.clinicalReasoning": "Clinical Reasoning",
    "triage.disclaimerNotice": "Disclaimer: This is an AI-assisted routing aid only. Clinical priority is assigned by qualified healthcare staff upon arrival.",

    // Triage Step 5 - Confirmation
    "triage.step5Title": "OPD Token Issued Successfully!",
    "triage.step5Subtitle": "Present this digital pass at the department reception or monitor the public display screen.",
    "triage.viewDashboard": "Go to Patient Dashboard",

    // Common Buttons & Controls
    "btn.continue": "Continue",
    "btn.back": "Back",
    "btn.profile": "Profile",
    "btn.logout": "Logout",
    "btn.submit": "Submit",
    "btn.cancel": "Cancel",
    "btn.save": "Save Changes",

    // Public Display Screen
    "public.title": "Clinic TV Display Monitor",
    "public.singleClinic": "Single Clinic",
    "public.hospitalGrid": "Hospital Grid Ticker",
    "public.nowServing": "NOW SERVING",
    "public.nextWaiting": "NEXT WAITING TO BE CALLED",
    "public.proceedTo": "Please proceed to Counter / Room:",
    "public.noTokenCalled": "No Token Currently Called",

    // Body Systems Taxonomy
    "sys.cardiac": "Heart & Circulation",
    "sys.respiratory": "Lungs & Breathing",
    "sys.neurological": "Brain & Nerves",
    "sys.gastrointestinal": "Stomach & Digestive",
    "sys.musculoskeletal": "Bones & Muscles",
    "sys.dermatological": "Skin & Allergy",
    "sys.urological": "Kidney & Urinary",
    "sys.psychiatric": "Mental Health",
    "sys.pediatric": "Children's Health",
    "sys.general": "General / Other",

    // Departments Taxonomy
    "dept.CARD": "Cardiology",
    "dept.RESP": "Respiratory Medicine",
    "dept.NEURO": "Neurology",
    "dept.GASTRO": "Gastroenterology",
    "dept.ORTHO": "Orthopaedics",
    "dept.DERM": "Dermatology",
    "dept.UROL": "Urology",
    "dept.PSYCH": "Psychiatry",
    "dept.PEDI": "Paediatrics",
    "dept.GENMED": "General Medicine",
    "dept.OBS": "Obstetrics & Gynaecology",

    // Duration Options
    "dur.h05": "Just started (< 1 hour)",
    "dur.h3": "1 – 6 hours",
    "dur.h12": "6 – 24 hours",
    "dur.h48": "1 – 3 days",
    "dur.h96": "More than 3 days",

    // Priority Labels & Wait Expectations
    "prio.p1": "P1 — Critical / Immediate",
    "prio.p2": "P2 — High / Urgent",
    "prio.p3": "P3 — Moderate / Semi-urgent",
    "prio.p4": "P4 — Routine / Non-urgent",
    "prio.waitP1": "Immediate (<5 min)",
    "prio.waitP2": "Within 15 minutes",
    "prio.waitP3": "Within 30 minutes",
    "prio.waitP4": "Within 60 minutes",

    // Footer
    "footer.rights": "Government-Hospital OPD Queue Triage & Flow Management System.",
    "footer.disclaimer": "Hackathon Prototype — Not a diagnostic tool. In an emergency dial medical services immediately."
  },
  hi: {
    // Nav & Shell
    "nav.patientDashboard": "मरीज़ डैशबोर्ड",
    "nav.staffDashboard": "स्टाफ डैशबोर्ड",
    "nav.hospitalAdmin": "अस्पताल व्यवस्थापक",
    "nav.publicQueue": "सार्वजनिक कतार",
    "nav.signOut": "लॉग आउट",
    "nav.myDashboard": "मेरा डैशबोर्ड",

    // Language Toggle Accessibility
    "lang.toggle": "भाषा बदलें / Switch Language",
    "lang.en": "English",
    "lang.hi": "हिंदी",
    "lang.helperMessage": "आप किसी भी समय भाषा बदल सकते हैं।",

    // Landing Page
    "landing.badge": "स्मार्ट अस्पताल कतार प्रबंधन",
    "landing.title": "एआई लक्षण जांच से अस्पताल सेवाओं को आसान बनाएं",
    "landing.subtitle": "ओपीडी-फ्लो एआई सरकारी स्वास्थ्य केंद्रों में प्रतीक्षा समय कम करने और गंभीर मामलों को प्राथमिक उपचार देने में मदद करता है।",
    "landing.patientsWaiting": "मरीज़ प्रतीक्षा में",
    "landing.waitingDesc": "सक्रिय कतारों में प्रतिक्षारत",
    "landing.activeTreatments": "इलाज जारी",
    "landing.treatmentsDesc": "डॉक्टरों द्वारा परामर्श जारी",
    "landing.pausedWarnings": "अस्पताल ओवरलोड चेतावनियां",
    "landing.pausedText": "रोका गया",
    "landing.selectWorkspace": "अपना डैशबोर्ड चुनें",
    "landing.selectSub": "उपलब्ध पोर्टल का चयन करके सेवाएं देखें।",
    "landing.patientPortalTitle": "मरीज़ पोर्टल",
    "landing.patientPortalDesc": "स्वास्थ्य समस्या दर्ज करें, प्राथमिकता टोकन प्राप्त करें और क्यूआर कोड द्वारा चेक-इन करें।",
    "landing.startPatientFlow": "मरीज़ प्रक्रिया शुरू करें",

    // Patient Dashboard Header
    "patient.hubTitle": "मरीज़ ओपीडी हब",
    "patient.greeting": "नमस्ते",
    "patient.profileVerified": "प्रोफ़ाइल सत्यापित",

    // Symptom Card Intake
    "patient.symptomTitle": "क्या आज आपको कोई स्वास्थ्य समस्या है?",
    "patient.symptomDesc": "हमारे सहायक से लक्षण आकलन शुरू करें। एआई आपकी समस्या का विश्लेषण करके आपको सही विभाग की कतार में भेजेगा।",
    "patient.disclaimerTitle": "महत्वपूर्ण चिकित्सीय सूचना",
    "patient.disclaimerDesc": "यह आकलन केवल उचित विभाग तक पहुँचाने में सहायता के लिए है और यह किसी डॉक्टर की सलाह या इलाज का विकल्प नहीं है।",
    "patient.startAssessment": "स्वास्थ्य आकलन शुरू करें",

    // Previous Visits Log
    "patient.previousVisits": "पिछली यात्राओं का विवरण",
    "patient.statusCompleted": "पूर्ण",
    "patient.statusNoShow": "अनुपस्थित",
    "patient.statusCancelled": "रद्द",

    // Active Token Ticket
    "patient.activeTokenStatus": "वर्तमान टोकन स्थिति",
    "patient.opdTicket": "ओपीडी क्लिनिक पर्ची",
    "patient.yourTokenNumber": "आपका टोकन नंबर",
    "patient.queuePosition": "कतार में स्थान",
    "patient.ahead": "लोग आगे हैं",
    "patient.currentlyCalled": "आपको बुलाया गया है / परामर्श जारी है",
    "patient.joinVideoCall": "ऑनलाइन वीडियो परामर्श से जुड़ें",
    "patient.urgencyLevel": "गंभीरता का स्तर",
    "patient.status": "स्थिति",
    "patient.estWait": "अनुमानित समय",
    "patient.cancelToken": "टोकन रद्द करें",
    "patient.noActiveTicket": "कोई सक्रिय टोकन नहीं है",
    "patient.noActiveTicketDesc": "आपके पास वर्तमान में कोई सक्रिय ओपीडी टोकन नहीं है। पर्ची पाने के लिए स्वास्थ्य आकलन शुरू करें।",
    "patient.getOpdToken": "ओपीडी टोकन प्राप्त करें",

    // Post-Consultation Passes
    "pass.pharmacyTitle": "फार्मेसी डिस्पेंसरी पास",
    "pass.pickupLocation": "दवा लेने का स्थान:",
    "pass.labTitle": "पैथोलॉजी लैब सैंपल पास",
    "pass.sampleDesk": "सैंपल जमा करने का काउंटर:",

    // Patient Triage Assessment Wizard Steps & Headings
    "triage.title": "एआई प्रारंभिक लक्षण जांच व मूल्यांकन",
    "triage.subtitle": "स्वचालित प्राथमिकता ओपीडी पर्ची प्राप्त करने के लिए अपनी मुख्य स्वास्थ्य समस्या चुनें।",
    "triage.readOutLoud": "प्रश्न बोलकर सुनें",

    "triage.step0Label": "शरीर का अंग",
    "triage.step0Desc": "प्रभावित क्षेत्र",
    "triage.step1Label": "लक्षण",
    "triage.step1Desc": "आप क्या महसूस कर रहे हैं",
    "triage.step2Label": "गंभीरता",
    "triage.step2Desc": "परेशानी कितनी है?",
    "triage.step3Label": "संदर्भ",
    "triage.step3Desc": "जोखिम कारक",
    "triage.step4Label": "एआई विश्लेषण",
    "triage.step4Desc": "प्राथमिकता स्कोर",
    "triage.step5Label": "पुष्टि करें",
    "triage.step5Desc": "टोकन प्राप्त करें",

    // Triage Step 0
    "triage.step0Title": "आपको शरीर के किस हिस्से में परेशानी है?",
    "triage.step0Subtitle": "अपनी मुख्य समस्या से संबंधित शरीर का हिस्सा चुनें। आप आगे विशिष्ट लक्षण चुन सकते हैं।",
    "triage.notSure": "निश्चय नहीं है — सभी लक्षण दिखाएं",

    // Triage Step 1
    "triage.step1Title": "अपने लक्षण चुनें",
    "triage.step1Subtitle": "जो भी समस्याएं हैं उन्हें चुनें। आगे बढ़ने के लिए कम से कम एक लक्षण चुनें।",
    "triage.searchSymptoms": "लक्षण खोजें…",
    "triage.noSymptoms": "खोजे गए लक्षण नहीं मिले।",
    "triage.redFlag": "आपातकालीन संकेत",

    // Triage Step 2
    "triage.step2Title": "आपकी परेशानी कितनी गंभीर है?",
    "triage.step2Subtitle": "1 (कोई दर्द नहीं) से 10 (अत्यधिक असहनीय) के पैमाने पर अपने कष्ट का स्तर चुनें।",
    "triage.noPain": "1 — कोई दर्द नहीं",
    "triage.extreme": "10 — अत्यधिक दर्द",
    "triage.duration": "यह समस्या आपको कितने समय से है?",

    // Triage Step 3
    "triage.step3Title": "अतिरिक्त स्वास्थ्य संदर्भ",
    "triage.step3Subtitle": "जो स्थिति लागू होती है उसे चालू करें — इससे आपातकालीन स्थिति की पहचान होती है।",
    "triage.fever": "बुखार / तेज़ तापमान",
    "triage.difficultyBreathing": "सांस लेने में तकलीफ़",
    "triage.chestPain": "सीने में दर्द / भारीपन",
    "triage.lossOfConsciousness": "बेहोशी या चक्कर आना",
    "triage.pregnant": "वर्तमान में गर्भवती",
    "triage.child": "मरीज़ बच्चा है (< 12 वर्ष)",
    "triage.senior": "वरिष्ठ नागरिक (> 65 वर्ष)",
    "triage.anythingElse": "कोई अन्य जानकारी?",
    "triage.optional": "(वैकल्पिक)",
    "triage.additionalPlaceholder": "उदा. शुगर के मरीज, पुरानी बीमारियां, दवाओं से एलर्जी...",

    // Triage Step 4 - AI Result
    "triage.step4Title": "एआई ट्रायेज मूल्यांकन परिणाम",
    "triage.step4Subtitle": "आपके दर्ज लक्षणों के आधार पर सिफारिश की गई है:",
    "triage.clinicalPriority": "चिकित्सीय प्राथमिकता",
    "triage.priorityScore": "प्राथमिकता स्कोर:",
    "triage.recommendedDept": "अनुशंसित विभाग",
    "triage.clinicalReasoning": "चिकित्सीय कारण (AI विश्लेषण)",
    "triage.disclaimerNotice": "अस्वीकरण: यह केवल एआई-सहायता प्राप्त मार्गदर्शक है। अंतिम प्राथमिकता अस्पताल में डॉक्टर द्वारा तय की जाएगी।",

    // Triage Step 5 - Confirmation
    "triage.step5Title": "ओपीडी टोकन सफलतापूर्वक जारी किया गया!",
    "triage.step5Subtitle": "यह डिजिटल पर्ची काउंटर पर दिखाएं या स्क्रीन पर अपना टोकन नंबर देखें।",
    "triage.viewDashboard": "मरीज़ डैशबोर्ड पर जाएँ",

    // Common Buttons & Controls
    "btn.continue": "आगे बढ़ें",
    "btn.back": "पीछे जाएँ",
    "btn.profile": "प्रोफ़ाइल",
    "btn.logout": "लॉग आउट",
    "btn.submit": "जमा करें",
    "btn.cancel": "रद्द करें",
    "btn.save": "सुरक्षित करें",

    // Public Display Screen
    "public.title": "अस्पताल टीवी डिस्प्ले स्क्रीन",
    "public.singleClinic": "एकल क्लिनिक",
    "public.hospitalGrid": "अस्पताल ग्रिड",
    "public.nowServing": "अभी सेवा में",
    "public.nextWaiting": "अगले बुलाए जाने वाले टोकन",
    "public.proceedTo": "कृपया काउंटर / कमरे में जाएँ:",
    "public.noTokenCalled": "अभी कोई टोकन नहीं बुलाया गया है",

    // Body Systems Taxonomy
    "sys.cardiac": "हृदय और रक्त परिसंचरण",
    "sys.respiratory": "फेफड़े और सांस",
    "sys.neurological": "मस्तिष्क और तंत्रिकाएं",
    "sys.gastrointestinal": "पेट और पाचन",
    "sys.musculoskeletal": "हड्डियाँ और मांसपेशियाँ",
    "sys.dermatological": "त्वचा और एलर्जी",
    "sys.urological": "गुर्दे और मूत्र संबंधी",
    "sys.psychiatric": "मानसिक स्वास्थ्य",
    "sys.pediatric": "बच्चों का स्वास्थ्य",
    "sys.general": "सामान्य / अन्य",

    // Departments Taxonomy
    "dept.CARD": "हृदय रोग विभाग (Cardiology)",
    "dept.RESP": "श्वसन रोग विभाग (Respiratory)",
    "dept.NEURO": "न्यूरोलॉजी विभाग (Neurology)",
    "dept.GASTRO": "गैस्ट्रोएंटरोलॉजी (Gastro)",
    "dept.ORTHO": "अस्थि रोग विभाग (Orthopaedics)",
    "dept.DERM": "त्वचा रोग विभाग (Dermatology)",
    "dept.UROL": "मूत्र रोग विभाग (Urology)",
    "dept.PSYCH": "मानसिक रोग विभाग (Psychiatry)",
    "dept.PEDI": "बाल रोग विभाग (Paediatrics)",
    "dept.GENMED": "सामान्य चिकित्सा विभाग (General Medicine)",
    "dept.OBS": "स्त्री एवं प्रसूति रोग (Obstetrics & Gynaecology)",

    // Duration Options
    "dur.h05": "अभी शुरू हुआ (< 1 घंटा)",
    "dur.h3": "1 – 6 घंटे से",
    "dur.h12": "6 – 24 घंटे से",
    "dur.h48": "1 – 3 दिनों से",
    "dur.h96": "3 दिनों से अधिक",

    // Priority Labels & Wait Expectations
    "prio.p1": "P1 — अत्यंत गंभीर / तत्काल",
    "prio.p2": "P2 — उच्च / आपातकालीन",
    "prio.p3": "P3 — मध्यम / सामान्य शीघ्र",
    "prio.p4": "P4 — सामान्य / नियमित जांच",
    "prio.waitP1": "तत्काल (< 5 मिनट)",
    "prio.waitP2": "15 मिनट के भीतर",
    "prio.waitP3": "30 मिनट के भीतर",
    "prio.waitP4": "60 मिनट के भीतर",

    // Footer
    "footer.rights": "सरकारी अस्पताल ओपीडी कतार प्रबंधन एवं ट्रायेज प्रणाली।",
    "footer.disclaimer": "प्रतियोगिता प्रोटोटाइप — यह चिकित्सीय जांच का विकल्प नहीं है। आपात स्थिति में तुरंत एम्बुलेंस को कॉल करें।"
  }
};

// Symptom translations map
export const symptomTranslations: Record<string, { en: string; hi: string }> = {
  chest_pain: { en: "Chest Pain", hi: "सीने में दर्द" },
  palpitations: { en: "Palpitations / Irregular Heartbeat", hi: "दिल की धड़कन तेज़ या अनियमित होना" },
  swelling_legs: { en: "Leg Swelling / Oedema", hi: "पैरों में सूजन" },
  fainting: { en: "Fainting / Syncope", hi: "बेहोशी / चक्कर आकर गिरना" },
  breathlessness: { en: "Breathlessness / Shortness of Breath", hi: "सांस लेने में कटनाई / सांस फूलना" },
  wheezing: { en: "Wheezing / Asthma Attack", hi: "घबराहट / अस्थामा का दौरा" },
  persistent_cough: { en: "Persistent Cough", hi: "लगातार खांसी" },
  blood_in_sputum: { en: "Blood in Sputum / Haemoptysis", hi: "बलगम में खून आना" },
  severe_headache: { en: "Severe / Sudden Headache", hi: "तेज़ या अचानक सिरदर्द" },
  vision_changes: { en: "Vision Changes / Blurring", hi: "धुंधला दिखना या दृष्टि बदलना" },
  weakness_numbness: { en: "Limb Weakness / Numbness", hi: "हाथ-पैर में कमजोरी या सुन्नता" },
  seizure: { en: "Seizure / Fits", hi: "दौरे पड़ना / मिर्गी" },
  dizziness: { en: "Dizziness / Vertigo", hi: "चक्कर आना" },
  confusion: { en: "Confusion / Altered Mental Status", hi: "मानसिक भ्रम / बेहोशी की हालत" },
  severe_abdo_pain: { en: "Severe Abdominal Pain", hi: "पेट में तेज़ दर्द" },
  nausea_vomiting: { en: "Nausea / Vomiting", hi: "जी मिचलाना / उल्टी" },
  diarrhoea: { en: "Diarrhoea", hi: "दस्त / पेट खराब" },
  blood_in_stool: { en: "Blood in Stool / PR Bleed", hi: "मल में खून आना" },
  jaundice: { en: "Jaundice / Yellow Skin", hi: "पीलिया / त्वचा का पीला पड़ना" },
  joint_pain: { en: "Joint Pain / Arthritis", hi: "जोड़ों का दर्द / गठिया" },
  back_pain: { en: "Back Pain", hi: "पीठ या कमर दर्द" },
  fracture_suspected: { en: "Suspected Fracture / Trauma", hi: "हड्डी टूटने या चोट की आशंका" },
  muscle_weakness: { en: "Widespread Muscle Weakness", hi: "मांसपेशियों में कमजोरी" },
  rash: { en: "Rash / Skin Lesion", hi: "त्वचा पर चकत्ते या खुजली" },
  urticaria: { en: "Hives / Urticaria", hi: "पित्ती / दाने" },
  anaphylaxis_signs: { en: "Signs of Anaphylaxis", hi: "गंभीर एलर्जी के लक्षण" },
  wound_infection: { en: "Wound / Infection", hi: "घाव / संक्रमण" },
  dysuria: { en: "Painful Urination / UTI", hi: "पेशाब में जलन / यूटीआई" },
  blood_in_urine: { en: "Blood in Urine / Haematuria", hi: "पेशाब में खून आना" },
  renal_colic: { en: "Renal / Ureteric Colic", hi: "गुर्दे में तेज़ दर्द" },
  anxiety_panic: { en: "Anxiety / Panic Attack", hi: "घबराहट / घबराहट का दौरा" },
  self_harm: { en: "Self-Harm / Suicidal Ideation", hi: "आत्महत्या के विचार / मानसिक संकट" },
  psychosis: { en: "Acute Psychosis / Hallucinations", hi: "अत्यधिक मानसिक भ्रम" },
  high_fever_child: { en: "High Fever in Child (<12)", hi: "बच्चे को तेज़ बुखार" },
  febrile_seizure: { en: "Febrile Seizure (Child)", hi: "बुखार से बच्चे को दौरे पड़ना" },
  choking_infant: { en: "Choking / Airway Obstruction", hi: "गले में कुछ अटकना / सांस रुकना" },
  high_fever: { en: "High Fever (>38.5 °C)", hi: "तेज़ बुखार" },
  dehydration: { en: "Severe Dehydration", hi: "शरीर में पानी की अत्यधिक कमी" },
  malaise_fatigue: { en: "General Malaise / Fatigue", hi: "सुस्ती / अत्यधिक थकान" },
  weight_loss: { en: "Unexplained Weight Loss", hi: "अकारण वजन घटना" },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  getSymptomName: (id: string, fallbackLabel?: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANGUAGE_STORAGE_KEY = "opdflow_language";

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (saved === "hi" || saved === "en") {
        return saved;
      }
    } catch (e) {
      // Ignore storage errors
    }
    return "en";
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    } catch (e) {
      // Ignore storage errors
    }
  };

  const t = (key: string): string => {
    return translations[language]?.[key] || translations.en[key] || key;
  };

  const getSymptomName = (id: string, fallbackLabel?: string): string => {
    const sym = symptomTranslations[id];
    if (sym) {
      return language === "hi" ? sym.hi : sym.en;
    }
    return fallbackLabel || id;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, getSymptomName }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
