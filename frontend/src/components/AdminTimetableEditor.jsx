import React, { useState, useEffect } from 'react';
import { timetableAPI } from '../api/timetable';
import { subjectAPI } from '../api/subject';
import { facultyAPI } from '../api/faculty';

// SVG Icons for UI enhancement (as data URIs)
const SubjectIcon = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='currentColor' class='w-5 h-5'%3E%3Cpath d='M5.5 16.5a1.5 1.5 0 01-1.424-1.947l.868-3.562a1.5 1.5 0 011.424-1.053h4.264a1.5 1.5 0 011.424 1.053l.868 3.562a1.5 1.5 0 01-1.424 1.947H5.5zM3 4.5a1.5 1.5 0 011.5-1.5h11a1.5 1.5 0 010 3h-11A1.5 1.5 0 013 4.5z' /%3E%3C/svg%3E`;
const TeacherIcon = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='currentColor' class='w-5 h-5'%3E%3Cpath d='M10 8a3 3 0 100-6 3 3 0 000 6zM3.465 14.493a1.23 1.23 0 00.41 1.412A9.957 9.957 0 0010 18c2.31 0 4.438-.784 6.131-2.095a1.23 1.23 0 00.41-1.412l-1.154-4.615a1.23 1.23 0 00-1.162-.962h-5.916a1.23 1.23 0 00-1.162.962L3.465 14.493z' /%3E%3C/svg%3E`;
const ClassroomIcon = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='currentColor' class='w-5 h-5'%3E%3Cpath fill-rule='evenodd' d='M2 4.25A2.25 2.25 0 014.25 2h11.5A2.25 2.25 0 0118 4.25v8.5A2.25 2.25 0 0115.75 15H4.25A2.25 2.25 0 012 12.75v-8.5zm1.5 0a.75.75 0 01.75-.75h11.5a.75.75 0 01.75.75v8.5a.75.75 0 01-.75.75H4.25a.75.75 0 01-.75-.75v-8.5z' clip-rule='evenodd' /%3E%3Cpath d='M6.5 16a1 1 0 011-1h5a1 1 0 110 2h-5a1 1 0 01-1-1z' /%3E%3C/svg%3E`;


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
        timetableAPI.getAvailableRooms(),
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
      setTimeout(() => setToast({ show: false, message: '', type: '', persist: false }), 4000);
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
      showToast('Period times saved successfully!', 'success');
    } catch (e) {
      console.error('Error saving period times', e);
      showToast('Failed to save period times.', 'error');
    } finally {
      setSavingTimes(false);
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
        const params = new URLSearchParams({ period: period.toString(), day: day });
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
      if (!force) {
        for (const [key, data] of Object.entries(timetableData)) {
          if (data.teacher || data.classroom) {
            const [day, period] = key.split('-');
            const hasConflict = await checkForConflicts(day, parseInt(period), data.teacher, data.classroom);
            if (hasConflict) {
              setConflictModal({
                show: true,
                message: `A teacher or classroom is already scheduled for ${day}, Period ${period}. You can force save to create the booking anyway.`,
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
    handleSave(true);
  };

  const handleCancelSave = () => {
    setConflictModal({ show: false, message: '', pendingData: null });
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
      <div className="space-y-8 max-w-full mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-800">📅 Master Timetable Editor</h1>
              <p className="mt-1 text-slate-500">Manage the master schedule for all classes, teachers, and rooms.</p>
            </div>
            <button
                onClick={() => handleSave(false)}
                disabled={saving}
                className="inline-flex items-center justify-center space-x-2 bg-indigo-600 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {saving ? (
                    <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Saving...</span>
                    </>
                ) : (
                    <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6h5a2 2 0 012 2v7a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h5v5.586l-1.293-1.293zM9 4a1 1 0 012 0v2H9V4z" /></svg>
                        <span>Save Timetable</span>
                    </>
                )}
            </button>
        </div>

        {/* Period Time Settings */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200/80">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-slate-800">Period Timings</h2>
            <button
              onClick={saveTimes}
              disabled={savingTimes}
              className="bg-slate-700 text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-slate-800 disabled:opacity-50 transition-colors"
            >
              {savingTimes ? 'Saving...' : 'Save Times'}
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            {periods.map(p => (
              <div key={p} className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                <div className="font-semibold text-slate-700 mb-2 text-center">P-{p}</div>
                <div className="space-y-2">
                  <input
                    type="time"
                    value={periodTimes[p]?.start || ''}
                    onChange={(e) => handleTimeChange(p, 'start', e.target.value)}
                    className="w-full px-2 py-1 text-sm border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    aria-label={`Period ${p} Start Time`}
                  />
                  <input
                    type="time"
                    value={periodTimes[p]?.end || ''}
                    onChange={(e) => handleTimeChange(p, 'end', e.target.value)}
                    className="w-full px-2 py-1 text-sm border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    aria-label={`Period ${p} End Time`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Timetable Grid */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-slate-200/80">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                    Period
                  </th>
                  {days.map(day => (
                    <th key={day} className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200 min-w-[250px]">
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {periods.map(period => (
                  <tr key={period} className="hover:bg-slate-50/70 transition-colors duration-150">
                    <td className="px-4 py-4 font-bold text-slate-700 bg-slate-50 whitespace-nowrap">
                      Period {period}
                    </td>
                    {days.map(day => {
                      const cellData = getCellData(day, period);
                      return (
                        <td key={`${day}-${period}`} className="px-3 py-3 align-top">
                          <div className="space-y-2">
                            <div className="relative">
                                <select value={cellData.subject} onChange={(e) => updateCell(day, period, 'subject', e.target.value)} className="w-full pl-8 pr-2 py-1.5 text-slate-700 border-slate-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none" style={{ backgroundImage: `url("${SubjectIcon}")`, backgroundRepeat: 'no-repeat', backgroundPosition: '0.5rem center', backgroundSize: '1rem' }}>
                                    <option value="">Select Subject</option>
                                    {subjects.map(subject => (<option key={subject._id || subject.id} value={subject._id || subject.id}>{subject.name}</option>))}
                                </select>
                            </div>
                            <div className="relative">
                                <select value={cellData.teacher} onChange={(e) => updateCell(day, period, 'teacher', e.target.value)} className="w-full pl-8 pr-2 py-1.5 text-slate-700 border-slate-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none" style={{ backgroundImage: `url("${TeacherIcon}")`, backgroundRepeat: 'no-repeat', backgroundPosition: '0.5rem center', backgroundSize: '1rem' }}>
                                    <option value="">Select Teacher</option>
                                    {teachers.map(teacher => (<option key={teacher._id || teacher.id} value={teacher._id || teacher.id}>{teacher.name}</option>))}
                                </select>
                            </div>
                            <div className="relative">
                                <select value={cellData.classroom} onChange={(e) => updateCell(day, period, 'classroom', e.target.value)} className="w-full pl-8 pr-2 py-1.5 text-slate-700 border-slate-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none" style={{ backgroundImage: `url("${ClassroomIcon}")`, backgroundRepeat: 'no-repeat', backgroundPosition: '0.5rem center', backgroundSize: '1rem' }}>
                                    <option value="">Select Classroom</option>
                                    {classrooms.map(classroom => (<option key={classroom._id || classroom.id} value={classroom._id || classroom.id}>{classroom.code} - {classroom.name}</option>))}
                                </select>
                            </div>
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
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 transform transition-all">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100 mb-5">
                  <svg className="h-10 w-10 text-yellow-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">Scheduling Conflict</h3>
                <p className="text-slate-600 mb-6">{conflictModal.message}</p>
                <div className="flex space-x-4">
                  <button onClick={handleCancelSave} className="flex-1 bg-slate-200 text-slate-800 px-4 py-2.5 rounded-lg font-semibold hover:bg-slate-300 transition">
                    Go Back & Review
                  </button>
                  <button onClick={handleForceSave} className="flex-1 bg-rose-600 text-white px-4 py-2.5 rounded-lg font-semibold hover:bg-rose-700 transition">
                    Force Save
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Toast Notification */}
        {toast.show && (
          <div className={`fixed top-5 right-5 z-50 rounded-xl shadow-2xl text-white font-semibold overflow-hidden animate-fade-in-down ${
            toast.type === 'success' ? 'bg-emerald-500' : 
            toast.type === 'error' ? 'bg-rose-600' : 'bg-indigo-500'
          }`}>
            <div className="flex items-center">
              <div className="p-4 flex items-center space-x-3">
                {toast.type === 'success' && <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                {toast.type === 'error' && <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                <span>{toast.message}</span>
              </div>
              <button onClick={() => setToast({ show: false, message: '', type: '', persist: false })} className="p-4 hover:bg-black/20 transition-colors" aria-label="Dismiss notification">
                &times;
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminTimetableEditor;