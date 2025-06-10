import React, { useState, useContext, useEffect, useRef } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { FirebaseContext } from '../contexts/FirebaseContext';
import { ThemeContext } from '../contexts/ThemeContext';
import Card from '../components/common/Card';
import ThemedButton from '../components/common/ThemedButton';
import { MessageSquare, Paperclip, Trash2, XCircle } from 'lucide-react';
import LoadingAnimation from '../components/common/LoadingAnimation';

const CommunityPage = () => {
    const { db, user } = useContext(FirebaseContext);
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
        const messagesRef = collection(db, 'community_messages');
        const q = query(messagesRef, orderBy('timestamp', 'asc')); // asc for ascending order
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedMessages = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                timestamp: doc.data().timestamp?.toDate().toLocaleString() || 'Just now'
            }));
            setMessages(fetchedMessages);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [db]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = () => {
        if (file) { // Handle file upload
            setIsUploading(true);
            const storage = getStorage();
            const storageRef = ref(storage, `chat_files/${Date.now()}_${file.name}`);
            const uploadTask = uploadBytesResumable(storageRef, file);

            uploadTask.on('state_changed', 
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    setUploadProgress(progress);
                }, 
                (error) => {
                    console.error("Upload failed:", error);
                    setIsUploading(false);
                }, 
                () => {
                    getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
                        addDoc(collection(db, 'community_messages'), {
                            userId: user.uid,
                            username: user.displayName || user.email,
                            fileUrl: downloadURL,
                            type: file.type.startsWith('image/') ? 'image' : 'file',
                            fileName: file.name,
                            timestamp: serverTimestamp(),
                        });
                        setFile(null);
                        setIsUploading(false);
                    });
                }
            );
        } else if (newMessage.trim()) { // Handle text message
            addDoc(collection(db, 'community_messages'), {
                userId: user.uid,
                username: user.displayName || user.email,
                messageText: newMessage,
                type: 'text',
                timestamp: serverTimestamp(),
            });
            setNewMessage('');
        }
    };

    const deleteMessage = async (id) => {
        if (window.confirm("Are you sure you want to delete this message?")) {
            await deleteDoc(doc(db, "community_messages", id));
        }
    };

    return (
        <Card title="Community Chat" className="h-full flex flex-col">
            <div className="flex-1 flex flex-col bg-gray-50 p-4 rounded-xl shadow-inner overflow-y-auto mb-4 custom-scrollbar">
                {loading ? <LoadingAnimation /> : messages.map(msg => (
                    <div key={msg.id} className={`flex my-2 group ${msg.userId === user.uid ? 'justify-end' : 'justify-start'}`}>
                        {msg.userId === user.uid && (
                            <button onClick={() => deleteMessage(msg.id)} className="mr-2 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Trash2 size={16}/>
                            </button>
                        )}
                        <div className={`p-3 rounded-xl max-w-[70%] ${msg.userId === user.uid ? `bg-${theme.primary} text-white` : 'bg-white text-gray-800'}`}>
                            <div className={`font-semibold text-sm`}>{msg.username}</div>
                            {msg.type === 'text' && <p className="text-sm whitespace-pre-wrap">{msg.messageText}</p>}
                            {msg.type === 'image' && <img src={msg.fileUrl} alt="uploaded content" className="rounded-lg mt-2 max-w-full h-auto"/>}
                            <div className={`text-xs mt-1 text-right ${msg.userId === user.uid ? 'text-gray-200' : 'text-gray-500'}`}>{msg.timestamp}</div>
                        </div>
                    </div>
                ))}
                <div ref={chatEndRef} />
            </div>

            {isUploading && <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2"><div className="bg-blue-600 h-2.5 rounded-full" style={{width: `${uploadProgress}%`}}></div></div>}
            
            {file && !isUploading && (
                <div className="flex items-center p-2 bg-gray-200 rounded-lg mb-2">
                    <span className="flex-1 truncate text-sm">{file.name}</span>
                    <button onClick={() => setFile(null)} className="ml-2 text-red-500"><XCircle size={20}/></button>
                </div>
            )}

            <div className="flex space-x-3">
                <input type="file" ref={fileInputRef} onChange={(e) => setFile(e.target.files[0])} className="hidden"/>
                <button onClick={() => fileInputRef.current.click()} className="p-3 bg-gray-200 rounded-lg hover:bg-gray-300"><Paperclip/></button>
                <input type="text" placeholder="Type your message..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()} className="flex-1 p-3 border border-gray-300 rounded-lg" disabled={isUploading}/>
                <ThemedButton onClick={handleSendMessage} icon={MessageSquare} disabled={isUploading}>{isUploading ? 'Uploading...' : 'Send'}</ThemedButton>
            </div>
        </Card>
    );
};

export default CommunityPage;
    
