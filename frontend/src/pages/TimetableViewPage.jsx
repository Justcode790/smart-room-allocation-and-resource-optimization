import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import TimetableGrid from '../components/TimetableGrid';
import { timetableAPI } from '../api/timetable';

const TimetableViewPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [timetable, setTimetable] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTimetable();
  }, [id]);

  const fetchTimetable = async () => {
    try {
      setLoading(true);
      const res = await timetableAPI.getById(id);
      setTimetable(res.data);
    } catch (error) {
      console.error('Error fetching timetable:', error);
      setError(error.response?.data?.error || 'Failed to load timetable');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
          <div className="text-6xl mb-4">❌</div>
          <p className="text-xl text-red-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/admin/timetable-management')}
            className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-600 hover:to-purple-700 transition"
          >
            ← Back to Timetable Management
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl shadow-xl p-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">📋 Timetable View</h1>
              <p className="text-purple-100">
                {timetable?.sectionRef?.name || 'Unknown Section'} - {timetable?.sectionRef?.department || 'No Department'}
              </p>
            </div>
            <div className="text-right">
              {timetable?.isPublished ? (
                <span className="inline-flex items-center px-4 py-2 bg-green-500 text-white rounded-full text-sm font-semibold shadow-lg">
                  ✓ Published
                </span>
              ) : (
                <span className="inline-flex items-center px-4 py-2 bg-yellow-500 text-white rounded-full text-sm font-semibold shadow-lg">
                  📝 Draft
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/admin/timetable-management')}
              className="bg-gradient-to-r from-gray-500 to-gray-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-gray-600 hover:to-gray-700 transition shadow-lg transform hover:scale-105"
            >
              ← Back to Management
            </button>
            
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600">
                <span className="font-semibold">Version:</span> {timetable?.version || '1.0'}
              </div>
              <div className="text-sm text-gray-600">
                <span className="font-semibold">Generated:</span> {new Date(timetable?.generatedAt).toLocaleString()}
              </div>
              {timetable?.generatedBy && (
                <div className="text-sm text-gray-600">
                  <span className="font-semibold">By:</span> {timetable.generatedBy.name || timetable.generatedBy.email}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Timetable */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <span className="mr-3">📅</span>
            Weekly Schedule
          </h2>
          <div className="overflow-x-auto">
            <TimetableGrid timetable={timetable} />
          </div>
        </div>

        {/* Statistics */}
        {timetable?.schedule && (
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Schedule Statistics</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border-2 border-blue-200">
                <div className="text-sm text-gray-600 font-medium mb-1">Total Periods</div>
                <div className="text-2xl font-bold text-blue-600">{timetable.schedule.length}</div>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border-2 border-green-200">
                <div className="text-sm text-gray-600 font-medium mb-1">Unique Subjects</div>
                <div className="text-2xl font-bold text-green-600">
                  {new Set(timetable.schedule.map(s => s.subjectRef?._id || s.subjectRef)).size}
                </div>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border-2 border-purple-200">
                <div className="text-sm text-gray-600 font-medium mb-1">Faculty Assigned</div>
                <div className="text-2xl font-bold text-purple-600">
                  {new Set(timetable.schedule.map(s => s.facultyRef?._id || s.facultyRef)).size}
                </div>
              </div>
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-xl border-2 border-orange-200">
                <div className="text-sm text-gray-600 font-medium mb-1">Rooms Used</div>
                <div className="text-2xl font-bold text-orange-600">
                  {new Set(timetable.schedule.map(s => s.roomRef?._id || s.roomRef)).size}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default TimetableViewPage;