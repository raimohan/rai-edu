import React, { useState, useContext, useEffect, useRef } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { FirebaseContext } from '../contexts/FirebaseContext';
import { ThemeContext } from '../contexts/ThemeContext';
import Card from '../components/common/Card';
import ThemedButton from '../components/common/ThemedButton';
import { MessageSquare } from 'lucide-react';
import LoadingAnimation from '../components/common/LoadingAnimation';

const CommunityPage = () => {
    const { db, user } = useContext(FirebaseContext);
    const { theme } = useContext(ThemeContext);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const chatEndRef = useRef(null);

    useEffect(() => {
        if (!db) return;
        const messagesRef = collection(db, 'community_messages');
        const q = query(messagesRef, orderBy('timestamp'));

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

    const sendMessage = async () => {
        if (!newMessage.trim() || !user) return;
        await addDoc(collection(db, 'community_messages'), {
            userId: user.uid,
            username: user.displayName || user.email,
            messageText: newMessage,
            timestamp: serverTimestamp(),
        });
        setNewMessage('');
    };

    return (
        <Card title="Community Chat" className="h-full flex flex-col">
            <div className="flex-1 flex flex-col bg-gray-50 p-4 rounded-xl shadow-inner overflow-y-auto mb-4">
                {loading ? <LoadingAnimation /> : messages.map(msg => (
                    <div key={msg.id} className={`flex my-2 ${msg.userId === user.uid ? 'justify-end' : 'justify-start'}`}>
                        <div className={`p-3 rounded-xl max-w-[70%] ${msg.userId === user.uid ? `bg-${theme.primary} text-white` : 'bg-white text-gray-800'}`}>
                            <div className={`font-semibold text-sm`}>{msg.username}</div>
                            <p className="text-sm">{msg.messageText}</p>
                            <div className={`text-xs mt-1 text-right ${msg.userId === user.uid ? 'text-gray-200' : 'text-gray-500'}`}>
                                {msg.timestamp}
                            </div>
                        </div>
                    </div>
                ))}
                <div ref={chatEndRef} />
            </div>
            <div className="flex space-x-3">
                <input type="text" placeholder="Type your message..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && sendMessage()} className="flex-1 p-3 border border-gray-300 rounded-lg" />
                <ThemedButton onClick={sendMessage} icon={MessageSquare}>Send</ThemedButton>
            </div>
        </Card>
    );
};

export default CommunityPage;