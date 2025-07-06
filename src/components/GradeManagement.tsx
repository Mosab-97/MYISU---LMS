import React, { useState, useEffect } from 'react';
import { Trophy, Plus, Edit, Trash2, Save, X, Upload } from 'lucide-react';
import { supabase, Course, StudentCourse, Grade } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface StudentWithGrade {
  id: string;
  full_name: string;
  email: string;
  student_id: string;
  course_id: string;
  grade?: Grade;
}

const GradeManagement: React.FC = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [students, setStudents] = useState<StudentWithGrade[]>([]);
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [editingGrade, setEditingGrade] = useState<{ studentId: string, currentGrade?: number } | null>(null);
  const [gradeValue, setGradeValue] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchCourses();
    }
  }, [user]);

  useEffect(() => {
    if (selectedCourse) {
      fetchStudentsForCourse();
    }
  }, [selectedCourse]);

  const fetchCourses = async () => {
    if (!user) return;

    const { data: coursesData } = await supabase
      .from('courses')
      .select('*')
      .eq('professor_id', user.id)
      .order('name');

    if (coursesData) {
      setCourses(coursesData);
      if (coursesData.length > 0 && !selectedCourse) {
        setSelectedCourse(coursesData[0].id);
      }
    }
    setLoading(false);
  };

  const fetchStudentsForCourse = async () => {
    if (!selectedCourse) return;

    const { data: enrollmentsData } = await supabase
      .from('student_courses')
      .select(`
        *,
        users!inner(id, full_name, email, student_id)
      `)
      .eq('course_id', selectedCourse);

    if (enrollmentsData) {
      // Fetch existing grades for these students
      const studentIds = enrollmentsData.map(e => e.user_id);
      const { data: gradesData } = await supabase
        .from('grades')
        .select('*')
        .eq('course_id', selectedCourse)
        .in('user_id', studentIds);

      const studentsWithGrades = enrollmentsData.map(enrollment => ({
        id: enrollment.users.id,
        full_name: enrollment.users.full_name || 'Unknown',
        email: enrollment.users.email,
        student_id: enrollment.users.student_id || 'N/A',
        course_id: selectedCourse,
        grade: gradesData?.find(g => g.user_id === enrollment.users.id)
      }));

      setStudents(studentsWithGrades);
    }
  };

  const handleAddGrade = (studentId: string, currentGrade?: number) => {
    setEditingGrade({ studentId, currentGrade });
    setGradeValue(currentGrade?.toString() || '');
    setShowGradeModal(true);
  };

  const handleSaveGrade = async () => {
    if (!editingGrade || !gradeValue || !selectedCourse) return;

    const grade = parseFloat(gradeValue);
    if (grade < 0 || grade > 100) {
      alert('Grade must be between 0 and 100');
      return;
    }

    if (editingGrade.currentGrade !== undefined) {
      // Update existing grade
      const { error } = await supabase
        .from('grades')
        .update({ final_grade: grade })
        .eq('user_id', editingGrade.studentId)
        .eq('course_id', selectedCourse);

      if (!error) {
        fetchStudentsForCourse();
        resetGradeModal();
      }
    } else {
      // Insert new grade
      const { error } = await supabase
        .from('grades')
        .insert([{
          user_id: editingGrade.studentId,
          course_id: selectedCourse,
          final_grade: grade
        }]);

      if (!error) {
        fetchStudentsForCourse();
        resetGradeModal();
      }
    }
  };

  const handleDeleteGrade = async (studentId: string) => {
    if (!confirm('Are you sure you want to delete this grade?')) return;

    const { error } = await supabase
      .from('grades')
      .delete()
      .eq('user_id', studentId)
      .eq('course_id', selectedCourse);

    if (!error) {
      fetchStudentsForCourse();
    }
  };

  const resetGradeModal = () => {
    setShowGradeModal(false);
    setEditingGrade(null);
    setGradeValue('');
  };

  const getGradeColor = (grade: number) => {
    if (grade >= 90) return 'text-green-600 bg-green-50';
    if (grade >= 80) return 'text-blue-600 bg-blue-50';
    if (grade >= 70) return 'text-yellow-600 bg-yellow-50';
    if (grade >= 60) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  };

  const getLetterGrade = (grade: number) => {
    if (grade >= 90) return 'A';
    if (grade >= 80) return 'B';
    if (grade >= 70) return 'C';
    if (grade >= 60) return 'D';
    return 'F';
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
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Grade Management</h2>
        <div className="flex items-center space-x-4">
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select Course</option>
            {courses.map(course => (
              <option key={course.id} value={course.id}>
                {course.name} ({course.code})
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedCourse && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              {courses.find(c => c.id === selectedCourse)?.name} - Student Grades
            </h3>
          </div>

          {students.length === 0 ? (
            <div className="text-center py-12">
              <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No students enrolled in this course</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Grade
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Letter Grade
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Posted Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {students.map((student) => (
                    <tr key={student.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {student.full_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {student.student_id} • {student.email}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {student.grade ? (
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getGradeColor(student.grade.final_grade)}`}>
                            {student.grade.final_grade}%
                          </span>
                        ) : (
                          <span className="text-gray-400 text-sm">No grade</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {student.grade ? getLetterGrade(student.grade.final_grade) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {student.grade ? new Date(student.grade.posted_at).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleAddGrade(student.id, student.grade?.final_grade)}
                            className="text-blue-600 hover:text-blue-900"
                            title={student.grade ? "Edit Grade" : "Add Grade"}
                          >
                            {student.grade ? <Edit className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                          </button>
                          {student.grade && (
                            <button
                              onClick={() => handleDeleteGrade(student.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Delete Grade"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Grade Modal */}
      {showGradeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">
              {editingGrade?.currentGrade !== undefined ? 'Edit Grade' : 'Add Grade'}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Grade (0-100)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={gradeValue}
                  onChange={(e) => setGradeValue(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter grade"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={resetGradeModal}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 flex items-center space-x-2"
                >
                  <X className="h-4 w-4" />
                  <span>Cancel</span>
                </button>
                <button
                  onClick={handleSaveGrade}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center space-x-2"
                >
                  <Save className="h-4 w-4" />
                  <span>Save Grade</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GradeManagement;