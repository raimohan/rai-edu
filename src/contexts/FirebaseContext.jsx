// src/contexts/FirebaseContext.jsx
import React, { useContext, useState, useEffect, useMemo } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';

// Assuming you have a LoadingAnimation component
import LoadingAnimation from '../components/common/LoadingAnimation';

const FirebaseContext = React.createContext();

export function useAuth() {
    return useContext(FirebaseContext);
}

// Renamed back to AuthProvider as per your request
export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setCurrentUser(user);
            if (user) {
                const userDocRef = doc(db, 'users', user.uid);
                const userDoc = await getDoc(userDocRef);

                if (!userDoc.exists()) {
                    await setDoc(userDocRef, {
                        uid: user.uid,
                        email: user.email,
                        username: user.displayName || user.email.split('@')[0],
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
        auth,
        db
    }), [currentUser, isAdmin, loading, auth, db]);

    return (
        <FirebaseContext.Provider value={value}>
            {loading ? <LoadingAnimation /> : children}
        </FirebaseContext.Provider>
    );
}
