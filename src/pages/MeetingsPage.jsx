import React, { useState, useContext, useEffect } from 'react';
import { collection, doc, getDoc, query, orderBy, onSnapshot, addDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { FirebaseContext } from '../contexts/FirebaseContext';
import Card from '../components/common/Card';
import ThemedButton from '../components/common/ThemedButton';
import { Plus, Play, Trash2 } from 'lucide-react';

const MeetingsPage = () => {
    const { db, user } = useContext(FirebaseContext);
    const [meetLinkInput, setMeetLinkInput] = useState('');
    const [meetingLinks, setMeetingLinks] = useState([]);
    const [userRole, setUserRole] = useState('user'); // Default role

    // User ka role check karna
    useEffect(() => {
        const checkUserRole = async () => {
            if (user) {
                const userDocRef = doc(db, 'users', user.uid);
                const userDocSnap = await getDoc(userDocRef);
                if (userDocSnap.exists() && userDocSnap.data().role === 'admin') {
                    setUserRole('admin');
                }
            }
        };
        checkUserRole();
    }, [user, db]);

    // Meeting links ko real-time me fetch karna
    useEffect(() => {
        if (!db) return;
        const meetingsRef = collection(db, 'meeting_links');
        const q = query(meetingsRef, orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setMeetingLinks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return () => unsubscribe();
    }, [db]);

    // Naya link add karne ka function (sirf admin ke liye)
    const handleAddLink = async () => {
        if (!meetLinkInput.trim() || !user) return;
        await addDoc(collection(db, 'meeting_links'), {
            link: meetLinkInput,
            createdAt: serverTimestamp(),
        });
        setMeetLinkInput('');
    };
    
    // Link delete karne ka function (sirf admin ke liye)
    const handleDeleteLink = async (id) => {
        await deleteDoc(doc(db, "meeting_links", id));
    };

    return (
        <Card title="Meeting Links" className="h-full flex flex-col">
            <p className="text-gray-600 mb-4">Yahan sabhi zaroori meeting links milenge.</p>

            {/* Yeh form sirf admin ko dikhega */}
            {userRole === 'admin' && (
                 <div className="mb-6 p-4 bg-blue-50 rounded-xl">
                    <h4 className="font-semibold text-gray-700 mb-2">Admin Panel: Add New Meeting Link</h4>
                    <div className="flex space-x-3">
                        <input type="url" placeholder="Naya meeting link paste karein..." value={meetLinkInput} onChange={(e) => setMeetLinkInput(e.target.value)} className="flex-1 p-3 border border-gray-300 rounded-lg" />
                        <ThemedButton onClick={handleAddLink} icon={Plus}>Add Link</ThemedButton>
                    </div>
                </div>
            )}
            
            <div className="flex-1 flex flex-col space-y-4 overflow-y-auto">
                {meetingLinks.map(linkItem => (
                    <div key={linkItem.id} className="p-4 bg-gray-50 rounded-xl flex items-center justify-between hover:shadow-md transition-shadow">
                        <span className="text-gray-700 break-all pr-4">{linkItem.link}</span>
                        <div className="flex items-center space-x-3">
                            <a href={linkItem.link} target="_blank" rel="noopener noreferrer">
                                <ThemedButton className="px-5 py-2 text-sm" icon={Play}>Join</ThemedButton>
                            </a>
                            {/* Delete button sirf admin ko dikhega */}
                            {userRole === 'admin' && (
                                <button onClick={() => handleDeleteLink(linkItem.id)} className="p-2 text-red-500 hover:bg-red-100 rounded-full">
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
                
