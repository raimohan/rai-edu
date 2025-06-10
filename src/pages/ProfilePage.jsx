import React, { useState, useContext, useEffect } from 'react';
import { signOut } from 'firebase/auth';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { FirebaseContext } from '../contexts/FirebaseContext';
import Card from '../components/common/Card';
import ThemedButton from '../components/common/ThemedButton';
import CustomAlert from '../components/common/CustomAlert';

const ProfilePage = () => {
    const { auth, db, user } = useContext(FirebaseContext);
    const [username, setUsername] = useState('Loading...');
    const [email, setEmail] = useState('Loading...');
    const [newUsername, setNewUsername] = useState('');
    const [showAlert, setShowAlert] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');

    useEffect(() => {
        if (user) {
            const userDocRef = doc(db, 'users', user.uid);
            const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
                if (docSnap.exists()) {
                    const userData = docSnap.data();
                    setUsername(userData.username || '');
                    setEmail(userData.email || '');
                    setNewUsername(userData.username || '');
                }
            });
            return () => unsubscribe();
        }
    }, [user, db]);

    const handleUpdateProfile = async () => {
        if (!newUsername.trim()) {
            setAlertMessage("Username cannot be empty.");
            setShowAlert(true);
            return;
        }
        try {
            const userDocRef = doc(db, 'users', user.uid);
            await updateDoc(userDocRef, { username: newUsername });
            setAlertMessage("Profile updated successfully!");
            setShowAlert(true);
        } catch (error) {
            setAlertMessage(`Error: ${error.message}`);
            setShowAlert(true);
        }
    };

    const handleLogout = async () => {
        await signOut(auth);
    };

    return (
        <Card title="My Profile">
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Username</label>
                    <input
                        type="text"
                        value={newUsername}
                        onChange={(e) => setNewUsername(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg mt-1"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Email Address</label>
                    <p className="text-gray-500 mt-1">{email}</p>
                </div>
                <ThemedButton onClick={handleUpdateProfile} className="w-full">
                    Update Profile
                </ThemedButton>
                <ThemedButton onClick={handleLogout} className="w-full bg-red-500 hover:bg-red-600">
                    Logout
                </ThemedButton>
            </div>
            {showAlert && <CustomAlert message={alertMessage} onClose={() => setShowAlert(false)} />}
        </Card>
    );
};

export default ProfilePage;