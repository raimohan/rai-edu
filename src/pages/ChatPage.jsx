import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/FirebaseContext';
import { doc, getDoc, collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { ArrowLeft, Send, Trash2, Edit, X, Check } from 'lucide-react';
import ThemedButton from '../components/common/ThemedButton';
import ConfirmationModal from '../components/common/ConfirmationModal';

const UserAvatar = ({ username }) => {
    const initial = username?.charAt(0).toUpperCase() || '?';
    return <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center font-bold text-white flex-shrink-0">{initial}</div>;
};

const ChatPage = () => {
    const { chatId } = useParams();
    const { db, currentUser } = useAuth();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [otherUser, setOtherUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef(null);

    // नए फीचर्स के लिए स्टेट्स
    const [editingMessage, setEditingMessage] = useState(null); // { id, text }
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [messageToDelete, setMessageToDelete] = useState(null);

    // दूसरे यूजर की जानकारी और चैट के मैसेज लाना
    useEffect(() => {
        if (!chatId || !db || !currentUser) return;

        const participantIds = chatId.split('_');
        const otherUserId = participantIds.find(id => id !== currentUser.uid);

        if (otherUserId) {
            getDoc(doc(db, 'users', otherUserId)).then(docSnap => {
                if (docSnap.exists()) setOtherUser({id: docSnap.id, ...docSnap.data()});
            });
        }

        const messagesRef = collection(db, 'chats', chatId, 'messages');
        const q = query(messagesRef, orderBy('timestamp', 'asc'));
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedMessages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setMessages(fetchedMessages);
            setLoading(false);
            
            // आते ही दूसरे के मैसेज को 'read' मार्क करें
            markMessagesAsRead(snapshot.docs);
        });

        return () => unsubscribe();
    }, [chatId, db, currentUser]);

    // नए मैसेज आने पर नीचे स्क्रॉल करें
    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

    // सीन सिस्टम: मैसेज को 'read' मार्क करने का फंक्शन
    const markMessagesAsRead = async (docs) => {
        if (!db || !currentUser) return;
        const batch = writeBatch(db);
        docs.forEach(messageDoc => {
            const data = messageDoc.data();
            if (data.senderId !== currentUser.uid && !data.read) {
                batch.update(messageDoc.ref, { read: true });
            }
        });
        await batch.commit();
    };

    // नया मैसेज भेजना
    const handleSendMessage = async () => {
        if (newMessage.trim() === '' || !otherUser) return;
        await addDoc(collection(db, 'chats', chatId, 'messages'), {
            text: newMessage,
            senderId: currentUser.uid,
            timestamp: serverTimestamp(),
            read: false,
            isEdited: false,
        });
        setNewMessage('');
    };
    
    // डिलीट मोडल खोलना
    const handleDeleteClick = (messageId) => {
        setMessageToDelete(messageId);
        setShowConfirmModal(true);
    };

    // मैसेज को फाइनल डिलीट करना
    const confirmDelete = async () => {
        if (messageToDelete) {
            await deleteDoc(doc(db, 'chats', chatId, 'messages', messageToDelete));
        }
        setShowConfirmModal(false);
        setMessageToDelete(null);
    };

    // एडिट मोड शुरू करना
    const handleEditClick = (message) => {
        setEditingMessage({ ...message });
    };

    // मैसेज को फाइनल अपडेट करना
    const handleUpdateMessage = async () => {
        if (!editingMessage || !editingMessage.text.trim()) return;
        const messageRef = doc(db, 'chats', chatId, 'messages', editingMessage.id);
        await updateDoc(messageRef, {
            text: editingMessage.text,
            isEdited: true
        });
        setEditingMessage(null);
    };
    
    if (loading) return <div className="flex justify-center items-center h-full"><p>Loading chat...</p></div>;

    return (
        <div className="flex flex-col h-full bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
            <header className="flex items-center p-4 border-b border-gray-200 dark:border-gray-700">
                <Link to="/friends" className="p-2 mr-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"><ArrowLeft size={20} /></Link>
                {otherUser && (
                    <Link to={`/profile/${otherUser.id}`} className="flex items-center" title={`View ${otherUser.username}'s profile`}>
                        <UserAvatar username={otherUser.username} />
                        <div className="ml-4">
                            <h2 className="font-semibold text-lg text-gray-800 dark:text-white">{otherUser.username}</h2>
                        </div>
                    </Link>
                )}
            </header>

            <main className="flex-1 p-4 overflow-y-auto custom-scrollbar bg-gray-50 dark:bg-gray-900/50">
                {messages.map(msg => {
                    const isCurrentUser = msg.senderId === currentUser.uid;
                    return (
                        <div key={msg.id} className={`flex my-2 items-end gap-2 group ${isCurrentUser ? 'flex-row-reverse' : ''}`}>
                             <div className={`py-2 px-3 rounded-2xl max-w-[70%] text-sm relative ${isCurrentUser ? 'bg-blue-500 text-white rounded-br-none' : 'bg-gray-200 dark:bg-gray-700 rounded-bl-none'}`}>
                                {editingMessage && editingMessage.id === msg.id ? (
                                    <div className="flex items-center gap-2">
                                        <input type="text" value={editingMessage.text} onChange={(e) => setEditingMessage({...editingMessage, text: e.target.value})} className="bg-transparent text-white p-1 border-b border-white/50 focus:outline-none"/>
                                        <button onClick={handleUpdateMessage} className="text-green-300 hover:scale-125 transition-transform"><Check size={18}/></button>
                                        <button onClick={() => setEditingMessage(null)} className="text-red-300 hover:scale-125 transition-transform"><X size={18}/></button>
                                    </div>
                                ) : (
                                    <p className="whitespace-pre-wrap">{msg.text}</p>
                                )}
                                <div className={`text-xs mt-1.5 flex items-center justify-end gap-1 ${isCurrentUser ? 'text-blue-100/70' : 'text-gray-500/70'}`}>
                                    {msg.isEdited && <span>(edited)</span>}
                                    <span>{msg.timestamp || '...'}</span>
                                    {isCurrentUser && (msg.read ? <Check size={16} className="text-cyan-400"/> : <Check size={16} />)}
                                </div>
                            </div>
                            {isCurrentUser && !editingMessage && (
                                <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleEditClick(msg)} className="p-1 rounded-full text-gray-500 hover:bg-gray-300" title="Edit"><Edit size={14}/></button>
                                    <button onClick={() => handleDeleteClick(msg.id)} className="p-1 rounded-full text-gray-500 hover:bg-gray-300" title="Delete"><Trash2 size={14}/></button>
                                </div>
                            )}
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </main>

            <footer className="p-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-3">
                    <input type="text" placeholder="Type a message..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()} className="flex-1 p-3 bg-gray-100 dark:bg-gray-700 rounded-full border-transparent focus:ring-2 focus:ring-blue-500"/>
                    <ThemedButton onClick={handleSendMessage} disabled={!newMessage.trim()} className="rounded-full !p-3"><Send size={20} /></ThemedButton>
                </div>
            </footer>
            
            <ConfirmationModal isOpen={showConfirmModal} onClose={() => setShowConfirmModal(false)} onConfirm={confirmDelete} title="Delete Message" message="Are you sure you want to permanently delete this message?" />
        </div>
    );
};

export default ChatPage;
