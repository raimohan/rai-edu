import React, { useState, useEffect, useContext, createContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

// Contexts
import { ThemeContext, themeColors } from './contexts/ThemeContext';
import { FirebaseContext } from './contexts/FirebaseContext';
export const AppContext = createContext(); // For mobile sidebar

// Pages
import GetStartedPage from './pages/GetStartedPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import AuthScreen from './pages/AuthScreen'; // Fallback
import DashboardPage from './pages/DashboardPage';
import ClassNotesPage from './pages/ClassNotesPage';
import MeetingsPage from './pages/MeetingsPage';
import VirtualClassesPage from './pages/VirtualClassesPage';
import TodoListPage from './pages/TodoListPage';
import ProgressReportPage from './pages/ProgressReportPage';
import GeminiAssistantPage from './pages/GeminiAssistantPage';
import CommunityPage from './pages/CommunityPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import UserManagerPage from './pages/UserManagerPage'; // Naya Admin Page

// Components
import LoadingAnimation from './components/common/LoadingAnimation';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import { getFirebaseConfig } from './services/firebase';

// Main App Layout - Yeh Sidebar aur Header ke saath content dikhayega
const MainAppLayout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <AppContext.Provider value={{ isSidebarOpen, setIsSidebarOpen }}>
            <div className="flex h-screen bg-gray-100 dark:bg-gray-900 font-poppins text-gray-800 dark:text-gray-200">
                <Sidebar />
                <main className="flex-1 flex flex-col overflow-hidden">
                    <Header />
                    <section className="flex-1 p-4 md:p-6 overflow-y-auto">
                        <Routes>
                            <Route path="/dashboard" element={<DashboardPage />} />
                            <Route path="/class-notes" element={<ClassNotesPage />} />
                            <Route path="/meetings" element={<MeetingsPage />} />
                            <Route path="/virtual-classes" element={<VirtualClassesPage />} />
                            <Route path="/to-do-list" element={<TodoListPage />} />
                            <Route path="/progress-report" element={<ProgressReportPage />} />
                            <Route path="/ai-assistant" element={<GeminiAssistantPage />} />
                            <Route path="/community" element={<CommunityPage />} />
                            <Route path="/profile" element={<ProfilePage />} />
                            <Route path="/settings" element={<SettingsPage />} />
                            <Route path="/user-manager" element={<UserManagerPage />} />
                            {/* Default route redirects to dashboard */}
                            <Route path="*" element={<Navigate to="/dashboard" />} />
                        </Routes>
                    </section>
                </main>
            </div>
        </AppContext.Provider>
    );
};

const App = () => {
    const [currentTheme, setCurrentTheme] = useState('blue');
    const [darkMode, setDarkMode] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [db, setDb] = useState(null);
    const [auth, setAuth] = useState(null);
    const [user, setUser] = useState(null);

    useEffect(() => {
        const firebaseConfig = getFirebaseConfig();
        if (firebaseConfig) {
            const app = initializeApp(firebaseConfig);
            setDb(getFirestore(app));
            setAuth(getAuth(app));
        }
    }, []);

    useEffect(() => {
        if (!auth) return;
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                // User document banane ka logic yahan daal sakte hain
                setUser(currentUser);
            } else {
                setUser(null);
            }
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, [auth]);

    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [darkMode]);

    if (isLoading) {
        return <div className="fixed inset-0 bg-white dark:bg-black flex items-center justify-center"><LoadingAnimation /></div>;
    }

    const themeClass = themeColors[currentTheme];

    return (
        <FirebaseContext.Provider value={{ db, auth, user }}>
            <ThemeContext.Provider value={{ theme: themeClass, currentTheme, setCurrentTheme, darkMode, setDarkMode }}>
                <BrowserRouter>
                    <Routes>
                        <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/dashboard" />} />
                        <Route path="/signup" element={!user ? <SignupPage /> : <Navigate to="/dashboard" />} />
                        <Route path="/welcome" element={!user ? <GetStartedPage /> : <Navigate to="/dashboard" />} />
                        <Route path="/*" element={user ? <MainAppLayout /> : <Navigate to="/welcome" />} />
                    </Routes>
                </BrowserRouter>
            </ThemeContext.Provider>
        </FirebaseContext.Provider>
    );
};

export default App;
