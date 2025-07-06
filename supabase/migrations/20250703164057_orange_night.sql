/*
  # Fix Users Table RLS Policies and Constraints

  1. Security Policy Updates
    - Remove problematic recursive policy for professors reading all users
    - Add safer policy that allows professors to read users enrolled in their courses
    - Keep existing policies for users reading/updating their own profiles

  2. Constraint Verification
    - Ensure role check constraint allows 'student' and 'professor' values
    - Verify academic_year constraint is properly configured
*/

-- Drop the problematic recursive policy
DROP POLICY IF EXISTS "Professors can read all users for course management" ON users;

-- Create a safer policy for professors to read users enrolled in their courses
CREATE POLICY "Professors can read enrolled students"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    -- Allow professors to read students enrolled in their courses
    (
      EXISTS (
        SELECT 1 FROM users prof
        WHERE prof.id = auth.uid() 
        AND prof.role = 'professor'
      )
      AND (
        role = 'student' 
        AND EXISTS (
          SELECT 1 FROM student_courses sc
          JOIN courses c ON c.id = sc.course_id
          WHERE sc.user_id = users.id
          AND c.professor_id = auth.uid()
        )
      )
    )
    -- Or allow users to read their own profile (keep existing functionality)
    OR (auth.uid() = id)
  );

-- Ensure the role constraint allows the correct values
-- First check if constraint exists and drop it
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'users_role_check' 
    AND table_name = 'users'
  ) THEN
    ALTER TABLE users DROP CONSTRAINT users_role_check;
  END IF;
END $$;

-- Add the correct role constraint
ALTER TABLE users ADD CONSTRAINT users_role_check 
  CHECK (role = ANY (ARRAY['student'::text, 'professor'::text]));

-- Ensure academic_year constraint is correct
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'users_academic_year_check' 
    AND table_name = 'users'
  ) THEN
    ALTER TABLE users DROP CONSTRAINT users_academic_year_check;
  END IF;
END $$;

-- Add the correct academic_year constraint
ALTER TABLE users ADD CONSTRAINT users_academic_year_check 
  CHECK (academic_year IS NULL OR academic_year = ANY (ARRAY['Freshman'::text, 'Sophomore'::text, 'Junior'::text, 'Senior'::text]));