import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { timetableAPI } from '../api/timetable';
import { subjectAPI } from '../api/subject';
import { facultyAPI } from '../api/faculty';
import { roomAPI } from '../api/room';
import { sectionAPI } from '../api/section';

const SectionTimetableEditor = () => {
  const { sectionId } = useParams();
  const navigate = useNavigate();
  const [section, setSection] = useState(null);
  const [timetableData, setTimetableData] = useState({});
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [conflictModal, setConflictModal] = useState({
    show: false,
    message: '',
    type: '',
    pendingData: null,
    suggestions: null,
    alternativeTeachers: null
  });
  const [toast, setToast] = useState({ show: false, message: '', type: '', persist: false });
  const [cellStatus, setCellStatus] = useState({}); // Track cell status: 'valid', 'warning', 'conflict'
  const [generating, setGenerating] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState([]);
  const [insufficientDataModal, setInsufficientDataModal] = useState({
    show: false,
    missingData: []
  });

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const periods = [1, 2, 3, 4, 5, 6, 7];

  useEffect(() => {
    fetchInitialData();
  }, [sectionId]);

  const fetchInitialData = async () => {
    try {
      const [sectionRes, subjectsRes, teachersRes, roomsRes, timetableRes] = await Promise.all([
        sectionAPI.getById(sectionId).catch(() => ({ data: null })),
        subjectAPI.getAll(),
        facultyAPI.getAll(),
        roomAPI.getAll(),
        timetableAPI.getBySection(sectionId).catch(() => ({ data: null }))
      ]);

      setSection(sectionRes.data);
      setSubjects(subjectsRes.data || []);
      setTeachers(teachersRes.data || []);
      setRooms(roomsRes.data || []);

      // Convert timetable schedule to grid format
      if (timetableRes.data?.schedule) {
        const grid = {};
        timetableRes.data.schedule.forEach(session => {
          const key = `${session.day}-${session.period}`;
          
          // Handle populated or non-populated references
          let subjectId = null;
          if (session.subjectRef) {
            subjectId = typeof session.subjectRef === 'object' && session.subjectRef._id 
              ? session.subjectRef._id 
              : session.subjectRef;
          }
          
          let teacherId = null;
          if (session.facultyRef) {
            teacherId = typeof session.facultyRef === 'object' && session.facultyRef._id 
              ? session.facultyRef._id 
              : session.facultyRef;
          }
          
          let roomId = null;
          if (session.roomRef) {
            roomId = typeof session.roomRef === 'object' && session.roomRef._id 
              ? session.roomRef._id 
              : session.roomRef;
          }
          
          // Get subject type
          let subjectType = 'Theory';
          if (session.subjectRef && typeof session.subjectRef === 'object') {
            subjectType = session.subjectRef.type || 'Theory';
          } else if (subjectId) {
            const subject = subjectsRes.data?.find(s => s._id === subjectId);
            subjectType = subject?.type || 'Theory';
          }
          
          grid[key] = {
            subject: subjectId,
            teacher: teacherId,
            classroom: roomId,
            type: subjectType
          };
        });
        setTimetableData(grid);
      }
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

  const getCellData = (day, period) => {
    const key = getCellKey(day, period);
    return timetableData[key] || { subject: '', teacher: '', classroom: '', type: 'Theory' };
  };

  const getCellStatus = (day, period) => {
    const key = getCellKey(day, period);
    return cellStatus[key] || 'valid';
  };

  const setCellStatusValue = (day, period, status) => {
    const key = getCellKey(day, period);
    setCellStatus(prev => ({
      ...prev,
      [key]: status
    }));
  };

  const getCellColor = (day, period) => {
    const status = getCellStatus(day, period);
    const cellData = getCellData(day, period);
    
    // Empty cell
    if (!cellData.subject && !cellData.teacher && !cellData.classroom) {
      return 'bg-white border-gray-200';
    }

    // Status-based colors
    switch (status) {
      case 'conflict':
        return 'bg-red-50 border-red-300 border-2';
      case 'warning':
        return 'bg-yellow-50 border-yellow-300 border-2';
      case 'valid':
        return 'bg-green-50 border-green-300 border-2';
      default:
        return 'bg-white border-gray-200';
    }
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

  const checkConflicts = async (day, period, teacher, classroom, subject) => {
    try {
      const params = new URLSearchParams({
        period: period.toString(),
        day: day
      });
      
      if (teacher) params.append('teacher', teacher);
      if (classroom) params.append('classroom', classroom);
      if (sectionId) params.append('sectionId', sectionId);
      if (subject) params.append('subjectId', subject);
      
      const response = await timetableAPI.checkConflict(params.toString());
      return response.data;
    } catch (error) {
      console.error('Error checking conflicts:', error);
      return { hasConflict: false };
    }
  };

  const getRoomSuggestions = async (subjectId, day, period) => {
    if (!subjectId || !sectionId) return [];
    
    try {
      const params = new URLSearchParams({
        subjectId,
        sectionId,
        day,
        period: period.toString()
      });
      const response = await timetableAPI.getRoomSuggestions(params.toString());
      return response.data || [];
    } catch (error) {
      console.error('Error fetching room suggestions:', error);
      // Fallback to client-side filtering
      const subject = subjects.find(s => s._id === subjectId);
      if (!subject) return [];

      const minCapacity = section?.strength || 0;
      const suggestions = rooms.filter(room => {
        if (subject.type === 'Lab' && room.type !== 'Lab' && !room.allowLabClass) return false;
        if (subject.type === 'Theory' && room.type === 'Lab' && !room.allowTheoryClass) return false;
        if (room.capacity < minCapacity) return false;
        return room.status === 'active';
      });
      return suggestions.slice(0, 5);
    }
  };

  const validateLabTheory = (subjectId, roomId) => {
    if (!subjectId || !roomId) return { valid: true };
    
    const subject = subjects.find(s => s._id === subjectId);
    const room = rooms.find(r => r._id === roomId);
    
    if (!subject || !room) return { valid: true };

    if (subject.type === 'Lab' && room.type !== 'Lab' && !room.allowLabClass) {
      return {
        valid: false,
        message: `⚠️ This is a Lab subject. Please select a Lab room (e.g., ${rooms.filter(r => r.type === 'Lab').slice(0, 3).map(r => r.code).join(', ')})`
      };
    }

    if (subject.type === 'Theory' && room.type === 'Lab' && !room.allowTheoryClass) {
      return {
        valid: false,
        message: `⚠️ Room ${room.code} is a Lab. It's not suitable for theory classes.`
      };
    }

    return { valid: true };
  };

  const handleCellChange = async (day, period, field, value) => {
    const currentData = getCellData(day, period);
    const newData = { ...currentData, [field]: value };

    // If subject changed, update type
    if (field === 'subject') {
      const subject = subjects.find(s => s._id === value);
      if (subject) {
        newData.type = subject.type || 'Theory';
      }
    }

    updateCell(day, period, field, value);
    setCellStatusValue(day, period, 'valid'); // Reset status

    // Validate Lab/Theory compatibility
    if (field === 'subject' || field === 'classroom') {
      const validation = validateLabTheory(newData.subject, newData.classroom);
      if (!validation.valid) {
        setCellStatusValue(day, period, 'warning');
        setConflictModal({
          show: true,
          message: validation.message,
          type: 'warning',
          pendingData: { ...timetableData, [getCellKey(day, period)]: newData },
          suggestions: null
        });
        return;
      }
    }

    // Check conflicts if teacher or room is assigned
    if ((field === 'teacher' || field === 'classroom') && (newData.teacher || newData.classroom)) {
      const conflictResult = await checkConflicts(day, period, newData.teacher, newData.classroom, newData.subject);
      
      if (conflictResult.hasConflict) {
        setCellStatusValue(day, period, 'conflict');
        let message = conflictResult.conflictDetails?.message || '';
        if (!message) {
          if (conflictResult.conflictType === 'teacher') {
            message = `❌ Teacher is already teaching another class at this time.`;
          } else if (conflictResult.conflictType === 'classroom') {
            message = `⚠️ Room is occupied by another section.`;
          }
        }

        // Use smart suggestions from conflict check or fallback to room suggestions
        let suggestions = conflictResult.suggestions?.alternativeRooms || null;
        if (!suggestions || suggestions.length === 0) {
          suggestions = await getRoomSuggestions(newData.subject, day, period);
        }

        setConflictModal({
          show: true,
          message,
          type: conflictResult.conflictType,
          pendingData: { ...timetableData, [getCellKey(day, period)]: newData },
          suggestions: suggestions && suggestions.length > 0 ? suggestions : null,
          alternativeTeachers: conflictResult.suggestions?.alternativeTeachers || null
        });
      } else {
        // Check if room capacity is sufficient
        if (newData.classroom && section?.strength) {
          const room = rooms.find(r => r._id === newData.classroom);
          if (room && room.capacity < section.strength) {
            setCellStatusValue(day, period, 'warning');
          } else {
            setCellStatusValue(day, period, 'valid');
          }
        } else {
          setCellStatusValue(day, period, 'valid');
        }
      }
    }

    // Get room suggestions if subject is selected but no room
    if (field === 'subject' && value && !newData.classroom) {
      const suggestions = await getRoomSuggestions(value, day, period);
      if (suggestions.length > 0) {
        showToast(`💡 Suggested rooms: ${suggestions.slice(0, 3).map(r => r.code).join(', ')}`, 'info');
      }
    }
  };

  const handleSave = async (force = false) => {
    setSaving(true);
    try {
      await timetableAPI.saveSectionTimetable({ ...timetableData, sectionId, force });
      showToast('Timetable saved successfully!', 'success');
      setConflictModal({ show: false, message: '', type: '', pendingData: null, suggestions: null, alternativeTeachers: null });
    } catch (error) {
      console.error('Error saving timetable:', error);
      if (error.response?.status === 400 && error.response?.data?.validationErrors) {
        const validationErrors = error.response.data.validationErrors;
        const errorMessage = validationErrors.map(err => err.message).join(', ');
        showToast(`Validation Error: ${errorMessage}`, 'error', true);
      } else if (error.response?.status === 409) {
        showToast('Conflicts detected. Please resolve them first.', 'error', true);
      } else {
        showToast('Error saving timetable', 'error', true);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleForceSave = () => {
    if (conflictModal.pendingData) {
      setTimetableData(conflictModal.pendingData);
      // Update cell statuses after force save
      Object.keys(conflictModal.pendingData).forEach(key => {
        const [day, period] = key.split('-');
        if (day && period) {
          setCellStatusValue(day, parseInt(period), 'valid');
        }
      });
    }
    handleSave(true);
  };

  const handleAutoGenerate = async () => {
    setGenerating(true);
    try {
      // First check if data is sufficient
      const dataCheck = await timetableAPI.checkDataSufficiency(sectionId);
      
      if (!dataCheck.data?.sufficient) {
        setGenerating(false);
        setInsufficientDataModal({
          show: true,
          missingData: dataCheck.data?.missing || ['Backend data is not sufficient']
        });
        return;
      }

      const response = await timetableAPI.generate(sectionId);
      if (response.data?.timetable) {
        // Convert generated timetable to grid format
        const grid = {};
        const timetable = response.data.timetable;
        
        // Handle both populated and non-populated references
        if (timetable.schedule && Array.isArray(timetable.schedule)) {
          timetable.schedule.forEach(session => {
            const key = `${session.day}-${session.period}`;
            
            // Handle subjectRef (could be ObjectId, populated object, or null)
            let subjectId = null;
            if (session.subjectRef) {
              subjectId = typeof session.subjectRef === 'object' && session.subjectRef._id 
                ? session.subjectRef._id 
                : session.subjectRef;
            }
            
            // Handle facultyRef
            let teacherId = null;
            if (session.facultyRef) {
              teacherId = typeof session.facultyRef === 'object' && session.facultyRef._id 
                ? session.facultyRef._id 
                : session.facultyRef;
            }
            
            // Handle roomRef
            let roomId = null;
            if (session.roomRef) {
              roomId = typeof session.roomRef === 'object' && session.roomRef._id 
                ? session.roomRef._id 
                : session.roomRef;
            }
            
            // Get subject type
            let subjectType = 'Theory';
            if (session.subjectRef && typeof session.subjectRef === 'object') {
              subjectType = session.subjectRef.type || 'Theory';
            } else if (subjectId) {
              // Try to find in subjects list
              const subject = subjects.find(s => s._id === subjectId);
              subjectType = subject?.type || 'Theory';
            }
            
            grid[key] = {
              subject: subjectId,
              teacher: teacherId,
              classroom: roomId,
              type: subjectType
            };
            setCellStatusValue(session.day, session.period, 'valid');
          });
        }
        
        setTimetableData(grid);
        
        // Show appropriate message
        if (response.data.summary?.isDemo) {
          showToast('Demo timetable generated! Please update with actual data from backend.', 'info', true);
        } else {
          showToast('Timetable generated successfully!', 'success');
        }
        
        // Refresh data to get populated references
        setTimeout(() => {
          fetchInitialData();
        }, 1000);
      }
    } catch (error) {
      console.error('Error generating timetable:', error);
      
      // Handle timeout errors
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        showToast('Generation is taking longer than expected. Please wait or try again. If the issue persists, check backend logs.', 'error', true);
      } else if (error.response?.status === 404 || error.response?.data?.error?.includes('No mappings')) {
        // Try to generate demo timetable
        try {
          const demoResponse = await timetableAPI.generate(sectionId);
          if (demoResponse.data?.timetable) {
            showToast('Demo timetable generated! Please add mappings and regenerate.', 'info', true);
            setTimeout(() => {
              fetchInitialData();
            }, 1000);
          }
        } catch (demoError) {
          if (demoError.code === 'ECONNABORTED' || demoError.message.includes('timeout')) {
            showToast('Demo generation also timed out. Please check backend or try again later.', 'error', true);
          } else {
            showToast('Error generating timetable. Please ensure mappings are created.', 'error', true);
          }
        }
      } else if (error.response) {
        // Server responded with error
        const errorMsg = error.response.data?.error || error.response.data?.message || 'Error generating timetable';
        showToast(errorMsg, 'error', true);
      } else if (error.request) {
        // Request made but no response
        showToast('No response from server. Please check your connection and try again.', 'error', true);
      } else {
        showToast('Error generating timetable. Please try again.', 'error', true);
      }
    } finally {
      setGenerating(false);
    }
  };

  const handleExport = () => {
    // Create CSV content
    const headers = ['Day', 'Period', 'Subject', 'Teacher', 'Room', 'Type'];
    const rows = [headers.join(',')];

    days.forEach(day => {
      periods.forEach(period => {
        const cellData = getCellData(day, period);
        if (cellData.subject || cellData.teacher || cellData.classroom) {
          const subject = subjects.find(s => s._id === cellData.subject);
          const teacher = teachers.find(t => t._id === cellData.teacher);
          const room = rooms.find(r => r._id === cellData.classroom);
          
          rows.push([
            day,
            period,
            subject?.name || '',
            teacher?.name || '',
            room?.code || '',
            cellData.type || 'Theory'
          ].join(','));
        }
      });
    });

    const csvContent = rows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${section?.name || 'timetable'}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    showToast('Timetable exported successfully!', 'success');
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl shadow-xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <button
                onClick={() => navigate('/admin/sections')}
                className="mb-2 text-white/80 hover:text-white text-sm"
              >
                ← Back to Sections
              </button>
              <h1 className="text-3xl font-bold mb-2">📅 Timetable Editor</h1>
              <p className="text-purple-100">
                {section?.name || 'Section'} {section?.department && `• ${section.department}`}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleAutoGenerate}
                disabled={generating}
                className="bg-yellow-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-yellow-600 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {generating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <span>🤖</span>
                    <span>Auto Generate</span>
                  </>
                )}
              </button>
              <button
                onClick={handleExport}
                className="bg-green-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-600 transition shadow-lg flex items-center space-x-2"
              >
                <span>📥</span>
                <span>Export</span>
              </button>
              <button
                onClick={async () => {
                  try {
                    const res = await timetableAPI.getHistory(sectionId);
                    setHistory(res.data || []);
                    setShowHistory(true);
                  } catch (error) {
                    showToast('Error loading history', 'error', true);
                  }
                }}
                className="bg-indigo-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-600 transition shadow-lg flex items-center space-x-2"
              >
                <span>📜</span>
                <span>History</span>
              </button>
              <button
                onClick={() => handleSave(false)}
                disabled={saving}
                className="bg-white text-purple-600 px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
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
          </div>

          {/* Color Legend */}
          <div className="flex items-center gap-4 text-sm bg-white/10 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-50 border-2 border-green-300 rounded"></div>
              <span>Valid</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-50 border-2 border-yellow-300 rounded"></div>
              <span>Warning</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-50 border-2 border-red-300 rounded"></div>
              <span>Conflict</span>
            </div>
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
                      const cellColor = getCellColor(day, period);
                      return (
                        <td key={`${day}-${period}`} className={`px-2 py-2 border-b ${cellColor} transition-colors`}>
                          <div className="space-y-2">
                            {/* Subject */}
                            <select
                              value={cellData.subject}
                              onChange={(e) => handleCellChange(day, period, 'subject', e.target.value)}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="">Select Subject</option>
                              {subjects.map(subject => (
                                <option key={subject._id || subject.id} value={subject._id || subject.id}>
                                  {subject.name} ({subject.type || 'Theory'})
                                </option>
                              ))}
                            </select>

                            {/* Teacher */}
                            <select
                              value={cellData.teacher}
                              onChange={(e) => handleCellChange(day, period, 'teacher', e.target.value)}
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
                              onChange={(e) => handleCellChange(day, period, 'classroom', e.target.value)}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            >
                              <option value="">Select Classroom</option>
                              {rooms.map(room => (
                                <option key={room._id || room.id} value={room._id || room.id}>
                                  {room.code} - {room.name} ({room.type}, Cap: {room.capacity})
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
                <div className="text-6xl mb-4">
                  {conflictModal.type === 'teacher' ? '❌' : conflictModal.type === 'classroom' ? '⚠️' : '⚠️'}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Conflict Detected</h3>
                <p className="text-gray-600 mb-6">{conflictModal.message}</p>
                
                {conflictModal.suggestions && conflictModal.suggestions.length > 0 && (
                  <div className="mb-6 text-left bg-blue-50 p-4 rounded-lg">
                    <p className="font-semibold text-blue-900 mb-2">💡 Suggested Rooms:</p>
                    <div className="space-y-2">
                      {conflictModal.suggestions.map((room, idx) => (
                        <div key={room.id || room._id || idx} className="text-sm text-blue-700">
                          • {room.code} - {room.name} (Capacity: {room.capacity}, Type: {room.type || 'N/A'})
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {conflictModal.alternativeTeachers && conflictModal.alternativeTeachers.length > 0 && (
                  <div className="mb-6 text-left bg-purple-50 p-4 rounded-lg">
                    <p className="font-semibold text-purple-900 mb-2">👨‍🏫 Alternative Teachers:</p>
                    <div className="space-y-2">
                      {conflictModal.alternativeTeachers.map((teacher, idx) => (
                        <div key={teacher.id || idx} className="text-sm text-purple-700">
                          • {teacher.name} {teacher.email && `(${teacher.email})`}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex space-x-4">
                  <button
                    onClick={() => setConflictModal({ show: false, message: '', type: '', pendingData: null, suggestions: null, alternativeTeachers: null })}
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

        {/* History Modal */}
        {showHistory && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900">Revision History</h3>
                <button
                  onClick={() => setShowHistory(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>
              <div className="space-y-4">
                {history.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No revision history available</p>
                ) : (
                  history.map((tt, idx) => (
                    <div key={tt._id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="font-semibold text-gray-900">Version {tt.version}</div>
                          <div className="text-sm text-gray-600">
                            {new Date(tt.generatedAt).toLocaleString()}
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          tt.isPublished ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {tt.isPublished ? 'Published' : 'Draft'}
                        </span>
                      </div>
                      {tt.generatedBy && (
                        <div className="text-sm text-gray-500">
                          Generated by: {tt.generatedBy.name || 'Admin'}
                        </div>
                      )}
                      {tt.revisionHistory && tt.revisionHistory.length > 0 && (
                        <div className="mt-2 text-sm text-gray-600">
                          <div className="font-semibold mb-1">Changes:</div>
                          {tt.revisionHistory.map((rev, revIdx) => (
                            <div key={revIdx} className="ml-4 text-xs text-gray-500">
                              • {rev.changes} (v{rev.version})
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Insufficient Data Modal */}
        {insufficientDataModal.show && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
              <div className="text-center">
                <div className="text-6xl mb-4">⚠️</div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Insufficient Backend Data</h3>
                <p className="text-gray-600 mb-6">
                  The following data is missing or insufficient to generate a timetable:
                </p>
                
                <div className="mb-6 text-left bg-red-50 p-4 rounded-lg">
                  <ul className="space-y-2">
                    {insufficientDataModal.missingData.map((item, idx) => (
                      <li key={idx} className="text-sm text-red-700 flex items-start">
                        <span className="mr-2">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-yellow-50 p-4 rounded-lg mb-6 text-left">
                  <p className="text-sm text-yellow-800 font-semibold mb-2">💡 What to do:</p>
                  <ul className="text-xs text-yellow-700 space-y-1">
                    <li>• Add subjects in Campus Setup</li>
                    <li>• Add faculty members in Campus Setup</li>
                    <li>• Add rooms in Campus Setup</li>
                    <li>• Create subject-faculty mappings for this section</li>
                  </ul>
                </div>

                <div className="flex space-x-4">
                  <button
                    onClick={() => setInsufficientDataModal({ show: false, missingData: [] })}
                    className="flex-1 bg-gray-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-600 transition"
                  >
                    Close
                  </button>
                  <button
                    onClick={async () => {
                      setInsufficientDataModal({ show: false, missingData: [] });
                      setGenerating(true);
                      // Proceed with demo generation
                      try {
                        const response = await timetableAPI.generate(sectionId);
                        if (response.data?.timetable) {
                          showToast('Demo timetable generated! Please update with actual data.', 'info', true);
                          setTimeout(() => {
                            fetchInitialData();
                          }, 1000);
                        }
                      } catch (error) {
                        showToast('Error generating demo timetable', 'error', true);
                      } finally {
                        setGenerating(false);
                      }
                    }}
                    className="flex-1 bg-yellow-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-yellow-600 transition"
                  >
                    Generate Demo Anyway
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
    </Layout>
  );
};

export default SectionTimetableEditor;

