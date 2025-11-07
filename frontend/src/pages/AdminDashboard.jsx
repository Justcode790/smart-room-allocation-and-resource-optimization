import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { roomAPI } from '../api/room';
import { sectionAPI } from '../api/section';
import { timetableAPI } from '../api/timetable';
import { analyticsAPI } from '../api/analytics';
import { facultyAPI } from '../api/faculty';
import { studentAPI } from '../api/student';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    rooms: 0,
    sections: 0,
    timetables: 0,
    utilization: 0,
    faculty: 0,
    students: 0,
    publishedTimetables: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setError(null);
      console.log('📊 Fetching dashboard stats...');

      const [roomsRes, sectionsRes, timetablesRes, analyticsRes, facultyRes, studentsRes] = await Promise.all([
        roomAPI.getAll().catch(err => { console.error('Rooms API error:', err); return { data: [] }; }),
        sectionAPI.getAll().catch(err => { console.error('Sections API error:', err); return { data: [] }; }),
        timetableAPI.getAll().catch(err => { console.error('Timetables API error:', err); return { data: [] }; }),
        analyticsAPI.getAnalytics().catch(err => { console.error('Analytics API error:', err); return { data: { roomStats: {} } }; }),
        facultyAPI.getAll().catch(err => { console.error('Faculty API error:', err); return { data: [] }; }),
        studentAPI.getAll().catch(err => { console.error('Students API error:', err); return { data: [] }; })
      ]);

      console.log('✅ Rooms:', roomsRes.data.length);
      console.log('✅ Sections:', sectionsRes.data.length);
      console.log('✅ Timetables:', timetablesRes.data.length);
      console.log('✅ Faculty:', facultyRes.data.length);
      console.log('✅ Students:', studentsRes.data.length);

      // Calculate average utilization
      const roomStats = analyticsRes.data.roomStats || {};
      const roomStatsValues = Object.values(roomStats);
      const avgUtilization = roomStatsValues.length > 0
        ? roomStatsValues.reduce((sum, stat) => sum + (stat.utilization || 0), 0) / roomStatsValues.length
        : 0;

      // Count published timetables
      const publishedCount = timetablesRes.data.filter(t => t.isPublished).length;

      setStats({
        rooms: roomsRes.data.length || 0,
        sections: sectionsRes.data.length || 0,
        timetables: timetablesRes.data.length || 0,
        utilization: avgUtilization.toFixed(1),
        faculty: facultyRes.data.length || 0,
        students: studentsRes.data.length || 0,
        publishedTimetables: publishedCount || 0
      });

      console.log('📊 Dashboard stats updated:', {
        rooms: roomsRes.data.length,
        sections: sectionsRes.data.length,
        timetables: timetablesRes.data.length,
        faculty: facultyRes.data.length,
        students: studentsRes.data.length,
        utilization: avgUtilization.toFixed(1)
      });
    } catch (error) {
      console.error('❌ Error fetching stats:', error);
      setError('Failed to load dashboard data. Please try refreshing the page.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading dashboard data...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-xl p-8 text-white">
          <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-blue-100">Welcome back! Manage your campus resources efficiently.</p>
          {error && (
            <div className="mt-4 bg-red-500 bg-opacity-20 border border-red-300 rounded-lg p-3">
              <p className="text-sm">⚠️ {error}</p>
            </div>
          )}
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

          <div className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl shadow-xl p-6 text-white transform hover:scale-105 transition duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="text-5xl opacity-80">👨‍🏫</div>
              <div className="bg-white bg-opacity-20 rounded-full p-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
            <p className="text-teal-100 text-sm font-medium mb-1">Faculty Members</p>
            <p className="text-4xl font-bold">{stats.faculty}</p>
          </div>

          <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-2xl shadow-xl p-6 text-white transform hover:scale-105 transition duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="text-5xl opacity-80">👨‍🎓</div>
              <div className="bg-white bg-opacity-20 rounded-full p-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
            <p className="text-pink-100 text-sm font-medium mb-1">Students</p>
            <p className="text-4xl font-bold">{stats.students}</p>
          </div>
        </div>

        {/* Additional Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium mb-1">Published Timetables</p>
                <p className="text-3xl font-bold text-gray-900">{stats.publishedTimetables}</p>
                <p className="text-xs text-gray-500 mt-1">out of {stats.timetables} total</p>
              </div>
              <div className="text-4xl">✅</div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium mb-1">Active Rooms</p>
                <p className="text-3xl font-bold text-gray-900">{stats.rooms}</p>
                <p className="text-xs text-gray-500 mt-1">available for scheduling</p>
              </div>
              <div className="text-4xl">🏫</div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium mb-1">Room Utilization</p>
                <p className="text-3xl font-bold text-gray-900">{stats.utilization}%</p>
                <p className="text-xs text-gray-500 mt-1">average across all rooms</p>
              </div>
              <div className="text-4xl">📊</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <span className="mr-3">⚡</span>
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
              to="/admin/timetable-management"
              className="group relative overflow-hidden bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-xl p-6 text-white hover:from-indigo-600 hover:to-indigo-700 transition-all duration-300 shadow-lg transform hover:scale-105"
            >
              <div className="relative z-10">
                <div className="text-4xl mb-3 transform group-hover:scale-110 transition duration-300">🗂️</div>
                <div className="font-bold text-xl mb-2">Manage Timetables</div>
                <div className="text-sm opacity-90">View, delete & manage all timetables</div>
              </div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16 transform group-hover:scale-150 transition duration-500"></div>
            </Link>

            <Link
              to="/admin/timetable-editor"
              className="group relative overflow-hidden bg-gradient-to-r from-violet-500 to-violet-600 rounded-xl p-6 text-white hover:from-violet-600 hover:to-violet-700 transition-all duration-300 shadow-lg transform hover:scale-105"
            >
              <div className="relative z-10">
                <div className="text-4xl mb-3 transform group-hover:scale-110 transition duration-300">✏️</div>
                <div className="font-bold text-xl mb-2">Edit Timetable</div>
                <div className="text-sm opacity-90">Manual timetable editing</div>
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

