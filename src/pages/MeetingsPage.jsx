import React, { useState, useContext, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { FirebaseContext } from '../contexts/FirebaseContext';
import Card from '../components/common/Card';
import ThemedButton from '../components/common/ThemedButton';
import CustomAlert from '../components/common/CustomAlert';
import { Plus, Play } from 'lucide-react';

const MeetingsPage = () => {
    const { db, user } = useContext(FirebaseContext);
    const [meetLinkInput, setMeetLinkInput] = useState('');
    const [meetingLinks, setMeetingLinks] = useState([]);
    const [showAlert, setShowAlert] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    // In a real app, role would come from user data
    const userRole = 'user'; 

    useEffect(() => {
        if (!db) return;
        const meetingsRef = collection(db, 'meeting_links');
        const q = query(meetingsRef, orderBy('createdAt', 'desc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedLinks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setMeetingLinks(fetchedLinks);
        });

        return () => unsubscribe();
    }, [db]);

    const handleAddLink = async () => {
        if (!meetLinkInput.trim() || !user) {
            setAlertMessage("Please enter a link. You must be logged in.");
            setShowAlert(true);
            return;
        }
        await addDoc(collection(db, 'meeting_links'), {
            link: meetLinkInput,
            updatedBy: user.uid,
            createdAt: serverTimestamp(),
        });
        setMeetLinkInput('');
        setAlertMessage('Link added!');
        setShowAlert(true);
    };

    return (
        <Card title="Meeting Links" className="h-full flex flex-col">
            <p className="text-gray-600 mb-4">Find and join important meeting links.</p>
            {userRole === 'admin' && (
                 <div className="mb-6 p-4 bg-blue-50 rounded-xl">
                    <h4 className="font-semibold text-gray-700 mb-2">Manage Links (Admin)</h4>
                    <div className="flex space-x-3">
                        <input type="url" placeholder="Paste new meeting link here..." value={meetLinkInput} onChange={(e) => setMeetLinkInput(e.target.value)} className="flex-1 p-3 border border-gray-300 rounded-lg" />
                        <ThemedButton onClick={handleAddLink} icon={Plus}>Add Link</ThemedButton>
                    </div>
                </div>
            )}
            <div className="flex-1 flex flex-col space-y-4 overflow-y-auto pr-2 custom-scrollbar">
                {meetingLinks.map(linkItem => (
                    <div key={linkItem.id} className="p-4 bg-gray-50 rounded-xl shadow-sm flex items-center justify-between">
                        <span className="text-gray-700 break-all pr-4">{linkItem.link}</span>
                        <a href={linkItem.link} target="_blank" rel="noopener noreferrer">
                            <ThemedButton className="px-5 py-2 text-sm" icon={Play}>Join</ThemedButton>
                        </a>
                    </div>
                ))}
            </div>
            {showAlert && <CustomAlert message={alertMessage} onClose={() => setShowAlert(false)} />}
        </Card>
    );
};

export default MeetingsPage;