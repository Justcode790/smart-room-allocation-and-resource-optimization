# Admin Timetable Editor Component

## Overview
The Admin Timetable Editor is a React component that provides a 7×7 editable grid for creating and managing timetables with conflict detection and resolution.

## Features

### ✅ Implemented Features
- **7×7 Editable Grid**: Days (Mon-Sun) × Periods (1-7)
- **Triple Input per Cell**: Subject, Teacher, Classroom dropdowns
- **Conflict Detection**: Real-time API-based conflict checking
- **Conflict Resolution Modal**: Cancel or Force Save options
- **Toast Notifications**: Success/error feedback
- **Responsive Design**: Works on desktop and mobile
- **Integration**: Added to admin navigation and dashboard

### 🔧 Component Structure
```
AdminTimetableEditor.jsx - Main component with grid and logic
AdminTimetableEditor.jsx (page) - Layout wrapper
```

### 📍 Navigation Integration
- Added to left navigation as "Timetable Editor" with ✏️ icon
- Added quick action card on admin dashboard
- Route: `/admin/timetable-editor`

### 🎨 UI/UX Features
- Gradient backgrounds and modern styling
- Loading states and disabled buttons during save
- Hover effects and smooth transitions
- Color-coded dropdowns (blue for subjects, purple for teachers, green for classrooms)
- Responsive table with horizontal scroll on mobile

### 🔄 Data Flow
1. **Load**: Fetches subjects, teachers, classrooms, and existing timetable data
2. **Edit**: Updates local state as user selects options
3. **Save**: Checks for conflicts before saving
4. **Conflict**: Shows modal with cancel/force options
5. **Success**: Displays success toast and updates data

### 🚨 Conflict Handling
- Automatic conflict detection before save
- Modal popup with clear conflict message
- Two options: Cancel (go back) or Force Save (override)
- Prevents accidental double-booking

## Usage

The component is automatically available to admin users through:
- Left navigation: "Timetable Editor"
- Dashboard quick action: "Edit Timetable" card
- Direct URL: `/admin/timetable-editor`

## Backend Requirements

See `TIMETABLE_API_SPEC.md` for required API endpoints:
- `POST /api/timetable` - Save timetable data
- `GET /api/timetable/check` - Check for conflicts  
- `GET /api/timetable/admin` - Get existing timetable data