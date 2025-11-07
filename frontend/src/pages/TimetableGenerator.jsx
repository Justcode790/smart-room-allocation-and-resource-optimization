import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import TimetableGrid from '../components/TimetableGrid';
import NotificationCard from '../components/NotificationCard';
import { timetableAPI } from '../api/timetable';
import { sectionAPI } from '../api/section';
import { useSocket } from '../context/SocketContext';

const TimetableGenerator = () => {
  const [sections, setSections] = useState([]);
  const [selectedSection, setSelectedSection] = useState(null);
  const [timetable, setTimetable] = useState(null);
  const [generationResult, setGenerationResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const { socket } = useSocket();

  useEffect(() => {
    fetchSections();
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on('timetable:update', (data) => {
        if (data.sectionId === selectedSection?._id) {
          fetchTimetable(selectedSection._id);
        }
      });
      return () => socket.off('timetable:update');
    }
  }, [socket, selectedSection]);

  const fetchSections = async () => {
    try {
      const res = await sectionAPI.getAll();
      setSections(res.data);
      if (res.data.length > 0) {
        setSelectedSection(res.data[0]);
        fetchTimetable(res.data[0]._id);
      }
    } catch (error) {
      console.error('Error fetching sections:', error);
    }
  };

  const fetchTimetable = async (sectionId) => {
    try {
      const res = await timetableAPI.getBySection(sectionId);
      setTimetable(res.data);
    } catch (error) {
      if (error.response?.status !== 404) {
        console.error('Error fetching timetable:', error);
      }
      setTimetable(null);
    }
  };

  const handleGenerate = async () => {
    if (!selectedSection) return;
    setLoading(true);
    setGenerationResult(null);
    try {
      const res = await timetableAPI.generate(selectedSection._id);
      setGenerationResult(res.data);
      if (res.data.timetable) {
        setTimetable(res.data.timetable);
      }
    } catch (error) {
      alert('Error generating timetable: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!timetable) return;
    try {
      await timetableAPI.publish(timetable._id);
      alert('Timetable published successfully! Notifications sent to faculty and students.');
      fetchTimetable(selectedSection._id);
    } catch (error) {
      alert('Error publishing timetable: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleDelete = async () => {
    if (!timetable) return;
    
    const statusText = timetable.isPublished ? 'published' : 'draft';
    const confirmMessage = `Are you sure you want to delete this ${statusText} timetable for ${selectedSection?.name}?\n\n${
      timetable.isPublished 
        ? 'This will notify all affected students and faculty about the deletion.' 
        : 'This action cannot be undone.'
    }`;
    
    if (!window.confirm(confirmMessage)) return;
    
    try {
      await timetableAPI.delete(timetable._id);
      alert(`Timetable deleted successfully! ${timetable.isPublished ? 'Notifications sent to affected users.' : ''}`);
      setTimetable(null);
      setGenerationResult(null);
    } catch (error) {
      alert('Error deleting timetable: ' + (error.response?.data?.error || error.message));
    }
  };

  return (
    <Layout>
      <NotificationCard />
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl shadow-xl p-8 text-white">
          <h1 className="text-4xl font-bold mb-2">📅 Timetable Generator</h1>
          <p className="text-purple-100">Automatically generate optimized timetables for your sections</p>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Select Section:</label>
              <select
                value={selectedSection?._id || ''}
                onChange={(e) => {
                  const section = sections.find(s => s._id === e.target.value);
                  setSelectedSection(section);
                  if (section) fetchTimetable(section._id);
                }}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
              >
                {sections.map(section => (
                  <option key={section._id} value={section._id}>{section.name}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleGenerate}
                disabled={loading || !selectedSection}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transform hover:scale-105 disabled:hover:scale-100"
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating...
                  </span>
                ) : (
                  '✨ Generate Timetable'
                )}
              </button>
              {timetable && !timetable.isPublished && (
                <button
                  onClick={handlePublish}
                  className="bg-gradient-to-r from-green-500 to-green-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-green-600 hover:to-green-700 transition shadow-lg transform hover:scale-105"
                >
                  📢 Publish
                </button>
              )}
              {timetable && (
                <button
                  onClick={handleDelete}
                  className="bg-gradient-to-r from-red-500 to-red-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-red-600 hover:to-red-700 transition shadow-lg transform hover:scale-105"
                >
                  🗑️ Delete
                </button>
              )}
            </div>
          </div>
        </div>

        {generationResult && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <span className="mr-3">📊</span>
              Generation Summary
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border-2 border-blue-200">
                <div className="text-sm text-gray-600 font-medium mb-2">Total Subjects</div>
                <div className="text-4xl font-bold text-blue-600">{generationResult.summary?.totalSubjects || 0}</div>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border-2 border-green-200">
                <div className="text-sm text-gray-600 font-medium mb-2">Periods Placed</div>
                <div className="text-4xl font-bold text-green-600">{generationResult.summary?.totalPeriodsPlaced || 0}</div>
              </div>
              <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-xl border-2 border-red-200">
                <div className="text-sm text-gray-600 font-medium mb-2">Conflicts</div>
                <div className="text-4xl font-bold text-red-600">{generationResult.summary?.conflictsCount || 0}</div>
              </div>
            </div>
            {generationResult.conflicts && generationResult.conflicts.length > 0 && (
              <div className="mt-4">
                <h3 className="font-semibold text-gray-900 mb-2">Conflicts:</h3>
                <div className="space-y-2">
                  {generationResult.conflicts.map((conflict, idx) => (
                    <div key={idx} className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <div className="font-semibold text-red-800">{conflict.subject} - {conflict.faculty}</div>
                      <div className="text-sm text-red-600">
                        Required: {conflict.required} periods, Placed: {conflict.placed}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {timetable && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                <span className="mr-3">📋</span>
                Timetable for {selectedSection?.name}
                {timetable.isPublished && (
                  <span className="ml-4 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-full text-sm font-semibold shadow-lg">
                    ✓ Published
                  </span>
                )}
              </h2>
            </div>
            <div className="overflow-x-auto">
              <TimetableGrid timetable={timetable} />
            </div>
          </div>
        )}

        {!timetable && !loading && (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <div className="text-6xl mb-4">📅</div>
            <p className="text-xl text-gray-600 mb-2">No timetable found</p>
            <p className="text-gray-500">Generate one to get started!</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default TimetableGenerator;

