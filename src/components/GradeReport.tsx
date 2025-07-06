import React, { useState, useEffect } from 'react';
import { Download, Trophy, TrendingUp, Calendar } from 'lucide-react';
import { supabase, Grade } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const GradeReport: React.FC = () => {
  const { user, profile } = useAuth();
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    gpa: 0,
    totalCredits: 0,
    completedCourses: 0
  });

  useEffect(() => {
    if (user) {
      fetchGrades();
    }
  }, [user]);

  const fetchGrades = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('grades')
      .select(`
        *,
        courses (
          id,
          name,
          code,
          credits,
          semester,
          department
        )
      `)
      .eq('user_id', user.id)
      .order('posted_at', { ascending: false });

    if (data) {
      setGrades(data);
      calculateStats(data);
    }
    setLoading(false);
  };

  const calculateStats = (gradeData: Grade[]) => {
    if (gradeData.length === 0) {
      setStats({ gpa: 0, totalCredits: 0, completedCourses: 0 });
      return;
    }

    const totalCredits = gradeData.reduce((sum, grade) => 
      sum + (grade.courses?.credits || 0), 0
    );

    const weightedGradeSum = gradeData.reduce((sum, grade) => 
      sum + (grade.final_grade * (grade.courses?.credits || 0)), 0
    );

    const gpa = totalCredits > 0 ? weightedGradeSum / totalCredits : 0;

    setStats({
      gpa: Math.round(gpa * 100) / 100,
      totalCredits,
      completedCourses: gradeData.length
    });
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

  const generatePDF = () => {
    // Create a simple HTML content for PDF generation
    const content = `
      <html>
        <head>
          <title>Grade Report - ${profile?.full_name}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .stats { display: flex; justify-content: space-around; margin-bottom: 30px; }
            .stat-box { text-align: center; padding: 15px; border: 1px solid #ddd; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>MYISU University</h1>
            <h2>Official Grade Report</h2>
            <p>Student: ${profile?.full_name || user?.email}</p>
            <p>Generated: ${new Date().toLocaleDateString()}</p>
          </div>
          
          <div class="stats">
            <div class="stat-box">
              <h3>GPA</h3>
              <p>${stats.gpa}</p>
            </div>
            <div class="stat-box">
              <h3>Total Credits</h3>
              <p>${stats.totalCredits}</p>
            </div>
            <div class="stat-box">
              <h3>Completed Courses</h3>
              <p>${stats.completedCourses}</p>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Course Code</th>
                <th>Course Name</th>
                <th>Credits</th>
                <th>Grade</th>
                <th>Letter Grade</th>
                <th>Semester</th>
              </tr>
            </thead>
            <tbody>
              ${grades.map(grade => `
                <tr>
                  <td>${grade.courses?.code || 'N/A'}</td>
                  <td>${grade.courses?.name || 'N/A'}</td>
                  <td>${grade.courses?.credits || 'N/A'}</td>
                  <td>${grade.final_grade}%</td>
                  <td>${getLetterGrade(grade.final_grade)}</td>
                  <td>${grade.courses?.semester || 'N/A'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(content);
      printWindow.document.close();
      printWindow.print();
    }
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
        <h2 className="text-2xl font-bold text-gray-900">Grade Report</h2>
        <button
          onClick={generatePDF}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
        >
          <Download className="h-5 w-5" />
          <span>Download PDF</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Current GPA</p>
              <p className="text-3xl font-bold text-blue-600">{stats.gpa}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Credits</p>
              <p className="text-3xl font-bold text-green-600">{stats.totalCredits}</p>
            </div>
            <Trophy className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completed Courses</p>
              <p className="text-3xl font-bold text-purple-600">{stats.completedCourses}</p>
            </div>
            <Calendar className="h-8 w-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Grades Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Course Grades</h3>
        </div>

        {grades.length === 0 ? (
          <div className="text-center py-12">
            <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No grades available yet</p>
            <p className="text-gray-400">Your grades will appear here once posted by instructors</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Course
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Credits
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
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {grades.map((grade) => (
                  <tr key={grade.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {grade.courses?.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {grade.courses?.code} • {grade.courses?.semester}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {grade.courses?.credits}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getGradeColor(grade.final_grade)}`}>
                        {grade.final_grade}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {getLetterGrade(grade.final_grade)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(grade.posted_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default GradeReport;