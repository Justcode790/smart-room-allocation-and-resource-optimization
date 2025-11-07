import api from './axios';

export const timetableAPI = {
  checkDataSufficiency: (sectionId) => api.get(`/timetables/check-data/${sectionId}`),
  generate: (sectionId) => api.post('/timetables/generate', { sectionId }, { timeout: 120000 }), // 2 minutes for single section
  generateAll: () => api.post('/timetables/generate-all', {}, { timeout: 300000 }), // 5 minutes for all sections
  getAll: () => api.get('/timetables'),
  getMine: () => api.get('/timetables/generated-by/me'),
  getBySection: (sectionId) => api.get(`/timetables/section/${sectionId}`),
  getHistory: (sectionId) => api.get(`/timetables/section/${sectionId}/history`),
  getById: (id) => api.get(`/timetables/${id}`),
  getFacultyTimetable: () => api.get('/timetables/faculty/my'),
  getStudentTimetable: () => api.get('/timetables/student/my'),
  update: (id, data) => api.put(`/timetables/${id}`, data),
  publish: (id) => api.post(`/timetables/${id}/publish`),
  delete: (id) => api.delete(`/timetables/${id}`),
  deleteMultiple: (timetableIds) => api.post('/timetables/delete-multiple', { timetableIds }),
  
  // Admin Timetable Editor endpoints
  save: (data, force = false) => api.post('/timetable', { ...data, force }),
  saveSectionTimetable: (data, force = false) => api.post('/timetable/section', { ...data, force }),
  checkConflict: (params) => api.get(`/timetable/check?${params}`),
  getSmartSuggestions: (params) => api.get(`/timetable/suggestions?${params}`),
  getAdminTimetable: () => api.get('/timetable/admin'),
  getAvailableRooms: () => api.get('/timetable/available-rooms'),
  getRoomSuggestions: (params) => api.get(`/timetable/room-suggestions?${params}`),
  getPeriodTimes: () => api.get('/timetable/period-times'),
  savePeriodTimes: (periods) => api.post('/timetable/period-times', { periods }),
};

