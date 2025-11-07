# Admin Timetable Editor - Complete Setup Guide

## 🚀 Quick Start

### Backend Setup
```bash
cd smart/backend
npm install
npm start
```

### Frontend Setup  
```bash
cd smart/frontend
npm install
npm run dev
```

## 📋 Features Implemented

### ✅ Frontend (React)
- **7×7 Editable Grid**: Days (Mon-Sun) × Periods (1-7)
- **Triple Dropdowns**: Subject, Teacher, Classroom per cell
- **Conflict Detection**: Real-time API-based checking
- **Conflict Modal**: Cancel or Force Save options
- **Toast Notifications**: Success/error feedback
- **Navigation Integration**: Added to admin sidebar and dashboard
- **Responsive Design**: Mobile-friendly layout

### ✅ Backend (Node.js/Express)
- **MongoDB Model**: AdminTimetable schema with Map-based storage
- **API Endpoints**: Save, retrieve, and conflict checking
- **Conflict Logic**: Teacher and classroom double-booking prevention
- **Authentication**: Admin-only access with existing auth system
- **Socket.IO**: Real-time updates for connected clients

## 🔗 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/timetable/admin` | Get current admin timetable |
| POST | `/api/timetable` | Save timetable data |
| GET | `/api/timetable/check` | Check for conflicts |

## 🎯 Usage Flow

1. **Access**: Admin logs in and navigates to "Timetable Editor"
2. **Edit**: Select subjects, teachers, classrooms in grid cells
3. **Save**: Click save button to store data
4. **Conflicts**: If conflicts exist, modal appears with options
5. **Force Save**: Admin can override conflicts if needed

## 🔧 Technical Details

### Database Schema
```javascript
{
  timetableData: Map<"Day-Period", {
    subject: ObjectId,
    teacher: ObjectId, 
    classroom: ObjectId
  }>,
  createdBy: ObjectId,
  lastModified: Date,
  isActive: Boolean
}
```

### Conflict Detection
- **Teacher Conflicts**: Same teacher, same time slot
- **Classroom Conflicts**: Same room, same time slot
- **Real-time Checking**: Before save operations
- **Override Option**: Force save despite conflicts

## 📱 Navigation

### Admin Sidebar
- New "Timetable Editor" link with ✏️ icon
- Direct access via `/admin/timetable-editor`

### Dashboard Card
- "Edit Timetable" quick action card
- Violet gradient styling for distinction

## 🧪 Testing

### Backend Test
```bash
cd smart/backend
node test-admin-timetable.js
```

### Manual Testing
1. Login as admin user
2. Navigate to Timetable Editor
3. Add some subjects/teachers/classrooms
4. Try creating conflicts (same teacher, same time)
5. Verify conflict modal appears
6. Test force save functionality

## 🔍 Troubleshooting

### Common Issues
- **Empty Dropdowns**: Ensure subjects, faculty, rooms exist in database
- **Auth Errors**: Verify admin user permissions
- **API Errors**: Check backend server is running
- **Conflicts Not Detected**: Verify conflict checking logic

### Debug Steps
1. Check browser console for errors
2. Verify API responses in Network tab
3. Check backend logs for server errors
4. Ensure MongoDB connection is active

## 📚 File Structure

```
smart/
├── frontend/src/
│   ├── components/AdminTimetableEditor.jsx
│   ├── pages/AdminTimetableEditor.jsx
│   └── api/timetable.js (updated)
├── backend/
│   ├── models/AdminTimetable.js
│   ├── controllers/adminTimetableController.js
│   ├── routes/adminTimetableRoutes.js
│   └── test-admin-timetable.js
└── Documentation/
    ├── TIMETABLE_API_SPEC.md
    ├── ADMIN_TIMETABLE_BACKEND_DOCS.md
    └── SETUP_GUIDE.md (this file)
```

## 🎉 Success Criteria

- ✅ 7×7 grid displays correctly
- ✅ Dropdowns populate with data
- ✅ Save functionality works
- ✅ Conflicts are detected
- ✅ Modal appears for conflicts
- ✅ Force save overrides conflicts
- ✅ Navigation links work
- ✅ Admin-only access enforced

The Admin Timetable Editor is now fully implemented and ready for use!