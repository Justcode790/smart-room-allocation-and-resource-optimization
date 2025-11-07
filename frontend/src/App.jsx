import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import RoomInventory from './pages/RoomInventory';
import TimetableGenerator from './pages/TimetableGenerator';
import TimetableManagement from './pages/TimetableManagement';
import TimetableViewPage from './pages/TimetableViewPage';
import Notifications from './pages/Notifications';
import AdminTimetableEditor from './pages/AdminTimetableEditor';
import FacultyPanel from './pages/FacultyPanel';
import StudentPortal from './pages/StudentPortal';
import LiveOccupancy from './pages/LiveOccupancy';
import Analytics from './pages/Analytics';
import AdminCampusSetup from './pages/AdminCampusSetup';
import GeneratedTimetables from './pages/GeneratedTimetables';
import TimetableView from './pages/TimetableView';
import AdminSectionsDashboard from './pages/AdminSectionsDashboard';
import SectionTimetableEditor from './pages/SectionTimetableEditor';

const PrivateRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="max-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" />;
  }

  return children;
};

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />

      <Route
        path="/"
        element={
          <PrivateRoute>
            {user?.role === 'admin' ? (
              <AdminDashboard />
            ) : user?.role === 'faculty' ? (
              <FacultyPanel />
            ) : (
              <StudentPortal />
            )}
          </PrivateRoute>
        }
      />

      <Route
        path="/admin/rooms"
        element={
          <PrivateRoute allowedRoles={['admin']}>
            <RoomInventory />
          </PrivateRoute>
        }
      />

      <Route
        path="/admin/timetable"
        element={
          <PrivateRoute allowedRoles={['admin']}>
            <TimetableGenerator />
          </PrivateRoute>
        }
      />

      <Route
        path="/admin/timetable-management"
        element={
          <PrivateRoute allowedRoles={['admin']}>
            <TimetableManagement />
          </PrivateRoute>
        }
      />

      <Route
        path="/timetable/:id"
        element={
          <PrivateRoute allowedRoles={['admin']}>
            <TimetableViewPage />
          </PrivateRoute>
        }
      />

      <Route
        path="/notifications"
        element={
          <PrivateRoute>
            <Notifications />
          </PrivateRoute>
        }
      />

      <Route
        path="/admin/timetable-editor"
        element={
          <PrivateRoute allowedRoles={['admin']}>
            <AdminTimetableEditor />
          </PrivateRoute>
        }
      />

      <Route
        path="/faculty"
        element={
          <PrivateRoute allowedRoles={['faculty']}>
            <FacultyPanel />
          </PrivateRoute>
        }
      />

      <Route
        path="/student"
        element={
          <PrivateRoute allowedRoles={['student']}>
            <StudentPortal />
          </PrivateRoute>
        }
      />

      <Route
        path="/occupancy"
        element={
          <PrivateRoute>
            <LiveOccupancy />
          </PrivateRoute>
        }
      />

      <Route
        path="/analytics"
        element={
          <PrivateRoute allowedRoles={['admin']}>
            <Analytics />
          </PrivateRoute>
        }
      />

      <Route
        path="/admin/campus-setup"
        element={
          <PrivateRoute allowedRoles={['admin']}>
            <AdminCampusSetup />
          </PrivateRoute>
        }
      />

      <Route
        path="/admin/generated-timetables"
        element={
          <PrivateRoute allowedRoles={['admin']}>
            <GeneratedTimetables />
          </PrivateRoute>
        }
      />
      <Route
        path="/admin/generated-timetables/:id"
        element={
          <PrivateRoute allowedRoles={['admin']}>
            <TimetableView />
          </PrivateRoute>
        }
      />

      <Route
        path="/admin/sections"
        element={
          <PrivateRoute allowedRoles={['admin']}>
            <AdminSectionsDashboard />
          </PrivateRoute>
        }
      />

      <Route
        path="/admin/timetable-editor/:sectionId"
        element={
          <PrivateRoute allowedRoles={['admin']}>
            <SectionTimetableEditor />
          </PrivateRoute>
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <SocketProvider>
          <AppRoutes />
        </SocketProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;

