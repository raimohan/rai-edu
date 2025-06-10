import React, { useState, useContext, useEffect } from 'react';
import { collection, doc, getDoc, query, orderBy, onSnapshot, addDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { FirebaseContext } from '../contexts/FirebaseContext';
import Card from '../components/common/Card';
import ThemedButton from '../components/common/ThemedButton';
import { Youtube, Play, Clock, Trash2, Plus } from 'lucide-react';

const VirtualClassesPage = () => {
    const { db, user } = useContext(FirebaseContext);
    const [classes, setClasses] = useState([]);
    const [userRole, setUserRole] = useState('user');
    
    // Admin form state
    const [classType, setClassType] = useState('live');
    const [title, setTitle] = useState('');
    const [teacher, setTeacher] = useState('');
    const [time, setTime] = useState('');
    const [link, setLink] = useState('');

    useEffect(() => {
        const checkUserRole = async () => {
            if (user) {
                const userDocRef = doc(db, 'users', user.uid);
                const userDocSnap = await getDoc(userDocRef);
                if (userDocSnap.exists() && userDocSnap.data().role === 'admin') {
                    setUserRole('admin');
                }
            }
        };
        checkUserRole();
    }, [user, db]);

    useEffect(() => {
        if (!db) return;
        const classesRef = collection(db, 'virtual_classes');
        const q = query(classesRef, orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setClasses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return () => unsubscribe();
    }, [db]);
    
    const getYouTubeVideoId = (url) => {
        const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
        const match = url.match(regExp);
        return (match && match[1]) ? match[1] : null;
    };

    const handleAddClass = async () => {
        if (!title.trim() || !link.trim()) {
            alert("Title aur Link zaroori hai.");
            return;
        }

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
            classData.link = `https://www.youtube.com/embed/${videoId}?autoplay=1&modestbranding=1`;
        }

        await addDoc(collection(db, 'virtual_classes'), classData);
        // Reset form
        setTitle(''); setTeacher(''); setTime(''); setLink('');
    };

    const handleDeleteClass = async (id) => {
        await deleteDoc(doc(db, "virtual_classes", id));
    };

    return (
        <Card title="Virtual Classes" className="h-full flex flex-col">
             {userRole === 'admin' && (
                <div className="mb-6 p-4 bg-green-50 rounded-xl">
                    <h4 className="font-semibold text-gray-700 mb-3">Admin Panel: Add New Class</h4>
                    <div className="grid grid-cols-2 gap-4">
                        <select value={classType} onChange={(e) => setClassType(e.target.value)} className="p-3 border border-gray-300 rounded-lg col-span-2">
                            <option value="live">Live Class</option>
                            <option value="youtube">YouTube Video</option>
                        </select>
                        <input type="text" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} className="p-3 border border-gray-300 rounded-lg col-span-2"/>
                        {classType === 'live' ? (
                            <>
                                <input type="text" placeholder="Teacher's Name" value={teacher} onChange={(e) => setTeacher(e.target.value)} className="p-3 border border-gray-300 rounded-lg"/>
                                <input type="text" placeholder="Time (e.g., Monday, 10 AM)" value={time} onChange={(e) => setTime(e.target.value)} className="p-3 border border-gray-300 rounded-lg"/>
                                <input type="url" placeholder="Live Class Link (Zoom, Meet, etc.)" value={link} onChange={(e) => setLink(e.target.value)} className="p-3 border border-gray-300 rounded-lg col-span-2"/>
                            </>
                        ) : (
                            <input type="url" placeholder="YouTube Video Link" value={link} onChange={(e) => setLink(e.target.value)} className="p-3 border border-gray-300 rounded-lg col-span-2"/>
                        )}
                    </div>
                    <ThemedButton onClick={handleAddClass} icon={Plus} className="w-full mt-4">Add Class</ThemedButton>
                </div>
            )}

            <div className="flex flex-col space-y-4 flex-1 overflow-y-auto">
                {classes.map(cls => (
                    <div key={cls.id} className="p-4 bg-gray-50 rounded-xl shadow-sm relative group">
                        {cls.type === 'live' ? (
                             <div className="flex items-center">
                                <div className="flex-1">
                                    <h4 className="font-semibold text-gray-700">{cls.title}</h4>
                                    <p className="text-gray-500 text-sm">Teacher: {cls.teacher}</p>
                                    <p className="text-gray-500 text-sm"><Clock className="inline w-4 h-4 mr-1"/> {cls.time}</p>
                                </div>
                                <a href={cls.link} target="_blank" rel="noopener noreferrer"><ThemedButton icon={Play}>Join</ThemedButton></a>
                             </div>
                        ) : (
                            <div>
                                <h4 className="font-semibold text-gray-700 mb-2 flex items-center"><Youtube className="w-5 h-5 text-red-500 mr-2"/> {cls.title}</h4>
                                <div className="aspect-video w-full rounded-xl overflow-hidden">
                                    <iframe className="w-full h-full" src={cls.link} title={cls.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>
                                </div>
                            </div>
                        )}
                        {userRole === 'admin' && (
                            <button onClick={() => handleDeleteClass(cls.id)} className="absolute top-2 right-2 p-2 text-red-500 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity">
                                <Trash2 size={18} />
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </Card>
    );
};

export default VirtualClassesPage;
        
