import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/FirebaseContext'; // Assuming useAuth provides both auth and db
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'; // <<< ADDED IMPORTS for Firestore
import { Mail, Lock } from 'lucide-react';

const LoginPage = () => {
    // Ensure that useAuth hook provides both 'auth' and 'db'
    // Based on your AuthContext.jsx, this is already correct:
    // const value = useMemo(() => ({ ..., auth, db }), [...]);
    const { auth, db } = useAuth(); // <<< Ensure 'db' is destructured here
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        if (!auth) {
            setError("Firebase authentication not initialized.");
            return;
        }
        setLoading(true);
        setError('');
        try {
            await signInWithEmailAndPassword(auth, email, password);
            navigate('/dashboard');
        } catch (err) {
            setError("Failed to log in. Please check your email and password.");
            console.error("Email/Password Login Error:", err); // More specific console log
        }
        setLoading(false);
    };

    const handleGoogleLogin = async () => {
        if (!auth || !db) { // <<< Ensure db is available
            setError("Firebase services not fully initialized.");
            return;
        }
        setLoading(true);
        setError('');
        const provider = new GoogleAuthProvider();
        try {
            const result = await signInWithPopup(auth, provider); // Authenticates with Firebase
            const user = result.user; // Get the user object from the successful authentication

            // --- START: FIX FOR DATABASE SAVE ---
            const userDocRef = doc(db, 'users', user.uid); // Reference to the user's document in Firestore
            const userDocSnap = await getDoc(userDocRef); // Check if the document already exists

            if (!userDocSnap.exists()) {
                // If the user's profile does NOT exist in the database, create it
                await setDoc(userDocRef, {
                    uid: user.uid, // Explicitly save UID
                    email: user.email,
                    username: user.displayName || user.email.split('@')[0], // Use displayName, fallback to email prefix
                    photoURL: user.photoURL || null, // Save profile picture URL
                    role: 'user', // Default role for new sign-ups
                    createdAt: serverTimestamp(), // Timestamp for creation
                    // You can add other default fields here for a new user:
                    // about: '',
                    // education: '',
                    // country: '',
                    // status: 'online'
                });
                console.log("New user profile created in Firestore after Google Sign-in from LoginPage.");
            } else {
                // If the user's profile already exists, you might want to update a last login timestamp or other fields
                // await updateDoc(userDocRef, { lastLoginAt: serverTimestamp() });
                console.log("Existing user logged in via Google from LoginPage.");
            }
            // --- END: FIX FOR DATABASE SAVE ---

            navigate('/dashboard'); // Navigate to dashboard after authentication AND database save

        } catch (err) {
            // Provide more descriptive error messages to the user and console
            console.error("Google Login Error:", err);
            let errorMessage = "Failed to log in with Google. Please try again.";
            if (err.code) {
                switch (err.code) {
                    case 'auth/popup-closed-by-user':
                        errorMessage = "Google login popup was closed. Please try again.";
                        break;
                    case 'auth/cancelled-popup-request':
                        errorMessage = "Google login already in progress. Please wait.";
                        break;
                    case 'auth/network-request-failed':
                        errorMessage = "Network error. Please check your internet connection.";
                        break;
                    case 'auth/account-exists-with-different-credential':
                        errorMessage = "An account with this email already exists using a different sign-in method.";
                        break;
                    case 'permission-denied': // This is important for security rule issues
                         errorMessage = "Permission denied. Please check Firebase Security Rules.";
                         break;
                    default:
                        errorMessage = `Error: ${err.message}`; // Fallback to Firebase message
                }
            }
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-gray-800 p-4">
            <div className="p-8 bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-sm">
                <h2 className="text-3xl font-bold text-center text-blue-500 mb-6">Welcome Back!</h2>
                <form onSubmit={handleLogin}>
                    <div className="mb-4 relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"/>
                        <input className="w-full pl-10 pr-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required />
                    </div>
                    <div className="mb-6 relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"/>
                        <input className="w-full pl-10 pr-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required />
                    </div>
                    {error && <p className="text-red-500 text-sm text-center mb-4">{error}</p>}
                    <button type="submit" disabled={loading} className="w-full bg-blue-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-600 disabled:bg-blue-300 transition-colors">
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>
                <div className="relative flex items-center py-5">
                    <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
                    <span className="flex-shrink mx-4 text-gray-500 dark:text-gray-400">OR</span>
                    <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
                </div>
                <button onClick={handleGoogleLogin} disabled={loading} className="w-full flex items-center justify-center bg-white border border-gray-300 text-gray-700 font-bold py-3 px-4 rounded-lg hover:bg-gray-50 dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:hover:bg-gray-600 transition-colors">
                    <img src="https://www.google.com/favicon.ico" alt="Google icon" className="w-5 h-5 mr-3"/>
                    Login with Google
                </button>
                <p className="text-center mt-6 text-gray-600 dark:text-gray-300 text-sm">
                    Don't have an account? <Link to="/signup" className="text-blue-500 hover:underline">Sign Up</Link>
                </p>
            </div>
        </div>
    );
};

export default LoginPage;
