import api from './axios';

export const studentAPI = {
  // Get student dashboard data
  getDashboard: () => api.get('/students/dashboard'),
  
  // Get student's timetable
  getTimetable: () => api.get('/students/timetable'),
  
  // Get student profile
  getProfile: () => api.get('/students/profile'),
  
  // Update student profile
  updateProfile: (profileData) => api.put('/students/profile', profileData),
  
  // Get attendance summary
  getAttendance: (startDate, endDate, subjectId) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (subjectId) params.append('subjectId', subjectId);
    
    return api.get(`/students/attendance?${params.toString()}`);
  },
};