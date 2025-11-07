# Admin Timetable Editor Backend Implementation

## 📁 Files Created

### Models
- `smart/backend/models/AdminTimetable.js` - MongoDB schema for admin timetable data

### Controllers  
- `smart/backend/controllers/adminTimetableController.js` - Business logic for timetable operations

### Routes
- `smart/backend/routes/adminTimetableRoutes.js` - API endpoint definitions

### Test
- `smart/backend/test-admin-timetable.js` - Simple test script

## 🔗 API Endpoints

### 1. Get Admin Timetable
**GET** `/api/timetable/admin`
- **Auth**: Required (Admin only)
- **Description**: Retrieves the current admin timetable data
- **Response**: Object with day-period keys and subject/teacher/classroom values

### 2. Save Admin Timetable  
**POST** `/api/timetable`
- **Auth**: Required (Admin only)
- **Body**: Timetable data object + optional `force` flag
- **Description**: Saves timetable data with room validation and conflict checking
- **Validation**: Returns 400 status if invalid rooms assigned
- **Conflict Handling**: Returns 409 status if conflicts found (unless force=true)

### 3. Check Conflicts
**GET** `/api/timetable/check?teacher={id}&period={num}&day={day}&classroom={id}`
- **Auth**: Required (Admin only)  
- **Description**: Checks if teacher/classroom conflicts exist for specific slot
- **Response**: `{ hasConflict: boolean, conflictDetails?: object }`

### 4. Get Available Rooms
**GET** `/api/timetable/available-rooms`
- **Auth**: Required (Admin only)
- **Description**: Retrieves only active rooms available for assignment
- **Response**: Array of room objects with id, name, code, building, floor, type, capacity

## 🗄️ Database Schema

```javascript
AdminTimetable {
  timetableData: Map<String, {
    subject: ObjectId (ref: Subject),
    teacher: ObjectId (ref: Faculty), 
    classroom: ObjectId (ref: Room)
  }>,
  createdBy: ObjectId (ref: User),
  lastModified: Date,
  version: String,
  isActive: Boolean,
  timestamps: true
}
```

## 🔍 Key Features

### Room Validation
- **Active Rooms Only**: Only rooms with `status: 'active'` can be assigned
- **Database Validation**: All room IDs must exist in the Room collection
- **Real-time Filtering**: Frontend shows only available rooms
- **Error Handling**: Clear validation error messages for invalid assignments

### Conflict Detection
- **Teacher Conflicts**: Same teacher assigned to multiple classes at same time
- **Classroom Conflicts**: Same room assigned to multiple classes at same time  
- **Real-time Checking**: API endpoint for live conflict validation
- **Force Override**: Admin can override conflicts when necessary

### Data Storage
- **Map-based Storage**: Efficient key-value storage for day-period combinations
- **Reference Population**: Automatic population of subject/teacher/classroom details
- **Version Control**: Track timetable versions and modifications
- **Audit Trail**: Created by, last modified tracking

### Socket.IO Integration
- **Real-time Updates**: Broadcasts timetable changes to connected clients
- **Event**: `admin-timetable:update` emitted on save operations

## 🚀 Usage

### Starting the Server
```bash
cd smart/backend
npm start
```

### Testing the API
```bash
cd smart/backend  
node test-admin-timetable.js
```

### Example API Calls

**Save Timetable:**
```javascript
POST /api/timetable
{
  "Monday-1": {
    "subject": "507f1f77bcf86cd799439011",
    "teacher": "507f1f77bcf86cd799439012", 
    "classroom": "507f1f77bcf86cd799439013"
  },
  "force": false
}
```

**Check Conflict:**
```javascript
GET /api/timetable/check?teacher=507f1f77bcf86cd799439012&period=1&day=Monday
```

## 🔧 Integration Notes

- **Authentication**: Uses existing auth middleware (`authenticate`, `authorize`)
- **Database**: Integrates with existing MongoDB connection
- **Models**: References existing Subject, Faculty, Room models
- **Socket.IO**: Uses existing socket infrastructure for real-time updates

## 📋 Next Steps

1. **Frontend Integration**: The React component is already configured to use these endpoints
2. **Testing**: Run the test script to verify database operations
3. **Deployment**: Include new model in any database migration scripts
4. **Monitoring**: Add logging for timetable operations if needed