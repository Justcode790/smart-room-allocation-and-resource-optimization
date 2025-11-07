import api from './axios';

export const roomSessionAPI = {
  // Start a class session
  startSession: (roomId, day, period) => 
    api.post('/room-sessions/start-session', { roomId, day, period }),
  
  // End a class session
  endSession: (roomId) => 
    api.post('/room-sessions/end-session', { roomId }),
  
  // Get faculty's current active sessions
  getMySessions: () => 
    api.get('/room-sessions/my-sessions'),
  
  // Get faculty's schedule for today
  getMySchedule: () => 
    api.get('/room-sessions/my-schedule'),
  
  // Get room status
  getRoomStatus: (roomId) => 
    api.get(`/room-sessions/${roomId}/status`),
};