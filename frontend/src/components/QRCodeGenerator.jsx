import React, { useState, useEffect } from 'react';
import { attendanceAPI } from '../api/attendance';

const QRCodeGenerator = ({ roomId, day, period, onClose }) => {
  const [qrData, setQrData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [attendanceList, setAttendanceList] = useState([]);

  useEffect(() => {
    generateQR();
    // Refresh attendance every 30 seconds
    const interval = setInterval(fetchAttendance, 30000);
    return () => clearInterval(interval);
  }, []);

  const generateQR = async () => {
    try {
      setLoading(true);
      const response = await attendanceAPI.generateQR(roomId, day, period);
      setQrData(response.data);
      await fetchAttendance();
    } catch (error) {
      console.error('Error generating QR:', error);
      setError(error.response?.data?.error || 'Failed to generate QR code');
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendance = async () => {
    if (!qrData?.sessionId) return;
    
    try {
      const response = await attendanceAPI.getSessionAttendance(qrData.sessionId);
      setAttendanceList(response.data.attendance || []);
    } catch (error) {
      console.error('Error fetching attendance:', error);
    }
  };

  const generateQRCodeSVG = (data) => {
    // Simple QR code representation (in production, use a proper QR library like qrcode)
    return (
      <div className="w-64 h-64 bg-white border-2 border-gray-300 flex items-center justify-center">
        <div className="text-center p-4">
          <div className="text-xs font-mono break-all mb-2">{data.substring(0, 50)}...</div>
          <div className="text-sm text-gray-600">QR Code</div>
          <div className="text-xs text-gray-500 mt-2">Scan with mobile app</div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>Generating QR Code...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">❌</div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">Error</h3>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={onClose}
              className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">📱 Student Check-in QR Code</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* QR Code Section */}
          <div className="text-center">
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2">QR Code for Check-in</h3>
              <p className="text-sm text-gray-600 mb-4">
                Students scan this code to check in to the class
              </p>
            </div>
            
            {qrData && (
              <div className="flex flex-col items-center">
                {generateQRCodeSVG(qrData.qrData)}
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">
                    <strong>Session:</strong> {day} Period {period}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Valid for:</strong> 1 hour
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Session ID: {qrData.sessionId}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Attendance List Section */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Live Attendance</h3>
              <button
                onClick={fetchAttendance}
                className="text-blue-500 hover:text-blue-700 text-sm"
              >
                🔄 Refresh
              </button>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
              {attendanceList.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">👥</div>
                  <p>No students checked in yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {attendanceList.map((attendance, index) => (
                    <div
                      key={index}
                      className={`flex justify-between items-center p-3 rounded-lg ${
                        attendance.status === 'present' ? 'bg-green-100' :
                        attendance.status === 'late' ? 'bg-yellow-100' : 'bg-red-100'
                      }`}
                    >
                      <div>
                        <p className="font-medium">{attendance.studentId?.name}</p>
                        <p className="text-sm text-gray-600">
                          {new Date(attendance.checkInTime).toLocaleTimeString()}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        attendance.status === 'present' ? 'bg-green-200 text-green-800' :
                        attendance.status === 'late' ? 'bg-yellow-200 text-yellow-800' : 
                        'bg-red-200 text-red-800'
                      }`}>
                        {attendance.status.charAt(0).toUpperCase() + attendance.status.slice(1)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {attendanceList.length > 0 && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>{attendanceList.length}</strong> students checked in
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 flex justify-end space-x-4">
          <button
            onClick={generateQR}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition"
          >
            🔄 Regenerate QR
          </button>
          <button
            onClick={onClose}
            className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default QRCodeGenerator;