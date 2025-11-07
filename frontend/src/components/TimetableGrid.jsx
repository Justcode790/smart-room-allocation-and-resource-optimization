import React from 'react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
// Show all periods 1-8, but mark 3 and 5 as break/lunch
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];

const TimetableGrid = ({ timetable, editable = false, onCellClick }) => {
  if (!timetable || !timetable.schedule) {
    return (
      <div className="text-center py-8 text-gray-500">
        No timetable data available
      </div>
    );
  }

  // Create grid structure
  const grid = {};
  DAYS.forEach(day => {
    grid[day] = {};
    PERIODS.forEach(period => {
      grid[day][period] = null;
    });
  });

  // Populate grid with schedule
  timetable.schedule.forEach(session => {
    const day = session.day;
    const period = session.period;
    if (grid[day] && period >= 1 && period <= 8) {
      // Allow overwriting if needed, or keep first one
      if (grid[day][period] === null) {
        grid[day][period] = session;
      }
    }
  });

  const getTimeSlot = (period) => {
    const times = {
      1: '08:00-08:50',
      2: '09:00-09:50',
      3: '10:10-10:30', // Break
      4: '10:30-11:20',
      5: '12:40-13:40', // Lunch
      6: '13:40-14:30',
      7: '14:30-15:20',
      8: '15:30-16:20'
    };
    return times[period] || '';
  };

  const getSubjectColor = (subjectType) => {
    const colors = {
      Theory: 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-400 text-blue-900',
      Lab: 'bg-gradient-to-br from-green-50 to-green-100 border-green-400 text-green-900',
      Project: 'bg-gradient-to-br from-purple-50 to-purple-100 border-purple-400 text-purple-900'
    };
    return colors[subjectType] || 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-400 text-gray-900';
  };

  return (
    <div className="overflow-x-auto rounded-xl shadow-lg">
      <table className="min-w-full bg-white border-collapse">
        <thead>
          <tr className="bg-gradient-to-r from-gray-800 to-gray-900">
            <th className="px-6 py-4 text-left text-sm font-bold text-white uppercase tracking-wider rounded-tl-xl">
              Day / Period
            </th>
            {PERIODS.map(period => (
              <th key={period} className="px-4 py-4 text-center text-xs font-bold text-white uppercase tracking-wider">
                <div className="font-semibold">Period {period}</div>
                <div className="text-xs text-gray-300 font-normal mt-1">{getTimeSlot(period)}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {DAYS.map((day, dayIdx) => (
            <tr key={day} className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 font-bold text-gray-800 whitespace-nowrap">
                {day}
              </td>
              {PERIODS.map(period => {
                const session = grid[day][period];
                const isBreak = period === 3;
                const isLunch = period === 5;
                return (
                  <td
                    key={period}
                    className={`px-3 py-3 min-w-[160px] ${editable ? 'cursor-pointer hover:bg-blue-50 transition' : ''} ${isBreak || isLunch ? 'bg-gray-100' : ''}`}
                    onClick={() => editable && onCellClick && onCellClick(day, period, session)}
                  >
                    {isBreak ? (
                      <div className="text-center py-4 text-gray-500 text-xs font-semibold">BREAK</div>
                    ) : isLunch ? (
                      <div className="text-center py-4 text-gray-500 text-xs font-semibold">LUNCH</div>
                    ) : session ? (
                      <div className={`p-3 rounded-lg border-2 shadow-sm transition-transform hover:scale-105 ${getSubjectColor(session.subjectRef?.type || 'Theory')}`}>
                        <div className="font-bold text-sm mb-1">
                          {session.subjectRef?.name || session.subjectRef?.code || (typeof session.subjectRef === 'string' ? session.subjectRef : 'Subject')}
                        </div>
                        <div className="text-xs mt-1 opacity-80 font-medium">
                          {session.facultyRef?.name || (typeof session.facultyRef === 'string' ? session.facultyRef : 'Faculty')}
                        </div>
                        <div className="text-xs mt-1 font-mono bg-white bg-opacity-50 px-2 py-1 rounded inline-block">
                          {session.roomRef?.code || (typeof session.roomRef === 'string' ? session.roomRef : 'Room')}
                        </div>
                        {session.startTime && session.endTime && (
                          <div className="text-xs mt-1 text-gray-600">{session.startTime} - {session.endTime}</div>
                        )}
                      </div>
                    ) : (
                      <div className="text-gray-300 text-xs text-center py-6">-</div>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TimetableGrid;

