import React from 'react';
import { XCircle } from 'lucide-react';
import ThemedButton from './ThemedButton';

const NotificationModal = ({ notifications, setNotifications, onClose }) => {

    const handleOpen = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    React.useEffect(() => {
        handleOpen();
    }, []);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-6 rounded-2xl shadow-2xl max-w-md w-full">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-gray-800">Your Notifications</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
                        <XCircle className="w-6 h-6" />
                    </button>
                </div>
                <div className="max-h-80 overflow-y-auto custom-scrollbar pr-2">
                    {notifications.length === 0 ? (
                        <p className="text-gray-600 text-center py-4">No new notifications.</p>
                    ) : (
                        <ul className="space-y-3">
                            {notifications.map(notif => (
                                <li key={notif.id} className={`p-3 rounded-lg shadow-sm ${notif.read ? 'bg-gray-100 text-gray-600' : 'bg-blue-50 text-blue-800 font-medium'}`}>
                                    {notif.message}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                <ThemedButton onClick={onClose} className="w-full mt-6">
                    Close
                </ThemedButton>
            </div>
        </div>
    );
};

export default NotificationModal;