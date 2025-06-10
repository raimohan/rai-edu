import React, { useState } from 'react';
import { Bot } from 'lucide-react';
import Card from '../components/common/Card';
import ThemedButton from '../components/common/ThemedButton';
import CustomAlert from '../components/common/CustomAlert';
import LoadingAnimation from '../components/common/LoadingAnimation';

const GeminiAssistantPage = () => {
    const [prompt, setPrompt] = useState('');
    const [response, setResponse] = useState('');
    const [loading, setLoading] = useState(false);
    const [showAlert, setShowAlert] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');

    const handleSendMessage = async () => {
        if (!prompt.trim()) {
            setAlertMessage('Please enter a question.');
            setShowAlert(true);
            return;
        }
        setLoading(true);
        setResponse('');
        // This is a placeholder for a real API call.
        // In a real app, you would fetch from your backend which calls the Gemini API.
        setTimeout(() => {
            setResponse(`This is a simulated response for your question about: "${prompt}". To set this up for real, you need to call the Google Gemini API from a secure backend server.`);
            setLoading(false);
            setPrompt('');
        }, 1500);
    };

    return (
        <Card title="AI Assistant (Gemini)" className="h-full flex flex-col">
            <div className="flex-1 flex flex-col space-y-4 bg-gray-50 p-4 rounded-xl shadow-inner overflow-y-auto">
                {loading && <div className="flex justify-center"><LoadingAnimation /></div>}
                {response ? (
                    <div className="bg-white p-4 rounded-xl shadow-sm">
                        <h5 className="font-semibold text-gray-800 mb-2 flex items-center"><Bot className="w-5 h-5 mr-2" /> Response:</h5>
                        <p className="text-gray-700 whitespace-pre-wrap">{response}</p>
                    </div>
                ) : (
                    <p className="text-center text-gray-500 py-4">Ask me anything about your studies!</p>
                )}
            </div>
            <div className="mt-6 flex space-x-3">
                <input
                    type="text"
                    placeholder="Type your question..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    className="flex-1 p-3 border border-gray-300 rounded-lg"
                    disabled={loading}
                />
                <ThemedButton onClick={handleSendMessage} icon={Bot} disabled={loading}>
                    Ask
                </ThemedButton>
            </div>
            {showAlert && <CustomAlert message={alertMessage} onClose={() => setShowAlert(false)} />}
        </Card>
    );
};

export default GeminiAssistantPage;