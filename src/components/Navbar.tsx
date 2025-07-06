import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LogOut, Globe, BookOpen } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import NotificationSystem from './NotificationSystem';

const Navbar: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'ar' : 'en';
    i18n.changeLanguage(newLang);
    document.dir = newLang === 'ar' ? 'rtl' : 'ltr';
  };

  const isRTL = i18n.language === 'ar';

  return (
    <nav className={`bg-white shadow-md border-b border-gray-200 ${isRTL ? 'rtl' : 'ltr'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center space-x-2">
            <BookOpen className="h-8 w-8 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">MYISU Portal</span>
          </Link>

          <div className="flex items-center space-x-4">
            {/* Language Toggle */}
            <button
              onClick={toggleLanguage}
              className="flex items-center space-x-1 px-3 py-2 rounded-md text-gray-700 hover:text-blue-600 hover:bg-gray-100 transition-colors"
            >
              <Globe className="h-4 w-4" />
              <span className="text-sm font-medium">
                {i18n.language === 'en' ? 'العربية' : 'English'}
              </span>
            </button>

            {user && (
              <>
                {/* Navigation Links */}
                <div className="hidden md:flex items-center space-x-6">
                  <Link
                    to="/dashboard"
                    className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
                  >
                    {t('nav.dashboard')}
                  </Link>
                  {profile?.role === 'student' && (
                    <>
                      <Link
                        to="/student-dashboard"
                        className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
                      >
                        {t('nav.courses')}
                      </Link>
                    </>
                  )}
                  <Link
                    to="/contact"
                    className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
                  >
                    {t('nav.contact')}
                  </Link>
                </div>

                {/* Notifications */}
                <NotificationSystem />

                {/* User Info */}
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {profile?.full_name || user.email}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">
                      {t(`auth.${profile?.role || 'student'}`)}
                      {profile?.student_id && ` • ${profile.student_id}`}
                    </p>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center space-x-1 px-3 py-2 rounded-md text-gray-700 hover:text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    <span className="text-sm font-medium">{t('nav.logout')}</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;