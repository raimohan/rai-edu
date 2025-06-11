import React, { useContext } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Bell, Menu } from 'lucide-react';
import { ThemeContext } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/FirebaseContext';

const Header = ({ toggleSidebar, notifications, setShowNotificationModal }) => {
    const { theme } = useContext(ThemeContext);
    const { currentUser } = useAuth();
    const location = useLocation();

    const isDashboard = location.pathname === '/dashboard' || location.pathname === '/';

    const getPageTitle = (pathname) => {
        if (isDashboard) return 'Dashboard';
        const name = pathname.split('/').pop().replace(/-/g, ' ');
        return name.charAt(0).toUpperCase() + name.slice(1);
    };

    const pageTitle = getPageTitle(location.pathname);
    const unreadCount = notifications ? notifications.filter(n => !n.read).length : 0;
    const usernameInitial = currentUser?.displayName?.charAt(0).toUpperCase() || currentUser?.email?.charAt(0).toUpperCase() || 'U';

    const HeaderIcons = () => (
        <div className="flex items-center space-x-4 md:space-x-6">
            <div className="relative cursor-pointer" onClick={() => setShowNotificationModal(true)}>
                <Bell className="w-6 h-6 text-gray-500 hover:text-blue-500 transition-colors" />
                {unreadCount > 0 && (
                    <span className="absolute -top-2 -right-2 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                        {unreadCount}
                    </span>
                )}
            </div>
            <Link to="/profile" className="flex items-center space-x-3 cursor-pointer group">
                <div className={`w-10 h-10 bg-${theme.light} rounded-full flex items-center justify-center text-${theme.text} font-semibold text-lg group-hover:ring-2 group-hover:ring-blue-500 transition-all`}>
                    {usernameInitial}
                </div>
                <span className="text-gray-700 dark:text-gray-300 font-medium hidden sm:block">{currentUser?.displayName || currentUser?.email}</span>
            </Link>
        </div>
    );

    if (isDashboard) {
        return (
            <header className="bg-white dark:bg-gray-800 p-4 shadow-sm z-10 flex items-center justify-between">
                <div className="flex items-center">
                    <button onClick={toggleSidebar} className="md:hidden mr-4 text-gray-600 dark:text-gray-300">
                        <Menu size={24} />
                    </button>
                    <h2 className="text-xl md:text-2xl font-semibold text-gray-800 dark:text-gray-200 capitalize">{pageTitle}</h2> 
                </div>
                <HeaderIcons />
            </header>
        );
    }

    // बाकी पेजों पर सिर्फ कोने में आइकन्स
    return (
        <div className="fixed top-4 right-4 z-20">
             <div className="flex items-center p-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full shadow-lg">
                <button onClick={toggleSidebar} className="md:hidden mr-2 text-gray-600 dark:text-gray-300">
                    <Menu size={24} />
                </button>
                <HeaderIcons />
             </div>
        </div>
    );
};

export default Header;
