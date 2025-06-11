import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/FirebaseContext'; // <-- IMPORT THE NEW HOOK
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { User, Mail, Lock } from 'lucide-react';

const SignupPage = () => {
    const { auth, db } = useAuth(); // <-- USE THE HOOK
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSignUp = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            return setError("Passwords do not match!");
        }
        if (username.length < 3) {
            return setError("Username must be at least 3 characters long.");
        }
        if (!auth || !db) return; // Guard against auth/db not being ready
        setLoading(true);
        setError('');
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Update the user's Auth profile with the username
            await updateProfile(user, { displayName: username });

            // Create the user's document in Firestore
            await setDoc(doc(db, "users", user.uid), {
                username: username,
                email: email,
                role: 'user', // Default role for new users
                createdAt: serverTimestamp(),
                about: `Hi, I'm ${username}!`,
                education: '',
                status: 'online'
            });

            navigate('/dashboard'); // Navigate to dashboard after sign up

        } catch (err) {
            setError("Failed to create an account. The email might already be in use.");
            console.error(err);
        }
        setLoading(false);
    };

    return (
        <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-gray-800 p-4">
            <div className="p-8 bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-sm">
                <h2 className="text-3xl font-bold text-center text-blue-500 mb-6">Create Your Account</h2>
                <form onSubmit={handleSignUp}>
                    <div className="mb-4 relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"/>
                        <input className="w-full pl-10 pr-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" required />
                    </div>
                    <div className="mb-4 relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"/>
                        <input className="w-full pl-10 pr-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required />
                    </div>
                    <div className="mb-4 relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"/>
                        <input className="w-full pl-10 pr-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required />
                    </div>
                     <div className="mb-6 relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"/>
                        <input className="w-full pl-10 pr-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm Password" required />
                    </div>
                    {error && <p className="text-red-500 text-sm text-center mb-4">{error}</p>}
                    <button type="submit" disabled={loading} className="w-full bg-blue-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-600 disabled:bg-blue-300 transition-colors">
                        {loading ? 'Creating Account...' : 'Sign Up'}
                    </button>
                </form>
                <p className="text-center mt-6 text-gray-600 dark:text-gray-300 text-sm">
                    Already have an account? <Link to="/login" className="text-blue-500 hover:underline">Login</Link>
                </p>
            </div>
        </div>
    );
};

export default SignupPage;
