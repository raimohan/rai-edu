import React, { useState, useContext, useRef, useEffect } from 'react';
import { Mail, Lock } from 'lucide-react'; // Keeping these for consistency, though not actively used in new design
import {
    GoogleAuthProvider,
    signInWithPopup,
    RecaptchaVerifier, // For reCAPTCHA verification
    signInWithPhoneNumber, // For sending OTP
    onAuthStateChanged // Good for debugging auth state changes
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

import { FirebaseContext } from '../contexts/FirebaseContext';
import { ThemeContext } from '../contexts/ThemeContext';
import { useSoundEffect } from '../hooks/useSoundEffect';
import ThemedButton from '../components/common/ThemedButton';
import CustomAlert from '../components/common/CustomAlert';
import LoadingAnimation from '../components/common/LoadingAnimation'; // Added for loading state

const AuthScreen = () => {
    // Contexts and Hooks
    const { auth, db } = useContext(FirebaseContext);
    const { theme } = useContext(ThemeContext);
    const { playClick } = useSoundEffect();

    // State for Phone Auth
    const [phoneNumber, setPhoneNumber] = useState('');
    const [otp, setOtp] = useState(['', '', '', '', '', '']); // Array for 6 OTP digits
    const [showOtpFields, setShowOtpFields] = useState(false);
    const [confirmationResult, setConfirmationResult] = useState(null); // Stores the result from send OTP
    const [recaptchaResolved, setRecaptchaResolved] = useState(false);
    const recaptchaContainerRef = useRef(null); // Ref for reCAPTCHA container
    const [resendTimer, setResendTimer] = useState(0); // Timer for resend OTP
    const resendIntervalRef = useRef(null); // Ref for interval cleanup

    // General UI State
    const [loading, setLoading] = useState(false);
    const [showAlert, setShowAlert] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [alertType, setAlertType] = useState('error'); // 'success' or 'error'

    // --- Utility Functions for UI ---

    // Function to show a custom alert
    const showCustomAlert = (message, type = 'error') => {
        setAlertMessage(message);
        setAlertType(type);
        setShowAlert(true);
    };

    // Function to handle OTP input changes
    const handleOtpChange = (e, index) => {
        const value = e.target.value;
        if (/^[0-9]$/.test(value) || value === '') { // Only allow single digit or empty string
            const newOtp = [...otp];
            newOtp[index] = value;
            setOtp(newOtp);

            // Auto-focus next input
            if (value !== '' && index < otp.length - 1) {
                const nextInput = document.getElementById(`otp-input-${index + 1}`);
                if (nextInput) {
                    nextInput.focus();
                }
            }
        }
    };

    // Handle keydown for OTP inputs (e.g., backspace)
    const handleOtpKeyDown = (e, index) => {
        if (e.key === 'Backspace' && otp[index] === '' && index > 0) {
            const prevInput = document.getElementById(`otp-input-${index - 1}`);
            if (prevInput) {
                prevInput.focus();
            }
        }
    };

    // --- Firebase Authentication Functions ---

    // Initialize reCAPTCHA on component mount
    useEffect(() => {
        if (recaptchaContainerRef.current && auth) {
            window.recaptchaVerifier = new RecaptchaVerifier(auth, recaptchaContainerRef.current, {
                'size': 'invisible', // Can be 'normal' for visible, 'invisible' for automatic
                'callback': (response) => {
                    // reCAPTCHA solved, allows send OTP
                    setRecaptchaResolved(true);
                },
                'expired-callback': () => {
                    // reCAPTCHA expired, reset state
                    setRecaptchaResolved(false);
                    showCustomAlert('reCAPTCHA expired, please try again.', 'error');
                }
            });

            // Render reCAPTCHA if not invisible
            if (window.recaptchaVerifier.size === 'normal') {
                window.recaptchaVerifier.render().then((widgetId) => {
                    console.log('reCAPTCHA rendered with widget ID:', widgetId);
                }).catch(error => {
                    console.error('Error rendering reCAPTCHA:', error);
                });
            } else {
                // If invisible, verify it immediately (important for invisible)
                window.recaptchaVerifier.verify().catch(error => {
                    console.error('Error verifying invisible reCAPTCHA:', error);
                });
            }
        }

        // Cleanup function for reCAPTCHA on unmount
        return () => {
            if (window.recaptchaVerifier) {
                window.recaptchaVerifier.clear();
            }
            if (resendIntervalRef.current) {
                clearInterval(resendIntervalRef.current);
            }
        };
    }, [auth]); // Dependency array: re-run if 'auth' object changes

    // Handle sending OTP to phone number
    const handleSendOtp = async () => {
        playClick();
        setLoading(true);
        setShowAlert(false); // Clear previous alerts

        if (!phoneNumber || phoneNumber.length !== 10) {
            showCustomAlert('Please enter a valid 10-digit phone number.', 'error');
            setLoading(false);
            return;
        }

        const fullPhoneNumber = `+91${phoneNumber}`; // Prepend country code

        try {
            // Ensure reCAPTCHA is verified before sending OTP
            if (!window.recaptchaVerifier) {
                showCustomAlert('reCAPTCHA is not initialized. Please refresh the page.', 'error');
                setLoading(false);
                return;
            }

            // For invisible reCAPTCHA, we need to manually trigger verification if not already done
            if (window.recaptchaVerifier.size === 'invisible' && !recaptchaResolved) {
                 await window.recaptchaVerifier.verify();
            }

            const confirmation = await signInWithPhoneNumber(auth, fullPhoneNumber, window.recaptchaVerifier);
            setConfirmationResult(confirmation);
            setShowOtpFields(true); // Show OTP input fields
            showCustomAlert('OTP sent successfully!', 'success');
            startResendTimer();
        } catch (error) {
            console.error('Error sending OTP:', error);
            let errorMessage = error.message;
            if (error.code === 'auth/invalid-phone-number') {
                errorMessage = 'Invalid phone number format.';
            } else if (error.code === 'auth/too-many-requests') {
                errorMessage = 'Too many requests. Please try again later.';
            } else if (error.code === 'auth/missing-verification-id') {
                errorMessage = 'Missing verification ID. Please try sending OTP again.';
            } else if (error.code === 'auth/code-expired') {
                 errorMessage = 'The verification code has expired. Please request a new one.';
            }
            showCustomAlert(errorMessage, 'error');
            setRecaptchaResolved(false); // Reset reCAPTCHA state on error
        } finally {
            setLoading(false);
        }
    };

    // Handle OTP verification
    const handleVerifyOtp = async () => {
        playClick();
        setLoading(true);
        setShowAlert(false); // Clear previous alerts

        if (!confirmationResult) {
            showCustomAlert('Please send OTP first.', 'error');
            setLoading(false);
            return;
        }

        const enteredOtp = otp.join('');
        if (enteredOtp.length !== 6) {
            showCustomAlert('Please enter the complete 6-digit OTP.', 'error');
            setLoading(false);
            return;
        }

        try {
            const userCredential = await confirmationResult.confirm(enteredOtp);
            const user = userCredential.user;

            // Check if user exists in Firestore, if not, create a new entry
            const userDocRef = doc(db, 'users', user.uid);
            const userDocSnap = await getDoc(userDocRef);

            if (!userDocSnap.exists()) {
                await setDoc(userDocRef, {
                    phoneNumber: user.phoneNumber,
                    email: user.email || 'N/A', // Phone auth may not provide email
                    username: user.displayName || user.phoneNumber,
                    role: 'user',
                    createdAt: serverTimestamp()
                });
            }
            showCustomAlert('Login successful!', 'success');
            // Redirect to Dashboard or Home page after successful login
            // Example: window.location.href = '/dashboard';
        } catch (error) {
            console.error('Error verifying OTP:', error);
            let errorMessage = error.message;
            if (error.code === 'auth/invalid-verification-code') {
                errorMessage = 'Invalid OTP. Please check and try again.';
            } else if (error.code === 'auth/code-expired') {
                errorMessage = 'The verification code has expired. Please request a new one.';
            }
            showCustomAlert(errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    };

    // Handle Google Login
    const handleGoogleLogin = async () => {
        playClick();
        setLoading(true);
        setShowAlert(false); // Clear previous alerts

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
            showCustomAlert('Google Login successful!', 'success');
            // Redirect to Dashboard or Home page
        } catch (error) {
            console.error('Error during Google login:', error);
            showCustomAlert(error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    // Start resend OTP timer
    const startResendTimer = () => {
        setResendTimer(60); // 60 seconds
        if (resendIntervalRef.current) {
            clearInterval(resendIntervalRef.current);
        }
        resendIntervalRef.current = setInterval(() => {
            setResendTimer((prevTime) => {
                if (prevTime <= 1) {
                    clearInterval(resendIntervalRef.current);
                    return 0;
                }
                return prevTime - 1;
            });
        }, 1000);
    };

    // Cleanup interval on unmount
    useEffect(() => {
        return () => {
            if (resendIntervalRef.current) {
                clearInterval(resendIntervalRef.current);
            }
        };
    }, []);

    // --- Background Animations (converted from JS script) ---
    useEffect(() => {
        const animatedBackground = document.getElementById('animatedBackground');
        if (!animatedBackground) return;

        const createBubbles = () => {
            const bubbleCount = 8;
            // Clear existing bubbles to prevent duplicates on re-render
            animatedBackground.innerHTML = '';
            for (let i = 0; i < bubbleCount; i++) {
                const bubble = document.createElement('div');
                bubble.className = 'floating-bubble';
                const size = Math.random() * 80 + 40;
                bubble.style.width = `${size}px`;
                bubble.style.height = `${size}px`;
                bubble.style.left = `${Math.random() * 100}%`;
                bubble.style.animationDelay = `${Math.random() * 20}s`;
                animatedBackground.appendChild(bubble);
            }
        };

        const createRipple = (event) => {
            const ripple = document.createElement('div');
            ripple.className = 'ripple';
            ripple.style.left = `${event.clientX}px`;
            ripple.style.top = `${event.clientY}px`;
            document.body.appendChild(ripple);
            ripple.addEventListener('animationend', () => {
                ripple.remove();
            });
        };

        createBubbles();
        document.addEventListener('click', createRipple);
        // Corrected touch handler for cleanup
        const touchRippleHandler = (e) => {
            Array.from(e.touches).forEach(touch => {
                createRipple({
                    clientX: touch.clientX,
                    clientY: touch.clientY
                });
            });
        };
        document.addEventListener('touchstart', touchRippleHandler);

        // Cleanup event listeners on component unmount
        return () => {
            document.removeEventListener('click', createRipple);
            document.removeEventListener('touchstart', touchRippleHandler);
        };
    }, []); // Empty dependency array means this runs once on mount

    // --- Logo Image Logic ---
    useEffect(() => {
        const logoImage = document.getElementById('logoImage');
        if (logoImage) {
            const urlParams = new URLSearchParams(window.location.search);
            const logoUrl = urlParams.get('logo');
            if (logoUrl) {
                logoImage.src = logoUrl;
            } else {
                // Default logo if no URL param
                logoImage.src = 'https://readdy.ai/api/search-image?query=modern%20minimalist%20abstract%20logo%20design%2C%20professional%20business%20emblem%2C%20clean%20lines%2C%20simple%20geometry&width=80&height=80&seq=1&orientation=squarish';
            }
        }
    }, []);

    // --- Render Component ---
    return (
        <div className="flex items-center justify-center min-h-screen p-4 overflow-hidden relative">
            {/* Background elements */}
            <video autoPlay loop muted playsInline className="video-background">
                <source src="https://assets.codepen.io/3364143/7btrrd.mp4" type="video/mp4" />
            </video>
            <div className="overlay"></div>
            <div className="animated-background" id="animatedBackground"></div>
            {/* reCAPTCHA container - invisible but necessary for Firebase Phone Auth */}
            <div id="recaptcha-container" ref={recaptchaContainerRef}></div>

            <div className="glass-container shadow-lg rounded-2xl w-full max-w-md p-8 mx-auto relative z-10">
                <div className="text-center mb-8">
                    <div className="w-20 h-20 mx-auto mb-4">
                        <img id="logoImage" src="" alt="Logo" className="w-full h-full object-contain" />
                    </div>
                    <h1 className="text-2xl font-semibold text-gray-800">Welcome Back!</h1>
                </div>

                <div className="space-y-6">
                    {/* Phone Number Input */}
                    <div className="flex gap-2">
                        <button className="flex items-center gap-2 px-3 py-3 border-none bg-white rounded focus:ring-2 focus:ring-primary/20 focus:outline-none shadow-sm whitespace-nowrap">
                            <div className="w-6 h-6 flex items-center justify-center">
                                <img src="https://readdy.ai/api/search-image?query=Indian%20flag%2C%20minimalist%20design%2C%20flat%20style%2C%20clean%20edges%2C%20simplified%20emblem%2C%20orange%20white%20and%20green%20colors%2C%20national%20symbol&width=24&height=24&seq=1&orientation=squarish" alt="Indian flag" className="w-5 h-auto" />
                            </div>
                            <span className="text-gray-700">+91</span>
                            <div className="w-4 h-4 flex items-center justify-center">
                                <i className="ri-arrow-down-s-line"></i>
                            </div>
                        </button>
                        <input
                            type="tel"
                            id="phone"
                            className="flex-1 px-4 py-3 border-none bg-white rounded focus:ring-2 focus:ring-primary/20 focus:outline-none shadow-sm"
                            placeholder="Enter phone number"
                            value={phoneNumber}
                            onChange={(e) => {
                                const value = e.target.value.replace(/[^0-9]/g, ''); // Only digits
                                setPhoneNumber(value.slice(0, 10)); // Max 10 digits
                            }}
                            disabled={loading || showOtpFields} // Disable if loading or OTP sent
                        />
                    </div>

                    {/* OTP Container - Conditionally rendered */}
                    {showOtpFields && (
                        <div id="otpContainer" className="space-y-4">
                            <p className="text-sm text-gray-600">We've sent a 6-digit OTP to your phone number</p>
                            <div className="flex gap-2 justify-between">
                                {otp.map((digit, index) => (
                                    <input
                                        key={index}
                                        id={`otp-input-${index}`}
                                        type="text"
                                        maxLength="1"
                                        className="w-full aspect-square text-center text-xl border-none bg-white rounded focus:ring-2 focus:ring-primary/20 focus:outline-none shadow-sm"
                                        value={digit}
                                        onChange={(e) => handleOtpChange(e, index)}
                                        onKeyDown={(e) => handleOtpKeyDown(e, index)}
                                        disabled={loading}
                                    />
                                ))}
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-500">Didn't receive OTP?</span>
                                <button
                                    id="resendOtp"
                                    onClick={handleSendOtp}
                                    className={`text-sm font-medium ${resendTimer > 0 ? 'text-gray-400 cursor-not-allowed' : 'text-primary hover:text-primary/80'} whitespace-nowrap`}
                                    disabled={resendTimer > 0 || loading}
                                >
                                    {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : 'Resend OTP'}
                                </button>
                            </div>
                            <ThemedButton
                                id="verifyOtp"
                                onClick={handleVerifyOtp}
                                className="w-full"
                                disabled={loading || otp.join('').length !== 6} // Disable if OTP not full or loading
                            >
                                {loading ? 'Verifying...' : 'Verify OTP'}
                            </ThemedButton>
                        </div>
                    )}

                    {/* Send OTP button - Conditionally rendered */}
                    {!showOtpFields && (
                        <ThemedButton
                            id="sendOtp"
                            onClick={handleSendOtp}
                            className="w-full"
                            disabled={loading || phoneNumber.length !== 10} // Disable if phone number not 10 digits or loading
                        >
                            {loading ? 'Sending OTP...' : 'Send OTP'}
                        </ThemedButton>
                    )}

                    <div className="relative flex items-center py-2">
                        <div className="flex-grow border-t border-gray-300"></div>
                        <span className="flex-shrink mx-4 text-gray-500 text-sm">OR</span>
                        <div className="flex-grow border-t border-gray-300"></div>
                    </div>

                    {/* Social Login Buttons */}
                    {/* Google Button - Ensuring it's present and correctly styled */}
                    <ThemedButton
                        onClick={handleGoogleLogin}
                        className="w-full bg-white border border-gray-200 py-3 px-4 rounded-button font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm flex items-center justify-center gap-3 whitespace-nowrap"
                        disabled={loading}
                    >
                        <div className="w-5 h-5 flex items-center justify-center">
                            {/* Google Icon from Remixicon */}
                            <i className="ri-google-fill text-lg"></i>
                        </div>
                        Continue with Google
                    </ThemedButton>

                    {/* Apple Button */}
                    <ThemedButton
                        className="w-full bg-black text-white py-3 px-4 rounded-button font-medium hover:bg-black/90 transition-colors shadow-sm flex items-center justify-center gap-3 whitespace-nowrap"
                        disabled={loading}
                        // Note: Full Apple login requires specific Firebase and Apple Developer setup
                    >
                        <div className="w-5 h-5 flex items-center justify-center">
                            {/* Apple Icon from Remixicon */}
                            <i className="ri-apple-fill text-lg"></i>
                        </div>
                        Continue with Apple
                    </ThemedButton>
                </div>

                {/* Footer Links */}
                <div className="mt-6 text-center">
                    <a href="#" className="text-sm text-gray-600 hover:text-primary">Forgot Password?</a>
                    <p className="mt-4 text-sm text-gray-600">
                        Don't have an account?{' '}
                        <a href="#" className="font-medium text-primary hover:text-primary/80">Sign Up</a>
                    </p>
                </div>
            </div>

            {/* Custom Alert Component */}
            {showAlert && <CustomAlert message={alertMessage} type={alertType} onClose={() => setShowAlert(false)} />}
            {loading && <LoadingAnimation />} {/* Assuming you have a LoadingAnimation component */}
        </div>
    );
};

export default AuthScreen;
