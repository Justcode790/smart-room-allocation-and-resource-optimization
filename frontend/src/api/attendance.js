import api from './axios';

export const attendanceAPI = {
  // Faculty endpoints
  generateQR: (roomId, day, period) => 
    api.post('/attendance/generate-qr', { roomId, day, period }),
  
  getSessionAttendance: (sessionId) => 
    api.get(`/attendance/session/${sessionId}`),
  
  markAttendance: (sessionId, studentIds, status) => 
    api.post('/attendance/mark', { sessionId, studentIds, status }),
  
  // Student endpoints
  checkIn: (qrData, location) => 
    api.post('/attendance/checkin', { qrData, location }),
  
  getMyAttendance: (startDate, endDate, subjectId) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (subjectId) params.append('subjectId', subjectId);
    
    return api.get(`/attendance/my-attendance?${params.toString()}`);
  },
  
  // Admin endpoints
  getSessionAttendanceAdmin: (sessionId) => 
    api.get(`/attendance/session/${sessionId}/admin`),
};