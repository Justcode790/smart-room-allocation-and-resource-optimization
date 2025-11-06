const nodemailer = require('nodemailer');
const User = require('../models/User');

class NotificationService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  initializeTransporter() {
    // Use Gmail or SMTP based on env vars
    this.transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }

  async sendEmail(to, subject, html) {
    try {
      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.log(`[Email Simulation] To: ${to}, Subject: ${subject}`);
        return { success: true, simulated: true };
      }

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to,
        subject,
        html
      };

      const info = await this.transporter.sendMail(mailOptions);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Email send error:', error);
      return { success: false, error: error.message };
    }
  }

  async notifyTimetablePublished(timetable, io) {
    try {
      const section = await require('../models/Section').findById(timetable.sectionRef);
      if (!section) return;

      // Get all users in this section (students and faculty)
      const users = await User.find({
        $or: [
          { sectionRef: timetable.sectionRef },
          { role: 'faculty' }
        ]
      });

      const subject = `Timetable Published - ${section.name}`;
      const html = `
        <h2>Timetable Published</h2>
        <p>The timetable for <strong>${section.name}</strong> has been published.</p>
        <p>Please check your dashboard for the updated schedule.</p>
        <p><a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/timetable">View Timetable</a></p>
      `;

      // Send emails and Socket.IO notifications
      const notifications = [];
      for (const user of users) {
        if (user.email) {
          await this.sendEmail(user.email, subject, html);
        }
        
        notifications.push({
          userId: user._id,
          message: `Timetable for ${section.name} has been published`,
          type: 'timetable_published'
        });
      }

      // Emit Socket.IO events
      if (io) {
        notifications.forEach(notif => {
          io.to(`user_${notif.userId}`).emit('notification:new', {
            message: notif.message,
            type: notif.type,
            timestamp: new Date()
          });
        });

        // Broadcast timetable update
        io.emit('timetable:update', {
          sectionId: timetable.sectionRef,
          change: 'published',
          timetable: timetable
        });
      }

      return { success: true, notified: users.length };
    } catch (error) {
      console.error('Notification error:', error);
      return { success: false, error: error.message };
    }
  }

  async notifyRoomStatusChange(room, io) {
    try {
      const users = await User.find({ role: { $in: ['faculty', 'admin'] } });

      const subject = `Room Status Update - ${room.code}`;
      const html = `
        <h2>Room Status Changed</h2>
        <p>Room <strong>${room.code}</strong> status has been updated to <strong>${room.status}</strong>.</p>
      `;

      if (io) {
        io.emit('room:update', {
          roomId: room._id,
          status: room.status,
          room: room
        });
      }

      return { success: true };
    } catch (error) {
      console.error('Room notification error:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new NotificationService();

