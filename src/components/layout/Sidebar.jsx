import React, { useContext } from 'react';
import {
  LayoutDashboard, BookText, Calendar, MonitorPlay, ListTodo, LineChart, Settings,
  Bot, MessageSquare, UserCircle
} from 'lucide-react';
import { ThemeContext } from '../../contexts/ThemeContext';

const SidebarMenuItem = ({ icon: Icon, label, active, onClick }) => {
    const { theme } = useContext(ThemeContext);
    return (
        <li className="mb-2">
            <a
                href="#"
                onClick={(e) => { e.preventDefault(); onClick(); }}
                className={`flex items-center px-4 py-3 rounded-lg transition-all duration-300 ${active ? `bg-${theme.light} text-${theme.text} font-semibold shadow-inner` : 'text-gray-600 hover:bg-gray-50 hover:text-blue-500'}`}
            >
                <Icon className="w-5 h-5 mr-4" />
                <span>{label}</span>
            </a>
        </li>
    );
};

const Sidebar = ({ activeMenuItem, handleMenuItemClick }) => {
    const { theme } = useContext(ThemeContext);

    const menuItems = [
        { icon: LayoutDashboard, label: 'Dashboard' },
        { icon: BookText, label: 'Class Notes' },
        { icon: Calendar, label: 'Meetings' },
        { icon: MonitorPlay, label: 'Virtual Classes' },
        { icon: ListTodo, label: 'To-Do List' },
        { icon: LineChart, label: 'Progress Report' },
        { icon: Bot, label: 'AI Assistant' },
        { icon: MessageSquare, label: 'Community' },
        { icon: UserCircle, label: 'Profile' },
        { icon: Settings, label: 'Settings' },
    ];

    return (
        <aside className="hidden md:flex flex-col w-64 bg-white shadow-lg p-6 rounded-r-2xl overflow-y-auto custom-scrollbar border-r border-gray-100">
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
                            active={activeMenuItem === item.label}
                            onClick={() => handleMenuItemClick(item.label)}
                        />
                    ))}
                </ul>
            </nav>
        </aside>
    );
};

export default Sidebar;