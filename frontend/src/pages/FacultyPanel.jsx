import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import TimetableGrid from '../components/TimetableGrid';
import NotificationCard from '../components/NotificationCard';
import { timetableAPI } from '../api/timetable';
import { useSocket } from '../context/SocketContext';

const FacultyPanel = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const { socket } = useSocket();

  useEffect(() => {
    fetchSchedule();
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on('notification:new', (data) => {
        if (data.type === 'timetable_published') {
          fetchSchedule();
        }
      });
      socket.on('timetable:update', () => {
        fetchSchedule();
      });
      return () => {
        socket.off('notification:new');
        socket.off('timetable:update');
      };
    }
  }, [socket]);

  const fetchSchedule = async () => {
    try {
      const res = await timetableAPI.getFacultyTimetable();
      setSessions(res.data);
    } catch (error) {
      console.error('Error fetching schedule:', error);
    } finally {
      setLoading(false);
    }
  };

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
      section: session.section
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
      <div className="px-4 py-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">My Schedule</h1>

        {sessions.length > 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <TimetableGrid timetable={timetable} />
            
            <div className="mt-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Classes</h2>
              <div className="space-y-3">
                {sessions
                  .filter(s => {
                    const now = new Date();
                    const dayIndex = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].indexOf(s.day);
                    const todayIndex = (now.getDay() + 6) % 7; // Convert Sunday=0 to Monday=0
                    return dayIndex >= todayIndex;
                  })
                  .slice(0, 5)
                  .map((session, idx) => (
                    <div key={idx} className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-semibold text-gray-900">{session.subjectRef?.name}</div>
                          <div className="text-sm text-gray-600 mt-1">
                            {session.day} - Period {session.period} ({session.startTime} - {session.endTime})
                          </div>
                          <div className="text-sm text-gray-600">
                            Room: {session.roomRef?.code} | Section: {session.section?.name}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <p className="text-gray-600">No schedule assigned yet.</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default FacultyPanel;

