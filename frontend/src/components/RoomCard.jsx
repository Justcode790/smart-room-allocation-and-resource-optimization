import React from 'react';

const RoomCard = ({ room, occupancy, onClick }) => {
  const getStatusColor = (status) => {
    const colors = {
      active: 'bg-green-100 text-green-800 border-green-300',
      maintenance: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      offline: 'bg-red-100 text-red-800 border-red-300'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const utilization = occupancy && room.capacity
    ? ((occupancy / room.capacity) * 100).toFixed(1)
    : 0;

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl shadow-lg p-6 border-l-4 ${
        room.type === 'Lab' ? 'border-blue-500' : 'border-purple-500'
      } cursor-pointer hover:shadow-xl transition ${onClick ? 'hover:scale-105' : ''}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900">{room.code}</h3>
          <p className="text-sm text-gray-600">{room.name}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(room.status)}`}>
          {room.status}
        </span>
      </div>

      <div className="space-y-2">
        <div className="flex items-center text-sm text-gray-600">
          <span className="font-semibold mr-2">Type:</span>
          <span>{room.type}</span>
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <span className="font-semibold mr-2">Capacity:</span>
          <span>{room.capacity}</span>
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <span className="font-semibold mr-2">Building:</span>
          <span>{room.building} - Floor {room.floor}</span>
        </div>
        {occupancy !== undefined && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="font-semibold text-gray-700">Current Occupancy:</span>
              <span className="font-bold text-blue-600">{occupancy} / {room.capacity}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${Math.min(utilization, 100)}%` }}
              ></div>
            </div>
            <div className="text-xs text-gray-500 mt-1">{utilization}% utilized</div>
          </div>
        )}
      </div>

      {room.equipment && room.equipment.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs font-semibold text-gray-600 mb-2">Equipment:</p>
          <div className="flex flex-wrap gap-2">
            {room.equipment.map((eq, idx) => (
              <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                {eq}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomCard;

