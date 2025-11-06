import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import HeatmapChart from '../components/HeatmapChart';
import { analyticsAPI } from '../api/analytics';

const Analytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    try {
      const res = await analyticsAPI.getAnalytics(dateRange.startDate, dateRange.endDate);
      setAnalytics(res.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
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

  return (
    <Layout>
      <div className="px-4 py-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Analytics & Insights</h1>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center space-x-4 mb-4">
            <label className="text-sm font-semibold text-gray-700">Start Date:</label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <label className="text-sm font-semibold text-gray-700">End Date:</label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {analytics && (
          <>
            <div className="mb-6">
              <HeatmapChart heatmapData={analytics.heatmap} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Idle Rooms</h2>
                {analytics.idleRooms && analytics.idleRooms.length > 0 ? (
                  <div className="space-y-3">
                    {analytics.idleRooms.map((item, idx) => (
                      <div key={idx} className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-semibold text-gray-900">{item.room.code}</div>
                            <div className="text-sm text-gray-600">{item.room.name}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-yellow-600">{item.utilization}%</div>
                            <div className="text-xs text-gray-500">utilized</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600">No idle rooms found.</p>
                )}
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Overloaded Rooms</h2>
                {analytics.overloadedRooms && analytics.overloadedRooms.length > 0 ? (
                  <div className="space-y-3">
                    {analytics.overloadedRooms.map((item, idx) => (
                      <div key={idx} className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg">
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-semibold text-gray-900">{item.room.code}</div>
                            <div className="text-sm text-gray-600">{item.room.name}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-red-600">{item.utilization}%</div>
                            <div className="text-xs text-gray-500">utilized</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600">No overloaded rooms found.</p>
                )}
              </div>
            </div>

            {analytics.suggestions && analytics.suggestions.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Optimization Suggestions</h2>
                <div className="space-y-4">
                  {analytics.suggestions.map((suggestion, idx) => (
                    <div key={idx} className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
                      <div className="font-semibold text-gray-900 mb-2">
                        Move from {suggestion.fromRoom} to {suggestion.toRoom}
                      </div>
                      <div className="text-sm text-gray-700">{suggestion.reason}</div>
                      {suggestion.sessionsAffected > 0 && (
                        <div className="text-xs text-gray-600 mt-2">
                          {suggestion.sessionsAffected} sessions affected
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
};

export default Analytics;

