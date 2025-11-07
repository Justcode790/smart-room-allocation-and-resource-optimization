import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { blockAPI } from '../api/block';

export default function AdminCampusSetup() {
  const [blocks, setBlocks] = useState([]);
  const [newBlock, setNewBlock] = useState({ name: "", buildingCode: "" });
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [floorNumber, setFloorNumber] = useState("");
  const [newRoom, setNewRoom] = useState({ 
    code: "", 
    name: "", 
    type: "Classroom", 
    capacity: 40,
    equipment: "",
    status: "active",
    allowTheoryClass: true,
    allowLabClass: false
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchBlocks();
  }, []);

  const fetchBlocks = async () => {
    try {
      setLoading(true);
      const res = await blockAPI.getAll();
      setBlocks(res.data);
    } catch (err) {
      setError('Failed to load blocks');
      console.error('Error fetching blocks:', err);
    } finally {
      setLoading(false);
    }
  };

  const addBlock = async () => {
    if (!newBlock.name || !newBlock.buildingCode) {
      setError('Please fill in all block fields');
      return;
    }
    try {
      const res = await blockAPI.create(newBlock);
      setBlocks([...blocks, res.data]);
      setNewBlock({ name: "", buildingCode: "" });
      setError("");
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add block');
    }
  };

  const addFloor = async (blockId) => {
    if (!floorNumber) {
      setError('Please enter a floor number');
      return;
    }
    try {
      const res = await blockAPI.addFloor(blockId, parseInt(floorNumber));
      setBlocks(blocks.map(b => (b._id === blockId ? res.data : b)));
      setFloorNumber("");
      setError("");
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add floor');
    }
  };

  const addRoom = async (blockId, floorNumber) => {
    if (!newRoom.code || !newRoom.name) {
      setError('Please fill in room code and name');
      return;
    }
    try {
      const payload = {
        ...newRoom,
        capacity: parseInt(newRoom.capacity) || 40,
        equipment: newRoom.equipment
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      };
      const res = await blockAPI.addRoom(blockId, floorNumber, payload);
      setBlocks(blocks.map(b => (b._id === blockId ? res.data : b)));
      setNewRoom({ 
        code: "", 
        name: "", 
        type: "Classroom", 
        capacity: 40,
        equipment: "",
        status: "active",
        allowTheoryClass: true,
        allowLabClass: false
      });
      setError("");
      alert("✅ Room added successfully!");
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add room');
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
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-xl p-8 text-white">
          <h1 className="text-4xl font-bold mb-2">🏫 Campus Setup</h1>
          <p className="text-blue-100">Dynamically create and manage university infrastructure (Blocks → Floors → Rooms)</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            {error}
          </div>
        )}

        {/* Add Block */}
        <div className="bg-white p-6 rounded-2xl shadow-xl">
          <h3 className="text-xl font-semibold mb-4 text-gray-800">Add New Block</h3>
          <div className="flex flex-wrap gap-4">
            <input
              className="border border-gray-300 rounded-lg p-3 flex-1 min-w-[200px] focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Block Name (e.g., N-Block)"
              value={newBlock.name}
              onChange={e => setNewBlock({ ...newBlock, name: e.target.value })}
            />
            <input
              className="border border-gray-300 rounded-lg p-3 flex-1 min-w-[200px] focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Building Code (e.g., NB)"
              value={newBlock.buildingCode}
              onChange={e => setNewBlock({ ...newBlock, buildingCode: e.target.value })}
            />
            <button
              className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition shadow-lg"
              onClick={addBlock}
            >
              Add Block
            </button>
          </div>
        </div>

        {/* Display Blocks */}
        {blocks.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <div className="text-6xl mb-4">🏢</div>
            <p className="text-gray-600 text-lg">No blocks created yet. Add your first block above!</p>
          </div>
        ) : (
          blocks.map(b => (
            <div key={b._id} className="border border-gray-200 p-6 rounded-2xl shadow-xl bg-white">
              <h3 className="font-bold text-2xl mb-4 text-gray-800">
                {b.name} ({b.buildingCode})
              </h3>

              {/* Add Floor */}
              <div className="mb-4 pb-4 border-b border-gray-200">
                <div className="flex flex-wrap gap-4 items-center">
                  <input
                    className="border border-gray-300 rounded-lg p-2 w-32 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Floor #"
                    type="number"
                    value={floorNumber}
                    onChange={e => setFloorNumber(e.target.value)}
                  />
                  <button
                    className="bg-gradient-to-r from-green-600 to-green-700 text-white px-4 py-2 rounded-lg font-semibold hover:from-green-700 hover:to-green-800 transition shadow-lg"
                    onClick={() => addFloor(b._id)}
                  >
                    Add Floor
                  </button>
                </div>
              </div>

              {/* Floors List */}
              {b.floors.length === 0 ? (
                <p className="text-gray-500 italic">No floors added yet</p>
              ) : (
                b.floors
                  .sort((a, b) => a.floorNumber - b.floorNumber)
                  .map(f => (
                    <div key={f.floorNumber} className="ml-4 mb-6 border-l-4 border-blue-500 pl-4">
                      <p className="font-semibold text-lg mb-3 text-gray-700">Floor {f.floorNumber}</p>

                      {/* Add Room */}
                      <div className="mb-4 bg-gray-50 p-4 rounded-lg">
                        <div className="flex flex-wrap gap-3 items-center mb-3">
                          <input
                            className="border border-gray-300 rounded-lg p-2 w-24 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Code"
                            value={newRoom.code}
                            onChange={e => setNewRoom({ ...newRoom, code: e.target.value })}
                          />
                          <input
                            className="border border-gray-300 rounded-lg p-2 w-40 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Name"
                            value={newRoom.name}
                            onChange={e => setNewRoom({ ...newRoom, name: e.target.value })}
                          />
                          <select
                            className="border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            value={newRoom.type}
                            onChange={e => setNewRoom({ ...newRoom, type: e.target.value })}
                          >
                            <option>Classroom</option>
                            <option>Lab</option>
                            <option>StaffRoom</option>
                            <option>SeminarHall</option>
                            <option>ConferenceHall</option>
                          </select>
                          <input
                            className="border border-gray-300 rounded-lg p-2 w-24 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Capacity"
                            type="number"
                            value={newRoom.capacity}
                            onChange={e => setNewRoom({ ...newRoom, capacity: parseInt(e.target.value) || 0 })}
                          />
                          <select
                            className="border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            value={newRoom.status}
                            onChange={e => setNewRoom({ ...newRoom, status: e.target.value })}
                          >
                            <option value="active">Active</option>
                            <option value="maintenance">Maintenance</option>
                            <option value="offline">Offline</option>
                          </select>
                        </div>
                        <div className="flex flex-wrap gap-3 items-center mb-3">
                          <input
                            className="border border-gray-300 rounded-lg p-2 flex-1 min-w-[300px] focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Equipment (comma-separated, e.g., Projector, Whiteboard, Computers)"
                            value={newRoom.equipment}
                            onChange={e => setNewRoom({ ...newRoom, equipment: e.target.value })}
                          />
                        </div>
                        <div className="flex flex-wrap gap-4 items-center mb-3">
                          <label className="flex items-center text-sm">
                            <input
                              type="checkbox"
                              className="mr-2"
                              checked={newRoom.allowTheoryClass}
                              onChange={e => setNewRoom({ ...newRoom, allowTheoryClass: e.target.checked })}
                            />
                            Allow Theory Classes
                          </label>
                          <label className="flex items-center text-sm">
                            <input
                              type="checkbox"
                              className="mr-2"
                              checked={newRoom.allowLabClass}
                              onChange={e => setNewRoom({ ...newRoom, allowLabClass: e.target.checked })}
                            />
                            Allow Lab Classes
                          </label>
                        </div>
                        <button
                          className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 transition shadow-lg"
                          onClick={() => addRoom(b._id, f.floorNumber)}
                        >
                          Add Room
                        </button>
                      </div>

                      {/* Room Table */}
                      {f.rooms.length === 0 ? (
                        <p className="text-gray-500 italic text-sm">No rooms on this floor</p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm border-collapse border border-gray-300 rounded-lg">
                            <thead>
                              <tr className="bg-gradient-to-r from-gray-100 to-gray-200">
                                <th className="border border-gray-300 px-4 py-2 text-left">Code</th>
                                <th className="border border-gray-300 px-4 py-2 text-left">Name</th>
                                <th className="border border-gray-300 px-4 py-2 text-left">Type</th>
                                <th className="border border-gray-300 px-4 py-2 text-left">Capacity</th>
                                <th className="border border-gray-300 px-4 py-2 text-left">Equipment</th>
                                <th className="border border-gray-300 px-4 py-2 text-left">Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {f.rooms.map((r, idx) => (
                                <tr key={r._id || idx} className="border-t border-gray-300 hover:bg-gray-50">
                                  <td className="border border-gray-300 px-4 py-2 font-medium">{r.code}</td>
                                  <td className="border border-gray-300 px-4 py-2">{r.name}</td>
                                  <td className="border border-gray-300 px-4 py-2">
                                    <span className="px-2 py-1 rounded bg-blue-100 text-blue-800 text-xs font-medium">
                                      {r.type}
                                    </span>
                                  </td>
                                  <td className="border border-gray-300 px-4 py-2">{r.capacity}</td>
                                  <td className="border border-gray-300 px-4 py-2">
                                    {r.equipment && r.equipment.length > 0 ? (
                                      <span className="text-xs text-gray-600">
                                        {Array.isArray(r.equipment) ? r.equipment.join(", ") : r.equipment}
                                      </span>
                                    ) : (
                                      <span className="text-xs text-gray-400 italic">None</span>
                                    )}
                                  </td>
                                  <td className="border border-gray-300 px-4 py-2">
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                                      r.status === 'active' 
                                        ? 'bg-green-100 text-green-800' 
                                        : r.status === 'maintenance'
                                        ? 'bg-yellow-100 text-yellow-800'
                                        : 'bg-red-100 text-red-800'
                                    }`}>
                                      {r.status}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  ))
              )}
            </div>
          ))
        )}
      </div>
    </Layout>
  );
}

