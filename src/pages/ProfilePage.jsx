import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { signOut, EmailAuthProvider, reauthenticateWithCredential, deleteUser, updateProfile as updateAuthProfile } from 'firebase/auth';
import { doc, onSnapshot, updateDoc, deleteDoc, serverTimestamp, setDoc, getDoc, query, where, getDocs, writeBatch, arrayUnion, arrayRemove, collection } from 'firebase/firestore';
import { useAuth } from '../contexts/FirebaseContext';
import Card from '../components/common/Card';
import ThemedButton from '../components/common/ThemedButton';
import CustomAlert from '../components/common/CustomAlert';
import { LogOut, User, Mail, BookOpen, Globe, Trash2, Save, EyeOff, UserPlus, UserCheck, UserX } from 'lucide-react';
import { differenceInDays } from 'date-fns';

const countriesData = [
    { name: 'India', code: 'IN', flag: '🇮🇳' }, { name: 'USA', code: 'US', flag: '🇺🇸' },
    { name: 'Canada', code: 'CA', flag: '🇨🇦' }, { name: 'United Kingdom', code: 'GB', flag: '🇬🇧' },
    { name: 'Australia', code: 'AU', flag: '🇦🇺' }, { name: 'Germany', code: 'DE', flag: '🇩🇪' },
    { name: 'Japan', code: 'JP', flag: '🇯🇵' }, { name: 'Other', code: 'OT', flag: '🏳️' }
];

const ProfileSkeleton = () => (
    <div className="animate-pulse">
        <div className="flex flex-col items-center space-y-4 mb-8">
            <div className="w-24 h-24 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
            <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded-md w-48"></div>
            <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded-md w-64"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div className="h-14 bg-gray-300 dark:bg-gray-700 rounded-lg"></div><div className="h-14 bg-gray-300 dark:bg-gray-700 rounded-lg"></div><div className="md:col-span-2 h-24 bg-gray-300 dark:bg-gray-700 rounded-lg"></div></div>
    </div>
);

