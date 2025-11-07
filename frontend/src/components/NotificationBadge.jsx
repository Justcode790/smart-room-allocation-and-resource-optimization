import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { notificationAPI } from '../api/notification';
import { useSocket } from '../context/SocketContext';

const NotificationBadge = ({ className = '' }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const { socket } = useSocket();

  useEffect(() => {
    fetchUnreadCount();
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on('notification:unread-count', (data) => {
        setUnreadCount(data.unreadCount);
      });

      socket.on('notification:new', () => {
        fetchUnreadCount();
      });

      return () => {
        socket.off('notification:unread-count');
        socket.off('notification:new');
      };
    }
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
    <Link
      to="/notifications"
      className={`relative inline-flex items-center justify-center ${className}`}
    >
      <span className="text-2xl">🔔</span>
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full min-w-[18px] h-4">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </Link>
  );
};

export default NotificationBadge;