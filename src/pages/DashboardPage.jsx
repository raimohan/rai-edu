import React from 'react';
import  ClassNotesCard  from '../components/dashboard/ClassNotesCard';
import  ClassMeetingsCard  from '../components/dashboard/ClassMeetingsCard';
import  CalendarWidgetCard  from '../components/dashboard/CalendarWidgetCard';
import  VirtualClassesCard  from '../components/dashboard/VirtualClassesCard';
import  SmartTodoListCard  from '../components/dashboard/SmartTodoListCard';
import  ProgressReportDashboardCard  from '../components/dashboard/ProgressReportDashboardCard';

const DashboardPage = ({ setActiveMenuItem }) => {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <ClassNotesCard setActiveMenuItem={setActiveMenuItem} />
            <ClassMeetingsCard setActiveMenuItem={setActiveMenuItem} />
            <CalendarWidgetCard setActiveMenuItem={setActiveMenuItem} />
            <VirtualClassesCard setActiveMenuItem={setActiveMenuItem} />
            <SmartTodoListCard setActiveMenuItem={setActiveMenuItem} />
            <ProgressReportDashboardCard setActiveMenuItem={setActiveMenuItem} />
        </div>
    );
};

export default DashboardPage;
