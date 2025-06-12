import React, { useContext } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Bell, Menu } from 'lucide-react';
import { ThemeContext } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/FirebaseContext';
import { AppContext } from '../../App';

const Header = ({ toggleSidebar, notifications, setShowNotificationModal }) => {
    const { theme } = useContext(ThemeContext);
    const { currentUser } = useAuth();
    const location = useLocation();
    const { playClick } = useContext(AppContext);

    const isDashboard = location.pathname === '/dashboard' || location.pathname === '/';
    const getPageTitle = (pathname) => {
        if (isDashboard) return 'Dashboard';
        const name = pathname.split('/').pop().replace(/-/g, ' ');
        return name.charAt(0).toUpperCase() + name.slice(1);
    };

    const pageTitle = getPageTitle(location.pathname);
    const unreadCount = notifications ? notifications.filter(n => !n.isRead).length : 0;
    const usernameInitial = currentUser?.displayName?.charAt(0).toUpperCase() || 'U';

    const handleBellClick = () => {
        playClick();
        setShowNotificationModal(true);
    };

    const HeaderIcons = () => (
        <div className="flex items-center space-x-4 md:space-x-6">
            <button onClick={handleBellClick} className="relative text-gray-500 hover:text-blue-500 transition-colors">
                <Bell className="w-6 h-6" />
                {unreadCount > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">{unreadCount}</span>}
            </button>
            <Link to={`/profile/${currentUser?.uid}`} className="flex items-center space-x-3 cursor-pointer group">
                <div className={`w-10 h-10 bg-${theme.light} rounded-full flex items-center justify-center text-${theme.text} font-semibold text-lg group-hover:ring-2 group-hover:ring-blue-500 transition-all`}>
                    {usernameInitial}
                </div>
                <span className="text-gray-700 dark:text-gray-300 font-medium hidden sm:block">{currentUser?.displayName || currentUser?.email}</span>
            </Link>
        </div>
    );

    return (
        <header className="bg-white dark:bg-gray-800 p-4 shadow-sm z-10 flex items-center justify-between">
            <div className="flex items-center">
                <button onClick={toggleSidebar} className="md:hidden mr-4 text-gray-600 dark:text-gray-300"><Menu size={24} /></button>
                {!isDashboard && <h2 className="text-xl md:text-2xl font-semibold text-gray-800 dark:text-gray-200 capitalize">{pageTitle}</h2>}
            </div>
            <div className={`${isDashboard ? 'w-full flex justify-between items-center' : ''}`}>
                {isDashboard && <h2 className="text-xl md:text-2xl font-semibold text-gray-800 dark:text-gray-200 capitalize">Dashboard</h2>}
                <HeaderIcons />
            </div>
        </header>
    );
};

export default Header;
