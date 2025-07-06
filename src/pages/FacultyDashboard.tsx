import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BookOpen, Users, Clock, Trophy, Bell, Calendar, Settings, GraduationCap } from 'lucide-react';
import { supabase, Course, StudentCourse } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import CourseManagement from '../components/CourseManagement';
import StudentMonitoring from '../components/StudentMonitoring';
import AttendanceScheduling from '../components/AttendanceScheduling';
import GradeManagement from '../components/GradeManagement';
import NotificationSystem from '../components/NotificationSystem';

const FacultyDashboard: React.FC = () => {
  const { t } = useTranslation();
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<StudentCourse[]>([]);
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalStudents: 0,
    pendingGrades: 0,
    attendanceAlerts: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchFacultyData();
    }
  }, [user]);

  const fetchFacultyData = async () => {
    if (!user) return;

    try {
      // Fetch courses taught by this faculty member
      const { data: coursesData } = await supabase
        .from('courses')
        .select('*')
        .eq('professor_id', user.id);

      if (coursesData) {
        setCourses(coursesData);

        // Fetch enrollments for these courses
        const courseIds = coursesData.map(course => course.id);
        if (courseIds.length > 0) {
          const { data: enrollmentsData } = await supabase
            .from('student_courses')
            .select(`
              *,
              users!inner(id, full_name, email, student_id, phone)
            `)
            .in('course_id', courseIds);

          if (enrollmentsData) {
            setEnrollments(enrollmentsData);
          }

          // Calculate stats
          const totalStudents = enrollmentsData?.length || 0;
          
          // Count pending grades (students without grades for active courses)
          const { data: gradesData } = await supabase
            .from('grades')
            .select('user_id, course_id')
            .in('course_id', courseIds);

          const studentsWithGrades = new Set(
            gradesData?.map(g => `${g.user_id}-${g.course_id}`) || []
          );
          
          const totalEnrollments = enrollmentsData?.length || 0;
          const pendingGrades = totalEnrollments - studentsWithGrades.size;

          setStats({
            totalCourses: coursesData.length,
            totalStudents,
            pendingGrades,
            attendanceAlerts: 0 // This would be calculated based on attendance thresholds
          });
        }
      }
    } catch (error) {
      console.error('Error fetching faculty data:', error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BookOpen },
    { id: 'courses', label: 'Course Management', icon: Settings },
    { id: 'students', label: 'Student Monitoring', icon: Users },
    { id: 'attendance', label: 'Attendance Scheduling', icon: Calendar },
    { id: 'grades', label: 'Grade Management', icon: GraduationCap },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <BookOpen className="h-8 w-8 text-indigo-600" />
                <h1 className="text-3xl font-bold text-gray-900">
                  {t('dashboard.faculty.title')}
                </h1>
              </div>
              <p className="text-lg text-gray-600">
                Welcome back, {profile?.full_name || user?.email}
              </p>
            </div>
            <NotificationSystem />
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Teaching Courses</p>
                    <p className="text-3xl font-bold text-indigo-600">{stats.totalCourses}</p>
                  </div>
                  <BookOpen className="h-8 w-8 text-indigo-600" />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Students</p>
                    <p className="text-3xl font-bold text-blue-600">{stats.totalStudents}</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Pending Grades</p>
                    <p className="text-3xl font-bold text-orange-600">{stats.pendingGrades}</p>
                  </div>
                  <Trophy className="h-8 w-8 text-orange-600" />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Attendance Alerts</p>
                    <p className="text-3xl font-bold text-red-600">{stats.attendanceAlerts}</p>
                  </div>
                  <Bell className="h-8 w-8 text-red-600" />
                </div>
              </div>
            </div>

            {/* Quick Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Recent Courses */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center space-x-2 mb-6">
                  <BookOpen className="h-6 w-6 text-indigo-600" />
                  <h2 className="text-2xl font-bold text-gray-900">Recent Courses</h2>
                </div>
                <div className="space-y-4">
                  {courses.slice(0, 5).map((course) => {
                    const courseEnrollments = enrollments.filter(e => e.course_id === course.id);
                    return (
                      <div key={course.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold text-lg text-gray-900">
                              {course.name}
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">
                              {course.code} • {course.semester}
                            </p>
                            <p className="text-xs text-gray-500 mt-2">
                              {courseEnrollments.length} / {course.capacity} students
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="bg-indigo-100 text-indigo-800 text-xs font-medium px-2.5 py-0.5 rounded">
                              Active
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Recent Enrollments */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center space-x-2 mb-6">
                  <Users className="h-6 w-6 text-blue-600" />
                  <h2 className="text-2xl font-bold text-gray-900">Recent Enrollments</h2>
                </div>
                <div className="space-y-4">
                  {enrollments
                    .sort((a, b) => new Date(b.enrolled_at).getTime() - new Date(a.enrolled_at).getTime())
                    .slice(0, 5)
                    .map((enrollment) => (
                      <div key={enrollment.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              {enrollment.users?.full_name || 'Unknown Student'}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {enrollment.users?.student_id || enrollment.users?.email}
                            </p>
                            <p className="text-xs text-gray-500">
                              Course: {courses.find(c => c.id === enrollment.course_id)?.name}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-500">
                              {new Date(enrollment.enrolled_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'courses' && <CourseManagement />}
        {activeTab === 'students' && <StudentMonitoring />}
        {activeTab === 'attendance' && <AttendanceScheduling />}
        {activeTab === 'grades' && <GradeManagement />}
      </div>
    </div>
  );
};

export default FacultyDashboard;