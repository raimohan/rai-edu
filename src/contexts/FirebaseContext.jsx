import React, { useContext, useState, useEffect, useMemo } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import LoadingAnimation from '../components/common/LoadingAnimation'; 

const AuthContext = React.createContext();

export function useAuth() {
    return useContext(AuthContext);
}

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
        auth, // इसे भी एक्सपोर्ट करें ताकि लॉगिन/साइनअप पेज पर उपलब्ध हो
        db    // इसे भी एक्सपोर्ट करें ताकि बाकी पेजों पर उपलब्ध हो
    }), [currentUser, isAdmin, loading, auth, db]);

    return (
        <AuthContext.Provider value={value}>
            {loading ? <LoadingAnimation /> : children}
        </AuthContext.Provider>
    );
}
