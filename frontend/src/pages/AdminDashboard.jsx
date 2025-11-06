import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { roomAPI } from '../api/room';
import { sectionAPI } from '../api/section';
import { timetableAPI } from '../api/timetable';
import { analyticsAPI } from '../api/analytics';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    rooms: 0,
    sections: 0,
    timetables: 0,
    utilization: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [roomsRes, sectionsRes, timetablesRes, analyticsRes] = await Promise.all([
        roomAPI.getAll(),
        sectionAPI.getAll(),
        timetableAPI.getAll(),
        analyticsAPI.getAnalytics()
      ]);

      const avgUtilization = analyticsRes.data.suggestions?.length > 0
        ? Object.values(analyticsRes.data.roomStats || {}).reduce((sum, stat) => sum + stat.utilization, 0) / Object.keys(analyticsRes.data.roomStats || {}).length
        : 0;

      setStats({
        rooms: roomsRes.data.length,
        sections: sectionsRes.data.length,
        timetables: timetablesRes.data.length,
        utilization: avgUtilization.toFixed(1)
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-1">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-xl p-8 text-white">
          <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-blue-100">Welcome back! Manage your campus resources efficiently.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-xl p-6 text-white transform hover:scale-105 transition duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="text-5xl opacity-80">🏫</div>
              <div className="bg-white bg-opacity-20 rounded-full p-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
            <p className="text-blue-100 text-sm font-medium mb-1">Total Rooms</p>
            <p className="text-4xl font-bold">{stats.rooms}</p>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-xl p-6 text-white transform hover:scale-105 transition duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="text-5xl opacity-80">📚</div>
              <div className="bg-white bg-opacity-20 rounded-full p-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
            </div>
            <p className="text-green-100 text-sm font-medium mb-1">Sections</p>
            <p className="text-4xl font-bold">{stats.sections}</p>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-xl p-6 text-white transform hover:scale-105 transition duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="text-5xl opacity-80">📅</div>
              <div className="bg-white bg-opacity-20 rounded-full p-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <p className="text-purple-100 text-sm font-medium mb-1">Timetables</p>
            <p className="text-4xl font-bold">{stats.timetables}</p>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl shadow-xl p-6 text-white transform hover:scale-105 transition duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="text-5xl opacity-80">📈</div>
              <div className="bg-white bg-opacity-20 rounded-full p-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
            <p className="text-orange-100 text-sm font-medium mb-1">Avg Utilization</p>
            <p className="text-4xl font-bold">{stats.utilization}%</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <span className="mr-3">⚡</span>
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link
              to="/admin/rooms"
              className="group relative overflow-hidden bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white hover:from-blue-600 hover:to-blue-700 transition-all duration-300 shadow-lg transform hover:scale-105"
            >
              <div className="relative z-10">
                <div className="text-4xl mb-3 transform group-hover:scale-110 transition duration-300">🏫</div>
                <div className="font-bold text-xl mb-2">Manage Rooms</div>
                <div className="text-sm opacity-90">View and manage room inventory</div>
              </div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16 transform group-hover:scale-150 transition duration-500"></div>
            </Link>

            <Link
              to="/admin/timetable"
              className="group relative overflow-hidden bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white hover:from-purple-600 hover:to-purple-700 transition-all duration-300 shadow-lg transform hover:scale-105"
            >
              <div className="relative z-10">
                <div className="text-4xl mb-3 transform group-hover:scale-110 transition duration-300">📅</div>
                <div className="font-bold text-xl mb-2">Generate Timetable</div>
                <div className="text-sm opacity-90">Create and manage timetables</div>
              </div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16 transform group-hover:scale-150 transition duration-500"></div>
            </Link>

            <Link
              to="/analytics"
              className="group relative overflow-hidden bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white hover:from-green-600 hover:to-green-700 transition-all duration-300 shadow-lg transform hover:scale-105"
            >
              <div className="relative z-10">
                <div className="text-4xl mb-3 transform group-hover:scale-110 transition duration-300">📈</div>
                <div className="font-bold text-xl mb-2">View Analytics</div>
                <div className="text-sm opacity-90">Room utilization insights</div>
              </div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16 transform group-hover:scale-150 transition duration-500"></div>
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AdminDashboard;

