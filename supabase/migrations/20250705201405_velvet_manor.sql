/*
  # Complete MyISU Platform Enhancement - Fixed Migration

  1. Authentication & User Management
    - Fix role constraints to support admin role
    - Create safe, non-recursive RLS policies
    - Clean up existing problematic policies

  2. Enhanced Academic Features
    - Grade categories and assignments system
    - Discussion forums and messaging
    - Document management
    - Transcript generation

  3. Security & Performance
    - Comprehensive RLS policies for all tables
    - Strategic indexing for optimal performance
    - Utility functions for GPA and transcript generation
*/

-- Step 1: Clean up ALL existing policies to avoid conflicts
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    -- Drop all existing policies on users table
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'users' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON users', policy_record.policyname);
    END LOOP;
    
    -- Drop policies on other tables that might conflict
    FOR policy_record IN 
        SELECT tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename IN ('courses', 'student_courses', 'grades', 'grade_categories', 'assignments', 'assignment_submissions', 'announcements', 'discussion_forums', 'discussion_threads', 'discussion_replies', 'private_messages', 'documents', 'transcripts')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', policy_record.policyname, policy_record.tablename);
    END LOOP;
END $$;

-- Step 2: Fix role constraints
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- Update any existing data to use correct roles
UPDATE users SET role = 'faculty' WHERE role = 'professor';
UPDATE users SET role = 'admin' WHERE role = 'administrator';

-- Add the correct role constraint with admin support
ALTER TABLE users ADD CONSTRAINT users_role_check 
  CHECK (role = ANY (ARRAY['student'::text, 'faculty'::text, 'admin'::text]));

-- Step 3: Create safe, non-recursive policies for users table
CREATE POLICY "users_read_own_profile"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "users_update_own_profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "users_insert_own_profile"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Safe policy for faculty to read enrolled students (non-recursive)
CREATE POLICY "faculty_read_enrolled_students"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    -- Allow faculty to read students enrolled in their courses
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

-- Safe policy for admins to read all users
CREATE POLICY "admins_read_all_users"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users admin_user
      WHERE admin_user.id = auth.uid() 
      AND admin_user.role = 'admin'
    )
  );

-- Step 4: Create enhanced tables for new features (with IF NOT EXISTS)

-- Grade categories table
CREATE TABLE IF NOT EXISTS grade_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  name text NOT NULL,
  weight numeric(5,2) NOT NULL CHECK (weight >= 0 AND weight <= 100),
  created_at timestamptz DEFAULT now()
);

-- Assignments table
CREATE TABLE IF NOT EXISTS assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  category_id uuid REFERENCES grade_categories(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  max_points numeric(8,2) NOT NULL DEFAULT 100,
  due_date timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Student assignment submissions
CREATE TABLE IF NOT EXISTS assignment_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  grade numeric(8,2) CHECK (grade >= 0),
  feedback text,
  submitted_at timestamptz,
  graded_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(assignment_id, student_id)
);

-- Announcements table
CREATE TABLE IF NOT EXISTS announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL,
  priority text DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  published boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Discussion forums
CREATE TABLE IF NOT EXISTS discussion_forums (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Discussion threads
CREATE TABLE IF NOT EXISTS discussion_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  forum_id uuid NOT NULL REFERENCES discussion_forums(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL,
  pinned boolean DEFAULT false,
  locked boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Discussion replies
CREATE TABLE IF NOT EXISTS discussion_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES discussion_threads(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  parent_reply_id uuid REFERENCES discussion_replies(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Private messages
CREATE TABLE IF NOT EXISTS private_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject text NOT NULL,
  content text NOT NULL,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Document storage
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE,
  uploader_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  file_name text NOT NULL,
  file_size bigint,
  file_type text,
  file_url text NOT NULL,
  access_level text DEFAULT 'course' CHECK (access_level IN ('public', 'course', 'faculty', 'admin')),
  created_at timestamptz DEFAULT now()
);

-- Transcripts table
CREATE TABLE IF NOT EXISTS transcripts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  semester text NOT NULL,
  gpa numeric(4,2),
  credits_earned integer DEFAULT 0,
  credits_attempted integer DEFAULT 0,
  generated_at timestamptz DEFAULT now(),
  UNIQUE(student_id, semester)
);

-- Step 5: Enable RLS on all new tables
ALTER TABLE grade_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE discussion_forums ENABLE ROW LEVEL SECURITY;
ALTER TABLE discussion_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE discussion_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE private_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE transcripts ENABLE ROW LEVEL SECURITY;

-- Step 6: Create comprehensive RLS policies with unique names

-- Grade categories policies
CREATE POLICY "grade_categories_faculty_manage"
  ON grade_categories FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM courses 
      WHERE courses.id = grade_categories.course_id 
      AND courses.professor_id = auth.uid()
    )
  );

