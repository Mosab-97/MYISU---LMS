/*
  # Add missing tables for student management system

  1. New Tables
    - `grades`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `course_id` (uuid, foreign key to courses)
      - `final_grade` (numeric)
      - `posted_at` (timestamp)
      - `created_at` (timestamp)
    - `student_courses` 
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `course_id` (uuid, foreign key to courses)
      - `enrolled_at` (timestamp)
      - `created_at` (timestamp)
    - `attendance` (alias view for attendance_records)

  2. Security
    - Enable RLS on new tables
    - Add policies for students and professors
    - Create view for attendance compatibility

  3. Changes
    - Add foreign key constraints
    - Add check constraints for data validation
    - Create indexes for performance
*/

-- Create grades table
CREATE TABLE IF NOT EXISTS grades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  final_grade numeric(5,2) NOT NULL CHECK (final_grade >= 0 AND final_grade <= 100),
  posted_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Create student_courses table
CREATE TABLE IF NOT EXISTS student_courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  enrolled_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, course_id)
);

-- Create attendance view that maps to attendance_records
CREATE OR REPLACE VIEW attendance AS
SELECT 
  id,
  student_id as user_id,
  course_id,
  timestamp as clock_in_time,
  NULL::timestamptz as clock_out_time,
  CASE 
    WHEN timestamp::time BETWEEN '09:00:00' AND '09:15:00' THEN 'present'::text
    WHEN timestamp::time > '09:15:00' THEN 'late'::text
    ELSE 'present'::text
  END as status,
  timestamp::date as date,
  location_lat as latitude,
  location_lng as longitude,
  timestamp as created_at
FROM attendance_records;

-- Enable RLS
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_courses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for grades
CREATE POLICY "Students can read their own grades"
  ON grades
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'student' 
      AND users.id = grades.user_id
    )
  );

CREATE POLICY "Professors can read grades for their courses"
  ON grades
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      JOIN courses ON courses.professor_id = users.id
      WHERE users.id = auth.uid() 
      AND users.role = 'professor' 
      AND courses.id = grades.course_id
    )
  );

CREATE POLICY "Professors can manage grades for their courses"
  ON grades
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      JOIN courses ON courses.professor_id = users.id
      WHERE users.id = auth.uid() 
      AND users.role = 'professor' 
      AND courses.id = grades.course_id
    )
  );

-- RLS Policies for student_courses
CREATE POLICY "Students can read their own enrollments"
  ON student_courses
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'student' 
      AND users.id = student_courses.user_id
    )
  );

CREATE POLICY "Professors can read enrollments for their courses"
  ON student_courses
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      JOIN courses ON courses.professor_id = users.id
      WHERE users.id = auth.uid() 
      AND users.role = 'professor' 
      AND courses.id = student_courses.course_id
    )
  );

CREATE POLICY "Professors can manage enrollments for their courses"
  ON student_courses
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      JOIN courses ON courses.professor_id = users.id
      WHERE users.id = auth.uid() 
      AND users.role = 'professor' 
      AND courses.id = student_courses.course_id
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_grades_user_id ON grades(user_id);
CREATE INDEX IF NOT EXISTS idx_grades_course_id ON grades(course_id);
CREATE INDEX IF NOT EXISTS idx_student_courses_user_id ON student_courses(user_id);
CREATE INDEX IF NOT EXISTS idx_student_courses_course_id ON student_courses(course_id);