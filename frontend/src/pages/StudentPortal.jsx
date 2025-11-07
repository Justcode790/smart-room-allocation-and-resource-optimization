import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import TimetableGrid from '../components/TimetableGrid';
import NotificationCard from '../components/NotificationCard';
import StudentCheckIn from '../components/StudentCheckIn';
import UpcomingClasses from '../components/UpcomingClasses';
import { studentAPI } from '../api/student';
import { useSocket } from '../context/SocketContext';

const StudentPortal = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [error, setError] = useState(null);
  const { socket } = useSocket();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on('notification:new', (data) => {
        if (data.type === 'timetable_published' || data.type === 'room_change') {
          fetchDashboardData();
        }
      });
      socket.on('timetable:update', () => {
        fetchDashboardData();
      });
      return () => {
        socket.off('notification:new');
        socket.off('timetable:update');
      };
    }
  }, [socket]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await studentAPI.getDashboard();
      setDashboardData(res.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError(error.response?.data?.error || 'Failed to load dashboard data');
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

  if (error) {
    return (
      <Layout>
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-red-800 mb-4">Error Loading Dashboard</h2>
          <p className="text-red-600 mb-6">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 transition"
          >
            Try Again
          </button>
        </div>
      </Layout>
    );
  }

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
      <NotificationCard />
      <div className="space-y-6">
        {/* Student Info Header */}
        {dashboardData?.student && (
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">Welcome, {dashboardData.student.name}!</h1>
                <p className="text-blue-100">
                  {dashboardData.student.regNumber} • {dashboardData.section?.name} • {dashboardData.section?.department}
                </p>
              </div>
              <div className="text-right">
                <div className="text-sm opacity-90">Section</div>
                <div className="text-2xl font-bold">{dashboardData.section?.name}</div>
              </div>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="bg-white rounded-2xl shadow-xl p-2">
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex-1 px-4 py-3 rounded-lg font-medium transition ${
                activeTab === 'dashboard'
                  ? 'bg-blue-500 text-white shadow-lg'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              🏠 Dashboard
            </button>
            <button
              onClick={() => setActiveTab('timetable')}
              className={`flex-1 px-4 py-3 rounded-lg font-medium transition ${
                activeTab === 'timetable'
                  ? 'bg-blue-500 text-white shadow-lg'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              📅 Timetable
            </button>
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`flex-1 px-4 py-3 rounded-lg font-medium transition ${
                activeTab === 'upcoming'
                  ? 'bg-blue-500 text-white shadow-lg'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              ⏰ Upcoming
            </button>
            <button
              onClick={() => setActiveTab('checkin')}
              className={`flex-1 px-4 py-3 rounded-lg font-medium transition ${
                activeTab === 'checkin'
                  ? 'bg-blue-500 text-white shadow-lg'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              📱 Check In
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'dashboard' && dashboardData && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Next Class */}
            {dashboardData.upcomingClasses?.nextClass && (
              <div className="bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-bold mb-4">📚 Next Class</h2>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm opacity-90">Subject: </span>
                    <span className="font-semibold">{dashboardData.upcomingClasses.nextClass.subject?.name}</span>
                  </div>
                  <div>
                    <span className="text-sm opacity-90">Time: </span>
                    <span className="font-semibold">{dashboardData.upcomingClasses.nextClass.startTime} - {dashboardData.upcomingClasses.nextClass.endTime}</span>
                  </div>
                  <div>
                    <span className="text-sm opacity-90">Room: </span>
                    <span className="font-semibold">{dashboardData.upcomingClasses.nextClass.room?.code}</span>
                  </div>
                  <div>
                    <span className="text-sm opacity-90">Faculty: </span>
                    <span className="font-semibold">{dashboardData.upcomingClasses.nextClass.faculty?.name}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Today's Remaining Classes */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">📅 Today's Remaining Classes</h2>
              {dashboardData.upcomingClasses?.remainingToday && dashboardData.upcomingClasses.remainingToday.length > 0 ? (
                <div className="space-y-3">
                  {dashboardData.upcomingClasses.remainingToday.map((cls, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{cls.subject?.name}</p>
                        <p className="text-sm text-gray-600">{cls.room?.code} • {cls.faculty?.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">Period {cls.period}</p>
                        <p className="text-sm text-gray-600">{cls.startTime} - {cls.endTime}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">🎉</div>
                  <p>No more classes today!</p>
                </div>
              )}
            </div>

            {/* Recent Attendance */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">📊 Recent Attendance</h2>
              {dashboardData.recentAttendance && dashboardData.recentAttendance.length > 0 ? (
                <div className="space-y-2">
                  {dashboardData.recentAttendance.slice(0, 5).map((record, index) => (
                    <div key={index} className="flex justify-between items-center p-2 border-b border-gray-100">
                      <div>
                        <p className="font-medium text-sm">{record.subjectId?.name}</p>
                        <p className="text-xs text-gray-600">{new Date(record.date).toLocaleDateString()}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        record.status === 'present' ? 'bg-green-100 text-green-800' :
                        record.status === 'late' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {record.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <p className="text-sm">No attendance records yet</p>
                </div>
              )}
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">📈 Quick Stats</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{dashboardData.section?.strength || 0}</div>
                  <div className="text-sm text-blue-700">Class Strength</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{dashboardData.section?.year || 0}</div>
                  <div className="text-sm text-green-700">Academic Year</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'timetable' && (
          <div>
            {dashboardData?.timetable ? (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">📅 My Timetable</h2>
                  <p className="text-gray-600">Section: {dashboardData.section?.name} • {dashboardData.section?.department}</p>
                </div>
                <TimetableGrid timetable={dashboardData.timetable} />
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-lg p-6 text-center">
                <div className="text-6xl mb-4">📅</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No Timetable Available</h3>
                <p className="text-gray-600">Your timetable hasn't been published yet. Please check back later.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'upcoming' && (
          <UpcomingClasses 
            userRole="student" 
            showNextClass={true} 
            showTodayRemaining={true} 
            showThisWeek={true} 
          />
        )}

        {activeTab === 'checkin' && <StudentCheckIn />}
      </div>
    </Layout>
  );
};

export default StudentPortal;

