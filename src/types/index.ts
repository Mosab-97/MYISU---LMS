export interface Course {
  id: string;
  name: string;
  code: string;
  semester: string;
  professor_id: string;
  credits: number;
  department: string;
  capacity: number;
  location?: string;
  session_times: string;
  description?: string;
  created_at: string;
}

export interface StudentCourse {
  id: string;
  user_id: string;
  course_id: string;
  enrolled_at: string;
  created_at: string;
  courses?: Course;
  users?: UserProfile;
}

export interface Attendance {
  id: string;
  user_id: string;
  course_id: string;
  clock_in_time: string;
  clock_out_time?: string;
  status: 'present' | 'late' | 'absent';
  date: string;
  latitude?: number;
  longitude?: number;
  created_at: string;
  reason?: string;
}

export interface Grade {
  id: string;
  user_id: string;
  course_id: string;
  final_grade: number;
  posted_at: string;
  created_at: string;
  courses?: Course;
}

export interface UserProfile {
  id: string;
  email: string;
  role: 'student' | 'faculty' | 'admin';
  full_name?: string;
  department?: string;
  academic_year?: string;
  student_id?: string;
  phone?: string;
  created_at: string;
}

export interface AttendanceWindow {
  id: string;
  course_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  grace_period_minutes: number;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'attendance' | 'grade' | 'enrollment' | 'reminder';
  read: boolean;
  created_at: string;
}

export interface GradeCategory {
  id: string;
  course_id: string;
  name: string;
  weight: number;
  created_at: string;
}

export interface Assignment {
  id: string;
  course_id: string;
  category_id?: string;
  title: string;
  description?: string;
  max_points: number;
  due_date?: string;
  created_at: string;
}

export interface AssignmentSubmission {
  id: string;
  assignment_id: string;
  student_id: string;
  grade?: number;
  feedback?: string;
  submitted_at?: string;
  graded_at?: string;
  created_at: string;
}

export interface Announcement {
  id: string;
  course_id?: string;
  author_id: string;
  title: string;
  content: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  published: boolean;
  created_at: string;
}

export interface DiscussionForum {
  id: string;
  course_id: string;
  title: string;
  description?: string;
  created_at: string;
}

export interface DiscussionThread {
  id: string;
  forum_id: string;
  author_id: string;
  title: string;
  content: string;
  pinned: boolean;
  locked: boolean;
  created_at: string;
}

export interface DiscussionReply {
  id: string;
  thread_id: string;
  author_id: string;
  content: string;
  parent_reply_id?: string;
  created_at: string;
}

export interface PrivateMessage {
  id: string;
  sender_id: string;
  recipient_id: string;
  subject: string;
  content: string;
  read: boolean;
  created_at: string;
}

export interface Document {
  id: string;
  course_id?: string;
  uploader_id: string;
  title: string;
  description?: string;
  file_name: string;
  file_size?: number;
  file_type?: string;
  file_url: string;
  access_level: 'public' | 'course' | 'faculty' | 'admin';
  created_at: string;
}

export interface Transcript {
  id: string;
  student_id: string;
  semester: string;
  gpa?: number;
  credits_earned: number;
  credits_attempted: number;
  generated_at: string;
}