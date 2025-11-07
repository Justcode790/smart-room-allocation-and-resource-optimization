# Student Schema & Timetable Association Documentation

## 🎯 **Overview**

This document describes the enhanced student schema and automatic timetable association system that ensures students see their section's timetable when they log in.

---

## 📋 **Enhanced User Model**

### **Student-Specific Fields**
```javascript
{
  // Basic Information
  name: String (required),
  email: String (required, unique),
  role: 'student' (required),
  regNumber: String (unique, uppercase),
  rollNumber: String,
  mobile: String,
  sectionRef: ObjectId (required for students),
  
  // Detailed Student Information
  studentInfo: {
    dateOfBirth: Date,
    gender: 'Male' | 'Female' | 'Other',
    address: {
      street: String,
      city: String,
      state: String,
      pincode: String,
      country: String (default: 'India')
    },
    parentContact: {
      fatherName: String,
      motherName: String,
      guardianPhone: String,
      emergencyContact: String
    },
    academicInfo: {
      admissionYear: Number,
      currentSemester: Number,
      cgpa: Number,
      previousEducation: String
    }
  },
  
  // Profile & Preferences
  profile: {
    avatar: String,
    bio: String,
    preferences: {
      notifications: {
        email: Boolean (default: true),
        sms: Boolean (default: false),
        push: Boolean (default: true)
      },
      language: String (default: 'en'),
      timezone: String (default: 'Asia/Kolkata')
    }
  },
  
  // Account Status
  isActive: Boolean (default: true),
  isVerified: Boolean (default: false),
  lastLogin: Date,
  loginCount: Number (default: 0)
}
```

---

## 🏫 **Enhanced Section Model**

### **Section Schema**
```javascript
{
  name: String (required, unique, uppercase),
  code: String (required, unique, uppercase),
  department: String (required),
  year: Number (1-5, required),
  semester: Number (1-10, required),
  academicYear: String (format: "2024-2025", required),
  strength: Number (auto-calculated),
  maxStrength: Number (required),
  
  // Class Preferences
  preferredBuildings: [String],
  totalPeriodsPerWeek: Number (default: 30),
  classTimings: {
    startTime: String (default: '08:00'),
    endTime: String (default: '16:20'),
    breakDuration: Number (default: 20),
    lunchDuration: Number (default: 60)
  },
  
  // Section Metadata
  metadata: {
    classTeacher: ObjectId (ref: User),
    hod: ObjectId (ref: User),
    subjects: [{
      subjectRef: ObjectId (ref: Subject),
      facultyRef: ObjectId (ref: User),
      periodsPerWeek: Number (default: 4),
      isElective: Boolean (default: false)
    }],
    roomPreferences: [{
      roomType: 'Classroom' | 'Lab',
      capacity: Number,
      equipment: [String]
    }]
  },
  
  // Status
  isActive: Boolean (default: true),
  hasTimetable: Boolean (default: false),
  timetableLastUpdated: Date
}
```

---

## 🔗 **Timetable Association Logic**

### **Automatic Association Flow**

1. **Student Login** → User authentication with role validation
2. **Section Lookup** → Find student's assigned section via `sectionRef`
3. **Timetable Retrieval** → Get section's published timetable
4. **Dashboard Population** → Display personalized dashboard with timetable

### **Key Methods**

#### **User Model Methods**
```javascript
// Get student's section with timetable
user.getSectionWithTimetable()

// Check timetable access permissions
user.canAccessTimetable(timetableId)
```

#### **Section Model Methods**
```javascript
// Get all students in section
section.getStudents()

// Get section's current timetable
section.getCurrentTimetable()

// Check capacity for new students
section.canAddStudents(count)
```

---

## 🚀 **API Endpoints**

### **Student-Specific Endpoints**
```javascript
GET /students/dashboard        // Complete dashboard data
GET /students/timetable       // Section's timetable
GET /students/profile         // Student profile
PUT /students/profile         // Update profile
GET /students/attendance      // Attendance summary
```

### **Dashboard API Response**
```javascript
{
  success: true,
  student: {
    id: "student_id",
    name: "Student Name",
    email: "student@edu",
    regNumber: "CS2024001",
    rollNumber: "001",
    section: { /* section details */ },
    profile: { /* profile data */ }
  },
  section: { /* section information */ },
  timetable: { /* published timetable */ },
  todayClasses: [ /* today's schedule */ ],
  nextClass: { /* upcoming class */ },
  recentAttendance: [ /* attendance records */ ],
  announcements: [ /* notifications */ ]
}
```

