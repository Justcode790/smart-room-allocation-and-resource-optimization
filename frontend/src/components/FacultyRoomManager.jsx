import React, { useState, useEffect } from 'react';
import { roomSessionAPI } from '../api/roomSession';
import QRCodeGenerator from './QRCodeGenerator';

const FacultyRoomManager = () => {
  const [schedule, setSchedule] = useState([]);
  const [activeSessions, setActiveSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  const [showQR, setShowQR] = useState({ show: false, roomId: null, day: null, period: null });

  useEffect(() => {
    fetchData();
    // Refresh data every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [scheduleRes, sessionsRes] = await Promise.all([
        roomSessionAPI.getMySchedule(),
        roomSessionAPI.getMySessions()
      ]);

      setSchedule(scheduleRes.data || []);
      setActiveSessions(sessionsRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      showToast('Error loading data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = 'info') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000);
  };

  const handleStartSession = async (roomId, day, period) => {
    setActionLoading(`start-${roomId}-${period}`);
    try {
      await roomSessionAPI.startSession(roomId, day, period);
      showToast('Class session started successfully!', 'success');
      await fetchData(); // Refresh data
    } catch (error) {
      console.error('Error starting session:', error);
      const errorMessage = error.response?.data?.error || 'Error starting session';
      showToast(errorMessage, 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleEndSession = async (roomId) => {
    setActionLoading(`end-${roomId}`);
    try {
      await roomSessionAPI.endSession(roomId);
      showToast('Class session ended successfully!', 'success');
      await fetchData(); // Refresh data
    } catch (error) {
      console.error('Error ending session:', error);
      const errorMessage = error.response?.data?.error || 'Error ending session';
      showToast(errorMessage, 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'idle': return 'bg-green-100 text-green-800';
      case 'occupied': return 'bg-red-100 text-red-800';
      case 'reserved': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCurrentTime = () => {
    return new Date().toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-xl p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">🏫 Room Management</h1>
        <p className="text-blue-100">Manage your classroom sessions - Current time: {getCurrentTime()}</p>
      </div>

      {/* Active Sessions */}
      {activeSessions.length > 0 && (
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
            <span className="mr-3">🔴</span>
            Active Sessions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeSessions.map((session) => (
              <div key={session._id} className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-gray-900">{session.code}</h3>
                    <p className="text-sm text-gray-600">{session.name}</p>
                    <p className="text-xs text-gray-500">{session.building} - Floor {session.floor}</p>
                  </div>
                  <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                    Occupied
                  </span>
                </div>
                
                {session.currentSession && (
                  <div className="mb-4 text-sm text-gray-600">
                    <p><strong>Subject:</strong> {session.currentSession.subjectId?.name || 'N/A'}</p>
                    <p><strong>Started:</strong> {new Date(session.currentSession.startTime).toLocaleTimeString()}</p>
                    <p><strong>Ends:</strong> {new Date(session.currentSession.endTime).toLocaleTimeString()}</p>
                  </div>
                )}
                
                <button
                  onClick={() => handleEndSession(session._id)}
                  disabled={actionLoading === `end-${session._id}`}
                  className="w-full bg-red-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {actionLoading === `end-${session._id}` ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Ending...
                    </>
                  ) : (
                    <>
                      <span className="mr-2">⏹️</span>
                      End Session
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Today's Schedule */}
      <div className="bg-white rounded-2xl shadow-xl p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
          <span className="mr-3">📅</span>
          Today's Schedule
        </h2>
        
        {schedule.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-6xl mb-4">📅</div>
            <p className="text-lg">No classes scheduled for today</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {schedule.map((item) => (
              <div key={`${item.period}-${item.room?._id}`} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-gray-900">Period {item.period}</h3>
                    <p className="text-sm text-gray-600">{item.subject?.name || 'No Subject'}</p>
                  </div>
                  <span className="px-2 py-1 text-xs font-medium rounded-full">
                    Period {item.period}
                  </span>
                </div>
                
                {item.room ? (
                  <>
                    <div className="mb-4">
                      <p className="font-medium text-gray-900">{item.room.code}</p>
                      <p className="text-sm text-gray-600">{item.room.name}</p>
                      <p className="text-xs text-gray-500">{item.room.building} - Floor {item.room.floor}</p>
                      <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full mt-2 ${getStatusColor(item.room.occupancyStatus)}`}>
                        {item.room.occupancyStatus.charAt(0).toUpperCase() + item.room.occupancyStatus.slice(1)}
                      </span>
                    </div>
                    
                    {item.canStart ? (
                      <div className="space-y-2">
                        <button
                          onClick={() => handleStartSession(item.room._id, item.day, item.period)}
                          disabled={actionLoading === `start-${item.room._id}-${item.period}`}
                          className="w-full bg-green-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                          {actionLoading === `start-${item.room._id}-${item.period}` ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Starting...
                            </>
                          ) : (
                            <>
                              <span className="mr-2">▶️</span>
                              Start Class
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => setShowQR({ show: true, roomId: item.room._id, day: item.day, period: item.period })}
                          className="w-full bg-blue-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-600 transition flex items-center justify-center"
                        >
                          <span className="mr-2">📱</span>
                          Generate QR Code
                        </button>
                      </div>
                    ) : (
                      <button
                        disabled
                        className="w-full bg-gray-400 text-white px-4 py-2 rounded-lg font-medium cursor-not-allowed flex items-center justify-center"
                      >
                        <span className="mr-2">🚫</span>
                        Room Occupied
                      </button>
                    )}
                  </>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    <p className="text-sm">No room assigned</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* QR Code Generator Modal */}
      {showQR.show && (
        <QRCodeGenerator
          roomId={showQR.roomId}
          day={showQR.day}
          period={showQR.period}
          onClose={() => setShowQR({ show: false, roomId: null, day: null, period: null })}
        />
      )}

      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-lg text-white font-medium ${
          toast.type === 'success' ? 'bg-green-500' : 
          toast.type === 'error' ? 'bg-red-500' : 'bg-blue-500'
        }`}>
          {toast.message}
        </div>
      )}
    </div>
  );
};

export default FacultyRoomManager;