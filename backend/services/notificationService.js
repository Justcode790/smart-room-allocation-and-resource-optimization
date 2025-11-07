const nodemailer = require('nodemailer');
const User = require('../models/User');
const Notification = require('../models/Notification');

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

  // Helper method to create and send notifications
  async createAndSendNotification(userId, title, message, type = 'general', data = {}, priority = 'medium', io = null) {
    try {
      // Save notification to database
      const notification = await Notification.createNotification(userId, title, message, type, data, priority);
      
      // Send real-time notification via Socket.IO
      if (io) {
        const userIdStr = userId.toString();
        console.log(`Sending notification to user_${userIdStr}: ${title}`);
        
        io.to(`user_${userIdStr}`).emit('notification:new', {
          id: notification._id,
          title,
          message,
          type,
          data,
          priority,
          timestamp: notification.createdAt
        });

        // Also emit unread count update
        const unreadCount = await Notification.countDocuments({ 
          userId, 
          isRead: false 
        });
        
        io.to(`user_${userIdStr}`).emit('notification:unread-count', {
          unreadCount
        });
      }
      
      return { success: true, notification };
    } catch (error) {
      console.error('Error creating notification:', error);
      return { success: false, error: error.message };
    }
  }

  async notifyTimetablePublished(timetable, io) {
    try {
      const section = await require('../models/Section').findById(timetable.sectionRef);
      if (!section) {
        console.error('Section not found for timetable:', timetable.sectionRef);
        return { success: false, error: 'Section not found' };
      }

      // Get all users in this section (students and faculty)
      const users = await User.find({
        $or: [
          { sectionRef: timetable.sectionRef },
          { role: 'faculty' }
        ]
      });

      if (users.length === 0) {
        console.log('No users found to notify for timetable publication');
        return { success: true, notified: 0 };
      }

      const subject = `Timetable Published - ${section.name}`;
      const html = `
        <h2>Timetable Published</h2>
        <p>The timetable for <strong>${section.name}</strong> has been published.</p>
        <p>Please check your dashboard for the updated schedule.</p>
        <p><a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/timetable">View Timetable</a></p>
      `;

      // Send emails and create notifications
      let emailsSent = 0;
      let notificationsCreated = 0;
      
      const title = `Timetable Published - ${section.name}`;
      const message = `Timetable for ${section.name} has been published`;
      const notificationData = {
        sectionName: section.name,
        sectionId: section._id,
        timetableId: timetable._id
      };

      for (const user of users) {
        if (user.email) {
          const result = await this.sendEmail(user.email, subject, html);
          if (result.success) emailsSent++;
        }
        
        // Create and send notification
        const notificationResult = await this.createAndSendNotification(
          user._id,
          title,
          message,
          'timetable_published',
          notificationData,
          'high',
          io
        );
        
        if (notificationResult.success) {
          notificationsCreated++;
        }
      }

      // Emit Socket.IO events
      if (io) {

        // Broadcast timetable update
        io.emit('timetable:update', {
          sectionId: timetable.sectionRef,
          change: 'published',
          timetable: timetable
        });
      }

      console.log(`Notified ${users.length} users about timetable publication (${emailsSent} emails, ${notificationsCreated} notifications created)`);
      return { success: true, notified: users.length, emailsSent, notificationsCreated };
    } catch (error) {
      console.error('Notification error:', error);
      return { success: false, error: error.message };
    }
  }

  async notifyFacultySchedulesOnGenerate(timetable, io) {
    try {
      // Build sessions by faculty
      const sessionsByFaculty = new Map();
      for (const session of timetable.schedule) {
        const fid = session.facultyRef?.toString?.() || (session.facultyRef && session.facultyRef._id?.toString?.());
        if (!fid) continue;
        if (!sessionsByFaculty.has(fid)) sessionsByFaculty.set(fid, []);
        sessionsByFaculty.get(fid).push({
          day: session.day,
          period: session.period,
          startTime: session.startTime,
          endTime: session.endTime,
          subjectId: session.subjectRef,
          roomId: session.roomRef
        });
      }

      const User = require('../models/User');
      const Faculty = require('../models/Faculty');
      const Room = require('../models/Room');
      const Subject = require('../models/Subject');

      for (const [facultyId, sessions] of sessionsByFaculty.entries()) {
        const faculty = await Faculty.findById(facultyId);
        if (!faculty) continue;
        const user = await User.findOne({ email: faculty.email, role: 'faculty' });

        // Hydrate subject/room names minimally for email
        const subjectIds = [...new Set(sessions.map(s => s.subjectId))];
        const roomIds = [...new Set(sessions.map(s => s.roomId))];
        const subjects = await Subject.find({ _id: { $in: subjectIds } }).select('_id name');
        const rooms = await Room.find({ _id: { $in: roomIds } }).select('_id code name');
        const subjectMap = new Map(subjects.map(s => [s._id.toString(), s.name]));
        const roomMap = new Map(rooms.map(r => [r._id.toString(), `${r.code} - ${r.name}`]));

        const sorted = sessions.sort((a, b) => a.day.localeCompare(b.day) || a.period - b.period);
        const htmlRows = sorted.map(s => `
          <tr>
            <td style="padding:6px 8px;border:1px solid #eee">${s.day}</td>
            <td style="padding:6px 8px;border:1px solid #eee">${s.period}</td>
            <td style="padding:6px 8px;border:1px solid #eee">${s.startTime} - ${s.endTime}</td>
            <td style="padding:6px 8px;border:1px solid #eee">${subjectMap.get(String(s.subjectId)) || 'Subject'}</td>
            <td style="padding:6px 8px;border:1px solid #eee">${roomMap.get(String(s.roomId)) || 'Room'}</td>
          </tr>
        `).join('');

        const html = `
          <h2>Your Generated Schedule</h2>
          <p>Here is your latest generated timetable. It may be updated when published.</p>
          <table style="border-collapse:collapse;border:1px solid #eee">
            <thead>
              <tr>
                <th style="padding:6px 8px;border:1px solid #eee;text-align:left">Day</th>
                <th style="padding:6px 8px;border:1px solid #eee;text-align:left">Period</th>
                <th style="padding:6px 8px;border:1px solid #eee;text-align:left">Time</th>
                <th style="padding:6px 8px;border:1px solid #eee;text-align:left">Subject</th>
                <th style="padding:6px 8px;border:1px solid #eee;text-align:left">Room</th>
              </tr>
            </thead>
            <tbody>${htmlRows}</tbody>
          </table>
        `;

        if (faculty.email) {
          await this.sendEmail(faculty.email, 'Your Generated Timetable', html);
        }

        if (io && user) {
          const userIdStr = user._id.toString();
          const notificationMessage = `Your timetable has been generated with ${sessions.length} assigned period${sessions.length !== 1 ? 's' : ''}`;
          
          console.log(`Sending timetable notification to user_${userIdStr} for faculty ${faculty.name}`);
          
          // Emit notification:new for the NotificationCard component
          io.to(`user_${userIdStr}`).emit('notification:new', {
            message: notificationMessage,
            type: 'timetable_generated',
            timestamp: new Date()
          });
          
          // Also emit timetable:faculty-generated for specific handling
          io.to(`user_${userIdStr}`).emit('timetable:faculty-generated', {
            message: 'Your timetable has been generated',
            sessions: sorted,
            timestamp: new Date()
          });
        } else if (io && !user) {
          console.warn(`User not found for faculty ${faculty.name} (${faculty.email})`);
        }
      }

      return { success: true };
    } catch (error) {
      console.error('notifyFacultySchedulesOnGenerate error:', error);
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
        // Emit room:update for real-time updates
        io.emit('room:update', {
          roomId: room._id,
          status: room.status,
          room: room
        });

        // Send notification:new to admins when room becomes idle
        if (room.status === 'idle') {
          const adminUsers = users.filter(u => u.role === 'admin');
          adminUsers.forEach(admin => {
            const userIdStr = admin._id.toString();
            console.log(`Sending room idle notification to admin user_${userIdStr}`);
            
            io.to(`user_${userIdStr}`).emit('notification:new', {
              message: `Room ${room.code} is now idle`,
              type: 'room_idle',
              roomId: room._id,
              roomCode: room.code,
              timestamp: new Date()
            });
          });
        }

        // Send notification:new to all users for room status changes
        users.forEach(user => {
          const userIdStr = user._id.toString();
          io.to(`user_${userIdStr}`).emit('notification:new', {
            message: `Room ${room.code} status changed to ${room.status}`,
            type: 'room_status_change',
            roomId: room._id,
            roomCode: room.code,
            status: room.status,
            timestamp: new Date()
          });
        });
      }

      return { success: true };
    } catch (error) {
      console.error('Room notification error:', error);
      return { success: false, error: error.message };
    }
  }

  // New method for room change notifications
  async notifyRoomChange(oldRoomId, newRoomId, day, period, subjectId, sectionId, io) {
    try {
      const [oldRoom, newRoom, subject, section] = await Promise.all([
        require('../models/Room').findById(oldRoomId),
        require('../models/Room').findById(newRoomId),
        require('../models/Subject').findById(subjectId),
        require('../models/Section').findById(sectionId)
      ]);

      if (!oldRoom || !newRoom || !subject || !section) {
        return { success: false, error: 'Required data not found' };
      }

      // Get all students in the section
      const students = await User.find({ 
        sectionRef: sectionId, 
        role: 'student' 
      });

      // Get faculty teaching this subject
      const faculty = await User.find({ 
        role: 'faculty'
      });

      const message = `Room changed for ${subject.name} on ${day} Period ${period}: ${oldRoom.code} → ${newRoom.code}`;
      
      const emailSubject = `Room Change Alert - ${subject.name}`;
      const emailHtml = `
        <h2>Room Change Notification</h2>
        <p><strong>Subject:</strong> ${subject.name}</p>
        <p><strong>Section:</strong> ${section.name}</p>
        <p><strong>Day:</strong> ${day}</p>
        <p><strong>Period:</strong> ${period}</p>
        <p><strong>Old Room:</strong> ${oldRoom.code} - ${oldRoom.name}</p>
        <p><strong>New Room:</strong> ${newRoom.code} - ${newRoom.name}</p>
        <p>Please note this change for your upcoming class.</p>
      `;

      // Notify students
      for (const student of students) {
        if (student.email) {
          await this.sendEmail(student.email, emailSubject, emailHtml);
        }

        if (io) {
          const userIdStr = student._id.toString();
          io.to(`user_${userIdStr}`).emit('notification:new', {
            message: message,
            type: 'room_change',
            day: day,
            period: period,
            oldRoom: oldRoom.code,
            newRoom: newRoom.code,
            subject: subject.name,
            timestamp: new Date()
          });
        }
      }

      // Notify relevant faculty
      for (const facultyMember of faculty) {
        if (facultyMember.email) {
          await this.sendEmail(facultyMember.email, emailSubject, emailHtml);
        }

        if (io) {
          const userIdStr = facultyMember._id.toString();
          io.to(`user_${userIdStr}`).emit('notification:new', {
            message: message,
            type: 'room_change',
            day: day,
            period: period,
            oldRoom: oldRoom.code,
            newRoom: newRoom.code,
            subject: subject.name,
            timestamp: new Date()
          });
        }
      }

      return { 
        success: true, 
        notified: students.length + faculty.length,
        studentsNotified: students.length,
        facultyNotified: faculty.length
      };
    } catch (error) {
      console.error('Room change notification error:', error);
      return { success: false, error: error.message };
    }
  }

  // New method for session cancellation notifications
  async notifySessionCancellation(roomId, day, period, subjectId, sectionId, reason, io) {
    try {
      const [room, subject, section] = await Promise.all([
        require('../models/Room').findById(roomId),
        require('../models/Subject').findById(subjectId),
        require('../models/Section').findById(sectionId)
      ]);

      if (!room || !subject || !section) {
        return { success: false, error: 'Required data not found' };
      }

      // Get all students in the section
      const students = await User.find({ 
        sectionRef: sectionId, 
        role: 'student' 
      });

      const message = `Class cancelled: ${subject.name} on ${day} Period ${period} in ${room.code}${reason ? ` - ${reason}` : ''}`;
      
      const emailSubject = `Class Cancellation - ${subject.name}`;
      const emailHtml = `
        <h2>Class Cancellation Notice</h2>
        <p><strong>Subject:</strong> ${subject.name}</p>
        <p><strong>Section:</strong> ${section.name}</p>
        <p><strong>Day:</strong> ${day}</p>
        <p><strong>Period:</strong> ${period}</p>
        <p><strong>Room:</strong> ${room.code} - ${room.name}</p>
        ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
        <p>This class has been cancelled. Please check for updates.</p>
      `;

      // Notify students
      for (const student of students) {
        if (student.email) {
          await this.sendEmail(student.email, emailSubject, emailHtml);
        }

        if (io) {
          const userIdStr = student._id.toString();
          io.to(`user_${userIdStr}`).emit('notification:new', {
            message: message,
            type: 'session_cancelled',
            day: day,
            period: period,
            room: room.code,
            subject: subject.name,
            reason: reason,
            timestamp: new Date()
          });
        }
      }

      return { 
        success: true, 
        notified: students.length
      };
    } catch (error) {
      console.error('Session cancellation notification error:', error);
      return { success: false, error: error.message };
    }
  }

  // New method for timetable deletion notifications
  async notifyTimetableDeleted(timetableInfo, deletedByUser, io) {
    try {
      // Get all users who might be affected by this timetable deletion
      const users = await User.find({
        $or: [
          { sectionRef: timetableInfo.sectionId }, // Students in the section
          { role: 'faculty' }, // All faculty members
          { role: 'admin' } // All admin users
        ]
      });

      if (users.length === 0) {
        console.log('No users found to notify for timetable deletion');
        return { success: true, notified: 0 };
      }

      const subject = `Timetable Deleted - ${timetableInfo.sectionName}`;
      const statusText = timetableInfo.isPublished ? 'published' : 'draft';
      
      const html = `
        <h2>Timetable Deleted</h2>
        <p>The ${statusText} timetable for <strong>${timetableInfo.sectionName}</strong> has been deleted.</p>
        <p><strong>Deleted by:</strong> ${deletedByUser.name || deletedByUser.email}</p>
        <p><strong>Version:</strong> ${timetableInfo.version}</p>
        <p><strong>Generated on:</strong> ${new Date(timetableInfo.generatedAt).toLocaleString()}</p>
        ${timetableInfo.isPublished ? 
          '<p><strong>Note:</strong> This was a published timetable. Please check for a new timetable or contact administration.</p>' : 
          '<p><strong>Note:</strong> This was a draft timetable. The deletion should not affect your current schedule.</p>'
        }
        <p><a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/timetable">Check Current Timetable</a></p>
      `;

      const message = `Timetable for ${timetableInfo.sectionName} has been deleted by ${deletedByUser.name || deletedByUser.email}`;

      // Send notifications to all affected users
      let emailsSent = 0;
      let notificationsCreated = 0;

      const title = `Timetable Deleted - ${timetableInfo.sectionName}`;
      const notificationData = {
        sectionName: timetableInfo.sectionName,
        sectionId: timetableInfo.sectionId,
        deletedBy: deletedByUser.name || deletedByUser.email,
        wasPublished: timetableInfo.isPublished,
        version: timetableInfo.version,
        deletedAt: new Date()
      };

      for (const user of users) {
        // Send email notification
        if (user.email) {
          const result = await this.sendEmail(user.email, subject, html);
          if (result.success) emailsSent++;
        }
        
        // Create and send notification
        const notificationResult = await this.createAndSendNotification(
          user._id,
          title,
          message,
          'timetable_deleted',
          notificationData,
          timetableInfo.isPublished ? 'high' : 'medium',
          io
        );
        
        if (notificationResult.success) {
          notificationsCreated++;
        }
      }

      console.log(`Notified ${users.length} users about timetable deletion (${emailsSent} emails, ${notificationsCreated} notifications created)`);
      
      return { 
        success: true, 
        notified: users.length,
        emailsSent: emailsSent,
        notificationsCreated: notificationsCreated
      };
    } catch (error) {
      console.error('Timetable deletion notification error:', error);
      return { success: false, error: error.message };
    }
  }

  // New method for bulk notifications
  async sendBulkNotification(userIds, message, type, emailSubject, emailHtml, io) {
    try {
      const users = await User.find({ 
        _id: { $in: userIds } 
      });

      let emailsSent = 0;
      let socketNotificationsSent = 0;

      for (const user of users) {
        // Send email if provided
        if (user.email && emailSubject && emailHtml) {
          const result = await this.sendEmail(user.email, emailSubject, emailHtml);
          if (result.success) emailsSent++;
        }

        // Send socket notification
        if (io) {
          const userIdStr = user._id.toString();
          io.to(`user_${userIdStr}`).emit('notification:new', {
            message: message,
            type: type,
            timestamp: new Date()
          });
          socketNotificationsSent++;
        }
      }

      return { 
        success: true, 
        emailsSent: emailsSent,
        socketNotificationsSent: socketNotificationsSent,
        totalUsers: users.length
      };
    } catch (error) {
      console.error('Bulk notification error:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new NotificationService();

