import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/FirebaseContext';
import { collection, query, where, onSnapshot, doc, getDoc, writeBatch, deleteDoc, arrayRemove } from 'firebase/firestore';
import Card from '../components/common/Card';
import ConfirmationModal from '../components/common/ConfirmationModal'; // <-- नया मोडल इम्पोर्ट करें
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
    const [activeTab, setActiveTab] = useState('friends');
    const [friends, setFriends] = useState([]);
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    // --- मोडल के लिए नए स्टेट्स ---
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [confirmAction, setConfirmAction] = useState(null);

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
            const requestsDataPromises = snapshot.docs.map(async (requestDoc) => {
                const requestData = requestDoc.data();
                const senderDoc = await getDoc(doc(db, 'users', requestData.from));
                return {
                    requestId: requestDoc.id,
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
    
    // --- कन्फर्मेशन के बाद चलने वाला फाइनल फंक्शन ---
    const handleConfirmAction = async () => {
        if (!confirmAction) return;
        const { type, payload } = confirmAction;

        if (type === 'unfriend') {
            const batch = writeBatch(db);
            // अपनी फ्रेंड लिस्ट से हटाएं
            batch.update(doc(db, 'users', currentUser.uid), { friends: arrayRemove(payload.friendId) });
            // दोस्त की फ्रेंड लिस्ट से खुद को हटाएं
            batch.update(doc(db, 'users', payload.friendId), { friends: arrayRemove(currentUser.uid) });
            await batch.commit();
        }
        
        // मोडल बंद करें और स्टेट रीसेट करें
        setShowConfirmModal(false);
        setConfirmAction(null);
    };

    const handleUnfriendClick = (friend) => {
        setConfirmAction({ type: 'unfriend', payload: { friendId: friend.id, friendName: friend.username } });
        setShowConfirmModal(true);
    };
    
    // ... (बाकी फंक्शन्स जैसे handleAcceptRequest, handleDeclineRequest पहले जैसे ही रहेंगे) ...

    if (loading && friends.length === 0 && requests.length === 0) {
        return <p>Loading friends...</p>;
    }

    return (
        <>
            <Card title="Friends & Requests" className="h-full flex flex-col">
                <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4">
                    <button onClick={() => setActiveTab('friends')} className={`py-2 px-4 font-semibold flex items-center gap-2 ${activeTab === 'friends' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}>
                        <Users size={18} /> My Friends ({friends.length})
                    </button>
                    <button onClick={() => setActiveTab('requests')} className={`py-2 px-4 font-semibold flex items-center gap-2 relative ${activeTab === 'requests' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}>
                        <UserPlus size={18} /> Friend Requests 
                        {requests.length > 0 && <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">{requests.length}</span>}
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {activeTab === 'friends' && (
                        <ul className="space-y-3">
                            {friends.length > 0 ? friends.map(friend => (
                                <li key={friend.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                    <Link to={`/profile/${friend.id}`} className="flex items-center gap-4">
                                        <UserAvatar username={friend.username} />
                                        <span className="font-medium text-gray-800 dark:text-gray-200">{friend.username}</span>
                                    </Link>
                                    <button onClick={() => handleUnfriendClick(friend)} className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-full">
                                        <UserX size={20}/>
                                    </button>
                                </li>
                            )) : <p className="text-center text-gray-500">You have no friends yet.</p>}
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
                                        <button onClick={() => handleAcceptRequest(req.requestId, req.sender.id)} className="p-2 text-green-500 hover:bg-green-100 dark:hover:bg-green-500/20 rounded-full"><UserCheck size={20}/></button>
                                        <button onClick={() => handleDeclineRequest(req.requestId)} className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-full"><UserX size={20}/></button>
                                    </div>
                                </li>
                            )) : <p className="text-center text-gray-500">No pending friend requests.</p>}
                        </ul>
                    )}
                </div>
            </Card>
            
            <ConfirmationModal
                isOpen={showConfirmModal}
                onClose={() => setShowConfirmModal(false)}
                onConfirm={handleConfirmAction}
                title="Confirm Action"
                message={`Are you sure you want to unfriend ${confirmAction?.payload?.friendName}?`}
            />
        </>
    );
};

export default FriendsPage;