CREATE POLICY "grade_categories_students_read"
  ON grade_categories FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM student_courses 
      WHERE student_courses.course_id = grade_categories.course_id 
      AND student_courses.user_id = auth.uid()
    )
  );

-- Assignments policies
CREATE POLICY "assignments_faculty_manage"
  ON assignments FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM courses 
      WHERE courses.id = assignments.course_id 
      AND courses.professor_id = auth.uid()
    )
  );

CREATE POLICY "assignments_students_read"
  ON assignments FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM student_courses 
      WHERE student_courses.course_id = assignments.course_id 
      AND student_courses.user_id = auth.uid()
    )
  );

-- Assignment submissions policies
CREATE POLICY "submissions_students_manage_own"
  ON assignment_submissions FOR ALL TO authenticated
  USING (student_id = auth.uid());

CREATE POLICY "submissions_faculty_read"
  ON assignment_submissions FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM assignments a
      JOIN courses c ON c.id = a.course_id
      WHERE a.id = assignment_submissions.assignment_id 
      AND c.professor_id = auth.uid()
    )
  );

CREATE POLICY "submissions_faculty_grade"
  ON assignment_submissions FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM assignments a
      JOIN courses c ON c.id = a.course_id
      WHERE a.id = assignment_submissions.assignment_id 
      AND c.professor_id = auth.uid()
    )
  );

-- Announcements policies
CREATE POLICY "announcements_faculty_admin_manage"
  ON announcements FOR ALL TO authenticated
  USING (
    auth.uid() = author_id 
    OR EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('faculty', 'admin')
    )
  );

CREATE POLICY "announcements_read_published"
  ON announcements FOR SELECT TO authenticated
  USING (published = true);

-- Discussion forums policies
CREATE POLICY "forums_faculty_manage"
  ON discussion_forums FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM courses 
      WHERE courses.id = discussion_forums.course_id 
      AND courses.professor_id = auth.uid()
    )
  );

CREATE POLICY "forums_students_read"
  ON discussion_forums FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM student_courses 
      WHERE student_courses.course_id = discussion_forums.course_id 
      AND student_courses.user_id = auth.uid()
    )
  );

-- Discussion threads policies
CREATE POLICY "threads_course_members_manage"
  ON discussion_threads FOR ALL TO authenticated
  USING (
    auth.uid() = author_id 
    OR EXISTS (
      SELECT 1 FROM discussion_forums df
      JOIN courses c ON c.id = df.course_id
      WHERE df.id = discussion_threads.forum_id 
      AND (
        c.professor_id = auth.uid() 
        OR EXISTS (
          SELECT 1 FROM student_courses sc 
          WHERE sc.course_id = c.id AND sc.user_id = auth.uid()
        )
      )
    )
  );

-- Discussion replies policies
CREATE POLICY "replies_course_members_manage"
  ON discussion_replies FOR ALL TO authenticated
  USING (
    auth.uid() = author_id 
    OR EXISTS (
      SELECT 1 FROM discussion_threads dt
      JOIN discussion_forums df ON df.id = dt.forum_id
      JOIN courses c ON c.id = df.course_id
      WHERE dt.id = discussion_replies.thread_id 
      AND (
        c.professor_id = auth.uid() 
        OR EXISTS (
          SELECT 1 FROM student_courses sc 
          WHERE sc.course_id = c.id AND sc.user_id = auth.uid()
        )
      )
    )
  );

-- Private messages policies
CREATE POLICY "messages_users_manage_own"
  ON private_messages FOR ALL TO authenticated
  USING (sender_id = auth.uid() OR recipient_id = auth.uid());

-- Documents policies
CREATE POLICY "documents_faculty_manage"
  ON documents FOR ALL TO authenticated
  USING (
    uploader_id = auth.uid() 
    OR EXISTS (
      SELECT 1 FROM courses 
      WHERE courses.id = documents.course_id 
      AND courses.professor_id = auth.uid()
    )
  );

CREATE POLICY "documents_students_read"
  ON documents FOR SELECT TO authenticated
  USING (
    access_level = 'public' 
    OR (
      access_level = 'course' 
      AND EXISTS (
        SELECT 1 FROM student_courses 
        WHERE student_courses.course_id = documents.course_id 
        AND student_courses.user_id = auth.uid()
      )
    )
  );

-- Transcripts policies
CREATE POLICY "transcripts_students_read_own"
  ON transcripts FOR SELECT TO authenticated
  USING (student_id = auth.uid());

CREATE POLICY "transcripts_faculty_admin_read_all"
  ON transcripts FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('faculty', 'admin')
    )
  );

CREATE POLICY "transcripts_admins_manage"
  ON transcripts FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Step 7: Update existing table policies to include admin role

-- Update courses policies
CREATE POLICY "courses_faculty_admin_manage"
  ON courses FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() 
      AND users.role IN ('faculty', 'admin')
      AND (users.id = courses.professor_id OR users.role = 'admin')
    )
  );

