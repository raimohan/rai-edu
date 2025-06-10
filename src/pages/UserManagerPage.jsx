import React, { useState, useEffect, useContext } from 'react';
import { collection, onSnapshot, doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { FirebaseContext } from '../contexts/FirebaseContext';
import Card from '../components/common/Card';
import LoadingAnimation from '../components/common/LoadingAnimation';
import { Shield, ShieldOff, UserX, UserCheck, Trash2 } from 'lucide-react';

const UserManagerPage = () => {
    const { db, user } = useContext(FirebaseContext);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);

    // Step 1: Check karein ki current user admin hai ya nahi
    useEffect(() => {
        if (user) {
            const userDocRef = doc(db, 'users', user.uid);
            const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
                if (docSnap.exists() && docSnap.data().role === 'admin') {
                    setIsAdmin(true);
                } else {
                    setIsAdmin(false);
                }
            });
            return () => unsubscribe();
        }
    }, [user, db]);

    // Step 2: Agar user admin hai, to sabhi users ka data fetch karein
    useEffect(() => {
        if (isAdmin) {
            const usersCollectionRef = collection(db, 'users');
            const unsubscribe = onSnapshot(usersCollectionRef, (snapshot) => {
                const usersList = snapshot.docs.map(u => ({ id: u.id, ...u.data() }));
                setUsers(usersList);
                setLoading(false);
            });
            return () => unsubscribe(); // Real-time listener ko saaf karein
        } else if (user) {
            // Agar user hai lekin admin nahi, to loading band karein
            setLoading(false);
        }
    }, [isAdmin, db, user]);

    // User ka role badalne ke liye function
    const toggleAdminRole = async (targetUserId, currentRole) => {
        if (targetUserId === user.uid) {
            alert("Aap apna khud ka role nahi badal sakte.");
            return;
        }
        const newRole = currentRole === 'admin' ? 'user' : 'admin';
        const userDocRef = doc(db, 'users', targetUserId);
        await updateDoc(userDocRef, { role: newRole });
    };

    // User ko disable/enable karne ke liye function
    const toggleUserStatus = async (targetUserId, currentStatus) => {
        if (targetUserId === user.uid) {
            alert("Aap apne aap ko disable nahi kar sakte.");
            return;
        }
        const newStatus = currentStatus === 'disabled' ? 'active' : 'disabled';
        const userDocRef = doc(db, 'users', targetUserId);
        await updateDoc(userDocRef, { status: newStatus });
    };

    // User ko delete karne ke liye function
    const deleteUser = async (targetUserId) => {
        if (targetUserId === user.uid) {
            alert("Aap apna khud ka account yahan se delete nahi kar sakte.");
            return;
        }
        if (window.confirm("Are you sure you want to permanently delete this user's data? This cannot be undone.")) {
            // Firestore se user ka data delete karein
            await deleteDoc(doc(db, 'users', targetUserId));
            // Zaroori Note: Isse sirf database record delete hoga.
            // Asli user account (login wala) delete karne ke liye Firebase Console ya Cloud Function ka istemal karna padta hai.
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center h-full"><LoadingAnimation /></div>;
    }

    if (!isAdmin) {
        return (
            <Card title="Access Denied">
                <p className="text-red-500">You do not have permission to view this page. This is for admins only.</p>
            </Card>
        );
    }

    return (
        <Card title="User Manager">
            <p className="text-gray-600 dark:text-gray-400 mb-4">Yahan aap sabhi registered users ko manage kar sakte hain.</p>
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
                                        <button onClick={() => deleteUser(u.id)} title="Delete User Data" className="text-red-600 hover:text-red-900 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600">
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
