# 🎓 Smart Campus - Classroom Utilization & Resource Optimization System

A full-stack MERN application with Socket.IO for real-time classroom management, timetable generation, and resource optimization.

## 🚀 Features

- **Smart Timetable Generation**: AI-powered automatic timetable generation with conflict detection
- **Real-time Updates**: Socket.IO for live notifications and occupancy tracking
- **Room Management**: Complete CRUD operations for classrooms and labs
- **Analytics Dashboard**: Room utilization heatmaps and optimization suggestions
- **Role-based Access**: Admin, Faculty, and Student portals
- **Live Occupancy Tracking**: Real-time room usage monitoring
- **Email Notifications**: Automated notifications when timetables are published

## 📁 Project Structure

```
smart-campus/
├── backend/
│   ├── controllers/     # Request handlers
│   ├── models/          # Mongoose schemas
│   ├── routes/          # API routes
│   ├── services/        # Business logic (scheduler, analytics, notifications)
│   ├── sockets/         # Socket.IO handlers
│   ├── utils/           # Utilities (auth, helpers)
│   ├── seed/            # Database seeding script
│   ├── server.js        # Express server entry point
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── pages/       # React pages
│   │   ├── components/   # Reusable components
│   │   ├── context/     # React contexts (Auth, Socket)
│   │   ├── api/         # API client functions
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── vite.config.js
│   └── package.json
├── docker-compose.yml
└── README.md
```

## 🛠️ Tech Stack

### Backend
- Node.js + Express
- MongoDB + Mongoose
- Socket.IO
- JWT Authentication
- Nodemailer

### Frontend
- React 18
- Vite
- TailwindCSS
- Socket.IO Client
- Recharts
- React Router

## 📦 Installation

### Prerequisites
- Node.js 18+
- MongoDB (or use Docker)
- npm or yarn

### Local Setup

1. **Clone the repository**
   ```bash
   cd smart-campus
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Edit .env with your MongoDB URI and other configs
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   ```

4. **Seed Database**
   ```bash
   cd backend
   npm run seed
   ```

5. **Start Development Servers**

   Terminal 1 (Backend):
   ```bash
   cd backend
   npm run dev
   ```

   Terminal 2 (Frontend):
   ```bash
   cd frontend
   npm run dev
   ```

### Docker Setup

```bash
docker-compose up -d
```

Backend will run on `http://localhost:5000`
Frontend will run on `http://localhost:5173`

## 🔑 Default Login Credentials

After running the seed script:

- **Admin**: `admin@smartcampus.edu` / `admin123`
- **Faculty**: Use any faculty email from seed / `faculty123`
- **Student**: `student@smartcampus.edu` / `student123`

## 📊 Demo Steps

1. **Login as Admin**
   - Go to `http://localhost:5173`
   - Login with admin credentials

2. **Generate Timetable**
   - Navigate to "Timetable" section
   - Select "3rd Year A" section
   - Click "Generate Timetable"
   - Review conflicts (if any)
   - Click "Publish Timetable"

3. **View Live Updates**
   - Open "Live Occupancy" page
   - Click "Simulate Room Usage"
   - See real-time occupancy updates via Socket.IO

4. **Check Analytics**
   - Navigate to "Analytics"
   - View utilization heatmap
   - See optimization suggestions

5. **Faculty/Student Views**
   - Logout and login as faculty or student
   - View personalized schedules
   - Receive real-time notifications

## 🎯 Key Features Explained

### Timetable Generator
- Greedy algorithm with constraint satisfaction
- Handles Theory, Lab, and Project subjects
- Lab sessions require 2 contiguous periods
- Respects faculty availability and room preferences
- Marks breaks (10:10-10:30) and lunch (12:40-1:40)

### Analytics Service
- Calculates room utilization percentage
- Identifies idle (<20%) and overloaded (>90%) rooms
- Generates optimization suggestions
- Heatmap visualization by day/period

### Real-time Updates
- Socket.IO events for:
  - Timetable changes
  - Room occupancy updates
  - Notifications
  - Room status changes

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/profile` - Get current user profile

### Rooms
- `GET /api/rooms` - Get all rooms
- `POST /api/rooms` - Create room (admin)
- `PUT /api/rooms/:id` - Update room (admin)
- `DELETE /api/rooms/:id` - Delete room (admin)

### Timetables
- `POST /api/timetables/generate` - Generate timetable (admin)
- `GET /api/timetables` - Get all timetables
- `GET /api/timetables/section/:sectionId` - Get section timetable
- `GET /api/timetables/faculty/my` - Get faculty schedule
- `GET /api/timetables/student/my` - Get student timetable
- `PUT /api/timetables/:id` - Update timetable (admin)
- `POST /api/timetables/:id/publish` - Publish timetable (admin)

### Analytics
- `GET /api/analytics` - Get analytics data
- `GET /api/analytics/room/:roomId/history` - Get room history

### Occupancy
- `GET /api/occupancy` - Get all occupancy records
- `POST /api/occupancy` - Create occupancy record
- `POST /api/occupancy/simulate` - Simulate room usage

## 📝 Environment Variables

### Backend (.env)
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/smartcampus
JWT_SECRET=supersecret
FRONTEND_URL=http://localhost:5173

# Optional: Email Configuration
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

## 🎨 UI Features

- **Modern Design**: TailwindCSS with gradient themes
- **Responsive Layout**: Works on desktop, tablet, and mobile
- **Real-time Notifications**: Toast notifications for updates
- **Interactive Charts**: Recharts for analytics visualization
- **Color-coded Timetables**: Different colors for Theory, Lab, Project

## 🐛 Troubleshooting

1. **MongoDB Connection Error**
   - Ensure MongoDB is running
   - Check MONGO_URI in .env file

2. **Socket.IO Connection Issues**
   - Verify CORS settings in server.js
   - Check frontend URL matches FRONTEND_URL

3. **Port Already in Use**
   - Change PORT in .env (backend)
   - Change port in vite.config.js (frontend)

## 📄 License

This project is open source and available under the MIT License.

## 👥 Contributors

Built as a demonstration project for Smart Campus Management System.

---

**Built with ❤️ using MERN Stack + Socket.IO**

