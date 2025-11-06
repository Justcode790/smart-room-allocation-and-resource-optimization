const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['admin', 'faculty', 'student'],
    required: true,
    default: 'student'
  },
  regNumber: {
    type: String,
    sparse: true
  },
  mobile: {
    type: String,
    trim: true
  },
  sectionRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Section'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);

