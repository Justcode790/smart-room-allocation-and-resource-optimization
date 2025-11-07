# Faculty Room Session Management System

## 🎯 Overview

This system allows faculty members to start and end class sessions in real-time, automatically managing room occupancy status with automatic reset after class periods end.

## 🔧 Technical Implementation

### Backend Components

#### 1. Room Model Updates
- **New Fields Added**:
  - `occupancyStatus`: 'idle' | 'occupied' | 'reserved'
  - `currentSession`: Object containing session details
    - `facultyId`: Reference to faculty member
    - `subjectId`: Reference to subject being taught
    - `startTime`: Session start timestamp
    - `endTime`: Session end timestamp (1 hour after start)
    - `day`: Day of the week
    - `period`: Period number

#### 2. Room Session Controller
- **Endpoints**:
  - `POST /room-sessions/start-session`: Start a class session
  - `POST /room-sessions/end-session`: End a class session
  - `GET /room-sessions/my-sessions`: Get faculty's active sessions
  - `GET /room-sessions/my-schedule`: Get faculty's schedule for today
  - `GET /room-sessions/:roomId/status`: Get room status

#### 3. Room Status Scheduler Service
- **Automatic Reset**: Cron job runs every minute to check for expired sessions
- **Real-time Updates**: Socket.IO notifications for status changes
- **Expiry Detection**: Automatically resets rooms to 'idle' after 1 hour

### Frontend Components

#### 1. Faculty Room Manager Component
- **Today's Schedule**: Shows faculty's classes for the current day
- **Active Sessions**: Displays currently occupied rooms
- **Session Controls**: Start/End class buttons
- **Real-time Status**: Live updates of room occupancy

#### 2. Faculty Panel Integration
- **Tabbed Interface**: Schedule view and Room Management tabs
- **Seamless Navigation**: Easy switching between views

## 🚀 Features

### ✅ Session Management
- **Authorization Check**: Only scheduled faculty can start sessions
- **Conflict Prevention**: Cannot start if room is already occupied
- **Automatic Duration**: Sessions automatically set for 1 hour
- **Manual Override**: Faculty can end sessions early

### ✅ Real-time Updates
- **Socket.IO Events**:
  - `room:session-started`: When a session begins
  - `room:session-ended`: When a session ends manually
  - `room:session-expired`: When a session expires automatically

### ✅ Status Management
- **Three States**:
  - `idle`: Room is available
  - `occupied`: Room is currently in use
  - `reserved`: Room is reserved (future use)

### ✅ Automatic Reset
- **Cron Scheduler**: Checks every minute for expired sessions
- **1-Hour Duration**: Sessions automatically end after 1 hour
- **Cleanup**: Resets room status and clears session data

## 📋 Usage Flow

### Starting a Class Session
1. Faculty logs in and navigates to "Room Management" tab
2. Views today's schedule with assigned rooms
3. Clicks "Start Class" for the appropriate period
4. System validates:
   - Faculty is scheduled for that room/time
   - Room is currently idle
   - Current time matches class period
5. Room status changes to 'occupied'
6. Session data is recorded with 1-hour end time

### Automatic Session End
1. Cron job runs every minute
2. Checks for sessions where `endTime <= currentTime`
3. Automatically resets room to 'idle' status
4. Clears session data
5. Emits Socket.IO event for real-time updates

### Manual Session End
1. Faculty clicks "End Session" button
2. System validates faculty authorization
3. Room status resets to 'idle'
4. Session data is cleared

## 🔒 Security & Validation

### Authorization Checks
- **Schedule Validation**: Faculty must be scheduled for the room/time
- **Room Assignment**: Must match timetable assignments
- **Session Ownership**: Only session creator can end manually

### Data Integrity
- **Room Status Consistency**: Prevents double-booking
- **Session Tracking**: Complete audit trail of room usage
- **Automatic Cleanup**: Prevents stuck 'occupied' status

## 📊 API Endpoints

### Start Session
```javascript
POST /room-sessions/start-session
{
  "roomId": "room_object_id",
  "day": "Monday",
  "period": 1
}
```

### End Session
```javascript
POST /room-sessions/end-session
{
  "roomId": "room_object_id"
}
```

### Get Faculty Schedule
```javascript
GET /room-sessions/my-schedule
// Returns today's classes with room status
```

### Get Active Sessions
```javascript
GET /room-sessions/my-sessions
// Returns faculty's currently active sessions
```

## 🎨 Frontend Features

### Room Status Indicators
- **Green**: Idle (available)
- **Red**: Occupied (in use)
- **Yellow**: Reserved (future use)

### Interactive Controls
- **Start Class**: Green button when room is available
- **End Session**: Red button for active sessions
- **Disabled State**: Gray button when room is occupied by others

### Real-time Updates
- **Auto Refresh**: Data refreshes every 30 seconds
- **Socket Updates**: Instant updates via WebSocket
- **Status Changes**: Live room status indicators

## 🔄 Integration Points

### Timetable System
- **Schedule Validation**: Checks against admin timetable
- **Room Assignments**: Uses timetable room assignments
- **Period Matching**: Validates current period

### Socket.IO Events
- **Real-time Notifications**: Instant status updates
- **Multi-user Sync**: All connected users see changes
- **Event Types**: Start, end, and expire events

## 📈 Benefits

1. **Real-time Tracking**: Live room occupancy status
2. **Automatic Management**: No manual intervention needed
3. **Conflict Prevention**: Prevents double-booking
4. **Audit Trail**: Complete session history
5. **User-Friendly**: Simple start/stop interface
6. **Reliable**: Automatic cleanup prevents stuck states

The system provides a comprehensive solution for faculty to manage their classroom sessions with automatic status management and real-time updates.