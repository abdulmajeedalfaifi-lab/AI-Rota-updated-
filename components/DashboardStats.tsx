import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Shift, ShiftStatus } from '../types';
import { useLanguage } from '../context/LanguageContext';

const COLORS = ['#10B981', '#F59E0B', '#3B82F6', '#EF4444'];

interface DashboardStatsProps {
  shifts: Shift[];
}

const DashboardStats: React.FC<DashboardStatsProps> = ({ shifts }) => {
  const { t } = useLanguage();

  const statusData = [
    { name: 'Assigned', value: shifts.filter(s => s.status === ShiftStatus.ASSIGNED).length },
    { name: 'Open', value: shifts.filter(s => s.status === ShiftStatus.OPEN).length },
    { name: 'Pending', value: shifts.filter(s => s.status === ShiftStatus.PENDING_APPROVAL).length },
  ];

  const typeData = [
    { name: 'Morning', shifts: shifts.filter(s => s.type === 'Morning').length },
    { name: 'Evening', shifts: shifts.filter(s => s.type === 'Evening').length },
    { name: 'Night', shifts: shifts.filter(s => s.type === 'Night').length },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {/* Shift Status Distribution */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-800 mb-4">{t('openShifts')} vs Assigned</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                fill="#8884d8"
                paddingAngle={5}
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-center gap-4 text-sm mt-2">
           {statusData.map((entry, index) => (
             <div key={index} className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index] }}></span>
                <span>{entry.name}: {entry.value}</span>
             </div>
           ))}
        </div>
      </div>

      {/* Shifts by Type */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Shifts by Time of Day</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={typeData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip cursor={{fill: 'transparent'}} />
              <Bar dataKey="shifts" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default DashboardStats;