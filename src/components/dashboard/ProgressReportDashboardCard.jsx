import React from 'react';
import Card from '../common/Card';
import { LineChart } from 'lucide-react';

const ProgressReportDashboardCard = ({ setActiveMenuItem }) => (
  <Card title="Progress Report" onClick={() => setActiveMenuItem('Progress Report')}>
     <div className="flex items-center text-gray-600">
      <LineChart className="w-8 h-8 mr-4 text-indigo-500" />
      <div>
        <p>Track your academic performance.</p>
        <p className="font-bold text-indigo-600">Overall: 88%</p>
      </div>
    </div>
  </Card>
);

export default ProgressReportDashboardCard;