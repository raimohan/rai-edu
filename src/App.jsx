import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

// Contexts
import { ThemeContext, themeColors } from './contexts/ThemeContext';
import { FirebaseContext } from './contexts/FirebaseContext';

// Hooks
import { useSoundEffect } from './hooks/useSoundEffect';

// Pages & Components
import AuthScreen from './pages/AuthScreen';
import LoadingAnimation from './components/common/LoadingAnimation';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
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
import NotificationModal from './components/common/NotificationModal';
import { getFirebaseConfig } from './services/firebase';

const App = () => {
    const [activeMenuItem, setActiveMenuItem] = useState('Dashboard');
    const [currentTheme, setCurrentTheme] = useState('blue');
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [notifications, setNotifications] = useState([
        { id: 1, message: 'Welcome to RaiEdu! Explore new features.', read: false },
        { id: 2, message: 'Your Math class starts in 15 minutes.', read: false },
        { id: 3, message: 'New assignment posted in English Literature.', read: true },
    ]);
    const [showNotificationModal, setShowNotificationModal] = useState(false);
    const { playClick, playAlarm, stopAlarm } = useSoundEffect();

    const [db, setDb] = useState(null);
    const [auth, setAuth] = useState(null);
    const [user, setUser] = useState(null);

    const [appTasks, setAppTasks] = useState([
        { id: 1, text: 'Complete Chemistry Homework', completed: false, dueDate: '2025-06-10', reminderTime: '22:30', reminded: false },
        { id: 2, text: 'Prepare for Math Exam', completed: false, dueDate: '2025-06-12', reminderTime: '15:00', reminded: false },
    ]);

    useEffect(() => {
        const firebaseConfig = getFirebaseConfig();
        if (firebaseConfig) {
            const app = initializeApp(firebaseConfig);
            const firestore = getFirestore(app);
            const authentication = getAuth(app);
            setDb(firestore);
            setAuth(authentication);

            const unsubscribe = onAuthStateChanged(authentication, async (user) => {
                if (user) {
                    const userDocRef = doc(firestore, 'users', user.uid);
                    const userDocSnap = await getDoc(userDocRef);
                    if (!userDocSnap.exists()) {
                        await setDoc(userDocRef, {
                            email: user.email,
                            username: user.displayName || `User_${user.uid.substring(0, 4)}`,
                            role: 'user',
                            createdAt: serverTimestamp()
                        });
                    }
                    setUser(user);
                } else {
                    setUser(null);
                }
                setIsAuthReady(true);
                setIsLoading(false);
            });
            return () => unsubscribe();
        } else {
            console.error("Firebase config is missing!");
            setIsAuthReady(true);
            setIsLoading(false);
        }
    }, []);

    // Reminder System Logic
    useEffect(() => {
        const reminderInterval = setInterval(() => {
            const now = new Date();
            const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
            const currentDate = now.toISOString().slice(0, 10);

            appTasks.forEach(task => {
                if (!task.completed && !task.reminded && task.reminderTime === currentTime && task.dueDate === currentDate) {
                    playAlarm();
                    setNotifications(prev => [...prev, { id: Date.now(), message: `Reminder: "${task.text}" is due now!`, read: false }]);
                    setAppTasks(prevTasks => prevTasks.map(t => (t.id === task.id ? { ...t, reminded: true } : t)));
                    setTimeout(stopAlarm, 5000);
                }
            });
        }, 60000); // Check every minute

        return () => clearInterval(reminderInterval);
    }, [appTasks, playAlarm, stopAlarm]);

    const handleMenuItemClick = (menuItem) => {
        playClick();
        setActiveMenuItem(menuItem);
    };

    const renderContent = () => {
        switch (activeMenuItem) {
            case 'Dashboard': return <DashboardPage setActiveMenuItem={setActiveMenuItem} />;
            case 'Class Notes': return <ClassNotesPage />;
            case 'Meetings': return <MeetingsPage />;
            case 'Virtual Classes': return <VirtualClassesPage />;
            case 'To-Do List': return <TodoListPage appTasks={appTasks} setAppTasks={setAppTasks} />;
            case 'Progress Report': return <ProgressReportPage />;
            case 'AI Assistant': return <GeminiAssistantPage />;
            case 'Community': return <CommunityPage />;
            case 'Profile': return <ProfilePage />;
            case 'Settings': return <SettingsPage setCurrentTheme={setCurrentTheme} currentTheme={currentTheme} />;
            default: return <DashboardPage setActiveMenuItem={setActiveMenuItem} />;
        }
    };

    if (isLoading || !isAuthReady) {
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
                {!user ? (
                    <AuthScreen />
                ) : (
                    <div className="flex h-screen bg-gray-100 font-poppins text-gray-800">
                        <Sidebar activeMenuItem={activeMenuItem} handleMenuItemClick={handleMenuItemClick} />
                        <main className="flex-1 flex flex-col overflow-hidden">
                            <Header
                                activeMenuItem={activeMenuItem}
                                notifications={notifications}
                                setShowNotificationModal={setShowNotificationModal}
                                handleMenuItemClick={handleMenuItemClick}
                            />
                            <section className="flex-1 p-6 overflow-y-auto">
                                {renderContent()}
                            </section>
                        </main>
                        {showNotificationModal && (
                            <NotificationModal notifications={notifications} setNotifications={setNotifications} onClose={() => { playClick(); setShowNotificationModal(false); }} />
                        )}
                    </div>
                )}
            </ThemeContext.Provider>
        </FirebaseContext.Provider>
    );
};

export default App;
