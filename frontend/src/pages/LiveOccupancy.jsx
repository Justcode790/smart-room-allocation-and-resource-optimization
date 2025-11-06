import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import RoomCard from '../components/RoomCard';
import NotificationCard from '../components/NotificationCard';
import { roomAPI } from '../api/room';
import { occupancyAPI } from '../api/occupancy';
import { useSocket } from '../context/SocketContext';

const LiveOccupancy = () => {
  const [rooms, setRooms] = useState([]);
  const [occupancies, setOccupancies] = useState({});
  const [loading, setLoading] = useState(true);
  const { socket } = useSocket();

  useEffect(() => {
    fetchRooms();
    fetchOccupancies();
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on('occupancy:update', (data) => {
        setOccupancies(prev => ({
          ...prev,
          [data.roomId]: data.count
        }));
      });
      return () => socket.off('occupancy:update');
    }
  }, [socket]);

  const fetchRooms = async () => {
    try {
      const res = await roomAPI.getAll();
      setRooms(res.data);
    } catch (error) {
      console.error('Error fetching rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOccupancies = async () => {
    try {
      for (const room of rooms) {
        try {
          const res = await occupancyAPI.getByRoom(room._id);
          if (res.data.length > 0) {
            const latest = res.data[0];
            setOccupancies(prev => ({
              ...prev,
              [room._id]: latest.count
            }));
          }
        } catch (error) {
          // Room might not have occupancy data yet
        }
      }
    } catch (error) {
      console.error('Error fetching occupancies:', error);
    }
  };

  const handleSimulate = async () => {
    try {
      await occupancyAPI.simulate();
      setTimeout(() => fetchOccupancies(), 1000);
    } catch (error) {
      alert('Error simulating occupancy: ' + (error.response?.data?.error || error.message));
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
      <NotificationCard />
      <div className="px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Live Room Occupancy</h1>
          <button
            onClick={handleSimulate}
            className="bg-gradient-to-r from-green-600 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-green-700 hover:to-blue-700 transition shadow-lg"
          >
            Simulate Room Usage
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.map(room => (
            <RoomCard
              key={room._id}
              room={room}
              occupancy={occupancies[room._id]}
            />
          ))}
        </div>

        {rooms.length === 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <p className="text-gray-600">No rooms found.</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default LiveOccupancy;

