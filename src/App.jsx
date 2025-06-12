import React, { useState, useEffect, useContext, createContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeContext, themeColors } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/FirebaseContext';
import { useSoundEffect } from './hooks/useSoundEffect';
import LoadingAnimation from './components/common/LoadingAnimation';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import NotificationModal from './components/common/NotificationModal';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore'; // onSnapshot इम्पोर्ट करें

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
import FriendsPage from './pages/FriendsPage';
import ChatPage from './pages/ChatPage';

export const AppContext = createContext();

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

const MainAppLayout = () => {
    const { db, currentUser } = useAuth();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const location = useLocation();
    const [notifications, setNotifications] = useState([]);
    const [showNotificationModal, setShowNotificationModal] = useState(false);
    const { playClick, playNotification } = useSoundEffect();

    useEffect(() => { setIsSidebarOpen(false); }, [location.pathname]);
    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    // रियल-टाइम में नोटिफिकेशन सुनना
    useEffect(() => {
        if (!db || !currentUser) return;
        const notifRef = collection(db, 'notifications');
        const q = query(notifRef, where("recipientId", "==", currentUser.uid), orderBy("createdAt", "desc"));
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const notifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            
            // यह जांचें कि क्या कोई नया, अनरीड नोटिफिकेशन आया है
            if (snapshot.docChanges().some(change => change.type === 'added' && !change.doc.data().isRead)) {
                playNotification(); // सिर्फ नए नोटिफिकेशन पर साउंड प्ले करें
            }
            setNotifications(notifs);
        });

        return () => unsubscribe();
    }, [db, currentUser, playNotification]);

    return (
        <AppContext.Provider value={{ playClick }}>
            <div className="relative flex h-screen bg-gray-100 dark:bg-gray-900 overflow-hidden">
                <Sidebar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
                {isSidebarOpen && <div onClick={toggleSidebar} className="fixed inset-0 bg-black/60 z-30 md:hidden" aria-hidden="true"></div>}
                <main className="flex-1 flex flex-col transition-all duration-300">
                    <Header 
                        toggleSidebar={toggleSidebar}
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
                            <Route path="/profile/:userId" element={<ProfilePage />} />
                            <Route path="/profile" element={currentUser ? <Navigate to={`/profile/${currentUser.uid}`} /> : null} />
                            <Route path="/friends" element={<FriendsPage />} />
                            <Route path="/settings" element={<SettingsPage />} />
                            <Route path="/user-manager" element={<UserManagerPage />} />
                            <Route path="/chat/:chatId" element={<ChatPage />} />
                            <Route path="*" element={<Navigate to="/dashboard" />} />
                        </Routes>
                    </section>
                </main>
                {showNotificationModal && <NotificationModal notifications={notifications} onClose={() => setShowNotificationModal(false)} />}
            </div>
        </AppContext.Provider>
    );
};

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

    const themeClass = themeColors[currentTheme] || themeColors['blue'];

    return (
        <ThemeContext.Provider value={{ theme: themeClass, currentTheme, setCurrentTheme, darkMode, setDarkMode }}>
            <BrowserRouter>
                <Routes>
                    <Route path="/login" element={!currentUser ? <LoginPage /> : <Navigate to="/dashboard" />} />
                    <Route path="/signup" element={!currentUser ? <SignupPage /> : <Navigate to="/dashboard" />} />
                    <Route path="/welcome" element={!currentUser ? <GetStartedPage /> : <Navigate to="/dashboard" />} />
                    <Route path="/*" element={<ProtectedRoute><MainAppLayout /></ProtectedRoute>} />
                </Routes>
            </BrowserRouter>
        </ThemeContext.Provider>
    );
};

const App = () => (
    <AuthProvider>
        <AppContent />
    </AuthProvider>
);

export default App;
