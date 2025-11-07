import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBadge from './NotificationBadge';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getNavLinks = () => {
    const commonLinks = [
      { path: '/notifications', label: 'Notifications', icon: '🔔', color: 'from-yellow-500 to-yellow-600' }
    ];

    if (user?.role === 'admin') {
      return [
        { path: '/', label: 'Dashboard', icon: '📊', color: 'from-blue-500 to-blue-600' },
        { path: '/admin/campus-setup', label: 'Campus Setup', icon: '🏫', color: 'from-indigo-500 to-indigo-600' },
        { path: '/admin/sections', label: 'Sections', icon: '📚', color: 'from-teal-500 to-teal-600' },
        { path: '/admin/accounts', label: 'Manage Accounts', icon: '👥', color: 'from-emerald-500 to-emerald-600' },
        { path: '/admin/rooms', label: 'Rooms', icon: '🏫', color: 'from-green-500 to-green-600' },
        { path: '/admin/timetable', label: 'Timetable', icon: '📅', color: 'from-purple-500 to-purple-600' },
        { path: '/admin/timetable-management', label: 'Manage Timetables', icon: '🗂️', color: 'from-indigo-500 to-indigo-600' },
        { path: '/admin/timetable-editor', label: 'Timetable Editor', icon: '✏️', color: 'from-violet-500 to-violet-600' },
        { path: '/admin/generated-timetables', label: 'Generated Timetables', icon: '📋', color: 'from-cyan-500 to-cyan-600' },
        { path: '/occupancy', label: 'Live Occupancy', icon: '👥', color: 'from-orange-500 to-orange-600' },
        { path: '/analytics', label: 'Analytics', icon: '📈', color: 'from-pink-500 to-pink-600' },
        ...commonLinks,
      ];
    } else if (user?.role === 'faculty') {
      return [
        { path: '/faculty', label: 'My Schedule', icon: '📅', color: 'from-blue-500 to-blue-600' },
        { path: '/occupancy', label: 'Occupancy', icon: '👥', color: 'from-green-500 to-green-600' },
        ...commonLinks,
      ];
    } else {
      return [
        { path: '/student', label: 'My Timetable', icon: '📅', color: 'from-blue-500 to-blue-600' },
        { path: '/occupancy', label: 'Occupancy', icon: '👥', color: 'from-green-500 to-green-600' },
        ...commonLinks,
      ];
    }
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div className="h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-gray-900 to-gray-800 transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:inset-0`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 bg-gradient-to-r from-blue-600 to-purple-600">
            <h1 className="text-xl font-bold text-white">
              🎓 Smart Campus
            </h1>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-white hover:text-gray-200"
            >
              ✕
            </button>
          </div>

          {/* User Info */}
          <div className="px-6 py-4 border-b border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-white font-medium text-sm">{user?.name}</p>
                <p className="text-gray-400 text-xs capitalize">{user?.role}</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {getNavLinks().map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive(link.path)
                    ? `bg-gradient-to-r ${link.color} text-white shadow-lg transform scale-105`
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <span className="mr-3 text-xl">{link.icon}</span>
                <span className="font-medium">{link.label}</span>
              </Link>
            ))}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-gray-700">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg font-medium hover:from-red-600 hover:to-red-700 transition shadow-lg"
            >
              <span className="mr-2">🚪</span>
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Top Bar */}
        <div className="sticky top-0 z-30 bg-white shadow-md border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-6">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-gray-600 hover:text-gray-900"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex-1 lg:ml-0 ml-4">
              <h2 className="text-lg font-semibold text-gray-800">
                {getNavLinks().find(l => isActive(l.path))?.label || 'Dashboard'}
              </h2>
            </div>
            <div className="flex items-center space-x-4">
              <NotificationBadge className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition" />
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <main className="p-6 pt-4">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;

