import React, { useEffect, useState } from 'react';
import {
  BookOpen,
  Clock,
  Trophy,
  User,
  Moon,
  Sun,
  Settings,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import Attendance from '../components/Attendance';
import CourseDiscovery from '../components/CourseDiscovery';
import GradeReport from '../components/GradeReport';
import NotificationSystem from '../components/NotificationSystem';
import { supabase, StudentCourse, Grade, Attendance as AttendanceType } from '../lib/supabase';

const StudentDashboard: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user, profile, logout } = useAuth();

  const [activeTab, setActiveTab] = useState('overview');
  const [courses, setCourses] = useState<StudentCourse[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [attendance, setAttendance] = useState<AttendanceType[]>([]);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('darkMode');
      if (saved !== null) return saved === 'true';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });
  const [stats, setStats] = useState({ enrolledCourses: 0, averageGrade: 0, attendanceRate: 0, totalCredits: 0 });
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (user) fetchStudentData();
  }, [user]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('darkMode', darkMode.toString());
      if (darkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [darkMode]);

  const fetchStudentData = async () => {
    const { data: coursesData } = await supabase
      .from('student_courses')
      .select(`*, courses (*, users!courses_professor_id_fkey(full_name))`)
      .eq('user_id', user.id);

    const { data: gradesData } = await supabase.from('grades').select(`*, courses (*)`).eq('user_id', user.id);

    const { data: attendanceData } = await supabase.from('attendance').select('*').eq('user_id', user.id);

    if (coursesData) setCourses(coursesData);
    if (gradesData) setGrades(gradesData);
    if (attendanceData) setAttendance(attendanceData);

    const enrolledCourses = coursesData?.length || 0;
    const totalCredits = coursesData?.reduce((sum, c) => sum + (c.courses?.credits || 0), 0) || 0;
    const averageGrade = gradesData?.reduce((sum, g) => sum + g.final_grade, 0) / (gradesData?.length || 1);
    const attendanceRate = (attendanceData?.filter((a) => a.status === 'present' || a.status === 'late').length /
      (attendanceData?.length || 1)) * 100;

    setStats({
      enrolledCourses,
      averageGrade: Math.round(averageGrade),
      attendanceRate: Math.round(attendanceRate),
      totalCredits,
    });
  };

  const switchLanguage = () => {
    const newLang = i18n.language === 'en' ? 'ar' : 'en';
    i18n.changeLanguage(newLang);
  };

  const handleLogout = async () => {
    await logout();
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              <StatCard label={t('dashboard.credits')} value={stats.totalCredits} Icon={BookOpen} color="indigo" />
              <StatCard label={t('dashboard.enrolledCourses')} value={stats.enrolledCourses} Icon={User} color="emerald" />
              <StatCard label={t('dashboard.attendanceRate')} value={`${stats.attendanceRate}%`} Icon={Clock} color="amber" />
              <StatCard label={t('dashboard.averageGrade')} value={`${stats.averageGrade}%`} Icon={Trophy} color="violet" />
            </div>
          </div>
        );
      case 'courses':
        return <CourseDiscovery />;
      case 'attendance':
        return <Attendance />;
      case 'grades':
        return <GradeReport />;
      case 'settings':
        return <SettingsPage />;
      default:
        return null;
    }
  };

  return (
    <div
      className={`flex min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300`}
      dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}
    >
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed z-50 top-0 ${
          sidebarOpen ? 'left-0' : '-left-full'
        } md:static md:left-0 w-72 bg-[#1C3D78] dark:bg-[#152b57] h-full shadow-lg flex flex-col transition-left duration-300`}
      >
        <div className="flex items-center justify-between px-8 py-6 border-b border-indigo-700">
          <h1 className="text-white font-extrabold text-2xl tracking-wide select-none">Ibn Sina LMS</h1>
          <button
            className="md:hidden text-white focus:outline-none"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <X size={24} />
          </button>
        </div>

        <div className="px-8 py-6 border-b border-indigo-700">
          <p className="text-lg font-semibold truncate max-w-full text-white">
            {profile?.full_name || user?.email.split('@')[0]}
          </p>
          <p className="text-sm text-indigo-200 truncate max-w-full">{user?.email}</p>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-3 overflow-y-auto">
          <NavItem
            label={t('dashboard.overview')}
            id="overview"
            Icon={User}
            activeTab={activeTab}
            setActiveTab={(id) => {
              setActiveTab(id);
              setSidebarOpen(false);
            }}
            color="white"
            activeColor="bg-indigo-600"
          />
          <NavItem
            label={t('dashboard.myCourses')}
            id="courses"
            Icon={BookOpen}
            activeTab={activeTab}
            setActiveTab={(id) => {
              setActiveTab(id);
              setSidebarOpen(false);
            }}
            color="white"
            activeColor="bg-indigo-600"
          />
          <NavItem
            label={t('dashboard.attendance')}
            id="attendance"
            Icon={Clock}
            activeTab={activeTab}
            setActiveTab={(id) => {
              setActiveTab(id);
              setSidebarOpen(false);
            }}
            color="white"
            activeColor="bg-indigo-600"
          />
          <NavItem
            label={t('dashboard.grades')}
            id="grades"
            Icon={Trophy}
            activeTab={activeTab}
            setActiveTab={(id) => {
              setActiveTab(id);
              setSidebarOpen(false);
            }}
            color="white"
            activeColor="bg-indigo-600"
          />
          <NavItem
            label={t('dashboard.settings')}
            id="settings"
            Icon={Settings}
            activeTab={activeTab}
            setActiveTab={(id) => {
              setActiveTab(id);
              setSidebarOpen(false);
            }}
            color="white"
            activeColor="bg-indigo-600"
          />
        </nav>

        <div className="px-8 py-4 border-t border-indigo-700 flex flex-col space-y-3">
          <button
            onClick={switchLanguage}
            className="w-full px-4 py-2 rounded-md bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition"
          >
            {i18n.language === 'en' ? 'عربى' : 'English'}
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-md bg-red-600 text-white font-semibold hover:bg-red-700 transition"
          >
            <LogOut size={18} />
            <span>{t('dashboard.logout')}</span>
          </button>
          <button
            onClick={() => setDarkMode(!darkMode)}
            aria-label="Toggle dark mode"
            className="w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-md bg-gray-700 text-white font-semibold hover:bg-gray-800 transition"
          >
            {darkMode ? (
              <>
                <Sun size={18} />
                <span>{t('dashboard.lightMode')}</span>
              </>
            ) : (
              <>
                <Moon size={18} />
                <span>{t('dashboard.darkMode')}</span>
              </>
            )}
          </button>
        </div>
      </aside>

      {/* Mobile Topbar */}
      <header className="fixed top-0 left-0 right-0 md:hidden bg-white dark:bg-gray-900 shadow-md flex items-center justify-between px-4 py-3 z-40">
        <button
          className="text-[#1C3D78] dark:text-indigo-400 focus:outline-none"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open sidebar"
        >
          <Menu size={24} />
        </button>
        <h1 className="text-xl font-bold text-[#1C3D78] dark:text-indigo-400 tracking-wide select-none">
          Ibn Sina LMS
        </h1>
        <NotificationSystem />
      </header>

      {/* Main Content */}
      <main className="flex-1 p-8 mt-16 md:mt-0 overflow-auto max-w-full">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 space-y-3 md:space-y-0">
          <h2 className="text-3xl font-bold tracking-tight">
            {t('dashboard.welcome')},{' '}
            <span className="text-[#1C3D78] dark:text-indigo-400">
              {profile?.full_name || user?.email.split('@')[0]}
            </span>
          </h2>
        </div>

        {renderContent()}
      </main>
    </div>
  );
};

