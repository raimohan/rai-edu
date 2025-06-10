import React, { useState, useContext } from 'react';
import { Mail, Lock } from 'lucide-react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

import { FirebaseContext } from '../contexts/FirebaseContext';
import { ThemeContext } from '../contexts/ThemeContext';
import { useSoundEffect } from '../hooks/useSoundEffect';
import ThemedButton from '../components/common/ThemedButton';
import CustomAlert from '../components/common/CustomAlert';

const AuthScreen = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showAlert, setShowAlert] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const { auth, db } = useContext(FirebaseContext);
    const { theme } = useContext(ThemeContext);
    const { playClick } = useSoundEffect();

    const handleAuth = async () => {
        playClick();
        setLoading(true);
        try {
            if (isLogin) {
                await signInWithEmailAndPassword(auth, email, password);
            } else {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                await setDoc(doc(db, 'users', userCredential.user.uid), {
                    email: userCredential.user.email,
                    username: userCredential.user.email.split('@')[0],
                    role: 'user',
                    createdAt: serverTimestamp()
                });
            }
        } catch (error) {
            setAlertMessage(error.message);
            setShowAlert(true);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        playClick();
        setLoading(true);
        try {
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);
            const userDocRef = doc(db, 'users', result.user.uid);
            const userDocSnap = await getDoc(userDocRef);
            if (!userDocSnap.exists()) {
                await setDoc(userDocRef, {
                    email: result.user.email,
                    username: result.user.displayName,
                    role: 'user',
                    createdAt: serverTimestamp()
                });
            }
        } catch (error) {
            setAlertMessage(error.message);
            setShowAlert(true);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center h-screen bg-gray-100 p-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
                <h2 className={`text-3xl font-bold text-center mb-6 text-${theme.primary}`}>RaiEdu</h2>
                <h3 className="text-2xl font-semibold text-center mb-6 text-gray-800">{isLogin ? 'Login' : 'Sign Up'}</h3>
                <div className="space-y-4">
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <ThemedButton onClick={handleAuth} className="w-full" disabled={loading}>
                        {loading ? 'Processing...' : (isLogin ? 'Login' : 'Sign Up')}
                    </ThemedButton>
                    <div className="relative flex items-center py-5">
                        <div className="flex-grow border-t border-gray-300"></div>
                        <span className="flex-shrink mx-4 text-gray-500">OR</span>
                        <div className="flex-grow border-t border-gray-300"></div>
                    </div>
                    <ThemedButton onClick={handleGoogleLogin} className="w-full bg-red-600 hover:bg-red-700" disabled={loading}>
                        Login with Google
                    </ThemedButton>
                    <p className="text-center text-gray-600 mt-6">
                        {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
                        <button onClick={() => { playClick(); setIsLogin(!isLogin); }} className={`text-${theme.primary} font-medium hover:underline`}>
                            {isLogin ? 'Sign Up' : 'Login'}
                        </button>
                    </p>
                </div>
            </div>
            {showAlert && <CustomAlert message={alertMessage} onClose={() => setShowAlert(false)} />}
        </div>
    );
};

export default AuthScreen;
