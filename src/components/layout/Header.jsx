import React, { useContext } from 'react';
import { useLocation, Link } from 'react-router-dom'; // useLocation और Link इम्पोर्ट करें
import { Search, Bell } from 'lucide-react';
import { ThemeContext } from '../../contexts/ThemeContext';
import { useSoundEffect } from '../../hooks/useSoundEffect';
import { useAuth } from '../../contexts/FirebaseContext';

const Header = ({ notifications, setShowNotificationModal }) => {
    const { theme } = useContext(ThemeContext);
    const { playClick } = useSoundEffect();
    const { currentUser } = useAuth();
    const location = useLocation(); // वर्तमान URL पाने के लिए

    // URL से पेज का नाम निकालने का फंक्शन
    const getPageTitle = (pathname) => {
        if (pathname === '/dashboard' || pathname === '/') {
            return 'Dashboard';
        }
        // URL से '-' हटाकर और पहले अक्षर को बड़ा करके टाइटल बनाएं
        const name = pathname.split('/').pop().replace(/-/g, ' ');
        return name.charAt(0).toUpperCase() + name.slice(1);
    };

    const pageTitle = getPageTitle(location.pathname);

    const unreadCount = notifications.filter(n => !n.read).length;

    const handleNotificationClick = () => {
        playClick();
        setShowNotificationModal(true);
    };

    const usernameInitial = currentUser?.displayName?.charAt(0).toUpperCase() || currentUser?.email?.charAt(0).toUpperCase() || 'U';

    return (
        <header className="bg-white dark:bg-gray-800 p-4 shadow-md z-10 rounded-b-2xl flex items-center justify-between mx-4 mt-4 md:mx-auto md:max-w-full lg:max-w-full xl:max-w-full w-[calc(100%-2rem)] md:w-auto">
            {/* हार्डकोडेड टाइटल की जगह डाइनेमिक टाइटल का उपयोग करें */}
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 capitalize">{pageTitle}</h2> 
            
            <div className="flex items-center space-x-6">
                {/* सर्च आइकन */}
                <button onClick={() => alert('Search functionality will be added soon!')} className="text-gray-500 hover:text-blue-500 transition-colors">
                    <Search className="w-6 h-6" />
                </button>

                {/* नोटिफिकेशन आइकन */}
                <div className="relative cursor-pointer" onClick={handleNotificationClick}>
                    <Bell className="w-6 h-6 text-gray-500 hover:text-blue-500 transition-colors" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-2 -right-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                            {unreadCount}
                        </span>
                    )}
                </div>

                {/* प्रोफ़ाइल आइकन (अब यह एक लिंक है) */}
                <Link to="/profile" className="flex items-center space-x-3 cursor-pointer group">
                    <div className={`w-10 h-10 bg-${theme.light} rounded-full flex items-center justify-center text-${theme.text} font-semibold text-lg group-hover:ring-2 group-hover:ring-blue-500 transition-all`}>
                        {usernameInitial}
                    </div>
                    <span className="text-gray-700 dark:text-gray-300 font-medium hidden sm:block">{currentUser?.displayName || currentUser?.email}</span>
                </Link>
            </div>
        </header>
    );
};

export default Header;
