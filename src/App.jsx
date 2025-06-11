import React, { useState, useEffect, useContext, createContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Contexts & Components
import { ThemeContext, themeColors } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/FirebaseContext'; // <-- AuthProvider और useAuth इम्पोर्ट करें
import { useSoundEffect } from './hooks/useSoundEffect';
import LoadingAnimation from './components/common/LoadingAnimation';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import NotificationModal from './components/common/NotificationModal';

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

// --- Protected Route Component ---
const ProtectedRoute = ({ children }) => {
    const { currentUser, loading } = useAuth();

    if (loading) {
        return <div className="fixed inset-0 bg-white dark:bg-black flex items-center justify-center"><LoadingAnimation /></div>;
    }

    if (!currentUser) {
        return <Navigate to="/welcome" replace />;
    }

    return children;
};

// --- Main App Layout ---
const MainAppLayout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [showNotificationModal, setShowNotificationModal] = useState(false);
    const { playClick } = useSoundEffect();

    return (
        <AppContext.Provider value={{ isSidebarOpen, setIsSidebarOpen }}>
            <div className="flex h-screen bg-gray-100 dark:bg-gray-900 font-poppins text-gray-800 dark:text-gray-200">
                <Sidebar />
                <main className="flex-1 flex flex-col overflow-hidden">
                    <Header notifications={notifications} setShowNotificationModal={setShowNotificationModal} />
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

// --- This component holds the logic that depends on the Auth context ---
const AppContent = () => {
    const { currentUser, loading } = useAuth();
    const [currentTheme, setCurrentTheme] = useState('blue');
    const [darkMode, setDarkMode] = useState(false);
    
    useEffect(() => {
        if (darkMode) document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
    }, [darkMode]);

    if (loading) {
        return <div className="fixed inset-0 bg-white dark:bg-black flex items-center justify-center"><LoadingAnimation /></div>;
    }

    const themeClass = themeColors[currentTheme];

    return (
        <ThemeContext.Provider value={{ theme: themeClass, currentTheme, setCurrentTheme, darkMode, setDarkMode }}>
            <BrowserRouter>
                <Routes>
                    <Route path="/login" element={!currentUser ? <LoginPage /> : <Navigate to="/dashboard" />} />
                    <Route path="/signup" element={!currentUser ? <SignupPage /> : <Navigate to="/dashboard" />} />
                    <Route path="/welcome" element={!currentUser ? <GetStartedPage /> : <Navigate to="/dashboard" />} />
                    <Route path="/*" element={
                        <ProtectedRoute>
                            <MainAppLayout />
                        </ProtectedRoute>
                    } />
                </Routes>
            </BrowserRouter>
        </ThemeContext.Provider>
    );
};

// --- Final App Component ---
const App = () => {
    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    );
};

export default App;
