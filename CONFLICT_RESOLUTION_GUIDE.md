# 🔄 Automatic Timetable Conflict Resolution System - Complete Guide

## 📋 Table of Contents
1. [System Overview](#system-overview)
2. [Problem Statement](#problem-statement)
3. [Architecture](#architecture)
4. [Core Components](#core-components)
5. [Workflow](#workflow)
6. [API Endpoints](#api-endpoints)
7. [Testing Guide](#testing-guide)
8. [Troubleshooting](#troubleshooting)

---

## 🎯 System Overview

The Automatic Timetable Conflict Resolution System is a comprehensive solution that monitors room status changes in real-time and automatically handles scheduling conflicts. When a room becomes unavailable (maintenance, closed, etc.), the system:

1. **Detects** affected timetable entries within 5 seconds
2. **Notifies** administrators immediately via Socket.IO and email
3. **Resolves** conflicts automatically by reassigning classes to suitable alternative rooms
4. **Validates** all room assignments with comprehensive checks
5. **Logs** all changes for accountability and audit trails
6. **Notifies** affected faculty and students about room changes

---

## 🎯 Problem Statement

### The Challenge
In a campus environment, rooms frequently become unavailable due to:
- Scheduled maintenance
- Emergency repairs
- Special events or reservations
- Equipment failures
- Building closures

When a room becomes unavailable, all scheduled classes in that room are affected, creating conflicts that need immediate resolution.

### The Solution
This system provides:

- **Automated Detection**: Real-time monitoring of room status changes
- **Intelligent Resolution**: AI-powered room reassignment based on multiple criteria
- **Manual Override**: Admin interface for complex scenarios requiring human judgment
- **Complete Audit Trail**: Every change is logged with full details
- **Multi-channel Notifications**: Real-time, email, and in-app notifications

---

## 🏗️ Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend Layer                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Conflict   │  │   Manual     │  │  Notification│          │
│  │  Dashboard   │  │  Adjustment  │  │    System    │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │   Socket.IO       │
                    │   Real-time       │
                    └─────────┬─────────┘
                              │
┌─────────────────────────────────────────────────────────────────┐
│                         Backend Layer                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Conflict   │  │   Auto       │  │  Validation  │          │
│  │   Detection  │  │  Regeneration│  │   Service    │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  Notification│  │   Audit      │  │   Smart      │          │
│  │   Service    │  │   Logger     │  │  Suggestions │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────────┐
│                         Data Layer                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   MongoDB    │  │   Mongoose   │  │   Indexes    │          │
│  │  Collections │  │  Middleware  │  │              │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow

```
Room Status Change
       │
       ▼
Mongoose Middleware (Room Model)
       │
       ▼
Conflict Detection Service
       │
       ├──────────────────┬──────────────────┐
       ▼                  ▼                  ▼
Create Conflict      Mark Entries      Send Notifications
   Record           as Affected         to Admins
       │                  │                  │
       └──────────────────┴──────────────────┘
                          │
                          ▼
              Admin Takes Action
                          │
       ┌──────────────────┴──────────────────┐
       ▼                                      ▼
Auto Regeneration                    Manual Adjustment
       │                                      │
       ▼                                      ▼
Find Alternative Rooms              Validate Selection
       │                                      │
       ▼                                      ▼
Update Timetable                    Apply Changes
       │                                      │
       └──────────────────┬──────────────────┘
                          │
                          ▼
                   Log to Audit
                          │
                          ▼
              Notify Affected Users
```

---

## 🔧 Core Components

### 1. Conflict Detection Service
**Location**: `smart/backend/services/conflictDetectionService.js`

**Purpose**: Monitors room status changes and identifies affected timetable entries

**Key Methods**:


- `monitorRoomStatusChanges(room, oldStatus)`: Main entry point triggered by Mongoose middleware
- `identifyAffectedEntries(roomId, newStatus)`: Finds all timetable entries using the affected room
- `markEntriesAsAffected(affectedEntries, roomId, originalStatus, newStatus)`: Flags entries as affected
- `createConflictRecord(room, affectedEntries, originalStatus)`: Creates conflict record in database
- `checkScheduledClasses(roomId, startDate, endDate)`: Checks for scheduled classes in date range
- `clearAffectedFlags(roomId)`: Clears flags when room becomes available again

**How It Works**:
1. Mongoose middleware on Room model detects status changes
2. Service identifies all timetable entries referencing the room
3. Entries are marked with `isAffected: true` flag
4. Conflict record is created with all affected entry details
5. Admin notifications are sent via Socket.IO and email

---

### 2. Auto-Regeneration Service
**Location**: `smart/backend/services/autoRegenerationService.js`

**Purpose**: Automatically reassigns affected classes to suitable alternative rooms

**Key Methods**:
- `regenerateAffectedEntries(conflictId, adminId)`: Main regeneration workflow
- `findReplacementRoom(entry, excludedRoomIds)`: Finds best alternative room using scoring
- `isRoomAvailable(roomId, day, period, excludeEntryId)`: Checks time slot availability
- `validateRoomSuitability(room, subject, section)`: Validates and scores room match
- `getRoomUtilization(roomId)`: Calculates room usage percentage
- `updateTimetableEntry(timetableId, scheduleItem, newRoomId, conflictId, adminId)`: Updates entry
- `generateSummaryReport(conflict, results, duration)`: Creates resolution report

**Scoring Algorithm**:
```javascript
Room Suitability Score (0-125 points):
├── Type Match: 50 points
│   ├── Perfect match (Lab → Lab): 50 points
│   ├── Acceptable (Classroom → Classroom): 50 points
│   └── Mismatch (Lab → Classroom): 10 points
├── Capacity Match: 30 points
│   ├── Perfect fit (100-120% of needed): 30 points
│   ├── Acceptable (120-150%): 20 points
│   └── Too large (>150%): 10 points
├── Equipment Match: 20 points
│   ├── All equipment available: 20 points
│   └── Partial match: 5 points
├── Utilization: 10 points
│   └── Lower utilization = higher score
└── Building Proximity: 15 points
    ├── Preferred building: 15 points
    └── Other building: 5 points
```

**How It Works**:
1. Retrieves conflict details and affected entries
2. For each affected entry:
   - Queries available rooms (status='active', sufficient capacity)
   - Filters out rooms already occupied during the time slot
   - Scores each candidate room using the algorithm above
   - Selects the highest-scoring available room
   - Updates timetable entry with new room
   - Logs change to audit trail
3. Generates summary report with success/failure counts
4. Sends notifications to affected users

---

### 3. Smart Suggestion Service
**Location**: `smart/backend/services/smartSuggestionService.js`

**Purpose**: Provides intelligent room recommendations for manual adjustment

**Key Methods**:
- `generateSuggestions(entryDetails, maxSuggestions)`: Returns top 5 room suggestions
- `calculateSuitabilityScore(room, subject, section)`: Detailed scoring with breakdown
- `getRoomUtilization(roomId)`: Room usage statistics
- `isRoomAvailable(roomId, day, period)`: Availability check
- `findAlternativeTimeSlots(entryDetails)`: Suggests alternative time slots
- `getRoomDetails(roomId)`: Complete room information with schedule

**Suggestion Output**:
```javascript
{
  room: {
    _id, code, name, type, capacity, equipment, building, floor
  },
  score: 95,
  scoreBreakdown: {
    typeMatch: 50,
    capacityMatch: 30,
    equipmentMatch: 20,
    utilization: 8,
    buildingProximity: 15
  },
  isAvailable: true,
  utilization: 45,
  warnings: [
    { type: 'capacity_oversized', severity: 'info', message: '...' }
  ],
  matchQuality: 'Excellent' // Excellent, Good, Fair, Poor, Not Recommended
}
```

---

### 4. Validation Service
**Location**: `smart/backend/services/validationService.js`

**Purpose**: Validates room assignments and detects conflicts

**Key Methods**:
- `validateRoomAssignment(entryDetails, newRoomId)`: Comprehensive validation
- `validateRoomStatus(roomId)`: Checks if room is available
- `validateCapacity(roomId, sectionId)`: Verifies capacity is sufficient
- `validateEquipment(roomId, subjectId)`: Checks required equipment
- `validateTimeSlotAvailability(roomId, day, period, excludeTimetableId)`: Detects conflicts
- `validateRoomType(roomId, subjectId)`: Validates room type match
- `generateValidationResult(checks)`: Compiles validation results

**Validation Checks**:
1. **Room Status**: Must be 'active'
2. **Capacity**: Room capacity ≥ section strength
3. **Equipment**: All required equipment must be available
4. **Time Slot**: Room must not be occupied during the time slot
5. **Room Type**: Room type should match subject requirements (Lab/Classroom)

**Validation Result**:
```javascript
{
  isValid: false,
  canForceUpdate: true,
  errors: [
    {
      type: 'room_occupied',
      message: 'Room is already occupied during this time slot',
      severity: 'error',
      data: { conflictingClass: {...} }
    }
  ],
  warnings: [
    {
      type: 'type_mismatch',
      message: 'Selected room is a Classroom, but the subject requires a Lab',
      severity: 'warning',
      canOverride: true
    }
  ]
}
```

---

### 5. Notification Service
**Location**: `smart/backend/services/notificationService.js`

**Purpose**: Sends multi-channel notifications to users

**Key Methods**:
- `notifyRoomConflict(conflict, room, io)`: Notifies admins about conflicts
- `notifyRoomChange(oldRoom, newRoom, entry, io)`: Notifies users about room changes
- `sendResolutionSummary(adminId, conflict, results, io)`: Sends resolution summary to admin
- `consolidateRoomChangeNotifications(sectionId, changes, io)`: Consolidates multiple changes

**Notification Channels**:
1. **Socket.IO**: Real-time notifications (instant)
2. **Email**: HTML email notifications (within 10 seconds)
3. **In-App**: Persistent notification records in database

**Notification Types**:
- `room_status_conflict`: Admin alert for new conflicts
- `room_change`: User notification for room changes
- `conflict_resolution_summary`: Admin summary after resolution
- `room_change_consolidated`: Multiple room changes for same section

---

### 6. Audit Logger Service
**Location**: `smart/backend/models/AuditLog.js`

**Purpose**: Maintains complete audit trail of all changes

**Key Methods**:
- `logChange(logData)`: Creates audit log entry
- `queryLogs(filters, options)`: Queries logs with filters and pagination
- `getEntryHistory(timetableEntryId)`: Gets change history for specific entry
- `generateAuditReport(startDate, endDate)`: Generates audit report

**Audit Log Fields**:
```javascript
{
  timestamp: Date,
  adminId: ObjectId,
  adminName: String,
  timetableEntryId: ObjectId,
  changeType: 'auto_regeneration' | 'manual_adjustment' | 'forced_update',
  oldRoomId: ObjectId,
  oldRoomCode: String,
  newRoomId: ObjectId,
  newRoomCode: String,
  reason: String,
  validationWarningsOverridden: [String],
  metadata: {
    conflictId, day, period, startTime, endTime, ...
  }
}
```

---

## 🔄 Complete Workflow

### Scenario: Room Goes Into Maintenance

**Step 1: Room Status Change**
```javascript
// Admin updates room status
PUT /api/rooms/:id
{
  "status": "in_maintenance"
}
```

**Step 2: Automatic Detection (< 5 seconds)**
- Mongoose middleware on Room model triggers
- `conflictDetectionService.monitorRoomStatusChanges()` is called
- System identifies all timetable entries using this room
- Entries are marked with `isAffected: true`
- Conflict record is created in database

**Step 3: Admin Notification (< 5 seconds)**
- Socket.IO notification sent to all admin users
- Email notification sent to admin emails
- Notification includes:
  - Room code and name
  - New status
  - Count of affected sessions
  - List of affected sessions with details
  - Action buttons: Auto Adjust, Manual Adjust, View Details

**Step 4: Admin Takes Action**

#### Option A: Auto-Regeneration
```javascript
POST /api/conflicts/:id/auto-regenerate
```

System automatically:
1. Retrieves all affected entries
2. For each entry:
   - Finds available rooms
   - Scores rooms based on suitability
   - Selects best match
   - Updates timetable entry
   - Logs change to audit
3. Generates summary report
4. Sends notifications to affected users

#### Option B: Manual Adjustment
```javascript
// Get room suggestions
GET /api/conflicts/:id/suggestions?entryIndex=0

// Apply manual assignments
POST /api/conflicts/:id/manual-adjust
{
  "assignments": [
    { "entryIndex": 0, "newRoomId": "..." },
    { "entryIndex": 1, "newRoomId": "..." }
  ]
}
```

System:
1. Validates each assignment
2. Shows warnings/errors if any
3. Allows force update for warnings
4. Updates timetable entries
5. Logs changes to audit
6. Sends notifications to affected users

**Step 5: User Notification (< 30 seconds)**
- Faculty and students receive notifications
- Email with room change details
- Socket.IO real-time notification
- In-app notification record

**Step 6: Audit Trail**
- All changes logged with complete details
- Admin can view audit logs
- Change history available for each entry

---

## 📡 API Endpoints

### Conflict Management

#### Get All Active Conflicts
```http
GET /api/conflicts
Authorization: Bearer <admin_token>

Response:
[
  {
    "_id": "...",
    "roomId": {...},
    "roomCode": "LAB101",
    "roomName": "Computer Lab 1",
    "originalStatus": "active",
    "newStatus": "in_maintenance",
    "affectedEntries": [...],
    "status": "active",
    "createdAt": "2024-12-10T10:00:00Z",
    "resolutionSummary": {
      "totalAffected": 5,
      "autoResolved": 0,
      "manuallyResolved": 0,
      "unresolved": 5
    }
  }
]
```

#### Get Conflict Details
```http
GET /api/conflicts/:id
Authorization: Bearer <admin_token>

Response:
{
  "_id": "...",
  "roomId": {...},
  "affectedEntries": [
    {
      "timetableEntryId": "...",
      "subjectName": "Data Structures",
      "facultyName": "Dr. Smith",
      "sectionName": "CS-A",
      "day": "Monday",
      "period": 1,
      "startTime": "09:00",
      "endTime": "10:00",
      "status": "pending"
    }
  ],
  ...
}
```

#### Auto-Regenerate
```http
POST /api/conflicts/:id/auto-regenerate
Authorization: Bearer <admin_token>

Response:
{
  "message": "Auto-regeneration completed",
  "report": {
    "conflictId": "...",
    "roomCode": "LAB101",
    "totalAffected": 5,
    "successfullyResolved": 4,
    "requiresManualAssignment": 1,
    "successRate": "80.0",
    "duration": "2500ms",
    "assignments": [...],
    "failedEntries": [...]
  }
}
```

#### Get Room Suggestions
```http
GET /api/conflicts/:id/suggestions?entryIndex=0
Authorization: Bearer <admin_token>

Response:
{
  "entryIndex": 0,
  "affectedEntry": {...},
  "suggestions": [
    {
      "room": {...},
      "score": 95,
      "scoreBreakdown": {...},
      "isAvailable": true,
      "utilization": 45,
      "warnings": [],
      "matchQuality": "Excellent"
    }
  ]
}
```

#### Manual Adjustment
```http
POST /api/conflicts/:id/manual-adjust
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "assignments": [
    { "entryIndex": 0, "newRoomId": "room_id_1" },
    { "entryIndex": 1, "newRoomId": "room_id_2" }
  ],
  "force": false
}

Response:
{
  "message": "Manual adjustment completed",
  "results": {
    "total": 2,
    "successful": 2,
    "failed": 0,
    "validationErrors": []
  }
}
```

#### Validate Room Assignment
```http
POST /api/conflicts/validate-room
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "timetableId": "...",
  "day": "Monday",
  "period": 1,
  "subjectId": "...",
  "sectionId": "...",
  "newRoomId": "..."
}

Response:
{
  "isValid": false,
  "canForceUpdate": true,
  "errors": [],
  "warnings": [
    {
      "type": "type_mismatch",
      "message": "Selected room is a Classroom, but the subject requires a Lab",
      "severity": "warning"
    }
  ]
}
```

### Audit Logs

#### Query Audit Logs
```http
GET /api/conflicts/audit-logs/list?startDate=2024-12-01&endDate=2024-12-31&page=1&limit=50
Authorization: Bearer <admin_token>

Response:
{
  "logs": [...],
  "total": 150,
  "page": 1,
  "totalPages": 3,
  "hasMore": true
}
```

#### Get Entry History
```http
GET /api/conflicts/audit-logs/entry/:entryId
Authorization: Bearer <admin_token>

Response:
[
  {
    "timestamp": "2024-12-10T10:05:00Z",
    "adminName": "Admin User",
    "changeType": "auto_regeneration",
    "oldRoomCode": "LAB101",
    "newRoomCode": "LAB102",
    "reason": "Automatic room reassignment due to room status change"
  }
]
```

#### Generate Audit Report
```http
GET /api/conflicts/audit-logs/report?startDate=2024-12-01&endDate=2024-12-31
Authorization: Bearer <admin_token>

Response:
{
  "period": { "startDate": "...", "endDate": "..." },
  "totalChanges": 150,
  "changesByType": [
    { "_id": "auto_regeneration", "count": 100 },
    { "_id": "manual_adjustment", "count": 40 },
    { "_id": "forced_update", "count": 10 }
  ],
  "changesByAdmin": [...],
  "forceUpdates": 10,
  "generatedAt": "2024-12-31T23:59:59Z"
}
```

---

## 🧪 Testing Guide

### Manual Testing Steps

#### Test 1: Basic Conflict Detection
1. Start the backend server: `cd smart/backend && npm run dev`
2. Log in as admin
3. Navigate to Rooms page
4. Select a room that has scheduled classes
5. Change status to "in_maintenance"
6. **Expected Results**:
   - Conflict detected within 5 seconds
   - Admin receives Socket.IO notification
   - Conflict appears in conflicts dashboard
   - Affected entries marked with `isAffected: true`

#### Test 2: Auto-Regeneration
1. Create a conflict (follow Test 1)
2. Navigate to Conflicts Dashboard
3. Click "Auto Adjust" button
4. **Expected Results**:
   - System finds alternative rooms
   - Timetable entries updated with new rooms
   - Success/failure summary displayed
   - Audit logs created
   - Users notified about room changes

#### Test 3: Manual Adjustment
1. Create a conflict
2. Click "Manual Adjust"
3. View room suggestions for each affected entry
4. Select rooms from suggestions
5. Click "Save Changes"
6. **Expected Results**:
   - Validation performed on selections
   - Warnings displayed if any
   - Changes applied successfully
   - Audit logs created
   - Users notified

#### Test 4: Validation and Force Update
1. Create a conflict
2. Try to assign a room that:
   - Is already occupied (should show error)
   - Has wrong type (should show warning)
   - Has insufficient capacity (should show error)
3. For warnings, use "Force Update"
4. **Expected Results**:
   - Errors prevent assignment
   - Warnings allow force update
   - Force updates logged with warnings overridden

#### Test 5: Room Becomes Available Again
1. Create a conflict
2. Change room status back to "active"
3. **Expected Results**:
   - Affected flags cleared
   - Conflict status updated
   - System ready for normal operation

### API Testing with cURL

#### Test Auto-Regeneration
```bash
# Get auth token
TOKEN=$(curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}' \
  | jq -r '.token')

# Get active conflicts
curl -X GET http://localhost:5000/api/conflicts \
  -H "Authorization: Bearer $TOKEN"

# Trigger auto-regeneration
curl -X POST http://localhost:5000/api/conflicts/CONFLICT_ID/auto-regenerate \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🐛 Troubleshooting

### Issue: Conflicts Not Detected

**Symptoms**: Room status changes but no conflict is created

**Possible Causes**:
1. Mongoose middleware not triggering
2. No timetable entries using the room
3. Timetables not published

**Solutions**:
```javascript
// Check if middleware is registered
// In smart/backend/models/Room.js, verify:
roomSchema.pre('findOneAndUpdate', ...)
roomSchema.post('findOneAndUpdate', ...)

// Check for timetable entries
db.timetables.find({ 
  'schedule.roomRef': ObjectId('room_id'),
  isPublished: true 
})

// Manually trigger detection
POST /api/conflicts/detect
{ "roomId": "room_id" }
```

### Issue: Auto-Regeneration Fails

**Symptoms**: All entries marked as "requires_manual"

**Possible Causes**:
1. No available rooms
2. All rooms occupied during time slots
3. Capacity constraints too strict

**Solutions**:
```javascript
// Check available rooms
db.rooms.find({ status: 'active' })

// Check room utilization
GET /api/conflicts/:id/suggestions?entryIndex=0

// Adjust capacity constraints in autoRegenerationService.js
// Line ~150: capacity: { $gte: section.strength || 30 }
```

### Issue: Notifications Not Sent

**Symptoms**: Users not receiving notifications

**Possible Causes**:
1. Socket.IO not connected
2. Email credentials not configured
3. User not in correct room (Socket.IO)

**Solutions**:
```javascript
// Check Socket.IO connection
// In browser console:
socket.connected // should be true

// Check email configuration
// In .env file:
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

// Check Socket.IO rooms
// In backend logs, look for:
"Sending notification to user_USER_ID"
```

### Issue: Validation Always Fails

**Symptoms**: Cannot assign any room

**Possible Causes**:
1. All rooms marked as unavailable
2. Time slot conflicts
3. Validation logic too strict

**Solutions**:
```javascript
// Check room statuses
db.rooms.find({ status: { $ne: 'active' } })

// Check for time slot conflicts
db.timetables.find({
  'schedule.roomRef': ObjectId('room_id'),
  'schedule.day': 'Monday',
  'schedule.period': 1
})

// Use force update for warnings
POST /api/conflicts/:id/manual-adjust
{ "assignments": [...], "force": true }
```

---

## 📊 Performance Metrics

### Target Performance
- Conflict detection: < 5 seconds
- Auto-regeneration (50 entries): < 30 seconds
- Notification delivery: < 5 seconds (Socket.IO), < 10 seconds (Email)
- Validation: < 1 second

### Monitoring
```javascript
// Check conflict detection time
// Look for logs:
"[ConflictDetection] Conflict created with ID: ... (took Xms)"

// Check auto-regeneration time
// Look for logs:
"[AutoRegeneration] Completed in Xms. Resolved: Y, Failed: Z"

// Check notification delivery
// Look for logs:
"[NotificationService] Notified X users (Y emails, Z notifications)"
```

---

## 🎓 Best Practices

### For Administrators

1. **Regular Monitoring**: Check conflicts dashboard daily
2. **Quick Response**: Resolve conflicts within 24 hours
3. **Use Auto-Regeneration First**: Let the system handle simple cases
4. **Manual Adjustment for Complex Cases**: Use manual adjustment when:
   - Multiple constraints need consideration
   - Specific room preferences exist
   - Auto-regeneration fails
5. **Review Audit Logs**: Regularly review audit logs for patterns
6. **Plan Maintenance**: Schedule room maintenance during low-usage periods

### For Developers

1. **Database Indexes**: Ensure all indexes are created for performance
2. **Error Handling**: Always wrap async operations in try-catch
3. **Logging**: Use consistent logging format for debugging
4. **Testing**: Test with realistic data volumes
5. **Monitoring**: Set up alerts for high conflict rates
6. **Documentation**: Keep API documentation up to date

---

## 📚 Additional Resources

### Specification Documents
- Requirements: `.kiro/specs/room-status-conflict-resolution/requirements.md`
- Design: `.kiro/specs/room-status-conflict-resolution/design.md`
- Tasks: `.kiro/specs/room-status-conflict-resolution/tasks.md`

### Code Locations
- Services: `smart/backend/services/`
- Models: `smart/backend/models/`
- Controllers: `smart/backend/controllers/`
- Routes: `smart/backend/routes/`

### Related Documentation
- Main README: `smart/README.md`
- API Documentation: `smart/TIMETABLE_API_SPEC.md`
- Setup Guide: `smart/SETUP_GUIDE.md`

---

## 🤝 Support

For issues or questions:
1. Check this guide first
2. Review specification documents
3. Check audit logs for error details
4. Review backend logs for detailed error messages
5. Contact system administrator

---

**Last Updated**: December 2024  
**Version**: 1.0  
**Status**: Production Ready
