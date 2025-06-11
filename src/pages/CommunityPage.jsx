import React, { useState, useContext, useEffect, useRef } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { Link } from 'react-router-dom'; // <-- Link को इम्पोर्ट करें
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

    // ... (बाकी सभी functions जैसे useEffect, handleSendMessage, deleteMessage, clearChat पहले जैसे ही रहेंगे) ...

    return (
        <Card title="Community Hub" className="h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <p className="text-gray-600 dark:text-gray-400">Share your thoughts and connect with others!</p>
                {isAdmin && (
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
                            {/* --- यहाँ बदलाव किया गया है --- */}
                            <Link to={`/profile/${msg.userId}`} title={`View ${msg.username}'s profile`}>
                                <UserAvatar username={msg.username} />
                            </Link>
                            <div className={`p-3 rounded-lg max-w-[70%] break-words ${isCurrentUser ? `bg-${theme.primary} text-white` : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200'}`}>
                                {!isCurrentUser && (
                                    // --- और यहाँ भी बदलाव किया गया है ---
                                    <Link to={`/profile/${msg.userId}`} className={`font-bold text-sm text-${theme.primary} mb-1 block hover:underline`}>
                                        {msg.username}
                                    </Link>
                                )}
                                
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

            {/* ... (बाकी का JSX पहले जैसा ही रहेगा) ... */}
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
