import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BookOpen, Clock, Trophy, User, Search, Plus } from 'lucide-react';
import { supabase, StudentCourse, Grade, Attendance as AttendanceType } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import Attendance from '../components/Attendance';
import CourseDiscovery from '../components/CourseDiscovery';
import GradeReport from '../components/GradeReport';
import NotificationSystem from '../components/NotificationSystem';

const StudentDashboard: React.FC = () => {
  const { t } = useTranslation();
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [courses, setCourses] = useState<StudentCourse[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [attendance, setAttendance] = useState<AttendanceType[]>([]);
  const [stats, setStats] = useState({
    enrolledCourses: 0,
    averageGrade: 0,
    attendanceRate: 0,
    totalCredits: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchStudentData();
    }
  }, [user]);

  const fetchStudentData = async () => {
    if (!user) return;

    try {
      // Fetch enrolled courses
      const { data: coursesData } = await supabase
        .from('student_courses')
        .select(`
          *,
          courses (
            id,
            name,
            code,
            semester,
            credits,
            department,
            session_times,
            location,
            professor_id,
            users!courses_professor_id_fkey(full_name)
          )
        `)
        .eq('user_id', user.id);

      // Fetch grades
      const { data: gradesData } = await supabase
        .from('grades')
        .select(`
          *,
          courses (
            id,
            name,
            code,
            semester,
            credits,
            professor_id,
            created_at
          )
        `)
        .eq('user_id', user.id);

      // Fetch recent attendance
      const { data: attendanceData } = await supabase
        .from('attendance')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(10);

      if (coursesData) setCourses(coursesData);
      if (gradesData) setGrades(gradesData);
      if (attendanceData) setAttendance(attendanceData);

      // Calculate stats
      const enrolledCourses = coursesData?.length || 0;
      const totalCredits = coursesData?.reduce((sum, course) => 
        sum + (course.courses?.credits || 0), 0) || 0;
      
      const averageGrade = gradesData && gradesData.length > 0
        ? gradesData.reduce((sum, grade) => sum + grade.final_grade, 0) / gradesData.length
        : 0;

      const attendanceRate = attendanceData && attendanceData.length > 0
        ? (attendanceData.filter(a => a.status === 'present' || a.status === 'late').length / attendanceData.length) * 100
        : 0;

      setStats({
        enrolledCourses,
        averageGrade: Math.round(averageGrade * 100) / 100,
        attendanceRate: Math.round(attendanceRate),
        totalCredits
      });
    } catch (error) {
      console.error('Error fetching student data:', error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'courses', label: 'My Courses', icon: BookOpen },
    { id: 'discover', label: 'Course Discovery', icon: Search },
    { id: 'attendance', label: 'Attendance', icon: Clock },
    { id: 'grades', label: 'Grade Report', icon: Trophy },
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
                <User className="h-8 w-8 text-blue-600" />
                <h1 className="text-3xl font-bold text-gray-900">
                  {t('dashboard.student.title')}
                </h1>
              </div>
              <p className="text-lg text-gray-600">
                Welcome back, {profile?.full_name || user?.email}
              </p>
              {profile?.student_id && (
                <p className="text-sm text-gray-500">
                  Student ID: {profile.student_id}
                </p>
              )}
            </div>
            <NotificationSystem />
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 overflow-x-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
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
                    <p className="text-sm font-medium text-gray-600">Enrolled Courses</p>
                    <p className="text-3xl font-bold text-blue-600">{stats.enrolledCourses}</p>
                  </div>
                  <BookOpen className="h-8 w-8 text-blue-600" />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Average Grade</p>
                    <p className="text-3xl font-bold text-green-600">
                      {stats.averageGrade > 0 ? `${stats.averageGrade}%` : 'N/A'}
                    </p>
                  </div>
                  <Trophy className="h-8 w-8 text-green-600" />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Attendance Rate</p>
                    <p className="text-3xl font-bold text-purple-600">{stats.attendanceRate}%</p>
                  </div>
                  <Clock className="h-8 w-8 text-purple-600" />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Credits</p>
                    <p className="text-3xl font-bold text-orange-600">{stats.totalCredits}</p>
                  </div>
                  <User className="h-8 w-8 text-orange-600" />
                </div>
              </div>
            </div>

            {/* Quick Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Enrolled Courses */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-2">
                    <BookOpen className="h-6 w-6 text-blue-600" />
                    <h2 className="text-2xl font-bold text-gray-900">Current Courses</h2>
                  </div>
                  <button
                    onClick={() => setActiveTab('discover')}
                    className="text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Course</span>
                  </button>
                </div>
                <div className="space-y-4">
                  {courses.length === 0 ? (
                    <div className="text-center py-8">
                      <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 text-lg">No enrolled courses</p>
                      <button
                        onClick={() => setActiveTab('discover')}
                        className="mt-2 text-blue-600 hover:text-blue-800"
                      >
                        Discover courses to enroll
                      </button>
                    </div>
                  ) : (
                    courses.slice(0, 5).map((enrollment) => (
                      <div key={enrollment.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg text-gray-900">
                              {enrollment.courses?.name}
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">
                              {enrollment.courses?.code} • {enrollment.courses?.credits} Credits
                            </p>
                            <p className="text-sm text-gray-600">
                              {enrollment.courses?.session_times}
                            </p>
                            {enrollment.courses?.location && (
                              <p className="text-xs text-gray-500 mt-1">
                                📍 {enrollment.courses.location}
                              </p>
                            )}
                            <p className="text-xs text-gray-500 mt-2">
                              Instructor: {enrollment.courses?.users?.full_name || 'TBA'}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                              {enrollment.courses?.semester}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Recent Grades */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-2">
                    <Trophy className="h-6 w-6 text-green-600" />
                    <h2 className="text-2xl font-bold text-gray-900">Recent Grades</h2>
                  </div>
                  <button
                    onClick={() => setActiveTab('grades')}
                    className="text-green-600 hover:text-green-800 text-sm"
                  >
                    View All
                  </button>
                </div>
                <div className="space-y-4">
                  {grades.length === 0 ? (
                    <div className="text-center py-8">
                      <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 text-lg">No grades posted yet</p>
                      <p className="text-gray-400 text-sm">Your grades will appear here once posted</p>
                    </div>
                  ) : (
                    grades.slice(0, 5).map((grade) => (
                      <div key={grade.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              {grade.courses?.name}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {grade.courses?.code} • {grade.courses?.semester}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-green-600">
                              {grade.final_grade}%
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(grade.posted_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'courses' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">My Enrolled Courses</h2>
              <button
                onClick={() => setActiveTab('discover')}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
              >
                <Plus className="h-5 w-5" />
                <span>Discover Courses</span>
              </button>
            </div>
            
            {courses.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-xl mb-4">No enrolled courses yet</p>
                <button
                  onClick={() => setActiveTab('discover')}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
                >
                  Browse Available Courses
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.map((enrollment) => (
                  <div key={enrollment.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {enrollment.courses?.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {enrollment.courses?.code} • {enrollment.courses?.credits} Credits
                      </p>
                    </div>
                    
                    <div className="space-y-2 text-sm text-gray-600 mb-4">
                      <p><strong>Schedule:</strong> {enrollment.courses?.session_times}</p>
                      {enrollment.courses?.location && (
                        <p><strong>Location:</strong> {enrollment.courses?.location}</p>
                      )}
                      <p><strong>Department:</strong> {enrollment.courses?.department}</p>
                      <p><strong>Instructor:</strong> {enrollment.courses?.users?.full_name || 'TBA'}</p>
                    </div>

                    <div className="pt-4 border-t border-gray-200">
                      <div className="flex justify-between items-center">
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                          {enrollment.courses?.semester}
                        </span>
                        <span className="text-xs text-gray-500">
                          Enrolled: {new Date(enrollment.enrolled_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'discover' && <CourseDiscovery />}
        {activeTab === 'attendance' && <Attendance />}
        {activeTab === 'grades' && <GradeReport />}
      </div>
    </div>
  );
};

export default StudentDashboard;