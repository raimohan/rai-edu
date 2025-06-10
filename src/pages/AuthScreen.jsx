import React, { useState, useContext, useRef, useEffect } from 'react';
import { Mail, Lock } from 'lucide-react'; // Keeping these for consistency, though not used in new design
import {
    createUserWithEmailAndPassword, // Not used in new phone auth flow
    signInWithEmailAndPassword,     // Not used in new phone auth flow
    GoogleAuthProvider,
    signInWithPopup,
    PhoneAuthProvider, // For phone authentication
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

            if (window.recaptchaVerifier.size === 'invisible' && !recaptchaResolved) {
                 // For invisible reCAPTCHA, we need to manually trigger verification if not already done
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
        document.addEventListener('touchstart', (e) => {
            Array.from(e.touches).forEach(touch => {
                createRipple({
                    clientX: touch.clientX,
                    clientY: touch.clientY
                });
            });
        });

        // Cleanup event listeners on component unmount
        return () => {
            document.removeEventListener('click', createRipple);
            document.removeEventListener('touchstart', createRipple); // Removed the incorrect usage, should be specific handler
            // Re-adding a correct touch handler for cleanup
            document.removeEventListener('touchstart', (e) => {
                Array.from(e.touches).forEach(touch => {
                    createRipple({
                        clientX: touch.clientX,
                        clientY: touch.clientY
                    });
                });
            });
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
            {/* Custom Styles - CONSIDER MOVING TO index.css */}
            <style jsx>{`
                /* Font imports should ideally be in public/index.html or global CSS */
                @import url('https://fonts.googleapis.com/css2?family=Pacifico&display=swap');
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
                @import url('https://cdnjs.cloudflare.com/ajax/libs/remixicon/4.6.0/remixicon.min.css');

                /* Tailwind config extension should be in tailwind.config.js */
                /*
                tailwind.config={
                    theme:{
                        extend:{
                            colors:{
                                primary:'#4F46E5',
                                secondary:'#8B5CF6'
                            },
                            borderRadius:{
                                'none':'0px',
                                'sm':'4px',
                                DEFAULT:'8px',
                                'md':'12px',
                                'lg':'16px',
                                'xl':'20px',
                                '2xl':'24px',
                                '3xl':'32px',
                                'full':'9999px',
                                'button':'8px'
                            }
                        }
                    }
                }
                */

                body {
                    font-family: 'Inter', sans-serif;
                    min-height: 100vh;
                    position: relative;
                    overflow: hidden;
                }
                .animated-background {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    z-index: -1;
                    overflow: hidden;
                }
                .video-background {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    z-index: -2;
                    opacity: 0.15;
                }
                .overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(135deg, rgba(235, 245, 255, 0.97) 0%, rgba(225, 240, 255, 0.97) 100%);
                    z-index: -1;
                }
                .floating-bubble {
                    position: absolute;
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 50%;
                    pointer-events: none;
                    animation: float 20s linear infinite;
                }
                .ripple {
                    position: absolute;
                    border-radius: 50%;
                    transform: scale(0);
                    animation: ripple 0.8s linear;
                    background: rgba(79, 70, 229, 0.1);
                }
                @keyframes float {
                    0% {
                        transform: translateY(100%) translateX(-50%);
                        opacity: 0;
                    }
                    50% {
                        opacity: 0.8;
                    }
                    100% {
                        transform: translateY(-100vh) translateX(50%);
                        opacity: 0;
                    }
                }
                @keyframes ripple {
                    to {
                        transform: scale(4);
                        opacity: 0;
                    }
                }
                .glass-container {
                    background: rgba(255, 255, 255, 0.7);
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                }
                .input-container {
                    position: relative;
                }
                .input-container input {
                    padding-left: 4rem;
                }
                .country-code {
                    position: absolute;
                    left: 1rem;
                    top: 50%;
                    transform: translateY(-50%);
                    display: flex;
                    align-items: center;
                    gap: 0.25rem;
                }
                /* OTP container visibility handled by state now, not 'display: none/block' */
            `}</style>

            {/* Background elements */}
            <video autoplay loop muted playsinline className="video-background">
                <source src="https://assets.codepen.io/3364143/7btrrd.mp4" type="video/mp4" />
            </video>
            <div className="overlay"></div>
            <div className="animated-background" id="animatedBackground"></div>
            {/* reCAPTCHA container - invisible but necessary for Firebase Phone Auth */}
            <div id="recaptcha-container" ref={recaptchaContainerRef}></div>

            <div className="glass-container shadow-lg
