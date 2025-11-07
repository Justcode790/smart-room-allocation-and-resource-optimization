import api from './axios';

export const notificationAPI = {
  // Get user notifications with pagination and filtering
  getNotifications: (params = {}) => {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.unreadOnly) queryParams.append('unreadOnly', params.unreadOnly);
    if (params.type) queryParams.append('type', params.type);
    
    const queryString = queryParams.toString();
    return api.get(`/notifications${queryString ? `?${queryString}` : ''}`);
  },

  // Get unread notification count
  getUnreadCount: () => api.get('/notifications/unread-count'),

  // Mark notification as read
  markAsRead: (id) => api.put(`/notifications/${id}/read`),

  // Mark multiple notifications as read
  markMultipleAsRead: (notificationIds) => 
    api.put('/notifications/mark-multiple-read', { notificationIds }),

  // Mark all notifications as read
  markAllAsRead: () => api.put('/notifications/mark-all-read'),

  // Delete notification
  deleteNotification: (id) => api.delete(`/notifications/${id}`),

  // Delete multiple notifications
  deleteMultiple: (notificationIds) => 
    api.delete('/notifications/delete-multiple', { data: { notificationIds } }),

  // Delete all read notifications
  deleteAllRead: () => api.delete('/notifications/delete-all-read'),

  // Admin: Create notification
  createNotification: (data) => api.post('/notifications/create', data),

  // Admin: Get notification statistics
  getStats: () => api.get('/notifications/stats')
};