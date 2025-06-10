import React from 'react';
import Card from '../common/Card';
import { MonitorPlay } from 'lucide-react';

const VirtualClassesCard = ({ setActiveMenuItem }) => (
  <Card title="Virtual Classes" onClick={() => setActiveMenuItem('Virtual Classes')}>
    <div className="flex items-center text-gray-600">
      <MonitorPlay className="w-8 h-8 mr-4 text-red-500" />
      <div>
        <p>Join live classes and watch recordings.</p>
        <p className="font-bold text-red-600">Live now: Physics 101</p>
      </div>
    </div>
  </Card>
);

export default VirtualClassesCard;