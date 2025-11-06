import api from './axios';

export const mappingAPI = {
  getAll: () => api.get('/mappings'),
  create: (data) => api.post('/mappings', data),
  delete: (id) => api.delete(`/mappings/${id}`),
};

