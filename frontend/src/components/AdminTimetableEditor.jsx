import React, { useState, useEffect } from 'react';
import { timetableAPI } from '../api/timetable';
import { subjectAPI } from '../api/subject';
import { facultyAPI } from '../api/faculty';

const AdminTimetableEditor = () => {
  const [timetableData, setTimetableData] = useState({});
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [periodTimes, setPeriodTimes] = useState({});
  const [savingTimes, setSavingTimes] = useState(false);
  const [conflictModal, setConflictModal] = useState({
    show: false,
    message: '',
    pendingData: null
  });
  const [toast, setToast] = useState({ show: false, message: '', type: '', persist: false });

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const periods = [1, 2, 3, 4, 5, 6, 7, 8];

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [subjectsRes, teachersRes, classroomsRes, timetableRes, periodTimesRes] = await Promise.all([
        subjectAPI.getAll(),
        facultyAPI.getAll(),
        timetableAPI.getAvailableRooms(), // Use available rooms endpoint instead of all rooms
        timetableAPI.getAdminTimetable().catch(() => ({ data: {} })),
        timetableAPI.getPeriodTimes().catch(() => ({ data: {} })),
      ]);

      setSubjects(subjectsRes.data || []);
      setTeachers(teachersRes.data || []);
      setClassrooms(classroomsRes.data || []);
      setTimetableData(timetableRes.data || {});
      setPeriodTimes(periodTimesRes.data || {});
    } catch (error) {
      console.error('Error fetching data:', error);
      showToast('Error loading data', 'error', true);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = 'info', persist = false) => {
    setToast({ show: true, message, type, persist });
    if (!persist) {
      setTimeout(() => setToast({ show: false, message: '', type: '', persist: false }), 3000);
    }
  };

  const getCellKey = (day, period) => `${day}-${period}`;
  const handleTimeChange = (period, field, value) => {
    setPeriodTimes(prev => ({
      ...prev,
      [period]: {
        start: field === 'start' ? value : (prev[period]?.start || ''),
        end: field === 'end' ? value : (prev[period]?.end || ''),
      }
    }));
  };

  const saveTimes = async () => {
    setSavingTimes(true);
    try {
      await timetableAPI.savePeriodTimes(periodTimes);
    } catch (e) {
      console.error('Error saving period times', e);
    } finally {
      setSavingTimes(false);
      showToast('Period times saved', 'success');
    }
  };


  const getCellData = (day, period) => {
    const key = getCellKey(day, period);
    return timetableData[key] || { subject: '', teacher: '', classroom: '' };
  };

  const updateCell = (day, period, field, value) => {
    const key = getCellKey(day, period);
    setTimetableData(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value
      }
    }));
  };

  const checkForConflicts = async (day, period, teacher, classroom) => {
    if (!teacher && !classroom) return false;

    try {
      const params = new URLSearchParams({
        period: period.toString(),
        day: day
      });
      
      if (teacher) params.append('teacher', teacher);
      if (classroom) params.append('classroom', classroom);
      
      const response = await timetableAPI.checkConflict(params.toString());
      return response.data.hasConflict;
    } catch (error) {
      console.error('Error checking conflicts:', error);
      return false;
    }
  };

  const handleSave = async (force = false) => {
    setSaving(true);
    try {
      // Check for conflicts if not forcing
      if (!force) {
        for (const [key, data] of Object.entries(timetableData)) {
          if (data.teacher || data.classroom) {
            const [day, period] = key.split('-');
            const hasConflict = await checkForConflicts(day, parseInt(period), data.teacher, data.classroom);
            
            if (hasConflict) {
              setConflictModal({
                show: true,
                message: 'Conflict detected — this teacher or classroom is already assigned.',
                pendingData: timetableData
              });
              setSaving(false);
              return;
            }
          }
        }
      }

      await timetableAPI.save(timetableData, force);
      showToast('Timetable saved successfully!', 'success');
      setConflictModal({ show: false, message: '', pendingData: null });
    } catch (error) {
      console.error('Error saving timetable:', error);
      
      // Handle specific validation errors
      if (error.response?.status === 400 && error.response?.data?.validationErrors) {
        const validationErrors = error.response.data.validationErrors;
        const errorMessage = validationErrors.map(err => err.message).join(', ');
        showToast(`Validation Error: ${errorMessage}`, 'error', true);
      } else if (error.response?.status === 409) {
        // Conflict error - should be handled above, but just in case
        showToast('Conflicts detected. Please resolve them first.', 'error', true);
      } else {
        showToast('Error saving timetable', 'error', true);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleForceSave = () => {
    handleSave(true);
  };

  const handleCancelSave = () => {
    setConflictModal({ show: false, message: '', pendingData: null });
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
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl shadow-xl p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">📅 Admin Timetable Editor</h1>
        <p className="text-purple-100">Create and manage the master timetable schedule</p>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={() => handleSave(false)}
          disabled={saving}
          className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-lg font-medium hover:from-green-600 hover:to-green-700 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Saving...</span>
            </>
          ) : (
            <>
              <span>💾</span>
              <span>Save Timetable</span>
            </>
          )}
        </button>
      </div>

      {/* Period Time Settings */}
      <div className="bg-white rounded-2xl shadow-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-800">Period Times</h2>
          <button
            onClick={saveTimes}
            disabled={savingTimes}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {savingTimes ? 'Saving...' : 'Save Times'}
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {periods.map(p => (
            <div key={p} className="border rounded-lg p-3">
              <div className="font-medium text-gray-700 mb-2">Period {p}</div>
              <div className="flex items-center gap-2">
                <input
                  type="time"
                  value={periodTimes[p]?.start || ''}
                  onChange={(e) => handleTimeChange(p, 'start', e.target.value)}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                />
                <span className="text-gray-500">to</span>
                <input
                  type="time"
                  value={periodTimes[p]?.end || ''}
                  onChange={(e) => handleTimeChange(p, 'end', e.target.value)}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Timetable Grid */}
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                <th className="px-4 py-4 text-left font-semibold text-gray-700 border-b border-gray-200">
                  Period / Day
                </th>
                {days.map(day => (
                  <th key={day} className="px-4 py-4 text-center font-semibold text-gray-700 border-b border-gray-200 min-w-[200px]">
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {periods.map(period => (
                <tr key={period} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-4 font-semibold text-gray-700 border-b border-gray-200 bg-gray-50">
                    Period {period}
                  </td>
                  {days.map(day => {
                    const cellData = getCellData(day, period);
                    return (
                      <td key={`${day}-${period}`} className="px-2 py-2 border-b border-gray-200">
                        <div className="space-y-2">
                          {/* Subject */}
                          <select
                            value={cellData.subject}
                            onChange={(e) => updateCell(day, period, 'subject', e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="">Select Subject</option>
                            {subjects.map(subject => (
                              <option key={subject._id || subject.id} value={subject._id || subject.id}>
                                {subject.name}
                              </option>
                            ))}
                          </select>

                          {/* Teacher */}
                          <select
                            value={cellData.teacher}
                            onChange={(e) => updateCell(day, period, 'teacher', e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          >
                            <option value="">Select Teacher</option>
                            {teachers.map(teacher => (
                              <option key={teacher._id || teacher.id} value={teacher._id || teacher.id}>
                                {teacher.name}
                              </option>
                            ))}
                          </select>

                          {/* Classroom */}
                          <select
                            value={cellData.classroom}
                            onChange={(e) => updateCell(day, period, 'classroom', e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          >
                            <option value="">Select Classroom</option>
                            {classrooms.map(classroom => (
                              <option key={classroom._id || classroom.id} value={classroom._id || classroom.id}>
                                {classroom.code} - {classroom.name} ({classroom.type}, Cap: {classroom.capacity})
                              </option>
                            ))}
                          </select>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Conflict Modal */}
      {conflictModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="text-6xl mb-4">⚠️</div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Conflict Detected</h3>
              <p className="text-gray-600 mb-6">{conflictModal.message}</p>
              <div className="flex space-x-4">
                <button
                  onClick={handleCancelSave}
                  className="flex-1 bg-gray-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-600 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleForceSave}
                  className="flex-1 bg-red-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-600 transition"
                >
                  Force Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed top-4 right-4 z-50 rounded-lg shadow-lg text-white font-medium overflow-hidden ${
          toast.type === 'success' ? 'bg-green-500' : 
          toast.type === 'error' ? 'bg-red-500' : 'bg-blue-500'
        }`}>
          <div className="flex items-start">
            <div className="px-6 py-4">{toast.message}</div>
            <button
              onClick={() => setToast({ show: false, message: '', type: '', persist: false })}
              className="px-4 py-4 text-white/90 hover:text-white"
              aria-label="Dismiss notification"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTimetableEditor;