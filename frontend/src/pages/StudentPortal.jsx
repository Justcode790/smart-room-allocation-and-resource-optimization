import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import TimetableGrid from '../components/TimetableGrid';
import NotificationCard from '../components/NotificationCard';
import { timetableAPI } from '../api/timetable';
import { useSocket } from '../context/SocketContext';

const StudentPortal = () => {
  const [timetable, setTimetable] = useState(null);
  const [loading, setLoading] = useState(true);
  const { socket } = useSocket();

  useEffect(() => {
    fetchTimetable();
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on('notification:new', (data) => {
        if (data.type === 'timetable_published') {
          fetchTimetable();
        }
      });
      socket.on('timetable:update', () => {
        fetchTimetable();
      });
      return () => {
        socket.off('notification:new');
        socket.off('timetable:update');
      };
    }
  }, [socket]);

  const fetchTimetable = async () => {
    try {
      const res = await timetableAPI.getStudentTimetable();
      setTimetable(res.data);
    } catch (error) {
      if (error.response?.status !== 404) {
        console.error('Error fetching timetable:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const getNextClass = () => {
    if (!timetable || !timetable.schedule) return null;

    const now = new Date();
    const currentDay = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][(now.getDay() + 6) % 7];
    const currentTime = now.getHours() * 100 + now.getMinutes();

    const upcoming = timetable.schedule
      .filter(s => {
        const dayIndex = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].indexOf(s.day);
        const currentDayIndex = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].indexOf(currentDay);
        
        if (dayIndex > currentDayIndex) return true;
        if (dayIndex === currentDayIndex) {
          const [hours, minutes] = s.startTime.split(':').map(Number);
          const sessionTime = hours * 100 + minutes;
          return sessionTime > currentTime;
        }
        return false;
      })
      .sort((a, b) => {
        const dayA = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].indexOf(a.day);
        const dayB = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].indexOf(b.day);
        if (dayA !== dayB) return dayA - dayB;
        return a.period - b.period;
      })[0];

    return upcoming;
  };

  const nextClass = getNextClass();

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
        <h1 className="text-3xl font-bold text-gray-900 mb-6">My Timetable</h1>

        {nextClass && (
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">Next Class</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="text-sm opacity-90">Subject</div>
                <div className="text-lg font-semibold">{nextClass.subjectRef?.name}</div>
              </div>
              <div>
                <div className="text-sm opacity-90">Time</div>
                <div className="text-lg font-semibold">
                  {nextClass.startTime} - {nextClass.endTime}
                </div>
              </div>
              <div>
                <div className="text-sm opacity-90">Room</div>
                <div className="text-lg font-semibold">{nextClass.roomRef?.code}</div>
              </div>
            </div>
          </div>
        )}

        {timetable ? (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <TimetableGrid timetable={timetable} />
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <p className="text-gray-600">No timetable assigned yet.</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default StudentPortal;

