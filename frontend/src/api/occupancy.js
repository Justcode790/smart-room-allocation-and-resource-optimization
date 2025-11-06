import api from './axios';

export const occupancyAPI = {
  getAll: () => api.get('/occupancy'),
  getByRoom: (roomId) => api.get(`/occupancy/room/${roomId}`),
  create: (data) => api.post('/occupancy', data),
  simulate: () => api.post('/occupancy/simulate'),
};

