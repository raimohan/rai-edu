import React, { useState, useEffect, useContext } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../contexts/FirebaseContext';
import { ThemeContext } from '../contexts/ThemeContext';
import Card from '../components/common/Card';
import ThemedButton from '../components/common/ThemedButton';
import ConfirmationModal from '../components/common/ConfirmationModal'; // <-- नया मोडल इम्पोर्ट करें
import { Plus, Trash2, Edit, Save, X } from 'lucide-react';
import { format, isToday, isTomorrow, parseISO, isPast } from 'date-fns';

const TodoListPage = () => {
    const { db, currentUser } = useAuth();
    const { theme } = useContext(ThemeContext);
    const [tasks, setTasks] = useState([]);
    const [newTaskText, setNewTaskText] = useState('');
    const [newTaskDueDate, setNewTaskDueDate] = useState('');
    
    // एडिट और डिलीट मोडल के लिए स्टेट्स
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingTask, setEditingTask] = useState(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [taskToDeleteId, setTaskToDeleteId] = useState(null);

    // टास्क को रियल-टाइम में लाना
    useEffect(() => {
        if (!currentUser || !db) return;
        const tasksCollectionRef = collection(db, 'users', currentUser.uid, 'tasks');
        const q = query(tasksCollectionRef, orderBy('dueDate', 'asc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const tasksList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setTasks(tasksList);
        });
        return () => unsubscribe();
    }, [db, currentUser]);

    const addTask = async (e) => {
        e.preventDefault();
        if (newTaskText.trim() && newTaskDueDate && currentUser) {
            await addDoc(collection(db, 'users', currentUser.uid, 'tasks'), {
                text: newTaskText,
                completed: false,
                dueDate: newTaskDueDate,
                createdAt: serverTimestamp()
            });
            setNewTaskText('');
            setNewTaskDueDate('');
        }
    };

    const toggleTaskCompletion = async (id, currentStatus) => {
        const taskDocRef = doc(db, 'users', currentUser.uid, 'tasks', id);
        await updateDoc(taskDocRef, { completed: !currentStatus });
    };

    // डिलीट का नया तरीका
    const handleDeleteClick = (id) => {
        setTaskToDeleteId(id);
        setShowConfirmModal(true);
    };

    const confirmDeleteTask = async () => {
        if (taskToDeleteId) {
            const taskDocRef = doc(db, 'users', currentUser.uid, 'tasks', taskToDeleteId);
            await deleteDoc(taskDocRef);
        }
        setShowConfirmModal(false);
        setTaskToDeleteId(null);
    };
    
    // एडिट मोडल खोलना
    const handleEditClick = (task) => {
        setEditingTask(task);
        setShowEditModal(true);
    };

    // टास्क अपडेट करना
    const handleUpdateTask = async () => {
        if (!editingTask || !editingTask.text.trim() || !editingTask.dueDate) return;
        const taskDocRef = doc(db, 'users', currentUser.uid, 'tasks', editingTask.id);
        await updateDoc(taskDocRef, {
            text: editingTask.text,
            dueDate: editingTask.dueDate
        });
        setShowEditModal(false);
        setEditingTask(null);
    };

    // ... (तारीख के हिसाब से ग्रुपिंग का लॉजिक पहले जैसा ही)

    return (
        <>
            <Card title="My To-Do List" className="h-full flex flex-col">
                {/* ... (नया टास्क जोड़ने का फॉर्म पहले जैसा ही) ... */}
                
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                    {/* ... (टास्क लिस्ट का मैपिंग लॉजिक) ... */}
                    {tasks.length > 0 && Object.entries(groupedTasks).map(([date, tasksInGroup]) => (
                        <div key={date} className="mb-6">
                            <h3 className="font-bold text-lg ...">{date}</h3>
                            <ul className="space-y-3">
                                {tasksInGroup.map(task => {
                                    // ...
                                    return (
                                        <li key={task.id} className="flex items-center ...">
                                            {/* ... (चेकबॉक्स और टेक्स्ट) ... */}
                                            <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 ...">
                                                <button onClick={() => handleEditClick(task)} className="..."><Edit size={16} /></button>
                                                <button onClick={() => handleDeleteClick(task.id)} className="..."><Trash2 size={16} /></button>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    ))}
                </div>
            </Card>

            {/* एडिट टास्क मोडल (पहले जैसा ही) */}
            {showEditModal && editingTask && (
                // ... मोडल का JSX ...
            )}

            {/* नया डिलीट कन्फर्मेशन मोडल */}
            <ConfirmationModal
                isOpen={showConfirmModal}
                onClose={() => setShowConfirmModal(false)}
                onConfirm={confirmDeleteTask}
                title="Delete Task"
                message="Are you sure you want to permanently delete this task?"
            />
        </>
    );
};

export default TodoListPage;
