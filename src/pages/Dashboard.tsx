import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BookOpen, Users, GraduationCap, MessageSquare, Settings, BarChart3 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect based on role
    if (profile?.role === 'student') {
      navigate('/student-dashboard');
    } else if (profile?.role === 'faculty') {
      navigate('/faculty-dashboard');
    } else if (profile?.role === 'admin') {
      navigate('/admin-dashboard');
    }
  }, [profile, navigate]);

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Welcome Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {t('dashboard.welcome')}
          </h1>
          <p className="text-xl text-gray-600">
            Welcome back, {profile.full_name || profile.email}
          </p>
          <div className="mt-4">
            <span className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full font-medium capitalize">
              {profile.role}
            </span>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div 
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => navigate(profile.role === 'student' ? '/student-dashboard' : '/faculty-dashboard')}
          >
            <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mb-4">
              <BookOpen className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {t('nav.courses')}
            </h3>
            <p className="text-gray-600">
              {profile.role === 'student' ? 'View enrolled courses' : 'Manage your courses'}
            </p>
          </div>

          <div 
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => navigate(profile.role === 'student' ? '/student-dashboard' : '/faculty-dashboard')}
          >
            <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mb-4">
              <Users className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {t('nav.attendance')}
            </h3>
            <p className="text-gray-600">
              {profile.role === 'student' ? 'Track your attendance' : 'Manage student attendance'}
            </p>
          </div>

          <div 
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => navigate(profile.role === 'student' ? '/student-dashboard' : '/faculty-dashboard')}
          >
            <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg mb-4">
              <GraduationCap className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {t('nav.grades')}
            </h3>
            <p className="text-gray-600">
              {profile.role === 'student' ? 'View your grades' : 'Manage student grades'}
            </p>
          </div>

          <div 
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => navigate('/contact')}
          >
            <div className="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-lg mb-4">
              <MessageSquare className="h-6 w-6 text-orange-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {t('nav.contact')}
            </h3>
            <p className="text-gray-600">
              Get in touch with support
            </p>
          </div>
        </div>

        {/* Role-specific Quick Actions */}
        {profile.role === 'admin' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-lg mb-4">
                <Settings className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                System Administration
              </h3>
              <p className="text-gray-600">
                Manage users, courses, and system settings
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-center justify-center w-12 h-12 bg-indigo-100 rounded-lg mb-4">
                <BarChart3 className="h-6 w-6 text-indigo-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Analytics & Reports
              </h3>
              <p className="text-gray-600">
                View system analytics and generate reports
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-lg mb-4">
                <Users className="h-6 w-6 text-yellow-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                User Management
              </h3>
              <p className="text-gray-600">
                Manage student and faculty accounts
              </p>
            </div>
          </div>
        )}

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Recent Activity</h2>
          <div className="text-center py-12">
            <p className="text-gray-500">
              Your recent activity will appear here once you start using the portal.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;