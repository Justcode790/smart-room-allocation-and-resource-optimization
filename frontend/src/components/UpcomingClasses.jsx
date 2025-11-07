import React, { useState, useEffect } from 'react';
import { upcomingClassesAPI } from '../api/upcomingClasses';

const UpcomingClasses = ({ userRole = 'student', showNextClass = true, showTodayRemaining = true, showThisWeek = false }) => {
  const [upcomingData, setUpcomingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUpcomingClasses();
    // Refresh every 5 minutes
    const interval = setInterval(fetchUpcomingClasses, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [userRole]);

  const fetchUpcomingClasses = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const apiCall = userRole === 'faculty' 
        ? upcomingClassesAPI.getFacultyUpcoming 
        : upcomingClassesAPI.getStudentUpcoming;
      
      const response = await apiCall();
      setUpcomingData(response.data);
    } catch (error) {
      console.error('Error fetching upcoming classes:', error);
      setError(error.response?.data?.error || 'Failed to load upcoming classes');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'current': return 'bg-green-100 text-green-800 border-green-200';
      case 'upcoming': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatTimeUntil = (timeUntil) => {
    if (!timeUntil) return null;
    return `in ${timeUntil}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="text-red-600 text-sm">{error}</div>
      </div>
    );
  }

  if (!upcomingData) {
    return (
      <div className="text-center py-8 text-gray-500">
        <div className="text-4xl mb-2">📅</div>
        <p>No upcoming classes found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Next Class */}
      {showNextClass && upcomingData.nextClass && (
        <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl p-6 shadow-lg">
          <h3 className="text-lg font-bold mb-4 flex items-center">
            <span className="mr-2">⏰</span>
            Next Class
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm opacity-90">Subject</div>
              <div className="text-xl font-semibold">{upcomingData.nextClass.subject?.name}</div>
            </div>
            <div>
              <div className="text-sm opacity-90">Time</div>
              <div className="text-lg font-semibold">
                {upcomingData.nextClass.startTime} - {upcomingData.nextClass.endTime}
              </div>
            </div>
            <div>
              <div className="text-sm opacity-90">Room</div>
              <div className="text-lg font-semibold">{upcomingData.nextClass.room?.code}</div>
              <div className="text-sm opacity-75">{upcomingData.nextClass.room?.building}</div>
            </div>
            <div>
              <div className="text-sm opacity-90">
                {userRole === 'faculty' ? 'Section' : 'Faculty'}
              </div>
              <div className="text-lg font-semibold">
                {userRole === 'faculty' 
                  ? upcomingData.nextClass.section?.name 
                  : upcomingData.nextClass.faculty?.name}
              </div>
            </div>
          </div>
          <div className="mt-4 text-center">
            <div className="bg-white bg-opacity-20 rounded-lg px-4 py-2 inline-block">
              <span className="text-sm font-medium">
                {upcomingData.nextClass.day} • Period {upcomingData.nextClass.period}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Today's Remaining Classes */}
      {showTodayRemaining && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <span className="mr-2">📅</span>
            Today's Remaining Classes
          </h3>
          
          {upcomingData.remainingToday && upcomingData.remainingToday.length > 0 ? (
            <div className="space-y-3">
              {upcomingData.remainingToday.map((cls, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4">
                      <div className="text-center">
                        <div className="text-lg font-bold text-blue-600">P{cls.period}</div>
                        <div className="text-xs text-gray-500">Period</div>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{cls.subject?.name}</h4>
                        <p className="text-sm text-gray-600">
                          {cls.room?.code} • {cls.room?.building}
                          {userRole === 'faculty' && cls.section && ` • ${cls.section.name}`}
                          {userRole === 'student' && cls.faculty && ` • ${cls.faculty.name}`}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {cls.startTime} - {cls.endTime}
                    </div>
                    {cls.timeUntil && (
                      <div className="text-xs text-blue-600 font-medium">
                        {formatTimeUntil(cls.timeUntil)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">🎉</div>
              <p>No more classes today!</p>
            </div>
          )}
        </div>
      )}

      {/* This Week's Classes */}
      {showThisWeek && upcomingData.thisWeekClasses && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <span className="mr-2">📊</span>
            This Week's Classes
          </h3>
          
          {upcomingData.thisWeekClasses.length > 0 ? (
            <div className="space-y-2">
              {upcomingData.thisWeekClasses.map((cls, index) => (
                <div key={index} className={`flex items-center justify-between p-3 rounded-lg border ${
                  cls.isToday ? 'bg-blue-50 border-blue-200' : 
                  cls.isTomorrow ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className="flex items-center space-x-3">
                    <div className="text-center min-w-[60px]">
                      <div className="text-sm font-semibold text-gray-900">{cls.day.substring(0, 3)}</div>
                      <div className="text-xs text-gray-500">P{cls.period}</div>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{cls.subject?.name}</h4>
                      <p className="text-sm text-gray-600">
                        {cls.room?.code}
                        {userRole === 'faculty' && cls.section && ` • ${cls.section.name}`}
                        {userRole === 'student' && cls.faculty && ` • ${cls.faculty.name}`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {cls.startTime}
                    </div>
                    {cls.isToday && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        Today
                      </span>
                    )}
                    {cls.isTomorrow && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                        Tomorrow
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">📅</div>
              <p>No classes scheduled this week</p>
            </div>
          )}
        </div>
      )}

      {/* Summary */}
      {upcomingData.summary && (
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">{upcomingData.summary.totalTodayClasses}</div>
              <div className="text-sm text-gray-600">Today's Classes</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{upcomingData.summary.remainingTodayClasses}</div>
              <div className="text-sm text-gray-600">Remaining</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">{upcomingData.summary.upcomingThisWeek}</div>
              <div className="text-sm text-gray-600">This Week</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UpcomingClasses;