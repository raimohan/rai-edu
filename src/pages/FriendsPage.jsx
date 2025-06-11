import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/FirebaseContext';
import { collection, query, where, onSnapshot, doc, getDoc, writeBatch, deleteDoc } from 'firebase/firestore';
import Card from '../components/common/Card';
import { Users, UserPlus, UserCheck, UserX } from 'lucide-react';

const UserAvatar = ({ username }) => {
    const initial = username?.charAt(0).toUpperCase() || '?';
    return (
        <div className="w-12 h-12 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center font-bold text-white text-xl flex-shrink-0">
            {initial}
        </div>
    );
};

const FriendsPage = () => {
    const { db, currentUser } = useAuth();
    const [activeTab, setActiveTab] = useState('friends'); // 'friends' or 'requests'
    const [friends, setFriends] = useState([]);
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    // दोस्तों की लिस्ट लाना
    useEffect(() => {
        if (!currentUser || !db) return;

        const userDocRef = doc(db, 'users', currentUser.uid);
        const unsubscribe = onSnapshot(userDocRef, async (docSnap) => {
            const friendIds = docSnap.data()?.friends || [];
            if (friendIds.length > 0) {
                const friendPromises = friendIds.map(id => getDoc(doc(db, 'users', id)));
                const friendDocs = await Promise.all(friendPromises);
                const friendsData = friendDocs.map(doc => ({ id: doc.id, ...doc.data() }));
                setFriends(friendsData);
            } else {
                setFriends([]);
            }
        });
        return () => unsubscribe();
    }, [currentUser, db]);

    // फ्रेंड रिक्वेस्ट्स लाना
    useEffect(() => {
        if (!currentUser || !db) return;

        const requestsRef = collection(db, 'friend_requests');
        const q = query(requestsRef, where('to', '==', currentUser.uid), where('status', '==', 'pending'));
        
        const unsubscribe = onSnapshot(q, async (snapshot) => {
            const requestsDataPromises = snapshot.docs.map(async (doc) => {
                const requestData = doc.data();
                const senderDoc = await getDoc(doc(db, 'users', requestData.from));
                return {
                    requestId: doc.id,
                    ...requestData,
                    sender: { id: senderDoc.id, ...senderDoc.data() }
                };
            });
            const requestsData = await Promise.all(requestsDataPromises);
            setRequests(requestsData);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [currentUser, db]);

    const handleAcceptRequest = async (requestId, senderId) => {
        const batch = writeBatch(db);

        const currentUserRef = doc(db, 'users', currentUser.uid);
        batch.update(currentUserRef, { friends: [...(friends.map(f => f.id)), senderId] });
        
        const senderUserRef = doc(db, 'users', senderId);
        const senderDoc = await getDoc(senderUserRef);
        batch.update(senderUserRef, { friends: [...(senderDoc.data().friends || []), currentUser.uid] });

        const requestRef = doc(db, 'friend_requests', requestId);
        batch.delete(requestRef);
        
        await batch.commit();
    };

    const handleDeclineRequest = async (requestId) => {
        const requestRef = doc(db, 'friend_requests', requestId);
        await deleteDoc(requestRef);
    };

    const handleUnfriend = async (friendId) => {
        if (!window.confirm("Are you sure you want to unfriend this user?")) return;

        const batch = writeBatch(db);

        const currentUserRef = doc(db, 'users', currentUser.uid);
        batch.update(currentUserRef, { friends: friends.map(f => f.id).filter(id => id !== friendId) });
        
        const friendDocRef = doc(db, 'users', friendId);
        const friendDoc = await getDoc(friendDocRef);
        batch.update(friendDocRef, { friends: friendDoc.data().friends.filter(id => id !== currentUser.uid) });

        await batch.commit();
    };

    if (loading && friends.length === 0 && requests.length === 0) {
        return <p>Loading friends...</p>;
    }

    return (
        <Card title="Friends & Requests" className="h-full flex flex-col">
            {/* Tabs */}
            <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4">
                <button onClick={() => setActiveTab('friends')} className={`py-2 px-4 font-semibold flex items-center gap-2 ${activeTab === 'friends' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}>
                    <Users size={18} /> My Friends ({friends.length})
                </button>
                <button onClick={() => setActiveTab('requests')} className={`py-2 px-4 font-semibold flex items-center gap-2 relative ${activeTab === 'requests' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}>
                    <UserPlus size={18} /> Friend Requests 
                    {requests.length > 0 && <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">{requests.length}</span>}
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {activeTab === 'friends' && (
                    <ul className="space-y-3">
                        {friends.length > 0 ? friends.map(friend => (
                            <li key={friend.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <Link to={`/profile/${friend.id}`} className="flex items-center gap-4">
                                    <UserAvatar username={friend.username} />
                                    <span className="font-medium text-gray-800 dark:text-gray-200">{friend.username}</span>
                                </Link>
                                <button onClick={() => handleUnfriend(friend.id)} className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-full">
                                    <UserX size={20}/>
                                </button>
                            </li>
                        )) : <p className="text-center text-gray-500">You have no friends yet. Find users and send friend requests!</p>}
                    </ul>
                )}

                {activeTab === 'requests' && (
                     <ul className="space-y-3">
                        {requests.length > 0 ? requests.map(req => (
                            <li key={req.requestId} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <Link to={`/profile/${req.sender.id}`} className="flex items-center gap-4">
                                    <UserAvatar username={req.sender.username} />
                                    <span className="font-medium text-gray-800 dark:text-gray-200">{req.sender.username}</span>
                                </Link>
                                <div className="flex gap-2">
                                    <button onClick={() => handleAcceptRequest(req.requestId, req.sender.id)} className="p-2 text-green-500 hover:bg-green-100 dark:hover:bg-green-500/20 rounded-full">
                                        <UserCheck size={20}/>
                                    </button>
                                    <button onClick={() => handleDeclineRequest(req.requestId)} className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-full">
                                        <UserX size={20}/>
                                    </button>
                                </div>
                            </li>
                        )) : <p className="text-center text-gray-500">You have no pending friend requests.</p>}
                    </ul>
                )}
            </div>
        </Card>
    );
};

export default FriendsPage;
