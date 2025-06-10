import React, { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Settings } from 'lucide-react';
import { ThemeContext } from '../../contexts/ThemeContext';
import { useSoundEffect } from '../../hooks/useSoundEffect';

const SidebarMenuItem = ({ icon: Icon, label, to, active }) => {
    const { theme } = useContext(ThemeContext);
    const { playClick } = useSoundEffect();
    return (
        <li className="mb-2">
            <Link
                to={to}
                onClick={playClick}
                className={`flex items-center px-4 py-3 rounded-lg transition-all duration-300 ${active ? `bg-${theme.light} text-${theme.text} font-semibold shadow-inner` : 'text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
            >
                <Icon className="w-5 h-5 mr-4" />
                <span>{label}</span>
            </Link>
        </li>
    );
};

const Sidebar = () => {
    const { theme } = useContext(ThemeContext);
    const location = useLocation();

    const menuItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
        // Hum baaki links baad me add karenge
        { icon: Settings, label: 'Settings', path: '/settings' },
    ];

    return (
        <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-gray-800 shadow-lg p-6 rounded-r-2xl overflow-y-auto">
            <div className="flex items-center mb-10">
                <svg className={`w-8 h-8 text-${theme.primary} mr-3`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {/* ... (svg path) ... */}
                </svg>
                <h1 className="text-xl font-bold text-gray-800 dark:text-white">RaiEdu</h1>
            </div>

            <nav className="flex-1">
                <ul>
                    {menuItems.map(item => (
                        <SidebarMenuItem
                            key={item.label}
                            icon={item.icon}
                            label={item.label}
                            to={item.path}
                            active={location.pathname.startsWith(item.path)}
                        />
                    ))}
                </ul>
            </nav>
        </aside>
    );
};

export default Sidebar;
