# Installation Guide - Room Session Management

## 🚀 Quick Setup

### Backend Setup
```bash
cd smart/backend
npm install
# This will install the new node-cron dependency
npm start
```

### Frontend Setup
```bash
cd smart/frontend
npm install
npm run dev
```

## 📦 New Dependencies Added

### Backend
- **node-cron**: `^3.0.3` - For automatic room status scheduling

## 🔧 Database Changes

### Room Model Updates
The Room model now includes:
- `occupancyStatus`: Track room availability
- `currentSession`: Store active session details

### Migration Notes
- Existing rooms will automatically get default values
- No manual migration required
- New fields are optional and backward compatible

## 🎯 Features Available

### For Faculty Users
1. **Room Management Tab**: New tab in faculty panel
2. **Start/End Sessions**: Control room occupancy
3. **Today's Schedule**: View assigned classes
4. **Real-time Status**: Live room availability updates

### For Admin Users
- All existing admin features remain unchanged
- Room status visible in room management
- Session data available for analytics

## 🔍 Testing the System

### 1. Create Test Data
Ensure you have:
- Faculty users in the system
- Rooms with 'active' status
- Admin timetable with faculty-room assignments

### 2. Test Faculty Login
1. Login as a faculty member
2. Navigate to "Room Management" tab
3. View today's schedule
4. Start a class session
5. Verify room status changes

### 3. Test Automatic Reset
1. Start a session
2. Wait for 1 hour (or modify code for testing)
3. Verify room automatically resets to 'idle'

### 4. Test Real-time Updates
1. Open multiple browser windows
2. Start/end sessions in one window
3. Verify updates appear in other windows

## 🚨 Troubleshooting

### Common Issues

#### "No classes scheduled for today"
- Check admin timetable has assignments
- Verify faculty is assigned to rooms
- Ensure current day matches timetable

#### "Room not found or not active"
- Check room status is 'active'
- Verify room exists in database
- Check room ID in timetable assignments

#### "You are not scheduled to teach in this room"
- Verify faculty is assigned in admin timetable
- Check day and period match current time
- Ensure timetable data is saved

#### Sessions not auto-resetting
- Check server logs for cron job errors
- Verify node-cron is installed
- Check MongoDB connection is stable

### Debug Commands

```bash
# Check room status
curl -H "Authorization: Bearer <token>" \
  http://localhost:5000/api/room-sessions/<roomId>/status

# Check faculty schedule
curl -H "Authorization: Bearer <token>" \
  http://localhost:5000/api/room-sessions/my-schedule

# Check active sessions
curl -H "Authorization: Bearer <token>" \
  http://localhost:5000/api/room-sessions/my-sessions
```

## 📊 Monitoring

### Server Logs
Watch for these log messages:
- `Room status scheduler initialized`
- `Room <code> automatically reset to idle status`
- `Error checking expired sessions`

### Socket.IO Events
Monitor these events in browser console:
- `room:session-started`
- `room:session-ended`
- `room:session-expired`

## 🔄 Production Deployment

### Environment Variables
No new environment variables required.

### Database Indexes
Consider adding indexes for performance:
```javascript
// MongoDB shell
db.rooms.createIndex({ "occupancyStatus": 1 })
db.rooms.createIndex({ "currentSession.endTime": 1 })
```

### Monitoring
- Monitor cron job execution
- Track room session metrics
- Watch for stuck sessions

The system is now ready for faculty to manage their classroom sessions with automatic status management!