import React, { useState, useEffect } from 'react';
import { roomSessionAPI } from '../api/roomSession';
import QRCodeGenerator from './QRCodeGenerator';

// SVG Icons for UI enhancement
const ClockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const PlayIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
  </svg>
);

const StopIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
  </svg>
);

const QrCodeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4h2v-4zM6 8v4m0 4h4v-4H6zM6 20h4v-4H6v4zm14-8h-2v4h2v-4zm-6 0v4m0-4h2v-4h-2v4z" />
    <rect x="5" y="5" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    <rect x="15" y="5" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    <rect x="5" y="15" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
  </svg>
);

const FacultyRoomManager = () => {
  const [schedule, setSchedule] = useState([]);
  const [activeSessions, setActiveSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  const [showQR, setShowQR] = useState({ show: false, roomId: null, day: null, period: null });
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    fetchData();
    // Update time every minute
    const timeInterval = setInterval(() => setCurrentTime(new Date()), 60000);
    // Refresh data every 30 seconds
    const dataInterval = setInterval(fetchData, 30000);
    return () => {
      clearInterval(timeInterval);
      clearInterval(dataInterval);
    };
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
      await fetchData();
    } catch (error) {
      console.error('Error starting session:', error);
      showToast(error.response?.data?.error || 'Error starting session', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleEndSession = async (roomId) => {
    setActionLoading(`end-${roomId}`);
    try {
      await roomSessionAPI.endSession(roomId);
      showToast('Class session ended successfully!', 'success');
      await fetchData();
    } catch (error) {
      console.error('Error ending session:', error);
      showToast(error.response?.data?.error || 'Error ending session', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusColorClasses = (status) => {
    switch (status) {
      case 'idle': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'occupied': return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'reserved': return 'bg-amber-100 text-amber-800 border-amber-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-100">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-slate-100 min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">🏫 Room Management</h1>
            <p className="mt-1 text-slate-500">Manage your classroom sessions and view your daily schedule.</p>
          </div>
          <div className="flex items-center bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-200">
            <ClockIcon />
            <span className="ml-2 font-medium text-slate-700">{formatTime(currentTime)}</span>
          </div>
        </div>

        {/* Active Sessions */}
        {activeSessions.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200/60 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-xl font-bold text-slate-800 flex items-center">
                <span className="flex h-3 w-3 relative mr-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
                </span>
                Active Sessions
              </h2>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeSessions.map((session) => (
                <div key={session._id} className="bg-rose-50 rounded-xl p-5 border border-rose-100 shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">{session.code}</h3>
                      <p className="text-slate-600 font-medium">{session.name}</p>
                      <p className="text-sm text-slate-500">{session.building} • Floor {session.floor}</p>
                    </div>
                    <span className="px-2.5 py-1 text-xs font-semibold bg-rose-100 text-rose-700 rounded-full border border-rose-200">
                      Occupied
                    </span>
                  </div>
                  
                  {session.currentSession && (
                    <div className="mb-5 bg-white/60 rounded-lg p-3 text-sm text-slate-700 space-y-1.5">
                      <p><span className="font-semibold text-slate-900">Subject:</span> {session.currentSession.subjectId?.name || 'N/A'}</p>
                      <div className="flex justify-between text-xs text-slate-500 pt-1">
                        <span>Start: {formatTime(new Date(session.currentSession.startTime))}</span>
                        <span>End: {formatTime(new Date(session.currentSession.endTime))}</span>
                      </div>
                    </div>
                  )}
                  
                  <button
                    onClick={() => handleEndSession(session._id)}
                    disabled={actionLoading === `end-${session._id}`}
                    className="w-full bg-rose-600 text-white px-4 py-2.5 rounded-lg font-semibold hover:bg-rose-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center shadow-sm"
                  >
                    {actionLoading === `end-${session._id}` ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        <span>Ending Session...</span>
                      </>
                    ) : (
                      <>
                        <StopIcon />
                        <span className="ml-2">End Session</span>
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Today's Schedule */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200/60 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <h2 className="text-xl font-bold text-slate-800 flex items-center">
              <span className="mr-2">📅</span> Today's Schedule
            </h2>
          </div>
          
          <div className="p-6">
            {schedule.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                <div className="text-5xl mb-4 opacity-20">📅</div>
                <p className="text-slate-500 font-medium">No classes scheduled for today</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {schedule.map((item) => (
                  <div key={`${item.period}-${item.room?._id}`} className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4 pb-4 border-b border-slate-100">
                      <div>
                        <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Period {item.period}</span>
                        <h3 className="text-lg font-bold text-slate-900 mt-1">{item.subject?.name || 'No Subject'}</h3>
                      </div>
                      <div className="flex items-center justify-center h-10 w-10 rounded-full bg-slate-100 text-slate-500 font-bold">
                        P{item.period}
                      </div>
                    </div>
                    
                    {item.room ? (
                      <>
                        <div className="mb-5 space-y-1">
                          <div className="flex items-center justify-between">
                            <p className="font-semibold text-slate-900">{item.room.code} - {item.room.name}</p>
                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${getStatusColorClasses(item.room.occupancyStatus)}`}>
                              {item.room.occupancyStatus.charAt(0).toUpperCase() + item.room.occupancyStatus.slice(1)}
                            </span>
                          </div>
                          <p className="text-sm text-slate-500">{item.room.building} • Floor {item.room.floor}</p>
                        </div>
                        
                        <div className="space-y-3">
                          {item.canStart ? (
                            <>
                              <button
                                onClick={() => handleStartSession(item.room._id, item.day, item.period)}
                                disabled={actionLoading === `start-${item.room._id}-${item.period}`}
                                className="w-full bg-emerald-600 text-white px-4 py-2.5 rounded-lg font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center shadow-sm"
                              >
                                {actionLoading === `start-${item.room._id}-${item.period}` ? (
                                  <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    <span>Starting...</span>
                                  </>
                                ) : (
                                  <>
                                    <PlayIcon />
                                    <span className="ml-2">Start Class</span>
                                  </>
                                )}
                              </button>
                              <button
                                onClick={() => setShowQR({ show: true, roomId: item.room._id, day: item.day, period: item.period })}
                                className="w-full bg-indigo-600 text-white px-4 py-2.5 rounded-lg font-semibold hover:bg-indigo-700 transition-colors flex items-center justify-center shadow-sm"
                              >
                                <QrCodeIcon />
                                <span className="ml-2">Generate QR Code</span>
                              </button>
                            </>
                          ) : (
                            <button
                              disabled
                              className="w-full bg-slate-100 text-slate-400 px-4 py-2.5 rounded-lg font-semibold cursor-not-allowed flex items-center justify-center border border-slate-200"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
                              </svg>
                              Room Not Available
                            </button>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-6 text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                        <p className="text-sm font-medium">No room assigned</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
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
          <div className={`fixed top-5 right-5 z-50 rounded-xl shadow-2xl text-white font-semibold overflow-hidden animate-fade-in-down ${
            toast.type === 'success' ? 'bg-emerald-500' : 
            toast.type === 'error' ? 'bg-rose-600' : 'bg-indigo-500'
          }`}>
            <div className="flex items-center px-6 py-4 space-x-3">
              {toast.type === 'success' && <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
              {toast.type === 'error' && <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
              {toast.type === 'info' && <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
              <span>{toast.message}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FacultyRoomManager;