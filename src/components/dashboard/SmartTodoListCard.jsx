import React from 'react';
import Card from '../common/Card';
import { ListTodo } from 'lucide-react';

const SmartTodoListCard = ({ setActiveMenuItem }) => (
  <Card title="To-Do List" onClick={() => setActiveMenuItem('To-Do List')}>
    <div className="flex items-center text-gray-600">
      <ListTodo className="w-8 h-8 mr-4 text-yellow-500" />
      <div>
        <p>Stay on top of your assignments and tasks.</p>
        <p className="font-bold text-yellow-600">5 Tasks Remaining</p>
      </div>
    </div>
  </Card>
);

export default SmartTodoListCard;