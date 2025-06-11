import React, { useState, useContext, useEffect, useRef } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { useAuth } from '../contexts/FirebaseContext';
import { ThemeContext } from '../contexts/ThemeContext';
import Card from '../components/common/Card';
import ThemedButton from '../components/common/ThemedButton';
// 'Broom' को 'Eraser' से बदला गया
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
        if (!currentUser || !db || (!newMessage.trim() && !file)) return;

        const messageData = {
            userId: currentUser.uid,
            username: currentUser.displayName || currentUser.email,
            timestamp: serverTimestamp(),
        };

        if (file) {
            setIsUploading(true);
            const storage = getStorage();
            const storageRef = ref(storage, `community_files/${Date.now()}_${file.name}`);
            const uploadTask = uploadBytesResumable(storageRef, file);

            uploadTask.on('state_changed',
                (snapshot) => setUploadProgress((snapshot.bytesTransferred / snapshot.totalBytes) * 100),
                (error) => { console.error("Upload failed:", error); setIsUploading(false); },
                () => {
                    getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
                        addDoc(collection(db, 'community_messages'), {
                            ...messageData,
                            fileUrl: downloadURL,
                            type: file.type.startsWith('image/') ? 'image' : 'file',
                            fileName: file.name,
                            messageText: newMessage,
                        });
                        setFile(null);
                        setNewMessage('');
                        setIsUploading(false);
                    });
                }
            );
        } else {
            await addDoc(collection(db, 'community_messages'), {
                ...messageData,
                messageText: newMessage,
                type: 'text',
            });
            setNewMessage('');
        }
    };

    const deleteMessage = async (id) => {
        if (window.confirm("Are you sure you want to delete this message?")) {
            await deleteDoc(doc(db, "community_messages", id));
        }
    };
    
    // एडमिन के लिए चैट क्लियर करने का फंक्शन
    const clearChat = async () => {
        if (!db) return;
        if (window.confirm("Admin, are you sure you want to clear all messages? This action cannot be undone.")) {
            setLoading(true);
            const collectionRef = collection(db, 'community_messages');
            const q = query(collectionRef);
            const snapshot = await getDocs(q); // Use getDocs for a one-time fetch
            
            const batch = writeBatch(db);
            snapshot.docs.forEach((doc) => {
                batch.delete(doc.ref);
            });
            
            await batch.commit();
            console.log("Chat cleared successfully.");
            setLoading(false); // setLoading to false after operation
        }
    };


    return (
        <Card title="Community Hub" className="h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <p className="text-gray-600 dark:text-gray-400">Share your thoughts and connect with others!</p>
                {isAdmin && (
                    // 'Broom' को 'Eraser' से बदला गया
                    <ThemedButton onClick={clearChat} icon={Eraser} className="bg-red-500 hover:bg-red-600">
                        Clear Chat
                    </ThemedButton>
                )}
            </div>
            <div className="flex-1 flex flex-col bg-gray-100 dark:bg-gray-900/50 p-4 rounded-xl shadow-inner overflow-y-auto mb-4 custom-scrollbar">
                {loading ? <div className="m-auto"><p>Loading messages...</p></div> : messages.map(msg => {
                    const isCurrentUser = msg.userId === currentUser?.uid;
                    return (
                        <div key={msg.id} className={`flex my-2 items-start gap-3 group ${isCurrentUser ? 'flex-row-reverse justify-end' : ''}`}>
                            <UserAvatar username={msg.username} />
                            <div className={`p-3 rounded-lg max-w-[70%] break-words ${isCurrentUser ? `bg-${theme.primary} text-white` : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200'}`}>
                                {!isCurrentUser && <div className={`font-bold text-sm text-${theme.primary} mb-1`}>{msg.username}</div>}
                                
                                {msg.type === 'image' && <img src={msg.fileUrl} alt={msg.fileName} className="rounded-lg mb-1 max-w-full h-auto cursor-pointer" onClick={()=> window.open(msg.fileUrl, '_blank')}/>}
                                {msg.type === 'file' && (
                                    <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 mb-1 bg-gray-200 dark:bg-gray-600 rounded-lg">
                                        <FileText size={24} />
                                        <span className="text-sm font-medium truncate">{msg.fileName}</span>
                                    </a>
                                )}
                                {msg.messageText && <p className="text-sm whitespace-pre-wrap">{msg.messageText}</p>}
                                
                                <div className={`text-xs mt-1.5 text-right ${isCurrentUser ? 'text-gray-200/70' : 'text-gray-500/70'}`}>{msg.timestamp}</div>
                            </div>
                            {(isCurrentUser || isAdmin) && (
                                <button onClick={() => deleteMessage(msg.id)} className="text-red-400 opacity-0 group-hover:opacity-100 transition-opacity self-center">
                                    <Trash2 size={16}/>
                                </button>
                            )}
                        </div>
                    );
                })}
                <div ref={chatEndRef} />
            </div>

            {isUploading && <div className="w-full bg-gray-200 rounded-full h-1 mb-2"><div className="bg-blue-600 h-1 rounded-full" style={{width: `${uploadProgress}%`}}></div></div>}
            {file && !isUploading && (
                <div className="flex items-center justify-between p-2 pl-4 bg-gray-200 dark:bg-gray-700 rounded-lg mb-2">
                    <div className="flex items-center gap-2 overflow-hidden">
                         {file.type.startsWith('image/') ? <ImageIcon className="text-gray-600 dark:text-gray-300 flex-shrink-0" /> : <FileText className="text-gray-600 dark:text-gray-300 flex-shrink-0"/>}
                        <span className="flex-1 truncate text-sm">{file.name}</span>
                    </div>
                    <button onClick={() => setFile(null)} className="ml-2 text-red-500 hover:text-red-700"><XCircle size={20}/></button>
                </div>
            )}

            <div className="flex items-center space-x-3">
                <input type="file" ref={fileInputRef} onChange={(e) => { e.target.files[0] && setFile(e.target.files[0]); }} className="hidden"/>
                <button title="Attach File" onClick={() => fileInputRef.current.click()} className="p-3 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                    <Paperclip className="text-gray-600 dark:text-gray-300"/>
                </button>
                <input type="text" placeholder="Type a message..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && !isUploading && handleSendMessage()} className="flex-1 p-3 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-blue-500" disabled={isUploading}/>
                <ThemedButton onClick={handleSendMessage} icon={Send} disabled={isUploading || (!newMessage.trim() && !file)} />
            </div>
        </Card>
    );
};

export default CommunityPage;
