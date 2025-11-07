import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { notificationAPI } from '../api/notification';

const NotificationCard = () => {
  const { socket } = useSocket();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchUnreadCount();
  }, []);

  useEffect(() => {
    if (!socket) {
      console.log('Socket not available for notifications');
      return;
    }

    console.log('Setting up notification listeners');

    const handleNotification = (data) => {
      console.log('Received notification:', data);
      setNotifications(prev => [data, ...prev.slice(0, 4)]);
      
      // Auto-remove after 5 seconds (only for non-persistent notifications)
      if (data.persistent !== true) {
        setTimeout(() => {
          setNotifications(prev => prev.filter(n => n !== data));
        }, 5000);
      }
    };

    const handleUnreadCount = (data) => {
      setUnreadCount(data.unreadCount);
    };

    socket.on('notification:new', handleNotification);
    socket.on('notification:unread-count', handleUnreadCount);

    // Also listen for timetable updates
    socket.on('timetable:faculty-generated', (data) => {
      console.log('Received timetable:faculty-generated:', data);
      handleNotification({
        message: data.message || 'Your timetable has been generated',
        type: 'timetable_generated',
        timestamp: data.timestamp || new Date()
      });
    });

    return () => {
      console.log('Cleaning up notification listeners');
      socket.off('notification:new');
      socket.off('notification:unread-count');
      socket.off('timetable:faculty-generated');
    };
  }, [socket]);

  const fetchUnreadCount = async () => {
    try {
      const res = await notificationAPI.getUnreadCount();
      setUnreadCount(res.data.unreadCount);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  return (
    <>
      {/* Notification Bell Icon */}
      <div className="fixed top-4 right-4 z-50">
        <Link
          to="/notifications"
          className="relative inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-full shadow-lg hover:from-purple-600 hover:to-purple-700 transition transform hover:scale-110"
        >
          <span className="text-xl">🔔</span>
          {unreadCount > 0 && (
            <span className="absolute -top-2 -right-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full min-w-[20px] h-5">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Link>
      </div>

      {/* Live Notification Toasts */}
      {notifications.length > 0 && (
        <div className="fixed top-20 right-4 z-50 space-y-3 max-w-md">
          {notifications.map((notif, idx) => (
            <div
              key={idx}
              className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-2xl border-l-4 border-blue-500 p-4 animate-slide-in transform transition-all hover:scale-105"
              style={{ 
                animation: 'slideIn 0.3s ease-out',
                boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
              }}
            >
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center text-white text-lg">
                    🔔
                  </div>
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-semibold text-gray-900">{notif.message}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(notif.timestamp).toLocaleTimeString()}
                  </p>
                  <Link
                    to="/notifications"
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium mt-1 inline-block"
                  >
                    View all notifications →
                  </Link>
                </div>
                <button
                  onClick={() => setNotifications(prev => prev.filter((_, i) => i !== idx))}
                  className="text-gray-400 hover:text-gray-600 ml-2"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
};

export default NotificationCard;

