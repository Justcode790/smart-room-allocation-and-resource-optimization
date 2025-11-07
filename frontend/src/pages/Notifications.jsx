import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { notificationAPI } from '../api/notification';
import { useSocket } from '../context/SocketContext';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, unread, read
  const [selectedNotifications, setSelectedNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const { socket } = useSocket();

  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
  }, [filter, page]);

  useEffect(() => {
    if (socket) {
      socket.on('notification:new', (data) => {
        console.log('New notification received:', data);
        fetchNotifications();
        fetchUnreadCount();
      });

      socket.on('notification:unread-count', (data) => {
        setUnreadCount(data.unreadCount);
      });

      return () => {
        socket.off('notification:new');
        socket.off('notification:unread-count');
      };
    }
  }, [socket]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 20,
        unreadOnly: filter === 'unread' ? 'true' : undefined
      };

      const res = await notificationAPI.getNotifications(params);
      
      if (page === 1) {
        setNotifications(res.data.notifications);
      } else {
        setNotifications(prev => [...prev, ...res.data.notifications]);
      }
      
      setHasMore(res.data.hasMore);
      setUnreadCount(res.data.unreadCount);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const res = await notificationAPI.getUnreadCount();
      setUnreadCount(res.data.unreadCount);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await notificationAPI.markAsRead(notificationId);
      setNotifications(prev =>
        prev.map(n => n._id === notificationId ? { ...n, isRead: true } : n)
      );
      fetchUnreadCount();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
      alert('Error marking all notifications as read');
    }
  };

  const handleDelete = async (notificationId) => {
    if (!window.confirm('Are you sure you want to delete this notification?')) return;
    
    try {
      await notificationAPI.deleteNotification(notificationId);
      setNotifications(prev => prev.filter(n => n._id !== notificationId));
      setSelectedNotifications(prev => prev.filter(id => id !== notificationId));
      fetchUnreadCount();
    } catch (error) {
      console.error('Error deleting notification:', error);
      alert('Error deleting notification');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedNotifications.length === 0) return;
    
    if (!window.confirm(`Are you sure you want to delete ${selectedNotifications.length} notification(s)?`)) return;
    
    try {
      await notificationAPI.deleteMultiple(selectedNotifications);
      setNotifications(prev => prev.filter(n => !selectedNotifications.includes(n._id)));
      setSelectedNotifications([]);
      fetchUnreadCount();
    } catch (error) {
      console.error('Error deleting notifications:', error);
      alert('Error deleting notifications');
    }
  };

  const handleDeleteAllRead = async () => {
    const readCount = notifications.filter(n => n.isRead).length;
    if (readCount === 0) {
      alert('No read notifications to delete');
      return;
    }
    
    if (!window.confirm(`Are you sure you want to delete all ${readCount} read notification(s)?`)) return;
    
    try {
      await notificationAPI.deleteAllRead();
      setNotifications(prev => prev.filter(n => !n.isRead));
      setSelectedNotifications([]);
    } catch (error) {
      console.error('Error deleting read notifications:', error);
      alert('Error deleting read notifications');
    }
  };

  const handleSelectAll = () => {
    if (selectedNotifications.length === notifications.length) {
      setSelectedNotifications([]);
    } else {
      setSelectedNotifications(notifications.map(n => n._id));
    }
  };

  const handleSelectNotification = (notificationId) => {
    setSelectedNotifications(prev => {
      if (prev.includes(notificationId)) {
        return prev.filter(id => id !== notificationId);
      } else {
        return [...prev, notificationId];
      }
    });
  };

  const getNotificationIcon = (type) => {
    const icons = {
      timetable_published: '📢',
      timetable_deleted: '🗑️',
      timetable_generated: '✨',
      room_change: '🔄',
      session_cancelled: '❌',
      room_status_change: '🏢',
      room_idle: '💤',
      system_announcement: '📣',
      attendance_reminder: '⏰',
      general: '📬'
    };
    return icons[type] || '📬';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      urgent: 'bg-red-100 border-red-300 text-red-800',
      high: 'bg-orange-100 border-orange-300 text-orange-800',
      medium: 'bg-blue-100 border-blue-300 text-blue-800',
      low: 'bg-gray-100 border-gray-300 text-gray-800'
    };
    return colors[priority] || colors.medium;
  };

  const getTimeAgo = (date) => {
    const now = new Date();
    const diff = now - new Date(date);
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(date).toLocaleDateString();
  };

  const filteredNotifications = filter === 'read' 
    ? notifications.filter(n => n.isRead)
    : notifications;

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl shadow-xl p-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">🔔 Notifications</h1>
              <p className="text-purple-100">Stay updated with all your notifications</p>
            </div>
            {unreadCount > 0 && (
              <div className="bg-white text-purple-600 rounded-full px-6 py-3 font-bold text-2xl shadow-lg">
                {unreadCount} New
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4">
              {/* Filter Tabs */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => { setFilter('all'); setPage(1); }}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    filter === 'all'
                      ? 'bg-white text-purple-600 shadow'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => { setFilter('unread'); setPage(1); }}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    filter === 'unread'
                      ? 'bg-white text-purple-600 shadow'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Unread {unreadCount > 0 && `(${unreadCount})`}
                </button>
                <button
                  onClick={() => { setFilter('read'); setPage(1); }}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    filter === 'read'
                      ? 'bg-white text-purple-600 shadow'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Read
                </button>
              </div>

              {/* Select All */}
              {notifications.length > 0 && (
                <button
                  onClick={handleSelectAll}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition"
                >
                  {selectedNotifications.length === notifications.length ? '✓ Deselect All' : 'Select All'}
                </button>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-3">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg font-medium hover:bg-blue-200 transition"
                >
                  ✓ Mark All Read
                </button>
              )}
              
              {notifications.filter(n => n.isRead).length > 0 && (
                <button
                  onClick={handleDeleteAllRead}
                  className="px-4 py-2 bg-orange-100 text-orange-700 rounded-lg font-medium hover:bg-orange-200 transition"
                >
                  🗑️ Delete All Read
                </button>
              )}

              {selectedNotifications.length > 0 && (
                <button
                  onClick={handleBulkDelete}
                  className="px-4 py-2 bg-red-100 text-red-700 rounded-lg font-medium hover:bg-red-200 transition"
                >
                  🗑️ Delete Selected ({selectedNotifications.length})
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Notifications List */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {loading && page === 1 ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-6xl mb-4">📭</div>
              <p className="text-xl text-gray-600 mb-2">No notifications</p>
              <p className="text-gray-500">
                {filter === 'unread' 
                  ? "You're all caught up!" 
                  : filter === 'read'
                  ? 'No read notifications yet'
                  : 'You have no notifications yet'
                }
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`p-6 hover:bg-gray-50 transition ${
                    !notification.isRead ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={selectedNotifications.includes(notification._id)}
                      onChange={() => handleSelectNotification(notification._id)}
                      className="mt-1 w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    />

                    {/* Icon */}
                    <div className="text-3xl flex-shrink-0">
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className={`font-semibold text-gray-900 ${!notification.isRead ? 'font-bold' : ''}`}>
                              {notification.title}
                            </h3>
                            {!notification.isRead && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500 text-white">
                                New
                              </span>
                            )}
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(notification.priority)}`}>
                              {notification.priority}
                            </span>
                          </div>
                          <p className="text-gray-700 mb-2">{notification.message}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span>{getTimeAgo(notification.createdAt)}</span>
                            <span className="text-gray-400">•</span>
                            <span className="capitalize">{notification.type.replace(/_/g, ' ')}</span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {!notification.isRead && (
                            <button
                              onClick={() => handleMarkAsRead(notification._id)}
                              className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition"
                              title="Mark as read"
                            >
                              ✓
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(notification._id)}
                            className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition"
                            title="Delete"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Load More */}
          {hasMore && !loading && (
            <div className="p-6 text-center border-t border-gray-200">
              <button
                onClick={() => setPage(prev => prev + 1)}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg font-semibold hover:from-purple-600 hover:to-purple-700 transition shadow-lg transform hover:scale-105"
              >
                Load More
              </button>
            </div>
          )}

          {loading && page > 1 && (
            <div className="p-6 text-center border-t border-gray-200">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Notifications;