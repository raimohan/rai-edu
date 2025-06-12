import React, { useState, useEffect, useContext } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../contexts/FirebaseContext';
import { ThemeContext } from '../contexts/ThemeContext';
import Card from '../components/common/Card';
import ThemedButton from '../components/common/ThemedButton';
import ConfirmationModal from '../components/common/ConfirmationModal';
import { Plus, Trash2, Edit, Save, X } from 'lucide-react';
import { format, isToday, isTomorrow, parseISO, isPast } from 'date-fns';

const TodoListPage = () => {
    const { db, currentUser } = useAuth();
    const { theme } = useContext(ThemeContext);
    const [tasks, setTasks] = useState([]);
    const [newTaskText, setNewTaskText] = useState('');
    const [newTaskDueDate, setNewTaskDueDate] = useState('');
    
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingTask, setEditingTask] = useState(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [taskToDeleteId, setTaskToDeleteId] = useState(null);

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
    
    const handleEditClick = (task) => {
        setEditingTask({ ...task });
        setShowEditModal(true);
    };

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

    const groupedTasks = tasks.reduce((acc, task) => {
        try {
            const date = parseISO(task.dueDate);
            let groupName = format(date, 'MMMM d, yyyy');
            if (isToday(date)) groupName = 'Today';
            if (isTomorrow(date)) groupName = 'Tomorrow';
            if (!acc[groupName]) acc[groupName] = [];
            acc[groupName].push(task);
        } catch (error) { console.error("Invalid date format:", task); }
        return acc;
    }, {});

    return (
        <>
            <Card title="My To-Do List" className="h-full flex flex-col">
                <p className="text-gray-600 dark:text-gray-400 mb-6">Organize your day and get things done!</p>
                <form onSubmit={addTask} className="flex flex-col md:flex-row mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl space-y-3 md:space-y-0 md:space-x-3">
                    <input type="text" placeholder="Add a new task..." value={newTaskText} onChange={(e) => setNewTaskText(e.target.value)} className="flex-1 p-3 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-blue-500" required />
                    <input type="date" value={newTaskDueDate} onChange={(e) => setNewTaskDueDate(e.target.value)} className="p-3 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-blue-500" required />
                    <ThemedButton type="submit" className="md:w-auto" icon={Plus}>Add Task</ThemedButton>
                </form>

                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                    {Object.keys(groupedTasks).length === 0 ? (
                        <div className="text-center py-10"><p className="text-gray-500">You have no pending tasks. Great job!</p></div>
                    ) : (
                        Object.entries(groupedTasks).map(([date, tasksInGroup]) => (
                            <div key={date} className="mb-6">
                                <h3 className="font-bold text-xl mb-3 text-gray-800 dark:text-gray-200 border-b-2 border-gray-200 dark:border-gray-700 pb-2">{date}</h3>
                                <ul className="space-y-3">
                                    {tasksInGroup.map(task => {
                                        const dueDate = parseISO(task.dueDate);
                                        const isOverdue = isPast(dueDate) && !isToday(dueDate);
                                        return (
                                            <li key={task.id} className="flex items-center p-4 bg-white dark:bg-gray-800 rounded-xl shadow-md group transition-all hover:shadow-lg">
                                                <input type="checkbox" checked={task.completed} onChange={() => toggleTaskCompletion(task.id, task.completed)} className={`peer form-checkbox h-6 w-6 text-${theme.primary} rounded-md border-gray-300 dark:bg-gray-900 dark:border-gray-600 mr-4 flex-shrink-0 focus:ring-offset-0 focus:ring-2`} />
                                                <div className="flex-1">
                                                    <p className={`font-medium text-gray-800 dark:text-gray-200 peer-checked:line-through peer-checked:text-gray-400 dark:peer-checked:text-gray-500`}>{task.text}</p>
                                                    <p className={`text-sm ${isOverdue ? 'text-red-500 font-medium' : 'text-gray-500 dark:text-gray-400'}`}>
                                                        Due: {format(dueDate, 'MMM d')}
                                                    </p>
                                                </div>
                                                <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity ml-4">
                                                    <button onClick={() => handleEditClick(task)} className="p-2 text-gray-400 hover:text-blue-500 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"><Edit size={18} /></button>
                                                    <button onClick={() => handleDeleteClick(task.id)} className="p-2 text-gray-400 hover:text-red-500 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"><Trash2 size={18} /></button>
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        ))
                    )}
                </div>
            </Card>

            {showEditModal && editingTask && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-2xl max-w-lg w-full">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Edit Task</h3>
                            <button onClick={() => setShowEditModal(false)} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><X size={22}/></button>
                        </div>
                        <div className="space-y-4">
                            <input type="text" value={editingTask.text} onChange={(e) => setEditingTask({...editingTask, text: e.target.value})} className="w-full p-3 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600" />
                            <input type="date" value={editingTask.dueDate} onChange={(e) => setEditingTask({...editingTask, dueDate: e.target.value})} className="w-full p-3 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600" />
                        </div>
                        <div className="flex justify-end mt-6">
                            <ThemedButton onClick={handleUpdateTask} icon={Save}>Save Changes</ThemedButton>
                        </div>
                    </div>
                </div>
            )}

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
