// src/contexts/FirebaseContext.jsx
import React, { useContext, useState, useEffect, useMemo } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'; // Added setDoc, serverTimestamp
import { auth, db } from '../services/firebase'; // Ensure these are correctly imported

// Assuming you have a LoadingAnimation component
import LoadingAnimation from '../components/common/LoadingAnimation';

const FirebaseContext = React.createContext(); // Renamed from AuthContext

export function useAuth() {
    return useContext(FirebaseContext); // Using FirebaseContext
}

export function FirebaseProvider({ children }) { // Renamed from AuthProvider
    const [currentUser, setCurrentUser] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setCurrentUser(user);
            if (user) {
                // Ensure user profile exists in Firestore upon any login (email/google/etc.)
                // This acts as a safeguard if initial save was missed or user logs in from another method.
                const userDocRef = doc(db, 'users', user.uid);
                const userDoc = await getDoc(userDocRef);

                if (!userDoc.exists()) {
                    // If user logs in but profile is missing in DB (e.g., first Google login on old code)
                    await setDoc(userDocRef, {
                        uid: user.uid,
                        email: user.email,
                        username: user.displayName || user.email.split('@')[0], // Fallback username
                        photoURL: user.photoURL || null,
                        role: 'user',
                        createdAt: serverTimestamp(),
                        about: `Hi, I'm ${user.displayName || user.email}!`,
                        education: '',
                        country: '',
                        status: 'online'
                    });
                    console.log("User profile created/updated in Firestore via FirebaseContext on login.");
                }

                setIsAdmin(userDoc.exists() && userDoc.data().role === 'admin');
            } else {
                setIsAdmin(false);
            }
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    const value = useMemo(() => ({
        currentUser,
        isAdmin,
        loading,
        auth, // Expose Firebase auth instance
        db    // Expose Firestore db instance
    }), [currentUser, isAdmin, loading, auth, db]);

    return (
        <FirebaseContext.Provider value={value}>
            {loading ? <LoadingAnimation /> : children}
        </FirebaseContext.Provider>
    );
}
