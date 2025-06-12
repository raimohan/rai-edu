// src/pages/SignupPage.jsx
import React, { useState, useEffect } from 'react';
import { EyeOff, Eye } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

// Assuming your FirebaseContext provides auth and db
import { useAuth } from '../contexts/FirebaseContext';

// Shared CSS for background animations - move this to a global CSS file or App.jsx for reusability
const backgroundAnimationsCSS = `
  @keyframes float {
    0% { transform: translateY(0px) translateX(0px) rotate(0deg); opacity: 0.8; }
    33% { transform: translateY(-20px) translateX(10px) rotate(15deg); opacity: 0.9; }
    66% { transform: translateY(20px) translateX(-10px) rotate(-15deg); opacity: 0.7; }
    100% { transform: translateY(0px) translateX(0px) rotate(0deg); opacity: 0.8; }
  }

  @keyframes pulse {
    0% { transform: scale(0.9); opacity: 0.5; }
    50% { transform: scale(1.1); opacity: 0.7; }
    100% { transform: scale(0.9); opacity: 0.5; }
  }

  @keyframes glow {
    0% { filter: blur(20px); opacity: 0.3; }
    50% { filter: blur(30px); opacity: 0.5; }
    100% { filter: blur(20px); opacity: 0.3; }
  }
`;

function SignupPage() {
  const { auth, db } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [captcha, setCaptcha] = useState('');
  const [generatedCaptcha, setGeneratedCaptcha] = useState('');
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    generateCaptcha();
    setMessage('');
  }, []);

  const generateCaptcha = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.random() * chars.length));
    }
    setGeneratedCaptcha(result);
    setCaptcha('');
  };

  const handleSignup = async () => {
    setMessage('');
    if (password !== confirmPassword) {
      setMessage('Passwords do not match.');
      return;
    }
    if (captcha.toLowerCase() !== generatedCaptcha.toLowerCase()) {
      setMessage('Incorrect captcha. Please try again.');
      generateCaptcha();
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setMessage('Please enter a valid email address.');
      return;
    }

    if (password.length < 6) {
      setMessage('Password must be at least 6 characters long.');
      return;
    }
    if (username.length < 3) {
        setMessage('Username must be at least 3 characters long.');
        return;
    }

    setLoading(true);
    setMessage('Signing up...');
    try {
      if (!auth || !db) throw new Error("Firebase services not initialized.");

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await updateProfile(user, { displayName: username });

      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        username: username,
        email: email,
        role: 'user',
        createdAt: serverTimestamp(),
        about: `Hi, I'm ${username}!`,
        education: '',
        country: '',
        status: 'online',
        photoURL: user.photoURL || null,
      });

      setMessage('Sign up successful! Redirecting...');
      setUsername('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setCaptcha('');
      generateCaptcha();
      navigate('/dashboard');

    } catch (error) {
      console.error("Sign-up Error:", error);
      let errorMessage = "Sign up failed. Please try again.";
      if (error.code) {
        switch (error.code) {
          case 'auth/email-already-in-use':
            errorMessage = "This email is already in use.";
            break;
          case 'auth/weak-password':
            errorMessage = "Password is too weak. Please choose a stronger one.";
            break;
          case 'auth/invalid-email':
            errorMessage = "The email address is not valid.";
            break;
          case 'permission-denied':
             errorMessage = "Database permission denied. Check Firebase Security Rules.";
             break;
          default:
            errorMessage = `Sign up failed: ${error.message}`;
        }
      }
      setMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-blue-100 text-gray-800 flex flex-col items-center justify-between p-4 font-inter relative overflow-hidden">
      <style>{backgroundAnimationsCSS}</style>

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

      {/* Main Content - Sign Up Card (Glassmorphism) */}
      <div className="relative flex flex-col items-center justify-center flex-grow w-full z-10">
        <div className="bg-white bg-opacity-40 backdrop-filter backdrop-blur-lg border border-blue-400 border-opacity-30 rounded-xl p-8 md:p-12 shadow-xl w-full max-w-md z-10 transform transition-all duration-300 hover:scale-105">
          <h2 className="text-3xl font-bold mb-6 text-center text-blue-900" style={{ fontFamily: 'Montserrat, sans-serif' }}>SIGN UP</h2>
          <p className="text-gray-600 text-center mb-6">Create your new account</p>

          {message && (
            <div className={`mb-4 text-center ${message.includes('successful') ? 'text-green-600' : 'text-red-600'}`}>
              {message}
            </div>
          )}

          {/* Username Input */}
          <div className="mb-4">
            <input
              type="text"
              id="signup-username"
              className="w-full p-3 bg-white bg-opacity-60 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 placeholder-gray-500"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          {/* Email Input */}
          <div className="mb-4">
            <input
              type="email"
              id="signup-email"
              className="w-full p-3 bg-white bg-opacity-60 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 placeholder-gray-500"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* Password Input */}
          <div className="mb-4">
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="signup-password"
                className="w-full p-3 bg-white bg-opacity-60 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 placeholder-gray-500"
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

          {/* Confirm Password Input */}
          <div className="mb-4">
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="signup-confirm-password"
                className="w-full p-3 bg-white bg-opacity-60 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:focus:ring-blue-500 text-gray-800 placeholder-gray-500"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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

          {/* Captcha Section */}
          <div className="mb-6 flex items-center space-x-3">
            <div className="flex-grow p-3 bg-white bg-opacity-70 rounded-lg border border-blue-300 text-center font-bold text-lg tracking-wider text-blue-700 select-none">
              {generatedCaptcha}
            </div>
            <button
              onClick={generateCaptcha}
              className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
            >
              Refresh Captcha
            </button>
          </div>
          <div className="mb-6">
            <input
              type="text"
              id="captcha-input"
              className="w-full p-3 bg-white bg-opacity-60 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 placeholder-gray-500"
              placeholder="Enter Captcha"
              value={captcha}
              onChange={(e) => setCaptcha(e.target.value)}
            />
          </div>

          {/* Sign Up Button */}
          <button
            onClick={handleSignup}
            disabled={loading}
            className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg shadow-lg hover:bg-blue-700 transition-colors transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing Up...' : 'Sign Up'}
          </button>

          <p className="text-center text-sm mt-6 text-gray-600">
            Already have an account? <Link to="/login" className="text-blue-700 hover:underline">Sign in</Link>
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

export default SignupPage;
