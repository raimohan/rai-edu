import React from 'react';
import Card from '../common/Card';
import { Calendar } from 'lucide-react';

const CalendarWidgetCard = ({ setActiveMenuItem }) => (
    <Card title="Calendar" onClick={() => setActiveMenuItem('Meetings')}>
     <div className="flex items-center text-gray-600">
      <Calendar className="w-8 h-8 mr-4 text-purple-500" />
      <div>
        <p>View your deadlines and class schedule.</p>
        <p className="font-bold text-purple-600">Chemistry project due Friday</p>
      </div>
    </div>
  </Card>
);

export default CalendarWidgetCard;
