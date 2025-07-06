import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  BookOpen, 
  Users, 
  Clock, 
  Calendar, 
  CheckCircle, 
  GraduationCap,
  Bell,
  BarChart3,
  Shield,
  MapPin,
  Mail,
  Phone,
  Globe,
  Menu,
  X,
  ChevronRight,
  Star,
  Award,
  Target
} from 'lucide-react';
import { Link } from 'react-router-dom';

const Homepage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [attendanceStats, setAttendanceStats] = useState({
    studentsCheckedIn: 0,
    currentSessionTime: '',
    activeSessions: 0,
    systemStatus: 'active'
  });

  const isRTL = i18n.language === 'ar';

  // Animated counters
  const [counters, setCounters] = useState({
    students: 0,
    sessions: 0,
    checkIns: 0
  });

  useEffect(() => {
    // Animate counters on load
    const animateCounters = () => {
      const targetStudents = 1247;
      const targetSessions = 8;
      const targetCheckIns = 892;
      
      let currentStudents = 0;
      let currentSessions = 0;
      let currentCheckIns = 0;

      const interval = setInterval(() => {
        if (currentStudents < targetStudents) {
          currentStudents += Math.ceil(targetStudents / 50);
          if (currentStudents > targetStudents) currentStudents = targetStudents;
        }
        if (currentSessions < targetSessions) {
          currentSessions += 1;
        }
        if (currentCheckIns < targetCheckIns) {
          currentCheckIns += Math.ceil(targetCheckIns / 50);
          if (currentCheckIns > targetCheckIns) currentCheckIns = targetCheckIns;
        }

        setCounters({
          students: currentStudents,
          sessions: currentSessions,
          checkIns: currentCheckIns
        });

        if (currentStudents >= targetStudents && currentSessions >= targetSessions && currentCheckIns >= targetCheckIns) {
          clearInterval(interval);
        }
      }, 50);
    };

    animateCounters();

    // Update current time
    const updateTime = () => {
      const now = new Date();
      const timeString = now.toLocaleTimeString(isRTL ? 'ar-SA' : 'en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: !isRTL
      });
      setAttendanceStats(prev => ({
        ...prev,
        currentSessionTime: timeString
      }));
    };

    updateTime();
    const timeInterval = setInterval(updateTime, 60000);

    return () => clearInterval(timeInterval);
  }, [isRTL]);

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'ar' : 'en';
    i18n.changeLanguage(newLang);
    document.dir = newLang === 'ar' ? 'rtl' : 'ltr';
  };

  const features = [
    {
      icon: BookOpen,
      titleEn: 'Course Management',
      titleAr: 'إدارة المقررات',
      descEn: 'Faculty can create, edit, and manage courses and sessions with advanced scheduling tools.',
      descAr: 'يمكن لأعضاء هيئة التدريس إنشاء وتحرير وإدارة المقررات والجلسات بأدوات جدولة متقدمة.'
    },
    {
      icon: GraduationCap,
      titleEn: 'Student Dashboard',
      titleAr: 'لوحة الطالب',
      descEn: 'Students view grades, attendance, course progress, and receive personalized insights.',
      descAr: 'يمكن للطلاب عرض الدرجات والحضور وتقدم المقررات والحصول على رؤى شخصية.'
    },
    {
      icon: Bell,
      titleEn: 'Smart Notifications',
      titleAr: 'الإشعارات الذكية',
      descEn: 'Automated alerts for attendance, grades, deadlines, and important announcements.',
      descAr: 'تنبيهات تلقائية للحضور والدرجات والمواعيد النهائية والإعلانات المهمة.'
    },
    {
      icon: Shield,
      titleEn: 'Secure Grades',
      titleAr: 'عرض الدرجات بأمان',
      descEn: 'Students access grades securely after professors upload them with encryption.',
      descAr: 'يمكن للطلاب الاطلاع على الدرجات بأمان بعد رفعها من قبل الأساتذة مع التشفير.'
    }
  ];

  const menuItems = [
    { labelEn: 'About', labelAr: 'معلومات', href: '#about' },
    { labelEn: 'Features', labelAr: 'الميزات', href: '#features' },
    { labelEn: 'Contact', labelAr: 'تواصل معنا', href: '#contact' },
  ];

  return (
    <div className={`min-h-screen bg-white ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">MyISU</h1>
                <p className="text-xs text-gray-600">
                  {isRTL ? 'جامعة ابن سينا' : 'Ibn Sina University'}
                </p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              {menuItems.map((item, index) => (
                <a
                  key={index}
                  href={item.href}
                  className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
                >
                  {isRTL ? item.labelAr : item.labelEn}
                </a>
              ))}
              <Link
                to="/login"
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                {isRTL ? 'تسجيل الدخول' : 'Login'}
              </Link>
            </nav>

            {/* Language Toggle & Mobile Menu */}
            <div className="flex items-center space-x-4">
              <button
                onClick={toggleLanguage}
                className="flex items-center space-x-1 px-3 py-1 rounded-md text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <Globe className="h-4 w-4" />
                <span className="text-sm font-medium">
                  {i18n.language === 'en' ? 'العربية' : 'English'}
                </span>
              </button>

              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-md text-gray-700 hover:bg-gray-100"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-200">
              <div className="space-y-2">
                {menuItems.map((item, index) => (
                  <a
                    key={index}
                    href={item.href}
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {isRTL ? item.labelAr : item.labelEn}
                  </a>
                ))}
                <Link
                  to="/login"
                  className="block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-center"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {isRTL ? 'تسجيل الدخول' : 'Login'}
                </Link>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-20 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-20 h-20 bg-blue-500 rounded-full animate-pulse"></div>
          <div className="absolute top-32 right-20 w-16 h-16 bg-purple-500 rounded-full animate-bounce"></div>
          <div className="absolute bottom-20 left-1/4 w-12 h-12 bg-indigo-500 rounded-full animate-ping"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              {isRTL ? (
                <>
                  مرحبًا بك في <span className="text-blue-600">MyISU</span>
                  <br />
                  <span className="text-3xl md:text-4xl text-gray-700">منصتك الذكية للتعليم</span>
                </>
              ) : (
                <>
                  Welcome to <span className="text-blue-600">MyISU</span>
                  <br />
                  <span className="text-3xl md:text-4xl text-gray-700">Your Smart Learning Portal</span>
                </>
              )}
            </h1>

            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              {isRTL 
                ? 'أدوات تعليمية ذكية وآمنة لطلبة وأعضاء هيئة التدريس بجامعة ابن سينا مع تتبع الحضور الجغرافي والإشعارات الذكية.'
                : 'Secure, real-time academic tools for students and faculty of Ibn Sina University with geolocation attendance and smart notifications.'
              }
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                to="/login"
                className="bg-blue-600 text-white px-8 py-4 rounded-xl hover:bg-blue-700 transition-all duration-300 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center space-x-2"
              >
                <span>{isRTL ? 'تسجيل الدخول إلى MyISU' : 'Login to MyISU'}</span>
                <ChevronRight className="h-5 w-5" />
              </Link>
              <a
                href="#contact"
                className="border-2 border-blue-600 text-blue-600 px-8 py-4 rounded-xl hover:bg-blue-600 hover:text-white transition-all duration-300 font-semibold text-lg"
              >
                {isRTL ? 'تواصل مع الدعم' : 'Contact Support'}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Live Attendance Snapshot */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              {isRTL ? 'إحصائيات الحضور المباشرة' : 'Live Attendance Snapshot'}
            </h2>
            <p className="text-gray-600 text-lg">
              {isRTL ? 'تحديث مباشر كل دقيقة' : 'Updated live every minute'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Students Checked In */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 text-center hover:shadow-lg transition-shadow">
              <div className="flex justify-center mb-4">
                <div className="bg-blue-600 p-3 rounded-full">
                  <Users className="h-8 w-8 text-white" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-blue-600 mb-2">
                {counters.checkIns.toLocaleString()}
              </h3>
              <p className="text-gray-700 font-medium">
                {isRTL ? 'الطلاب الذين سجلوا الحضور اليوم' : 'Students Checked In Today'}
              </p>
            </div>

            {/* Current Session Time */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 text-center hover:shadow-lg transition-shadow">
              <div className="flex justify-center mb-4">
                <div className="bg-green-600 p-3 rounded-full">
                  <Clock className="h-8 w-8 text-white" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-green-600 mb-2">
                {attendanceStats.currentSessionTime}
              </h3>
              <p className="text-gray-700 font-medium">
                {isRTL ? 'وقت تسجيل الحضور الحالي' : 'Current Check-In Time'}
              </p>
            </div>

            {/* Active Sessions */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 text-center hover:shadow-lg transition-shadow">
              <div className="flex justify-center mb-4">
                <div className="bg-purple-600 p-3 rounded-full">
                  <Calendar className="h-8 w-8 text-white" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-purple-600 mb-2">
                {counters.sessions}
              </h3>
              <p className="text-gray-700 font-medium">
                {isRTL ? 'الحصص النشطة حاليًا' : 'Sessions Active Right Now'}
              </p>
            </div>

            {/* System Status */}
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 text-center hover:shadow-lg transition-shadow">
              <div className="flex justify-center mb-4">
                <div className="bg-orange-600 p-3 rounded-full">
                  <CheckCircle className="h-8 w-8 text-white" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-orange-600 mb-2">
                {isRTL ? 'نشط' : 'Active'}
              </h3>
              <p className="text-gray-700 font-medium">
                {isRTL ? 'حالة النظام' : 'System Status'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Smart Geo-Location Preview */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">
            {isRTL ? 'تسجيل الحضور الذكي بالموقع الجغرافي' : 'Smart Geo-Location Check-In'}
          </h2>

          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <button
                  disabled
                  className="bg-gray-300 text-gray-500 px-12 py-6 rounded-xl font-bold text-xl cursor-not-allowed flex items-center space-x-3"
                >
                  <MapPin className="h-6 w-6" />
                  <span>{isRTL ? 'تسجيل الحضور للحصة' : 'Check In to Class'}</span>
                </button>
                <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                  🔒
                </div>
              </div>
            </div>

            <p className="text-gray-600 mb-4 text-lg">
              {isRTL ? 'تسجيل الحضور متاح بعد تسجيل الدخول.' : 'Attendance check-in available after login.'}
            </p>

            <div className="bg-blue-50 rounded-xl p-6">
              <p className="text-gray-700 leading-relaxed">
                {isRTL 
                  ? 'يستخدم نظام الحضور الذكي الموقع الجغرافي في الوقت الفعلي ووقت الجلسة لتتبع الحضور بدقة. يضمن النظام أن الطلاب متواجدون فعليًا في الحرم الجامعي أثناء تسجيل الحضور.'
                  : 'Our smart attendance system uses real-time geolocation and session time-lock to ensure accurate presence tracking. The system ensures students are physically present on campus during check-in.'
                }
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Overview */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              {isRTL ? 'ميزات المنصة' : 'Platform Features'}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {isRTL 
                ? 'اكتشف الأدوات المتقدمة التي تجعل التعليم أكثر ذكاءً وفعالية'
                : 'Discover the advanced tools that make education smarter and more effective'
              }
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-8 border border-gray-100 hover:border-blue-200 transform hover:scale-105"
                >
                  <div className="flex justify-center mb-6">
                    <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-4 rounded-xl">
                      <Icon className="h-8 w-8 text-white" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">
                    {isRTL ? feature.titleAr : feature.titleEn}
                  </h3>
                  <p className="text-gray-600 text-center leading-relaxed">
                    {isRTL ? feature.descAr : feature.descEn}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Private Access Notice */}
      <section className="py-16 bg-gradient-to-r from-red-50 to-orange-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-white rounded-2xl shadow-lg p-8 border-l-4 border-red-500">
            <div className="flex justify-center mb-4">
              <Shield className="h-12 w-12 text-red-500" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              {isRTL ? 'إشعار الوصول الخاص' : 'Private Access Notice'}
            </h3>
            <p className="text-lg text-gray-700 leading-relaxed">
              {isRTL 
                ? 'منصة MyISU مخصصة فقط لطلبة وأعضاء هيئة التدريس بجامعة ابن سينا. يمنع الدخول غير المصرح به ويخضع للمساءلة القانونية.'
                : 'MyISU is exclusively for Ibn Sina University students and faculty. Unauthorized access is prohibited and subject to legal action.'
              }
            </p>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              {isRTL ? 'هل تحتاج إلى مساعدة؟' : 'Need Help or Support?'}
            </h2>
            <p className="text-xl text-gray-300">
              {isRTL ? 'فريق الدعم متاح لمساعدتك' : 'Our support team is here to help you'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="text-center">
              <div className="bg-blue-600 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Mail className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold mb-2">
                {isRTL ? 'البريد الإلكتروني' : 'Email Support'}
              </h3>
              <p className="text-gray-300">support@isu.edu.sa</p>
            </div>

            <div className="text-center">
              <div className="bg-green-600 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Phone className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold mb-2">
                {isRTL ? 'الهاتف' : 'Phone Support'}
              </h3>
              <p className="text-gray-300">+966 11 234 5678</p>
            </div>

            <div className="text-center">
              <div className="bg-purple-600 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Clock className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold mb-2">
                {isRTL ? 'ساعات العمل' : 'Office Hours'}
              </h3>
              <p className="text-gray-300">
                {isRTL ? 'الأحد - الخميس: 8:00 - 17:00' : 'Sun - Thu: 8:00 AM - 5:00 PM'}
              </p>
            </div>
          </div>

          <div className="text-center">
            <a
              href="mailto:support@isu.edu.sa"
              className="bg-blue-600 text-white px-8 py-4 rounded-xl hover:bg-blue-700 transition-colors font-semibold text-lg inline-flex items-center space-x-2"
            >
              <Mail className="h-5 w-5" />
              <span>{isRTL ? 'تواصل مع الدعم' : 'Contact Support'}</span>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Logo & Description */}
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg">
                  <BookOpen className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">MyISU</h3>
                  <p className="text-sm text-gray-300">
                    {isRTL ? 'جامعة ابن سينا' : 'Ibn Sina University'}
                  </p>
                </div>
              </div>
              <p className="text-gray-300 leading-relaxed">
                {isRTL 
                  ? 'نظام إدارة التعلم الذكي لجامعة ابن سينا. منصة شاملة للطلاب وأعضاء هيئة التدريس.'
                  : 'Smart Learning Management System for Ibn Sina University. A comprehensive platform for students and faculty.'
                }
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-lg font-semibold mb-4">
                {isRTL ? 'روابط سريعة' : 'Quick Links'}
              </h4>
              <ul className="space-y-2">
                <li><a href="#about" className="text-gray-300 hover:text-white transition-colors">{isRTL ? 'معلومات' : 'About'}</a></li>
                <li><a href="#features" className="text-gray-300 hover:text-white transition-colors">{isRTL ? 'الميزات' : 'Features'}</a></li>
                <li><a href="#contact" className="text-gray-300 hover:text-white transition-colors">{isRTL ? 'تواصل معنا' : 'Contact'}</a></li>
                <li><Link to="/login" className="text-gray-300 hover:text-white transition-colors">{isRTL ? 'تسجيل الدخول' : 'Login'}</Link></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-lg font-semibold mb-4">
                {isRTL ? 'قانوني' : 'Legal'}
              </h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-300 hover:text-white transition-colors">{isRTL ? 'الشروط والأحكام' : 'Terms of Service'}</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white transition-colors">{isRTL ? 'سياسة الخصوصية' : 'Privacy Policy'}</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white transition-colors">{isRTL ? 'سياسة الاستخدام' : 'Usage Policy'}</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-700 mt-8 pt-8 text-center">
            <p className="text-gray-300">
              © 2025 MyISU – {isRTL ? 'نظام إدارة التعلم لجامعة ابن سينا' : 'Ibn Sina University LMS'}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Homepage;