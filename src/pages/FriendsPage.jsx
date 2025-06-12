import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/FirebaseContext';
import { collection, query, where, onSnapshot, doc, getDoc, setDoc, writeBatch, deleteDoc, arrayRemove, arrayUnion, serverTimestamp } from 'firebase/firestore';
import Card from '../components/common/Card';
import ConfirmationModal from '../components/common/ConfirmationModal';
import LoadingAnimation from '../components/common/LoadingAnimation'; // <<< Make sure this path is correct
import { Users, UserPlus, UserCheck, UserX, MessageSquare } from 'lucide-react';

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
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('friends');
    const [friends, setFriends] = useState([]);
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true); // Initial loading state set to true
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [confirmAction, setConfirmAction] = useState(null);

    // Fetching Friends List
    useEffect(() => {
        if (!currentUser || !db) {
            setLoading(false); // Stop loading if no user or db
            return;
        }

        setLoading(true); // Set loading to true when starting to fetch friends/requests
        const userDocRef = doc(db, 'users', currentUser.uid);

        const unsubscribeFriends = onSnapshot(userDocRef, async (docSnap) => {
            const friendIds = docSnap.data()?.friends || [];
            if (friendIds.length > 0) {
                // Fetch friend details only if there are friendIds
                const friendPromises = friendIds.map(id => getDoc(doc(db, 'users', id)));
                const friendDocs = await Promise.all(friendPromises);
                const friendsData = friendDocs.map(doc => ({ id: doc.id, ...doc.data() }));
                setFriends(friendsData);
            } else {
                setFriends([]);
            }
            // We set loading to false AFTER both friends and requests are fetched in their respective effects
            // For now, let's keep it separate or use a combined loading state.
        }, (error) => {
            console.error("Error fetching friends list:", error);
            setLoading(false); // Stop loading on error
        });

        // Cleanup listener
        return () => unsubscribeFriends();
    }, [currentUser, db]);

    // Fetching Friend Requests
    useEffect(() => {
        if (!currentUser || !db) {
            // Loading handled by the friend list effect or initial state
            return;
        }

        const requestsRef = collection(db, 'friend_requests');
        const q = query(requestsRef, where('to', '==', currentUser.uid), where('status', '==', 'pending'));

        const unsubscribeRequests = onSnapshot(q, async (snapshot) => {
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
            setLoading(false); // Set loading to false once requests are also fetched
        }, (error) => {
            console.error("Error fetching friend requests:", error);
            setLoading(false); // Stop loading on error
        });

        // Cleanup listener
        return () => unsubscribeRequests();
    }, [currentUser, db]);

    // Start Chat
    const handleStartChat = async (friendId) => {
        if (!currentUser || !db) return;
        const chatId = [currentUser.uid, friendId].sort().join('_');
        const chatRef = doc(db, 'chats', chatId);
        try {
            const chatSnap = await getDoc(chatRef);
            if (!chatSnap.exists()) {
                await setDoc(chatRef, {
                    participants: [currentUser.uid, friendId],
                    createdAt: serverTimestamp(),
                    lastMessage: null,
                });
            }
            navigate(`/chat/${chatId}`);
        } catch (error) {
            console.error("Error creating or navigating to chat:", error);
        }
    };

    // Confirm Action (Unfriend)
    const handleConfirmAction = async () => {
        if (!confirmAction || !db || !currentUser) return;
        const { type, payload } = confirmAction;

        if (type === 'unfriend') {
            const batch = writeBatch(db);
            // Remove from current user's friends list
            batch.update(doc(db, 'users', currentUser.uid), { friends: arrayRemove(payload.friendId) });
            // Remove from friend's friends list
            batch.update(doc(db, 'users', payload.friendId), { friends: arrayRemove(currentUser.uid) });
            await batch.commit();
            console.log(`Unfriended ${payload.friendName}`);
        }
        setShowConfirmModal(false);
        setConfirmAction(null);
    };

    const handleUnfriendClick = (friend) => {
        setConfirmAction({ type: 'unfriend', payload: { friendId: friend.id, friendName: friend.username } });
        setShowConfirmModal(true);
    };

    // Accept Request
    const handleAcceptRequest = async (requestId, senderId) => {
        if (!db || !currentUser) return;
        const batch = writeBatch(db);

        // Add to current user's friends list
        batch.update(doc(db, 'users', currentUser.uid), { friends: arrayUnion(senderId) });
        // Add to sender's friends list
        batch.update(doc(db, 'users', senderId), { friends: arrayUnion(currentUser.uid) });
        // Delete the friend request
        batch.delete(doc(db, 'friend_requests', requestId));
        await batch.commit();
        console.log(`Accepted request from ${senderId}`);
    };

    // Decline Request
    const handleDeclineRequest = async (requestId) => {
        if (!db) return;
        await deleteDoc(doc(db, 'friend_requests', requestId));
        console.log(`Declined request: ${requestId}`);
    };

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
                    {loading ? (
                        // Display LoadingAnimation when loading is true
                        <div className="flex flex-col items-center justify-center h-full min-h-[200px]">
                            <LoadingAnimation />
                            <p className="mt-3 text-gray-600 dark:text-gray-400">Loading friends and requests...</p>
                        </div>
                    ) : (
                        <>
                            {activeTab === 'friends' && (
                                <ul className="space-y-3">
                                    {friends.length > 0 ? friends.map(friend => (
                                        <li key={friend.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                            <Link to={`/profile/${friend.id}`} className="flex items-center gap-4 flex-1">
                                                <UserAvatar username={friend.username} />
                                                <span className="font-medium text-gray-800 dark:text-gray-200">{friend.username}</span>
                                            </Link>
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => handleStartChat(friend.id)} className="p-2 text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-500/20 rounded-full" title="Start Chat">
                                                    <MessageSquare size={20}/>
                                                </button>
                                                <button onClick={() => handleUnfriendClick(friend)} className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-full" title="Unfriend">
                                                    <UserX size={20}/>
                                                </button>
                                            </div>
                                        </li>
                                    )) : <p className="text-center text-gray-500 p-8">You have no friends yet.</p>}
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
                                    )) : <p className="text-center text-gray-500 p-8">No pending friend requests.</p>}
                                </ul>
                            )}
                        </>
                    )}
                </div>
            </Card>
            <ConfirmationModal
                isOpen={showConfirmModal}
                onClose={() => setShowConfirmModal(false)}
                onConfirm={handleConfirmAction}
                title="Unfriend User"
                message={`Are you sure you want to unfriend ${confirmAction?.payload?.friendName}?`}
            />
        </>
    );
};

export default FriendsPage;
    
