import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Plus, Edit, Trash2, Save, X } from 'lucide-react';
import { supabase, AttendanceWindow } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface AttendanceWindowWithCourse extends AttendanceWindow {
  courses?: {
    name: string;
    code: string;
  };
}

const AttendanceScheduling: React.FC = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<any[]>([]);
  const [attendanceWindows, setAttendanceWindows] = useState<AttendanceWindowWithCourse[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingWindow, setEditingWindow] = useState<AttendanceWindow | null>(null);
  const [formData, setFormData] = useState({
    course_id: '',
    day_of_week: 1,
    start_time: '09:00',
    end_time: '09:15',
    grace_period_minutes: 15
  });

  const daysOfWeek = [
    { value: 0, label: 'Sunday' },
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' }
  ];

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;

    // Fetch courses
    const { data: coursesData } = await supabase
      .from('courses')
      .select('*')
      .eq('professor_id', user.id);

    if (coursesData) setCourses(coursesData);

    // Fetch attendance windows
    const { data: windowsData } = await supabase
      .from('attendance_windows')
      .select(`
        *,
        courses!inner(name, code, professor_id)
      `)
      .eq('courses.professor_id', user.id)
      .order('day_of_week')
      .order('start_time');

    if (windowsData) setAttendanceWindows(windowsData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (editingWindow) {
      const { error } = await supabase
        .from('attendance_windows')
        .update(formData)
        .eq('id', editingWindow.id);

      if (!error) {
        fetchData();
        resetForm();
      }
    } else {
      const { error } = await supabase
        .from('attendance_windows')
        .insert([formData]);

      if (!error) {
        fetchData();
        resetForm();
      }
    }
  };

  const handleEdit = (window: AttendanceWindow) => {
    setEditingWindow(window);
    setFormData({
      course_id: window.course_id,
      day_of_week: window.day_of_week,
      start_time: window.start_time,
      end_time: window.end_time,
      grace_period_minutes: window.grace_period_minutes
    });
    setShowModal(true);
  };

  const handleDelete = async (windowId: string) => {
    if (confirm('Are you sure you want to delete this attendance window?')) {
      const { error } = await supabase
        .from('attendance_windows')
        .delete()
        .eq('id', windowId);

      if (!error) {
        fetchData();
      }
    }
  };

  const resetForm = () => {
    setFormData({
      course_id: '',
      day_of_week: 1,
      start_time: '09:00',
      end_time: '09:15',
      grace_period_minutes: 15
    });
    setEditingWindow(null);
    setShowModal(false);
  };

  const formatTime = (time: string) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Attendance Scheduling</h2>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
        >
          <Plus className="h-5 w-5" />
          <span>Add Window</span>
        </button>
      </div>

      {/* Attendance Windows by Course */}
      <div className="space-y-6">
        {courses.map((course) => {
          const courseWindows = attendanceWindows.filter(w => w.course_id === course.id);
          
          return (
            <div key={course.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center space-x-3 mb-4">
                <Calendar className="h-6 w-6 text-blue-600" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{course.name}</h3>
                  <p className="text-sm text-gray-600">{course.code}</p>
                </div>
              </div>

              {courseWindows.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <Clock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">No attendance windows configured</p>
                  <button
                    onClick={() => {
                      setFormData({ ...formData, course_id: course.id });
                      setShowModal(true);
                    }}
                    className="mt-2 text-blue-600 hover:text-blue-800"
                  >
                    Add attendance window
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {courseWindows.map((window) => (
                    <div key={window.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {daysOfWeek.find(d => d.value === window.day_of_week)?.label}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {formatTime(window.start_time)} - {formatTime(window.end_time)}
                          </p>
                        </div>
                        <div className="flex space-x-1">
                          <button
                            onClick={() => handleEdit(window)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(window.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="text-xs text-gray-500">
                        Grace period: {window.grace_period_minutes} minutes
                      </div>
                      
                      <div className="mt-2 text-xs">
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                          On time: {formatTime(window.start_time)} - {formatTime(window.end_time)}
                        </span>
                      </div>
                      <div className="mt-1 text-xs">
                        <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                          Late: After {formatTime(window.end_time)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {courses.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No courses found</p>
          <p className="text-gray-400">Create courses first to set up attendance windows</p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">
              {editingWindow ? 'Edit Attendance Window' : 'Add Attendance Window'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Course
                </label>
                <select
                  required
                  value={formData.course_id}
                  onChange={(e) => setFormData({ ...formData, course_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Course</option>
                  {courses.map(course => (
                    <option key={course.id} value={course.id}>
                      {course.name} ({course.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Day of Week
                </label>
                <select
                  value={formData.day_of_week}
                  onChange={(e) => setFormData({ ...formData, day_of_week: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  {daysOfWeek.map(day => (
                    <option key={day.value} value={day.value}>{day.label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Grace Period (minutes)
                </label>
                <input
                  type="number"
                  min="0"
                  max="60"
                  required
                  value={formData.grace_period_minutes}
                  onChange={(e) => setFormData({ ...formData, grace_period_minutes: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 flex items-center space-x-2"
                >
                  <X className="h-4 w-4" />
                  <span>Cancel</span>
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center space-x-2"
                >
                  <Save className="h-4 w-4" />
                  <span>{editingWindow ? 'Update' : 'Create'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceScheduling;