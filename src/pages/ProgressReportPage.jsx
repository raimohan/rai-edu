import React, { useContext } from 'react';
import Card from '../components/common/Card';
import { ThemeContext } from '../contexts/ThemeContext';

const ProgressReportPage = () => {
    const { theme } = useContext(ThemeContext);
    const data = [
        { label: 'Jan', value: 70 }, { label: 'Feb', value: 85 },
        { label: 'Mar', value: 75 }, { label: 'Apr', value: 90 },
        { label: 'May', value: 80 }, { label: 'Jun', value: 95 },
    ];
    const maxValue = 100;

    return (
        <Card title="My Progress Report">
            <p className="text-gray-600 mb-4">Academic progress over the last 6 months.</p>
            <div className={`h-64 flex items-end justify-around space-x-4 p-6 bg-gradient-to-br from-${theme.light.replace('-100', '-50')} to-${theme.light} rounded-xl`}>
                {data.map((item, index) => (
                    <div key={index} className="flex flex-col items-center group w-full">
                        <span className="mb-2 text-sm font-semibold text-gray-700 opacity-0 group-hover:opacity-100">{item.value}%</span>
                        <div
                            style={{ height: `${(item.value / maxValue) * 100}%` }}
                            className={`w-full max-w-[50px] rounded-t-lg bg-${theme.primary} transition-all duration-300 ease-in-out hover:scale-y-105`}
                        ></div>
                        <span className="mt-2 text-sm text-gray-600 font-medium">{item.label}</span>
                    </div>
                ))}
            </div>
        </Card>
    );
};

export default ProgressReportPage;