interface NavItemProps {
  label: string;
  id: string;
  Icon: React.ComponentType<{ size?: number }>;
  activeTab: string;
  setActiveTab: (id: string) => void;
  color?: string;
  activeColor?: string;
}

const NavItem: React.FC<NavItemProps> = ({
  label,
  id,
  Icon,
  activeTab,
  setActiveTab,
  color = 'text-white',
  activeColor = 'bg-indigo-600',
}) => {
  const isActive = activeTab === id;
  return (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center space-x-3 rtl:space-x-reverse w-full px-4 py-3 rounded-md transition-colors duration-200
        ${isActive ? activeColor : 'hover:bg-indigo-500/30'}
        ${color}`}
      aria-current={isActive ? 'page' : undefined}
    >
      <Icon size={20} />
      <span className="font-semibold">{label}</span>
    </button>
  );
};

interface StatCardProps {
  label: string;
  value: string | number;
  Icon: React.ComponentType<{ size?: number }>;
  color?: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, Icon, color = 'indigo' }) => {
  const colors = {
    indigo: 'bg-indigo-100 text-indigo-700',
    emerald: 'bg-emerald-100 text-emerald-700',
    amber: 'bg-amber-100 text-amber-700',
    violet: 'bg-violet-100 text-violet-700',
  };

  return (
    <div
      className={`flex items-center space-x-4 rtl:space-x-reverse rounded-lg p-4 shadow-sm ${colors[color]}`}
      role="region"
      aria-label={`${label} stats`}
    >
      <div
        className={`p-3 rounded-full bg-white dark:bg-gray-800 text-${color}-600`}
        aria-hidden="true"
      >
        <Icon size={28} />
      </div>
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-2xl font-extrabold leading-none">{value}</p>
      </div>
    </div>
  );
};

const SettingsPage = () => {
  const { t } = useTranslation();
  return (
    <div className="max-w-3xl mx-auto">
      <h3 className="text-xl font-bold mb-4">{t('dashboard.settings')}</h3>
      <p>{t('dashboard.settingsDescription')}</p>
      {/* Add your settings content here */}
    </div>
  );
};

export default StudentDashboard;
