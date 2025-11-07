# Admin Timetable Editor API Specification

## Required Backend Endpoints

### 1. Save Timetable Data
**POST** `/api/timetable`

**Request Body:**
```json
{
  "Monday-1": {
    "subject": "subject_id",
    "teacher": "teacher_id", 
    "classroom": "classroom_id"
  },
  "Monday-2": {
    "subject": "subject_id",
    "teacher": "teacher_id",
    "classroom": "classroom_id"
  },
  // ... more entries for each day-period combination
  "force": false // true when force saving despite conflicts
}
```

**Response:**
```json
{
  "success": true,
  "message": "Timetable saved successfully"
}
```

### 2. Check for Conflicts
**GET** `/api/timetable/check?teacher={teacher_id}&period={period}&day={day}`

**Response:**
```json
{
  "hasConflict": true,
  "conflictType": "teacher", // or "classroom"
  "conflictDetails": {
    "existingAssignment": {
      "subject": "subject_name",
      "classroom": "classroom_name"
    }
  }
}
```

### 3. Get Admin Timetable Data
**GET** `/api/timetable/admin`

**Response:**
```json
{
  "Monday-1": {
    "subject": "subject_id",
    "teacher": "teacher_id",
    "classroom": "classroom_id"
  },
  "Monday-2": {
    "subject": "subject_id", 
    "teacher": "teacher_id",
    "classroom": "classroom_id"
  }
  // ... more entries
}
```

## Data Structure Notes

- **Days**: Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday
- **Periods**: 1, 2, 3, 4, 5, 6, 7
- **Cell Key Format**: `{Day}-{Period}` (e.g., "Monday-1", "Tuesday-3")
- **IDs**: Use the existing ID format from your subjects, faculty, and rooms collections

## Conflict Detection Logic

1. Check if the same teacher is assigned to multiple classes at the same time
2. Check if the same classroom is assigned to multiple classes at the same time
3. Return conflict details to help admin make informed decisions

## Force Save Behavior

When `force: true` is sent:
- Override existing conflicts
- Save the new assignment
- Optionally log the conflict override for audit purposes