const ProfilePage = () => {
    const { userId } = useParams();
    const { auth, db, currentUser, isAdmin } = useAuth();
    const [profileData, setProfileData] = useState(null);
    const [editableProfileData, setEditableProfileData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isOwnProfile, setIsOwnProfile] = useState(false);
    const [friendshipStatus, setFriendshipStatus] = useState('loading');
    const [friendRequestDocId, setFriendRequestDocId] = useState(null);
    const [showAlert, setShowAlert] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [passwordForDelete, setPasswordForDelete] = useState('');
    const [deleteError, setDeleteError] = useState('');

    useEffect(() => {
        if (!userId || !db || !currentUser) {
            setIsLoading(false);
            return;
        }

        const ownProfileCheck = currentUser.uid === userId;
        setIsOwnProfile(ownProfileCheck);

        const userDocRef = doc(db, 'users', userId);
        const unsubscribeProfile = onSnapshot(userDocRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setProfileData({ ...data, uid: docSnap.id });
                if (ownProfileCheck) {
                    setEditableProfileData(data);
                }
            } else {
                setProfileData(null);
            }
            setIsLoading(false);
        });

        if (!ownProfileCheck) {
            const checkFriendship = async () => {
                const currentUserDoc = await getDoc(doc(db, 'users', currentUser.uid));
                const friends = currentUserDoc.data()?.friends || [];
                if (friends.includes(userId)) { setFriendshipStatus('friends'); return; }
                const requestsRef = collection(db, 'friend_requests');
                const q1 = query(requestsRef, where('from', '==', currentUser.uid), where('to', '==', userId), where('status', '==', 'pending'));
                const q2 = query(requestsRef, where('from', '==', userId), where('to', '==', currentUser.uid), where('status', '==', 'pending'));
                const [sent, received] = await Promise.all([getDocs(q1), getDocs(q2)]);
                if (!sent.empty) { setFriendshipStatus('request_sent'); setFriendRequestDocId(sent.docs[0].id); }
                else if (!received.empty) { setFriendshipStatus('request_received'); setFriendRequestDocId(received.docs[0].id); }
                else { setFriendshipStatus('not_friends'); }
            };
            checkFriendship();
        }
        return () => unsubscribeProfile();
    }, [userId, currentUser, db]);

    const handleSendFriendRequest = async () => {
        const newRequestRef = await addDoc(collection(db, 'friend_requests'), { from: currentUser.uid, to: userId, status: 'pending', createdAt: serverTimestamp() });
        setFriendshipStatus('request_sent');
        setFriendRequestDocId(newRequestRef.id);
    };
    const handleAcceptRequest = async () => {
        const batch = writeBatch(db);
        batch.update(doc(db, 'users', currentUser.uid), { friends: arrayUnion(userId) });
        batch.update(doc(db, 'users', userId), { friends: arrayUnion(currentUser.uid) });
        batch.delete(doc(db, 'friend_requests', friendRequestDocId));
        await batch.commit();
        setFriendshipStatus('friends');
    };
    const handleRemoveFriendOrCancelRequest = async () => {
        if (friendshipStatus === 'friends') {
            if (!window.confirm("Are you sure you want to unfriend?")) return;
            const batch = writeBatch(db);
            batch.update(doc(db, 'users', currentUser.uid), { friends: arrayRemove(userId) });
            batch.update(doc(db, 'users', userId), { friends: arrayRemove(currentUser.uid) });
            await batch.commit();
        } else if (friendRequestDocId) {
            await deleteDoc(doc(db, 'friend_requests', friendRequestDocId));
        }
        setFriendshipStatus('not_friends');
    };
    const handleInputChange = (e) => setEditableProfileData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    const handleUpdateProfile = async () => {
        if (!editableProfileData.username.trim()) { setAlertMessage("Username cannot be empty."); setShowAlert(true); return; }
        const currentUsername = currentUser.displayName;
        if (!isAdmin && currentUsername !== editableProfileData.username) {
            if (editableProfileData.usernameLastChanged) {
                const daysSince = differenceInDays(new Date(), editableProfileData.usernameLastChanged.toDate());
                if (daysSince < 15) { setAlertMessage(`You can change your username again in ${15 - daysSince} days.`); setShowAlert(true); return; }
            }
        }
        try {
            const userDocRef = doc(db, 'users', currentUser.uid);
            await updateDoc(userDocRef, {
                username: editableProfileData.username, about: editableProfileData.about,
                education: editableProfileData.education, country: editableProfileData.country,
                ...(currentUsername !== editableProfileData.username && { usernameLastChanged: serverTimestamp() })
            });
            if (currentUsername !== editableProfileData.username) {
                await updateAuthProfile(currentUser, { displayName: editableProfileData.username });
            }
            setAlertMessage("Profile updated successfully!"); setShowAlert(true);
        } catch (e) { setAlertMessage(`Error: ${e.message}`); }
    };
    const handleDeactivate = async () => {
        if (window.confirm("Are you sure you want to change your account status?")) {
            const newStatus = editableProfileData.status === 'active' ? 'deactivated' : 'active';
            await updateDoc(doc(db, 'users', currentUser.uid), { status: newStatus });
            setAlertMessage(`Account has been ${newStatus}.`); setShowAlert(true);
        }
    };
    const handleDeleteAccount = async () => {
        if (!passwordForDelete) { setDeleteError("Password is required."); return; }
        setDeleteError('');
        try {
            const credential = EmailAuthProvider.credential(currentUser.email, passwordForDelete);
            await reauthenticateWithCredential(currentUser, credential);
            if (window.confirm("ARE YOU ABSOLUTELY SURE? This is permanent.")) {
                await deleteDoc(doc(db, "users", currentUser.uid));
                await deleteUser(currentUser);
            } else { setShowDeleteModal(false); setPasswordForDelete(''); }
        } catch (e) { setDeleteError("Incorrect password or error deleting account."); }
    };
    const handleLogout = async () => { await signOut(auth); };

    if (isLoading) return <ProfileSkeleton />;
    if (!profileData) return <Card title="Error"><p className="text-center">User not found.</p></Card>;

    const FriendshipButton = () => {
        if (isOwnProfile) return null;
        switch (friendshipStatus) {
            case 'friends': return <ThemedButton onClick={handleRemoveFriendOrCancelRequest} icon={UserX} className="w-full bg-gray-500">Unfriend</ThemedButton>;
            case 'request_sent': return <ThemedButton onClick={handleRemoveFriendOrCancelRequest} icon={UserX} className="w-full bg-yellow-500">Cancel Request</ThemedButton>;
            case 'request_received': return (<div className="flex gap-4"><ThemedButton onClick={handleAcceptRequest} icon={UserCheck} className="w-full bg-green-500">Accept</ThemedButton><ThemedButton onClick={handleRemoveFriendOrCancelRequest} icon={UserX} className="w-full bg-red-500">Decline</ThemedButton></div>);
            default: return <ThemedButton onClick={handleSendFriendRequest} icon={UserPlus} className="w-full">Add Friend</ThemedButton>;
        }
    };

    if (isOwnProfile) {
        if (!editableProfileData) return <ProfileSkeleton />; // सुरक्षा जांच
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
                        <div className="md:col-span-2"><label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"><User size={14} className="mr-2"/>Username</label><input type="text" name="username" value={editableProfileData.username} onChange={handleInputChange} className="w-full p-3 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600"/></div>
                        <div className="md:col-span-2"><label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">About Me</label><textarea name="about" value={editableProfileData.about} onChange={handleInputChange} rows="4" className="w-full p-3 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600" placeholder="Tell us something about yourself..."/></div>
                        <div><label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"><BookOpen size={14} className="mr-2"/>Education</label><input type="text" name="education" value={editableProfileData.education} onChange={handleInputChange} className="w-full p-3 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600" placeholder="e.g., B.Tech"/></div>
                        <div><label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"><Globe size={14} className="mr-2"/>Country</label><select name="country" value={editableProfileData.country} onChange={handleInputChange} className="w-full p-3 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600"><option value="">Select Country</option>{countriesData.map(c => <option key={c.code} value={c.name}>{c.flag} {c.name}</option>)}</select></div>
                    </div>
                    <ThemedButton onClick={handleUpdateProfile} className="w-full mt-8" icon={Save}>Save Changes</ThemedButton>
                </Card>
                <Card title="Account Actions" className="mt-6 border-t-4 border-yellow-500">
                     <div className="space-y-4">
                        <p className="text-sm text-gray-600 dark:text-gray-400">Manage your account or log out from here.</p>
                        <button onClick={handleDeactivate} className={`w-full flex justify-center items-center gap-2 text-white font-semibold py-2 px-4 rounded-lg transition-colors ${editableProfileData.status === 'active' ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-green-500 hover:bg-green-600'}`}><EyeOff size={18}/> {editableProfileData.status === 'active' ? 'Deactivate Account' : 'Re-activate Account'}</button>
                        <button onClick={handleLogout} className="w-full flex justify-center items-center gap-2 text-white font-semibold py-2 px-4 rounded-lg bg-blue-500 hover:bg-blue-600 transition-colors"><LogOut size={18}/> Logout</button>
                        <button onClick={() => setShowDeleteModal(true)} className="w-full flex justify-center items-center gap-2 text-red-600 font-semibold py-2 px-4 rounded-lg bg-transparent border border-red-600 hover:bg-red-600 hover:text-white transition-colors"><Trash2 size={18}/> Delete Account Permanently</button>
                    </div>
                </Card>
                {showAlert && <CustomAlert message={alertMessage} onClose={() => setShowAlert(false)} />}
                {showDeleteModal && (
                     <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-2xl max-w-sm w-full">
                            <h3 className="text-xl font-semibold text-red-500 mb-4">Delete Account</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">To confirm, please enter your password.</p>
                            <input type="password" value={passwordForDelete} onChange={(e) => setPasswordForDelete(e.target.value)} placeholder="Enter password" className="w-full p-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600" />
                            {deleteError && <p className="text-red-500 text-xs mt-2">{deleteError}</p>}
                            <div className="flex justify-end space-x-3 mt-6">
                                <button onClick={() => setShowDeleteModal(false)} className="px-5 py-2 rounded-lg text-gray-700 border dark:text-gray-300">Cancel</button>
                                <button onClick={handleDeleteAccount} className="px-5 py-2 rounded-lg bg-red-600 text-white">Confirm & Delete</button>
                            </div>
                        </div>
                    </div>
                )}
            </>
        );
    }
    
    return (
        <Card>
            <div className="flex flex-col items-center text-center">
                <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center text-4xl font-bold">{profileData.username.charAt(0).toUpperCase()}</div>
                <h2 className="text-2xl font-bold mt-4">{profileData.username}</h2>
                <p className="text-sm text-gray-500">{profileData.email}</p>
                <div className="mt-4 w-full max-w-xs"><FriendshipButton /></div>
                <div className="text-left w-full mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 space-y-4">
                    <div><h4 className="font-semibold text-gray-500 dark:text-gray-400">About Me</h4><p className="text-gray-700 dark:text-gray-200">{profileData.about || 'Not specified.'}</p></div>
                    <div><h4 className="font-semibold text-gray-500 dark:text-gray-400">Education</h4><p className="text-gray-700 dark:text-gray-200">{profileData.education || 'Not specified.'}</p></div>
                    <div><h4 className="font-semibold text-gray-500 dark:text-gray-400">Country</h4><p className="flex items-center gap-2 text-gray-700 dark:text-gray-200">{countriesData.find(c => c.name === profileData.country)?.flag} {profileData.country || 'Not specified.'}</p></div>
                </div>
            </div>
        </Card>
    );
};

export default ProfilePage;
