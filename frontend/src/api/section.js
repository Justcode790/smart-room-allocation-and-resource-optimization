import api from './axios';

export const sectionAPI = {
  getAll: () => api.get('/sections'),
  create: (data) => api.post('/sections', data),
  update: (id, data) => api.put(`/sections/${id}`, data),
};

