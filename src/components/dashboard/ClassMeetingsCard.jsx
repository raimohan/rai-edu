import React from 'react';
import Card from '../common/Card';
import { Calendar } from 'lucide-react';

const ClassMeetingsCard = ({ setActiveMenuItem }) => (
  <Card title="Class Meetings" onClick={() => setActiveMenuItem('Meetings')}>
    <div className="flex items-center text-gray-600">
      <Calendar className="w-8 h-8 mr-4 text-green-500" />
      <div>
        <p>Links to all your scheduled online meetings.</p>
        <p className="font-bold text-green-600">Next: Math @ 2 PM</p>
      </div>
    </div>
  </Card>
);

export default ClassMeetingsCard;