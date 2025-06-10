import React, { useContext } from 'react';
import { Search, Bell, UserCircle } from 'lucide-react';
import { ThemeContext } from '../../contexts/ThemeContext';
import { useSoundEffect } from '../../hooks/useSoundEffect';
import { FirebaseContext } from '../../contexts/FirebaseContext';

const Header = ({ activeMenuItem, notifications, setShowNotificationModal, handleMenuItemClick }) => {
    const { theme } = useContext(ThemeContext);
    const { playClick } = useSoundEffect();
    const { user } = useContext(FirebaseContext);

    const unreadCount = notifications.filter(n => !n.read).length;

    const handleNotificationClick = () => {
        playClick();
        setShowNotificationModal(true);
    };

    const usernameInitial = user?.displayName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U';

    return (
        <header className="bg-white p-4 shadow-md z-10 rounded-b-2xl flex items-center justify-between mx-4 mt-4 md:mx-auto md:max-w-full lg:max-w-full xl:max-w-full w-[calc(100%-2rem)] md:w-full">
            <h2 className="text-2xl font-semibold text-gray-800">{activeMenuItem}</h2>
            <div className="flex items-center space-x-6">
                <Search className="w-6 h-6 text-gray-500 cursor-pointer hover:text-blue-500 transition-colors" onClick={playClick}/>
                <div className="relative cursor-pointer hover:text-blue-500 transition-colors" onClick={handleNotificationClick}>
                    <Bell className="w-6 h-6 text-gray-500" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                            {unreadCount}
                        </span>
                    )}
                </div>
                <div className="flex items-center space-x-3 cursor-pointer" onClick={() => handleMenuItemClick('Profile')}>
                    <div className={`w-10 h-10 bg-${theme.light} rounded-full flex items-center justify-center text-${theme.text} font-semibold text-lg`}>
                        {usernameInitial}
                    </div>
                    <span className="text-gray-700 font-medium hidden sm:block">{user?.displayName || user?.email}</span>
                </div>
            </div>
        </header>
    );
};

export default Header;
