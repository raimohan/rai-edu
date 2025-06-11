import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { signOut, EmailAuthProvider, reauthenticateWithCredential, deleteUser, updateProfile as updateAuthProfile } from 'firebase/auth';
import { doc, onSnapshot, updateDoc, deleteDoc, serverTimestamp, setDoc, getDoc, query, where, getDocs, writeBatch, arrayUnion, arrayRemove } from 'firebase/firestore';
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-14 bg-gray-300 dark:bg-gray-700 rounded-lg"></div><div className="h-14 bg-gray-300 dark:bg-gray-700 rounded-lg"></div>
            <div className="md:col-span-2 h-24 bg-gray-300 dark:bg-gray-700 rounded-lg"></div>
        </div>
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
        if (!userId || !db || !currentUser) { setIsLoading.false; return; }
        const ownProfileCheck = currentUser.uid === userId;
        setIsOwnProfile(ownProfileCheck);

        const userDocRef = doc(db, 'users', userId);
        const unsubscribeProfile = onSnapshot(userDocRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setProfileData({ ...data, uid: docSnap.id });
                if (ownProfileCheck) setEditableProfileData(data);
            } else { setProfileData(null); }
            setIsLoading(false);
        });

        if (!ownProfileCheck) {
            const checkFriendship = async () => {
                const currentUserDoc = await getDoc(doc(db, 'users', currentUser.uid));
                if (currentUserDoc.data()?.friends?.includes(userId)) {
                    setFriendshipStatus('friends'); return;
                }
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

    const handleSendFriendRequest = async () => { await setDoc(doc(collection(db, 'friend_requests')), { from: currentUser.uid, to: userId, status: 'pending', createdAt: serverTimestamp() }); };
    const handleAcceptRequest = async () => {
        const batch = writeBatch(db);
        batch.update(doc(db, 'users', currentUser.uid), { friends: arrayUnion(userId) });
        batch.update(doc(db, 'users', userId), { friends: arrayUnion(currentUser.uid) });
        batch.delete(doc(db, 'friend_requests', friendRequestDocId));
        await batch.commit();
    };
    const handleRemoveFriendOrCancelRequest = async () => {
        if (friendshipStatus === 'friends') {
            if (!window.confirm("Unfriend user?")) return;
            const batch = writeBatch(db);
            batch.update(doc(db, 'users', currentUser.uid), { friends: arrayRemove(userId) });
            batch.update(doc(db, 'users', userId), { friends: arrayRemove(currentUser.uid) });
            await batch.commit();
        } else { await deleteDoc(doc(db, 'friend_requests', friendRequestDocId)); }
    };
    const handleInputChange = (e) => setEditableProfileData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    const handleUpdateProfile = async () => {
        if (!editableProfileData.username.trim()) { setAlertMessage("Username required."); setShowAlert(true); return; }
        const currentUsername = currentUser.displayName;
        if (!isAdmin && currentUsername !== editableProfileData.username) {
            if (editableProfileData.usernameLastChanged) {
                const daysSince = differenceInDays(new Date(), editableProfileData.usernameLastChanged.toDate());
                if (daysSince < 15) { setAlertMessage(`Can change username in ${15 - daysSince} days.`); setShowAlert(true); return; }
            }
        }
        try {
            const userDocRef = doc(db, 'users', currentUser.uid);
            await updateDoc(userDocRef, {
                username: editableProfileData.username, about: editableProfileData.about,
                education: editableProfileData.education, country: editableProfileData.country,
                ...(currentUsername !== editableProfileData.username && { usernameLastChanged: serverTimestamp() })
            });
            if (currentUsername !== editableProfileData.username) await updateAuthProfile(currentUser, { displayName: editableProfileData.username });
            setAlertMessage("Profile updated!"); setShowAlert(true);
        } catch (e) { setAlertMessage(`Error: ${e.message}`); }
    };
    const handleDeactivate = async () => {
        if (window.confirm("Change account status?")) {
            const newStatus = editableProfileData.status === 'active' ? 'deactivated' : 'active';
            await updateDoc(doc(db, 'users', currentUser.uid), { status: newStatus });
            setAlertMessage(`Account ${newStatus}.`); setShowAlert(true);
        }
    };
    const handleDeleteAccount = async () => {
        if (!passwordForDelete) { setDeleteError("Password needed."); return; }
        setDeleteError('');
        try {
            await reauthenticateWithCredential(currentUser, EmailAuthProvider.credential(currentUser.email, passwordForDelete));
            if (window.confirm("ARE YOU SURE? This is permanent.")) {
                await deleteDoc(doc(db, "users", currentUser.uid));
                await deleteUser(currentUser);
            } else { setShowDeleteModal(false); setPasswordForDelete(''); }
        } catch (e) { setDeleteError("Incorrect password."); }
    };
    const handleLogout = async () => { await signOut(auth); };

    if (isLoading) return <ProfileSkeleton />;
    if (!profileData) return <Card title="Error"><p>User not found.</p></Card>;

    const FriendshipButton = () => {
        if (isOwnProfile) return null;
        switch (friendshipStatus) {
            case 'friends': return <ThemedButton onClick={handleRemoveFriendOrCancelRequest} icon={UserX} className="w-full bg-gray-500">Unfriend</ThemedButton>;
            case 'request_sent': return <ThemedButton onClick={handleRemoveFriendOrCancelRequest} icon={UserX} className="w-full bg-yellow-500">Cancel Request</ThemedButton>;
            case 'request_received': return (<div className="flex gap-4"><ThemedButton onClick={handleAcceptRequest} icon={UserCheck} className="w-full bg-green-500">Accept</ThemedButton><ThemedButton onClick={handleRemoveFriendOrCancelRequest} icon={UserX} className="w-full bg-red-500">Decline</ThemedButton></div>);
            default: return <ThemedButton onClick={handleSendFriendRequest} icon={UserPlus} className="w-full">Add Friend</ThemedButton>;
        }
    };

    if (isOwnProfile && editableProfileData) {
        return (
            <>
                <Card>
                    <div className="flex flex-col items-center text-center mb-8">
                        <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center text-4xl font-bold">{editableProfileData.username.charAt(0).toUpperCase()}</div>
                        <h2 className="text-2xl font-bold mt-4">{editableProfileData.username}</h2>
                        <p className="text-sm text-gray-500">{editableProfileData.email}</p>
                        {editableProfileData.status === 'deactivated' && <p className="mt-2 text-sm font-semibold text-yellow-500">Account Deactivated</p>}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2"><label className="flex items-center text-sm font-medium"><User size={14}/>Username</label><input type="text" name="username" value={editableProfileData.username} onChange={handleInputChange}/></div>
                        <div className="md:col-span-2"><label>About Me</label><textarea name="about" value={editableProfileData.about} onChange={handleInputChange} rows="4"/></div>
                        <div><label><BookOpen size={14}/>Education</label><input type="text" name="education" value={editableProfileData.education} onChange={handleInputChange}/></div>
                        <div><label><Globe size={14}/>Country</label><select name="country" value={editableProfileData.country} onChange={handleInputChange}><option value="">Select</option>{countriesData.map(c => <option key={c.code} value={c.name}>{c.flag} {c.name}</option>)}</select></div>
                    </div>
                    <ThemedButton onClick={handleUpdateProfile} className="w-full mt-8" icon={Save}>Save Changes</ThemedButton>
                </Card>
                <Card title="Account Actions" className="mt-6 border-t-4 border-yellow-500">
                    <div className="space-y-4">
                        <button onClick={handleDeactivate}><EyeOff/>{editableProfileData.status === 'active' ? 'Deactivate' : 'Re-activate'}</button>
                        <button onClick={handleLogout}><LogOut/> Logout</button>
                        <button onClick={() => setShowDeleteModal(true)}><Trash2/> Delete Account</button>
                    </div>
                </Card>
                {showAlert && <CustomAlert message={alertMessage} onClose={() => setShowAlert(false)}/>}
                {showDeleteModal && (
                     <div className="fixed inset-0 bg-black/60 z-50"><div className="bg-white p-6 rounded-2xl">
                        <h3>Delete Account</h3><p>Enter password to confirm.</p>
                        <input type="password" value={passwordForDelete} onChange={(e) => setPasswordForDelete(e.target.value)}/>
                        {deleteError && <p>{deleteError}</p>}
                        <div><button onClick={() => setShowDeleteModal(false)}>Cancel</button><button onClick={handleDeleteAccount}>Confirm & Delete</button></div>
                    </div></div>
                )}
            </>
        );
    }
    
    return (
        <Card>
            <div className="flex flex-col items-center text-center">
                <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center text-4xl font-bold">{profileData.username.charAt(0).toUpperCase()}</div>
                <h2 className="text-2xl font-bold mt-4">{profileData.username}</h2>
                <p className="text-sm text-gray-500">{profileData.email}</p>
                <div className="mt-4 w-full max-w-xs"><FriendshipButton /></div>
                <div className="text-left w-full mt-8 pt-6 border-t space-y-4">
                    <div><h4>About</h4><p>{profileData.about || '...'}</p></div>
                    <div><h4>Education</h4><p>{profileData.education || '...'}</p></div>
                    <div><h4>Country</h4><p>{countriesData.find(c => c.name === profileData.country)?.flag} {profileData.country || '...'}</p></div>
                </div>
            </div>
        </Card>
    );
};

export default ProfilePage;
