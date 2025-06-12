import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
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

    const [editingMessage, setEditingMessage] = useState(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [messageToDelete, setMessageToDelete] = useState(null);

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
            setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
            markMessagesAsRead(snapshot.docs);
        });

        return () => unsubscribe();
    }, [chatId, db, currentUser]);

    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

    const markMessagesAsRead = async (docs) => {
        const batch = writeBatch(db);
        docs.forEach(messageDoc => {
            if (messageDoc.data().senderId !== currentUser.uid && !messageDoc.data().read) {
                batch.update(messageDoc.ref, { read: true });
            }
        });
        await batch.commit();
    };

    const handleSendMessage = async () => {
        if (newMessage.trim() === '' || !otherUser) return;

        const messagesRef = collection(db, 'chats', chatId, 'messages');
        await addDoc(messagesRef, {
            text: newMessage, senderId: currentUser.uid, timestamp: serverTimestamp(),
            read: false, isEdited: false,
        });

        const notificationsRef = collection(db, 'notifications');
        await addDoc(notificationsRef, {
            recipientId: otherUser.id, senderName: currentUser.displayName,
            type: 'new_message', message: `sent you a message.`,
            link: `/chat/${chatId}`, isRead: false, createdAt: serverTimestamp(),
        });
        setNewMessage('');
    };
    
    const handleDeleteClick = (messageId) => { setMessageToDelete(messageId); setShowConfirmModal(true); };
    const confirmDelete = async () => {
        if (messageToDelete) await deleteDoc(doc(db, 'chats', chatId, 'messages', messageToDelete));
        setShowConfirmModal(false); setMessageToDelete(null);
    };

    const handleEditClick = (message) => setEditingMessage({ ...message });
    const handleUpdateMessage = async () => {
        if (!editingMessage || !editingMessage.text.trim()) return;
        const messageRef = doc(db, 'chats', chatId, 'messages', editingMessage.id);
        await updateDoc(messageRef, { text: editingMessage.text, isEdited: true });
        setEditingMessage(null);
    };

    return (
        <div className="flex flex-col h-full bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
            <header className="flex items-center p-4 border-b border-gray-200 dark:border-gray-700">
                <Link to="/friends" className="p-2 mr-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"><ArrowLeft size={20} /></Link>
                {otherUser && (
                    <Link to={`/profile/${otherUser.id}`} className="flex items-center">
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
                             <div className={`p-3 rounded-2xl max-w-[70%] text-sm relative ${isCurrentUser ? 'bg-blue-500 text-white rounded-br-none' : 'bg-gray-200 dark:bg-gray-700 rounded-bl-none'}`}>
                                {editingMessage && editingMessage.id === msg.id ? (
                                    <div className="flex items-center gap-2">
                                        <input type="text" value={editingMessage.text} onChange={(e) => setEditingMessage({...editingMessage, text: e.target.value})} className="bg-transparent text-white border-b border-white/50 focus:outline-none"/>
                                        <button onClick={handleUpdateMessage} className="text-green-300"><Check size={18}/></button>
                                        <button onClick={() => setEditingMessage(null)} className="text-red-300"><X size={18}/></button>
                                    </div>
                                ) : ( <p className="whitespace-pre-wrap">{msg.text}</p> )}
                                <div className={`text-xs mt-1.5 flex items-center justify-end gap-1 ${isCurrentUser ? 'text-blue-100/70' : 'text-gray-500/70'}`}>
                                    {msg.isEdited && <span>(edited)</span>}
                                    <span>{msg.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || '...'}</span>
                                    {isCurrentUser && (msg.read ? <Check size={16} className="text-cyan-400"/> : <Check size={16} />)}
                                </div>
                            </div>
                            {isCurrentUser && !editingMessage && (
                                <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleEditClick(msg)} className="p-1 rounded-full text-gray-500 hover:bg-gray-300"><Edit size={14}/></button>
                                    <button onClick={() => handleDeleteClick(msg.id)} className="p-1 rounded-full text-gray-500 hover:bg-gray-300"><Trash2 size={14}/></button>
                                </div>
                            )}
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </main>
            <footer className="p-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-3">
                    <input type="text" placeholder="Type a message..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()} className="flex-1 p-3 bg-gray-100 dark:bg-gray-700 rounded-full"/>
                    <ThemedButton onClick={handleSendMessage} disabled={!newMessage.trim()} className="rounded-full !p-3"><Send size={20} /></ThemedButton>
                </div>
            </footer>
            <ConfirmationModal isOpen={showConfirmModal} onClose={() => setShowConfirmModal(false)} onConfirm={confirmDelete} title="Delete Message" message="Are you sure you want to delete this message?" />
        </div>
    );
};

export default ChatPage;
