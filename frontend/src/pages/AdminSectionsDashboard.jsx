import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { sectionAPI } from '../api/section';
import { timetableAPI } from '../api/timetable';

const AdminSectionsDashboard = () => {
  const [sections, setSections] = useState([]);
  const [timetableStatus, setTimetableStatus] = useState({});
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generationResult, setGenerationResult] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [sectionsRes, timetablesRes] = await Promise.all([
        sectionAPI.getAll(),
        timetableAPI.getAll().catch(() => ({ data: [] }))
      ]);

      setSections(sectionsRes.data || []);
      
      // Map timetable status by section
      const statusMap = {};
      (timetablesRes.data || []).forEach(tt => {
        if (tt.sectionRef?._id) {
          statusMap[tt.sectionRef._id] = {
            exists: true,
            isPublished: tt.isPublished,
            generatedAt: tt.generatedAt
          };
        }
      });
      setTimetableStatus(statusMap);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
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

  const handleGenerateAll = async () => {
    setGenerating(true);
    setGenerationResult(null);
    try {
      const res = await timetableAPI.generateAll();
      setGenerationResult(res.data);
      showToast(`Generated ${res.data.summary.generated} timetables successfully!`, 'success');
    } catch (error) {
      console.error('Error generating timetables:', error);
      
      // Handle different error types
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        showToast('Request timed out. This operation may take several minutes. Please try again or generate timetables individually.', 'error', true);
      } else if (error.response) {
        // Server responded with error
        const errorMsg = error.response.data?.error || error.response.data?.message || 'Error generating timetables';
        showToast(errorMsg, 'error', true);
      } else if (error.request) {
        // Request made but no response
        showToast('No response from server. Please check your connection and try again.', 'error', true);
      } else {
        // Something else happened
        showToast('Error generating timetables. Please try again.', 'error', true);
      }
    } finally {
      setGenerating(false);
    }
  };

  const showToast = (message, type = 'info', persist = false) => {
    // Simple toast implementation
    const toast = document.createElement('div');
    toast.className = `fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-lg text-white font-medium ${
      type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500'
    }`;
    toast.textContent = message;
    document.body.appendChild(toast);
    if (!persist) {
      setTimeout(() => toast.remove(), 3000);
    }
  };

  return (
    <Layout>
      <div className="px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">📚 Sections Management</h1>
            <p className="text-gray-600 mt-2">Manage timetables for all sections</p>
          </div>
          <button
            onClick={handleGenerateAll}
            disabled={generating}
            className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {generating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Generating All... (This may take a few minutes)</span>
              </>
            ) : (
              <>
                <span>🤖</span>
                <span>Generate All Timetables</span>
              </>
            )}
          </button>
        </div>

        {generationResult && (
          <div className="mb-6 bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Generation Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-700">{generationResult.summary.generated}</div>
                <div className="text-sm text-green-600">Successfully Generated</div>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-red-700">{generationResult.failed.length}</div>
                <div className="text-sm text-red-600">Failed</div>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-700">{generationResult.summary.totalSections}</div>
                <div className="text-sm text-blue-600">Total Sections</div>
              </div>
            </div>
            {generationResult.failed.length > 0 && (
              <div className="mt-4">
                <h4 className="font-semibold text-gray-900 mb-2">Failed Sections:</h4>
                <div className="space-y-1">
                  {generationResult.failed.map((f, idx) => (
                    <div key={idx} className="text-sm text-red-600">
                      • {f.sectionName}: {f.error}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {sections.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-6 text-center text-gray-600">
            No sections found. Please create sections first.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sections.map((section) => {
              const status = timetableStatus[section._id];
              return (
                <div
                  key={section._id}
                  className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500 hover:shadow-xl transition"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-1">{section.name}</h3>
                      <div className="text-sm text-gray-600 space-y-1">
                        {section.department && (
                          <div className="flex items-center">
                            <span className="font-semibold mr-2">Department:</span>
                            <span>{section.department}</span>
                          </div>
                        )}
                        <div className="flex items-center">
                          <span className="font-semibold mr-2">Year:</span>
                          <span>{section.year}</span>
                        </div>
                        {section.strength > 0 && (
                          <div className="flex items-center">
                            <span className="font-semibold mr-2">Strength:</span>
                            <span>{section.strength} students</span>
                          </div>
                        )}
                      </div>
                    </div>
                    {status?.exists && (
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          status.isPublished
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {status.isPublished ? 'Published' : 'Draft'}
                      </span>
                    )}
                  </div>

                  {status?.exists && (
                    <div className="text-xs text-gray-500 mb-4">
                      Last updated: {new Date(status.generatedAt).toLocaleDateString()}
                    </div>
                  )}

                  <Link
                    to={`/admin/timetable-editor/${section._id}`}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-3 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition shadow-lg flex items-center justify-center"
                  >
                    <span className="mr-2">🖊️</span>
                    Open Editor
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default AdminSectionsDashboard;

