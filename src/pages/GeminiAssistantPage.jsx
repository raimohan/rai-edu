import React, { useState } from 'react';
import { Bot, User } from 'lucide-react';
import Card from '../components/common/Card';
import ThemedButton from '../components/common/ThemedButton';
import LoadingAnimation from '../components/common/LoadingAnimation';

const GeminiAssistantPage = () => {
    const [prompt, setPrompt] = useState('');
    const [loading, setLoading] = useState(false);
    const [chatHistory, setChatHistory] = useState([]); // To store conversation

    const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

    const handleSendMessage = async () => {
        if (!prompt.trim() || !GEMINI_API_KEY) {
            alert("Please enter a question. Also ensure API key is set up.");
            return;
        }

        const userMessage = { role: "user", text: prompt };
        setChatHistory(prev => [...prev, userMessage]);
        setLoading(true);
        setPrompt('');

        try {
            const apiRequestBody = {
                contents: [{ parts: [{ text: prompt }] }]
            };

            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(apiRequestBody)
            });

            if (!response.ok) {
                throw new Error(`API request failed with status ${response.status}`);
            }

            const data = await response.json();
            const botResponseText = data.candidates[0].content.parts[0].text;
            const botMessage = { role: "bot", text: botResponseText };
            setChatHistory(prev => [...prev, botMessage]);

        } catch (error) {
            console.error("Gemini API Error:", error);
            const errorMessage = { role: "bot", text: "Sorry, I couldn't get a response. Please check the API key and try again." };
            setChatHistory(prev => [...prev, errorMessage]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card title="AI Assistant (Powered by Gemini)" className="h-full flex flex-col">
            <p className="text-gray-600 mb-4">Aapke padhai se jude koi bhi sawaal poochein!</p>
            <div className="flex-1 flex flex-col space-y-4 bg-gray-50 p-4 rounded-xl shadow-inner overflow-y-auto custom-scrollbar">
                {chatHistory.length === 0 && !loading ? (
                    <p className="text-center text-gray-500 py-4">Your AI assistant is ready. Ask me anything!</p>
                ) : (
                    chatHistory.map((message, index) => (
                        <div key={index} className={`flex items-start gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {message.role === 'bot' && <Bot className="w-6 h-6 text-blue-500 flex-shrink-0"/>}
                            <div className={`p-3 rounded-xl max-w-[80%] ${message.role === 'user' ? 'bg-blue-500 text-white' : 'bg-white'}`}>
                                <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                            </div>
                            {message.role === 'user' && <User className="w-6 h-6 text-gray-600 flex-shrink-0"/>}
                        </div>
                    ))
                )}
                {loading && <div className="flex justify-center"><LoadingAnimation /></div>}
            </div>
            <div className="mt-6 flex space-x-3">
                <input
                    type="text"
                    placeholder="Type your question here..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    className="flex-1 p-3 border border-gray-300 rounded-lg"
                    disabled={loading}
                />
                <ThemedButton onClick={handleSendMessage} icon={Bot} disabled={loading}>
                    {loading ? 'Thinking...' : 'Ask'}
                </ThemedButton>
            </div>
        </Card>
    );
};

export default GeminiAssistantPage;
