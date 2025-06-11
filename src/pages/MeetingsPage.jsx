import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../contexts/FirebaseContext';
import Card from '../components/common/Card';
import ThemedButton from '../components/common/ThemedButton';
import { Plus, Play, Trash2 } from 'lucide-react';

const MeetingsPage = () => {
    const { db, currentUser, isAdmin } = useAuth();
    const [meetLinkInput, setMeetLinkInput] = useState('');
    const [meetingLinks, setMeetingLinks] = useState([]);

    useEffect(() => {
        if (!db) return;
        const meetingsRef = collection(db, 'meeting_links');
        const q = query(meetingsRef, orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setMeetingLinks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return () => unsubscribe();
    }, [db]);

    const handleAddLink = async () => {
        if (!meetLinkInput.trim() || !currentUser || !db) return;
        await addDoc(collection(db, 'meeting_links'), {
            link: meetLinkInput,
            createdAt: serverTimestamp(),
            addedBy: currentUser.displayName,
        });
        setMeetLinkInput('');
    };
    
    const handleDeleteLink = async (id) => {
        if (!db) return;
        await deleteDoc(doc(db, "meeting_links", id));
    };

    return (
        <Card title="Meeting Links" className="h-full flex flex-col">
            <p className="text-gray-600 dark:text-gray-400 mb-4"></p>

            {isAdmin && (
                <div className="mb-6 p-4 bg-blue-50 dark:bg-gray-800 rounded-xl">
                    <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Admin Panel: Add New Meeting Link</h4>
                    <div className="flex space-x-3">
                        <input type="url" placeholder="Naya meeting link paste karein..." value={meetLinkInput} onChange={(e) => setMeetLinkInput(e.target.value)} className="flex-1 p-3 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600" />
                        <ThemedButton onClick={handleAddLink} icon={Plus}>Add Link</ThemedButton>
                    </div>
                </div>
            )}
            
            <div className="flex-1 flex flex-col space-y-4 overflow-y-auto">
                {meetingLinks.map(linkItem => (
                    <div key={linkItem.id} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl flex items-center justify-between hover:shadow-md transition-shadow">
                        <span className="text-gray-700 dark:text-gray-300 break-all pr-4">{linkItem.link}</span>
                        <div className="flex items-center space-x-3">
                            <a href={linkItem.link} target="_blank" rel="noopener noreferrer">
                                <ThemedButton className="px-5 py-2 text-sm" icon={Play}>Join</ThemedButton>
                            </a>
                            {isAdmin && (
                                <button onClick={() => handleDeleteLink(linkItem.id)} className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-full">
                                    <Trash2 size={20} />
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    );
};

export default MeetingsPage;
