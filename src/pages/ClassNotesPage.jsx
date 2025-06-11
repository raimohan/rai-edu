import React, { useState, useEffect } from 'react';
import { db } from '../services/firebase'; // Your Firebase config
import { collection, query, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, orderBy } from 'firebase/firestore';
import { useAuth } from '../contexts/FirebaseContext'; // ASSUMPTION: You have an auth context
import Card from '../components/common/Card';
import ThemedButton from '../components/common/ThemedButton';
import CustomAlert from '../components/common/CustomAlert';
import { Plus, Edit, Trash2, ExternalLink } from 'lucide-react';
import LoadingAnimation from '../components/common/LoadingAnimation';

const ClassNotesPage = () => {
    // Auth and State Management
    const { currentUser, isAdmin } = useAuth(); // ASSUMPTION: Hook to get user role
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal and Form State
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentNote, setCurrentNote] = useState(null);
    const [noteTitle, setNoteTitle] = useState('');
    const [noteSubject, setNoteSubject] = useState('');
    const [gdriveLink, setGdriveLink] = useState('');

    // Alert State
    const [showAlert, setShowAlert] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');

    // --- Data Fetching ---
    useEffect(() => {
        const notesCollection = collection(db, 'classNotes');
        const q = query(notesCollection, orderBy('createdAt', 'desc'));

        // Use onSnapshot for real-time updates
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const notesData = [];
            querySnapshot.forEach((doc) => {
                notesData.push({ id: doc.id, ...doc.data() });
            });
            setNotes(notesData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching notes:", error);
            setLoading(false);
            setAlertMessage('Could not fetch notes.');
            setShowAlert(true);
        });

        // Cleanup subscription on unmount
        return () => unsubscribe();
    }, []);

    // --- Modal Handling ---
    const handleOpenModal = (note = null) => {
        if (note) {
            setIsEditing(true);
            setCurrentNote(note);
            setNoteTitle(note.title);
            setNoteSubject(note.subject);
            setGdriveLink(note.gdriveLink);
        } else {
            setIsEditing(false);
            setCurrentNote(null);
            setNoteTitle('');
            setNoteSubject('');
            setGdriveLink('');
        }
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
    };

    // --- CRUD Operations ---
    const handleSaveNote = async () => {
        if (!noteTitle || !noteSubject || !gdriveLink) {
            setAlertMessage('Please fill in all fields.');
            setShowAlert(true);
            return;
        }

        try {
            if (isEditing) {
                // Update existing note
                const noteRef = doc(db, 'classNotes', currentNote.id);
                await updateDoc(noteRef, {
                    title: noteTitle,
                    subject: noteSubject,
                    gdriveLink: gdriveLink,
                });
                setAlertMessage('Note updated successfully!');
            } else {
                // Add new note
                await addDoc(collection(db, 'classNotes'), {
                    title: noteTitle,
                    subject: noteSubject,
                    gdriveLink: gdriveLink,
                    createdAt: serverTimestamp(),
                    addedBy: currentUser.displayName,
                });
                setAlertMessage('Note added successfully!');
                // Here, you would trigger the push notification service for other users.
            }
            setShowAlert(true);
            handleCloseModal();
        } catch (error) {
            console.error('Error saving note:', error);
            setAlertMessage('Failed to save note.');
            setShowAlert(true);
        }
    };

    const handleDeleteNote = async (noteId) => {
        if (window.confirm('Are you sure you want to delete this note?')) {
            try {
                await deleteDoc(doc(db, 'classNotes', noteId));
                setAlertMessage('Note deleted successfully!');
                setShowAlert(true);
            } catch (error) {
                console.error('Error deleting note:', error);
                setAlertMessage('Failed to delete note.');
                setShowAlert(true);
            }
        }
    };

    if (loading) {
        return <LoadingAnimation />;
    }

    return (
        <Card title="Class Notes" className="h-full flex flex-col">
            <p className="text-gray-600 mb-4">A centralized hub for all your class materials.</p>

            <div className="flex flex-col space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                {notes.map(note => (
                    <div key={note.id} className="p-4 bg-gray-50 rounded-xl shadow-sm flex justify-between items-center">
                        <div>
                            <h4 className="font-semibold text-gray-800">{note.title}</h4>
                            <p className="text-gray-500 text-sm mb-2">{note.subject}</p>
                            <a href={note.gdriveLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-sm font-medium text-blue-600 hover:underline">
                                Open in Google Drive <ExternalLink className="ml-1.5 h-4 w-4" />
                            </a>
                        </div>
                        {/* Admin Controls */}
                        {isAdmin && (
                            <div className="flex items-center space-x-2">
                                <button onClick={() => handleOpenModal(note)} className="p-2 text-gray-500 hover:text-blue-600 rounded-full hover:bg-gray-200">
                                    <Edit size={18} />
                                </button>
                                <button onClick={() => handleDeleteNote(note.id)} className="p-2 text-gray-500 hover:text-red-600 rounded-full hover:bg-gray-200">
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Admin "Add Note" Button */}
            {isAdmin && (
                <ThemedButton className="w-full mt-6" icon={Plus} onClick={() => handleOpenModal()}>
                    Add New Note
                </ThemedButton>
            )}

            {/* Add/Edit Note Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white p-6 rounded-2xl shadow-2xl max-w-lg w-full">
                        <h3 className="text-xl font-semibold text-gray-800 mb-4">{isEditing ? 'Edit Note' : 'Add New Note'}</h3>
                        <div className="space-y-4">
                            <input type="text" placeholder="Note Title" value={noteTitle} onChange={(e) => setNoteTitle(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg"/>
                            <input type="text" placeholder="Subject" value={noteSubject} onChange={(e) => setNoteSubject(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg"/>
                            <input type="url" placeholder="Google Drive Link" value={gdriveLink} onChange={(e) => setGdriveLink(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg"/>
                        </div>
                        <div className="flex justify-end space-x-3 mt-6">
                            <button onClick={handleCloseModal} className="px-6 py-3 rounded-lg text-gray-700 border border-gray-300 hover:bg-gray-100">Cancel</button>
                            <ThemedButton onClick={handleSaveNote}>{isEditing ? 'Save Changes' : 'Add Note'}</ThemedButton>
                        </div>
                    </div>
                </div>
            )}

            {showAlert && <CustomAlert message={alertMessage} onClose={() => setShowAlert(false)} />}
        </Card>
    );
};

export default ClassNotesPage;
