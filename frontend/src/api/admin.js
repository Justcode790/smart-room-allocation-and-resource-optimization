import api from './axios';

export const adminAPI = {
  // Get all students
  getAllStudents: () => api.get('/admin/students'),
  
  // Get all faculty
  getAllFaculty: () => api.get('/admin/faculty'),
  
  // Create student account manually
  createStudent: (data) => api.post('/admin/create-student', data),
  
  // Create faculty account manually
  createFaculty: (data) => api.post('/admin/create-faculty', data),
  
  // Upload students CSV
  uploadStudentsCSV: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/admin/upload-students', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  // Upload faculty CSV
  uploadFacultyCSV: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/admin/upload-faculty', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

