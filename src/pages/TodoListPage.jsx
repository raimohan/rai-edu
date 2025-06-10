import React, { useState, useContext } from 'react';
import { Plus } from 'lucide-react';
import Card from '../components/common/Card';
import ThemedButton from '../components/common/ThemedButton';
import CustomAlert from '../components/common/CustomAlert';
import { ThemeContext } from '../contexts/ThemeContext';

const TodoListPage = ({ appTasks, setAppTasks }) => {
    const [newTaskText, setNewTaskText] = useState('');
    const [newTaskDueDate, setNewTaskDueDate] = useState('');
    const { theme } = useContext(ThemeContext);
    const [showAlert, setShowAlert] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    
    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];

    const addTask = () => {
        if (newTaskText.trim() && newTaskDueDate) {
            setAppTasks(prev => [...prev, {
                id: Date.now(),
                text: newTaskText,
                completed: false,
                dueDate: newTaskDueDate
            }]);
            setNewTaskText('');
            setNewTaskDueDate('');
        } else {
            setAlertMessage('Please add task text and a due date.');
            setShowAlert(true);
        }
    };

    const toggleTask = (id) => {
        setAppTasks(prev => prev.map(task =>
            task.id === id ? { ...task, completed: !task.completed } : task
        ));
    };

    return (
        <Card title="My To-Do List" className="h-full flex flex-col">
            <div className="flex mb-4 space-x-3">
                <input type="text" placeholder="Add a new task..." value={newTaskText} onChange={(e) => setNewTaskText(e.target.value)} className="flex-1 p-3 border border-gray-300 rounded-lg"/>
                <input type="date" value={newTaskDueDate} onChange={(e) => setNewTaskDueDate(e.target.value)} className="p-3 border border-gray-300 rounded-lg" min={today} />
                <ThemedButton onClick={addTask} icon={Plus}>Add Task</ThemedButton>
            </div>
            <ul className="space-y-3 flex-1 overflow-y-auto">
                {appTasks.map(task => (
                    <li key={task.id} className="flex items-center p-3 bg-gray-50 rounded-xl shadow-sm">
                        <input type="checkbox" checked={task.completed} onChange={() => toggleTask(task.id)} className={`form-checkbox h-5 w-5 text-${theme.primary} rounded border-gray-300 mr-3`} />
                        <span className={`flex-1 text-gray-700 ${task.completed ? 'line-through text-gray-400' : ''}`}>
                            {task.text}
                        </span>
                        <span className={`text-xs ${task.dueDate < today && !task.completed ? 'text-red-500 font-bold' : 'text-gray-500'}`}>
                            {new Date(task.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                        </span>
                    </li>
                ))}
            </ul>
            {showAlert && <CustomAlert message={alertMessage} onClose={() => setShowAlert(false)} />}
        </Card>
    );
};

export default TodoListPage;