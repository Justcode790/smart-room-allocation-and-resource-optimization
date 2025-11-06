const Timetable = require('../models/Timetable');
const Section = require('../models/Section');
const schedulerService = require('../services/schedulerService');
const notificationService = require('../services/notificationService');

exports.generateTimetable = async (req, res) => {
  try {
    const { sectionId } = req.body;
    const adminId = req.user._id;

    const result = await schedulerService.generateTimetable(sectionId, adminId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getTimetable = async (req, res) => {
  try {
    const { sectionId } = req.params;
    const timetable = await Timetable.findOne({ sectionRef: sectionId })
      .populate('sectionRef')
      .populate('schedule.subjectRef')
      .populate('schedule.facultyRef')
      .populate('schedule.roomRef')
      .sort({ generatedAt: -1 });

    if (!timetable) {
      return res.status(404).json({ error: 'Timetable not found' });
    }

    res.json(timetable);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAllTimetables = async (req, res) => {
  try {
    const timetables = await Timetable.find()
      .populate('sectionRef')
      .sort({ generatedAt: -1 });
    res.json(timetables);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateTimetable = async (req, res) => {
  try {
    const { schedule } = req.body;
    const timetable = await Timetable.findByIdAndUpdate(
      req.params.id,
      { schedule },
      { new: true, runValidators: true }
    )
      .populate('sectionRef')
      .populate('schedule.subjectRef')
      .populate('schedule.facultyRef')
      .populate('schedule.roomRef');

    if (!timetable) {
      return res.status(404).json({ error: 'Timetable not found' });
    }

    // Emit Socket.IO update
    if (req.io) {
      req.io.emit('timetable:update', {
        sectionId: timetable.sectionRef._id,
        change: 'updated',
        timetable
      });
    }

    res.json(timetable);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.publishTimetable = async (req, res) => {
  try {
    const timetable = await Timetable.findByIdAndUpdate(
      req.params.id,
      { isPublished: true },
      { new: true }
    )
      .populate('sectionRef')
      .populate('schedule.subjectRef')
      .populate('schedule.facultyRef')
      .populate('schedule.roomRef');

    if (!timetable) {
      return res.status(404).json({ error: 'Timetable not found' });
    }

    // Send notifications
    await notificationService.notifyTimetablePublished(timetable, req.io);

    res.json({ message: 'Timetable published successfully', timetable });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getFacultyTimetable = async (req, res) => {
  try {
    const facultyId = req.user._id;
    const timetables = await Timetable.find({ isPublished: true })
      .populate('sectionRef')
      .populate('schedule.subjectRef')
      .populate('schedule.facultyRef')
      .populate('schedule.roomRef');

    const facultySessions = [];
    timetables.forEach(timetable => {
      timetable.schedule.forEach(session => {
        if (session.facultyRef._id.toString() === facultyId.toString()) {
          facultySessions.push({
            ...session.toObject(),
            section: timetable.sectionRef
          });
        }
      });
    });

    res.json(facultySessions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getStudentTimetable = async (req, res) => {
  try {
    const sectionId = req.user.sectionRef;
    if (!sectionId) {
      return res.status(400).json({ error: 'Student not assigned to a section' });
    }

    const timetable = await Timetable.findOne({
      sectionRef: sectionId,
      isPublished: true
    })
      .populate('sectionRef')
      .populate('schedule.subjectRef')
      .populate('schedule.facultyRef')
      .populate('schedule.roomRef')
      .sort({ generatedAt: -1 });

    if (!timetable) {
      return res.status(404).json({ error: 'Timetable not found' });
    }

    res.json(timetable);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

