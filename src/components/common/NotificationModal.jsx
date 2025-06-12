import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/FirebaseContext';
import { doc, updateDoc } from 'firebase/firestore';
import { Bell, Mail, UserPlus, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { AppContext } from '../../App';

const NotificationIcon = ({ type }) => {
    if (type === 'new_message') return <Mail size={18} className="text-blue-500" />;
    if (type === 'friend_request') return <UserPlus size={18} className="text-green-500" />;
    return <Bell size={18} className="text-gray-500" />;
};

const NotificationModal = ({ notifications, onClose }) => {
    const { db } = useAuth();
    const { playClick } = useContext(AppContext);
    const navigate = useNavigate();

    const handleNotificationClick = async (notification) => {
        playClick();
        if (!notification.isRead) {
            await updateDoc(doc(db, 'notifications', notification.id), { isRead: true });
        }
        navigate(notification.link);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-end z-50" onClick={onClose}>
            <div className="w-full max-w-sm h-full bg-white dark:bg-gray-800 shadow-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
                <header className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
                    <h3 className="text-lg font-semibold flex items-center gap-2"><Bell /> Notifications</h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"><X size={20}/></button>
                </header>
                <main className="flex-1 overflow-y-auto">
                    {notifications.length > 0 ? (
                        <ul>
                            {notifications.map(notif => (
                                <li key={notif.id} onClick={() => handleNotificationClick(notif)} className={`p-4 border-b dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${!notif.isRead ? 'bg-blue-50 dark:bg-blue-500/10' : ''}`}>
                                    <div className="flex items-start gap-3">
                                        <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded-full"><NotificationIcon type={notif.type} /></div>
                                        <div>
                                            <p className="text-sm text-gray-800 dark:text-gray-200">
                                                <span className="font-bold">{notif.senderName}</span> {notif.message}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {notif.createdAt ? formatDistanceToNow(notif.createdAt.toDate(), { addSuffix: true }) : ''}
                                            </p>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : ( <div className="flex items-center justify-center h-full text-gray-500"><p>You have no new notifications.</p></div> )}
                </main>
            </div>
        </div>
    );
};

export default NotificationModal;
