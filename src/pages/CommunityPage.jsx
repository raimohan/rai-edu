import React, { useState, useContext, useEffect, useRef } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp, writeBatch, getDocs } from 'firebase/firestore';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/FirebaseContext';
import { ThemeContext } from '../contexts/ThemeContext';
import Card from '../components/common/Card';
import ThemedButton from '../components/common/ThemedButton';
import { Send, Paperclip, Trash2, XCircle, User, Image as ImageIcon, FileText, Eraser } from 'lucide-react';
import ConfirmationModal from '../components/common/ConfirmationModal'; // <-- नया मोडल इम्पोर्ट करें

const UserAvatar = ({ username }) => {
    const initial = username?.charAt(0).toUpperCase() || <User size={18} />;
    return (
        <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center font-bold text-white flex-shrink-0">
            {initial}
        </div>
    );
};

const CommunityPage = () => {
    const { db, currentUser, isAdmin } = useAuth();
    const { theme } = useContext(ThemeContext);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [file, setFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [loading, setLoading] = useState(true);
    const chatEndRef = useRef(null);
    const fileInputRef = useRef(null);

    // --- यहाँ नए स्टेट्स जोड़े गए हैं ---
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null); // 'item' ताकि यह सिर्फ मैसेज के लिए न हो

    useEffect(() => {
        if (!db) return;
        const q = query(collection(db, 'community_messages'), orderBy('timestamp', 'asc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedMessages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), timestamp: doc.data().timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || 'now' }));
            setMessages(fetchedMessages);
            setLoading(false);
        });
        return unsubscribe;
    }, [db]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async () => { /* ... (इसमें कोई बदलाव नहीं) ... */ };
    
    // --- डिलीट का नया तरीका ---
    const handleDeleteClick = (id) => {
        setItemToDelete({ type: 'message', id });
        setShowConfirmModal(true);
    };
    
    const handleClearChatClick = () => {
        setItemToDelete({ type: 'full_chat' });
        setShowConfirmModal(true);
    };

    const confirmDeletion = async () => {
        if (!itemToDelete) return;

        if (itemToDelete.type === 'message') {
            await deleteDoc(doc(db, "community_messages", itemToDelete.id));
        } else if (itemToDelete.type === 'full_chat') {
            setLoading(true);
            const snapshot = await getDocs(collection(db, 'community_messages'));
            const batch = writeBatch(db);
            snapshot.docs.forEach((d) => batch.delete(d.ref));
            await batch.commit();
            // setLoading(false) is handled by onSnapshot
        }
        
        setShowConfirmModal(false);
        setItemToDelete(null);
    };

    return (
        <Card title="Community Hub" className="h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <p className="text-gray-600 dark:text-gray-400">Share your thoughts and connect with others!</p>
                {isAdmin && (
                    <ThemedButton onClick={handleClearChatClick} icon={Eraser} className="bg-red-500 hover:bg-red-600">
                        Clear Chat
                    </ThemedButton>
                )}
            </div>
            <div className="flex-1 flex flex-col bg-gray-100 dark:bg-gray-900/50 p-4 rounded-xl shadow-inner overflow-y-auto mb-4 custom-scrollbar">
                {loading ? <div className="m-auto"><p>Loading messages...</p></div> : messages.map(msg => {
                    const isCurrentUser = msg.userId === currentUser?.uid;
                    return (
                        <div key={msg.id} className={`flex my-2 items-start gap-3 group ${isCurrentUser ? 'flex-row-reverse' : ''}`}>
                            <Link to={`/profile/${msg.userId}`}><UserAvatar username={msg.username} /></Link>
                            <div className={`p-3 rounded-lg max-w-[70%] break-words ${isCurrentUser ? `bg-${theme.primary} text-white` : 'bg-white dark:bg-gray-700'}`}>
                                {!isCurrentUser && <Link to={`/profile/${msg.userId}`} className={`font-bold text-sm text-${theme.primary} mb-1 block`}>{msg.username}</Link>}
                                {/* ... message content ... */}
                                <div className={`text-xs mt-1.5 text-right ${isCurrentUser ? 'text-gray-200/70' : 'text-gray-500/70'}`}>{msg.timestamp}</div>
                            </div>
                            {(isCurrentUser || isAdmin) && (
                                <button onClick={() => handleDeleteClick(msg.id)} className="text-red-400 opacity-0 group-hover:opacity-100"><Trash2 size={16}/></button>
                            )}
                        </div>
                    );
                })}
                <div ref={chatEndRef} />
            </div>
            
            {/* ... इनपुट एरिया ... */}
            
            {/* नया कन्फर्मेशन मोडल */}
            <ConfirmationModal
                isOpen={showConfirmModal}
                onClose={() => setShowConfirmModal(false)}
                onConfirm={confirmDeletion}
                title={itemToDelete?.type === 'message' ? "Delete Message" : "Clear Entire Chat"}
                message={
                    itemToDelete?.type === 'message' 
                    ? "Are you sure you want to permanently delete this message?" 
                    : "Admin, are you sure you want to delete all messages for everyone? This is irreversible."
                }
            />
        </Card>
    );
};

export default CommunityPage;
