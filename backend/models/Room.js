const mongoose = require('mongoose');

const maintenanceWindowSchema = new mongoose.Schema({
  from: Date,
  to: Date,
  reason: String
}, { _id: false });

const roomSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  building: {
    type: String,
    required: true,
    trim: true
  },
  floor: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    enum: ['Classroom', 'Lab'],
    required: true
  },
  capacity: {
    type: Number,
    required: true,
    min: 1
  },
  equipment: [{
    type: String,
    trim: true
  }],
  status: {
    type: String,
    enum: ['active', 'maintenance', 'offline'],
    default: 'active'
  },
  occupancyStatus: {
    type: String,
    enum: ['idle', 'occupied', 'reserved'],
    default: 'idle'
  },
  currentSession: {
    facultyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Faculty',
      default: null
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      default: null
    },
    startTime: {
      type: Date,
      default: null
    },
    endTime: {
      type: Date,
      default: null
    },
    day: {
      type: String,
      default: null
    },
    period: {
      type: Number,
      default: null
    }
  },
  allowTheoryClass: {
    type: Boolean,
    default: false
  },
  allowLabClass: {
    type: Boolean,
    default: true
  },
  maintenanceWindows: [maintenanceWindowSchema]
}, {
  timestamps: true
});

module.exports = mongoose.model('Room', roomSchema);

