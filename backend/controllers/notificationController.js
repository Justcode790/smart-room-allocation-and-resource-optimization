const Notification = require('../models/Notification');

// Get user notifications with pagination and filtering
exports.getUserNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      page = 1,
      limit = 20,
      unreadOnly = false,
      type = null
    } = req.query;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      unreadOnly: unreadOnly === 'true',
      type: type || null
    };

    const result = await Notification.getUserNotifications(userId, options);
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Get unread notification count
exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user._id;
    const unreadCount = await Notification.countDocuments({ 
      userId, 
      isRead: false 
    });
    
    res.json({ unreadCount });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ 
      error: error.message 
    });
  }
};

// Mark notification as read
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const notification = await Notification.findOne({ 
      _id: id, 
      userId 
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    await notification.markAsRead();
    
    res.json({ 
      message: 'Notification marked as read',
      notification 
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ 
      error: error.message 
    });
  }
};

// Mark multiple notifications as read
exports.markMultipleAsRead = async (req, res) => {
  try {
    const { notificationIds } = req.body;
    const userId = req.user._id;

    if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
      return res.status(400).json({ error: 'Invalid notification IDs' });
    }

    const result = await Notification.markMultipleAsRead(userId, notificationIds);
    
    res.json({ 
      message: `${result.modifiedCount} notifications marked as read`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Error marking multiple notifications as read:', error);
    res.status(500).json({ 
      error: error.message 
    });
  }
};

// Mark all notifications as read
exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user._id;

    const result = await Notification.updateMany(
      { userId, isRead: false },
      { 
        isRead: true, 
        readAt: new Date() 
      }
    );
    
    res.json({ 
      message: `${result.modifiedCount} notifications marked as read`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ 
      error: error.message 
    });
  }
};

// Delete notification
exports.deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const notification = await Notification.findOneAndDelete({ 
      _id: id, 
      userId 
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    res.json({ 
      message: 'Notification deleted successfully',
      deletedNotification: notification
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ 
      error: error.message 
    });
  }
};

// Delete multiple notifications
exports.deleteMultipleNotifications = async (req, res) => {
  try {
    const { notificationIds } = req.body;
    const userId = req.user._id;

    if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
      return res.status(400).json({ error: 'Invalid notification IDs' });
    }

    const result = await Notification.deleteMany({
      _id: { $in: notificationIds },
      userId
    });
    
    res.json({ 
      message: `${result.deletedCount} notifications deleted`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Error deleting multiple notifications:', error);
    res.status(500).json({ 
      error: error.message 
    });
  }
};

// Delete all read notifications
exports.deleteAllRead = async (req, res) => {
  try {
    const userId = req.user._id;

    const result = await Notification.deleteMany({
      userId,
      isRead: true
    });
    
    res.json({ 
      message: `${result.deletedCount} read notifications deleted`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Error deleting read notifications:', error);
    res.status(500).json({ 
      error: error.message 
    });
  }
};

// Create notification (Admin only)
exports.createNotification = async (req, res) => {
  try {
    const { 
      userIds, 
      title, 
      message, 
      type = 'general', 
      data = {}, 
      priority = 'medium' 
    } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ error: 'User IDs are required' });
    }

    if (!title || !message) {
      return res.status(400).json({ error: 'Title and message are required' });
    }

    // Create notifications for all specified users
    const notifications = await Promise.all(
      userIds.map(userId => 
        Notification.createNotification(userId, title, message, type, data, priority)
      )
    );

    // Send real-time notifications via Socket.IO
    if (req.io) {
      userIds.forEach(userId => {
        req.io.to(`user_${userId}`).emit('notification:new', {
          title,
          message,
          type,
          data,
          priority,
          timestamp: new Date()
        });
      });
    }
    
    res.json({ 
      message: `${notifications.length} notifications created`,
      notifications: notifications.map(n => ({
        id: n._id,
        userId: n.userId,
        title: n.title,
        type: n.type
      }))
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({ 
      error: error.message 
    });
  }
};

// Get notification statistics (Admin only)
exports.getNotificationStats = async (req, res) => {
  try {
    const [
      totalNotifications,
      unreadNotifications,
      notificationsByType,
      recentNotifications
    ] = await Promise.all([
      Notification.countDocuments(),
      Notification.countDocuments({ isRead: false }),
      Notification.aggregate([
        { $group: { _id: '$type', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      Notification.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('userId', 'name email role')
        .lean()
    ]);

    res.json({
      totalNotifications,
      unreadNotifications,
      notificationsByType,
      recentNotifications
    });
  } catch (error) {
    console.error('Error fetching notification stats:', error);
    res.status(500).json({ 
      error: error.message 
    });
  }
};