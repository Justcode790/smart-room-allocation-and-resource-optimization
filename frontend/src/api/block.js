import api from './axios';

export const blockAPI = {
  getAll: () => api.get('/blocks'),
  create: (data) => api.post('/blocks', data),
  addFloor: (blockId, floorNumber) => api.post(`/blocks/${blockId}/floor`, { floorNumber }),
  addRoom: (blockId, floorNumber, roomData) => api.post(`/blocks/${blockId}/floor/${floorNumber}/room`, roomData),
  getSummary: () => api.get('/blocks/summary'),
};