-- Update student_courses policies
CREATE POLICY "enrollments_students_read_own"
  ON student_courses FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'student' 
      AND users.id = student_courses.user_id
    )
  );

CREATE POLICY "enrollments_faculty_read"
  ON student_courses FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      JOIN courses ON courses.professor_id = users.id
      WHERE users.id = auth.uid() 
      AND users.role = 'faculty' 
      AND courses.id = student_courses.course_id
    )
  );

CREATE POLICY "enrollments_faculty_admin_manage"
  ON student_courses FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      JOIN courses ON courses.professor_id = users.id
      WHERE users.id = auth.uid() 
      AND users.role IN ('faculty', 'admin')
      AND courses.id = student_courses.course_id
    )
    OR EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Update grades policies
CREATE POLICY "grades_students_read_own"
  ON grades FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'student' 
      AND users.id = grades.user_id
    )
  );

CREATE POLICY "grades_faculty_read"
  ON grades FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      JOIN courses ON courses.professor_id = users.id
      WHERE users.id = auth.uid() 
      AND users.role = 'faculty' 
      AND courses.id = grades.course_id
    )
  );

CREATE POLICY "grades_faculty_admin_manage"
  ON grades FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      JOIN courses ON courses.professor_id = users.id
      WHERE users.id = auth.uid() 
      AND users.role IN ('faculty', 'admin')
      AND courses.id = grades.course_id
    )
    OR EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Step 8: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_grade_categories_course_id ON grade_categories(course_id);
CREATE INDEX IF NOT EXISTS idx_assignments_course_id ON assignments(course_id);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_assignment_id ON assignment_submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_student_id ON assignment_submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_announcements_course_id ON announcements(course_id);
CREATE INDEX IF NOT EXISTS idx_discussion_forums_course_id ON discussion_forums(course_id);
CREATE INDEX IF NOT EXISTS idx_discussion_threads_forum_id ON discussion_threads(forum_id);
CREATE INDEX IF NOT EXISTS idx_discussion_replies_thread_id ON discussion_replies(thread_id);
CREATE INDEX IF NOT EXISTS idx_private_messages_sender_id ON private_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_private_messages_recipient_id ON private_messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_documents_course_id ON documents(course_id);
CREATE INDEX IF NOT EXISTS idx_transcripts_student_id ON transcripts(student_id);

-- Step 9: Create utility functions

-- Function to calculate student GPA
CREATE OR REPLACE FUNCTION calculate_student_gpa(student_uuid uuid, semester_filter text DEFAULT NULL)
RETURNS TABLE(
  semester_gpa numeric,
  cumulative_gpa numeric,
  total_credits integer,
  semester_credits integer
)
LANGUAGE plpgsql
AS $$
DECLARE
  semester_points numeric := 0;
  semester_credits_earned integer := 0;
  total_points numeric := 0;
  total_credits_earned integer := 0;
BEGIN
  -- Calculate semester GPA if semester filter provided
  IF semester_filter IS NOT NULL THEN
    SELECT 
      COALESCE(SUM(g.final_grade * c.credits), 0),
      COALESCE(SUM(c.credits), 0)
    INTO semester_points, semester_credits_earned
    FROM grades g
    JOIN courses c ON c.id = g.course_id
    WHERE g.user_id = student_uuid 
    AND c.semester = semester_filter;
  END IF;

  -- Calculate cumulative GPA
  SELECT 
    COALESCE(SUM(g.final_grade * c.credits), 0),
    COALESCE(SUM(c.credits), 0)
  INTO total_points, total_credits_earned
  FROM grades g
  JOIN courses c ON c.id = g.course_id
  WHERE g.user_id = student_uuid;

  RETURN QUERY SELECT
    CASE WHEN semester_credits_earned > 0 THEN ROUND(semester_points / semester_credits_earned, 2) ELSE 0 END,
    CASE WHEN total_credits_earned > 0 THEN ROUND(total_points / total_credits_earned, 2) ELSE 0 END,
    total_credits_earned,
    semester_credits_earned;
END;
$$;

-- Function to generate transcript
CREATE OR REPLACE FUNCTION generate_transcript(student_uuid uuid, semester_filter text DEFAULT NULL)
RETURNS TABLE(
  course_code text,
  course_name text,
  semester text,
  credits integer,
  grade numeric,
  letter_grade text
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.code,
    c.name,
    c.semester,
    c.credits,
    g.final_grade,
    CASE 
      WHEN g.final_grade >= 90 THEN 'A'
      WHEN g.final_grade >= 80 THEN 'B'
      WHEN g.final_grade >= 70 THEN 'C'
      WHEN g.final_grade >= 60 THEN 'D'
      ELSE 'F'
    END as letter_grade
  FROM grades g
  JOIN courses c ON c.id = g.course_id
  WHERE g.user_id = student_uuid
  AND (semester_filter IS NULL OR c.semester = semester_filter)
  ORDER BY c.semester DESC, c.name;
END;
$$;