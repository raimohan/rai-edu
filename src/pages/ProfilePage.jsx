import React, { useState, useEffect } from 'react';
import { signOut, EmailAuthProvider, reauthenticateWithCredential, deleteUser } from 'firebase/auth';
import { doc, onSnapshot, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../contexts/FirebaseContext';
import Card from '../components/common/Card';
import ThemedButton from '../components/common/ThemedButton';
import CustomAlert from '../components/common/CustomAlert';
import { LogOut, User, Mail, BookOpen, Globe, Trash2, Save, EyeOff } from 'lucide-react';
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
            <div className="h-14 bg-gray-300 dark:bg-gray-700 rounded-lg"></div>
            <div className="h-14 bg-gray-300 dark:bg-gray-700 rounded-lg"></div>
        </div>
    </div>
);

const ProfilePage = () => {
    const { auth, db, currentUser } = useAuth();
    const [profileData, setProfileData] = useState({ username: '', email: '', about: '', education: '', country: '', usernameLastChanged: null, status: 'active' });
    const [isLoading, setIsLoading] = useState(true);
    const [showAlert, setShowAlert] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [passwordForDelete, setPasswordForDelete] = useState('');
    const [deleteError, setDeleteError] = useState('');

    useEffect(() => {
        if (currentUser && db) {
            const userDocRef = doc(db, 'users', currentUser.uid);
            const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
                if (docSnap.exists()) {
                    const userData = docSnap.data();
                    setProfileData({
                        username: userData.username || currentUser.displayName || '',
                        email: userData.email || currentUser.email || '',
                        about: userData.about || '',
                        education: userData.education || '',
                        country: userData.country || '',
                        usernameLastChanged: userData.usernameLastChanged || null,
                        status: userData.status || 'active',
                    });
                }
                setIsLoading(false);
            });
            return () => unsubscribe();
        } else if (!currentUser) {
            setIsLoading(false);
        }
    }, [currentUser, db]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setProfileData(prev => ({ ...prev, [name]: value }));
    };

    const handleUpdateProfile = async () => {
        if (!profileData.username.trim()) {
            setAlertMessage("Username cannot be empty.");
            setShowAlert(true);
            return;
        }
        if (!currentUser || !db) return;

        // 15-दिन का नेम चेंज लॉक लॉजिक
        if (profileData.usernameLastChanged) {
            const lastChangedDate = profileData.usernameLastChanged.toDate();
            const daysSinceLastChange = differenceInDays(new Date(), lastChangedDate);
            if (daysSinceLastChange < 15) {
                setAlertMessage(`You can change your username again in ${15 - daysSinceLastChange} days.`);
                setShowAlert(true);
                return;
            }
        }

        try {
            const userDocRef = doc(db, 'users', currentUser.uid);
            await updateDoc(userDocRef, {
                username: profileData.username,
                about: profileData.about,
                education: profileData.education,
                country: profileData.country,
                usernameLastChanged: serverTimestamp() // तारीख अपडेट करें
            });
            setAlertMessage("Profile updated successfully!");
            setShowAlert(true);
        } catch (error) {
            setAlertMessage(`Error: ${error.message}`);
            setShowAlert(true);
        }
    };

    const handleDeactivate = async () => {
        if (window.confirm("Are you sure you want to deactivate your account? Your profile will be hidden from others.")) {
            const newStatus = profileData.status === 'active' ? 'deactivated' : 'active';
            const userDocRef = doc(db, 'users', currentUser.uid);
            await updateDoc(userDocRef, { status: newStatus });
            setAlertMessage(`Account has been ${newStatus}.`);
            setShowAlert(true);
        }
    };

    const handleDeleteAccount = async () => { /* ... (Same as before) ... */ };
    const handleLogout = async () => { /* ... (Same as before) ... */ };

    const firstLetter = profileData.username ? profileData.username.charAt(0).toUpperCase() : (currentUser?.email?.charAt(0).toUpperCase() || 'U');
    
    return (
        <>
            <Card>
                {isLoading ? <ProfileSkeleton /> : (
                    <>
                        <div className="flex flex-col items-center text-center mb-8">
                            <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center text-4xl font-bold text-gray-500 dark:text-gray-400 mb-4">
                                {firstLetter}
                            </div>
                            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{profileData.username}</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{profileData.email}</p>
                            {profileData.status === 'deactivated' && <p className="mt-2 text-sm font-semibold text-yellow-500">This account is currently deactivated.</p>}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"><User size={14} className="mr-2"/>Username</label>
                                <input type="text" name="username" value={profileData.username} onChange={handleInputChange} className="w-full p-3 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600"/>
                            </div>
                            <div className="md:col-span-2">
                                <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">About Me</label>
                                <textarea name="about" value={profileData.about} onChange={handleInputChange} rows="4" className="w-full p-3 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600" placeholder="Tell us something about yourself..."/>
                            </div>
                             <div>
                                <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"><BookOpen size={14} className="mr-2"/>Education Qualification</label>
                                <input type="text" name="education" value={profileData.education} onChange={handleInputChange} className="w-full p-3 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600" placeholder="e.g., B.Tech in Computer Science"/>
                            </div>
                            <div>
                                <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"><Globe size={14} className="mr-2"/>Country</label>
                                <select name="country" value={profileData.country} onChange={handleInputChange} className="w-full p-3 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600">
                                    <option value="">Select Country</option>
                                    {countriesData.map(c => <option key={c.code} value={c.name}>{c.flag} {c.name}</option>)}
                                </select>
                            </div>
                        </div>
                        <ThemedButton onClick={handleUpdateProfile} className="w-full mt-8" icon={Save}>Save Changes</ThemedButton>
                    </>
                )}
            </Card>

            <Card title="Account Actions" className="mt-6 border-t-4 border-yellow-500">
                 <div className="space-y-4">
                    <button onClick={handleDeactivate} className={`w-full flex justify-center items-center gap-2 text-white font-semibold py-2 px-4 rounded-lg transition-colors ${profileData.status === 'active' ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-green-500 hover:bg-green-600'}`}>
                        <EyeOff size={18}/> {profileData.status === 'active' ? 'Deactivate Account' : 'Re-activate Account'}
                    </button>
                    <button onClick={handleLogout} className="w-full flex justify-center items-center gap-2 text-white font-semibold py-2 px-4 rounded-lg bg-blue-500 hover:bg-blue-600 transition-colors">
                        <LogOut size={18}/> Logout
                    </button>
                    <button onClick={() => setShowDeleteModal(true)} className="w-full flex justify-center items-center gap-2 text-red-600 font-semibold py-2 px-4 rounded-lg bg-transparent border border-red-600 hover:bg-red-600 hover:text-white transition-colors">
                       <Trash2 size={18}/> Delete Account Permanently
                    </button>
                </div>
            </Card>

            {showAlert && <CustomAlert message={alertMessage} onClose={() => setShowAlert(false)} />}
            {showDeleteModal && ( /* ... (Modal is the same) ... */ )}
        </>
    );
};

export default ProfilePage;
