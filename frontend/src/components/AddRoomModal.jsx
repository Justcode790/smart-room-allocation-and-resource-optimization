import { useState, useEffect } from "react";
import { blockAPI } from "../api/block";

export default function AddRoomModal({ onClose, onSuccess }) {
  const [blocks, setBlocks] = useState([]);
  const [floors, setFloors] = useState([]);
  const [selectedBlock, setSelectedBlock] = useState("");
  const [selectedFloor, setSelectedFloor] = useState("");
  const [roomData, setRoomData] = useState({
    code: "",
    name: "",
    type: "Classroom",
    capacity: "",
    status: "active",
    equipment: "",
    allowTheoryClass: true,
    allowLabClass: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchBlocks();
  }, []);

  const fetchBlocks = async () => {
    try {
      const res = await blockAPI.getAll();
      setBlocks(res.data);
    } catch (err) {
      setError("Failed to load blocks");
      console.error("Error fetching blocks:", err);
    }
  };

  const handleBlockChange = (e) => {
    const blockId = e.target.value;
    setSelectedBlock(blockId);
    const block = blocks.find((b) => b._id === blockId);
    setFloors(block ? block.floors : []);
    setSelectedFloor(""); // Reset floor selection
  };

  const handleCreateRoom = async () => {
    if (!selectedBlock || !selectedFloor) {
      setError("Please select both Block and Floor");
      return;
    }

    if (!roomData.code || !roomData.name) {
      setError("Please fill in room code and name");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const payload = {
        ...roomData,
        capacity: Number(roomData.capacity) || 40,
        equipment: roomData.equipment
          .split(",")
          .map((eq) => eq.trim())
          .filter(Boolean),
      };

      await blockAPI.addRoom(selectedBlock, selectedFloor, payload);
      alert("✅ Room created successfully!");
      
      // Reset form
      setRoomData({
        code: "",
        name: "",
        type: "Classroom",
        capacity: "",
        status: "active",
        equipment: "",
        allowTheoryClass: true,
        allowLabClass: false,
      });
      setSelectedBlock("");
      setSelectedFloor("");
      setFloors([]);
      
      if (onSuccess) onSuccess();
      if (onClose) onClose();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create room");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-[550px] max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-bold mb-4 text-gray-900">Add New Room</h3>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Block & Floor Selection */}
        <div className="space-y-3 mb-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Block
            </label>
            <select
              className="border border-gray-300 rounded-lg p-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={selectedBlock}
              onChange={handleBlockChange}
            >
              <option value="">Select Block</option>
              {blocks.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.name} ({b.buildingCode})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Floor
            </label>
            <select
              className="border border-gray-300 rounded-lg p-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={selectedFloor}
              onChange={(e) => setSelectedFloor(e.target.value)}
              disabled={!selectedBlock}
            >
              <option value="">Select Floor</option>
              {floors.map((f) => (
                <option key={f.floorNumber} value={f.floorNumber}>
                  Floor {f.floorNumber}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Room Inputs */}
        <div className="space-y-3 mb-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Room Code
            </label>
            <input
              type="text"
              className="border border-gray-300 rounded-lg p-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., N-101"
              value={roomData.code}
              onChange={(e) =>
                setRoomData({ ...roomData, code: e.target.value })
              }
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Room Name
            </label>
            <input
              type="text"
              className="border border-gray-300 rounded-lg p-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., Seminar Hall"
              value={roomData.name}
              onChange={(e) =>
                setRoomData({ ...roomData, name: e.target.value })
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Type
              </label>
              <select
                className="border border-gray-300 rounded-lg p-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={roomData.type}
                onChange={(e) =>
                  setRoomData({ ...roomData, type: e.target.value })
                }
              >
                <option>Classroom</option>
                <option>Lab</option>
                <option>StaffRoom</option>
                <option>SeminarHall</option>
                <option>ConferenceHall</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Status
              </label>
              <select
                className="border border-gray-300 rounded-lg p-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={roomData.status}
                onChange={(e) =>
                  setRoomData({ ...roomData, status: e.target.value })
                }
              >
                <option value="active">Active</option>
                <option value="maintenance">Maintenance</option>
                <option value="offline">Offline</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Capacity
            </label>
            <input
              type="number"
              className="border border-gray-300 rounded-lg p-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., 60"
              value={roomData.capacity}
              onChange={(e) =>
                setRoomData({ ...roomData, capacity: e.target.value })
              }
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Equipment
            </label>
            <input
              type="text"
              className="border border-gray-300 rounded-lg p-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Comma-separated (e.g., Projector, Whiteboard, Computers)"
              value={roomData.equipment}
              onChange={(e) =>
                setRoomData({ ...roomData, equipment: e.target.value })
              }
            />
          </div>
        </div>

        {/* Checkboxes */}
        <div className="flex gap-4 text-sm mb-4">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={roomData.allowTheoryClass}
              onChange={(e) =>
                setRoomData({
                  ...roomData,
                  allowTheoryClass: e.target.checked,
                })
              }
              className="mr-2"
            />
            <span className="text-gray-700">Allow Theory Classes</span>
          </label>
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={roomData.allowLabClass}
              onChange={(e) =>
                setRoomData({
                  ...roomData,
                  allowLabClass: e.target.checked,
                })
              }
              className="mr-2"
            />
            <span className="text-gray-700">Allow Lab Classes</span>
          </label>
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3">
          <button
            className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 text-gray-700 font-medium transition"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleCreateRoom}
            disabled={loading}
          >
            {loading ? "Creating..." : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}

