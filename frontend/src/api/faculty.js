import api from './axios';

export const facultyAPI = {
  getAll: () => api.get('/faculty'),
  create: (data) => api.post('/faculty', data),
  update: (id, data) => api.put(`/faculty/${id}`, data),
};

