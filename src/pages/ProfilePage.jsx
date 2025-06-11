import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { signOut, EmailAuthProvider, reauthenticateWithCredential, deleteUser } from 'firebase/auth';
import { doc, onSnapshot, updateDoc, deleteDoc, serverTimestamp, setDoc, getDoc, query, where, getDocs, writeBatch, arrayUnion, arrayRemove } from 'firebase/firestore';
import { useAuth } from '../contexts/FirebaseContext';
import Card from '../components/common/Card';
import ThemedButton from '../components/common/ThemedButton';
import CustomAlert from '../components/common/CustomAlert';
import { LogOut, User, Mail, BookOpen, Globe, Trash2, Save, EyeOff, UserPlus, UserCheck, UserX } from 'lucide-react';
import { differenceInDays } from 'date-fns';

// देशों की सूची, उनके कोड और फ्लैग के साथ
const countriesData = [
    { name: 'India', code: 'IN', flag: '🇮🇳' },
    { name: 'USA', code: 'US', flag: '🇺🇸' },
    { name: 'Canada', code: 'CA', flag: '🇨🇦' },
    { name: 'United Kingdom', code: 'GB', flag: '🇬🇧' },
    { name: 'Australia', code: 'AU', flag: '🇦🇺' },
    { name: 'Germany', code: 'DE', flag: '🇩🇪' },
    { name: 'Japan', code: 'JP', flag: '🇯🇵' },
    { name: 'Other', code: 'OT', flag: '🏳️' }
];

const ProfileSkeleton = () => (
    <div className="animate-pulse">
        <div className="flex flex-col items-center space-y-4 mb-8">
            <div className="w-24 h-24 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
            <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded-md w-48"></div>
            <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded-md w-64"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-14 bg-gray-300 dark:bg-gray-700 rounded-lg"></div>
            <div className="h-14 bg-gray-300 dark:bg-gray-700 rounded-lg"></div>
            <div className="md:col-span-2 h-24 bg-gray-300 dark:bg-gray-700 rounded-lg"></div>
        </div>
    </div>
);

