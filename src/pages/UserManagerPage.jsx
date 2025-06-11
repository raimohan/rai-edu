import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/FirebaseContext';
import Card from '../components/common/Card';
import LoadingAnimation from '../components/common/LoadingAnimation';
import { Shield, ShieldOff, UserX, UserCheck, Trash2 } from 'lucide-react';

const UserManagerPage = () => {
    const { db, currentUser, isAdmin } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isAdmin && db) {
            const usersCollectionRef = collection(db, 'users');
            const unsubscribe = onSnapshot(usersCollectionRef, (snapshot) => {
                const usersList = snapshot.docs.map(u => ({ id: u.id, ...u.data() }));
                setUsers(usersList);
                setLoading(false);
            });
            return () => unsubscribe();
        } else {
            setLoading(false);
        }
    }, [isAdmin, db]);

    const toggleAdminRole = async (targetUserId, currentRole) => {
        if (targetUserId === currentUser.uid) {
            alert("You cannot change your own role.");
            return;
        }
        const newRole = currentRole === 'admin' ? 'user' : 'admin';
        const userDocRef = doc(db, 'users', targetUserId);
        await updateDoc(userDocRef, { role: newRole });
    };

    const toggleUserStatus = async (targetUserId, currentStatus) => {
        if (targetUserId === currentUser.uid) {
            alert("You cannot disable yourself.");
            return;
        }
        const newStatus = currentStatus === 'disabled' ? 'active' : 'disabled';
        const userDocRef = doc(db, 'users', targetUserId);
        await updateDoc(userDocRef, { status: newStatus });
    };

    const deleteUserData = async (targetUserId) => {
        if (targetUserId === currentUser.uid) {
            alert("You cannot delete your own account from here.");
            return;
        }
        if (window.confirm("Are you sure you want to permanently delete this user's data? This cannot be undone.")) {
            await deleteDoc(doc(db, 'users', targetUserId));
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center h-full"><LoadingAnimation /></div>;
    }

    if (!isAdmin) {
        return (
            <Card title="Access Denied">
                <p className="text-red-500 text-center font-semibold">You do not have permission to view this page. This is for admins only.</p>
            </Card>
        );
    }

    return (
        <Card title="User Manager">
            <p className="text-gray-600 dark:text-gray-400 mb-4">Here you can manage all registered users.</p>
            <div className="overflow-x-auto rounded-lg border dark:border-gray-700">
                <table className="min-w-full bg-white dark:bg-gray-800">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Username</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Email</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Role</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {users.map((u) => (
                            <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900 dark:text-white">{u.username}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-gray-500 dark:text-gray-300">{u.email}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${u.role === 'admin' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                                        {u.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${u.status === 'disabled' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
                                        {u.status || 'active'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <div className="flex items-center space-x-3">
                                        <button onClick={() => toggleAdminRole(u.id, u.role)} title={u.role === 'admin' ? 'Remove Admin' : 'Make Admin'} className="text-indigo-600 hover:text-indigo-900 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600">
                                            {u.role === 'admin' ? <ShieldOff size={18} /> : <Shield size={18} />}
                                        </button>
                                        <button onClick={() => toggleUserStatus(u.id, u.status)} title={u.status === 'disabled' ? 'Enable User' : 'Disable User'} className="text-yellow-600 hover:text-yellow-900 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600">
                                            {u.status === 'disabled' ? <UserCheck size={18} /> : <UserX size={18} />}
                                        </button>
                                        <button onClick={() => deleteUserData(u.id)} title="Delete User Data" className="text-red-600 hover:text-red-900 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600">
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>
    );
};

export default UserManagerPage;
