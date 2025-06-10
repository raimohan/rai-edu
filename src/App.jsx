import React, { useState, useEffect, useContext, createContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Contexts & Components
import { ThemeContext, themeColors } from './contexts/ThemeContext';
import { FirebaseContext } from './contexts/FirebaseContext';
import { useSoundEffect } from './hooks/useSoundEffect'; // <-- Yeh file zaroori hai
import LoadingAnimation from './components/common/LoadingAnimation';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import NotificationModal from './components/common/NotificationModal';
import { getFirebaseConfig } from './services/firebase';

// Pages
import GetStartedPage from './pages/GetStartedPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
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
import UserManagerPage from './pages/UserManagerPage';

export const AppContext = createContext();

// Main App Layout
const MainAppLayout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [notifications, setNotifications] = useState([
        { id: 1, message: 'Welcome to RaiEdu! Login successful.', read: false },
    ]);
    const [showNotificationModal, setShowNotificationModal] = useState(false);
    const { playClick } = useSoundEffect();

    return (
        <AppContext.Provider value={{ isSidebarOpen, setIsSidebarOpen }}>
            <div className="flex h-screen bg-gray-100 dark:bg-gray-900 font-poppins text-gray-800 dark:text-gray-200">
                <Sidebar />
                <main className="flex-1 flex flex-col overflow-hidden">
                    <Header 
                        notifications={notifications} 
                        setShowNotificationModal={setShowNotificationModal} 
                    />
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
                            <Route path="*" element={<Navigate to="/dashboard" />} />
                        </Routes>
                    </section>
                </main>
                {showNotificationModal && (
                    <NotificationModal 
                        notifications={notifications} 
                        setNotifications={setNotifications} 
                        onClose={() => { playClick(); setShowNotificationModal(false); }} 
                    />
                )}
            </div>
        </AppContext.Provider>
    );
};

// Main App Component
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
        } else {
            setIsLoading(false); 
        }
    }, []);

    useEffect(() => {
        if (!auth) {
            if(!isLoading && db) setIsLoading(false);
            return;
        };
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, [auth, db, isLoading]);

    useEffect(() => {
        if (darkMode) document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
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