---

## 🎨 **Frontend Integration**

### **Enhanced Student Portal**
- **Dashboard Tab**: Personalized overview with next class, today's schedule
- **Timetable Tab**: Complete section timetable display
- **Check-in Tab**: QR code scanning and attendance tracking

### **Real-time Updates**
- **Socket.IO Integration**: Live timetable updates
- **Notification System**: Room changes, cancellations, announcements
- **Auto-refresh**: Dashboard data refreshes every 30 seconds

---

## 🔒 **Security & Validation**

### **Access Control**
- **Role-based Access**: Students can only see their section's data
- **Section Validation**: Automatic section assignment validation
- **Timetable Permissions**: Students can only access published timetables

### **Data Validation**
- **Required Fields**: Section assignment mandatory for students
- **Unique Constraints**: Registration numbers and email uniqueness
- **Input Sanitization**: All user inputs validated and sanitized

---

## 📊 **Sample Data Structure**

### **Student Record Example**
```javascript
{
  _id: "student_id",
  name: "Arjun Sharma",
  email: "arjun.sharma@student.edu",
  role: "student",
  regNumber: "CS2024001",
  rollNumber: "001",
  sectionRef: "section_id",
  studentInfo: {
    dateOfBirth: "2003-05-15",
    gender: "Male",
    academicInfo: {
      admissionYear: 2024,
      currentSemester: 1,
      cgpa: 8.5
    }
  },
  isActive: true,
  isVerified: true
}
```

### **Section Record Example**
```javascript
{
  _id: "section_id",
  name: "CSE-A",
  code: "CSE-A-2024",
  department: "Computer Science Engineering",
  year: 1,
  semester: 1,
  academicYear: "2024-2025",
  strength: 45,
  maxStrength: 60,
  isActive: true,
  hasTimetable: true
}
```

---

## 🛠️ **Setup Instructions**

### **1. Database Setup**
```bash
# Run student seed script
cd smart/backend
node seed/studentSeed.js
```

### **2. Sample Login Credentials**
```
Email: arjun.sharma@student.edu
Password: student123

Other students:
- priya.reddy@student.edu (Password: student123)
- kiran.kumar@student.edu (Password: student123)
- sneha.patel@student.edu (Password: student123)
- rahul.gupta@student.edu (Password: student123)
```

### **3. Testing Flow**
1. **Login** with student credentials
2. **Verify** section assignment and timetable display
3. **Test** real-time updates and notifications
4. **Check** attendance and check-in functionality

---

## 🔄 **Data Flow Diagram**

```
Student Login
     ↓
Authentication & Role Check
     ↓
Section Lookup (sectionRef)
     ↓
Timetable Retrieval (published)
     ↓
Dashboard Data Assembly
     ↓
Frontend Display
     ↓
Real-time Updates (Socket.IO)
```

---

## 📈 **Benefits**

### **For Students**
- **Personalized Dashboard**: Tailored to their section and schedule
- **Real-time Updates**: Instant notifications for changes
- **Comprehensive View**: Timetable, attendance, and announcements in one place
- **Mobile-friendly**: Responsive design for all devices

### **For Administrators**
- **Centralized Management**: Single source of truth for student-section mapping
- **Automatic Updates**: Timetable changes reflect immediately for all students
- **Data Integrity**: Enforced relationships between students, sections, and timetables
- **Scalable Architecture**: Supports thousands of students across multiple sections

### **For Faculty**
- **Student Visibility**: Easy access to section rosters and student information
- **Attendance Tracking**: Integrated attendance management
- **Communication**: Direct notification channels to students

---

## 🎯 **Key Features Implemented**

✅ **Enhanced User Schema** with comprehensive student information
✅ **Section-Student Association** with automatic timetable linking
✅ **Personalized Dashboard** with real-time data
✅ **Role-based Access Control** for data security
✅ **Real-time Updates** via Socket.IO integration
✅ **Mobile-responsive Interface** for all devices
✅ **Sample Data Seeding** for immediate testing
✅ **Comprehensive API** for all student operations

The system now provides a complete, production-ready student management solution with automatic timetable association and real-time updates.