import React, { useState, useContext, useEffect, useRef } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp, writeBatch, getDocs } from 'firebase/firestore';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage"; // Import getStorage
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/FirebaseContext';
import { ThemeContext } from '../contexts/ThemeContext';
import Card from '../components/common/Card';
import ThemedButton from '../components/common/ThemedButton';
import { Send, Paperclip, Trash2, XCircle, User, Image as ImageIcon, FileText, Eraser } from 'lucide-react';
import ConfirmationModal from '../components/common/ConfirmationModal';

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
    const [file, setFile] = useState(null); // State to hold the selected file
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [loading, setLoading] = useState(true);
    const chatEndRef = useRef(null);
    const fileInputRef = useRef(null); // Ref for the hidden file input

    // --- यहाँ नए स्टेट्स जोड़े गए हैं ---
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null); // 'item' ताकि यह सिर्फ मैसेज के लिए न हो

    useEffect(() => {
        if (!db) return;
        const q = query(collection(db, 'community_messages'), orderBy('timestamp', 'asc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedMessages = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                timestamp: doc.data().timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || 'now'
            }));
            setMessages(fetchedMessages);
            setLoading(false);
        });
        return unsubscribe;
    }, [db]);

    useEffect(() => {
        // Scroll to the bottom of the chat when new messages arrive
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async () => {
        if ((!newMessage.trim() && !file) || !currentUser || !db) return; // Prevent sending empty messages without file

        setLoading(true); // Disable input/button during send process

        let fileUrl = null;
        let fileName = null;

        if (file) {
            setIsUploading(true);
            const storage = getStorage(); // Initialize storage
            const storageRef = ref(storage, `community_files/${currentUser.uid}/${Date.now()}_${file.name}`);
            const uploadTask = uploadBytesResumable(storageRef, file);

            uploadTask.on('state_changed',
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    setUploadProgress(progress);
                },
                (error) => {
                    console.error("File upload failed:", error);
                    setIsUploading(false);
                    setUploadProgress(0);
                    setMessage(`Error uploading file: ${error.message}`); // Assume you have a message state
                    setLoading(false);
                },
                async () => {
                    fileUrl = await getDownloadURL(uploadTask.snapshot.ref);
                    fileName = file.name;
                    setIsUploading(false);
                    setUploadProgress(0);
                    await sendMessageToFirestore(fileUrl, fileName);
                    setLoading(false);
                }
            );
        } else {
            await sendMessageToFirestore(null, null);
            setLoading(false);
        }
    };

    const sendMessageToFirestore = async (fileUrl, fileName) => {
        try {
            await addDoc(collection(db, 'community_messages'), {
                userId: currentUser.uid,
                username: currentUser.displayName || currentUser.email.split('@')[0], // Use display name or email part
                messageText: newMessage.trim(),
                fileUrl: fileUrl,
                fileName: fileName,
                timestamp: serverTimestamp(),
            });
            setNewMessage('');
            setFile(null); // Clear selected file after sending
            if (fileInputRef.current) {
                fileInputRef.current.value = ""; // Clear file input element
            }
        } catch (error) {
            console.error("Error sending message:", error);
            // setMessage(`Error sending message: ${error.message}`); // Assume you have a message state
        }
    };

    const handleFileChange = (e) => {
        if (e.target.files[0]) {
            setFile(e.target.files[0]);
            setMessage(''); // Clear any previous messages
        }
    };

    const handleRemoveFile = () => {
        setFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = ""; // Clear the file input element
        }
        setIsUploading(false); // Reset upload state
        setUploadProgress(0); // Reset progress
    };

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
        if (!itemToDelete || !db) return;

        if (itemToDelete.type === 'message') {
            await deleteDoc(doc(db, "community_messages", itemToDelete.id));
        } else if (itemToDelete.type === 'full_chat') {
            setLoading(true); // Show loading while clearing
            const snapshot = await getDocs(collection(db, 'community_messages'));
            const batch = writeBatch(db);
            snapshot.docs.forEach((d) => batch.delete(d.ref));
            await batch.commit();
            // setLoading(false) is handled by onSnapshot's initial load when chat is empty
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
                {loading && messages.length === 0 ? ( // Only show loading spinner initially, not if messages are already loaded
                    <div className="m-auto"><p>Loading messages...</p></div>
                ) : messages.length === 0 ? (
                    <div className="m-auto text-gray-500 dark:text-gray-400">No messages yet. Be the first to say hi!</div>
                ) : (
                    messages.map(msg => {
                        const isCurrentUser = msg.userId === currentUser?.uid;
                        return (
                            <div key={msg.id} className={`flex my-2 items-start gap-3 group ${isCurrentUser ? 'flex-row-reverse' : ''}`}>
                                <Link to={`/profile/${msg.userId}`}><UserAvatar username={msg.username} /></Link>
                                <div className={`p-3 rounded-lg max-w-[70%] break-words ${isCurrentUser ? `bg-${theme.primary} text-white` : 'bg-white dark:bg-gray-700'}`}>
                                    {!isCurrentUser && (
                                        <Link to={`/profile/${msg.userId}`} className={`font-bold text-sm text-${theme.primary} mb-1 block`}>
                                            {msg.username}
                                        </Link>
                                    )}
                                    {msg.messageText && <p className={isCurrentUser ? 'text-white' : 'text-gray-800 dark:text-gray-200'}>{msg.messageText}</p>}
                                    {msg.fileUrl && (
                                        <div className="mt-2">
                                            {msg.fileUrl.match(/\.(jpeg|jpg|png|gif)$/i) ? (
                                                <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer">
                                                    <img src={msg.fileUrl} alt={msg.fileName || 'Attached image'} className="max-w-full h-auto rounded-md object-cover" style={{ maxHeight: '200px' }} />
                                                    <p className={`text-xs mt-1 truncate ${isCurrentUser ? 'text-gray-200/70' : 'text-gray-500/70'}`}>{msg.fileName}</p>
                                                </a>
                                            ) : (
                                                <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer" className={`inline-flex items-center gap-1.5 p-2 rounded-md ${isCurrentUser ? 'bg-white/20 text-white' : 'bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200'}`}>
                                                    <FileText size={16} />
                                                    <span className="text-sm truncate max-w-[150px]">{msg.fileName || 'Attached File'}</span>
                                                </a>
                                            )}
                                        </div>
                                    )}
                                    <div className={`text-xs mt-1.5 text-right ${isCurrentUser ? 'text-gray-200/70' : 'text-gray-500/70'}`}>
                                        {msg.timestamp}
                                    </div>
                                </div>
                                {(isCurrentUser || isAdmin) && (
                                    <button onClick={() => handleDeleteClick(msg.id)} className="text-red-400 opacity-0 group-hover:opacity-100"><Trash2 size={16}/></button>
                                )}
                            </div>
                        );
                    })
                )}
                <div ref={chatEndRef} />
            </div>

            {/* --- यहाँ इनपुट एरिया फिर से जोड़ा गया है --- */}
            <div className="flex flex-col bg-white dark:bg-gray-800 p-3 rounded-xl shadow-md">
                {file && (
                    <div className="flex items-center justify-between p-2 mb-2 bg-gray-100 dark:bg-gray-700 rounded-md">
                        <div className="flex items-center">
                            {file.type.startsWith('image/') ? <ImageIcon size={20} className="mr-2 text-blue-500" /> : <FileText size={20} className="mr-2 text-blue-500" />}
                            <span className="text-sm text-gray-700 dark:text-gray-300 truncate">{file.name}</span>
                        </div>
                        <button onClick={handleRemoveFile} className="text-red-500 hover:text-red-700 ml-2">
                            <XCircle size={18} />
                        </button>
                    </div>
                )}
                {isUploading && (
                    <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 mb-2">
                        <div className={`bg-${theme.primary} h-2.5 rounded-full`} style={{ width: `${uploadProgress}%` }}></div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-1">{Math.round(uploadProgress)}% uploaded</p>
                    </div>
                )}
                <div className="flex items-center gap-2">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden" // Hide the default file input
                    />
                    <button
                        onClick={() => fileInputRef.current.click()} // Trigger hidden input click
                        className={`p-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-${theme.primary} hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex-shrink-0`}
                        disabled={isUploading || loading}
                    >
                        <Paperclip size={20} />
                    </button>
                    <textarea
                        className="flex-1 p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-12 overflow-hidden custom-scrollbar"
                        placeholder="Type your message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                        rows={1} // Start with 1 row, let CSS handle overflow
                        disabled={isUploading || loading}
                    ></textarea>
                    <ThemedButton
                        onClick={handleSendMessage}
                        icon={Send}
                        className="flex-shrink-0"
                        disabled={(!newMessage.trim() && !file) || isUploading || loading} // Disable if empty or uploading/loading
                    >
                        Send
                    </ThemedButton>
                </div>
            </div>
            {/* --- इनपुट एरिया का अंत --- */}

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
