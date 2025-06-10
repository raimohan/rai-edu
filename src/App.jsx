import React, { useState, useEffect, useContext, createContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Contexts & Components
import { ThemeContext, themeColors } from './contexts/ThemeContext';
import { FirebaseContext } from './contexts/FirebaseContext';
import LoadingAnimation from './components/common/LoadingAnimation';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';

// Naye Pages
import GetStartedPage from './pages/GetStartedPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';

// Puraane Pages
import DashboardPage from './pages/DashboardPage';
import SettingsPage from './pages/SettingsPage';
// Hum baaki pages ko agle steps me add karenge

export const AppContext = createContext(); // Mobile sidebar ke liye

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
                            <Route path="/settings" element={<SettingsPage />} />
                            {/* Baaki sabhi pages ke route yahan add honge */}
                            
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
    const [user, setUser] = useState(null);
    const auth = getAuth();
    const db = getFirestore();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, [auth]);

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
                        
                        {/* Agar user logged in hai to "/*" waale saare path MainAppLayout par jayenge */}
                        <Route path="/*" element={user ? <MainAppLayout /> : <Navigate to="/welcome" />} />
                    </Routes>
                </BrowserRouter>
            </ThemeContext.Provider>
        </FirebaseContext.Provider>
    );
};

export default App;
