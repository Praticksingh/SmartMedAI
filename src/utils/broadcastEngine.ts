/**
 * OPDFlow AI — Multi-Channel Real-Time Broadcast & Speech Synthesis Engine v1
 * 
 * Provides instant cross-tab communication (BroadcastChannel + localStorage bridge)
 * pushing token call events from Staff Station to open Public TV Screens.
 */

export interface TVBroadcastEvent {
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
    type: "TOKEN_CALLED",
    tokenNumber,
    deptCode,
    deptName,
    room,
    timestamp: Date.now(),
  };

  // 1. Post to BroadcastChannel if available
  if (channelInstance) {
    channelInstance.postMessage(eventPayload);
  }

  // 2. Write to localStorage for cross-tab storage event listeners
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(eventPayload));
  } catch (e) {
    console.error("Failed to store TV event in localStorage", e);
  }
};

/**
 * Subscribes to real-time TV broadcast events
 */
export const subscribeToTVBroadcast = (
  callback: (event: TVBroadcastEvent) => void
): (() => void) => {
  // Listener for BroadcastChannel
  const handleMessage = (e: MessageEvent<TVBroadcastEvent>) => {
    if (e.data && e.data.type) {
      callback(e.data);
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
        callback(payload);
      } catch (err) {
        console.error("Failed to parse TV broadcast storage event", err);
      }
    }
  };

  window.addEventListener("storage", handleStorage);

  return () => {
    if (channelInstance) {
      channelInstance.removeEventListener("message", handleMessage);
    }
    window.removeEventListener("storage", handleStorage);
  };
};

/**
 * Speaks medical call announcement in English or Hindi phonetics
 */
export const speakMedicalCall = (
  tokenNumber: string,
  deptName: string,
  room: string,
  language: "EN" | "HI" = "EN",
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
  } else {
    speechText = `Attention please. Token number ${spacedToken}, please proceed to ${deptName} clinic, ${room}.`;
  }

  const utterance = new SpeechSynthesisUtterance(speechText);
  utterance.rate = rate;
  utterance.pitch = 1.0;
  
  if (language === "HI") {
    utterance.lang = "hi-IN";
  } else {
    utterance.lang = "en-IN";
  }

  window.speechSynthesis.speak(utterance);
};
