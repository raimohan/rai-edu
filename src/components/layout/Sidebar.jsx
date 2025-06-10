import React, { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, BookText, Calendar, MonitorPlay, ListTodo, LineChart, Settings,
  Bot, MessageSquare, UserCircle
} from 'lucide-react';
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
                className={`flex items-center px-4 py-3 rounded-lg transition-all duration-300 ${active ? `bg-${theme.light} text-${theme.text} font-semibold shadow-inner` : 'text-gray-600 hover:bg-gray-50 hover:text-blue-500'}`}
            >
                <Icon className="w-5 h-5 mr-4" />
                <span>{label}</span>
            </Link>
        </li>
    );
};

const Sidebar = () => {
    const { theme } = useContext(ThemeContext);
    const location = useLocation(); // Yeh hook batata hai

    const menuItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
        { icon: BookText, label: 'Class Notes', path: '/class-notes' },
        { icon: Calendar, label: 'Meetings', path: '/meetings' },
        { icon: MonitorPlay, label: 'Virtual Classes', path: '/virtual-classes' },
        { icon: ListTodo, label: 'To-Do List', path: '/to-do-list' },
        { icon: LineChart, label: 'Progress Report', path: '/progress-report' },
        { icon: Bot, label: 'AI Assistant', path: '/ai-assistant' },
        { icon: MessageSquare, label: 'Community', path: '/community' },
        { icon: UserCircle, label: 'Profile', path: '/profile' },
        { icon: Settings, label: 'Settings', path: '/settings' },
    ];

    return (
        <aside className="hidden md:flex flex-col w-64 bg-white shadow-lg p-6 rounded-r-2xl overflow-y-auto custom-scrollbar">
            <div className="flex items-center mb-10">
                <svg className={`w-8 h-8 text-${theme.primary} mr-3`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5s3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18s-3.332.477-4.5 1.253" />
                </svg>
                <h1 className="text-xl font-bold text-gray-800">RaiEdu</h1>
            </div>

            <nav className="flex-1">
                <ul>
                    {menuItems.map(item => (
                        <SidebarMenuItem
                            key={item.label}
                            icon={item.icon}
                            label={item.label}
                            to={item.path}
                            active={location.pathname === item.path}
                        />
                    ))}
                </ul>
            </nav>
        </aside>
    );
};

export default Sidebar;

      
