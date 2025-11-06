const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { authenticate } = require('../utils/auth');

router.get('/', authenticate, analyticsController.getAnalytics);
router.get('/room/:roomId/history', authenticate, analyticsController.getRoomHistory);

module.exports = router;

