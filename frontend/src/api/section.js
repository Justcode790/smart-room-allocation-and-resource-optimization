import api from './axios';

export const sectionAPI = {
  getAll: () => api.get('/sections'),
  getById: (id) => api.get(`/sections/${id}`),
  create: (data) => api.post('/sections', data),
  update: (id, data) => api.put(`/sections/${id}`, data),
};

