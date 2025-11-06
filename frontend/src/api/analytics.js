import api from './axios';

export const analyticsAPI = {
  getAnalytics: (startDate, endDate) => 
    api.get('/analytics', { params: { startDate, endDate } }),
  getRoomHistory: (roomId, days) => 
    api.get(`/analytics/room/${roomId}/history`, { params: { days } }),
};

