import React, { useContext, useState, useEffect, useMemo } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase'; // Make sure this path is correct
import LoadingAnimation from '../components/common/LoadingAnimation'; // Make sure this path is correct

// --- Create the Context ---
const AuthContext = React.createContext();

// --- Create a custom hook for easy access ---
export function useAuth() {
    return useContext(AuthContext);
}

// --- Create the Provider Component ---
export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // This listener from Firebase handles user login/logout state.
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setCurrentUser(user);
            if (user) {
                // If user is logged in, check their role in Firestore
                const userDocRef = doc(db, 'users', user.uid);
                const userDoc = await getDoc(userDocRef);
                setIsAdmin(userDoc.exists() && userDoc.data().role === 'admin');
            } else {
                // No user is logged in, so they can't be an admin
                setIsAdmin(false);
            }
            setLoading(false);
        });

        // Cleanup the listener when the component unmounts
        return unsubscribe;
    }, []); // Empty dependency array ensures this runs only once

    // useMemo prevents unnecessary re-renders of components that consume the context
    const value = useMemo(() => ({
        currentUser,
        isAdmin,
        loading,
    }), [currentUser, isAdmin, loading]);

    return (
        <AuthContext.Provider value={value}>
            {loading ? <LoadingAnimation /> : children}
        </AuthContext.Provider>
    );
}
