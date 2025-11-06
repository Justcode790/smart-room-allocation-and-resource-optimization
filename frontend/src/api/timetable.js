import api from './axios';

export const timetableAPI = {
  generate: (sectionId) => api.post('/timetables/generate', { sectionId }),
  getAll: () => api.get('/timetables'),
  getBySection: (sectionId) => api.get(`/timetables/section/${sectionId}`),
  getFacultyTimetable: () => api.get('/timetables/faculty/my'),
  getStudentTimetable: () => api.get('/timetables/student/my'),
  update: (id, data) => api.put(`/timetables/${id}`, data),
  publish: (id) => api.post(`/timetables/${id}/publish`),
};

