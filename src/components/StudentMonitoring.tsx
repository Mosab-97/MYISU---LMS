import React, { useState, useEffect } from 'react';
import { Users, Search, Filter, Mail, Phone, AlertTriangle, TrendingDown } from 'lucide-react';
import { supabase, StudentCourse, Attendance } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface StudentWithStats {
  id: string;
  full_name: string;
  email: string;
  student_id: string;
  phone?: string;
  course_id: string;
  course_name: string;
  enrolled_at: string;
  attendance_rate: number;
  total_classes: number;
  present_count: number;
  late_count: number;
  absent_count: number;
  last_attendance: string | null;
}

const StudentMonitoring: React.FC = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState<StudentWithStats[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<StudentWithStats[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [attendanceFilter, setAttendanceFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  useEffect(() => {
    filterStudents();
  }, [students, selectedCourse, searchTerm, attendanceFilter]);

  const fetchData = async () => {
    if (!user) return;

    try {
      // Fetch courses taught by this professor
      const { data: coursesData } = await supabase
        .from('courses')
        .select('*')
        .eq('professor_id', user.id);

      if (coursesData) {
        setCourses(coursesData);

        // Fetch students enrolled in these courses with attendance stats
        const courseIds = coursesData.map(c => c.id);
        if (courseIds.length > 0) {
          const { data: enrollmentsData } = await supabase
            .from('student_courses')
            .select(`
              *,
              users!inner(id, full_name, email, student_id, phone),
              courses!inner(id, name)
            `)
            .in('course_id', courseIds);

          if (enrollmentsData) {
            // Calculate attendance stats for each student
            const studentsWithStats = await Promise.all(
              enrollmentsData.map(async (enrollment) => {
                const { data: attendanceData } = await supabase
                  .from('attendance_records')
                  .select('*')
                  .eq('student_id', enrollment.user_id)
                  .eq('course_id', enrollment.course_id);

                const totalClasses = attendanceData?.length || 0;
                const presentCount = attendanceData?.filter(a => 
                  new Date(a.timestamp).getHours() <= 9 || 
                  (new Date(a.timestamp).getHours() === 9 && new Date(a.timestamp).getMinutes() <= 15) ||
                  (new Date(a.timestamp).getHours() >= 13 && new Date(a.timestamp).getHours() <= 14)
                ).length || 0;
                
                const lateCount = attendanceData?.filter(a => 
                  (new Date(a.timestamp).getHours() === 9 && new Date(a.timestamp).getMinutes() > 15) ||
                  (new Date(a.timestamp).getHours() === 14 && new Date(a.timestamp).getMinutes() > 15)
                ).length || 0;

                const attendanceRate = totalClasses > 0 ? ((presentCount + lateCount) / totalClasses) * 100 : 0;
                
                const lastAttendance = attendanceData && attendanceData.length > 0 
                  ? attendanceData.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0].timestamp
                  : null;

                return {
                  id: enrollment.users.id,
                  full_name: enrollment.users.full_name || 'Unknown',
                  email: enrollment.users.email,
                  student_id: enrollment.users.student_id || 'N/A',
                  phone: enrollment.users.phone,
                  course_id: enrollment.course_id,
                  course_name: enrollment.courses.name,
                  enrolled_at: enrollment.enrolled_at,
                  attendance_rate: Math.round(attendanceRate),
                  total_classes: totalClasses,
                  present_count: presentCount,
                  late_count: lateCount,
                  absent_count: Math.max(0, totalClasses - presentCount - lateCount),
                  last_attendance: lastAttendance
                };
              })
            );

            setStudents(studentsWithStats);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching student data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterStudents = () => {
    let filtered = students;

    if (selectedCourse) {
      filtered = filtered.filter(student => student.course_id === selectedCourse);
    }

    if (searchTerm) {
      filtered = filtered.filter(student =>
        student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.student_id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (attendanceFilter !== 'all') {
      switch (attendanceFilter) {
        case 'low':
          filtered = filtered.filter(student => student.attendance_rate < 75);
          break;
        case 'medium':
          filtered = filtered.filter(student => student.attendance_rate >= 75 && student.attendance_rate < 90);
          break;
        case 'high':
          filtered = filtered.filter(student => student.attendance_rate >= 90);
          break;
      }
    }

    setFilteredStudents(filtered);
  };

  const sendLowAttendanceAlert = async (studentId: string, studentName: string, courseName: string, attendanceRate: number) => {
    await supabase
      .from('notifications')
      .insert([{
        user_id: studentId,
        title: 'Low Attendance Warning',
        message: `Your attendance in ${courseName} is ${attendanceRate}%. Please improve your attendance to avoid academic consequences.`,
        type: 'attendance'
      }]);

    alert(`Low attendance alert sent to ${studentName}`);
  };

  const getAttendanceColor = (rate: number) => {
    if (rate >= 90) return 'text-green-600 bg-green-50';
    if (rate >= 75) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Student Monitoring</h2>
        <div className="mt-4 md:mt-0 text-sm text-gray-600">
          Total Students: {filteredStudents.length}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Courses</option>
            {courses.map(course => (
              <option key={course.id} value={course.id}>{course.name}</option>
            ))}
          </select>

          <select
            value={attendanceFilter}
            onChange={(e) => setAttendanceFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Attendance</option>
            <option value="low">Low (&lt; 75%)</option>
            <option value="medium">Medium (75-89%)</option>
            <option value="high">High (≥ 90%)</option>
          </select>

          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <span className="text-sm text-gray-600">
              {filteredStudents.filter(s => s.attendance_rate < 75).length} students with low attendance
            </span>
          </div>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Course
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Attendance Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Classes
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Attendance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredStudents.map((student) => (
                <tr key={`${student.id}-${student.course_id}`} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {student.full_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {student.student_id} • {student.email}
                      </div>
                      {student.phone && (
                        <div className="text-xs text-gray-400">
                          📞 {student.phone}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {student.course_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getAttendanceColor(student.attendance_rate)}`}>
                        {student.attendance_rate}%
                      </span>
                      {student.attendance_rate < 75 && (
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>
                      <div>Total: {student.total_classes}</div>
                      <div className="text-xs text-gray-500">
                        P: {student.present_count} | L: {student.late_count} | A: {student.absent_count}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {student.last_attendance 
                      ? new Date(student.last_attendance).toLocaleDateString()
                      : 'Never'
                    }
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => window.open(`mailto:${student.email}`, '_blank')}
                        className="text-blue-600 hover:text-blue-900"
                        title="Send Email"
                      >
                        <Mail className="h-4 w-4" />
                      </button>
                      {student.phone && (
                        <button
                          onClick={() => window.open(`tel:${student.phone}`, '_blank')}
                          className="text-green-600 hover:text-green-900"
                          title="Call Student"
                        >
                          <Phone className="h-4 w-4" />
                        </button>
                      )}
                      {student.attendance_rate < 75 && (
                        <button
                          onClick={() => sendLowAttendanceAlert(
                            student.id, 
                            student.full_name, 
                            student.course_name, 
                            student.attendance_rate
                          )}
                          className="text-red-600 hover:text-red-900"
                          title="Send Low Attendance Alert"
                        >
                          <TrendingDown className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredStudents.length === 0 && (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No students found</p>
            <p className="text-gray-400">Try adjusting your filters</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentMonitoring;