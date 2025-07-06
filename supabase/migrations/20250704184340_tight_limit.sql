/*
  # Fix Authentication and Role Management

  1. Role Updates
    - Drop existing role constraint
    - Update existing 'professor' roles to 'faculty'
    - Recreate constraint with correct values

  2. Security Policy Updates
    - Remove problematic recursive policies
    - Create safe policies for faculty access
    - Update all table policies to use 'faculty' role

  3. Data Integrity
    - Ensure proper role validation
    - Fix all RLS policies across tables
*/

-- Step 1: Drop the existing role constraint first
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- Step 2: Now safely update any existing 'professor' roles to 'faculty'
UPDATE users SET role = 'faculty' WHERE role = 'professor';

-- Step 3: Recreate the role constraint with the correct values
ALTER TABLE users ADD CONSTRAINT users_role_check 
  CHECK (role = ANY (ARRAY['student'::text, 'faculty'::text]));

-- Step 4: Drop problematic recursive policies
DROP POLICY IF EXISTS "Professors can read enrolled students" ON users;
DROP POLICY IF EXISTS "Professors can read all users for course management" ON users;
DROP POLICY IF EXISTS "Faculty can read enrolled students" ON users;

-- Step 5: Create safe policy for faculty to read enrolled students
CREATE POLICY "Faculty can read enrolled students"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    -- Users can always read their own profile
    (auth.uid() = id)
    OR
    -- Faculty can read students enrolled in their courses
    (
      EXISTS (
        SELECT 1 FROM users faculty_user
        WHERE faculty_user.id = auth.uid() 
        AND faculty_user.role = 'faculty'
      )
      AND role = 'student' 
      AND EXISTS (
        SELECT 1 FROM student_courses sc
        JOIN courses c ON c.id = sc.course_id
        WHERE sc.user_id = users.id
        AND c.professor_id = auth.uid()
      )
    )
  );

-- Step 6: Update courses table policies to use 'faculty' instead of 'professor'
DROP POLICY IF EXISTS "Professors can manage their own courses" ON courses;
DROP POLICY IF EXISTS "Faculty can manage their own courses" ON courses;

CREATE POLICY "Faculty can manage their own courses"
  ON courses
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() 
      AND users.role = 'faculty' 
      AND users.id = courses.professor_id
    )
  );

-- Step 7: Update student_courses policies
DROP POLICY IF EXISTS "Professors can read enrollments for their courses" ON student_courses;
DROP POLICY IF EXISTS "Professors can manage enrollments for their courses" ON student_courses;
DROP POLICY IF EXISTS "Faculty can read enrollments for their courses" ON student_courses;
DROP POLICY IF EXISTS "Faculty can manage enrollments for their courses" ON student_courses;

CREATE POLICY "Faculty can read enrollments for their courses"
  ON student_courses
  FOR SELECT
  TO authenticated
  USING (
    -- Students can read their own enrollments
    (
      EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.role = 'student' 
        AND users.id = student_courses.user_id
      )
    )
    OR
    -- Faculty can read enrollments for their courses
    (
      EXISTS (
        SELECT 1 FROM users 
        JOIN courses ON courses.professor_id = users.id
        WHERE users.id = auth.uid() 
        AND users.role = 'faculty' 
        AND courses.id = student_courses.course_id
      )
    )
  );

CREATE POLICY "Faculty can manage enrollments for their courses"
  ON student_courses
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      JOIN courses ON courses.professor_id = users.id
      WHERE users.id = auth.uid() 
      AND users.role = 'faculty' 
      AND courses.id = student_courses.course_id
    )
  );

-- Step 8: Update grades policies
DROP POLICY IF EXISTS "Professors can read grades for their courses" ON grades;
DROP POLICY IF EXISTS "Professors can manage grades for their courses" ON grades;
DROP POLICY IF EXISTS "Faculty can read grades for their courses" ON grades;
DROP POLICY IF EXISTS "Faculty can manage grades for their courses" ON grades;

CREATE POLICY "Faculty can read grades for their courses"
  ON grades
  FOR SELECT
  TO authenticated
  USING (
    -- Students can read their own grades
    (
      EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.role = 'student' 
        AND users.id = grades.user_id
      )
    )
    OR
    -- Faculty can read grades for their courses
    (
      EXISTS (
        SELECT 1 FROM users 
        JOIN courses ON courses.professor_id = users.id
        WHERE users.id = auth.uid() 
        AND users.role = 'faculty' 
        AND courses.id = grades.course_id
      )
    )
  );

CREATE POLICY "Faculty can manage grades for their courses"
  ON grades
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      JOIN courses ON courses.professor_id = users.id
      WHERE users.id = auth.uid() 
      AND users.role = 'faculty' 
      AND courses.id = grades.course_id
    )
  );

-- Step 9: Update attendance_records policies
DROP POLICY IF EXISTS "Professors can read attendance records for their courses" ON attendance_records;
DROP POLICY IF EXISTS "Faculty can read attendance records for their courses" ON attendance_records;

CREATE POLICY "Faculty can read attendance records for their courses"
  ON attendance_records
  FOR SELECT
  TO authenticated
  USING (
    -- Students can read their own attendance
    (
      EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.role = 'student' 
        AND users.id = attendance_records.student_id
      )
    )
    OR
    -- Faculty can read attendance for their courses
    (
      EXISTS (
        SELECT 1 FROM courses 
        JOIN users ON users.id = courses.professor_id
        WHERE courses.id = attendance_records.course_id 
        AND users.id = auth.uid() 
        AND users.role = 'faculty'
      )
    )
  );

-- Step 10: Update attendance_windows policies
DROP POLICY IF EXISTS "Professors can manage attendance windows for their courses" ON attendance_windows;
DROP POLICY IF EXISTS "Faculty can manage attendance windows for their courses" ON attendance_windows;

CREATE POLICY "Faculty can manage attendance windows for their courses"
  ON attendance_windows
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM courses 
      JOIN users ON users.id = courses.professor_id
      WHERE courses.id = attendance_windows.course_id 
      AND users.id = auth.uid() 
      AND users.role = 'faculty'
    )
  );

-- Step 11: Update contact_messages policies
DROP POLICY IF EXISTS "Professors can read all messages" ON contact_messages;
DROP POLICY IF EXISTS "Faculty can read all messages" ON contact_messages;

CREATE POLICY "Faculty can read all messages"
  ON contact_messages
  FOR SELECT
  TO authenticated
  USING (
    -- Users can read their own messages
    (user_id = auth.uid())
    OR
    -- Faculty can read all messages
    (
      EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.role = 'faculty'
      )
    )
  );

-- Step 12: Update course_enrollments table policies if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'course_enrollments') THEN
    DROP POLICY IF EXISTS "Professors can manage enrollments for their courses" ON course_enrollments;
    DROP POLICY IF EXISTS "Faculty can manage enrollments for their courses" ON course_enrollments;
    
    CREATE POLICY "Faculty can manage enrollments for their courses"
      ON course_enrollments
      FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM courses 
          JOIN users ON users.id = courses.professor_id
          WHERE courses.id = course_enrollments.course_id 
          AND users.id = auth.uid() 
          AND users.role = 'faculty'
        )
      );
  END IF;
END $$;

-- Step 13: Ensure all existing policies are properly cleaned up
-- Drop any remaining professor-related policies that might exist
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    -- Find and drop any remaining policies with 'professor' in the name or definition
    FOR policy_record IN 
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE policyname ILIKE '%professor%'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
                      policy_record.policyname, 
                      policy_record.schemaname, 
                      policy_record.tablename);
    END LOOP;
END $$;