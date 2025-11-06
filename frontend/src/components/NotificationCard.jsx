import React, { useEffect, useState } from 'react';
import { useSocket } from '../context/SocketContext';

const NotificationCard = () => {
  const { socket } = useSocket();
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!socket) return;

    socket.on('notification:new', (data) => {
      setNotifications(prev => [data, ...prev.slice(0, 4)]);
      
      // Auto-remove after 5 seconds
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n !== data));
      }, 5000);
    });

    return () => {
      socket.off('notification:new');
    };
  }, [socket]);

  if (notifications.length === 0) return null;

  return (
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
  );
};

export default NotificationCard;

