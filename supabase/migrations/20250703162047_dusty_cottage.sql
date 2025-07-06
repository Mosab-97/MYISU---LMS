/*
  # Enhanced University Portal Features

  1. New Tables
    - Enhanced `courses` table with additional fields
    - `attendance_windows` for flexible attendance scheduling
    - `notifications` for smart alert system
    - Enhanced `users` table with student_id and phone

  2. Security
    - Enable RLS on all new tables
    - Add comprehensive policies

  3. Features
    - Course management with capacity, location, session times
    - Flexible attendance windows per course
    - Smart notification system
    - Enhanced user profiles
*/

-- Add new columns to existing tables
DO $$
BEGIN
  -- Add columns to courses table
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'credits') THEN
    ALTER TABLE courses ADD COLUMN credits integer DEFAULT 3;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'department') THEN
    ALTER TABLE courses ADD COLUMN department text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'capacity') THEN
    ALTER TABLE courses ADD COLUMN capacity integer DEFAULT 30;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'location') THEN
    ALTER TABLE courses ADD COLUMN location text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'session_times') THEN
    ALTER TABLE courses ADD COLUMN session_times text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'description') THEN
    ALTER TABLE courses ADD COLUMN description text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'code') THEN
    ALTER TABLE courses ADD COLUMN code text UNIQUE;
  END IF;

  -- Add columns to users table
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'student_id') THEN
    ALTER TABLE users ADD COLUMN student_id text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'phone') THEN
    ALTER TABLE users ADD COLUMN phone text;
  END IF;

  -- Add reason column to attendance_records
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'attendance_records' AND column_name = 'reason') THEN
    ALTER TABLE attendance_records ADD COLUMN reason text;
  END IF;
END $$;

-- Create attendance_windows table
CREATE TABLE IF NOT EXISTS attendance_windows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  day_of_week integer NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time time NOT NULL,
  end_time time NOT NULL,
  grace_period_minutes integer DEFAULT 15,
  created_at timestamptz DEFAULT now()
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL CHECK (type IN ('attendance', 'grade', 'enrollment', 'reminder')),
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create contact_messages table if not exists
CREATE TABLE IF NOT EXISTS contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name text NOT NULL,
  email text NOT NULL,
  message text NOT NULL,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE attendance_windows ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for attendance_windows
CREATE POLICY "Professors can manage attendance windows for their courses"
  ON attendance_windows
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM courses 
      JOIN users ON users.id = courses.professor_id
      WHERE courses.id = attendance_windows.course_id 
      AND users.id = auth.uid() 
      AND users.role = 'professor'
    )
  );

CREATE POLICY "Students can read attendance windows for enrolled courses"
  ON attendance_windows
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM student_courses 
      WHERE student_courses.course_id = attendance_windows.course_id 
      AND student_courses.user_id = auth.uid()
    )
  );

-- RLS Policies for notifications
CREATE POLICY "Users can read their own notifications"
  ON notifications
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
  ON notifications
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "System can insert notifications"
  ON notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for contact_messages
CREATE POLICY "Anyone can insert contact messages"
  ON contact_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can read their own messages"
  ON contact_messages
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Professors can read all messages"
  ON contact_messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'professor'
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_attendance_windows_course_id ON attendance_windows(course_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_contact_messages_user_id ON contact_messages(user_id);

-- Function to check attendance thresholds and create notifications
CREATE OR REPLACE FUNCTION check_attendance_threshold()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  student_record RECORD;
  attendance_rate NUMERIC;
BEGIN
  FOR student_record IN 
    SELECT DISTINCT ar.student_id, sc.course_id, c.name as course_name
    FROM attendance_records ar
    JOIN student_courses sc ON ar.student_id = sc.user_id AND ar.course_id = sc.course_id
    JOIN courses c ON sc.course_id = c.id
  LOOP
    -- Calculate attendance rate for this student in this course
    SELECT 
      ROUND(
        (COUNT(CASE WHEN ar.timestamp IS NOT NULL THEN 1 END)::NUMERIC / 
         GREATEST(COUNT(*), 1)) * 100, 2
      )
    INTO attendance_rate
    FROM attendance_records ar
    WHERE ar.student_id = student_record.student_id 
    AND ar.course_id = student_record.course_id;
    
    -- If attendance rate is below 75%, create notification
    IF attendance_rate < 75 THEN
      INSERT INTO notifications (user_id, title, message, type)
      VALUES (
        student_record.student_id,
        'Low Attendance Warning',
        'Your attendance in ' || student_record.course_name || ' is ' || attendance_rate || '%. Please improve your attendance to avoid academic consequences.',
        'attendance'
      )
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;
END;
$$;

-- Function to create grade notifications
CREATE OR REPLACE FUNCTION notify_grade_posted()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO notifications (user_id, title, message, type)
  VALUES (
    NEW.user_id,
    'New Grade Posted',
    'A new grade has been posted for one of your courses. Check your grade report for details.',
    'grade'
  );
  RETURN NEW;
END;
$$;

-- Create trigger for grade notifications
DROP TRIGGER IF EXISTS grade_notification_trigger ON grades;
CREATE TRIGGER grade_notification_trigger
  AFTER INSERT ON grades
  FOR EACH ROW
  EXECUTE FUNCTION notify_grade_posted();

-- Function to create enrollment notifications
CREATE OR REPLACE FUNCTION notify_enrollment()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  course_name TEXT;
BEGIN
  SELECT name INTO course_name FROM courses WHERE id = NEW.course_id;
  
  INSERT INTO notifications (user_id, title, message, type)
  VALUES (
    NEW.user_id,
    'Course Enrollment Confirmed',
    'You have successfully enrolled in ' || course_name || '. Welcome to the course!',
    'enrollment'
  );
  RETURN NEW;
END;
$$;

-- Create trigger for enrollment notifications
DROP TRIGGER IF EXISTS enrollment_notification_trigger ON student_courses;
CREATE TRIGGER enrollment_notification_trigger
  AFTER INSERT ON student_courses
  FOR EACH ROW
  EXECUTE FUNCTION notify_enrollment();