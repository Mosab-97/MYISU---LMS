import React, { useState, useEffect } from 'react';
import { Search, Filter, BookOpen, Users, Clock, MapPin, Plus } from 'lucide-react';
import { supabase, Course, StudentCourse } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const CourseDiscovery: React.FC = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrolledCourses, setEnrolledCourses] = useState<string[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    department: '',
    credits: '',
    semester: ''
  });
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  useEffect(() => {
    fetchCourses();
    fetchEnrolledCourses();
  }, [user]);

  useEffect(() => {
    filterCourses();
  }, [courses, searchTerm, filters]);

  const fetchCourses = async () => {
    const { data } = await supabase
      .from('courses')
      .select(`
        *,
        users!courses_professor_id_fkey(full_name)
      `)
      .order('name');

    if (data) setCourses(data);
  };

  const fetchEnrolledCourses = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('student_courses')
      .select('course_id')
      .eq('user_id', user.id);

    if (data) {
      setEnrolledCourses(data.map(enrollment => enrollment.course_id));
    }
  };

  const filterCourses = () => {
    let filtered = courses.filter(course => 
      !enrolledCourses.includes(course.id)
    );

    if (searchTerm) {
      filtered = filtered.filter(course =>
        course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.department.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filters.department) {
      filtered = filtered.filter(course => course.department === filters.department);
    }

    if (filters.credits) {
      filtered = filtered.filter(course => course.credits.toString() === filters.credits);
    }

    if (filters.semester) {
      filtered = filtered.filter(course => course.semester === filters.semester);
    }

    setFilteredCourses(filtered);
  };

  const handleEnroll = async () => {
    if (!user || !selectedCourse) return;

    // Check capacity
    const { data: enrollmentCount } = await supabase
      .from('student_courses')
      .select('id')
      .eq('course_id', selectedCourse.id);

    if (enrollmentCount && enrollmentCount.length >= selectedCourse.capacity) {
      alert('This course is at full capacity.');
      return;
    }

    const { error } = await supabase
      .from('student_courses')
      .insert([{
        user_id: user.id,
        course_id: selectedCourse.id
      }]);

    if (!error) {
      // Create notification
      await supabase
        .from('notifications')
        .insert([{
          user_id: user.id,
          title: 'Course Enrollment Successful',
          message: `You have successfully enrolled in ${selectedCourse.name}`,
          type: 'enrollment'
        }]);

      fetchEnrolledCourses();
      setShowEnrollModal(false);
      setSelectedCourse(null);
    }
  };

  const departments = [...new Set(courses.map(course => course.department))];
  const creditOptions = [...new Set(courses.map(course => course.credits))];
  const semesters = [...new Set(courses.map(course => course.semester))];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Course Discovery</h2>
        <div className="mt-4 md:mt-0 flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-md">
        <div className="flex items-center space-x-2 mb-4">
          <Filter className="h-5 w-5 text-gray-600" />
          <h3 className="font-semibold text-gray-900">Filters</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <select
            value={filters.department}
            onChange={(e) => setFilters({ ...filters, department: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Departments</option>
            {departments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>

          <select
            value={filters.credits}
            onChange={(e) => setFilters({ ...filters, credits: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Credits</option>
            {creditOptions.map(credits => (
              <option key={credits} value={credits}>{credits} Credits</option>
            ))}
          </select>

          <select
            value={filters.semester}
            onChange={(e) => setFilters({ ...filters, semester: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Semesters</option>
            {semesters.map(semester => (
              <option key={semester} value={semester}>{semester}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Course Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCourses.map((course) => (
          <div key={course.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{course.name}</h3>
                <p className="text-sm text-gray-600">{course.code}</p>
              </div>
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                {course.credits} Credits
              </span>
            </div>

            <div className="space-y-2 text-sm text-gray-600 mb-4">
              <div className="flex items-center space-x-2">
                <BookOpen className="h-4 w-4" />
                <span>{course.department}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4" />
                <span>{course.session_times}</span>
              </div>
              {course.location && (
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4" />
                  <span>{course.location}</span>
                </div>
              )}
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>Capacity: {course.capacity}</span>
              </div>
            </div>

            {course.description && (
              <p className="text-sm text-gray-700 mb-4 line-clamp-3">
                {course.description}
              </p>
            )}

            <div className="flex justify-between items-center pt-4 border-t border-gray-200">
              <span className="text-xs text-gray-500">{course.semester}</span>
              <button
                onClick={() => {
                  setSelectedCourse(course);
                  setShowEnrollModal(true);
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Enroll</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredCourses.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No courses found matching your criteria</p>
        </div>
      )}

      {/* Enrollment Confirmation Modal */}
      {showEnrollModal && selectedCourse && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Confirm Enrollment</h3>
            <div className="space-y-3 mb-6">
              <p><strong>Course:</strong> {selectedCourse.name}</p>
              <p><strong>Code:</strong> {selectedCourse.code}</p>
              <p><strong>Credits:</strong> {selectedCourse.credits}</p>
              <p><strong>Schedule:</strong> {selectedCourse.session_times}</p>
              <p><strong>Semester:</strong> {selectedCourse.semester}</p>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to enroll in this course? This action cannot be undone without contacting your advisor.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowEnrollModal(false);
                  setSelectedCourse(null);
                }}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleEnroll}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Confirm Enrollment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseDiscovery;