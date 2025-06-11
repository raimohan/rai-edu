import React, { useState, useEffect } from 'react';
import { signOut, EmailAuthProvider, reauthenticateWithCredential, deleteUser } from 'firebase/auth';
import { doc, onSnapshot, updateDoc, deleteDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/FirebaseContext';
import Card from '../components/common/Card';
import ThemedButton from '../components/common/ThemedButton';
import CustomAlert from '../components/common/CustomAlert';
import { LogOut, User, Mail, BookOpen, Globe, Trash2, Save } from 'lucide-react';

// स्केलेटन लोडर कंपोनेंट
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
    const [profileData, setProfileData] = useState({ username: '', email: '', about: '', education: '', country: '' });
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
                        country: userData.country || ''
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

    const handleUpdateProfile = async () => { /* ... (Same as before) ... */ 
        if (!profileData.username.trim()) {
            setAlertMessage("Username cannot be empty.");
            setShowAlert(true);
            return;
        }
        if (!currentUser || !db) return;

        try {
            const userDocRef = doc(db, 'users', currentUser.uid);
            await updateDoc(userDocRef, {
                username: profileData.username,
                about: profileData.about,
                education: profileData.education,
                country: profileData.country
            });
            setAlertMessage("Profile updated successfully!");
            setShowAlert(true);
        } catch (error) {
            setAlertMessage(`Error: ${error.message}`);
            setShowAlert(true);
        }
    };
    const handleDeleteAccount = async () => { /* ... (Same as before) ... */
        if (!passwordForDelete) {
            setDeleteError("Password is required to delete your account.");
            return;
        }
        setDeleteError('');

        try {
            const credential = EmailAuthProvider.credential(currentUser.email, passwordForDelete);
            await reauthenticateWithCredential(currentUser, credential);
            if (window.confirm("ARE YOU ABSOLUTELY SURE? This action is irreversible and will delete all your data permanently.")) {
                await deleteDoc(doc(db, "users", currentUser.uid));
                await deleteUser(currentUser);
            } else {
                setShowDeleteModal(false);
                setPasswordForDelete('');
            }
        } catch (error) {
            console.error(error);
            setDeleteError("Incorrect password or error deleting account.");
        }
    };
    const handleLogout = async () => { /* ... (Same as before) ... */
        if (!auth) return;
        await signOut(auth);
    };

    const countries = ["India", "USA", "Canada", "UK", "Australia", "Germany", "Japan", "Other"];
    
    return (
        <>
            <Card>
                {isLoading ? <ProfileSkeleton /> : (
                    <>
                        {/* --- Profile Header --- */}
                        <div className="flex flex-col items-center text-center mb-8">
                            <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center text-4xl font-bold text-gray-500 dark:text-gray-400 mb-4">
                                {profileData.username.charAt(0).toUpperCase()}
                            </div>
                            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{profileData.username}</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{profileData.email}</p>
                        </div>

                        {/* --- Profile Form --- */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             {/* Username */}
                            <div className="md:col-span-2">
                                <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"><User size={14} className="mr-2"/>Username</label>
                                <input type="text" name="username" value={profileData.username} onChange={handleInputChange} className="w-full p-3 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600"/>
                            </div>

                            {/* About Me */}
                            <div className="md:col-span-2">
                                <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">About Me</label>
                                <textarea name="about" value={profileData.about} onChange={handleInputChange} rows="4" className="w-full p-3 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600" placeholder="Tell us something about yourself..."/>
                            </div>
                            
                             {/* Education */}
                            <div>
                                <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"><BookOpen size={14} className="mr-2"/>Education Qualification</label>
                                <input type="text" name="education" value={profileData.education} onChange={handleInputChange} className="w-full p-3 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600" placeholder="e.g., B.Tech in Computer Science"/>
                            </div>

                            {/* Country */}
                            <div>
                                <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"><Globe size={14} className="mr-2"/>Country</label>
                                <select name="country" value={profileData.country} onChange={handleInputChange} className="w-full p-3 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600">
                                    <option value="">Select Country</option>
                                    {countries.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                        </div>

                        <ThemedButton onClick={handleUpdateProfile} className="w-full mt-8" icon={Save}>Save Changes</ThemedButton>
                    </>
                )}
            </Card>

            {/* Account Actions Card */}
            <Card title="Account Actions" className="mt-6 border-t-4 border-red-500">
                 <div className="space-y-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Manage your account or log out from here.</p>
                    <button onClick={handleLogout} className="w-full flex justify-center items-center gap-2 text-white font-semibold py-2 px-4 rounded-lg bg-blue-500 hover:bg-blue-600 transition-colors">
                        <LogOut size={18}/> Logout
                    </button>
                    <button onClick={() => setShowDeleteModal(true)} className="w-full flex justify-center items-center gap-2 text-red-600 font-semibold py-2 px-4 rounded-lg bg-transparent border border-red-600 hover:bg-red-600 hover:text-white transition-colors">
                       <Trash2 size={18}/> Delete Account Permanently
                    </button>
                </div>
            </Card>

            {showAlert && <CustomAlert message={alertMessage} onClose={() => setShowAlert(false)} />}
            {showDeleteModal && ( /* ... (Modal code is the same as before) ... */ 
                 <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-2xl max-w-sm w-full">
                        <h3 className="text-xl font-semibold text-red-500 mb-4">Delete Account</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">This is a permanent action. To confirm, please enter your password.</p>
                        <input type="password" value={passwordForDelete} onChange={(e) => setPasswordForDelete(e.target.value)} placeholder="Enter your password" className="w-full p-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600" />
                        {deleteError && <p className="text-red-500 text-xs mt-2">{deleteError}</p>}
                        <div className="flex justify-end space-x-3 mt-6">
                            <button onClick={() => setShowDeleteModal(false)} className="px-5 py-2 rounded-lg text-gray-700 border border-gray-300 hover:bg-gray-100 dark:text-gray-300 dark:border-gray-500 dark:hover:bg-gray-700">Cancel</button>
                            <button onClick={handleDeleteAccount} className="px-5 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700">Confirm & Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ProfilePage;
