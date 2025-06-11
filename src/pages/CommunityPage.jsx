import React, { useState, useContext, useEffect, useRef } from 'react';
// getDocs और writeBatch को इम्पोर्ट करें
import { collection, query, orderBy, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp, writeBatch, getDocs } from 'firebase/firestore';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/FirebaseContext';
import { ThemeContext } from '../contexts/ThemeContext';
import Card from '../components/common/Card';
import ThemedButton from '../components/common/ThemedButton';
import { Send, Paperclip, Trash2, XCircle, User, Image as ImageIcon, FileText, Eraser } from 'lucide-react';

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

    // ... (बाकी सभी functions जैसे useEffect, handleSendMessage, deleteMessage पहले जैसे ही रहेंगे) ...
    useEffect(() => {
        if (!db) return;
        const messagesRef = collection(db, 'community_messages');
        const q = query(messagesRef, orderBy('timestamp', 'asc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedMessages = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                timestamp: doc.data().timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || 'Just now'
            }));
            setMessages(fetchedMessages);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [db]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async () => {
        // ... (यह फंक्शन पहले जैसा ही है)
    };

    const deleteMessage = async (id) => {
        // ... (यह फंक्शन पहले जैसा ही है)
    };

    // --- यहाँ बदलाव किया गया है ---
    const clearChat = async () => {
        if (!db) return;
        if (window.confirm("Admin, are you sure you want to clear all messages for everyone? This action cannot be undone.")) {
            setLoading(true);
            const collectionRef = collection(db, 'community_messages');
            
            // onSnapshot की जगह getDocs का इस्तेमाल करें
            const snapshot = await getDocs(collectionRef);
            
            // एक बैच में सभी डिलीट ऑपरेशन करें
            const batch = writeBatch(db);
            snapshot.docs.forEach((doc) => {
                batch.delete(doc.ref);
            });
            
            await batch.commit();
            console.log("Chat cleared successfully for all users.");
            // setLoading(false) की ज़रूरत नहीं है, क्योंकि onSnapshot अपने आप UI अपडेट कर देगा
        }
    };

    return (
        <Card title="Community Hub" className="h-full flex flex-col">
             {/* ... (बाकी का JSX कोड पहले जैसा ही रहेगा) ... */}
             <div className="flex items-center justify-between mb-4">
                <p className="text-gray-600 dark:text-gray-400">Share your thoughts and connect with others!</p>
                {isAdmin && (
                    <ThemedButton onClick={clearChat} icon={Eraser} className="bg-red-500 hover:bg-red-600">
                        Clear Chat
                    </ThemedButton>
                )}
            </div>
             {/* ... */}
        </Card>
    );
};

export default CommunityPage;
