import React, { useState, useEffect, useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

// Contexts
import { ThemeContext, themeColors } from './contexts/ThemeContext';
import { FirebaseContext } from './contexts/FirebaseContext';

// Hooks & Components
import { useSoundEffect } from './hooks/useSoundEffect';
import AuthScreen from './pages/AuthScreen';
import LoadingAnimation from './components/common/LoadingAnimation';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import NotificationModal from './components/common/NotificationModal';

// Pages
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
import { getFirebaseConfig } from './services/firebase';

// Main App Layout Component
const MainAppLayout = () => {
    const { playClick } = useSoundEffect();
    const [notifications, setNotifications] = useState([/* ...initial notifications... */]);
    const [showNotificationModal, setShowNotificationModal] = useState(false);
    
    // Yeh tasks ab TodoListPage ke andar manage honge
    const [appTasks, setAppTasks] = useState([]); 

    return (
        <div className="flex h-screen bg-gray-100 font-poppins text-gray-800">
            <Sidebar />
            <main className="flex-1 flex flex-col overflow-hidden">
                <Header
                    notifications={notifications}
                    setShowNotificationModal={setShowNotificationModal}
                />
                <section className="flex-1 p-6 overflow-y-auto">
                    <Routes>
                        <Route path="/dashboard" element={<DashboardPage />} />
                        <Route path="/class-notes" element={<ClassNotesPage />} />
                        <Route path="/meetings" element={<MeetingsPage />} />
                        <Route path="/virtual-classes" element={<VirtualClassesPage />} />
                        <Route path="/to-do-list" element={<TodoListPage appTasks={appTasks} setAppTasks={setAppTasks} />} />
                        <Route path="/progress-report" element={<ProgressReportPage />} />
                        <Route path="/ai-assistant" element={<GeminiAssistantPage />} />
                        <Route path="/community" element={<CommunityPage />} />
                        <Route path="/profile" element={<ProfilePage />} />
                        <Route path="/settings" element={<SettingsPage />} />
                        {/* Default route redirects to dashboard */}
                        <Route path="*" element={<Navigate to="/dashboard" />} />
                    </Routes>
                </section>
            </main>
            {showNotificationModal && (
                <NotificationModal notifications={notifications} setNotifications={setNotifications} onClose={() => { playClick(); setShowNotificationModal(false); }} />
            )}
        </div>
    );
};

const App = () => {
    const [currentTheme, setCurrentTheme] = useState('blue');
    const [isLoading, setIsLoading] = useState(true);
    const [db, setDb] = useState(null);
    const [auth, setAuth] = useState(null);
    const [user, setUser] = useState(null);

    useEffect(() => {
        const firebaseConfig = getFirebaseConfig();
        if (firebaseConfig) {
            const app = initializeApp(firebaseConfig);
            const firestore = getFirestore(app);
            const authentication = getAuth(app);
            setDb(firestore);
            setAuth(authentication);

            const unsubscribe = onAuthStateChanged(authentication, async (currentUser) => {
                if (currentUser) {
                    const userDocRef = doc(firestore, 'users', currentUser.uid);
                    const userDocSnap = await getDoc(userDocRef);
                    if (!userDocSnap.exists()) {
                        await setDoc(userDocRef, {
                            email: currentUser.email,
                            username: currentUser.displayName || `User_${currentUser.uid.substring(0, 4)}`,
                            role: 'user',
                            createdAt: serverTimestamp()
                        });
                    }
                    setUser(currentUser);
                } else {
                    setUser(null);
                }
                setIsLoading(false);
            });
            return () => unsubscribe();
        }
    }, []);

    if (isLoading) {
        return (
            <div className="fixed inset-0 bg-white flex items-center justify-center">
                <LoadingAnimation />
            </div>
        );
    }

    const themeClass = themeColors[currentTheme];

    return (
        <FirebaseContext.Provider value={{ db, auth, user }}>
            <ThemeContext.Provider value={{ theme: themeClass, currentTheme, setCurrentTheme }}>
                <BrowserRouter>
                    {!user ? <AuthScreen /> : <MainAppLayout />}
                </BrowserRouter>
            </ThemeContext.Provider>
        </FirebaseContext.Provider>
    );
};

export default App;
                
