import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import NotificationCard from '../components/NotificationCard';
import { timetableAPI } from '../api/timetable';
import { useSocket } from '../context/SocketContext';

const TimetableManagement = () => {
  const [timetables, setTimetables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTimetables, setSelectedTimetables] = useState([]);
  const [filter, setFilter] = useState('all'); // all, published, draft
  const [sortBy, setSortBy] = useState('generatedAt'); // generatedAt, sectionName, status
  const { socket } = useSocket();

  useEffect(() => {
    fetchTimetables();
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on('timetable:update', () => {
        fetchTimetables();
      });
      socket.on('timetable:deleted', () => {
        fetchTimetables();
      });
      return () => {
        socket.off('timetable:update');
        socket.off('timetable:deleted');
      };
    }
  }, [socket]);

  const fetchTimetables = async () => {
    try {
      setLoading(true);
      const res = await timetableAPI.getAll();
      setTimetables(res.data);
    } catch (error) {
      console.error('Error fetching timetables:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (timetableId, timetableName, isPublished) => {
    const statusText = isPublished ? 'published' : 'draft';
    const confirmMessage = `Are you sure you want to delete this ${statusText} timetable for ${timetableName}?\n\n${
      isPublished 
        ? 'This will notify all affected students and faculty about the deletion.' 
        : 'This action cannot be undone.'
    }`;
    
    if (!window.confirm(confirmMessage)) return;
    
    try {
      await timetableAPI.delete(timetableId);
      alert(`Timetable deleted successfully! ${isPublished ? 'Notifications sent to affected users.' : ''}`);
      fetchTimetables();
      setSelectedTimetables(prev => prev.filter(id => id !== timetableId));
    } catch (error) {
      alert('Error deleting timetable: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedTimetables.length === 0) return;
    
    const selectedTimetableData = timetables.filter(tt => selectedTimetables.includes(tt._id));
    const publishedCount = selectedTimetableData.filter(tt => tt.isPublished).length;
    const draftCount = selectedTimetableData.length - publishedCount;
    
    let confirmMessage = `Are you sure you want to delete ${selectedTimetables.length} timetable(s)?\n\n`;
    if (publishedCount > 0) {
      confirmMessage += `• ${publishedCount} published timetable(s)\n`;
    }
    if (draftCount > 0) {
      confirmMessage += `• ${draftCount} draft timetable(s)\n`;
    }
    confirmMessage += '\nThis action cannot be undone.';
    if (publishedCount > 0) {
      confirmMessage += ' Affected users will be notified.';
    }
    
    if (!window.confirm(confirmMessage)) return;
    
    try {
      const res = await timetableAPI.deleteMultiple(selectedTimetables);
      alert(`${res.data.deletedCount} timetable(s) deleted successfully!`);
      fetchTimetables();
      setSelectedTimetables([]);
    } catch (error) {
      alert('Error deleting timetables: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleSelectAll = () => {
    const filteredTimetables = getFilteredAndSortedTimetables();
    if (selectedTimetables.length === filteredTimetables.length) {
      setSelectedTimetables([]);
    } else {
      setSelectedTimetables(filteredTimetables.map(tt => tt._id));
    }
  };

  const handleSelectTimetable = (timetableId) => {
    setSelectedTimetables(prev => {
      if (prev.includes(timetableId)) {
        return prev.filter(id => id !== timetableId);
      } else {
        return [...prev, timetableId];
      }
    });
  };

  const getFilteredAndSortedTimetables = () => {
    let filtered = timetables;
    
    // Apply filter
    if (filter === 'published') {
      filtered = filtered.filter(tt => tt.isPublished);
    } else if (filter === 'draft') {
      filtered = filtered.filter(tt => !tt.isPublished);
    }
    
    // Apply sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'sectionName':
          return (a.sectionRef?.name || '').localeCompare(b.sectionRef?.name || '');
        case 'status':
          return (b.isPublished ? 1 : 0) - (a.isPublished ? 1 : 0);
        case 'generatedAt':
        default:
          return new Date(b.generatedAt) - new Date(a.generatedAt);
      }
    });
    
    return filtered;
  };

  const filteredTimetables = getFilteredAndSortedTimetables();

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <NotificationCard />
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl shadow-xl p-8 text-white">
          <h1 className="text-4xl font-bold mb-2">🗂️ Timetable Management</h1>
          <p className="text-purple-100">Manage all generated and published timetables</p>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4">
              {/* Filter */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Filter:</label>
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
                >
                  <option value="all">All Timetables</option>
                  <option value="published">Published Only</option>
                  <option value="draft">Draft Only</option>
                </select>
              </div>

              {/* Sort */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Sort by:</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
                >
                  <option value="generatedAt">Date Generated</option>
                  <option value="sectionName">Section Name</option>
                  <option value="status">Status</option>
                </select>
              </div>
            </div>

            {/* Bulk Actions */}
            {selectedTimetables.length > 0 && (
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600">
                  {selectedTimetables.length} selected
                </span>
                <button
                  onClick={handleBulkDelete}
                  className="bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-2 rounded-lg font-semibold hover:from-red-600 hover:to-red-700 transition shadow-lg transform hover:scale-105"
                >
                  🗑️ Delete Selected
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Timetables List */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {filteredTimetables.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-6xl mb-4">📅</div>
              <p className="text-xl text-gray-600 mb-2">No timetables found</p>
              <p className="text-gray-500">
                {filter === 'all' 
                  ? 'Generate some timetables to get started!' 
                  : `No ${filter} timetables available.`
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left">
                      <input
                        type="checkbox"
                        checked={selectedTimetables.length === filteredTimetables.length && filteredTimetables.length > 0}
                        onChange={handleSelectAll}
                        className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                      />
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Section</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Version</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Generated</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Generated By</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredTimetables.map((timetable) => (
                    <tr key={timetable._id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedTimetables.includes(timetable._id)}
                          onChange={() => handleSelectTimetable(timetable._id)}
                          className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900">
                          {timetable.sectionRef?.name || 'Unknown Section'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {timetable.sectionRef?.department || 'No Department'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {timetable.isPublished ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                            ✓ Published
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                            📝 Draft
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {timetable.version || '1.0'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {new Date(timetable.generatedAt).toLocaleDateString()} <br />
                        <span className="text-gray-500">
                          {new Date(timetable.generatedAt).toLocaleTimeString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {timetable.generatedBy?.name || timetable.generatedBy?.email || 'System'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => window.open(`/timetable/${timetable._id}`, '_blank')}
                            className="bg-blue-100 text-blue-700 px-3 py-1 rounded-lg text-sm font-medium hover:bg-blue-200 transition"
                          >
                            👁️ View
                          </button>
                          {!timetable.isPublished && (
                            <button
                              onClick={async () => {
                                try {
                                  await timetableAPI.publish(timetable._id);
                                  alert('Timetable published successfully!');
                                  fetchTimetables();
                                } catch (error) {
                                  alert('Error publishing timetable: ' + (error.response?.data?.error || error.message));
                                }
                              }}
                              className="bg-green-100 text-green-700 px-3 py-1 rounded-lg text-sm font-medium hover:bg-green-200 transition"
                            >
                              📢 Publish
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(
                              timetable._id, 
                              timetable.sectionRef?.name || 'Unknown Section',
                              timetable.isPublished
                            )}
                            className="bg-red-100 text-red-700 px-3 py-1 rounded-lg text-sm font-medium hover:bg-red-200 transition"
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Summary */}
        {timetables.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border-2 border-blue-200">
                <div className="text-sm text-gray-600 font-medium mb-1">Total Timetables</div>
                <div className="text-2xl font-bold text-blue-600">{timetables.length}</div>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border-2 border-green-200">
                <div className="text-sm text-gray-600 font-medium mb-1">Published</div>
                <div className="text-2xl font-bold text-green-600">
                  {timetables.filter(tt => tt.isPublished).length}
                </div>
              </div>
              <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-xl border-2 border-yellow-200">
                <div className="text-sm text-gray-600 font-medium mb-1">Draft</div>
                <div className="text-2xl font-bold text-yellow-600">
                  {timetables.filter(tt => !tt.isPublished).length}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default TimetableManagement;