import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../contexts/FirebaseContext'; // <-- नया हुक इम्पोर्ट करें
import Card from '../components/common/Card';
import ThemedButton from '../components/common/ThemedButton';
import { Youtube, Play, Clock, Trash2, Plus } from 'lucide-react';

const VirtualClassesPage = () => {
    // नए हुक से हमें ज़रूरत की हर चीज़ मिल जाएगी
    const { db, isAdmin } = useAuth();
    const [classes, setClasses] = useState([]);
    
    // एडमिन फॉर्म का स्टेट
    const [classType, setClassType] = useState('live');
    const [title, setTitle] = useState('');
    const [teacher, setTeacher] = useState('');
    const [time, setTime] = useState('');
    const [link, setLink] = useState('');

    // एडमिन रोल चेक करने वाला पुराना लॉजिक अब यहाँ से हटा दिया गया है।

    // क्लास की लिस्ट को रियल-टाइम में लाना
    useEffect(() => {
        if (!db) return;
        const classesRef = collection(db, 'virtual_classes');
        const q = query(classesRef, orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setClasses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return () => unsubscribe();
    }, [db]);
    
    // YouTube वीडियो ID निकालने का फंक्शन
    const getYouTubeVideoId = (url) => {
        const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
        const match = url.match(regExp);
        return (match && match[1]) ? match[1] : null;
    };

    // नई क्लास जोड़ने का फंक्शन
    const handleAddClass = async () => {
        if (!title.trim() || !link.trim() || !db) return;

        let classData = {
            type: classType,
            title,
            link,
            teacher: classType === 'live' ? teacher : 'YouTube',
            time: classType === 'live' ? time : 'On Demand',
            createdAt: serverTimestamp(),
        };

        if (classType === 'youtube') {
            const videoId = getYouTubeVideoId(link);
            if (!videoId) {
                alert("Please enter a valid YouTube video URL.");
                return;
            }
            // YouTube embed लिंक को ठीक किया गया
            classData.link = `https://www.youtube.com/embed/${videoId}?autoplay=1&modestbranding=1`;
        }

        await addDoc(collection(db, 'virtual_classes'), classData);
        // फॉर्म रीसेट करें
        setTitle(''); setTeacher(''); setTime(''); setLink('');
    };

    // क्लास डिलीट करने का फंक्शन
    const handleDeleteClass = async (id) => {
        if (!db) return;
        await deleteDoc(doc(db, "virtual_classes", id));
    };

    return (
        <Card title="Virtual Classes" className="h-full flex flex-col">
             {/* यह फॉर्म अब सिर्फ एडमिन को दिखेगा */}
             {isAdmin && (
                <div className="mb-6 p-4 bg-green-50 dark:bg-gray-800 rounded-xl">
                    <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-3">Admin Panel: Add New Class</h4>
                    <div className="grid grid-cols-2 gap-4">
                        <select value={classType} onChange={(e) => setClassType(e.target.value)} className="p-3 border border-gray-300 rounded-lg col-span-2 dark:bg-gray-700 dark:border-gray-600">
                            <option value="live">Live Class</option>
                            <option value="youtube">YouTube Video</option>
                        </select>
                        <input type="text" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} className="p-3 border border-gray-300 rounded-lg col-span-2 dark:bg-gray-700 dark:border-gray-600"/>
                        {classType === 'live' ? (
                            <>
                                <input type="text" placeholder="Teacher's Name" value={teacher} onChange={(e) => setTeacher(e.target.value)} className="p-3 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600"/>
                                <input type="text" placeholder="Time (e.g., Monday, 10 AM)" value={time} onChange={(e) => setTime(e.target.value)} className="p-3 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600"/>
                                <input type="url" placeholder="Live Class Link (Zoom, Meet, etc.)" value={link} onChange={(e) => setLink(e.target.value)} className="p-3 border border-gray-300 rounded-lg col-span-2 dark:bg-gray-700 dark:border-gray-600"/>
                            </>
                        ) : (
                            <input type="url" placeholder="YouTube Video Link" value={link} onChange={(e) => setLink(e.target.value)} className="p-3 border border-gray-300 rounded-lg col-span-2 dark:bg-gray-700 dark:border-gray-600"/>
                        )}
                    </div>
                    <ThemedButton onClick={handleAddClass} icon={Plus} className="w-full mt-4">Add Class</ThemedButton>
                </div>
            )}

            <div className="flex flex-col space-y-4 flex-1 overflow-y-auto">
                {classes.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No upcoming classes scheduled by the admin.</p>
                ) : (
                    classes.map(cls => (
                        <div key={cls.id} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl shadow-sm relative group">
                            {cls.type === 'live' ? (
                                <div className="flex items-center">
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-gray-700 dark:text-gray-200">{cls.title}</h4>
                                        <p className="text-gray-500 dark:text-gray-400 text-sm">Teacher: {cls.teacher}</p>
                                        <p className="text-gray-500 dark:text-gray-400 text-sm flex items-center"><Clock className="inline w-4 h-4 mr-1"/> {cls.time}</p>
                                    </div>
                                    <a href={cls.link} target="_blank" rel="noopener noreferrer"><ThemedButton icon={Play}>Join</ThemedButton></a>
                                </div>
                            ) : (
                                <div>
                                    <h4 className="font-semibold text-gray-700 dark:text-gray-200 mb-2 flex items-center"><Youtube className="w-5 h-5 text-red-500 mr-2"/> {cls.title}</h4>
                                    <div className="aspect-video w-full rounded-xl overflow-hidden">
                                        <iframe className="w-full h-full" src={cls.link} title={cls.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>
                                    </div>
                                </div>
                            )}
                            {isAdmin && (
                                <button onClick={() => handleDeleteClass(cls.id)} className="absolute top-2 right-2 p-2 text-red-500 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Trash2 size={18} />
                                </button>
                            )}
                        </div>
                    ))
                )}
            </div>
        </Card>
    );
};

export default VirtualClassesPage;
