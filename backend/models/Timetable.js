const mongoose = require('mongoose');

const scheduleItemSchema = new mongoose.Schema({
  day: {
    type: String,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    required: true
  },
  period: {
    type: Number,
    required: true,
    min: 1,
    max: 8
  },
  startTime: {
    type: String,
    required: true
  },
  endTime: {
    type: String,
    required: true
  },
  subjectRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: false,
    default: null
  },
  facultyRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Faculty',
    required: false,
    default: null
  },
  roomRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: false,
    default: null
  },
  note: {
    type: String,
    default: ''
  }
}, { _id: false });

const timetableSchema = new mongoose.Schema({
  sectionRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Section',
    required: true
  },
  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  version: {
    type: String,
    default: '1.0'
  },
  generatedAt: {
    type: Date,
    default: Date.now
  },
  schedule: [scheduleItemSchema],
  isPublished: {
    type: Boolean,
    default: false
  },
  previousVersion: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Timetable',
    default: null
  },
  revisionHistory: [{
    version: String,
    generatedAt: Date,
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    changes: String
  }],
  isDemo: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Timetable', timetableSchema);

