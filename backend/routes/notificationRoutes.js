const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authenticate, authorize } = require('../utils/auth');

// User notification routes
router.get('/', authenticate, notificationController.getUserNotifications);
router.get('/unread-count', authenticate, notificationController.getUnreadCount);
router.put('/:id/read', authenticate, notificationController.markAsRead);
router.put('/mark-multiple-read', authenticate, notificationController.markMultipleAsRead);
router.put('/mark-all-read', authenticate, notificationController.markAllAsRead);
router.delete('/:id', authenticate, notificationController.deleteNotification);
router.delete('/delete-multiple', authenticate, notificationController.deleteMultipleNotifications);
router.delete('/delete-all-read', authenticate, notificationController.deleteAllRead);

// Admin notification routes
router.post('/create', authenticate, authorize('admin'), notificationController.createNotification);
router.get('/stats', authenticate, authorize('admin'), notificationController.getNotificationStats);

module.exports = router;