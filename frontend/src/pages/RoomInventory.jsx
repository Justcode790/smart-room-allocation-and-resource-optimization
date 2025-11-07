import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import RoomCard from '../components/RoomCard';
import { roomAPI } from '../api/room';

const RoomInventory = () => {
  const [rooms, setRooms] = useState([]);
  const [filteredRooms, setFilteredRooms] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'active', 'maintenance', 'offline'
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    building: '',
    floor: '',
    type: 'Classroom',
    capacity: '',
    equipment: '',
    status: 'active',
    allowTheoryClass: false,
    allowLabClass: true
  });

  useEffect(() => {
    fetchRooms();
  }, []);

  useEffect(() => {
    // Filter rooms based on status
    if (statusFilter === 'all') {
      setFilteredRooms(rooms);
    } else {
      setFilteredRooms(rooms.filter(room => room.status === statusFilter));
    }
  }, [rooms, statusFilter]);

  const fetchRooms = async () => {
    try {
      const res = await roomAPI.getAll();
      console.log("room data: "+res.data)
      setRooms(res.data);
    } catch (error) {
      console.error('Error fetching rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const equipmentArray = formData.equipment.split(',').map(e => e.trim()).filter(e => e);
      const roomData = {
        ...formData,
        floor: parseInt(formData.floor),
        capacity: parseInt(formData.capacity),
        equipment: equipmentArray
      };

      if (editingRoom) {
        await roomAPI.update(editingRoom._id, roomData);
      } else {
        await roomAPI.create(roomData);
      }
      
      setShowModal(false);
      setEditingRoom(null);
      setFormData({
        code: '',
        name: '',
        building: '',
        floor: '',
        type: 'Classroom',
        capacity: '',
        equipment: '',
        status: 'active',
        allowTheoryClass: false,
        allowLabClass: true
      });
      fetchRooms();
    } catch (error) {
      alert('Error saving room: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleEdit = (room) => {
    setEditingRoom(room);
    setFormData({
      code: room.code,
      name: room.name,
      building: room.building,
      floor: room.floor.toString(),
      type: room.type,
      capacity: room.capacity.toString(),
      equipment: room.equipment.join(', '),
      status: room.status,
      allowTheoryClass: room.allowTheoryClass,
      allowLabClass: room.allowLabClass
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this room?')) return;
    try {
      await roomAPI.delete(id);
      fetchRooms();
    } catch (error) {
      alert('Error deleting room: ' + (error.response?.data?.error || error.message));
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
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Room Inventory</h1>
          <button
            onClick={() => {
              setEditingRoom(null);
              setFormData({
                code: '',
                name: '',
                building: '',
                floor: '',
                type: 'Classroom',
                capacity: '',
                equipment: '',
                status: 'active',
                allowTheoryClass: false,
                allowLabClass: true
              });
              setShowModal(true);
            }}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition shadow-lg"
          >
            + Add Room
          </button>
        </div>

        {/* Status Filter Tabs */}
        <div className="mb-6 bg-white rounded-lg shadow-sm p-4">
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-sm font-medium text-gray-700">Filter by Status:</span>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  statusFilter === 'all'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All ({rooms.length})
              </button>
              <button
                onClick={() => setStatusFilter('active')}
                className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
                  statusFilter === 'active'
                    ? 'bg-green-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                Active ({rooms.filter(r => r.status === 'active').length})
              </button>
              <button
                onClick={() => setStatusFilter('maintenance')}
                className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
                  statusFilter === 'maintenance'
                    ? 'bg-yellow-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                Maintenance ({rooms.filter(r => r.status === 'maintenance').length})
              </button>
              <button
                onClick={() => setStatusFilter('offline')}
                className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
                  statusFilter === 'offline'
                    ? 'bg-red-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                Offline ({rooms.filter(r => r.status === 'offline').length})
              </button>
            </div>
          </div>
        </div>

        {/* Results Count */}
        {statusFilter !== 'all' && (
          <div className="mb-4 text-sm text-gray-600">
            Showing {filteredRooms.length} {filteredRooms.length === 1 ? 'room' : 'rooms'} with status: <span className="font-semibold capitalize">{statusFilter}</span>
          </div>
        )}

        {/* Rooms Grid */}
        {filteredRooms.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-500 text-lg">No rooms found with status: <span className="font-semibold capitalize">{statusFilter}</span></p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRooms.map(room => (
            <div key={room._id} className="relative">
              <RoomCard room={room} />
              <div className="absolute top-4 right-4 flex space-x-2">
                <button
                  onClick={() => handleEdit(room)}
                  className="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 transition text-sm"
                >
                  ✏️
                </button>
                <button
                  onClick={() => handleDelete(room._id)}
                  className="bg-red-500 text-white p-2 rounded-lg hover:bg-red-600 transition text-sm"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {editingRoom ? 'Edit Room' : 'Add New Room'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Room Code</label>
                    <input
                      type="text"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Building</label>
                    <input
                      type="text"
                      value={formData.building}
                      onChange={(e) => setFormData({ ...formData, building: e.target.value })}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Floor</label>
                    <input
                      type="number"
                      value={formData.floor}
                      onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Capacity</label>
                    <input
                      type="number"
                      value={formData.capacity}
                      onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Classroom">Classroom</option>
                      <option value="Lab">Lab</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="active">Active</option>
                      <option value="maintenance">Maintenance</option>
                      <option value="offline">Offline</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Equipment (comma-separated)</label>
                  <input
                    type="text"
                    value={formData.equipment}
                    onChange={(e) => setFormData({ ...formData, equipment: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Projector, Whiteboard, Computers"
                  />
                </div>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.allowTheoryClass}
                      onChange={(e) => setFormData({ ...formData, allowTheoryClass: e.target.checked })}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Allow Theory Classes</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.allowLabClass}
                      onChange={(e) => setFormData({ ...formData, allowLabClass: e.target.checked })}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Allow Lab Classes</span>
                  </label>
                </div>
                <div className="flex justify-end space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    {editingRoom ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default RoomInventory;

