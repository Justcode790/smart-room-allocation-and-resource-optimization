import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import TimetableGrid from '../components/TimetableGrid';
import { timetableAPI } from '../api/timetable';

const TimetableView = () => {
  const { id } = useParams();
  const [timetable, setTimetable] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const run = async () => {
      try {
        const res = await timetableAPI.getById(id);
        console.log('Timetable data received:', res.data);
        console.log('Schedule items:', res.data?.schedule);
        if (res.data?.schedule && res.data.schedule.length > 0) {
          console.log('First schedule item:', res.data.schedule[0]);
          console.log('SubjectRef type:', typeof res.data.schedule[0]?.subjectRef);
          console.log('SubjectRef value:', res.data.schedule[0]?.subjectRef);
        }
        setTimetable(res.data);
      } catch (e) {
        console.error('Error loading timetable:', e);
        setError(e.response?.data?.error || 'Failed to load timetable');
      } finally {
        setLoading(false);
      }
    };
    if (id) {
      run();
    }
  }, [id]);

  return (
    <Layout>
      <div className="px-4 py-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Timetable</h1>

        {loading && (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        )}

        {!loading && error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-6">{error}</div>
        )}

        {!loading && timetable && (
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="text-gray-800 font-semibold">
                Section: {timetable.sectionRef?.name || 'Unknown Section'}
              </div>
              <div className="text-sm text-gray-500">
                Generated: {new Date(timetable.generatedAt).toLocaleString()}
              </div>
            </div>
            {timetable.schedule && timetable.schedule.length > 0 ? (
              <>
                <div className="mb-4 text-sm text-gray-600">
                  Total schedule items: {timetable.schedule.length}
                </div>
                <TimetableGrid timetable={timetable} />
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No schedule data available for this timetable</p>
                <p className="text-xs mt-2">Schedule array length: {timetable.schedule?.length || 0}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default TimetableView;


