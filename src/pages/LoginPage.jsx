// src/pages/LoginPage.jsx
import React, { useState } from 'react';
import { EyeOff, Eye } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

import { useAuth } from '../contexts/FirebaseContext'; // Correctly using useAuth from your context

// backgroundAnimationsCSS removed from here and moved to src/index.css

function LoginPage() {
  const { auth, db } = useAuth(); // Get auth and db from context
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    setMessage('');
    setLoading(true);
    try {
      if (!auth) throw new Error("Firebase Auth not initialized. Please refresh the page.");

      await signInWithEmailAndPassword(auth, email, password);
      setMessage('Login successful!');
      navigate('/dashboard');

    } catch (error) {
      console.error("Email/Password Sign-in Error:", error);
      let errorMessage = "Login failed. Please check your email and password.";
      if (error.code) {
        switch (error.code) {
          case 'auth/user-not-found':
          case 'auth/wrong-password':
            errorMessage = "Invalid email or password.";
            break;
          case 'auth/invalid-email':
            errorMessage = "Please enter a valid email address.";
            break;
          case 'auth/too-many-requests':
            errorMessage = "Too many login attempts. Please try again later.";
            break;
          default:
            errorMessage = `Login failed: ${error.message}`;
        }
      }
      setMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setMessage('');
    setLoading(true);
    try {
      if (!auth || !db) throw new Error("Firebase services not initialized. Please refresh the page.");

      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userDocRef = doc(db, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
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
        console.log("New Google user profile created in Firestore from LoginPage.");
      } else {
        console.log("Existing Google user logged in from LoginPage.");
      }

      setMessage('Google login successful!');
      navigate('/dashboard');

    } catch (error) {
      console.error("Google Sign-in Error:", error);
      let errorMessage = "Google login failed. Please try again.";
      if (error.code) {
        switch (error.code) {
          case 'auth/popup-closed-by-user':
            errorMessage = "Google login popup was closed. Please try again.";
            break;
          case 'auth/cancelled-popup-request':
            errorMessage = "Google login already in progress. Please wait.";
            break;
          case 'auth/network-request-failed':
            errorMessage = "Network error. Check your internet connection.";
            break;
          case 'auth/account-exists-with-different-credential':
            errorMessage = "An account with this email already exists using a different sign-in method.";
            break;
          case 'permission-denied':
               errorMessage = "Database permission denied. Check Firebase Security Rules.";
               break;
          default:
            errorMessage = `Google login failed: ${error.message}`;
        }
      }
      setMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-blue-100 text-gray-800 flex flex-col items-center justify-between p-4 font-inter relative overflow-hidden">
      {/* <style>{backgroundAnimationsCSS}</style> Removed from here */}

      {/* Animated Background Elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute w-24 h-24 bg-blue-500 rounded-full blur-xl opacity-80 animate-[float_10s_ease-in-out_infinite] top-1/4 left-1/4" style={{ animationDelay: '0s' }}></div>
        <div className="absolute w-32 h-32 bg-blue-400 rounded-full blur-xl opacity-70 animate-[float_12s_ease-in-out_infinite] top-1/2 right-1/4" style={{ animationDelay: '2s' }}></div>
        <div className="absolute w-28 h-28 bg-blue-600 rounded-full blur-xl opacity-60 animate-[float_11s_ease-in-out_infinite] bottom-1/4 left-1/3" style={{ animationDelay: '4s' }}></div>
        <div className="absolute w-20 h-20 bg-blue-300 rounded-full blur-xl opacity-90 animate-[float_9s_ease-in-out_infinite] top-1/3 right-1/2" style={{ animationDelay: '6s' }}></div>
        <div className="absolute w-36 h-36 bg-blue-500 rounded-full blur-xl opacity-75 animate-[float_13s_ease-in-out_infinite] bottom-1/2 left-1/4" style={{ animationDelay: '8s' }}></div>
        <div className="absolute w-64 h-64 bg-blue-300 rounded-full animate-[glow_8s_ease-in-out_infinite] top-[10%] left-[5%]"></div>
        <div className="absolute w-80 h-80 bg-blue-400 rounded-full animate-[glow_10s_ease-in-out_infinite] bottom-[15%] right-[10%]"></div>
      </div>

      {/* Main Content - Login Card (Glassmorphism) */}
      <div className="relative flex flex-col items-center justify-center flex-grow w-full z-10">
        <div className="bg-white bg-opacity-40 backdrop-filter backdrop-blur-lg border border-blue-400 border-opacity-30 rounded-xl p-8 md:p-12 shadow-xl w-full max-w-md z-10 transform transition-all duration-300 hover:scale-105">
          <h2 className="text-3xl font-bold mb-6 text-center text-blue-900" style={{ fontFamily: 'Montserrat, sans-serif' }}>LOGIN</h2>
          <p className="text-gray-600 text-center mb-8">Enter your details to sign in to your account</p>

          {message && (
            <div className={`mb-4 text-center ${message.includes('successful') ? 'text-green-600' : 'text-red-600'}`}>
              {message}
            </div>
          )}

          {/* Email Input */}
          <div className="mb-4">
            <input
              type="email"
              id="email"
              className="w-full p-3 bg-white bg-opacity-60 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 placeholder-gray-500"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* Password Input */}
          <div className="mb-6">
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                className="w-full p-3 bg-white bg-opacity-60 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-500 text-gray-800 placeholder-gray-500"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-blue-700"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
              </button>
            </div>
          </div>

          {/* Login Button */}
          <button
            onClick={handleSignIn}
            disabled={loading}
            className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg shadow-lg hover:bg-blue-700 transition-colors transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Logging In...' : 'Login'}
          </button>

          <div className="text-center text-sm mt-4">
            <a href="#" className="text-blue-700 hover:underline">Forgot password? Click Here</a>
          </div>

          <div className="relative flex items-center py-5">
              <div className="flex-grow border-t border-gray-300"></div>
              <span className="flex-shrink mx-4 text-gray-500">OR</span>
              <div className="flex-grow border-t border-gray-300"></div>
          </div>

          {/* Google Login Button */}
          <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center bg-white border border-gray-300 text-gray-700 font-semibold py-3 rounded-lg shadow-lg hover:bg-gray-50 transition-colors transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
              <img src="https://www.google.com/favicon.ico" alt="Google icon" className="w-5 h-5 mr-3"/>
              Login with Google
          </button>

          <p className="text-center text-sm mt-2 text-gray-600">
            Don't have an account? <Link to="/signup" className="text-blue-700 hover:underline">Sign Up</Link>
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full max-w-7xl text-center text-sm text-gray-600 py-4 px-6 md:px-8 z-10">
        Copyright @ raimohan 2025 | <a href="#" className="hover:underline text-blue-700">Privacy Policy</a>
      </footer>
    </div>
  );
}

export default LoginPage;
