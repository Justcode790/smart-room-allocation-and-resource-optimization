import React from 'react';
import { Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const HeatmapChart = ({ heatmapData }) => {
  if (!heatmapData || Object.keys(heatmapData).length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No heatmap data available
      </div>
    );
  }

  // Transform data for Recharts
  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const PERIODS = [1, 2, 4, 6, 7, 8];

  const chartData = DAYS.map(day => {
    const dayData = { day };
    PERIODS.forEach(period => {
      // Get average utilization for this day/period across all rooms
      let totalUtil = 0;
      let count = 0;
      Object.values(heatmapData).forEach(roomData => {
        if (roomData[day] && roomData[day][period] !== undefined) {
          totalUtil += roomData[day][period];
          count++;
        }
      });
      dayData[`period${period}`] = count > 0 ? (totalUtil / count).toFixed(1) : 0;
    });
    return dayData;
  });

  const getColor = (value) => {
    const num = parseFloat(value) || 0;
    if (num === 0) return '#f3f4f6';
    if (num < 20) return '#dbeafe';
    if (num < 40) return '#93c5fd';
    if (num < 60) return '#60a5fa';
    if (num < 80) return '#3b82f6';
    return '#1d4ed8';
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Room Utilization Heatmap</h3>
      <ResponsiveContainer width="100%" height={400}>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr>
                <th className="px-4 py-2 bg-gray-100 border border-gray-200">Day</th>
                {PERIODS.map(p => (
                  <th key={p} className="px-4 py-2 bg-gray-100 border border-gray-200 text-center">
                    Period {p}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {chartData.map((row, idx) => (
                <tr key={idx}>
                  <td className="px-4 py-2 bg-gray-50 border border-gray-200 font-semibold">
                    {row.day}
                  </td>
                  {PERIODS.map(p => {
                    const value = row[`period${p}`];
                    return (
                      <td
                        key={p}
                        className="px-4 py-2 border border-gray-200 text-center"
                        style={{ backgroundColor: getColor(value) }}
                      >
                        <div className="font-semibold">{value}%</div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ResponsiveContainer>
      <div className="mt-4 flex items-center justify-center space-x-4">
        <div className="flex items-center">
          <div className="w-4 h-4 bg-gray-200 rounded mr-2"></div>
          <span className="text-xs text-gray-600">0%</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-blue-200 rounded mr-2"></div>
          <span className="text-xs text-gray-600">20%</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-blue-400 rounded mr-2"></div>
          <span className="text-xs text-gray-600">40%</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-blue-600 rounded mr-2"></div>
          <span className="text-xs text-gray-600">60%</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-blue-800 rounded mr-2"></div>
          <span className="text-xs text-gray-600">80%+</span>
        </div>
      </div>
    </div>
  );
};

export default HeatmapChart;

