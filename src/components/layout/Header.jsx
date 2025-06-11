import React, { useContext } from 'react';
import { Search, Bell } from 'lucide-react';
import { ThemeContext } from '../../contexts/ThemeContext';
import { useSoundEffect } from '../../hooks/useSoundEffect';
import { useAuth } from '../../contexts/FirebaseContext';

const Header = ({ notifications, setShowNotificationModal }) => {
    const { theme } = useContext(ThemeContext);
    const { playClick } = useSoundEffect();
    const { currentUser } = useAuth();

    const unreadCount = notifications.filter(n => !n.read).length;

    const handleNotificationClick = () => {
        playClick();
        setShowNotificationModal(true);
    };

    const usernameInitial = currentUser?.displayName?.charAt(0).toUpperCase() || currentUser?.email?.charAt(0).toUpperCase() || 'U';

    return (
        <header className="bg-white dark:bg-gray-800 p-4 shadow-md z-10 rounded-b-2xl flex items-center justify-between mx-4 mt-4 md:mx-auto md:max-w-full lg:max-w-full xl:max-w-full w-[calc(100%-2rem)] md:w-auto">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">Dashboard</h2> 
            <div className="flex items-center space-x-6">
                <Search className="w-6 h-6 text-gray-500 cursor-pointer hover:text-blue-500 transition-colors" onClick={playClick}/>
                <div className="relative cursor-pointer" onClick={handleNotificationClick}>
                    <Bell className="w-6 h-6 text-gray-500 hover:text-blue-500 transition-colors" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-2 -right-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                            {unreadCount}
                        </span>
                    )}
                </div>
                <div className="flex items-center space-x-3 cursor-pointer">
                    <div className={`w-10 h-10 bg-${theme.light} rounded-full flex items-center justify-center text-${theme.text} font-semibold text-lg`}>
                        {usernameInitial}
                    </div>
                    <span className="text-gray-700 dark:text-gray-300 font-medium hidden sm:block">{currentUser?.displayName || currentUser?.email}</span>
                </div>
            </div>
        </header>
    );
};

export default Header;
