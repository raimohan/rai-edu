import React, { useState, useEffect, useRef, useContext } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, deleteDoc, doc, updateDoc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { useAuth } from '../contexts/FirebaseContext';
import { ThemeContext } from '../contexts/ThemeContext';
import Card from '../components/common/Card';
import ThemedButton from '../components/common/ThemedButton';
import { MessageSquare, Paperclip, Trash2, XCircle, Send, User, Image as ImageIcon, FileText, Smile } from 'lucide-react';
import { formatRelative } from 'date-fns';
import EmojiPicker from 'emoji-picker-react'; // <-- नई लाइब्रेरी इम्पोर्ट करें

// User का अवतार बनाने के लिए एक हेल्पर कंपोनेंट
const UserAvatar = ({ username }) => {
    const initial = username?.charAt(0).toUpperCase() || <User size={20} />;
    return (
        <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center font-bold text-white flex-shrink-0">
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
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [loading, setLoading] = useState(true);
    const chatEndRef = useRef(null);
    const fileInputRef = useRef(null);

    // ... (useEffect for fetching messages remains the same) ...
    useEffect(() => {
        if (!db) return;
        const messagesRef = collection(db, 'community_messages');
        const q = query(messagesRef, orderBy('timestamp', 'asc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedMessages = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                timestamp: doc.data().timestamp ? formatRelative(doc.data().timestamp.toDate(), new Date()) : 'Just now'
            }));
            setMessages(fetchedMessages);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [db]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);


    const handleSendMessage = async () => { /* ... (This function remains the same) ... */ 
        if (!currentUser || !db) return;
        let messageData = {
            userId: currentUser.uid,
            username: currentUser.displayName || currentUser.email,
            timestamp: serverTimestamp(),
            reactions: {} // रिएक्शन के लिए खाली ऑब्जेक्ट
        };
        // फाइल अपलोड हैंडलिंग
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
                        });
                        setFile(null);
                        setIsUploading(false);
                    });
                }
            );
        } else if (newMessage.trim()) { // टेक्स्ट मैसेज हैंडलिंग
            await addDoc(collection(db, 'community_messages'), {
                ...messageData,
                messageText: newMessage,
                type: 'text',
            });
            setNewMessage('');
        }
    };
    
    // रिएक्शन हैंडल करने का नया फंक्शन
    const handleReaction = async (messageId, emoji) => {
        if (!currentUser || !db) return;
        const messageRef = doc(db, 'community_messages', messageId);
        try {
            await runTransaction(db, async (transaction) => {
                const msgDoc = await transaction.get(messageRef);
                if (!msgDoc.exists()) {
                    throw "Document does not exist!";
                }
                const reactions = msgDoc.data().reactions || {};
                if (!reactions[emoji]) {
                    reactions[emoji] = [];
                }
                const userIndex = reactions[emoji].indexOf(currentUser.uid);
                if (userIndex === -1) {
                    // Add reaction
                    reactions[emoji].push(currentUser.uid);
                } else {
                    // Remove reaction
                    reactions[emoji].splice(userIndex, 1);
                    if (reactions[emoji].length === 0) {
                        delete reactions[emoji];
                    }
                }
                transaction.update(messageRef, { reactions });
            });
        } catch (error) {
            console.error("Transaction failed: ", error);
        }
    };

    const deleteMessage = async (id) => { /* ... (This function remains the same) ... */
        if (window.confirm("Are you sure you want to delete this message?")) {
            await deleteDoc(doc(db, "community_messages", id));
        }
    };

    return (
        <Card title="Community Hub" className="h-full flex flex-col relative">
            <div className="flex-1 flex flex-col bg-gray-100 dark:bg-gray-900/50 p-4 rounded-xl shadow-inner overflow-y-auto mb-4 custom-scrollbar">
                {/* ... (Message mapping logic) ... */}
                {loading ? <div className="m-auto"><p>Loading messages...</p></div> : messages.map(msg => {
                    const isCurrentUser = msg.userId === currentUser?.uid;
                    return (
                        <div key={msg.id} className={`flex my-1 items-end gap-3 group ${isCurrentUser ? 'flex-row-reverse' : ''}`}>
                            <UserAvatar username={msg.username} />
                            <div className={`p-3 rounded-2xl max-w-[70%] relative ${isCurrentUser ? `bg-${theme.primary} text-white rounded-br-none` : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-none'}`}>
                                {/* ... (message content rendering) ... */
                                    !isCurrentUser && <div className={`font-bold text-sm text-${theme.primary} mb-1`}>{msg.username}</div>
                                }
                                {msg.type === 'text' && <p className="text-sm whitespace-pre-wrap">{msg.messageText}</p>}
                                {msg.type === 'image' && <img src={msg.fileUrl} alt={msg.fileName} className="rounded-lg mt-1 max-w-full h-auto cursor-pointer" onClick={()=> window.open(msg.fileUrl, '_blank')}/>}
                                {msg.type === 'file' && (
                                    <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 bg-gray-200 dark:bg-gray-600 rounded-lg">
                                        <FileText size={24} />
                                        <span className="text-sm font-medium truncate">{msg.fileName}</span>
                                    </a>
                                )}
                                {/* Reactions Display */}
                                {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                                    <div className="flex gap-1.5 absolute -bottom-4 left-0">
                                        {Object.entries(msg.reactions).map(([emoji, uids]) => (
                                            uids.length > 0 && <div key={emoji} className="px-2 py-0.5 bg-gray-200 dark:bg-gray-600 rounded-full text-xs shadow-md flex items-center gap-1">
                                                <span>{emoji}</span>
                                                <span className="font-bold">{uids.length}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <div className={`text-xs mt-1.5 text-right ${isCurrentUser ? 'text-gray-200/70' : 'text-gray-500/70'}`}>{msg.timestamp}</div>
                            </div>
                             {(isCurrentUser || isAdmin) && (
                                <button onClick={() => deleteMessage(msg.id)} className="text-red-400 opacity-0 group-hover:opacity-100 transition-opacity self-center mb-2">
                                    <Trash2 size={16}/>
                                </button>
                            )}
                             <div className="reaction-popup opacity-0 group-hover:opacity-100 transition-opacity self-center mb-2">
                                 <div className="flex bg-white dark:bg-gray-600 p-1 rounded-full shadow-lg">
                                     {['❤️', '👍', '😂', '😮', '😢'].map(emoji => (
                                         <button key={emoji} onClick={() => handleReaction(msg.id, emoji)} className="p-1 hover:scale-125 transition-transform">{emoji}</button>
                                     ))}
                                 </div>
                             </div>
                        </div>
                    );
                })}
                <div ref={chatEndRef} />
            </div>

            {/* ... (File upload and input area) ... */}
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
                <button title="Attach File" onClick={() => fileInputRef.current.click()} className="p-3 bg-gray-200 dark:bg-gray-700 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                    <Paperclip className="text-gray-600 dark:text-gray-300"/>
                </button>
                <div className="flex-1 relative">
                    <input type="text" placeholder="Type your message..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && !isUploading && handleSendMessage()} className="w-full p-3 pr-12 border border-gray-300 rounded-full dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-blue-500" disabled={isUploading}/>
                    <button title="Add Emoji" onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600">
                        <Smile className="text-gray-500 dark:text-gray-400"/>
                    </button>
                </div>
                <ThemedButton onClick={handleSendMessage} icon={Send} disabled={isUploading || (!newMessage.trim() && !file)} className="rounded-full !p-3" />
            </div>

            {showEmojiPicker && (
                <div className="absolute bottom-20 right-5 z-10">
                    <EmojiPicker onEmojiClick={(emojiObject) => setNewMessage(prev => prev + emojiObject.emoji)} theme={theme.darkMode ? 'dark' : 'light'} />
                </div>
            )}
        </Card>
    );
};

export default CommunityPage;
