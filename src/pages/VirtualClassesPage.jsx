import React, { useState } from 'react';
import { Youtube, Play, Clock } from 'lucide-react';
import Card from '../components/common/Card';
import ThemedButton from '../components/common/ThemedButton';
import CustomAlert from '../components/common/CustomAlert';

const VirtualClassesPage = () => {
    const [youtubeLink, setYoutubeLink] = useState('');
    const [classes, setClasses] = useState([
        { id: 1, type: 'live', title: 'Physics 101: Kinematics', teacher: 'Priya Mehta', time: 'Monday, 10:00 AM' },
        { id: 2, type: 'live', title: 'English Literature: Shakespeare', teacher: 'Sameer Kumar', time: 'Wednesday, 2:00 PM' },
    ]);
    const [showAlert, setShowAlert] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');

    const getYouTubeVideoId = (url) => {
        const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
        const match = url.match(regExp);
        return (match && match[1]) ? match[1] : null;
    };

    const addYouTubeClass = () => {
        const videoId = getYouTubeVideoId(youtubeLink);
        if (videoId) {
            setClasses([...classes, {
                id: Date.now(),
                type: 'youtube',
                title: `YouTube Class`,
                link: `https://www.youtube.com/embed/${videoId}?autoplay=1&modestbranding=1`,
            }]);
            setYoutubeLink('');
        } else {
            setAlertMessage('Please enter a valid YouTube video URL.');
            setShowAlert(true);
        }
    };

    return (
        <Card title="My Virtual Classes" className="h-full flex flex-col">
            <div className="mb-6 p-4 bg-red-50 rounded-xl">
                <h4 className="font-semibold text-gray-700 mb-2">Add YouTube Class</h4>
                <div className="flex space-x-3">
                    <input type="text" placeholder="Paste YouTube link..." value={youtubeLink} onChange={(e) => setYoutubeLink(e.target.value)} className="flex-1 p-3 border border-gray-300 rounded-lg"/>
                    <ThemedButton onClick={addYouTubeClass} className="bg-red-500 hover:bg-red-600" icon={Youtube}>Add</ThemedButton>
                </div>
            </div>
            <div className="flex flex-col space-y-4 flex-1 overflow-y-auto">
                {classes.map(cls => (
                    <div key={cls.id} className="p-4 bg-gray-50 rounded-xl shadow-sm">
                        {cls.type === 'live' ? (
                             <div className="flex items-center">
                                <div className="flex-1">
                                    <h4 className="font-semibold text-gray-700">{cls.title}</h4>
                                    <p className="text-gray-500 text-sm">Teacher: {cls.teacher}</p>
                                    <p className="text-gray-500 text-sm"><Clock className="inline w-4 h-4 mr-1"/> {cls.time}</p>
                                </div>
                                <ThemedButton icon={Play}>Join</ThemedButton>
                             </div>
                        ) : (
                            <div>
                                <h4 className="font-semibold text-gray-700 mb-2 flex items-center"><Youtube className="w-5 h-5 text-red-500 mr-2"/> {cls.title}</h4>
                                <div className="aspect-video w-full rounded-xl overflow-hidden">
                                    <iframe className="w-full h-full" src={cls.link} title={cls.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
            {showAlert && <CustomAlert message={alertMessage} onClose={() => setShowAlert(false)} />}
        </Card>
    );
};

export default VirtualClassesPage;