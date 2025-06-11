import React, { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
// नए सोशल मीडिया आइकन्स इम्पोर्ट करें
import { 
    LayoutDashboard, BookText, Calendar, MonitorPlay, ListTodo, LineChart, 
    Settings, Bot, MessageSquare, UserCircle, Users, UsersRound, 
    Github, Twitter, Instagram, Youtube 
} from 'lucide-react';
import { ThemeContext } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/FirebaseContext';
import { useSoundEffect } from '../../hooks/useSoundEffect';

const SidebarMenuItem = ({ icon: Icon, label, to, active, onClick }) => {
    const { theme } = useContext(ThemeContext);
    
    return (
        <li className="mb-2">
            <Link
                to={to}
                onClick={onClick}
                className={`flex items-center px-4 py-3 rounded-lg transition-all duration-300 ${active ? `bg-${theme.light} text-${theme.text} font-semibold shadow-inner` : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
            >
                <Icon className="w-5 h-5 mr-4 flex-shrink-0" />
                <span>{label}</span>
            </Link>
        </li>
    );
};

const SocialLink = ({ href, icon: Icon, label }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" title={label} className="text-gray-400 hover:text-blue-500 transition-colors">
        <Icon size={20} />
    </a>
);

const Sidebar = ({ isSidebarOpen, toggleSidebar }) => {
    const { theme } = useContext(ThemeContext);
    const { isAdmin } = useAuth();
    const location = useLocation();
    const { playClick } = useSoundEffect();

    const handleLinkClick = () => {
        playClick();
        // मोबाइल पर लिंक क्लिक होने पर साइडबार बंद करें
        if (window.innerWidth < 768) {
            toggleSidebar();
        }
    };

    const menuItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
        { icon: BookText, label: 'Class Notes', path: '/class-notes' },
        { icon: Calendar, label: 'Meetings', path: '/meetings' },
        { icon: MonitorPlay, label: 'Virtual Classes', path: '/virtual-classes' },
        { icon: ListTodo, label: 'To-Do List', path: '/to-do-list' },
        { icon: LineChart, label: 'Progress Report', path: '/progress-report' },
        { icon: Bot, label: 'AI Assistant', path: '/ai-assistant' },
        { icon: MessageSquare, label: 'Community', path: '/community' },
        { icon: UsersRound, label: 'Friends', path: '/friends' },
        { icon: Users, label: 'User Manager', path: '/user-manager', adminOnly: true },
        { icon: UserCircle, label: 'Profile', path: '/profile' },
        { icon: Settings, label: 'Settings', path: '/settings' },
    ];

    const socialLinks = [
        { href: "https://youtube.com", icon: Youtube, label: "YouTube" },
        { href: "https://instagram.com", icon: Instagram, label: "Instagram" },
        { href: "https://twitter.com", icon: Twitter, label: "X (Twitter)" },
        { href: "https://github.com", icon: Github, label: "GitHub" },
    ];

    return (
        <aside 
            className={`fixed inset-y-0 left-0 flex flex-col w-64 bg-white dark:bg-gray-800 shadow-lg p-6 overflow-y-auto transition-transform duration-300 ease-in-out z-40
            ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
            md:relative md:translate-x-0 md:flex`}
        >
            <div className="flex-1 flex flex-col justify-between">
                {/* ऊपरी हिस्सा: लोगो और मेनू */}
                <div>
                    <div className="flex items-center mb-10">
                        <svg className={`w-8 h-8 text-${theme.primary} mr-3`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5s3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18s-3.332.477-4.5 1.253" />
                        </svg>
                        <h1 className="text-xl font-bold text-gray-800 dark:text-white">RaiEdu</h1>
                    </div>

                    <nav>
                        <ul>
                            {menuItems.map(item => {
                                if (item.adminOnly && !isAdmin) return null;
                                return (
                                    <SidebarMenuItem
                                        key={item.label}
                                        icon={item.icon}
                                        label={item.label}
                                        to={item.path}
                                        active={location.pathname.startsWith(item.path)}
                                        onClick={handleLinkClick}
                                    />
                                )
                            })}
                        </ul>
                    </nav>
                </div>

                {/* निचला हिस्सा: सोशल मीडिया लिंक्स */}
                <div className="mt-8">
                    <p className="px-4 text-xs font-semibold text-gray-400 uppercase mb-4">Follow Us</p>
                    <div className="flex items-center justify-around px-4">
                        {socialLinks.map(social => (
                            <SocialLink key={social.label} href={social.href} icon={social.icon} label={social.label} />
                        ))}
                    </div>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
