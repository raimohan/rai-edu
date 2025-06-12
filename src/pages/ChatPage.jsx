import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/FirebaseContext';
import { doc, getDoc, collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { ArrowLeft, Send } from 'lucide-react';
import ThemedButton from '../components/common/ThemedButton';

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

    // दूसरे यूजर की जानकारी और चैट के मैसेज लाना
    useEffect(() => {
        if (!chatId || !db || !currentUser) return;

        // दूसरे यूजर की ID निकालें
        const participantIds = chatId.split('_');
        const otherUserId = participantIds.find(id => id !== currentUser.uid);

        // दूसरे यूजर का डेटा लाएं
        const getOtherUserData = async () => {
            const userDoc = await getDoc(doc(db, 'users', otherUserId));
            if (userDoc.exists()) {
                setOtherUser(userDoc.data());
            }
        };
        getOtherUserData();

        // मैसेज के लिए रियल-टाइम लिस्नर सेट करें
        const messagesRef = collection(db, 'chats', chatId, 'messages');
        const q = query(messagesRef, orderBy('timestamp', 'asc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedMessages = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                timestamp: doc.data().timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }));
            setMessages(fetchedMessages);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [chatId, db, currentUser]);

    // नए मैसेज आने पर नीचे स्क्रॉल करें
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // नया मैसेज भेजना
    const handleSendMessage = async () => {
        if (newMessage.trim() === '' || !db || !currentUser) return;

        const messagesRef = collection(db, 'chats', chatId, 'messages');
        await addDoc(messagesRef, {
            text: newMessage,
            senderId: currentUser.uid,
            timestamp: serverTimestamp()
        });
        setNewMessage('');
    };

    if (loading) {
        return <div className="flex justify-center items-center h-full"><p>Loading chat...</p></div>;
    }

    return (
        <div className="flex flex-col h-full bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
            {/* चैट हेडर */}
            <header className="flex items-center p-4 border-b border-gray-200 dark:border-gray-700">
                <Link to="/friends" className="p-2 mr-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                    <ArrowLeft size={20} />
                </Link>
                {otherUser && (
                    <>
                        <UserAvatar username={otherUser.username} />
                        <div className="ml-4">
                            <h2 className="font-semibold text-lg text-gray-800 dark:text-white">{otherUser.username}</h2>
                            <p className="text-xs text-green-500">Online</p>
                        </div>
                    </>
                )}
            </header>

            {/* मैसेज एरिया */}
            <main className="flex-1 p-4 overflow-y-auto custom-scrollbar bg-gray-50 dark:bg-gray-900/50">
                {messages.map(msg => {
                    const isCurrentUser = msg.senderId === currentUser.uid;
                    return (
                        <div key={msg.id} className={`flex my-2 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                            <div className={`p-3 rounded-2xl max-w-[70%] text-sm ${isCurrentUser ? 'bg-blue-500 text-white rounded-br-none' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-none'}`}>
                                <p>{msg.text}</p>
                                <p className={`text-xs mt-1.5 text-right ${isCurrentUser ? 'text-blue-100/70' : 'text-gray-500/70'}`}>{msg.timestamp}</p>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </main>

            {/* इनपुट एरिया */}
            <footer className="p-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-3">
                    <input
                        type="text"
                        placeholder="Type a message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        className="flex-1 p-3 bg-gray-100 dark:bg-gray-700 rounded-full border-transparent focus:ring-2 focus:ring-blue-500"
                    />
                    <ThemedButton onClick={handleSendMessage} disabled={!newMessage.trim()} className="rounded-full !p-3">
                        <Send size={20} />
                    </ThemedButton>
                </div>
            </footer>
        </div>
    );
};

export default ChatPage;
