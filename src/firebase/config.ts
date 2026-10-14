import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getAnalytics, isSupported, type Analytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDRTUNO43VpOAZ82_Bc4XoPImZ2n4gBLac",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "smartmedai-30fce.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "smartmedai-30fce",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "smartmedai-30fce.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "220976708741",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:220976708741:web:8562e2abb77fae0198bdec",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-RGNK9QLVPC",
};

export const isFirebaseConfigured = Boolean(
  (import.meta.env.VITE_FIREBASE_API_KEY || firebaseConfig.apiKey) &&
    (import.meta.env.VITE_FIREBASE_PROJECT_ID || firebaseConfig.projectId)
);

let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

export const auth: Auth = getAuth(app);

let analytics: Analytics | null = null;
if (typeof window !== "undefined") {
  isSupported()
    .then((supported) => {
      if (supported) {
        analytics = getAnalytics(app);
      }
    })
    .catch(() => {});
}

export { analytics };
export default app;
