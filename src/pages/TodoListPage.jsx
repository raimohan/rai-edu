import React, { useState, useEffect, useContext } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../contexts/FirebaseContext'; // <-- नया हुक इम्पोर्ट करें
import { ThemeContext } from '../contexts/ThemeContext';
import Card from '../components/common/Card';
import ThemedButton from '../components/common/ThemedButton';
import { Plus, Trash2, Edit } from 'lucide-react';
import { format, isToday, isTomorrow, parseISO } from 'date-fns';

const TodoListPage = () => {
    const { db, currentUser } = useAuth(); // <-- useAuth() का इस्तेमाल करें
    const { theme } = useContext(ThemeContext);
    const [tasks, setTasks] = useState([]);
    const [newTaskText, setNewTaskText] = useState('');
    const [newTaskDueDate, setNewTaskDueDate] = useState('');

    // Firestore से tasks को real-time में fetch करना
    useEffect(() => {
        if (!currentUser || !db) return; // currentUser और db के उपलब्ध होने तक प्रतीक्षा करें
        // हर यूजर के लिए अलग tasks का रास्ता
        const tasksCollectionRef = collection(db, 'users', currentUser.uid, 'tasks');
        const q = query(tasksCollectionRef, orderBy('dueDate', 'asc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const tasksList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setTasks(tasksList);
        });

        return () => unsubscribe();
    }, [db, currentUser]); // Dependency में user की जगह currentUser

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

    const deleteTask = async (id) => {
        if (window.confirm("Are you sure you want to delete this task?")) {
            const taskDocRef = doc(db, 'users', currentUser.uid, 'tasks', id);
            await deleteDoc(taskDocRef);
        }
    };
    
    // Tasks को date के हिसाब से group करने का logic
    const groupedTasks = tasks.reduce((acc, task) => {
        const date = parseISO(task.dueDate);
        let groupName;
        if (isToday(date)) {
            groupName = 'Today';
        } else if (isTomorrow(date)) {
            groupName = 'Tomorrow';
        } else {
            groupName = format(date, 'MMMM d, yyyy');
        }
        
        if (!acc[groupName]) {
            acc[groupName] = [];
        }
        acc[groupName].push(task);
        return acc;
    }, {});

    return (
        <Card title="My To-Do List" className="h-full flex flex-col">
            <p className="text-gray-600 dark:text-gray-400 mb-4">Apne din ko organize karein aur important kaam poore karein!</p>
            <form onSubmit={addTask} className="flex flex-col md:flex-row mb-4 space-y-3 md:space-y-0 md:space-x-3">
                <input
                    type="text"
                    placeholder="Naya task add karein..."
                    value={newTaskText}
                    onChange={(e) => setNewTaskText(e.target.value)}
                    className="flex-1 p-3 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    required
                />
                <input
                    type="date"
                    value={newTaskDueDate}
                    onChange={(e) => setNewTaskDueDate(e.target.value)}
                    className="p-3 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    required
                />
                <ThemedButton type="submit" className="md:w-auto" icon={Plus}>
                    Add Task
                </ThemedButton>
            </form>
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                {Object.keys(groupedTasks).length === 0 ? (
                    <p className="text-center text-gray-500 py-8">Aapke paas koi pending task nahi hai. Great job!</p>
                ) : (
                    Object.entries(groupedTasks).map(([date, tasksInGroup]) => (
                        <div key={date} className="mb-6">
                            <h3 className="font-bold text-lg mb-2 text-gray-700 dark:text-gray-300 border-b pb-1 border-gray-200 dark:border-gray-700">{date}</h3>
                            <ul className="space-y-3">
                                {tasksInGroup.map(task => (
                                    <li key={task.id} className="flex items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-xl shadow-sm group">
                                        <input
                                            type="checkbox"
                                            checked={task.completed}
                                            onChange={() => toggleTaskCompletion(task.id, task.completed)}
                                            className={`form-checkbox h-5 w-5 text-${theme.primary} rounded border-gray-300 dark:bg-gray-900 dark:border-gray-600 mr-3 flex-shrink-0`}
                                        />
                                        <span className={`flex-1 text-gray-700 dark:text-gray-300 ${task.completed ? 'line-through text-gray-400' : ''}`}>
                                            {task.text}
                                        </span>
                                        <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button className="text-gray-400 hover:text-blue-500"><Edit size={16} /></button>
                                            <button onClick={() => deleteTask(task.id)} className="text-gray-400 hover:text-red-500"><Trash2 size={16} /></button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))
                )}
            </div>
        </Card>
    );
};

export default TodoListPage;
