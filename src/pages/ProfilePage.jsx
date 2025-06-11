import React, { useState, useEffect } from 'react';
import { signOut, EmailAuthProvider, reauthenticateWithCredential, deleteUser } from 'firebase/auth';
import { doc, onSnapshot, updateDoc, deleteDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/FirebaseContext';
import Card from '../components/common/Card';
import ThemedButton from '../components/common/ThemedButton';
import CustomAlert from '../components/common/CustomAlert';
import { LogOut, User, Mail, BookOpen, Globe, Trash2 } from 'lucide-react';

const ProfilePage = () => {
    // नए हुक का इस्तेमाल
    const { auth, db, currentUser } = useAuth();

    // प्रोफाइल डेटा के लिए स्टेट्स
    const [profileData, setProfileData] = useState({
        username: '',
        email: '',
        about: '',
        education: '',
        country: ''
    });
    const [isLoading, setIsLoading] = useState(true);

    // अलर्ट और मोडल के लिए स्टेट्स
    const [showAlert, setShowAlert] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [passwordForDelete, setPasswordForDelete] = useState('');
    const [deleteError, setDeleteError] = useState('');

    // Firestore से डेटा लोड करना
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
                    setIsLoading(false);
                }
            });
            return () => unsubscribe();
        }
    }, [currentUser, db]);

    // इनपुट फील्ड्स को हैंडल करना
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setProfileData(prev => ({ ...prev, [name]: value }));
    };

    // प्रोफाइल अपडेट करना
    const handleUpdateProfile = async () => {
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

    // अकाउंट डिलीट करने का प्रोसेस
    const handleDeleteAccount = async () => {
        if (!passwordForDelete) {
            setDeleteError("Password is required to delete your account.");
            return;
        }
        setDeleteError('');

        try {
            // Step 1: Re-authenticate user
            const credential = EmailAuthProvider.credential(currentUser.email, passwordForDelete);
            await reauthenticateWithCredential(currentUser, credential);

            // Step 2: Show final confirmation
            if (window.confirm("ARE YOU ABSOLUTELY SURE? This action is irreversible and will delete all your data permanently.")) {
                // Step 3: Delete Firestore document
                await deleteDoc(doc(db, "users", currentUser.uid));
                
                // Step 4: Delete user from Auth
                await deleteUser(currentUser);
                
                // User will be automatically logged out and redirected by the AuthProvider
            } else {
                setShowDeleteModal(false);
                setPasswordForDelete('');
            }
        } catch (error) {
            console.error(error);
            setDeleteError("Incorrect password or error deleting account.");
        }
    };

    const handleLogout = async () => {
        if (!auth) return;
        await signOut(auth);
    };

    // देशों की एक छोटी लिस्ट
    const countries = ["India", "USA", "Canada", "UK", "Australia", "Other"];

    return (
        <>
            <Card title="My Profile" icon={User}>
                {isLoading ? <p>Loading profile...</p> : (
                    <div className="space-y-6">
                        {/* Username */}
                        <div>
                            <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300"><User size={14} className="mr-2"/>Username</label>
                            <input type="text" name="username" value={profileData.username} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-lg mt-1 dark:bg-gray-700 dark:border-gray-600"/>
                        </div>

                        {/* About Me */}
                        <div>
                            <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">About Me</label>
                            <textarea name="about" value={profileData.about} onChange={handleInputChange} rows="3" className="w-full p-2 border border-gray-300 rounded-lg mt-1 dark:bg-gray-700 dark:border-gray-600" placeholder="Tell us something about yourself..."/>
                        </div>

                        {/* Education */}
                        <div>
                            <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300"><BookOpen size={14} className="mr-2"/>Education Qualification</label>
                            <input type="text" name="education" value={profileData.education} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-lg mt-1 dark:bg-gray-700 dark:border-gray-600" placeholder="e.g., B.Tech in Computer Science"/>
                        </div>

                        {/* Country */}
                        <div>
                            <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300"><Globe size={14} className="mr-2"/>Country</label>
                            <select name="country" value={profileData.country} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-lg mt-1 dark:bg-gray-700 dark:border-gray-600">
                                <option value="">Select Country</option>
                                {countries.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        
                        {/* Email Address (Read-only) */}
                        <div>
                            <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300"><Mail size={14} className="mr-2"/>Email Address</label>
                            <p className="text-gray-500 dark:text-gray-400 mt-1 p-2 bg-gray-100 dark:bg-gray-700/50 rounded-lg">{profileData.email}</p>
                        </div>

                        <ThemedButton onClick={handleUpdateProfile} className="w-full">Update Profile</ThemedButton>
                    </div>
                )}
            </Card>

            {/* Account Actions Card */}
            <Card title="Account Actions" className="mt-6">
                 <div className="space-y-4">
                    <button onClick={handleLogout} className="w-full flex justify-center items-center gap-2 text-white font-semibold py-2 px-4 rounded-lg bg-blue-500 hover:bg-blue-600 transition-colors">
                        <LogOut size={18}/> Logout
                    </button>
                    <button onClick={() => setShowDeleteModal(true)} className="w-full flex justify-center items-center gap-2 text-white font-semibold py-2 px-4 rounded-lg bg-red-600 hover:bg-red-700 transition-colors">
                       <Trash2 size={18}/> Delete Account Permanently
                    </button>
                </div>
            </Card>

            {showAlert && <CustomAlert message={alertMessage} onClose={() => setShowAlert(false)} />}

            {/* Delete Account Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-2xl max-w-sm w-full">
                        <h3 className="text-xl font-semibold text-red-500 mb-4">Delete Account</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">This is a permanent action. To confirm, please enter your password.</p>
                        <input
                            type="password"
                            value={passwordForDelete}
                            onChange={(e) => setPasswordForDelete(e.target.value)}
                            placeholder="Enter your password"
                            className="w-full p-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600"
                        />
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
