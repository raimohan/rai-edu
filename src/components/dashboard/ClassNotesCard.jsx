import React from 'react';
import Card from '../common/Card';
import { BookOpen } from 'lucide-react';

const ClassNotesCard = ({ setActiveMenuItem }) => (
  <Card title="Class Notes" onClick={() => setActiveMenuItem('Class Notes')}>
    <div className="flex items-center text-gray-600">
      <BookOpen className="w-8 h-8 mr-4 text-blue-500" />
      <div>
        <p>Your centralized hub for all class materials.</p>
        <p className="font-bold text-blue-600">3 New Notes</p>
      </div>
    </div>
  </Card>
);

export default ClassNotesCard;