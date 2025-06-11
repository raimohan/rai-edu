import React, { useState, useContext, useEffect, useRef } from 'react';
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
    return <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center font-bold text-white flex-shrink-0">{initial}</div>;
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

    useEffect(() => {
        if (!db) return;
        const q = query(collection(db, 'community_messages'), orderBy('timestamp', 'asc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), timestamp: doc.data().timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || 'now' }));
            setMessages(msgs);
            setLoading(false);
        });
        return unsubscribe;
    }, [db]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async () => {
        if (!currentUser || !db || (!newMessage.trim() && !file)) return;
        const messageData = { userId: currentUser.uid, username: currentUser.displayName, timestamp: serverTimestamp() };
        if (file) {
            setIsUploading(true);
            const storageRef = ref(getStorage(), `community_files/${Date.now()}_${file.name}`);
            const uploadTask = uploadBytesResumable(storageRef, file);
            uploadTask.on('state_changed', 
                (snap) => setUploadProgress((snap.bytesTransferred / snap.totalBytes) * 100), 
                (err) => { console.error(err); setIsUploading(false); }, 
                () => getDownloadURL(uploadTask.snapshot.ref).then((url) => {
                    addDoc(collection(db, 'community_messages'), { ...messageData, fileUrl: url, type: file.type.startsWith('image/') ? 'image' : 'file', fileName: file.name, messageText: newMessage });
                    setFile(null); setNewMessage(''); setIsUploading(false);
                })
            );
        } else {
            await addDoc(collection(db, 'community_messages'), { ...messageData, messageText: newMessage, type: 'text' });
            setNewMessage('');
        }
    };

    const deleteMessage = async (id) => { if (window.confirm("Delete message?")) await deleteDoc(doc(db, "community_messages", id)); };
    const clearChat = async () => {
        if (!db) return;
        if (window.confirm("Admin: Clear all messages for everyone?")) {
            setLoading(true);
            const snapshot = await getDocs(collection(db, 'community_messages'));
            const batch = writeBatch(db);
            snapshot.docs.forEach((d) => batch.delete(d.ref));
            await batch.commit();
        }
    };

    return (
        <Card title="Community Hub" className="h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <p>Connect with others!</p>
                {isAdmin && <ThemedButton onClick={clearChat} icon={Eraser} className="bg-red-500">Clear Chat</ThemedButton>}
            </div>
            <div className="flex-1 flex flex-col bg-gray-100 p-4 rounded-xl overflow-y-auto mb-4">
                {loading ? <p>Loading...</p> : messages.map(msg => {
                    const isCurrentUser = msg.userId === currentUser?.uid;
                    return (
                        <div key={msg.id} className={`flex my-2 items-start gap-3 group ${isCurrentUser ? 'flex-row-reverse' : ''}`}>
                            <Link to={`/profile/${msg.userId}`}><UserAvatar username={msg.username} /></Link>
                            <div className={`p-3 rounded-lg max-w-[70%] ${isCurrentUser ? `bg-${theme.primary} text-white` : 'bg-white'}`}>
                                {!isCurrentUser && <Link to={`/profile/${msg.userId}`} className={`font-bold text-sm text-${theme.primary} mb-1 block`}>{msg.username}</Link>}
                                {msg.type === 'image' && <img src={msg.fileUrl} alt={msg.fileName} className="rounded-lg mb-1" />}
                                {msg.type === 'file' && <a href={msg.fileUrl} target="_blank"><FileText/><span>{msg.fileName}</span></a>}
                                {msg.messageText && <p>{msg.messageText}</p>}
                                <div className={`text-xs mt-1.5 text-right ${isCurrentUser ? 'text-gray-200/70' : 'text-gray-500/70'}`}>{msg.timestamp}</div>
                            </div>
                            {(isCurrentUser || isAdmin) && <button onClick={() => deleteMessage(msg.id)}><Trash2/></button>}
                        </div>
                    );
                })}
                <div ref={chatEndRef} />
            </div>
            <div className="flex items-center space-x-3">
                 <input type="file" ref={fileInputRef} onChange={(e) => setFile(e.target.files[0])} className="hidden"/>
                 <button onClick={() => fileInputRef.current.click()}><Paperclip/></button>
                 <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()} />
                 <ThemedButton onClick={handleSendMessage} icon={Send} disabled={isUploading || (!newMessage.trim() && !file)} />
             </div>
        </Card>
    );
};

export default CommunityPage;
