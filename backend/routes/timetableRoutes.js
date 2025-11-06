const express = require('express');
const router = express.Router();
const timetableController = require('../controllers/timetableController');
const { authenticate, authorize } = require('../utils/auth');

router.post('/generate', authenticate, authorize('admin'), timetableController.generateTimetable);
router.get('/', authenticate, timetableController.getAllTimetables);
router.get('/section/:sectionId', authenticate, timetableController.getTimetable);
router.get('/faculty/my', authenticate, timetableController.getFacultyTimetable);
router.get('/student/my', authenticate, timetableController.getStudentTimetable);
router.put('/:id', authenticate, authorize('admin'), timetableController.updateTimetable);
router.post('/:id/publish', authenticate, authorize('admin'), timetableController.publishTimetable);

module.exports = router;

