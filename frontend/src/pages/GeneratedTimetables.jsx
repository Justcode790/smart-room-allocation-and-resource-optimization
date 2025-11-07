import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { Link } from 'react-router-dom';
import { timetableAPI } from '../api/timetable';
import { useSocket } from '../context/SocketContext';
import NotificationCard from '../components/NotificationCard';

const GeneratedTimetables = () => {
  const [items, setItems] = useState([]);
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
        setSelectedTimetables([]);
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
      const res = await timetableAPI.getMine();
      setItems(res.data || []);
    } catch (e) {
      console.error('Error loading timetables', e);
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
    
    const selectedTimetableData = items.filter(tt => selectedTimetables.includes(tt._id));
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
    let filtered = items;
    
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

  return (
    <Layout>
      <NotificationCard />
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl shadow-xl p-8 text-white">
          <h1 className="text-4xl font-bold mb-2">📋 Generated Timetables</h1>
          <p className="text-purple-100">View and manage all your generated timetables</p>
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

              {/* Select All */}
              {filteredTimetables.length > 0 && (
                <div className="flex items-center gap-2 mt-6">
                  <input
                    type="checkbox"
                    id="selectAll"
                    checked={selectedTimetables.length === filteredTimetables.length && filteredTimetables.length > 0}
                    onChange={handleSelectAll}
                    className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                  />
                  <label htmlFor="selectAll" className="text-sm font-medium text-gray-700">
                    Select All ({filteredTimetables.length})
                  </label>
                </div>
              )}
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

        {/* Timetables Grid */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        ) : filteredTimetables.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTimetables.map((t) => (
              <div key={t._id} className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
                {/* Card Header */}
                <div className="p-6 pb-4">
                  <div className="flex items-start justify-between mb-4">
                    <input
                      type="checkbox"
                      checked={selectedTimetables.includes(t._id)}
                      onChange={() => handleSelectTimetable(t._id)}
                      className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500 mt-1"
                    />
                    <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
                      t.isPublished 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {t.isPublished ? '✓ Published' : '📝 Draft'}
                    </span>
                  </div>

                  <div className="mb-4">
                    <h3 className="font-bold text-xl text-gray-900 mb-2">
                      {t.sectionRef?.name || 'Unknown Section'}
                    </h3>
                    <p className="text-sm text-gray-600 mb-1">
                      {t.sectionRef?.department || 'No Department'}
                    </p>
                    <p className="text-sm text-gray-500">
                      Version {t.version || '1.0'}
                    </p>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Sessions:</span>
                      <span className="font-semibold text-gray-900">{t.schedule?.length || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Generated:</span>
                      <span className="font-semibold text-gray-900">
                        {new Date(t.generatedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Time:</span>
                      <span className="text-gray-600">
                        {new Date(t.generatedAt).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="px-6 pb-6">
                  <div className="flex gap-2">
                    <Link
                      to={`/admin/generated-timetables/${t._id}`}
                      className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 transition text-center text-sm"
                    >
                      👁️ View
                    </Link>
                    {!t.isPublished && (
                      <button
                        onClick={async () => {
                          try {
                            await timetableAPI.publish(t._id);
                            alert('Timetable published successfully!');
                            fetchTimetables();
                          } catch (error) {
                            alert('Error publishing timetable: ' + (error.response?.data?.error || error.message));
                          }
                        }}
                        className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:from-green-600 hover:to-green-700 transition text-center text-sm"
                      >
                        📢 Publish
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(
                        t._id, 
                        t.sectionRef?.name || 'Unknown Section',
                        t.isPublished
                      )}
                      className="bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:from-red-600 hover:to-red-700 transition text-sm"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Summary */}
        {items.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border-2 border-blue-200">
                <div className="text-sm text-gray-600 font-medium mb-1">Total Timetables</div>
                <div className="text-2xl font-bold text-blue-600">{items.length}</div>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border-2 border-green-200">
                <div className="text-sm text-gray-600 font-medium mb-1">Published</div>
                <div className="text-2xl font-bold text-green-600">
                  {items.filter(tt => tt.isPublished).length}
                </div>
              </div>
              <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-xl border-2 border-yellow-200">
                <div className="text-sm text-gray-600 font-medium mb-1">Draft</div>
                <div className="text-2xl font-bold text-yellow-600">
                  {items.filter(tt => !tt.isPublished).length}
                </div>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border-2 border-purple-200">
                <div className="text-sm text-gray-600 font-medium mb-1">Selected</div>
                <div className="text-2xl font-bold text-purple-600">{selectedTimetables.length}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default GeneratedTimetables;