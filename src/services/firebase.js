// src/services/firebase.js

import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Function to safely retrieve Firebase configuration from environment variables
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
        console.error("Firebase config is missing from environment variables.");
        return null;
    }
    return firebaseConfig;
};

const firebaseConfig = getFirebaseConfig();

// Initialize Firebase App only if it hasn't been initialized yet
const app = getApps().length === 0 && firebaseConfig ? initializeApp(firebaseConfig) : getApps()[0];

// Export Firebase services to be used in other parts of the app
export const auth = getAuth(app);
export const db = getFirestore(app);