const ProfilePage = () => {
    const { userId } = useParams();
    const { auth, db, currentUser } = useAuth();
    const navigate = useNavigate();

    const [profileData, setProfileData] = useState(null);
    const [editableProfileData, setEditableProfileData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isOwnProfile, setIsOwnProfile] = useState(false);
    const [friendshipStatus, setFriendshipStatus] = useState('loading');
    const [friendRequestDocId, setFriendRequestDocId] = useState(null);

    // अलर्ट और मोडल के स्टेट्स
    const [showAlert, setShowAlert] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [passwordForDelete, setPasswordForDelete] = useState('');
    const [deleteError, setDeleteError] = useState('');

    useEffect(() => {
        if (!userId || !db || !currentUser) {
            setIsLoading(false);
            return;
        };

        const ownProfileCheck = currentUser.uid === userId;
        setIsOwnProfile(ownProfileCheck);

        // प्रोफाइल डेटा लाना
        const userDocRef = doc(db, 'users', userId);
        const unsubscribeProfile = onSnapshot(userDocRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setProfileData({ ...data, uid: docSnap.id });
                if(ownProfileCheck) {
                    setEditableProfileData({ ...data, uid: docSnap.id });
                }
            } else {
                setProfileData(null);
            }
            setIsLoading(false);
        });

        // दोस्ती की स्थिति जांचना
        if (!ownProfileCheck) {
            const checkFriendship = async () => {
                const currentUserDoc = await getDoc(doc(db, 'users', currentUser.uid));
                const friends = currentUserDoc.data()?.friends || [];
                
                if (friends.includes(userId)) {
                    setFriendshipStatus('friends');
                    return;
                }

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
    }, [userId, currentUser, db]);
    
    // --- फ्रेंड रिक्वेस्ट के फंक्शन्स ---
    const handleSendFriendRequest = async () => { /* ... */ };
    const handleAcceptRequest = async () => { /* ... */ };
    const handleRemoveFriendOrCancelRequest = async () => { /* ... */ };
    
    // --- अपनी प्रोफाइल के फंक्शन्स ---
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setEditableProfileData(prev => ({ ...prev, [name]: value }));
    };
    const handleUpdateProfile = async () => { /* ... (जैसा पहले था) ... */ };
    const handleDeactivate = async () => { /* ... (जैसा पहले था) ... */ };
    const handleDeleteAccount = async () => { /* ... (जैसा पहले था) ... */ };
    const handleLogout = async () => { /* ... (जैसा पहले था) ... */ };

    if (isLoading) return <ProfileSkeleton />;
    if (!profileData) return <Card title="Error"><p>User not found.</p></Card>;

    // --- JSX रेंडरिंग ---

    const FriendshipButton = () => { /* ... (जैसा पहले था) ... */ };

    // अगर यह अपनी प्रोफाइल है, तो एडिटेबल व्यू दिखाएं
    if (isOwnProfile) {
        return (
            <>
                <Card>
                    <div className="flex flex-col items-center text-center mb-8">
                        <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center text-4xl font-bold text-gray-500 dark:text-gray-400 mb-4">
                            {editableProfileData.username.charAt(0).toUpperCase()}
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{editableProfileData.username}</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{editableProfileData.email}</p>
                        {editableProfileData.status === 'deactivated' && <p className="mt-2 text-sm font-semibold text-yellow-500">This account is currently deactivated.</p>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"><User size={14} className="mr-2"/>Username</label>
                            <input type="text" name="username" value={editableProfileData.username} onChange={handleInputChange} className="w-full p-3 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600"/>
                        </div>
                        <div className="md:col-span-2">
                            <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">About Me</label>
                            <textarea name="about" value={editableProfileData.about} onChange={handleInputChange} rows="4" className="w-full p-3 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600" placeholder="Tell us something about yourself..."/>
                        </div>
                        <div>
                            <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"><BookOpen size={14} className="mr-2"/>Education Qualification</label>
                            <input type="text" name="education" value={editableProfileData.education} onChange={handleInputChange} className="w-full p-3 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600" placeholder="e.g., B.Tech in Computer Science"/>
                        </div>
                        <div>
                            <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"><Globe size={14} className="mr-2"/>Country</label>
                            <select name="country" value={editableProfileData.country} onChange={handleInputChange} className="w-full p-3 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600">
                                <option value="">Select Country</option>
                                {countriesData.map(c => <option key={c.code} value={c.name}>{c.flag} {c.name}</option>)}
                            </select>
                        </div>
                    </div>
                    <ThemedButton onClick={handleUpdateProfile} className="w-full mt-8" icon={Save}>Save Changes</ThemedButton>
                </>
            </Card>
            <Card title="Account Actions" className="mt-6 border-t-4 border-yellow-500">{/* ...Account actions card...*/}</Card>
            {showAlert && <CustomAlert message={alertMessage} onClose={() => setShowAlert(false)} />}
            {showDeleteModal && ( /* ...Delete modal... */ )}
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
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{profileData.username}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">{profileData.email}</p>
                
                <div className="mt-4 w-full max-w-xs">
                    <FriendshipButton />
                </div>

                <div className="text-left w-full mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 space-y-4">
                    <div>
                        <h4 className="font-semibold text-gray-500 dark:text-gray-400">About Me</h4>
                        <p className="text-gray-700 dark:text-gray-200">{profileData.about || 'Nothing shared yet.'}</p>
                    </div>
                    <div>
                        <h4 className="font-semibold text-gray-500 dark:text-gray-400">Education</h4>
                        <p className="text-gray-700 dark:text-gray-200">{profileData.education || 'Not specified.'}</p>
                    </div>
                    <div>
                        <h4 className="font-semibold text-gray-500 dark:text-gray-400">Country</h4>
                        <p className="text-gray-700 dark:text-gray-200 flex items-center gap-2">
                           {countriesData.find(c => c.name === profileData.country)?.flag} {profileData.country || 'Not specified.'}
                        </p>
                    </div>
                </div>
            </div>
        </Card>
    );
};

export default ProfilePage;
