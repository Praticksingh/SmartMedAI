/**
 * OPDFlow AI — Multi-Channel Real-Time Broadcast & Speech Synthesis Engine v1
 * 
 * Provides instant cross-tab communication (BroadcastChannel + localStorage bridge)
 * pushing token call events from Staff Station to open Public TV Screens.
 */

export interface TVBroadcastEvent {
  eventId: string;
  type: "TOKEN_CALLED" | "QUEUE_PAUSED" | "QUEUE_RESUMED";
  tokenNumber: string;
  deptCode: string;
  deptName: string;
  room: string;
  timestamp: number;
}

const CHANNEL_NAME = "opdflow_tv_broadcast_channel";
const LOCAL_STORAGE_KEY = "opdflow_tv_last_call_event";

let channelInstance: BroadcastChannel | null = null;

if (typeof window !== "undefined" && "BroadcastChannel" in window) {
  try {
    channelInstance = new BroadcastChannel(CHANNEL_NAME);
  } catch (e) {
    console.warn("BroadcastChannel initialization failed, fallback to localStorage events", e);
  }
}

// In-memory deduplication cache with 30s TTL
const recentEventCache = new Map<string, number>();

const isDuplicateEvent = (eventId?: string, tokenNumber?: string, timestamp?: number): boolean => {
  const now = Date.now();
  // Clean up entries older than 30 seconds
  for (const [id, time] of recentEventCache.entries()) {
    if (now - time > 30000) recentEventCache.delete(id);
  }
  const key = eventId || `${tokenNumber}_${timestamp}`;
  if (recentEventCache.has(key)) return true;
  recentEventCache.set(key, now);
  return false;
};

/**
 * Broadcasts a token call event to all open TV Display windows
 */
export const broadcastTokenCall = (
  tokenNumber: string,
  deptCode: string,
  deptName: string,
  room: string
) => {
  const eventPayload: TVBroadcastEvent = {
    eventId: `call_${tokenNumber}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    type: "TOKEN_CALLED",
    tokenNumber,
    deptCode,
    deptName,
    room,
    timestamp: Date.now(),
  };

  // Mark in local cache so sender window doesn't echo to itself
  isDuplicateEvent(eventPayload.eventId, eventPayload.tokenNumber, eventPayload.timestamp);

  // 1. Post to BroadcastChannel if available
  if (channelInstance) {
    channelInstance.postMessage(eventPayload);
  }

  // 2. Write to localStorage for cross-tab storage event listeners
  if (typeof localStorage !== "undefined" && typeof localStorage.setItem === "function") {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(eventPayload));
    } catch (e) {
      console.error("Failed to store TV event in localStorage", e);
    }
  }
};

/**
 * Retrieves the last broadcast event from storage if present
 */
export const getLastBroadcastEvent = (): TVBroadcastEvent | null => {
  if (typeof localStorage === "undefined" || typeof localStorage.getItem !== "function") return null;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

/**
 * Direct check for duplicate event id or token
 */
export const checkIsDuplicateEvent = isDuplicateEvent;

/**
 * Subscribes to real-time TV broadcast events with deduplication
 */
export const subscribeToTVBroadcast = (
  callback: (event: TVBroadcastEvent) => void
): (() => void) => {
  // Listener for BroadcastChannel
  const handleMessage = (e: MessageEvent<TVBroadcastEvent>) => {
    if (e.data && e.data.type) {
      if (!isDuplicateEvent(e.data.eventId, e.data.tokenNumber, e.data.timestamp)) {
        callback(e.data);
      }
    }
  };

  if (channelInstance) {
    channelInstance.addEventListener("message", handleMessage);
  }

  // Fallback listener for localStorage changes across windows
  const handleStorage = (e: StorageEvent) => {
    if (e.key === LOCAL_STORAGE_KEY && e.newValue) {
      try {
        const payload: TVBroadcastEvent = JSON.parse(e.newValue);
        if (!isDuplicateEvent(payload.eventId, payload.tokenNumber, payload.timestamp)) {
          callback(payload);
        }
      } catch (err) {
        console.error("Failed to parse TV broadcast storage event", err);
      }
    }
  };

  if (typeof window !== "undefined" && typeof window.addEventListener === "function") {
    window.addEventListener("storage", handleStorage);
  }

  return () => {
    if (channelInstance) {
      channelInstance.removeEventListener("message", handleMessage);
    }
    if (typeof window !== "undefined" && typeof window.removeEventListener === "function") {
      window.removeEventListener("storage", handleStorage);
    }
  };
};

/**
 * Speaks medical call announcement in English, Hindi, or Bengali phonetics
 */
export const speakMedicalCall = (
  tokenNumber: string,
  deptName: string,
  room: string,
  language: "EN" | "HI" | "BN" = "EN",
  rate: number = 0.9
) => {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return;
  }

  window.speechSynthesis.cancel(); // Cancel ongoing speech

  const spacedToken = tokenNumber.split("").join(" ");
  let speechText = "";

  if (language === "HI") {
    speechText = `Kripya dhyan dein. Token number ${spacedToken}, kripya ${deptName} clinic, ${room} mein jaayein.`;
  } else if (language === "BN") {
    speechText = `Anugraha kore shunun. Token number ${spacedToken}, doya kore ${deptName} clinic, ${room} e jaan.`;
  } else {
    speechText = `Attention please. Token number ${spacedToken}, please proceed to ${deptName} clinic, ${room}.`;
  }

  const utterance = new SpeechSynthesisUtterance(speechText);
  utterance.rate = rate;
  utterance.pitch = 1.0;
  
  if (language === "HI") {
    utterance.lang = "hi-IN";
  } else if (language === "BN") {
    utterance.lang = "bn-IN";
  } else {
    utterance.lang = "en-IN";
  }

  window.speechSynthesis.speak(utterance);
};

/**
 * Unlocks the browser SpeechSynthesis AudioContext upon user gesture
 */
export const unlockKioskAudio = () => {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  try {
    const silentUtterance = new SpeechSynthesisUtterance("Audio broadcast online");
    silentUtterance.volume = 0.6;
    silentUtterance.rate = 1.4;
    window.speechSynthesis.speak(silentUtterance);
  } catch {}
};
