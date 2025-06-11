import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const getFirebaseConfig = () => {
    const firebaseConfig = {
        apiKey: import.meta.env.VITE_API_KEY,
        authDomain: import.meta.env.VITE_AUTH_DOMAIN,
        projectId: import.meta.env.VITE_PROJECT_ID,
        storageBucket: import.meta.env.VITE_STORAGE_BUCKET,
        messagingSenderId: import.meta.env.VITE_MESSAGING_SENDER_ID,
        appId: import.meta.env.VITE_APP_ID,
    };

    if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
        console.error("Firebase config is missing from environment variables. Make sure you have a .env file with VITE_... variables.");
        return null;
    }
    return firebaseConfig;
};

const firebaseConfig = getFirebaseConfig();

const app = getApps().length === 0 && firebaseConfig ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);
