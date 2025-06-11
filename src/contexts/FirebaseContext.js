import React, { useContext, useState, useEffect } from 'react';
import { auth, db } from '../services/firebase'; // Make sure this path is correct
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

// A component to show while checking for user login status
const LoadingScreen = () => (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <p>Loading...</p>
    </div>
);


// 1. Create the context
const AuthContext = React.createContext();

// 2. Create a custom hook for easy access to the context
export function useAuth() {
    return useContext(AuthContext);
}

// 3. Create the Provider component
export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // This listener fires when the user logs in or out
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setCurrentUser(user);
            if (user) {
                // If a user is logged in, check their 'role' in the 'users' collection
                const userDocRef = doc(db, 'users', user.uid);
                const userDoc = await getDoc(userDocRef);
                if (userDoc.exists() && userDoc.data().role === 'admin') {
                    setIsAdmin(true);
                } else {
                    setIsAdmin(false);
                }
            } else {
                // No user is logged in
                setIsAdmin(false);
            }
            setLoading(false);
        });

        // Cleanup the listener when the component unmounts
        return unsubscribe;
    }, []);

    // The values to be shared with all child components
    const value = {
        currentUser,
        isAdmin,
    };

    return (
        <AuthContext.Provider value={value}>
            {loading ? <LoadingScreen /> : children}
        </AuthContext.Provider>
    );
}
