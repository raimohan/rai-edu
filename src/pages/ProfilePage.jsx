import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom'; // useParams इम्पोर्ट करें
import { signOut, EmailAuthProvider, reauthenticateWithCredential, deleteUser } from 'firebase/auth';
import { doc, onSnapshot, updateDoc, deleteDoc, serverTimestamp, setDoc, getDoc, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { useAuth } from '../contexts/FirebaseContext';
import Card from '../components/common/Card';
import ThemedButton from '../components/common/ThemedButton';
import { LogOut, User, Mail, BookOpen, Globe, Trash2, Save, EyeOff, UserPlus, UserCheck, UserX } from 'lucide-react';
import { differenceInDays } from 'date-fns';

// ... (ProfileSkeleton और countriesData पहले जैसा ही रहेगा) ...

const ProfilePage = () => {
    const { userId } = useParams(); // URL से यूजर ID प्राप्त करें
    const { auth, db, currentUser } = useAuth();
    const navigate = useNavigate();

    const [profileData, setProfileData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isOwnProfile, setIsOwnProfile] = useState(false);
    const [friendshipStatus, setFriendshipStatus] = useState('loading'); // 'not_friends', 'request_sent', 'request_received', 'friends'
    const [friendRequestDocId, setFriendRequestDocId] = useState(null);

    // प्रोफाइल डेटा और दोस्ती की स्थिति को लोड करना
    useEffect(() => {
        if (!userId || !db) return;

        // यह तय करें कि यह अपनी प्रोफाइल है या किसी और की
        const ownProfile = currentUser?.uid === userId;
        setIsOwnProfile(ownProfile);

        // प्रोफाइल डेटा लाना
        const userDocRef = doc(db, 'users', userId);
        const unsubscribeProfile = onSnapshot(userDocRef, (docSnap) => {
            if (docSnap.exists()) {
                setProfileData({ ...docSnap.data(), uid: docSnap.id });
            } else {
                console.log("No such user!");
                setProfileData(null);
            }
            setIsLoading(false);
        });

        // दोस्ती की स्थिति जांचना (अगर यह किसी और की प्रोफाइल है)
        if (!ownProfile && currentUser) {
            const checkFriendship = async () => {
                // क्या वे पहले से दोस्त हैं?
                const currentUserDoc = await getDoc(doc(db, 'users', currentUser.uid));
                if (currentUserDoc.data()?.friends?.includes(userId)) {
                    setFriendshipStatus('friends');
                    return;
                }

                // क्या कोई फ्रेंड रिक्वेस्ट मौजूद है?
                const requestsRef = collection(db, 'friend_requests');
                const q1 = query(requestsRef, where('from', '==', currentUser.uid), where('to', '==', userId));
                const q2 = query(requestsRef, where('from', '==', userId), where('to', '==', currentUser.uid));

                const [sentSnapshot, receivedSnapshot] = await Promise.all([getDocs(q1), getDocs(q2)]);

                if (!sentSnapshot.empty) {
                    setFriendshipStatus('request_sent');
                    setFriendRequestDocId(sentSnapshot.docs[0].id);
                } else if (!receivedSnapshot.empty) {
                    setFriendshipStatus('request_received');
                    setFriendRequestDocId(receivedSnapshot.docs[0].id);
                } else {
                    setFriendshipStatus('not_friends');
                }
            };
            checkFriendship();
        }

        return () => unsubscribeProfile();
    }, [userId, currentUser, db, isOwnProfile]);


    // फ्रेंड रिक्वेस्ट भेजने का फंक्शन
    const handleSendFriendRequest = async () => {
        if (!isOwnProfile) {
            await setDoc(doc(collection(db, 'friend_requests')), {
                from: currentUser.uid,
                to: userId,
                status: 'pending',
                createdAt: serverTimestamp()
            });
            setFriendshipStatus('request_sent');
        }
    };

    // रिक्वेस्ट स्वीकार करने का फंक्शन
    const handleAcceptRequest = async () => {
        const batch = writeBatch(db);

        // दोनों यूजर्स के 'friends' ऐरे को अपडेट करें
        const currentUserRef = doc(db, 'users', currentUser.uid);
        batch.update(currentUserRef, { friends: [...(currentUser.friends || []), userId] });
        
        const otherUserRef = doc(db, 'users', userId);
        batch.update(otherUserRef, { friends: [...(profileData.friends || []), currentUser.uid] });

        // फ्रेंड रिक्वेस्ट को डिलीट करें
        const requestRef = doc(db, 'friend_requests', friendRequestDocId);
        batch.delete(requestRef);
        
        await batch.commit();
        setFriendshipStatus('friends');
    };

    // दोस्त को हटाने या रिक्वेस्ट कैंसिल करने का फंक्शन
    const handleRemoveFriendOrCancelRequest = async () => {
        if (friendshipStatus === 'friends') {
            if (!window.confirm("Are you sure you want to unfriend this user?")) return;
            
            const batch = writeBatch(db);
            const currentUserRef = doc(db, 'users', currentUser.uid);
            batch.update(currentUserRef, { friends: currentUser.friends.filter(id => id !== userId) });

            const otherUserRef = doc(db, 'users', userId);
            batch.update(otherUserRef, { friends: profileData.friends.filter(id => id !== currentUser.uid) });

            await batch.commit();
            setFriendshipStatus('not_friends');

        } else if (friendshipStatus === 'request_sent' || friendshipStatus === 'request_received') {
            const requestRef = doc(db, 'friend_requests', friendRequestDocId);
            await deleteDoc(requestRef);
            setFriendshipStatus('not_friends');
        }
    };

    // ... (बाकी सभी पुराने फंक्शन जैसे handleUpdateProfile, handleDeleteAccount, आदि यहाँ रहेंगे) ...
    // ... (उनमें कोई बदलाव नहीं) ...


    // UI रेंडरिंग
    if (isLoading) return <div className="flex justify-center items-center h-full"><p>Loading Profile...</p></div>;
    if (!profileData) return <div className="flex justify-center items-center h-full"><p>User not found.</p></div>;
    
    // फ्रेंड रिक्वेस्ट बटन का JSX
    const FriendshipButton = () => {
        if (isOwnProfile) return null;

        switch (friendshipStatus) {
            case 'friends':
                return <ThemedButton onClick={handleRemoveFriendOrCancelRequest} icon={UserX} className="w-full bg-gray-500 hover:bg-gray-600">Unfriend</ThemedButton>;
            case 'request_sent':
                return <ThemedButton onClick={handleRemoveFriendOrCancelRequest} icon={UserX} className="w-full bg-yellow-500 hover:bg-yellow-600">Cancel Request</ThemedButton>;
            case 'request_received':
                return (
                    <div className="flex gap-4">
                        <ThemedButton onClick={handleAcceptRequest} icon={UserCheck} className="w-full bg-green-500 hover:bg-green-600">Accept</ThemedButton>
                        <ThemedButton onClick={handleRemoveFriendOrCancelRequest} icon={UserX} className="w-full bg-red-500 hover:bg-red-600">Decline</ThemedButton>
                    </div>
                );
            default: // not_friends
                return <ThemedButton onClick={handleSendFriendRequest} icon={UserPlus} className="w-full">Add Friend</ThemedButton>;
        }
    };
    
    // अगर यह अपनी प्रोफाइल है, तो पुराना वाला एडिटेबल UI दिखाएं
    if (isOwnProfile) {
        return (
            <>
                {/* ... (आपका पुराना प्रोफाइल एडिट वाला पूरा JSX कोड यहाँ आएगा) ... */}
                {/* ... (जिसमें Username, About Me, Education, Country के इनपुट फील्ड्स थे) ... */}
            </>
        );
    }
    
    // अगर यह किसी और की प्रोफाइल है, तो पब्लिक व्यू दिखाएं
    return (
        <Card>
            <div className="flex flex-col items-center text-center">
                <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center text-4xl font-bold text-gray-500 mb-4">
                    {profileData.username.charAt(0).toUpperCase()}
                </div>
                <h2 className="text-2xl font-bold text-gray-800">{profileData.username}</h2>
                <p className="text-sm text-gray-500">{profileData.email}</p>
                <div className="mt-4 w-full">
                    <FriendshipButton />
                </div>
                <div className="text-left w-full mt-6 space-y-4">
                    <div>
                        <h4 className="font-semibold">About Me</h4>
                        <p className="text-gray-600">{profileData.about || 'Nothing to show.'}</p>
                    </div>
                    <div>
                        <h4 className="font-semibold">Education</h4>
                        <p className="text-gray-600">{profileData.education || 'Not specified.'}</p>
                    </div>
                    <div>
                        <h4 className="font-semibold">Country</h4>
                        <p className="text-gray-600">{profileData.country || 'Not specified.'}</p>
                    </div>
                </div>
            </div>
        </Card>
    );
};

export default ProfilePage;
