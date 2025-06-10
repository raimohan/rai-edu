import React, { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, BookText, Calendar, MonitorPlay, ListTodo, LineChart, Settings, Bot, MessageSquare, UserCircle, Users } from 'lucide-react';
import { ThemeContext } from '../../contexts/ThemeContext';
// ... baaki imports

const SidebarMenuItem = ({ icon: Icon, label, to, active }) => {
    // ... (Isme koi badlaav nahi)
};

const Sidebar = () => {
    const { theme } = useContext(ThemeContext);
    const location = useLocation();

    // Poori menu list
    const menuItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
        { icon: BookText, label: 'Class Notes', path: '/class-notes' },
        { icon: Calendar, label: 'Meetings', path: '/meetings' },
        { icon: MonitorPlay, label: 'Virtual Classes', path: '/virtual-classes' },
        { icon: ListTodo, label: 'To-Do List', path: '/to-do-list' },
        { icon: LineChart, label: 'Progress Report', path: '/progress-report' },
        { icon: Bot, label: 'AI Assistant', path: '/ai-assistant' },
        { icon: MessageSquare, label: 'Community', path: '/community' },
        { icon: Users, label: 'User Manager', path: '/user-manager' }, // Admin ke liye
        { icon: UserCircle, label: 'Profile', path: '/profile' },
        { icon: Settings, label: 'Settings', path: '/settings' },
    ];

    return (
        <aside className="hidden md:flex flex-col w-64 ...">
            {/* ... (Logo section waisa hi rahega) ... */}
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
