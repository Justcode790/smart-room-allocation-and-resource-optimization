import api from './axios';

export const upcomingClassesAPI = {
  // Get upcoming classes for students
  getStudentUpcoming: () => api.get('/upcoming-classes/student/upcoming'),
  
  // Get upcoming classes for faculty
  getFacultyUpcoming: () => api.get('/upcoming-classes/faculty/upcoming'),
  
  // Get next class (works for both students and faculty)
  getNextClass: () => api.get('/upcoming-classes/next-class'),
  
  // Get today's remaining classes
  getTodayRemaining: () => api.get('/upcoming-classes/today-remaining'),
  
  // Get this week's classes
  getThisWeekClasses: () => api.get('/upcoming-classes/this-week'),
};