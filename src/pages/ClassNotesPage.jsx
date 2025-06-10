import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import Card from '../components/common/Card';
import ThemedButton from '../components/common/ThemedButton';
import CustomAlert from '../components/common/CustomAlert';
import { useSoundEffect } from '../hooks/useSoundEffect';

const ClassNotesPage = () => {
    const [notes, setNotes] = useState([
        { id: 1, title: 'Introduction to Algebra', subject: 'Math', content: 'Key concepts of algebraic expressions and equations...' },
        { id: 2, title: 'Cell Biology Basics', subject: 'Science', content: 'Detailed structure and functions of plant and animal cells...' },
        { id: 3, title: 'World War II Summary', subject: 'History', content: 'Major events, causes, and consequences of WWII...' },
    ]);
    const [showAddNoteModal, setShowAddNoteModal] = useState(false);
    const [newNoteTitle, setNewNoteTitle] = useState('');
    const [newNoteSubject, setNewNoteSubject] = useState('');
    const [newNoteContent, setNewNoteContent] = useState('');
    const [showAlert, setShowAlert] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const { playClick } = useSoundEffect();

    const addNote = () => {
        if (newNoteTitle.trim() && newNoteSubject.trim() && newNoteContent.trim()) {
            setNotes([...notes, {
                id: Date.now(),
                title: newNoteTitle,
                subject: newNoteSubject,
                content: newNoteContent,
            }]);
            setShowAddNoteModal(false);
            setNewNoteTitle('');
            setNewNoteSubject('');
            setNewNoteContent('');
            setAlertMessage('Note added successfully!');
            setShowAlert(true);
        } else {
            setAlertMessage('Please fill in all fields.');
            setShowAlert(true);
        }
    };

    return (
        <Card title="My Class Notes" className="h-full flex flex-col">
            <p className="text-gray-600 mb-4">Organize and manage all your class notes.</p>
            <div className="flex flex-col space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                {notes.map(note => (
                    <div key={note.id} className="p-4 bg-gray-50 rounded-xl shadow-sm">
                        <h4 className="font-semibold text-gray-700">{note.title}</h4>
                        <p className="text-gray-500 text-sm mb-2">{note.subject}</p>
                        <p className="text-gray-600 text-sm line-clamp-2">{note.content}</p>
                    </div>
                ))}
            </div>
            <ThemedButton className="w-full mt-6" icon={Plus} onClick={() => setShowAddNoteModal(true)}>
                Add New Note
            </ThemedButton>

            {/* Add Note Modal */}
            {showAddNoteModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white p-6 rounded-2xl shadow-2xl max-w-lg w-full">
                        <h3 className="text-xl font-semibold text-gray-800 mb-4">Add New Note</h3>
                        <div className="space-y-4">
                            <input type="text" placeholder="Note Title" value={newNoteTitle} onChange={(e) => setNewNoteTitle(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg"/>
                            <input type="text" placeholder="Subject" value={newNoteSubject} onChange={(e) => setNewNoteSubject(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg"/>
                            <textarea placeholder="Note Content" value={newNoteContent} onChange={(e) => setNewNoteContent(e.target.value)} rows="5" className="w-full p-3 border border-gray-300 rounded-lg"></textarea>
                        </div>
                        <div className="flex justify-end space-x-3 mt-6">
                            <button onClick={() => { playClick(); setShowAddNoteModal(false); }} className="px-6 py-3 rounded-lg text-gray-700 border border-gray-300 hover:bg-gray-100">Cancel</button>
                            <ThemedButton onClick={addNote} icon={Plus}>Add Note</ThemedButton>
                        </div>
                    </div>
                </div>
            )}
            {showAlert && <CustomAlert message={alertMessage} onClose={() => setShowAlert(false)} />}
        </Card>
    );
};

export default ClassNotesPage;