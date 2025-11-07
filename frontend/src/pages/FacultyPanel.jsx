import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import TimetableGrid from '../components/TimetableGrid';
import NotificationCard from '../components/NotificationCard';
import FacultyRoomManager from '../components/FacultyRoomManager';
import UpcomingClasses from '../components/UpcomingClasses';
import { timetableAPI } from '../api/timetable';
import { useSocket } from '../context/SocketContext';

const FacultyPanel = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('schedule');
  const { socket } = useSocket();

  const fetchSchedule = async () => {
    try {
      setLoading(true);
      const res = await timetableAPI.getFacultyTimetable();
      console.log('Faculty timetable data:', res.data);
      setSessions(res.data || []);
    } catch (error) {
      console.error('Error fetching schedule:', error);
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedule();
  }, []);

  useEffect(() => {
    if (socket) {
      const handleNotification = (data) => {
        console.log('Received notification:', data);
        if (data.type === 'timetable_published' || data.type === 'timetable_generated') {
          console.log('Timetable published/generated, refreshing schedule...');
          fetchSchedule();
        }
      };

      const handleTimetableUpdate = (data) => {
        console.log('Timetable update received:', data);
        fetchSchedule();
      };

      socket.on('notification:new', handleNotification);
      socket.on('timetable:update', handleTimetableUpdate);
      socket.on('timetable:faculty-generated', handleNotification);
      
      return () => {
        socket.off('notification:new', handleNotification);
        socket.off('timetable:update', handleTimetableUpdate);
        socket.off('timetable:faculty-generated', handleNotification);
      };
    }
  }, [socket]);

  // Group sessions by day and period to create a timetable-like structure
  const timetable = {
    schedule: sessions.map(session => ({
      day: session.day,
      period: session.period,
      startTime: session.startTime,
      endTime: session.endTime,
      subjectRef: session.subjectRef,
      facultyRef: session.facultyRef,
      roomRef: session.roomRef,
      note: session.note,
      section: session.section,
      isPublished: session.isPublished
    }))
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
      <NotificationCard />
      <div className="space-y-6">
        {/* Tab Navigation */}
        <div className="bg-white rounded-2xl shadow-xl p-2">
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab('schedule')}
              className={`flex-1 px-4 py-3 rounded-lg font-medium transition ${
                activeTab === 'schedule'
                  ? 'bg-blue-500 text-white shadow-lg'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              📅 My Schedule
            </button>
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`flex-1 px-4 py-3 rounded-lg font-medium transition ${
                activeTab === 'upcoming'
                  ? 'bg-blue-500 text-white shadow-lg'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              ⏰ Upcoming Classes
            </button>
            <button
              onClick={() => setActiveTab('rooms')}
              className={`flex-1 px-4 py-3 rounded-lg font-medium transition ${
                activeTab === 'rooms'
                  ? 'bg-blue-500 text-white shadow-lg'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              🏫 Room Management
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'schedule' && (
          <div>
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : sessions.length > 0 ? (
              <div className="space-y-6">
                {/* Summary Card */}
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
                  <h2 className="text-2xl font-bold mb-2">📅 My Teaching Schedule</h2>
                  <p className="text-blue-100">
                    You are assigned to <span className="font-bold text-xl">{sessions.length}</span> period{sessions.length !== 1 ? 's' : ''} this week
                  </p>
                  {sessions.filter(s => !s.isPublished).length > 0 && (
                    <p className="text-yellow-200 text-sm mt-2">
                      ⚠️ {sessions.filter(s => !s.isPublished).length} period{sessions.filter(s => !s.isPublished).length !== 1 ? 's' : ''} in draft timetable (not yet published)
                    </p>
                  )}
                </div>

                {/* Timetable Grid */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Weekly Timetable</h3>
                  <TimetableGrid timetable={timetable} />
                </div>
                
                {/* All Assigned Periods List */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">All Assigned Periods</h2>
                  <div className="space-y-3">
                    {sessions.map((session, idx) => {
                      const subjectName = session.subjectRef?.name || session.subjectRef?.code || 'Unknown Subject';
                      const roomCode = session.roomRef?.code || session.roomRef?.name || 'Unknown Room';
                      const sectionName = session.section?.name || 'Unknown Section';
                      
                      return (
                        <div 
                          key={idx} 
                          className={`border-l-4 p-4 rounded-lg ${
                            session.isPublished 
                              ? 'bg-blue-50 border-blue-500' 
                              : 'bg-yellow-50 border-yellow-500'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="font-bold text-gray-900 text-lg">{subjectName}</span>
                                {!session.isPublished && (
                                  <span className="px-2 py-1 bg-yellow-200 text-yellow-800 text-xs font-semibold rounded">
                                    DRAFT
                                  </span>
                                )}
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600">
                                <div>
                                  <span className="font-semibold">📅 Day:</span> {session.day}
                                </div>
                                <div>
                                  <span className="font-semibold">⏰ Period:</span> {session.period} ({session.startTime} - {session.endTime})
                                </div>
                                <div>
                                  <span className="font-semibold">🏫 Room:</span> {roomCode}
                                </div>
                                <div>
                                  <span className="font-semibold">👥 Section:</span> {sectionName}
                                </div>
                                {session.roomRef?.building && (
                                  <div>
                                    <span className="font-semibold">🏢 Building:</span> {session.roomRef.building}
                                  </div>
                                )}
                                {session.roomRef?.floor && (
                                  <div>
                                    <span className="font-semibold">📍 Floor:</span> {session.roomRef.floor}
                                  </div>
                                )}
                              </div>
                              {session.note && (
                                <div className="mt-2 text-xs text-gray-500 italic">
                                  Note: {session.note}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Upcoming Classes */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">📋 Upcoming Classes This Week</h2>
                  <div className="space-y-3">
                    {sessions
                      .filter(s => {
                        const now = new Date();
                        const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                        const dayIndex = dayOrder.indexOf(s.day);
                        const todayIndex = (now.getDay() + 6) % 7; // Convert Sunday=0 to Monday=0
                        return dayIndex >= todayIndex;
                      })
                      .sort((a, b) => {
                        const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                        const dayDiff = dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day);
                        if (dayDiff !== 0) return dayDiff;
                        return a.period - b.period;
                      })
                      .slice(0, 10)
                      .map((session, idx) => {
                        const subjectName = session.subjectRef?.name || session.subjectRef?.code || 'Unknown Subject';
                        const roomCode = session.roomRef?.code || session.roomRef?.name || 'Unknown Room';
                        const sectionName = session.section?.name || 'Unknown Section';
                        
                        return (
                          <div key={idx} className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg hover:bg-blue-100 transition">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="font-semibold text-gray-900 text-lg">{subjectName}</div>
                                <div className="text-sm text-gray-600 mt-1">
                                  📅 {session.day} - ⏰ Period {session.period} ({session.startTime} - {session.endTime})
                                </div>
                                <div className="text-sm text-gray-600 mt-1">
                                  🏫 Room: {roomCode} | 👥 Section: {sectionName}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    {sessions.filter(s => {
                      const now = new Date();
                      const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                      const dayIndex = dayOrder.indexOf(s.day);
                      const todayIndex = (now.getDay() + 6) % 7;
                      return dayIndex >= todayIndex;
                    }).length === 0 && (
                      <p className="text-gray-500 text-center py-4">No upcoming classes this week</p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-lg p-6 text-center">
                <div className="text-6xl mb-4">📅</div>
                <p className="text-gray-600 text-lg mb-2">No schedule assigned yet.</p>
                <p className="text-gray-500 text-sm">
                  Your timetable will appear here once the admin assigns you to periods.
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'upcoming' && (
          <UpcomingClasses 
            userRole="faculty" 
            showNextClass={true} 
            showTodayRemaining={true} 
            showThisWeek={true} 
          />
        )}

        {activeTab === 'rooms' && <FacultyRoomManager />}
      </div>
    </Layout>
  );
};

export default FacultyPanel;

