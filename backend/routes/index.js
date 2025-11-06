const express = require('express');
const router = express.Router();
const authRoutes = require('./authRoutes');
const roomRoutes = require('./roomRoutes');
const timetableRoutes = require('./timetableRoutes');
const analyticsRoutes = require('./analyticsRoutes');
const subjectRoutes = require('./subjectRoutes');
const facultyRoutes = require('./facultyRoutes');
const sectionRoutes = require('./sectionRoutes');
const mappingRoutes = require('./mappingRoutes');
const occupancyRoutes = require('./occupancyRoutes');

router.use('/auth', authRoutes);
router.use('/rooms', roomRoutes);
router.use('/timetables', timetableRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/subjects', subjectRoutes);
router.use('/faculty', facultyRoutes);
router.use('/sections', sectionRoutes);
router.use('/mappings', mappingRoutes);
router.use('/occupancy', occupancyRoutes);

module.exports = router;

