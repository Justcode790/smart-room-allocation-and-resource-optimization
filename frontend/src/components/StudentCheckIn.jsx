import React, { useState, useEffect } from 'react';
import { attendanceAPI } from '../api/attendance';

const StudentCheckIn = () => {
  const [qrInput, setQrInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    fetchAttendanceHistory();
  }, []);

  const fetchAttendanceHistory = async () => {
    try {
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const response = await attendanceAPI.getMyAttendance(startDate, endDate);
      setAttendanceHistory(response.data.attendance || []);
    } catch (error) {
      console.error('Error fetching attendance history:', error);
    }
  };

  const handleCheckIn = async () => {
    if (!qrInput.trim()) {
      setMessage({ text: 'Please enter QR code data', type: 'error' });
      return;
    }

    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      // Get user's location (optional)
      let location = null;
      if (navigator.geolocation) {
        try {
          const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              timeout: 5000,
              enableHighAccuracy: false
            });
          });
          location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
        } catch (error) {
          console.log('Location not available:', error);
        }
      }

      const response = await attendanceAPI.checkIn(qrInput, location);
      
      setMessage({ 
        text: response.data.message, 
        type: 'success' 
      });
      
      setQrInput('');
      await fetchAttendanceHistory(); // Refresh history
      
    } catch (error) {
      console.error('Check-in error:', error);
      setMessage({ 
        text: error.response?.data?.error || 'Check-in failed', 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleQRScan = () => {
    // In a real app, this would open camera for QR scanning
    // For demo, we'll simulate QR data input
    const simulatedQR = JSON.stringify({
      sessionId: "room123-Monday-1-2024-01-15",
      roomId: "room123",
      day: "Monday",
      period: 1,
      date: "2024-01-15",
      subjectId: "subject123",
      facultyId: "faculty123",
      timestamp: Date.now(),
      hash: "abc123def456"
    });
    
    setQrInput(simulatedQR);
    setMessage({ text: 'QR code scanned! Click Check In to complete.', type: 'info' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-2xl shadow-xl p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">📱 Check In to Class</h1>
        <p className="text-green-100">Scan QR code or enter check-in data to mark your attendance</p>
      </div>

      {/* Check-in Form */}
      <div className="bg-white rounded-2xl shadow-xl p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Check-in</h2>
        
        <div className="space-y-4">
          {/* QR Scanner Button */}
          <div className="text-center">
            <button
              onClick={handleQRScan}
              className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-8 py-4 rounded-xl font-medium hover:from-blue-600 hover:to-purple-600 transition shadow-lg flex items-center justify-center mx-auto"
            >
              <span className="text-2xl mr-3">📷</span>
              Scan QR Code
            </button>
            <p className="text-sm text-gray-600 mt-2">
              Point your camera at the QR code displayed by your teacher
            </p>
          </div>

          <div className="text-center text-gray-500">
            <span>or</span>
          </div>

          {/* Manual Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Enter QR Code Data Manually
            </label>
            <textarea
              value={qrInput}
              onChange={(e) => setQrInput(e.target.value)}
              placeholder="Paste QR code data here..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={4}
            />
          </div>

          {/* Check-in Button */}
          <button
            onClick={handleCheckIn}
            disabled={loading || !qrInput.trim()}
            className="w-full bg-green-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Checking In...
              </>
            ) : (
              <>
                <span className="mr-2">✅</span>
                Check In to Class
              </>
            )}
          </button>

          {/* Message Display */}
          {message.text && (
            <div className={`p-4 rounded-lg ${
              message.type === 'success' ? 'bg-green-100 text-green-800' :
              message.type === 'error' ? 'bg-red-100 text-red-800' :
              'bg-blue-100 text-blue-800'
            }`}>
              {message.text}
            </div>
          )}
        </div>
      </div>

      {/* Attendance History */}
      <div className="bg-white rounded-2xl shadow-xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900">📊 My Attendance</h2>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="text-blue-500 hover:text-blue-700 font-medium"
          >
            {showHistory ? 'Hide' : 'Show'} History
          </button>
        </div>

        {showHistory && (
          <div className="space-y-4">
            {attendanceHistory.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-6xl mb-4">📅</div>
                <p className="text-lg">No attendance records found</p>
                <p className="text-sm">Start checking in to classes to see your attendance history</p>
              </div>
            ) : (
              <>
                {/* Attendance Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {attendanceHistory.filter(a => a.status === 'present').length}
                    </div>
                    <div className="text-sm text-green-700">Present</div>
                  </div>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-yellow-600">
                      {attendanceHistory.filter(a => a.status === 'late').length}
                    </div>
                    <div className="text-sm text-yellow-700">Late</div>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {attendanceHistory.length > 0 ? 
                        ((attendanceHistory.filter(a => a.status !== 'absent').length / attendanceHistory.length) * 100).toFixed(1) 
                        : 0}%
                    </div>
                    <div className="text-sm text-blue-700">Attendance Rate</div>
                  </div>
                </div>

                {/* Attendance List */}
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {attendanceHistory.map((record, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{record.subjectId?.name}</p>
                        <p className="text-sm text-gray-600">
                          {record.day} Period {record.period} - {record.roomId?.code}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(record.date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          record.status === 'present' ? 'bg-green-200 text-green-800' :
                          record.status === 'late' ? 'bg-yellow-200 text-yellow-800' :
                          'bg-red-200 text-red-800'
                        }`}>
                          {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                        </span>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(record.checkInTime).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentCheckIn;